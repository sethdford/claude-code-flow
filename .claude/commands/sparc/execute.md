# SPARC Execute Command

## Usage
```bash
# Quick execution with auto-mode selection
claude-flow sparc "Your task description here"

# Explicit mode selection
claude-flow sparc coder "Build a REST API"
claude-flow sparc researcher "Research AI trends"
claude-flow sparc orchestrator "Coordinate complex project"
```

## Description
Direct SPARC execution with intelligent mode selection or explicit mode specification. This is the primary command for running SPARC operations.

## Mode Selection

### **Auto-Selection Keywords**
The system analyzes your task for keywords to select the best mode:

- **"code", "implement", "build", "create"** → coder
- **"research", "analyze", "study", "investigate"** → researcher  
- **"test", "validate", "verify", "check"** → tester
- **"design", "architecture", "plan", "structure"** → architect
- **"debug", "fix", "error", "issue"** → debugger
- **"review", "audit", "quality", "optimize"** → reviewer
- **"coordinate", "manage", "orchestrate"** → orchestrator
- **"document", "write", "explain"** → documenter

### **Available Modes**
- `orchestrator` - Multi-agent task orchestration (centralized, max 10 parallel)
- `swarm-coordinator` - Swarm coordination (hierarchical, unlimited parallel)
- `workflow-manager` - Workflow automation (standard, unlimited parallel)
- `batch-executor` - Parallel task execution (standard, unlimited parallel)
- `coder` - Code generation and implementation
- `architect` - System design and architecture
- `reviewer` - Code review and quality optimization
- `tdd` - Test-driven development
- `debugger` - Bug fixing and debugging
- `researcher` - Deep research and analysis
- `analyzer` - Code and data analysis
- `optimizer` - Performance optimization
- `tester` - Comprehensive testing
- `designer` - UI/UX design
- `innovator` - Creative problem solving
- `documenter` - Documentation generation
- `memory-manager` - Knowledge management

## Advanced Options

### **Batch Operations**
```bash
# Enable batch optimization
claude-flow sparc coder "Build multiple components" --batch

# Parallel execution
claude-flow sparc tester "Run test suite" --parallel
```

### **Memory Integration**
```bash
# Store results in memory
claude-flow sparc researcher "Market analysis" --memory-key "market_data"

# Use previous results
claude-flow sparc architect "Design system" --memory-dependency "market_data"
```

### **Coordination**
```bash
# Centralized coordination
claude-flow sparc orchestrator "Complex project" --coordination centralized

# Hierarchical coordination  
claude-flow sparc swarm-coordinator "Team management" --coordination hierarchical
```

## Usage Examples

### **Single Task Execution**
```bash
# Auto-mode selection
claude-flow sparc "Build a user authentication system"

# Explicit mode
claude-flow sparc coder "Implement JWT authentication"
```

### **Multi-Step Workflow**
```bash
# Step 1: Research
claude-flow sparc researcher "Best practices for user authentication"

# Step 2: Architecture
claude-flow sparc architect "Design authentication system architecture"

# Step 3: Implementation
claude-flow sparc coder "Implement the authentication system"

# Step 4: Testing
claude-flow sparc tester "Create comprehensive authentication tests"
```

### **Coordinated Development**
```bash
# Launch orchestrator for complex coordination
claude-flow sparc orchestrator "Coordinate development of e-commerce platform with authentication, payment processing, and inventory management"
```

## Integration Patterns

### **With Swarm Strategies**
```bash
# SPARC modes become specialized agents in swarm
claude-flow swarm "Build application" --strategy development
# Internally uses: sparc architect, sparc coder, sparc tester, etc.
```

### **With Meta-Frameworks**
```bash
# Apply game-theoretic protocols
claude-flow sparc coder "Implement feature" --meta-framework code-review-game
```

### **With Memory System**
```bash
# Cross-session persistence
claude-flow sparc researcher "Technology evaluation" --save-to-memory
claude-flow sparc architect "System design" --use-memory-context
```

## Best Practices

### **Mode Selection**
- Use **auto-selection** for general tasks
- Use **explicit modes** for specialized work
- Use **orchestrator** for complex multi-agent coordination
- Use **batch-executor** for high-throughput parallel processing

### **Memory Usage**
- Store research findings for reuse across sessions
- Use memory dependencies for workflow coordination
- Clean up temporary memory after task completion

### **Performance**
- Enable batch operations for file-intensive tasks
- Use parallel execution for independent operations
- Monitor resource usage during intensive operations

### **Error Handling**
- Start with simpler modes before complex orchestration
- Use verbose logging for debugging
- Implement proper error recovery mechanisms 