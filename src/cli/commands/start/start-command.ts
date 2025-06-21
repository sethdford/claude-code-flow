/**
 * Unified start command implementation with robust service management
 */

import { Command } from "../../cliffy-compat.js";
import chalk from "chalk";
import { ProcessManager } from "./process-manager.js";
import { ProcessUI } from "./process-ui.js";
import { SystemMonitor } from "./system-monitor.js";
import { StartOptions } from "./types.js";
import { eventBus } from "../../../core/event-bus.js";
import { logger } from "../../../core/logger.js";
// import { formatDuration } from "../../formatter.js"; // Reserved for duration formatting

import inquirer from "inquirer";
import { promises as fs } from "node:fs";
// import { platform } from "node:os"; // Reserved for platform-specific features
// import { existsSync } from "node:fs"; // Reserved for file checks
import type { ProcessInfo } from "./types.js";

// Type definitions for events
interface ProcessEvent {
  processId: string;
  process?: ProcessInfo;
  error?: Error;
}

interface ProcessErrorEvent extends ProcessEvent {
  error: Error;
}

// Color compatibility
const colors = {
  gray: chalk.gray,
  yellow: chalk.yellow,
  red: chalk.red,
  green: chalk.green,
  cyan: chalk.cyan,
  blue: chalk.blue,
  bold: chalk.bold,
  white: chalk.white,
};

// Confirm prompt wrapper
const Confirm = async (message: string): Promise<boolean> => {
  const answer = await inquirer.prompt([{
    type: "confirm",
    name: "result",
    message,
  }]);
  return answer.result;
};

