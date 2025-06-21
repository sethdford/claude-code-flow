import { Command } from "commander";
import { logger } from "../../core/logger.js";
import path from "path";
import fs from "fs-extra";
import chalk from "chalk";
import { TaskAnalyzer, TaskComplexityAnalysis, TaskBreakdownResult } from "../../analysis/task-analyzer.js";
import { generateId } from "../../utils/helpers.js";

interface WorkflowTask {
  id: string;
  name: string;
  description: string;
  type?: string;
  priority?: string;
  dependencies?: string[];
  status?: string;
}

interface WorkflowDefinition {
  name: string;
  description?: string;
  tasks: WorkflowTask[];
}

export const analyzeCommand = new Command()
  .name("analyze")
  .description("Analyze tasks for complexity and generate intelligent breakdowns")
  .addHelpText("after", `
${chalk.yellow("Examples:")}
  ${chalk.cyan("claude-flow analyze task")} "Implement user authentication"
  ${chalk.cyan("claude-flow analyze workflow")} examples/02-workflows/claude-workflow.json
  ${chalk.cyan("claude-flow analyze breakdown")} "Create REST API" --subtasks 5
  ${chalk.cyan("claude-flow analyze project")} --tech-stack "Node.js,React,PostgreSQL"

${chalk.yellow("Task Analysis Features:")}
  • ${chalk.green("Complexity Scoring")} - AI-powered complexity assessment (1-10 scale)
  • ${chalk.green("Risk Assessment")} - Identify potential blockers and challenges
  • ${chalk.green("Skill Requirements")} - Determine required expertise levels
  • ${chalk.green("Time Estimation")} - Accurate hour estimates based on complexity
  • ${chalk.green("Breakdown Recommendations")} - Smart subtask generation
  • ${chalk.green("Dependency Analysis")} - Identify task relationships

${chalk.yellow("Integration:")}
  • Works with existing workflow files
  • Enhances swarm task decomposition
  • Supports project context analysis
  • Generates actionable subtasks with acceptance criteria
`);

// Analyze a single task
analyzeCommand
  .command("task")
  .description("Analyze a single task for complexity and breakdown recommendations")
  .argument("<description>", "Task description to analyze")
  .option("--title <title>", "Task title (optional)")
  .option("--project-type <type>", "Project type context (web, mobile, api, etc.)")
  .option("--tech-stack <stack>", "Comma-separated technology stack")
  .option("--team-size <size>", "Team size (number)", parseInt)
  .option("--timeline <timeline>", "Project timeline context")
  .option("--output <file>", "Save analysis to file")
  .option("--format <format>", "Output format (json, markdown, table)", "table")
  .action(async (description: string, options) => {
    try {
      // Configure logger for clean text output
      await logger.configure({
        level: "warn",
        format: "text",
        destination: "console",
      });

      console.log(chalk.blue("🔍 Analyzing task complexity..."));
      console.log();

      const analyzer = new TaskAnalyzer();
      const taskId = generateId("task");
      const title = options.title || description.slice(0, 50) + (description.length > 50 ? "..." : "");
      
      const context = {
        projectType: options.projectType,
        techStack: options.techStack ? options.techStack.split(",").map((s: string) => s.trim()) : undefined,
        teamSize: options.teamSize,
        timeline: options.timeline
      };

      const analysis = await analyzer.analyzeComplexity(taskId, title, description, context);
      
      displayTaskAnalysis(analysis, options.format);
      
      if (options.output) {
        await saveAnalysis(analysis, options.output, options.format);
        console.log(chalk.green(`✅ Analysis saved to ${options.output}`));
      }

      // Show breakdown recommendation
      if (analysis.breakdownRecommendation !== "none") {
        console.log();
        console.log(chalk.yellow("💡 Recommendation:"));
        console.log(`   This task ${analysis.breakdownRecommendation === "required" ? "should" : "could"} be broken down into ${analysis.recommendedSubtasks} subtasks.`);
        console.log(`   Run: ${chalk.cyan(`claude-flow analyze breakdown "${description}" --subtasks ${analysis.recommendedSubtasks}`)}`);
      }

    } catch (error) {
      logger.error("Error analyzing task:", error);
      console.error(chalk.red("❌ Failed to analyze task"));
      process.exit(1);
    }
  });

