#!/bin/bash
# ============================================
# MCP Fleet 基础镜像构建脚本
# ============================================

set -e  # 遇到错误立即退出

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}MCP Fleet 基础镜像构建${NC}"
echo -e "${GREEN}========================================${NC}"

# 镜像名称和标签
IMAGE_NAME="corp/mcp-base"
IMAGE_TAG="latest"
FULL_IMAGE_NAME="${IMAGE_NAME}:${IMAGE_TAG}"

# 切换到 backend 目录
cd "$(dirname "$0")"
echo -e "${YELLOW}当前目录: $(pwd)${NC}"

# 检查必要文件
echo -e "\n${YELLOW}[1/5] 检查必要文件...${NC}"
if [ ! -f "Dockerfile" ]; then
    echo -e "${RED}错误: Dockerfile 不存在${NC}"
    exit 1
fi

if [ ! -f "requirements.txt" ]; then
    echo -e "${RED}错误: requirements.txt 不存在${NC}"
    exit 1
fi

if [ ! -f "bootstrap.py" ]; then
    echo -e "${RED}错误: bootstrap.py 不存在${NC}"
    exit 1
fi

echo -e "${GREEN}✓ 所有必要文件存在${NC}"

# 显示 requirements.txt 内容摘要
echo -e "\n${YELLOW}[2/5] 依赖包摘要:${NC}"
echo -e "${YELLOW}----------------------------------------${NC}"
grep -E "^[a-zA-Z]" requirements.txt | head -20
TOTAL_PACKAGES=$(grep -E "^[a-zA-Z]" requirements.txt | wc -l)
echo -e "${YELLOW}... 共 ${TOTAL_PACKAGES} 个包${NC}"
echo -e "${YELLOW}----------------------------------------${NC}"

# 构建镜像
echo -e "\n${YELLOW}[3/5] 开始构建 Docker 镜像...${NC}"
echo -e "${YELLOW}镜像名称: ${FULL_IMAGE_NAME}${NC}"

# 记录开始时间
START_TIME=$(date +%s)

# 构建命令
docker build \
    --tag "${FULL_IMAGE_NAME}" \
    --progress=plain \
    .

# 计算构建时间
END_TIME=$(date +%s)
BUILD_TIME=$((END_TIME - START_TIME))

echo -e "\n${GREEN}✓ 镜像构建成功！${NC}"
echo -e "${GREEN}构建耗时: ${BUILD_TIME} 秒${NC}"

# 查看镜像信息
echo -e "\n${YELLOW}[4/5] 镜像信息:${NC}"
docker images "${IMAGE_NAME}" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"

# 测试镜像
echo -e "\n${YELLOW}[5/5] 快速测试镜像...${NC}"

# 测试 Python 版本
echo -e "${YELLOW}Python 版本:${NC}"
docker run --rm "${FULL_IMAGE_NAME}" python --version

# 测试关键包是否安装成功
echo -e "\n${YELLOW}测试关键包:${NC}"
docker run --rm "${FULL_IMAGE_NAME}" python -c "
import sys
packages = [
    'fastapi',
    'pymysql',
    'psycopg2',
    'redis',
    'paramiko',
    'netmiko',
    'bs4',
    'lxml',
    'pandas',
    'requests',
]

print('检查已安装的包:')
for pkg in packages:
    try:
        __import__(pkg)
        print(f'  ✓ {pkg}')
    except ImportError as e:
        print(f'  ✗ {pkg} - {e}')
        sys.exit(1)

print('\n所有关键包安装成功！')
"

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}========================================${NC}"
    echo -e "${GREEN}✓ 镜像构建和测试完成！${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo -e "\n${YELLOW}使用方法:${NC}"
    echo -e "  docker run -it --rm ${FULL_IMAGE_NAME} python"
    echo -e "  docker run -it --rm ${FULL_IMAGE_NAME} bash"
    echo -e "\n${YELLOW}推送到私有仓库:${NC}"
    echo -e "  docker tag ${FULL_IMAGE_NAME} your-registry.com/${IMAGE_NAME}:${IMAGE_TAG}"
    echo -e "  docker push your-registry.com/${IMAGE_NAME}:${IMAGE_TAG}"
else
    echo -e "\n${RED}========================================${NC}"
    echo -e "${RED}✗ 镜像测试失败${NC}"
    echo -e "${RED}========================================${NC}"
    exit 1
fi

