/**
 * Swarm Optimizations
 * Export all optimization components
 */

export { ClaudeConnectionPool } from "./connection-pool.js";
export type { PoolConfig, PooledConnection } from "./connection-pool.js";

export { AsyncFileManager } from "./async-file-manager.js";
export type { FileOperationResult } from "./async-file-manager.js";

export { CircularBuffer } from "./circular-buffer.js";

export { TTLMap } from "./ttl-map.js";
export type { TTLMapOptions } from "./ttl-map.js";

export { OptimizedExecutor } from "./optimized-executor.js";
export type { ExecutorConfig, ExecutionMetrics } from "./optimized-executor.js";

// Re-export commonly used together
export const createOptimizedSwarmStack = (_config?: {
  connectionPool?: any;
  executor?: any;
  fileManager?: any;
}) => {
  // NOTE: Temporarily disabled due to compilation issues
  // Will be re-enabled once underlying files are fixed
  return {
    connectionPool: null as any,
    fileManager: null as any,
    executor: null as any,
    shutdown: async () => {
      // Placeholder implementation
    },
  };
};