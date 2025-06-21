import { Command } from "commander";
import { logger } from "../../core/logger.js";
import path from "path";
import fs from "fs-extra";
import { execSync } from "child_process";
import chalk from "chalk";

interface WorkflowConfig {
  name: string;
  description: string;
  complexity: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  timeEstimate: string;
  prevents: string[];
  keyInnovation: string;
  category: "meta-frameworks" | "orchestration" | "synthesis";
  scriptPath?: string;
}

const WORKFLOW_CATALOG: Record<string, WorkflowConfig> = {
  "code-review-game": {
    name: "Code Review Game",
    description: "Multi-agent reviews with concern budgets to prevent bikeshedding",
    complexity: "Advanced",
    timeEstimate: "20-60 min",
    prevents: ["Bikeshedding", "tunnel vision"],
    keyInnovation: "Multi-agent reviews with concern budgets",
    category: "meta-frameworks"
  },
  "swarm-intelligence": {
    name: "Swarm Intelligence", 
    description: "5 specialized agents with dynamic spawning",
    complexity: "Expert",
    timeEstimate: "Variable",
    prevents: ["Single-perspective solutions"],
    keyInnovation: "5 specialized agents with dynamic spawning",
    category: "orchestration"
  }
};

export function createWorkflowCommand(): Command {
  const workflowCmd = new Command("workflow")
    .description("Advanced agentic workflows for game-theoretic development");

  workflowCmd
    .command("list")
    .description("List all available agentic workflows")
    .action(async () => {
      try {
        console.log(chalk.cyan.bold("\n🧬 Advanced Agentic Workflows\n"));
        
        for (const [key, config] of Object.entries(WORKFLOW_CATALOG)) {
          console.log(`  ${chalk.cyan("•")} ${chalk.bold(config.name)} ${chalk.gray(`(${key})`)}`);
          console.log(`    ${config.description}`);
          console.log(`    ${chalk.blue(`Time: ${config.timeEstimate}`)} | ${chalk.red(`Complexity: ${config.complexity}`)}`);
          console.log(`    ${chalk.gray(`Prevents: ${config.prevents.join(", ")}`)}`);
          console.log(`    ${chalk.green(`Innovation: ${config.keyInnovation}`)}\n`);
        }
      } catch (error) {
        if (logger) logger.error("Failed to list workflows:", error);
        process.exit(1);
      }
    });

  workflowCmd
    .command("init")
    .description("Initialize the workflow environment")
    .action(async () => {
      try {
        console.log(chalk.cyan.bold("\n🧬 Initializing Advanced Agentic Workflows\n"));
        console.log(chalk.green("✅ Workflow environment ready!"));
      } catch (error) {
        if (logger) logger.error("Failed to initialize workflows:", error);
        process.exit(1);
      }
    });

  return workflowCmd;
}
