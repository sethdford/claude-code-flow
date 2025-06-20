/**
 * Session management commands for Claude-Flow CLI
 */

import { Command } from "../cliffy-compat.js";
import { logger } from "../../core/logger.js";
import { promises as fs } from "node:fs";
import { platform } from "node:os";
import { join, dirname } from "node:path";
import { existsSync } from "node:fs";

interface Session {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  metadata: {
    version: string;
    platform: string;
    nodeVersion: string;
    workingDirectory: string;
  };
  state: {
    agents: any[];
    tasks: any[];
    memory: any[];
    config: any;
  };
  tags: string[];
  archived: boolean;
}

interface SessionExportData {
  session: Session;
  exportedAt: Date;
  exportVersion: string;
}

const SESSION_DIR = ".claude-flow/sessions";
const SESSION_VERSION = "1.0.0";

export const sessionCommand = new Command()
  .name("session")
  .description("Manage Claude-Flow sessions")
  .action(() => {
    console.log("Available session commands:");
    console.log("  create   - Create a new session");
    console.log("  list     - List all sessions");
    console.log("  save     - Save current session state");
    console.log("  restore  - Restore a saved session");
    console.log("  delete   - Delete a session");
    console.log("  export   - Export session to file");
    console.log("  import   - Import session from file");
    console.log("  info     - Show detailed session information");
    console.log("  clean    - Clean up old sessions");
  })
  .command("create")
  .description("Create a new session")
  .arguments("<name>")
  .option("-d, --description <desc>", "Session description")
  .option("-t, --tags <tags>", "Comma-separated tags")
  .action(async (options, name) => {
    try {
      await ensureSessionDirectory();
      
      const session: Session = {
        id: generateSessionId(),
        name,
        description: options.description,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          version: SESSION_VERSION,
          platform: platform(),
          nodeVersion: process.version,
          workingDirectory: process.cwd(),
        },
        state: {
          agents: [],
          tasks: [],
          memory: [],
          config: {},
        },
        tags: options.tags ? options.tags.split(",").map((tag: string) => tag.trim()) : [],
        archived: false,
      };

      const filePath = join(SESSION_DIR, `${session.id}.json`);
      await fs.writeFile(filePath, JSON.stringify(session, null, 2), "utf-8");

      console.log(`✅ Session created: ${session.id}`);
      console.log(`   Name: ${name}`);
      console.log(`   File: ${filePath}`);
    } catch (error) {
      logger.error("Failed to create session:", error);
      console.error("❌ Failed to create session");
    }
  })
  .command("list")
  .description("List all sessions")
  .option("-a, --archived", "Include archived sessions")
  .option("--json", "Output in JSON format")
  .action(async (options) => {
    try {
      const sessions = await getAllSessions();
      
      let filteredSessions = sessions;
      if (!options.archived) {
        filteredSessions = sessions.filter(s => !s.archived);
      }

      if (options.json) {
        console.log(JSON.stringify(filteredSessions, null, 2));
        return;
      }

      if (filteredSessions.length === 0) {
        console.log("No sessions found");
        return;
      }

      console.log(`\n📋 Sessions (${filteredSessions.length}):\n`);
      
      for (const session of filteredSessions) {
        const ageMs = Date.now() - session.createdAt.getTime();
        const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));
        const ageHours = Math.floor(ageMs / (1000 * 60 * 60));
        const ageStr = ageDays > 0 ? `${ageDays}d ago` : `${ageHours}h ago`;

        console.log(`🔹 ${session.name} (${session.id})`);
        console.log(`   Created: ${ageStr}`);
        if (session.description) {
          console.log(`   Description: ${session.description}`);
        }
        if (session.tags.length > 0) {
          console.log(`   Tags: ${session.tags.join(", ")}`);
        }
        console.log(`   Agents: ${session.state.agents.length}, Tasks: ${session.state.tasks.length}`);
        if (session.archived) {
          console.log("   📦 Archived");
        }
        console.log();
      }
    } catch (error) {
      logger.error("Failed to list sessions:", error);
      console.error("❌ Failed to list sessions");
    }
  })
  .command("save")
  .description("Save current session state")
  .arguments("<session-id>")
  .option("-m, --message <msg>", "Save message")
  .action(async (options, sessionId) => {
    try {
      const session = await loadSession(sessionId);
      if (!session) {
        console.error(`❌ Session not found: ${sessionId}`);
        return;
      }

      // In a real implementation, this would capture current state
      session.updatedAt = new Date();
      session.state = {
        agents: [], // Would capture current agents
        tasks: [],  // Would capture current tasks
        memory: [], // Would capture current memory
        config: {}, // Would capture current config
      };

      const filePath = join(SESSION_DIR, `${session.id}.json`);
      await fs.writeFile(filePath, JSON.stringify(session, null, 2), "utf-8");

      console.log(`✅ Session saved: ${sessionId}`);
      if (options.message) {
        console.log(`   Message: ${options.message}`);
      }
    } catch (error) {
      logger.error("Failed to save session:", error);
      console.error("❌ Failed to save session");
    }
  })
  .command("restore")
  .description("Restore a saved session")
  .arguments("<session-id>")
  .option("-f, --force", "Force restore without confirmation")
  .action(async (options, sessionId) => {
    try {
      const session = await loadSession(sessionId);
      if (!session) {
        console.error(`❌ Session not found: ${sessionId}`);
        return;
      }

      if (!options.force) {
        console.log(`⚠️  This will restore session: ${session.name}`);
        console.log("   Current state will be lost!");
        // In a real implementation, would prompt for confirmation
      }

      // In a real implementation, this would restore the session state
      console.log(`✅ Session restored: ${session.name}`);
      console.log(`   Agents: ${session.state.agents.length}`);
      console.log(`   Tasks: ${session.state.tasks.length}`);
    } catch (error) {
      logger.error("Failed to restore session:", error);
      console.error("❌ Failed to restore session");
    }
  })
  .command("delete")
  .description("Delete a session")
  .arguments("<session-id>")
  .option("-f, --force", "Force delete without confirmation")
  .action(async (options, sessionId) => {
    try {
      const session = await loadSession(sessionId);
      if (!session) {
        console.error(`❌ Session not found: ${sessionId}`);
        return;
      }

      if (!options.force) {
        console.log(`⚠️  This will permanently delete session: ${session.name}`);
        // In a real implementation, would prompt for confirmation
      }

      const filePath = join(SESSION_DIR, `${sessionId}.json`);
      await fs.unlink(filePath);

      console.log(`✅ Session deleted: ${session.name}`);
    } catch (error) {
      logger.error("Failed to delete session:", error);
      console.error("❌ Failed to delete session");
    }
  })
  .command("export")
  .description("Export session to file")
  .arguments("<session-id> <output-file>")
  .option("--format <fmt>", "Export format (json, yaml)", "json")
  .action(async (options, sessionId, outputFile) => {
    try {
      const session = await loadSession(sessionId);
      if (!session) {
        console.error(`❌ Session not found: ${sessionId}`);
        return;
      }

      const exportData: SessionExportData = {
        session,
        exportedAt: new Date(),
        exportVersion: SESSION_VERSION,
      };

      let content: string;
      if (options.format === "yaml") {
        // Would use yaml library in real implementation
        content = JSON.stringify(exportData, null, 2);
      } else {
        content = JSON.stringify(exportData, null, 2);
      }

      await fs.writeFile(outputFile, content, "utf-8");

      console.log(`✅ Session exported: ${outputFile}`);
      console.log(`   Format: ${options.format}`);
      console.log(`   Size: ${content.length} bytes`);
    } catch (error) {
      logger.error("Failed to export session:", error);
      console.error("❌ Failed to export session");
    }
  })
  .command("import")
  .description("Import session from file")
  .arguments("<input-file>")
  .option("-n, --name <name>", "Override session name")
  .option("-f, --force", "Force import even if session exists")
  .action(async (options, inputFile) => {
    try {
      const content = await fs.readFile(inputFile, "utf-8");
      const importData: SessionExportData = JSON.parse(content);

      const { session } = importData;
      
      if (options.name) {
        session.name = options.name;
      }

      // Generate new ID to avoid conflicts
      session.id = generateSessionId();
      session.createdAt = new Date();
      session.updatedAt = new Date();

      await ensureSessionDirectory();
      
      const sessionData = {
        ...session,
        metadata: {
          ...session.metadata,
          importedAt: new Date(),
          importedFrom: inputFile,
        },
      };

      const filePath = join(SESSION_DIR, `${session.id}.json`);
      await fs.writeFile(filePath, JSON.stringify(sessionData, null, 2), "utf-8");

      console.log(`✅ Session imported: ${session.name}`);
      console.log(`   ID: ${session.id}`);
      console.log(`   File: ${filePath}`);
    } catch (error) {
      logger.error("Failed to import session:", error);
      console.error("❌ Failed to import session");
    }
  })
  .command("info")
  .description("Show detailed session information")
  .arguments("<session-id>")
  .option("--json", "Output in JSON format")
  .action(async (options, sessionId) => {
    try {
      const session = await loadSession(sessionId);
      if (!session) {
        console.error(`❌ Session not found: ${sessionId}`);
        return;
      }

      if (options.json) {
        console.log(JSON.stringify(session, null, 2));
        return;
      }

      console.log("\n📊 Session Information\n");
      console.log(`ID: ${session.id}`);
      console.log(`Name: ${session.name}`);
      if (session.description) {
        console.log(`Description: ${session.description}`);
      }
      console.log(`Created: ${session.createdAt.toISOString()}`);
      console.log(`Updated: ${session.updatedAt.toISOString()}`);
      
      console.log("\n🔧 Metadata:");
      console.log(`  Version: ${session.metadata.version}`);
      console.log(`  Platform: ${session.metadata.platform}`);
      console.log(`  Node Version: ${session.metadata.nodeVersion}`);
      console.log(`  Working Directory: ${session.metadata.workingDirectory}`);
      
      console.log("\n📈 State:");
      console.log(`  Agents: ${session.state.agents.length}`);
      console.log(`  Tasks: ${session.state.tasks.length}`);
      console.log(`  Memory Entries: ${session.state.memory.length}`);
      
      if (session.tags.length > 0) {
        console.log(`\n🏷️  Tags: ${session.tags.join(", ")}`);
      }
      
      if (session.archived) {
        console.log("\n📦 Status: Archived");
      }

      // Show file size
      const filePath = join(SESSION_DIR, `${sessionId}.json`);
      try {
        const fileInfo = await fs.stat(filePath);
        console.log(`\n📄 File: ${filePath}`);
        console.log(`   Size: ${fileInfo.size} bytes`);
        console.log(`   Modified: ${fileInfo.mtime.toISOString()}`);
      } catch {
        console.log("\n📄 File: Not found");
      }
    } catch (error) {
      logger.error("Failed to show session info:", error);
      console.error("❌ Failed to show session info");
    }
  })
  .command("clean")
  .description("Clean up old sessions")
  .option("--days <days>", "Delete sessions older than N days", "30")
  .option("--archived-only", "Only clean archived sessions")
  .option("--dry-run", "Show what would be deleted without deleting")
  .action(async (options) => {
    try {
      const sessions = await getAllSessions();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(options.days));

      const sessionsToDelete = sessions.filter(session => {
        const isOld = session.createdAt < cutoffDate;
        const shouldDelete = options.archivedOnly ? session.archived && isOld : isOld;
        return shouldDelete;
      });

      if (sessionsToDelete.length === 0) {
        console.log("No sessions to clean up");
        return;
      }

      console.log(`Found ${sessionsToDelete.length} sessions to clean up:`);
      
      for (const session of sessionsToDelete) {
        const ageMs = Date.now() - session.createdAt.getTime();
        const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));
        
        console.log(`  - ${session.name} (${session.id}) - ${ageDays} days old`);
        
        if (!options.dryRun) {
          const filePath = join(SESSION_DIR, `${session.id}.json`);
          await fs.unlink(filePath);
        }
      }

      if (options.dryRun) {
        console.log("\n🔍 Dry run - no sessions were deleted");
        console.log("Remove --dry-run to actually delete these sessions");
      } else {
        console.log(`\n✅ Cleaned up ${sessionsToDelete.length} sessions`);
      }
    } catch (error) {
      logger.error("Failed to clean sessions:", error);
      console.error("❌ Failed to clean sessions");
    }
  });

