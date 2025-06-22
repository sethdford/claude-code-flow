// init/claude-commands.ts - Copy Claude commands for slash commands

// Embedded command data for SEA compatibility
const EMBEDDED_COMMANDS = {
  "meta-frameworks": [
    "code-review-game.md",
    "feature-discovery.md", 
    "refactoring-game.md",
    "ulysses-protocol.md",
    "virgil-protocol.md",
    "wisdom-distillation.md"
  ],
  "orchestration": [
    "mcp-orchestrate.md",
    "swarm-intelligence.md"
  ],
    "sparc": [
    "analyzer.md",
    "architect.md",
    "batch-executor.md",
    "coder.md",
    "debugger.md",
    "designer.md",
    "documenter.md",
    "execute.md",
    "innovator.md",
    "integration.md",
    "memory-manager.md",
    "modes.md",
    "optimizer.md",
    "orchestrator.md",
    "researcher.md",
    "reviewer.md",
    "sparc-modes.md",
    "status.md",
    "swarm-coordinator.md",
    "tdd.md",
    "tester.md",
    "workflow-manager.md",
    "workflows.md"
  ],
  "startup": [
    "metaclaude.md"
  ],
  "swarm": [
    "analysis.md",
    "auto.md",
    "batch-tools-guide.md",
    "development.md",
    "examples.md",
    "execute.md", 
    "maintenance.md",
    "optimization.md",
    "research.md",
    "strategies.md",
    "testing.md"
  ],
  "synthesis": [
    "meta-learning-dgm.md",
    "pattern-synthesizer.md"
  ]
};

export async function copyClaudeCommands(): Promise<void> {
  const fs = await import("fs/promises");
  const path = await import("path");
  
  try {
    console.log("📂 Copying Claude commands for custom slash commands...");
    
    const targetCommandsDir = path.join(process.cwd(), '.claude', 'commands');
    let totalCreated = 0;
    let totalSkipped = 0;
    
    // Always use embedded templates for reliability across installation scenarios
    console.log("  📦 Creating commands from embedded templates...");
    
    for (const [category, files] of Object.entries(EMBEDDED_COMMANDS)) {
      const targetCategoryDir = path.join(targetCommandsDir, category);
      await fs.mkdir(targetCategoryDir, { recursive: true });
      
      for (const file of files) {
        const targetFile = path.join(targetCategoryDir, file);
        
        try {
          // Check if file already exists
          await fs.access(targetFile);
          totalSkipped++;
          continue;
        } catch {
          // File doesn't exist, create it
          const commandName = file.replace('.md', '');
          const template = createCommandTemplate(category, commandName);
          await fs.writeFile(targetFile, template);
          totalCreated++;
        }
      }
      
      console.log(`    ✅ Created ${category} command templates`);
    }
    
    // Create helpful index file
    const indexContent = createCommandIndex();
    const indexPath = path.join(targetCommandsDir, 'README.md');
    
    try {
      await fs.access(indexPath);
      console.log(`    ⏭️  README.md already exists, skipping`);
    } catch {
      await fs.writeFile(indexPath, indexContent);
      console.log(`    ✅ Created comprehensive README.md`);
    }
    
    console.log(`  ✅ Created ${totalCreated} command files, skipped ${totalSkipped} existing files`);
    console.log(`  ⚡ Commands will be available as /mcp__claude-flow__<command_name>`);
    console.log(`  📖 See .claude/commands/README.md for usage guide`);
    
  } catch (error) {
    console.error(`  ❌ Error copying Claude commands: ${(error as Error).message}`);
    throw error;
  }
}

function createCommandTemplate(category: string, commandName: string): string {
  const categoryTitles: Record<string, string> = {
    "meta-frameworks": "Meta-Framework",
    "orchestration": "Orchestration",
    "sparc": "SPARC",
    "startup": "Startup",
    "swarm": "Swarm",
    "synthesis": "Synthesis"
  };
  
  const title = categoryTitles[category] || category;
  const formattedName = commandName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  
  return `# ${formattedName}

**${title} command for advanced AI-powered development workflows**

## Overview

${formattedName} provides specialized capabilities for ${category} operations in Claude Code Flow.

## Usage

\`\`\`bash
/${category.replace(/-/g, '_')}_${commandName.replace(/-/g, '_')} "[your_input]" [options]
\`\`\`

### Arguments

- \`your_input\` (required): Description of what you want to accomplish
- \`options\` (optional): Additional configuration options

## Features

- **AI-Powered**: Leverages Claude's capabilities for intelligent ${category}
- **Batch Optimized**: Efficient processing of multiple operations
- **Memory Integration**: Persistent state across operations
- **Coordination**: Works with other Claude Code Flow commands

## Examples

\`\`\`bash
# Basic usage
/${category.replace(/-/g, '_')}_${commandName.replace(/-/g, '_')} "Implement feature X"

# Advanced usage with options
/${category.replace(/-/g, '_')}_${commandName.replace(/-/g, '_')} "Complex task" --mode=advanced --parallel
\`\`\`

## Integration

This command integrates with:
- Claude Code SDK for AI capabilities
- Memory system for state persistence
- Task coordination for workflow management
- Batch processing for efficiency

---

*Part of Claude Code Flow ${title} suite*
*Generated by claude-flow init*
`;
}

