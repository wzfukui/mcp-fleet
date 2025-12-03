这份 PRD 文档是专门为\*\*“辅助 AI 编写代码”\*\*而优化的。它结构清晰、逻辑严密，并且明确了技术栈和数据结构，你可以直接将这份文档发给 Cursor、Windsurf 或 ChatGPT，让它帮你生成核心代码。

-----

# 产品需求文档 (PRD): 企业级 MCP Server 管理平台 (EMCP-Platform)

**版本号:** v1.0
**状态:** 草稿 (Draft)
**最后更新:** 2025-12-03

## 1\. 项目背景与目标

### 1.1 背景

随着企业内部 MCP (Model Context Protocol) Server 数量的增加，单纯依靠手工部署（Docker Run）难以维护。我们需要一个统一的 PaaS（Platform as a Service）平台，让开发者可以上传代码，平台自动容器化运行，并提供统一的生命周期管理和外部访问入口。

### 1.2 目标

构建一个 Web 管理平台，实现：

  * **代码托管与运行：** 支持上传 Python 脚本，基于标准镜像运行。
  * **配置管理：** 统一管理环境变量（ENV）和敏感信息（Secrets）。
  * **生命周期管理：** Start / Stop / Restart / Delete。
  * **可观测性：** 实时查看运行日志。
  * **统一接入：** 自动分配端口，展示供客户端（如 Cherry Studio）连接的 SSE URL。

-----

## 2\. 技术架构规范 (Technical Spec)

### 2.1 核心技术栈 (推荐给 AI 的指令)

  * **后端:** Python FastAPI (异步高性能，适合管理 Docker IO)。
  * **前端:** React + Tailwind CSS (或 Vue3 + Element Plus)，追求简洁的 Dashboard 风格。
  * **数据库:** SQLite (MVP阶段) / PostgreSQL (生产环境)。
  * **容器交互:** Docker SDK for Python。
  * **协议:** 仅支持 HTTP/SSE，不支持 Stdio。

### 2.2 标准化容器构建规范 (Crucial)

这是你要求的\*\*“如何构建容器”**的核心定义。我们将采用**“预置大镜像 (Fat Base Image) + 代码挂载”\*\*的模式，以秒级启动。

#### A. 基础镜像定义 (Dockerfile)

请基于此逻辑构建基础镜像 `corp/mcp-base:latest`：

```dockerfile
# 使用轻量级但完整的 Python 环境
FROM python:3.11-slim

# 设置工作目录
WORKDIR /app

# 1. 安装系统级依赖 (如果有)
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# 2. 安装 Python 核心依赖 (预装常用包)
# mcp[sse]: MCP 协议核心库
# fastapi uvicorn: Web 服务
# pandas numpy requests: 数据分析与网络请求常用库
RUN pip install --no-cache-dir \
    "mcp[sse]" \
    fastapi \
    uvicorn[standard] \
    requests \
    pandas \
    httpx

# 3. 定义默认启动入口脚本 (bootstrap.py)
# 这个脚本负责加载用户的 server.py 并启动 Uvicorn
COPY bootstrap.py /app/bootstrap.py

# 暴露默认端口
EXPOSE 8000

# 启动命令
CMD ["python", "bootstrap.py"]
```

#### B. 运行时挂载逻辑

当用户上传代码（假设文件名为 `user_script.py`）时，后端不进行 `docker build`，而是直接 `docker run`：

1.  **代码存放:** 宿主机目录 `/opt/mcp-platform/data/{server_id}/app`。
2.  **挂载:** 将上述目录挂载到容器内的 `/app/user_code`。
3.  **启动命令:** 容器内的 `bootstrap.py` 会动态 import `/app/user_code/user_script.py` 中的 `mcp` 实例，并启动 Uvicorn SSE 服务。

-----

## 3\. 功能需求详细描述 (Functional Requirements)

### 3.1 仪表盘 (Dashboard)

  * **概览数据:** 当前运行中的 Server 数量、停止的数量、系统资源占用（可选）。
  * **Server 列表:** 卡片式展示。
      * 显示内容：Server 名称、ID、状态 (Running/Stopped/Error)、对应端口、创建者。
      * 快捷操作：启动、停止、重启、查看日志。

### 3.2 创建与编辑 Server (Server Management)

**输入表单字段:**

1.  **名称 (Name):** 唯一标识，如 `finance-tool`。
2.  **代码源 (Source):**
      * 方式一：文件上传 (Upload `.py` file)。
      * 方式二：在线编辑器粘贴代码。
3.  **入口对象 (Entry Object):** 默认为 `mcp` (代码中定义的 FastMCP 实例变量名)。
4.  **描述 (Description):** 用于生成的 SSE endpoint 描述。

### 3.3 环境变量与配置 (Environment Variables)

  * **功能:** 允许用户添加 Key-Value 对。
  * **类型:**
      * `Plain Text`: 明文显示。
      * `Secret`: 界面显示为 `******`，仅在注入容器时解密。
  * **逻辑:** 启动容器时，将这些 KV 转换为 Docker 的 `-e KEY=VALUE` 参数。

