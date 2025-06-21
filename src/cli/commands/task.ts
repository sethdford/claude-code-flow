/**
 * Task management commands
 */

import { Command } from "../cliffy-compat.js";
import chalk from "chalk";
import { Task } from "../../utils/types.js";
import { generateId } from "../../utils/helpers.js";
import * as fs from "node:fs/promises";
import type { BaseCommandOptions, TaskOptions } from "./types.js";

interface TaskCreateOptions extends BaseCommandOptions {
  priority?: string;
  dependencies?: string;
  input?: string;
  assign?: string;
}

interface TaskListOptions extends BaseCommandOptions {
  status?: string;
  agent?: string;
}

interface TaskCancelOptions extends BaseCommandOptions {
  reason?: string;
}

interface TaskWorkflowOptions extends BaseCommandOptions {
  name?: string;
  description?: string;
  template?: string;
  output?: string;
}

export const taskCommand = new Command()
  .name("task")
  .description("Manage tasks")
  .action(() => {
    taskCommand.outputHelp();
  });

taskCommand
  .command("create")
  .description("Create a new task")
  .arguments("<type:string> <description:string>")
  .option("-p, --priority <priority>", "Task priority", "0")
  .option("-d, --dependencies <deps>", "Comma-separated list of dependency task IDs")
  .option("-i, --input <input>", "Task input as JSON")
  .option("-a, --assign <agent>", "Assign to specific agent")
  .action(async (type: string, description: string, options: TaskCreateOptions) => {
    const task: Task = {
      id: generateId("task"),
      type,
      description,
      priority: parseInt(options.priority || "0", 10),
      dependencies: options.dependencies ? options.dependencies.split(",") : [],
      assignedAgent: options.assign,
      status: "pending",
      input: options.input ? JSON.parse(options.input) : {},
      createdAt: new Date(),
    };

    console.log(chalk.green("Task created:"));
    console.log(JSON.stringify(task, null, 2));
    console.log(chalk.yellow("\nTo submit this task, ensure Claude-Flow is running"));
  });

taskCommand
  .command("list")
  .description("List all tasks")
  .option("-s, --status <status>", "Filter by status")
  .option("-a, --agent <agent>", "Filter by assigned agent")
  .action(async (options: TaskListOptions) => {
    console.log(chalk.yellow("Task listing requires a running Claude-Flow instance"));
    console.log(chalk.gray("Available filters:"));
    console.log(chalk.gray("  --status: pending, running, completed, failed"));
    console.log(chalk.gray("  --agent: filter by assigned agent ID"));
  });

taskCommand
  .command("status")
  .description("Get task status")
  .arguments("<task-id>")
  .action(async (taskId: string, _options: BaseCommandOptions) => {
    console.log(chalk.yellow(`Getting status for task ${taskId} requires a running Claude-Flow instance`));
    console.log(chalk.gray("This command will show detailed task execution status and progress"));
  });

taskCommand
  .command("cancel")
  .description("Cancel a task")
  .arguments("<task-id>")
  .option("-r, --reason <reason>", "Cancellation reason")
  .action(async (taskId: string, options: TaskCancelOptions) => {
    console.log(chalk.yellow(`Cancelling task ${taskId} requires a running Claude-Flow instance`));
    if (options.reason) {
      console.log(chalk.gray(`Reason: ${options.reason}`));
    }
  });

taskCommand
  .command("workflow")
  .description("Create and manage task workflows")
  .option("-n, --name <name>", "Workflow name")
  .option("-d, --description <desc>", "Workflow description")
  .option("-t, --template <type>", "Workflow template type (research, development, analysis)")
  .option("-o, --output <file>", "Output workflow file")
  .action(async (options: TaskWorkflowOptions) => {
    console.log(chalk.cyan.bold("Task Workflow Management"));
    console.log();

    if (options.template) {
      // Generate workflow template
      const template = generateWorkflowTemplate(options.template, options);
      
      if (options.output) {
        await fs.writeFile(options.output, JSON.stringify(template, null, 2));
        console.log(chalk.green(`✓ Workflow template saved to ${options.output}`));
      } else {
        console.log(chalk.yellow("Generated workflow template:"));
        console.log(JSON.stringify(template, null, 2));
      }
    } else {
      // Show workflow help
      console.log(chalk.white("Usage: claude-flow task workflow [options]"));
      console.log();
      console.log(chalk.white("Options:"));
      console.log(chalk.gray("  -n, --name <name>        Workflow name"));
      console.log(chalk.gray("  -d, --description <desc> Workflow description"));
      console.log(chalk.gray("  -t, --template <type>    Template type (research, development, analysis)"));
      console.log(chalk.gray("  -o, --output <file>      Output workflow file"));
      console.log();
      console.log(chalk.white("Examples:"));
      console.log(chalk.gray("  claude-flow task workflow --template research --name \"AI Research\" --output research.json"));
      console.log(chalk.gray("  claude-flow task workflow --template development --name \"Feature Development\""));
    }
  });

