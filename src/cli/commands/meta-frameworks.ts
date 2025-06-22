/**
 * Meta-Frameworks Command - Game-theoretic development protocols
 */

import { Command } from "../cliffy-compat.js";
import { logger } from "../../core/logger.js";
import chalk from "chalk";

export interface CommandContext {
  args: string[];
  flags: Record<string, any>;
}

// Meta-Framework Catalog
const META_FRAMEWORKS = {
  "code-review-game": {
    name: "Code Review Game",
    description: "Game-theoretic code review protocol that prevents bikeshedding and analysis paralysis",
    usage: "/code-review-game \"[pr_url_or_branch]\" [review_depth] [time_budget] [concern_budget]",
    features: [
      "Multi-agent reviewers with specialized expertise",
      "Concern budgets to prevent nitpicking",
      "Progressive disclosure (architecture first)",
      "Anti-pattern detection and intervention"
    ],
    agents: [
      "Architecture Guardian",
      "Security Auditor", 
      "Performance Profiler",
      "User Advocate",
      "Maintenance Prophet",
      "Chaos Monkey"
    ]
  },
  "feature-discovery": {
    name: "Feature Discovery",
    description: "Generate diverse, high-quality feature implementations using game theory",
    usage: "/feature-discovery \"[feature_request]\" [max_rounds] [diversity_weight] [explorer_count]",
    features: [
      "Cognitive explorers with distinct thinking styles",
      "Isolated generation prevents groupthink",
      "Insight auctions for cross-pollination",
      "Diversity tournaments reward unique approaches"
    ],
    agents: [
      "First Principles Explorer",
      "Analogical Explorer",
      "User Empathy Explorer", 
      "Technical Elegance Explorer",
      "Pragmatist Explorer",
      "Contrarian Explorer"
    ]
  },
  "refactoring-game": {
    name: "Refactoring Game", 
    description: "Game-theoretic refactoring protocol that prevents perfectionism spirals",
    usage: "/refactoring-game [codebase_path] [ship_deadline] [budget] [max_iterations] [confidence_threshold]",
    features: [
      "Energy budgets prevent perfectionism",
      "Multi-agent players with balanced perspectives",
      "Spiral detection and commitment devices",
      "Minimax regret decision making"
    ],
    agents: [
      "The Perfectionist",
      "The Shipper",
      "The Maintainer", 
      "The User"
    ]
  },
  "ulysses-protocol": {
    name: "Ulysses Protocol",
    description: "High-stakes debugging and problem-solving framework with systematic phases",
    usage: "/ulysses-protocol \"[problem_statement]\" [stakes] [budget] [iteration_limit]",
    features: [
      "Time-boxed phases with decision gates",
      "Systematic escalation triggers",
      "Anti-spiral detection mechanisms",
      "Learning integration and capture"
    ],
    phases: [
      "Reconnaissance (25%)",
      "Strategic Planning (15%)",
      "Controlled Implementation (45%)",
      "Validation & Documentation (15%)"
    ]
  },
  "virgil-protocol": {
    name: "Virgil Protocol",
    description: "Deliberate innovation framework based on Virgil Abloh's 3% Rule",
    usage: "/virgil-protocol \"[innovation_target]\" [--max-deviation=3%] [--discovery-depth=exhaustive]",
    features: [
      "Exhaustive discovery of existing solutions",
      "Deep understanding before changing",
      "3% constraint on deviation",
      "Familiarity preservation with justified innovation"
    ],
    phases: [
      "Exhaustive Discovery (40%)",
      "Deep Understanding (25%)",
      "Minimal Deviation Design (20%)",
      "Implementation with Restraint (15%)"
    ]
  },
  "wisdom-distillation": {
    name: "Wisdom Distillation",
    description: "Extract strategic principles from tactical implementations",
    usage: "/wisdom-distillation [domain] [--timespan=PERIOD] [--abstraction=LEVEL] [--format=TYPE]",
    features: [
      "Multi-level abstraction extraction",
      "Historical validation of principles",
      "Cross-domain synthesis",
      "Framework packaging for reuse"
    ],
    levels: [
      "Tactical (immediate guidance)",
      "Strategic (medium-term planning)",
      "Philosophical (fundamental beliefs)",
      "Universal (transcendent principles)"
    ]
  }
};

