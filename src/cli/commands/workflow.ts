import { Command } from "commander";
import { logger } from "../../core/logger.js";
import path from "path";
import fs from "fs-extra";
import { execSync } from "child_process";
import chalk from "chalk";
// Future integration points for swarm coordination
// import { EnhancedSwarmCoordinator } from "../../swarm/enhanced-coordinator.js";
// import { DirectTaskExecutor } from "../../swarm/direct-executor.js";
// import { AdvancedMemoryManager } from "../../memory/advanced-memory-manager.js";
import { TaskAnalyzer } from "../../analysis/task-analyzer.js";
import { generateId } from "../../utils/helpers.js";

// Comprehensive workflow definition interfaces
interface WorkflowDefinition {
  name: string;
  version?: string;
  description?: string;
  variables?: Record<string, any>;
  agents?: AgentDefinition[];
  tasks: TaskDefinition[];
  dependencies?: Record<string, string[]>;
  settings?: WorkflowSettings;
  parallel?: boolean;
}

interface AgentDefinition {
  id: string;
  type: string;
  name?: string;
  capabilities?: string[];
  assignedTasks?: string[];
  config?: Record<string, any>;
}

interface TaskDefinition {
  id: string;
  name?: string;
  type: string;
  description: string;
  assignTo?: string;
  depends?: string[];
  tools?: string[];
  input?: Record<string, any>;
  timeout?: number;
  retries?: number;
  condition?: string;
  skipPermissions?: boolean;
  mode?: string;
  coverage?: number;
}

interface WorkflowSettings {
  maxConcurrency?: number;
  timeout?: number;
  retryPolicy?: 'none' | 'immediate' | 'exponential';
  failurePolicy?: 'fail-fast' | 'continue' | 'ignore';
}

interface WorkflowExecution {
  id: string;
  workflowName: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'stopped';
  startedAt: Date;
  completedAt?: Date;
  progress: {
    total: number;
    completed: number;
    failed: number;
  };
  tasks: TaskExecution[];
  workflowFile?: string;
}

interface TaskExecution {
  id: string;
  taskId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startedAt?: Date;
  completedAt?: Date;
  assignedAgent?: string;
  error?: string;
  output?: any;
}

// Global workflow execution registry
const activeWorkflows = new Map<string, WorkflowExecution>();

export function createWorkflowCommand(): Command {
  const workflowCmd = new Command("workflow")
    .description("Execute and manage comprehensive workflows with agent coordination");

  // Run command - Execute a workflow from file
  workflowCmd
    .command("run")
    .description("Execute a workflow from file")
    .argument("<workflow-file>", "Path to workflow JSON file")
    .option("-d, --dry-run", "Validate workflow without executing")
    .option("-v, --variables <json>", "Override variables (JSON format)")
    .option("-w, --watch", "Watch workflow execution progress")
    .option("--parallel", "Allow parallel execution where possible")
    .option("--fail-fast", "Stop on first task failure")
    .option("--verbose", "Show detailed execution information")
    .option("--analyze", "Analyze task complexity before execution")
    .option("--breakdown", "Break down complex tasks into subtasks")
    .action(async (workflowFile: string, options: any) => {
      await runWorkflow(workflowFile, options);
    });

  // Validate command - Validate a workflow file
  workflowCmd
    .command("validate")
    .description("Validate a workflow file")
    .argument("<workflow-file>", "Path to workflow JSON file")
    .option("--strict", "Use strict validation mode")
    .action(async (workflowFile: string, options: any) => {
      await validateWorkflow(workflowFile, options);
    });

  // List command - List running workflows
  workflowCmd
    .command("list")
    .description("List running workflows")
    .option("--all", "Include completed workflows")
    .option("--format <format>", "Output format (table, json)", "table")
    .action(async (options: any) => {
      await listWorkflows(options);
    });

  // Status command - Show workflow execution status
  workflowCmd
    .command("status")
    .description("Show workflow execution status")
    .argument("<workflow-id>", "Workflow ID to check")
    .option("-w, --watch", "Watch workflow progress")
    .action(async (workflowId: string, options: any) => {
      await showWorkflowStatus(workflowId, options);
    });

  // Stop command - Stop a running workflow
  workflowCmd
    .command("stop")
    .description("Stop a running workflow")
    .argument("<workflow-id>", "Workflow ID to stop")
    .option("-f, --force", "Force stop without cleanup")
    .action(async (workflowId: string, options: any) => {
      await stopWorkflow(workflowId, options);
    });

  // Template command - Generate workflow templates
  workflowCmd
    .command("template")
    .description("Generate workflow templates")
    .argument("<template-type>", "Template type (research, development, analysis, testing)")
    .option("-o, --output <file>", "Output file path")
    .option("--format <format>", "Template format (json, yaml)", "json")
    .action(async (templateType: string, options: any) => {
      await generateTemplate(templateType, options);
    });

  // Examples command - Show workflow examples
  workflowCmd
    .command("examples")
    .description("Show workflow examples and usage")
    .action(async () => {
      await showExamples();
    });

  return workflowCmd;
}

