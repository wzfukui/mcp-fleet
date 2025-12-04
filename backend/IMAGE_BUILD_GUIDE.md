# MCP Fleet 基础镜像构建指南

## 📦 镜像概述

这是 MCP Fleet 项目的企业级完整版基础镜像，包含以下功能：

### ✅ 已包含的功能

#### 1️⃣ 数据库驱动
- **MySQL**: `pymysql` (纯 Python) + `mysqlclient` (C 扩展)
- **PostgreSQL**: `psycopg2-binary`
- **Redis**: `redis`
- **MongoDB**: `pymongo`
- **Elasticsearch**: `elasticsearch`

#### 2️⃣ 网络设备对接
- **SSH 客户端**: `paramiko`
- **网络设备自动化**: `netmiko` (支持 Cisco/华为/H3C 等)
- **交互式终端**: `pexpect`
- **Telnet 客户端**: `telnetlib3`
- **SNMP 协议**: `pysnmp-lextudio`
- **SFTP 文件传输**: `pysftp`

#### 3️⃣ 网页解析与数据处理
- **HTML 解析**: `beautifulsoup4`, `lxml`, `html5lib`, `pyquery`
- **HTTP 客户端**: `requests`, `httpx`, `aiohttp`
- **JSON 处理**: `orjson` (高性能), `jsonschema`
- **XML 处理**: `xmltodict`, `defusedxml`
- **配置文件**: `pyyaml`, `toml`
- **Excel/CSV**: `pandas`, `openpyxl`, `xlrd`
- **编码检测**: `chardet`, `charset-normalizer`
- **日期时间**: `python-dateutil`, `arrow`

#### 4️⃣ 企业集成
- **LDAP/AD 认证**: `python-ldap`
- **网络设备配置**: `ciscoconfparse`
- **模板渲染**: `jinja2`
- **加密工具**: `cryptography`

### ❌ 未包含的功能（避免镜像过大）
- ❌ 浏览器自动化 (Selenium/Playwright)
- ❌ 机器学习库 (TensorFlow/PyTorch)
- ❌ 图像处理 (OpenCV/Pillow)

> 💡 如需这些功能，用户可在运行时通过 `uv pip install` 安装

---

## 🚀 快速开始

### 1. 构建镜像

```bash
cd backend
chmod +x build_image.sh
./build_image.sh
```

构建过程大约需要 **5-10 分钟**（取决于网络速度）。

### 2. 测试镜像

#### 方法 1：使用测试脚本（推荐）

```bash
# 将测试脚本复制到容器中运行
docker run --rm -v $(pwd)/test_image_features.py:/tmp/test.py \
    corp/mcp-base:latest python /tmp/test.py
```

#### 方法 2：手动测试

```bash
# 启动交互式容器
docker run -it --rm corp/mcp-base:latest bash

# 在容器内测试
python -c "import pymysql; print('MySQL OK')"
python -c "import paramiko; print('SSH OK')"
python -c "from bs4 import BeautifulSoup; print('BeautifulSoup OK')"
```

---

## 📋 详细构建步骤

### 步骤 1：准备文件

确保以下文件存在于 `backend/` 目录：
- ✅ `Dockerfile`
- ✅ `requirements.txt`
- ✅ `bootstrap.py`

### 步骤 2：检查系统依赖

镜像会自动安装以下系统库：

```bash
# 基础工具
curl, git, wget, ca-certificates

# 编译工具
gcc, g++, make, python3-dev

# 数据库客户端库
default-libmysqlclient-dev, libpq-dev

# 加密库
libffi-dev, libssl-dev, openssh-client

# XML/XSLT 支持
libxml2-dev, libxslt1-dev

# LDAP 支持
libldap2-dev, libsasl2-dev

# 其他
telnet, fonts-liberation
```

### 步骤 3：执行构建

```bash
# 方法 1：使用脚本（推荐）
./build_image.sh

# 方法 2：手动构建
docker build -t corp/mcp-base:latest .
```

### 步骤 4：验证构建结果

```bash
# 查看镜像大小
docker images corp/mcp-base

# 预期大小：约 600-800 MB
```

---

## 🧪 测试功能

### 测试数据库连接

```python
# 测试 MySQL
import pymysql
conn = pymysql.connect(
    host='your-mysql-host',
    user='your-user',
    password='your-password',
    database='your-db'
)
print("MySQL 连接成功")

# 测试 PostgreSQL
import psycopg2
conn = psycopg2.connect(
    host='your-pg-host',
    user='your-user',
    password='your-password',
    database='your-db'
)
print("PostgreSQL 连接成功")
```

### 测试 SSH 连接

```python
import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(
    hostname='your-device-ip',
    username='admin',
    password='password'
)

stdin, stdout, stderr = ssh.exec_command('show version')
print(stdout.read().decode())
ssh.close()
```

