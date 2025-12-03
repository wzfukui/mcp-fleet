# 部署指南

本文档提供 MCP Fleet 的完整部署指南，包括快速部署、生产环境部署和故障排查。

## 目录

- [前置要求](#前置要求)
- [快速部署](#快速部署)
- [手动部署](#手动部署)
- [生产环境部署](#生产环境部署)
- [故障排查](#故障排查)
- [性能优化](#性能优化)
- [监控和日志](#监控和日志)
- [数据备份](#数据备份)
- [安全建议](#安全建议)

## 前置要求

- **操作系统**: Linux (推荐 Ubuntu 22.04) 或 macOS
- **Docker**: 必须已安装并运行 (`docker info` 应该能正常工作)
- **Python**: 3.10+
- **Node.js**: 18+

## 快速部署

### 方式一：使用自动化脚本（推荐）

1. **上传代码**：
   将整个项目文件夹上传到服务器

2. **运行部署脚本**：
   ```bash
   chmod +x build_and_run.sh
   ./build_and_run.sh
   ```

   该脚本会自动：
   - 构建 `corp/mcp-base` Docker 镜像
   - 设置 Python 虚拟环境
   - 安装依赖
   - 打印启动命令

### 方式二：分步部署

#### 1. 安装前端依赖

```bash
cd frontend
npm install
```

如果使用了新的 UI 组件，需要安装额外依赖：
```bash
npm install @radix-ui/react-progress
```

#### 2. 运行数据库迁移

```bash
cd backend
python migrate_db.py
```

预期输出：
```
============================================================
🔧 MCP Fleet 数据库迁移工具
============================================================

📁 数据库路径: mcp_platform.db
✅ 已创建备份: mcp_platform.db.backup
➕ 添加 ports 字段...
✅ ports 字段添加成功
➕ 添加 host_ports 字段...
✅ host_ports 字段添加成功
🔄 迁移旧的 port 数据到 ports 字段...
✅ 已迁移 X 条记录

✅ 数据库迁移完成！
```

#### 3. 启动后端服务

```bash
cd backend
uvicorn app.main:app --reload --port 3200
```

或使用虚拟环境：
```bash
cd backend
source venv/bin/activate  # Linux/Mac
# 或
venv\Scripts\activate  # Windows

uvicorn app.main:app --reload --port 3200
```

#### 4. 启动前端服务

```bash
cd frontend
VITE_PORT=3100 npm run dev
```

或 Windows：
```bash
cd frontend
set VITE_PORT=3100 && npm run dev
```

#### 5. 访问应用

打开浏览器访问：http://localhost:3100

默认登录凭据：
- 用户名：`admin`
- 密码：`admin123`

## 手动部署

### 1. 构建基础 Docker 镜像

平台依赖 "Fat Image" 来快速运行用户代码：

```bash
cd backend
docker build -t corp/mcp-base:latest .
cd ..
```

### 2. 启动后端 API

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt

# 启动 API (端口 3200)
# 确保在项目根目录
uvicorn backend.app.main:app --host 0.0.0.0 --port 3200
```

### 3. 启动前端

```bash
cd frontend
npm install
VITE_PORT=3100 npm run dev -- --host
```

访问地址：`http://YOUR_SERVER_IP:3100`

## 验证部署

### 测试后端 API

1. **测试认证**：
```bash
curl -X POST http://localhost:3200/api/auth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin123"
```

2. **测试服务器列表**（需要先获取 token）：
```bash
TOKEN="your_token_here"
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3200/api/servers
```

3. **测试端口池状态**：
```bash
TOKEN="your_token_here"
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3200/api/system/ports
```

### 测试前端功能

1. **创建服务器**：
   - 登录后点击"创建服务器"
   - 填写基本信息
   - 添加环境变量（测试密钥类型）
   - 配置端口（测试多端口）
   - 上传文件并创建

2. **查看端口池**：
   - 导航到"系统状态"页面
   - 查看"端口池状态"卡片
   - 验证端口使用情况显示正确

## 故障排查

### 问题 1：前端报错 "Failed to resolve import @radix-ui/react-progress"

**原因**：缺少依赖包

**解决**：
```bash
cd frontend
npm install @radix-ui/react-progress
```

### 问题 2：后端报错 "no such column: mcp_servers.ports"

**原因**：数据库未迁移

**解决**：
```bash
cd backend
python migrate_db.py
```

然后重启后端服务。

### 问题 3：数据库迁移失败

**原因**：数据库文件不存在或路径错误

**解决**：
1. 检查数据库文件位置：
```bash
cd backend
find . -name "mcp_platform.db"
```

2. 如果数据库不存在，启动一次后端服务会自动创建：
```bash
uvicorn app.main:app --port 3200
# 按 Ctrl+C 停止
```

3. 再次运行迁移脚本。

### 问题 4：端口冲突

**原因**：3200 或 3100 端口已被占用

**解决**：
1. 查找占用端口的进程：
```bash
# Mac/Linux
lsof -i :3200
lsof -i :3100

# Windows
netstat -ano | findstr :3200
netstat -ano | findstr :3100
```

2. 杀死进程或使用其他端口：
```bash
# 后端使用其他端口
uvicorn app.main:app --reload --port 3201

# 前端使用其他端口
VITE_PORT=3101 npm run dev
```

### 问题 5：Docker 服务不可用

**原因**：Docker 未启动

**解决**：
1. 启动 Docker Desktop（Mac/Windows）
2. 或启动 Docker 服务（Linux）：
```bash
sudo systemctl start docker
```

## 生产环境部署

### 使用 Docker Compose（推荐）

参考 `build_and_run.sh` 脚本：

```bash
./build_and_run.sh
```

### 手动部署

1. **构建前端**：
```bash
cd frontend
npm run build
```

2. **配置 Nginx**（示例）：
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # 后端 API
    location /api {
        proxy_pass http://localhost:3200;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

3. **使用 systemd 管理后端服务**：

创建 `/etc/systemd/system/mcp-fleet.service`：
```ini
[Unit]
Description=MCP Fleet Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/mcp-fleet/backend
Environment="PATH=/opt/mcp-fleet/backend/venv/bin"
ExecStart=/opt/mcp-fleet/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 3200
Restart=always

[Install]
WantedBy=multi-user.target
```

启动服务：
```bash
sudo systemctl enable mcp-fleet
sudo systemctl start mcp-fleet
```

## 配置说明

- **数据存储**: 默认数据存储在 `/opt/mcp-platform/data`。确保用户有写权限，或修改 `backend/app/main.py` 和 `backend/app/services/docker_manager.py` 中的 `HOST_DATA_ROOT`
- **CORS**: 通过环境变量 `ALLOWED_ORIGINS` 配置（逗号分隔）。默认允许 `http://localhost:3100` 和 `http://localhost:5173`
- **端口**: 
  - 前端: 默认 `3100` (通过 `VITE_PORT` 配置)
  - 后端: 默认 `3200` (通过 uvicorn 命令参数配置)

## 数据备份

### 备份数据库

```bash
# 手动备份
cp backend/mcp_platform.db backend/mcp_platform.db.backup.$(date +%Y%m%d_%H%M%S)

# 定时备份（crontab）
0 2 * * * cp /path/to/backend/mcp_platform.db /path/to/backups/mcp_platform.db.$(date +\%Y\%m\%d)
```

### 备份服务器数据

```bash
# 备份所有服务器代码和数据
tar -czf mcp_data_backup.tar.gz backend/mcp_data/
```

## 性能优化

### 后端优化

1. **使用 Gunicorn + Uvicorn Workers**：
```bash
gunicorn app.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:3200
```

2. **使用 PostgreSQL**（推荐生产环境）：

修改 `backend/app/database.py`：
```python
SQLALCHEMY_DATABASE_URL = "postgresql://user:password@localhost/mcp_fleet"
```

### 前端优化

1. **启用生产构建**：
```bash
npm run build
```

2. **使用 CDN** 加速静态资源

3. **启用 Gzip 压缩**（Nginx）：
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;
```

## 监控和日志

### 查看后端日志

```bash
# 如果使用 systemd
journalctl -u mcp-fleet -f

# 如果使用 Docker
docker logs -f mcp-fleet-backend
```

### 监控端口使用

定期检查端口池状态：
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3200/api/system/ports
```

## 安全建议

1. **修改默认密码**：在生产环境中修改 admin 密码
2. **使用 HTTPS**：配置 SSL 证书
3. **限制 API 访问**：使用防火墙规则
4. **环境变量加密**：实现敏感数据的加密存储
5. **定期更新**：保持依赖包最新

## 更新日志

查看根目录下的 `CHANGELOG.md` 了解最新更新内容。

## 技术支持

如遇到问题，请提供：
1. 错误信息截图
2. 后端日志
3. 浏览器控制台错误
4. 系统环境信息（OS、Python 版本、Node 版本）

