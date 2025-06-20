# Claude Flow

> **Enterprise AI Agent Orchestration via AWS Bedrock**  
> Connect to Claude 4 through your AWS infrastructure with automatic credential detection

[![npm version](https://badge.fury.io/js/%40sethdouglasford%2Fclaude-flow.svg)](https://badge.fury.io/js/%40sethdouglasford%2Fclaude-flow)
[![Build Status](https://github.com/sethdford/vibex-claude-code-flow/workflows/CI/badge.svg)](https://github.com/sethdford/vibex-claude-code-flow/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Originally created by [@ruvnet](https://github.com/ruvnet) - this fork is a complete rebuild to modernize the architecture and ensure full functionality.**

## 🏢 Enterprise-Ready Claude 4 Access

**Claude Flow is specifically designed for enterprises wanting to leverage Claude 4 through AWS Bedrock**, providing:

- ✅ **Enterprise Security & Compliance** - Use Claude through your AWS infrastructure
- ✅ **AWS Credits & Billing Integration** - Leverage existing AWS accounts and billing
- ✅ **Automatic Credential Detection** - Works with existing AWS configurations  
- ✅ **Latest Claude 4 Models** - Access to Claude 4 Opus and Sonnet via Bedrock
- ✅ **Multi-Agent Orchestration** - Coordinate multiple Claude instances for complex workflows
- ✅ **Zero External API Dependencies** - Everything runs through your AWS account

Claude Flow is a powerful command-line tool and framework for orchestrating AI agents, managing complex workflows, and coordinating multi-agent systems. Built with TypeScript and Node.js, it provides a comprehensive platform for enterprise AI-driven automation.

## 🚀 Enterprise Quick Start

### For Existing AWS Users

If you already have AWS configured, Claude Flow will automatically detect your credentials:

```bash
# Install globally
npm install -g @sethdouglasford/claude-flow

# Start with automatic AWS detection
claude-flow start
# ✅ Automatically detects AWS credentials
# ✅ Configures Claude 4 via Bedrock
# ✅ Ready for enterprise use
```

### AWS Bedrock Setup

```bash
# Run automated enterprise setup
./scripts/setup-bedrock.sh
# ✅ Detects existing AWS credentials
# ✅ Verifies Bedrock model access
# ✅ Configures Claude 4 models
# ✅ Tests enterprise integration
```

**Supported AWS credential sources:**
- Environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)
- AWS profiles (`AWS_PROFILE` or `~/.aws/credentials`)
- IAM roles (EC2 Instance Profile, ECS Task Role)
# Show version
@sethdouglasford/claude-flow --version

# Get help
@sethdouglasford/claude-flow help

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
# API Keys (Direct Anthropic API)
ANTHROPIC_API_KEY=your-api-key
OPENAI_API_KEY=your-api-key

# AWS Bedrock Integration (Alternative to direct API)
CLAUDE_CODE_USE_BEDROCK=true
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
ANTHROPIC_MODEL=anthropic.claude-opus-4-20250514-v1:0

# Configuration
CLAUDE_FLOW_CONFIG=./config.json
CLAUDE_FLOW_LOG_LEVEL=info
CLAUDE_FLOW_OUTPUT_DIR=./output
```

### AWS Bedrock Integration with Auto-Detection 🔍

Claude Flow automatically detects existing AWS credentials and enables Claude 4 through AWS Bedrock. No manual configuration needed if you already have AWS set up!

#### Automatic Detection

```bash
# Simply start Claude Flow - it will auto-detect and configure AWS
claude-flow start

# Test auto-detection
node test-aws-auto-detection.js
```

**Supported AWS credential sources:**
- Environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)
- AWS profiles (`AWS_PROFILE` or `~/.aws/credentials`)
- IAM roles (EC2 Instance Profile, ECS Task Role)
- AWS SSO and other standard AWS credential sources

#### Manual Setup

```bash
# Run the automated setup script with auto-detection
./scripts/setup-bedrock.sh
```

#### Manual Setup

1. **Configure AWS credentials**:
   ```bash
   aws configure
   ```

2. **Request access to Claude models** in the AWS Bedrock console

3. **Set environment variables**:
   ```bash
   export CLAUDE_CODE_USE_BEDROCK=true
   export AWS_REGION=us-east-1
   export ANTHROPIC_MODEL=anthropic.claude-3-5-sonnet-20241022-v2:0
   ```

4. **Test the integration**:
   ```bash
   claude-flow claude spawn "Hello, please confirm you're running via AWS Bedrock"
   ```

For detailed configuration options, see [Configuration Guide](docs/03-configuration-guide.md).

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

## 🧠 Memory Module

The SPARC Memory Bank system is now maintained as a separate git submodule for better modularity and independent versioning.

### Repository Structure
- **Main Project**: [vibex-claude-code-flow](https://github.com/sethdford/vibex-claude-code-flow) - Core Claude Flow application
- **Memory Module**: [vibex-claude-code-flow-memory](https://github.com/sethdford/vibex-claude-code-flow-memory) - SPARC Memory Bank system

### Working with the Memory Submodule

#### Initial Setup (for new clones)
```bash
git clone --recurse-submodules https://github.com/sethdford/vibex-claude-code-flow.git
cd claude-code-flow
```

#### If you already have the repo cloned
```bash
git submodule update --init --recursive
```

#### Updating the Memory Module
```bash
# Update to latest memory module version
git submodule update --remote memory

# Build the memory module
cd memory && npm install && npm run build && cd ..

# Commit the submodule update
git add memory
git commit -m "Update memory submodule to latest version"
```

#### Memory Module Features
- **CRDT-based conflict resolution** for distributed memory
- **Vector search capabilities** with semantic similarity
- **Multiple backends**: SQLite and Markdown
- **Namespace management** with permissions
- **Replication and synchronization**
- **Advanced caching** with LRU/LFU/FIFO strategies
- **Import/export** with multiple formats
- **Comprehensive test suite** with Vitest

## 🔧 Development

### Prerequisites

- Node.js 18+ 
- npm or yarn
- TypeScript

### Building from Source

```bash
# Clone the repository
git clone https://github.com/sethdford/vibex-claude-code-flow.git
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

- 📖 [Documentation](https://github.com/sethdford/vibex-claude-code-flow/docs)
- 🐛 [Issue Tracker](https://github.com/sethdford/vibex-claude-code-flow/issues)
- 💬 [Discussions](https://github.com/sethdford/vibex-claude-code-flow/discussions)
- 🔗 [Original Project](https://github.com/ruvnet/claude-code-flow) by [@ruvnet](https://github.com/ruvnet)

---

**Made with ❤️ by the Claude Flow team** 