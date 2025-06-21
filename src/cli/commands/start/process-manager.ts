/**
 * Process Manager - Handles lifecycle of system processes
 */

import { EventEmitter } from "./event-emitter.js";
import chalk from "chalk";
import { 
  ProcessInfo, 
  ProcessType, 
  ProcessStatus, 
  // ProcessMetrics, // Not used currently
  SystemStats, 
} from "./types.js";
import { Orchestrator } from "../../../core/orchestrator.js";
import { TerminalManager } from "../../../terminal/manager.js";
import { MemoryManager } from "../../../memory/manager.js";
import { CoordinationManager } from "../../../coordination/manager.js";
import { MCPServer } from "../../../mcp/server.js";
import { eventBus } from "../../../core/event-bus.js";
import { logger, ILogger } from "../../../core/logger.js";
import { ConfigManager } from "../../../config/config-manager.js";
import { type Config, type MemoryConfig, type TerminalConfig, type CoordinationConfig, type MCPConfig } from "../../../utils/types.js";
import { Logger } from "../../../core/logger.js";


// Color compatibility
const colors = {
  gray: chalk.gray,
  yellow: chalk.yellow,
  red: chalk.red,
  green: chalk.green,
  cyan: chalk.cyan,
  blue: chalk.blue,
  bold: chalk.bold,
};

export class ProcessManager extends EventEmitter {
  private processes: Map<string, ProcessInfo> = new Map();
  private orchestrator: Orchestrator | undefined;
  private terminalManager: TerminalManager | undefined;
  private memoryManager: MemoryManager | undefined;
  private coordinationManager: CoordinationManager | undefined;
  private mcpServer: MCPServer | undefined;
  private config: Config;
  private cleanLogger: ILogger;

  constructor() {
    super();
    this.initializeProcesses();
    
    // Create a cleaner logger for component initialization
    this.cleanLogger = new Logger({
      level: "info",
      format: "text", // Use text format for cleaner output
      destination: "console",
    });
  }

  private initializeProcesses(): void {
    const processDefinitions: ProcessInfo[] = [
      { id: "event-bus", name: "Event Bus", type: ProcessType.EVENT_BUS, status: ProcessStatus.STOPPED, startTime: 0, metrics: {} },
      { id: "memory-manager", name: "Memory Manager", type: ProcessType.MEMORY_MANAGER, status: ProcessStatus.STOPPED, startTime: 0, metrics: {} },
      { id: "terminal-pool", name: "Terminal Pool", type: ProcessType.TERMINAL_POOL, status: ProcessStatus.STOPPED, startTime: 0, metrics: {} },
      { id: "coordinator", name: "Coordination Manager", type: ProcessType.COORDINATOR, status: ProcessStatus.STOPPED, startTime: 0, metrics: {} },
      { id: "mcp-server", name: "MCP Server", type: ProcessType.MCP_SERVER, status: ProcessStatus.STOPPED, startTime: 0, metrics: {} },
      { id: "orchestrator", name: "Orchestrator Engine", type: ProcessType.ORCHESTRATOR, status: ProcessStatus.STOPPED, startTime: 0, metrics: {} },
    ];

    for (const process of processDefinitions) {
      this.processes.set(process.id, process);
    }
  }

  async initialize(configPath?: string): Promise<void> {
    try {
      const configManager = ConfigManager.getInstance();
      if (configPath) {
        await configManager.load(configPath);
      } else {
        // Try to load default config file if it exists
        try {
          await configManager.load("./claude-flow.config.json");
        } catch {
          // Use defaults if no config file found
          await configManager.load(); // This will use defaults
        }
      }
      this.config = configManager.show() as Config;
      this.emit("initialized", { config: this.config });
    } catch (error) {
      this.emit("error", { component: "ProcessManager", error });
      throw error;
    }
  }

  async startProcess(processId: string): Promise<void> {
    const process = this.processes.get(processId);
    if (!process) {
      throw new Error(`Unknown process: ${processId}`);
    }

    if (process.status === ProcessStatus.RUNNING) {
      throw new Error(`Process ${processId} is already running`);
    }

    // Check dependencies for orchestrator
    if (processId === "orchestrator") {
      const requiredDeps = ["memory-manager", "terminal-pool", "coordinator", "mcp-server"];
      const missingDeps = requiredDeps.filter(dep => {
        const depProcess = this.processes.get(dep);
        return !depProcess || depProcess.status !== ProcessStatus.RUNNING;
      });
      
      if (missingDeps.length > 0) {
        throw new Error(`Cannot start orchestrator: missing dependencies: ${missingDeps.join(", ")}. Use "Start All" to start in proper order.`);
      }
    }

    this.updateProcessStatus(processId, ProcessStatus.STARTING);

    try {
      switch (process.type) {
        case ProcessType.EVENT_BUS:
          // Event bus is already initialized globally
          // Use Node.js process.pid directly
          break;

        case ProcessType.MEMORY_MANAGER:
          this.memoryManager = new MemoryManager(
            this.config.memory,
            eventBus,
            this.cleanLogger, // Use cleaner logger
          );
          await this.memoryManager.initialize();
          break;

        case ProcessType.TERMINAL_POOL:
          this.terminalManager = new TerminalManager(
            this.config.terminal,
            eventBus,
            this.cleanLogger, // Use cleaner logger
          );
          await this.terminalManager.initialize();
          break;

        case ProcessType.COORDINATOR:
          this.coordinationManager = new CoordinationManager(
            this.config.coordination,
            eventBus,
            this.cleanLogger, // Use cleaner logger
          );
          await this.coordinationManager.initialize();
          break;

        case ProcessType.MCP_SERVER:
          // Stop any existing MCP server instance first
          if (this.mcpServer) {
            try {
              await this.mcpServer.stop();
            } catch (error) {
              // Ignore errors when stopping existing instance
            }
          }
          
          this.mcpServer = new MCPServer(
            this.config.mcp,
            eventBus,
            this.cleanLogger, // Use cleaner logger
          );
          await this.mcpServer.start();
          break;

        case ProcessType.ORCHESTRATOR:
          if (!this.terminalManager || !this.memoryManager || 
              !this.coordinationManager || !this.mcpServer) {
            throw new Error("Required components not initialized");
          }
          
          this.orchestrator = new Orchestrator(
            this.config,
            this.terminalManager,
            this.memoryManager,
            this.coordinationManager,
            this.mcpServer,
            eventBus,
            this.cleanLogger, // Use clean logger instead of silent logger
          );
          await this.orchestrator.initialize();
          break;
      }

      process.startTime = Date.now();
      this.updateProcessStatus(processId, ProcessStatus.RUNNING);
      this.emit("processStarted", { processId, process });

    } catch (error) {
      this.updateProcessStatus(processId, ProcessStatus.ERROR);
      process.metrics = {
        ...process.metrics,
        lastError: (error as Error).message,
      };
      this.emit("processError", { processId, error });
      throw error;
    }
  }

