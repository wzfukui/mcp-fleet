from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from .models import ServerStatus

class EnvVarBase(BaseModel):
    key: str
    value: str
    is_secret: bool = False

class EnvVarCreate(EnvVarBase):
    pass

class EnvVar(EnvVarBase):
    id: int
    server_id: str

    class Config:
        from_attributes = True

class ConfigFileBase(BaseModel):
    filename: str
    content: str

class ConfigFileCreate(ConfigFileBase):
    pass

class ConfigFile(ConfigFileBase):
    id: int
    server_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class MCPServerBase(BaseModel):
    name: str
    description: Optional[str] = None
    entry_object: str = "mcp"
    ports: Optional[str] = None # 用户配置的端口列表（逗号分隔）
    command: Optional[str] = None
    args: Optional[str] = None
    image: Optional[str] = "corp/mcp-base:latest" # 基础镜像

class MCPServerCreate(MCPServerBase):
    pass

class MCPServerUpdate(BaseModel):
    description: Optional[str] = None
    entry_object: Optional[str] = None
    ports: Optional[str] = None
    port: Optional[int] = None  # 向后兼容，支持单个端口
    command: Optional[str] = None
    args: Optional[str] = None

class MCPServer(MCPServerBase):
    id: str
    status: ServerStatus
    host_port: Optional[int] = None
    ports: Optional[str] = None
    host_ports: Optional[str] = None
    command: Optional[str] = None
    args: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    env_vars: List[EnvVar] = []
    config_files: List[ConfigFile] = []
    
    # 计算属性：SSE 连接地址
    @property
    def sse_url(self) -> str:
        # MVP: 假设直接通过 IP:Port 访问，或者通过网关
        # 这里先返回一个占位符，实际应从配置读取 Gateway Host
        if self.host_port:
            return f"http://localhost:{self.host_port}/sse"
        return ""

    class Config:
        from_attributes = True

class ServerAction(BaseModel):
    action: str  # start, stop, restart

