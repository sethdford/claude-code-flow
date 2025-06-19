// Jest setup file for Node.js environment with ES modules support
import { jest } from '@jest/globals';

// Mock console methods to suppress output during tests
globalThis.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Set test timeout
jest.setTimeout(30000);

// Mock process.exit to prevent tests from actually exiting
globalThis.process.exit = jest.fn();