/**
 * Claude AI Token Usage Monitor
 * Real-time monitoring of Claude token consumption with burn rate analysis
 * Based on: https://github.com/Maciek-roboblog/Claude-Code-Usage-Monitor
 */

import { spawn } from "child_process";
import { EventEmitter } from "events";
import { logger } from "../core/logger.js";

export interface TokenBlock {
  startTime: string;
  actualEndTime?: string;
  totalTokens: number;
  isActive: boolean;
  isGap: boolean;
}

export interface TokenUsageData {
  blocks: TokenBlock[];
}

export interface TokenStats {
  tokensUsed: number;
  tokensLeft: number;
  usagePercentage: number;
  burnRate: number; // tokens per minute
  sessionDuration: number; // minutes
  timeToReset: number; // minutes
  predictedEndTime: Date;
  resetTime: Date;
}

export interface MonitorConfig {
  plan: 'pro' | 'max5' | 'max20' | 'custom_max';
  resetHour?: number;
  timezone: string;
  updateInterval: number; // seconds
}

export class ClaudeTokenMonitor extends EventEmitter {
  private config: MonitorConfig;
  private tokenLimit: number;
  private isRunning: boolean = false;
  private monitorProcess?: NodeJS.Timeout;
  private lastStats?: TokenStats;

  constructor(config: Partial<MonitorConfig> = {}) {
    super();
    
    this.config = {
      plan: 'pro',
      timezone: 'UTC',
      updateInterval: 3,
      ...config
    };

    this.tokenLimit = this.getTokenLimit(this.config.plan);
  }

  private getTokenLimit(plan: string): number {
    const limits = {
      'pro': 7000,
      'max5': 35000,
      'max20': 140000,
      'custom_max': 7000 // Will be auto-detected
    };
    return limits[plan as keyof typeof limits] || 7000;
  }

