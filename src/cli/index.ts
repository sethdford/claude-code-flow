#!/usr/bin/env node
/**
 * Claude-Flow CLI entry point
 * This redirects to simple-cli.ts for remote execution compatibility
 */

// Note: simple-cli.js has been removed as it was a legacy implementation
// Spinner import removed - not available in current cliffy version
import { logger } from "../core/logger.js";
import { configManager } from "../core/config.js";
import { Command } from "./cliffy-compat.js";
import { startCommand } from "./commands/start.js";
// import { agentCommand } from "./commands/agent.js"; // Temporarily disabled due to TypeScript errors
import { taskCommand } from "./commands/task.js";
// Import placeholder commands (actual implementations are in simple-cli)
const memoryCommand = { description: "Memory commands", showHelp: () => console.log("Use simple-cli") };
const configCommand = { description: "Config commands", showHelp: () => console.log("Use simple-cli") };
const statusCommand = { description: "Status commands", showHelp: () => console.log("Use simple-cli") };
const agentCommand = { description: "Agent commands (temporarily disabled)", showHelp: () => console.log("Use simple-cli") };
import { monitorCommand } from "./commands/monitor.js";
import { sessionCommand } from "./commands/session.js";
import { workflowCommand } from "./commands/workflow.js";
import { helpCommand } from "./commands/help.js";
import { mcpCommand } from "./commands/mcp.js";
import { formatError, displayBanner, displayVersion } from "./formatter.js";
import { startNodeREPL as startREPL } from "./node-repl.js";
import { CompletionGenerator } from "./completion.js";

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

// Version information
const VERSION = "1.0.71";
const BUILD_DATE = new Date().toISOString().split("T")[0];

// Main CLI command
const cli = new Command()
  .name("claude-flow")
  .version(VERSION)
  .description("Claude-Flow: Advanced AI agent orchestration system for multi-agent coordination")
  .option("-c, --config <path>", "Path to configuration file", "./claude-flow.config.json")
  .option("-v, --verbose", "Enable verbose logging")
  .option("-q, --quiet", "Suppress non-essential output")
  .option("--log-level <level>", "Set log level (debug, info, warn, error)", "info")
  .option("--no-color", "Disable colored output")
  .option("--json", "Output in JSON format where applicable")
  .option("--profile <profile>", "Use named configuration profile")
  .action(async (options: any) => {
    // If no subcommand, show banner and start REPL
    await setupLogging(options);
    
    if (!options.quiet) {
      displayBanner(VERSION);
      console.log(colors.gray('Type "help" for available commands or "exit" to quit.\n'));
    }
    
    await startREPL(options);
  });

// Add subcommands
cli
  .addCommand(startCommand)
  // .addCommand(agentCommand) // Temporarily disabled
  .addCommand(taskCommand)
  .addCommand(monitorCommand)
  .addCommand(sessionCommand)
  .addCommand(workflowCommand)
  .addCommand(mcpCommand)
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
    console.error(colors.gray('Or use "claude-flow help" to see available commands'));
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
    console.log(`\n${  colors.gray("Gracefully shutting down...")}`);
    process.exit(0);
  };
  
  process.on("SIGINT", gracefulShutdown);
  process.on("SIGTERM", gracefulShutdown);
}

// Main entry point
// Check if this is the main module being run
const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
  process.argv[1]?.endsWith("/claude-flow") ||
  process.argv[1]?.endsWith("\\claude-flow") ||
  process.argv[1]?.endsWith("/index.js") ||
  process.argv[1]?.endsWith("\\index.js");

if (isMainModule) {
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
    
    await cli.parse(args);
  } catch (error) {
    await handleError(error, globalOptions);
  }
}