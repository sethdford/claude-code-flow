/**
 * Node.js-compatible Configuration management for Claude-Flow
 */

import { promises as fs } from "fs";
import path from "path";
import os from "os";

export interface Config {
  orchestrator: {
    maxConcurrentAgents: number;
    taskQueueSize: number;
    healthCheckInterval: number;
    shutdownTimeout: number;
  };
  terminal: {
    type: "auto" | "vscode" | "native";
    poolSize: number;
    recycleAfter: number;
    healthCheckInterval: number;
    commandTimeout: number;
  };
  memory: {
    backend: "sqlite" | "markdown" | "hybrid";
    cacheSizeMB: number;
    syncInterval: number;
    conflictResolution: "crdt" | "timestamp" | "manual";
    retentionDays: number;
  };
  coordination: {
    maxRetries: number;
    retryDelay: number;
    deadlockDetection: boolean;
    resourceTimeout: number;
    messageTimeout: number;
  };
  mcp: {
    transport: "stdio" | "http" | "websocket";
    port: number;
    tlsEnabled: boolean;
  };
  logging: {
    level: "debug" | "info" | "warn" | "error";
    format: "json" | "text";
    destination: "console" | "file";
  };
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: Config = {
  orchestrator: {
    maxConcurrentAgents: 10,
    taskQueueSize: 100,
    healthCheckInterval: 30000,
    shutdownTimeout: 30000,
  },
  terminal: {
    type: "auto",
    poolSize: 5,
    recycleAfter: 10,
    healthCheckInterval: 60000,
    commandTimeout: 300000,
  },
  memory: {
    backend: "hybrid",
    cacheSizeMB: 100,
    syncInterval: 5000,
    conflictResolution: "crdt",
    retentionDays: 30,
  },
  coordination: {
    maxRetries: 3,
    retryDelay: 1000,
    deadlockDetection: true,
    resourceTimeout: 60000,
    messageTimeout: 30000,
  },
  mcp: {
    transport: "stdio",
    port: 3000,
    tlsEnabled: false,
  },
  logging: {
    level: "info",
    format: "json",
    destination: "console",
  },
};

/**
 * Configuration validation error
 */
export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

/**
 * Configuration manager for Node.js
 */
export class ConfigManager {
  private static instance: ConfigManager;
  private config: Config;
  private configPath?: string;
  private userConfigDir: string;

  private constructor() {
    this.config = this.deepClone(DEFAULT_CONFIG);
    this.userConfigDir = path.join(os.homedir(), ".claude-flow");
  }

  /**
   * Gets the singleton instance
   */
  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * Initialize configuration from file or create default
   */
  async init(configPath = "claude-flow.config.json"): Promise<void> {
    try {
      await this.load(configPath);
      console.log(`✅ Configuration loaded from: ${configPath}`);
    } catch (error) {
      // Create default config file if it doesn't exist
      await this.createDefaultConfig(configPath);
      console.log(`✅ Default configuration created: ${configPath}`);
    }
  }

  /**
   * Creates a default configuration file
   */
  async createDefaultConfig(configPath: string): Promise<void> {
    const config = this.deepClone(DEFAULT_CONFIG);
    const content = JSON.stringify(config, null, 2);
    await fs.writeFile(configPath, content, "utf8");
    this.configPath = configPath;
  }

  /**
   * Loads configuration from file
   */
  async load(configPath?: string): Promise<Config> {
    if (configPath) {
      this.configPath = configPath;
    }

    if (!this.configPath) {
      throw new ConfigError("No configuration file path specified");
    }

    try {
      const content = await fs.readFile(this.configPath, "utf8");
      const fileConfig = JSON.parse(content) as Partial<Config>;
      
      // Merge with defaults
      this.config = this.deepMerge(DEFAULT_CONFIG, fileConfig);
      
      // Load environment variables
      this.loadFromEnv();
      
      // Validate
      this.validate(this.config);
      
      return this.config;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        throw new ConfigError(`Configuration file not found: ${this.configPath}`);
      }
      throw new ConfigError(`Failed to load configuration: ${(error as Error).message}`);
    }
  }

  /**
   * Shows current configuration
   */
  show(): Config {
    return this.deepClone(this.config);
  }

  /**
   * Gets a configuration value by path
   */
  get(path: string): any {
    const keys = path.split(".");
    let current: any = this.config;
    
    for (const key of keys) {
      if (current && typeof current === "object" && key in current) {
        current = current[key];
      } else {
        return undefined;
      }
    }
    
    return current;
  }

