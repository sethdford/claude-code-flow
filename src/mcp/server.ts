/**
 * MCP (Model Context Protocol) server implementation
 */

import {
  MCPConfig,
  MCPRequest,
  MCPResponse,
  MCPError,
  MCPTool,
  MCPInitializeParams,
  MCPInitializeResult,
  MCPSession,
  MCPMetrics,
  MCPProtocolVersion,
  MCPCapabilities,
  MCPContext,
} from "../utils/types.js";
import { IEventBus } from "../core/event-bus.js";
import { ILogger } from "../core/logger.js";
import { MCPError as MCPErrorClass, MCPMethodNotFoundError } from "../utils/errors.js";
import { ITransport } from "./transports/base.js";
import { StdioTransport } from "./transports/stdio.js";
import { HttpTransport } from "./transports/http.js";
import { ToolRegistry } from "./tools.js";
import { PromptRegistry } from "./prompts.js";
import { RequestRouter } from "./router.js";
import { SessionManager, ISessionManager } from "./session-manager.js";
import { AuthManager, IAuthManager } from "./auth.js";
import { LoadBalancer, ILoadBalancer, RequestQueue } from "./load-balancer.js";
import { createClaudeFlowTools, ClaudeFlowToolContext } from "./claude-flow-tools.js";
// import { createSwarmTools, SwarmToolContext } from "./swarm-tools.js"; // File missing, temporarily disabled
import { platform, arch } from "node:os";
import { performance } from "node:perf_hooks";

export interface IMCPServer {
  start(): Promise<void>;
  stop(): Promise<void>;
  registerTool(tool: MCPTool): void;
  getHealthStatus(): Promise<{
    healthy: boolean;
    error?: string;
    metrics?: Record<string, number>;
  }>;
  getMetrics(): MCPMetrics;
  getSessions(): MCPSession[];
  getSession(sessionId: string): MCPSession | undefined;
  terminateSession(sessionId: string): void;
}

/**
 * MCP server implementation
 */
export class MCPServer implements IMCPServer {
  private transport: ITransport;
  private toolRegistry: ToolRegistry;
  private promptRegistry: PromptRegistry;
  private router: RequestRouter;
  private sessionManager: ISessionManager;
  private authManager: IAuthManager;
  private loadBalancer?: ILoadBalancer;
  private requestQueue?: RequestQueue;
  private running = false;
  private currentSession?: MCPSession | undefined;

  private readonly serverInfo = {
    name: "claude-flow",
    version: "1.5.5",
  };

  private readonly supportedProtocolVersion: MCPProtocolVersion = {
    major: 2024,
    minor: 11,
    patch: 5,
  };

  private readonly serverCapabilities: MCPCapabilities = {
    logging: {
      level: "info",
    },
    tools: {
      listChanged: true,
    },
    resources: {
      listChanged: false,
      subscribe: false,
    },
    prompts: {
      listChanged: true,
    },
  };

  constructor(
    private config: MCPConfig,
    private eventBus: IEventBus,
    private logger: ILogger,
    private orchestrator?: unknown, // Reference to orchestrator instance
    private swarmCoordinator?: unknown, // Reference to swarm coordinator instance
    private agentManager?: unknown, // Reference to agent manager instance
    private resourceManager?: unknown, // Reference to resource manager instance
    private messagebus?: unknown, // Reference to message bus instance
    private monitor?: unknown, // Reference to real-time monitor instance
  ) {
    // Initialize registries
    this.toolRegistry = new ToolRegistry(this.logger);
    this.promptRegistry = new PromptRegistry(this.logger);
    
    // Initialize router with both registries
    this.router = new RequestRouter(this.toolRegistry, this.promptRegistry, this.logger);
    
    // Initialize managers
    this.sessionManager = new SessionManager(this.config, this.logger);
    this.authManager = new AuthManager(this.config.auth ?? { enabled: false, method: "token" }, this.logger);

    // Initialize load balancer if configured
    if (this.config.loadBalancer?.enabled) {
      this.loadBalancer = new LoadBalancer(this.config.loadBalancer, this.logger);
      this.requestQueue = new RequestQueue(1000, 30000, this.logger);
    }

    // Create transport
    this.transport = this.createTransport();

    // Register built-in tools
    this.registerBuiltInTools();

    // Register Claude-Flow specific tools
    this.registerClaudeFlowTools();
  }

