/**
 * Connection Pool for Claude API
 * Manages reusable connections to improve performance
 */

import { EventEmitter } from "node:events";
import { Logger } from "../../core/logger.js";
import { Anthropic } from "@anthropic-ai/sdk";
import { DEFAULT_MODEL_CONFIG } from "../../config/model-config.js";

// Real ClaudeAPI implementation using Anthropic SDK
export class ClaudeAPI {
  private client: Anthropic;
  private connected: boolean = false;
  private apiKey: string;
  private baseURL?: string;
  private defaultModel: string = DEFAULT_MODEL_CONFIG.primary;
  
  constructor(options: {
    apiKey: string;
    baseURL?: string;
    defaultModel?: string;
  }) {
    this.apiKey = options.apiKey;
    this.baseURL = options.baseURL;
    if (options.defaultModel) {
      this.defaultModel = options.defaultModel;
    }
    
    this.client = new Anthropic({
      apiKey: this.apiKey,
      baseURL: this.baseURL,
    });
  }
  
  async connect(): Promise<void> {
    try {
      // Test the connection by making a minimal request
      await this.client.messages.create({
        model: this.defaultModel,
        max_tokens: 1,
        messages: [{ role: "user", content: "test" }],
      });
      this.connected = true;
    } catch (error) {
      this.connected = false;
      throw new Error(`Failed to connect to Claude API: ${(error as Error).message}`);
    }
  }
  
  async disconnect(): Promise<void> {
    // Anthropic SDK doesn't require explicit disconnection
    this.connected = false;
  }
  
  isConnected(): boolean {
    return this.connected;
  }
  
  async complete(options: {
    messages: Anthropic.Messages.MessageParam[];
    model?: string;
    max_tokens?: number;
    temperature?: number;
    system?: string;
    tools?: Anthropic.Messages.Tool[];
    tool_choice?: Anthropic.Messages.ToolChoice;
    stop_sequences?: string[];
    stream?: boolean;
  }): Promise<Anthropic.Messages.Message> {
    if (!this.connected) {
      throw new Error("Not connected to Claude API");
    }
    
    try {
      const response = await this.client.messages.create({
        model: options.model || this.defaultModel,
        max_tokens: options.max_tokens || 4096,
        temperature: options.temperature,
        system: options.system,
        messages: options.messages,
        tools: options.tools,
        tool_choice: options.tool_choice,
        stop_sequences: options.stop_sequences,
        stream: false, // Explicitly set to false for non-streaming
      });
      
      return response as Anthropic.Messages.Message;
    } catch (error) {
      throw new Error(`Claude API request failed: ${(error as Error).message}`);
    }
  }
  
  async streamComplete(options: {
    messages: Anthropic.Messages.MessageParam[];
    model?: string;
    max_tokens?: number;
    temperature?: number;
    system?: string;
    tools?: Anthropic.Messages.Tool[];
    tool_choice?: Anthropic.Messages.ToolChoice;
    stop_sequences?: string[];
    onChunk?: (chunk: any) => void;
  }): Promise<Anthropic.Messages.Message> {
    if (!this.connected) {
      throw new Error("Not connected to Claude API");
    }
    
    try {
      const stream = await this.client.messages.create({
        model: options.model || this.defaultModel,
        max_tokens: options.max_tokens || 4096,
        temperature: options.temperature,
        system: options.system,
        messages: options.messages,
        tools: options.tools,
        tool_choice: options.tool_choice,
        stop_sequences: options.stop_sequences,
        stream: true,
      });
      
      let finalMessage: Anthropic.Messages.Message | null = null;
      
      for await (const chunk of stream) {
        if (options.onChunk) {
          options.onChunk(chunk);
        }
        
        if (chunk.type === "message_start") {
          finalMessage = chunk.message;
        } else if (chunk.type === "content_block_delta" && finalMessage) {
          // Update the final message with delta content
          if (chunk.delta.type === "text_delta" && finalMessage.content[0]?.type === "text") {
            (finalMessage.content[0] as any).text += chunk.delta.text;
          }
        }
      }
      
      if (!finalMessage) {
        throw new Error("No message received from stream");
      }
      
      return finalMessage;
    } catch (error) {
      throw new Error(`Claude API streaming request failed: ${(error as Error).message}`);
    }
  }
  
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.messages.create({
        model: this.defaultModel,
        max_tokens: 1,
        messages: [{ role: "user", content: "ping" }],
      });
      return true;
    } catch (error) {
      return false;
    }
  }
  
  getModel(): string {
    return this.defaultModel;
  }
  
  setModel(model: string): void {
    this.defaultModel = model;
  }
}

