/**
 * Command utilities and shared functions
 * Legacy CLI system removed - all commands now use Commander.js
 */

// Note: These imports are placeholders - actual implementations may differ
// import { JsonPersistenceManager } from "../persistence/json.js";
// import { Orchestrator } from "../orchestrator.js";
// import { ConfigManager } from "../config.js";

// Shared utility functions for commands
// Note: These functions are commented out until proper imports are available
/*
let persistenceInstance: JsonPersistenceManager | null = null;
let orchestratorInstance: Orchestrator | null = null;
let configInstance: ConfigManager | null = null;

export async function getPersistence(): Promise<JsonPersistenceManager> {
  if (!persistenceInstance) {
    persistenceInstance = new JsonPersistenceManager("./memory/claude-flow-data.json");
    await persistenceInstance.initialize();
  }
  return persistenceInstance;
}

export async function getOrchestrator(): Promise<Orchestrator> {
  if (!orchestratorInstance) {
    const config = await getConfigManager();
    orchestratorInstance = new Orchestrator(config);
  }
  return orchestratorInstance;
}

export async function getConfigManager(): Promise<ConfigManager> {
  if (!configInstance) {
    configInstance = new ConfigManager();
    await configInstance.initialize();
  }
  return configInstance;
}
*/

// Utility functions for initialization
export function getCapabilitiesForType(type: string): string[] {
  const capabilityMap: Record<string, string[]> = {
    "research": ["web_search", "analysis", "documentation"],
    "development": ["code_generation", "testing", "debugging"],
    "analysis": ["data_analysis", "reporting", "visualization"],
    "coordination": ["task_management", "communication", "scheduling"],
  };
  
  return capabilityMap[type] || ["general"];
}

export function getDefaultPromptForType(type: string): string {
  const promptMap: Record<string, string> = {
    "research": "Conduct thorough research on the given topic",
    "development": "Implement the requested feature or fix",
    "analysis": "Analyze the provided data and generate insights",
    "coordination": "Coordinate tasks and manage workflow",
  };
  
  return promptMap[type] || "Complete the assigned task";
}

// Template creation functions
export function createMinimalClaudeMd(): string {
  return `# Claude Code Configuration

## Build Commands
- \`npm run build\`: Build the project
- \`npm run test\`: Run tests
- \`npm run lint\`: Run linting
- \`npx claude-flow start\`: Start the orchestration system

## Code Style
- Use ES modules syntax
- TypeScript for all new code
- Follow existing naming conventions

## Important Notes
- Use \`claude --dangerously-skip-permissions\` for unattended operation
- Memory persistence is handled automatically
`;
}

export function createFullClaudeMd(): string {
  return `# Claude Code Configuration

## Build Commands
- \`npm run build\`: Build the project using TypeScript compilation and SEA binaries
- \`npm run test\`: Run the full test suite
- \`npm run lint\`: Run ESLint and format checks
- \`npm run typecheck\`: Run TypeScript type checking
- \`npx claude-flow start\`: Start the orchestration system
- \`npx claude-flow --help\`: Show all available commands

## Code Style Preferences
- Use ES modules (import/export) syntax, not CommonJS (require)
- Destructure imports when possible (e.g., \`import { foo } from 'bar'\`)
- Use TypeScript for all new code
- Follow existing naming conventions (camelCase for variables, PascalCase for classes)
- Add JSDoc comments for public APIs
- Use async/await instead of Promise chains
- Prefer const/let over var

## Workflow Guidelines
- Always run typecheck after making code changes
- Run tests before committing changes
- Use meaningful commit messages following conventional commits
- Create feature branches for new functionality
- Ensure all tests pass before merging

## Project Architecture
This is a Claude-Flow AI agent orchestration system with the following components:
- **CLI Interface**: Command-line tools for managing the system
- **Orchestrator**: Core engine for coordinating agents and tasks
- **Memory System**: Persistent storage and retrieval of information
- **Terminal Management**: Automated terminal session handling
- **MCP Integration**: Model Context Protocol server for Claude integration
- **Agent Coordination**: Multi-agent task distribution and management

## Important Notes
- Use \`claude --dangerously-skip-permissions\` for unattended operation
- The system supports both daemon and interactive modes
- Memory persistence is handled automatically
- All components are event-driven for scalability

## Debugging
- Check logs in \`./claude-flow.log\`
- Use \`npx claude-flow status\` to check system health
- Monitor with \`npx claude-flow monitor\` for real-time updates
`;
}

export function createMinimalMemoryBankMd(): string {
  return `# Memory Bank

## Purpose
Central repository for agent memory and coordination data.

## Structure
- \`agents/\`: Agent-specific memory files
- \`sessions/\`: Session state and history
- \`coordination/\`: Cross-agent coordination data

## Usage
Memory is automatically managed by the Claude-Flow system.
`;
}

