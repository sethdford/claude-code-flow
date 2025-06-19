/**
 * SPARC Memory Bank - Memory Indexer
 * Fast indexing with vector search support
 */

import { MemoryItem, MemoryQuery, MemoryBackend, VectorSearchResult, IndexConfig } from '../types';
import { EventEmitter } from 'events';

interface Index {
  byCategory: Map<string, Set<string>>;
  byTag: Map<string, Set<string>>;
  byNamespace: Map<string, Set<string>>;
  byTimestamp: Array<{ id: string; timestamp: number }>;
  vectors?: VectorIndex;
}

interface VectorIndex {
  dimensions: number;
  vectors: Map<string, Float32Array>;
  metadata: Map<string, { category: string; key: string }>;
}

export class MemoryIndexer extends EventEmitter {
  private backend: MemoryBackend;
  private indexData: Index;
  private config: IndexConfig;
  private updateQueue: Set<string> = new Set();
  private updateInterval?: NodeJS.Timeout;
  private isIndexing: boolean = false;

  constructor(config: IndexConfig) {
    super();
    this.config = config;
    this.backend = config.backend;
    
    this.indexData = {
      byCategory: new Map(),
      byTag: new Map(),
      byNamespace: new Map(),
      byTimestamp: []
    };

    if (config.enableVectorSearch) {
      this.indexData.vectors = {
        dimensions: config.vectorDimensions || 384,
        vectors: new Map(),
        metadata: new Map()
      };
    }
  }

  async initialize(): Promise<void> {
    // Build initial index
    await this.rebuildIndex();

    // Start update interval if configured
    if (this.config.indexUpdateInterval) {
      this.updateInterval = setInterval(
        () => this.processUpdateQueue(),
        this.config.indexUpdateInterval
      );
    }

    this.emit('initialized');
  }

  /**
   * Index a memory item
   */
  async index(item: MemoryItem): Promise<void> {
    const id = `${item.category}:${item.key}`;

    // Update category index
    if (!this.indexData.byCategory.has(item.category)) {
      this.indexData.byCategory.set(item.category, new Set());
    }
    this.indexData.byCategory.get(item.category)!.add(id);

    // Update tag index
    if (item.metadata?.tags) {
      for (const tag of item.metadata.tags) {
        if (!this.indexData.byTag.has(tag)) {
          this.indexData.byTag.set(tag, new Set());
        }
        this.indexData.byTag.get(tag)!.add(id);
      }
    }

    // Update namespace index
    const namespace = item.metadata?.namespace || 'default';
    if (!this.indexData.byNamespace.has(namespace)) {
      this.indexData.byNamespace.set(namespace, new Set());
    }
    this.indexData.byNamespace.get(namespace)!.add(id);

    // Update timestamp index
    if (item.metadata?.timestamp) {
      this.updateTimestampIndex(id, item.metadata.timestamp);
    }

    // Update vector index
    if (this.indexData.vectors && item.vectorEmbedding) {
      this.indexData.vectors.vectors.set(
        id,
        new Float32Array(item.vectorEmbedding)
      );
      this.indexData.vectors.metadata.set(id, {
        category: item.category,
        key: item.key
      });
    }

    // Queue for batch update if interval is set
    if (this.config.indexUpdateInterval) {
      this.updateQueue.add(id);
    }

    this.emit('indexed', item);
  }

  /**
   * Remove item from index
   */
  async remove(category: string, key: string): Promise<void> {
    const id = `${category}:${key}`;

    // Remove from category index
    const categorySet = this.indexData.byCategory.get(category);
    if (categorySet) {
      categorySet.delete(id);
      if (categorySet.size === 0) {
        this.indexData.byCategory.delete(category);
      }
    }

    // Remove from tag index
    for (const [tag, tagSet] of this.indexData.byTag) {
      tagSet.delete(id);
      if (tagSet.size === 0) {
        this.indexData.byTag.delete(tag);
      }
    }

    // Remove from namespace index
    for (const [ns, nsSet] of this.indexData.byNamespace) {
      nsSet.delete(id);
      if (nsSet.size === 0) {
        this.indexData.byNamespace.delete(ns);
      }
    }

    // Remove from timestamp index
    this.indexData.byTimestamp = this.indexData.byTimestamp.filter(
      entry => entry.id !== id
    );

    // Remove from vector index
    if (this.indexData.vectors) {
      this.indexData.vectors.vectors.delete(id);
      this.indexData.vectors.metadata.delete(id);
    }

    this.emit('removed', { category, key });
  }

  /**
   * Perform vector search
   */
  async vectorSearch(query: MemoryQuery): Promise<MemoryItem[]> {
    if (!query.vectorSearch || !this.indexData.vectors) {
      return [];
    }

    const queryVector = new Float32Array(query.vectorSearch.embedding);
    const results: VectorSearchResult[] = [];

    // Calculate similarity scores
    for (const [id, vector] of this.indexData.vectors.vectors) {
      const score = this.cosineSimilarity(queryVector, vector);
      
      if (query.vectorSearch.threshold && score < query.vectorSearch.threshold) {
        continue;
      }

      const metadata = this.indexData.vectors.metadata.get(id);
      if (metadata) {
        results.push({
          item: null as any, // Will be populated below
          score,
          distance: 1 - score
        });

        // Store metadata for retrieval
        (results[results.length - 1] as any).metadata = metadata;
      }
    }

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);

    // Apply topK limit
    const topK = query.vectorSearch.topK || 10;
    const topResults = results.slice(0, topK);

    // Retrieve full items
    const items: MemoryItem[] = [];
    for (const result of topResults) {
      const metadata = (result as any).metadata;
      const item = await this.backend.get(metadata.category, metadata.key);
      if (item) {
        items.push(item);
      }
    }