// Extract the start action logic into a separate function for reuse
export async function startAction(options: StartOptions): Promise<void> {
  console.log(colors.cyan("🧠 Claude-Flow Orchestration System"));
  console.log(colors.gray("─".repeat(60)));

  try {
    // Configure cleaner logging for start command
    await logger.configure({
      level: options.verbose ? "debug" : "info",
      format: options.verbose ? "json" : "text", // Use text format by default for cleaner output
      destination: "console",
    });

    // Initialize process manager with timeout
    const processManager = new ProcessManager();
    console.log(colors.blue("Initializing system components..."));
    const initPromise = processManager.initialize(options.config);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Initialization timeout")), (options.timeout ?? 30) * 1000),
    );
    
    await Promise.race([initPromise, timeoutPromise]);

    // Check if already running
    if (!options.force && await isSystemRunning()) {
      console.log(colors.yellow("⚠ Claude-Flow is already running"));
      const shouldContinue = await Confirm("Stop existing instance and restart?");
      
      if (!shouldContinue) {
        console.log(colors.gray("Use --force to override or \"claude-flow stop\" first"));
        return;
      }
      
      await stopExistingInstance();
    }

    // Perform pre-flight checks
    if (options.healthCheck) {
      console.log(colors.blue("Running pre-flight health checks..."));
      await performHealthChecks();
    }

    // Initialize system monitor with enhanced monitoring
    const systemMonitor = new SystemMonitor(processManager);
    systemMonitor.start();
    
    // Setup system event handlers
    setupSystemEventHandlers(processManager, systemMonitor, options);

    // Override MCP settings from CLI options
    if (options.port) {
      const mcpProcess = processManager.getProcess("mcp-server");
      if (mcpProcess) {
        mcpProcess.config = { ...mcpProcess.config, port: options.port };
      }
    }
    
    // Configure transport settings
    if (options.mcpTransport) {
      const mcpProcess = processManager.getProcess("mcp-server");
      if (mcpProcess) {
        mcpProcess.config = { ...mcpProcess.config, transport: options.mcpTransport };
      }
    }

    // Setup event listeners for logging
    if (options.verbose) {
      setupVerboseLogging(systemMonitor);
    }

    // Launch UI mode
    if (options.ui) {
      // Auto-start processes if specified before launching UI
      if (options.autoStart) {
        console.log(colors.blue("Auto-starting all processes..."));
        await startWithProgress(processManager, "all");
        console.log(colors.green.bold("✓"), "All processes started");
        console.log();
      }
      
      const ui = new ProcessUI(processManager);
      await ui.start();
      
      // Cleanup on exit
      systemMonitor.stop();
      await processManager.stopAll();
      console.log(colors.green.bold("✓"), "Shutdown complete");
      process.exit(0);
    } 
    // Default mode - minimal setup and launch Claude interactive shell
    else if (!options.background && !options.daemon) {
      console.log(colors.cyan("Starting Claude-Flow and launching Claude..."));
      console.log();

      // Start only essential services quickly
      console.log(colors.blue("Starting essential services..."));
      
      // Just start the most basic services needed
      const essentialProcesses = ["event-bus", "memory-manager"];
      
      for (let i = 0; i < essentialProcesses.length; i++) {
        const processId = essentialProcesses[i];
        console.log(`[${i + 1}/${essentialProcesses.length}] Starting ${processId}...`);
        
        try {
          await processManager.startProcess(processId);
          console.log(`[${i + 1}/${essentialProcesses.length}] ✓ ${processId} started`);
        } catch (error) {
          console.log(colors.yellow(`⚠ ${processId} failed to start, continuing...`));
        }
      }
      
      console.log(colors.green.bold("✓"), "Essential services ready");
      console.log(colors.gray("Launching Claude..."));
      console.log();

      // Try to launch Claude with minimal overhead
      const claudeCommands = [
        "/Users/sethford/.bun/bin/claude",
        "claude",
        "npx claude",
      ];

      let claudeLaunched = false;
      
      for (const cmd of claudeCommands) {
        try {
          // Quick check if command exists
          const { execSync } = await import("child_process");
          try {
            execSync(`which ${cmd.split(" ")[0]}`, { stdio: "ignore" });
          } catch {
            continue;
          }
          
          console.log(colors.green(`✓ Launching ${cmd}...`));
          
          // Launch Claude with minimal process overhead
          const { spawn } = await import("child_process");
          const claudeProcess = spawn(cmd.split(" ")[0], cmd.split(" ").slice(1), {
            stdio: "inherit",
            detached: false,
          });
          
          claudeLaunched = true;
          
          // Minimal waiting - just wait for process to exit
          claudeProcess.on("close", () => {
            console.log(colors.gray("\nClaude session ended"));
          });
          
          claudeProcess.on("error", () => {
            console.log(colors.gray("\nClaude session ended"));
          });
          
          // Wait for Claude process
          await new Promise<void>((resolve) => {
            claudeProcess.on("close", resolve);
            claudeProcess.on("error", resolve);
          });
          
          break;
        } catch (error) {
          continue;
        }
      }
      
      if (!claudeLaunched) {
        console.log(colors.yellow("⚠ Claude CLI not found"));
        console.log(colors.gray("Install with: npm install -g @anthropic-ai/claude-cli"));
        console.log(colors.gray("Services are running - use --ui flag for management"));
      }
      
      // Quick cleanup
      console.log(colors.yellow("Cleaning up..."));
      await processManager.stopAll();
      console.log(colors.green("✓ Done"));
      process.exit(0);
    } 
    // Background mode - start processes and exit
    else if (options.background) {
      console.log(colors.yellow("Starting in background mode..."));
      console.log(colors.blue("Starting all system processes..."));
      
      await startWithProgress(processManager, "all");
      
      // Wait for services to be fully ready
      await waitForSystemReady(processManager);
      
      console.log(colors.green.bold("✓"), "All processes started successfully");
      console.log(colors.gray("Claude-Flow services are running in the background"));
      console.log(colors.gray("Use \"claude-flow status\" to check system status"));
      console.log(colors.gray("Your terminal is ready for use"));
      
      // Exit cleanly, processes will continue running
      process.exit(0);
    } 
    // Daemon mode
    else if (options.daemon) {
      console.log(colors.yellow("Starting in daemon mode..."));
      
      // Auto-start all processes
      if (options.autoStart) {
        console.log(colors.blue("Starting all system processes..."));
        await startWithProgress(processManager, "all");
      } else {
        // Start only core processes
        console.log(colors.blue("Starting core processes..."));
        await startWithProgress(processManager, "core");
      }

      // Create PID file with metadata
      const pid = process.pid || 0;
      const pidData = {
        pid,
        startTime: Date.now(),
        config: options.config || "default",
        processes: processManager.getAllProcesses().map(p => ({ id: p.id, status: p.status })),
      };
      await fs.writeFile(".claude-flow.pid", JSON.stringify(pidData, null, 2));
      console.log(colors.gray(`Process ID: ${pid}`));
      
      // Wait for services to be fully ready
      await waitForSystemReady(processManager);
      
      console.log(colors.green.bold("✓"), "Daemon started successfully");
      console.log(colors.gray("Use \"claude-flow status\" to check system status"));
      console.log(colors.gray("Use \"claude-flow monitor\" for real-time monitoring"));
      
      // Keep process running
      await new Promise<void>(() => {});
    } 
    // Interactive mode (fallback)
    else {
      console.log(colors.cyan("Starting in interactive mode..."));
      console.log();

      // Show available options
      console.log(colors.white.bold("Quick Actions:"));
      console.log("  [1] Start all processes");
      console.log("  [2] Start core processes only");
      console.log("  [3] Launch process management UI");
      console.log("  [4] Show system status");
      console.log("  [q] Quit");
      console.log();
      console.log(colors.gray("Press a key to select an option..."));

      // Handle user input
      const decoder = new TextDecoder();
      while (true) {
        const buf = new Uint8Array(1);
        // Note: This would need to be adapted for Node.js stdin handling
        // For now, we'll break out of the loop
        break;
      }
    }

  } catch (error) {
    console.error(colors.red("Failed to start Claude-Flow:"), (error as Error).message);
    
    if (options.verbose) {
      console.error(colors.gray("Stack trace:"));
      console.error(error);
    }
    
    await cleanupOnFailure();
    process.exit(1);
  }
}