async function metaFrameworksAction(ctx: CommandContext): Promise<void> {
  // Auto-initialize if needed (except for help)
  if (ctx.args[0] !== "help" && ctx.args.length > 0) {
    await checkAndAutoInitialize();
  }
  
  const subcommand = ctx.args[0];

  switch (subcommand) {
    case "list":
      await listMetaFrameworks(ctx);
      break;
    case "info":
      await showFrameworkInfo(ctx);
      break;
    case "run":
      await runFramework(ctx);
      break;
    default:
      await showMetaFrameworksHelp();
      break;
  }
}

/**
 * Check if project is initialized and auto-initialize if needed
 */
async function checkAndAutoInitialize(): Promise<boolean> {
  try {
    const fs = await import("fs/promises");
    
    // Check if .roomodes and .claude directory exist
    const roomodesExists = await fs.access(".roomodes").then(() => true).catch(() => false);
    const claudeExists = await fs.access(".claude").then(() => true).catch(() => false);
    
    if (!roomodesExists || !claudeExists) {
      console.log(chalk.yellow("🔍 Claude-Flow project not initialized in current directory"));
      console.log(chalk.cyan("🚀 Auto-initializing project..."));
      console.log();
      
      // Import and run init
      const { initCommand: runInit } = await import("../init/index.js");
      await runInit({ sparc: false, force: false });
      
      console.log();
      console.log(chalk.green("✅ Project auto-initialized successfully!"));
      console.log(chalk.gray("You can now use all claude-flow commands."));
      console.log();
      
      return true;
    }
    
    return false;
  } catch (error) {
    // If auto-init fails, just warn and continue
    console.log(chalk.yellow("⚠️  Auto-initialization failed, continuing anyway..."));
    return false;
  }
}

async function listMetaFrameworks(ctx: CommandContext): Promise<void> {
  const verbose = ctx.flags.verbose as boolean;
  
  console.log(chalk.cyan.bold("\n🎯 Meta-Framework Protocols\n"));
  console.log(chalk.gray("Game-theoretic development protocols that prevent common anti-patterns\n"));

  for (const [key, framework] of Object.entries(META_FRAMEWORKS)) {
    console.log(`${chalk.cyan("•")} ${chalk.bold(framework.name)} ${chalk.gray(`(${key})`)}`);
    console.log(`  ${framework.description}`);
    
    if (verbose) {
      console.log(chalk.blue("  Features:"));
      framework.features.forEach(feature => {
        console.log(`    - ${feature}`);
      });
      
      if ('agents' in framework) {
        console.log(chalk.green("  Agents:"));
        framework.agents.forEach((agent: string) => {
          console.log(`    - ${agent}`);
        });
      }
      
      if ('phases' in framework) {
        console.log(chalk.yellow("  Phases:"));
        framework.phases.forEach((phase: string) => {
          console.log(`    - ${phase}`);
        });
      }
      
      console.log(chalk.gray(`  Usage: ${framework.usage}`));
    }
    console.log();
  }

  if (!verbose) {
    console.log(chalk.gray("Use --verbose for detailed information"));
  }
}

async function showFrameworkInfo(ctx: CommandContext): Promise<void> {
  const frameworkName = ctx.args[1];
  
  if (!frameworkName) {
    console.error(chalk.red("Error: Framework name required"));
    console.log("Usage: claude-flow meta-frameworks info <framework-name>");
    return;
  }

  const framework = META_FRAMEWORKS[frameworkName as keyof typeof META_FRAMEWORKS];
  
  if (!framework) {
    console.error(chalk.red(`Error: Framework '${frameworkName}' not found`));
    console.log("\nAvailable frameworks:");
    Object.keys(META_FRAMEWORKS).forEach(key => {
      console.log(`  - ${key}`);
    });
    return;
  }

  console.log(chalk.cyan.bold(`\n${framework.name}\n`));
  console.log(framework.description);
  console.log();
  
  console.log(chalk.blue("Usage:"));
  console.log(`  ${framework.usage}`);
  console.log();
  
  console.log(chalk.green("Key Features:"));
  framework.features.forEach(feature => {
    console.log(`  • ${feature}`);
  });
  console.log();
  
  if ('agents' in framework) {
    console.log(chalk.yellow("Specialized Agents:"));
    framework.agents.forEach((agent: string) => {
      console.log(`  • ${agent}`);
    });
    console.log();
  }
  
  if ('phases' in framework) {
    console.log(chalk.magenta("Process Phases:"));
    framework.phases.forEach((phase: string) => {
      console.log(`  • ${phase}`);
    });
    console.log();
  }
}

