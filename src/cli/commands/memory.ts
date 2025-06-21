/**
 * Memory management commands
 */

import { mkdir } from "node:fs/promises";
import { promises as fs } from "node:fs";
import { Command } from "../cliffy-compat.js";
import { colors } from "../cliffy-compat.js";
import { existsSync } from "node:fs";

interface MemoryEntry {
  key: string;
  value: string;
  namespace: string;
  timestamp: number;
}

export class SimpleMemoryManager {
  private filePath = "./memory/memory-store.json";
  private data: Record<string, MemoryEntry[]> = {};

  async load(): Promise<void> {
    if (existsSync(this.filePath)) {
      const content = await fs.readFile(this.filePath, "utf-8");
      this.data = JSON.parse(content) as Record<string, MemoryEntry[]>;
    }
  }

  async save(): Promise<void> {
    // Ensure directory exists
    const dir = this.filePath.split("/").slice(0, -1).join("/");
    if (dir && !existsSync(dir)) {
      await fs.mkdir(dir, { recursive: true });
    }
    await fs.writeFile(this.filePath, JSON.stringify(this.data, null, 2), "utf-8");
  }

  async store(key: string, value: string, namespace: string = "default") {
    await this.load();
    
    if (!this.data[namespace]) {
      this.data[namespace] = [];
    }

    // Check if key already exists and update it
    const existingIndex = this.data[namespace].findIndex(entry => entry.key === key);
    const entry: MemoryEntry = {
      key,
      value,
      namespace,
      timestamp: Date.now(),
    };

    if (existingIndex >= 0) {
      this.data[namespace][existingIndex] = entry;
    } else {
      this.data[namespace].push(entry);
    }

    await this.save();
  }

  async query(search: string, namespace?: string) {
    await this.load();
    
    const results: MemoryEntry[] = [];
    const namespaces = namespace ? [namespace] : Object.keys(this.data);

    for (const ns of namespaces) {
      if (this.data[ns]) {
        const entries = this.data[ns];
        
        // Handle both array and object formats
        if (Array.isArray(entries)) {
          for (const entry of entries) {
            if (entry.key.includes(search) || entry.value.includes(search)) {
              results.push(entry);
            }
          }
        } else if (typeof entries === "object" && entries !== null) {
          // For object format, skip non-array namespaces for now
          // Could be enhanced to search object properties if needed
          continue;
        }
      }
    }

    return results;
  }

  async getStats() {
    await this.load();
    
    let totalEntries = 0;
    const namespaceStats: Record<string, number> = {};

    for (const [namespace, entries] of Object.entries(this.data)) {
      // Handle both array and object formats
      if (Array.isArray(entries)) {
        namespaceStats[namespace] = entries.length;
        totalEntries += entries.length;
      } else if (typeof entries === "object" && entries !== null) {
        // For object format, count the number of properties
        const count = Object.keys(entries).length;
        namespaceStats[namespace] = count;
        totalEntries += count;
      } else {
        namespaceStats[namespace] = 0;
      }
    }

    return {
      totalEntries,
      namespaces: Object.keys(this.data).length,
      namespaceStats,
      sizeBytes: new TextEncoder().encode(JSON.stringify(this.data)).length,
    };
  }

  async exportData(filePath: string) {
    await this.load();
    await fs.writeFile(filePath, JSON.stringify(this.data, null, 2), "utf-8");
  }

  async importData(filePath: string) {
    const content = await fs.readFile(filePath, "utf-8");
    this.data = JSON.parse(content) as Record<string, MemoryEntry[]>;
    await this.save();
  }

  async cleanup(daysOld: number = 30) {
    await this.load();
    
    const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    let removedCount = 0;

    for (const namespace of Object.keys(this.data)) {
      const before = this.data[namespace].length;
      this.data[namespace] = this.data[namespace].filter(e => e.timestamp > cutoffTime);
      removedCount += before - this.data[namespace].length;
    }

    await this.save();
    return removedCount;
  }
}

export const memoryCommand = new Command()
  .name("memory")
  .description("Manage memory bank")
  .action(() => {
    memoryCommand.outputHelp();
  });

// Add subcommands properly
memoryCommand
  .command("store")
  .description("Store information in memory")
  .arguments("<key> <value>")
  .option("-n, --namespace <namespace>", "Target namespace", "default")
  .action(async (key: string, value: string, options: Record<string, unknown>) => {
    try {
      const memory = new SimpleMemoryManager();
      await memory.store(key, value, options.namespace as string);
      console.log(colors.green("✅ Stored successfully"));
      console.log(`📝 Key: ${key}`);
      console.log(`📦 Namespace: ${options.namespace}`);
      console.log(`💾 Size: ${new TextEncoder().encode(value).length} bytes`);
    } catch (error) {
      console.error(colors.red("Failed to store:"), (error as Error).message);
    }
  });

