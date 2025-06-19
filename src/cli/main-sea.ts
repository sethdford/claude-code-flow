#!/usr/bin/env node
/**
 * Claude-Flow CLI - SEA (Single Executable Application) entry point
 * This version avoids import.meta usage for SEA compatibility
 */

import { CLI, VERSION } from "./cli-core.js";
import { setupCommands } from "./commands/index.js";

async function main() {
  const cli = new CLI("claude-flow", "Advanced AI Agent Orchestration System");
  
  // Setup all commands
  setupCommands(cli);
  
  // Run the CLI (args default to process.argv.slice(2) in Node.js version)
  await cli.run();
}

// Always run in SEA mode - no need to check if main module
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
}); 