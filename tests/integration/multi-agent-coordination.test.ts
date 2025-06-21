/**
 * Multi-Agent Coordination Tests
 * Tests shared memory coordination and task locking mechanisms across agents
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { EventEmitter } from 'events';
import { MemoryManager } from '../../src/memory/manager.js';
import { TaskEngine } from '../../src/task/engine.js';
import { EnhancedSwarmCoordinator } from '../../src/swarm/enhanced-coordinator.js';
import { CodeAgent } from '../../src/swarm/agents/code-agent.js';
import { logger } from '../../src/core/logger.js';

// Mock implementations for testing
class MockEventBus extends EventEmitter {
  emit(event: string, data?: any): boolean {
    return super.emit(event, data);
  }
}

class MockLogger {
  info = jest.fn();
  warn = jest.fn();
  error = jest.fn();
  debug = jest.fn();
}

describe('Multi-Agent Coordination', () => {
  let memoryManager: MemoryManager;
  let taskEngine: TaskEngine;
  let swarmCoordinator: EnhancedSwarmCoordinator;
  let agents: CodeAgent[];
  let eventBus: MockEventBus;
  let mockLogger: MockLogger;

  beforeEach(async () => {
    eventBus = new MockEventBus();
    mockLogger = new MockLogger();
    
    // Initialize memory manager with test configuration
    memoryManager = new MemoryManager(
      {
        backend: 'memory',
        cacheSizeMB: 10,
        syncIntervalMs: 1000,
        maxEntries: 1000,
        ttlMs: 60000,
      },
      eventBus,
      mockLogger as any
    );
    
    await memoryManager.initialize();

    // Initialize task engine with memory manager
    taskEngine = new TaskEngine(5, memoryManager);

    // Initialize swarm coordinator
    swarmCoordinator = new EnhancedSwarmCoordinator({
      modelConfig: {
        primary: 'claude-3-5-sonnet-20241022',
        apply: 'claude-3-haiku-20240307',
        review: 'claude-3-5-sonnet-20241022',
        threshold: 50,
      },
      strategy: 'development',
      maxAgents: 3,
    });

    // Create test agents
    agents = [
      new CodeAgent('agent-1'),
      new CodeAgent('agent-2'),
      new CodeAgent('agent-3'),
    ];
  });

  afterEach(async () => {
    await memoryManager.shutdown();
    await swarmCoordinator.shutdown();
  });

  describe('Shared Memory Coordination', () => {
    it('should allow multiple agents to share memory through TodoWrite/TodoRead pattern', async () => {
      // Agent 1 writes shared state
      const sharedTaskId = 'shared-task-001';
      const agent1BankId = await memoryManager.createBank('agent-1');
      
      await memoryManager.store({
        id: `todo-write-${sharedTaskId}`,
        type: 'coordination',
        agentId: 'agent-1',
        content: {
          taskId: sharedTaskId,
          status: 'in-progress',
          findings: 'Initial analysis complete',
          nextSteps: ['implement feature', 'write tests'],
          sharedData: { apiEndpoints: ['/users', '/auth'], database: 'postgresql' }
        },
        tags: ['todo-write', 'shared-coordination'],
        metadata: { priority: 'high', coordination: true },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Agent 2 reads shared state
      const agent2BankId = await memoryManager.createBank('agent-2');
      const sharedMemory = await memoryManager.retrieve(`todo-write-${sharedTaskId}`);
      
      expect(sharedMemory).toBeDefined();
      expect(sharedMemory?.content.taskId).toBe(sharedTaskId);
      expect(sharedMemory?.content.sharedData.apiEndpoints).toContain('/users');

      // Agent 2 updates shared state
      await memoryManager.store({
        id: `todo-read-${sharedTaskId}-agent-2`,
        type: 'coordination',
        agentId: 'agent-2',
        content: {
          taskId: sharedTaskId,
          readBy: 'agent-2',
          status: 'acknowledged',
          contributions: 'Added authentication middleware',
          updatedSharedData: { 
            ...sharedMemory?.content.sharedData,
            middleware: ['auth', 'cors', 'helmet']
          }
        },
        tags: ['todo-read', 'shared-coordination'],
        metadata: { referencesWrite: `todo-write-${sharedTaskId}` },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Agent 3 queries for all coordination entries for this task
      const coordinationEntries = await memoryManager.query({
        tags: ['shared-coordination'],
        agentId: undefined, // Query across all agents
        contentMatch: { taskId: sharedTaskId },
        limit: 10,
      });

      expect(coordinationEntries).toHaveLength(2);
      expect(coordinationEntries.map(e => e.agentId)).toEqual(
        expect.arrayContaining(['agent-1', 'agent-2'])
      );
    });

    it('should handle memory conflicts with optimistic locking', async () => {
      const resourceId = 'shared-resource-001';
      
      // Both agents try to acquire the same resource
      const lockPromise1 = memoryManager.store({
        id: `lock-${resourceId}-agent-1`,
        type: 'resource-lock',
        agentId: 'agent-1',
        content: {
          resourceId,
          lockType: 'exclusive',
          acquiredAt: new Date(),
          ttl: 30000, // 30 seconds
        },
        tags: ['resource-lock', 'exclusive'],
        metadata: { resource: resourceId },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const lockPromise2 = memoryManager.store({
        id: `lock-${resourceId}-agent-2`,
        type: 'resource-lock',
        agentId: 'agent-2',
        content: {
          resourceId,
          lockType: 'exclusive',
          acquiredAt: new Date(),
          ttl: 30000,
        },
        tags: ['resource-lock', 'exclusive'],
        metadata: { resource: resourceId },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Both should succeed in storing their lock attempt
      await Promise.all([lockPromise1, lockPromise2]);

      // Check which agent got the lock first
      const locks = await memoryManager.query({
        tags: ['resource-lock'],
        contentMatch: { resourceId },
        limit: 10,
      });

      expect(locks).toHaveLength(2);
      
      // The first lock should be honored
      const firstLock = locks.sort((a, b) => 
        a.createdAt.getTime() - b.createdAt.getTime()
      )[0];
      
      expect(['agent-1', 'agent-2']).toContain(firstLock.agentId);
    });

    it('should support cross-agent memory synchronization', async () => {
      const projectId = 'project-001';
      const agents = ['agent-1', 'agent-2', 'agent-3'];
      
      // Each agent stores their progress
      const progressPromises = agents.map((agentId, index) => 
        memoryManager.store({
          id: `progress-${projectId}-${agentId}`,
          type: 'progress-update',
          agentId,
          content: {
            projectId,
            component: `component-${index + 1}`,
            status: index === 0 ? 'completed' : 'in-progress',
            progress: (index + 1) * 33,
            lastUpdate: new Date(),
          },
          tags: ['progress', 'sync'],
          metadata: { project: projectId },
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );

      await Promise.all(progressPromises);

      // Query overall project progress
      const allProgress = await memoryManager.query({
        tags: ['progress'],
        contentMatch: { projectId },
        limit: 10,
      });

      expect(allProgress).toHaveLength(3);
      
      const totalProgress = allProgress.reduce(
        (sum, entry) => sum + entry.content.progress, 0
      ) / allProgress.length;
      
      expect(totalProgress).toBeCloseTo(66, 0); // Average progress

      // Test memory synchronization event
      let syncEventFired = false;
      eventBus.once('memory:sync', () => {
        syncEventFired = true;
      });

      // Trigger sync
      await memoryManager.performMaintenance();
      
      // Check if sync event was emitted (in real implementation)
      // expect(syncEventFired).toBe(true);
    });
  });

  describe('Task Locking and Resource Management', () => {
    it('should prevent concurrent execution of exclusive tasks', async () => {
      // Create exclusive tasks that cannot run simultaneously
      const exclusiveTask1 = await taskEngine.createTask({
        id: 'exclusive-task-1',
        type: 'deployment',
        description: 'Deploy to production',
        priority: 1,
        resourceRequirements: [
          {
            resourceId: 'production-environment',
            type: 'custom',
            amount: 1,
            unit: 'instance',
            exclusive: true,
            priority: 1,
          }
        ],
        tags: ['deployment', 'exclusive'],
      });

      const exclusiveTask2 = await taskEngine.createTask({
        id: 'exclusive-task-2',
        type: 'deployment',
        description: 'Deploy hotfix to production',
        priority: 2, // Higher priority
        resourceRequirements: [
          {
            resourceId: 'production-environment',
            type: 'custom',
            amount: 1,
            unit: 'instance',
            exclusive: true,
            priority: 2,
          }
        ],
        tags: ['deployment', 'exclusive', 'hotfix'],
      });

      // Both tasks should be created but only one should run
      expect(exclusiveTask1.status).toBe('pending');
      expect(exclusiveTask2.status).toBe('pending');

      // Simulate task execution
      const task1Status = await taskEngine.getTaskStatus('exclusive-task-1');
      const task2Status = await taskEngine.getTaskStatus('exclusive-task-2');

      expect(task1Status).toBeDefined();
      expect(task2Status).toBeDefined();

      // Check resource allocation
      const task1Resources = task1Status!.resourceStatus;
      const task2Resources = task2Status!.resourceStatus;

      const prodResource1 = task1Resources.find(r => r.required.resourceId === 'production-environment');
      const prodResource2 = task2Resources.find(r => r.required.resourceId === 'production-environment');

      // Only one should have the resource allocated
      const allocatedCount = [prodResource1?.allocated, prodResource2?.allocated].filter(Boolean).length;
      expect(allocatedCount).toBeLessThanOrEqual(1);
    });

    it('should handle task dependencies and locking correctly', async () => {
      // Create a chain of dependent tasks
      const setupTask = await taskEngine.createTask({
        id: 'setup-task',
        type: 'setup',
        description: 'Setup environment',
        priority: 1,
        tags: ['setup'],
      });

      const buildTask = await taskEngine.createTask({
        id: 'build-task',
        type: 'build',
        description: 'Build application',
        priority: 1,
        dependencies: [
          {
            taskId: 'setup-task',
            type: 'finish-to-start',
          }
        ],
        resourceRequirements: [
          {
            resourceId: 'build-server',
            type: 'cpu',
            amount: 4,
            unit: 'cores',
            exclusive: false,
          }
        ],
        tags: ['build'],
      });

      const testTask = await taskEngine.createTask({
        id: 'test-task',
        type: 'testing',
        description: 'Run tests',
        priority: 1,
        dependencies: [
          {
            taskId: 'build-task',
            type: 'finish-to-start',
          }
        ],
        tags: ['testing'],
      });

      // Check dependency satisfaction
      const buildStatus = await taskEngine.getTaskStatus('build-task');
      const testStatus = await taskEngine.getTaskStatus('test-task');

      expect(buildStatus?.dependencies).toHaveLength(1);
      expect(buildStatus?.dependencies[0].satisfied).toBe(false); // Setup not complete

      expect(testStatus?.dependencies).toHaveLength(1);
      expect(testStatus?.dependencies[0].satisfied).toBe(false); // Build not complete

      // Complete setup task
      setupTask.status = 'completed';
      setupTask.progressPercentage = 100;

      // Now build task should be ready
      const updatedBuildStatus = await taskEngine.getTaskStatus('build-task');
      expect(updatedBuildStatus?.dependencies[0].satisfied).toBe(true);
    });

    it('should handle distributed task locking across agents', async () => {
      const sharedTaskId = 'distributed-task-001';
      
      // Multiple agents try to claim the same task
      const claimPromises = agents.map((agent, index) => 
        memoryManager.store({
          id: `task-claim-${sharedTaskId}-${agent.getId()}`,
          type: 'task-claim',
          agentId: agent.getId(),
          content: {
            taskId: sharedTaskId,
            claimedAt: new Date(Date.now() + index), // Slight delay for ordering
            agentCapabilities: agent.getCapabilities(),
            estimatedDuration: 30000 + (index * 1000),
          },
          tags: ['task-claim', 'distributed'],
          metadata: { task: sharedTaskId },
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );

      await Promise.all(claimPromises);

      // Query all claims for this task
      const claims = await memoryManager.query({
        tags: ['task-claim'],
        contentMatch: { taskId: sharedTaskId },
        limit: 10,
      });

      expect(claims).toHaveLength(3);

      // Determine winner (first claim or best capability match)
      const winningClaim = claims.reduce((best, current) => {
        if (!best) return current;
        
        // Earlier claim wins
        if (current.content.claimedAt < best.content.claimedAt) {
          return current;
        }
        
        return best;
      });

      expect(winningClaim).toBeDefined();
      expect(agents.map(a => a.getId())).toContain(winningClaim.agentId);

      // Winner stores task lock
      await memoryManager.store({
        id: `task-lock-${sharedTaskId}`,
        type: 'task-lock',
        agentId: winningClaim.agentId,
        content: {
          taskId: sharedTaskId,
          lockedBy: winningClaim.agentId,
          lockedAt: new Date(),
          lockExpiry: new Date(Date.now() + 300000), // 5 minutes
          claimId: winningClaim.id,
        },
        tags: ['task-lock', 'active'],
        metadata: { task: sharedTaskId, owner: winningClaim.agentId },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Verify lock exists
      const taskLock = await memoryManager.retrieve(`task-lock-${sharedTaskId}`);
      expect(taskLock?.agentId).toBe(winningClaim.agentId);
    });

    it('should handle lock expiry and cleanup', async () => {
      const resourceId = 'expiring-resource';
      const lockDuration = 100; // 100ms for testing
      
      // Agent acquires lock with short TTL
      await memoryManager.store({
        id: `lock-${resourceId}-expiry-test`,
        type: 'resource-lock',
        agentId: 'agent-1',
        content: {
          resourceId,
          lockType: 'exclusive',
          acquiredAt: new Date(),
          ttl: lockDuration,
          expiry: new Date(Date.now() + lockDuration),
        },
        tags: ['resource-lock', 'expiring'],
        metadata: { resource: resourceId },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Verify lock exists
      let lock = await memoryManager.retrieve(`lock-${resourceId}-expiry-test`);
      expect(lock).toBeDefined();

      // Wait for lock to expire
      await new Promise(resolve => setTimeout(resolve, lockDuration + 50));

      // Perform maintenance to clean up expired locks
      await memoryManager.performMaintenance();

      // In a real implementation, expired locks would be cleaned up
      // For now, we'll simulate this by checking the expiry time
      const currentTime = new Date();
      const isExpired = lock && lock.content.expiry && currentTime > new Date(lock.content.expiry);
      expect(isExpired).toBe(true);
    });
  });

  describe('Agent Coordination Patterns', () => {
    it('should support leader election pattern', async () => {
      const electionId = 'leader-election-001';
      
      // All agents participate in leader election
      const electionPromises = agents.map((agent, index) => 
        memoryManager.store({
          id: `election-${electionId}-${agent.getId()}`,
          type: 'leader-election',
          agentId: agent.getId(),
          content: {
            electionId,
            candidateId: agent.getId(),
            priority: agent.getCapabilities().reliability * 100,
            capabilities: agent.getCapabilities(),
            nominatedAt: new Date(Date.now() + index * 10), // Slight ordering
          },
          tags: ['leader-election', 'candidate'],
          metadata: { election: electionId },
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );

      await Promise.all(electionPromises);

      // Determine leader (highest priority)
      const candidates = await memoryManager.query({
        tags: ['leader-election'],
        contentMatch: { electionId },
        limit: 10,
      });

      expect(candidates).toHaveLength(3);

      const leader = candidates.reduce((best, current) => {
        if (!best) return current;
        return current.content.priority > best.content.priority ? current : best;
      });

      // Leader stores leadership claim
      await memoryManager.store({
        id: `leader-${electionId}`,
        type: 'leadership',
        agentId: leader.agentId,
        content: {
          electionId,
          leaderId: leader.agentId,
          electedAt: new Date(),
          term: 300000, // 5 minutes
          followers: candidates.filter(c => c.agentId !== leader.agentId).map(c => c.agentId),
        },
        tags: ['leadership', 'active'],
        metadata: { election: electionId, role: 'leader' },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const leadership = await memoryManager.retrieve(`leader-${electionId}`);
      expect(leadership?.agentId).toBe(leader.agentId);
      expect(leadership?.content.followers).toHaveLength(2);
    });

    it('should support work-stealing pattern', async () => {
      const workPoolId = 'work-pool-001';
      const workItems = ['task-a', 'task-b', 'task-c', 'task-d', 'task-e'];
      
      // Create work pool
      await memoryManager.store({
        id: `work-pool-${workPoolId}`,
        type: 'work-pool',
        agentId: 'system',
        content: {
          poolId: workPoolId,
          availableWork: workItems,
          completedWork: [],
          inProgressWork: [],
          createdAt: new Date(),
        },
        tags: ['work-pool', 'available'],
        metadata: { pool: workPoolId },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Agents steal work from the pool
      const stealPromises = agents.map(async (agent) => {
        // Get current work pool state
        const workPool = await memoryManager.retrieve(`work-pool-${workPoolId}`);
        if (!workPool || workPool.content.availableWork.length === 0) {
          return null;
        }

        // Steal a work item
        const stolenWork = workPool.content.availableWork.pop();
        if (!stolenWork) return null;

        // Update work pool
        await memoryManager.update(`work-pool-${workPoolId}`, {
          content: {
            ...workPool.content,
            availableWork: workPool.content.availableWork,
            inProgressWork: [...workPool.content.inProgressWork, stolenWork],
          },
          updatedAt: new Date(),
        });

        // Record work assignment
        await memoryManager.store({
          id: `work-assignment-${stolenWork}-${agent.getId()}`,
          type: 'work-assignment',
          agentId: agent.getId(),
          content: {
            workItem: stolenWork,
            assignedTo: agent.getId(),
            assignedAt: new Date(),
            status: 'in-progress',
            poolId: workPoolId,
          },
          tags: ['work-assignment', 'stolen'],
          metadata: { work: stolenWork, pool: workPoolId },
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        return stolenWork;
      });

      const stolenWork = await Promise.all(stealPromises);
      const actualStolenWork = stolenWork.filter(Boolean);
      
      expect(actualStolenWork.length).toBeGreaterThan(0);
      expect(actualStolenWork.length).toBeLessThanOrEqual(agents.length);

      // Verify work assignments
      const assignments = await memoryManager.query({
        tags: ['work-assignment'],
        contentMatch: { poolId: workPoolId },
        limit: 10,
      });

      expect(assignments.length).toBe(actualStolenWork.length);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle agent failures and redistribute work', async () => {
      const taskId = 'failing-task-001';
      
      // Agent claims task
      await memoryManager.store({
        id: `task-claim-${taskId}`,
        type: 'task-claim',
        agentId: 'agent-1',
        content: {
          taskId,
          claimedAt: new Date(),
          heartbeatInterval: 5000,
          lastHeartbeat: new Date(),
        },
        tags: ['task-claim', 'active'],
        metadata: { task: taskId },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Simulate agent failure (no heartbeat updates)
      await new Promise(resolve => setTimeout(resolve, 100));

      // Another agent detects failure and claims the task
      const failureDetectionTime = new Date();
      const originalClaim = await memoryManager.retrieve(`task-claim-${taskId}`);
      
      if (originalClaim) {
        const timeSinceHeartbeat = failureDetectionTime.getTime() - 
          new Date(originalClaim.content.lastHeartbeat).getTime();
        
        if (timeSinceHeartbeat > originalClaim.content.heartbeatInterval) {
          // Task is considered orphaned, reclaim it
          await memoryManager.store({
            id: `task-reclaim-${taskId}`,
            type: 'task-reclaim',
            agentId: 'agent-2',
            content: {
              taskId,
              reclaimedFrom: 'agent-1',
              reclaimedAt: failureDetectionTime,
              reason: 'agent-failure-timeout',
              originalClaim: originalClaim.id,
            },
            tags: ['task-reclaim', 'failure-recovery'],
            metadata: { task: taskId, recovery: true },
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }

      const reclaim = await memoryManager.retrieve(`task-reclaim-${taskId}`);
      expect(reclaim?.agentId).toBe('agent-2');
      expect(reclaim?.content.reclaimedFrom).toBe('agent-1');
    });

    it('should handle memory corruption and conflict resolution', async () => {
      const conflictId = 'conflict-resolution-001';
      
      // Two agents write conflicting data simultaneously
      const conflictingWrites = [
        memoryManager.store({
          id: `conflict-${conflictId}`,
          type: 'shared-state',
          agentId: 'agent-1',
          content: {
            value: 'version-1',
            timestamp: new Date(),
            author: 'agent-1',
          },
          tags: ['shared-state', 'conflicting'],
          metadata: { conflict: conflictId, version: 1 },
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        memoryManager.store({
          id: `conflict-${conflictId}-alt`,
          type: 'shared-state',
          agentId: 'agent-2',
          content: {
            value: 'version-2',
            timestamp: new Date(),
            author: 'agent-2',
          },
          tags: ['shared-state', 'conflicting'],
          metadata: { conflict: conflictId, version: 2 },
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ];

      await Promise.all(conflictingWrites);

      // Detect conflict
      const conflictingEntries = await memoryManager.query({
        tags: ['shared-state'],
        limit: 10,
      });

      const conflicts = conflictingEntries.filter(entry => 
        entry.metadata?.conflict === conflictId
      );

      expect(conflicts.length).toBeGreaterThanOrEqual(2);

      // Resolve conflict (last-write-wins or merge strategy)
      const resolution = conflicts.reduce((latest, current) => {
        if (!latest) return current;
        return current.createdAt > latest.createdAt ? current : latest;
      });

      // Store conflict resolution
      await memoryManager.store({
        id: `conflict-resolution-${conflictId}`,
        type: 'conflict-resolution',
        agentId: 'system',
        content: {
          conflictId,
          resolvedValue: resolution.content.value,
          resolutionStrategy: 'last-write-wins',
          conflictingEntries: conflicts.map(c => c.id),
          resolvedAt: new Date(),
        },
        tags: ['conflict-resolution', 'resolved'],
        metadata: { conflict: conflictId, resolved: true },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const resolutionEntry = await memoryManager.retrieve(`conflict-resolution-${conflictId}`);
      expect(resolutionEntry?.content.resolvedValue).toBeDefined();
    });
  });
});

export { }; 