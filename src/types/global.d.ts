/// <reference types="node" />

/**
 * Global type definitions for missing types
 */

// Node.js fs compatibility types
declare function existsSync(path: string): boolean;

// Command type for CLI compatibility
export interface Command {
  name: string;
  description?: string;
  version?: string;
  arguments?: string;
  options?: Array<{
    flags: string;
    description?: string;
    default?: unknown;
  }>;
  action?: (...args: unknown[]) => void | Promise<void>;
  command?: (name: string, description?: string) => Command;
  option?: (flags: string, description?: string, defaultValue?: unknown) => Command;
  parse?: (argv?: string[]) => void | Promise<void>;
}

// Logger interface
export interface Logger {
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
  debug(message: string, ...args: unknown[]): void;
}

// Export for use across the codebase
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      ANTHROPIC_API_KEY?: string;
      OPENAI_API_KEY?: string;
      CLAUDE_FLOW_DEBUG?: string;
      CLAUDE_FLOW_LOG_LEVEL?: string;
      CLAUDE_FLOW_CONFIG?: string;
      NODE_ENV?: "development" | "production" | "test";
      
      // AWS Bedrock Configuration for Claude Code
      CLAUDE_CODE_USE_BEDROCK?: string;
      AWS_REGION?: string;
      AWS_ACCESS_KEY_ID?: string;
      AWS_SECRET_ACCESS_KEY?: string;
      AWS_SESSION_TOKEN?: string;
      AWS_PROFILE?: string;
      ANTHROPIC_MODEL?: string;
      ANTHROPIC_SMALL_FAST_MODEL?: string;
    }
    
    // Timer types
    interface Timeout {
      ref(): this;
      unref(): this;
      hasRef(): boolean;
      refresh(): this;
      [Symbol.toPrimitive](): number;
    }
    
    interface Timer extends Timeout {
      hasRef(): boolean;
      ref(): this;
      refresh(): this;
      unref(): this;
    }
    
    // Error types
    interface ErrnoException extends Error {
      errno?: number | undefined;
      code?: string | undefined;
      path?: string | undefined;
      syscall?: string | undefined;
    }
  }

  interface Window {
    claudeFlow?: Record<string, unknown>;
  }
}