// Break down a task into subtasks
analyzeCommand
  .command("breakdown")
  .description("Break down a complex task into manageable subtasks")
  .argument("<description>", "Task description to break down")
  .option("--title <title>", "Task title (optional)")
  .option("--subtasks <count>", "Number of subtasks to generate", parseInt)
  .option("--project-type <type>", "Project type context")
  .option("--tech-stack <stack>", "Comma-separated technology stack")
  .option("--constraints <constraints>", "Comma-separated constraints")
  .option("--preferences <preferences>", "Comma-separated preferences")
  .option("--output <file>", "Save breakdown to file")
  .option("--format <format>", "Output format (json, markdown, workflow)", "markdown")
  .action(async (description: string, options) => {
    try {
      // Configure logger for clean text output
      await logger.configure({
        level: "warn",
        format: "text",
        destination: "console",
      });

      console.log(chalk.blue("🔧 Breaking down task into subtasks..."));
      console.log();

      const analyzer = new TaskAnalyzer();
      const taskId = generateId("task");
      const title = options.title || description.slice(0, 50) + (description.length > 50 ? "..." : "");
      
      const context = {
        projectType: options.projectType,
        techStack: options.techStack ? options.techStack.split(",").map((s: string) => s.trim()) : undefined,
        constraints: options.constraints ? options.constraints.split(",").map((s: string) => s.trim()) : undefined,
        preferences: options.preferences ? options.preferences.split(",").map((s: string) => s.trim()) : undefined
      };

      const breakdown = await analyzer.breakdownTask(taskId, title, description, options.subtasks, context);
      
      displayTaskBreakdown(breakdown, options.format);
      
      if (options.output) {
        await saveBreakdown(breakdown, options.output, options.format);
        console.log(chalk.green(`✅ Breakdown saved to ${options.output}`));
      }

    } catch (error) {
      logger.error("Error breaking down task:", error);
      console.error(chalk.red("❌ Failed to break down task"));
      process.exit(1);
    }
  });

// Analyze workflow file
analyzeCommand
  .command("workflow")
  .description("Analyze all tasks in a workflow file for complexity")
  .argument("<file>", "Path to workflow file")
  .option("--project-type <type>", "Project type context")
  .option("--tech-stack <stack>", "Comma-separated technology stack")
  .option("--team-experience <level>", "Team experience level (junior, mid, senior, mixed)", "mixed")
  .option("--output <file>", "Save analysis to file")
  .option("--format <format>", "Output format (json, markdown, summary)", "summary")
  .option("--breakdown", "Generate breakdowns for complex tasks")
  .action(async (file: string, options) => {
    try {
      // Configure logger for clean text output
      await logger.configure({
        level: "warn",
        format: "text",
        destination: "console",
      });

      const workflowPath = path.resolve(file);
      
      if (!await fs.pathExists(workflowPath)) {
        console.error(chalk.red(`❌ Workflow file not found: ${file}`));
        process.exit(1);
      }

      console.log(chalk.blue(`🔍 Analyzing workflow: ${path.basename(file)}`));
      console.log();

      const workflow: WorkflowDefinition = await fs.readJson(workflowPath);
      const analyzer = new TaskAnalyzer();
      
      const tasks = workflow.tasks.map(task => ({
        id: task.id,
        title: task.name,
        description: task.description
      }));

      const context = {
        projectType: options.projectType,
        techStack: options.techStack ? options.techStack.split(",").map((s: string) => s.trim()) : undefined,
        teamExperience: options.teamExperience as "junior" | "mid" | "senior" | "mixed"
      };

      const analysis = await analyzer.analyzeTaskList(tasks, context);
      
      displayWorkflowAnalysis(workflow, analysis, options.format);
      
      // Generate breakdowns for complex tasks if requested
      if (options.breakdown) {
        console.log();
        console.log(chalk.blue("🔧 Generating breakdowns for complex tasks..."));
        
        for (const taskId of analysis.recommendations.immediate) {
          const task = tasks.find(t => t.id === taskId);
          if (task) {
            console.log();
            console.log(chalk.yellow(`Breaking down: ${task.title}`));
            const breakdown = await analyzer.breakdownTask(task.id, task.title, task.description, undefined, context);
            displayTaskBreakdown(breakdown, "markdown");
          }
        }
      }
      
      if (options.output) {
        await saveWorkflowAnalysis(workflow, analysis, options.output, options.format);
        console.log(chalk.green(`✅ Analysis saved to ${options.output}`));
      }

    } catch (error) {
      logger.error("Error analyzing workflow:", error);
      console.error(chalk.red("❌ Failed to analyze workflow"));
      process.exit(1);
    }
  });