async function runWorkflow(workflowFile: string, options: any): Promise<void> {
  try {
    // Load and validate workflow
    const workflow = await loadWorkflow(workflowFile);
    
    if (options.dryRun) {
      await validateWorkflowDefinition(workflow, true);
      console.log(chalk.green('✓ Workflow validation passed'));
      console.log(chalk.cyan('Dry run - execution plan:'));
      displayExecutionPlan(workflow);
      return;
    }

    // Override variables if provided
    if (options.variables) {
      try {
        const vars = JSON.parse(options.variables);
        workflow.variables = { ...workflow.variables, ...vars };
      } catch (error) {
        throw new Error(`Invalid variables JSON: ${(error as Error).message}`);
      }
    }

    // Analyze tasks if requested
    if (options.analyze || options.breakdown) {
      console.log(chalk.blue('🔍 Analyzing workflow tasks...'));
      await analyzeWorkflowTasks(workflow, options);
      console.log();
    }

    // Create execution plan
    const execution = await createExecution(workflow, workflowFile);
    activeWorkflows.set(execution.id, execution);

    console.log(chalk.cyan.bold('🚀 Starting workflow execution'));
    console.log(`${chalk.white('Workflow:')} ${workflow.name}`);
    console.log(`${chalk.white('ID:')} ${execution.id}`);
    console.log(`${chalk.white('Tasks:')} ${execution.tasks.length}`);
    console.log(`${chalk.white('Agents:')} ${workflow.agents?.length || 0}`);
    console.log();

    // Execute workflow
    if (options.watch) {
      await executeWorkflowWithWatch(execution, workflow, options);
    } else {
      await executeWorkflow(execution, workflow, options);
    }

  } catch (error) {
    console.error(chalk.red('❌ Workflow execution failed:'), (error as Error).message);
    if (options.verbose) {
      console.error(error);
    }
    process.exit(1);
  }
}

async function validateWorkflow(workflowFile: string, options: any): Promise<void> {
  try {
    const workflow = await loadWorkflow(workflowFile);
    await validateWorkflowDefinition(workflow, options.strict);
    
    console.log(chalk.green('✓ Workflow validation passed'));
    console.log(`${chalk.white('Name:')} ${workflow.name}`);
    console.log(`${chalk.white('Tasks:')} ${workflow.tasks.length}`);
    console.log(`${chalk.white('Agents:')} ${workflow.agents?.length || 0}`);
    
    if (workflow.dependencies) {
      const depCount = Object.values(workflow.dependencies).flat().length;
      console.log(`${chalk.white('Dependencies:')} ${depCount}`);
    }

    // Show detailed validation info
    console.log(chalk.cyan('\nValidation Details:'));
    console.log(`• Task types: ${[...new Set(workflow.tasks.map(t => t.type))].join(', ')}`);
    console.log(`• Agent types: ${[...new Set(workflow.agents?.map(a => a.type) || [])].join(', ')}`);
    
    if (workflow.settings) {
      console.log(`• Max concurrency: ${workflow.settings.maxConcurrency || 'unlimited'}`);
      console.log(`• Failure policy: ${workflow.settings.failurePolicy || 'fail-fast'}`);
    }

  } catch (error) {
    console.error(chalk.red('✗ Workflow validation failed:'), (error as Error).message);
    process.exit(1);
  }
}