### 测试网页解析

```python
import requests
from bs4 import BeautifulSoup

# 抓取网页
response = requests.get('http://your-internal-site.com', verify=False)

# 解析 HTML（使用 lxml 解析器，速度快）
soup = BeautifulSoup(response.content, 'lxml')

# 提取数据
title = soup.find('title').text
print(f"页面标题: {title}")

# 提取表格
for row in soup.select('table tr'):
    cells = [td.text.strip() for td in row.find_all('td')]
    print(cells)
```

### 测试编码检测

```python
import chardet
import requests

# 抓取可能是 GBK 编码的页面
response = requests.get('http://old-device.internal')

# 自动检测编码
detected = chardet.detect(response.content)
encoding = detected['encoding']
print(f"检测到的编码: {encoding}")

# 正确解码
text = response.content.decode(encoding)
print(text)
```

---

## 🔧 常见问题

### Q1: 构建失败，提示 "unable to connect to mirrors.tuna.tsinghua.edu.cn"

**解决方案**：
```bash
# 临时使用官方源
sed -i 's/mirrors.tuna.tsinghua.edu.cn/deb.debian.org/g' Dockerfile
```

### Q2: 某个 Python 包安装失败

**解决方案**：
```bash
# 查看详细错误日志
docker build --progress=plain --no-cache -t corp/mcp-base:latest .

# 如果是编译错误，检查系统依赖是否安装
```

### Q3: 镜像太大，如何优化？

**解决方案**：
1. 移除不需要的包（编辑 `requirements.txt`）
2. 使用多阶段构建（高级）
3. 清理编译工具：
```dockerfile
RUN apt-get purge -y gcc g++ make python3-dev && \
    apt-get autoremove -y
```

### Q4: 如何添加额外的 Python 包？

**方法 1**：编辑 `requirements.txt`，重新构建镜像

**方法 2**：运行时安装（不推荐用于生产）
```bash
docker run -it corp/mcp-base:latest bash
pip install your-package
```

### Q5: 如何处理 SSL 证书问题？

**解决方案**：
```python
# 方法 1：禁用证书验证（仅内网）
requests.get('https://device.internal', verify=False)

# 方法 2：使用企业 CA 证书
# 将证书挂载到容器
# docker run -v /path/to/ca.crt:/app/data/ca.crt ...
requests.get('https://device.internal', verify='/app/data/ca.crt')
```

---

## 📤 推送到私有仓库

### 1. 标记镜像

```bash
# 替换为你的私有仓库地址
docker tag corp/mcp-base:latest your-registry.com/corp/mcp-base:latest
docker tag corp/mcp-base:latest your-registry.com/corp/mcp-base:v1.0.0
```

### 2. 登录私有仓库

```bash
docker login your-registry.com
```

### 3. 推送镜像

```bash
docker push your-registry.com/corp/mcp-base:latest
docker push your-registry.com/corp/mcp-base:v1.0.0
```

### 4. 更新 docker_manager.py

```python
# 修改 backend/app/services/docker_manager.py
BASE_IMAGE = "your-registry.com/corp/mcp-base:latest"
```

---

## 📊 镜像信息

| 项目 | 信息 |
|------|------|
| **基础镜像** | `python:3.11-slim` |
| **预期大小** | ~600-800 MB |
| **Python 版本** | 3.11 |
| **包管理器** | pip + uv |
| **镜像源** | 清华大学镜像源 |
| **用户** | appuser (非 root) |
| **工作目录** | `/app` |
| **挂载点** | `/app/user_code` (代码), `/app/data` (数据) |
| **暴露端口** | 8000 |

---

## 🔒 安全建议

1. ✅ 镜像使用非 root 用户运行 (`appuser`)
2. ✅ 代码目录挂载为只读 (`ro`)
3. ✅ 使用 `defusedxml` 防止 XXE 攻击
4. ⚠️ 生产环境建议：
   - 定期更新依赖包版本
   - 扫描镜像漏洞 (`docker scan`)
   - 使用私有镜像仓库
   - 限制容器资源 (`--memory`, `--cpus`)

---

## 📝 版本历史

### v1.0.0 (2024-12-04)
- ✅ 初始版本
- ✅ 包含数据库驱动 (MySQL, PostgreSQL, Redis, MongoDB, Elasticsearch)
- ✅ 包含网络工具 (SSH, Telnet, SNMP)
- ✅ 包含网页解析 (BeautifulSoup, lxml)
- ✅ 包含数据处理 (Pandas, Excel, JSON, XML)
- ✅ 包含企业集成 (LDAP, Cisco 配置解析)

---

## 🆘 获取帮助

如有问题，请联系：
- 项目负责人：[你的联系方式]
- 技术支持：[技术支持邮箱]

或查看项目文档：
- 主文档：`/docs/README.md`
- 快速开始：`/docs/quick-start.md`

