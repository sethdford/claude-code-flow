# Claude Code Custom Slash Commands

This directory contains custom slash commands that will appear in Claude Code as `/mcp__claude-flow__<command_name>`.

## Available Command Categories

### meta-frameworks
- **Location**: `.claude/commands/meta-frameworks/`
- **Commands**: 6 commands available
- **Usage**: `/mcp__claude-flow__meta_frameworks_<command_name>`

Commands:
  - `code-review-game`
  - `feature-discovery`
  - `refactoring-game`
  - `ulysses-protocol`
  - `virgil-protocol`
  - `wisdom-distillation`

### orchestration
- **Location**: `.claude/commands/orchestration/`
- **Commands**: 2 commands available
- **Usage**: `/mcp__claude-flow__orchestration_<command_name>`

Commands:
  - `mcp-orchestrate`
  - `swarm-intelligence`

### sparc
- **Location**: `.claude/commands/sparc/`
- **Commands**: 18 commands available
- **Usage**: `/mcp__claude-flow__sparc_<command_name>`

Commands:
  - `analyzer`
  - `architect`
  - `batch-executor`
  - `coder`
  - `debugger`
  - `designer`
  - `documenter`
  - `innovator`
  - `memory-manager`
  - `optimizer`
  - `orchestrator`
  - `researcher`
  - `reviewer`
  - `sparc-modes`
  - `swarm-coordinator`
  - `tdd`
  - `tester`
  - `workflow-manager`

### startup
- **Location**: `.claude/commands/startup/`
- **Commands**: 1 commands available
- **Usage**: `/mcp__claude-flow__startup_<command_name>`

Commands:
  - `metaclaude`

### swarm
- **Location**: `.claude/commands/swarm/`
- **Commands**: 8 commands available
- **Usage**: `/mcp__claude-flow__swarm_<command_name>`

Commands:
  - `analysis`
  - `batch-tools-guide`
  - `development`
  - `examples`
  - `maintenance`
  - `optimization`
  - `research`
  - `testing`

### synthesis
- **Location**: `.claude/commands/synthesis/`
- **Commands**: 2 commands available
- **Usage**: `/mcp__claude-flow__synthesis_<command_name>`

Commands:
  - `meta-learning-dgm`
  - `pattern-synthesizer`


## How Slash Commands Work

1. **Automatic Loading**: When the Claude Code MCP server starts, it automatically loads all `.md` files from this directory
2. **Naming Convention**: Files become commands like `/mcp__claude-flow__<category>_<filename>`
3. **Arguments**: Commands can accept arguments via `$ARGUMENTS` placeholder in the markdown
4. **Frontmatter**: Commands can include YAML frontmatter for metadata and descriptions

## Example Usage

```
/mcp__claude-flow__sparc_orchestrator "Coordinate multiple agents for complex task"
/mcp__claude-flow__meta_frameworks_code_review_game "Review this pull request"
/mcp__claude-flow__swarm_development "Build a microservice API"
/mcp__claude-flow__orchestration_mcp_orchestrate "Complex workflow coordination"
```

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

### Swarm (8 commands)
Multi-agent coordination strategies:
- **development**: Coordinated development workflows
- **research**: Collaborative research and analysis
- **testing**: Distributed testing strategies
- **optimization**: Performance and efficiency improvements
- And 4 more coordination patterns...

### Synthesis (2 commands)
Pattern analysis and meta-learning:
- **meta-learning-dgm**: Deep generative models for learning
- **pattern-synthesizer**: Extract and synthesize patterns across domains

## Creating Custom Commands

1. Create a new `.md` file in the appropriate category directory
2. Use the command template structure shown in existing files
3. Include clear usage examples and argument descriptions
4. Restart the MCP server to load the new command

## MCP Server Integration

These commands are automatically loaded by the Claude Code Flow MCP server when it starts. Make sure your `.cursor/mcp.json` is configured to use the claude-flow MCP server:

```json
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
```

---

**Ready to supercharge your development workflow?**

These 6 command categories with 37 total commands provide systematic approaches to complex development challenges, transforming ad-hoc processes into repeatable, optimized workflows.

*Generated by Claude Code Flow initialization*
