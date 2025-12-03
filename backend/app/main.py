from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form, Body
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
import os
import shutil
import logging
import json
import zipfile
import tarfile

from .database import engine, Base, get_db
from . import models, schemas
from .services.docker_manager import docker_manager
from .auth import router as auth_router, get_current_user

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 创建数据库表
Base.metadata.create_all(bind=engine)

app = FastAPI(title="EMCP Platform", version="1.0.0")

# 注册认证路由
app.include_router(auth_router)

# 配置 CORS (允许 3100 端口)
# 允许的环境变量配置: ALLOWED_ORIGINS (逗号分隔)
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "http://localhost:3100,http://localhost:5173")
allowed_origins = [origin.strip() for origin in allowed_origins_env.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # 开发环境为了方便暂时全开，生产环境建议使用 allowed_origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_data_root():
    """
    确定数据存储根目录
    策略:
    1. 尝试使用 /opt/mcp-platform/data (生产环境推荐)
    2. 如果无权限，降级使用 ./mcp_data (开发环境/Mac/Windows)
    """
    prod_path = "/opt/mcp-platform/data"
    dev_path = os.path.abspath("mcp_data")
    
    # 尝试在 prod_path 创建测试文件
    try:
        if not os.path.exists(prod_path):
            os.makedirs(prod_path, exist_ok=True)
        # 测试写权限
        test_file = os.path.join(prod_path, ".write_test")
        with open(test_file, "w") as f:
            f.write("ok")
        os.remove(test_file)
        return prod_path
    except (PermissionError, OSError):
        logger.info(f"Cannot write to {prod_path}, falling back to {dev_path}")
        os.makedirs(dev_path, exist_ok=True)
        return dev_path

# 初始化数据根目录
DATA_ROOT = get_data_root()
logger.info(f"Using Data Root: {DATA_ROOT}")

@app.get("/api/servers", response_model=List[schemas.MCPServer])
def list_servers(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return db.query(models.MCPServer).all()

@app.get("/api/servers/{server_id}", response_model=schemas.MCPServer)
def get_server(server_id: str, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    server = db.query(models.MCPServer).filter(models.MCPServer.id == server_id).first()
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")
    return server

@app.post("/api/servers", response_model=schemas.MCPServer)
async def create_server(
    name: str = Form(...),
    description: str = Form(None),
    entry_object: str = Form("mcp"),
    port: int = Form(None), # 允许用户指定端口
    command: str = Form(None), # 自定义命令
    args: str = Form(None), # 自定义参数
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # 1. 检查名称唯一性
    if db.query(models.MCPServer).filter(models.MCPServer.name == name).first():
        raise HTTPException(status_code=400, detail="Server name already exists")

    # 2. 生成 ID 和 路径
    server_id = str(uuid.uuid4())
    
    # 使用 DATA_ROOT 作为基准
    base_path = os.path.join(DATA_ROOT, server_id)
    app_path = os.path.join(base_path, "app")
    os.makedirs(app_path, exist_ok=True)
    
    # 3. 保存并处理文件 (支持 .py, .zip, .tar, .tar.gz)
    filename = file.filename
    file_ext = os.path.splitext(filename)[1].lower()
    file_location = os.path.join(app_path, filename)
    
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)

    # 解压逻辑
    if file_ext == ".zip":
        try:
            with zipfile.ZipFile(file_location, 'r') as zip_ref:
                zip_ref.extractall(app_path)
            os.remove(file_location) # 删除压缩包
        except zipfile.BadZipFile:
             raise HTTPException(status_code=400, detail="Invalid zip file")
    elif file_ext in [".tar", ".gz", ".tgz"]:
        try:
            # tarfile open supports compression automatic detection
            if filename.endswith("tar.gz") or filename.endswith(".tgz") or filename.endswith(".tar"):
                 with tarfile.open(file_location, "r:*") as tar_ref:
                    tar_ref.extractall(app_path)
                 os.remove(file_location)
        except tarfile.ReadError:
             raise HTTPException(status_code=400, detail="Invalid tar file")

    # 4. 写入数据库
    db_server = models.MCPServer(
        id=server_id,
        name=name,
        description=description,
        source_code_path=base_path,
        entry_object=entry_object,
        port=port,
        command=command,
        args=args,
        status=models.ServerStatus.STOPPED
    )
    db.add(db_server)
    db.commit()
    db.refresh(db_server)
    return db_server

@app.put("/api/servers/{server_id}", response_model=schemas.MCPServer)
def update_server(
    server_id: str,
    server_update: schemas.MCPServerUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    server = db.query(models.MCPServer).filter(models.MCPServer.id == server_id).first()
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")
        
    if server.status == models.ServerStatus.RUNNING:
        raise HTTPException(status_code=400, detail="Cannot update a running server. Stop it first.")

    if server_update.description is not None:
        server.description = server_update.description
    if server_update.entry_object is not None:
        server.entry_object = server_update.entry_object
    if server_update.port is not None:
        server.port = server_update.port
    if server_update.command is not None:
        server.command = server_update.command
    if server_update.args is not None:
        server.args = server_update.args
        
    # TODO: 支持更新环境变量 (EnvVars)
    
    db.commit()
    db.refresh(server)
    return server

@app.delete("/api/servers/{server_id}")
def delete_server(
    server_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    server = db.query(models.MCPServer).filter(models.MCPServer.id == server_id).first()
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")

    # 1. 停止容器
    if server.container_id:
        try:
            docker_manager.stop_container(server.container_id)
        except Exception as e:
            logger.warning(f"Failed to stop container during delete: {e}")

    # 2. 删除文件 (可选: 如果需要保留数据则注释掉)
    # shutil.rmtree(server.source_code_path, ignore_errors=True)

    # 3. 删除数据库记录
    db.delete(server)
    db.commit()
    return {"message": "Server deleted"}

@app.post("/api/servers/{server_id}/action")
def server_action(
    server_id: str, 
    action: schemas.ServerAction, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    server = db.query(models.MCPServer).filter(models.MCPServer.id == server_id).first()
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")

    if action.action == "start":
        if server.status == models.ServerStatus.RUNNING:
            return {"message": "Already running"}
        
        env_map = {env.key: env.value for env in server.env_vars}
        
        # 解析 args
        cmd_list = None
        if server.command:
            cmd_list = [server.command]
            if server.args:
                # 简单的空格分割，更复杂的需要 json 解析
                try:
                    import json
                    args = json.loads(server.args)
                    if isinstance(args, list):
                        cmd_list.extend(args)
                    else:
                        cmd_list.extend(server.args.split())
                except:
                    cmd_list.extend(server.args.split())

        try:
            # 传递 source_code_path 和 requested_port 给 run_container
            result = docker_manager.run_container(
                server.id, 
                server.name, 
                server.source_code_path, 
                env_map,
                requested_port=server.port,
                command=cmd_list
            )
            
            server.container_id = result["container_id"]
            server.host_port = result["port"]
            server.status = models.ServerStatus.RUNNING
            db.commit()
            return {"message": "Server started", "details": result}
        except RuntimeError as e:
            # Docker 相关的运行时错误（如 Docker 未启动、端口占用等）
            server.status = models.ServerStatus.ERROR
            db.commit()
            error_msg = str(e)
            if "Docker client not initialized" in error_msg or "Docker not running" in error_msg:
                raise HTTPException(
                    status_code=503, 
                    detail="Docker service is not running. Please start Docker and try again."
                )
            elif "port" in error_msg.lower() and "not available" in error_msg.lower():
                raise HTTPException(
                    status_code=409, 
                    detail=f"Port conflict: {error_msg}"
                )
            else:
                raise HTTPException(status_code=500, detail=f"Failed to start server: {error_msg}")
        except Exception as e:
            # 其他未预期的错误
            server.status = models.ServerStatus.ERROR
            db.commit()
            logger.error(f"Unexpected error starting server {server_id}: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

    elif action.action == "stop":
        if server.container_id:
            try:
                docker_manager.stop_container(server.container_id)
            except Exception:
                pass
        
        server.status = models.ServerStatus.STOPPED
        server.container_id = None
        server.host_port = None
        db.commit()
        return {"message": "Server stopped"}
        
    elif action.action == "restart":
        # 简化版重启：先停后起
        # 1. Stop
        if server.container_id:
            try:
                docker_manager.stop_container(server.container_id)
            except Exception:
                pass
        server.status = models.ServerStatus.STOPPED
        server.container_id = None
        server.host_port = None
        db.commit()
        
        # 2. Start
        env_map = {env.key: env.value for env in server.env_vars}
        
        # 解析 args (同上)
        cmd_list = None
        if server.command:
            cmd_list = [server.command]
            if server.args:
                try:
                    import json
                    args = json.loads(server.args)
                    if isinstance(args, list):
                        cmd_list.extend(args)
                    else:
                        cmd_list.extend(server.args.split())
                except:
                    cmd_list.extend(server.args.split())

        try:
            result = docker_manager.run_container(
                server.id, 
                server.name, 
                server.source_code_path, 
                env_map,
                requested_port=server.port,
                command=cmd_list
            )
            server.container_id = result["container_id"]
            server.host_port = result["port"]
            server.status = models.ServerStatus.RUNNING
            db.commit()
            return {"message": "Server restarted", "details": result}
        except RuntimeError as e:
            server.status = models.ServerStatus.ERROR
            db.commit()
            error_msg = str(e)
            if "Docker client not initialized" in error_msg or "Docker not running" in error_msg:
                raise HTTPException(
                    status_code=503, 
                    detail="Docker service is not running. Please start Docker and try again."
                )
            elif "port" in error_msg.lower() and "not available" in error_msg.lower():
                raise HTTPException(
                    status_code=409, 
                    detail=f"Port conflict: {error_msg}"
                )
            else:
                raise HTTPException(status_code=500, detail=f"Failed to restart server: {error_msg}")
        except Exception as e:
            server.status = models.ServerStatus.ERROR
            db.commit()
            logger.error(f"Unexpected error restarting server {server_id}: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

    return {"message": "Action not supported"}

@app.get("/api/system/status")
def get_system_status(current_user = Depends(get_current_user)):
    """获取系统状态：Docker 服务状态、容器、镜像等信息"""
    try:
        if not docker_manager.client:
            return {
                "docker_available": False,
                "error": "Docker client not initialized",
                "containers": [],
                "images": []
            }
        
        # 获取所有容器
        containers = []
        try:
            all_containers = docker_manager.client.containers.list(all=True)
            for container in all_containers:
                containers.append({
                    "id": container.id[:12],
                    "name": container.name,
                    "image": container.image.tags[0] if container.image.tags else container.image.id[:12],
                    "status": container.status,
                    "created": container.attrs.get("Created", ""),
                    "ports": container.ports
                })
        except Exception as e:
            logger.error(f"Failed to list containers: {e}")
        
        # 获取所有镜像
        images = []
        try:
            all_images = docker_manager.client.images.list()
            for image in all_images:
                images.append({
                    "id": image.id.split(':')[1][:12] if ':' in image.id else image.id[:12],
                    "tags": image.tags,
                    "size": image.attrs.get("Size", 0),
                    "created": image.attrs.get("Created", "")
                })
        except Exception as e:
            logger.error(f"Failed to list images: {e}")
        
        # 获取 Docker 版本信息
        docker_version = {}
        try:
            docker_version = docker_manager.client.version()
        except Exception as e:
            logger.error(f"Failed to get Docker version: {e}")
        
        return {
            "docker_available": True,
            "docker_version": docker_version.get("Version", "Unknown"),
            "api_version": docker_version.get("ApiVersion", "Unknown"),
            "containers": containers,
            "images": images
        }
    except Exception as e:
        logger.error(f"Error getting system status: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get system status: {str(e)}")
