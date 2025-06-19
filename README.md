# Claude Flow

> Advanced AI agent orchestration system for multi-agent coordination

[![npm version](https://badge.fury.io/js/claude-flow.svg)](https://badge.fury.io/js/claude-flow)
[![Build Status](https://github.com/ruvnet/claude-code-flow/workflows/CI/badge.svg)](https://github.com/ruvnet/claude-code-flow/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Claude Flow is a powerful command-line tool and framework for orchestrating AI agents, managing complex workflows, and coordinating multi-agent systems. Built with TypeScript and Node.js, it provides a comprehensive platform for AI-driven automation and coordination.

## ✨ Features

- **🤖 Multi-Agent Orchestration**: Coordinate multiple AI agents working together
- **🔄 Workflow Management**: Define and execute complex AI workflows
- **📡 MCP Integration**: Built-in Model Context Protocol support
- **🎯 SPARC Framework**: Structured approach to AI-driven development
- **📊 Real-time Monitoring**: Track agent performance and system metrics
- **🛠️ Extensible Architecture**: Plugin system for custom functionality
- **🔐 Security First**: Built-in security measures and access controls
- **📦 Standalone Binaries**: Self-contained executables for easy deployment

## 🚀 Quick Start

### Installation

```bash
# Install globally via npm
npm install -g claude-flow

# Or run directly with npx
npx claude-flow --help
```

### Basic Usage

```bash
# Start interactive mode
claude-flow

# Show version
claude-flow --version

# Get help
claude-flow help

# Start a new workflow
claude-flow start --config my-workflow.json

# Monitor running agents
claude-flow monitor

# Check system status
claude-flow status
```

## 📖 Documentation

### Core Commands

#### `start` - Start Agent Orchestration
```bash
claude-flow start [options]
  --config <path>     Configuration file path
  --agents <number>   Number of agents to spawn
  --mode <mode>       Execution mode (sequential, parallel, swarm)
  --output <path>     Output directory
```

#### `monitor` - Real-time Monitoring
```bash
claude-flow monitor [options]
  --refresh <seconds> Refresh interval
  --format <format>   Output format (table, json, dashboard)
  --filter <filter>   Filter agents by status
```

#### `sparc` - SPARC Framework
```bash
claude-flow sparc [options]
  --mode <mode>       SPARC mode (specification, architecture, etc.)
  --input <path>      Input file or prompt
  --output <path>     Output directory
```

### Configuration

Claude Flow uses JSON configuration files to define workflows and agent behavior:

```json
{
  "name": "my-workflow",
  "version": "1.0.0",
  "agents": [
    {
      "id": "agent-1",
      "type": "claude",
      "role": "coordinator",
      "config": {
        "model": "claude-3-sonnet",
        "maxTokens": 4000
      }
    }
  ],
  "workflow": {
    "type": "sequential",
    "steps": [
      {
        "agent": "agent-1",
        "task": "analyze-requirements",
        "input": "requirements.txt"
      }
    ]
  }
}
```

### Environment Variables

```bash
# API Keys
ANTHROPIC_API_KEY=your-api-key
OPENAI_API_KEY=your-api-key

# Configuration
CLAUDE_FLOW_CONFIG=./config.json
CLAUDE_FLOW_LOG_LEVEL=info
CLAUDE_FLOW_OUTPUT_DIR=./output
```

## 🏗️ Architecture

Claude Flow is built on a modular architecture:

```
┌─────────────────┐
│   CLI Interface │
├─────────────────┤
│ Agent Manager   │
├─────────────────┤
│ Workflow Engine │
├─────────────────┤
│ MCP Integration │
├─────────────────┤
│ Core Services   │
└─────────────────┘
```

### Key Components

- **Agent Manager**: Handles agent lifecycle and coordination
- **Workflow Engine**: Executes complex multi-step workflows
- **MCP Integration**: Model Context Protocol support
- **Communication Layer**: Inter-agent messaging and coordination
- **Memory System**: Persistent storage and context management

## 🔧 Development

### Prerequisites

- Node.js 18+ 
- npm or yarn
- TypeScript

### Building from Source

```bash
# Clone the repository
git clone https://github.com/ruvnet/claude-code-flow.git
cd claude-code-flow

# Install dependencies
npm install

# Build TypeScript
npm run build:ts

# Build standalone binary
npm run build:sea

# Run tests
npm test
```

### Project Structure

```
src/
├── cli/           # CLI interface and commands
├── agents/        # Agent management system
├── coordination/  # Multi-agent coordination
├── core/          # Core services and utilities
├── mcp/           # Model Context Protocol integration
├── swarm/         # Swarm intelligence features
└── types/         # TypeScript type definitions
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [TypeScript](https://www.typescriptlang.org/)
- Powered by [Node.js](https://nodejs.org/)
- Inspired by swarm intelligence and multi-agent systems
- Thanks to the open-source community

## 📞 Support

- 📖 [Documentation](https://github.com/ruvnet/claude-code-flow/docs)
- 🐛 [Issue Tracker](https://github.com/ruvnet/claude-code-flow/issues)
- 💬 [Discussions](https://github.com/ruvnet/claude-code-flow/discussions)

---

**Made with ❤️ by the Claude Flow team** 