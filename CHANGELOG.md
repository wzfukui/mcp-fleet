# 更新日志

## [未发布] - 2025-12-03

### ✨ 新增功能

#### 1. 创建服务器对话框优化
- 对话框尺寸从 600px 增加到 900px，高度从 90vh 增加到 95vh
- 所有界面文本本地化为中文
- 新增环境变量管理功能：
  - 支持添加任意数量的环境变量
  - 支持标记密钥类型的环境变量
  - 密钥类型的值默认隐藏，可通过眼睛图标切换显示
  - 提供友好的添加/删除界面
- 端口配置优化：
  - 支持逗号分隔的多端口输入（如：8000,8001,8002）
  - 留空时自动从端口池分配

#### 2. 端口池管理系统
- 新增端口池状态 API (`GET /api/system/ports`)
- 系统状态页面新增"端口池状态"卡片，包含：
  - 端口池范围和总数统计
  - 已使用/可用端口数量
  - 端口使用率可视化进度条
  - 详细的端口分配表（显示每个端口对应的服务器）
  - 可用端口示例列表

### 🔧 改进

#### 后端
- **数据模型更新** (`backend/app/models.py`)
  - `MCPServer` 模型：
    - 新增 `ports` 字段（存储用户配置的端口列表）
    - 新增 `host_ports` 字段（存储实际分配的端口映射）
    - 移除旧的 `port` 字段
  
- **API 增强** (`backend/app/main.py`)
  - `POST /api/servers` 端点：
    - 新增 `env_vars` 参数接收环境变量 JSON
    - 新增 `ports` 参数替代 `port`
    - 自动将环境变量存储到数据库
  - `POST /api/servers/{id}/action` 端点：
    - 支持解析多端口配置
    - 启动时将环境变量安全传递给容器
    - 保存完整的端口映射信息
  - 新增 `GET /api/system/ports` 端点：
    - 返回端口池使用情况
    - 显示端口分配详情

- **Docker 管理优化** (`backend/app/services/docker_manager.py`)
  - `run_container` 方法：
    - 参数 `requested_port` 改为 `requested_ports` 列表
    - 支持多端口映射
    - 自动为每个端口分配容器内端口（8000, 8001, 8002...）
    - 返回完整的端口映射字典

#### 前端
- **API 类型定义** (`frontend/src/lib/api.ts`)
  - 新增 `PortPoolStatus` 接口
  - 新增 `getPortPoolStatus` API 方法
  - 更新 `MCPServer` 接口支持新的端口字段

- **系统状态页面** (`frontend/src/features/system-status/index.tsx`)
  - 新增端口池状态卡片
  - 所有文本本地化为中文
  - 同时获取系统状态和端口池状态

- **UI 组件**
  - 新增 `Progress` 组件 (`frontend/src/components/ui/progress.tsx`)

### 📝 文档
- 新增 `UPDATES.md` - 详细的功能更新说明
- 新增 `CHANGELOG.md` - 本更新日志

### 🔒 安全性
- 环境变量通过 Docker 环境变量机制安全传递给容器
- 密钥类型的环境变量在界面上默认隐藏
- 预留 `is_secret` 字段用于未来的加密存储实现

### ⚠️ 破坏性变更
- 数据库模型变更：
  - `mcp_servers.port` 字段被 `ports` 和 `host_ports` 替代
  - 需要数据迁移（如果有现有数据）

### 📋 待办事项
- [ ] 实现环境变量的加密存储
- [ ] 添加端口池范围的配置化支持
- [ ] 实现端口自动回收机制
- [ ] 支持从文件批量导入环境变量

## 文件变更清单

### 新增文件
- `frontend/src/components/ui/progress.tsx`
- `UPDATES.md`
- `CHANGELOG.md`

### 修改文件
- `frontend/src/features/dashboard/components/create-server-dialog.tsx`
- `frontend/src/features/system-status/index.tsx`
- `frontend/src/lib/api.ts`
- `backend/app/models.py`
- `backend/app/schemas.py`
- `backend/app/main.py`
- `backend/app/services/docker_manager.py`

### 数据库变更
```sql
-- 需要执行的迁移（仅供参考）
ALTER TABLE mcp_servers ADD COLUMN ports TEXT;
ALTER TABLE mcp_servers ADD COLUMN host_ports TEXT;
-- 可选：如果确认不再需要旧字段
-- ALTER TABLE mcp_servers DROP COLUMN port;
```

