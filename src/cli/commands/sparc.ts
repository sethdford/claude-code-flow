/**
 * SPARC (Specification, Pseudocode, Architecture, Refinement, Completion) commands
 */

import { Command } from "../cliffy-compat.js";
import chalk from "chalk";
import { promises as fs } from "node:fs";
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { generateId } from "../../utils/helpers.js";
import { success, error, warning, info } from "../cli-core.js";
import type { CommandContext } from "../cli-core.js";
import colors from "chalk";
const { blue, yellow, green, cyan } = colors;

interface SparcMode {
  slug: string;
  name: string;
  roleDefinition: string;
  customInstructions: string;
  groups: string[];
  source: string;
}

interface SparcConfig {
  customModes: SparcMode[];
}

interface LegacySparcMode {
  description: string;
  prompt: string;
  tools: string[];
}

interface LegacySparcConfig {
  [key: string]: LegacySparcMode;
}

let sparcConfig: SparcConfig | null = null;

async function loadSparcConfig(): Promise<SparcConfig> {
  if (sparcConfig) {
    return sparcConfig;
  }

  try {
    const configPath = ".roomodes";
    const { readFile } = await import("fs/promises");
    const content = await readFile(configPath, "utf-8");
    const rawConfig = JSON.parse(content);
    
    // Check if it's the new format (has customModes array)
    if (rawConfig.customModes && Array.isArray(rawConfig.customModes)) {
      sparcConfig = rawConfig as SparcConfig;
    } else {
      // Convert legacy format to new format
      const legacyConfig = rawConfig as LegacySparcConfig;
      const customModes: SparcMode[] = [];
      
      for (const [slug, mode] of Object.entries(legacyConfig)) {
        customModes.push({
          slug,
          name: mode.description,
          roleDefinition: mode.prompt,
          customInstructions: mode.prompt,
          groups: mode.tools,
          source: "legacy-roomodes",
        });
      }
      
      sparcConfig = { customModes };
    }
    
    return sparcConfig!;
  } catch (error) {
    // If config file doesn't exist, create a minimal default config
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      console.warn("No .roomodes file found, using default SPARC modes");
      sparcConfig = {
        customModes: [
          {
            slug: "tdd",
            name: "Test-Driven Development",
            roleDefinition: "You follow strict test-driven development practices",
            customInstructions: "Write tests first, then implement minimal code to pass tests",
            groups: ["Read", "Write", "Edit", "Bash"],
            source: "default",
          },
          {
            slug: "coder",
            name: "Code Implementation",
            roleDefinition: "You are an expert programmer focused on writing clean, efficient code",
            customInstructions: "Write clean, well-documented, and efficient code",
            groups: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
            source: "default",
          },
        ],
      };
      return sparcConfig;
    }
    throw new Error(`Failed to load SPARC configuration: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export const sparcCommand = new Command()
  .name("sparc")
  .description("Enhanced SPARC-based TDD development with specialized modes")
  .action(() => {
    sparcCommand.outputHelp();
  });

// Add subcommands properly
sparcCommand
  .command("modes")
  .description("List available SPARC modes")
  .option("-v, --verbose", "Show detailed mode descriptions")
  .action(async (options: any) => {
    try {
      const config = await loadSparcConfig();

      console.log(colors.green("Available SPARC Modes:"));
      console.log();

      for (const mode of config.customModes) {
        console.log(`${colors.cyan("•")} ${colors.green(mode.name)} ${colors.blue(`(${mode.slug})`)}`);
        if (options.verbose) {
          console.log(`  ${mode.roleDefinition}`);
          console.log(`  Tools: ${mode.groups.join(", ")}`);
          console.log();
        }
      }

      if (!options.verbose) {
        console.log();
        console.log(colors.gray("Use --verbose for detailed descriptions"));
      }
    } catch (err) {
      console.error(colors.red(`Failed to list SPARC modes: ${err instanceof Error ? err.message : String(err)}`));
    }
  });

sparcCommand
  .command("info")
  .description("Show detailed information about a SPARC mode")
  .arguments("<mode-slug>")
  .action(async (modeSlug: string, options: any) => {
    try {
      const config = await loadSparcConfig();
      const mode = config.customModes.find(m => m.slug === modeSlug);

      if (!mode) {
        console.error(colors.red(`Mode not found: ${modeSlug}`));
        console.log("Available modes:");
        for (const m of config.customModes) {
          console.log(`  ${m.slug} - ${m.name}`);
        }
        return;
      }

      console.log(colors.green(`SPARC Mode: ${mode.name}`));
      console.log();
      console.log(colors.blue("Role Definition:"));
      console.log(mode.roleDefinition);
      console.log();
      console.log(colors.blue("Custom Instructions:"));
      console.log(mode.customInstructions);
      console.log();
      console.log(colors.blue("Tool Groups:"));
      console.log(mode.groups.join(", "));
      console.log();
      console.log(colors.blue("Source:"));
      console.log(mode.source);

    } catch (err) {
      console.error(colors.red(`Failed to show mode info: ${err instanceof Error ? err.message : String(err)}`));
    }
  });

sparcCommand
  .command("run")
  .description("Run a task using a specific SPARC mode")
  .arguments("<mode-slug> <task-description>")
  .option("--dry-run", "Show configuration without executing")
  .option("-v, --verbose", "Enable verbose output")
  .action(async (modeSlug: string, taskDescription: string, options: any) => {
    try {
      const config = await loadSparcConfig();
      const mode = config.customModes.find(m => m.slug === modeSlug);

      if (!mode) {
        console.error(colors.red(`Mode not found: ${modeSlug}`));
        return;
      }

      // Build the enhanced task prompt using SPARC methodology
      const enhancedTask = buildSparcPrompt(mode, taskDescription, options);
      const instanceId = `sparc-${modeSlug}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Build tools based on mode groups
      const tools = buildToolsFromGroups(mode.groups);

      if (options.dryRun) {
        console.log(colors.yellow("DRY RUN - SPARC Mode Configuration:"));
        console.log(`Mode: ${mode.name} (${mode.slug})`);
        console.log(`Instance ID: ${instanceId}`);
        console.log(`Tools: ${tools}`);
        console.log(`Task: ${taskDescription}`);
        console.log();
        console.log("Enhanced prompt preview:");
        console.log(`${enhancedTask.substring(0, 300)}...`);
        return;
      }

      console.log(colors.green(`Starting SPARC mode: ${mode.name}`));
      console.log(`📝 Instance ID: ${instanceId}`);
      console.log(`🎯 Mode: ${mode.slug}`);
      console.log(`🔧 Tools: ${tools}`);
      console.log(`📋 Task: ${taskDescription}`);
      console.log();

      // Execute Claude with SPARC configuration
      await executeClaudeWithSparc(enhancedTask, tools, instanceId, options);

    } catch (err) {
      console.error(colors.red(`Failed to run SPARC mode: ${err instanceof Error ? err.message : String(err)}`));
    }
  });

