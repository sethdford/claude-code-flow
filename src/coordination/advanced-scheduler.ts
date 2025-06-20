/**
 * Simplified Advanced Task Scheduler
 * Basic agent selection without complex strategies
 */

import { Task, CoordinationConfig, AgentProfile } from "../utils/types.js";
import { IEventBus } from "../core/event-bus.js";
import { ILogger } from "../core/logger.js";
import { TaskScheduler, ScheduledTask } from "./scheduler.js";

/**
 * Simple advanced scheduler that extends basic scheduler
 * Removed complex scheduling strategies and circuit breakers
 */
export class AdvancedTaskScheduler extends TaskScheduler {
  private agentLoads = new Map<string, number>();
  private availableAgents = new Map<string, AgentProfile>();

  constructor(
    config: CoordinationConfig,
    eventBus: IEventBus,
    logger: ILogger,
  ) {
    super(config, eventBus, logger);
  }

  /**
   * Register an agent as available for tasks
   */
  registerAgent(agent: AgentProfile): void {
    this.availableAgents.set(agent.id, agent);
    this.agentLoads.set(agent.id, 0);
    
    this.logger.info("Agent registered", { agentId: agent.id });
  }

  /**
   * Unregister an agent
   */
  unregisterAgent(agentId: string): void {
    this.availableAgents.delete(agentId);
    this.agentLoads.delete(agentId);
    
    // Reassign any tasks from this agent
    const tasks = this.agentTasks.get(agentId);
    if (tasks) {
      tasks.forEach(taskId => {
        const task = this.tasks.get(taskId);
        if (task) {
          this.reassignTask(task);
        }
      });
    }
    
    this.logger.info("Agent unregistered", { agentId });
  }

  /**
   * Simple agent selection - pick the least loaded agent
   */
  async selectAgentForTask(task: Task): Promise<string | null> {
    const agents = Array.from(this.availableAgents.values());
    
    if (agents.length === 0) {
      this.logger.warn("No agents available for task", { taskId: task.id });
      return null;
    }

    // Simple least-loaded selection
    let selectedAgent: AgentProfile | null = null;
    let minLoad = Infinity;

    for (const agent of agents) {
      const load = this.agentLoads.get(agent.id) || 0;
      
      // Check if agent can handle the task type
      if (task.type !== "any" && agent.capabilities && 
          !agent.capabilities.includes(task.type) && 
          !agent.capabilities.includes("*")) {
        continue;
      }

      if (load < minLoad) {
        minLoad = load;
        selectedAgent = agent;
      }
    }

    return selectedAgent?.id || null;
  }

  /**
   * Schedule a task with simple agent selection
   */
  async scheduleTask(task: Task, agentId?: string): Promise<void> {
    // If no agent specified, select one
    if (!agentId) {
      const selected = await this.selectAgentForTask(task);
      if (!selected) {
        throw new Error(`No suitable agent found for task ${task.id}`);
      }
      agentId = selected;
    }

    // Update load
    const currentLoad = this.agentLoads.get(agentId) || 0;
    this.agentLoads.set(agentId, currentLoad + 1);

    // Schedule the task
    await super.assignTask(task, agentId);
  }

  /**
   * Complete a task and update agent load
   */
  override async completeTask(taskId: string, _result: any): Promise<void> {
    const scheduledTask = this.tasks.get(taskId);
    if (scheduledTask) {
      const load = this.agentLoads.get(scheduledTask.agentId) || 0;
      this.agentLoads.set(scheduledTask.agentId, Math.max(0, load - 1));
    }

    await super.completeTask(taskId, result);
  }

  /**
   * Reassign a task to a different agent
   */
  private async reassignTask(scheduledTask: ScheduledTask): Promise<void> {
    const newAgentId = await this.selectAgentForTask(scheduledTask.task);
    if (newAgentId && newAgentId !== scheduledTask.agentId) {
      // Remove from old agent
      const oldTasks = this.agentTasks.get(scheduledTask.agentId);
      if (oldTasks) {
        oldTasks.delete(scheduledTask.task.id);
      }

      // Update scheduled task
      scheduledTask.agentId = newAgentId;

      // Add to new agent
      if (!this.agentTasks.has(newAgentId)) {
        this.agentTasks.set(newAgentId, new Set());
      }
      this.agentTasks.get(newAgentId)!.add(scheduledTask.task.id);

      // Update loads
      const oldLoad = this.agentLoads.get(scheduledTask.agentId) || 0;
      this.agentLoads.set(scheduledTask.agentId, Math.max(0, oldLoad - 1));
      
      const newLoad = this.agentLoads.get(newAgentId) || 0;
      this.agentLoads.set(newAgentId, newLoad + 1);

      this.logger.info("Task reassigned", {
        taskId: scheduledTask.task.id,
        from: scheduledTask.agentId,
        to: newAgentId,
      });
    }
  }

  /**
   * Get current scheduler status
   */
  getStatus(): {
    totalTasks: number;
    agents: Array<{ id: string; load: number; capabilities?: string[] }>;
    queuedTasks: number;
    } {
    const agents = Array.from(this.availableAgents.entries()).map(([id, agent]) => ({
      id,
      load: this.agentLoads.get(id) || 0,
      capabilities: agent.capabilities,
    }));

    const queuedTasks = Array.from(this.tasks.values())
      .filter(t => t.task.status === "pending").length;

    return {
      totalTasks: this.tasks.size,
      agents,
      queuedTasks,
    };
  }
}