// Analyze entire project context
analyzeCommand
  .command("project")
  .description("Analyze project context and generate development recommendations")
  .option("--project-type <type>", "Project type (web, mobile, api, desktop, etc.)")
  .option("--tech-stack <stack>", "Comma-separated technology stack")
  .option("--team-size <size>", "Team size (number)", parseInt)
  .option("--timeline <timeline>", "Project timeline")
  .option("--scope <scope>", "Project scope description")
  .option("--output <file>", "Save recommendations to file")
  .option("--generate-tasks", "Generate initial task breakdown")
  .action(async (options) => {
    try {
      console.log(chalk.blue("🏗️  Analyzing project context..."));
      console.log();

      if (!options.scope) {
        console.error(chalk.red("❌ Project scope is required. Use --scope to describe your project."));
        process.exit(1);
      }

      const analyzer = new TaskAnalyzer();
      const projectId = generateId("project");
      
      const context = {
        projectType: options.projectType,
        techStack: options.techStack ? options.techStack.split(",").map((s: string) => s.trim()) : undefined,
        teamSize: options.teamSize,
        timeline: options.timeline
      };

      // Analyze project scope as a high-level task
      const analysis = await analyzer.analyzeComplexity(
        projectId,
        `${options.projectType || "Software"} Project`,
        options.scope,
        context
      );

      console.log(chalk.green("📊 Project Analysis Results:"));
      console.log();
      displayTaskAnalysis(analysis, "table");

      if (options.generateTasks) {
        console.log();
        console.log(chalk.blue("🔧 Generating initial task breakdown..."));
        
        const breakdown = await analyzer.breakdownTask(
          projectId,
          `${options.projectType || "Software"} Project`,
          options.scope,
          undefined,
          context
        );
        
        displayTaskBreakdown(breakdown, "workflow");
        
        if (options.output) {
          await saveBreakdown(breakdown, options.output, "workflow");
          console.log(chalk.green(`✅ Task breakdown saved to ${options.output}`));
        }
      }

    } catch (error) {
      logger.error("Error analyzing project:", error);
      console.error(chalk.red("❌ Failed to analyze project"));
      process.exit(1);
    }
  });

