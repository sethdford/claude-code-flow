/**
 * SQLite backend implementation for memory storage
 */

import Database from "better-sqlite3";
import { promises as fs } from "fs";
import path from "path";
import { IMemoryBackend } from "./base.js";
import { MemoryEntry, MemoryQuery, ILogger } from "../../utils/types.js";
import { MemoryBackendError } from "../../utils/errors.js";

/**
 * SQLite-based memory backend
 */
export class SQLiteBackend implements IMemoryBackend {
  private db: Database.Database | null = null;

  constructor(
    private dbPath: string,
    private logger: ILogger,
  ) {}

  async initialize(): Promise<void> {
    this.logger.info("Initializing SQLite backend", { dbPath: this.dbPath });

    try {
      // Ensure directory exists
      const dir = path.dirname(this.dbPath);
      await fs.mkdir(dir, { recursive: true });

      // Open SQLite connection
      this.db = new Database(this.dbPath);

      // Enable WAL mode for better performance
      this.db.pragma("journal_mode = WAL");
      this.db.pragma("synchronous = NORMAL");
      this.db.pragma("cache_size = 1000");
      this.db.pragma("temp_store = memory");

      // Create tables
      this.createTables();

      // Create indexes
      this.createIndexes();

      this.logger.info("SQLite backend initialized");
    } catch (error) {
      throw new MemoryBackendError("Failed to initialize SQLite backend", { error });
    }
  }

