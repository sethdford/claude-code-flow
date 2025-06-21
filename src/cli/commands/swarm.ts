/**
 * Enhanced Swarm Command - Integration with new comprehensive swarm system
 */

import { Command } from "../cliffy-compat.js";
import { TaskExecutor } from "../../swarm/executor.js";
import { SwarmMemoryManager } from "../../swarm/memory.js";
import { generateId } from "../../utils/helpers.js";
import { success, error, warning } from "../cli-core.js";
import type { CommandContext } from "../cli-core.js";
import { SwarmStrategy, SwarmMode, AgentType, TaskDefinition } from "../../swarm/types.js";

import * as fs from "node:fs/promises";
import type { BaseCommandOptions } from "./types.js";
// path and existsSync imports removed - not used

interface SwarmConfig {
  strategy: SwarmStrategy;
  mode: SwarmMode;
  maxAgents: number;
  maxDepth: number;
  timeout: number;
  parallel: boolean;
  monitoring: boolean;
  persistence: boolean;
  memoryNamespace: string;
}

interface SwarmAgent {
  id: string;
  name: string;
  type: AgentType;
  capabilities: AgentCapabilities;
  status: "idle" | "busy" | "error";
  currentTask: string | null;
  assignedTasks: string[];
  completedTasks: number;
  errors: number;
}

interface AgentCapabilities {
  skills: string[];
  tools: string[];
  maxConcurrency: number;
  priority: number;
}

interface SwarmObjective {
  id: string;
  name: string;
  description: string;
  strategy: SwarmStrategy;
  requirements: ObjectiveRequirements;
  status: string;
  progress: number;
}

interface ObjectiveRequirements {
  minAgents?: number;
  maxAgents?: number;
  agentTypes?: AgentType[];
  skills?: string[];
  timeout?: number;
  estimatedDuration?: number;
  maxDuration?: number;
  qualityThreshold?: number;
  reviewCoverage?: number;
  testCoverage?: number;
  reliabilityTarget?: number;
}

interface SwarmMetrics {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  activeAgents: number;
  totalAgents: number;
  startTime: number;
  executionTime: number;
  avgTaskTime: number;
  successRate: number;
}

interface SwarmFlags extends BaseCommandOptions {
  strategy?: string;
  mode?: string;
  maxAgents?: number;
  maxTasks?: number;
  maxDepth?: number;
  timeout?: string;
  taskTimeout?: number;
  taskTimeoutMinutes?: number;
  maxRetries?: number;
  qualityThreshold?: number;
  parallel?: boolean;
  monitor?: boolean;
  review?: boolean;
  testing?: boolean;
  research?: boolean;
  output?: string;
  checkpoint?: boolean;
  resume?: string;
  distributed?: boolean;
  dryRun?: boolean;
  background?: boolean;
  ui?: boolean;
  persistence?: boolean;
  verbose?: boolean;
  v?: boolean;
  streamOutput?: boolean;
  memoryNamespace?: string;
  encryption?: boolean;
  agentSelection?: string;
  taskScheduling?: string;
  loadBalancing?: string;
  faultTolerance?: string;
  communication?: string;
  d?: boolean;
}

interface ParsedSwarmOptions {
  strategy: SwarmStrategy;
  mode: SwarmMode;
  maxAgents: number;
  maxTasks: number;
  maxDepth: number;
  timeout: number;
  taskTimeout: number;
  taskTimeoutMinutes: number;
  maxRetries: number;
  qualityThreshold: number;
  parallel: boolean;
  background: boolean;
  distributed: boolean;
  review: boolean;
  testing: boolean;
  monitor: boolean;
  verbose: boolean;
  streamOutput: boolean;
  memoryNamespace: string;
  persistence: boolean;
  encryption: boolean;
  agentSelection: string;
  taskScheduling: string;
  loadBalancing: string;
  faultTolerance: string;
  communication: string;
  ui: boolean;
  dryRun: boolean;
}

interface SwarmStatus {
  objectives: number;
  tasks: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    failed: number;
  };
  agents: {
    total: number;
    active: number;
  };
}

// Temporary SwarmCoordinator stub until proper implementation is available
class SwarmCoordinator {
  private config: SwarmConfig;
  private agents: Map<string, SwarmAgent> = new Map();
  private tasks: TaskDefinition[] = [];
  private objectives: SwarmObjective[] = [];
  private status: string = "idle";
  private startTime: number = Date.now();
  private swarmId: string;
  private metrics: SwarmMetrics = {
    totalTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    activeAgents: 0,
    totalAgents: 0,
    startTime: Date.now(),
    executionTime: 0,
    avgTaskTime: 0,
    successRate: 0,
  };

  constructor(config: SwarmConfig) {
    this.config = config;
    this.swarmId = generateId("swarm");
  }

  initialize(): void {
    this.status = "initialized";
  }

  createObjective(name: string, description: string, strategy: SwarmStrategy, requirements: ObjectiveRequirements): string {
    const objectiveId = generateId("objective");
    this.objectives.push({
      id: objectiveId,
      name,
      description,
      strategy,
      requirements,
      status: "created",
      progress: 0,
    });
    return objectiveId;
  }