// Display functions
function displayTaskAnalysis(analysis: TaskComplexityAnalysis, format: string) {
  switch (format) {
    case "json":
      console.log(JSON.stringify(analysis, null, 2));
      break;
    
    case "markdown":
      console.log(`# Task Analysis: ${analysis.title}\n`);
      console.log(`**Description:** ${analysis.description}\n`);
      console.log(`**Complexity:** ${analysis.complexityLevel} (${analysis.complexityScore}/10)`);
      console.log(`**Estimated Hours:** ${analysis.estimatedHours}`);
      console.log(`**Recommended Subtasks:** ${analysis.recommendedSubtasks}`);
      console.log(`**Breakdown Recommendation:** ${analysis.breakdownRecommendation}\n`);
      
      if (analysis.riskFactors.length > 0) {
        console.log(`**Risk Factors:**`);
        analysis.riskFactors.forEach(risk => console.log(`- ${risk}`));
        console.log();
      }
      
      if (analysis.skillsRequired.length > 0) {
        console.log(`**Skills Required:**`);
        analysis.skillsRequired.forEach(skill => console.log(`- ${skill}`));
        console.log();
      }
      
      console.log(`**Reasoning:** ${analysis.reasoning}`);
      break;
    
    default: // table
      console.log(chalk.green("📊 Task Analysis Results:"));
      console.log();
      console.log(`${chalk.bold("Task:")} ${analysis.title}`);
      console.log(`${chalk.bold("Complexity:")} ${getComplexityColor(analysis.complexityLevel)}${analysis.complexityLevel}${chalk.reset()} (${analysis.complexityScore}/10)`);
      console.log(`${chalk.bold("Estimated Hours:")} ${analysis.estimatedHours}`);
      console.log(`${chalk.bold("Breakdown Needed:")} ${getRecommendationColor(analysis.breakdownRecommendation)}${analysis.breakdownRecommendation}${chalk.reset()}`);
      console.log(`${chalk.bold("Recommended Subtasks:")} ${analysis.recommendedSubtasks}`);
      
      if (analysis.riskFactors.length > 0) {
        console.log(`${chalk.bold("Risk Factors:")} ${chalk.yellow(analysis.riskFactors.join(", "))}`);
      }
      
      if (analysis.skillsRequired.length > 0) {
        console.log(`${chalk.bold("Skills Required:")} ${chalk.cyan(analysis.skillsRequired.join(", "))}`);
      }
      
      console.log();
      console.log(chalk.gray(`Reasoning: ${analysis.reasoning}`));
  }
}

function displayTaskBreakdown(breakdown: TaskBreakdownResult, format: string) {
  switch (format) {
    case "json":
      console.log(JSON.stringify(breakdown, null, 2));
      break;
    
    case "workflow":
      // Generate workflow-compatible JSON
      const workflow = {
        name: breakdown.originalTask.title,
        description: breakdown.originalTask.description,
        tasks: breakdown.subtasks.map(subtask => ({
          id: subtask.id,
          name: subtask.title,
          description: subtask.description,
          type: subtask.type,
          priority: subtask.priority,
          dependencies: subtask.dependencies,
          estimatedHours: subtask.estimatedHours,
          skillsRequired: subtask.skillsRequired,
          acceptanceCriteria: subtask.acceptanceCriteria,
          notes: subtask.notes
        }))
      };
      console.log(JSON.stringify(workflow, null, 2));
      break;
    
    default: // markdown
      console.log(chalk.green("🔧 Task Breakdown Results:"));
      console.log();
      console.log(`${chalk.bold("Original Task:")} ${breakdown.originalTask.title}`);
      console.log(`${chalk.bold("Total Estimated Hours:")} ${breakdown.totalEstimatedHours}`);
      console.log(`${chalk.bold("Number of Subtasks:")} ${breakdown.subtasks.length}`);
      console.log();
      
      breakdown.subtasks.forEach((subtask, index) => {
        console.log(`${chalk.blue(`${index + 1}. ${subtask.title}`)} ${chalk.gray(`(${subtask.estimatedHours}h)`)}`);
        console.log(`   ${chalk.gray("Type:")} ${getTypeColor(subtask.type)}${subtask.type}${chalk.reset()}`);
        console.log(`   ${chalk.gray("Priority:")} ${getPriorityColor(subtask.priority)}${subtask.priority}${chalk.reset()}`);
        console.log(`   ${chalk.gray("Description:")} ${subtask.description}`);
        
        if (subtask.dependencies.length > 0) {
          console.log(`   ${chalk.gray("Dependencies:")} ${subtask.dependencies.join(", ")}`);
        }
        
        if (subtask.acceptanceCriteria.length > 0) {
          console.log(`   ${chalk.gray("Acceptance Criteria:")}`);
          subtask.acceptanceCriteria.forEach(criteria => {
            console.log(`     • ${criteria}`);
          });
        }
        
        console.log();
      });
      
      if (breakdown.recommendations.length > 0) {
        console.log(chalk.yellow("💡 Recommendations:"));
        breakdown.recommendations.forEach(rec => console.log(`   • ${rec}`));
      }
  }
}