export interface PoolConfig {
  min: number;
  max: number;
  acquireTimeoutMillis: number;
  idleTimeoutMillis: number;
  evictionRunIntervalMillis: number;
  testOnBorrow: boolean;
  apiKey: string;
  baseURL?: string;
  defaultModel?: string;
}

export interface PooledConnection {
  id: string;
  api: ClaudeAPI;
  inUse: boolean;
  createdAt: Date;
  lastUsedAt: Date;
  useCount: number;
  totalRequests: number;
  totalErrors: number;
  avgResponseTime: number;
}

export interface PoolStats {
  total: number;
  active: number;
  idle: number;
  waiting: number;
  created: number;
  destroyed: number;
  borrowed: number;
  returned: number;
  totalRequests: number;
  totalErrors: number;
  avgResponseTime: number;
  poolUtilization: number;
}

export class ClaudeConnectionPool extends EventEmitter {
  private connections: Map<string, PooledConnection> = new Map();
  private waitingQueue: Array<{
    resolve: (conn: PooledConnection) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
    requestedAt: Date;
  }> = [];
  
  private config: PoolConfig;
  private logger: Logger;
  private evictionTimer?: NodeJS.Timeout;
  private healthCheckTimer?: NodeJS.Timeout;
  private isShuttingDown = false;
  
  // Statistics
  private stats = {
    created: 0,
    destroyed: 0,
    borrowed: 0,
    returned: 0,
    totalRequests: 0,
    totalErrors: 0,
    totalResponseTime: 0,
  };
  
  constructor(config: Partial<PoolConfig> & { apiKey: string }) {
    super();
    
    if (!config.apiKey) {
      throw new Error("API key is required for Claude connection pool");
    }
    
    this.config = {
      min: 2,
      max: 10,
      acquireTimeoutMillis: 30000,
      idleTimeoutMillis: 30000,
      evictionRunIntervalMillis: 10000,
      testOnBorrow: true,
      defaultModel: DEFAULT_MODEL_CONFIG.primary,
      ...config,
    };
    
    this.logger = new Logger(
      { level: "info", format: "json", destination: "console" },
      { component: "ClaudeConnectionPool" },
    );
    
    void this.initialize();
  }
  
  private async initialize(): Promise<void> {
    try {
      // Create minimum connections
      for (let i = 0; i < this.config.min; i++) {
        await this.createConnection();
      }
      
      // Start eviction timer
      this.evictionTimer = setInterval(() => {
        this.evictIdleConnections();
      }, this.config.evictionRunIntervalMillis);
      
      // Start health check timer (every 5 minutes)
      this.healthCheckTimer = setInterval(() => {
        this.performHealthChecks();
      }, 5 * 60 * 1000);
      
      this.logger.info("Claude connection pool initialized", {
        min: this.config.min,
        max: this.config.max,
        model: this.config.defaultModel,
      });
      
      this.emit("pool:initialized", this.getStats());
    } catch (error) {
      this.logger.error("Failed to initialize connection pool", { error });
      throw error;
    }
  }
  
