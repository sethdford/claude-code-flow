/**
 * Claude instance management commands
 */

import { Command } from "../cliffy-compat.js";
import chalk from "chalk";
import { spawn } from "node:child_process";
import { generateId } from "../../utils/helpers.js";
import { promises as fs } from "node:fs";
import type { BaseCommandOptions } from "./types.js";

// Type definitions for Claude workflows
interface ClaudeTask {
  id?: string;
  name?: string;
  description?: string;
  type?: string;
  tools?: string[] | string;
  skipPermissions?: boolean;
  dangerouslySkipPermissions?: boolean;
  config?: string;
}

interface ClaudeWorkflow {
  name?: string;
  tasks?: ClaudeTask[];
  parallel?: boolean;
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
};

interface ClaudeSpawnOptions extends BaseCommandOptions {
  tools?: string;
  "no-permissions"?: boolean;
  config?: string;
  mode?: string;
  parallel?: boolean;
  research?: boolean;
  coverage?: string;
  commit?: string;
  verbose?: boolean;
  "dry-run"?: boolean;
  dryRun?: boolean;
}

interface ClaudeWorkflowOptions extends BaseCommandOptions {
  "no-permissions"?: boolean;
  config?: string;
  parallel?: boolean;
  verbose?: boolean;
  "dry-run"?: boolean;
}

export const claudeCommand = new Command()
  .name("claude")
  .description("Manage Claude instances")
  .action(() => {
    console.log("Usage: claude-flow claude <command> [options]");
    console.log("\nCommands:");
    console.log("  spawn     Spawn a new Claude instance with specific configuration");
    console.log("\nRun \"claude-flow claude <command> --help\" for more information");
  });

// Add spawn subcommand
claudeCommand
  .command("spawn")
  .description("Spawn a new Claude instance with specific configuration")
  .arguments("<task>")
  .option("-t, --tools <tools>", "Allowed tools (comma-separated)", "View,Edit,Replace,GlobTool,GrepTool,LS,Bash")
  .option("--no-permissions", "Use --dangerously-skip-permissions flag")
  .option("-c, --config <config>", "MCP config file path")
  .option("-m, --mode <mode>", "Development mode (full, backend-only, frontend-only, api-only)", "full")
  .option("--parallel", "Enable parallel execution with BatchTool")
  .option("--research", "Enable web research with WebFetchTool")
  .option("--coverage <coverage>", "Test coverage target", "80")
  .option("--commit <frequency>", "Commit frequency (phase, feature, manual)", "phase")
  .option("-v, --verbose", "Enable verbose output")
  .option("--dry-run", "Show what would be executed without running")
  .action(async (task: string, options: ClaudeSpawnOptions) => {
    try {
      const instanceId = generateId("claude");
        
      // Build allowed tools list
      let { tools } = options;
      const defaultTools = "View,Edit,Replace,GlobTool,GrepTool,LS,Bash";
      tools = tools || defaultTools;
      
      if (options.parallel && !tools.includes("BatchTool")) {
        tools += ",BatchTool,dispatch_agent";
      }
      if (options.research && !tools.includes("WebFetchTool")) {
        tools += ",WebFetchTool";
      }
        
      // Build Claude command
      const claudeArgs = [task];
      claudeArgs.push("--allowedTools", tools);
        
      if (options["no-permissions"]) {
        claudeArgs.push("--dangerously-skip-permissions");
      }
        
      if (options.config) {
        claudeArgs.push("--mcp-config", options.config);
      }
        
      if (options.verbose) {
        claudeArgs.push("--verbose");
      }
        
      if (options.dryRun || options["dry-run"]) {
        console.log(colors.yellow("DRY RUN - Would execute:"));
        console.log(colors.gray(`claude ${claudeArgs.join(" ")}`));
        console.log("\nConfiguration:");
        console.log(`  Instance ID: ${instanceId}`);
        console.log(`  Task: ${task}`);
        console.log(`  Tools: ${tools}`);
        console.log(`  Mode: ${options.mode}`);
        console.log(`  Coverage: ${options.coverage}%`);
        console.log(`  Commit: ${options.commit}`);
        return;
      }
        
      console.log(colors.green(`Spawning Claude instance: ${instanceId}`));
      console.log(colors.gray(`Task: ${task}`));
      console.log(colors.gray(`Tools: ${tools}`));
        
      // Spawn Claude process
      const claude = spawn("claude", claudeArgs, {
        stdio: "inherit",
        env: {
          ...process.env,
          CLAUDE_INSTANCE_ID: instanceId,
          CLAUDE_FLOW_MODE: options.mode,
          CLAUDE_FLOW_COVERAGE: options.coverage || "90",
          CLAUDE_FLOW_COMMIT: options.commit,
        },
      });
        
      claude.on("error", (err) => {
        console.error(colors.red("Failed to spawn Claude:"), err.message);
      });
        
      claude.on("exit", (code) => {
        if (code === 0) {
          console.log(colors.green(`Claude instance ${instanceId} completed successfully`));
        } else {
          console.log(colors.red(`Claude instance ${instanceId} exited with code ${code}`));
        }
      });
        
        } catch (error) {
      console.error(colors.red("Failed to spawn Claude:"), (error as Error).message);
    }
  })
  // Removed batch subcommand - use top-level 'batch' command instead
  // .command("batch")
  // .description("Spawn multiple Claude instances from workflow")
  // .arguments("<workflow-file>")
  // .option("--dry-run", "Show what would be executed without running")
  // .action(async (options: ClaudeWorkflowOptions, workflowFile: string) => {
  //   // Implementation moved to top-level batch command
  // });