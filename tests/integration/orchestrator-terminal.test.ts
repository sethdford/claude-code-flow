/**
 * Integration tests for Orchestrator and Terminal Manager
 */

import {
  describe,
  it,
  beforeEach,
  afterEach,
  assertEquals,
  assertExists,
  assertRejects,
  spy,
} from "../test.utils.ts";
import { Orchestrator } from "../../src/core/orchestrator.ts";
import { TerminalManager } from "../../src/terminal/manager.ts";
import { EventBus } from "../../src/core/event-bus.ts";
import { Logger } from "../../src/core/logger.ts";
import { MockMemoryManager, MockCoordinationManager } from "../mocks/index.ts";
import {
  Config,
  AgentProfile,
  Task,
  TaskStatus,
} from "../../src/utils/types.ts";
import { cleanupTestEnv, setupTestEnv } from "../test.config.ts";
import { delay } from "../../src/utils/helpers.ts";

describe("Orchestrator-Terminal Integration", () => {
  let orchestrator: Orchestrator;
  let terminalManager: TerminalManager;
  let eventBus: EventBus;
  let logger: Logger;
  let memoryManager: MockMemoryManager;
  let coordinationManager: MockCoordinationManager;
  let config: Config;

  beforeEach(async () => {
    setupTestEnv();

    config = {
      orchestrator: {
        maxConcurrentAgents: 5,
        taskQueueSize: 100,
        healthCheckInterval: 30000,
        shutdownTimeout: 10000,
        maintenanceInterval: 60000,
        metricsInterval: 10000,
        persistSessions: false,
        taskMaxRetries: 3,
      },
      terminal: {
        type: "native",
        poolSize: 3,
        recycleAfter: 5,
        healthCheckInterval: 15000,
        commandTimeout: 30000,
      },
      memory: {
        backend: "sqlite",
        cacheSizeMB: 50,
        syncInterval: 5000,
        conflictResolution: "last-write",
        retentionDays: 30,
      },
      coordination: {
        maxRetries: 3,
        retryDelay: 1000,
        deadlockDetection: true,
        resourceTimeout: 30000,
        messageTimeout: 10000,
      },
      mcp: {
        transport: "stdio",
      },
      logging: {
        level: "debug",
        format: "text",
        destination: "console",
      },
    };

    eventBus = new EventBus();
    logger = new Logger(config.logging);
    memoryManager = new MockMemoryManager();
    coordinationManager = new MockCoordinationManager();
    terminalManager = new TerminalManager(config.terminal, eventBus, logger);

    orchestrator = new Orchestrator(
      config,
      eventBus,
      logger,
      terminalManager,
      memoryManager,
      coordinationManager,
    );

    await orchestrator.initialize();
  });

  afterEach(async () => {
    await orchestrator.shutdown();
    await cleanupTestEnv();
  });

  describe("agent spawning and terminal integration", () => {
    const createTestProfile = (id: string): AgentProfile => ({
      id,
      name: `Test Agent ${id}`,
      type: "implementer",
      capabilities: ["terminal", "execute"],
      systemPrompt: "You are a test agent with terminal access",
      maxConcurrentTasks: 2,
      priority: 1,
      environment: {
        NODE_ENV: "test",
        TEST_MODE: "true",
      },
      workingDirectory: "/tmp",
      shell: "bash",
    });

    it("should spawn agent with terminal session", async () => {
      const profile = createTestProfile("test-agent-1");
      const sessionId = await orchestrator.spawnAgent(profile);

      assertExists(sessionId);

      // Verify agent session was created
      const sessions = orchestrator.getActiveSessions();
      assertEquals(sessions.length, 1);
      assertEquals(sessions[0].agentId, profile.id);

      // Verify terminal was spawned
      const terminalSessions = terminalManager.getActiveSessions();
      assertEquals(terminalSessions.length, 1);
      assertEquals(terminalSessions[0].agentId, profile.id);
    });

    it("should execute tasks through terminal", async () => {
      const profile = createTestProfile("task-agent");
      const sessionId = await orchestrator.spawnAgent(profile);

      const task: Task = {
        id: "test-task-1",
        type: "shell-command",
        description: "Execute a test command",
        priority: 1,
        dependencies: [],
        status: "pending" as TaskStatus,
        input: {
          command: 'echo "Task executed successfully"',
          timeout: 5000,
        },
        createdAt: new Date(),
      };

      const result = await orchestrator.executeTask(task);

      assertExists(result);
      assertEquals(result.output?.stdout, "Task executed successfully\n");
      assertEquals(result.status, "completed");
    });

    it("should handle concurrent tasks across multiple agents", async () => {
      // Spawn multiple agents
      const profiles = [
        createTestProfile("concurrent-1"),
        createTestProfile("concurrent-2"),
        createTestProfile("concurrent-3"),
      ];

      const sessions = await Promise.all(
        profiles.map(profile => orchestrator.spawnAgent(profile)),
      );

      assertEquals(sessions.length, 3);

      // Create concurrent tasks
      const tasks: Task[] = profiles.map((profile, index) => ({
        id: `concurrent-task-${index + 1}`,
        type: "shell-command",
        description: `Concurrent task ${index + 1}`,
        priority: 1,
        dependencies: [],
        status: "pending" as TaskStatus,
        input: {
          command: `echo "Agent ${profile.id} executed task ${index + 1}"`,
          timeout: 5000,
        },
        createdAt: new Date(),
      }));

      // Execute tasks concurrently
      const results = await Promise.all(
        tasks.map(task => orchestrator.executeTask(task)),
      );

      // Verify all tasks completed
      assertEquals(results.length, 3);
      results.forEach((result, index) => {
        assertEquals(result.status, "completed");
        assertExists(result.output?.stdout);
        assertEquals(
          result.output.stdout.includes(`task ${index + 1}`),
          true,
        );
      });
    });

    it("should handle agent termination and cleanup", async () => {
      const profile = createTestProfile("cleanup-agent");
      const sessionId = await orchestrator.spawnAgent(profile);

      // Verify agent and terminal are active
      assertEquals(orchestrator.getActiveSessions().length, 1);
      assertEquals(terminalManager.getActiveSessions().length, 1);

      // Terminate agent
      await orchestrator.terminateAgent(sessionId, "Test cleanup");

      // Verify cleanup
      assertEquals(orchestrator.getActiveSessions().length, 0);
      assertEquals(terminalManager.getActiveSessions().length, 0);
    });
  });

  describe("error handling and recovery", () => {
    it("should handle terminal spawn failures gracefully", async () => {
      // Mock terminal manager to fail spawning
      const originalSpawn = terminalManager.spawnTerminal.bind(terminalManager);
      terminalManager.spawnTerminal = spy(() => {
        throw new Error("Terminal spawn failed");
      });

      const profile: AgentProfile = {
        id: "fail-agent",
        name: "Failing Agent",
        type: "implementer",
        capabilities: ["terminal"],
        systemPrompt: "Test agent",
        maxConcurrentTasks: 1,
        priority: 1,
      };

      await assertRejects(
        () => orchestrator.spawnAgent(profile),
        Error,
        "Terminal spawn failed",
      );

      // Verify no sessions were created
      assertEquals(orchestrator.getActiveSessions().length, 0);

      // Restore original method
      terminalManager.spawnTerminal = originalSpawn;
    });

    it("should handle task execution timeouts", async () => {
      const profile: AgentProfile = {
        id: "timeout-agent",
        name: "Timeout Agent",
        type: "implementer",
        capabilities: ["terminal"],
        systemPrompt: "Test agent",
        maxConcurrentTasks: 1,
        priority: 1,
      };

      const sessionId = await orchestrator.spawnAgent(profile);

      const task: Task = {
        id: "timeout-task",
        type: "shell-command",
        description: "Task that times out",
        priority: 1,
        dependencies: [],
        status: "pending" as TaskStatus,
        input: {
          command: "sleep 10", // Long running command
          timeout: 1000, // Short timeout
        },
        createdAt: new Date(),
      };

      const result = await orchestrator.executeTask(task);

      assertEquals(result.status, "failed");
      assertExists(result.error);
      assertEquals(result.error.message.includes("timeout"), true);
    });

    it("should retry failed tasks", async () => {
      const profile: AgentProfile = {
        id: "retry-agent",
        name: "Retry Agent",
        type: "implementer",
        capabilities: ["terminal"],
        systemPrompt: "Test agent",
        maxConcurrentTasks: 1,
        priority: 1,
      };

      const sessionId = await orchestrator.spawnAgent(profile);

      let attemptCount = 0;
      const originalExecute = terminalManager.executeCommand.bind(terminalManager);
      terminalManager.executeCommand = spy(async (terminalId: string, command: string) => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error("Simulated failure");
        }
        return "Success on retry";
      });

      const task: Task = {
        id: "retry-task",
        type: "shell-command",
        description: "Task that fails initially",
        priority: 1,
        dependencies: [],
        status: "pending" as TaskStatus,
        input: {
          command: 'echo "test"',
          maxRetries: 3,
        },
        createdAt: new Date(),
      };

      const result = await orchestrator.executeTask(task);

      assertEquals(result.status, "completed");
      assertEquals(result.output?.stdout, "Success on retry");
      assertEquals(attemptCount, 3);

      // Restore original method
      terminalManager.executeCommand = originalExecute;
    });
  });

  describe("resource management", () => {
    it("should manage terminal pool effectively", async () => {
      // Spawn agents up to pool limit
      const profiles = Array.from({ length: 3 }, (_, i) => ({
        id: `pool-agent-${i}`,
        name: `Pool Agent ${i}`,
        type: "implementer" as const,
        capabilities: ["terminal"],
        systemPrompt: "Test agent",
        maxConcurrentTasks: 1,
        priority: 1,
      }));

      // Spawn all agents
      const sessions = await Promise.all(
        profiles.map(profile => orchestrator.spawnAgent(profile)),
      );

      assertEquals(sessions.length, 3);

      // Verify terminal pool health
      const health = await terminalManager.getHealthStatus();
      assertEquals(health.healthy, true);
      assertEquals(health.metrics?.activeSessions, 3);

      // Try to spawn one more (should work as it creates new terminal)
      const extraProfile: AgentProfile = {
        id: "extra-agent",
        name: "Extra Agent",
        type: "implementer",
        capabilities: ["terminal"],
        systemPrompt: "Test agent",
        maxConcurrentTasks: 1,
        priority: 1,
      };

      // This should succeed as terminals are created on demand
      const extraSession = await orchestrator.spawnAgent(extraProfile);
      assertExists(extraSession);
    });

    it("should perform maintenance operations", async () => {
      const profile: AgentProfile = {
        id: "maintenance-agent",
        name: "Maintenance Agent",
        type: "implementer",
        capabilities: ["terminal"],
        systemPrompt: "Test agent",
        maxConcurrentTasks: 1,
        priority: 1,
      };

      const sessionId = await orchestrator.spawnAgent(profile);

      // Track maintenance events
      const maintenanceEvents: any[] = [];
      eventBus.on("orchestrator:maintenance", (event) => {
        maintenanceEvents.push(event);
      });

      // Trigger maintenance
      await orchestrator.performMaintenance();

      // Verify maintenance was performed
      assertEquals(maintenanceEvents.length, 1);
      assertExists(maintenanceEvents[0].timestamp);
      assertExists(maintenanceEvents[0].activeSessions);
    });
  });

  describe("event coordination", () => {
    it("should coordinate events between orchestrator and terminal manager", async () => {
      const events: { type: string; data: any }[] = [];

      // Listen to relevant events
      const eventTypes = [
        "agent:spawned",
        "agent:terminated",
        "task:started",
        "task:completed",
        "terminal:spawned",
        "terminal:terminated",
      ];

      eventTypes.forEach(eventType => {
        eventBus.on(eventType, (data) => {
          events.push({ type: eventType, data });
        });
      });

      const profile: AgentProfile = {
        id: "event-agent",
        name: "Event Agent",
        type: "implementer",
        capabilities: ["terminal"],
        systemPrompt: "Test agent",
        maxConcurrentTasks: 1,
        priority: 1,
      };

      // Spawn agent
      const sessionId = await orchestrator.spawnAgent(profile);

      // Execute task
      const task: Task = {
        id: "event-task",
        type: "shell-command",
        description: "Task for event testing",
        priority: 1,
        dependencies: [],
        status: "pending" as TaskStatus,
        input: {
          command: 'echo "Event test"',
        },
        createdAt: new Date(),
      };

      await orchestrator.executeTask(task);

      // Terminate agent
      await orchestrator.terminateAgent(sessionId, "Event test cleanup");

      // Wait for events to propagate
      await delay(100);

      // Verify events were emitted
      const eventTypesSeen = events.map(e => e.type);
      assertEquals(eventTypesSeen.includes("agent:spawned"), true);
      assertEquals(eventTypesSeen.includes("task:started"), true);
      assertEquals(eventTypesSeen.includes("task:completed"), true);
      assertEquals(eventTypesSeen.includes("agent:terminated"), true);
    });

    it("should handle cross-component error propagation", async () => {
      const errorEvents: any[] = [];

      eventBus.on("agent:error", (event) => {
        errorEvents.push(event);
      });

      const profile: AgentProfile = {
        id: "error-agent",
        name: "Error Agent",
        type: "implementer",
        capabilities: ["terminal"],
        systemPrompt: "Test agent",
        maxConcurrentTasks: 1,
        priority: 1,
      };

      const sessionId = await orchestrator.spawnAgent(profile);

      // Mock terminal to throw error
      const originalExecute = terminalManager.executeCommand.bind(terminalManager);
      terminalManager.executeCommand = spy(() => {
        throw new Error("Terminal execution failed");
      });

      const task: Task = {
        id: "error-task",
        type: "shell-command",
        description: "Task that will fail",
        priority: 1,
        dependencies: [],
        status: "pending" as TaskStatus,
        input: {
          command: 'echo "test"',
        },
        createdAt: new Date(),
      };

      const result = await orchestrator.executeTask(task);

      assertEquals(result.status, "failed");
      assertExists(result.error);

      // Wait for events to propagate
      await delay(100);

      // Verify error event was emitted
      assertEquals(errorEvents.length > 0, true);

      // Restore original method
      terminalManager.executeCommand = originalExecute;
    });
  });

  describe("memory integration", () => {
    it("should persist agent session data", async () => {
      const profile: AgentProfile = {
        id: "memory-agent",
        name: "Memory Agent",
        type: "implementer",
        capabilities: ["terminal", "memory"],
        systemPrompt: "Test agent with memory",
        maxConcurrentTasks: 1,
        priority: 1,
      };

      const sessionId = await orchestrator.spawnAgent(profile);

      // Verify memory operations were called
      assertEquals(memoryManager.storeEntry.calls.length > 0, true);

      const storedEntries = memoryManager.storeEntry.calls.map(call => call.args[0]);
      const spawnEntry = storedEntries.find(entry => 
        entry.type === "observation" && 
        entry.content.includes("Agent spawned"),
      );

      assertExists(spawnEntry);
      assertEquals(spawnEntry.agentId, profile.id);
      assertEquals(spawnEntry.sessionId, sessionId);
    });

    it("should store task execution history", async () => {
      const profile: AgentProfile = {
        id: "history-agent",
        name: "History Agent",
        type: "implementer",
        capabilities: ["terminal"],
        systemPrompt: "Test agent",
        maxConcurrentTasks: 1,
        priority: 1,
      };

      const sessionId = await orchestrator.spawnAgent(profile);

      const task: Task = {
        id: "history-task",
        type: "shell-command",
        description: "Task for history testing",
        priority: 1,
        dependencies: [],
        status: "pending" as TaskStatus,
        input: {
          command: 'echo "History test"',
        },
        createdAt: new Date(),
      };

      await orchestrator.executeTask(task);

      // Verify task events were stored in memory
      const taskEntries = memoryManager.storeEntry.calls
        .map(call => call.args[0])
        .filter(entry => entry.content.includes("Task"));

      assertEquals(taskEntries.length >= 2, true); // Start and completion

      const startEntry = taskEntries.find(entry => 
        entry.content.includes("started"),
      );
      const completeEntry = taskEntries.find(entry => 
        entry.content.includes("completed"),
      );

      assertExists(startEntry);
      assertExists(completeEntry);
    });
  });
});