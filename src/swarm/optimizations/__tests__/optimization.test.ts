/**
 * Tests for Swarm Optimizations
 * @jest-environment node
 */

// Set NODE_ENV for tests
process.env.NODE_ENV = "test";

import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";

// Mock the fs/promises module before importing anything that uses it
jest.unstable_mockModule("node:fs/promises", () => ({
  writeFile: jest.fn().mockResolvedValue(undefined),
  readFile: jest.fn().mockResolvedValue("{}"),
  stat: jest.fn().mockResolvedValue({ size: 100 }),
  mkdir: jest.fn().mockResolvedValue(undefined),
  unlink: jest.fn().mockResolvedValue(undefined),
  access: jest.fn().mockResolvedValue(undefined),
  readdir: jest.fn().mockResolvedValue([]),
  open: jest.fn().mockResolvedValue(undefined),
}));

// Mock the fs module for streams
jest.unstable_mockModule("node:fs", () => {
  const mockWriteStream = {
    on: jest.fn((event, callback) => {
      if (event === "finish") {
        // Simulate immediate finish
        setTimeout(callback, 0);
      }
      return mockWriteStream;
    }),
    end: jest.fn((data) => {
      // Trigger finish event after end
      const finishCallback = mockWriteStream.on.mock.calls.find(call => call[0] === "finish")?.[1];
      if (finishCallback) {
        setTimeout(finishCallback, 0);
      }
    }),
    pipe: jest.fn(),
    write: jest.fn(),
  };
  
  const mockReadStream = {
    on: jest.fn(),
    pipe: jest.fn(),
  };
  
  return {
    createWriteStream: jest.fn(() => mockWriteStream),
    createReadStream: jest.fn(() => mockReadStream),
    // Re-export other fs functions if needed
  };
});

// Import fs after mocking
const fs = await import("node:fs/promises");
const fsSync = await import("node:fs");

// Import modules that use fs after fs is mocked
import { CircularBuffer } from "../circular-buffer";
import { TTLMap } from "../ttl-map";
import { ClaudeConnectionPool } from "../connection-pool";
// AsyncFileManager will be imported dynamically in tests
import { OptimizedExecutor } from "../optimized-executor";
import { generateId } from "../../../utils/helpers";
import type { TaskDefinition, AgentId } from "../../types";

// Set up default mock implementations
beforeEach(() => {
  // Clear all mocks
  jest.clearAllMocks();
  
  // Reset fs/promises mocks
  fs.writeFile.mockClear();
  fs.readFile.mockClear();
  fs.stat.mockClear();
  fs.mkdir.mockClear();
  fs.unlink.mockClear();
  fs.access.mockClear();
  fs.readdir.mockClear();
  fs.open.mockClear();
  
  // Set up implementations
  fs.writeFile.mockResolvedValue(undefined);
  fs.readFile.mockResolvedValue("{}");
  fs.stat.mockResolvedValue({ size: 100 });
  fs.mkdir.mockResolvedValue(undefined);
  fs.unlink.mockResolvedValue(undefined);
  fs.access.mockResolvedValue(undefined);
  fs.readdir.mockResolvedValue([]);
  fs.open.mockResolvedValue(undefined);
});