### 3.4 生命周期控制 (Lifecycle)

  * **启动 (Start):**
      * 分配宿主机空闲端口 (范围如 30000-40000)。
      * 组装 `docker run` 命令并执行。
      * 更新数据库状态为 `Running`。
  * **停止 (Stop):** 发送 SIGTERM 给容器，等待优雅退出，更新状态为 `Stopped`。
  * **重启 (Restart):** Stop -\> Start。

### 3.5 日志查看器 (Log Viewer)

  * **界面:** 黑色背景控制台风格。
  * **实现:**
      * 后端通过 `container.logs(stream=True)` 读取 Docker stdout/stderr。
      * 通过 WebSocket 推送到前端展示。
      * 支持“自动滚动”和“暂停滚动”。

### 3.6 连接信息 (Connection Info)

  * **生成的 SSE URL:** `http://{gateway_host}/api/{server_name}/sse` (这是给 Cherry Studio 用的)。
  * **一键复制:** 提供按钮复制完整 URL。

-----

## 4\. 数据模型设计 (Data Schema)

请依据此 Schema 进行数据库设计（SQLAlchemy 风格）：

```python
class MCPServer(Base):
    __tablename__ = "mcp_servers"

    id = Column(String, primary_key=True)  # UUID
    name = Column(String, unique=True, index=True) # 英文标识，用于路由
    description = Column(String)
    
    # 代码存储路径
    source_code_path = Column(String) 
    entry_object = Column(String, default="mcp") # 代码里的实例名
    
    # 运行时状态
    status = Column(Enum("stopped", "running", "error", "building"))
    container_id = Column(String, nullable=True) # Docker Container ID
    host_port = Column(Integer, nullable=True) # 分配的宿主机端口
    
    created_at = Column(DateTime)
    updated_at = Column(DateTime)

class EnvironmentVariable(Base):
    __tablename__ = "env_vars"

    id = Column(Integer, primary_key=True)
    server_id = Column(String, ForeignKey("mcp_servers.id"))
    key = Column(String)
    value = Column(String) # 若是 Secret，建议加密存储
    is_secret = Column(Boolean, default=False)
```

-----

## 5\. API 接口定义 (Internal API)

前端与后端交互的主要接口：

  * `GET /api/servers`: 获取所有 Server 列表。
  * `POST /api/servers`: 创建新 Server (上传文件)。
  * `POST /api/servers/{id}/action`: 执行动作 (body: `{"action": "start" | "stop" | "restart"}`)。
  * `GET /api/servers/{id}/logs`: WebSocket 连接端点。
  * `PUT /api/servers/{id}/env`: 更新环境变量。

-----

## 6\. 非功能性需求 (NFR)

1.  **错误处理:** 如果容器启动失败（如代码语法错误），必须捕获 Docker exit code，并将错误日志展示在前端，且将状态置为 `Error`。
2.  **端口管理:** 系统需要维护一个“端口池”机制，确保分配的端口不冲突。
3.  **安全性:**
      * 用户上传的代码必须运行在非 root 用户下（在 Dockerfile 中指定 `USER appuser`）。
      * API 接口需要简单的 Token 鉴权（防止未授权访问管理后台）。

-----

## 7\. 给 AI 的开发提示 (Prompt Suggestion)

**如果你要让 AI 写代码，请把下面这段话附在最后：**

> **Task:**
> 基于上述 PRD，请使用 Python FastAPI 和 Docker SDK 编写后端核心代码。
>
> **Requirements:**
>
> 1.  实现 `DockerManager` 类，封装 `run_container`, `stop_container`, `get_logs` 方法。
> 2.  在 `run_container` 中，使用 `volumes` 将本地代码挂载到容器内，并使用环境变量注入配置。
> 3.  实现自动寻找空闲端口的逻辑。
> 4.  确保容器启动命令适配 `fastapi` 或 `mcp[sse]` 的启动方式。

===========前期讨论背景材料，供参考=================
你的思考非常敏锐，直接切中了平台工程中\*\*“资源效率 vs 隔离性”**以及**“网络路由复杂性”\*\*这两个核心矛盾。

咱们把这两个问题拆开揉碎了聊，你会发现你的担忧是有道理的，但现代容器技术其实已经帮你解决了大部分顾虑。

### 一、 关于资源：20 个容器会比 20 个进程重很多吗？

**结论：几乎不会。在 Linux 上，Docker 容器本质上就是加了隔离壳的进程。**

1.  **误区澄清：**

      * 很多人觉得容器是虚拟机（VM），每个都要起一个操作系统，那肯定重。
      * 但实际上，容器只是**进程（Process）**。当你启动 20 个 Python 容器时，操作系统内核只认为它运行了 20 个 Python 进程。
      * **CPU 和内存开销：** 20 个容器里的 Python 进程，和你在宿主机直接起 20 个 Python 进程，消耗的 CPU 和内存是**几乎一样**的。额外的开销仅在于 Docker 守护进程维护的一点点元数据（极小）。

