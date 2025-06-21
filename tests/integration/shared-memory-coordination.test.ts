/**
 * Shared Memory Coordination Tests
 * Tests shared memory coordination and task locking mechanisms across agents
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { EventEmitter } from 'events';

// Mock implementations for testing
class MockMemoryManager {
  private storage = new Map<string, any>();
  private banks = new Map<string, string>();

  async createBank(agentId: string): Promise<string> {
    const bankId = `bank-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    this.banks.set(bankId, agentId);
    return bankId;
  }

  async store(entry: any): Promise<void> {
    this.storage.set(entry.id, {
      ...entry,
      createdAt: entry.createdAt || new Date(),
      updatedAt: new Date(),
    });
  }

  async retrieve(id: string): Promise<any> {
    return this.storage.get(id);
  }

  async query(query: any): Promise<any[]> {
    const results: any[] = [];
    for (const [id, entry] of this.storage.entries()) {
      let matches = true;

      if (query.tags && query.tags.length > 0) {
        const entryTags = entry.tags || [];
        matches = matches && query.tags.some((tag: string) => entryTags.includes(tag));
      }

      if (query.agentId && entry.agentId !== query.agentId) {
        matches = false;
      }

      if (query.contentMatch) {
        for (const [key, value] of Object.entries(query.contentMatch)) {
          if (entry.content?.[key] !== value) {
            matches = false;
            break;
          }
        }
      }

      if (matches) {
        results.push(entry);
      }
    }

    return results.slice(0, query.limit || 100);
  }

  async update(id: string, updates: any): Promise<void> {
    const existing = this.storage.get(id);
    if (existing) {
      this.storage.set(id, { ...existing, ...updates, updatedAt: new Date() });
    }
  }

  async delete(id: string): Promise<void> {
    this.storage.delete(id);
  }

  async performMaintenance(): Promise<void> {
    // Simulate cleanup of expired entries
    const now = Date.now();
    for (const [id, entry] of this.storage.entries()) {
      if (entry.content?.expiry && now > new Date(entry.content.expiry).getTime()) {
        this.storage.delete(id);
      }
    }
  }

  clear(): void {
    this.storage.clear();
    this.banks.clear();
  }
}

class MockAgent {
  constructor(private id: string) {}

  getId(): string {
    return this.id;
  }

  getCapabilities() {
    return {
      codeGeneration: true,
      analysis: true,
      testing: true,
      reliability: 0.8 + Math.random() * 0.2,
    };
  }

  isAvailable(): boolean {
    return true;
  }
}

describe('Shared Memory Coordination', () => {
  let memoryManager: MockMemoryManager;
  let agents: MockAgent[];

  beforeEach(() => {
    memoryManager = new MockMemoryManager();
    agents = [
      new MockAgent('agent-1'),
      new MockAgent('agent-2'),
      new MockAgent('agent-3'),
    ];
  });

  afterEach(() => {
    memoryManager.clear();
  });

  describe('TodoWrite/TodoRead Pattern', () => {
    it('should allow agents to coordinate through shared memory', async () => {
      const sharedTaskId = 'shared-task-001';
      
      // Agent 1 writes initial state (TodoWrite)
      await memoryManager.store({
        id: `todo-write-${sharedTaskId}`,
        type: 'coordination',
        agentId: 'agent-1',
        content: {
          taskId: sharedTaskId,
          status: 'in-progress',
          findings: 'Initial analysis complete',
          nextSteps: ['implement feature', 'write tests'],
          sharedData: { 
            apiEndpoints: ['/users', '/auth'], 
            database: 'postgresql',
            architecture: 'microservices'
          }
        },
        tags: ['todo-write', 'shared-coordination'],
        metadata: { priority: 'high', coordination: true },
      });

      // Agent 2 reads and acknowledges (TodoRead)
      const sharedMemory = await memoryManager.retrieve(`todo-write-${sharedTaskId}`);
      expect(sharedMemory).toBeDefined();
      expect(sharedMemory.content.taskId).toBe(sharedTaskId);
      expect(sharedMemory.content.sharedData.apiEndpoints).toContain('/users');

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
            ...sharedMemory.content.sharedData,
            middleware: ['auth', 'cors', 'helmet']
          }
        },
        tags: ['todo-read', 'shared-coordination'],
        metadata: { referencesWrite: `todo-write-${sharedTaskId}` },
      });

      // Agent 3 queries all coordination for this task
      const coordinationEntries = await memoryManager.query({
        tags: ['shared-coordination'],
        contentMatch: { taskId: sharedTaskId },
        limit: 10,
      });

      expect(coordinationEntries).toHaveLength(2);
      expect(coordinationEntries.map(e => e.agentId)).toEqual(
        expect.arrayContaining(['agent-1', 'agent-2'])
      );

      // Verify data flow
      const writeEntry = coordinationEntries.find(e => e.tags.includes('todo-write'));
      const readEntry = coordinationEntries.find(e => e.tags.includes('todo-read'));
      
      expect(writeEntry?.content.sharedData.database).toBe('postgresql');
      expect(readEntry?.content.updatedSharedData.middleware).toContain('auth');
    });

    it('should handle multiple readers for the same write', async () => {
      const sharedTaskId = 'multi-reader-task';
      
      // Agent 1 writes shared state
      await memoryManager.store({
        id: `todo-write-${sharedTaskId}`,
        type: 'coordination',
        agentId: 'agent-1',
        content: {
          taskId: sharedTaskId,
          specification: 'Build user management system',
          requirements: ['authentication', 'authorization', 'user profiles'],
          sharedData: { framework: 'express', database: 'mongodb' }
        },
        tags: ['todo-write', 'shared-coordination'],
      });

      // Multiple agents read and contribute
      const readers = ['agent-2', 'agent-3'];
      const readPromises = readers.map(agentId => 
        memoryManager.store({
          id: `todo-read-${sharedTaskId}-${agentId}`,
          type: 'coordination',
          agentId,
          content: {
            taskId: sharedTaskId,
            readBy: agentId,
            status: 'acknowledged',
            specialization: agentId === 'agent-2' ? 'frontend' : 'backend',
            contribution: agentId === 'agent-2' ? 'React components' : 'API endpoints'
          },
          tags: ['todo-read', 'shared-coordination'],
          metadata: { referencesWrite: `todo-write-${sharedTaskId}` },
        })
      );

      await Promise.all(readPromises);

      // Query all coordination entries
      const allEntries = await memoryManager.query({
        tags: ['shared-coordination'],
        contentMatch: { taskId: sharedTaskId },
        limit: 10,
      });

      expect(allEntries).toHaveLength(3); // 1 write + 2 reads
      
      const writeEntry = allEntries.find(e => e.tags.includes('todo-write'));
      const readEntries = allEntries.filter(e => e.tags.includes('todo-read'));
      
      expect(writeEntry?.agentId).toBe('agent-1');
      expect(readEntries).toHaveLength(2);
      expect(readEntries.map(e => e.content.specialization)).toEqual(
        expect.arrayContaining(['frontend', 'backend'])
      );
    });
  });

  describe('Resource Locking', () => {
    it('should handle exclusive resource locking', async () => {
      const resourceId = 'production-database';
      
      // Agent 1 attempts to acquire exclusive lock
      await memoryManager.store({
        id: `lock-${resourceId}-agent-1`,
        type: 'resource-lock',
        agentId: 'agent-1',
        content: {
          resourceId,
          lockType: 'exclusive',
          acquiredAt: new Date(),
          ttl: 30000,
          purpose: 'database migration'
        },
        tags: ['resource-lock', 'exclusive'],
        metadata: { resource: resourceId },
      });

      // Agent 2 attempts to acquire the same resource
      await memoryManager.store({
        id: `lock-${resourceId}-agent-2`,
        type: 'resource-lock',
        agentId: 'agent-2',
        content: {
          resourceId,
          lockType: 'exclusive',
          acquiredAt: new Date(Date.now() + 100), // Slightly later
          ttl: 30000,
          purpose: 'data backup'
        },
        tags: ['resource-lock', 'exclusive'],
        metadata: { resource: resourceId },
      });

      // Check which agent got the lock first
      const locks = await memoryManager.query({
        tags: ['resource-lock'],
        contentMatch: { resourceId },
        limit: 10,
      });

      expect(locks).toHaveLength(2);
      
      // Determine first lock by acquisition time
      const firstLock = locks.reduce((earliest, current) => 
        !earliest || current.content.acquiredAt < earliest.content.acquiredAt 
          ? current : earliest
      );
      
      expect(firstLock.agentId).toBe('agent-1');
      
      // Agent 2 should wait or find alternative
      const secondLock = locks.find(l => l.agentId === 'agent-2');
      expect(secondLock?.content.purpose).toBe('data backup');
    });

    it('should handle shared resource locking', async () => {
      const resourceId = 'read-only-database';
      const maxReaders = 3;
      
      // Multiple agents acquire shared read locks
      const lockPromises = agents.map(agent => 
        memoryManager.store({
          id: `lock-${resourceId}-${agent.getId()}`,
          type: 'resource-lock',
          agentId: agent.getId(),
          content: {
            resourceId,
            lockType: 'shared',
            acquiredAt: new Date(),
            ttl: 60000,
            maxConcurrent: maxReaders,
            purpose: 'data analysis'
          },
          tags: ['resource-lock', 'shared'],
          metadata: { resource: resourceId },
        })
      );

      await Promise.all(lockPromises);

      // All agents should be able to acquire shared locks
      const sharedLocks = await memoryManager.query({
        tags: ['resource-lock'],
        contentMatch: { resourceId, lockType: 'shared' },
        limit: 10,
      });

      expect(sharedLocks).toHaveLength(3);
      expect(sharedLocks.every(lock => lock.content.lockType === 'shared')).toBe(true);
    });

    it('should handle lock expiry and cleanup', async () => {
      const resourceId = 'expiring-resource';
      const shortTtl = 100; // 100ms
      
      // Agent acquires lock with short TTL
      await memoryManager.store({
        id: `lock-${resourceId}-expiry`,
        type: 'resource-lock',
        agentId: 'agent-1',
        content: {
          resourceId,
          lockType: 'exclusive',
          acquiredAt: new Date(),
          ttl: shortTtl,
          expiry: new Date(Date.now() + shortTtl)
        },
        tags: ['resource-lock', 'expiring'],
        metadata: { resource: resourceId },
      });

      // Verify lock exists
      let lock = await memoryManager.retrieve(`lock-${resourceId}-expiry`);
      expect(lock).toBeDefined();
      expect(lock.content.resourceId).toBe(resourceId);

      // Wait for expiry
      await new Promise(resolve => setTimeout(resolve, shortTtl + 50));

      // Perform maintenance to clean up expired locks
      await memoryManager.performMaintenance();

      // Verify lock is cleaned up
      lock = await memoryManager.retrieve(`lock-${resourceId}-expiry`);
      expect(lock).toBeUndefined();
    });
  });

  describe('Task Coordination', () => {
    it('should handle task claiming and assignment', async () => {
      const taskId = 'distributed-task-001';
      
      // Multiple agents compete for the same task
      const claimPromises = agents.map((agent, index) => 
        memoryManager.store({
          id: `task-claim-${taskId}-${agent.getId()}`,
          type: 'task-claim',
          agentId: agent.getId(),
          content: {
            taskId,
            claimedAt: new Date(Date.now() + index * 10), // Slight ordering
            capabilities: agent.getCapabilities(),
            estimatedDuration: 30000 + (index * 5000),
            priority: 1 + index,
          },
          tags: ['task-claim', 'competing'],
          metadata: { task: taskId },
        })
      );

      await Promise.all(claimPromises);

      // Query all claims
      const claims = await memoryManager.query({
        tags: ['task-claim'],
        contentMatch: { taskId },
        limit: 10,
      });

      expect(claims).toHaveLength(3);

      // Determine winner (earliest claim)
      const winner = claims.reduce((earliest, current) => 
        !earliest || current.content.claimedAt < earliest.content.claimedAt 
          ? current : earliest
      );

      // Winner stores task assignment
      await memoryManager.store({
        id: `task-assignment-${taskId}`,
        type: 'task-assignment',
        agentId: winner.agentId,
        content: {
          taskId,
          assignedTo: winner.agentId,
          assignedAt: new Date(),
          winningClaim: winner.id,
          losers: claims.filter(c => c.agentId !== winner.agentId).map(c => c.agentId)
        },
        tags: ['task-assignment', 'active'],
        metadata: { task: taskId, owner: winner.agentId },
      });

      const assignment = await memoryManager.retrieve(`task-assignment-${taskId}`);
      expect(assignment?.agentId).toBe(winner.agentId);
      expect(assignment?.content.losers).toHaveLength(2);
    });

    it('should handle task progress synchronization', async () => {
      const projectId = 'sync-project-001';
      
      // Each agent reports progress on different components
      const progressPromises = agents.map((agent, index) => 
        memoryManager.store({
          id: `progress-${projectId}-${agent.getId()}`,
          type: 'progress-update',
          agentId: agent.getId(),
          content: {
            projectId,
            component: `component-${index + 1}`,
            status: index === 0 ? 'completed' : 'in-progress',
            progress: (index + 1) * 30,
            details: `Working on ${['authentication', 'database', 'frontend'][index]}`,
            lastUpdate: new Date(),
            blockers: index === 2 ? ['waiting for API'] : [],
          },
          tags: ['progress', 'sync'],
          metadata: { project: projectId },
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
      
      // Calculate aggregate progress
      const totalProgress = allProgress.reduce(
        (sum, entry) => sum + entry.content.progress, 0
      ) / allProgress.length;
      
      expect(totalProgress).toBeCloseTo(60, 0); // (30 + 60 + 90) / 3

      // Identify blockers
      const blockedTasks = allProgress.filter(
        entry => entry.content.blockers && entry.content.blockers.length > 0
      );
      
      expect(blockedTasks).toHaveLength(1);
      expect(blockedTasks[0].content.blockers).toContain('waiting for API');
    });
  });

  describe('Advanced Coordination Patterns', () => {
    it('should support leader election', async () => {
      const electionId = 'leader-election-001';
      
      // All agents participate in election
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
            nominatedAt: new Date(Date.now() + index * 5),
            platform: `Agent ${agent.getId()} for coordination efficiency`
          },
          tags: ['leader-election', 'candidate'],
          metadata: { election: electionId },
        })
      );

      await Promise.all(electionPromises);

      // Determine leader (highest priority/reliability)
      const candidates = await memoryManager.query({
        tags: ['leader-election'],
        contentMatch: { electionId },
        limit: 10,
      });

      expect(candidates).toHaveLength(3);

      const leader = candidates.reduce((best, current) => 
        !best || current.content.priority > best.content.priority ? current : best
      );

      // Leader stores leadership
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
          responsibilities: ['task coordination', 'resource allocation', 'conflict resolution']
        },
        tags: ['leadership', 'active'],
        metadata: { election: electionId, role: 'leader' },
      });

      const leadership = await memoryManager.retrieve(`leader-${electionId}`);
      expect(leadership?.agentId).toBe(leader.agentId);
      expect(leadership?.content.followers).toHaveLength(2);
      expect(leadership?.content.responsibilities).toContain('task coordination');
    });

    it('should support work-stealing queue', async () => {
      const workPoolId = 'work-pool-001';
      const workItems = [
        { id: 'task-a', complexity: 'low', estimated: 5000 },
        { id: 'task-b', complexity: 'medium', estimated: 15000 },
        { id: 'task-c', complexity: 'high', estimated: 30000 },
        { id: 'task-d', complexity: 'low', estimated: 7000 },
        { id: 'task-e', complexity: 'medium', estimated: 12000 },
      ];
      
      // Create work pool
      await memoryManager.store({
        id: `work-pool-${workPoolId}`,
        type: 'work-pool',
        agentId: 'system',
        content: {
          poolId: workPoolId,
          availableWork: [...workItems],
          completedWork: [],
          inProgressWork: [],
          createdAt: new Date(),
          totalWork: workItems.length,
        },
        tags: ['work-pool', 'available'],
        metadata: { pool: workPoolId },
      });

      // Agents steal work based on their capabilities
      const stealPromises = agents.map(async (agent) => {
        const workPool = await memoryManager.retrieve(`work-pool-${workPoolId}`);
        if (!workPool || workPool.content.availableWork.length === 0) {
          return null;
        }

        // Choose work item based on agent capabilities
        const capabilities = agent.getCapabilities();
        const suitableWork = workPool.content.availableWork.find((item: any) => {
          if (capabilities.reliability > 0.9) return item.complexity === 'high';
          if (capabilities.reliability > 0.8) return item.complexity === 'medium';
          return item.complexity === 'low';
        }) || workPool.content.availableWork[0];

        if (!suitableWork) return null;

        // Remove from available work
        const updatedAvailable = workPool.content.availableWork.filter(
          (item: any) => item.id !== suitableWork.id
        );

        // Update work pool
        await memoryManager.update(`work-pool-${workPoolId}`, {
          content: {
            ...workPool.content,
            availableWork: updatedAvailable,
            inProgressWork: [...workPool.content.inProgressWork, suitableWork],
          },
        });

        // Record work assignment
        await memoryManager.store({
          id: `work-assignment-${suitableWork.id}-${agent.getId()}`,
          type: 'work-assignment',
          agentId: agent.getId(),
          content: {
            workItem: suitableWork,
            assignedTo: agent.getId(),
            assignedAt: new Date(),
            status: 'in-progress',
            poolId: workPoolId,
            estimatedCompletion: new Date(Date.now() + suitableWork.estimated),
          },
          tags: ['work-assignment', 'stolen'],
          metadata: { work: suitableWork.id, pool: workPoolId },
        });

        return suitableWork;
      });

      const stolenWork = await Promise.all(stealPromises);
      const actualStolenWork = stolenWork.filter(Boolean);
      
      expect(actualStolenWork.length).toBeGreaterThan(0);
      expect(actualStolenWork.length).toBeLessThanOrEqual(Math.min(agents.length, workItems.length));

      // Verify work distribution
      const assignments = await memoryManager.query({
        tags: ['work-assignment'],
        contentMatch: { poolId: workPoolId },
        limit: 10,
      });

      expect(assignments.length).toBe(actualStolenWork.length);
      
      // Check that high-capability agents got complex work
      const highCapabilityAgent = agents.find(a => a.getCapabilities().reliability > 0.9);
      if (highCapabilityAgent) {
        const highCapabilityAssignment = assignments.find(a => a.agentId === highCapabilityAgent.getId());
        if (highCapabilityAssignment) {
          expect(['high', 'medium']).toContain(highCapabilityAssignment.content.workItem.complexity);
        }
      }
    });

    it('should handle failure detection and recovery', async () => {
      const taskId = 'monitored-task-001';
      const heartbeatInterval = 5000;
      
      // Agent claims task with heartbeat
      await memoryManager.store({
        id: `task-claim-${taskId}`,
        type: 'task-claim',
        agentId: 'agent-1',
        content: {
          taskId,
          claimedAt: new Date(),
          heartbeatInterval,
          lastHeartbeat: new Date(),
          status: 'active',
        },
        tags: ['task-claim', 'monitored'],
        metadata: { task: taskId },
      });

      // Simulate passage of time without heartbeat
      await new Promise(resolve => setTimeout(resolve, 100));

      // Another agent detects potential failure
      const detectionTime = new Date();
      const originalClaim = await memoryManager.retrieve(`task-claim-${taskId}`);
      
      expect(originalClaim).toBeDefined();
      
      const timeSinceHeartbeat = detectionTime.getTime() - 
        new Date(originalClaim.content.lastHeartbeat).getTime();
      
      const isStale = timeSinceHeartbeat > heartbeatInterval;
      expect(isStale).toBe(false); // Too short for our test, but demonstrates the logic

      // Simulate actual failure (longer timeout)
      if (timeSinceHeartbeat > 50) { // Lower threshold for testing
        await memoryManager.store({
          id: `task-recovery-${taskId}`,
          type: 'task-recovery',
          agentId: 'agent-2',
          content: {
            taskId,
            recoveredFrom: 'agent-1',
            recoveredAt: detectionTime,
            reason: 'heartbeat-timeout',
            originalClaim: originalClaim.id,
            timeSinceLastHeartbeat: timeSinceHeartbeat,
          },
          tags: ['task-recovery', 'failure-detection'],
          metadata: { task: taskId, recovery: true },
        });
      }

      const recovery = await memoryManager.retrieve(`task-recovery-${taskId}`);
      expect(recovery?.agentId).toBe('agent-2');
      expect(recovery?.content.recoveredFrom).toBe('agent-1');
    });
  });

  describe('Memory Consistency and Conflict Resolution', () => {
    it('should detect and resolve memory conflicts', async () => {
      const conflictId = 'conflict-test-001';
      
      // Two agents write conflicting data
      const conflictPromises = [
        memoryManager.store({
          id: `conflict-${conflictId}-v1`,
          type: 'shared-state',
          agentId: 'agent-1',
          content: {
            key: 'shared-config',
            value: { setting: 'value-1', priority: 1 },
            version: 1,
            timestamp: new Date(),
          },
          tags: ['shared-state', 'conflicting'],
          metadata: { conflict: conflictId },
        }),
        memoryManager.store({
          id: `conflict-${conflictId}-v2`,
          type: 'shared-state',
          agentId: 'agent-2',
          content: {
            key: 'shared-config',
            value: { setting: 'value-2', priority: 2 },
            version: 2,
            timestamp: new Date(Date.now() + 10), // Slightly later
          },
          tags: ['shared-state', 'conflicting'],
          metadata: { conflict: conflictId },
        }),
      ];

      await Promise.all(conflictPromises);

      // Detect conflicts
      const conflictingEntries = await memoryManager.query({
        tags: ['conflicting'],
        limit: 10,
      });

      const conflicts = conflictingEntries.filter(entry => 
        entry.metadata?.conflict === conflictId
      );

      expect(conflicts.length).toBe(2);

      // Resolve conflict using merge strategy
      const mergedValue = conflicts.reduce((merged, current) => {
        if (!merged) return current.content.value;
        
        // Merge based on priority
        return current.content.value.priority > merged.priority 
          ? current.content.value 
          : merged;
      }, null);

      // Store resolution
      await memoryManager.store({
        id: `conflict-resolution-${conflictId}`,
        type: 'conflict-resolution',
        agentId: 'system',
        content: {
          conflictId,
          resolvedValue: mergedValue,
          resolutionStrategy: 'priority-based-merge',
          conflictingEntries: conflicts.map(c => c.id),
          resolvedAt: new Date(),
        },
        tags: ['conflict-resolution', 'resolved'],
        metadata: { conflict: conflictId },
      });

      const resolution = await memoryManager.retrieve(`conflict-resolution-${conflictId}`);
      expect(resolution?.content.resolvedValue.setting).toBe('value-2'); // Higher priority
      expect(resolution?.content.resolvedValue.priority).toBe(2);
    });

    it('should maintain memory consistency across operations', async () => {
      const consistencyId = 'consistency-test-001';
      
      // Multiple agents perform operations on shared data
      const operations = [
        { agent: 'agent-1', operation: 'increment', value: 5 },
        { agent: 'agent-2', operation: 'increment', value: 3 },
        { agent: 'agent-3', operation: 'decrement', value: 2 },
      ];

      // Initialize shared counter
      await memoryManager.store({
        id: `counter-${consistencyId}`,
        type: 'shared-counter',
        agentId: 'system',
        content: {
          counterId: consistencyId,
          value: 0,
          version: 0,
          operations: [],
        },
        tags: ['shared-counter', 'consistency'],
        metadata: { counter: consistencyId },
      });

      // Apply operations sequentially to maintain consistency
      for (const op of operations) {
        const counter = await memoryManager.retrieve(`counter-${consistencyId}`);
        expect(counter).toBeDefined();

        const newValue = op.operation === 'increment' 
          ? counter.content.value + op.value
          : counter.content.value - op.value;

        await memoryManager.update(`counter-${consistencyId}`, {
          content: {
            ...counter.content,
            value: newValue,
            version: counter.content.version + 1,
            operations: [...counter.content.operations, {
              agent: op.agent,
              operation: op.operation,
              value: op.value,
              timestamp: new Date(),
            }],
          },
        });
      }

      // Verify final state
      const finalCounter = await memoryManager.retrieve(`counter-${consistencyId}`);
      expect(finalCounter?.content.value).toBe(6); // 0 + 5 + 3 - 2
      expect(finalCounter?.content.version).toBe(3);
      expect(finalCounter?.content.operations).toHaveLength(3);
    });
  });
});

export { }; 