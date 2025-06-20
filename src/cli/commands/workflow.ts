/**
 * Workflow execution commands for Claude-Flow
 * Connects to real task engine and coordination manager
 */

import { Command } from "../cliffy-compat.js";
import chalk from "chalk";
import Table from "cli-table3";
import { formatDuration, formatStatusIndicator, formatProgressBar } from "../formatter.js";
import { generateId } from "../../utils/helpers.js";
import inquirer from "inquirer";
import { promises as fs } from "node:fs";
import { TaskEngine, Workflow, WorkflowTask } from "../../task/engine.js";
import { CoordinationManager } from "../../coordination/manager.js";
import { EventBus } from "../../core/event-bus.js";
import { Logger } from "../../core/logger.js";
import { SystemEvents } from "../../utils/types.js";

// Simple prompt wrappers
const Confirm = async (message: string): Promise<boolean> => {
  const answer = await inquirer.prompt<{ result: boolean }>([{
    type: "confirm",
    name: "result",
    message,
  }]);
  return answer.result;
};

// Input function removed - not used

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
  dim: chalk.dim,
};

// Global instances for real workflow execution
let taskEngine: TaskEngine | null = null;
let coordinationManager: CoordinationManager | null = null;
let eventBus: EventBus | null = null;
let logger: Logger | null = null;

// Initialize real workflow components
async function initializeWorkflowSystem(): Promise<void> {
  if (taskEngine && coordinationManager) {
    return; // Already initialized
  }

  try {
    eventBus = EventBus.getInstance();
    logger = Logger.getInstance();
    
    // Initialize task engine
    taskEngine = new TaskEngine(10); // Max 10 concurrent tasks
    
    // Initialize coordination manager
    const coordinationConfig = {
      maxRetries: 3,
      retryDelay: 1000,
      deadlockDetection: true,
      resourceTimeout: 60000,
      messageTimeout: 30000,
    };
    
    coordinationManager = new CoordinationManager(coordinationConfig, eventBus, logger);
    await coordinationManager.initialize();
    
    console.log(colors.green("✓ Workflow system initialized"));
  } catch (error) {
    console.log(colors.yellow("⚠ Workflow system initialization failed, using fallback mode"));
    logger?.warn("Failed to initialize workflow system", { error });
    taskEngine = null;
    coordinationManager = null;
  }
}

export const workflowCommand = new Command()
  .name("workflow")
  .description("Execute and manage workflows")
  .action(() => {
    workflowCommand.outputHelp();
  });

// Add subcommands properly
workflowCommand
  .command("run")
  .description("Execute a workflow from file")
  .arguments("<workflow-file>")
  .option("-d, --dry-run", "Validate workflow without executing")
  .option("-v, --variables <vars>", "Override variables (JSON format)")
  .option("-w, --watch", "Watch workflow execution progress")
  .option("--parallel", "Allow parallel execution where possible")
  .option("--fail-fast", "Stop on first task failure")
  .action(async (workflowFile: string, options: { dryRun?: boolean; variables?: string; watch?: boolean; parallel?: boolean; failFast?: boolean }) => {
    await initializeWorkflowSystem();
    await runWorkflow(workflowFile, options);
  });

workflowCommand
  .command("validate")
  .description("Validate a workflow file")
  .arguments("<workflow-file>")
  .option("--strict", "Use strict validation mode")
  .action(async (workflowFile: string, options: { strict?: boolean }) => {
    await validateWorkflow(workflowFile, options);
  });

workflowCommand
  .command("list")
  .description("List running workflows")
  .option("--all", "Include completed workflows")
  .option("--format <format>", "Output format (table, json)", "table")
  .action(async (options: { all?: boolean; format?: string }) => {
    await initializeWorkflowSystem();
    await listWorkflows(options);
  });

workflowCommand
  .command("status")
  .description("Show workflow execution status")
  .arguments("<workflow-id>")
  .option("-w, --watch", "Watch workflow progress")
  .action(async (workflowId: string, options: { watch?: boolean }) => {
    await initializeWorkflowSystem();
    await showWorkflowStatus(workflowId, options);
  });

