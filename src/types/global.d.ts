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
  interface Window {
    Deno?: any;
  }
}