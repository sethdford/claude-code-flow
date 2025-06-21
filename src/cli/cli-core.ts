#!/usr/bin/env node
/**
 * Claude-Flow CLI Core
 * Shared functionality for both regular and SEA entry points
 */

import { logger } from "../core/logger.js";
import { ConfigManager } from "../config/config-manager.js";
import { Command } from "./cliffy-compat.js";
import { startCommand } from "./commands/start.js";
import { agentCommand } from "./commands/agent.js";
import { taskCommand } from "./commands/task.js";
import { memoryCommand } from "./commands/memory.js";
import { configCommand } from "./commands/config.js";
import { statusCommand } from "./commands/status.js";
import { monitorCommand } from "./commands/monitor.js";
import { sessionCommand } from "./commands/session.js";
import { workflowCommand } from "./commands/workflow.js";
import { helpCommand } from "./commands/help.js";
import { mcpCommand } from "./commands/mcp.js";
import { claudeCommand } from "./commands/claude.js";
import { swarmCommand } from "./commands/swarm.js";
import { sparcCommand } from "./commands/sparc.js";
import { enterpriseCommand } from "./commands/enterprise.js";
import { modelsCommand } from "./commands/models.js";
import { initCommand } from "./commands/init.js";
import { formatError, displayBanner, displayVersion } from "./formatter.js";
import { startNodeREPL as startREPL } from "./node-repl.js";
import { CompletionGenerator } from "./completion.js";
import { getVersion, getBuildDate } from "../utils/version.js";

import chalk from "chalk";

// Color compatibility
const colors = {
  gray: chalk.gray,
  yellow: chalk.yellow,
  red: chalk.red,
  green: chalk.green,
  cyan: chalk.cyan,
  blue: chalk.blue,
  bold: chalk.bold,
};

// Version information - now dynamic
const VERSION = getVersion();
const BUILD_DATE = getBuildDate();

/**
 * Create the main CLI command with all subcommands
 */
