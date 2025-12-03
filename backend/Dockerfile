# 使用轻量级但完整的 Python 环境
FROM python:3.11-slim

# 设置工作目录
WORKDIR /app

# 1. 更换为中国大陆镜像源并安装系统级依赖
# curl: 用于下载
# git: uv 有时需要拉取 git 依赖
RUN sed -i 's/deb.debian.org/mirrors.tuna.tsinghua.edu.cn/g' /etc/apt/sources.list.d/debian.sources && \
    apt-get update && apt-get install -y curl git && rm -rf /var/lib/apt/lists/*

# 2. 安装 uv (现代 Python 包管理工具)
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

# 3. 安装 Python 核心依赖 (保留 Fat Image 策略，预装常用库)
# 这样即使用户不使用 uv，也能直接运行大部分脚本
# mcp[sse]: MCP 协议核心库
# fastapi uvicorn: Web 服务
# pandas numpy requests: 数据分析与网络请求常用库
RUN pip install --no-cache-dir -i https://pypi.tuna.tsinghua.edu.cn/simple \
    "mcp[sse]" \
    fastapi \
    uvicorn[standard] \
    requests \
    pandas \
    httpx

# 4. 复制启动脚本
COPY bootstrap.py /app/bootstrap.py

# 暴露默认端口
EXPOSE 8000

# 创建用户代码挂载点和数据挂载点
RUN mkdir -p /app/user_code /app/data

# 创建非 root 用户
RUN useradd -m appuser && chown -R appuser:appuser /app
USER appuser

# 确保 uv 的缓存目录可写
ENV UV_CACHE_DIR=/app/data/.uv_cache

# 启动命令
CMD ["python", "bootstrap.py"]