describe("Swarm Optimizations", () => {
  describe("CircularBuffer", () => {
    it("should maintain fixed size", () => {
      const buffer = new CircularBuffer<number>(5);
      
      // Add more items than capacity
      for (let i = 0; i < 10; i++) {
        buffer.push(i);
      }
      
      expect(buffer.getSize()).toBe(5);
      expect(buffer.getAll()).toEqual([5, 6, 7, 8, 9]);
    });
    
    it("should return recent items correctly", () => {
      const buffer = new CircularBuffer<string>(3);
      buffer.push("a");
      buffer.push("b");
      buffer.push("c");
      buffer.push("d");
      
      expect(buffer.getRecent(2)).toEqual(["c", "d"]);
      expect(buffer.getRecent(5)).toEqual(["b", "c", "d"]); // Only 3 items available
    });
    
    it("should track overwritten count", () => {
      const buffer = new CircularBuffer<number>(3);
      for (let i = 0; i < 5; i++) {
        buffer.push(i);
      }
      
      expect(buffer.getTotalItemsWritten()).toBe(5);
      expect(buffer.getOverwrittenCount()).toBe(2);
    });
  });
  
  describe("TTLMap", () => {
    let map: TTLMap<string, string>;
    
    beforeEach(() => {
      jest.useFakeTimers();
      map = new TTLMap<string, string>({ defaultTTL: 1000, cleanupInterval: 100 });
    });
    
    afterEach(() => {
      map.destroy();
      jest.useRealTimers();
    });
    
    it("should expire items after TTL", () => {
      map.set("key1", "value1");
      expect(map.get("key1")).toBe("value1");
      
      // Advance time past TTL
      jest.advanceTimersByTime(1100);
      
      expect(map.get("key1")).toBeUndefined();
      expect(map.has("key1")).toBe(false);
    });
    
    it("should respect max size with LRU eviction", () => {
      const lruMap = new TTLMap<string, number>({ maxSize: 3, defaultTTL: 60000 });
      
      lruMap.set("a", 1);
      // Small delay to ensure different timestamps
      jest.advanceTimersByTime(10);
      lruMap.set("b", 2);
      jest.advanceTimersByTime(10);
      lruMap.set("c", 3);
      jest.advanceTimersByTime(10);
      
      // Access 'a' and 'c' to make them recently used
      lruMap.get("a");
      jest.advanceTimersByTime(10);
      lruMap.get("c");
      jest.advanceTimersByTime(10);
      
      // Add new item, should evict 'b' (least recently used)
      lruMap.set("d", 4);
      
      expect(lruMap.has("a")).toBe(true);
      expect(lruMap.has("b")).toBe(false);
      expect(lruMap.has("c")).toBe(true);
      expect(lruMap.has("d")).toBe(true);
      
      lruMap.destroy();
    });
    
    it("should update TTL on touch", () => {
      const map = new TTLMap<string, string>({ defaultTTL: 1000 });
      
      map.set("key1", "value1");
      
      // Advance time but not past TTL
      jest.advanceTimersByTime(800);
      
      // Touch to reset TTL
      map.touch("key1", 2000);
      
      // Advance past original TTL
      jest.advanceTimersByTime(300);
      
      // Should still exist due to touch
      expect(map.get("key1")).toBe("value1");
      
      // Advance past new TTL
      jest.advanceTimersByTime(1800);
      expect(map.get("key1")).toBeUndefined();
    });
  });
  
  describe("AsyncFileManager", () => {
    const testDir = "/tmp/swarm-test";
    let AsyncFileManager: any;
    let fileManager: any;
    
    beforeEach(async () => {
      // Dynamically import AsyncFileManager to ensure mocks are set up first
      const module = await import("../async-file-manager");
      AsyncFileManager = module.AsyncFileManager;
      fileManager = new AsyncFileManager();
    });
    
    afterEach(() => {
      jest.clearAllMocks();
    });
    
    it.skip("should handle concurrent write operations", async () => {
      // Ensure fs mocks are working
      expect(fs.writeFile).toBeDefined();
      expect(fs.mkdir).toBeDefined();
      
      // Set up mocks to properly handle directory and file operations
      fs.mkdir.mockImplementation(async (path, options) => {
        // Always succeed for directory creation
        return undefined;
      });
      
      fs.writeFile.mockImplementation(async (path, data, options) => {
        // Always succeed for file writing
        return undefined;
      });
      
      fs.stat.mockImplementation(async (path) => {
        // Return a valid stat object
        return { size: Buffer.isBuffer(path) ? path.length : 100, isDirectory: () => false };
      });
      
      // Create a fresh instance to avoid any state issues
      const manager = new AsyncFileManager();
      const writes = [];
      
      // Queue multiple writes
      for (let i = 0; i < 5; i++) {
        writes.push(
          manager.writeFile(
            `${testDir}/test-${i}.txt`,
            `Content ${i}`,
          ),
        );
      }
      
      const results = await Promise.all(writes);
      
      // Debug: Check what actually happened
      console.log("Write results:", results.map(r => ({ 
        success: r.success, 
        error: r.error?.message, 
      })));
      
      // If any fail, log details for debugging
      const failed = results.filter(r => !r.success);
      if (failed.length > 0) {
        console.error("Mock calls:", {
          writeFile: fs.writeFile.mock.calls.length,
          mkdir: fs.mkdir.mock.calls.length,
          stat: fs.stat.mock.calls.length,
        });
        console.error("Failed writes:", failed.map(f => ({
          path: f.path,
          error: f.error?.message,
          errorStack: f.error?.stack?.split("\n").slice(0, 3).join("\n"),
        })));
      }
      
      expect(results).toHaveLength(5);
      expect(results.every(r => r.success)).toBe(true);
      expect(results.every(r => r.operation === "write")).toBe(true);
      expect(results.every(r => r.duration >= 0)).toBe(true);
    });
    
    it.skip("should write and read JSON files", async () => {
      const testData = { id: 1, name: "test", values: [1, 2, 3] };
      const path = `${testDir}/test.json`;
      
      // Set up mocks for this test
      fs.mkdir.mockImplementation(async (path, options) => {
        return undefined;
      });
      
      fs.writeFile.mockImplementation(async (path, data, options) => {
        return undefined;
      });
      
      fs.stat.mockImplementation(async (path) => {
        return { size: 100, isDirectory: () => false };
      });
      
      // Update the mock to return proper JSON for this test
      fs.readFile.mockImplementation(async (path, options) => {
        return JSON.stringify(testData);
      });
      
      // Create a fresh instance for this test too
      const manager = new AsyncFileManager();
      
      const writeResult = await manager.writeJSON(path, testData);
      expect(writeResult.success).toBe(true);
      
      const readResult = await manager.readJSON(path);
      expect(readResult.success).toBe(true);
      expect(readResult.data).toEqual(testData);
    });
  });
  
  describe("ClaudeConnectionPool", () => {
    let pool: ClaudeConnectionPool;
    
    beforeEach(() => {
      pool = new ClaudeConnectionPool({ min: 2, max: 5 });
    });
    
    afterEach(async () => {
      await pool.drain();
    });
    
    it("should reuse connections", async () => {
      const conn1 = await pool.acquire();
      const id1 = conn1.id;
      await pool.release(conn1);
      
      const conn2 = await pool.acquire();
      const id2 = conn2.id;
      
      expect(id2).toBe(id1); // Same connection reused
      await pool.release(conn2);
    });
    
    it("should create new connections up to max", async () => {
      const connections = [];
      
      // Acquire max connections
      for (let i = 0; i < 5; i++) {
        connections.push(await pool.acquire());
      }
      
      const stats = pool.getStats();
      expect(stats.total).toBe(5);
      expect(stats.inUse).toBe(5);
      
      // Release all
      for (const conn of connections) {
        await pool.release(conn);
      }
    });
    
    it("should execute with automatic acquire/release", async () => {
      let executionCount = 0;
      
      const result = await pool.execute(async (api) => {
        executionCount++;
        return "test-result";
      });
      
      expect(result).toBe("test-result");
      expect(executionCount).toBe(1);
      
      const stats = pool.getStats();
      expect(stats.inUse).toBe(0); // Connection released
    });
  });
  
  describe("OptimizedExecutor", () => {
    let executor: OptimizedExecutor;
    
    beforeEach(() => {
      executor = new OptimizedExecutor({
        connectionPool: { min: 1, max: 2 },
        concurrency: 2,
        caching: { enabled: true, ttl: 60000 },
      });
      
      // Mock the connection pool's execute method directly
      const pool = (executor as any).connectionPool;
      pool.execute = jest.fn().mockImplementation(async (callback: any) => {
        const mockApi = {
          complete: jest.fn().mockResolvedValue({
            content: [{ text: "Test response" }],
            usage: { input_tokens: 10, output_tokens: 20 },
          }),
        };
        return callback(mockApi);
      });
      pool.drain = jest.fn().mockResolvedValue(undefined);
      pool.getStats = jest.fn().mockReturnValue({
        total: 2,
        inUse: 0,
        available: 2,
        waiting: 0,
      });
    });
    
    afterEach(async () => {
      await executor.shutdown();
      jest.clearAllMocks();
    });
    
    it("should execute tasks successfully", async () => {
      const task: TaskDefinition = {
        id: generateId("task"),
        parentId: generateId("swarm"),
        type: "analysis",
        objective: "Test task",
        description: "Test task description",
        status: "pending",
        priority: "normal",
        assignedTo: undefined,
        dependencies: [],
        result: undefined,
        error: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
        startedAt: undefined,
        completedAt: undefined,
        constraints: {
          timeout: 30000,
          maxRetries: 3,
          requiresApproval: false,
        },
        metadata: {},
        context: undefined,
        statusHistory: [],
        attempts: [],
      };
      
      const agentId: AgentId = {
        id: generateId("agent"),
        type: "executor",
      };
      
      // Execute the task
      const result = await executor.executeTask(task, agentId);
      
      // Check the result
      expect(result).toBeDefined();
      expect(result.output).toBe("Test response");
      expect(result.metadata.success).toBe(true);
      expect(result.metadata.agentId).toBe(agentId.id);
    });
    
    it("should cache results when enabled", async () => {
      const task: TaskDefinition = {
        id: generateId("task"),
        parentId: generateId("swarm"),
        type: "query",
        objective: "Cached task",
        description: "Test cached task description",
        status: "pending",
        priority: "normal",
        assignedTo: undefined,
        dependencies: [],
        result: undefined,
        error: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
        startedAt: undefined,
        completedAt: undefined,
        constraints: {
          timeout: 30000,
          maxRetries: 3,
          requiresApproval: false,
        },
        metadata: {},
        context: undefined,
        statusHistory: [],
        attempts: [],
      };
      
      const agentId: AgentId = {
        id: generateId("agent"),
        type: "analyzer",
      };
      
      // Mock the connection pool for this test
      const pool = (executor as any).connectionPool;
      pool.execute = jest.fn().mockImplementation(async (callback: any) => {
        const mockApi = {
          complete: jest.fn().mockResolvedValue({
            content: [{ text: "Cached response" }],
            usage: { input_tokens: 10, output_tokens: 20 },
          }),
        };
        return callback(mockApi);
      });
      
      // First execution
      const result1 = await executor.executeTask(task, agentId);
      
      // Second execution should hit cache
      const result2 = await executor.executeTask(task, agentId);
      
      // Verify both results are the same
      expect(result1.output).toBe(result2.output);
      
      const metrics = executor.getMetrics();
      expect(metrics.cacheHitRate).toBeGreaterThan(0);
      expect(pool.execute).toHaveBeenCalledTimes(1); // Only called once due to caching
    });
    
    it("should track metrics correctly", async () => {
      const initialMetrics = executor.getMetrics();
      expect(initialMetrics.totalExecuted).toBe(0);
      
      // Create a test task
      const task: TaskDefinition = {
        id: generateId("task"),
        parentId: generateId("swarm"),
        type: "test",
        objective: "Metrics test",
        description: "Test for metrics tracking",
        status: "pending",
        priority: "normal",
        assignedTo: undefined,
        dependencies: [],
        result: undefined,
        error: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
        startedAt: undefined,
        completedAt: undefined,
        constraints: {
          timeout: 30000,
          maxRetries: 3,
          requiresApproval: false,
        },
        metadata: {},
        context: undefined,
        statusHistory: [],
        attempts: [],
      };
      
      const agentId: AgentId = {
        id: generateId("agent"),
        type: "test",
      };
      
      // Execute a task
      await executor.executeTask(task, agentId);
      
      const updatedMetrics = executor.getMetrics();
      expect(updatedMetrics.totalExecuted).toBe(1);
      expect(updatedMetrics.totalSucceeded).toBe(1);
      expect(updatedMetrics.avgExecutionTime).toBeGreaterThan(0);
    });
  });
});