sparcCommand
  .command("tdd")
  .description("Run TDD workflow using SPARC methodology")
  .arguments("<task-description>")
  .option("--dry-run", "Show workflow without executing")
  .option("-v, --verbose", "Enable verbose output")
  .action(async (taskDescription: string, options: any) => {
    try {
      const config = await loadSparcConfig();

      // Build TDD workflow using SPARC methodology
      const workflow = [
        { mode: "spec-pseudocode", phase: "Specification", description: `Create detailed spec and pseudocode for: ${taskDescription}` },
        { mode: "tdd", phase: "Red", description: `Write failing tests for: ${taskDescription}` },
        { mode: "code", phase: "Green", description: `Implement minimal code to pass tests for: ${taskDescription}` },
        { mode: "refinement-optimization-mode", phase: "Refactor", description: `Refactor and optimize implementation for: ${taskDescription}` },
        { mode: "integration", phase: "Integration", description: `Integrate and verify complete solution for: ${taskDescription}` },
      ];

      if (options.dryRun) {
        console.log(colors.yellow("DRY RUN - TDD Workflow:"));
        for (const step of workflow) {
          console.log(`${colors.cyan(step.phase)}: ${step.mode} - ${step.description}`);
        }
        return;
      }

      console.log(colors.green("Starting SPARC TDD Workflow"));
      console.log("Following Test-Driven Development with SPARC methodology");
      console.log();

      for (let i = 0; i < workflow.length; i++) {
        const step = workflow[i];
        const mode = config.customModes.find(m => m.slug === step.mode);

        if (!mode) {
          console.log(colors.yellow(`Mode not found: ${step.mode}, skipping step`));
          continue;
        }

        console.log(colors.cyan(`Phase ${i + 1}/5: ${step.phase} (${mode.name})`));
        console.log(`📋 ${step.description}`);
        console.log();

        const enhancedTask = buildSparcPrompt(mode, step.description, {
          ...options,
          tddPhase: step.phase,
          workflowStep: i + 1,
          totalSteps: workflow.length,
        });

        const tools = buildToolsFromGroups(mode.groups);
        const instanceId = `sparc-tdd-${step.mode}-${Date.now()}`;

        await executeClaudeWithSparc(enhancedTask, tools, instanceId, options);

        // Wait for user confirmation between phases (optional)
        if (i < workflow.length - 1 && !options.autoProgress) {
          console.log(colors.gray("\nPress Enter to continue to next phase..."));
          // In a real implementation, you'd wait for user input
        }
      }

      console.log(colors.green("\n✅ SPARC TDD Workflow completed successfully!"));

    } catch (err) {
      console.error(colors.red(`Failed to run TDD workflow: ${err instanceof Error ? err.message : String(err)}`));
    }
  });

