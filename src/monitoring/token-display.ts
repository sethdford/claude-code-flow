/**
 * Beautiful Terminal Display for Claude Token Monitor
 * Real-time visual interface with progress bars and live stats
 */

import { ClaudeTokenMonitor, TokenStats, formatTime, createProgressBar, createTimeProgressBar } from "./claude-token-monitor.js";
import { logger } from "../core/logger.js";

export class TokenMonitorDisplay {
  private monitor: ClaudeTokenMonitor;
  private isDisplaying: boolean = false;
  private displayProcess?: NodeJS.Timeout;

  constructor(monitor: ClaudeTokenMonitor) {
    this.monitor = monitor;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.monitor.on('stats', (stats: TokenStats) => {
      if (this.isDisplaying) {
        this.renderDisplay(stats);
      }
    });

    this.monitor.on('error', (error: Error) => {
      this.renderError(error);
    });
  }

  private clearScreen(): void {
    // Move cursor to top without clearing (preserves scrollback)
    process.stdout.write('\x1b[H');
  }

  private hideCursor(): void {
    process.stdout.write('\x1b[?25l');
  }

  private showCursor(): void {
    process.stdout.write('\x1b[?25h');
  }

  private printHeader(): void {
    const cyan = '\x1b[96m';
    const blue = '\x1b[94m';
    const reset = '\x1b[0m';
    const sparkles = `${cyan}✦ ✧ ✦ ✧ ${reset}`;
    
    console.log(`${sparkles}${cyan}CLAUDE TOKEN MONITOR${reset} ${sparkles}`);
    console.log(`${blue}${'='.repeat(60)}${reset}`);
    console.log();
  }

  private getVelocityIndicator(burnRate: number): string {
    if (burnRate < 50) return '🐌'; // Slow
    if (burnRate < 150) return '➡️'; // Normal
    if (burnRate < 300) return '🚀'; // Fast
    return '⚡'; // Very fast
  }

  private renderDisplay(stats: TokenStats): void {
    this.clearScreen();

    // Color codes
    const cyan = '\x1b[96m';
    const green = '\x1b[92m';
    const blue = '\x1b[94m';
    const red = '\x1b[91m';
    const yellow = '\x1b[93m';
    const white = '\x1b[97m';
    const gray = '\x1b[90m';
    const reset = '\x1b[0m';

    // Header
    this.printHeader();

    // Token Usage Progress Bar
    const tokenProgressBar = createProgressBar(stats.usagePercentage);
    console.log(`📊 ${white}Token Usage:${reset} ${tokenProgressBar}`);
    console.log();

    // Time to Reset Progress Bar
    const timeSinceReset = Math.max(0, 300 - stats.timeToReset); // Assume 5-hour cycles
    const timeProgressBar = createTimeProgressBar(timeSinceReset, 300);
    console.log(`⏳ ${white}Time to Reset:${reset} ${timeProgressBar}`);
    console.log();

    // Detailed Stats
    console.log(`🎯 ${white}Tokens:${reset} ${white}${stats.tokensUsed.toLocaleString()}${reset} / ${gray}~${(stats.tokensUsed + stats.tokensLeft).toLocaleString()}${reset} (${cyan}${stats.tokensLeft.toLocaleString()} left${reset})`);
    
    const velocityIcon = this.getVelocityIndicator(stats.burnRate);
    console.log(`🔥 ${white}Burn Rate:${reset} ${velocityIcon} ${yellow}${stats.burnRate.toFixed(1)}${reset} ${gray}tokens/min${reset}`);
    console.log();

    // Predictions
    const predictedEndStr = stats.predictedEndTime.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    const resetTimeStr = stats.resetTime.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    console.log(`🏁 ${white}Predicted End:${reset} ${predictedEndStr}`);
    console.log(`🔄 ${white}Token Reset:${reset} ${resetTimeStr}`);
    console.log();

    // Warnings and Notifications
    if (stats.usagePercentage > 90) {
      console.log(`🚨 ${red}WARNING: Token usage above 90%!${reset}`);
      console.log();
    }

    if (stats.predictedEndTime < stats.resetTime) {
      console.log(`⚠️ ${red}Tokens will run out BEFORE reset!${reset}`);
      console.log();
    }

    if (stats.burnRate > 200) {
      console.log(`⚡ ${yellow}High burn rate detected - consider optimizing usage${reset}`);
      console.log();
    }

    // Status Line
    const currentTimeStr = new Date().toLocaleTimeString('en-US', { hour12: false });
    console.log(`⏰ ${gray}${currentTimeStr}${reset} 📝 ${cyan}Monitoring active...${reset} | ${gray}Ctrl+C to exit${reset} 🟨`);

    // Clear any remaining lines below
    process.stdout.write('\x1b[J');
  }