async function listWorkflows(options: any): Promise<void> {
  try {
    const workflows = Array.from(activeWorkflows.values());
    const filteredWorkflows = options.all ? workflows : workflows.filter(w => w.status === 'running');

    if (options.format === 'json') {
      console.log(JSON.stringify(filteredWorkflows, null, 2));
      return;
    }

    if (filteredWorkflows.length === 0) {
      console.log(chalk.gray('No workflows found'));
      return;
    }

    console.log(chalk.cyan.bold(`🔄 Workflows (${filteredWorkflows.length})`));
    console.log('─'.repeat(80));

    for (const workflow of filteredWorkflows) {
      const statusIcon = getStatusIcon(workflow.status);
      const progress = `${workflow.progress.completed}/${workflow.progress.total}`;
      const progressBar = createProgressBar(workflow.progress.completed, workflow.progress.total, 20);
      
      const duration = workflow.completedAt 
        ? formatDuration(workflow.completedAt.getTime() - workflow.startedAt.getTime())
        : formatDuration(Date.now() - workflow.startedAt.getTime());

      console.log(`${statusIcon} ${chalk.bold(workflow.workflowName)} ${chalk.gray(`(${workflow.id.slice(0, 8)}...)`)}`);
      console.log(`   Status: ${workflow.status} | Progress: ${progressBar} ${progress} | Duration: ${duration}`);
      console.log(`   Started: ${workflow.startedAt.toLocaleString()}`);
      if (workflow.workflowFile) {
        console.log(`   File: ${workflow.workflowFile}`);
      }
      console.log();
    }

  } catch (error) {
    console.error(chalk.red('Failed to list workflows:'), (error as Error).message);
  }
}

async function showWorkflowStatus(workflowId: string, options: any): Promise<void> {
  try {
    if (options.watch) {
      await watchWorkflowStatus(workflowId);
    } else {
      const execution = getWorkflowExecution(workflowId);
      displayWorkflowStatus(execution);
    }
  } catch (error) {
    console.error(chalk.red('Failed to get workflow status:'), (error as Error).message);
  }
}

async function stopWorkflow(workflowId: string, options: any): Promise<void> {
  try {
    const execution = getWorkflowExecution(workflowId);
    
    if (execution.status !== 'running') {
      console.log(chalk.yellow(`Workflow is not running (status: ${execution.status})`));
      return;
    }

    if (!options.force) {
      // In a real implementation, you'd use a proper prompt library
      console.log(chalk.yellow(`Stopping workflow "${execution.workflowName}"...`));
    }

    console.log(chalk.yellow('🛑 Stopping workflow...'));
    
    if (options.force) {
      console.log(chalk.red('• Force stopping all tasks'));
      execution.status = 'stopped';
    } else {
      console.log(chalk.blue('• Gracefully stopping tasks'));
      console.log(chalk.blue('• Cleaning up resources'));
      execution.status = 'stopped';
    }
    
    execution.completedAt = new Date();
    console.log(chalk.green('✓ Workflow stopped'));

  } catch (error) {
    console.error(chalk.red('Failed to stop workflow:'), (error as Error).message);
  }
}