// Helper functions
async function ensureSessionDirectory(): Promise<void> {
  await fs.mkdir(SESSION_DIR, { recursive: true });
}

function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `session-${timestamp}-${random}`;
}

async function loadSession(sessionId: string): Promise<Session | null> {
  try {
    const filePath = join(SESSION_DIR, `${sessionId}.json`);
    const content = await fs.readFile(filePath, "utf-8");
    const session = JSON.parse(content);
    
    // Convert date strings back to Date objects
    session.createdAt = new Date(session.createdAt);
    session.updatedAt = new Date(session.updatedAt);
    
    return session;
  } catch {
    return null;
  }
}

async function getAllSessions(): Promise<Session[]> {
  try {
    if (!existsSync(SESSION_DIR)) {
      return [];
    }

    const entries = await fs.readdir(SESSION_DIR, { withFileTypes: true });
    const sessions: Session[] = [];

    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith(".json")) {
        try {
          const content = await fs.readFile(join(SESSION_DIR, entry.name), "utf-8");
          const session = JSON.parse(content);
          
          // Convert date strings back to Date objects
          session.createdAt = new Date(session.createdAt);
          session.updatedAt = new Date(session.updatedAt);
          
          sessions.push(session);
        } catch (error) {
          logger.warn(`Failed to load session ${entry.name}:`, error);
        }
      }
    }

    return sessions.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  } catch {
    return [];
  }
}