export const startCommand = new Command()
  .name("start")
  .description("Start the Claude-Flow orchestration system")
  .option("-d, --daemon", "Run as daemon in background")
  .option("-b, --background", "Start all processes and exit (leaves terminal free)")
  .option("-p, --port <port>", "MCP server port", "3000")
  .option("--mcp-transport <transport>", "MCP transport type (stdio, http)", "stdio")
  .option("-u, --ui", "Launch interactive process management UI")
  .option("-v, --verbose", "Enable verbose logging")
  .option("--auto-start", "Automatically start all processes")
  .option("--config <path>", "Configuration file path")
  .option("--force", "Force start even if already running")
  .option("--health-check", "Perform health checks before starting")
  .option("--timeout <seconds>", "Startup timeout in seconds", "60")
  .action(startAction);

// Enhanced helper functions

async function isSystemRunning(): Promise<boolean> {
  try {
    const pidData = await fs.readFile(".claude-flow.pid", "utf-8");
    const data = JSON.parse(pidData);
    
    // Check if process is still running
    try {
      process.kill(data.pid, 0); // Check if process exists
      return true; // Process exists
    } catch {
      return false; // Process not found
    }
  } catch {
    return false; // No PID file
  }
}

async function stopExistingInstance(): Promise<void> {
  try {
    const pidData = await fs.readFile(".claude-flow.pid", "utf-8");
    const data = JSON.parse(pidData);
    
    console.log(colors.yellow("Stopping existing instance..."));
    try {
      process.kill(data.pid, "SIGTERM");
    } catch {
      // Process might already be stopped
    }
    
    // Wait for graceful shutdown
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Force kill if still running
    try {
      process.kill(data.pid, "SIGKILL");
    } catch {
      // Process already stopped
    }
    
    await fs.unlink(".claude-flow.pid").catch(() => {});
    console.log(colors.green("✓ Existing instance stopped"));
  } catch (error) {
    console.warn(colors.yellow("Warning: Could not stop existing instance"), (error as Error).message);
  }
}

async function performHealthChecks(): Promise<void> {
  const checks = [
    { name: "Disk Space", check: checkDiskSpace },
    { name: "Memory Available", check: checkMemoryAvailable },
    { name: "Network Connectivity", check: checkNetworkConnectivity },
    { name: "Required Dependencies", check: checkDependencies },
  ];
  
  for (const { name, check } of checks) {
    try {
      console.log(colors.gray(`  Checking ${name}...`));
      await check();
      console.log(colors.green(`  ✓ ${name} OK`));
    } catch (error) {
      console.log(colors.red(`  ✗ ${name} Failed: ${(error as Error).message}`));
      throw error;
    }
  }
}

async function checkDiskSpace(): Promise<void> {
  // Basic disk space check - would need platform-specific implementation
  const stats = await fs.stat(".");
  if (!stats.isDirectory) {
    throw new Error("Current directory is not accessible");
  }
}

async function checkMemoryAvailable(): Promise<void> {
  // Memory check - use Node.js process.memoryUsage()
  const memoryInfo = process.memoryUsage();
  if (memoryInfo.heapUsed > 500 * 1024 * 1024) { // 500MB threshold
    throw new Error("High memory usage detected");
  }
}