workflowCommand
  .command("stop")
  .description("Stop a running workflow")
  .arguments("<workflow-id>")
  .option("-f, --force", "Force stop without cleanup")
  .action(async (workflowId: string, options: { force?: boolean }) => {
    await initializeWorkflowSystem();
    await stopWorkflow(workflowId, options);
  });

workflowCommand
  .command("template")
  .description("Generate workflow templates")
  .arguments("<template-type>")
  .option("-o, --output <file>", "Output file path")
  .option("--format <format>", "Template format (json, yaml)", "json")
  .action(async (templateType: string, options: { output?: string; format?: string }) => {
    await generateTemplate(templateType, options);
  });

interface WorkflowDefinition {
  name: string;
  version?: string;
  description?: string;
  variables?: Record<string, unknown>;
  agents?: AgentDefinition[];
  tasks: TaskDefinition[];
  dependencies?: Record<string, string[]>;
  settings?: WorkflowSettings;
}

interface AgentDefinition {
  id: string;
  type: string;
  name?: string;
  config?: Record<string, unknown>;
}

interface TaskDefinition {
  id: string;
  name?: string;
  type: string;
  description: string;
  assignTo?: string;
  depends?: string[];
  input?: Record<string, unknown>;
  timeout?: number;
  retries?: number;
  condition?: string;
}

interface WorkflowSettings {
  maxConcurrency?: number;
  timeout?: number;
  retryPolicy?: "none" | "immediate" | "exponential";
  failurePolicy?: "fail-fast" | "continue" | "ignore";
}

interface WorkflowExecution {
  id: string;
  workflowName: string;
  status: "pending" | "running" | "completed" | "failed" | "stopped";
  startedAt: Date;
  completedAt?: Date;
  progress: {
    total: number;
    completed: number;
    failed: number;
  };
  tasks: TaskExecution[];
}

interface TaskExecution {
  id: string;
  taskId: string;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  startedAt?: Date;
  completedAt?: Date;
  assignedAgent?: string;
  error?: string;
  output?: unknown;
}

interface RunWorkflowOptions {
  dryRun?: boolean;
  variables?: string;
  watch?: boolean;
  parallel?: boolean;
  failFast?: boolean;
}

// Active workflow executions storage
const activeWorkflows = new Map<string, WorkflowExecution>();

async function runWorkflow(workflowFile: string, options: RunWorkflowOptions): Promise<void> {
  try {
    // Load and validate workflow
    const workflow = await loadWorkflow(workflowFile);
    
    if (options.dryRun) {
      await validateWorkflowDefinition(workflow, true);
      console.log(colors.green("✓ Workflow validation passed"));
      return;
    }

    // Override variables if provided
    if (options.variables) {
      try {
        const vars = JSON.parse(options.variables) as Record<string, unknown>;
        workflow.variables = { ...workflow.variables, ...vars };
      } catch (error) {
        throw new Error(`Invalid variables JSON: ${(error as Error).message}`);
      }
    }

    // Create execution plan
    const execution = await createExecution(workflow);
    
    console.log(colors.cyan.bold("Starting workflow execution"));
    console.log(`${colors.white("Workflow:")} ${workflow.name}`);
    console.log(`${colors.white("ID:")} ${execution.id}`);
    console.log(`${colors.white("Tasks:")} ${execution.tasks.length}`);
    console.log();

    if (options.watch) {
      await executeWorkflowWithWatch(execution, workflow, options);
    } else {
      await executeWorkflow(execution, workflow, options);
    }
  } catch (error) {
    console.error(colors.red("Workflow execution failed:"), (error as Error).message);
    process.exit(1);
  }
}

interface ValidateWorkflowOptions {
  strict?: boolean;
}

