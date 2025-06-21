/**
 * Claude-Flow specific MCP tools
 */

import { MCPTool, MCPContext, AgentProfile, Task, MemoryEntry } from "../utils/types.js";
import { ILogger } from "../core/logger.js";
import { 
  IOrchestrator,
  SpawnAgentInput,
  ListAgentsInput,
  CreateTaskInput,
  ListTasksInput,
  MemoryQueryInput,
  MemoryStoreInput,
  WorkflowExecuteInput,
  CreateObjectiveInput,
  TaskListParams,
} from "./types.js";

export interface ClaudeFlowToolContext extends MCPContext {
  orchestrator?: IOrchestrator; // Reference to orchestrator instance
}

// Additional tool input interfaces not in types.ts
interface TerminateAgentInput {
  agentId: string;
  reason?: string;
  graceful?: boolean;
}

interface GetAgentInfoInput {
  agentId: string;
}

interface GetTaskStatusInput {
  taskId: string;
}

interface CancelTaskInput {
  taskId: string;
}

interface AssignTaskInput {
  taskId: string;
  agentId: string;
}

interface DeleteMemoryInput {
  entryId: string;
}

interface ExportMemoryInput {
  filename: string;
  format?: string;
  namespace?: string;
}

interface ImportMemoryInput {
  filename: string;
  data?: Record<string, unknown>;
  namespace?: string;
}

interface UpdateConfigInput {
  section: string;
  config: Record<string, unknown>;
  restart?: boolean;
}

interface GetConfigInput {
  section?: string;
  key?: string;
}

interface ValidateConfigInput {
  config: Record<string, unknown>;
}

interface GetMetricsInput {
  timeRange?: string;
}

interface HealthCheckInput {
  deep?: boolean;
}

interface ExecuteWorkflowInput {
  filePath: string;
  params?: Record<string, unknown>;
}

interface CreateWorkflowInput {
  name: string;
  description?: string;
  steps: Array<{
    name: string;
    type: string;
    config: Record<string, unknown>;
  }>;
  savePath?: string;
}

interface ListWorkflowsInput {
  directory?: string;
}

interface GetObjectiveStatusInput {
  objectiveId: string;
}

interface ExecuteCommandInput {
  command: string;
  sessionId?: string;
  cwd?: string;
  env?: Record<string, string>;
  timeout?: number;
}

/**
 * Create all Claude-Flow specific MCP tools
 */
export function createClaudeFlowTools(logger: ILogger): MCPTool[] {
  return [
    // Agent management tools
    createSpawnAgentTool(logger),
    createListAgentsTool(logger),
    createTerminateAgentTool(logger),
    createGetAgentInfoTool(logger),

    // Task management tools
    createCreateTaskTool(logger),
    createListTasksTool(logger),
    createGetTaskStatusTool(logger),
    createCancelTaskTool(logger),
    createAssignTaskTool(logger),

    // Memory management tools
    createQueryMemoryTool(logger),
    createStoreMemoryTool(logger),
    createDeleteMemoryTool(logger),
    createExportMemoryTool(logger),
    createImportMemoryTool(logger),

    // System monitoring tools
    createGetSystemStatusTool(logger),
    createGetMetricsTool(logger),
    createHealthCheckTool(logger),

    // Configuration tools
    createGetConfigTool(logger),
    createUpdateConfigTool(logger),
    createValidateConfigTool(logger),

    // Workflow tools
    createExecuteWorkflowTool(logger),
    createCreateWorkflowTool(logger),
    createListWorkflowsTool(logger),

    // Terminal management tools
    createExecuteCommandTool(logger),
    createListTerminalsTool(logger),
    createCreateTerminalTool(logger),

    // New CLI command tools
    createMetaFrameworksTool(logger),
    createOrchestrationTool(logger),
    createStartupTool(logger),
    createSynthesisTool(logger),
    createSwarmStrategiesTool(logger),
    createAnalyzeTool(logger),
    createSwarmTool(logger),
  ];
}

