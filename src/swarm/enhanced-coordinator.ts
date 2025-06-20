/**
 * Enhanced Swarm Coordinator
 * Implements hierarchical model strategy with intelligent task decomposition
 * Provides advanced AI-powered coordination for multi-agent systems
 */

import { EventEmitter } from "events";
import { logger } from "../core/logger.js";
import { BaseAgent } from "./agents/base-agent.js";
import { CodeAgent } from "./agents/code-agent.js";
import { TaskDefinition, AgentType, SwarmStrategy, TaskId, TaskType, TaskStatus, TaskPriority, TaskRequirements, TaskConstraints } from "./types.js";

export interface HierarchicalModelConfig {
  primary: string;    // Complex reasoning, architecture decisions
  apply: string;      // Fast, precise edits  
  review: string;     // Quality assurance
  threshold: number;  // Lines of code threshold for apply model
}

export interface ContextWindow {
  files: string[];
  maxTokens: number;
  priority: "immediate" | "extended" | "project" | "semantic";
  chunks: ContextChunk[];
}

export interface ContextChunk {
  content: string;
  type: "function" | "class" | "module" | "test" | "config";
  priority: number;
  tokens: number;
}

export interface TaskComplexityAnalysis {
  complexity: "simple" | "medium" | "complex";
  estimatedTokens: number;
  requiredContext: string[];
  suggestedModel: string;
  agentType: AgentType;
}

// Extended metadata for enhanced task properties
export interface ExtendedTaskMetadata {
  complexity?: "simple" | "medium" | "complex";
  suggestedModel?: string;
  estimatedTokens?: number;
  requiredContext?: string[];
}

/**
 * Enhanced Swarm Coordinator with AI-powered task management
 * Features:
 * - Hierarchical model selection based on task complexity
 * - Intelligent context window management
 * - Advanced task decomposition and analysis
 * - Multi-agent coordination with specialized roles
 */
export class EnhancedSwarmCoordinator extends EventEmitter {
  private agents: Map<string, BaseAgent> = new Map();
  private taskQueue: TaskDefinition[] = [];
  private activeTasksMap: Map<string, TaskDefinition> = new Map();
  private modelConfig: HierarchicalModelConfig;
  private contextCache: Map<string, ContextWindow> = new Map();
  private strategy: SwarmStrategy;

  constructor(config: {
    modelConfig: HierarchicalModelConfig;
    strategy: SwarmStrategy;
    maxAgents?: number;
  }) {
    super();
    
    this.modelConfig = config.modelConfig;
    this.strategy = config.strategy;
    
    // Initialize specialized agents with hierarchical model configuration
    this.initializeAgents(config.maxAgents || 5);
  }

  private initializeAgents(maxAgents: number): void {
    // Create specialized agents with hierarchical model configuration
    for (let i = 0; i < maxAgents; i++) {
      const agentId = `enhanced-agent-${i}`;
      const agent = new CodeAgent(agentId, {
        models: {
          primary: this.modelConfig.primary,
          apply: this.modelConfig.apply,
          review: this.modelConfig.review,
        },
        threshold: this.modelConfig.threshold,
      });

      // Set up agent event listeners
      agent.on("taskCompleted", this.handleAgentTaskCompleted.bind(this));
      agent.on("taskError", this.handleAgentTaskError.bind(this));
      
      this.agents.set(agentId, agent);
      logger.info(`Initialized ${agent.getType()} agent: ${agentId}`);
    }
  }