    return items;
  }

  /**
   * Query using indexes
   */
  async query(query: MemoryQuery): Promise<Set<string>> {
    let candidates = new Set<string>();
    let initialized = false;

    // Filter by category
    if (query.categories && query.categories.length > 0) {
      for (const category of query.categories) {
        const categoryIds = this.indexData.byCategory.get(category);
        if (categoryIds) {
          if (!initialized) {
            candidates = new Set(categoryIds);
            initialized = true;
          } else {
            // Intersection
            candidates = new Set(
              [...candidates].filter(id => categoryIds.has(id))
            );
          }
        }
      }
    }

    // Filter by tags
    if (query.tags && query.tags.length > 0) {
      const tagSets: Set<string>[] = [];
      for (const tag of query.tags) {
        const tagIds = this.indexData.byTag.get(tag);
        if (tagIds) {
          tagSets.push(tagIds);
        }
      }

      if (tagSets.length > 0) {
        const tagCandidates = this.unionSets(tagSets);
        if (!initialized) {
          candidates = tagCandidates;
          initialized = true;
        } else {
          candidates = new Set(
            [...candidates].filter(id => tagCandidates.has(id))
          );
        }
      }
    }

    // Filter by namespace
    if (query.namespace) {
      const namespaceIds = this.indexData.byNamespace.get(query.namespace);
      if (namespaceIds) {
        if (!initialized) {
          candidates = new Set(namespaceIds);
          initialized = true;
        } else {
          candidates = new Set(
            [...candidates].filter(id => namespaceIds.has(id))
          );
        }
      }
    }

    // If no filters applied, use all items
    if (!initialized) {
      for (const categoryIds of this.indexData.byCategory.values()) {
        for (const id of categoryIds) {
          candidates.add(id);
        }
      }
    }

    return candidates;
  }

  /**
   * Check if vector search is supported
   */
  supportsVectorSearch(): boolean {
    return !!this.indexData.vectors;
  }

  /**
   * Get index statistics
   */
  getStats(): any {
    return {
      categories: this.indexData.byCategory.size,
      tags: this.indexData.byTag.size,
      namespaces: this.indexData.byNamespace.size,
      timestamps: this.indexData.byTimestamp.length,
      vectors: this.indexData.vectors ? this.indexData.vectors.vectors.size : 0,
      updateQueueSize: this.updateQueue.size
    };
  }

  /**
   * Close and cleanup
   */
  async close(): Promise<void> {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    // Process any remaining updates
    if (this.updateQueue.size > 0) {
      await this.processUpdateQueue();
    }

    this.emit('closed');
  }

  /**
   * Rebuild entire index
   */
  private async rebuildIndex(): Promise<void> {
    this.isIndexing = true;
    this.emit('rebuild-start');

    // Clear existing indexes
    this.indexData.byCategory.clear();
    this.indexData.byTag.clear();
    this.indexData.byNamespace.clear();
    this.indexData.byTimestamp = [];
    
    if (this.indexData.vectors) {
      this.indexData.vectors.vectors.clear();
      this.indexData.vectors.metadata.clear();
    }

    // Query all items from backend
    const items = await this.backend.query({});

    // Index each item
    for (const item of items) {
      await this.index(item);
    }

    this.isIndexing = false;
    this.emit('rebuild-complete', { itemCount: items.length });
  }

  /**
   * Process queued updates
   */
  private async processUpdateQueue(): Promise<void> {
    if (this.updateQueue.size === 0 || this.isIndexing) {
      return;
    }

    const updates = Array.from(this.updateQueue);
    this.updateQueue.clear();

    // Process updates in batches
    const batchSize = 100;
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (id) => {
          const [category, key] = id.split(':');
          const item = await this.backend.get(category, key);
          if (item) {
            await this.index(item);
          }
        })
      );
    }
  }

  /**
   * Update timestamp index
   */
  private updateTimestampIndex(id: string, timestamp: number): void {
    // Remove existing entry
    this.indexData.byTimestamp = this.indexData.byTimestamp.filter(
      entry => entry.id !== id
    );

    // Add new entry
    this.indexData.byTimestamp.push({ id, timestamp });

    // Keep sorted by timestamp
    this.indexData.byTimestamp.sort((a, b) => a.timestamp - b.timestamp);

    // Limit size to prevent unbounded growth
    const maxSize = 10000;
    if (this.indexData.byTimestamp.length > maxSize) {
      this.indexData.byTimestamp = this.indexData.byTimestamp.slice(-maxSize);
    }
  }

  /**
   * Calculate cosine similarity between vectors
   */
  private cosineSimilarity(a: Float32Array, b: Float32Array): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have same dimensions');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  /**
   * Union multiple sets
   */
  private unionSets(sets: Set<string>[]): Set<string> {
    const result = new Set<string>();
    for (const set of sets) {
      for (const item of set) {
        result.add(item);
      }
    }
    return result;
  }

  /**
   * Generate text embeddings (placeholder - would use real model in production)
   */
  async generateEmbedding(text: string): Promise<number[]> {
    // This is a placeholder - in production, you would use a real embedding model
    // like OpenAI's text-embedding-ada-002 or a local model
    
    const dimensions = this.indexData.vectors?.dimensions || 384;
    const embedding = new Array(dimensions);
    
    // Simple hash-based pseudo-embedding for demonstration
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash) + text.charCodeAt(i);
      hash = hash & hash;
    }
    
    for (let i = 0; i < dimensions; i++) {
      embedding[i] = Math.sin(hash * (i + 1)) * 0.5 + 0.5;
    }
    
    return embedding;
  }
}