function displayWorkflowAnalysis(workflow: WorkflowDefinition, analysis: any, format: string) {
  console.log(chalk.green(`📊 Workflow Analysis: ${workflow.name}`));
  console.log();
  console.log(`${chalk.bold("Total Tasks:")} ${analysis.analyses.length}`);
  console.log(`${chalk.bold("Total Estimated Hours:")} ${analysis.totalEstimatedHours}`);
  console.log();
  
  console.log(chalk.yellow("📋 Task Complexity Summary:"));
  const complexityGroups = analysis.analyses.reduce((groups: any, task: TaskComplexityAnalysis) => {
    groups[task.complexityLevel] = (groups[task.complexityLevel] || 0) + 1;
    return groups;
  }, {});
  
  Object.entries(complexityGroups).forEach(([level, count]) => {
    console.log(`   ${getComplexityColor(level)}${level}${chalk.reset()}: ${count} tasks`);
  });
  
  console.log();
  console.log(chalk.yellow("🎯 Breakdown Recommendations:"));
  console.log(`   ${chalk.red("Immediate:")} ${analysis.recommendations.immediate.length} tasks`);
  console.log(`   ${chalk.yellow("Optional:")} ${analysis.recommendations.optional.length} tasks`);
  console.log(`   ${chalk.green("Defer:")} ${analysis.recommendations.defer.length} tasks`);
  
  if (analysis.recommendations.immediate.length > 0) {
    console.log();
    console.log(chalk.red("⚠️  Tasks requiring immediate breakdown:"));
    analysis.recommendations.immediate.forEach((taskId: string) => {
      const task = analysis.analyses.find((a: TaskComplexityAnalysis) => a.taskId === taskId);
      if (task) {
        console.log(`   • ${task.title} (${task.complexityScore}/10, ${task.estimatedHours}h)`);
      }
    });
  }
}

// Helper functions for colored output
function getComplexityColor(level: string): string {
  switch (level) {
    case "trivial": return chalk.gray("");
    case "simple": return chalk.green("");
    case "moderate": return chalk.yellow("");
    case "complex": return chalk.red("");
    case "expert": return chalk.magenta("");
    default: return "";
  }
}

function getRecommendationColor(recommendation: string): string {
  switch (recommendation) {
    case "none": return chalk.gray("");
    case "optional": return chalk.green("");
    case "recommended": return chalk.yellow("");
    case "required": return chalk.red("");
    default: return "";
  }
}

function getTypeColor(type: string): string {
  switch (type) {
    case "setup": return chalk.blue("");
    case "implementation": return chalk.green("");
    case "testing": return chalk.yellow("");
    case "documentation": return chalk.cyan("");
    case "integration": return chalk.magenta("");
    default: return "";
  }
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case "low": return chalk.gray("");
    case "medium": return chalk.yellow("");
    case "high": return chalk.red("");
    case "critical": return chalk.magenta("");
    default: return "";
  }
}

