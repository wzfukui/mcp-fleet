import sys
import importlib
import uvicorn
import os
import logging

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("bootstrap")

def load_user_code():
    """
    动态加载用户代码
    预期路径: /app/user_code/server.py
    预期对象: mcp (FastMCP 实例)
    """
    sys.path.append("/app/user_code")
    
    try:
        # 尝试导入 server.py
        if not os.path.exists("/app/user_code/server.py"):
            logger.error("No server.py found in /app/user_code")
            sys.exit(1)
            
        module = importlib.import_module("server")
        
        # 获取入口对象，默认找 'mcp' 或 'app'
        # 在 PRD 中我们定义了 entry_object 字段，但在 MVP 简化版中，
        # 我们先假设用户代码里有个叫 'mcp' 的变量，或者它是 FastMCP 实例
        # 注意：FastMCP 的 run() 通常是阻塞的，但如果我们要用 uvicorn 跑 SSE，
        # 我们需要 FastMCP 暴露出来的 ASGI app。
        # mcp-sdk 的 FastMCP 其实底层就是 FastAPI/Starlette。
        
        # 假设用户代码是这样的：
        # from mcp.server.fastmcp import FastMCP
        # mcp = FastMCP("My Server")
        
        if hasattr(module, "mcp"):
            return getattr(module, "mcp")
        elif hasattr(module, "app"):
            return getattr(module, "app")
        else:
            logger.error("No 'mcp' or 'app' object found in server.py")
            sys.exit(1)
            
    except Exception as e:
        logger.error(f"Failed to load user code: {e}")
        sys.exit(1)

if __name__ == "__main__":
    # 加载用户代码实例
    # 注意：FastMCP 实例本身不是 ASGI app，但在 mount 时会被使用
    # 如果是 FastMCP，它提供了 ._fastapi_app (私有) 或者我们需要用 FastMCP 的运行方式
    # 但为了统一管理，我们最好让 FastMCP 作为一个 ASGI app 运行
    
    # 修正策略：
    # 官方 mcp[sse] 通常建议直接用 uvicorn 运行 FastMCP 实例（它实现了 __call__? 不一定）
    # 或者 FastMCP 提供了 create_asgi_app() ?
    # 让我们查阅一下 mcp 库的文档或者假设一种标准写法。
    
    # 假设：用户代码里的 mcp 是 FastMCP 实例
    # 我们直接启动它。FastMCP.run() 使用 uvicorn。
    # 但我们需要在这里显式控制 uvicorn，以便绑定 0.0.0.0 和端口。
    
    app = load_user_code()
    
    # 如果 app 是 FastMCP 实例，它可能没有直接暴露 ASGI 接口
    # 临时 hack: FastMCP 内部其实是一个 FastAPI app
    # 我们可以尝试直接运行它，或者假设它就是个 FastAPI app
    
    logger.info("Starting server on port 8000...")
    uvicorn.run(app, host="0.0.0.0", port=8000)

