# 🚀 MCP Fleet 基础镜像快速参考

## 一键构建

```bash
cd backend
./build_image.sh
```

## 一键测试

```bash
docker run --rm -v $(pwd)/test_image_features.py:/tmp/test.py \
    corp/mcp-base:latest python /tmp/test.py
```

---

## 📦 已安装的关键包

### 数据库
```python
import pymysql          # MySQL
import psycopg2         # PostgreSQL
import redis            # Redis
import pymongo          # MongoDB
import elasticsearch    # Elasticsearch
```

### 网络工具
```python
import paramiko         # SSH
import netmiko          # 网络设备自动化
import pexpect          # 交互式终端
import telnetlib3       # Telnet
from pysnmp_lextudio import *  # SNMP
```

### 网页解析
```python
from bs4 import BeautifulSoup   # HTML 解析
import lxml.etree as ET         # XML 解析
import requests                 # HTTP 客户端
import httpx                    # 现代 HTTP
```

### 数据处理
```python
import orjson           # 高性能 JSON
import pandas as pd     # 数据分析
import openpyxl         # Excel
import chardet          # 编码检测
import yaml             # YAML
```

---

## 🔧 常用命令

### 启动交互式容器
```bash
docker run -it --rm corp/mcp-base:latest bash
```

### 运行 Python 脚本
```bash
docker run --rm -v $(pwd):/app/user_code \
    corp/mcp-base:latest python /app/user_code/your_script.py
```

### 查看已安装的包
```bash
docker run --rm corp/mcp-base:latest pip list
```

### 测试特定包
```bash
docker run --rm corp/mcp-base:latest python -c "import pymysql; print('OK')"
```

---

## 📝 代码示例

### 连接 MySQL
```python
import pymysql
conn = pymysql.connect(host='192.168.1.100', user='admin', password='pass', db='mydb')
cursor = conn.cursor()
cursor.execute("SELECT * FROM users")
print(cursor.fetchall())
```

### SSH 执行命令
```python
import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('192.168.1.1', username='admin', password='pass')
stdin, stdout, stderr = ssh.exec_command('show version')
print(stdout.read().decode())
```

### 解析 HTML
```python
import requests
from bs4 import BeautifulSoup

resp = requests.get('http://device.internal', verify=False)
soup = BeautifulSoup(resp.content, 'lxml')
print(soup.find('title').text)
```

### 处理编码问题
```python
import chardet
import requests

resp = requests.get('http://old-device.internal')
encoding = chardet.detect(resp.content)['encoding']
text = resp.content.decode(encoding)
print(text)
```

---

## ⚠️ 常见问题速查

| 问题 | 解决方案 |
|------|---------|
| SSL 证书错误 | `requests.get(url, verify=False)` |
| 编码乱码 | 使用 `chardet.detect()` 检测编码 |
| 端口被占用 | 修改 `-p` 参数：`-p 30001:8000` |
| 权限不足 | 检查文件 owner：`chown -R 1000:1000 data/` |
| 包未安装 | 运行时安装：`pip install package-name` |

---

## 📊 镜像规格

- **大小**: ~600-800 MB
- **Python**: 3.11
- **用户**: appuser (UID 1000)
- **端口**: 8000
- **挂载点**: 
  - `/app/user_code` (代码，只读)
  - `/app/data` (数据，读写)

---

## 🔗 相关文档

- 详细构建指南：`IMAGE_BUILD_GUIDE.md`
- 项目文档：`../docs/README.md`
- 快速开始：`../docs/quick-start.md`