  async addObjective(objective: string): Promise<string> {
    logger.info(`Adding objective: ${objective}`);
    
    // Decompose objective using primary model (complex reasoning)
    const tasks = await this.decomposeObjective(objective);
    
    // Analyze each task complexity and assign appropriate models
    const analyzedTasks = await Promise.all(
      tasks.map(task => this.analyzeTaskComplexity(task)),
    );

    // Add tasks to queue with enhanced metadata
    for (const analysis of analyzedTasks) {
      const enhancedTask: TaskDefinition = {
        ...analysis.task,
        metadata: {
          ...analysis.task.metadata,
          customProperties: {
            complexity: analysis.complexity,
            suggestedModel: analysis.suggestedModel,
            estimatedTokens: analysis.estimatedTokens,
            requiredContext: analysis.requiredContext,
          },
        },
      };
      
      this.taskQueue.push(enhancedTask);
    }

    const objectiveId = `obj-${Date.now()}`;
    logger.info(`Created objective ${objectiveId} with ${analyzedTasks.length} tasks`);
    this.emit("objectiveAdded", { objectiveId, tasks: analyzedTasks.length });
    
    // Start processing tasks asynchronously
    this.processTasks().catch(error => {
      logger.error("Error processing tasks:", error);
      this.emit("error", error);
    });
    
    return objectiveId;
  }

  private async decomposeObjective(objective: string): Promise<TaskDefinition[]> {
    // Use primary model for complex objective decomposition
    logger.info(`Decomposing objective with primary model: ${this.modelConfig.primary}`);
    
    const timestamp = Date.now();
    
    // This would integrate with actual LLM to decompose the objective
    // For now, return a simplified decomposition
    const tasks: TaskDefinition[] = [
      {
        id: {
          id: `task-${timestamp}-1`,
          swarmId: "enhanced-swarm",
          sequence: 1,
          priority: 1,
        } as TaskId,
        name: `Analyze ${objective}`,
        description: `Analyze the requirements for: ${objective}`,
        status: "created" as TaskStatus,
        priority: "high" as TaskPriority,
        type: "analysis" as TaskType,
        requirements: {
          capabilities: ["analysis", "planning"],
          tools: [],
          permissions: [],
        } as TaskRequirements,
        constraints: {
          dependencies: [],
          dependents: [],
          conflicts: [],
        } as TaskConstraints,
        input: { objective },
        instructions: `Analyze the requirements for: ${objective}`,
        context: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        attempts: [],
        statusHistory: [],
      },
      {
        id: {
          id: `task-${timestamp}-2`,
          swarmId: "enhanced-swarm",
          sequence: 2,
          priority: 1,
        } as TaskId,
        name: `Implement ${objective}`,
        description: `Implement the solution for: ${objective}`,
        status: "created" as TaskStatus,
        priority: "high" as TaskPriority,
        type: "coding" as TaskType,
        requirements: {
          capabilities: ["coding", "implementation"],
          tools: [],
          permissions: [],
        } as TaskRequirements,
        constraints: {
          dependencies: [{
            id: `task-${timestamp}-1`,
            swarmId: "enhanced-swarm",
            sequence: 1,
            priority: 1,
          } as TaskId],
          dependents: [],
          conflicts: [],
        } as TaskConstraints,
        input: { objective },
        instructions: `Implement the solution for: ${objective}`,
        context: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        attempts: [],
        statusHistory: [],
      },
    ];

    return tasks;
  }

  private async analyzeTaskComplexity(task: TaskDefinition): Promise<{
    task: TaskDefinition;
    complexity: "simple" | "medium" | "complex";
    estimatedTokens: number;
    requiredContext: string[];
    suggestedModel: string;
  }> {
    // Analyze task using intelligent complexity detection patterns
    const description = task.description.toLowerCase();
    const name = task.name.toLowerCase();
    
    let complexity: "simple" | "medium" | "complex" = "simple";
    let estimatedTokens = 1000;
    let suggestedModel = this.modelConfig.apply;

    // Complex task indicators
    const complexIndicators = [
      "architecture", "system design", "integration", "security",
      "performance optimization", "database schema", "api design",
    ];
    
    // Medium task indicators  
    const mediumIndicators = [
      "implement", "refactor", "optimize", "validate", "test",
      "function", "method", "class", "component",
    ];

    if (complexIndicators.some(indicator => 
      description.includes(indicator) || name.includes(indicator))) {
      complexity = "complex";
      estimatedTokens = 4000;
      suggestedModel = this.modelConfig.primary;
    } else if (mediumIndicators.some(indicator => 
      description.includes(indicator) || name.includes(indicator))) {
      complexity = "medium";
      estimatedTokens = 2000;
      suggestedModel = this.modelConfig.primary;
    }

    // Extract required context files
    const requiredContext = this.extractContextFiles(`${task.description  } ${  task.instructions || ""}`);

    return {
      task,
      complexity,
      estimatedTokens,
      requiredContext,
      suggestedModel,
    };
  }