function createCommandIndex(): string {
  const categories = Object.keys(EMBEDDED_COMMANDS);
  
  return `# Claude Code Custom Slash Commands

This directory contains custom slash commands that will appear in Claude Code as \`/mcp__claude-flow__<command_name>\`.

## Available Command Categories

${categories.map(category => {
  const files = EMBEDDED_COMMANDS[category as keyof typeof EMBEDDED_COMMANDS];
  return `### ${category}
- **Location**: \`.claude/commands/${category}/\`
- **Commands**: ${files.length} commands available
- **Usage**: \`/mcp__claude-flow__${category.replace(/-/g, '_')}_<command_name>\`

Commands:
${files.map(file => `  - \`${file.replace('.md', '')}\``).join('\n')}
`;
}).join('\n')}

## How Slash Commands Work

1. **Automatic Loading**: When the Claude Code MCP server starts, it automatically loads all \`.md\` files from this directory
2. **Naming Convention**: Files become commands like \`/mcp__claude-flow__<category>_<filename>\`
3. **Arguments**: Commands can accept arguments via \`$ARGUMENTS\` placeholder in the markdown
4. **Frontmatter**: Commands can include YAML frontmatter for metadata and descriptions

## Example Usage

\`\`\`
/mcp__claude-flow__sparc_orchestrator "Coordinate multiple agents for complex task"
/mcp__claude-flow__meta_frameworks_code_review_game "Review this pull request"
/mcp__claude-flow__swarm_development "Build a microservice API"
/mcp__claude-flow__orchestration_mcp_orchestrate "Complex workflow coordination"
\`\`\`

## Command Categories Explained

### Meta-Frameworks (6 commands)
Game-theoretic development protocols that prevent common anti-patterns:
- **code-review-game**: Systematic code review with concern budgets
- **feature-discovery**: Escape "first idea best idea" trap through diversity
- **refactoring-game**: Balance perfectionism vs shipping through energy budgets
- **ulysses-protocol**: High-stakes debugging without endless spirals
- **virgil-protocol**: Innovation through intelligent constraint (3% rule)
- **wisdom-distillation**: Extract strategic principles from tactical experience

### Orchestration (2 commands)
MCP coordination and swarm intelligence:
- **mcp-orchestrate**: DSL for complex AI tool workflows
- **swarm-intelligence**: Multi-agent coordination for complex problems

### SPARC (18 commands)
Specialized development modes:
- **analyzer**: Code and data analysis specialist
- **architect**: System design and architecture planning
- **coder**: Implementation and development
- **debugger**: Problem diagnosis and resolution
- **tester**: Quality assurance and validation
- And 13 more specialized modes...

### Startup (1 command)
System initialization and orientation:
- **metaclaude**: Capability activation and system setup

### Swarm (11 commands)
Multi-agent coordination strategies:
- **auto**: Intelligent strategy selection
- **development**: Coordinated development workflows
- **research**: Collaborative research and analysis
- **testing**: Distributed testing strategies
- **optimization**: Performance and efficiency improvements
- **execute**: Direct swarm execution with parameters
- **strategies**: Strategy overview and selection guide
- And 4 more coordination patterns...

### Synthesis (2 commands)
Pattern analysis and meta-learning:
- **meta-learning-dgm**: Deep generative models for learning
- **pattern-synthesizer**: Extract and synthesize patterns across domains

## Creating Custom Commands

1. Create a new \`.md\` file in the appropriate category directory
2. Use the command template structure shown in existing files
3. Include clear usage examples and argument descriptions
4. Restart the MCP server to load the new command

## MCP Server Integration

These commands are automatically loaded by the Claude Code Flow MCP server when it starts. Make sure your \`.cursor/mcp.json\` is configured to use the claude-flow MCP server:

\`\`\`json
{
  "mcpServers": {
    "claude-flow": {
      "command": "npx",
      "args": ["@sethdouglasford/claude-flow", "mcp"],
      "env": {
        "ANTHROPIC_API_KEY": "your-api-key"
      }
    }
  }
}
\`\`\`

---

**Ready to supercharge your development workflow?**

These ${categories.length} command categories with ${Object.values(EMBEDDED_COMMANDS).flat().length} total commands provide systematic approaches to complex development challenges, transforming ad-hoc processes into repeatable, optimized workflows.

*Generated by Claude Code Flow initialization*
`;
} 