  registerAgent(name: string, type: AgentType, capabilities: AgentCapabilities): string {
    const agentId = generateId("agent");
    this.agents.set(agentId, {
      id: agentId,
      name,
      type,
      capabilities,
      status: "idle",
      currentTask: null,
      assignedTasks: [],
      completedTasks: 0,
      errors: 0,
    });
    return agentId;
  }

  executeObjective(objectiveId: string): void {
    const objective = this.objectives.find(o => o.id === objectiveId);
    if (objective) {
      objective.status = "executing";
      this.status = "executing";
    }
  }

  getSwarmId(): string {
    return this.swarmId;
  }

  getStatus(): string {
    return this.status;
  }

  getSwarmStatus(): SwarmStatus {
    return {
      objectives: this.objectives.length,
      tasks: {
        total: this.tasks.length,
        completed: this.tasks.filter((t: TaskDefinition) => t.status === "completed").length,
        inProgress: this.tasks.filter((t: TaskDefinition) => t.status === "running").length,
        pending: this.tasks.filter((t: TaskDefinition) => t.status === "queued").length,
        failed: this.tasks.filter((t: TaskDefinition) => t.status === "failed").length,
      },
      agents: {
        total: this.agents.size,
        active: Array.from(this.agents.values()).filter((a: SwarmAgent) => a.status === "busy").length,
      },
    };
  }

  getTasks(): TaskDefinition[] {
    return this.tasks;
  }

  getAgents(): SwarmAgent[] {
    return Array.from(this.agents.values());
  }

  getObjectives(): SwarmObjective[] {
    return this.objectives;
  }

  getObjective(objectiveId: string): SwarmObjective | undefined {
    return this.objectives.find(o => o.id === objectiveId);
  }

  getMetrics(): SwarmMetrics {
    return this.metrics;
  }

  getUptime(): number {
    return Date.now() - this.startTime;
  }

  shutdown(): void {
    this.status = "shutdown";
  }
}

