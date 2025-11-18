# Cheestard Terminal Interactive MCP Server

##### This tool enables AI to control multiple terminals and interact through MCP (Model Context Protocol), solving the problem of AI programming tools getting stuck in terminals and not proceeding to the next step. It implements persistent terminal session management - even after the AI conversation is closed, terminal commands continue running. Recommended for Claude Code, Codex, Cursor, Cline, Roocode, Kilocode users, effectively reducing the probability of getting stuck and improving the success rate of automated task execution.

[中文文档](README.md)

As of 2025-11-03, comparison of terminal interaction features in mainstream AI programming tools (please correct me if there are errors 🥲):

| Feature | Cheestard Terminal Interactive | Claude Code | Codex | Cursor | Cline | Roocode | Kilocode | Gemini CLI | Qwen Code | iFlow CLI | Open Code | windsurf | warp | Augment |
|---------|-------------------------------|-------------|-------|--------|-------|---------|----------|-------------|-----------|-----------|-----------|----------|------|---------|
| Input ctrl+c | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Input enter | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| No frequent freezing | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Create multiple terminals in one API request | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View multiple terminal outputs simultaneously | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Close old terminals | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Search strings from terminal | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Input y or n | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Directly input Linux commands in WSL | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Interact with another command-line AI | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| SSH terminal | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Continue using previous terminals after new conversation | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Execute specified scripts before and after command execution | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Execute certain fixed commands before and after command execution | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Attach additional prompts to certain commands to inform AI of correct practices | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Use regular expressions to filter terminal output to save context | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

## ✨ Core Features

### 🔥 Persistent Terminal Sessions
- **Long-running**: Create, reuse, and manage long-running Shell sessions
- **Resume after disconnection**: Terminal continues running after client disconnects, can continue operating after reconnection
- **Multi-session management**: Manage multiple independent terminal sessions simultaneously

### 🧠 Intelligent Output Management
- **Circular buffer**: Configurable size (default 10,000 lines), automatic memory management
- **Multiple read modes**:
  - `full`: Complete output
  - `head`: Read only the first N lines
  - `tail`: Read only the last N lines
  - `head-tail`: Read both beginning and end simultaneously
- **Incremental reading**: Use `since` parameter to read only new content
- **Token estimation**: Automatically estimate token count of output for AI context control

### 🎨 Spinner Animation Compression
- **Automatic detection**: Recognize common progress animation characters (⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏, ◐◓◑◒, etc.)
- **Intelligent throttling**: Reduce noise output from commands like `npm install`, `yarn`, `pnpm`
- **Preserve key information**: Compress animations while retaining real logs
- **Flexible configuration**: Can be controlled via environment variables or parameters

### 🌐 Web Visual Management Interface
- **Real-time terminal**: Based on xterm.js terminal rendering, supports full ANSI colors
- **WebSocket push**: Real-time terminal output display, no refresh needed
- **Interactive operations**: Send commands and view output directly in browser
- **Multi-instance support**: Automatic port allocation, supports multiple AI clients using simultaneously

### 🛡️ Stability Guarantees
- **Output stability detection**: `wait_for_output` tool ensures complete output retrieval
- **Interactive application support**: Supports vim, npm create and other interactive programs
- **ANSI escape sequences**: Correctly handles terminal control characters

## ⚙️ MCP Client Configuration

> ⚠️ Due to `node-pty`, Windows users currently need to use Node.js version 20 or lower. Recommended to use `fnm use 20` https://github.com/Schniz/fnm

> Before configuring MCP clients, it's best to add a rule to your AI programming tool
```plaintext
Always use cheestard-terminal-interactive MCP terminal, prohibit using system prompt's built-in tool functions to execute commands.
```

### 🚀 Streamable HTTP Transport (Recommended)

This project now supports **Streamable HTTP** transport, which has better network compatibility and session management capabilities compared to traditional stdio method.

#### Environment Variable Configuration