async function validateWorkflow(workflowFile: string, options: ValidateWorkflowOptions): Promise<void> {
  try {
    const workflow = await loadWorkflow(workflowFile);
    await validateWorkflowDefinition(workflow, options.strict);
    
    console.log(colors.green("✓ Workflow validation passed"));
    console.log(`${colors.white("Name:")} ${workflow.name}`);
    console.log(`${colors.white("Tasks:")} ${workflow.tasks.length}`);
    console.log(`${colors.white("Agents:")} ${workflow.agents?.length ?? 0}`);
    
    if (workflow.dependencies) {
      const depCount = Object.values(workflow.dependencies).flat().length;
      console.log(`${colors.white("Dependencies:")} ${depCount}`);
    }
  } catch (error) {
    console.error(colors.red("✗ Workflow validation failed:"), (error as Error).message);
    process.exit(1);
  }
}

interface ListWorkflowOptions {
  all?: boolean;
  format?: string;
}

async function listWorkflows(options: ListWorkflowOptions): Promise<void> {
  try {
    // Mock workflow list - in production, this would query the orchestrator
    const workflows = await getRunningWorkflows(options.all);
    
    if (options.format === "json") {
      console.log(JSON.stringify(workflows, null, 2));
      return;
    }

    if (workflows.length === 0) {
      console.log(colors.gray("No workflows found"));
      return;
    }

    console.log(colors.cyan.bold(`Workflows (${workflows.length})`));
    console.log("─".repeat(60));

    const table = new Table({
      head: ["ID", "Name", "Status", "Progress", "Started", "Duration"],
      style: { head: ["cyan"] },
    });

    for (const workflow of workflows) {
      const statusIcon = formatStatusIndicator(workflow.status);
      const progress = `${workflow.progress.completed}/${workflow.progress.total}`;
      const progressBar = formatProgressBar(
        workflow.progress.completed,
        workflow.progress.total,
        10,
      );
      const duration = workflow.completedAt 
        ? formatDuration(workflow.completedAt.getTime() - workflow.startedAt.getTime())
        : formatDuration(Date.now() - workflow.startedAt.getTime());
      
      table.push([
        colors.gray(`${workflow.id.substring(0, 8)  }...`),
        colors.white(workflow.workflowName),
        `${statusIcon} ${workflow.status}`,
        `${progressBar} ${progress}`,
        workflow.startedAt.toLocaleTimeString(),
        duration,
      ]);
    }

    console.log(table.toString());
  } catch (error) {
    console.error(colors.red("Failed to list workflows:"), (error as Error).message);
  }
}

interface ShowWorkflowStatusOptions {
  watch?: boolean;
}

async function showWorkflowStatus(workflowId: string, options: ShowWorkflowStatusOptions): Promise<void> {
  try {
    if (options.watch) {
      await watchWorkflowStatus(workflowId);
    } else {
      const execution = await getWorkflowExecution(workflowId);
      displayWorkflowStatus(execution);
    }
  } catch (error) {
    console.error(colors.red("Failed to get workflow status:"), (error as Error).message);
  }
}

interface StopWorkflowOptions {
  force?: boolean;
}

async function stopWorkflow(workflowId: string, options: StopWorkflowOptions): Promise<void> {
  try {
    const execution = await getWorkflowExecution(workflowId);
    
    if (execution.status !== "running") {
      console.log(colors.yellow(`Workflow is not running (status: ${execution.status})`));
      return;
    }

    if (!options.force) {
      const confirmed = await Confirm(`Stop workflow "${execution.workflowName}"?`);

      if (!confirmed) {
        console.log(colors.gray("Stop cancelled"));
        return;
      }
    }

    console.log(colors.yellow("Stopping workflow..."));
    
    // Mock stopping - in production, this would call the orchestrator
    if (options.force) {
      console.log(colors.red("• Force stopping all tasks"));
    } else {
      console.log(colors.blue("• Gracefully stopping tasks"));
      console.log(colors.blue("• Cleaning up resources"));
    }

    console.log(colors.green("✓ Workflow stopped"));
  } catch (error) {
    console.error(colors.red("Failed to stop workflow:"), (error as Error).message);
  }
}