export async function swarmAction(ctx: CommandContext) {
  // First check if help is requested
  if (ctx.flags.help || ctx.flags.h) {
    showSwarmHelp();
    return;
  }
  
  // The objective should be all the non-flag arguments joined together
  const objective = ctx.args.join(" ").trim();
  
  if (!objective) {
    error("Usage: swarm <objective>");
    showSwarmHelp();
    return;
  }
  
  const options = parseSwarmOptions(ctx.flags);
  const swarmId = generateId("swarm");
  
  if (options.dryRun) {
    showDryRunConfiguration(swarmId, objective, options);
    return;
  }
  
  // If UI mode is requested, launch the UI
  if (options.ui) {
    await launchSwarmUI(objective, options);
    return;
  }
  
  success(`🐝 Initializing Advanced Swarm: ${swarmId}`);
  console.log(`📋 Objective: ${objective}`);
  console.log(`🎯 Strategy: ${options.strategy}`);
  console.log(`🏗️  Mode: ${options.mode}`);
  console.log(`🤖 Max Agents: ${options.maxAgents}`);
  
  try {
    // Initialize comprehensive swarm system
    const coordinator = new SwarmCoordinator({
      strategy: options.strategy,
      mode: options.mode,
      maxAgents: options.maxAgents,
      maxDepth: options.maxDepth || 5,
      timeout: options.timeout * 60 * 1000,
      parallel: options.parallel,
      monitoring: options.monitor,
      persistence: options.persistence,
      memoryNamespace: options.memoryNamespace,
    });

    // Initialize task executor
    const executor = new TaskExecutor({
      timeoutMs: options.taskTimeout,
      retryAttempts: options.maxRetries,
      killTimeout: 5000,
      resourceLimits: {
        maxMemory: 512 * 1024 * 1024, // 512MB
        maxCpuTime: options.taskTimeout,
        maxDiskSpace: 1024 * 1024 * 1024, // 1GB
        maxNetworkConnections: 10,
        maxFileHandles: 100,
        priority: 1,
      },
      sandboxed: true,
      logLevel: options.verbose ? "debug" : "error",
      captureOutput: true,
      streamOutput: options.streamOutput,
      enableMetrics: options.monitor,
    });

    // Initialize memory manager
    const memory = new SwarmMemoryManager({
      namespace: options.memoryNamespace,
      persistencePath: `./swarm-runs/${swarmId}/memory`,
      maxMemorySize: 100 * 1024 * 1024, // 100MB
      maxEntrySize: 10 * 1024 * 1024,   // 10MB
      defaultTtl: 24 * 60 * 60 * 1000,  // 24 hours
      enableCompression: false,
      enableEncryption: options.encryption,
      consistencyLevel: "eventual",
      syncInterval: 60000,
      backupInterval: 3600000,
      maxBackups: 24,
      enableDistribution: options.distributed,
      distributionNodes: [],
      replicationFactor: 1,
      enableCaching: true,
      cacheSize: 1000,
      cacheTtl: 300000,
      // Configure quiet logging unless verbose
      logging: {
        level: options.verbose ? "debug" : "error",
        format: "text",
        destination: "console",
      },
    });

    // Start all systems
    await coordinator.initialize();
    await executor.initialize();
    await memory.initialize();

    // Create swarm tracking directory
    const swarmDir = `./swarm-runs/${swarmId}`;
    await fs.mkdir(swarmDir, { recursive: true });

    // Create objective
    const objectiveId = await coordinator.createObjective(
      `Swarm-${swarmId}`,
      objective,
      options.strategy,
      {
        minAgents: 1,
        maxAgents: options.maxAgents,
        agentTypes: getRequiredAgentTypes(options.strategy),
        estimatedDuration: options.timeout * 60 * 1000,
        maxDuration: options.timeout * 60 * 1000 * 2,
        qualityThreshold: options.qualityThreshold,
        reviewCoverage: options.review ? 1.0 : 0.0,
        testCoverage: options.testing ? 0.8 : 0.0,
        reliabilityTarget: 0.95,
      },
    );
    
    console.log(`\n📝 Objective created: ${objectiveId}`);

    // Register agents based on strategy and requirements
    const agentTypes = getRequiredAgentTypes(options.strategy);
    const agents: string[] = [];
    
    for (let i = 0; i < Math.min(options.maxAgents, agentTypes.length * 2); i++) {
      const agentType = agentTypes[i % agentTypes.length];
      const agentName = `${agentType}-${Math.floor(i / agentTypes.length) + 1}`;
      
      const agentId = coordinator.registerAgent(
        agentName,
        agentType,
        getAgentCapabilities(agentType),
      );
      
      agents.push(agentId);
      console.log(`  🤖 Registered ${agentType}: ${agentName} (${agentId})`);
    }

    // Write swarm configuration
    await fs.writeFile(`${swarmDir}/config.json`, JSON.stringify({
      swarmId,
      objectiveId,
      objective,
      strategy: options.strategy,
      mode: options.mode,
      agents,
      options,
      startTime: new Date().toISOString(),
      coordinator: {
        initialized: true,
        swarmId: coordinator.getSwarmId(),
      },
    }, null, 2), "utf8");

    // Set up event monitoring if requested (or always in background mode)
    if (options.monitor || options.background) {
      setupSwarmMonitoring(coordinator, executor, memory, swarmDir);
    }
    
    // Set up incremental status updates (always enabled)
    await setupIncrementalUpdates(coordinator, swarmDir);

    // Execute the objective
    console.log("\n🚀 Swarm execution started...");
    
    // Start the objective execution
    await coordinator.executeObjective(objectiveId);

    if (options.background && process.env.CLAUDE_SWARM_NO_BG) {
      // We're running inside the background script
      // Save state and continue with normal execution
      await fs.writeFile(`${swarmDir}/coordinator.json`, JSON.stringify({
        coordinatorRunning: true,
        pid: process.pid,
        startTime: new Date().toISOString(),
        status: coordinator.getStatus(),
        swarmId: coordinator.getSwarmId(),
      }, null, 2), "utf8");
      
      console.log("\n🌙 Running in background mode");
      console.log(`📁 Results: ${swarmDir}`);
      
      // Wait for completion in background with minimal output
      console.log("\n⏳ Processing tasks...");
      
      // Background mode uses simple polling, no detailed progress
      await waitForSwarmCompletion(coordinator, objectiveId, options);
      
      // Show final results
      await showSwarmResults(coordinator, executor, memory, swarmDir);
      
    } else if (!options.background) {
      // Wait for completion in foreground with detailed progress
      if (!options.verbose) {
        console.log("\n⏳ Processing tasks...");
        
        // Track task states for detailed display
        let lastTaskUpdate = "";
        let taskStartTime = Date.now();
        let lastCompletedCount = 0;
        
        // Show detailed progress updates
        const progressInterval = setInterval(() => {
          const status = coordinator.getSwarmStatus();
          const swarmState = coordinator.getStatus();
          
          // Get current task info
          const tasks = coordinator.getTasks();
          const activeTasks = tasks.filter((t: TaskDefinition) => t.status === "running");
          const pendingTasks = tasks.filter((t: TaskDefinition) => t.status === "queued");
          
          // Build status line
          let statusLine = `\r📊 Progress: ${status.tasks.completed}/${status.tasks.total} tasks`;
          
          if (activeTasks.length > 0) {
            const currentTask = activeTasks[0];
            const taskAgent = coordinator.getAgents().find(a => a.currentTask === String(currentTask.id));
            const agentName = taskAgent ? taskAgent.name : "unknown";
            const elapsed = Math.floor((Date.now() - taskStartTime) / 1000);
            
            statusLine += ` | 🔄 ${agentName}: ${currentTask.name ?? currentTask.type} (${elapsed}s)`;
            
            // Track when task changes
            const taskIdString = typeof currentTask.id === "string" ? currentTask.id : currentTask.id.id;
            if (taskIdString !== lastTaskUpdate) {
              lastTaskUpdate = taskIdString;
              taskStartTime = Date.now();
              // Print task on new line for history
              console.log(`\n  📝 Starting: ${currentTask.name ?? currentTask.type} → ${agentName}`);
            }
          } else if (pendingTasks.length > 0) {
            statusLine += ` | ⏸️  ${pendingTasks.length} tasks queued`;
          }
          
          // Add agent status
          const activeAgents = status.agents.active;
          if (activeAgents > 0) {
            statusLine += ` | 🤖 ${activeAgents} agents active`;
          }
          
          // Ensure line is long enough to overwrite previous
          if (typeof process !== "undefined" && process.stdout) {
            process.stdout.write(statusLine.padEnd(100, " "));
          }
          
          // Check for newly completed tasks
          if (status.tasks.completed > lastCompletedCount) {
            const completedTasks = tasks.filter(t => t.status === "completed");
            const recentlyCompleted = completedTasks.slice(lastCompletedCount);
            
            recentlyCompleted.forEach((task: TaskDefinition) => {
              console.log(`\n  ✅ Completed: ${task.name ?? task.type}`);
            });
            
            lastCompletedCount = status.tasks.completed;
          }
        }, 1000);
        
        await waitForSwarmCompletion(coordinator, objectiveId, options);
        clearInterval(progressInterval);
        console.log("\r📊 Progress: Complete!                    ");
      } else {
        console.log("\n⏳ Waiting for swarm completion...");
        await waitForSwarmCompletion(coordinator, objectiveId, options);
      }
      
      // Show final results
      await showSwarmResults(coordinator, executor, memory, swarmDir);
    }

    // Always cleanup
    // Clean up monitoring first
    if (globalMetricsInterval) {
      clearInterval(globalMetricsInterval);
      globalMetricsInterval = undefined;
    }
    if (globalStatusInterval) {
      clearInterval(globalStatusInterval);
      globalStatusInterval = undefined;
    }
    
    await coordinator.shutdown();
    await executor.shutdown();
    await memory.shutdown();
    
    // Force exit after cleanup
    setTimeout(() => {
      process.exit(0);
    }, 100);
    
  } catch (err) {
    error(`Failed to execute swarm: ${(err as Error).message}`);
    if (options.verbose) {
      console.error((err as Error).stack);
    }
  }
}