// Save functions
async function saveAnalysis(analysis: TaskComplexityAnalysis, filePath: string, format: string) {
  const outputPath = path.resolve(filePath);
  
  switch (format) {
    case "json":
      await fs.writeJson(outputPath, analysis, { spaces: 2 });
      break;
    
    case "markdown":
      const markdown = `# Task Analysis: ${analysis.title}

**Description:** ${analysis.description}

## Complexity Assessment
- **Complexity Level:** ${analysis.complexityLevel}
- **Complexity Score:** ${analysis.complexityScore}/10
- **Estimated Hours:** ${analysis.estimatedHours}
- **Breakdown Recommendation:** ${analysis.breakdownRecommendation}
- **Recommended Subtasks:** ${analysis.recommendedSubtasks}

${analysis.riskFactors.length > 0 ? `## Risk Factors
${analysis.riskFactors.map(risk => `- ${risk}`).join('\n')}

` : ''}${analysis.skillsRequired.length > 0 ? `## Skills Required
${analysis.skillsRequired.map(skill => `- ${skill}`).join('\n')}

` : ''}## Analysis Reasoning
${analysis.reasoning}
`;
      await fs.writeFile(outputPath, markdown);
      break;
    
    default:
      await fs.writeJson(outputPath, analysis, { spaces: 2 });
  }
}

async function saveBreakdown(breakdown: TaskBreakdownResult, filePath: string, format: string) {
  const outputPath = path.resolve(filePath);
  
  switch (format) {
    case "workflow":
      const workflow = {
        name: breakdown.originalTask.title,
        description: breakdown.originalTask.description,
        tasks: breakdown.subtasks.map(subtask => ({
          id: subtask.id,
          name: subtask.title,
          description: subtask.description,
          type: subtask.type,
          priority: subtask.priority,
          dependencies: subtask.dependencies,
          estimatedHours: subtask.estimatedHours,
          skillsRequired: subtask.skillsRequired,
          acceptanceCriteria: subtask.acceptanceCriteria,
          notes: subtask.notes
        }))
      };
      await fs.writeJson(outputPath, workflow, { spaces: 2 });
      break;
    
    case "markdown":
      const markdown = `# Task Breakdown: ${breakdown.originalTask.title}

**Original Description:** ${breakdown.originalTask.description}
**Total Estimated Hours:** ${breakdown.totalEstimatedHours}
**Number of Subtasks:** ${breakdown.subtasks.length}

## Complexity Analysis
- **Complexity Level:** ${breakdown.analysis.complexityLevel}
- **Complexity Score:** ${breakdown.analysis.complexityScore}/10
- **Estimated Hours:** ${breakdown.analysis.estimatedHours}

## Subtasks

${breakdown.subtasks.map((subtask, index) => `### ${index + 1}. ${subtask.title}

**Type:** ${subtask.type}  
**Priority:** ${subtask.priority}  
**Estimated Hours:** ${subtask.estimatedHours}  
**Dependencies:** ${subtask.dependencies.join(', ') || 'None'}

**Description:** ${subtask.description}

**Skills Required:** ${subtask.skillsRequired.join(', ')}

**Acceptance Criteria:**
${subtask.acceptanceCriteria.map(criteria => `- ${criteria}`).join('\n')}

${subtask.notes ? `**Notes:** ${subtask.notes}` : ''}
`).join('\n')}

## Recommendations
${breakdown.recommendations.map(rec => `- ${rec}`).join('\n')}
`;
      await fs.writeFile(outputPath, markdown);
      break;
    
    default:
      await fs.writeJson(outputPath, breakdown, { spaces: 2 });
  }
}

async function saveWorkflowAnalysis(workflow: WorkflowDefinition, analysis: any, filePath: string, format: string) {
  const outputPath = path.resolve(filePath);
  
  const report = {
    workflow: {
      name: workflow.name,
      description: workflow.description,
      totalTasks: analysis.analyses.length,
      totalEstimatedHours: analysis.totalEstimatedHours
    },
    complexityDistribution: analysis.analyses.reduce((groups: any, task: TaskComplexityAnalysis) => {
      groups[task.complexityLevel] = (groups[task.complexityLevel] || 0) + 1;
      return groups;
    }, {}),
    recommendations: analysis.recommendations,
    taskAnalyses: analysis.analyses
  };
  
  await fs.writeJson(outputPath, report, { spaces: 2 });
} 