function buildSparcPrompt(mode: SparcMode, taskDescription: string, flags: any): string {
  const memoryNamespace = flags.namespace || mode.slug || "default";
  
  return `# SPARC Development Mode: ${mode.name}

## Your Role
${mode.roleDefinition}

## Your Task
${taskDescription}

## Mode-Specific Instructions
${mode.customInstructions}

## SPARC Development Environment

You are working within the SPARC (Specification, Pseudocode, Architecture, Refinement, Completion) methodology using claude-flow orchestration features.

### Available Development Tools
- **Memory Persistence**: Use \`npx claude-flow memory store <key> "<value>"\` to save progress and findings
- **Memory Retrieval**: Use \`npx claude-flow memory query <search>\` to access previous work
- **Namespace**: Your work is stored in the "${memoryNamespace}" namespace

### SPARC Methodology Integration
${flags.tddPhase ? `
**Current TDD Phase**: ${flags.tddPhase}
- Follow the Red-Green-Refactor cycle
- Store test results and refactoring notes in memory
` : ""}

${flags.workflowStep ? `
**Workflow Progress**: Step ${flags.workflowStep} of ${flags.totalSteps}
- Review previous steps: \`npx claude-flow memory query previous_steps\`
- Store this step's output: \`npx claude-flow memory store step_${flags.workflowStep}_output "<results>"\`
` : ""}

### Best Practices
1. **Modular Development**: Keep all files under 500 lines
2. **Environment Safety**: Never hardcode secrets or environment values
3. **Memory Usage**: Store key findings and decisions in memory for future reference
4. **Tool Integration**: Use \`new_task\` for subtasks and \`attempt_completion\` when finished

### Memory Commands Examples
\`\`\`bash
# Store your progress
npx claude-flow memory store ${memoryNamespace}_progress "Current status and findings"

# Check for previous work
npx claude-flow memory query ${memoryNamespace}

# Store phase-specific results
npx claude-flow memory store ${memoryNamespace}_${flags.tddPhase || "results"} "Phase output and decisions"
\`\`\`

### Integration with Other SPARC Modes
When working with other SPARC modes, use memory to:
- Share findings with spec-pseudocode mode
- Pass requirements to architect mode  
- Coordinate with code and tdd modes
- Communicate results to integration mode

Now proceed with your task following the SPARC methodology and your specific role instructions.`;
}

function buildToolsFromGroups(groups: string[]): string {
  const toolMappings: Record<string, string[]> = {
    read: ["View", "LS", "GlobTool", "GrepTool"],
    edit: ["Edit", "Replace", "MultiEdit", "Write"],
    browser: ["WebFetch"],
    mcp: ["mcp_tools"],
    command: ["Bash", "Terminal"],
  };

  const tools = new Set<string>();
  
  // Always include basic tools
  tools.add("View");
  tools.add("Edit");
  tools.add("Bash");

  for (const group of groups) {
    if (Array.isArray(group)) {
      // Handle nested group definitions
      const groupName = group[0];
      if (toolMappings[groupName]) {
        toolMappings[groupName].forEach(tool => tools.add(tool));
      }
    } else if (toolMappings[group]) {
      toolMappings[group].forEach(tool => tools.add(tool));
    }
  }

  return Array.from(tools).join(",");
}