function parseSwarmOptions(flags: SwarmFlags): ParsedSwarmOptions {
  // Handle boolean true value for strategy
  let { strategy } = flags;
  if (typeof strategy === 'boolean' && strategy === true) {
    strategy = "auto";
  } else if (strategy === "true") {
    strategy = "auto";
  }
  
  // Determine mode - if parallel flag is set, use distributed mode for parallel execution
  let mode = flags.mode as SwarmMode ?? "centralized";
  if (flags.parallel && !flags.mode) {
    mode = "distributed"; // Use distributed mode for parallel execution
  }
  
  return {
    strategy: strategy as SwarmStrategy ?? "auto",
    mode,
    maxAgents: parseInt(String(flags.maxAgents || flags["max-agents"] || "5")),
    maxTasks: parseInt(String(flags.maxTasks || flags["max-tasks"] || "100")),
    maxDepth: parseInt(String(flags.maxDepth || flags["max-depth"] || "3")),
    timeout: parseInt(String(flags.timeout || "60")), // minutes
    taskTimeout: parseInt(String(flags.taskTimeout || flags["task-timeout"] || "300000")), // ms
    taskTimeoutMinutes: parseInt(String(flags.taskTimeoutMinutes || flags["task-timeout-minutes"] || "59")), // minutes
    maxRetries: parseInt(String(flags.maxRetries || flags["max-retries"] || "3")),
    qualityThreshold: parseFloat(String(flags.qualityThreshold || flags["quality-threshold"] || "0.8")),
    
    // Execution options
    parallel: Boolean(flags.parallel || false),
    background: Boolean(flags.background || false),
    distributed: Boolean(flags.distributed || false),
    
    // Quality options
    review: Boolean(flags.review || false),
    testing: Boolean(flags.testing || false),
    
    // Monitoring options
    monitor: Boolean(flags.monitor || false),
    verbose: Boolean(flags.verbose || flags.v || false),
    streamOutput: Boolean(flags.streamOutput || flags["stream-output"] || false),
    
    // Memory options
    memoryNamespace: String(flags.memoryNamespace || flags["memory-namespace"] || "swarm"),
    persistence: flags.persistence !== false,
    
    // Security options
    encryption: Boolean(flags.encryption || false),
    
    // Coordination strategy options
    agentSelection: String(flags.agentSelection || flags["agent-selection"] || "capability-based"),
    taskScheduling: String(flags.taskScheduling || flags["task-scheduling"] || "priority"),
    loadBalancing: String(flags.loadBalancing || flags["load-balancing"] || "work-stealing"),
    faultTolerance: String(flags.faultTolerance || flags["fault-tolerance"] || "retry"),
    communication: String(flags.communication || "event-driven"),
    
    // UI and debugging
    ui: Boolean(flags.ui || false),
    dryRun: Boolean(flags.dryRun || flags["dry-run"] || flags.d || false),
  };
}

