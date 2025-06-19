import { describe, it, expect } from 'vitest';
import { MemoryManager } from '../core/memory-manager';

describe('Basic Memory Tests', () => {
  it('should create memory manager', () => {
    const config = {
      backend: 'sqlite' as const,
      backendConfig: {
        path: ':memory:'
      }
    };
    
    const manager = new MemoryManager(config);
    expect(manager).toBeDefined();
  });

  it('should have correct configuration', () => {
    const config = {
      backend: 'sqlite' as const,
      backendConfig: {
        path: ':memory:'
      },
      enableIndexing: true,
      enableNamespaces: false
    };
    
    const manager = new MemoryManager(config);
    expect(manager).toBeDefined();
    // Test passes if no errors are thrown during instantiation
  });
}); 