Create `.env` file in project root directory:

```bash
# MCP Streamable HTTP server port
MCP_PORT=1106

# Frontend port
FRONTEND_PORT=1107
```

#### Start HTTP Server

```bash
# Start Streamable HTTP MCP server
node dist/http-server.js
```

#### Client Configuration

**All MCP clients that support Streamable HTTP can use the following configuration:**

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

**Advantages:**
- ✅ Better network compatibility
- ✅ Support for multi-client concurrent connections
- ✅ Automatic session management and recovery
- ✅ Detailed error logs and debugging information
- ✅ No need to handle process management issues

---

### 📡 Traditional Stdio Transport

### Claude Desktop

#### macOS / Linux

**Configuration file location**: `~/Library/Application Support/Claude/claude_desktop_config.json`

Add the following content to the configuration file:

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

**Notes**:
- The `-y` parameter will automatically confirm npx download prompts
- If globally installed (`npm install -g cheestard-terminal-interactive`), you can change `command` to `"cheestard-terminal-interactive"` and remove `-y` from `args`

#### Windows

**Configuration file location**: `%APPDATA%\Claude\claude_desktop_config.json`

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

**Notes**:
- Windows needs to call `npx` through `cmd /c`
- If globally installed, you can change `args` to `["/c", "cheestard-terminal-interactive"]`

---

### Claude Code

#### macOS / Linux

Quick add using command line:

```bash
claude mcp add cheestard-terminal-interactive \
  --env MAX_BUFFER_SIZE=10000 \
  --env SESSION_TIMEOUT=86400000 \
  --env COMPACT_ANIMATIONS=true \
  --env ANIMATION_THROTTLE_MS=100 \
  -- npx -y cheestard-terminal-interactive
```

**Or** edit configuration file `~/.claude.json`:

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

> # ⚠️ **Windows Users Please Note**
>
> ## **Claude Code** has parameter parsing issues with `claude mcp add` command on Windows
>
> ### **🚫 Command Line Method Not Recommended**
>
> Please refer to dedicated configuration documentation:
> ### 📖 [《Configuring cheestard-terminal-interactive MCP on Windows》](docs/claude_code/claude-code-windows.md)
>
> This document provides two recommended solutions:
> - ✅ **Project-level configuration** (recommended): Create `.mcp.json` file in project root
> - ✅ **Global configuration**: Use Python script to modify `~/.claude.json`

---

### Cursor / Cline / Roocode / Kilocode
- After git clone, install, build, use example:
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

Add the following configuration to `.codex/config.toml` file:

```toml
# MCP Server Configuration (TOML Format)
# For configuring cheestard-terminal-interactive MCP server

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

Add the following configuration to `.codex/config.toml` file:

```toml
# MCP Server Configuration (TOML Format)
# For configuring cheestard-terminal-interactive MCP server

[mcp_servers.cheestard-terminal-interactive]
command = "cmd"
args = ["/c", "npx", "-y", "cheestard-terminal-interactive"]

[mcp_servers.cheestard-terminal-interactive.env]
MAX_BUFFER_SIZE = "10000"
SESSION_TIMEOUT = "86400000"
COMPACT_ANIMATIONS = "true"
ANIMATION_THROTTLE_MS = "100"
```

**Notes**: Windows needs to call `npx` through `cmd /c`

---

### Environment Variable Description
| Variable | Description | Default Value |
|----------|-------------|---------------|
| `MAX_BUFFER_SIZE` | Maximum buffer lines | 10000 |
| `SESSION_TIMEOUT` | Session timeout (milliseconds) | 86400000 (24 hours) |
| `COMPACT_ANIMATIONS` | Enable spinner compression | true |
| `ANIMATION_THROTTLE_MS` | Animation throttle time (milliseconds) | 100 |
| `MCP_DEBUG` | Enable debug logging | false |

## 🌐 Open Web Management Interface

Tell the AI:
```
Please call the open_terminal_ui tool