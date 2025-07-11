/**
 * Optimized Task Executor
 * Implements async execution with connection pooling and caching
 */

import { EventEmitter } from "node:events";
import { Logger } from "../../core/logger.js";
import { ClaudeConnectionPool } from "./connection-pool.js";
import { AsyncFileManager } from "./async-file-manager.js";
import { TTLMap } from "./ttl-map.js";
import { CircularBuffer } from "./circular-buffer.js";
import { DEFAULT_MODEL_CONFIG } from "../../config/model-config.js";
// import PQueue from "p-queue"; // Disabled - using simplified queue
import { 
  TaskDefinition, 
  TaskResult, 
  AgentId,
  TaskStatus,
  TaskType,
  TaskPriority,
} from "../types.js";

export interface ExecutorConfig {
  connectionPool?: {
    min?: number;
    max?: number;
  };
  concurrency?: number;
  caching?: {
    enabled?: boolean;
    ttl?: number;
    maxSize?: number;
  };
  fileOperations?: {
    outputDir?: string;
    concurrency?: number;
  };
  monitoring?: {
    metricsInterval?: number;
    slowTaskThreshold?: number;
  };
}

export interface ExecutionMetrics {
  totalExecuted: number;
  totalSucceeded: number;
  totalFailed: number;
  avgExecutionTime: number;
  cacheHitRate: number;
  queueLength: number;
  activeExecutions: number;
}

export class OptimizedExecutor extends EventEmitter {
  private logger: Logger;
  private connectionPool: ClaudeConnectionPool;
  private fileManager: AsyncFileManager;
  private executionQueue: { 
    add: (fn: () => Promise<unknown>) => Promise<unknown>; 
    size: number;
    clear?: () => void;
    onIdle?: () => Promise<void>;
  }; // Simplified queue
  private resultCache: TTLMap<string, TaskResult>;
  private executionHistory: CircularBuffer<{
    taskId: string;
    duration: number;
    status: "success" | "failed";
    timestamp: Date;
  }>;
  
  private metrics = {
    totalExecuted: 0,
    totalSucceeded: 0,
    totalFailed: 0,
    totalExecutionTime: 0,
    cacheHits: 0,
    cacheMisses: 0,
  };
  
  private activeExecutions = new Set<string>();
  
  constructor(private config: ExecutorConfig = {}) {
    super();
    
    this.logger = new Logger(
      { level: "info", format: "json", destination: "console" },
      { component: "OptimizedExecutor" },
    );
    
    // Initialize connection pool
    this.connectionPool = new ClaudeConnectionPool({
      min: config.connectionPool?.min ?? 2,
      max: config.connectionPool?.max ?? 10,
      apiKey: process.env.ANTHROPIC_API_KEY || "",
    });
    
    // Initialize file manager
    this.fileManager = new AsyncFileManager({
      write: config.fileOperations?.concurrency ?? 10,
      read: config.fileOperations?.concurrency || 20,
    });
    
    // Initialize execution queue - simplified implementation
    this.executionQueue = {
      add: async (fn: () => Promise<unknown>) => fn(),
      size: 0,
      clear: () => {},
      onIdle: async () => {},
    };
    
    // Initialize result cache
    this.resultCache = new TTLMap({
      defaultTTL: config.caching?.ttl || 3600000, // 1 hour
      maxSize: config.caching?.maxSize || 1000,
      onExpire: (key, value) => {
        this.logger.debug("Cache entry expired", { taskId: key });
      },
    });
    
    // Initialize execution history
    this.executionHistory = new CircularBuffer(1000);
    
    // Start monitoring if configured
    if (config.monitoring?.metricsInterval) {
      setInterval(() => {
        this.emitMetrics();
      }, config.monitoring.metricsInterval);
    }
  }
  