  async shutdown(): Promise<void> {
    this.logger.info("Shutting down SQLite backend");

    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  async store(entry: MemoryEntry): Promise<void> {
    if (!this.db) {
      throw new MemoryBackendError("Database not initialized");
    }

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO memory_entries 
      (id, agentId, sessionId, type, content, context, timestamp, tags, version, parentId, metadata, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    stmt.run(
      entry.id,
      entry.agentId,
      entry.sessionId,
      entry.type,
      entry.content,
      JSON.stringify(entry.context),
      entry.timestamp.toISOString(),
      JSON.stringify(entry.tags),
      entry.version,
      entry.parentId || null,
      entry.metadata ? JSON.stringify(entry.metadata) : null,
    );
  }

  async retrieve(id: string): Promise<MemoryEntry | undefined> {
    if (!this.db) {
      throw new MemoryBackendError("Database not initialized");
    }

    const stmt = this.db.prepare("SELECT * FROM memory_entries WHERE id = ?");
    const row = stmt.get(id) as Record<string, unknown> | undefined;

    if (!row) {
      return undefined;
    }

    return this.rowToEntry(row);
  }

  async update(id: string, entry: MemoryEntry): Promise<void> {
    if (!this.db) {
      throw new MemoryBackendError("Database not initialized");
    }

    const stmt = this.db.prepare(`
      UPDATE memory_entries 
      SET agentId = ?, sessionId = ?, type = ?, content = ?, context = ?, 
          timestamp = ?, tags = ?, version = ?, parentId = ?, metadata = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
      entry.agentId,
      entry.sessionId,
      entry.type,
      entry.content,
      JSON.stringify(entry.context),
      entry.timestamp.toISOString(),
      JSON.stringify(entry.tags),
      entry.version,
      entry.parentId || null,
      entry.metadata ? JSON.stringify(entry.metadata) : null,
      id,
    );
  }

  async delete(id: string): Promise<void> {
    if (!this.db) {
      throw new MemoryBackendError("Database not initialized");
    }

    const stmt = this.db.prepare("DELETE FROM memory_entries WHERE id = ?");
    stmt.run(id);
  }

  async query(query: MemoryQuery): Promise<MemoryEntry[]> {
    if (!this.db) {
      throw new MemoryBackendError("Database not initialized");
    }

    let sql = "SELECT * FROM memory_entries WHERE 1=1";
    const params: unknown[] = [];

    if (query.agentId) {
      sql += " AND agentId = ?";
      params.push(query.agentId);
    }

    if (query.sessionId) {
      sql += " AND sessionId = ?";
      params.push(query.sessionId);
    }

    if (query.type) {
      sql += " AND type = ?";
      params.push(query.type);
    }

    if (query.tags && query.tags.length > 0) {
      for (const tag of query.tags) {
        sql += " AND tags LIKE ?";
        params.push(`%"${tag}"%`);
      }
    }

    if (query.startTime) {
      sql += " AND timestamp >= ?";
      params.push(query.startTime.toISOString());
    }

    if (query.endTime) {
      sql += " AND timestamp <= ?";
      params.push(query.endTime.toISOString());
    }

    if (query.search) {
      sql += " AND (content LIKE ? OR tags LIKE ?)";
      params.push(`%${query.search}%`, `%${query.search}%`);
    }

    sql += " ORDER BY timestamp DESC";

    if (query.limit) {
      sql += " LIMIT ?";
      params.push(query.limit);
    }

    if (query.offset) {
      if (!query.limit) {
        sql += " LIMIT -1";
      }
      sql += " OFFSET ?";
      params.push(query.offset);
    }

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params) as Record<string, unknown>[];

    return Promise.resolve(rows.map(row => this.rowToEntry(row)));
  }

  async getAllEntries(): Promise<MemoryEntry[]> {
    if (!this.db) {
      throw new MemoryBackendError("Database not initialized");
    }

    const stmt = this.db.prepare("SELECT * FROM memory_entries ORDER BY timestamp DESC");
    const rows = stmt.all() as Record<string, unknown>[];

    return Promise.resolve(rows.map(row => this.rowToEntry(row)));
  }

  async getHealthStatus(): Promise<{ 
    healthy: boolean; 
    error?: string; 
    metrics?: Record<string, number>;
  }> {
    if (!this.db) {
      return {
        healthy: false,
        error: "Database not initialized",
      };
    }

    try {
      // Check database connectivity
      this.db.prepare("SELECT 1").get();

      // Get metrics
      const countResult = this.db.prepare("SELECT COUNT(*) as count FROM memory_entries").get() as any;
      const entryCount = countResult.count;

      const sizeResult = this.db.prepare("SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()").get() as any;
      const dbSize = sizeResult.size;

      return {
        healthy: true,
        metrics: {
          entryCount,
          dbSizeBytes: dbSize,
        },
      };
    } catch (error) {
      return {
        healthy: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private createTables(): void {
    this.db!.exec(`
      CREATE TABLE IF NOT EXISTS memory_entries (
        id TEXT PRIMARY KEY,
        agentId TEXT NOT NULL,
        sessionId TEXT NOT NULL,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        context TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        tags TEXT NOT NULL,
        version INTEGER NOT NULL,
        parentId TEXT,
        metadata TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_agent_id ON memory_entries(agentId);
      CREATE INDEX IF NOT EXISTS idx_session_id ON memory_entries(sessionId);
      CREATE INDEX IF NOT EXISTS idx_type ON memory_entries(type);
      CREATE INDEX IF NOT EXISTS idx_timestamp ON memory_entries(timestamp);
      CREATE INDEX IF NOT EXISTS idx_created_at ON memory_entries(createdAt);
    `);
  }

  private createIndexes(): void {
    const indexes = [
      "CREATE INDEX IF NOT EXISTS idx_agent_id ON memory_entries(agentId)",
      "CREATE INDEX IF NOT EXISTS idx_session_id ON memory_entries(sessionId)",
      "CREATE INDEX IF NOT EXISTS idx_type ON memory_entries(type)",
      "CREATE INDEX IF NOT EXISTS idx_timestamp ON memory_entries(timestamp)",
      "CREATE INDEX IF NOT EXISTS idx_parent_id ON memory_entries(parentId)",
    ];

    for (const sql of indexes) {
      this.db!.exec(sql);
    }
  }

  private rowToEntry(row: Record<string, unknown>): MemoryEntry {
    const entry: MemoryEntry = {
      id: row.id as string,
      agentId: row.agentId as string,
      sessionId: row.sessionId as string,
      type: row.type as MemoryEntry["type"],
      content: row.content as string,
      context: JSON.parse(row.context as string) as Record<string, unknown>,
      timestamp: new Date(row.timestamp as string),
      tags: JSON.parse(row.tags as string) as string[],
      version: row.version as number,
    };
    
    if (row.parentId) {
      entry.parentId = row.parentId as string;
    }
    
    if (row.metadata) {
      entry.metadata = JSON.parse(row.metadata as string) as Record<string, unknown>;
    }
    
    return entry;
  }
}