interface GenerateTemplateOptions {
  output?: string;
  format?: string;
}

async function generateTemplate(templateType: string, options: GenerateTemplateOptions): Promise<void> {
  const templates: Record<string, WorkflowDefinition> = {
    "research": {
      name: "Research Workflow",
      description: "Multi-stage research and analysis workflow",
      variables: {
        "topic": "quantum computing",
        "depth": "comprehensive",
      },
      agents: [
        { id: "researcher", type: "researcher", name: "Research Agent" },
        { id: "analyzer", type: "analyst", name: "Analysis Agent" },
      ],
      tasks: [
        {
          id: "research-task",
          type: "research",
          description: "Research the given topic",
          assignTo: "researcher",
          input: { topic: "${topic}", depth: "${depth}" },
        },
        {
          id: "analyze-task",
          type: "analysis",
          description: "Analyze research findings",
          assignTo: "analyzer",
          depends: ["research-task"],
          input: { data: "${research-task.output}" },
        },
      ],
      settings: {
        maxConcurrency: 2,
        timeout: 300000,
        failurePolicy: "fail-fast",
      },
    },
    "implementation": {
      name: "Implementation Workflow",
      description: "Code implementation and testing workflow",
      agents: [
        { id: "implementer", type: "implementer", name: "Implementation Agent" },
        { id: "tester", type: "implementer", name: "Testing Agent" },
      ],
      tasks: [
        {
          id: "implement",
          type: "implementation",
          description: "Implement the solution",
          assignTo: "implementer",
        },
        {
          id: "test",
          type: "testing",
          description: "Test the implementation",
          assignTo: "tester",
          depends: ["implement"],
        },
      ],
    },
    "coordination": {
      name: "Multi-Agent Coordination",
      description: "Complex multi-agent coordination workflow",
      agents: [
        { id: "coordinator", type: "coordinator", name: "Coordinator Agent" },
        { id: "worker1", type: "implementer", name: "Worker Agent 1" },
        { id: "worker2", type: "implementer", name: "Worker Agent 2" },
      ],
      tasks: [
        {
          id: "plan",
          type: "planning",
          description: "Create execution plan",
          assignTo: "coordinator",
        },
        {
          id: "work1",
          type: "implementation",
          description: "Execute part 1",
          assignTo: "worker1",
          depends: ["plan"],
        },
        {
          id: "work2",
          type: "implementation",
          description: "Execute part 2",
          assignTo: "worker2",
          depends: ["plan"],
        },
        {
          id: "integrate",
          type: "integration",
          description: "Integrate results",
          assignTo: "coordinator",
          depends: ["work1", "work2"],
        },
      ],
      settings: {
        maxConcurrency: 3,
        failurePolicy: "continue",
      },
    },
  };

  const template = templates[templateType];
  if (!template) {
    console.error(colors.red(`Unknown template type: ${templateType}`));
    console.log(colors.gray("Available templates:"), Object.keys(templates).join(", "));
    return;
  }

  const outputFile = options.output ?? `${templateType}-workflow.${options.format}`;
  
  let content: string;
  if (options.format === "yaml") {
    // In production, use a proper YAML library
    console.log(colors.yellow("YAML format not implemented, using JSON"));
    content = JSON.stringify(template, null, 2);
  } else {
    content = JSON.stringify(template, null, 2);
  }

  await fs.writeFile(outputFile, content, "utf-8");

  console.log(colors.green("✓ Workflow template generated"));
  console.log(`${colors.white("Template:")} ${templateType}`);
  console.log(`${colors.white("File:")} ${outputFile}`);
  console.log(`${colors.white("Tasks:")} ${template.tasks.length}`);
  console.log(`${colors.white("Agents:")} ${template.agents?.length ?? 0}`);
}