  async executeTask(task: TaskDefinition, agentId: AgentId): Promise<TaskResult> {
    const startTime = Date.now();
    const taskKey = this.getTaskCacheKey(task);
    
    // Check cache if enabled
    if (this.config.caching?.enabled) {
      const cached = this.resultCache.get(taskKey);
      if (cached) {
        this.metrics.cacheHits++;
        this.logger.debug("Cache hit for task", { taskId: task.id });
        return cached;
      }
      this.metrics.cacheMisses++;
    }
    
    // Add to active executions
    this.activeExecutions.add(task.id.id);
    
    // Queue the execution
    const result = await this.executionQueue.add(async (): Promise<TaskResult> => {
      try {
        // Execute with connection pool
        const executionResult = await this.connectionPool.execute(async (api) => {
          // Get system prompt if available
          const taskWithMetadata = task as TaskDefinition & { metadata?: { systemPrompt?: string } };
          const systemPrompt = taskWithMetadata.metadata?.systemPrompt || `Task: ${task.description}`;
          
          const response = await api.complete({
            messages: this.buildMessages(task),
            model: (task as any).metadata?.model || DEFAULT_MODEL_CONFIG.primary,
            max_tokens: (task.constraints as any).maxTokens || 4096,
            temperature: (task as any).metadata?.temperature ?? 0.7,
            system: systemPrompt,
          });
          
          // Extract text content from response
          let outputText = "";
          if (response.content && response.content.length > 0) {
            const firstContent = response.content[0];
            if (firstContent.type === "text") {
              outputText = firstContent.text;
            }
          }
          
          return {
            success: true,
            output: outputText,
            usage: {
              inputTokens: response.usage?.input_tokens ?? 0,
              outputTokens: response.usage?.output_tokens ?? 0,
            },
          };
        });
        
        // Save result to file asynchronously
        if (this.config.fileOperations?.outputDir) {
          const outputPath = `${this.config.fileOperations.outputDir}/${task.id.id}.json`;
          await this.fileManager.writeJSON(outputPath, {
            taskId: task.id,
            agentId: agentId.id,
            result: executionResult,
            timestamp: new Date(),
          });
        }
        
        // Create task result
        // Ensure minimum execution time of 1ms for metrics calculation
        const executionTime = Math.max(1, Date.now() - startTime);
        
        const taskResult: TaskResult = {
          output: executionResult.output,
          artifacts: {},
          metadata: {
            agentId: agentId.id,
            success: executionResult.success,
            executionTime,
            tokensUsed: executionResult.usage,
          },
          quality: 1.0,
          completeness: 1.0,
          accuracy: 1.0,
          executionTime,
          resourcesUsed: {
            cpuTime: executionTime,
            maxMemory: 0,
            diskIO: 0,
            networkIO: 0,
            fileHandles: 0,
          },
          validated: true,
        };
        
        // Cache result if enabled
        if (this.config.caching?.enabled && executionResult.success) {
          this.resultCache.set(taskKey, taskResult);
        }
        
        // Update metrics
        this.metrics.totalExecuted++;
        this.metrics.totalSucceeded++;
        this.metrics.totalExecutionTime += taskResult.executionTime;
        
        // Record in history
        this.executionHistory.push({
          taskId: task.id.id,
          duration: executionTime,
          status: "success",
          timestamp: new Date(),
        });
        
        // Check if slow task
        if (this.config.monitoring?.slowTaskThreshold && 
            taskResult.executionTime > this.config.monitoring.slowTaskThreshold) {
          this.logger.warn("Slow task detected", {
            taskId: task.id.id,
            duration: taskResult.executionTime,
            threshold: this.config.monitoring.slowTaskThreshold,
          });
        }
        
        this.emit("task:completed", taskResult);
        return taskResult;
        
      } catch (error) {
        this.metrics.totalExecuted++;
        this.metrics.totalFailed++;
        
        // Ensure minimum execution time of 1ms for metrics calculation
        const errorExecutionTime = Math.max(1, Date.now() - startTime);
        
        const errorResult: TaskResult = {
          output: "",
          artifacts: {},
          metadata: {
            agentId: agentId.id,
            success: false,
            error: {
              type: error instanceof Error ? error.constructor.name : "UnknownError",
              message: error instanceof Error ? error.message : "Unknown error",
              code: error instanceof Error && "code" in error ? (error as Error & { code?: string }).code : undefined,
              stack: error instanceof Error ? error.stack : undefined,
              context: { taskId: task.id.id, agentId: agentId.id },
              recoverable: this.isRecoverableError(error),
              retryable: this.isRetryableError(error),
            },
          },
          quality: 0.0,
          completeness: 0.0,
          accuracy: 0.0,
          executionTime: errorExecutionTime,
          resourcesUsed: {
            cpuTime: errorExecutionTime,
            maxMemory: 0,
            diskIO: 0,
            networkIO: 0,
            fileHandles: 0,
          },
          validated: false,
        };
        
        // Record in history
        this.executionHistory.push({
          taskId: task.id.id,
          duration: errorExecutionTime,
          status: "failed",
          timestamp: new Date(),
        });
        
        this.emit("task:failed", errorResult);
        throw error;
      } finally {
        this.activeExecutions.delete(task.id.id);
      }
    });
    
    return result as TaskResult;
  }
  