  private async runCCUsage(): Promise<TokenUsageData | null> {
    // Try newer Claude Code CLI first
    const claudeData = await this.tryClaudeCodeMetrics();
    if (claudeData) {
      return claudeData;
    }

    // Fallback to legacy ccusage if available
    return new Promise((resolve) => {
      const process = spawn('ccusage', ['blocks', '--json'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          try {
            const data = JSON.parse(stdout);
            resolve(data);
          } catch (error) {
            // Silently fail - no JSON logging
            resolve(null);
          }
        } else {
          // Silently fail - no JSON logging
          resolve(null);
        }
      });

      process.on('error', (error) => {
        // Silently fail - no JSON logging
        resolve(null);
      });
    });
  }

  private async tryClaudeCodeMetrics(): Promise<TokenUsageData | null> {
    try {
      // Check for Claude Code logs/metrics
      const fs = await import('fs/promises');
      const path = await import('path');
      const os = await import('os');
      
      // Try to find Claude Code configuration directory
      const homeDir = os.homedir();
      const configDirs = [
        path.join(homeDir, '.config', 'claude'),
        path.join(homeDir, '.claude'),
        path.join(homeDir, 'Library', 'Application Support', 'ClaudeCode'),
      ];

      for (const configDir of configDirs) {
        try {
          const stats = await fs.stat(configDir);
          if (stats.isDirectory()) {
            const sessionData = await this.parseClaudeCodeSessions(configDir);
            if (sessionData) {
              return sessionData;
            }
          }
        } catch (error) {
          // Directory doesn't exist, continue
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  private async parseClaudeCodeSessions(configDir: string): Promise<TokenUsageData | null> {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      // Look for session files or logs
      const sessionsDir = path.join(configDir, 'sessions');
      
      try {
        const sessionFiles = await fs.readdir(sessionsDir);
        const blocks: TokenBlock[] = [];
        const now = new Date();
        
        for (const file of sessionFiles) {
          if (file.endsWith('.json')) {
            try {
              const filePath = path.join(sessionsDir, file);
              const content = await fs.readFile(filePath, 'utf-8');
              const sessionData = JSON.parse(content);
              
              // Parse session data to extract token usage
              const block = this.parseSessionToBlock(sessionData, now);
              if (block) {
                blocks.push(block);
              }
            } catch (error) {
              // Skip invalid session files
            }
          }
        }

        if (blocks.length > 0) {
          return { blocks };
        }
      } catch (error) {
        // Sessions directory doesn't exist or can't be read
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  private parseSessionToBlock(sessionData: any, currentTime: Date): TokenBlock | null {
    try {
      // Extract token usage from Claude Code session data
      let totalTokens = 0;
      let startTime = currentTime.toISOString();
      let endTime: string | undefined;
      let isActive = false;

      // Look for token usage in various possible formats
      if (sessionData.messages && Array.isArray(sessionData.messages)) {
        for (const message of sessionData.messages) {
          if (message.usage) {
            totalTokens += (message.usage.input_tokens || 0);
            totalTokens += (message.usage.output_tokens || 0);
            totalTokens += (message.usage.cache_creation_tokens || 0);
            totalTokens += (message.usage.cache_read_tokens || 0);
          }
          
          // Track timing
          if (message.timestamp || message.created_at) {
            const msgTime = message.timestamp || message.created_at;
            if (!startTime || msgTime < startTime) {
              startTime = msgTime;
            }
            if (!endTime || msgTime > endTime) {
              endTime = msgTime;
            }
          }
        }
      }

      // Check if session is active (recent activity within last 5 hours)
      const fiveHoursAgo = new Date(currentTime.getTime() - 5 * 60 * 60 * 1000);
      const sessionStart = new Date(startTime);
      isActive = sessionStart > fiveHoursAgo;

      if (totalTokens > 0) {
        return {
          startTime,
          actualEndTime: endTime,
          totalTokens,
          isActive,
          isGap: false
        };
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  private calculateHourlyBurnRate(blocks: TokenBlock[], currentTime: Date): number {
    if (!blocks.length) return 0;

    const oneHourAgo = new Date(currentTime.getTime() - 60 * 60 * 1000);
    let totalTokens = 0;

    for (const block of blocks) {
      if (block.isGap) continue;

      const startTime = new Date(block.startTime);
      let sessionEnd: Date;

      if (block.isActive) {
        sessionEnd = currentTime;
      } else if (block.actualEndTime) {
        sessionEnd = new Date(block.actualEndTime);
      } else {
        sessionEnd = currentTime;
      }

      // Skip sessions that ended before the last hour
      if (sessionEnd < oneHourAgo) continue;

      // Calculate overlap with the last hour
      const sessionStartInHour = new Date(Math.max(startTime.getTime(), oneHourAgo.getTime()));
      const sessionEndInHour = new Date(Math.min(sessionEnd.getTime(), currentTime.getTime()));

      if (sessionEndInHour <= sessionStartInHour) continue;

      // Calculate portion of tokens used in the last hour
      const totalSessionDuration = (sessionEnd.getTime() - startTime.getTime()) / (1000 * 60);
      const hourDuration = (sessionEndInHour.getTime() - sessionStartInHour.getTime()) / (1000 * 60);

      if (totalSessionDuration > 0) {
        const tokensInHour = block.totalTokens * (hourDuration / totalSessionDuration);
        totalTokens += tokensInHour;
      }
    }

    return totalTokens / 60; // tokens per minute
  }

  private getNextResetTime(currentTime: Date): Date {
    const resetHours = this.config.resetHour ? [this.config.resetHour] : [4, 9, 14, 18, 23];
    const current = new Date(currentTime);
    
    // Find next reset hour
    for (const hour of resetHours) {
      const resetTime = new Date(current);
      resetTime.setHours(hour, 0, 0, 0);
      
      if (resetTime > current) {
        return resetTime;
      }
    }

    // If no reset today, use first one tomorrow
    const tomorrow = new Date(current);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(resetHours[0], 0, 0, 0);
    return tomorrow;
  }

  private async calculateStats(data: TokenUsageData): Promise<TokenStats | null> {
    const activeBlock = data.blocks.find(block => block.isActive);
    if (!activeBlock) return null;

    const currentTime = new Date();
    const tokensUsed = activeBlock.totalTokens;
    
    // Auto-detect custom_max if needed
    if (this.config.plan === 'custom_max') {
      const maxTokens = Math.max(...data.blocks
        .filter(block => !block.isGap && !block.isActive)
        .map(block => block.totalTokens));
      if (maxTokens > this.tokenLimit) {
        this.tokenLimit = maxTokens;
      }
    }

    const tokensLeft = Math.max(0, this.tokenLimit - tokensUsed);
    const usagePercentage = (tokensUsed / this.tokenLimit) * 100;
    
    const burnRate = this.calculateHourlyBurnRate(data.blocks, currentTime);
    
    const startTime = new Date(activeBlock.startTime);
    const sessionDuration = (currentTime.getTime() - startTime.getTime()) / (1000 * 60);
    
    const resetTime = this.getNextResetTime(currentTime);
    const timeToReset = (resetTime.getTime() - currentTime.getTime()) / (1000 * 60);
    
    let predictedEndTime: Date;
    if (burnRate > 0 && tokensLeft > 0) {
      const minutesToDepletion = tokensLeft / burnRate;
      predictedEndTime = new Date(currentTime.getTime() + minutesToDepletion * 60 * 1000);
    } else {
      predictedEndTime = resetTime;
    }

    return {
      tokensUsed,
      tokensLeft,
      usagePercentage,
      burnRate,
      sessionDuration,
      timeToReset,
      predictedEndTime,
      resetTime
    };
  }

  public async start(): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;
    this.emit('started');

    const monitor = async () => {
      if (!this.isRunning) return;

      try {
        const data = await this.runCCUsage();
        if (data) {
          const stats = await this.calculateStats(data);
          if (stats) {
            this.lastStats = stats;
            this.emit('stats', stats);
          }
        }
      } catch (error) {
        // Silently handle errors - emit error event but don't log JSON
        this.emit('error', error);
      }

      if (this.isRunning) {
        this.monitorProcess = setTimeout(monitor, this.config.updateInterval * 1000);
      }
    };

    await monitor();
  }

  public stop(): void {
    this.isRunning = false;
    if (this.monitorProcess) {
      clearTimeout(this.monitorProcess);
      this.monitorProcess = undefined;
    }
    this.emit('stopped');
  }

  public getLastStats(): TokenStats | undefined {
    return this.lastStats;
  }

  public isMonitoring(): boolean {
    return this.isRunning;
  }

  public updateConfig(config: Partial<MonitorConfig>): void {
    this.config = { ...this.config, ...config };
    this.tokenLimit = this.getTokenLimit(this.config.plan);
  }
}

export function formatTime(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
}

export function createProgressBar(percentage: number, width: number = 50): string {
  const filled = Math.round(width * percentage / 100);
  const empty = width - filled;
  
  const greenBar = '█'.repeat(filled);
  const redBar = '░'.repeat(empty);
  
  // ANSI color codes
  const green = '\x1b[92m';
  const red = '\x1b[91m';
  const reset = '\x1b[0m';
  
  return `🟢 [${green}${greenBar}${red}${redBar}${reset}] ${percentage.toFixed(1)}%`;
}

export function createTimeProgressBar(elapsed: number, total: number, width: number = 50): string {
  const percentage = Math.min(100, (elapsed / total) * 100);
  const filled = Math.round(width * percentage / 100);
  const empty = width - filled;
  
  const blueBar = '█'.repeat(filled);
  const redBar = '░'.repeat(empty);
  
  // ANSI color codes
  const blue = '\x1b[94m';
  const red = '\x1b[91m';
  const reset = '\x1b[0m';
  
  const remainingTime = formatTime(Math.max(0, total - elapsed));
  return `⏰ [${blue}${blueBar}${red}${redBar}${reset}] ${remainingTime}`;
}
