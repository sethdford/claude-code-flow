/**
 * Request router for MCP
 */

import { MCPRequest } from "../utils/types.js";
import { ILogger } from "../core/logger.js";
import { MCPMethodNotFoundError } from "../utils/errors.js";
import { ToolRegistry } from "./tools.js";
import { PromptRegistry } from "./prompts.js";

/**
 * Request router implementation
 */
export class RequestRouter {
  private totalRequests = 0;
  private successfulRequests = 0;
  private failedRequests = 0;

  constructor(
    private toolRegistry: ToolRegistry,
    private promptRegistry: PromptRegistry,
    private logger: ILogger,
  ) {}

  /**
   * Routes a request to the appropriate handler
   */
  async route(request: MCPRequest): Promise<unknown> {
    this.totalRequests++;

    try {
      // Parse method to determine handler
      const { method, params } = request;

      // Handle built-in methods
      if (method.startsWith("rpc.")) {
        return await this.handleRPCMethod(method, params);
      }

      // Handle tool invocations
      if (method.startsWith("tools/")) {
        return await this.handleToolMethod(method, params);
      }

      // Handle prompt methods
      if (method.startsWith("prompts/")) {
        return await this.handlePromptMethod(method, params);
      }

      // Try to execute as a tool directly
      const tool = this.toolRegistry.getTool(method);
      if (tool) {
        const result = await this.toolRegistry.executeTool(method, params);
        this.successfulRequests++;
        return result;
      }

      // Method not found
      throw new MCPMethodNotFoundError(method);
    } catch (error) {
      this.failedRequests++;
      throw error;
    }
  }

  /**
   * Gets router metrics
   */
  getMetrics(): {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    } {
    return {
      totalRequests: this.totalRequests,
      successfulRequests: this.successfulRequests,
      failedRequests: this.failedRequests,
    };
  }

  /**
   * Handles built-in RPC methods
   */
  private handleRPCMethod(method: string, params: unknown): unknown {
    switch (method) {
      case "rpc.discover":
        return this.discoverMethods();

      case "rpc.ping":
        return { pong: true };

      case "rpc.describe":
        return this.describeMethod(params);

      default:
        throw new MCPMethodNotFoundError(method);
    }
  }

  /**
   * Handles tool-related methods
   */
  private async handleToolMethod(method: string, params: unknown): Promise<unknown> {
    switch (method) {
      case "tools/list":
        return this.toolRegistry.listTools();

      case "tools/call":
        return await this.invokeTool(params);

      case "tools/describe":
        return this.describeTool(params);

      default:
        throw new MCPMethodNotFoundError(method);
    }
  }

  /**
   * Handles prompt-related methods
   */
  private async handlePromptMethod(method: string, params: unknown): Promise<unknown> {
    switch (method) {
      case "prompts/list":
        return {
          prompts: this.promptRegistry.listPrompts()
        };

      case "prompts/get":
        return await this.getPrompt(params);

      default:
        throw new MCPMethodNotFoundError(method);
    }
  }

  /**
   * Discovers all available methods
   */
  private discoverMethods(): Record<string, string> {
    const methods: Record<string, string> = {
      "rpc.discover": "Discover all available methods",
      "rpc.ping": "Ping the server",
      "rpc.describe": "Describe a specific method",
      "tools/list": "List all available tools",
      "tools/call": "Call a specific tool",
      "tools/describe": "Describe a specific tool",
      "prompts/list": "List all available prompts",
      "prompts/get": "Get a specific prompt",
    };

    // Add all registered tools
    for (const tool of this.toolRegistry.listTools()) {
      methods[tool.name] = tool.description;
    }

    // Add all registered prompts
    for (const prompt of this.promptRegistry.listPrompts()) {
      methods[`prompt/${prompt.name}`] = prompt.description || "Custom prompt";
    }

    return methods;
  }

  /**
   * Describes a specific method
   */
  private describeMethod(params: unknown): unknown {
    if (!params || typeof params !== "object" || !("method" in params)) {
      throw new Error("Invalid params: method required");
    }

    const { method } = params as { method: string };

    // Check if it's a tool
    const tool = this.toolRegistry.getTool(method);
    if (tool) {
      return {
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      };
    }

    // Check if it's a prompt
    const prompt = this.promptRegistry.getPrompt(method);
    if (prompt) {
      return {
        name: prompt.name,
        description: prompt.description,
        arguments: prompt.arguments,
      };
    }

    // Check built-in methods
    const builtInMethods: Record<string, unknown> = {
      "rpc.discover": {
        description: "Discover all available methods",
        inputSchema: { type: "object", properties: {} },
      },
      "rpc.ping": {
        description: "Ping the server",
        inputSchema: { type: "object", properties: {} },
      },
      "rpc.describe": {
        description: "Describe a specific method",
        inputSchema: {
          type: "object",
          properties: {
            method: { type: "string" },
          },
          required: ["method"],
        },
      },
      "tools/list": {
        description: "List all available tools",
        inputSchema: { type: "object", properties: {} },
      },
      "tools/call": {
        description: "Call a specific tool",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string" },
            arguments: { type: "object" },
          },
          required: ["name"],
        },
      },
      "tools/describe": {
        description: "Describe a specific tool",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string" },
          },
          required: ["name"],
        },
      },
      "prompts/list": {
        description: "List all available prompts",
        inputSchema: { type: "object", properties: {} },
      },
      "prompts/get": {
        description: "Get a specific prompt",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string" },
            arguments: { type: "object" },
          },
          required: ["name"],
        },
      },
    };

    if (method in builtInMethods) {
      return builtInMethods[method];
    }

    throw new MCPMethodNotFoundError(method);
  }

  /**
   * Invokes a tool with the given parameters
   */
  private async invokeTool(params: unknown): Promise<unknown> {
    if (!params || typeof params !== "object" || !("name" in params)) {
      throw new Error("Invalid params: name required");
    }

    const { name, arguments: args } = params as { name: string; arguments?: unknown };
    return await this.toolRegistry.executeTool(name, args);
  }

  /**
   * Gets a prompt with the given parameters
   */
  private async getPrompt(params: unknown): Promise<unknown> {
    if (!params || typeof params !== "object" || !("name" in params)) {
      throw new Error("Invalid params: name required");
    }

    const { name, arguments: args } = params as { name: string; arguments?: Record<string, unknown> };
    const promptContent = await this.promptRegistry.executePrompt(name, args || {});
    
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: promptContent
          }
        }
      ]
    };
  }

  /**
   * Describes a tool
   */
  private describeTool(params: unknown): unknown {
    if (!params || typeof params !== "object" || !("name" in params)) {
      throw new Error("Invalid params: name required");
    }

    const { name } = params as { name: string };
    const tool = this.toolRegistry.getTool(name);
    
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }

    return {
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    };
  }
}