import docker
import socket
import os
from typing import Optional, Dict, List
import logging

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 基础镜像名称
BASE_IMAGE = "corp/mcp-base:latest"

class DockerManager:
    def __init__(self):
        try:
            self.client = docker.from_env()
        except Exception as e:
            logger.warning(f"Failed to connect to Docker daemon: {e}. Docker features will not work.")
            self.client = None

    def _is_port_free(self, port: int) -> bool:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            return s.connect_ex(('localhost', port)) != 0

    def _find_free_port(self, start_port: int = 30000, end_port: int = 40000) -> Optional[int]:
        """寻找宿主机可用端口"""
        for port in range(start_port, end_port):
            if self._is_port_free(port):
                return port
        return None

    def run_container(self, 
                      server_id: str, 
                      server_name: str, 
                      host_base_path: str, 
                      env_vars: Dict[str, str], 
                      requested_port: Optional[int] = None,
                      command: Optional[List[str]] = None) -> Dict:
        """
        启动容器
        返回: {"container_id": str, "port": int}
        
        :param host_base_path: 宿主机上该 Server 的基础数据目录 (包含 app/ 和 data/)
        :param requested_port: 用户请求的固定端口，如果提供则尝试绑定
        :param command: 可选的自定义启动命令 (override CMD)
        """
        if not self.client:
            raise RuntimeError("Docker client not initialized (Docker not running?)")

        # 1. 端口分配逻辑
        port = None
        if requested_port:
            if self._is_port_free(requested_port):
                port = requested_port
            else:
                raise RuntimeError(f"Requested port {requested_port} is not available")
        else:
            port = self._find_free_port()
            
        if not port:
            raise RuntimeError("No free ports available")

        # 2. 准备挂载目录路径
        host_app_path = os.path.join(host_base_path, "app")
        host_data_path = os.path.join(host_base_path, "data")
        
        # 确保目录存在
        os.makedirs(host_app_path, exist_ok=True)
        os.makedirs(host_data_path, exist_ok=True)

        # 3. 准备 Docker 参数
        volumes = {
            host_app_path: {'bind': '/app/user_code', 'mode': 'ro'}, # 代码只读
            host_data_path: {'bind': '/app/data', 'mode': 'rw'}      # 数据持久化
        }

        # 环境变量注入
        environment = env_vars.copy()
        environment["MCP_SERVER_ID"] = server_id

        run_kwargs = {
            "image": BASE_IMAGE,
            "name": f"mcp-{server_name}",
            "detach": True,
            "ports": {'8000/tcp': port},
            "volumes": volumes,
            "environment": environment,
            "mem_limit": "512m",
            "user": "appuser"
        }
        
        # 如果提供了自定义命令，覆盖默认 CMD
        if command:
            run_kwargs["command"] = command

        try:
            # 4. 启动容器
            container = self.client.containers.run(**run_kwargs)
            
            logger.info(f"Container started: {container.id} on port {port}")
            return {"container_id": container.id, "port": port}

        except Exception as e:
            logger.error(f"Failed to start container: {e}")
            raise e

    def stop_container(self, container_id: str):
        if not self.client:
            return
        try:
            container = self.client.containers.get(container_id)
            container.stop(timeout=10)
            container.remove()
            logger.info(f"Container stopped and removed: {container_id}")
        except docker.errors.NotFound:
            logger.warning(f"Container not found: {container_id}")
        except Exception as e:
            logger.error(f"Error stopping container: {e}")
            raise e

    def get_logs(self, container_id: str, tail: int = 100):
        if not self.client:
            yield "Docker client not connected"
            return

        try:
            container = self.client.containers.get(container_id)
            for line in container.logs(stream=True, tail=tail, follow=True):
                yield line.decode('utf-8')
        except Exception as e:
            yield f"Error reading logs: {e}"

# 单例模式
docker_manager = DockerManager()
