/**
 * Shared type definitions for CLI commands
 */

import type { AgentManager } from "../../agents/agent-manager.js";
// import type { SwarmManager } from "../../swarm/manager.js"; // File doesn't exist yet
import type { MemoryManager } from "../../memory/manager.js";
import type { TaskEngine } from "../../task/engine.js";

// Base command options that all commands extend
export interface BaseCommandOptions {
  verbose?: boolean;
  quiet?: boolean;
  json?: boolean;
  debug?: boolean;
}

// Agent command options
export interface AgentListOptions extends BaseCommandOptions {
  type?: string;
  status?: string;
  unhealthy?: boolean;
  detailed?: boolean;
  sort?: "name" | "type" | "status" | "health" | "workload";
}

export interface AgentSpawnOptions extends BaseCommandOptions {
  name?: string;
  type?: string;
  template?: string;
  pool?: string;
  env?: Record<string, string>;
  memory?: Record<string, any>;
  restart?: boolean;
  detached?: boolean;
  interactive?: boolean;
  autoScale?: boolean;
  config?: string;
  autonomy?: string;
  maxTasks?: string;
  timeout?: string;
  maxMemory?: string;
  start?: boolean;
  resources?: {
    cpu?: number;
    memory?: string;
    gpu?: boolean;
  };
}

export interface AgentInfo {
  id: { id: string; instance: string };
  name: string;
  type: string;
  status: string;
  health: number;
  workload: number;
  lastHeartbeat: Date;
  pid?: number;
  startTime?: number;
  lastUpdate?: number;
  memory?: Record<string, any>;
  metrics?: AgentMetrics;
  config: {
    autonomyLevel: number;
    maxConcurrentTasks: number;
    timeoutThreshold: number;
  };
  environment: {
    runtime: string;
    workingDirectory: string;
  };
  taskHistory?: Array<{
    type: string;
    status: string;
    timestamp: Date;
  }>;
}

export interface AgentMetrics {
  cpu: number;
  memory: number;
  requestsHandled: number;
  errors: number;
  responseTime: number;
  tasksCompleted: number;
  tasksFailed: number;
  successRate: number;
  averageExecutionTime: number;
  cpuUsage: number;
  memoryUsage: number;
  totalUptime: number;
}

// Config command options
export interface ConfigShowOptions extends BaseCommandOptions {
  format?: "json" | "yaml";
  diff?: boolean;
  profile?: boolean;
}

export interface ConfigSetOptions extends BaseCommandOptions {
  type?: "string" | "number" | "boolean" | "json" | "auto";
  reason?: string;
  force?: boolean;
}

// Memory command options
export interface MemoryStoreOptions extends BaseCommandOptions {
  type?: "json" | "text" | "binary";
  ttl?: number;
  tags?: string[];
  embed?: boolean;
  priority?: "low" | "medium" | "high";
  compress?: boolean;
}

export interface MemoryGetOptions extends BaseCommandOptions {
  raw?: boolean;
}

export interface MemoryListOptions extends BaseCommandOptions {
  pattern?: string;
  tags?: string[];
  before?: string;
  after?: string;
  limit?: number;
  sortBy?: "key" | "created" | "updated" | "size";
  reverse?: boolean;
}

export interface MemorySearchOptions extends BaseCommandOptions {
  type?: "text" | "semantic" | "pattern";
  maxResults?: number;
  threshold?: number;
  includeMetadata?: boolean;
}

export interface MemoryKey {
  key: string;
  type: string;
  size: number;
  created: Date;
  updated: Date;
  accessed: Date;
  ttl?: number;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface MemoryStatistics {
  totalKeys: number;
  totalSize: number;
  types: Record<string, number>;
  avgKeySize: number;
  oldestKey: Date;
  newestKey: Date;
  accessPattern: {
    hot: number;
    warm: number;
    cold: number;
  };
}

// Swarm command options
export interface SwarmOptions extends BaseCommandOptions {
  strategy?: "research" | "development" | "analysis" | "testing" | "optimization" | "maintenance";
  mode?: "centralized" | "distributed" | "hierarchical" | "mesh" | "hybrid";
  maxAgents?: number;
  parallel?: boolean;
  monitor?: boolean;
  output?: "json" | "sqlite" | "csv" | "html";
  timeout?: number;
  checkpoint?: boolean;
  resume?: string;
}

// Task command options
export interface TaskOptions extends BaseCommandOptions {
  priority?: "low" | "medium" | "high" | "critical";
  assignTo?: string;
  dependsOn?: string[];
  schedule?: string;
  retries?: number;
  timeout?: number;
  parallel?: boolean;
}

// Workflow command options
export interface WorkflowOptions extends BaseCommandOptions {
  validate?: boolean;
  dryRun?: boolean;
  watch?: boolean;
  parallel?: boolean;
  checkpoint?: boolean;
  resume?: string;
  vars?: Record<string, any>;
}

// SPARC command options
export interface SparcOptions extends BaseCommandOptions {
  mode?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  tools?: string[];
  memory?: boolean;
  chain?: boolean;
}

// MCP command options
export interface McpStartOptions extends BaseCommandOptions {
  port?: number;
  host?: string;
  transport?: "stdio" | "http" | "websocket";
  auth?: boolean;
  cors?: boolean;
  ssl?: boolean;
  cert?: string;
  key?: string;
}

// Session command options
export interface SessionOptions extends BaseCommandOptions {
  name?: string;
  shell?: string;
  cwd?: string;
  env?: Record<string, string>;
  attach?: boolean;
  create?: boolean;
}

// Monitor command options
export interface MonitorOptions extends BaseCommandOptions {
  interval?: number;
  metrics?: string[];
  alerts?: boolean;
  export?: string;
}

// Status command options
export interface StatusOptions extends BaseCommandOptions {
  services?: boolean;
  agents?: boolean;
  memory?: boolean;
  tasks?: boolean;
  health?: boolean;
  extended?: boolean;
}

// Type guards
export function isAgentListOptions(options: any): options is AgentListOptions {
  return options && (
    options.type !== undefined ||
    options.status !== undefined ||
    options.unhealthy !== undefined ||
    options.detailed !== undefined ||
    options.sort !== undefined
  );
}

export function isMemoryKey(obj: any): obj is MemoryKey {
  return obj && 
    typeof obj.key === "string" &&
    typeof obj.type === "string" &&
    typeof obj.size === "number";
}

// Command context type
export interface CommandContext {
  agentManager?: AgentManager;
  // swarmManager?: SwarmManager; // Commented out until file exists
  memoryManager?: MemoryManager;
  taskEngine?: TaskEngine;
  config?: Record<string, any>;
}

// Error types
export class CommandError extends Error {
  constructor(message: string, public code: string = "COMMAND_ERROR") {
    super(message);
    this.name = "CommandError";
  }
}

export class ValidationError extends CommandError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

// Utility types
export type SortDirection = "asc" | "desc";
export type OutputFormat = "text" | "json" | "yaml" | "table";
export type LogLevel = "debug" | "info" | "warn" | "error";

// Agent template types
export interface AgentTemplate {
  name: string;
  type: string;
  description?: string;
  capabilities?: string[];
  defaultConfig?: Record<string, any>;
}

// Pool configuration
export interface PoolConfig {
  name: string;
  template: string;
  minSize: number;
  maxSize: number;
  scalingPolicy?: "manual" | "auto" | "scheduled";
  healthCheck?: {
    interval: number;
    timeout: number;
    retries: number;
  };
}