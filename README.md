#### 1. Repository Name (仓库名)
`mcp-fleet`， **寓意:** 像指挥一支舰队（Fleet）一样管理你的 MCP 容器群。既体现了 Docker/K8s 的航海文化，又突出了“批量管理”的核心。

#### 2. Short Description (中文简介 - 用于仓库列表显示)
> **中文:** 一个轻量级的企业级 MCP 服务管理平台。基于 Docker，支持 Python 脚本一键部署为 SSE 服务，提供统一网关、鉴权与可视化监控。
>
> **English:** An enterprise-grade MCP Server management platform. Deploy Python scripts as Dockerized SSE services instantly with a unified gateway and observability.

#### 3. About / README Title (中文详细描述)

**标题：**
**MCP-Fleet: Enterprise MCP Server Orchestration Platform**
**(企业级 MCP 服务编排与管理平台)**

**项目介绍 (Introduction):**

MCP-Fleet 是一个专为企业环境设计的 Model Context Protocol (MCP) 服务管理平台。它旨在解决企业内部 MCP Server 数量激增带来的部署、管理和连接难题。

通过标准化容器技术（Docker），MCP-Fleet 允许开发者直接上传 Python 脚本（基于 FastMCP 等框架），平台自动将其构建为独立的 SSE 服务容器，并通过统一的 API 网关（Gateway）暴露给 Cursor、Cherry Studio 或企业内部的大模型应用。

**核心特性 (Key Features):**

* **🐍 脚本即服务 (Script-as-a-Service):** 开发者只需上传 Python 代码，无需编写 Dockerfile，平台自动利用预置镜像启动服务。
* **🐳 容器化隔离 (Docker Isolation):** 每个 MCP Server 运行在独立容器中，互不干扰，彻底解决 Python 依赖地狱。
* **🔌 统一 SSE 网关 (Unified SSE Gateway):** 内置 Nginx/Traefik 适配，通过单一入口自动路由分发，客户端只需配置一个地址。
* **🛡️ 企业级配置 (Enterprise Ready):** 支持环境变量注入、Secrets 敏感信息托管、API Key 鉴权。
* **📊 可观测性 (Observability):** 实时 Web 控制台日志查看（WebSocket），Server 生命周期管理（启动/停止/重启）。

**技术栈 (Tech Stack):**
* **Backend:** Python FastAPI, Docker SDK
* **Frontend:** React / Vue3
* **Protocol:** MCP over SSE (Server-Sent Events)
* **Gateway:** Nginx / Traefik
