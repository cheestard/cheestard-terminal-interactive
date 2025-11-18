# Cheestard Terminal Interactive MCP Server

##### 本工具能让AI控制多个终端，并通过 MCP（模型上下文协议）进行交互，解决一些AI编程工具的终端卡住不再继续下一步的问题，实现持久化终端会话管理，即使与AI的对话关闭，终端命令也会继续运行。推荐Claude Code、Codex、Cursor、Cline、Roocode、Kilocode用户使用，能够有效减少不卡住的概率，提升自动化任务进行的成功概率。


[English](README.en.md)


截至2025-11-03，主流AI编程工具终端交互功能对比（如有错误，请告诉我修正🥲）：

| 功能 | Cheestard Terminal Interactive | Claude Code | Codex | Cursor | Cline | Roocode | Kilocode | Gemini CLI | Qwen Code | iFlow CLI | Open Code | windsurf | warp | Augment |
|------|-------------------------------|-------------|-------|--------|-------|---------|----------|-------------|-----------|-----------|-----------|----------|------|---------|
| 输入ctrl+c | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| 输入回车 | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| 没有经常卡住不工作 | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| 一次API请求创建多个终端 | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 同时查看多个终端输出 | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 关闭旧的终端 | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 从终端搜索字符串 | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 输入y或n | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| 直接在WSL输入Linux命令 | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 和另一个命令行AI交互 | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| SSH终端 | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| 新建对话后可继续使用之前的终端 | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 在执行命令前后执行指定脚本 | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 在执行命令前后执行某些固定命令 | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 执行某些命令附加额外提示词告知AI正确的做法 | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 使用正则表达式过滤终端输出从而节省上下文 | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |


## ✨ 核心特性

### 🔥 持久化终端会话
- **长期运行**：创建、复用、管理长期运行的 Shell 会话
- **断线续传**：客户端断开后终端继续运行，重连后可继续操作
- **多会话管理**：同时管理多个独立的终端会话

### 🧠 智能输出管理
- **循环缓冲区**：可配置大小（默认 10,000 行），自动管理内存
- **多种读取模式**：
  - `full`：完整输出
  - `head`：只读取开头 N 行
  - `tail`：只读取末尾 N 行
  - `head-tail`：同时读取开头和末尾
- **增量读取**：使用 `since` 参数只读取新增内容
- **Token 估算**：自动估算输出的 token 数量，方便 AI 控制上下文

### 🎨 Spinner 动画压缩
- **自动检测**：识别常见的进度动画字符（⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏, ◐◓◑◒ 等）
- **智能节流**：减少 `npm install`、`yarn`、`pnpm` 等命令的噪音输出
- **保留关键信息**：压缩动画的同时保留真实日志
- **灵活配置**：可通过环境变量或参数控制开关

### 🌐 Web 可视化管理界面
- **实时终端**：基于 xterm.js 的终端渲染，支持完整 ANSI 颜色
- **WebSocket 推送**：终端输出实时显示，无需刷新
- **交互操作**：直接在浏览器中发送命令、查看输出
- **多实例支持**：自动端口分配，支持多个 AI 客户端同时使用

### 🛡️ 稳定性保障
- **输出稳定检测**：`wait_for_output` 工具确保获取完整输出
- **交互式应用支持**：支持 vim、npm create 等交互式程序
- **ANSI 转义序列**：正确处理终端控制字符



## ⚙️ MCP 客户端配置

> ⚠️ 由于 `node-pty` 的缘故，Windows 用户目前需要使用不大于 Node.js 20 的版本才能正常使用，推荐使用 `fnm use 20` https://github.com/Schniz/fnm

> 在配置MCP客户端之前，最好对你的AI编程工具加一条规则
```plaintext
务必使用cheestard-terminal-interactive这个MCP终端，禁止用系统提示词自带的工具函数执行命令。
```

### 🚀 Streamable HTTP 传输方式（推荐）

本项目现已支持 **Streamable HTTP** 传输方式，相比传统的 stdio 方式具有更好的网络兼容性和会话管理能力。

#### 环境变量配置

在项目根目录创建 `.env` 文件：

```bash
# MCP Streamable HTTP 服务器端口
MCP_PORT=1106

# 前端端口
FRONTEND_PORT=1107
```

#### 启动 HTTP 服务器

```bash
# 启动 Streamable HTTP MCP 服务器
node dist/http-server.js
```

#### 客户端配置

**所有支持 Streamable HTTP 的 MCP 客户端都可以使用以下配置：**

```json
{
  "mcpServers": {
    "cheestard-terminal-interactive": {
      "transport": "streamable_http",
      "url": "http://localhost:1106/mcp",
      "headers": {
        "Content-Type": "application/json"
      }
    }
  }
}
```

**优势：**
- ✅ 更好的网络兼容性
- ✅ 支持多客户端并发连接
- ✅ 自动会话管理和恢复
- ✅ 详细的错误日志和调试信息
- ✅ 无需处理进程管理问题

---

### 📡 传统 Stdio 传输方式

### Claude Desktop

#### macOS / Linux

**配置文件位置**: `~/Library/Application Support/Claude/claude_desktop_config.json`

在配置文件中添加以下内容：

