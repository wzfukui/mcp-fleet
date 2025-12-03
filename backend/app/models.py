from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from .database import Base

class ServerStatus(str, enum.Enum):
    STOPPED = "stopped"
    RUNNING = "running"
    ERROR = "error"
    BUILDING = "building"

class MCPServer(Base):
    __tablename__ = "mcp_servers"

    id = Column(String, primary_key=True)  # UUID
    name = Column(String, unique=True, index=True) # 英文标识，用于路由
    description = Column(String, nullable=True)
    
    # 代码存储路径
    source_code_path = Column(String) 
    entry_object = Column(String, default="mcp") # 代码里的实例名
    
    # 启动参数
    command = Column(String, nullable=True) # 自定义启动命令 (如 uv)
    args = Column(String, nullable=True) # 自定义参数 (JSON string list or space separated)

    # 运行时状态
    status = Column(Enum(ServerStatus), default=ServerStatus.STOPPED)
    container_id = Column(String, nullable=True) # Docker Container ID
    host_port = Column(Integer, nullable=True) # 分配的宿主机端口（主端口）
    ports = Column(String, nullable=True) # 用户配置的端口列表（逗号分隔，如 "8000,8001"）
    host_ports = Column(String, nullable=True) # 实际分配的宿主机端口列表（JSON 格式）
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 关联环境变量
    env_vars = relationship("EnvironmentVariable", back_populates="server", cascade="all, delete-orphan")

class EnvironmentVariable(Base):
    __tablename__ = "env_vars"

    id = Column(Integer, primary_key=True, index=True)
    server_id = Column(String, ForeignKey("mcp_servers.id"))
    key = Column(String)
    value = Column(String) # 若是 Secret，建议加密存储（MVP阶段暂明文）
    is_secret = Column(Boolean, default=False)

    server = relationship("MCPServer", back_populates="env_vars")