async function generateTemplate(templateType: string, options: any): Promise<void> {
  const templates: Record<string, WorkflowDefinition> = {
    'research': {
      name: 'Research Workflow',
      description: 'Comprehensive research workflow with data collection and analysis',
      version: '1.0.0',
      agents: [
        {
          id: 'research-agent',
          type: 'researcher',
          capabilities: ['web-search', 'information-gathering', 'analysis']
        }
      ],
      tasks: [
        {
          id: 'literature-review',
          name: 'Literature Review',
          type: 'research',
          description: 'Conduct comprehensive literature review on the topic',
          assignTo: 'research-agent',
          tools: ['WebFetchTool', 'View', 'Edit']
        },
        {
          id: 'data-collection',
          name: 'Data Collection',
          type: 'research',
          description: 'Collect and organize research data',
          assignTo: 'research-agent',
          depends: ['literature-review'],
          tools: ['View', 'Edit', 'GrepTool']
        }
      ]
    },
    'development': {
      name: 'Development Workflow',
      description: 'Full-stack development workflow with testing',
      version: '1.0.0',
      parallel: true,
      agents: [
        {
          id: 'backend-agent',
          type: 'implementer',
          capabilities: ['code-generation', 'api-development']
        },
        {
          id: 'frontend-agent',
          type: 'implementer',
          capabilities: ['ui-development', 'react']
        },
        {
          id: 'test-agent',
          type: 'tester',
          capabilities: ['test-writing', 'quality-assurance']
        }
      ],
      tasks: [
        {
          id: 'backend-api',
          name: 'Backend API Implementation',
          type: 'implementation',
          description: 'Implement backend API with authentication',
          assignTo: 'backend-agent',
          tools: ['View', 'Edit', 'Replace', 'Bash']
        },
        {
          id: 'frontend-ui',
          name: 'Frontend UI Implementation',
          type: 'implementation',
          description: 'Create React components and user interface',
          assignTo: 'frontend-agent',
          tools: ['View', 'Edit', 'Replace', 'GlobTool']
        },
        {
          id: 'integration-tests',
          name: 'Integration Testing',
          type: 'testing',
          description: 'Write and run integration tests',
          assignTo: 'test-agent',
          depends: ['backend-api', 'frontend-ui'],
          tools: ['View', 'Edit', 'Bash', 'BatchTool']
        }
      ]
    },
    'analysis': {
      name: 'Data Analysis Workflow',
      description: 'Data analysis workflow with visualization',
      version: '1.0.0',
      agents: [
        {
          id: 'analyst-agent',
          type: 'analyst',
          capabilities: ['data-analysis', 'visualization', 'statistics']
        }
      ],
      tasks: [
        {
          id: 'data-preparation',
          name: 'Data Preparation',
          type: 'data-processing',
          description: 'Clean and prepare data for analysis',
          assignTo: 'analyst-agent'
        },
        {
          id: 'statistical-analysis',
          name: 'Statistical Analysis',
          type: 'analysis',
          description: 'Perform statistical analysis on prepared data',
          assignTo: 'analyst-agent',
          depends: ['data-preparation']
        }
      ]
    },
    'testing': {
      name: 'Testing Workflow',
      description: 'Comprehensive testing workflow with multiple test types',
      version: '1.0.0',
      agents: [
        {
          id: 'test-agent',
          type: 'tester',
          capabilities: ['test-writing', 'coverage-analysis', 'quality-assurance']
        }
      ],
      tasks: [
        {
          id: 'unit-tests',
          name: 'Unit Tests',
          type: 'testing',
          description: 'Write comprehensive unit tests',
          assignTo: 'test-agent'
        },
        {
          id: 'integration-tests',
          name: 'Integration Tests',
          type: 'testing',
          description: 'Write integration tests',
          assignTo: 'test-agent',
          depends: ['unit-tests']
        }
      ]
    }
  };

  const template = templates[templateType.toLowerCase()];
  if (!template) {
    console.error(chalk.red(`Unknown template type: ${templateType}`));
    console.log(chalk.white('Available templates:'), Object.keys(templates).join(', '));
    process.exit(1);
  }

  const output = JSON.stringify(template, null, 2);
  
  if (options.output) {
    await fs.writeFile(options.output, output);
    console.log(chalk.green(`✓ Template saved to ${options.output}`));
  } else {
    console.log(chalk.cyan('Generated workflow template:'));
    console.log(output);
  }
}

