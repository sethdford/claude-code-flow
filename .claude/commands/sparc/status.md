# SPARC Status Command

## Usage
```bash
# Check all running SPARC tasks
claude-flow sparc status

# Check specific mode status
claude-flow sparc status --mode orchestrator

# Check task by ID
claude-flow sparc status --task-id sparc_task_123
```

## Description
Monitor and check the status of running SPARC tasks, including progress, resource usage, and coordination state.

## Status Information

### **Task Status Overview**
- **Active Tasks**: Currently running SPARC operations
- **Completed Tasks**: Recently finished operations with results
- **Failed Tasks**: Operations that encountered errors
- **Queued Tasks**: Tasks waiting for execution

### **Mode-Specific Status**
- **orchestrator**: Active agents, coordination state, task distribution
- **swarm-coordinator**: Swarm size, load balancing, agent health
- **batch-executor**: Parallel tasks, throughput metrics, resource usage
- **coder**: Files being processed, compilation status, test results

### **Resource Monitoring**
- **Memory Usage**: Current memory consumption and limits
- **CPU Usage**: Processing load and optimization metrics
- **I/O Operations**: File operations, network requests, database queries
- **Agent Count**: Active agents per mode and coordination overhead

## Status Display Format

### **Summary View**
```
🎯 SPARC Status Summary
──────────────────────
📊 Active Tasks: 3
✅ Completed: 12
❌ Failed: 1
⏳ Queued: 2

🤖 Active Modes:
├─ orchestrator: 1 task (3 agents)
├─ coder: 2 tasks (batch mode)
└─ researcher: 1 task (web search)

💾 Memory Usage: 245MB / 1GB
⚡ CPU Load: 65%
```

### **Detailed Task View**
```
📋 Task: sparc_task_123
Mode: orchestrator
Status: running
Started: 2 minutes ago
Progress: 60% (3/5 subtasks complete)
Agents: 3 active
Memory: 89MB
Next: Waiting for analysis completion

Subtasks:
├─ ✅ Research phase (researcher mode)
├─ ✅ Architecture design (architect mode)  
├─ 🔄 Implementation (coder mode, 70% complete)
├─ ⏳ Testing (tester mode, queued)
└─ ⏳ Documentation (documenter mode, queued)
```

## Monitoring Features

### **Real-Time Updates**
```bash
# Watch mode for continuous updates
claude-flow sparc status --watch

# Refresh interval
claude-flow sparc status --watch --interval 5s
```

### **Filtering Options**
```bash
# Show only active tasks
claude-flow sparc status --active-only

# Show specific priority
claude-flow sparc status --priority high

# Show tasks from last hour
claude-flow sparc status --since 1h
```

### **Export Options**
```bash
# Export to JSON
claude-flow sparc status --format json --output status.json

# Export to CSV for analysis
claude-flow sparc status --format csv --output tasks.csv
```

## Troubleshooting Information

### **Common Status Indicators**
- **🔄 Running**: Task is actively executing
- **⏳ Queued**: Task is waiting for resources or dependencies
- **✅ Completed**: Task finished successfully
- **❌ Failed**: Task encountered an error
- **⏸️ Paused**: Task is temporarily suspended
- **🔁 Retrying**: Task is being retried after failure

### **Error Details**
```bash
# Show detailed error information
claude-flow sparc status --errors --verbose

# Show logs for specific task
claude-flow sparc status --task-id sparc_task_123 --logs
```

### **Performance Metrics**
```bash
# Show performance statistics
claude-flow sparc status --metrics

# Show resource usage trends
claude-flow sparc status --metrics --trend 1h
```

## Integration with Other Commands

### **Task Management**
```bash
# Cancel running task
claude-flow sparc cancel --task-id sparc_task_123

# Pause/resume task
claude-flow sparc pause --task-id sparc_task_123
claude-flow sparc resume --task-id sparc_task_123

# Retry failed task
claude-flow sparc retry --task-id sparc_task_123
```

### **Memory Status**
```bash
# Check memory usage by SPARC tasks
claude-flow sparc status --memory-details

# Show memory coordination between modes
claude-flow sparc status --memory-coordination
```

### **Agent Coordination**
```bash
# Show agent communication patterns
claude-flow sparc status --agent-communication

# Show coordination efficiency
claude-flow sparc status --coordination-metrics
```

## Automation and Alerts

### **Status Checks**
```bash
# Health check for all SPARC operations
claude-flow sparc status --health-check

# Check if system is ready for new tasks
claude-flow sparc status --capacity-check
```

### **Alert Conditions**
- **High Memory Usage**: > 80% of available memory
- **Long Running Tasks**: > 30 minutes without progress
- **Failed Coordination**: Agent communication failures
- **Resource Exhaustion**: CPU or I/O limits reached

### **Status API**
```bash
# JSON API for integration
curl http://localhost:3000/api/sparc/status

# WebSocket for real-time updates
ws://localhost:3000/ws/sparc/status
```

## Best Practices

### **Regular Monitoring**
- Check status before starting new complex tasks
- Monitor resource usage during intensive operations
- Review failed tasks for pattern analysis
- Clean up completed tasks periodically

### **Performance Optimization**
- Use status metrics to optimize task distribution
- Monitor memory usage for efficient coordination
- Track agent utilization for load balancing
- Analyze completion times for workflow optimization

### **Troubleshooting**
- Check status immediately when tasks seem stuck
- Use verbose mode for detailed error analysis
- Monitor coordination patterns for efficiency
- Review logs for recurring issues 