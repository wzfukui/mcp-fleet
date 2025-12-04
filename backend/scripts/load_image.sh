#!/bin/bash
# 在目标服务器上加载 Docker 镜像

set -e

# 默认从 dist 目录加载
DEFAULT_FILE="../dist/mcp-base-latest.tar"
IMAGE_FILE="${1:-$DEFAULT_FILE}"

echo "=========================================="
echo "加载 Docker 镜像"
echo "=========================================="

# 检查文件是否存在
if [ ! -f "${IMAGE_FILE}" ]; then
    echo "错误: 文件不存在: ${IMAGE_FILE}"
    echo ""
    echo "使用方法："
    echo "  $0 [镜像文件路径]"
    echo ""
    echo "示例："
    echo "  $0 /path/to/mcp-base-latest.tar"
    echo "  $0 /path/to/mcp-base-latest.tar.gz  # 自动解压"
    exit 1
fi

# 如果是 .gz 文件，先解压
if [[ "${IMAGE_FILE}" == *.gz ]]; then
    echo "检测到压缩文件，正在解压..."
    gunzip -k "${IMAGE_FILE}"
    IMAGE_FILE="${IMAGE_FILE%.gz}"
fi

# 显示文件信息
FILE_SIZE=$(ls -lh "${IMAGE_FILE}" | awk '{print $5}')
echo "镜像文件: ${IMAGE_FILE}"
echo "文件大小: ${FILE_SIZE}"
echo ""

# 加载镜像
echo "正在加载镜像..."
START_TIME=$(date +%s)

docker load -i "${IMAGE_FILE}"

END_TIME=$(date +%s)
LOAD_TIME=$((END_TIME - START_TIME))

echo ""
echo "=========================================="
echo "✓ 加载完成！"
echo "=========================================="
echo "加载耗时: ${LOAD_TIME} 秒"
echo ""
echo "查看镜像："
echo "  docker images corp/mcp-base"
echo ""
echo "测试镜像："
echo "  docker run --rm corp/mcp-base:latest python --version"