```json
{
  "mcpServers": {
    "cheestard-terminal-interactive": {
      "command": "npx",
      "args": ["-y", "cheestard-terminal-interactive"],
      "env": {
        "MAX_BUFFER_SIZE": "10000",
        "SESSION_TIMEOUT": "86400000",
        "COMPACT_ANIMATIONS": "true",
        "ANIMATION_THROTTLE_MS": "100"
      }
    }
  }
}
```

**说明**：
- `-y` 参数会自动确认 npx 的下载提示
- 若已全局安装（`npm install -g cheestard-terminal-interactive`），可将 `command` 改为 `"cheestard-terminal-interactive"` 并移除 `args` 中的 `-y`

#### Windows

**配置文件位置**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "cheestard-terminal-interactive": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "cheestard-terminal-interactive"],
      "env": {
        "MAX_BUFFER_SIZE": "10000",
        "SESSION_TIMEOUT": "86400000",
        "COMPACT_ANIMATIONS": "true",
        "ANIMATION_THROTTLE_MS": "100"
      }
    }
  }
}
```

**说明**：
- Windows 需要通过 `cmd /c` 来调用 `npx`
- 若已全局安装，可将 `args` 改为 `["/c", "cheestard-terminal-interactive"]`

---

### Claude Code

#### macOS / Linux

使用命令行快速添加：

```bash
claude mcp add cheestard-terminal-interactive \
  --env MAX_BUFFER_SIZE=10000 \
  --env SESSION_TIMEOUT=86400000 \
  --env COMPACT_ANIMATIONS=true \
  --env ANIMATION_THROTTLE_MS=100 \
  -- npx -y cheestard-terminal-interactive
```

**或者**编辑配置文件 `~/.claude.json`：

```json
{
  "mcpServers": {
    "cheestard-terminal-interactive": {
      "command": "npx",
      "args": ["-y", "cheestard-terminal-interactive"],
      "env": {
        "MAX_BUFFER_SIZE": "10000",
        "SESSION_TIMEOUT": "86400000",
        "COMPACT_ANIMATIONS": "true",
        "ANIMATION_THROTTLE_MS": "100"
      }
    }
  }
}
```

#### Windows

> # ⚠️ **Windows 用户请注意**
>
> ## **Claude Code** 在 Windows 下 `claude mcp add` 命令存在参数解析问题
>
> ### **🚫 不推荐使用命令行方式**
>
> 请参考专门的配置文档：
> ### 📖 [《Windows 下配置 cheestard-terminal-interactive MCP》](docs/claude_code/claude-code-windows.md)
>
> 该文档提供了两种推荐方案：
> - ✅ **项目级配置**（推荐）：在项目根目录创建 `.mcp.json` 文件
> - ✅ **全局配置**：使用 Python 脚本修改 `~/.claude.json`

---

### Cursor / Cline / Roocode / Kilocode
- git clone、install、build后使用例子：
```plaintext
"cheestard-terminal-interactive": {
  "command": "cmd",
  "args": [
    "/c",
    "fnm exec --using=20 -- node d:/CodeRelated/cheestard-terminal-interactive/dist/index.js"
  ],
  "env": {
    "MAX_BUFFER_SIZE": "10000",
    "SESSION_TIMEOUT": "86400000",
    "COMPACT_ANIMATIONS": "true",
    "ANIMATION_THROTTLE_MS": "100",
    "MCP_DEBUG": "true"
  }
}
```


### Codex

#### macOS / Linux

在 `.codex/config.toml` 文件中添加以下配置：

```toml
# MCP Server Configuration (TOML Format)
# 用于配置 cheestard-terminal-interactive MCP 服务器

[mcp_servers.cheestard-terminal-interactive]
command = "npx"
args = ["-y", "cheestard-terminal-interactive"]

[mcp_servers.cheestard-terminal-interactive.env]
MAX_BUFFER_SIZE = "10000"
SESSION_TIMEOUT = "86400000"
COMPACT_ANIMATIONS = "true"
ANIMATION_THROTTLE_MS = "100"
```

#### Windows

在 `.codex/config.toml` 文件中添加以下配置：

```toml
# MCP Server Configuration (TOML Format)
# 用于配置 cheestard-terminal-interactive MCP 服务器

[mcp_servers.cheestard-terminal-interactive]
command = "cmd"
args = ["/c", "npx", "-y", "cheestard-terminal-interactive"]

[mcp_servers.cheestard-terminal-interactive.env]
MAX_BUFFER_SIZE = "10000"
SESSION_TIMEOUT = "86400000"
COMPACT_ANIMATIONS = "true"
ANIMATION_THROTTLE_MS = "100"
```

**说明**：Windows 需要通过 `cmd /c` 来调用 `npx`

---

### 环境变量说明
| 变量 | 说明 | 默认值 |
|------|------|--------|
| `MAX_BUFFER_SIZE` | 缓冲区最大行数 | 10000 |
| `SESSION_TIMEOUT` | 会话超时时间（毫秒） | 86400000 (24小时) |
| `COMPACT_ANIMATIONS` | 是否启用 Spinner 压缩 | true |
| `ANIMATION_THROTTLE_MS` | 动画节流时间（毫秒） | 100 |
| `MCP_DEBUG` | 是否启用调试日志 | false |


## 🌐 Web 管理界面打开

对AI说：
```
请调用open_terminal_ui工具
```