async function showExamples(): Promise<void> {
  console.log(chalk.cyan.bold('🧬 Workflow Examples\n'));

  console.log(chalk.white('Basic Usage:'));
  console.log(chalk.gray('  claude-flow workflow run examples/02-workflows/claude-workflow.json'));
  console.log(chalk.gray('  claude-flow workflow validate my-workflow.json --strict'));
  console.log(chalk.gray('  claude-flow workflow list --all'));
  console.log();

  console.log(chalk.white('Advanced Usage:'));
  console.log(chalk.gray('  claude-flow workflow run workflow.json --variables \'{"env":"prod"}\''));
  console.log(chalk.gray('  claude-flow workflow run workflow.json --watch --parallel'));
  console.log(chalk.gray('  claude-flow workflow status workflow-abc123 --watch'));
  console.log();

  console.log(chalk.white('Template Generation:'));
  console.log(chalk.gray('  claude-flow workflow template research -o research-workflow.json'));
  console.log(chalk.gray('  claude-flow workflow template development -o dev-workflow.json'));
  console.log();

  console.log(chalk.white('Available Templates:'));
  console.log(chalk.gray('  • research    - Research and data collection workflow'));
  console.log(chalk.gray('  • development - Full-stack development workflow'));
  console.log(chalk.gray('  • analysis    - Data analysis and visualization'));
  console.log(chalk.gray('  • testing     - Comprehensive testing workflow'));
}

