/**
 * Simplified Strategy Interfaces for Swarm Task Execution
 * Removed complex inheritance and overengineered patterns
 */

import { TaskDefinition, SwarmObjective, AgentState, SwarmConfig } from "../types.js";

// Simple metrics - only track what's essential
export interface StrategyMetrics {
  tasksCompleted: number;
  averageExecutionTime: number;
  successRate: number;
}

// Simplified interfaces - only what's actually needed
export interface DecompositionResult {
  tasks: TaskDefinition[];
  dependencies: Map<string, string[]>;
  estimatedDuration: number;
}

export interface TaskBatch {
  id: string;
  tasks: TaskDefinition[];
  parallel: boolean;
}

// Simple strategy interface - no inheritance needed
export interface IStrategy {
  decomposeObjective(objective: SwarmObjective): Promise<DecompositionResult>;
}

// Simple utility functions instead of class methods
export function detectTaskType(description: string): string {
  if (/create|build|implement|develop/i.test(description)) return "development";
  if (/test|verify|validate/i.test(description)) return "testing";
  if (/analyze|research|investigate/i.test(description)) return "analysis";
  if (/document|write|explain/i.test(description)) return "documentation";
  if (/optimize|improve|refactor/i.test(description)) return "optimization";
  return "generic";
}

export function createMetrics(): StrategyMetrics {
  return {
    tasksCompleted: 0,
    averageExecutionTime: 0,
    successRate: 0,
  };
}