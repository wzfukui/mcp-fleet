# ============================================
# MCP Fleet - 企业级完整版基础镜像
# 包含：数据库驱动、SSH/Telnet、网页解析、数据处理
# 不包含：浏览器自动化（Selenium/Playwright）
# ============================================
FROM python:3.11-slim

# 设置工作目录
WORKDIR /app

# ============================================
# 1. 系统依赖安装
# ============================================
RUN sed -i 's/deb.debian.org/mirrors.tuna.tsinghua.edu.cn/g' /etc/apt/sources.list.d/debian.sources && \
    apt-get update && apt-get install -y --no-install-recommends \
    # 基础工具
    curl \
    git \
    wget \
    ca-certificates \
    \
    # 编译工具（部分 Python 包需要）
    gcc \
    g++ \
    make \
    python3-dev \
    \
    # MySQL 客户端库
    default-libmysqlclient-dev \
    pkg-config \
    \
    # PostgreSQL 客户端库
    libpq-dev \
    \
    # SSH/加密库
    libffi-dev \
    libssl-dev \
    openssh-client \
    \
    # LDAP 支持
    libldap2-dev \
    libsasl2-dev \
    \
    # XML/XSLT 支持（lxml 需要）
    libxml2-dev \
    libxslt1-dev \
    zlib1g-dev \
    \
    # Telnet 客户端
    telnet \
    \
    # 字体支持（PDF/图片生成可能需要）
    fonts-liberation \
    libfreetype6-dev \
    libjpeg-dev \
    libpng-dev \
    \
    # 清理 apt 缓存
    && rm -rf /var/lib/apt/lists/*

# ============================================
# 2. 安装 uv (现代 Python 包管理工具)
# ============================================
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

# ============================================
# 3. 安装 Python 依赖
# ============================================
# 先复制 requirements.txt
COPY requirements.txt /app/requirements.txt

# 安装所有依赖（使用清华镜像源）
RUN pip install --no-cache-dir \
    -i https://pypi.tuna.tsinghua.edu.cn/simple \
    --trusted-host pypi.tuna.tsinghua.edu.cn \
    -r /app/requirements.txt

# ============================================
# 4. 复制启动脚本
# ============================================
COPY bootstrap.py /app/bootstrap.py

# ============================================
# 5. 配置运行环境
# ============================================
# 暴露默认端口
EXPOSE 8000

# 创建用户代码挂载点和数据挂载点
RUN mkdir -p /app/user_code /app/data

# 创建非 root 用户（安全最佳实践）
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app

USER appuser

# 环境变量配置
ENV UV_CACHE_DIR=/app/data/.uv_cache \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONIOENCODING=utf-8

# ============================================
# 6. 启动命令
# ============================================
CMD ["python", "bootstrap.py"]