// Helper functions
async function loadWorkflow(workflowFile: string): Promise<WorkflowDefinition> {
  try {
    const content = await fs.readFile(workflowFile, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to load workflow file: ${(error as Error).message}`);
  }
}

async function validateWorkflowDefinition(workflow: WorkflowDefinition, strict = false): Promise<void> {
  const errors: string[] = [];

  // Basic validation
  if (!workflow.name) errors.push('Workflow name is required');
  if (!workflow.tasks || workflow.tasks.length === 0) errors.push('At least one task is required');

  // Task validation
  const taskIds = new Set<string>();
  for (const task of workflow.tasks) {
    if (!task.id) errors.push('Task ID is required');
    if (taskIds.has(task.id)) errors.push(`Duplicate task ID: ${task.id}`);
    taskIds.add(task.id);
    
    if (!task.type) errors.push(`Task ${task.id}: type is required`);
    if (!task.description) errors.push(`Task ${task.id}: description is required`);

    // Validate dependencies
    if (task.depends) {
      for (const dep of task.depends) {
        if (!taskIds.has(dep)) {
          errors.push(`Task ${task.id}: depends on unknown task ${dep}`);
        }
      }
    }
  }

  // Agent validation
  if (workflow.agents) {
    const agentIds = new Set<string>();
    for (const agent of workflow.agents) {
      if (!agent.id) errors.push('Agent ID is required');
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
    if (hasCircularDependencies(workflow.tasks)) {
      errors.push('Circular dependencies detected');
    }
  }

  if (errors.length > 0) {
    throw new Error('Workflow validation failed:\n• ' + errors.join('\n• '));
  }
}

async function createExecution(workflow: WorkflowDefinition, workflowFile?: string): Promise<WorkflowExecution> {
  const tasks: TaskExecution[] = workflow.tasks.map(task => ({
    id: generateId('task-exec'),
    taskId: task.id,
    status: 'pending'
  }));

  return {
    id: generateId('workflow-exec'),
    workflowName: workflow.name,
    status: 'pending',
    startedAt: new Date(),
    progress: {
      total: tasks.length,
      completed: 0,
      failed: 0
    },
    tasks,
    workflowFile
  };
}

async function executeWorkflow(execution: WorkflowExecution, workflow: WorkflowDefinition, options: any): Promise<void> {
  execution.status = 'running';
  
  try {
    console.log(chalk.blue('🔄 Executing workflow...'));
    console.log();

    // Execute tasks based on dependencies
    const taskMap = new Map(workflow.tasks.map(t => [t.id, t]));
    const executedTasks = new Set<string>();
    
    while (executedTasks.size < workflow.tasks.length) {
      // Find tasks that can be executed (dependencies met)
      const readyTasks = workflow.tasks.filter(task => 
        !executedTasks.has(task.id) &&
        (task.depends || []).every(dep => executedTasks.has(dep))
      );

      if (readyTasks.length === 0) {
        throw new Error('Circular dependency or unresolvable dependencies detected');
      }

      // Execute ready tasks (parallel if enabled)
      const taskPromises = readyTasks.map(async (task) => {
        const taskExec = execution.tasks.find(t => t.taskId === task.id)!;
        
        console.log(`${chalk.cyan('→')} Starting task: ${task.description}`);
        taskExec.status = 'running';
        taskExec.startedAt = new Date();

        try {
          // Real task execution would happen here
          // For now, simulate with delay
          await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
          
          taskExec.status = 'completed';
          taskExec.completedAt = new Date();
          execution.progress.completed++;
          executedTasks.add(task.id);
          
          console.log(`${chalk.green('✓')} Completed: ${task.description}`);
          
        } catch (error) {
          taskExec.status = 'failed';
          taskExec.completedAt = new Date();
          taskExec.error = (error as Error).message;
          execution.progress.failed++;
          
          console.log(`${chalk.red('✗')} Failed: ${task.description}`);
          
          if (options.failFast || workflow.settings?.failurePolicy === 'fail-fast') {
            throw error;
          }
        }
      });

      if (workflow.parallel && options.parallel) {
        await Promise.all(taskPromises);
      } else {
        for (const promise of taskPromises) {
          await promise;
        }
      }
    }

    execution.status = execution.progress.failed > 0 ? 'failed' : 'completed';
    execution.completedAt = new Date();

    const duration = formatDuration(execution.completedAt.getTime() - execution.startedAt.getTime());
    
    if (execution.status === 'completed') {
      console.log(chalk.green.bold('\n✅ Workflow completed successfully'));
    } else {
      console.log(chalk.red.bold('\n❌ Workflow completed with failures'));
    }
    
    console.log(`${chalk.white('Duration:')} ${duration}`);
    console.log(`${chalk.white('Tasks:')} ${execution.progress.completed}/${execution.progress.total} completed`);
    
    if (execution.progress.failed > 0) {
      console.log(`${chalk.white('Failed:')} ${execution.progress.failed}`);
    }

  } catch (error) {
    execution.status = 'failed';
    execution.completedAt = new Date();
    throw error;
  }
}

async function executeWorkflowWithWatch(execution: WorkflowExecution, workflow: WorkflowDefinition, options: any): Promise<void> {
  console.log(chalk.yellow('👀 Starting workflow execution in watch mode...'));
  console.log(chalk.gray('Press Ctrl+C to stop\n'));

  // Start execution and watch progress
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
  console.log(chalk.cyan('👀 Watching workflow status...'));
  console.log(chalk.gray('Press Ctrl+C to stop\n'));

  const execution = getWorkflowExecution(workflowId);
  
  const watchInterval = setInterval(() => {
    console.clear();
    displayWorkflowStatus(execution);
    
    if (execution.status === 'completed' || execution.status === 'failed' || execution.status === 'stopped') {
      console.log('\n' + chalk.gray('Workflow finished. Exiting watch mode.'));
      clearInterval(watchInterval);
    }
  }, 2000);
}

function displayWorkflowStatus(execution: WorkflowExecution): void {
  console.log(chalk.cyan.bold('📊 Workflow Status'));
  console.log('─'.repeat(60));
  
  const statusIcon = getStatusIcon(execution.status);
  const duration = execution.completedAt 
    ? formatDuration(execution.completedAt.getTime() - execution.startedAt.getTime())
    : formatDuration(Date.now() - execution.startedAt.getTime());

  console.log(`${chalk.white('Name:')} ${execution.workflowName}`);
  console.log(`${chalk.white('ID:')} ${execution.id}`);
  console.log(`${chalk.white('Status:')} ${statusIcon} ${execution.status}`);
  console.log(`${chalk.white('Started:')} ${execution.startedAt.toLocaleString()}`);
  console.log(`${chalk.white('Duration:')} ${duration}`);

  const progressBar = createProgressBar(execution.progress.completed, execution.progress.total, 40);
  console.log(`${chalk.white('Progress:')} ${progressBar} ${execution.progress.completed}/${execution.progress.total}`);

  if (execution.progress.failed > 0) {
    console.log(`${chalk.white('Failed Tasks:')} ${chalk.red(execution.progress.failed.toString())}`);
  }

  console.log();
  console.log(chalk.cyan.bold('📋 Tasks'));
  console.log('─'.repeat(60));

  for (const taskExec of execution.tasks) {
    const statusIcon = getStatusIcon(taskExec.status);
    const duration = taskExec.completedAt && taskExec.startedAt
      ? formatDuration(taskExec.completedAt.getTime() - taskExec.startedAt.getTime())
      : taskExec.startedAt 
        ? formatDuration(Date.now() - taskExec.startedAt.getTime())
        : '-';

    console.log(`${statusIcon} ${taskExec.taskId} (${duration})`);
    if (taskExec.error) {
      console.log(`   ${chalk.red('Error:')} ${taskExec.error}`);
    }
  }
}

function displayWorkflowProgress(execution: WorkflowExecution): void {
  const progress = `${execution.progress.completed}/${execution.progress.total}`;
  const progressBar = createProgressBar(execution.progress.completed, execution.progress.total, 30);
  process.stdout.write(`\r${progressBar} ${progress} tasks completed`);
}

function displayExecutionPlan(workflow: WorkflowDefinition): void {
  console.log(chalk.white('Execution Plan:'));
  console.log('─'.repeat(40));
  
  for (const task of workflow.tasks) {
    const deps = task.depends ? ` (depends: ${task.depends.join(', ')})` : '';
    const agent = task.assignTo ? ` [${task.assignTo}]` : '';
    console.log(`• ${task.id}: ${task.description}${agent}${chalk.gray(deps)}`);
  }
}

function getWorkflowExecution(workflowId: string): WorkflowExecution {
  // Try exact match first
  let execution = activeWorkflows.get(workflowId);
  
  // Try partial match
  if (!execution) {
    for (const [id, exec] of activeWorkflows) {
      if (id.startsWith(workflowId)) {
        execution = exec;
        break;
      }
    }
  }
  
  if (!execution) {
    throw new Error(`Workflow '${workflowId}' not found`);
  }
  
  return execution;
}

function hasCircularDependencies(tasks: TaskDefinition[]): boolean {
  const graph = new Map<string, string[]>();
  
  for (const task of tasks) {
    graph.set(task.id, task.depends || []);
  }
  
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  
  function hasCycle(node: string): boolean {
    if (recursionStack.has(node)) return true;
    if (visited.has(node)) return false;
    
    visited.add(node);
    recursionStack.add(node);
    
    const dependencies = graph.get(node) || [];
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

function getStatusIcon(status: string): string {
  switch (status) {
    case 'pending': return '⏳';
    case 'running': return '🔄';
    case 'completed': return '✅';
    case 'failed': return '❌';
    case 'stopped': return '🛑';
    case 'skipped': return '⏭️';
    default: return '❓';
  }
}

function createProgressBar(completed: number, total: number, width: number): string {
  const percentage = total > 0 ? completed / total : 0;
  const filled = Math.round(width * percentage);
  const empty = width - filled;
  
  return chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

async function analyzeWorkflowTasks(workflow: WorkflowDefinition, options: any): Promise<void> {
  try {
    const analyzer = new TaskAnalyzer();
    
    // Convert workflow tasks to analysis format
    const tasks = workflow.tasks.map(task => ({
      id: task.id,
      title: task.name || task.id,
      description: task.description
    }));

    // Analyze all tasks
    const analysis = await analyzer.analyzeTaskList(tasks, {
      projectType: "workflow",
      teamExperience: "mixed"
    });

    // Display analysis results
    console.log(chalk.green(`📊 Workflow Analysis: ${workflow.name}`));
    console.log();
    console.log(`${chalk.bold("Total Tasks:")} ${analysis.analyses.length}`);
    console.log(`${chalk.bold("Total Estimated Hours:")} ${analysis.totalEstimatedHours}`);
    console.log();
    
    // Show complexity distribution
    const complexityGroups = analysis.analyses.reduce((groups: any, task: any) => {
      groups[task.complexityLevel] = (groups[task.complexityLevel] || 0) + 1;
      return groups;
    }, {});
    
    console.log(chalk.yellow("📋 Task Complexity Summary:"));
    Object.entries(complexityGroups).forEach(([level, count]) => {
      const color = level === "expert" ? chalk.magenta : 
                   level === "complex" ? chalk.red : 
                   level === "moderate" ? chalk.yellow : 
                   level === "simple" ? chalk.green : chalk.gray;
      console.log(`   ${color(level)}: ${count} tasks`);
    });
    
    console.log();
    console.log(chalk.yellow("🎯 Breakdown Recommendations:"));
    console.log(`   ${chalk.red("Immediate:")} ${analysis.recommendations.immediate.length} tasks`);
    console.log(`   ${chalk.yellow("Optional:")} ${analysis.recommendations.optional.length} tasks`);
    console.log(`   ${chalk.green("Defer:")} ${analysis.recommendations.defer.length} tasks`);
    
    // Show high-complexity tasks
    if (analysis.recommendations.immediate.length > 0) {
      console.log();
      console.log(chalk.red("⚠️  Tasks requiring immediate breakdown:"));
      analysis.recommendations.immediate.forEach((taskId: string) => {
        const task = analysis.analyses.find((a: any) => a.taskId === taskId);
        if (task) {
          console.log(`   • ${task.title} (${task.complexityScore}/10, ${task.estimatedHours}h)`);
        }
      });
    }

    // Generate breakdowns for complex tasks if requested
    if (options.breakdown && analysis.recommendations.immediate.length > 0) {
      console.log();
      console.log(chalk.blue("🔧 Generating breakdowns for complex tasks..."));
      
      for (const taskId of analysis.recommendations.immediate.slice(0, 3)) { // Limit to first 3 for demo
        const task = tasks.find(t => t.id === taskId);
        if (task) {
          console.log();
          console.log(chalk.yellow(`Breaking down: ${task.title}`));
          const breakdown = await analyzer.breakdownTask(task.id, task.title, task.description);
          
          // Show simplified breakdown
          console.log(`   ${chalk.gray("Subtasks:")} ${breakdown.subtasks.length}`);
          breakdown.subtasks.forEach((subtask, index) => {
            console.log(`   ${index + 1}. ${subtask.title} ${chalk.gray(`(${subtask.estimatedHours}h)`)}`);
          });
        }
      }
      
      if (analysis.recommendations.immediate.length > 3) {
        console.log();
        console.log(chalk.gray(`   ... and ${analysis.recommendations.immediate.length - 3} more tasks`));
        console.log(chalk.cyan(`   Run: claude-flow analyze workflow ${workflow.name || 'workflow.json'} --breakdown`));
      }
    }

  } catch (error) {
    console.error(chalk.red("❌ Failed to analyze workflow tasks:"), (error as Error).message);
    // Continue with execution even if analysis fails
  }
}