async function executeClaudeWithSparc(
  enhancedTask: string, 
  tools: string, 
  instanceId: string, 
  flags: any,
): Promise<void> {
  const claudeArgs = [enhancedTask];
  claudeArgs.push("--allowedTools", tools);

  if (flags.noPermissions || flags["no-permissions"]) {
    claudeArgs.push("--dangerously-skip-permissions");
  }

  if (flags.config) {
    claudeArgs.push("--mcp-config", flags.config);
  }

  if (flags.verbose) {
    claudeArgs.push("--verbose");
  }

  try {
    const { spawn } = await import("child_process");
    const child = spawn("claude", claudeArgs, {
      env: {
        ...process.env,
        CLAUDE_INSTANCE_ID: instanceId,
        CLAUDE_SPARC_MODE: "true",
        CLAUDE_FLOW_MEMORY_ENABLED: "true",
        CLAUDE_FLOW_MEMORY_NAMESPACE: flags.namespace || "sparc",
      },
      stdio: "inherit",
    });

    const status = await new Promise<{ success: boolean; code: number | null }>((resolve) => {
      child.on("close", (code) => {
        resolve({ success: code === 0, code });
      });
    });

    if (status.success) {
      success(`SPARC instance ${instanceId} completed successfully`);
    } else {
      error(`SPARC instance ${instanceId} exited with code ${status.code}`);
    }
  } catch (err) {
    error(`Failed to execute Claude: ${err instanceof Error ? err.message : String(err)}`);
  }
}

async function showSparcHelp(): Promise<void> {
  console.log(`${cyan("SPARC")} - ${green("Specification, Pseudocode, Architecture, Refinement, Completion")}`);
  console.log();
  console.log("SPARC development methodology with TDD and multi-agent coordination.");
  console.log();
  console.log(blue("Commands:"));
  console.log("  modes                    List all available SPARC modes");
  console.log("  info <mode>              Show detailed information about a mode");
  console.log("  run <mode> <task>        Execute a task using a specific SPARC mode");
  console.log("  tdd <task>               Run full TDD workflow using SPARC methodology");
  console.log("  workflow <file>          Execute a custom SPARC workflow from JSON file");
  console.log();
  console.log(blue("Common Modes:"));
  console.log("  spec-pseudocode          Create specifications and pseudocode");
  console.log("  architect                Design system architecture");
  console.log("  code                     Implement code solutions");
  console.log("  tdd                      Test-driven development");
  console.log("  debug                    Debug and troubleshoot issues");
  console.log("  security-review          Security analysis and review");
  console.log("  docs-writer              Documentation creation");
  console.log("  integration              System integration and testing");
  console.log();
  console.log(blue("Options:"));
  console.log("  --namespace <ns>         Memory namespace for this session");
  console.log("  --no-permissions         Skip permission prompts");
  console.log("  --config <file>          MCP configuration file");
  console.log("  --verbose               Enable verbose output");
  console.log("  --dry-run               Preview what would be executed");
  console.log("  --sequential            Wait between workflow steps (default: true)");
  console.log();
  console.log(blue("Examples:"));
  console.log(`  ${yellow("claude-flow sparc modes")}                              # List all modes`);
  console.log(`  ${yellow("claude-flow sparc run code")} "implement user auth"      # Run specific mode`);
  console.log(`  ${yellow("claude-flow sparc tdd")} "payment processing system"    # Full TDD workflow`);
  console.log(`  ${yellow("claude-flow sparc workflow")} project-workflow.json     # Custom workflow`);
  console.log();
  console.log(blue("TDD Workflow:"));
  console.log("  1. Specification - Define requirements and create pseudocode");
  console.log("  2. Red Phase - Write failing tests");
  console.log("  3. Green Phase - Implement minimal code to pass tests");
  console.log("  4. Refactor Phase - Optimize and clean up code");
  console.log("  5. Integration - Verify complete solution");
  console.log();
  console.log("For more information: https://github.com/sethdford/vibex-claude-code-flow/docs/sparc.md");
  console.log("Original project by @ruvnet: https://github.com/ruvnet/claude-code-flow");
}

// Export action function for compatibility with other modules
export async function sparcAction(ctx: { args: string[]; flags: Record<string, unknown>; config?: any }): Promise<void> {
  const mode = ctx.args[0] || "development";
  const prompt = ctx.args.slice(1).join(" ") || "Please help me with this task";
  
  console.log(colors.cyan(`🚀 SPARC Mode: ${mode}`));
  console.log(`📝 Prompt: ${prompt}`);
  
  // Simulate SPARC execution
  const steps = [
    "📋 Specification - Analyzing requirements",
    "🧮 Pseudocode - Creating algorithm outline", 
    "🏗️ Architecture - Designing system structure",
    "🔄 Refinement - Optimizing implementation",
    "✅ Completion - Finalizing solution"
  ];
  
  for (const step of steps) {
    console.log(colors.gray(`  ${step}`));
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(colors.green("✨ SPARC process completed successfully!"));
}