function getRequiredAgentTypes(strategy: SwarmStrategy): AgentType[] {
  switch (strategy) {
    case "research":
      return ["researcher", "analyzer", "documenter"];
    case "development":
      return ["developer", "tester", "reviewer", "documenter"];
    case "analysis":
      return ["analyzer", "researcher", "documenter"];
    case "testing":
      return ["tester", "developer", "reviewer"];
    case "optimization":
      return ["analyzer", "developer", "monitor"];
    case "maintenance":
      return ["developer", "monitor", "tester"];
    default: // auto
      return ["coordinator", "developer", "researcher", "analyzer"];
  }
}

function getAgentCapabilities(agentType: AgentType): AgentCapabilities {
  const baseCapabilities = {
    skills: [] as string[],
    tools: [] as string[],
    maxConcurrency: 1,
    priority: 1,
  };

  switch (agentType) {
    case "coordinator":
      return {
        skills: ["coordination", "planning", "task-management"],
        tools: ["orchestrator", "scheduler"],
        maxConcurrency: 5,
        priority: 3,
      };
      
    case "developer":
      return {
        skills: ["code-generation", "implementation", "problem-solving"],
        tools: ["compiler", "interpreter", "file-system"],
        maxConcurrency: 2,
        priority: 2,
      };
      
    case "researcher":
      return {
        skills: ["research", "analysis", "documentation"],
        tools: ["web-search", "knowledge-base"],
        maxConcurrency: 3,
        priority: 2,
      };
      
    case "reviewer":
      return {
        skills: ["code-review", "quality-assurance", "testing"],
        tools: ["static-analysis", "linters"],
        maxConcurrency: 2,
        priority: 2,
      };
      
    case "specialist":
      return {
        skills: ["optimization", "performance", "refactoring"],
        tools: ["profiler", "benchmark"],
        maxConcurrency: 1,
        priority: 1,
      };
      
    case "analyzer":
      return {
        skills: ["data-analysis", "statistics", "research"],
        tools: ["jupyter", "data-tools"],
        maxConcurrency: 2,
        priority: 2,
      };
      
    case "tester":
      return {
        skills: ["testing", "quality-assurance", "automation"],
        tools: ["test-runners", "coverage-tools"],
        maxConcurrency: 2,
        priority: 2,
      };
      
    default:
      return baseCapabilities;
  }
}

let globalMetricsInterval: NodeJS.Timeout | undefined;
let globalStatusInterval: NodeJS.Timeout | undefined;