async function runFramework(ctx: CommandContext): Promise<void> {
  const frameworkName = ctx.args[1];
  const objective = ctx.args.slice(2).join(" ");
  
  if (!frameworkName) {
    console.error(chalk.red("Error: Framework name required"));
    console.log("Usage: claude-flow meta-frameworks run <framework-name> <objective>");
    return;
  }

  const framework = META_FRAMEWORKS[frameworkName as keyof typeof META_FRAMEWORKS];
  
  if (!framework) {
    console.error(chalk.red(`Error: Framework '${frameworkName}' not found`));
    return;
  }

  if (!objective) {
    console.error(chalk.red("Error: Objective required"));
    console.log(`Usage: ${framework.usage}`);
    return;
  }

  console.log(chalk.cyan(`\n🚀 Executing ${framework.name}`));
  console.log(chalk.gray(`Objective: ${objective}`));
  console.log();

  // This would integrate with the actual swarm execution system
  console.log(chalk.yellow("⚠️  Meta-framework execution not yet implemented"));
  console.log(chalk.gray("This will integrate with the swarm coordination system"));
  console.log();
  
  // Show what would be executed
  console.log(chalk.blue("Planned Execution:"));
  console.log(`  Framework: ${framework.name}`);
  console.log(`  Objective: ${objective}`);
  
  if ('agents' in framework) {
    console.log(`  Agents: ${framework.agents.length} specialized agents`);
  }
  
  if ('phases' in framework) {
    console.log(`  Phases: ${framework.phases.length} structured phases`);
  }
  
  console.log(`  Features: ${framework.features.join(", ")}`);
}

async function showMetaFrameworksHelp(): Promise<void> {
  console.log(chalk.cyan.bold("Meta-Frameworks"));
  console.log();
  console.log("Game-theoretic development protocols that prevent common anti-patterns");
  console.log("through systematic coordination, constraint mechanisms, and multi-agent approaches.");
  console.log();
  console.log(chalk.blue("Commands:"));
  console.log("  list                     List all available meta-frameworks");
  console.log("  info <framework>         Show detailed framework information");
  console.log("  run <framework> <obj>    Execute a framework with given objective");
  console.log();
  console.log(chalk.blue("Available Frameworks:"));
  Object.entries(META_FRAMEWORKS).forEach(([key, framework]) => {
    console.log(`  ${chalk.cyan(key.padEnd(20))} ${framework.description}`);
  });
  console.log();
  console.log(chalk.blue("Options:"));
  console.log("  --verbose               Show detailed information");
  console.log("  --dry-run               Show execution plan without running");
  console.log();
  console.log(chalk.blue("Examples:"));
  console.log("  claude-flow meta-frameworks list --verbose");
  console.log("  claude-flow meta-frameworks info code-review-game");
  console.log('  claude-flow meta-frameworks run feature-discovery "Add real-time collaboration"');
}

export const metaFrameworksCommand = new Command()
  .name("meta-frameworks")
  .description("Game-theoretic development protocols that prevent common anti-patterns")
  .arguments("[subcommand] [args...]")
  .option("--verbose, -v", "Show detailed information")
  .option("--dry-run, -n", "Show execution plan without running")
  .action(async (subcommand: string, args: string[], options: any) => {
    const ctx: CommandContext = {
      args: [subcommand, ...args].filter(Boolean),
      flags: options || {},
    };
    await metaFrameworksAction(ctx);
  }); 