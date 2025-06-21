#!/usr/bin/env node
/**
 * Claude-Flow CLI - SEA (Single Executable Application) entry point
 * This version uses the shared CLI core and always runs (no import.meta check needed for SEA)
 */

import { runCLI } from "./cli-core.js";

/**
 * SEA entry point - always run without module detection
 */
async function main() {
  try {
    await runCLI();
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

// Always run in SEA mode - no need to check if main module
main(); 