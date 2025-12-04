#!/bin/bash
# 导出 Docker 镜像为 tar 文件，用于离线部署

set -e

# 切换到 backend 目录
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
cd "$BACKEND_DIR"

IMAGE_NAME="corp/mcp-base:latest"
OUTPUT_DIR="dist"
OUTPUT_FILE="mcp-base-latest.tar"

echo "=========================================="
echo "导出 Docker 镜像"
echo "=========================================="

# 检查镜像是否存在
if ! docker images --format "{{.Repository}}:{{.Tag}}" | grep -q "^${IMAGE_NAME}$"; then
    echo "错误: 镜像 ${IMAGE_NAME} 不存在"
    echo "请先运行 ./build_image.sh 构建镜像"
    exit 1
fi

# 创建输出目录
mkdir -p "${OUTPUT_DIR}"

# 导出镜像
echo "正在导出镜像: ${IMAGE_NAME}"
echo "输出路径: ${OUTPUT_DIR}/${OUTPUT_FILE}"

START_TIME=$(date +%s)

docker save "${IMAGE_NAME}" -o "${OUTPUT_DIR}/${OUTPUT_FILE}"

END_TIME=$(date +%s)
EXPORT_TIME=$((END_TIME - START_TIME))

# 显示文件信息
FILE_SIZE=$(ls -lh "${OUTPUT_DIR}/${OUTPUT_FILE}" | awk '{print $5}')

echo ""
echo "=========================================="
echo "✓ 导出完成！"
echo "=========================================="
echo "文件路径: ${OUTPUT_DIR}/${OUTPUT_FILE}"
echo "文件大小: ${FILE_SIZE}"
echo "导出耗时: ${EXPORT_TIME} 秒"
echo ""
echo "传输到服务器："
echo "  scp ${OUTPUT_DIR}/${OUTPUT_FILE} user@server:/path/"
echo ""
echo "或压缩后传输（节省带宽）："
echo "  gzip ${OUTPUT_DIR}/${OUTPUT_FILE}"
echo "  scp ${OUTPUT_DIR}/${OUTPUT_FILE}.gz user@server:/path/"