2.  **你的“预装基础镜像”方案（Fat Image）非常棒：**

      * 你说“提供一个基础镜像，把常用包都预装好”，这是 **FaaS（函数即服务）** 的标准做法。
      * **磁盘空间复用（Layer Sharing）：** 如果你起 20 个容器，它们都基于同一个 `my-company-mcp-base:v1` 镜像。Docker 足够聪明，底层的 Linux 文件系统和 Python 库在磁盘上**只存一份**，内存里的只读数据甚至可以共享。
      * **启动速度：** 因为不用安装依赖，启动就是毫秒级的。

3.  **为什么还是建议用容器，而不是直接跑进程？**

      * **文件系统隔离（最重要）：** 员工 A 的代码写了个临时文件到 `/tmp`，员工 B 的代码也写了个 `/tmp`。如果是直接跑进程，会互相覆盖甚至报错。容器让每个人都有自己独立的 `/tmp`。
      * **依赖冲突：** 虽然你预装了通用包，但万一员工 A 需要 `pandas==1.5`，员工 B 需要 `pandas==2.0` 呢？直接跑进程会打架（Dependency Hell）。容器允许他们在通用镜像基础上，只安装自己特殊的那个包，互不影响。
      * **资源限制（Cgroups）：** 这一点企业里很关键。你可以给容器加参数 `--memory="512m"`。如果员工 A 写了个死循环把内存吃光了，容器会被 Kill 掉，而不会把你整台宿主机搞死机，影响其他 19 个服务。

### 二、 关于网络：网关、端口与代理

你理解得很对：“单个代理来说，我们倒不用担心端口和路径的问题”。

1.  **内部端口 vs 外部端口：**

      * **容器内部：** 所有的 MCP Server 都可以写死监听 `8000` 端口。因为容器网络是隔离的，Server A 的 8000 和 Server B 的 8000 互不冲突。
      * **宿主机/网关层面：**
          * **方案 A（随机端口映射）：** Server A 映射到宿主机 30001，Server B 映射到 30002。网关配置转发规则。
          * **方案 B（容器 IP 转发 - 推荐）：** 如果你在网关（如 Nginx/Traefik）里能直接访问容器网络（比如都在同一个 Docker Network 桥接网络里），你甚至不需要映射到宿主机端口。网关直接转发请求到 `http://<container-ip>:8000`。

2.  **网关的作用（The "Magic" Layer）：**
    这就回答了你的问题。对于**使用者**（Cherry Studio 用户）来说，他根本不知道后面有 20 个端口。

      * **用户看到的地址：** `https://mcp.your-corp.com/api/server-a/sse`
      * **网关做的事情：** 收到请求 -\> 解析 URL `/server-a/` -\> 查找路由表 -\> 转发给内部容器 `172.18.0.5:8000`。

### 三、 修正后的架构建议（轻量化版）

结合你的补充，我觉得你们目前最务实的架构应该是这样的：

1.  **基础镜像策略 (Base Image Strategy):**

      * 维护一个 `mcp-python-base` 镜像。
      * 内置：`python 3.11`, `mcp-sdk[sse]`, `fastapi`, `uvicorn`, `requests`, `pandas` (常用的大包)。
      * 约定：用户上传的代码入口统一叫 `server.py`，必须暴露一个 `app` 对象。

2.  **启动流程 (The Process):**

      * 用户上传代码。
      * 平台检查：如果用户没有 `requirements.txt` 或依赖都在基础镜像里，直接挂载代码文件进容器启动（连构建镜像都省了，速度最快）。
      * 命令参考：
        ```bash
        # 伪代码：直接挂载代码运行，利用基础镜像环境
        docker run -d \
          --name mcp-user-a \
          --network mcp-net \
          -v /data/users/a/code:/app \
          -e API_KEY=xxx \
          --memory 512m \
          mcp-python-base \
          uvicorn server:app --host 0.0.0.0 --port 8000
        ```

3.  **协议确认 (Protocol):**

      * **非常赞同砍掉 Stdio。** 在企业联网环境，SSE (Server-Sent Events) over HTTP 是唯一正解。
      * 它天然穿透防火墙，支持 Nginx 反代，且能维持长连接推送消息（MCP 的核心需求）。

### 总结

  * **资源担忧？** 只要用共享基础镜像，容器开销 ≈ 进程开销，但换来了宝贵的隔离性和安全性。**放心上容器。**
  * **网络麻烦？** 引入一个支持动态发现的网关（Traefik 是神器，或者 Nginx 脚本重载），对外暴露统一域名，内部自动调度。用户无感，你也方便管理。

**下一步：**
既然决定用 SSE 和网关，你需要考虑\*\*鉴权（Authentication）\*\*的问题了。

  * 现在的 MCP 协议原生对鉴权支持比较弱。
  * 如果 Cherry Studio 连接你的网关，你打算怎么验证这个请求是合法员工发起的？是网关层统一加个 Token，还是透传给每个 Server 自己验证？这可能是下一个坑点。

=========背景材料结束======================