function generateWorkflowTemplate(templateType: string, options: TaskWorkflowOptions) {
  const baseTemplate = {
    name: options.name || `${templateType} Workflow`,
    description: options.description || `A ${templateType} workflow template`,
    version: "1.0.0",
    type: templateType,
    createdAt: new Date().toISOString(),
  };

  switch (templateType.toLowerCase()) {
    case "research":
      return {
        ...baseTemplate,
        tasks: [
          {
            id: "research-1",
            name: "Literature Review",
            type: "research",
            description: "Conduct comprehensive literature review",
            priority: 1,
            dependencies: [],
          },
          {
            id: "research-2",
            name: "Data Collection",
            type: "research",
            description: "Collect and organize research data",
            priority: 2,
            dependencies: ["research-1"],
          },
          {
            id: "research-3",
            name: "Analysis",
            type: "analysis",
            description: "Analyze collected data and findings",
            priority: 3,
            dependencies: ["research-2"],
          },
          {
            id: "research-4",
            name: "Report Generation",
            type: "documentation",
            description: "Generate comprehensive research report",
            priority: 4,
            dependencies: ["research-3"],
          },
        ],
      };

    case "development":
      return {
        ...baseTemplate,
        tasks: [
          {
            id: "dev-1",
            name: "Requirements Analysis",
            type: "analysis",
            description: "Analyze and document requirements",
            priority: 1,
            dependencies: [],
          },
          {
            id: "dev-2",
            name: "Design",
            type: "design",
            description: "Create system design and architecture",
            priority: 2,
            dependencies: ["dev-1"],
          },
          {
            id: "dev-3",
            name: "Implementation",
            type: "development",
            description: "Implement the designed solution",
            priority: 3,
            dependencies: ["dev-2"],
          },
          {
            id: "dev-4",
            name: "Testing",
            type: "testing",
            description: "Test the implemented solution",
            priority: 4,
            dependencies: ["dev-3"],
          },
          {
            id: "dev-5",
            name: "Documentation",
            type: "documentation",
            description: "Create user and technical documentation",
            priority: 5,
            dependencies: ["dev-4"],
          },
        ],
      };

    case "analysis":
      return {
        ...baseTemplate,
        tasks: [
          {
            id: "analysis-1",
            name: "Data Preparation",
            type: "data-processing",
            description: "Prepare and clean data for analysis",
            priority: 1,
            dependencies: [],
          },
          {
            id: "analysis-2",
            name: "Exploratory Analysis",
            type: "analysis",
            description: "Perform exploratory data analysis",
            priority: 2,
            dependencies: ["analysis-1"],
          },
          {
            id: "analysis-3",
            name: "Statistical Analysis",
            type: "analysis",
            description: "Conduct statistical analysis",
            priority: 3,
            dependencies: ["analysis-2"],
          },
          {
            id: "analysis-4",
            name: "Visualization",
            type: "visualization",
            description: "Create visualizations and charts",
            priority: 4,
            dependencies: ["analysis-3"],
          },
          {
            id: "analysis-5",
            name: "Insights Report",
            type: "documentation",
            description: "Generate insights and recommendations report",
            priority: 5,
            dependencies: ["analysis-4"],
          },
        ],
      };

    default:
      return {
        ...baseTemplate,
        tasks: [
          {
            id: "task-1",
            name: "Sample Task",
            type: "general",
            description: "A sample task for the workflow",
            priority: 1,
            dependencies: [],
          },
        ],
      };
  }
}
