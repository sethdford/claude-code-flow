// init/index.ts - Main init command orchestrator
import chalk from "chalk";

const printSuccess = (msg: string) => console.log(chalk.green(`✅ ${msg}`));
const printError = (msg: string) => console.error(chalk.red(`❌ ${msg}`));
import { createDirectoryStructure } from "./directory-structure.js";
// Removed swarm commands import - not part of core functionality
import { createSparcEnvironment } from "./sparc-environment.js";
import { createClaudeConfig } from "./claude-config.js";
import { createBatchToolsGuide } from "./batch-tools.js";
import { copyClaudeCommands } from "./claude-commands.js";

export interface InitOptions {
  sparc?: boolean;
  force?: boolean;
}

export async function initCommand(options: InitOptions = {}) {
  try {
    const _fs = await import("fs/promises");
    const _path = await import("path");
    
    printSuccess("Initializing Claude-Flow project...");
    
    // Phase 1: Create directory structure
    console.log("\n📁 Phase 1: Creating directory structure...");
    await createDirectoryStructure();
    
    // Phase 2: Create base configuration
    console.log("\n⚙️  Phase 2: Creating configuration...");
    await createClaudeConfig(options);
    
    // Phase 3: Copy Claude commands for slash commands
    console.log("\n⚡ Phase 3: Copying Claude commands for slash commands...");
    await copyClaudeCommands();
    
    // Phase 4: Create batch tools guides
    console.log("\n🔧 Phase 4: Creating batch tools guides...");
    await createBatchToolsGuide();
    
    // Phase 5: SPARC environment (always create .roomodes for custom commands)
    console.log("\n🚀 Phase 5: Creating SPARC environment and custom commands...");
    await createSparcEnvironment();
    
    // Success summary
    console.log("\n🎉 Project initialized successfully!");
    console.log("   📁 Created .claude/ directory structure");
    console.log("   ⚡ Copied all command files for custom slash commands");
    console.log("   📋 Created comprehensive swarm command documentation");
    console.log("   🔧 Created batch tools coordination guides");
    console.log("   📖 Created detailed usage examples with orchestration");
    console.log("   🎯 Created .roomodes with 17 custom SPARC modes");
    
    console.log("\n   Next steps:");
    console.log("   1. Run \"claude-flow swarm --help\" to see swarm options");
    console.log("   2. Check .claude/commands/ for all available slash commands");
    console.log("   3. Use custom slash commands like /mcp__claude-flow__sparc_orchestrator");
    console.log("   4. Review batch tools guide for orchestration patterns");
    console.log("   5. Run \"claude-flow help\" for all available commands");
    console.log("   6. Run \"claude-flow sparc modes\" to see available SPARC modes");
    console.log("   7. Use TodoWrite/TodoRead for task coordination");
    console.log("   8. Use Task tool for parallel agent execution");
    
  } catch (error) {
    printError(`Failed to initialize project: ${(error as Error).message}`);
    throw error;
  }
}