async function setupIncrementalUpdates(
  coordinator: SwarmCoordinator,
  swarmDir: string,
): Promise<void> {
  const statusFile = `${swarmDir}/status.json`;
  const tasksDir = `${swarmDir}/tasks`;
  
  // Create tasks directory
  await fs.mkdir(tasksDir, { recursive: true });
  
  // Initialize with first status update
  try {
    const initialStatus = coordinator.getSwarmStatus();
    const initialTasks = coordinator.getTasks();
    const initialAgents = coordinator.getAgents();
    const initialObjective = coordinator.getObjectives()[0];
    
    await fs.writeFile(statusFile, JSON.stringify({
      timestamp: new Date().toISOString(),
      swarmStatus: initialStatus,
      objective: initialObjective ? {
        id: initialObjective.id,
        name: initialObjective.name,
        status: initialObjective.status,
        progress: initialObjective.progress || 0,
      } : null,
      agents: initialAgents.map((a: SwarmAgent) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        status: a.status,
        currentTask: a.currentTask,
        tasksCompleted: a.completedTasks || 0,
      })),
      tasks: {
        total: initialTasks.length,
        completed: initialTasks.filter((t: TaskDefinition) => t.status === "completed").length,
        inProgress: initialTasks.filter((t: TaskDefinition) => t.status === "running").length,
        pending: initialTasks.filter((t: TaskDefinition) => t.status === "queued").length,
        failed: initialTasks.filter((t: TaskDefinition) => t.status === "failed").length,
      },
    }, null, 2));
    
    // Create initial progress file
    const initialProgressText = `Swarm Progress
==============
Timestamp: ${new Date().toISOString()}
Objective: ${initialObjective?.name || "Unknown"}
Status: ${initialObjective?.status || "Unknown"}

Tasks: ${initialStatus.tasks.completed}/${initialStatus.tasks.total} completed
- In Progress: ${initialStatus.tasks.inProgress}
- Pending: ${initialStatus.tasks.pending}
- Failed: ${initialStatus.tasks.failed}

Agents: ${initialStatus.agents.active}/${initialStatus.agents.total} active
`;
    await fs.writeFile(`${swarmDir}/progress.txt`, initialProgressText, "utf8");
  } catch (error) {
    console.warn("Failed to create initial status files:", (error as Error).message);
  }
  
  // Set up periodic status updates - use longer interval for background mode
  const updateInterval = process.env.CLAUDE_SWARM_NO_BG ? 3000 : 5000; // 3s for background, 5s for foreground
  
  const updateFunction = async () => {
    try {
      const status = coordinator.getSwarmStatus();
      const tasks = coordinator.getTasks();
      const agents = coordinator.getAgents();
      const objective = coordinator.getObjectives()[0];
      
      // Write main status
      await fs.writeFile(statusFile, JSON.stringify({
        timestamp: new Date().toISOString(),
        swarmStatus: status,
        objective: objective ? {
          id: objective.id,
          name: objective.name,
          status: objective.status,
          progress: objective.progress || 0,
        } : null,
        agents: agents.map((a: SwarmAgent) => ({
          id: a.id,
          name: a.name,
          type: a.type,
          status: a.status,
          currentTask: a.currentTask,
          tasksCompleted: a.completedTasks || 0,
        })),
        tasks: {
          total: tasks.length,
          completed: tasks.filter((t: TaskDefinition) => t.status === "completed").length,
          inProgress: tasks.filter((t: TaskDefinition) => t.status === "running").length,
          pending: tasks.filter((t: TaskDefinition) => t.status === "queued").length,
          failed: tasks.filter((t: TaskDefinition) => t.status === "failed").length,
        },
      }, null, 2), "utf8");
      
      // Write individual task files
      for (const task of tasks) {
        // Extract task ID string - handle both string and object IDs
        const taskId = typeof task.id === "string" ? task.id : task.id?.id || "unknown";
        const taskFile = `${tasksDir}/${taskId}.json`;
        await fs.writeFile(taskFile, JSON.stringify({
          id: task.id,
          name: task.name,
          type: task.type,
          status: task.status,
          assignedTo: task.assignedTo,
          startedAt: task.startedAt,
          completedAt: task.completedAt,
          result: task.result,
          error: task.error,
          metadata: task.metadata,
        }, null, 2), "utf8");
      }
      
      // Write a simple progress file for easy monitoring
      const progressFile = `${swarmDir}/progress.txt`;
      const progressText = `Swarm Progress
==============
Timestamp: ${new Date().toISOString()}
Objective: ${objective?.name || "Unknown"}
Status: ${objective?.status || "Unknown"}

Tasks: ${status.tasks.completed}/${status.tasks.total} completed
- In Progress: ${status.tasks.inProgress}
- Pending: ${status.tasks.pending}
- Failed: ${status.tasks.failed}

Agents: ${status.agents.active}/${status.agents.total} active
`;
      await fs.writeFile(progressFile, progressText, "utf8");
      
    } catch (error) {
      // Write error to debug file but don't disrupt swarm
      try {
        await fs.appendFile(`${swarmDir}/update-errors.log`, 
          `${new Date().toISOString()}: ${(error as Error).message}\n`, "utf8");
      } catch (e) {
        // Ignore file write errors
      }
    }
  };
  
  // Set up the interval
  globalStatusInterval = setInterval(updateFunction, updateInterval);
  
  // Enhanced signal handling for process cleanup
  const cleanup = () => {
    if (globalStatusInterval) {
      clearInterval(globalStatusInterval);
      globalStatusInterval = undefined;
    }
  };
  
  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
  process.on("SIGHUP", cleanup);
  process.on("exit", cleanup);
}

function setupSwarmMonitoring(
  coordinator: SwarmCoordinator,
  executor: TaskExecutor,
  memory: SwarmMemoryManager,
  swarmDir: string,
): void {
  const metricsFile = `${swarmDir}/metrics.jsonl`;
  
  // Set up periodic metrics collection
  globalMetricsInterval = setInterval(async () => {
    try {
      const metrics = {
        timestamp: new Date().toISOString(),
        coordinator: {
          status: coordinator.getStatus(),
          agents: coordinator.getAgents().length,
          metrics: coordinator.getMetrics(),
        },
        executor: {
          metrics: executor.getExecutionMetrics(),
        },
        memory: {
          statistics: memory.getStatistics(),
        },
      };
      
      await fs.appendFile(metricsFile, `${JSON.stringify(metrics)  }\n`, "utf8");
    } catch (error) {
      console.warn("Failed to collect metrics:", (error as Error).message);
    }
  }, 10000); // Every 10 seconds
  
  // Clean up on process exit
  const cleanup = () => {
    if (globalMetricsInterval) {
      clearInterval(globalMetricsInterval);
      globalMetricsInterval = undefined;
    }
  };
  
  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
}

