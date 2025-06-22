# Execute Swarm Command

## Usage
```bash
# Quick execution with defaults
claude-flow swarm "Your objective here"

# Full parameter control
claude-flow swarm "Your objective" --strategy development --max-agents 8 --mode hierarchical --timeout 120
```

## Description
Direct swarm execution with full parameter control. This is the primary command for running swarm operations with custom configuration.

## Key Parameters
- `--strategy <name>` - Choose strategy (auto, research, development, analysis, testing, optimization, maintenance)
- `--max-agents <number>` - Maximum number of agents to spawn (default: 3)
- `--mode <type>` - Coordination mode (centralized, distributed, hierarchical, mesh, hybrid)
- `--timeout <minutes>` - Execution timeout in minutes (default: 60)
- `--parallel` - Enable parallel execution where possible
- `--monitor` - Enable real-time monitoring and progress display
- `--interactive` - Start interactive session after completion
- `--dry-run` - Show execution plan without running

## Coordination Modes
- **centralized**: Single coordinator (simple tasks)
- **distributed**: Multiple coordinators (complex, parallelizable tasks)  
- **hierarchical**: Tree structure (organized, structured work)
- **mesh**: Peer-to-peer (dynamic, adaptive tasks)
- **hybrid**: Mixed patterns (complex workflows)

## Advanced Options
- `--output <format>` - Output format (json, text, sqlite)
- `--memory-namespace <name>` - Custom memory namespace
- `--encryption` - Enable memory encryption
- `--verbose` - Detailed logging and progress
- `--ui` - Launch web-based monitoring UI

## Quick Examples
```bash
# Auto-strategy with monitoring
claude-flow swarm "Build a REST API" --monitor

# Research with multiple agents
claude-flow swarm "Analyze market trends" --strategy research --max-agents 6

# Development with interactive session
claude-flow swarm "Create dashboard" --strategy development --interactive

# Testing with parallel execution  
claude-flow swarm "Comprehensive testing" --strategy testing --parallel
``` 