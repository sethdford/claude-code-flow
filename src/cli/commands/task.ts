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

export const taskCommand = new Command()
  .name("task")
  .description("Manage tasks")
  .action(() => {
    console.log("Usage: claude-flow task <command> [options]");
    console.log("\nCommands:");
    console.log("  create    Create a new task");
    console.log("  list      List tasks");
    console.log("  get       Get task details");
    console.log("  update    Update task status");
    console.log("  cancel    Cancel a task");
    console.log("\nRun \"claude-flow task <command> --help\" for more information");
  })
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
  })
  .command("list")
  .description("List all tasks")
  .option("-s, --status <status>", "Filter by status")
  .option("-a, --agent <agent>", "Filter by assigned agent")
  .action(async (_options: TaskListOptions) => {
    console.log(chalk.yellow("Task listing requires a running Claude-Flow instance"));
  })
  .command("status")
  .description("Get task status")
  .arguments("<task-id>")
  .action(async (_taskId: string, _options: BaseCommandOptions) => {
    console.log(chalk.yellow("Task status requires a running Claude-Flow instance"));
  })
  .command("cancel")
  .description("Cancel a task")
  .arguments("<task-id>")
  .option("-r, --reason <reason>", "Cancellation reason")
  .action(async (taskId: string, options: TaskCancelOptions) => {
    console.log(chalk.yellow(`Cancelling task ${taskId} requires a running Claude-Flow instance`));
  })