async function waitForSwarmCompletion(
  coordinator: SwarmCoordinator,
  objectiveId: string,
  options: ParsedSwarmOptions,
): Promise<void> {
  let lastStatus = "";
  const startTime = Date.now();
  
  return new Promise((resolve, reject) => {
    const checkInterval = setInterval(async () => {
      try {
        const currentStatus = coordinator.getStatus();
        const swarmStatus = coordinator.getSwarmStatus();
        
        // Only log status changes to reduce noise
        if (currentStatus !== lastStatus) {
          console.log(`📊 Status: ${currentStatus}`);
          lastStatus = currentStatus;
        }
        
        // Check if swarm is complete
        if (currentStatus === "completed" || 
            (swarmStatus.tasks.total > 0 && 
             swarmStatus.tasks.completed === swarmStatus.tasks.total)) {
          clearInterval(checkInterval);
          resolve();
          return;
        }
        
        // Check for failure conditions
        if (currentStatus === "failed" || 
            (swarmStatus.tasks.failed > 0 && 
             swarmStatus.tasks.failed === swarmStatus.tasks.total)) {
          clearInterval(checkInterval);
          reject(new Error("Swarm execution failed"));
          return;
        }
        
        // Timeout check
        const elapsed = Date.now() - startTime;
        if (elapsed > options.timeout * 60 * 1000) {
          clearInterval(checkInterval);
          reject(new Error("Swarm execution timed out"));
          return;
        }
        
      } catch (err) {
        clearInterval(checkInterval);
        reject(err);
      }
    }, 2000); // Check every 2 seconds
  });
}

async function showSwarmResults(
  coordinator: SwarmCoordinator,
  executor: TaskExecutor,
  memory: SwarmMemoryManager,
  swarmDir: string,
): Promise<void> {
  const metrics = coordinator.getMetrics();
  const executorMetrics = executor.getExecutionMetrics();
  const memoryStats = memory.getStatistics();
  const swarmStatus = coordinator.getSwarmStatus();
  
  // Write final results
  const results = {
    completed: true,
    endTime: new Date().toISOString(),
    metrics,
    executorMetrics,
    memoryStats,
    swarmStatus,
  };
  
  await fs.writeFile(`${swarmDir}/results.json`, JSON.stringify(results, null, 2), "utf8");
  
  // Show summary
  success("\n✅ Swarm completed successfully!");
  console.log("\n📊 Final Results:");
  console.log(`  • Objectives: ${swarmStatus.objectives}`);
  console.log(`  • Tasks Completed: ${swarmStatus.tasks.completed}`);
  console.log(`  • Tasks Failed: ${swarmStatus.tasks.failed}`);
  console.log(`  • Success Rate: ${(swarmStatus.tasks.completed / (swarmStatus.tasks.completed + swarmStatus.tasks.failed) * 100).toFixed(1)}%`);
  console.log(`  • Agents Used: ${swarmStatus.agents.total}`);
  console.log(`  • Memory Entries: ${memoryStats.totalEntries}`);
  console.log(`  • Execution Time: ${(coordinator.getUptime() / 1000).toFixed(1)}s`);
  console.log(`  • Results saved to: ${swarmDir}`);
  
  // Check for created files
  try {
    // Look for any files created during the swarm execution
    const createdFiles: string[] = [];
    const checkDir = async (dir: string, depth = 0) => {
      if (depth > 3) return; // Limit recursion depth
      
      try {
        for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
          if (entry.isFile() && !entry.name.startsWith(".") && 
              !dir.includes("swarm-runs") && !dir.includes("node_modules")) {
            const fullPath = `${dir}/${entry.name}`;
            const stat = await fs.stat(fullPath);
            // Check if file was created recently (within swarm execution time)
            const executionStartTime = Date.now() - coordinator.getUptime();
            if (stat.mtime && stat.mtime.getTime() > executionStartTime) {
              createdFiles.push(fullPath);
            }
          } else if (entry.isDirectory() && !entry.name.startsWith(".") && 
                     !entry.name.includes("node_modules") && !entry.name.includes("swarm-runs")) {
            await checkDir(`${dir}/${entry.name}`, depth + 1);
          }
        }
      } catch (e) {
        // Ignore permission errors
      }
    };
    
    // Check current directory and common output directories
    await checkDir(".");
    await checkDir("./examples").catch(() => {});
    await checkDir("./output").catch(() => {});
    
    if (createdFiles.length > 0) {
      console.log("\n📁 Files created:");
      createdFiles.forEach(file => {
        console.log(`  • ${file}`);
      });
    }
  } catch (e) {
    // Ignore errors in file checking
  }
}

function launchSwarmUI(objective: string, options: ParsedSwarmOptions): void {
  console.log("🖥️  Launching Swarm UI...");
  // UI implementation would go here
}

function buildUIArgs(options: ParsedSwarmOptions): string[] {
  const args: string[] = [];
  
  args.push("--strategy", options.strategy);
  args.push("--mode", options.mode);
  args.push("--max-agents", String(options.maxAgents));
  
  if (options.parallel) args.push("--parallel");
  if (options.monitor) args.push("--monitor");
  if (options.verbose) args.push("--verbose");
  
  return args;
}

