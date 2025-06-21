/**
 * Token Monitor CLI Command
 * Launch the beautiful real-time Claude token usage monitor
 */

import { Command } from "../cliffy-compat.js";
import { ClaudeTokenMonitor, MonitorConfig } from "../../monitoring/claude-token-monitor.js";
import { TokenMonitorDisplay } from "../../monitoring/token-display.js";
import { logger } from "../../core/logger.js";

async function tokenMonitorAction(options: any) {
  console.log("🚀 Starting Claude Token Monitor...\n");

  // Check for Claude Code CLI
  try {
    const { spawn } = await import("child_process");
    const testProcess = spawn('claude', ['--version'], { stdio: 'pipe' });
    
    await new Promise((resolve, reject) => {
      testProcess.on('close', (code) => {
        if (code === 0) {
          resolve(void 0);
        } else {
          reject(new Error('claude not found'));
        }
      });
      testProcess.on('error', reject);
    });
    
    console.log("✅ Claude Code CLI detected");
  } catch (error) {
    console.log("⚠️ Claude Code CLI not found, but monitor will still work with session files");
    console.log("\n💡 For best experience, install Claude Code:");
    console.log("   Visit: https://claude.ai/download");
  }

  const config: Partial<MonitorConfig> = {
    plan: options.plan || 'pro',
    timezone: options.timezone || 'UTC',
    updateInterval: options.interval || 3,
  };

  if (options.resetHour !== undefined) {
    config.resetHour = parseInt(options.resetHour);
  }

  const monitor = new ClaudeTokenMonitor(config);
  const display = new TokenMonitorDisplay(monitor);

  try {
    await display.start();
  } catch (error) {
    logger.error('Token monitor failed:', error);
    console.log(`❌ Monitor failed: ${error.message}`);
  }
}

// Create the command
export const tokenMonitorCommand = new Command()
  .name("token-monitor")
  .alias("tokens")
  .description("Launch real-time Claude token usage monitor with beautiful display")
  .option("-p, --plan <plan>", "Claude plan type (pro, max5, max20, custom_max)", "pro")
  .option("-r, --reset-hour <hour>", "Custom reset hour (0-23)")
  .option("-t, --timezone <tz>", "Timezone for reset times", "UTC")
  .option("-i, --interval <seconds>", "Update interval in seconds", "3")
  .option("--compact", "Show compact widget instead of full display")
  .action(tokenMonitorAction);