  async start(): Promise<void> {
    if (this.running) {
      throw new MCPErrorClass("Server is already running");
    }

    try {
      // Load Claude prompts from .claude directory
      await this.promptRegistry.loadClaudePrompts();
      
      // Start transport
      await this.transport.start();

      // Set up request handling
      this.transport.onRequest(this.handleRequest.bind(this));

      this.running = true;
      this.logger.info("MCP server started", {
        transport: this.config.transport,
        tools: this.toolRegistry.listTools().length,
        prompts: this.promptRegistry.listPrompts().length,
      });

      // Emit start event
      this.eventBus.emit("mcp:server:started", {
        transport: this.config.transport,
        capabilities: this.serverCapabilities,
      });
    } catch (error) {
      this.logger.error("Failed to start MCP server", error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.running) {
      return;
    }

    try {
      // Stop transport
      await this.transport.stop();

      // Clean up sessions
      const sessions = this.sessionManager.getActiveSessions();
      for (const session of sessions) {
        this.sessionManager.removeSession(session.id);
      }

      this.running = false;
      this.logger.info("MCP server stopped");

      // Emit stop event
      this.eventBus.emit("mcp:server:stopped", {});
    } catch (error) {
      this.logger.error("Error stopping MCP server", error);
      throw error;
    }
  }

  registerTool(tool: MCPTool): void {
    this.toolRegistry.register(tool);
  }

  async getHealthStatus(): Promise<{ 
    healthy: boolean; 
    error?: string; 
    metrics?: Record<string, number>;
  }> {
    try {
      const metrics = this.getMetrics();
      const healthy = this.running && 
                     this.transport !== undefined &&
                     metrics.activeSessions >= 0;

      return {
        healthy,
        metrics: {
          uptime: performance.now(),
          sessions: metrics.activeSessions,
          tools: this.toolRegistry.listTools().length,
          prompts: this.promptRegistry.listPrompts().length,
          requests: metrics.totalRequests,
        },
      };
    } catch (error) {
      return {
        healthy: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  getMetrics(): MCPMetrics {
    const sessions = this.sessionManager.getActiveSessions();
    const routerMetrics = this.router.getMetrics();

    return {
      totalRequests: routerMetrics.totalRequests,
      successfulRequests: routerMetrics.successfulRequests,
      failedRequests: routerMetrics.failedRequests,
      averageResponseTime: 0, // TODO: Implement response time tracking
      activeSessions: sessions.length,
      toolInvocations: {}, // TODO: Implement tool invocation tracking
      errors: {}, // TODO: Implement error categorization
      lastReset: new Date(),
    };
  }

  getSessions(): MCPSession[] {
    return this.sessionManager.getActiveSessions();
  }

  getSession(sessionId: string): MCPSession | undefined {
    return this.sessionManager.getSession(sessionId);
  }

  terminateSession(sessionId: string): void {
    this.sessionManager.removeSession(sessionId);
  }

  private async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    try {
      // Handle initialization separately
      if (request.method === "initialize") {
        return await this.handleInitialize(request);
      }

      // Get or create session
      const session = this.getOrCreateSession();
      
      // Check if session is initialized for non-initialize requests
      if (!session.isInitialized) {
        return {
          jsonrpc: "2.0",
          id: request.id,
          error: {
            code: -32002,
            message: "Server not initialized",
          },
        };
      }

      // Update session activity
      this.sessionManager.updateActivity(session.id);

      // Check load balancer constraints
      if (this.loadBalancer) {
        const allowed = await this.loadBalancer.shouldAllowRequest(session, request);
        if (!allowed) {
          return {
            jsonrpc: "2.0",
            id: request.id,
            error: {
              code: -32000,
              message: "Rate limit exceeded or circuit breaker open",
            },
          };
        }
      }

      // Record request start
      const requestMetrics = this.loadBalancer?.recordRequestStart(session, request);

      try {
        // Process request through router
        const result = await this.router.route(request);
        
        const response: MCPResponse = {
          jsonrpc: "2.0",
          id: request.id,
          result,
        };

        // Record success
        if (requestMetrics) {
          this.loadBalancer?.recordRequestEnd(requestMetrics, response);
        }

        return response;
      } catch (error) {
        // Record failure
        if (requestMetrics) {
          this.loadBalancer?.recordRequestEnd(requestMetrics, undefined, error as Error);
        }
        throw error;
      }
    } catch (error: unknown) {
      this.logger.error("Error handling MCP request", { 
        id: request.id,
        method: request.method,
        error,
      });

      return {
        jsonrpc: "2.0",
        id: request.id,
        error: this.errorToMCPError(error),
      };
    }
  }

  private async handleInitialize(request: MCPRequest): Promise<MCPResponse> {
    try {
      const params = request.params as MCPInitializeParams;
      
      if (!params) {
        return {
          jsonrpc: "2.0",
          id: request.id,
          error: {
            code: -32602,
            message: "Invalid params",
          },
        };
      }

      // Create session
      const session = this.sessionManager.createSession(this.config.transport);
      this.currentSession = session;

      // Initialize session
      this.sessionManager.initializeSession(session.id, params);

      // Prepare response
      const result: MCPInitializeResult = {
        protocolVersion: this.supportedProtocolVersion,
        capabilities: this.serverCapabilities,
        serverInfo: this.serverInfo,
        instructions: "Claude-Flow MCP Server ready for tool execution and custom prompts",
      };

      this.logger.info("Session initialized", {
        sessionId: session.id,
        clientInfo: params.clientInfo,
        protocolVersion: params.protocolVersion,
        tools: this.toolRegistry.listTools().length,
        prompts: this.promptRegistry.listPrompts().length,
        availableSlashCommands: this.promptRegistry.listPrompts().map(p => `/mcp__claude-flow__${p.name}`),
      });

      return {
        jsonrpc: "2.0",
        id: request.id,
        result,
      };
    } catch (error: unknown) {
      this.logger.error("Error during initialization", error);
      return {
        jsonrpc: "2.0",
        id: request.id,
        error: this.errorToMCPError(error),
      };
    }
  }

  private getOrCreateSession(): MCPSession {
    if (this.currentSession) {
      return this.currentSession;
    }

    // For stdio transport, create a default session
    const session = this.sessionManager.createSession(this.config.transport);
    this.currentSession = session;
    return session;
  }

  private createTransport(): ITransport {
    switch (this.config.transport) {
      case "stdio":
        return new StdioTransport(this.logger);
      
      case "http":
        return new HttpTransport(
          this.config.host || "localhost",
          this.config.port || 3000,
          this.config.tlsEnabled ?? false,
          this.logger,
        );
      
      default:
        throw new MCPErrorClass(`Unknown transport type: ${this.config.transport}`);
    }
  }

  private registerBuiltInTools(): void {
    // System information tool
    this.registerTool({
      name: "system/info",
      description: "Get system information",
      inputSchema: {
        type: "object",
        properties: {},
      },
      handler: async () => {
        return {
          version: "1.0.0",
          platform: platform(),
          arch: arch(),
          runtime: "Node.js",
          uptime: performance.now(),
        };
      },
    });

    // Health check tool
    this.registerTool({
      name: "system/health",
      description: "Get system health status",
      inputSchema: {
        type: "object",
        properties: {},
      },
      handler: async () => {
        return await this.getHealthStatus();
      },
    });

    // List tools
    this.registerTool({
      name: "tools/list",
      description: "List all available tools",
      inputSchema: {
        type: "object",
        properties: {},
      },
      handler: async () => {
        return this.toolRegistry.listTools();
      },
    });
  }

  private registerClaudeFlowTools(): void {
    // Create Claude-Flow specific tools
    const tools = createClaudeFlowTools(this.logger);

    // Register all tools
    for (const tool of tools) {
      this.registerTool(tool);
    }

    this.logger.info("Registered Claude-Flow tools", { count: tools.length });
  }

  private errorToMCPError(error: unknown): MCPError {
    if (error instanceof MCPErrorClass) {
      return {
        code: -32000,
        message: error.message,
        data: error.details,
      };
    }

    if (error instanceof MCPMethodNotFoundError) {
      return {
        code: -32601,
        message: error.message,
      };
    }

    if (error instanceof Error) {
      return {
        code: -32603,
        message: error.message,
      };
    }

    return {
      code: -32603,
      message: "Internal error",
    };
  }
}