  private async createConnection(): Promise<PooledConnection> {
    const id = `conn-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    const api = new ClaudeAPI({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseURL,
      defaultModel: this.config.defaultModel,
    });
    
    try {
      await api.connect();
    } catch (error) {
      this.logger.error("Failed to create connection", { id, error });
      throw error;
    }
    
    const connection: PooledConnection = {
      id,
      api,
      inUse: false,
      createdAt: new Date(),
      lastUsedAt: new Date(),
      useCount: 0,
      totalRequests: 0,
      totalErrors: 0,
      avgResponseTime: 0,
    };
    
    this.connections.set(id, connection);
    this.stats.created++;
    
    this.emit("connection:created", connection);
    this.logger.debug("Connection created", { id, total: this.connections.size });
    
    return connection;
  }
  
  async acquire(): Promise<PooledConnection> {
    if (this.isShuttingDown) {
      throw new Error("Connection pool is shutting down");
    }
    
    const startTime = Date.now();
    
    // Try to find an available connection
    for (const conn of this.connections.values()) {
      if (!conn.inUse) {
        conn.inUse = true;
        conn.lastUsedAt = new Date();
        conn.useCount++;
        
        // Test connection if configured
        if (this.config.testOnBorrow) {
          const isHealthy = await this.testConnection(conn);
          if (!isHealthy) {
            await this.destroyConnection(conn);
            continue;
          }
        }
        
        this.stats.borrowed++;
        this.emit("connection:acquired", conn);
        
        const acquireTime = Date.now() - startTime;
        this.logger.debug("Connection acquired", { 
          id: conn.id, 
          useCount: conn.useCount,
          acquireTime 
        });
        
        return conn;
      }
    }
    
    // Create new connection if under limit
    if (this.connections.size < this.config.max) {
      try {
        const conn = await this.createConnection();
        conn.inUse = true;
        conn.useCount++;
        this.stats.borrowed++;
        
        this.emit("connection:acquired", conn);
        
        const acquireTime = Date.now() - startTime;
        this.logger.debug("New connection acquired", { 
          id: conn.id,
          acquireTime 
        });
        
        return conn;
      } catch (error) {
        this.logger.error("Failed to create new connection", { error });
        // Fall through to wait for existing connection
      }
    }
    
    // Wait for a connection to become available
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const index = this.waitingQueue.findIndex(item => item.resolve === resolve);
        if (index !== -1) {
          this.waitingQueue.splice(index, 1);
        }
        
        const waitTime = Date.now() - startTime;
        this.logger.warn("Connection acquire timeout", { 
          waitTime,
          queueLength: this.waitingQueue.length 
        });
        
        reject(new Error(`Connection acquire timeout after ${this.config.acquireTimeoutMillis}ms`));
      }, this.config.acquireTimeoutMillis);
      
      this.waitingQueue.push({ 
        resolve, 
        reject, 
        timeout,
        requestedAt: new Date()
      });
      
      this.logger.debug("Added to waiting queue", { 
        queueLength: this.waitingQueue.length 
      });
    });
  }
  
  async release(connection: PooledConnection): Promise<void> {
    const conn = this.connections.get(connection.id);
    if (!conn) {
      this.logger.warn("Attempted to release unknown connection", { id: connection.id });
      return;
    }
    
    conn.inUse = false;
    conn.lastUsedAt = new Date();
    this.stats.returned++;
    
    this.emit("connection:released", conn);
    this.logger.debug("Connection released", { 
      id: conn.id,
      useCount: conn.useCount 
    });
    
    // Process waiting queue
    if (this.waitingQueue.length > 0) {
      const waiter = this.waitingQueue.shift();
      if (waiter) {
        clearTimeout(waiter.timeout);
        
        // Mark connection as in use again
        conn.inUse = true;
        conn.useCount++;
        this.stats.borrowed++;
        
        const waitTime = Date.now() - waiter.requestedAt.getTime();
        this.logger.debug("Connection assigned from queue", { 
          id: conn.id,
          waitTime 
        });
        
        waiter.resolve(conn);
      }
    }
  }
  
  async execute<T>(fn: (api: ClaudeAPI) => Promise<T>): Promise<T> {
    const connection = await this.acquire();
    const startTime = Date.now();
    
    try {
      const result = await fn(connection.api);
      
      const responseTime = Date.now() - startTime;
      connection.totalRequests++;
      connection.avgResponseTime = 
        (connection.avgResponseTime * (connection.totalRequests - 1) + responseTime) / 
        connection.totalRequests;
      
      this.stats.totalRequests++;
      this.stats.totalResponseTime += responseTime;
      
      this.logger.debug("Request executed successfully", {
        connectionId: connection.id,
        responseTime,
        totalRequests: connection.totalRequests
      });
      
      return result;
    } catch (error) {
      connection.totalErrors++;
      this.stats.totalErrors++;
      
      this.logger.error("Request execution failed", {
        connectionId: connection.id,
        error: (error as Error).message,
        totalErrors: connection.totalErrors
      });
      
      throw error;
    } finally {
      await this.release(connection);
    }
  }
  
  private async testConnection(conn: PooledConnection): Promise<boolean> {
    try {
      const isHealthy = await conn.api.healthCheck();
      
      if (!isHealthy) {
        this.logger.warn("Connection health check failed", { id: conn.id });
      }
      
      return isHealthy;
    } catch (error) {
      this.logger.error("Connection test failed", { 
        id: conn.id, 
        error: (error as Error).message 
      });
      return false;
    }
  }
  
  private async destroyConnection(conn: PooledConnection): Promise<void> {
    try {
      await conn.api.disconnect();
    } catch (error) {
      this.logger.warn("Error disconnecting connection", { 
        id: conn.id, 
        error: (error as Error).message 
      });
    }
    
    this.connections.delete(conn.id);
    this.stats.destroyed++;
    
    this.emit("connection:destroyed", conn);
    this.logger.debug("Connection destroyed", { 
      id: conn.id,
      total: this.connections.size 
    });
  }
  
  private evictIdleConnections(): void {
    const now = Date.now();
    const idleThreshold = now - this.config.idleTimeoutMillis;
    
    let evicted = 0;
    for (const conn of this.connections.values()) {
      if (!conn.inUse && 
          conn.lastUsedAt.getTime() < idleThreshold && 
          this.connections.size > this.config.min) {
        
        void this.destroyConnection(conn);
        evicted++;
      }
    }
    
    if (evicted > 0) {
      this.logger.info("Evicted idle connections", { 
        evicted,
        remaining: this.connections.size 
      });
    }
  }
  
  private async performHealthChecks(): Promise<void> {
    const unhealthyConnections: PooledConnection[] = [];
    
    for (const conn of this.connections.values()) {
      if (!conn.inUse) {
        const isHealthy = await this.testConnection(conn);
        if (!isHealthy) {
          unhealthyConnections.push(conn);
        }
      }
    }
    
    // Remove unhealthy connections
    for (const conn of unhealthyConnections) {
      await this.destroyConnection(conn);
    }
    
    // Ensure minimum connections
    while (this.connections.size < this.config.min) {
      try {
        await this.createConnection();
      } catch (error) {
        this.logger.error("Failed to create replacement connection", { error });
        break;
      }
    }
    
    if (unhealthyConnections.length > 0) {
      this.logger.info("Health check completed", {
        removed: unhealthyConnections.length,
        total: this.connections.size
      });
    }
  }
  
  async drain(): Promise<void> {
    this.isShuttingDown = true;
    
    this.logger.info("Draining connection pool", { 
      total: this.connections.size,
      waiting: this.waitingQueue.length 
    });
    
    // Clear timers
    if (this.evictionTimer) {
      clearInterval(this.evictionTimer);
    }
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
    
    // Reject all waiting requests
    for (const waiter of this.waitingQueue) {
      clearTimeout(waiter.timeout);
      waiter.reject(new Error("Connection pool is shutting down"));
    }
    this.waitingQueue.length = 0;
    
    // Wait for all connections to be released
    const maxWaitTime = 30000; // 30 seconds
    const startTime = Date.now();
    
    while (this.hasActiveConnections() && (Date.now() - startTime) < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Force close all connections
    const destroyPromises = Array.from(this.connections.values()).map(conn => 
      this.destroyConnection(conn)
    );
    
    await Promise.allSettled(destroyPromises);
    
    this.emit("pool:drained");
    this.logger.info("Connection pool drained", { 
      finalStats: this.getStats() 
    });
  }
  
  private hasActiveConnections(): boolean {
    return Array.from(this.connections.values()).some(conn => conn.inUse);
  }
  
  getStats(): PoolStats {
    const activeConnections = Array.from(this.connections.values()).filter(c => c.inUse).length;
    const idleConnections = this.connections.size - activeConnections;
    
    const avgResponseTime = this.stats.totalRequests > 0 ? 
      this.stats.totalResponseTime / this.stats.totalRequests : 0;
    
    return {
      total: this.connections.size,
      active: activeConnections,
      idle: idleConnections,
      waiting: this.waitingQueue.length,
      created: this.stats.created,
      destroyed: this.stats.destroyed,
      borrowed: this.stats.borrowed,
      returned: this.stats.returned,
      totalRequests: this.stats.totalRequests,
      totalErrors: this.stats.totalErrors,
      avgResponseTime,
      poolUtilization: this.config.max > 0 ? (activeConnections / this.config.max) * 100 : 0,
    };
  }
  
  getConnectionDetails(): Array<{
    id: string;
    inUse: boolean;
    createdAt: Date;
    lastUsedAt: Date;
    useCount: number;
    totalRequests: number;
    totalErrors: number;
    avgResponseTime: number;
  }> {
    return Array.from(this.connections.values()).map(conn => ({
      id: conn.id,
      inUse: conn.inUse,
      createdAt: conn.createdAt,
      lastUsedAt: conn.lastUsedAt,
      useCount: conn.useCount,
      totalRequests: conn.totalRequests,
      totalErrors: conn.totalErrors,
      avgResponseTime: conn.avgResponseTime,
    }));
  }
  
  async warmUp(): Promise<void> {
    this.logger.info("Warming up connection pool");
    
    // Create connections up to max
    const promises: Promise<PooledConnection>[] = [];
    for (let i = this.connections.size; i < this.config.max; i++) {
      promises.push(this.createConnection());
    }
    
    try {
      await Promise.all(promises);
      this.logger.info("Connection pool warmed up", { 
        total: this.connections.size 
      });
    } catch (error) {
      this.logger.error("Failed to warm up connection pool", { error });
    }
  }
}