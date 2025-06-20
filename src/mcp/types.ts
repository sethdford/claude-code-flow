/**
 * MCP-specific type definitions
 */

import { AgentProfile, Task, OrchestratorMetrics, MemoryQuery } from "../utils/types.js";

// Component interface definitions
export interface IOrchestrator {
  getStatus(): Promise<OrchestratorStatus>;
  listTasks(params: TaskListParams): Promise<Task[]>;
  createTask(task: Omit<Task, "id" | "createdAt">): Promise<Task>;
  cancelTask(taskId: string): Promise<void>;
  getTaskStatus(taskId: string): Promise<Task | undefined>;
  getMetrics(): Promise<OrchestratorMetrics>;
  registerAgent(profile: AgentProfile): Promise<string>;
  executeObjective(objective: string, options?: ObjectiveOptions): Promise<ObjectiveResult>;
  getObjectiveStatus(objectiveId: string): Promise<ObjectiveStatus>;
}

export interface ISwarmCoordinator {
  getStatus(): Promise<SwarmStatus>;
  listAgents(): Promise<SwarmAgent[]>;
  spawnAgent(profile: AgentProfile): Promise<string>;
  terminateAgent(agentId: string): Promise<void>;
  assignTask(agentId: string, task: Task): Promise<void>;
}

export interface IAgentManager {
  listAgents(): Promise<AgentInfo[]>;
  spawnAgent(profile: AgentProfile, config?: AgentConfig): Promise<string>;
  terminateAgent(agentId: string): Promise<void>;
  getAgentStatus(agentId: string): Promise<AgentInfo | undefined>;
}

export interface IResourceManager {
  listResources(): Promise<Resource[]>;
  getStatus(): Promise<ResourceManagerStatus>;
  allocateResource(resourceId: string, agentId: string): Promise<boolean>;
  releaseResource(resourceId: string): Promise<void>;
}

export interface IMemoryManager {
  query(params: MemoryQuery): Promise<MemoryQueryResult>;
  store(params: MemoryStoreParams): Promise<string>;
  delete(entryId: string): Promise<void>;
  getStats(): Promise<MemoryStats>;
}

export interface IMonitor {
  getMetrics(): Promise<SystemMetrics>;
  getAlerts(): Promise<Alert[]>;
  recordMetrics(component: string, metrics: Record<string, number>): void;
  sendAlert(alert: AlertParams): void;
  healthCheck(): Promise<HealthCheckResult>;
}

export interface ITerminalManager {
  listSessions(): Promise<TerminalSession[]>;
  execute(command: string, sessionId?: string): Promise<ExecutionResult>;
  createSession(): Promise<string>;
  closeSession(sessionId: string): Promise<void>;
}

// Parameter and result types
export interface TaskListParams {
  status?: "pending" | "running" | "completed" | "failed";
  limit?: number;
  offset?: number;
  agentId?: string;
}

export interface OrchestratorStatus {
  running: boolean;
  uptime: number;
  totalAgents: number;
  activeAgents: number;
  queuedTasks: number;
  metrics?: OrchestratorMetrics;
}

export interface ObjectiveOptions {
  maxAgents?: number;
  timeout?: number;
  strategy?: string;
}

export interface ObjectiveResult {
  objectiveId: string;
  status: "started" | "running" | "completed" | "failed";
  result?: unknown;
  error?: string;
}

export interface ObjectiveStatus {
  objectiveId: string;
  status: "pending" | "running" | "completed" | "failed";
  progress: number;
  agents: string[];
  tasks: string[];
  result?: unknown;
  error?: string;
}

export interface SwarmStatus {
  active: boolean;
  totalAgents: number;
  activeAgents: number;
  idleAgents: number;
  totalTasks: number;
  completedTasks: number;
}

export interface SwarmAgent {
  id: string;
  name: string;
  type: string;
  status: "active" | "idle" | "terminated";
  currentTask?: string;
  capabilities: string[];
}

export interface AgentInfo {
  id: string;
  name: string;
  type: string;
  status: string;
  profile: AgentProfile;
  createdAt: Date;
  lastActivity?: Date;
}

export interface AgentConfig {
  maxConcurrentTasks?: number;
  timeout?: number;
  retryAttempts?: number;
}

export interface Resource {
  id: string;
  type: string;
  name: string;
  status: "available" | "allocated" | "unavailable";
  allocatedTo?: string;
  metadata?: Record<string, unknown>;
}

export interface ResourceManagerStatus {
  totalResources: number;
  availableResources: number;
  allocatedResources: number;
  resourcesByType: Record<string, number>;
}

export interface MemoryQueryResult {
  entries: Array<{
    id: string;
    content: string;
    metadata: Record<string, unknown>;
    timestamp: Date;
  }>;
  total: number;
  offset: number;
  limit: number;
}

export interface MemoryStoreParams {
  data: Record<string, unknown>;
  namespace?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface MemoryStats {
  totalEntries: number;
  totalSize: number;
  namespaces: string[];
  entryCountByNamespace: Record<string, number>;
}

export interface SystemMetrics {
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  requests: {
    total: number;
    perSecond: number;
    averageLatency: number;
  };
  errors: {
    total: number;
    rate: number;
  };
}

export interface Alert {
  id: string;
  severity: "info" | "warning" | "error" | "critical";
  component: string;
  message: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface AlertParams {
  source: string;
  severity: "info" | "warning" | "error" | "critical";
  message: string;
  metadata?: Record<string, unknown>;
}

export interface HealthCheckResult {
  healthy: boolean;
  components: Record<string, { healthy: boolean; message?: string }>;
}

export interface TerminalSession {
  id: string;
  pid?: number;
  status: "active" | "idle" | "closed";
  createdAt: Date;
  lastActivity: Date;
}

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  duration: number;
}

// Tool input types
export interface SpawnAgentInput {
  name: string;
  type: string;
  capabilities?: string[];
  systemPrompt?: string;
  maxConcurrentTasks?: number;
  priority?: number;
}

export interface ListAgentsInput {
  status?: string;
  filterByType?: string;
}

export interface CreateTaskInput {
  type: string;
  description: string;
  priority?: number;
  assignedAgent?: string;
  input?: Record<string, unknown>;
  dependencies?: string[];
}

export interface ListTasksInput {
  status?: string;
  agentId?: string;
  limit?: number;
  offset?: number;
}

export interface MemoryQueryInput {
  query: string;
  namespace?: string;
  limit?: number;
}

export interface MemoryStoreInput {
  key: string;
  value: unknown;
  namespace?: string;
  tags?: string[];
}

export interface ExecuteCommandInput {
  command: string;
  sessionId?: string;
  cwd?: string;
  env?: Record<string, string>;
  timeout?: number;
}

export interface WorkflowExecuteInput {
  file: string;
  params?: Record<string, unknown>;
}

export interface CreateObjectiveInput {
  objective: string;
  strategy?: string;
  maxAgents?: number;
  timeout?: number;
  priority?: number;
}

export interface SystemMonitorInput {
  component?: string;
  metrics?: string[];
  interval?: number;
}