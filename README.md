# 🧠 Claude-Flow: Advanced AI Agent Orchestration System

> **Transform your development workflow with intelligent multi-agent coordination and game-theoretic development protocols**

[![npm version](https://badge.fury.io/js/@sethdouglasford/claude-flow.svg)](https://badge.fury.io/js/@sethdouglasford/claude-flow)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

Claude-Flow is a **next-generation AI agent orchestration platform** that enables sophisticated multi-agent coordination, advanced process management, and intelligent task distribution. Built with modern TypeScript and featuring native MCP integration, it represents the evolution of AI-powered development workflows with game-theoretic protocols and advanced synthesis capabilities.

## 🎬 **See Claude Code in Action**

![Claude Code Demo](./demo.gif)

*Watch Claude Code seamlessly handle complex development tasks with intelligent code generation, real-time editing, and autonomous problem-solving capabilities.*

---

## 🚀 **Quick Start - Get Running in 60 Seconds**

### **Method 1: NPX Quick Start (Recommended)**
```bash
# Initialize complete environment
npx @sethdouglasford/claude-flow@latest init --sparc

# Start with Web UI
./claude-flow start --ui --port 3000 --auto-start
```

### **Method 2: Global Installation**
```bash
# Install globally
npm install -g @sethdouglasford/claude-flow

# Initialize and start
claude-flow init --sparc
claude-flow start --ui --auto-start
```

### **Method 3: Project Integration**
```bash
# Add to project
npm install @sethdouglasford/claude-flow --save-dev

# Initialize with local wrapper
npx claude-flow init --sparc
./claude-flow start --ui
```

---

## 🎯 **Why Claude-Flow?**

### **🏗️ Advanced Process Orchestration**
Unlike simple CLI wrappers, Claude-Flow provides **true process orchestration** with:
- **Dependency-aware startup** - Components start in correct order automatically
- **Real-time health monitoring** - Live process status and metrics
- **Auto-recovery systems** - Intelligent error handling and process recovery
- **Resource management** - Terminal pools, memory management, coordination layers

### **🧠 Intelligent Agent Coordination**
- **Hierarchical model strategy** - Automatic model selection based on task complexity
- **Multi-agent workflows** - Coordinated agent swarms for complex projects
- **Distributed memory system** - Shared knowledge across all agents
- **Event-driven architecture** - Real-time communication between components

### **🎮 Game-Theoretic Development Protocols**
- **Meta-frameworks** - 6 advanced development protocols with cognitive budgets
- **Strategic orchestration** - MCP DSL and swarm intelligence coordination
- **Synthesis capabilities** - Pattern analysis and meta-learning systems
- **Capability activation** - Progressive skill unlocking and enhancement

### **⚡ Modern Technical Architecture**
- **TypeScript-first** - Full type safety and modern ES modules
- **MCP native integration** - Model Context Protocol for advanced tool usage
- **Cross-platform SEA binaries** - Self-contained 71MB executables
- **Multiple installation methods** - NPX, global, local with intelligent detection

---

## 🎮 **Usage Examples**

### **🚀 Basic Operations**
```bash
# Check system health
./claude-flow status

# Start with interactive UI
./claude-flow start --ui --port 3000

# Monitor system in real-time
./claude-flow monitor --dashboard

# Manage agent lifecycle
./claude-flow agent spawn researcher --name "DataBot"
./claude-flow agent info agent-123
```

### **🎯 Game-Theoretic Meta-Frameworks**
```bash
# Advanced development protocols with cognitive budgets
./claude-flow meta-frameworks run code-review-game "Review authentication system" --reviewers 3
./claude-flow meta-frameworks run feature-discovery "Add real-time collaboration" --explorers 4
./claude-flow meta-frameworks run refactoring-game "Optimize database layer" --energy-budget 100
./claude-flow meta-frameworks run ulysses-protocol "Debug complex race condition" --time-box 2h
./claude-flow meta-frameworks run virgil-protocol "Innovative caching strategy" --restraint-level high
./claude-flow meta-frameworks run wisdom-distillation "Extract patterns from codebase" --levels 5

# List all available meta-frameworks
./claude-flow meta-frameworks list
./claude-flow meta-frameworks info ulysses-protocol
```

### **🔧 Advanced Orchestration Systems**
```bash
# MCP Orchestration DSL for complex workflows
./claude-flow orchestration run mcp-dsl "
  parallel {
    task analyze_code { tool: code_analyzer, input: './src' }
    task run_tests { tool: test_runner, input: './tests' }
  }
  task generate_report { 
    depends: [analyze_code, run_tests]
    tool: report_generator 
  }
"

# Swarm Intelligence with dynamic coordination
./claude-flow orchestration run swarm-intelligence "Build microservices architecture" \
  --agents 5 --coordination hierarchical --spawn-strategy adaptive

# Show orchestration capabilities
./claude-flow orchestration list
./claude-flow orchestration dsl  # Show DSL reference
```

### **🌟 Startup & Capability Activation**
```bash
# MetaClaude Protocol for comprehensive orientation
./claude-flow startup run metaclaude "Initialize development environment"

# Check capability activation status
./claude-flow startup check

# Activate specific capabilities
./claude-flow startup activate terminal-integration
./claude-flow startup activate codebase-exploration
./claude-flow startup activate real-time-development

# List all available capabilities and tutorials
./claude-flow startup list
```

### **🧬 Synthesis & Pattern Analysis**
```bash
# Multi-source pattern synthesis
./claude-flow synthesis patterns error-handling --sources code,docs,research
./claude-flow synthesis patterns state-management --domains frontend,backend,mobile

# Meta-learning and capability evolution
./claude-flow synthesis evolve orchestration --benchmark current --enhance coordination
./claude-flow synthesis evolve debugging --target advanced --metrics accuracy,speed

# Show synthesis capabilities
./claude-flow synthesis list
```

### **🔥 Enhanced Swarm Strategies**
```bash
# Advanced swarm strategies with intelligent coordination
./claude-flow swarm "Build e-commerce platform" --strategy development --max-agents 5
./claude-flow swarm "Analyze user behavior data" --strategy analysis --parallel
./claude-flow swarm "Optimize system performance" --strategy optimization --research
./claude-flow swarm "Comprehensive testing suite" --strategy testing --coverage 95
./claude-flow swarm "System maintenance update" --strategy maintenance --safety-checks

# Strategy intelligence and recommendations
./claude-flow swarm-strategies  # List all strategies in tree format
./claude-flow swarm-strategies development  # Detailed strategy info
./claude-flow swarm "Create REST API" --strategy auto  # Auto-recommendation
```

### **📊 Intelligent Task Analysis**
```bash
# AI-powered task complexity analysis
./claude-flow analyze task "Implement user authentication with JWT and session management"
./claude-flow analyze breakdown "Create REST API" --subtasks 5 --tech-stack "Node.js,Express,MongoDB"

# Workflow analysis and optimization
./claude-flow analyze workflow examples/02-workflows/claude-workflow.json --breakdown
./claude-flow analyze project --tech-stack "React,Node.js,PostgreSQL" --team-experience senior
```

### **⚡ Comprehensive Workflow Management**
```bash
# Execute workflows with advanced features
./claude-flow workflow run my-workflow.json --variables '{"env":"prod"}' --watch
./claude-flow workflow validate workflow.json --strict
./claude-flow workflow status workflow-abc123 --watch

# Template generation and management
./claude-flow workflow template development -o dev-workflow.json
./claude-flow workflow template research -o research-workflow.json

# Workflow examples and help
./claude-flow workflow examples
```

### **🧠 Memory & Knowledge Management**
```bash
# Store project knowledge
./claude-flow memory store architecture "Microservice design patterns"
./claude-flow memory store requirements "JWT authentication with refresh tokens"

# Query stored information
./claude-flow memory query "authentication patterns"

# System monitoring
./claude-flow status
./claude-flow monitor --dashboard
```

---

## 📋 **Complete Command Reference**

### **🎯 Game-Theoretic Meta-Frameworks**

| Framework | Purpose | Key Features | Example |
|-----------|---------|--------------|---------|
| `code-review-game` | Multi-agent code review with concern budgets | Progressive disclosure, reviewer tournaments | `./claude-flow meta-frameworks run code-review-game "Review auth system"` |
| `feature-discovery` | Cognitive exploration with diversity tournaments | Isolated generation, cross-pollination | `./claude-flow meta-frameworks run feature-discovery "Add collaboration"` |
| `refactoring-game` | Energy-budget refactoring with spiral detection | Minimax regret, efficiency optimization | `./claude-flow meta-frameworks run refactoring-game "Optimize DB layer"` |
| `ulysses-protocol` | High-stakes debugging with systematic escalation | Time-boxed phases, escalation triggers | `./claude-flow meta-frameworks run ulysses-protocol "Debug race condition"` |
| `virgil-protocol` | 3% Rule innovation with restraint | Exhaustive discovery, innovation restraint | `./claude-flow meta-frameworks run virgil-protocol "Novel caching strategy"` |
| `wisdom-distillation` | Multi-level abstraction extraction | Tactical to universal principles | `./claude-flow meta-frameworks run wisdom-distillation "Extract patterns"` |

### **🔧 Advanced Orchestration Systems**

| System | Purpose | Key Features | Example |
|--------|---------|--------------|---------|
| `mcp-dsl` | MCP Orchestration DSL | Parallel execution, variables, conditionals | `./claude-flow orchestration run mcp-dsl "workflow definition"` |
| `swarm-intelligence` | Dynamic agent coordination | 5 specialized agents, 3 coordination modes | `./claude-flow orchestration run swarm-intelligence "Build architecture"` |

### **🌟 Startup & Capability Systems**

| Capability | Purpose | Status Tracking | Example |
|------------|---------|-----------------|---------|
| `metaclaude` | Comprehensive orientation protocol | Progressive activation | `./claude-flow startup run metaclaude "Initialize environment"` |
| `terminal-integration` | Advanced terminal operations | Capability monitoring | `./claude-flow startup activate terminal-integration` |
| `codebase-exploration` | Deep code analysis | Skill progression | `./claude-flow startup activate codebase-exploration` |
| `real-time-development` | Live coding assistance | Performance metrics | `./claude-flow startup activate real-time-development` |

### **🧬 Synthesis & Meta-Learning**

| System | Purpose | Intelligence Level | Example |
|--------|---------|-------------------|---------|
| `pattern-synthesizer` | Multi-source pattern analysis | Cross-domain synthesis | `./claude-flow synthesis patterns error-handling` |
| `meta-learning-darwin` | Self-improving AI system | Evolutionary branching | `./claude-flow synthesis evolve orchestration` |

### **🔥 Enhanced Swarm Strategies**

| Strategy | Purpose | Coordination Mode | Duration | Example |
|----------|---------|-------------------|----------|---------|
| `development` | Full-stack development | Hierarchical | ~120 min | `./claude-flow swarm "Build API" --strategy development` |
| `analysis` | Data analysis & insights | Mesh | ~90 min | `./claude-flow swarm "Analyze data" --strategy analysis` |
| `testing` | Comprehensive testing | Parallel | ~60 min | `./claude-flow swarm "Test suite" --strategy testing` |
| `optimization` | Performance optimization | Hybrid | ~90 min | `./claude-flow swarm "Optimize system" --strategy optimization` |
| `maintenance` | System maintenance | Centralized | ~75 min | `./claude-flow swarm "Update system" --strategy maintenance` |
| `research` | Deep research & analysis | Distributed | ~180 min | `./claude-flow swarm "Research trends" --strategy research` |
| `auto` | Intelligent strategy selection | Adaptive | Variable | `./claude-flow swarm "Any objective" --strategy auto` |

### **📊 Intelligent Task Analysis**

| Command | Purpose | AI-Powered Features | Example |
|---------|---------|-------------------|---------|
| `analyze task` | Single task complexity analysis | Complexity scoring, risk assessment | `./claude-flow analyze task "Implement auth"` |
| `analyze breakdown` | Task decomposition | Subtask generation, acceptance criteria | `./claude-flow analyze breakdown "Build API" --subtasks 5` |
| `analyze workflow` | Workflow optimization | Multi-task analysis, recommendations | `./claude-flow analyze workflow workflow.json` |
| `analyze project` | Project-wide analysis | Technology context, team assessment | `./claude-flow analyze project --tech-stack "React,Node"` |

### **⚡ Comprehensive Workflow Management**

| Command | Purpose | Advanced Features | Example |
|---------|---------|-------------------|---------|
| `workflow run` | Execute workflows | Variables, watch mode, parallel execution | `./claude-flow workflow run workflow.json --watch` |
| `workflow validate` | Workflow validation | Strict mode, dependency checking | `./claude-flow workflow validate workflow.json --strict` |
| `workflow status` | Execution monitoring | Real-time progress, task status | `./claude-flow workflow status workflow-123 --watch` |
| `workflow template` | Template generation | Multiple workflow types | `./claude-flow workflow template development -o dev.json` |

### **Core System Commands**

| Command | Description | Example |
|---------|-------------|---------|
| `init` | Initialize project with Claude integration | `./claude-flow init --sparc` |
| `start` | Start orchestration system with UI | `./claude-flow start --ui --auto-start` |
| `status` | System health and process metrics | `./claude-flow status` |
| `monitor` | Real-time system monitoring | `./claude-flow monitor --dashboard` |
| `agent` | Advanced agent lifecycle management | `./claude-flow agent spawn researcher` |

### **SPARC Development Methodology**

| Mode | Purpose | Example |
|------|---------|---------|
| `architect` | System design and architecture | `./claude-flow sparc run architect "design scalable API"` |
| `coder` | Autonomous code generation | `./claude-flow sparc run coder "implement user service"` |
| `researcher` | Deep research and analysis | `./claude-flow sparc run researcher "best practices for microservices"` |
| `tdd` | Test-driven development | `./claude-flow sparc run tdd "create comprehensive test suite"` |
| `reviewer` | Code review and quality | `./claude-flow sparc run reviewer "audit authentication flow"` |
| `debugger` | Debug and fix issues | `./claude-flow sparc run debugger "resolve API timeout issues"` |
| `tester` | Comprehensive testing | `./claude-flow sparc run tester "validate payment system"` |
| `analyzer` | Code and data analysis | `./claude-flow sparc run analyzer "performance bottlenecks"` |
| `optimizer` | Performance optimization | `./claude-flow sparc run optimizer "database query efficiency"` |
| `documenter` | Documentation generation | `./claude-flow sparc run documenter "API documentation"` |

### **Enterprise Commands**

| Command | Description | Example |
|---------|-------------|---------|
| `enterprise project` | Project lifecycle management | `./claude-flow enterprise project create "API Project" --type web-app` |
| `enterprise deploy` | Deployment automation | `./claude-flow enterprise deploy create "v1.2.0" --strategy blue-green` |
| `enterprise cloud` | Multi-cloud infrastructure | `./claude-flow enterprise cloud providers` |
| `enterprise security` | Security scanning & compliance | `./claude-flow enterprise security scan "Vulnerability Check" ./src` |
| `enterprise analytics` | Performance analytics | `./claude-flow enterprise analytics dashboard` |
| `enterprise audit` | Enterprise audit logging | `./claude-flow enterprise audit logs --framework SOC2` |

---

## 🏗️ **Technical Architecture**

### **Multi-Layer Orchestration System**
```
┌─────────────────────────────────────────────────────────┐
│            Game-Theoretic Meta-Frameworks               │
├─────────────────────────────────────────────────────────┤
│          Advanced Orchestration & Synthesis             │
├─────────────────────────────────────────────────────────┤
│               Process Orchestrator                      │
├─────────────────────────────────────────────────────────┤
│  Agent 1    Agent 2    Agent 3    Agent 4    Agent 5   │
│ Architect │   Coder   │   TDD    │ Security │  DevOps   │
├─────────────────────────────────────────────────────────┤
│         Distributed Memory & Coordination Layer         │
├─────────────────────────────────────────────────────────┤
│           Terminal Pool & Resource Management           │
├─────────────────────────────────────────────────────────┤
│              MCP Server & Tool Integration              │
├─────────────────────────────────────────────────────────┤
│                Event Bus & Communication                │
└─────────────────────────────────────────────────────────┘
```

### **Core Components**
- **🎯 Meta-Frameworks**: Game-theoretic development protocols with cognitive budgets
- **🔧 Orchestration Engine**: MCP DSL and swarm intelligence coordination
- **🌟 Synthesis System**: Pattern analysis and meta-learning capabilities
- **📊 Task Analyzer**: AI-powered complexity analysis and intelligent breakdown
- **⚡ Workflow Engine**: Comprehensive workflow execution with real-time monitoring
- **🎛️ Process Orchestrator**: Dependency-aware component lifecycle management
- **🤖 Agent Pool**: Specialized AI agents with hierarchical model selection
- **🧠 Memory System**: Distributed knowledge sharing with multiple backends
- **📊 Real-time Monitor**: Live metrics, health checks, and performance tracking
- **🔗 MCP Server**: Native Model Context Protocol integration
- **⚡ Terminal Pool**: Advanced terminal session management
- **📡 Event Bus**: Real-time inter-component communication

---

## 🆚 **Competitive Advantages**

### **vs. Other AI Orchestration Tools**

✅ **Game-Theoretic Protocols** - Advanced development methodologies with cognitive budgets  
✅ **Intelligent Task Analysis** - AI-powered complexity assessment and breakdown  
✅ **Advanced Orchestration** - MCP DSL and swarm intelligence coordination  
✅ **Synthesis Capabilities** - Pattern analysis and meta-learning systems  
✅ **Enhanced Swarm Strategies** - 7 specialized coordination strategies with auto-recommendation  
✅ **Comprehensive Workflows** - Full workflow lifecycle with real-time monitoring  
✅ **True Process Orchestration** - Not just a CLI wrapper  
✅ **Modern TypeScript Architecture** - Full type safety and ES modules  
✅ **Native MCP Integration** - Advanced tool protocol support  
✅ **Hierarchical Model Selection** - Automatic complexity-based model routing  
✅ **Cross-platform SEA Binaries** - Self-contained executables  
✅ **Advanced Memory Management** - Distributed knowledge systems  
✅ **Real-time Monitoring** - Live process health and metrics  
✅ **Dependency-aware Startup** - Components start in correct order  

---

## 🧪 **Testing & Quality Assurance**

### **Comprehensive Test Coverage**
```bash
# Run full test suite
npm test

# Specific test categories
npm run test:unit        # Unit tests
npm run test:integration # Integration tests
npm run test:e2e         # End-to-end tests

# Generate coverage reports
npm run test:coverage

# Quality checks
npm run lint
npm run typecheck
```

### **Quality Metrics**
- **✅ TypeScript-first**: Full type safety across codebase
- **✅ Modern ES Modules**: No CommonJS legacy issues
- **✅ Cross-platform**: Windows, Mac, Linux support
- **✅ Self-contained**: 71MB SEA binaries with zero dependencies
- **✅ Production-ready**: Advanced error handling and recovery
- **✅ Game-Theoretic Protocols**: Scientifically-backed development methodologies
- **✅ AI-Powered Analysis**: Intelligent task complexity assessment
- **✅ Advanced Orchestration**: Multi-modal coordination strategies

---

## 🤝 **Contributing**

We welcome contributions! Here's how to get started:

### **Development Setup**
```bash
# Clone and setup
git clone https://github.com/yourusername/claude-code-flow.git
cd claude-code-flow
npm install

# Build and test
npm run build
npm test

# Link for local development
npm link
```

### **Contributing Guidelines**
- 🐛 **Bug Reports**: Use GitHub issues with detailed reproduction steps
- 💡 **Feature Requests**: Propose new features with use cases and examples
- 🔧 **Pull Requests**: Follow TypeScript standards and include tests
- 📚 **Documentation**: Help improve docs and add real-world examples
- 🎯 **Meta-Frameworks**: Contribute new game-theoretic development protocols
- 🔧 **Orchestration**: Add new coordination strategies and patterns
- 🧬 **Synthesis**: Enhance pattern analysis and meta-learning capabilities

---

## 📄 **License**

MIT License - see [LICENSE](LICENSE) for details.

---

## 🎉 **Acknowledgments**

- **Anthropic**: For Claude AI that powers our intelligent agents
- **TypeScript Team**: For the excellent type system and tooling
- **Node.js Community**: For the robust runtime environment
- **MCP Protocol**: For standardized AI tool integration
- **Game Theory Research**: For cognitive budget and tournament methodologies
- **Open Source Community**: For contributions and feedback

---

### **🚀 Ready to revolutionize your development workflow?**

```bash
npx @sethdouglasford/claude-flow@latest init --sparc
```

**Join developers building the future of AI-assisted development with game-theoretic protocols and advanced synthesis capabilities!**

---

**Built with ❤️ and TypeScript | Powered by Claude AI | Advanced Process Orchestration | Game-Theoretic Development** 