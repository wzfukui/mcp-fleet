#!/bin/bash
set -e

# Configuration
IMAGE_NAME="corp/mcp-base:latest"
BACKEND_DIR="./backend"

echo "========================================"
echo "   MCP Fleet - Build & Deploy Script"
echo "========================================"

# 1. Check for Docker
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed or not in PATH."
    exit 1
fi

# 2. Build Backend Base Image
echo "[1/3] Building Backend Base Image ($IMAGE_NAME)..."
cd $BACKEND_DIR
if [ -f "Dockerfile" ]; then
    docker build -t $IMAGE_NAME .
else
    echo "Error: Dockerfile not found in $BACKEND_DIR"
    exit 1
fi
cd ..

# 3. Setup Backend Environment
echo "[2/3] Setting up Python Environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "Created virtual environment."
fi

source venv/bin/activate
pip install -r backend/requirements.txt
echo "Dependencies installed."

# 4. Instructions
echo "========================================"
echo "Build Complete!"
echo "========================================"
echo "To run the platform:"
echo ""
echo "1. Start Backend:"
echo "   source venv/bin/activate"
echo "   uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000"
echo ""
echo "2. Start Frontend (in a new terminal):"
echo "   cd frontend"
echo "   npm install"
echo "   npm run dev"
echo ""
echo "Note: Ensure port 8000 (API) and 5173 (Frontend) are open."

