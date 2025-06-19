/**
 * Task management commands
 */

import { Command } from "@cliffy/command";
import { colors } from "@cliffy/ansi/colors";
import { Task } from "../../utils/types.js";
import { generateId } from "../../utils/helpers.js";
import * as fs from "node:fs/promises";

export const taskCommand = new Command()
  .description("Manage tasks")
  .action(() => {
    console.log("Usage: claude-flow task <command> [options]");
    console.log("\nCommands:");
    console.log("  create    Create a new task");
    console.log("  list      List tasks");
    console.log("  get       Get task details");
    console.log("  update    Update task status");
    console.log("  cancel    Cancel a task");
    console.log('\nRun "claude-flow task <command> --help" for more information');
  })
  .command("create")
  .description("Create a new task")
  .arguments("<type:string> <description:string>")
  .option("-p, --priority <priority>", "Task priority", "0")
  .option("-d, --dependencies <deps>", "Comma-separated list of dependency task IDs")
  .option("-i, --input <input>", "Task input as JSON")
  .option("-a, --assign <agent>", "Assign to specific agent")
  .action(async (options: any, type: string, description: string) => {
    const task: Task = {
      id: generateId("task"),
      type,
      description,
      priority: options.priority,
      dependencies: options.dependencies ? options.dependencies.split(",") : [],
      assignedAgent: options.assign,
      status: "pending",
      input: options.input ? JSON.parse(options.input) : {},
      createdAt: new Date(),
    };

    console.log(colors.green("Task created:"));
    console.log(JSON.stringify(task, null, 2));
    console.log(colors.yellow("\nTo submit this task, ensure Claude-Flow is running"));
  })
  .command("list")
  .description("List all tasks")
  .option("-s, --status <status>", "Filter by status")
  .option("-a, --agent <agent>", "Filter by assigned agent")
  .action(async (options: any) => {
    console.log(colors.yellow("Task listing requires a running Claude-Flow instance"));
  })
  .command("status")
  .description("Get task status")
  .arguments("<task-id>")
  .action(async (options: any, taskId: string) => {
    console.log(colors.yellow("Task status requires a running Claude-Flow instance"));
  })
  .command("cancel")
  .description("Cancel a task")
  .arguments("<task-id>")
  .option("-r, --reason <reason>", "Cancellation reason")
  .action(async (options: any, taskId: string) => {
    console.log(colors.yellow(`Cancelling task ${taskId} requires a running Claude-Flow instance`));
  })
  .command("workflow")
  .description("Execute a workflow from file")
  .arguments("<workflow-file>")
  .action(async (options: any, workflowFile: string) => {
    try {
      const content = await fs.readFile(workflowFile, "utf-8");
      const workflow = JSON.parse(content);
        
      console.log(colors.green("Workflow loaded:"));
      console.log(`- Name: ${workflow.name || "Unnamed"}`);
      console.log(`- Tasks: ${workflow.tasks?.length || 0}`);
      console.log(colors.yellow("\nTo execute this workflow, ensure Claude-Flow is running"));
    } catch (error) {
      console.error(colors.red("Failed to load workflow:"), (error as Error).message);
    }
  });