  private renderError(error: Error): void {
    const red = '\x1b[91m';
    const yellow = '\x1b[93m';
    const reset = '\x1b[0m';

    console.log(`${red}❌ Monitor Error:${reset} ${error.message}`);
    
    if (error.message.includes('ccusage')) {
      console.log(`${yellow}💡 Make sure 'ccusage' is installed and available in PATH${reset}`);
      console.log(`${yellow}   Install: pip install claude-cli${reset}`);
    }
  }

  public async start(): Promise<void> {
    if (this.isDisplaying) return;

    this.isDisplaying = true;
    this.hideCursor();

    // Clear screen initially
    console.clear();

    // Handle graceful shutdown
    const handleExit = () => {
      this.stop();
      this.showCursor();
      console.log('\n\n💙 Claude Token Monitor stopped.');
      console.clear();
      process.exit(0);
    };

    process.on('SIGINT', handleExit);
    process.on('SIGTERM', handleExit);

    // Start the monitor if not already running
    if (!this.monitor.isMonitoring()) {
      await this.monitor.start();
    }

    // Show initial display
    const stats = this.monitor.getLastStats();
    if (stats) {
      this.renderDisplay(stats);
    } else {
      console.log('🔄 Starting token monitor...');
    }
  }

  public stop(): void {
    this.isDisplaying = false;
    this.showCursor();
    
    if (this.displayProcess) {
      clearTimeout(this.displayProcess);
      this.displayProcess = undefined;
    }
  }
}

export class TokenMonitorWidget {
  private monitor: ClaudeTokenMonitor;
  private lastStats?: TokenStats;
  private hasError: boolean = false;

  constructor(monitor: ClaudeTokenMonitor) {
    this.monitor = monitor;
    this.monitor.on('stats', (stats: TokenStats) => {
      this.lastStats = stats;
      this.hasError = false;
    });
    this.monitor.on('error', () => {
      this.hasError = true;
    });
  }

  public getCompactDisplay(): string {
    if (this.hasError || !this.lastStats) {
      return '📊 Claude Token Monitor: Initializing...';
    }

    const { tokensUsed, tokensLeft, usagePercentage, burnRate } = this.lastStats;
    const velocityIcon = this.getVelocityIndicator(burnRate);
    
    return `📊 ${tokensUsed.toLocaleString()}/${(tokensUsed + tokensLeft).toLocaleString()} (${usagePercentage.toFixed(1)}%) ${velocityIcon} ${burnRate.toFixed(1)}/min`;
  }

  public getStatusLine(): string {
    if (this.hasError || !this.lastStats) {
      return '🔄 Searching for active Claude sessions...';
    }

    const { predictedEndTime, resetTime, usagePercentage } = this.lastStats;
    
    if (usagePercentage > 90) {
      return `🚨 High usage: ${usagePercentage.toFixed(1)}%`;
    }
    
    if (predictedEndTime < resetTime) {
      return `⚠️ Will run out before reset`;
    }
    
    return `✅ Normal usage`;
  }

  private getVelocityIndicator(burnRate: number): string {
    if (burnRate < 50) return '🐌';
    if (burnRate < 150) return '➡️';
    if (burnRate < 300) return '🚀';
    return '⚡';
  }
}
