#!/usr/bin/env node
/**
 * Claude-Flow CLI entry point
 * Main command-line interface using shared CLI core
 */

import { runCLI } from "./cli-core.js";

// Main entry point
// Check if this is the main module being run
const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
  process.argv[1]?.endsWith("/claude-flow") ||
  process.argv[1]?.endsWith("\\claude-flow") ||
  process.argv[1]?.endsWith("/index.js") ||
  process.argv[1]?.endsWith("\\index.js");

if (isMainModule) {
  runCLI().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}