export function createFullMemoryBankMd(): string {
  return `# Memory Bank

## Purpose
The Memory Bank serves as the central repository for all agent memory, session data, and coordination information in the Claude-Flow system.

## Directory Structure
\`\`\`
memory/
├── agents/           # Agent-specific memory files
├── sessions/         # Session state and history
├── coordination/     # Cross-agent coordination data
└── claude-flow-data.json  # Main persistence database
\`\`\`

## Memory Types

### Agent Memory
- **Location**: \`memory/agents/\`
- **Purpose**: Store agent-specific knowledge, preferences, and learned patterns
- **Format**: JSON files named by agent ID

### Session Memory
- **Location**: \`memory/sessions/\`
- **Purpose**: Maintain session state, conversation history, and context
- **Format**: JSON files with session metadata and conversation logs

### Coordination Memory
- **Location**: \`memory/coordination/\`
- **Purpose**: Store cross-agent coordination data, task assignments, and workflow state
- **Substructures**:
  - \`memory_bank/\`: Shared knowledge base
  - \`subtasks/\`: Task breakdown and progress tracking
  - \`orchestration/\`: System-level coordination data

## Usage Guidelines

### Automatic Management
The Memory Bank is automatically managed by the Claude-Flow system. Agents can:
- Store and retrieve information using the memory API
- Access shared knowledge across sessions
- Maintain context between interactions

### Manual Access
For debugging or analysis, you can:
- Examine JSON files directly
- Use \`npx claude-flow memory query\` commands
- Export/import memory data for backup

### Best Practices
- Memory is persistent across system restarts
- Large data should be stored in separate files with references
- Regular cleanup of old session data is recommended
- Backup important memory data before major system changes

## API Integration
The Memory Bank integrates with:
- Agent coordination systems
- Session management
- Task orchestration
- Cross-agent communication
`;
}

export function createMinimalCoordinationMd(): string {
  return `# Coordination System

## Purpose
Manages multi-agent coordination and task distribution.

## Features
- Task assignment and tracking
- Agent communication
- Resource management

## Usage
Coordination is handled automatically by the Claude-Flow orchestrator.
`;
}

export function createFullCoordinationMd(): string {
  return `# Coordination System

## Overview
The Coordination System is the heart of Claude-Flow's multi-agent orchestration capabilities. It manages task distribution, agent communication, resource allocation, and workflow execution.

## Core Components

### Task Orchestration
- **Task Queue Management**: Prioritizes and distributes tasks across available agents
- **Dependency Resolution**: Ensures tasks are executed in the correct order
- **Load Balancing**: Distributes workload evenly across agents
- **Failure Recovery**: Handles task failures and retries

### Agent Coordination
- **Agent Registry**: Maintains a registry of available agents and their capabilities
- **Communication Protocols**: Facilitates inter-agent communication
- **Resource Allocation**: Manages computational resources and prevents conflicts
- **Health Monitoring**: Tracks agent status and performance

### Workflow Management
- **Workflow Definition**: Supports complex multi-step workflows
- **State Management**: Maintains workflow state and progress
- **Checkpoint System**: Enables workflow resumption after interruptions
- **Parallel Execution**: Coordinates parallel task execution

## Directory Structure
\`\`\`
coordination/
├── memory_bank/      # Shared knowledge and context
├── subtasks/         # Task breakdown and progress
├── orchestration/    # System-level coordination
└── workflows/        # Workflow definitions and state
\`\`\`

## Key Features

### Intelligent Task Distribution
- Analyzes task requirements and agent capabilities
- Considers current workload and availability
- Optimizes for efficiency and quality

### Real-time Coordination
- Event-driven architecture for responsive coordination
- Real-time status updates and progress tracking
- Dynamic resource reallocation based on changing conditions

### Fault Tolerance
- Automatic failure detection and recovery
- Task migration between agents
- Graceful degradation under resource constraints

## Configuration
The coordination system can be configured through:
- System configuration files
- Runtime parameters
- Agent-specific settings
- Workflow definitions

## Monitoring and Debugging
- Real-time dashboard for system monitoring
- Detailed logging of coordination events
- Performance metrics and analytics
- Debug tools for troubleshooting

## Integration Points
- Memory Bank for persistent storage
- Agent Management for agent lifecycle
- Terminal Pool for execution environments
- MCP Server for external communication
`;
}

export function createAgentsReadme(): string {
  return `# Agents Memory Directory

This directory contains agent-specific memory files for the Claude-Flow system.

## Structure
Each agent maintains its own memory file named by agent ID:
- \`agent-{id}.json\`: Agent-specific memory and learned patterns
- \`agent-{id}-sessions.json\`: Session history for the agent
- \`agent-{id}-capabilities.json\`: Dynamic capability updates

## Memory Format
Agent memory files contain:
- Learned patterns and preferences
- Task execution history
- Performance metrics
- Capability assessments
- Inter-agent relationship data

## Automatic Management
These files are automatically created and updated by the system. Manual editing is not recommended unless for debugging purposes.

## Backup and Recovery
Regular backups of agent memory are recommended for:
- System migration
- Disaster recovery
- Performance analysis
- Debugging complex interactions
`;
}

export function createSessionsReadme(): string {
  return `# Sessions Memory Directory

This directory contains session-specific memory and state information for the Claude-Flow system.

## Structure
Session files are organized by session ID:
- \`session-{id}.json\`: Main session data and metadata
- \`session-{id}-conversation.json\`: Conversation history and context
- \`session-{id}-tasks.json\`: Task assignments and progress
- \`session-{id}-coordination.json\`: Multi-agent coordination data

## Session Lifecycle
1. **Creation**: New session files are created when a session starts
2. **Updates**: Files are continuously updated during the session
3. **Persistence**: Session data persists across system restarts
4. **Cleanup**: Old sessions are automatically archived or removed

## Data Types
- **Conversation Context**: Message history, user preferences, conversation flow
- **Task State**: Active tasks, completed work, pending assignments
- **Agent Assignments**: Which agents are involved, their roles and responsibilities
- **Coordination Data**: Inter-agent communication, shared context, workflow state

## Usage Guidelines
- Session data is automatically managed by the system
- Manual inspection is useful for debugging and analysis
- Session files can be exported for backup or migration
- Large session data may be compressed or archived automatically

## Privacy and Security
- Session data may contain sensitive information
- Ensure proper access controls and encryption for production use
- Regular cleanup of old session data is recommended
- Consider data retention policies based on your requirements
`;
}