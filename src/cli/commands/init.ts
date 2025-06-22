/**
 * Init command - Initialize Claude-Flow project structure
 */

import { Command } from "../cliffy-compat.js";
import { initCommand as runInit, InitOptions } from "../init/index.js";
import chalk from "chalk";

export const initCommand = new Command()
  .name("init")
  .description("Initialize Claude-Flow project structure with SPARC environment")
  .option("--sparc", "Initialize with enhanced SPARC features and additional documentation")
  .option("--force", "Force initialization even if files exist")
  .action(async (options: InitOptions) => {
    try {
      console.log(chalk.cyan("🧠 Claude-Flow Project Initialization"));
      console.log(chalk.gray("────────────────────────────────────────"));
      
      await runInit(options);
      
      // Additional success messaging
      console.log(chalk.green("\n✨ Initialization complete!"));
      
      console.log(chalk.blue("\n🚀 SPARC Environment Ready:"));
      console.log("   • .claude/ directory with full configuration");
      console.log("   • CLAUDE.md with project instructions");
      console.log("   • .roomodes with 17 pre-configured SPARC modes");
      console.log("   • Comprehensive swarm command documentation");
      console.log("   • Local ./claude-flow wrapper script");
      
      if (options.sparc) {
        console.log(chalk.blue("\n🎯 Enhanced SPARC Features:"));
        console.log("   • Extended documentation and examples");
        console.log("   • Additional workflow templates");
        console.log("   • Advanced coordination patterns");
      }
      
      console.log(chalk.yellow("\n📋 Quick Start:"));
      console.log("   ./claude-flow start --ui --port 3000");
      console.log("   ./claude-flow swarm --help");
      console.log("   ./claude-flow sparc modes");
      
    } catch (error) {
      console.error(chalk.red("❌ Initialization failed:"), (error as Error).message);
      process.exit(1);
    }
  }); 