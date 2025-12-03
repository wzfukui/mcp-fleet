# MCP Fleet Deployment Guide

## Prerequisites

- **OS**: Linux (Ubuntu 22.04 recommended) or macOS.
- **Docker**: Must be installed and running (`docker info` should work).
- **Python**: 3.10+
- **Node.js**: 18+ (for building the frontend)

## Quick Start (Remote Server)

1. **Upload Code**:
   Upload this entire project folder to your server.

2. **Build & Run**:
   Run the provided helper script:
   ```bash
   chmod +x build_and_run.sh
   ./build_and_run.sh
   ```

   This script will:
   - Build the `corp/mcp-base` Docker image.
   - Set up a Python virtual environment.
   - (Manual Step) You need to start the services as printed by the script.

## Manual Deployment Steps

### 1. Build Base Docker Image
The platform relies on a "Fat Image" to run user code quickly.

```bash
cd backend
docker build -t corp/mcp-base:latest .
cd ..
```

### 2. Start Backend API
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt

# Start API (Port 3200)
# Ensure you are in the project root
uvicorn backend.app.main:app --host 0.0.0.0 --port 3200
```

### 3. Start Frontend
```bash
cd frontend
npm install
VITE_PORT=3100 npm run dev -- --host
```
Access the dashboard at `http://YOUR_SERVER_IP:3100`.

## Configuration

- **Data Storage**: By default, data is stored in `/opt/mcp-platform/data`. Ensure your user has write permissions there, or modify `backend/app/main.py` and `backend/app/services/docker_manager.py` to change `HOST_DATA_ROOT`.
- **CORS**: Configurable via env var `ALLOWED_ORIGINS` (comma separated). Default allows `http://localhost:3100` and `http://localhost:5173`.
- **Ports**: 
    - Frontend: Default `3100` (configure via `VITE_PORT`).
    - Backend: Default `3200` (configure via uvicorn command args).
