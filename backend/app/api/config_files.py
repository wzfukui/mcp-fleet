"""配置文件管理 API"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import os

from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user

router = APIRouter(prefix="/api/servers/{server_id}/config-files", tags=["config-files"])

@router.get("", response_model=List[schemas.ConfigFile])
def list_config_files(
    server_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """获取服务器的所有配置文件"""
    server = db.query(models.MCPServer).filter(models.MCPServer.id == server_id).first()
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")
    
    return server.config_files

@router.post("", response_model=schemas.ConfigFile)
def create_config_file(
    server_id: str,
    config: schemas.ConfigFileCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """添加配置文件"""
    server = db.query(models.MCPServer).filter(models.MCPServer.id == server_id).first()
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")
    
    # 检查文件名是否已存在
    existing = db.query(models.ConfigFile).filter(
        models.ConfigFile.server_id == server_id,
        models.ConfigFile.filename == config.filename
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="配置文件已存在")
    
    # 保存到数据库
    db_config = models.ConfigFile(
        server_id=server_id,
        filename=config.filename,
        content=config.content
    )
    db.add(db_config)
    db.commit()
    db.refresh(db_config)
    
    # 写入文件到 data 目录
    data_path = os.path.join(server.source_code_path, "data")
    os.makedirs(data_path, exist_ok=True)
    file_path = os.path.join(data_path, config.filename)
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(config.content)
    
    return db_config

@router.put("/{config_id}", response_model=schemas.ConfigFile)
def update_config_file(
    server_id: str,
    config_id: int,
    config: schemas.ConfigFileCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """更新配置文件"""
    db_config = db.query(models.ConfigFile).filter(
        models.ConfigFile.id == config_id,
        models.ConfigFile.server_id == server_id
    ).first()
    if not db_config:
        raise HTTPException(status_code=404, detail="配置文件不存在")
    
    # 更新数据库
    db_config.content = config.content
    db.commit()
    db.refresh(db_config)
    
    # 更新文件
    server = db.query(models.MCPServer).filter(models.MCPServer.id == server_id).first()
    file_path = os.path.join(server.source_code_path, "data", db_config.filename)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(config.content)
    
    return db_config

@router.delete("/{config_id}")
def delete_config_file(
    server_id: str,
    config_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """删除配置文件"""
    db_config = db.query(models.ConfigFile).filter(
        models.ConfigFile.id == config_id,
        models.ConfigFile.server_id == server_id
    ).first()
    if not db_config:
        raise HTTPException(status_code=404, detail="配置文件不存在")
    
    # 删除文件
    server = db.query(models.MCPServer).filter(models.MCPServer.id == server_id).first()
    file_path = os.path.join(server.source_code_path, "data", db_config.filename)
    if os.path.exists(file_path):
        os.remove(file_path)
    
    # 删除数据库记录
    db.delete(db_config)
    db.commit()
    
    return {"message": "配置文件已删除"}