  async executeBatch(
    tasks: TaskDefinition[], 
    agentId: AgentId,
  ): Promise<TaskResult[]> {
    return Promise.all(
      tasks.map(task => this.executeTask(task, agentId)),
    );
  }
  
  private buildMessages(task: TaskDefinition): Array<{ role: "user" | "assistant"; content: string }> {
    const messages: Array<{ role: "user" | "assistant"; content: string }> = [];
    
    // Add main task objective
    messages.push({
      role: "user",
      content: task.description,
    });
    
    // Add context if available
    if (task.context) {
      if (task.context.previousResults && Array.isArray(task.context.previousResults) && task.context.previousResults.length) {
        messages.push({
          role: "assistant",
          content: `Previous results:\n${  
            task.context.previousResults.map((r: TaskResult) => r.output).join("\n\n")}`,
        });
      }
      
      if (task.context.relatedTasks && Array.isArray(task.context.relatedTasks) && task.context.relatedTasks.length) {
        messages.push({
          role: "user",
          content: `Related context:\n${  
            task.context.relatedTasks.map((t: TaskDefinition) => t.description).join("\n")}`,
        });
      }
    }
    
    return messages;
  }
  
  private getTaskCacheKey(task: TaskDefinition): string {
    // Create a cache key based on task properties
    const taskWithMetadata = task as TaskDefinition & { metadata?: Record<string, unknown> };
    return `${task.type}-${task.description}-${JSON.stringify(taskWithMetadata.metadata || {})}`;
  }
  
  private isRecoverableError(error: unknown): boolean {
    if (!error) return false;
    
    const err = error as any;
    
    // Network errors are often recoverable
    if (err.code === "ECONNRESET" || 
        err.code === "ETIMEDOUT" ||
        err.code === "ENOTFOUND") {
      return true;
    }
    
    // Rate limit errors are recoverable with backoff
    if (err.status === 429) {
      return true;
    }
    
    return false;
  }
  
  private isRetryableError(error: any): boolean {
    if (!error) return false;
    
    // Most recoverable errors are retryable
    if (this.isRecoverableError(error)) {
      return true;
    }
    
    // Server errors might be temporary
    if (error.status >= 500 && error.status < 600) {
      return true;
    }
    
    return false;
  }
  
  getMetrics(): ExecutionMetrics {
    const history = this.executionHistory.getAll();
    const avgExecutionTime = this.metrics.totalExecuted > 0
      ? this.metrics.totalExecutionTime / this.metrics.totalExecuted
      : 0;
    
    const cacheTotal = this.metrics.cacheHits + this.metrics.cacheMisses;
    const cacheHitRate = cacheTotal > 0
      ? this.metrics.cacheHits / cacheTotal
      : 0;
    
    return {
      totalExecuted: this.metrics.totalExecuted,
      totalSucceeded: this.metrics.totalSucceeded,
      totalFailed: this.metrics.totalFailed,
      avgExecutionTime,
      cacheHitRate,
      queueLength: this.executionQueue.size,
      activeExecutions: this.activeExecutions.size,
    };
  }
  
  private emitMetrics(): void {
    const metrics = this.getMetrics();
    this.emit("metrics", metrics);
    
    // Also log if configured
    this.logger.info("Executor metrics", metrics);
  }
  
  async waitForPendingExecutions(): Promise<void> {
    await this.executionQueue.onIdle?.();
    await this.fileManager.waitForPendingOperations();
  }
  
  async shutdown(): Promise<void> {
    this.logger.info("Shutting down optimized executor");
    
    // Clear the queue
    this.executionQueue.clear?.();
    
    // Wait for active executions
    await this.waitForPendingExecutions();
    
    // Drain connection pool
    await this.connectionPool.drain();
    
    // Clear caches
    this.resultCache.destroy();
    
    this.logger.info("Optimized executor shut down");
  }
  
  /**
   * Get execution history for analysis
   */
  getExecutionHistory() {
    return this.executionHistory.snapshot();
  }
  
  /**
   * Get connection pool statistics
   */
  getConnectionPoolStats() {
    return this.connectionPool.getStats();
  }
  
  /**
   * Get file manager metrics
   */
  getFileManagerMetrics() {
    return this.fileManager.getMetrics();
  }
  
  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.resultCache.getStats();
  }
}