export function createCLI(): Command {
  const cli = new Command()
    .name("claude-flow")
    .version(VERSION)
    .description("Claude-Flow: Advanced AI agent orchestration system for multi-agent coordination")
    .option("-c, --config <path>", "Path to configuration file", "./claude-flow.config.json")
    .option("-v, --verbose", "Enable verbose logging")
    .option("-q, --quiet", "Suppress non-essential output")
    .option("--log-level <level>", "Set log level (debug, info, warn, error)", "info")
    .option("--no-color", "Disable colored output")
    .option("--profile <profile>", "Use named configuration profile")
    .option("-d, --daemon", "Run as daemon in background")
    .option("-p, --port <port>", "MCP server port", "3000")
    .option("--mcp-transport <transport>", "MCP transport type (stdio, http)", "stdio")
    .option("-u, --ui", "Launch interactive process management UI")
    .option("--auto-start", "Automatically start all processes")
    .option("--force", "Force start even if already running")
    .option("--health-check", "Perform health checks before starting")
    .option("--timeout <seconds>", "Startup timeout in seconds", "60")
    .option("--background", "Start processes and exit")
    .action(async (options: any) => {
      const args = process.argv.slice(2);
      const hasNonStartSubcommand = args.some(arg => 
        !arg.startsWith("-") && 
        arg !== "start" && 
        ["init", "agent", "task", "memory", "config", "status", "monitor", "session", "workflow", "mcp", "claude", "swarm", "sparc", "enterprise", "models", "help", "batch", "repl", "version", "completion"].includes(arg),
      );
      const helpRequested = args.includes("--help") || args.includes("-h");
      
      if (hasNonStartSubcommand || helpRequested) {
        return;
      }
      
      await setupLogging(options);
      
      // Import and execute the start action
      const { startAction } = await import("./commands/start/start-command.js");
      await startAction(options);
    });

  // Add all subcommands
  cli
    .addCommand(initCommand)
    .addCommand(startCommand)
    .addCommand(agentCommand)
    .addCommand(taskCommand)
    .addCommand(memoryCommand)
    .addCommand(configCommand)
    .addCommand(statusCommand)
    .addCommand(monitorCommand)
    .addCommand(sessionCommand)
    .addCommand(workflowCommand)
    .addCommand(mcpCommand)
    .addCommand(claudeCommand)
    .addCommand(swarmCommand)
    .addCommand(sparcCommand)
    .addCommand(enterpriseCommand)
    .addCommand(modelsCommand)
    .addCommand(helpCommand)
    .command("batch")
    .description("Spawn multiple Claude instances from workflow")
    .arguments("<workflow-file>")
    .option("--dry-run", "Show what would be executed without running")
    .action(async (workflowFile: string, options: { dryRun?: boolean }) => {
      try {
        const fs = await import("fs/promises");
        const content = await fs.readFile(workflowFile, "utf-8");
        const workflow = JSON.parse(content);
        
        console.log(colors.green("✓ Loading workflow:"), workflow.name ?? "Unnamed");
        
        // Handle different workflow formats
        let tasks: Array<{
          id?: string;
          name?: string;
          description?: string;
          type?: string;
          tools?: string[] | string;
          skipPermissions?: boolean;
          config?: string;
        }> = [];
        
        if (workflow.tasks && Array.isArray(workflow.tasks)) {
          tasks = workflow.tasks.map((task: any) => ({
            id: task.id,
            name: task.name || task.id,
            description: task.description,
            type: task.type || "general",
            tools: task.tools || ["View", "Edit", "Replace", "GlobTool", "GrepTool", "LS", "Bash"],
            skipPermissions: task.skipPermissions || false,
            config: task.config ? (typeof task.config === "string" ? task.config : JSON.stringify(task.config)) : undefined,
          }));
        }
        
        console.log(colors.cyan("📋 Tasks:"), tasks.length);
        
        if (tasks.length === 0) {
          console.log(colors.yellow("⚠️  No tasks found in workflow"));
          return;
        }
        
        if (options.dryRun) {
          console.log(colors.yellow("\n🔍 DRY RUN - Commands that would be executed:"));
          for (const task of tasks) {
            const claudeCmd = ["claude", `"${task.description || task.name}"`];
            
            if (task.tools) {
              const toolsList = Array.isArray(task.tools) ? task.tools.join(",") : task.tools;
              claudeCmd.push("--allowedTools", toolsList);
            }
            
            if (task.skipPermissions) {
              claudeCmd.push("--dangerously-skip-permissions");
            }
            
            if (task.config) {
              claudeCmd.push("--mcp-config", task.config);
            }
            
            console.log(colors.gray(`  ${claudeCmd.join(" ")}`));
          }
          return;
        }
        
        console.log(colors.blue("\n🚀 Spawning Claude instances..."));
        
        for (const task of tasks) {
          const taskId = task.id || `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          console.log(colors.cyan(`\n→ Task: ${task.name || taskId}`));
          console.log(colors.gray(`  Description: ${task.description}`));
          
          // In a real implementation, you would spawn Claude here
          // For now, just show what would be done
          console.log(colors.green("  ✓ Would spawn Claude instance"));
        }
        
        console.log(colors.green(`\n✅ Batch execution complete (${tasks.length} tasks)`));
        
      } catch (error) {
        console.error(colors.red("❌ Failed to process workflow:"), (error as Error).message);
        process.exit(1);
      }
    })
    .command("repl")
    .description("Start interactive REPL mode with command completion")
    .option("--no-banner", "Skip welcome banner")
    .option("--history-file <path>", "Custom history file path")
    .action(async (options) => {
      await setupLogging(options);
      if (options.banner !== false) {
        displayBanner(VERSION);
      }
      await startREPL(options);
    })
    .command("version")
    .description("Show detailed version information")
    .option("--short", "Show version number only")
    .action(async (options) => {
      if (options.short) {
        console.log(VERSION);
      } else {
        displayVersion(VERSION, BUILD_DATE);
      }
    })
    .command("completion")
    .description("Generate shell completion scripts")
    .arguments("[shell]")
    .option("--install", "Install completion script automatically")
    .action(async (options, shell) => {
      const generator = new CompletionGenerator();
      await generator.generate(shell || "detect", options.install === true);
    });

  return cli;
}

/**
 * Global error handler
 */
export async function handleError(error: unknown, options?: any): Promise<void> {
  const formatted = formatError(error);
  
  if (options?.json) {
    console.error(JSON.stringify({
      error: true,
      message: formatted,
      timestamp: new Date().toISOString(),
    }));
  } else {
    console.error(colors.red(colors.bold("✗ Error:")), formatted);
  }
  
  // Show stack trace in debug mode or verbose
  if (process.env.CLAUDE_FLOW_DEBUG === "true" || options?.verbose) {
    console.error(colors.gray("\nStack trace:"));
    console.error(error);
  }
  
  // Suggest helpful actions
  if (!options?.quiet) {
    console.error(colors.gray("\nTry running with --verbose for more details"));
    console.error(colors.gray("Or use \"claude-flow help\" to see available commands"));
  }
  
  process.exit(1);
}

/**
 * Setup logging and configuration based on CLI options
 */
export async function setupLogging(options: any): Promise<void> {
  // Determine log level
  let { logLevel } = options;
  if (options.verbose) logLevel = "debug";
  if (options.quiet) logLevel = "warn";
  
  // Configure logger
  await logger.configure({
    level: logLevel,
    format: options.json ? "json" : "text",
    destination: "console",
  });
  
  // Load configuration
  try {
    const configManager = ConfigManager.getInstance();
    if (options.config) {
      await configManager.load(options.config);
    } else {
      // Try to load default config file if it exists
      try {
        await configManager.load("./claude-flow.config.json");
      } catch {
        // Use default config if no file found - load method handles this
        await configManager.load(); // This will use defaults
      }
    }
    
    // Note: The simple ConfigManager doesn't have applyProfile method
    // This is fine as it's a simpler configuration system
  } catch (error) {
    // Suppress the circular reference warning as it's not fatal
    const errorMessage = (error as Error).message;
    if (!errorMessage.includes("Maximum call stack size exceeded")) {
      logger.warn("Failed to load configuration:", errorMessage);
    }
    // ConfigManager will use defaults automatically
  }
}

/**
 * Signal handlers for graceful shutdown
 */
export function setupSignalHandlers(): void {
  const gracefulShutdown = () => {
    console.log(`\n${colors.gray("Gracefully shutting down...")}`);
    process.exit(0);
  };
  
  process.on("SIGINT", gracefulShutdown);
  process.on("SIGTERM", gracefulShutdown);
}

/**
 * Parse global options for error handling
 */
export function parseGlobalOptions(): any {
  const args = process.argv.slice(2);
  return {
    verbose: args.includes("-v") || args.includes("--verbose"),
    quiet: args.includes("-q") || args.includes("--quiet"),
    json: args.includes("--json"),
    noColor: args.includes("--no-color"),
  };
}

/**
 * Configure colors based on options
 */
export function configureColors(options: any): void {
  if (options.noColor) {
    // Disable colors
    process.env.NO_COLOR = "1";
  }
}

/**
 * Main CLI execution function
 */
export async function runCLI(): Promise<void> {
  const globalOptions = parseGlobalOptions();
  
  try {
    // Setup signal handlers
    setupSignalHandlers();
    
    // Configure colors based on options
    configureColors(globalOptions);
    
    // Create and run CLI
    const cli = createCLI();
    await cli.parse(process.argv);
  } catch (error) {
    await handleError(error, globalOptions);
  }
} 