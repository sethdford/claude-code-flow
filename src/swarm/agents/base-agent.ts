/**
 * Base Agent - Foundation for all specialized agents in the swarm system
 */

import { AgentType, TaskDefinition, AgentCapabilities, AgentStatus } from "../types.js";
import { logger } from "../../core/logger.js";
import { EventEmitter } from "events";

export abstract class BaseAgent extends EventEmitter {
  protected id: string;
  protected type: AgentType;
  protected status: "idle" | "busy" | "error" | "offline" = "idle";
  protected currentTask: TaskDefinition | null = null;
  protected capabilities: AgentCapabilities;
  protected lastActivity: Date = new Date();
  protected tasksCompleted: number = 0;
  protected errors: any[] = [];

  constructor(id: string, type: AgentType) {
    super();
    this.id = id;
    this.type = type;
    
    // Default capabilities - to be overridden by subclasses
    this.capabilities = {
      codeGeneration: false,
      codeReview: false,
      testing: false,
      documentation: false,
      research: false,
      analysis: false,
      webSearch: false,
      apiIntegration: false,
      fileSystem: true,
      terminalAccess: false,
      languages: [],
      frameworks: [],
      domains: [],
      tools: [],
      maxConcurrentTasks: 1,
      maxMemoryUsage: 1024,
      maxExecutionTime: 300,
      reliability: 0.9,
      speed: 0.8,
      quality: 0.8,
    };
  }

  abstract executeTask(task: TaskDefinition): Promise<any>;
  abstract getCapabilities(): AgentCapabilities;

  getId(): string {
    return this.id;
  }

  getType(): AgentType {
    return this.type;
  }

  getStatus(): { id: string; type: AgentType; status: string; currentTask: string | null; lastActivity: Date; tasksCompleted: number; capabilities: AgentCapabilities } {
    return {
      id: this.id,
      type: this.type,
      status: this.status,
      currentTask: this.currentTask?.id.id || null,
      lastActivity: this.lastActivity,
      tasksCompleted: this.tasksCompleted,
      capabilities: this.capabilities,
    };
  }

  async assignTask(task: TaskDefinition): Promise<void> {
    if (this.status === "busy") {
      throw new Error(`Agent ${this.id} is already busy with task ${this.currentTask?.id.id}`);
    }

    this.status = "busy";
    this.currentTask = task;
    this.lastActivity = new Date();
    
    logger.info(`Agent ${this.id} assigned task: ${task.name}`);
    this.emit("taskAssigned", { agentId: this.id, task });

    try {
      const result = await this.executeTask(task);
      await this.completeTask(result);
    } catch (error) {
      await this.handleTaskError(error);
    }
  }

  protected async completeTask(result: any): Promise<void> {
    if (!this.currentTask) {
      throw new Error("No current task to complete");
    }

    const taskId = this.currentTask.id.id;
    this.currentTask = null;
    this.status = "idle";
    this.tasksCompleted++;
    this.lastActivity = new Date();

    logger.info(`Agent ${this.id} completed task: ${taskId}`);
    this.emit("taskCompleted", { agentId: this.id, taskId, result });
  }

  protected async handleTaskError(error: any): Promise<void> {
    if (!this.currentTask) {
      throw new Error("No current task to handle error for");
    }

    const taskId = this.currentTask.id.id;
    this.errors.push({
      taskId,
      error: error.message,
      timestamp: new Date(),
      stack: error.stack,
    });

    this.currentTask = null;
    this.status = "error";
    this.lastActivity = new Date();

    logger.error(`Agent ${this.id} task error for ${taskId}:`, error);
    this.emit("taskError", { agentId: this.id, taskId, error });
  }

  isAvailable(): boolean {
    return this.status === "idle";
  }

  canHandleTask(task: TaskDefinition): boolean {
    // Basic capability matching - can be overridden by subclasses
    const requiredCapabilities = task.requirements?.capabilities || [];
    const agentTools = this.capabilities.tools;

    return requiredCapabilities.every(capability => agentTools.includes(capability));
  }

  async cleanup(): Promise<void> {
    this.status = "offline";
    this.currentTask = null;
    this.removeAllListeners();
    logger.info(`Agent ${this.id} cleaned up`);
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    try {
      // Basic health check - can be overridden by subclasses
      return this.status !== "error";
    } catch (error) {
      logger.error(`Health check failed for agent ${this.id}:`, error);
      return false;
    }
  }

  // Get agent metrics
  getMetrics(): any {
    return {
      id: this.id,
      type: this.type,
      tasksCompleted: this.tasksCompleted,
      errorCount: this.errors.length,
      uptime: Date.now() - this.lastActivity.getTime(),
      status: this.status,
      capabilities: this.capabilities,
    };
  }
} 