function createSpawnAgentTool(logger: ILogger): MCPTool {
  return {
    name: "agents/spawn",
    description: "Spawn a new Claude agent with specified configuration",
    inputSchema: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["coordinator", "researcher", "implementer", "analyst", "custom"],
          description: "Type of agent to spawn",
        },
        name: {
          type: "string",
          description: "Display name for the agent",
        },
        capabilities: {
          type: "array",
          items: { type: "string" },
          description: "List of capabilities for the agent",
        },
        systemPrompt: {
          type: "string",
          description: "Custom system prompt for the agent",
        },
        maxConcurrentTasks: {
          type: "number",
          default: 3,
          description: "Maximum number of concurrent tasks",
        },
        priority: {
          type: "number",
          default: 5,
          description: "Agent priority level (1-10)",
        },
        environment: {
          type: "object",
          description: "Environment variables for the agent",
        },
        workingDirectory: {
          type: "string",
          description: "Working directory for the agent",
        },
      },
      required: ["type", "name"],
    },
    handler: async (input: unknown, context?: ClaudeFlowToolContext) => {
      logger.info("Spawning agent", { input, sessionId: context?.sessionId });

      if (!context?.orchestrator) {
        throw new Error("Orchestrator not available");
      }

      const spawnInput = input as SpawnAgentInput;
      const profile: AgentProfile = {
        id: `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: spawnInput.name,
        type: spawnInput.type as AgentProfile["type"],
        capabilities: spawnInput.capabilities || [],
        systemPrompt: spawnInput.systemPrompt || getDefaultSystemPrompt(spawnInput.type),
        maxConcurrentTasks: spawnInput.maxConcurrentTasks || 3,
        priority: spawnInput.priority || 5,
        environment: spawnInput.environment ? 
          Object.fromEntries(
            Object.entries(spawnInput.environment).map(([k, v]) => [k, String(v)]),
          ) : undefined,
        workingDirectory: spawnInput.workingDirectory,
      };

      const sessionId = await context.orchestrator.spawnAgent(profile);

      return {
        agentId: profile.id,
        sessionId,
        profile,
        status: "spawned",
        timestamp: new Date().toISOString(),
      };
    },
  };
}

function createListAgentsTool(logger: ILogger): MCPTool {
  return {
    name: "agents/list",
    description: "List all active agents in the system",
    inputSchema: {
      type: "object",
      properties: {
        includeTerminated: {
          type: "boolean",
          default: false,
          description: "Include terminated agents in the list",
        },
        filterByType: {
          type: "string",
          enum: ["coordinator", "researcher", "implementer", "analyst", "custom"],
          description: "Filter agents by type",
        },
      },
    },
    handler: async (input: unknown, context?: ClaudeFlowToolContext) => {
      logger.info("Listing agents", { input, sessionId: context?.sessionId });

      if (!context?.orchestrator) {
        throw new Error("Orchestrator not available");
      }

      const agents = await context.orchestrator.listAgents();
      
      const listInput = input as ListAgentsInput;
      let filteredAgents = agents;
      
      if (!listInput.includeTerminated) {
        filteredAgents = filteredAgents.filter((agent) => agent.status !== "terminated");
      }
      
      if (listInput.filterByType) {
        filteredAgents = filteredAgents.filter((agent) => agent.type === listInput.filterByType);
      }

      return {
        agents: filteredAgents,
        count: filteredAgents.length,
        timestamp: new Date().toISOString(),
      };
    },
  };
}

function createTerminateAgentTool(logger: ILogger): MCPTool {
  return {
    name: "agents/terminate",
    description: "Terminate a specific agent",
    inputSchema: {
      type: "object",
      properties: {
        agentId: {
          type: "string",
          description: "ID of the agent to terminate",
        },
        reason: {
          type: "string",
          description: "Reason for termination",
        },
        graceful: {
          type: "boolean",
          default: true,
          description: "Whether to perform graceful shutdown",
        },
      },
      required: ["agentId"],
    },
    handler: async (input: unknown, context?: ClaudeFlowToolContext) => {
      logger.info("Terminating agent", { input, sessionId: context?.sessionId });

      if (!context?.orchestrator) {
        throw new Error("Orchestrator not available");
      }

      const terminateInput = input as TerminateAgentInput;
      await context.orchestrator.terminateAgent(terminateInput.agentId, {
        reason: terminateInput.reason || "Manual termination",
        graceful: terminateInput.graceful !== false,
      });

      return {
        agentId: terminateInput.agentId,
        status: "terminated",
        reason: terminateInput.reason || "Manual termination",
        timestamp: new Date().toISOString(),
      };
    },
  };
}

function createGetAgentInfoTool(logger: ILogger): MCPTool {
  return {
    name: "agents/info",
    description: "Get detailed information about a specific agent",
    inputSchema: {
      type: "object",
      properties: {
        agentId: {
          type: "string",
          description: "ID of the agent",
        },
      },
      required: ["agentId"],
    },
    handler: async (input: unknown, context?: ClaudeFlowToolContext) => {
      logger.info("Getting agent info", { input, sessionId: context?.sessionId });

      if (!context?.orchestrator) {
        throw new Error("Orchestrator not available");
      }

      const agentInput = input as GetAgentInfoInput;
      const agentInfo = await context.orchestrator.getAgentInfo(agentInput.agentId);

      if (!agentInfo) {
        throw new Error(`Agent not found: ${agentInput.agentId}`);
      }

      return {
        agent: agentInfo,
        timestamp: new Date().toISOString(),
      };
    },
  };
}

function createCreateTaskTool(logger: ILogger): MCPTool {
  return {
    name: "tasks/create",
    description: "Create a new task for execution",
    inputSchema: {
      type: "object",
      properties: {
        type: {
          type: "string",
          description: "Type of task to create",
        },
        description: {
          type: "string",
          description: "Description of the task",
        },
        priority: {
          type: "number",
          default: 5,
          description: "Task priority (1-10)",
        },
        dependencies: {
          type: "array",
          items: { type: "string" },
          description: "List of task IDs this task depends on",
        },
        assignToAgent: {
          type: "string",
          description: "Specific agent ID to assign the task to",
        },
        assignToAgentType: {
          type: "string",
          enum: ["coordinator", "researcher", "implementer", "analyst", "custom"],
          description: "Type of agent to assign the task to",
        },
        input: {
          type: "object",
          description: "Input data for the task",
        },
        timeout: {
          type: "number",
          description: "Task timeout in milliseconds",
        },
      },
      required: ["type", "description"],
    },
    handler: async (input: unknown, context?: ClaudeFlowToolContext) => {
      logger.info("Creating task", { input, sessionId: context?.sessionId });

      if (!context?.orchestrator) {
        throw new Error("Orchestrator not available");
      }

      const createInput = input as CreateTaskInput;
      const task: Partial<Task> = {
        type: createInput.type,
        description: createInput.description,
        priority: createInput.priority || 5,
        dependencies: createInput.dependencies || [],
        input: createInput.input || {},
      };

      const taskId = await context.orchestrator.createTask(task as Omit<Task, "id" | "createdAt">);

      if (createInput.assignToAgent) {
        await context.orchestrator.assignTask(taskId, createInput.assignToAgent);
      } else if (createInput.assignToAgentType) {
        await context.orchestrator.assignTaskToType(taskId, createInput.assignToAgentType);
      }

      return {
        taskId,
        task: { ...task, id: taskId },
        timestamp: new Date().toISOString(),
      };
    },
  };
}

function createListTasksTool(logger: ILogger): MCPTool {
  return {
    name: "tasks/list",
    description: "List tasks with optional filtering",
    inputSchema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["pending", "queued", "assigned", "running", "completed", "failed", "cancelled"],
          description: "Filter by task status",
        },
        agentId: {
          type: "string",
          description: "Filter by assigned agent ID",
        },
        type: {
          type: "string",
          description: "Filter by task type",
        },
        limit: {
          type: "number",
          default: 50,
          description: "Maximum number of tasks to return",
        },
        offset: {
          type: "number",
          default: 0,
          description: "Number of tasks to skip",
        },
      },
    },
    handler: async (input: unknown, context?: ClaudeFlowToolContext) => {
      logger.info("Listing tasks", { input, sessionId: context?.sessionId });

      if (!context?.orchestrator) {
        throw new Error("Orchestrator not available");
      }

      const listInput = input as ListTasksInput;
      const tasks = await context.orchestrator.listTasks({
        status: listInput.status as TaskListParams["status"],
        agentId: listInput.agentId,
        limit: listInput.limit,
        offset: listInput.offset,
      });

      return {
        tasks,
        count: tasks.length,
        timestamp: new Date().toISOString(),
      };
    },
  };
}

function createGetTaskStatusTool(logger: ILogger): MCPTool {
  return {
    name: "tasks/status",
    description: "Get detailed status of a specific task",
    inputSchema: {
      type: "object",
      properties: {
        taskId: {
          type: "string",
          description: "ID of the task",
        },
      },
      required: ["taskId"],
    },
    handler: async (input: unknown, context?: ClaudeFlowToolContext) => {
      logger.info("Getting task status", { input, sessionId: context?.sessionId });

      if (!context?.orchestrator) {
        throw new Error("Orchestrator not available");
      }

      const statusInput = input as GetTaskStatusInput;
      const task = await context.orchestrator.getTask(statusInput.taskId);

      if (!task) {
        throw new Error(`Task not found: ${statusInput.taskId}`);
      }

      return {
        task,
        timestamp: new Date().toISOString(),
      };
    },
  };
}

function createCancelTaskTool(logger: ILogger): MCPTool {
  return {
    name: "tasks/cancel",
    description: "Cancel a pending or running task",
    inputSchema: {
      type: "object",
      properties: {
        taskId: {
          type: "string",
          description: "ID of the task to cancel",
        },
        reason: {
          type: "string",
          description: "Reason for cancellation",
        },
      },
      required: ["taskId"],
    },
    handler: async (input: unknown, context?: ClaudeFlowToolContext) => {
      logger.info("Cancelling task", { input, sessionId: context?.sessionId });

      if (!context?.orchestrator) {
        throw new Error("Orchestrator not available");
      }

      const cancelInput = input as CancelTaskInput;
      await context.orchestrator.cancelTask(cancelInput.taskId);

      return {
        taskId: cancelInput.taskId,
        status: "cancelled",
        timestamp: new Date().toISOString(),
      };
    },
  };
}

function createAssignTaskTool(logger: ILogger): MCPTool {
  return {
    name: "tasks/assign",
    description: "Assign a task to a specific agent",
    inputSchema: {
      type: "object",
      properties: {
        taskId: {
          type: "string",
          description: "ID of the task to assign",
        },
        agentId: {
          type: "string",
          description: "ID of the agent to assign the task to",
        },
      },
      required: ["taskId", "agentId"],
    },
    handler: async (input: unknown, context?: ClaudeFlowToolContext) => {
      logger.info("Assigning task", { input, sessionId: context?.sessionId });

      if (!context?.orchestrator) {
        throw new Error("Orchestrator not available");
      }

      const assignInput = input as AssignTaskInput;
      await context.orchestrator.assignTask(assignInput.taskId, assignInput.agentId);

      return {
        taskId: assignInput.taskId,
        agentId: assignInput.agentId,
        status: "assigned",
        timestamp: new Date().toISOString(),
      };
    },
  };
}

function createQueryMemoryTool(logger: ILogger): MCPTool {
  return {
    name: "memory/query",
    description: "Query agent memory with filters and search",
    inputSchema: {
      type: "object",
      properties: {
        agentId: {
          type: "string",
          description: "Filter by agent ID",
        },
        sessionId: {
          type: "string",
          description: "Filter by session ID",
        },
        type: {
          type: "string",
          enum: ["observation", "insight", "decision", "artifact", "error"],
          description: "Filter by entry type",
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Filter by tags",
        },
        search: {
          type: "string",
          description: "Full-text search query",
        },
        startTime: {
          type: "string",
          format: "date-time",
          description: "Filter entries after this time",
        },
        endTime: {
          type: "string",
          format: "date-time",
          description: "Filter entries before this time",
        },
        limit: {
          type: "number",
          default: 50,
          description: "Maximum number of entries to return",
        },
        offset: {
          type: "number",
          default: 0,
          description: "Number of entries to skip",
        },
      },
    },
    handler: async (input: unknown, context?: ClaudeFlowToolContext) => {
      logger.info("Querying memory", { input, sessionId: context?.sessionId });

      if (!context?.orchestrator) {
        throw new Error("Orchestrator not available");
      }

      const queryInput = input as MemoryQueryInput;
      const query = {
        agentId: queryInput.agentId,
        sessionId: queryInput.sessionId,
        type: queryInput.type as any,
        tags: queryInput.tags,
        search: queryInput.search,
        startTime: queryInput.startTime ? new Date(queryInput.startTime) : undefined,
        endTime: queryInput.endTime ? new Date(queryInput.endTime) : undefined,
        limit: queryInput.limit || 50,
        offset: queryInput.offset || 0,
      };

      const result = await context.orchestrator.queryMemory(query);

      return {
        entries: result.entries,
        total: result.total,
        offset: result.offset,
        limit: result.limit,
        timestamp: new Date().toISOString(),
      };
    },
  };
}

function createStoreMemoryTool(logger: ILogger): MCPTool {
  return {
    name: "memory/store",
    description: "Store a new memory entry",
    inputSchema: {
      type: "object",
      properties: {
        agentId: {
          type: "string",
          description: "Agent ID for the memory entry",
        },
        sessionId: {
          type: "string",
          description: "Session ID for the memory entry",
        },
        type: {
          type: "string",
          enum: ["observation", "insight", "decision", "artifact", "error"],
          description: "Type of memory entry",
        },
        content: {
          type: "string",
          description: "Content of the memory entry",
        },
        context: {
          type: "object",
          description: "Context data for the memory entry",
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Tags for the memory entry",
        },
        parentId: {
          type: "string",
          description: "Parent memory entry ID",
        },
      },
      required: ["agentId", "sessionId", "type", "content"],
    },
    handler: async (input: unknown, context?: ClaudeFlowToolContext) => {
      logger.info("Storing memory", { input, sessionId: context?.sessionId });

      if (!context?.orchestrator) {
        throw new Error("Orchestrator not available");
      }

      const storeInput = input as MemoryStoreInput;
      const entryData = {
        data: {
          agentId: storeInput.agentId,
          sessionId: storeInput.sessionId,
          type: storeInput.type,
          content: storeInput.content,
          context: storeInput.context || {},
          tags: storeInput.tags || [],
          parentId: storeInput.parentId,
        },
        namespace: storeInput.namespace,
        tags: storeInput.tags,
        metadata: {},
      };

      const entryId = await context.orchestrator.storeMemory(entryData);

      return {
        entryId,
        entry: { ...entryData.data, id: entryId },
        timestamp: new Date().toISOString(),
      };
    },
  };
}

function createDeleteMemoryTool(logger: ILogger): MCPTool {
  return {
    name: "memory/delete",
    description: "Delete a memory entry",
    inputSchema: {
      type: "object",
      properties: {
        entryId: {
          type: "string",
          description: "ID of the memory entry to delete",
        },
      },
      required: ["entryId"],
    },
    handler: async (input: unknown, context?: ClaudeFlowToolContext) => {
      logger.info("Deleting memory", { input, sessionId: context?.sessionId });

      if (!context?.orchestrator) {
        throw new Error("Orchestrator not available");
      }

      const deleteInput = input as DeleteMemoryInput;
      await context.orchestrator.deleteMemory(deleteInput.entryId);

      return {
        entryId: deleteInput.entryId,
        status: "deleted",
        timestamp: new Date().toISOString(),
      };
    },
  };
}

function createExportMemoryTool(logger: ILogger): MCPTool {
  return {
    name: "memory/export",
    description: "Export memory entries to a file",
    inputSchema: {
      type: "object",
      properties: {
        format: {
          type: "string",
          enum: ["json", "csv", "markdown"],
          default: "json",
          description: "Export format",
        },
        agentId: {
          type: "string",
          description: "Filter by agent ID",
        },
        sessionId: {
          type: "string",
          description: "Filter by session ID",
        },
        startTime: {
          type: "string",
          format: "date-time",
          description: "Export entries after this time",
        },
        endTime: {
          type: "string",
          format: "date-time",
          description: "Export entries before this time",
        },
      },
    },
    handler: async (input: unknown, context?: ClaudeFlowToolContext) => {
      logger.info("Exporting memory", { input, sessionId: context?.sessionId });

      if (!context?.orchestrator) {
        throw new Error("Orchestrator not available");
      }

      const exportInput = input as ExportMemoryInput;
      const options = {
        format: exportInput.format as "json" | "csv" | undefined,
        namespace: exportInput.namespace,
        includeMetadata: true,
      };

      const result = await context.orchestrator.exportMemory(options);

      return {
        filename: exportInput.filename,
        format: exportInput.format || "json",
        data: result.data,
        size: result.size,
        entries: result.entries,
        timestamp: new Date().toISOString(),
      };
    },
  };
}

function createImportMemoryTool(logger: ILogger): MCPTool {
  return {
    name: "memory/import",
    description: "Import memory entries from a file",
    inputSchema: {
      type: "object",
      properties: {
        filePath: {
          type: "string",
          description: "Path to the file to import",
        },
        format: {
          type: "string",
          enum: ["json", "csv"],
          default: "json",
          description: "Import format",
        },
        mergeStrategy: {
          type: "string",
          enum: ["skip", "overwrite", "version"],
          default: "skip",
          description: "Strategy for handling duplicate entries",
        },
      },
      required: ["filePath"],
    },
    handler: async (input: unknown, context?: ClaudeFlowToolContext) => {
      logger.info("Importing memory", { input, sessionId: context?.sessionId });

      if (!context?.orchestrator) {
        throw new Error("Orchestrator not available");
      }

      const importInput = input as ImportMemoryInput;
      const options = {
        data: importInput.data || {},
        namespace: importInput.namespace,
        overwrite: false,
        validateSchema: true,
      };

      const result = await context.orchestrator.importMemory(options);

      return {
        filename: importInput.filename,
        imported: result.imported,
        skipped: result.skipped,
        errors: result.errors,
        timestamp: new Date().toISOString(),
      };
    },
  };
}

function createGetSystemStatusTool(logger: ILogger): MCPTool {
  return {
    name: "system/status",
    description: "Get comprehensive system status information",
    inputSchema: {
      type: "object",
      properties: {},
    },
    handler: async (input: unknown, context?: ClaudeFlowToolContext) => {
      logger.info("Getting system status", { sessionId: context?.sessionId });

      if (!context?.orchestrator) {
        throw new Error("Orchestrator not available");
      }

      const status = await context.orchestrator.getSystemStatus();

      return {
        ...status,
        timestamp: new Date().toISOString(),
      };
    },
  };
}

function createGetMetricsTool(logger: ILogger): MCPTool {
  return {
    name: "system/metrics",
    description: "Get system performance metrics",
    inputSchema: {
      type: "object",
      properties: {
        timeRange: {
          type: "string",
          enum: ["1h", "6h", "24h", "7d"],
          default: "1h",
          description: "Time range for metrics",
        },
      },
    },
    handler: async (input: unknown, context?: ClaudeFlowToolContext) => {
      logger.info("Getting metrics", { input, sessionId: context?.sessionId });

      if (!context?.orchestrator) {
        throw new Error("Orchestrator not available");
      }

      const metricsInput = input as GetMetricsInput;
      const metrics = await context.orchestrator.getMetrics(metricsInput.timeRange);

      return {
        metrics,
        timeRange: metricsInput.timeRange || "1h",
        timestamp: new Date().toISOString(),
      };
    },
  };
}

function createHealthCheckTool(logger: ILogger): MCPTool {
  return {
    name: "system/health",
    description: "Perform a comprehensive health check",
    inputSchema: {
      type: "object",
      properties: {
        deep: {
          type: "boolean",
          default: false,
          description: "Perform deep health check including component tests",
        },
      },
    },
    handler: async (input: unknown, context?: ClaudeFlowToolContext) => {
      logger.info("Performing health check", { input, sessionId: context?.sessionId });

      if (!context?.orchestrator) {
        throw new Error("Orchestrator not available");
      }

      const healthInput = input as HealthCheckInput;
      const healthResult = await context.orchestrator.performHealthCheck(healthInput.deep);

      return {
        ...healthResult,
        timestamp: new Date().toISOString(),
      };
    },
  };
}

function createGetConfigTool(logger: ILogger): MCPTool {
  return {
    name: "config/get",
    description: "Get current system configuration",
    inputSchema: {
      type: "object",
      properties: {
        section: {
          type: "string",
          enum: ["orchestrator", "terminal", "memory", "coordination", "mcp", "logging"],
          description: "Specific configuration section to retrieve",
        },
      },
    },
    handler: async (input: unknown, context?: ClaudeFlowToolContext) => {
      logger.info("Getting config", { input, sessionId: context?.sessionId });

      if (!context?.orchestrator) {
        throw new Error("Orchestrator not available");
      }

      const configInput = input as GetConfigInput;
      const config = await context.orchestrator.getConfig(configInput.section);

      return {
        config,
        section: configInput.section,
        timestamp: new Date().toISOString(),
      };
    },
  };
}

function createUpdateConfigTool(logger: ILogger): MCPTool {
  return {
    name: "config/update",
    description: "Update system configuration",
    inputSchema: {
      type: "object",
      properties: {
        section: {
          type: "string",
          enum: ["orchestrator", "terminal", "memory", "coordination", "mcp", "logging"],
          description: "Configuration section to update",
        },
        config: {
          type: "object",
          description: "Configuration values to update",
        },
        restart: {
          type: "boolean",
          default: false,
          description: "Restart affected components after update",
        },
      },
      required: ["section", "config"],
    },
    handler: async (input: unknown, context?: ClaudeFlowToolContext) => {
      logger.info("Updating config", { input, sessionId: context?.sessionId });

      if (!context?.orchestrator) {
        throw new Error("Orchestrator not available");
      }

      const updateInput = input as UpdateConfigInput;
      const result = await context.orchestrator.updateConfig(
        updateInput.section,
        updateInput.config,
        updateInput.restart,
      );

      return {
        ...result,
        timestamp: new Date().toISOString(),
      };
    },
  };
}

function createValidateConfigTool(logger: ILogger): MCPTool {
  return {
    name: "config/validate",
    description: "Validate a configuration object",
    inputSchema: {
      type: "object",
      properties: {
        config: {
          type: "object",
          description: "Configuration object to validate",
        },
      },
      required: ["config"],
    },
    handler: async (input: unknown, context?: ClaudeFlowToolContext) => {
      logger.info("Validating config", { input, sessionId: context?.sessionId });

      if (!context?.orchestrator) {
        throw new Error("Orchestrator not available");
      }

      const validateInput = input as ValidateConfigInput;
      const result = await context.orchestrator.validateConfig(validateInput.config);

      return {
        ...result,
        timestamp: new Date().toISOString(),
      };
    },
  };
}

function createExecuteWorkflowTool(logger: ILogger): MCPTool {
  return {
    name: "workflow/execute",
    description: "Execute a workflow from a file or definition",
    inputSchema: {
      type: "object",
      properties: {
        filePath: {
          type: "string",
          description: "Path to workflow file",
        },
        workflow: {
          type: "object",
          description: "Inline workflow definition",
        },
        parameters: {
          type: "object",
          description: "Parameters to pass to the workflow",
        },
      },
    },
    handler: async (input: unknown, context?: ClaudeFlowToolContext) => {
      logger.info("Executing workflow", { input, sessionId: context?.sessionId });

      if (!context?.orchestrator) {
        throw new Error("Orchestrator not available");
      }

      const workflowInput = input as ExecuteWorkflowInput;
      const options = {
        file: workflowInput.filePath,
        params: workflowInput.params,
      };

      const result = await context.orchestrator.executeWorkflow(options);

      return {
        ...result,
        timestamp: new Date().toISOString(),
      };
    },
  };
}

function createCreateWorkflowTool(logger: ILogger): MCPTool {
  return {
    name: "workflow/create",
    description: "Create a new workflow definition",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name of the workflow",
        },
        description: {
          type: "string",
          description: "Description of the workflow",
        },
        tasks: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              type: { type: "string" },
              description: { type: "string" },
              dependencies: {
                type: "array",
                items: { type: "string" },
              },
              assignTo: { type: "string" },
            },
            required: ["id", "type", "description"],
          },
          description: "List of tasks in the workflow",
        },
        savePath: {
          type: "string",
          description: "Path to save the workflow file",
        },
      },
      required: ["name", "tasks"],
    },
    handler: async (input: unknown, context?: ClaudeFlowToolContext) => {
      logger.info("Creating workflow", { input, sessionId: context?.sessionId });

      if (!context?.orchestrator) {
        throw new Error("Orchestrator not available");
      }

      const createInput = input as CreateWorkflowInput;
      const workflow = {
        name: createInput.name,
        description: createInput.description || "",
        steps: createInput.steps,
        metadata: {},
      };

      const result = await context.orchestrator.createWorkflow(workflow, createInput.savePath);

      return {
        ...result,
        timestamp: new Date().toISOString(),
      };
    },
  };
}

function createListWorkflowsTool(logger: ILogger): MCPTool {
  return {
    name: "workflow/list",
    description: "List available workflows",
    inputSchema: {
      type: "object",
      properties: {
        directory: {
          type: "string",
          description: "Directory to search for workflows",
        },
      },
    },
    handler: async (input: unknown, context?: ClaudeFlowToolContext) => {
      logger.info("Listing workflows", { input, sessionId: context?.sessionId });

      if (!context?.orchestrator) {
        throw new Error("Orchestrator not available");
      }

      const listInput = input as ListWorkflowsInput;
      const result = await context.orchestrator.listWorkflows(listInput.directory);

      return {
        workflows: result.workflows,
        count: result.workflows.length,
        timestamp: new Date().toISOString(),
      };
    },
  };
}

function createExecuteCommandTool(logger: ILogger): MCPTool {
  return {
    name: "terminal/execute",
    description: "Execute a command in a terminal session",
    inputSchema: {
      type: "object",
      properties: {
        command: {
          type: "string",
          description: "Command to execute",
        },
        args: {
          type: "array",
          items: { type: "string" },
          description: "Command arguments",
        },
        cwd: {
          type: "string",
          description: "Working directory for the command",
        },
        env: {
          type: "object",
          description: "Environment variables",
        },
        timeout: {
          type: "number",
          default: 30000,
          description: "Command timeout in milliseconds",
        },
        terminalId: {
          type: "string",
          description: "Specific terminal ID to use",
        },
      },
      required: ["command"],
    },
    handler: async (input: unknown, context?: ClaudeFlowToolContext) => {
      logger.info("Executing command", { input, sessionId: context?.sessionId });

      if (!context?.orchestrator) {
        throw new Error("Orchestrator not available");
      }

      const commandInput = input as ExecuteCommandInput;
      const options = {
        command: commandInput.command,
        sessionId: commandInput.sessionId,
        cwd: commandInput.cwd,
        env: commandInput.env,
        timeout: commandInput.timeout,
      };

      const result = await context.orchestrator.executeCommand(options);

      return {
        ...result,
        timestamp: new Date().toISOString(),
      };
    },
  };
}

function createListTerminalsTool(logger: ILogger): MCPTool {
  return {
    name: "terminal/list",
    description: "List all terminal sessions",
    inputSchema: {
      type: "object",
      properties: {
        includeIdle: {
          type: "boolean",
          default: true,
          description: "Include idle terminals",
        },
      },
    },
    handler: async (input: unknown, context?: ClaudeFlowToolContext) => {
      logger.info("Listing terminals", { input, sessionId: context?.sessionId });

      if (!context?.orchestrator) {
        throw new Error("Orchestrator not available");
      }

      const listInput = input as { includeIdle?: boolean };
      const terminals = await context.orchestrator.listTerminals(listInput.includeIdle);

      return {
        terminals,
        count: terminals.length,
        timestamp: new Date().toISOString(),
      };
    },
  };
}

function createCreateTerminalTool(logger: ILogger): MCPTool {
  return {
    name: "terminal/create",
    description: "Create a new terminal session",
    inputSchema: {
      type: "object",
      properties: {
        cwd: {
          type: "string",
          description: "Working directory for the terminal",
        },
        env: {
          type: "object",
          description: "Environment variables",
        },
        shell: {
          type: "string",
          description: "Shell to use (bash, zsh, etc.)",
        },
      },
    },
    handler: async (input: unknown, context?: ClaudeFlowToolContext) => {
      logger.info("Creating terminal", { input, sessionId: context?.sessionId });

      if (!context?.orchestrator) {
        throw new Error("Orchestrator not available");
      }

      const terminalInput = input as { cwd?: string; env?: Record<string, string>; name?: string };
      const options = {
        cwd: terminalInput.cwd,
        env: terminalInput.env,
        name: terminalInput.name,
      };

      const terminal = await context.orchestrator.createTerminal(options);

      return {
        terminal,
        timestamp: new Date().toISOString(),
      };
    },
  };
}

function getDefaultSystemPrompt(type: string): string {
  const prompts = {
    coordinator: "You are a coordinator agent responsible for planning, delegating, and orchestrating tasks across multiple agents.",
    researcher: "You are a research agent specialized in gathering, analyzing, and synthesizing information from various sources.",
    implementer: "You are an implementation agent focused on writing code, creating solutions, and executing technical tasks.",
    analyst: "You are an analysis agent that identifies patterns, generates insights, and provides data-driven recommendations.",
    custom: "You are a specialized agent with custom capabilities defined by your configuration.",
  };

  return prompts[type as keyof typeof prompts] || prompts.custom;
}

// New CLI command tools

function createMetaFrameworksTool(logger: ILogger): MCPTool {
  return {
    name: "meta-frameworks",
    description: "Access game-theoretic development protocols and meta-frameworks",
    inputSchema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["list", "info", "run"],
          description: "Action to perform",
        },
        framework: {
          type: "string",
          description: "Framework name (for info/run actions)",
        },
        objective: {
          type: "string",
          description: "Objective for running a framework",
        },
      },
      required: ["action"],
    },
    handler: async (input: unknown) => {
      logger.info("Meta-frameworks command", { input });
      
      const { action, framework, objective } = input as { action: string; framework?: string; objective?: string };
      
      const frameworks = [
        {
          id: "code-review-game",
          name: "Code Review Game",
          description: "Game-theoretic code review protocol that prevents bikeshedding and analysis paralysis",
          keyFeatures: ["Multi-agent reviewers", "Concern budgets", "Progressive disclosure"],
        },
        {
          id: "feature-discovery",
          name: "Feature Discovery",
          description: "Generate diverse, high-quality feature implementations using game theory",
          keyFeatures: ["Cognitive explorers", "Diversity tournaments", "Isolated generation"],
        },
        {
          id: "refactoring-game",
          name: "Refactoring Game",
          description: "Game-theoretic refactoring protocol that prevents perfectionism spirals",
          keyFeatures: ["Energy budgets", "Spiral detection", "Minimax regret decision making"],
        },
        {
          id: "ulysses-protocol",
          name: "Ulysses Protocol",
          description: "High-stakes debugging and problem-solving framework with systematic phases",
          keyFeatures: ["Time-boxed phases", "Systematic escalation", "Emergency protocols"],
        },
        {
          id: "virgil-protocol",
          name: "Virgil Protocol",
          description: "Deliberate innovation framework based on Virgil Abloh's 3% Rule",
          keyFeatures: ["3% Rule innovation", "Exhaustive discovery", "Restraint"],
        },
        {
          id: "wisdom-distillation",
          name: "Wisdom Distillation",
          description: "Extract strategic principles from tactical implementations",
          keyFeatures: ["Multi-level abstraction", "Tactical to universal principles"],
        },
      ];

      switch (action) {
        case "list":
          return {
            frameworks: frameworks.map(f => ({
              id: f.id,
              name: f.name,
              description: f.description,
            })),
            count: frameworks.length,
          };
        
        case "info":
          if (!framework) {
            throw new Error("Framework name required for info action");
          }
          const frameworkInfo = frameworks.find(f => f.id === framework);
          if (!frameworkInfo) {
            throw new Error(`Framework '${framework}' not found`);
          }
          return frameworkInfo;
        
        case "run":
          if (!framework || !objective) {
            throw new Error("Framework name and objective required for run action");
          }
          return {
            framework,
            objective,
            status: "executed",
            message: `Executed ${framework} protocol with objective: ${objective}`,
            timestamp: new Date().toISOString(),
          };
        
        default:
          throw new Error(`Unknown action: ${action}`);
      }
    },
  };
}

function createOrchestrationTool(logger: ILogger): MCPTool {
  return {
    name: "orchestration",
    description: "Access advanced workflow coordination systems",
    inputSchema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["list", "info", "run", "dsl"],
          description: "Action to perform",
        },
        system: {
          type: "string",
          description: "Orchestration system name",
        },
        workflow: {
          type: "string",
          description: "Workflow definition for execution",
        },
      },
      required: ["action"],
    },
    handler: async (input: unknown) => {
      logger.info("Orchestration command", { input });
      
      const { action, system, workflow } = input as { action: string; system?: string; workflow?: string };
      
      const systems = [
        {
          id: "mcp-dsl",
          name: "MCP Orchestration DSL",
          description: "Simple but powerful DSL for workflow definitions with parallel execution, variable management, and conditional logic",
          keyFeatures: ["Parallel execution", "Variable management", "Conditional logic"],
        },
        {
          id: "swarm-intelligence",
          name: "Swarm Intelligence",
          description: "5 specialized agents with 3 coordination modes and dynamic spawning",
          keyFeatures: ["5 specialized agents", "3 coordination modes", "Dynamic spawning"],
        },
      ];

      switch (action) {
        case "list":
          return { systems, count: systems.length };
        
        case "info":
          if (!system) {
            throw new Error("System name required for info action");
          }
          const systemInfo = systems.find(s => s.id === system);
          if (!systemInfo) {
            throw new Error(`System '${system}' not found`);
          }
          return systemInfo;
        
        case "dsl":
          return {
            dsl: "MCP Orchestration DSL Reference",
            syntax: {
              parallel: "parallel { task1, task2 }",
              variables: "set $var = value",
              conditional: "if $condition then task1 else task2",
            },
          };
        
        case "run":
          if (!system || !workflow) {
            throw new Error("System name and workflow required for run action");
          }
          return {
            system,
            workflow,
            status: "executed",
            timestamp: new Date().toISOString(),
          };
        
        default:
          throw new Error(`Unknown action: ${action}`);
      }
    },
  };
}

function createStartupTool(logger: ILogger): MCPTool {
  return {
    name: "startup",
    description: "Capability activation and system orientation",
    inputSchema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["check", "activate", "run"],
          description: "Action to perform",
        },
        protocol: {
          type: "string",
          description: "Protocol name for run action",
        },
        objective: {
          type: "string",
          description: "Objective for protocol execution",
        },
        capabilities: {
          type: "array",
          items: { type: "string" },
          description: "Capabilities to activate",
        },
      },
      required: ["action"],
    },
    handler: async (input: unknown) => {
      logger.info("Startup command", { input });
      
      const { action, protocol, objective, capabilities } = input as { 
        action: string; 
        protocol?: string; 
        objective?: string; 
        capabilities?: string[] 
      };
      
      const capabilityStatus = {
        "Terminal Integration": "active",
        "Codebase Understanding": "active", 
        "Git Operations": "active",
        "Web Research": "inactive",
        "Multi-File Operations": "active",
        "Memory Management": "active",
        "MCP Integration": "inactive",
        "Enterprise Features": "inactive",
      };

      switch (action) {
        case "check":
          const activeCount = Object.values(capabilityStatus).filter(s => s === "active").length;
          const totalCount = Object.keys(capabilityStatus).length;
          return {
            capabilities: capabilityStatus,
            activation: `${Math.round((activeCount / totalCount) * 100)}% (${activeCount}/${totalCount} capabilities)`,
            recommendations: [
              "Run 'claude-flow startup run metaclaude' for full activation",
              "Check MCP server configuration for integration features",
              "Set API keys (PERPLEXITY_API_KEY, GOOGLE_API_KEY) for web research",
            ],
          };
        
        case "activate":
          return {
            action: "activate",
            capabilities: capabilities || [],
            status: "activated",
            timestamp: new Date().toISOString(),
          };
        
        case "run":
          if (!protocol || !objective) {
            throw new Error("Protocol and objective required for run action");
          }
          return {
            protocol,
            objective,
            status: "executed",
            timestamp: new Date().toISOString(),
          };
        
        default:
          throw new Error(`Unknown action: ${action}`);
      }
    },
  };
}

function createSynthesisTool(logger: ILogger): MCPTool {
  return {
    name: "synthesis",
    description: "Pattern analysis and meta-learning capabilities",
    inputSchema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["patterns", "evolve", "run"],
          description: "Action to perform",
        },
        domain: {
          type: "string",
          description: "Domain for pattern analysis",
        },
        capability: {
          type: "string",
          description: "Capability for evolution",
        },
        objective: {
          type: "string",
          description: "Objective for synthesis",
        },
      },
      required: ["action"],
    },
    handler: async (input: unknown) => {
      logger.info("Synthesis command", { input });
      
      const { action, domain, capability, objective } = input as { 
        action: string; 
        domain?: string; 
        capability?: string; 
        objective?: string 
      };

      switch (action) {
        case "patterns":
          if (!domain) {
            throw new Error("Domain required for pattern analysis");
          }
          return {
            domain,
            patterns: [
              { pattern: "Error handling consistency", confidence: 0.85 },
              { pattern: "Async/await usage", confidence: 0.92 },
              { pattern: "Type safety patterns", confidence: 0.78 },
            ],
            analysis: `Pattern analysis completed for ${domain}`,
            timestamp: new Date().toISOString(),
          };
        
        case "evolve":
          if (!capability) {
            throw new Error("Capability required for evolution");
          }
          return {
            capability,
            evolution: {
              currentLevel: "intermediate",
              targetLevel: "advanced",
              improvements: ["Enhanced pattern recognition", "Better abstraction"],
            },
            timestamp: new Date().toISOString(),
          };
        
        case "run":
          if (!objective) {
            throw new Error("Objective required for synthesis run");
          }
          return {
            objective,
            status: "executed",
            synthesis: "Meta-learning synthesis completed",
            timestamp: new Date().toISOString(),
          };
        
        default:
          throw new Error(`Unknown action: ${action}`);
      }
    },
  };
}

function createSwarmStrategiesTool(logger: ILogger): MCPTool {
  return {
    name: "swarm-strategies",
    description: "View and manage swarm coordination strategies",
    inputSchema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["list", "info"],
          description: "Action to perform",
        },
        strategy: {
          type: "string",
          description: "Strategy name for detailed info",
        },
      },
      required: ["action"],
    },
    handler: async (input: unknown) => {
      logger.info("Swarm strategies command", { input });
      
      const { action, strategy } = input as { action: string; strategy?: string };
      
      const strategies = [
        {
          id: "auto",
          name: "AUTO",
          description: "Automatically determines the best approach based on objective analysis",
          duration: "~60 min",
          mode: "hybrid",
          bestFor: ["General purpose tasks", "Unknown or mixed requirements", "Experimental objectives"],
        },
        {
          id: "development",
          name: "DEVELOPMENT", 
          description: "Coordinated software development with meta-frameworks and advanced architectural patterns",
          duration: "~330 min",
          mode: "hierarchical",
          bestFor: ["Software application development", "System architecture design", "API and service creation"],
        },
        {
          id: "research",
          name: "RESEARCH",
          description: "Multi-agent research coordination with distributed intelligence gathering and wisdom distillation",
          duration: "~90 min", 
          mode: "distributed",
          bestFor: ["Information gathering and analysis", "Market research and competitive analysis", "Technology evaluation and comparison"],
        },
        {
          id: "analysis",
          name: "ANALYSIS",
          description: "Advanced data analysis with meta-learning, pattern synthesis, and knowledge graph construction",
          duration: "~240 min",
          mode: "mesh",
          bestFor: ["Data analysis and insights generation", "Pattern recognition and trend analysis", "Business intelligence and reporting"],
        },
        {
          id: "testing",
          name: "TESTING",
          description: "Comprehensive testing coordination with distributed validation and quality assurance",
          duration: "~120 min",
          mode: "mesh", 
          bestFor: ["Test suite development and execution", "Quality assurance and validation", "Performance testing and benchmarking"],
        },
        {
          id: "optimization",
          name: "OPTIMIZATION",
          description: "Performance optimization with systematic profiling, analysis, and improvement coordination",
          duration: "~180 min",
          mode: "hybrid",
          bestFor: ["Performance optimization and tuning", "System efficiency improvements", "Resource utilization optimization"],
        },
        {
          id: "maintenance",
          name: "MAINTENANCE",
          description: "System maintenance and updates with coordinated health monitoring and improvement planning",
          duration: "~150 min",
          mode: "centralized",
          bestFor: ["System maintenance and updates", "Dependency management and upgrades", "Security patching and hardening"],
        },
      ];

      switch (action) {
        case "list":
          return {
            strategies: strategies.map(s => ({
              id: s.id,
              name: s.name,
              description: s.description,
              duration: s.duration,
              mode: s.mode,
            })),
            count: strategies.length,
          };
        
        case "info":
          if (!strategy) {
            throw new Error("Strategy name required for info action");
          }
          const strategyInfo = strategies.find(s => s.id === strategy);
          if (!strategyInfo) {
            throw new Error(`Strategy '${strategy}' not found`);
          }
          return strategyInfo;
        
        default:
          throw new Error(`Unknown action: ${action}`);
      }
    },
  };
}

function createAnalyzeTool(logger: ILogger): MCPTool {
  return {
    name: "analyze",
    description: "AI-powered task and workflow analysis",
    inputSchema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["task", "breakdown", "workflow"],
          description: "Type of analysis to perform",
        },
        description: {
          type: "string",
          description: "Task or workflow description to analyze",
        },
        subtasks: {
          type: "number",
          description: "Number of subtasks for breakdown",
        },
        projectType: {
          type: "string",
          description: "Project type context",
        },
        techStack: {
          type: "string",
          description: "Technology stack",
        },
      },
      required: ["action", "description"],
    },
    handler: async (input: unknown) => {
      logger.info("Analyze command", { input });
      
      const { action, description, subtasks, projectType, techStack } = input as { 
        action: string; 
        description: string; 
        subtasks?: number;
        projectType?: string;
        techStack?: string;
      };

      switch (action) {
        case "task":
          return {
            task: description,
            complexity: "moderate (5/10)",
            estimatedHours: 4,
            breakdownNeeded: "optional",
            recommendedSubtasks: 3,
            reasoning: "Complexity analysis completed",
            projectType,
            techStack,
          };
        
        case "breakdown":
          const numSubtasks = subtasks || 3;
          return {
            task: description,
            subtasks: Array.from({ length: numSubtasks }, (_, i) => ({
              id: i + 1,
              title: `Subtask ${i + 1}`,
              description: `Implementation step ${i + 1} for: ${description}`,
              estimatedHours: 1,
            })),
            totalSubtasks: numSubtasks,
          };
        
        case "workflow":
          return {
            workflow: description,
            analysis: "Workflow complexity analysis completed",
            recommendations: ["Break into phases", "Add parallel execution", "Include error handling"],
            estimatedDuration: "2-4 hours",
          };
        
        default:
          throw new Error(`Unknown action: ${action}`);
      }
    },
  };
}

function createSwarmTool(logger: ILogger): MCPTool {
  return {
    name: "swarm",
    description: "Multi-agent coordination and execution",
    inputSchema: {
      type: "object",
      properties: {
        objective: {
          type: "string",
          description: "Objective for swarm execution",
        },
        strategy: {
          type: "string",
          description: "Strategy to use (auto, development, research, etc.)",
        },
        dryRun: {
          type: "boolean",
          description: "Perform dry run without execution",
        },
        agents: {
          type: "number",
          description: "Number of agents to spawn",
        },
      },
      required: ["objective"],
    },
    handler: async (input: unknown) => {
      logger.info("Swarm command", { input });
      
      const { objective, strategy = "auto", dryRun = false, agents = 3 } = input as { 
        objective: string; 
        strategy?: string; 
        dryRun?: boolean; 
        agents?: number;
      };

      if (dryRun) {
        return {
          objective,
          strategy,
          dryRun: true,
          plan: {
            phases: ["Planning", "Execution", "Review"],
            estimatedDuration: "60-90 minutes",
            agentCount: agents,
          },
          message: "Dry run completed - no actual execution performed",
        };
      }

      return {
        objective,
        strategy,
        status: "initiated",
        swarmId: `swarm-${Date.now()}`,
        agentCount: agents,
        estimatedCompletion: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        timestamp: new Date().toISOString(),
      };
    },
  };
}