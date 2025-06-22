# Swarm Strategies Overview

## Available Strategies

### 🎯 auto (60 min, hybrid mode)
**Automatically determines the best approach based on objective analysis**
- Intelligent objective classification
- Dynamic strategy selection
- Adaptive task decomposition
- Best for: General purpose tasks, unknown requirements, experimental objectives

### 🔍 research (90 min, distributed mode)  
**Multi-agent research coordination with distributed intelligence gathering**
- Parallel web search and data collection
- Source credibility analysis and validation
- Cross-domain knowledge synthesis
- Best for: Information gathering, market research, technology evaluation

### 💻 development (330 min, hierarchical mode)
**Coordinated software development with meta-frameworks**
- Feature Discovery with cognitive explorers
- Virgil Protocol for architecture design (3% innovation rule)
- MCP Orchestration for parallel development
- Code Review Game with specialized reviewers
- Best for: Software applications, system architecture, API creation

### 📊 analysis (240 min, mesh mode)
**Advanced data analysis with meta-learning and pattern synthesis**
- Meta-Learning DGM for pattern discovery
- Pattern Synthesizer for cross-domain analysis
- Knowledge graph construction and reasoning
- Best for: Data analysis, pattern recognition, business intelligence

### 🧪 testing (120 min, mesh mode)
**Comprehensive testing coordination with distributed validation**
- Test-driven development methodology
- Parallel test execution across multiple agents
- Performance and security testing
- Best for: Test suite development, quality assurance, CI/CD integration

### ⚡ optimization (180 min, hybrid mode)
**Performance optimization with systematic profiling**
- Systematic performance profiling
- Bottleneck identification and analysis
- Multi-dimensional optimization approaches
- Best for: Performance tuning, efficiency improvements, scalability

### 🔧 maintenance (150 min, centralized mode)
**System maintenance and updates with health monitoring**
- Comprehensive system health checks
- Strategic update planning and coordination
- Risk assessment and mitigation
- Best for: System updates, dependency management, technical debt

## Strategy Selection Guide

### By Objective Type
- **"Build/Create/Develop"** → development
- **"Research/Analyze/Study"** → research  
- **"Test/Validate/Verify"** → testing
- **"Optimize/Improve/Enhance"** → optimization
- **"Update/Maintain/Fix"** → maintenance
- **"Understand/Explore/Learn"** → analysis
- **"Not sure/General task"** → auto

### By Duration Needs
- **Quick (60-90 min)**: auto, research
- **Medium (120-180 min)**: testing, optimization, maintenance
- **Long (240-330 min)**: analysis, development

### By Coordination Style
- **Centralized**: maintenance (controlled updates)
- **Distributed**: research (parallel information gathering)
- **Hierarchical**: development (structured workflows)
- **Mesh**: testing, analysis (peer-to-peer collaboration)
- **Hybrid**: auto, optimization (adaptive approaches)

## Usage Examples
```bash
# Let system choose best strategy
claude-flow swarm "Build a web app" --strategy auto

# Specific strategy selection
claude-flow swarm "Research AI trends" --strategy research --max-agents 6
claude-flow swarm "Optimize database" --strategy optimization --monitor
claude-flow swarm "Create test suite" --strategy testing --parallel
``` 