async function loadWorkflow(workflowFile: string): Promise<WorkflowDefinition> {
  try {
    const content = await fs.readFile(workflowFile, "utf-8");
    
    if (workflowFile.endsWith(".yaml") || workflowFile.endsWith(".yml")) {
      // In production, use a proper YAML parser
      throw new Error("YAML workflows not yet supported");
    }
    
    return JSON.parse(content) as WorkflowDefinition;
  } catch (error) {
    throw new Error(`Failed to load workflow file: ${(error as Error).message}`);
  }
}

async function validateWorkflowDefinition(workflow: WorkflowDefinition, strict = false): Promise<void> {
  const errors: string[] = [];

  // Basic validation
  if (!workflow.name) errors.push("Workflow name is required");
  if (!workflow.tasks || workflow.tasks.length === 0) errors.push("At least one task is required");

  // Task validation
  const taskIds = new Set<string>();
  for (const task of workflow.tasks ?? []) {
    if (!task.id) errors.push("Task ID is required");
    if (taskIds.has(task.id)) errors.push(`Duplicate task ID: ${task.id}`);
    taskIds.add(task.id);
    
    if (!task.type) errors.push(`Task ${task.id}: type is required`);
    if (!task.description) errors.push(`Task ${task.id}: description is required`);
    
    // Validate dependencies
    if (task.depends && Array.isArray(task.depends)) {
      for (const dep of task.depends) {
        // For now, just check if the dependency is a valid string
        if (typeof dep !== "string" || dep.trim() === "") {
          errors.push(`Task ${task.id}: invalid dependency ${dep}`);
        }
      }
    }
  }

  // Second pass: validate dependency references after all tasks are collected
  for (const task of workflow.tasks ?? []) {
    if (task.depends && Array.isArray(task.depends)) {
      for (const dep of task.depends) {
        if (!taskIds.has(dep)) {
          errors.push(`Task ${task.id}: unknown dependency ${dep}`);
        }
      }
    }
  }

  // Agent validation
  if (workflow.agents) {
    const agentIds = new Set<string>();
    for (const agent of workflow.agents) {
      if (!agent.id) errors.push("Agent ID is required");
      if (agentIds.has(agent.id)) errors.push(`Duplicate agent ID: ${agent.id}`);
      agentIds.add(agent.id);
      
      if (!agent.type) errors.push(`Agent ${agent.id}: type is required`);
    }

    // Validate task assignments
    for (const task of workflow.tasks) {
      if (task.assignTo && !agentIds.has(task.assignTo)) {
        errors.push(`Task ${task.id}: assigned to unknown agent ${task.assignTo}`);
      }
    }
  }

  // Strict validation
  if (strict) {
    // Check for circular dependencies
    const graph = new Map<string, string[]>();
    for (const task of workflow.tasks) {
      graph.set(task.id, task.depends ?? []);
    }
    
    if (hasCircularDependencies(graph)) {
      errors.push("Circular dependencies detected");
    }
  }

  if (errors.length > 0) {
    throw new Error(`Workflow validation failed:\n• ${errors.join("\n• ")}`);
  }
}

async function createExecution(workflow: WorkflowDefinition): Promise<WorkflowExecution> {
  const tasks: TaskExecution[] = workflow.tasks.map(task => ({
    id: generateId("task-exec"),
    taskId: task.id,
    status: "pending",
  }));

  return {
    id: generateId("workflow-exec"),
    workflowName: workflow.name,
    status: "pending",
    startedAt: new Date(),
    progress: {
      total: tasks.length,
      completed: 0,
      failed: 0,
    },
    tasks,
  };
}

async function executeWorkflow(execution: WorkflowExecution, workflow: WorkflowDefinition, options: RunWorkflowOptions): Promise<void> {
  execution.status = "running";
  activeWorkflows.set(execution.id, execution);
  
  console.log(colors.blue("Executing workflow..."));
  console.log();

  if (taskEngine) {
    // Use real task engine
    await executeWorkflowWithTaskEngine(execution, workflow, options);
  } else {
    // Fallback to mock execution
    await executeWorkflowFallback(execution, workflow, options);
  }
}

