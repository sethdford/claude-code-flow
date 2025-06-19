// Jest setup file for Node.js environment
import { jest } from '@jest/globals';

// Suppress console output during tests
globalThis.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Add custom Jest configuration
globalThis.process.exit = jest.fn();

// Set default test timeout
jest.setTimeout(30000);

// Track and cleanup leaked workers
const activeWorkers = new Set();

globalThis.trackWorker = (worker) => {
  activeWorkers.add(worker);
};

globalThis.untrackWorker = (worker) => {
  activeWorkers.delete(worker);
};

afterEach(() => {
  // Cleanup any leaked workers
  if (activeWorkers.size > 0) {
    console.warn(`Warning: ${activeWorkers.size} worker(s) were not properly cleaned up`);
    activeWorkers.forEach(worker => {
      try {
        worker.terminate();
      } catch (e) {
        // Ignore errors during cleanup
      }
    });
    activeWorkers.clear();
  }
});