  /**
   * Sets a configuration value by path
   */
  set(path: string, value: any): void {
    const keys = path.split(".");
    let current: any = this.config;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current)) {
        current[key] = {};
      }
      current = current[key];
    }
    
    const lastKey = keys[keys.length - 1];
    current[lastKey] = value;
    
    // Validate after setting
    this.validate(this.config);
  }

  /**
   * Saves current configuration to file
   */
  async save(configPath?: string): Promise<void> {
    const savePath = configPath || this.configPath;
    if (!savePath) {
      throw new ConfigError("No configuration file path specified");
    }

    const content = JSON.stringify(this.config, null, 2);
    await fs.writeFile(savePath, content, "utf8");
  }

  /**
   * Validates the configuration
   */
  validate(config: Config): void {
    // Orchestrator validation
    if (config.orchestrator.maxConcurrentAgents < 1 || config.orchestrator.maxConcurrentAgents > 100) {
      throw new ConfigError("orchestrator.maxConcurrentAgents must be between 1 and 100");
    }
    if (config.orchestrator.taskQueueSize < 1 || config.orchestrator.taskQueueSize > 10000) {
      throw new ConfigError("orchestrator.taskQueueSize must be between 1 and 10000");
    }

    // Terminal validation
    if (!["auto", "vscode", "native"].includes(config.terminal.type)) {
      throw new ConfigError("terminal.type must be one of: auto, vscode, native");
    }
    if (config.terminal.poolSize < 1 || config.terminal.poolSize > 50) {
      throw new ConfigError("terminal.poolSize must be between 1 and 50");
    }

    // Memory validation
    if (!["sqlite", "markdown", "hybrid"].includes(config.memory.backend)) {
      throw new ConfigError("memory.backend must be one of: sqlite, markdown, hybrid");
    }
    if (config.memory.cacheSizeMB < 1 || config.memory.cacheSizeMB > 10000) {
      throw new ConfigError("memory.cacheSizeMB must be between 1 and 10000");
    }

    // Coordination validation
    if (config.coordination.maxRetries < 0 || config.coordination.maxRetries > 100) {
      throw new ConfigError("coordination.maxRetries must be between 0 and 100");
    }

    // MCP validation
    if (!["stdio", "http", "websocket"].includes(config.mcp.transport)) {
      throw new ConfigError("mcp.transport must be one of: stdio, http, websocket");
    }
    if (config.mcp.port < 1 || config.mcp.port > 65535) {
      throw new ConfigError("mcp.port must be between 1 and 65535");
    }

    // Logging validation
    if (!["debug", "info", "warn", "error"].includes(config.logging.level)) {
      throw new ConfigError("logging.level must be one of: debug, info, warn, error");
    }
    if (!["json", "text"].includes(config.logging.format)) {
      throw new ConfigError("logging.format must be one of: json, text");
    }
    if (!["console", "file"].includes(config.logging.destination)) {
      throw new ConfigError("logging.destination must be one of: console, file");
    }
  }

  /**
   * Loads configuration from environment variables
   */
  private loadFromEnv(): void {
    // Orchestrator settings
    const maxAgents = process.env.CLAUDE_FLOW_MAX_AGENTS;
    if (maxAgents) {
      this.config.orchestrator.maxConcurrentAgents = parseInt(maxAgents, 10);
    }

    // Terminal settings
    const terminalType = process.env.CLAUDE_FLOW_TERMINAL_TYPE;
    if (terminalType === "vscode" || terminalType === "native" || terminalType === "auto") {
      this.config.terminal.type = terminalType;
    }

    // Memory settings
    const memoryBackend = process.env.CLAUDE_FLOW_MEMORY_BACKEND;
    if (memoryBackend === "sqlite" || memoryBackend === "markdown" || memoryBackend === "hybrid") {
      this.config.memory.backend = memoryBackend;
    }

    // MCP settings
    const mcpTransport = process.env.CLAUDE_FLOW_MCP_TRANSPORT;
    if (mcpTransport === "stdio" || mcpTransport === "http" || mcpTransport === "websocket") {
      this.config.mcp.transport = mcpTransport;
    }

    const mcpPort = process.env.CLAUDE_FLOW_MCP_PORT;
    if (mcpPort) {
      this.config.mcp.port = parseInt(mcpPort, 10);
    }

    // Logging settings
    const logLevel = process.env.CLAUDE_FLOW_LOG_LEVEL;
    if (logLevel === "debug" || logLevel === "info" || logLevel === "warn" || logLevel === "error") {
      this.config.logging.level = logLevel;
    }
  }

  /**
   * Deep clone helper
   */
  private deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Deep merge helper
   */
  private deepMerge(target: Config, source: Partial<Config>): Config {
    const result = this.deepClone(target);
    
    if (source.orchestrator) {
      result.orchestrator = { ...result.orchestrator, ...source.orchestrator };
    }
    if (source.terminal) {
      result.terminal = { ...result.terminal, ...source.terminal };
    }
    if (source.memory) {
      result.memory = { ...result.memory, ...source.memory };
    }
    if (source.coordination) {
      result.coordination = { ...result.coordination, ...source.coordination };
    }
    if (source.mcp) {
      result.mcp = { ...result.mcp, ...source.mcp };
    }
    if (source.logging) {
      result.logging = { ...result.logging, ...source.logging };
    }
    
    return result;
  }

  /**
   * Gets available configuration templates
   */
  getAvailableTemplates(): string[] {
    return ["minimal", "default", "development", "production"];
  }

  /**
   * Creates a configuration from a template
   */
  createTemplate(templateName: string): Config {
    const templates: Record<string, Partial<Config>> = {
      minimal: {
        orchestrator: {
          maxConcurrentAgents: 5,
          taskQueueSize: 50,
          healthCheckInterval: 60000,
          shutdownTimeout: 10000,
        },
        terminal: {
          type: "auto",
          poolSize: 2,
          recycleAfter: 5,
          healthCheckInterval: 120000,
          commandTimeout: 300000,
        },
      },
      development: {
        logging: {
          level: "debug",
          format: "text",
          destination: "console",
        },
        orchestrator: {
          maxConcurrentAgents: 20,
          taskQueueSize: 200,
          healthCheckInterval: 15000,
          shutdownTimeout: 5000,
        },
      },
      production: {
        logging: {
          level: "warn",
          format: "json",
          destination: "file",
        },
        memory: {
          backend: "sqlite",
          cacheSizeMB: 500,
          syncInterval: 10000,
          conflictResolution: "timestamp",
          retentionDays: 90,
        },
      },
    };

    const template = templates[templateName] || {};
    return this.deepMerge(DEFAULT_CONFIG, template);
  }

  /**
   * Gets format parsers for different config file formats
   */
  getFormatParsers(): Record<string, { stringify: (obj: any) => string; parse: (str: string) => any }> {
    return {
      json: {
        stringify: (obj) => JSON.stringify(obj, null, 2),
        parse: (str) => JSON.parse(str),
      },
      yaml: {
        stringify: (obj) => {
          // Simple YAML stringification (real implementation would use a YAML library)
          return this.toYAML(obj);
        },
        parse: (str) => {
          // Simple YAML parsing (real implementation would use a YAML library)
          throw new Error("YAML parsing not implemented");
        },
      },
      toml: {
        stringify: (obj) => {
          // Simple TOML stringification (real implementation would use a TOML library)
          throw new Error("TOML stringification not implemented");
        },
        parse: (str) => {
          // Simple TOML parsing (real implementation would use a TOML library)
          throw new Error("TOML parsing not implemented");
        },
      },
    };
  }

  /**
   * Validates a configuration file
   */
  async validateFile(configPath: string): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    try {
      const content = await fs.readFile(configPath, "utf8");
      const config = JSON.parse(content);
      
      // Run validation
      try {
        this.validate(config);
      } catch (error) {
        errors.push((error as Error).message);
      }
      
      // Additional validations
      if (!config.orchestrator) {
        errors.push("Missing required section: orchestrator");
      }
      if (!config.terminal) {
        errors.push("Missing required section: terminal");
      }
      if (!config.memory) {
        errors.push("Missing required section: memory");
      }
      
      return {
        valid: errors.length === 0,
        errors,
      };
    } catch (error) {
      errors.push(`Failed to read or parse file: ${(error as Error).message}`);
      return {
        valid: false,
        errors,
      };
    }
  }

  /**
   * Backs up the current configuration
   */
  async backup(backupPath?: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFile = backupPath || path.join(this.userConfigDir, `backup-${timestamp}.json`);
    
    await fs.mkdir(path.dirname(backupFile), { recursive: true });
    await fs.writeFile(backupFile, JSON.stringify(this.config, null, 2), "utf8");
    
    return backupFile;
  }

  /**
   * Restores configuration from a backup
   */
  async restore(backupPath: string): Promise<void> {
    const content = await fs.readFile(backupPath, "utf8");
    const backupConfig = JSON.parse(content);
    
    // Validate the backup configuration
    this.validate(backupConfig);
    
    // Apply the backup
    this.config = backupConfig;
    
    // Save to current config file
    if (this.configPath) {
      await this.save();
    }
  }

  /**
   * Gets configuration path history
   */
  getPathHistory(): string[] {
    // In a real implementation, this would track all config paths used
    return this.configPath ? [this.configPath] : [];
  }

  /**
   * Gets configuration change history
   */
  getChangeHistory(): Array<{ timestamp: Date; path: string; oldValue: any; newValue: any }> {
    // In a real implementation, this would track all configuration changes
    return [];
  }

  /**
   * Simple YAML converter (basic implementation)
   */
  private toYAML(obj: any, indent = 0): string {
    const spaces = "  ".repeat(indent);
    let result = "";
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        result += `${spaces}${key}:\n${this.toYAML(value, indent + 1)}`;
      } else if (Array.isArray(value)) {
        result += `${spaces}${key}:\n`;
        value.forEach(item => {
          result += `${spaces}  - ${JSON.stringify(item)}\n`;
        });
      } else {
        result += `${spaces}${key}: ${JSON.stringify(value)}\n`;
      }
    }
    
    return result;
  }
}

// Export singleton instance
export const configManager = ConfigManager.getInstance();