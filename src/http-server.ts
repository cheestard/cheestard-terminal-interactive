#!/usr/bin/env node

import express from 'express';
import { randomUUID } from 'node:crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { CheestardTerminalInteractiveServer } from './mcp-server.js';
import { fileURLToPath } from 'url';
import { realpathSync } from 'fs';

export { CheestardTerminalInteractiveServer } from './mcp-server.js';
export { TerminalManager } from './terminal-manager.js';
export { WebUIManager } from './web-ui-manager.js';
export { WebUIServer } from './web-ui-server.js';
export { RestApiServer } from './rest-api.js';
export type {
  TerminalManagerConfig,
  TerminalReadOptions,
  TerminalReadResult,
  TerminalWriteOptions,
  TerminalCreateOptions,
  TerminalStatsResult,
  TerminalStatsInput,
  TerminalReadStatus,
  TerminalListResult,
  TerminalSession,
  TerminalError,
  CommandRuntimeInfo,
  CommandSummary,
  OutputBufferEntry,
  BufferReadOptions,
  BufferReadResult,
  WriteTerminalResult,
  ReadTerminalInput,
  KillTerminalInput,
  KillTerminalResult,
  CreateTerminalInput,
  CreateTerminalResult,
  WriteTerminalInput,
  ListTerminalsResult
} from './types.js';

/**
 * 日志输出函数
 */
function log(message: string) {
  if (process.env.MCP_DEBUG === 'true') {
    console.log(`[HTTP-MCP-DEBUG] ${message}`);
  }
}

/**
 * Streamable HTTP MCP 服务器主入口
 */
async function main() {
  log('Starting Cheestard Terminal Interactive Streamable HTTP MCP Server...');

  const app = express();
  app.use(express.json());

  // Map to store transports by session ID
  const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};
  const mcpServers: { [sessionId: string]: CheestardTerminalInteractiveServer } = {};

  // Handle POST requests for client-to-server communication
  app.post('/mcp', async (req, res) => {
    try {
      // Check for existing session ID
      const sessionId = req.headers['mcp-session-id'] as string | undefined;
      let transport: StreamableHTTPServerTransport;
      let mcpServer: CheestardTerminalInteractiveServer;

      if (sessionId && transports[sessionId] && mcpServers[sessionId]) {
        // Reuse existing transport
        transport = transports[sessionId];
        mcpServer = mcpServers[sessionId];
        log(`Reusing existing session: ${sessionId}`);
      } else if (!sessionId && isInitializeRequest(req.body)) {
        // New initialization request
        log('Creating new session and MCP server');
        
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (newSessionId) => {
            // Store the transport by session ID
            transports[newSessionId] = transport;
            log(`Session initialized: ${newSessionId}`);
          },
          // Enable DNS rebinding protection for security
          enableDnsRebindingProtection: true,
          allowedHosts: ['127.0.0.1', 'localhost'],
        });

        // Create MCP server instance
        mcpServer = new CheestardTerminalInteractiveServer();
        const server = mcpServer.getServer();

        // Clean up transport when closed
        transport.onclose = () => {
          if (transport.sessionId) {
            delete transports[transport.sessionId];
            delete mcpServers[transport.sessionId];
            log(`Session closed: ${transport.sessionId}`);
          }
        };

        // Store the MCP server
        if (transport.sessionId) {
          mcpServers[transport.sessionId] = mcpServer;
        }

        // Connect to the MCP server
        await server.connect(transport);
        log('MCP server connected to transport');
      } else {
        // Invalid request
        res.status(400).json({
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: 'Bad Request: No valid session ID provided',
          },
          id: null,
        });
        return;
      }

      // Handle the request
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error('Error handling MCP request:', error);
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error',
        },
        id: null,
      });
    }
  });

  // Reusable handler for GET and DELETE requests
  const handleSessionRequest = async (req: express.Request, res: express.Response) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    if (!sessionId || !transports[sessionId]) {
      res.status(400).send('Invalid or missing session ID');
      return;
    }
    
    const transport = transports[sessionId];
    await transport.handleRequest(req, res);
  };

  // Handle GET requests for server-to-client notifications via SSE
  app.get('/mcp', handleSessionRequest);

  // Handle DELETE requests for session termination
  app.delete('/mcp', handleSessionRequest);

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      activeSessions: Object.keys(transports).length
    });
  });

  // Start the HTTP server
  const port = parseInt(process.env.MCP_PORT || '1106');
  const host = process.env.MCP_HOST || '127.0.0.1';

  app.listen(port, host, () => {
    log(`Cheestard Terminal Interactive Streamable HTTP MCP Server started successfully`);
    log(`Server listening on http://${host}:${port}/mcp`);
    log('Server capabilities:');
    log('- create_terminal: Create new Cheestard Terminal Interactive sessions');
    log('- write_terminal: Send input to terminal sessions');
    log('- read_terminal: Read output from terminal sessions');
    log('- list_terminals: List all active terminal sessions');
    log('- kill_terminal: Terminate terminal sessions');
    log('');
    log('Resources available:');
    log('- terminal://list: List of all terminals');
    log('- terminal://output/{terminalId}: Terminal output');
    log('- terminal://stats: Manager statistics');
    log('');
    log('Prompts available:');
    log('- terminal-usage-guide: Usage guide');
    log('- terminal-troubleshooting: Troubleshooting guide');
    log('');
    log('Health check available at: http://${host}:${port}/health');
  });

  // Handle graceful shutdown
  const shutdown = async () => {
    log('Received shutdown signal, cleaning up...');
    try {
      // Close all transports and servers
      for (const [sessionId, transport] of Object.entries(transports)) {
        await transport.close();
        if (mcpServers[sessionId]) {
          await mcpServers[sessionId].shutdown();
        }
      }
      process.exit(0);
    } catch (error) {
      console.error('[HTTP-MCP-ERROR] Error during shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  process.on('SIGHUP', shutdown);

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('[HTTP-MCP-ERROR] Uncaught exception:', error);
    shutdown();
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('[HTTP-MCP-ERROR] Unhandled rejection at:', promise, 'reason:', reason);
    shutdown();
  });
}

// 启动服务器
const scriptPath = fileURLToPath(import.meta.url);
const entryArg = process.argv[1];

if (entryArg) {
  let entryPath = entryArg;
  try {
    entryPath = realpathSync(entryArg);
  } catch {
    // 保留原始路径用于比较（例如当文件已经被删除时）
  }

  if (entryPath === scriptPath) {
    main().catch((error) => {
      console.error('[HTTP-MCP-ERROR] Failed to start server:', error);
      process.exit(1);
    });
  }
}