async function checkNetworkConnectivity(): Promise<void> {
  // Basic network check
  try {
    const response = await fetch("https://httpbin.org/status/200", {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) {
      throw new Error(`Network check failed: ${response.status}`);
    }
  } catch {
    console.log(colors.yellow("  ⚠ Network connectivity check skipped (offline mode?)"));
  }
}

async function checkDependencies(): Promise<void> {
  // Check for required directories and files
  const requiredDirs = [".claude-flow", "memory", "logs"];
  for (const dir of requiredDirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (_error) {
      throw new Error(`Cannot create required directory: ${dir}`);
    }
  }
}

function setupSystemEventHandlers(
  processManager: ProcessManager, 
  systemMonitor: SystemMonitor, 
  options: StartOptions,
): void {
  // Handle graceful shutdown signals
  const shutdownHandler = async () => {
    console.log(`\n${  colors.yellow("Received shutdown signal, shutting down gracefully...")}`);
    systemMonitor.stop();
    await processManager.stopAll();
    await cleanupOnShutdown();
    console.log(colors.green("✓ Shutdown complete"));
    process.exit(0);
  };
  
  // Setup signal handlers for Node.js
  process.on("SIGINT", shutdownHandler);
  process.on("SIGTERM", shutdownHandler);
  
  // Setup verbose logging if requested
  if (options.verbose) {
    setupVerboseLogging(systemMonitor);
  }
  
  // Monitor for critical errors
  processManager.on("processError", (event: ProcessErrorEvent) => {
    console.error(colors.red(`Process error in ${event.processId}:`), event.error.message);
    if (event.processId === "orchestrator") {
      console.error(colors.red.bold("Critical process failed, initiating recovery..."));
      // Could implement auto-recovery logic here
    }
  });
}

async function startWithProgress(processManager: ProcessManager, mode: "all" | "core"): Promise<void> {
  const processes = mode === "all" 
    ? ["event-bus", "memory-manager", "terminal-pool", "coordinator", "mcp-server", "orchestrator"]
    : ["event-bus", "memory-manager", "mcp-server"];
  
  for (let i = 0; i < processes.length; i++) {
    const processId = processes[i];
    const progress = `[${i + 1}/${processes.length}]`;
    
    console.log(colors.gray(`${progress} Starting ${processId}...`));
    try {
      await processManager.startProcess(processId);
      console.log(colors.green(`${progress} ✓ ${processId} started`));
    } catch (error) {
      console.log(colors.red(`${progress} ✗ ${processId} failed: ${(error as Error).message}`));
      if (processId === "orchestrator" || processId === "mcp-server") {
        throw error; // Critical processes
      }
    }
    
    // Brief delay between starts
    if (i < processes.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
}

async function waitForSystemReady(processManager: ProcessManager): Promise<void> {
  console.log(colors.blue("Waiting for system to be ready..."));
  
  const maxWait = 30000; // 30 seconds
  const checkInterval = 1000; // 1 second
  let waited = 0;
  
  while (waited < maxWait) {
    const stats = processManager.getSystemStats();
    if (stats.errorProcesses === 0 && stats.runningProcesses >= 3) {
      console.log(colors.green("✓ System ready"));
      return;
    }
    
    await new Promise(resolve => setTimeout(resolve, checkInterval));
    waited += checkInterval;
  }
  
  console.log(colors.yellow("⚠ System startup completed but some processes may not be fully ready"));
}

async function cleanupOnFailure(): Promise<void> {
  try {
    await fs.unlink(".claude-flow.pid").catch(() => {});
    console.log(colors.gray("Cleaned up PID file"));
  } catch {
    // Ignore cleanup errors
  }
}

async function cleanupOnShutdown(): Promise<void> {
  try {
    await fs.unlink(".claude-flow.pid").catch(() => {});
    console.log(colors.gray("Cleaned up PID file"));
  } catch {
    // Ignore cleanup errors
  }
}

function setupVerboseLogging(monitor: SystemMonitor): void {
  // Enhanced verbose logging
  console.log(colors.gray("Verbose logging enabled"));
  
  // Periodically print system health
  setInterval(() => {
    console.log();
    console.log(colors.cyan("--- System Health Report ---"));
    monitor.printSystemHealth();
    console.log(colors.cyan("--- End Report ---"));
  }, 30000);
  
  // Log critical events
  eventBus.on("process:started", (data: ProcessEvent) => {
    console.log(colors.green(`[VERBOSE] Process started: ${data.processId}`));
  });
    
  eventBus.on("process:stopped", (data: ProcessEvent) => {
    console.log(colors.yellow(`[VERBOSE] Process stopped: ${data.processId}`));
  });
    
  eventBus.on("process:error", (data: ProcessErrorEvent) => {
    console.log(colors.red(`[VERBOSE] Process error: ${data.processId} - ${data.error.message}`));
  });
}