function showDryRunConfiguration(swarmId: string, objective: string, options: ParsedSwarmOptions): void {
  console.log("\n🔍 Dry Run Configuration:");
  console.log(`  Swarm ID: ${swarmId}`);
  console.log(`  Objective: ${objective}`);
  console.log(`  Strategy: ${options.strategy}`);
  console.log(`  Mode: ${options.mode}`);
  console.log(`  Max Agents: ${options.maxAgents}`);
  console.log(`  Timeout: ${options.timeout} minutes`);
  console.log(`  Parallel: ${options.parallel}`);
  console.log(`  Monitoring: ${options.monitor}`);
  console.log(`  Persistence: ${options.persistence}`);
  console.log(`  Memory Namespace: ${options.memoryNamespace}`);
  
  if (options.review) console.log("  ✅ Code review enabled");
  if (options.testing) console.log("  🧪 Testing enabled");
  if (options.encryption) console.log("  🔒 Encryption enabled");
  
  console.log("\n📋 Required Agent Types:");
  const agentTypes = getRequiredAgentTypes(options.strategy);
  for (const agentType of agentTypes) {
    const capabilities = getAgentCapabilities(agentType);
    console.log(`  🤖 ${agentType}: ${capabilities.skills.join(", ")}`);
  }
  
  console.log("\n💡 This was a dry run. Use --no-dry-run to execute.");
}

function showSwarmHelp(): void {
  console.log(`
🐝 Claude Flow Advanced Swarm System

USAGE:
  claude-flow swarm <objective> [options]

EXAMPLES:
  claude-flow swarm "Build a REST API" --strategy development
  claude-flow swarm "Research cloud architecture" --strategy research --ui
  claude-flow swarm "Analyze data trends" --strategy analysis --parallel
  claude-flow swarm "Optimize performance" --distributed --monitor

STRATEGIES:
  auto           Automatically determine best approach (default)
  research       Research and information gathering
  development    Software development and coding
  analysis       Data analysis and insights
  testing        Testing and quality assurance
  optimization   Performance optimization
  maintenance    System maintenance

MODES:
  centralized    Single coordinator (default)
  distributed    Multiple coordinators
  hierarchical   Tree structure coordination
  mesh           Peer-to-peer coordination
  hybrid         Mixed coordination strategies

OPTIONS:
  --strategy <type>          Execution strategy (default: auto)
  --mode <type>              Coordination mode (default: centralized)
  --max-agents <n>           Maximum agents (default: 5)
  --max-tasks <n>            Maximum tasks (default: 100)
  --timeout <minutes>        Timeout in minutes (default: 60)
  --task-timeout <ms>        Individual task timeout (default: 300000)
  --max-retries <n>          Maximum retries per task (default: 3)
  --quality-threshold <n>    Quality threshold 0-1 (default: 0.8)

EXECUTION:
  --parallel                 Enable parallel execution
  --background               Run in background mode
  --distributed              Enable distributed coordination
  --stream-output            Stream real-time output

QUALITY:
  --review                   Enable peer review
  --testing                  Enable automated testing

MONITORING:
  --monitor                  Enable real-time monitoring
  --verbose                  Enable detailed logging
  --ui                       Launch terminal UI interface

MEMORY:
  --memory-namespace <name>  Memory namespace (default: swarm)
  --persistence              Enable persistence (default: true)
  --encryption               Enable encryption

COORDINATION:
  --agent-selection <type>   Agent selection strategy
  --task-scheduling <type>   Task scheduling algorithm
  --load-balancing <type>    Load balancing method
  --fault-tolerance <type>   Fault tolerance strategy
  --communication <type>     Communication pattern

DEBUGGING:
  --dry-run                  Show configuration without executing
  --help                     Show this help message

ADVANCED FEATURES:
  🤖 Intelligent agent selection and management
  ⚡ Timeout-free background task execution
  🧠 Distributed memory sharing between agents
  🔄 Work stealing and load balancing
  🛡️  Circuit breaker patterns for reliability
  📊 Real-time monitoring and metrics
  🎛️  Multiple coordination strategies
  💾 Persistent state and recovery
  🔒 Security and encryption options
  🖥️  Interactive terminal UI

For more information, visit: https://github.com/sethdford/vibex-claude-code-flow
Original project by @ruvnet: https://github.com/ruvnet/claude-code-flow
`);
}

// Export swarmCommand for CLI integration
export const swarmCommand = new Command()
  .name("swarm")
  .description("Multi-agent swarm orchestration for complex objectives")
  .arguments("<objective>")
  .option("--strategy <type>", "Strategy: auto, research, development, analysis", "auto")
  .option("--mode <type>", "Coordination mode: centralized, distributed, hierarchical", "centralized")
  .option("--max-agents <n>", "Maximum number of agents", "5")
  .option("--max-tasks <n>", "Maximum number of tasks", "100")
  .option("--timeout <minutes>", "Timeout in minutes", "60")
  .option("--parallel", "Enable parallel execution")
  .option("--monitor", "Enable real-time monitoring")
  .option("--review", "Enable peer review")
  .option("--testing", "Enable testing")
  .option("--background", "Run in background mode")
  .option("--distributed", "Enable distributed coordination")
  .option("--memory-namespace <ns>", "Memory namespace", "swarm")
  .option("--persistence", "Enable persistence", true)
  .option("--dry-run", "Show configuration without executing")
  .option("--ui", "Launch terminal UI")
  .option("-v, --verbose", "Enable verbose logging")
  .action(async (objective: string, options: SwarmFlags) => {
    const ctx: CommandContext = {
      args: [objective],
      flags: options as Record<string, unknown>,
      config: undefined,
    };
    await swarmAction(ctx);
  });