/**
 * Enhanced Swarm Command - Integration with new comprehensive swarm system
 */

import { TaskExecutor } from "../../swarm/executor.js";
import { SwarmMemoryManager } from "../../swarm/memory.js";
import { generateId } from "../../utils/helpers.js";
import { success, error, warning, info } from "../cli-core.js";
import type { CommandContext } from "../cli-core.js";
import { SwarmStrategy, SwarmMode, AgentType, TaskDefinition, AgentState, TaskStatus } from "../../swarm/types.js";

import * as fs from "node:fs/promises";
import * as path from "node:path";
import { existsSync } from "node:fs";

// Temporary SwarmCoordinator stub until proper implementation is available
class SwarmCoordinator {
  private config: any;
  private agents: Map<string, any> = new Map();
  private tasks: TaskDefinition[] = [];
  private objectives: any[] = [];
  private status: string = "idle";
  private startTime: number = Date.now();
  private swarmId: string;
  private metrics: any = {};

  constructor(config: any) {
    this.config = config;
    this.swarmId = generateId("swarm");
  }

  async initialize(): Promise<void> {
    this.status = "initialized";
  }

  async createObjective(name: string, description: string, strategy: SwarmStrategy, requirements: any): Promise<string> {
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

  async registerAgent(name: string, type: AgentType, capabilities: any): Promise<string> {
    const agentId = generateId("agent");
    this.agents.set(agentId, {
      id: agentId,
      name,
      type,
      capabilities,
      status: "idle",
      currentTask: null,
      completedTasks: [],
    });
    return agentId;
  }

  async executeObjective(objectiveId: string): Promise<void> {
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

  getSwarmStatus(): any {
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
        active: Array.from(this.agents.values()).filter((a: any) => a.status === "busy").length,
      },
    };
  }

  getTasks(): TaskDefinition[] {
    return this.tasks;
  }

  getAgents(): any[] {
    return Array.from(this.agents.values());
  }

  getObjectives(): any[] {
    return this.objectives;
  }

  getObjective(objectiveId: string): any {
    return this.objectives.find(o => o.id === objectiveId);
  }

  getMetrics(): any {
    return this.metrics;
  }

  getUptime(): number {
    return Date.now() - this.startTime;
  }