memoryCommand
  .command("query")
  .description("Search memory entries")
  .arguments("<search>")
  .option("-n, --namespace <namespace>", "Filter by namespace")
  .option("-l, --limit <limit>", "Limit results", "10")
  .action(async (search: string, options: Record<string, unknown>) => {
    try {
      const memory = new SimpleMemoryManager();
      const results = await memory.query(search, options.namespace as string);
      
      if (results.length === 0) {
        console.log(colors.yellow("No results found"));
        return;
      }

      console.log(colors.green(`✅ Found ${results.length} results:`));
      
      const limit = parseInt(options.limit as string) || 10;
      const limited = results.slice(0, limit);
      for (const entry of limited) {
        console.log(colors.blue(`\n📌 ${entry.key}`));
        console.log(`   Namespace: ${entry.namespace}`);
        console.log(`   Value: ${entry.value.substring(0, 100)}${entry.value.length > 100 ? "..." : ""}`);
        console.log(`   Stored: ${new Date(entry.timestamp).toLocaleString()}`);
      }

      if (results.length > limit) {
        console.log(colors.gray(`\n... and ${results.length - limit} more results`));
      }
    } catch (error) {
      console.error(colors.red("Failed to query:"), (error as Error).message);
    }
  });

memoryCommand
  .command("export")
  .description("Export memory to file")
  .arguments("<file>")
  .action(async (file: string, options: Record<string, unknown>) => {
    try {
      const memory = new SimpleMemoryManager();
      await memory.exportData(file);
      const stats = await memory.getStats();
      console.log(colors.green("✅ Memory exported successfully"));
      console.log(`📁 File: ${file}`);
      console.log(`📊 Entries: ${stats.totalEntries}`);
      console.log(`💾 Size: ${(stats.sizeBytes / 1024).toFixed(2)} KB`);
    } catch (error) {
      console.error(colors.red("Failed to export:"), (error as Error).message);
    }
  });

memoryCommand
  .command("import")
  .description("Import memory from file")
  .arguments("<file>")
  .action(async (file: string, options: Record<string, unknown>) => {
    try {
      const memory = new SimpleMemoryManager();
      await memory.importData(file);
      const stats = await memory.getStats();
      console.log(colors.green("✅ Memory imported successfully"));
      console.log(`📁 File: ${file}`);
      console.log(`📊 Entries: ${stats.totalEntries}`);
      console.log(`🗂️  Namespaces: ${stats.namespaces}`);
    } catch (error) {
      console.error(colors.red("Failed to import:"), (error as Error).message);
    }
  });

memoryCommand
  .command("stats")
  .description("Show memory statistics")
  .option("--json", "Output in JSON format")
  .action(async (options: Record<string, unknown>) => {
    try {
      const memory = new SimpleMemoryManager();
      const stats = await memory.getStats();
      
      if (options.json) {
        console.log(JSON.stringify(stats, null, 2));
        return;
      }
      
      console.log(colors.green("📊 Memory Bank Statistics:"));
      console.log(`   Total Entries: ${stats.totalEntries}`);
      console.log(`   Namespaces: ${stats.namespaces}`);
      console.log(`   Size: ${(stats.sizeBytes / 1024).toFixed(2)} KB`);
      
      if (stats.namespaces > 0) {
        console.log(colors.blue("\n📁 Namespace Breakdown:"));
        for (const [namespace, count] of Object.entries(stats.namespaceStats)) {
          console.log(`   ${namespace}: ${count} entries`);
        }
      }
    } catch (error) {
      if (options.json) {
        console.log(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }, null, 2));
      } else {
        console.error(colors.red("Failed to get stats:"), (error as Error).message);
      }
    }
  });

memoryCommand
  .command("cleanup")
  .description("Clean up old entries")
  .option("-d, --days <days>", "Entries older than n days", "30")
  .action(async (options: Record<string, unknown>) => {
    try {
      const memory = new SimpleMemoryManager();
      const removed = await memory.cleanup(parseInt(options.days as string) || 30);
      console.log(colors.green("✅ Cleanup completed"));
      console.log(`🗑️  Removed: ${removed} entries older than ${options.days} days`);
    } catch (error) {
      console.error(colors.red("Failed to cleanup:"), (error as Error).message);
    }
  });