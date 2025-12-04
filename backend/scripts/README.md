# 镜像构建与部署脚本

## 脚本说明

| 脚本 | 用途 | 使用场景 |
|------|------|---------|
| `build_image.sh` | 构建 Docker 镜像 | 开发环境 |
| `export_image.sh` | 导出镜像为 tar 文件 | 准备离线部署 |
| `load_image.sh` | 加载 tar 文件到 Docker | 客户现场部署 |
| `test_image_features.py` | 测试镜像功能 | 验证镜像 |

## 使用流程

### 开发环境（构建）

```bash
cd scripts
./build_image.sh          # 构建镜像（约 5-10 分钟）
./export_image.sh         # 导出为 tar（生成到 ../dist/）
```

### 客户现场（部署）

```bash
# 1. 传输文件到服务器
scp ../dist/mcp-base-latest.tar user@server:/tmp/

# 2. 在服务器上加载
ssh user@server
cd /tmp
./load_image.sh mcp-base-latest.tar

# 3. 验证
docker images corp/mcp-base
docker run --rm corp/mcp-base:latest python --version
```

## 目录结构

```
backend/
├── scripts/              # 所有脚本
│   ├── build_image.sh
│   ├── export_image.sh
│   ├── load_image.sh
│   ├── test_image_features.py
│   └── README.md
├── dist/                 # 导出的镜像文件（自动创建）
│   └── mcp-base-latest.tar
├── Dockerfile
├── requirements.txt
└── bootstrap.py
```

