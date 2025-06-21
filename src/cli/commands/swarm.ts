/**
 * Enhanced Swarm Command - Integration with new comprehensive swarm system
 */

import { Command } from "../cliffy-compat.js";
import { TaskExecutor } from "../../swarm/executor.js";
import { SwarmMemoryManager } from "../../swarm/memory.js";
import { EnhancedSwarmCoordinator } from "../../swarm/enhanced-coordinator.js";
import { getModelHierarchy } from "../../config/model-config.js";
import { generateId } from "../../utils/helpers.js";
import { logger } from "../../core/logger.js";
import * as fs from "node:fs/promises";

export interface CommandContext {
  args: string[];
  flags: Record<string, any>;
}



export async function swarmAction(ctx: CommandContext): Promise<void> {
  // Configure logger for clean swarm output (text format instead of JSON)
  await logger.configure({
    level: ctx.flags.verbose ? "debug" : "warn",
    format: "text",
    destination: "console",
  });

  // First check if help is requested
  if (ctx.flags.help || ctx.flags.h) {
    showSwarmHelp();
    return;
  }

  // The objective should be all the non-flag arguments joined together
  const objective = ctx.args.join(" ").trim();

  if (!objective) {
    console.error("Usage: swarm <objective>");
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

  console.log(`🐝 Initializing Advanced Swarm: ${swarmId}`);
  console.log(`📋 Objective: ${objective}`);
  console.log(`🎯 Strategy: ${options.strategy}`);
  console.log(`🏗️  Mode: ${options.mode}`);
  console.log(`🤖 Max Agents: ${options.maxAgents}`);

  try {
    // Initialize comprehensive swarm system with enhanced coordinator
    const modelHierarchy = getModelHierarchy(options.strategy);
    const coordinator = new EnhancedSwarmCoordinator({
      modelConfig: {
        primary: modelHierarchy.primary,
        apply: modelHierarchy.apply, 
        review: modelHierarchy.review,
        threshold: 50,
      },
      strategy: options.strategy,
      maxAgents: options.maxAgents,
    });

    // Set up event listeners for interactive feedback
    coordinator.on("objectiveAdded", (event) => {
      console.log(`📋 Objective decomposed into ${event.tasks} tasks`);
    });

    coordinator.on("taskStarted", (event) => {
      console.log(`🔄 Starting task: ${event.taskName} (Agent: ${event.agentId})`);
    });

    coordinator.on("taskCompleted", (event) => {
      console.log(`✅ Completed task: ${event.taskName} (Duration: ${event.duration}ms)`);
    });

    coordinator.on("taskError", (event) => {
      console.log(`❌ Task failed: ${event.taskName} - ${event.error}`);
    });

    coordinator.on("agentStatusChanged", (event) => {
      if (options.verbose) {
        console.log(`🤖 Agent ${event.agentId}: ${event.status}`);
      }
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
      maxEntrySize: 10 * 1024 * 1024, // 10MB
      defaultTtl: 24 * 60 * 60 * 1000, // 24 hours
      enableCompression: false,
      enableEncryption: options.encryption,
      consistencyLevel: "eventual",
    });

    console.log("✅ Swarm initialized successfully");
    console.log("🚀 Starting execution...");

    // Add progress monitoring
    let lastStatus = { tasks: 0, agents: 0 };
    const statusInterval = setInterval(() => {
      const status = coordinator.getStatus();
      if (status.activeTasks !== lastStatus.tasks || status.activeAgents !== lastStatus.agents) {
        console.log(`📊 Progress: ${status.activeTasks} active tasks, ${status.activeAgents} active agents`);
        lastStatus = { tasks: status.activeTasks, agents: status.activeAgents };
      }
    }, 2000);

    // Create and execute the main objective
    const objectiveId = await coordinator.addObjective(objective);
    console.log(`🎯 Created objective: ${objectiveId}`);

    // Wait for completion or timeout
    const timeoutMs = options.timeout * 60 * 1000;
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      const status = coordinator.getStatus();
      
      if (status.activeTasks === 0 && status.totalTasks > 0) {
        clearInterval(statusInterval);
        console.log("🎉 All tasks completed!");
        break;
      }
      
      // Wait a bit before checking again
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (Date.now() - startTime >= timeoutMs) {
      clearInterval(statusInterval);
      console.log(`⏰ Execution timed out after ${options.timeout} minutes`);
    }

    // Show final results
    await showSwarmResults(coordinator, executor, memory, `./swarm-runs/${swarmId}`);

    // Start interactive session if requested
    if (options.interactive) {
      await startSwarmREPL(coordinator, executor, memory, `./swarm-runs/${swarmId}`, objective);
    }

  } catch (error) {
    console.error("❌ Swarm execution failed:", (error as Error).message);
    if (options.verbose) {
      console.error(error);
    }
    process.exit(1);
  }
}

function parseSwarmOptions(flags: Record<string, any>) {
  return {
    strategy: flags.strategy || "development",
    mode: flags.mode || "hierarchical",
    maxAgents: parseInt(flags.maxAgents || flags.agents || "4"),
    maxDepth: parseInt(flags.maxDepth || "5"),
    timeout: parseInt(flags.timeout || "30"),
    taskTimeout: parseInt(flags.taskTimeout || "300") * 1000,
    maxRetries: parseInt(flags.maxRetries || "3"),
    parallel: flags.parallel || false,
    monitor: flags.monitor || false,
    persistence: flags.persistence !== false,
    memoryNamespace: flags.memoryNamespace || "default",
    dryRun: flags.dryRun || flags.N || flags.n,
    ui: flags.ui || false,
    interactive: flags.interactive || flags.i,
    verbose: flags.verbose || flags.v,
    streamOutput: flags.stream || false,
    encryption: flags.encryption || false,
  };
}

async function launchSwarmUI(objective: string, options: any): Promise<void> {
  console.log("🖥️  Launching Swarm UI...");
  console.log("UI mode is not yet implemented. Running in CLI mode instead.");
  // Fallback to CLI mode
  options.ui = false;
}

function showDryRunConfiguration(swarmId: string, objective: string, options: any): void {
  console.log("🔍 DRY RUN - Swarm Configuration Preview");
  console.log(`Swarm ID: ${swarmId}`);
  console.log(`Objective: ${objective}`);
  console.log(`Strategy: ${options.strategy}`);
  console.log(`Mode: ${options.mode}`);
  console.log(`Max Agents: ${options.maxAgents}`);
  console.log(`Timeout: ${options.timeout} minutes`);
  console.log(`Parallel: ${options.parallel}`);
  console.log(`Monitoring: ${options.monitor}`);
}

async function showSwarmResults(coordinator: EnhancedSwarmCoordinator, executor: TaskExecutor, memory: SwarmMemoryManager, swarmDir: string): Promise<void> {
  console.log("\n📊 Swarm Execution Results");
  
  const status = coordinator.getStatus();
  
  // Determine actual status based on task completion
  let actualStatus = "unknown";
  if (status.totalTasks === 0) {
    actualStatus = "no-tasks";
  } else if (status.activeTasks === 0) {
    if (status.failedTasks > 0) {
      actualStatus = "completed-with-failures";
    } else {
      actualStatus = "completed";
    }
  } else {
    actualStatus = "executing";
  }
  
  console.log(`Status: ${actualStatus}`);
  console.log(`Total Tasks: ${status.totalTasks || 0}`);
  console.log(`Completed Tasks: ${status.completedTasks || 0}`);
  console.log(`Failed Tasks: ${status.failedTasks || 0}`);
  console.log(`Active Tasks: ${status.activeTasks || 0}`);
  console.log(`Active Agents: ${status.activeAgents || 0}`);
  
  if (status.totalTasks > 0) {
    const successRate = ((status.completedTasks || 0) / status.totalTasks * 100).toFixed(1);
    console.log(`Success Rate: ${successRate}%`);
  }
}

async function startSwarmREPL(coordinator: EnhancedSwarmCoordinator, executor: TaskExecutor, memory: SwarmMemoryManager, swarmDir: string, objective: string): Promise<void> {
  console.log("\n🔧 Starting Swarm Interactive Session");
  console.log("Type 'help' for available commands or 'exit' to quit.\n");

  const readline = await import("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "🐝 swarm> ",
  });

  rl.prompt();

  rl.on("line", async (line) => {
    const input = line.trim();
    
    if (!input) {
      rl.prompt();
      return;
    }

    const [command, ...args] = input.split(" ");

    try {
      switch (command.toLowerCase()) {
        case "help":
          console.log(`
Available commands:
  status              Show current swarm status
  results             Show execution results again
  logs               Show recent task logs
  memory             Show memory contents
  agents             List agent information
  tasks              List task information
  follow "<task>"    Execute a follow-up task
  save <file>        Save results to file
  clear              Clear screen
  exit, quit         Exit interactive session
`);
          break;

        case "status":
          const status = coordinator.getStatus();
          console.log("📊 Swarm Status:");
          console.log(`  Status: ${status.status || "completed"}`);
          console.log(`  Active Tasks: ${status.activeTasks || 0}`);
          console.log(`  Active Agents: ${status.activeAgents || 0}`);
          console.log(`  Total Tasks: ${status.totalTasks || 0}`);
          break;

        case "results":
          await showSwarmResults(coordinator, executor, memory, swarmDir);
          break;

        case "logs":
          console.log("📋 Recent Task Logs:");
          console.log("(Log viewing not yet implemented)");
          break;

        case "memory":
          console.log("🧠 Memory Contents:");
          const memoryStats = memory.getStatistics();
          console.log(`  Entries: ${memoryStats.totalEntries || 0}`);
          console.log(`  Size: ${((memoryStats.totalSize || 0) / 1024).toFixed(1)} KB`);
          break;

        case "agents":
          const agentStatus = coordinator.getStatus();
          console.log("🤖 Agent Information:");
          console.log(`  Active Agents: ${agentStatus.activeAgents || 0}`);
          console.log(`  Total Agents: ${agentStatus.totalAgents || 0}`);
          break;

        case "tasks":
          const taskStatus = coordinator.getStatus();
          console.log("📋 Task Information:");
          console.log(`  Total: ${taskStatus.totalTasks || 0}`);
          console.log(`  Completed: ${taskStatus.completedTasks || 0}`);
          console.log(`  Failed: ${taskStatus.failedTasks || 0}`);
          break;

        case "follow":
          if (args.length === 0) {
            console.log("❌ Please specify a follow-up task: follow \"<task description>\"");
            break;
          }
          const followUpTask = args.join(" ").replace(/"/g, "");
          console.log(`🚀 Executing follow-up task: ${followUpTask}`);
          
          try {
            const followUpObjectiveId = await coordinator.addObjective(followUpTask);
            console.log(`✅ Follow-up task created: ${followUpObjectiveId}`);
            console.log("   Use 'status' to monitor progress");
          } catch (error) {
            console.log(`❌ Failed to create follow-up task: ${(error as Error).message}`);
          }
          break;

        case "save":
          if (args.length === 0) {
            console.log("❌ Please specify a filename: save <filename>");
            break;
          }
          const filename = args[0];
          console.log(`💾 Saving results to ${filename}...`);
          console.log("(Save functionality not yet implemented)");
          break;

        case "clear":
          console.clear();
          console.log(`🐝 Swarm Interactive Session - ${objective}`);
          break;

        case "exit":
        case "quit":
          console.log("👋 Goodbye!");
          rl.close();
          return;

        default:
          console.log(`❌ Unknown command: ${command}`);
          console.log("Type 'help' for available commands.");
          break;
      }
    } catch (error) {
      console.log(`❌ Error: ${(error as Error).message}`);
    }

    rl.prompt();
  });

  rl.on("close", () => {
    console.log("\n👋 Swarm session ended.");
    process.exit(0);
  });
}

function showSwarmHelp(): void {
  console.log(`
Usage: claude-flow swarm <objective> [options]

Execute complex objectives using coordinated AI agent swarms.

Arguments:
  objective                  The main goal or task for the swarm to accomplish

Options:
  --strategy <type>          Swarm strategy: development, research, analysis, testing (default: development)
  --mode <mode>              Coordination mode: hierarchical, distributed, mesh (default: hierarchical)
  --max-agents <number>      Maximum number of agents (default: 4)
  --timeout <minutes>        Maximum execution time in minutes (default: 30)
  --parallel                 Enable parallel task execution
  --monitor                  Enable real-time monitoring
  --dry-run, -n              Show configuration without executing
  --ui                       Launch web UI for monitoring
  --interactive, -i          Start interactive session after execution
  --verbose, -v              Enable verbose logging

Examples:
  claude-flow swarm "Build a REST API with authentication"
  claude-flow swarm "Research and analyze market trends" --strategy research
  claude-flow swarm "Optimize application performance" --strategy analysis --parallel
  claude-flow swarm "Create comprehensive test suite" --strategy testing --max-agents 6
  claude-flow swarm "Debug application issues" --interactive

Interactive Mode:
  When using --interactive, you'll enter a specialized REPL after execution where you can:
  - Inspect swarm results and status
  - Execute follow-up tasks
  - View logs and memory contents
  - Save results to files
`);
}

export const swarmCommand = new Command()
  .name("swarm")
  .description("Execute complex objectives using coordinated AI agent swarms")
  .arguments("<objective...>")
  .option("--strategy <type>", "Swarm strategy: development, research, analysis, testing", "development")
  .option("--mode <mode>", "Coordination mode: hierarchical, distributed, mesh", "hierarchical")
  .option("--max-agents <number>", "Maximum number of agents", "4")
  .option("--timeout <minutes>", "Maximum execution time in minutes", "30")
  .option("--parallel", "Enable parallel task execution")
  .option("--monitor", "Enable real-time monitoring")
  .option("--dry-run, -n", "Show configuration without executing")
  .option("--ui", "Launch web UI for monitoring")
  .option("--interactive, -i", "Start interactive session after execution")
  .option("--verbose, -v", "Enable verbose logging")
  .action(async (objective: string[], options: any) => {
    await swarmAction({
      args: objective,
      flags: options,
    });
  });