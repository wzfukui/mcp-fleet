# MCP Fleet - Enterprise MCP Server Management Platform

An enterprise-grade platform for managing Model Context Protocol (MCP) servers with Docker containerization.

## 🚀 Features

- **Server Management**: Create, update, delete, and manage MCP servers
- **Lifecycle Control**: Start, stop, and restart servers with one click
- **Docker Integration**: Automated containerization with custom base images
- **System Monitoring**: Real-time Docker status, container, and image information
- **Archive Support**: Upload `.py`, `.zip`, `.tar.gz`, `.tar` files
- **Custom Commands**: Configure custom startup commands (e.g., `uv run main.py`)
- **Port Management**: Automatic or fixed port allocation with port pool management
- **Environment Variables**: Secure environment variable management with secret masking
- **Multi-Port Support**: Configure multiple ports for complex service architectures
- **Authentication**: Secure username/password login with JWT
- **Modern UI**: Beautiful, responsive interface built with React and Tailwind CSS

## 📚 Documentation

- [快速开始指南](docs/quick-start.md) - 新功能使用指南和最佳实践
- [部署指南](docs/deployment.md) - 完整的部署说明和故障排查
- [问题修复记录](docs/fixes.md) - 已知问题和解决方案
- [更新日志](CHANGELOG.md) - 版本更新历史

## 📋 Prerequisites

- **Python 3.11+** (for backend)
- **Node.js 18+** (for frontend)
- **Docker** (for running MCP servers)
- **Git**

## 🛠️ Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd mcp-fleet
```

### 2. Build Docker Base Image

```bash
cd backend
docker build -t corp/mcp-base:latest .
cd ..
```

### 3. Start Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 3200
```

### 4. Start Frontend

```bash
cd frontend
npm install
npm run dev  # Runs on port 3100
```

### 5. Access the Platform

- **Frontend**: http://localhost:3100
- **Backend API**: http://localhost:3200
- **Default Credentials**: 
  - Username: `admin`
  - Password: `admin123`

## 📁 Project Structure

```
mcp-fleet/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── main.py         # Main application
│   │   ├── models.py       # Database models
│   │   ├── schemas.py      # Pydantic schemas
│   │   ├── auth.py         # Authentication
│   │   ├── database.py     # Database configuration
│   │   └── services/
│   │       └── docker_manager.py  # Docker SDK integration
│   ├── bootstrap.py        # Container bootstrap script
│   ├── Dockerfile          # Base image for MCP servers
│   └── requirements.txt    # Python dependencies
├── frontend/               # React frontend
│   ├── src/
│   │   ├── features/       # Feature modules
│   │   ├── components/     # Reusable components
│   │   ├── lib/           # Utilities and API client
│   │   └── routes/        # TanStack Router routes
│   └── package.json       # Node.js dependencies
├── docs/                  # Documentation
│   ├── quick-start.md     # Quick start guide
│   ├── deployment.md      # Deployment guide
│   └── fixes.md           # Bug fixes and solutions
├── prd.md                 # Product Requirements Document
├── CHANGELOG.md           # Version history
└── build_and_run.sh       # Build automation script
```

## 🔧 Configuration

### Backend Ports

Set the backend port via environment variable or command line:

```bash
uvicorn app.main:app --port 3200
```

### Frontend Ports

Configure in `frontend/.env`:

```env
VITE_PORT=3100
VITE_API_URL=http://localhost:3200/api
```

### Data Storage

- **Development**: `./backend/mcp_data/`
- **Production**: `/opt/mcp-platform/data/`

The backend automatically falls back to local storage if production path is not writable.

## 🐳 Docker Base Image

The base image (`corp/mcp-base:latest`) includes:

- Python 3.11
- `uv` package manager
- MCP SDK (`mcp[sse]`)
- FastAPI, Uvicorn, Pandas, Httpx
- Bootstrap script for dynamic code loading

### Custom Commands

When creating a server, you can specify custom startup commands:

- **Command**: `uv`
- **Arguments**: `run main.py`

This allows flexibility in how your MCP server starts.

## 📚 API Documentation

Once the backend is running, visit:

- **Swagger UI**: http://localhost:3200/docs
- **ReDoc**: http://localhost:3200/redoc

## 🔐 Authentication

The platform uses JWT-based authentication:

1. Login at `/sign-in`
2. Token is stored in browser localStorage
3. Token is automatically attached to all API requests
4. Token expires after 30 days

### Default User

- **Username**: `admin`
- **Password**: `admin123`

**⚠️ Change this in production!** Edit `backend/app/auth.py` to update credentials.

## 🚢 Deployment

See [部署指南](docs/deployment.md) for detailed deployment instructions.

### Quick Deploy

```bash
# Build Docker image
cd backend && docker build -t corp/mcp-base:latest . && cd ..

# Start backend (production)
cd backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 3200

# Build and serve frontend (production)
cd frontend
npm run build
npm run preview  # Or use nginx/apache
```

## 🧪 Development

### Backend Development

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 3200
```

### Frontend Development

```bash
cd frontend
npm run dev
```

### Database Schema Changes

If you modify `backend/app/models.py`, delete the database to recreate it:

```bash
rm backend/mcp_platform.db
# Restart backend - tables will be auto-created
```

## 📖 Usage Guide

### Creating an MCP Server

1. Click "Create Server" button
2. Fill in:
   - **Name**: Unique identifier
   - **Description**: Optional description
   - **Entry Object**: Python object name (default: `mcp`)
   - **Environment Variables**: Add key-value pairs (mark sensitive ones as secrets)
   - **Ports**: Optional ports (comma-separated for multiple, or leave empty for auto-allocation)
   - **Command**: Optional custom command (e.g., `uv`)
   - **Arguments**: Optional args (e.g., `run main.py`)
   - **File**: Upload `.py` file or archive (`.zip`, `.tar.gz`)
3. Click "Create"

For detailed usage instructions, see the [快速开始指南](docs/quick-start.md).

### Managing Servers

- **Start**: Launches Docker container
- **Stop**: Stops and removes container
- **Restart**: Stop + Start
- **Settings**: Edit configuration (server must be stopped)
- **Delete**: Remove server and data

### System Status

View real-time information about:
- Docker service status and version
- Running containers
- Available images

## 🛠️ Troubleshooting

### Docker Not Running

**Error**: "Docker service is not running"

**Solution**: Start Docker Desktop or Docker daemon

### Port Conflicts

**Error**: "Port conflict: Requested port X is not available"

**Solution**: 
- Stop the service using that port
- Or specify a different port in server settings

### Database Errors

**Error**: "no such column: mcp_servers.X"

**Solution**: Delete and recreate database:
```bash
rm backend/mcp_platform.db
# Restart backend
```

## 🤝 Contributing

This is an internal enterprise platform. For contributions:

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

Internal use only - All rights reserved.

## 🙏 Acknowledgments

Built with:
- [FastAPI](https://fastapi.tiangolo.com/)
- [React](https://react.dev/)
- [TanStack Router](https://tanstack.com/router)
- [Shadcn UI](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Docker SDK for Python](https://docker-py.readthedocs.io/)
- [MCP SDK](https://modelcontextprotocol.io/)

---

**Version**: 1.1.0  
**Last Updated**: December 2025