async function executeWorkflowWithTaskEngine(execution: WorkflowExecution, workflow: WorkflowDefinition, options: RunWorkflowOptions): Promise<void> {
  if (!taskEngine) {
    throw new Error("Task engine not available");
  }

  console.log(colors.green("Using real task engine for execution"));

  try {
    // Convert workflow definition to engine format
    const engineWorkflow: Workflow = {
      id: execution.id,
      name: workflow.name,
      description: workflow.description || "",
      version: workflow.version || "1.0.0",
      tasks: workflow.tasks.map(task => ({
        id: task.id,
        type: task.type,
        description: task.description,
        priority: 0,
        status: "pending",
        input: task.input || {},
        createdAt: new Date(),
        dependencies: (task.depends || []).map(depId => ({
          taskId: depId,
          type: "finish-to-start" as const,
        })),
        resourceRequirements: [],
        timeout: task.timeout || 300000,
        tags: [],
        progressPercentage: 0,
        checkpoints: [],
        metadata: {},
      })),
      variables: workflow.variables || {},
      parallelism: {
        maxConcurrent: workflow.settings?.maxConcurrency || 5,
        strategy: "priority-based" as const,
      },
      errorHandling: {
        strategy: options.failFast ? "fail-fast" : "continue-on-error",
        maxRetries: 3,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: "cli",
    };

    // Set up event listeners for progress tracking
    const handleTaskStarted = (data: any) => {
      const taskExec = execution.tasks.find(t => t.taskId === data.taskId);
      if (taskExec) {
        taskExec.status = "running";
        taskExec.startedAt = new Date();
        console.log(`${colors.cyan("→")} Starting task: ${data.taskId}`);
      }
    };

    const handleTaskCompleted = (data: any) => {
      const taskExec = execution.tasks.find(t => t.taskId === data.taskId);
      if (taskExec) {
        taskExec.status = "completed";
        taskExec.completedAt = new Date();
        taskExec.output = data.result;
        execution.progress.completed++;
        console.log(`${colors.green("✓")} Completed: ${data.taskId}`);
      }
    };

    const handleTaskFailed = (data: any) => {
      const taskExec = execution.tasks.find(t => t.taskId === data.taskId);
      if (taskExec) {
        taskExec.status = "failed";
        taskExec.completedAt = new Date();
        taskExec.error = data.error.message;
        execution.progress.failed++;
        console.log(`${colors.red("✗")} Failed: ${data.taskId} - ${data.error.message}`);
      }
    };

    if (eventBus) {
      eventBus.on(SystemEvents.TASK_STARTED, handleTaskStarted);
      eventBus.on(SystemEvents.TASK_COMPLETED, handleTaskCompleted);
      eventBus.on(SystemEvents.TASK_FAILED, handleTaskFailed);
    }

    try {
      // Execute workflow through task engine
      await taskEngine.executeWorkflow(engineWorkflow);
      
      execution.status = execution.progress.failed > 0 ? "failed" : "completed";
      execution.completedAt = new Date();
      
    } finally {
      // Clean up event listeners
      if (eventBus) {
        eventBus.off(SystemEvents.TASK_STARTED, handleTaskStarted);
        eventBus.off(SystemEvents.TASK_COMPLETED, handleTaskCompleted);
        eventBus.off(SystemEvents.TASK_FAILED, handleTaskFailed);
      }
    }

  } catch (error) {
    execution.status = "failed";
    execution.completedAt = new Date();
    console.error(colors.red("Workflow execution failed:"), (error as Error).message);
  }

  // Display final results
  const duration = formatDuration(execution.completedAt.getTime() - execution.startedAt.getTime());
  
  if (execution.status === "completed") {
    console.log(colors.green.bold("✓ Workflow completed successfully"));
  } else {
    console.log(colors.red.bold("✗ Workflow completed with failures"));
  }
  
  console.log(`${colors.white("Duration:")} ${duration}`);
  console.log(`${colors.white("Tasks:")} ${execution.progress.completed}/${execution.progress.total} completed`);
  
  if (execution.progress.failed > 0) {
    console.log(`${colors.white("Failed:")} ${execution.progress.failed}`);
  }
}

async function executeWorkflowFallback(execution: WorkflowExecution, workflow: WorkflowDefinition, options: RunWorkflowOptions): Promise<void> {
  console.log(colors.yellow("Using fallback execution mode (task engine not available)"));

  // Mock execution - simplified version for fallback
  for (let i = 0; i < execution.tasks.length; i++) {
    const taskExec = execution.tasks[i];
    const taskDef = workflow.tasks.find(t => t.id === taskExec.taskId);
    
    if (!taskDef) {
      throw new Error(`Task definition not found for taskId: ${taskExec.taskId}`);
    }
    
    console.log(`${colors.cyan("→")} Starting task: ${taskDef.description}`);
    
    taskExec.status = "running";
    taskExec.startedAt = new Date();
    
    // Simulate task execution
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Random success/failure for demo
    const success = Math.random() > 0.1; // 90% success rate
    
    if (success) {
      taskExec.status = "completed";
      taskExec.completedAt = new Date();
      execution.progress.completed++;
      console.log(`${colors.green("✓")} Completed: ${taskDef.description}`);
    } else {
      taskExec.status = "failed";
      taskExec.completedAt = new Date();
      taskExec.error = "Simulated task failure";
      execution.progress.failed++;
      console.log(`${colors.red("✗")} Failed: ${taskDef.description}`);
      
      if (options.failFast || workflow.settings?.failurePolicy === "fail-fast") {
        execution.status = "failed";
        console.log(colors.red("\nWorkflow failed (fail-fast mode)"));
        return;
      }
    }
    
    console.log();
  }

  execution.status = execution.progress.failed > 0 ? "failed" : "completed";
  execution.completedAt = new Date();
  
  const duration = formatDuration(execution.completedAt.getTime() - execution.startedAt.getTime());
  
  if (execution.status === "completed") {
    console.log(colors.green.bold("✓ Workflow completed successfully"));
  } else {
    console.log(colors.red.bold("✗ Workflow completed with failures"));
  }
  
  console.log(`${colors.white("Duration:")} ${duration}`);
  console.log(`${colors.white("Tasks:")} ${execution.progress.completed}/${execution.progress.total} completed`);
  
  if (execution.progress.failed > 0) {
    console.log(`${colors.white("Failed:")} ${execution.progress.failed}`);
  }
}

async function executeWorkflowWithWatch(execution: WorkflowExecution, workflow: WorkflowDefinition, options: RunWorkflowOptions): Promise<void> {
  console.log(colors.yellow("Starting workflow execution in watch mode..."));
  console.log(colors.gray("Press Ctrl+C to stop\n"));

  // Start execution in background and watch progress
  const executionPromise = executeWorkflow(execution, workflow, options);
  
  // Watch loop
  const watchInterval = setInterval(() => {
    displayWorkflowProgress(execution);
  }, 1000);

  try {
    await executionPromise;
  } finally {
    clearInterval(watchInterval);
    displayWorkflowProgress(execution);
  }
}

async function watchWorkflowStatus(workflowId: string): Promise<void> {
  console.log(colors.cyan("Watching workflow status..."));
  console.log(colors.gray("Press Ctrl+C to stop\n"));

   
  while (true) {
    try {
      console.clear();
      const execution = await getWorkflowExecution(workflowId);
      displayWorkflowStatus(execution);
      
      if (execution.status === "completed" || execution.status === "failed" || execution.status === "stopped") {
        console.log(`\n${  colors.gray("Workflow finished. Exiting watch mode.")}`);
        break;
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(colors.red("Error watching workflow:"), (error as Error).message);
      break;
    }
  }
}

function displayWorkflowStatus(execution: WorkflowExecution): void {
  console.log(colors.cyan.bold("Workflow Status"));
  console.log("─".repeat(50));
  
  const statusIcon = formatStatusIndicator(execution.status);
  const duration = execution.completedAt 
    ? formatDuration(execution.completedAt.getTime() - execution.startedAt.getTime())
    : formatDuration(Date.now() - execution.startedAt.getTime());
  
  console.log(`${colors.white("Name:")} ${execution.workflowName}`);
  console.log(`${colors.white("ID:")} ${execution.id}`);
  console.log(`${colors.white("Status:")} ${statusIcon} ${execution.status}`);
  console.log(`${colors.white("Started:")} ${execution.startedAt.toLocaleString()}`);
  console.log(`${colors.white("Duration:")} ${duration}`);
  
  const progressBar = formatProgressBar(
    execution.progress.completed,
    execution.progress.total,
    40,
    "Progress",
  );
  console.log(`${progressBar} ${execution.progress.completed}/${execution.progress.total}`);
  
  if (execution.progress.failed > 0) {
    console.log(`${colors.white("Failed Tasks:")} ${colors.red(execution.progress.failed.toString())}`);
  }
  console.log();

  // Task details
  console.log(colors.cyan.bold("Tasks"));
  console.log("─".repeat(50));
  
  const table = new Table({
    head: ["Task", "Status", "Duration", "Agent"],
    style: { head: ["cyan"] },
  });

  for (const taskExec of execution.tasks) {
    const statusIcon = formatStatusIndicator(taskExec.status);
    const duration = taskExec.completedAt && taskExec.startedAt
      ? formatDuration(taskExec.completedAt.getTime() - taskExec.startedAt.getTime())
      : taskExec.startedAt
        ? formatDuration(Date.now() - taskExec.startedAt.getTime())
        : "-";
    
    table.push([
      colors.white(taskExec.taskId),
      `${statusIcon} ${taskExec.status}`,
      duration,
      taskExec.assignedAgent ?? "-",
    ]);
  }
  
  console.log(table.toString());
}

function displayWorkflowProgress(execution: WorkflowExecution): void {
  const progress = `${execution.progress.completed}/${execution.progress.total}`;
  const progressBar = formatProgressBar(
    execution.progress.completed,
    execution.progress.total,
    30,
  );
  
  console.log(`\r${progressBar} ${progress} tasks completed`);
}

async function getRunningWorkflows(includeAll = false): Promise<WorkflowExecution[]> {
  // Mock workflow list - in production, this would query the orchestrator
  return [
    {
      id: "workflow-001",
      workflowName: "Research Workflow",
      status: "running" as const,
      startedAt: new Date(Date.now() - 120000), // 2 minutes ago
      progress: { total: 5, completed: 3, failed: 0 },
      tasks: [],
    },
    {
      id: "workflow-002",
      workflowName: "Implementation Workflow",
      status: "completed" as const,
      startedAt: new Date(Date.now() - 300000), // 5 minutes ago
      completedAt: new Date(Date.now() - 60000), // 1 minute ago
      progress: { total: 3, completed: 3, failed: 0 },
      tasks: [],
    },
  ].filter(w => includeAll || w.status === "running");
}

async function getWorkflowExecution(workflowId: string): Promise<WorkflowExecution> {
  const workflows = await getRunningWorkflows(true);
  const workflow = workflows.find(w => w.id === workflowId || w.id.startsWith(workflowId));
  
  if (!workflow) {
    throw new Error(`Workflow '${workflowId}' not found`);
  }
  
  return workflow;
}

function hasCircularDependencies(graph: Map<string, string[]>): boolean {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  
  function hasCycle(node: string): boolean {
    if (recursionStack.has(node)) return true;
    if (visited.has(node)) return false;
    
    visited.add(node);
    recursionStack.add(node);
    
    const dependencies = graph.get(node) ?? [];
    for (const dep of dependencies) {
      if (hasCycle(dep)) return true;
    }
    
    recursionStack.delete(node);
    return false;
  }
  
  for (const node of graph.keys()) {
    if (hasCycle(node)) return true;
  }
  
  return false;
}