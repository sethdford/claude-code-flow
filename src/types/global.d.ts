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
    default?: any;
  }>;
  action?: (...args: any[]) => void | Promise<void>;
  command?: (name: string, description?: string) => Command;
  option?: (flags: string, description?: string, defaultValue?: any) => Command;
  parse?: (argv?: string[]) => void | Promise<void>;
}

// Logger interface
export interface Logger {
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
  debug(message: string, ...args: any[]): void;
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
    }
  }

  interface Window {
    claudeFlow?: any;
  }
}