  private extractContextFiles(text: string): string[] {
    // Extract file paths and imports from task description
    const filePatterns = [
      /[\w\-\.\/]+\.(ts|js|tsx|jsx|py|java|cpp|h|css|html|md|json|yaml|yml)/g,
      /from\s+['"]([^'"]+)['"]/g,
      /import\s+['"]([^'"]+)['"]/g,
    ];

    const files = new Set<string>();
    
    for (const pattern of filePatterns) {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => files.add(match));
      }
    }

    return Array.from(files);
  }

  private determineChunkType(file: string): "function" | "class" | "module" | "test" | "config" {
    const keywords = file.toLowerCase().split(/[\s\-_\.\/]/);
    
    if (keywords.includes("test") || keywords.includes("testing")) {
      return "test";
    }
    if (keywords.includes("config") || keywords.includes("configuration")) {
      return "config";
    }
    if (keywords.includes("type") || keywords.includes("interface")) {
      return "module";
    }
    
    // Default to module for other files
    return "module";
  }

  private async processTasks(): Promise<void> {
    logger.info(`Processing ${this.taskQueue.length} tasks`);
    
    while (this.taskQueue.length > 0) {
      const availableAgents = Array.from(this.agents.values()).filter(agent => agent.isAvailable());
      
      if (availableAgents.length === 0) {
        logger.info("No available agents, waiting...");
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }

      const nextTask = this.getNextTask();
      if (!nextTask) {
        logger.info("No tasks ready for execution, waiting...");
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }

      const bestAgent = this.findBestAgent(nextTask, availableAgents);
      if (!bestAgent) {
        logger.warn(`No suitable agent found for task: ${nextTask.name}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }

      // Prepare context window for the task
      await this.prepareContextWindow(nextTask, bestAgent);
      
      // Remove task from queue and add to active tasks
      const taskIndex = this.taskQueue.indexOf(nextTask);
      this.taskQueue.splice(taskIndex, 1);
      this.activeTasksMap.set(nextTask.id.id, nextTask);

      // Assign task to agent
      logger.info(`Assigning task ${nextTask.id.id} to agent ${bestAgent.getId()}`);
      this.emit("taskStarted", { 
        taskName: nextTask.name, 
        taskId: nextTask.id.id, 
        agentId: bestAgent.getId(), 
      });
      
      await bestAgent.assignTask(nextTask);
    }
  }

  private getNextTask(): TaskDefinition | null {
    // Find tasks with all dependencies completed
    for (const task of this.taskQueue) {
      const dependenciesMet = task.constraints.dependencies.every(depId => {
        const depTask = this.activeTasksMap.get(depId.id);
        return depTask?.status === "completed";
      });

      if (dependenciesMet) {
        return task;
      }
    }

    return null;
  }

  private findBestAgent(task: TaskDefinition, availableAgents: BaseAgent[]): BaseAgent | null {
    let bestAgent: BaseAgent | null = null;
    let bestScore = 0;

    for (const agent of availableAgents) {
      if (!agent.canHandleTask(task)) {
        continue;
      }

      const capabilities = agent.getCapabilities();
      let score = 0;

      // Score based on capability match
      const taskCapabilities = task.requirements?.capabilities || [];
      const matchingCapabilities = taskCapabilities.filter(capability => capabilities.tools.includes(capability));
      score += matchingCapabilities.length * 10;

      // Score based on agent reliability
      score += capabilities.reliability * 5;

      // Score based on agent speed
      score += capabilities.speed * 3;

      if (score > bestScore) {
        bestScore = score;
        bestAgent = agent;
      }
    }

    return bestAgent;
  }

  private async prepareContextWindow(task: TaskDefinition, agent: BaseAgent): Promise<void> {
    // Prepare context window based on task requirements
    const customProps = task.metadata?.customProperties as ExtendedTaskMetadata;
    const requiredContext = customProps?.requiredContext || [];
    const estimatedTokens = customProps?.estimatedTokens || 1000;

    const contextWindow: ContextWindow = {
      files: requiredContext,
      maxTokens: estimatedTokens,
      priority: this.determineContextPriority(task),
      chunks: await this.createContextChunks(requiredContext),
    };

    this.contextCache.set(task.id.id, contextWindow);
  }

  private determineContextPriority(task: TaskDefinition): "immediate" | "extended" | "project" | "semantic" {
    const customProps = task.metadata?.customProperties as ExtendedTaskMetadata;
    const complexity = customProps?.complexity;
    
    switch (complexity) {
      case "simple":
        return "immediate";
      case "medium":
        return "extended";
      case "complex":
        return "project";
      default:
        return "semantic";
    }
  }

  private async createContextChunks(files: string[]): Promise<ContextChunk[]> {
    const chunks: ContextChunk[] = [];
    
    for (const file of files) {
      chunks.push({
        content: `// Context for ${file}`,
        type: this.determineChunkType(file),
        priority: this.calculateChunkPriority(file),
        tokens: 100, // Simplified token calculation
      });
    }

    return chunks;
  }

  private calculateChunkPriority(file: string): number {
    // Higher priority for certain file types
    if (file.includes("test")) return 1;
    if (file.includes("config")) return 2;
    if (file.includes(".ts") || file.includes(".js")) return 3;
    return 4;
  }

  private handleAgentTaskCompleted(event: { agentId: string; taskId: string; result: any }): void {
    logger.info(`Task ${event.taskId} completed by agent ${event.agentId}`);
    
    const task = this.activeTasksMap.get(event.taskId);
    if (task) {
      task.status = "completed";
      task.completedAt = new Date();
      task.result = event.result;
      
      this.activeTasksMap.delete(event.taskId);
      
      const duration = task.completedAt.getTime() - task.createdAt.getTime();
      this.emit("taskCompleted", { 
        taskName: task.name,
        taskId: event.taskId, 
        agentId: event.agentId,
        duration,
        result: event.result, 
      });
    }
  }

  private handleAgentTaskError(event: { agentId: string; taskId: string; error: any }): void {
    logger.error(`Task ${event.taskId} failed on agent ${event.agentId}:`, event.error);
    
    const task = this.activeTasksMap.get(event.taskId);
    if (task) {
      task.status = "failed";
      task.error = {
        type: "execution_error",
        message: event.error.message,
        recoverable: true,
        retryable: true,
        context: {},
      };
      
      this.activeTasksMap.delete(event.taskId);
      this.emit("taskError", { 
        taskName: task.name,
        taskId: event.taskId, 
        agentId: event.agentId,
        error: event.error.message || event.error, 
      });
    }
  }

  getStatus(): any {
    const busyAgents = Array.from(this.agents.values()).filter(a => !a.isAvailable()).length;
    const totalTasks = this.taskQueue.length + this.activeTasksMap.size;
    const completedTasks = this.agents.size > 0 ? 
      Array.from(this.agents.values()).reduce((sum, agent) => sum + agent.getMetrics().tasksCompleted, 0) : 0;
    
    return {
      status: this.taskQueue.length === 0 && this.activeTasksMap.size === 0 ? "completed" : "executing",
      activeAgents: busyAgents,
      totalAgents: this.agents.size,
      activeTasks: this.activeTasksMap.size,
      totalTasks,
      completedTasks,
      failedTasks: 0, // TODO: Track failed tasks
      queuedTasks: this.taskQueue.length,
      strategy: this.strategy,
    };
  }

  async shutdown(): Promise<void> {
    logger.info("Shutting down Enhanced Swarm Coordinator");
    
    // Cleanup all agents
    await Promise.all(
      Array.from(this.agents.values()).map(agent => agent.cleanup()),
    );
    
    this.agents.clear();
    this.taskQueue.length = 0;
    this.activeTasksMap.clear();
    this.contextCache.clear();
    
    this.emit("shutdown");
  }
} 