  async shutdown(): Promise<void> {
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
      name: `Swarm-${swarmId}`,
      description: objective,
      mode: options.mode,
      strategy: options.strategy,
      maxAgents: options.maxAgents,
      maxTasks: options.maxTasks,
      maxDuration: options.timeout * 60 * 1000,
      taskTimeoutMinutes: options.taskTimeoutMinutes,
      qualityThreshold: options.qualityThreshold,
      reviewRequired: options.review,
      testingRequired: options.testing,
      // Configure quiet logging unless verbose
      logging: {
        level: options.verbose ? "debug" : "error",
        format: "text",
        destination: "console",
      },
      coordinationStrategy: {
        name: "advanced",
        description: "Advanced coordination with all features",
        agentSelection: options.agentSelection,
        taskScheduling: options.taskScheduling,
        loadBalancing: options.loadBalancing,
        faultTolerance: options.faultTolerance,
        communication: options.communication,
      },
      monitoring: {
        metricsEnabled: options.monitor,
        loggingEnabled: true,
        tracingEnabled: options.verbose,
        metricsInterval: 5000,
        heartbeatInterval: 60000, // Increased to 60 seconds for long Claude executions
        healthCheckInterval: 120000, // Increased to 2 minutes
        retentionPeriod: 24 * 60 * 60 * 1000,
        maxLogSize: 100 * 1024 * 1024,
        maxMetricPoints: 10000,
        alertingEnabled: true,
        alertThresholds: {
          errorRate: 0.1,
          responseTime: 10000,
          memoryUsage: 0.8,
          cpuUsage: 0.8,
        },
        exportEnabled: false,
        exportFormat: "json",
        exportDestination: `./swarm-runs/${swarmId}/metrics`,
      },
      memory: {
        namespace: options.memoryNamespace,
        partitions: [],
        permissions: {
          read: "swarm",
          write: "team",
          delete: "private",
          share: "team",
        },
        persistent: options.persistence,
        backupEnabled: true,
        distributed: options.distributed,
        consistency: "eventual",
        cacheEnabled: true,
        compressionEnabled: false,
      },
      security: {
        authenticationRequired: false,
        authorizationRequired: false,
        encryptionEnabled: options.encryption,
        defaultPermissions: ["read", "write"],
        adminRoles: ["coordinator"],
        auditEnabled: true,
        auditLevel: "info",
        inputValidation: true,
        outputSanitization: true,
      },
      performance: {
        maxConcurrency: options.parallel ? options.maxAgents : 1,
        defaultTimeout: options.taskTimeout,
        cacheEnabled: true,
        cacheSize: 1000,
        cacheTtl: 300000,
        optimizationEnabled: true,
        adaptiveScheduling: true,
        predictiveLoading: false,
        resourcePooling: true,
        connectionPooling: true,
        memoryPooling: false,
      },
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
      
      const agentId = await coordinator.registerAgent(
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
            const taskAgent = coordinator.getAgents().find(a => a.currentTask === currentTask.id);
            const agentName = taskAgent ? taskAgent.name : "unknown";
            const elapsed = Math.floor((Date.now() - taskStartTime) / 1000);
            
            statusLine += ` | 🔄 ${agentName}: ${currentTask.name || currentTask.type} (${elapsed}s)`;
            
            // Track when task changes
            const taskIdString = typeof currentTask.id === "string" ? currentTask.id : currentTask.id.id;
            if (taskIdString !== lastTaskUpdate) {
              lastTaskUpdate = taskIdString;
              taskStartTime = Date.now();
              // Print task on new line for history
              console.log(`\n  📝 Starting: ${currentTask.name || currentTask.type} → ${agentName}`);
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
            
            recentlyCompleted.forEach((task: any) => {
              console.log(`\n  ✅ Completed: ${task.name || task.type}`);
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

function parseSwarmOptions(flags: any) {
  // Handle boolean true value for strategy
  let { strategy } = flags;
  if (strategy === true || strategy === "true") {
    strategy = "auto";
  }
  
  // Determine mode - if parallel flag is set, use distributed mode for parallel execution
  let mode = flags.mode as SwarmMode || "centralized";
  if (flags.parallel && !flags.mode) {
    mode = "distributed"; // Use distributed mode for parallel execution
  }
  
  return {
    strategy: strategy as SwarmStrategy || "auto",
    mode,
    maxAgents: parseInt(flags.maxAgents || flags["max-agents"] || "5"),
    maxTasks: parseInt(flags.maxTasks || flags["max-tasks"] || "100"),
    timeout: parseInt(flags.timeout || "60"), // minutes
    taskTimeout: parseInt(flags.taskTimeout || flags["task-timeout"] || "300000"), // ms
    taskTimeoutMinutes: parseInt(flags.taskTimeoutMinutes || flags["task-timeout-minutes"] || "59"), // minutes
    maxRetries: parseInt(flags.maxRetries || flags["max-retries"] || "3"),
    qualityThreshold: parseFloat(flags.qualityThreshold || flags["quality-threshold"] || "0.8"),
    
    // Execution options
    parallel: flags.parallel || false,
    background: flags.background || false,
    distributed: flags.distributed || false,
    
    // Quality options
    review: flags.review || false,
    testing: flags.testing || false,
    
    // Monitoring options
    monitor: flags.monitor || false,
    verbose: flags.verbose || flags.v || false,
    streamOutput: flags.streamOutput || flags["stream-output"] || false,
    
    // Memory options
    memoryNamespace: flags.memoryNamespace || flags["memory-namespace"] || "swarm",
    persistence: flags.persistence !== false,
    
    // Security options
    encryption: flags.encryption || false,
    
    // Coordination strategy options
    agentSelection: flags.agentSelection || flags["agent-selection"] || "capability-based",
    taskScheduling: flags.taskScheduling || flags["task-scheduling"] || "priority",
    loadBalancing: flags.loadBalancing || flags["load-balancing"] || "work-stealing",
    faultTolerance: flags.faultTolerance || flags["fault-tolerance"] || "retry",
    communication: flags.communication || "event-driven",
    
    // UI and debugging
    ui: flags.ui || false,
    dryRun: flags.dryRun || flags["dry-run"] || flags.d || false,
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

function getAgentCapabilities(agentType: AgentType) {
  const baseCapabilities = {
    maxConcurrentTasks: 3,
    maxMemoryUsage: 256 * 1024 * 1024, // 256MB
    maxExecutionTime: 300000, // 5 minutes
    reliability: 0.8,
    speed: 1.0,
    quality: 0.8,
  };

  switch (agentType) {
    case "coordinator":
      return {
        ...baseCapabilities,
        codeGeneration: false,
        codeReview: true,
        testing: false,
        documentation: true,
        research: true,
        analysis: true,
        webSearch: false,
        apiIntegration: true,
        fileSystem: true,
        terminalAccess: true,
        languages: ["typescript", "javascript"],
        frameworks: ["deno", "node"],
        domains: ["coordination", "management"],
        tools: ["git", "npm", "deno"],
        reliability: 0.95,
      };
      
    case "developer":
      return {
        ...baseCapabilities,
        codeGeneration: true,
        codeReview: true,
        testing: true,
        documentation: true,
        research: false,
        analysis: false,
        webSearch: false,
        apiIntegration: true,
        fileSystem: true,
        terminalAccess: true,
        languages: ["typescript", "javascript", "python", "rust"],
        frameworks: ["deno", "node", "react", "express"],
        domains: ["software-development", "web-development"],
        tools: ["git", "npm", "deno", "docker"],
        quality: 0.9,
      };
      
    case "researcher":
      return {
        ...baseCapabilities,
        codeGeneration: false,
        codeReview: false,
        testing: false,
        documentation: true,
        research: true,
        analysis: true,
        webSearch: true,
        apiIntegration: true,
        fileSystem: true,
        terminalAccess: false,
        languages: [],
        frameworks: [],
        domains: ["research", "data-analysis"],
        tools: ["browser", "search-engines"],
        reliability: 0.85,
      };
      
    case "analyzer":
      return {
        ...baseCapabilities,
        codeGeneration: false,
        codeReview: true,
        testing: false,
        documentation: true,
        research: true,
        analysis: true,
        webSearch: false,
        apiIntegration: true,
        fileSystem: true,
        terminalAccess: true,
        languages: ["python", "r", "sql"],
        frameworks: ["pandas", "numpy"],
        domains: ["data-analysis", "statistics"],
        tools: ["jupyter", "data-tools"],
        quality: 0.9,
      };
      
    case "tester":
      return {
        ...baseCapabilities,
        codeGeneration: false,
        codeReview: true,
        testing: true,
        documentation: true,
        research: false,
        analysis: false,
        webSearch: false,
        apiIntegration: true,
        fileSystem: true,
        terminalAccess: true,
        languages: ["typescript", "javascript"],
        frameworks: ["jest", "vitest", "playwright"],
        domains: ["testing", "quality-assurance"],
        tools: ["test-runners", "coverage-tools"],
        reliability: 0.9,
      };
      
    case "reviewer":
      return {
        ...baseCapabilities,
        codeGeneration: false,
        codeReview: true,
        testing: true,
        documentation: true,
        research: false,
        analysis: true,
        webSearch: false,
        apiIntegration: false,
        fileSystem: true,
        terminalAccess: false,
        languages: ["typescript", "javascript", "python"],
        frameworks: [],
        domains: ["code-review", "quality-assurance"],
        tools: ["static-analysis", "linters"],
        quality: 0.95,
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
      agents: initialAgents.map((a: any) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        status: a.status,
        currentTask: a.currentTask,
        tasksCompleted: a.completedTasks?.length || 0,
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
        agents: agents.map((a: any) => ({
          id: a.id,
          name: a.name,
          type: a.type,
          status: a.status,
          currentTask: a.currentTask,
          tasksCompleted: a.completedTasks?.length || 0,
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
  
  // Also set up more aggressive cleanup to ensure intervals persist
  const cleanup = () => {
    if (globalStatusInterval) {
      clearInterval(globalStatusInterval);
      globalStatusInterval = undefined;
    }
  };
  
  // Use both Deno and process event handlers for maximum compatibility
  if (typeof process !== "undefined") {
    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);
    process.on("exit", cleanup);
  }
  
  // Only use process signal handlers
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
  options: any,
): Promise<void> {
  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      const objective = coordinator.getObjective(objectiveId);
      
      if (!objective) {
        clearInterval(checkInterval);
        resolve();
        return;
      }

      if (objective.status === "completed" || objective.status === "failed") {
        clearInterval(checkInterval);
        resolve();
        return;
      }

      // Show progress if verbose
      if (options.verbose) {
        const status = coordinator.getSwarmStatus();
        console.log(`📊 Progress: ${status.tasks.completed}/${status.tasks.total} tasks completed`);
      }
    }, 5000); // Check every 5 seconds

    // Timeout after the specified time
    setTimeout(() => {
      clearInterval(checkInterval);
      console.log("⚠️  Swarm execution timed out");
      resolve();
    }, options.timeout * 60 * 1000);
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

async function launchSwarmUI(objective: string, options: any): Promise<void> {
  try {
    const scriptPath = new URL(import.meta.url).pathname;
    const projectRoot = scriptPath.substring(0, scriptPath.indexOf("/src/"));
    const uiScriptPath = `${projectRoot}/src/cli/simple-commands/swarm-ui.js`;
    
    // Check if the UI script exists
    try {
      await fs.stat(uiScriptPath);
    } catch {
      warning("Swarm UI script not found. Falling back to standard mode.");
      return;
    }
    
    const { spawn } = await import("node:child_process");
    const child = spawn("node", [
      uiScriptPath, objective, ...buildUIArgs(options),
    ], {
      stdio: "inherit",
    });
    
    await new Promise<void>((resolve) => {
      child.on("close", (code) => {
        if (code !== 0) {
          error(`Swarm UI exited with code ${code}`);
        }
        resolve();
      });
    });
  } catch (err) {
    warning(`Failed to launch swarm UI: ${(err as Error).message}`);
    console.log("Falling back to standard mode...");
  }
}

function buildUIArgs(options: any): string[] {
  const args: string[] = [];
  
  if (options.strategy !== "auto") args.push("--strategy", options.strategy);
  if (options.mode !== "centralized") args.push("--mode", options.mode);
  if (options.maxAgents !== 5) args.push("--max-agents", options.maxAgents.toString());
  if (options.parallel) args.push("--parallel");
  if (options.distributed) args.push("--distributed");
  if (options.monitor) args.push("--monitor");
  if (options.verbose) args.push("--verbose");
  
  return args;
}

function showDryRunConfiguration(swarmId: string, objective: string, options: any): void {
  warning("DRY RUN - Advanced Swarm Configuration:");
  console.log(`🆔 Swarm ID: ${swarmId}`);
  console.log(`📋 Objective: ${objective}`);
  console.log(`🎯 Strategy: ${options.strategy}`);
  console.log(`🏗️  Mode: ${options.mode}`);
  console.log(`🤖 Max Agents: ${options.maxAgents}`);
  console.log(`📊 Max Tasks: ${options.maxTasks}`);
  console.log(`⏰ Timeout: ${options.timeout} minutes`);
  console.log(`🔄 Parallel: ${options.parallel}`);
  console.log(`🌐 Distributed: ${options.distributed}`);
  console.log(`🔍 Monitoring: ${options.monitor}`);
  console.log(`👥 Review Mode: ${options.review}`);
  console.log(`🧪 Testing: ${options.testing}`);
  console.log(`🧠 Memory Namespace: ${options.memoryNamespace}`);
  console.log(`💾 Persistence: ${options.persistence}`);
  console.log(`🔒 Encryption: ${options.encryption}`);
  console.log(`📊 Quality Threshold: ${options.qualityThreshold}`);
  console.log("\n🎛️  Coordination Strategy:");
  console.log(`  • Agent Selection: ${options.agentSelection}`);
  console.log(`  • Task Scheduling: ${options.taskScheduling}`);
  console.log(`  • Load Balancing: ${options.loadBalancing}`);
  console.log(`  • Fault Tolerance: ${options.faultTolerance}`);
  console.log(`  • Communication: ${options.communication}`);
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

For more information, visit: https://github.com/ruvnet/claude-code-flow
`);
}