  async stopProcess(processId: string): Promise<void> {
    const process = this.processes.get(processId);
    if (!process || process.status !== ProcessStatus.RUNNING) {
      throw new Error(`Process ${processId} is not running`);
    }

    this.updateProcessStatus(processId, ProcessStatus.STOPPING);

    try {
      switch (process.type) {
        case ProcessType.ORCHESTRATOR:
          if (this.orchestrator) {
            await this.orchestrator.shutdown();
            this.orchestrator = undefined;
          }
          break;

        case ProcessType.MCP_SERVER:
          if (this.mcpServer) {
            await this.mcpServer.stop();
            this.mcpServer = undefined;
          }
          break;

        case ProcessType.MEMORY_MANAGER:
          if (this.memoryManager) {
            await this.memoryManager.shutdown();
            this.memoryManager = undefined;
          }
          break;

        case ProcessType.TERMINAL_POOL:
          if (this.terminalManager) {
            await this.terminalManager.shutdown();
            this.terminalManager = undefined;
          }
          break;

        case ProcessType.COORDINATOR:
          if (this.coordinationManager) {
            await this.coordinationManager.shutdown();
            this.coordinationManager = undefined;
          }
          break;
      }

      this.updateProcessStatus(processId, ProcessStatus.STOPPED);
      this.emit("processStopped", { processId });

    } catch (error) {
      this.updateProcessStatus(processId, ProcessStatus.ERROR);
      this.emit("processError", { processId, error });
      throw error;
    }
  }

  async restartProcess(processId: string): Promise<void> {
    await this.stopProcess(processId);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Brief delay
    await this.startProcess(processId);
  }

  async startAll(): Promise<void> {
    // Start in dependency order
    const startOrder = [
      "event-bus",
      "memory-manager",
      "terminal-pool",
      "coordinator",
      "mcp-server",
      "orchestrator",
    ];

    for (const processId of startOrder) {
      try {
        await this.startProcess(processId);
      } catch (error) {
        console.error(colors.red(`Failed to start ${processId}:`), (error as Error).message);
        // Continue with other processes
      }
    }
  }

  async stopAll(): Promise<void> {
    // Stop in reverse dependency order
    const stopOrder = [
      "orchestrator",
      "mcp-server",
      "coordinator",
      "terminal-pool",
      "memory-manager",
      "event-bus",
    ];

    for (const processId of stopOrder) {
      const process = this.processes.get(processId);
      if (process && process.status === ProcessStatus.RUNNING) {
        try {
          await this.stopProcess(processId);
        } catch (error) {
          console.error(colors.red(`Failed to stop ${processId}:`), (error as Error).message);
        }
      }
    }
  }

  getProcess(processId: string): ProcessInfo | undefined {
    return this.processes.get(processId);
  }

  getAllProcesses(): ProcessInfo[] {
    return Array.from(this.processes.values());
  }

  getSystemStats(): SystemStats {
    const processes = this.getAllProcesses();
    const runningProcesses = processes.filter(p => p.status === ProcessStatus.RUNNING);
    const stoppedProcesses = processes.filter(p => p.status === ProcessStatus.STOPPED);
    const errorProcesses = processes.filter(p => p.status === ProcessStatus.ERROR);

    return {
      totalProcesses: processes.length,
      runningProcesses: runningProcesses.length,
      stoppedProcesses: stoppedProcesses.length,
      errorProcesses: errorProcesses.length,
      systemUptime: this.getSystemUptime(),
      totalMemory: this.getTotalMemoryUsage(),
      totalCpu: this.getTotalCpuUsage(),
    };
  }

  private updateProcessStatus(processId: string, status: ProcessStatus): void {
    const process = this.processes.get(processId);
    if (process) {
      process.status = status;
      this.emit("statusChanged", { processId, status });
    }
  }

  private getSystemUptime(): number {
    const orchestrator = this.processes.get("orchestrator");
    if (orchestrator?.startTime) {
      return Date.now() - orchestrator.startTime;
    }
    return 0;
  }

  private getTotalMemoryUsage(): number {
    // Placeholder - would integrate with actual memory monitoring
    return 0;
  }

  private getTotalCpuUsage(): number {
    // Placeholder - would integrate with actual CPU monitoring
    return 0;
  }

  getProcessLogs(processId: string, _lines: number = 50): string[] {
    // Placeholder - would integrate with actual logging system
    return [
      `[${new Date().toISOString()}] Process ${processId} started`,
      `[${new Date().toISOString()}] Process ${processId} is running normally`,
    ];
  }
}