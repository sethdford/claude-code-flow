// init/directory-structure.ts - Directory structure creation
import { getVersion } from "../../utils/version.js";

export async function createDirectoryStructure(): Promise<void> {
  const fs = await import("fs/promises");
  const _path = await import("path");
  
  // Define directory structure
  const directories = [
    ".claude",
    ".claude/commands",
    ".claude/commands/swarm",
    ".claude/commands/sparc",
    ".claude/logs",
    ".claude/memory",
    ".claude/configs",
    "memory",
    "memory/agents",
    "memory/sessions",
    "coordination",
    "coordination/memory_bank",
    "coordination/subtasks",
    "coordination/orchestration",
    "reports",
  ];
  
  // Create directories
  for (const dir of directories) {
    try {
      await fs.mkdir(dir, { recursive: true });
      console.log(`  ✅ Created ${dir}/ directory`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") {
        throw error;
      }
    }
  }
  
  // Create README files for key directories
  const readmeFiles = {
    "memory/agents/README.md": createAgentsReadme(),
    "memory/sessions/README.md": createSessionsReadme(),
    "coordination/README.md": createCoordinationReadme(),
    "reports/README.md": createReportsReadme(),
  };
  
  for (const [filePath, content] of Object.entries(readmeFiles)) {
    await fs.writeFile(filePath, content);
    console.log(`  ✅ Created ${filePath}`);
  }
  
  // Create initial persistence database
  const initialData = {
    agents: [],
    tasks: [],
    swarms: [],
    lastUpdated: Date.now(),
    version: getVersion(),
  };
  
  await fs.writeFile("memory/claude-flow-data.json", JSON.stringify(initialData, null, 2));
  console.log("  ✅ Created memory/claude-flow-data.json (persistence database)");
  
  // Create local wrapper script
  const wrapperScript = createWrapperScript();
  await fs.writeFile("claude-flow", wrapperScript);
  
  // Make the wrapper script executable (Unix-like systems)
  try {
    const { chmod } = await import("fs");
    chmod("claude-flow", 0o755, (err) => {
      if (err) console.warn("  ⚠️  Could not make claude-flow executable:", err.message);
    });
  } catch (error) {
    // chmod not available (Windows), skip
  }
  
  console.log("  ✅ Created ./claude-flow wrapper script");
}

function createAgentsReadme(): string {
  return `# Agents Directory

This directory stores persistent information about AI agents created and managed by Claude-Flow.

## Structure
- Each agent gets its own JSON file named by agent ID
- Agent files contain configuration, state, and memory
- Shared agent data is stored in agent-registry.json

## Usage
Agents are automatically managed by the Claude-Flow orchestration system. You can:
- View agent status with \`claude-flow agent list\`
- Create new agents with \`claude-flow agent spawn <type>\`
- Configure agents with \`claude-flow agent configure <id>\`

## Files
- \`agent-registry.json\`: Central agent registry
- \`agent-<id>.json\`: Individual agent data files
- \`templates/\`: Agent configuration templates
`;
}

function createSessionsReadme(): string {
  return `# Sessions Directory

This directory stores information about Claude-Flow orchestration sessions.

## Structure
- Each session gets its own subdirectory
- Session data includes tasks, coordination state, and results
- Session logs are automatically rotated

## Usage
Sessions are managed automatically during orchestration:
- Start sessions with \`claude-flow start\`
- Monitor sessions with \`claude-flow status\`
- Review session history with \`claude-flow session list\`

## Files
- \`session-<id>/\`: Individual session directories
- \`active-sessions.json\`: Currently active sessions
- \`session-history.json\`: Historical session data
`;
}

function createCoordinationReadme(): string {
  return `# Coordination Directory

This directory manages task coordination and orchestration data.

## Subdirectories
- \`memory_bank/\`: Shared memory for agent coordination
- \`subtasks/\`: Task breakdown and assignment data
- \`orchestration/\`: High-level orchestration patterns

## Usage
Coordination data is used for:
- Multi-agent task distribution
- Progress tracking and monitoring
- Resource allocation and balancing
- Error recovery and failover

Access coordination data through the Claude-Flow API or CLI commands.
`;
}

function createReportsReadme(): string {
  return `# Reports Directory

This directory stores output reports from swarm operations and orchestration tasks.

## Structure
- Swarm reports are stored by operation ID
- Reports include execution logs, results, and metrics
- Multiple output formats supported (JSON, SQLite, CSV, HTML)

## Usage
Reports are generated automatically by swarm operations:
- View recent reports with \`claude-flow swarm list\`
- Check specific reports with \`claude-flow swarm status <id>\`
- Export reports in different formats using \`--output\` flags

## File Types
- \`*.json\`: Structured operation data
- \`*.sqlite\`: Database format for complex queries
- \`*.csv\`: Tabular data for analysis
- \`*.html\`: Human-readable reports
`;
}

function createWrapperScript(): string {
  return `#!/usr/bin/env node
/**
 * Local Claude-Flow wrapper script
 * Automatically generated by claude-flow init
 */

// Try to use local installation first, then global, then npx
import { spawn, execSync } from 'child_process';
import { join } from 'path';
import { existsSync } from 'fs';

async function findClaudeFlow() {
  // Method 1: Check for local node_modules installation
  const localPath = join(process.cwd(), 'node_modules', '.bin', 'claude-flow');
  if (existsSync(localPath)) {
    return localPath;
  }
  
  // Method 2: Check for global installation
  try {
    const globalPath = execSync('which claude-flow', { encoding: 'utf8' }).trim();
    if (globalPath && existsSync(globalPath)) {
      return 'claude-flow';
    }
  } catch (error) {
    // Global not found, continue
  }
  
  // Method 3: Use npx as fallback
  return 'npx @sethdouglasford/claude-flow@latest';
}

async function main() {
  try {
    const claudeFlowCmd = await findClaudeFlow();
    const args = process.argv.slice(2);
    
    // Determine if we need to split the command for npx
    const cmdParts = claudeFlowCmd.split(' ');
    const command = cmdParts[0];
    const baseArgs = cmdParts.slice(1);
    
    const child = spawn(command, [...baseArgs, ...args], {
      stdio: 'inherit',
      shell: process.platform === 'win32'
    });
    
    child.on('error', (error) => {
      console.error('Failed to start claude-flow:', error.message);
      process.exit(1);
    });
    
    child.on('exit', (code) => {
      process.exit(code || 0);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
`;
}