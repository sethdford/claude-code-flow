#!/usr/bin/env node
/**
 * Claude-Flow CLI - SEA (Single Executable Application) entry point
 * This version avoids import.meta usage for SEA compatibility
 */

// Import the main CLI from index.js but avoid import.meta usage
import { logger } from "../core/logger.js";
import { configManager } from "../core/config.js";
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
import { sparcCommand } from "./commands/sparc.js";
import { swarmCommand } from "./commands/swarm.js";
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

// Main CLI command (same as index.ts but without import.meta check)
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
  .action(async (options: any) => {
    // Only start REPL if no subcommand was provided and help wasn't requested
    const args = process.argv.slice(2);
    const hasSubcommand = args.some(arg => !arg.startsWith("-"));
    const helpRequested = args.includes("--help") || args.includes("-h");
    
    if (hasSubcommand || helpRequested) {
      // Let the subcommand or help handler handle execution
      return;
    }
    
    // If no subcommand, show banner and start REPL
    await setupLogging(options);
    
    if (!options.quiet) {
      displayBanner(VERSION);
      console.log(colors.gray("Type \"help\" for available commands or \"exit\" to quit.\n"));
    }
    
    await startREPL(options);
  });

// Add subcommands
cli
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
  .addCommand(sparcCommand)
  .addCommand(swarmCommand)
  .addCommand(helpCommand)
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

// Global error handler
async function handleError(error: unknown, options?: any): Promise<void> {
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

// Setup logging and configuration based on CLI options
async function setupLogging(options: any): Promise<void> {
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
    if (options.config) {
      await configManager.load(options.config);
    } else {
      // Try to load default config file if it exists
      try {
        await configManager.load("./claude-flow.config.json");
      } catch {
        // Use default config if no file found
        configManager.loadDefault();
      }
    }
    
    // Apply profile if specified
    if (options.profile) {
      await configManager.applyProfile(options.profile);
    }
  } catch (error) {
    logger.warn("Failed to load configuration:", (error as Error).message);
    configManager.loadDefault();
  }
}

// Signal handlers for graceful shutdown
function setupSignalHandlers(): void {
  const gracefulShutdown = () => {
    console.log(`\n${colors.gray("Gracefully shutting down...")}`);
    process.exit(0);
  };
  
  process.on("SIGINT", gracefulShutdown);
  process.on("SIGTERM", gracefulShutdown);
}

async function main() {
  let globalOptions: any = {};
  
  try {
    // Setup signal handlers
    setupSignalHandlers();
    
    // Pre-parse global options for error handling
    const args = process.argv.slice(2);
    globalOptions = {
      verbose: args.includes("-v") || args.includes("--verbose"),
      quiet: args.includes("-q") || args.includes("--quiet"),
      json: args.includes("--json"),
      noColor: args.includes("--no-color"),
    };
    
    // Configure colors based on options
    if (globalOptions.noColor) {
      // Disable colors - chalk doesn't have setColorEnabled method
      process.env.NO_COLOR = "1";
    }
    
    await cli.parse(process.argv);
  } catch (error) {
    await handleError(error, globalOptions);
  }
}

// Always run in SEA mode - no need to check if main module
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
}); 