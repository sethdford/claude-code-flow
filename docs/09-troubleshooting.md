# Troubleshooting Guide

This comprehensive troubleshooting guide covers common issues, diagnostic procedures, and solutions for Claude-Flow system problems. Use this guide to quickly identify and resolve issues in your Claude-Flow deployment.

## Common Installation and Setup Issues

### Installation Problems

**Issue: Command not found after installation**
```bash
# Diagnosis
which claude-flow
echo $PATH
npm list -g claude-flow

# Solutions
# For NPM global installation
npm install -g claude-flow
npm bin -g  # Check global bin directory

# For Deno installation
deno info claude-flow
export PATH="$HOME/.deno/bin:$PATH"
echo 'export PATH="$HOME/.deno/bin:$PATH"' >> ~/.bashrc

# Verify installation
claude-flow --version
claude-flow help
```

**Issue: Permission denied errors**
```bash
# Diagnosis
ls -la $(which claude-flow)
id
groups

# Solutions
# Fix executable permissions
chmod +x $(which claude-flow)

# For NPM permission issues
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH

# Use sudo for global installation (not recommended)
sudo npm install -g claude-flow

# Alternative: Use npx without global installation
npx claude-flow --version
```

**Issue: Deno compilation failures**
```bash
# Diagnosis
deno --version
deno check src/cli/index.ts
deno info

# Solutions
# Update Deno to latest version
curl -fsSL https://deno.land/x/install/install.sh | sh

# Clear Deno cache
deno cache --reload src/cli/index.ts

# Manual compilation
deno compile --allow-all --output bin/claude-flow src/cli/index.ts

# Check dependencies
deno info src/cli/index.ts
```

### Configuration Issues

**Issue: Configuration file not found or invalid**
```bash
# Diagnosis
claude-flow config show
ls -la claude-flow.config.json
claude-flow config validate

# Solutions
# Initialize default configuration
claude-flow config init

# Validate existing configuration
claude-flow config validate --fix-issues

# Use custom configuration path
claude-flow --config /path/to/config.json start

# Reset to defaults
claude-flow config init --force --backup-existing
```

**Issue: Environment variable conflicts**
```bash
# Diagnosis
env | grep CLAUDE_FLOW
printenv | grep -i claude

# Solutions
# Clear conflicting environment variables
unset CLAUDE_FLOW_CONFIG
unset CLAUDE_FLOW_DEBUG

# Set proper environment variables
export CLAUDE_FLOW_CONFIG_PATH=/path/to/config.json
export CLAUDE_FLOW_LOG_LEVEL=debug

# Verify environment
claude-flow config show --include-env
```

## Agent Management Issues

### Agent Spawning Problems

**Issue: Agents fail to spawn**
```bash
# Diagnosis
claude-flow agent list --all
claude-flow system resources
claude-flow logs --component orchestrator --level error

# Check system limits
ulimit -a
free -h
df -h

# Solutions
# Increase resource limits
claude-flow config set orchestrator.maxConcurrentAgents 5
claude-flow config set memory.cacheSizeMB 256

# Clear stuck agent processes
claude-flow agent cleanup --force
claude-flow system reset --soft

# Check for resource constraints
claude-flow system optimize --free-memory
```

**Issue: Agent communication failures**
```bash
# Diagnosis
claude-flow agent health --all
claude-flow network diagnose
claude-flow coordination queue status

# Solutions
# Restart coordination manager
claude-flow coordination restart

# Clear message queues
claude-flow coordination queue clear --confirm

# Reset agent communication
claude-flow agent reset-communication --all

# Check network connectivity
claude-flow network test --internal --external
```

**Issue: Agents consuming excessive resources**
```bash
# Diagnosis
claude-flow agent resources --top 10
claude-flow agent monitor <agent-id> --metrics memory,cpu
top -p $(pgrep -f claude-flow)

# Solutions
# Set resource limits
claude-flow agent update <agent-id> --memory-limit 1GB --cpu-limit 2

# Enable agent recycling
claude-flow config set orchestrator.agentRecycling true
claude-flow config set orchestrator.recycleThreshold 100

# Restart resource-heavy agents
claude-flow agent restart <agent-id> --graceful
```

### Agent Performance Issues

**Issue: Agents responding slowly**
```bash
# Diagnosis
claude-flow agent performance-analysis --all
claude-flow task queue-analysis
claude-flow system performance --detailed

# Solutions
# Optimize task distribution
claude-flow task rebalance --strategy performance
claude-flow coordination optimize

# Increase parallelism
claude-flow config set coordination.maxConcurrentTasks 10

# Clear performance bottlenecks
claude-flow performance optimize --focus agents
```

## Task Coordination Problems

### Task Queue Issues

**Issue: Tasks stuck in pending state**
```bash
# Diagnosis
claude-flow task list --status pending --detailed
claude-flow coordination deadlock-check
claude-flow task dependencies --check-cycles

# Solutions
# Resolve deadlocks automatically
claude-flow coordination deadlock-resolve --auto

# Manual task intervention
claude-flow task force-assign <task-id> --agent <agent-id>
claude-flow task clear-dependencies <task-id> --unsafe

# Reset task queue
claude-flow coordination queue reset --type pending --backup
```

**Issue: Task execution timeouts**
```bash
# Diagnosis
claude-flow task logs <task-id> --tail 100
claude-flow agent info <agent-id> --current-task
claude-flow coordination timeout-analysis

# Solutions
# Increase timeouts
claude-flow config set coordination.resourceTimeout 300000
claude-flow task update <task-id> --timeout 600s

# Optimize task execution
claude-flow task optimize <task-id> --strategy speed
claude-flow task split <task-id> --subtasks 3

# Force task completion
claude-flow task force-complete <task-id> --with-partial-results
```

**Issue: Dependency resolution failures**
```bash
# Diagnosis
claude-flow task dependencies <task-id> --validate
claude-flow task dependency-graph --check-cycles
claude-flow coordination dependency-analysis

# Solutions
# Fix circular dependencies
claude-flow task fix-dependencies <task-id> --break-cycles

# Manual dependency override
claude-flow task clear-dependencies <task-id> --selective
claude-flow task add-dependency <task-id> --depends-on <other-task-id>

# Reset dependency graph
claude-flow coordination reset-dependencies --rebuild
```

### Workflow Execution Issues

**Issue: Workflows failing to start**
```bash
# Diagnosis
claude-flow task workflow validate <workflow-file>
claude-flow task workflow simulate <workflow-file> --dry-run
claude-flow coordination workflow-analysis

# Solutions
# Fix workflow definition
claude-flow task workflow fix <workflow-file> --auto-correct
claude-flow task workflow validate <workflow-file> --strict

# Manual workflow execution
claude-flow task workflow execute <workflow-file> --force --ignore-warnings

# Workflow debugging
claude-flow task workflow debug <workflow-id> --step-by-step
```

## Memory System Issues

### Memory Synchronization Problems

**Issue: Memory conflicts between agents**
```bash
# Diagnosis
claude-flow memory conflicts --check-all
claude-flow memory integrity-check --detailed
claude-flow memory sync-status

# Solutions
# Resolve conflicts automatically
claude-flow memory resolve-conflicts --strategy crdt
claude-flow memory rebuild-index --force

# Manual conflict resolution
claude-flow memory conflicts list --unresolved
claude-flow memory resolve-conflict <conflict-id> --manual

# Reset memory synchronization
claude-flow memory sync-reset --full-rebuild
```

**Issue: Memory usage growing unchecked**
```bash
# Diagnosis
claude-flow memory stats --detailed --breakdown
claude-flow memory analyze --size-distribution
du -sh ~/.claude-flow/memory/*

# Solutions
# Immediate cleanup
claude-flow memory cleanup --aggressive
claude-flow memory compact --force

# Configure retention
claude-flow config set memory.retentionDays 14
claude-flow config set memory.compressionEnabled true

# Archive old data
claude-flow memory archive --older-than 30d --compress
```

**Issue: Memory corruption or data loss**
```bash
# Diagnosis
claude-flow memory integrity-check --full
claude-flow memory validate --all-entries
claude-flow memory backup-status

# Solutions
# Restore from backup
claude-flow memory restore --backup latest --verify
claude-flow memory rebuild-from-logs --since last-good-backup

# Repair corrupted data
claude-flow memory repair --fix-corruption --backup-first
claude-flow memory rebuild-index --verify-integrity

# Emergency data recovery
claude-flow memory emergency-recovery --from-fragments
```

### Memory Performance Issues

**Issue: Slow memory operations**
```bash
# Diagnosis
claude-flow memory performance-analysis
claude-flow memory cache-analysis
claude-flow memory index-analysis

# Solutions
# Optimize cache settings
claude-flow config set memory.cacheSizeMB 512
claude-flow memory cache-optimize --preload frequently-accessed

# Rebuild indexes
claude-flow memory rebuild-indexes --parallel
claude-flow memory optimize-queries --create-missing-indexes

# Database optimization
claude-flow memory vacuum --full
claude-flow memory analyze-statistics
```

## Terminal Management Issues

### Terminal Session Problems

**Issue: Terminal sessions not starting**
```bash
# Diagnosis
claude-flow terminal pool status
claude-flow terminal diagnose --all
claude-flow system check --terminal

# Solutions
# Reset terminal pool
claude-flow terminal pool reset --force
claude-flow terminal pool initialize --rebuild

# Check shell availability
which bash zsh sh
echo $SHELL

# Fix terminal configuration
claude-flow config set terminal.type auto
claude-flow config set terminal.shellPreference '["bash","zsh","sh"]'
```

**Issue: Commands hanging or timing out**
```bash
# Diagnosis
claude-flow terminal logs <session-id> --tail 50
claude-flow terminal performance <session-id>
ps aux | grep claude-flow

# Solutions
# Increase command timeout
claude-flow config set terminal.commandTimeout 600000

# Kill hanging processes
claude-flow terminal kill-hanging --force
pkill -f "claude-flow.*terminal"

# Restart terminal session
claude-flow terminal restart <session-id> --clean-state
```

**Issue: Terminal pool exhaustion**
```bash
# Diagnosis
claude-flow terminal pool stats --utilization
claude-flow terminal list --status all
claude-flow system resources --terminals

# Solutions
# Increase pool size
claude-flow config set terminal.poolSize 20

# Clean up idle sessions
claude-flow terminal cleanup --idle-timeout 30m
claude-flow terminal pool recycle --force

# Optimize session reuse
claude-flow config set terminal.recycleAfter 50
```

### Multi-Terminal Coordination Issues

**Issue: Multi-terminal workflows failing**
```bash
# Diagnosis
claude-flow terminal multi-status <workflow-name>
claude-flow terminal dependency-check <workflow-name>
claude-flow terminal logs-aggregate <workflow-name>

# Solutions
# Fix dependency issues
claude-flow terminal multi-fix-dependencies <workflow-name>
claude-flow terminal restart-failed <workflow-name>

# Manual workflow recovery
claude-flow terminal multi-recover <workflow-name> --from-checkpoint
claude-flow terminal multi-restart <workflow-name> --selective

# Simplify workflow
claude-flow terminal multi-optimize <workflow-name> --reduce-dependencies
```

## MCP Integration Issues

### MCP Server Problems

**Issue: MCP server not starting**
```bash
# Diagnosis
claude-flow mcp status --detailed
claude-flow mcp logs --tail 100
netstat -tulpn | grep 3000

# Solutions
# Change MCP port
claude-flow config set mcp.port 3001
claude-flow mcp restart

# Fix port conflicts
lsof -i :3000
kill -9 $(lsof -t -i:3000)

# Validate MCP configuration
claude-flow mcp validate-config --fix-issues
```

**Issue: Tools not responding or timing out**
```bash
# Diagnosis
claude-flow mcp tools list --health
claude-flow mcp tools test <tool-name> --verbose
claude-flow mcp monitor --tools all

# Solutions
# Restart MCP tools
claude-flow mcp tools restart <tool-name>
claude-flow mcp tools refresh-registry

# Increase timeouts
claude-flow config set mcp.requestTimeout 60000

# Tool debugging
claude-flow mcp tools debug <tool-name> --trace
```

**Issue: Tool authentication failures**
```bash
# Diagnosis
claude-flow mcp auth status
claude-flow mcp tools permissions check <tool-name>
claude-flow mcp audit --auth-failures

# Solutions
# Regenerate tokens
claude-flow mcp auth regenerate-tokens --all
claude-flow mcp auth refresh-permissions

# Fix permission issues
claude-flow mcp permissions repair <tool-name>
claude-flow mcp auth validate --fix-invalid

# Reset authentication
claude-flow mcp auth reset --confirm
```

### Tool Integration Issues

**Issue: Custom tools not loading**
```bash
# Diagnosis
claude-flow mcp tools validate <tool-path>
claude-flow mcp tools registry status
ls -la /path/to/tools/

# Solutions
# Reinstall tools
claude-flow mcp tools reinstall <tool-name>
claude-flow mcp tools register --force <tool-path>

# Fix tool permissions
chmod +x /path/to/tools/*
claude-flow mcp tools fix-permissions --all

# Rebuild tool registry
claude-flow mcp tools rebuild-registry
```

## Network and Connectivity Issues

### Network Diagnostics

**Issue: Network connectivity problems**
```bash
# Diagnosis
claude-flow network test --comprehensive
ping -c 4 8.8.8.8
curl -I https://api.github.com

# Solutions
# Configure proxy settings
claude-flow config set network.proxy "http://proxy.company.com:8080"
export HTTP_PROXY=http://proxy.company.com:8080
export HTTPS_PROXY=http://proxy.company.com:8080

# DNS resolution issues
echo "nameserver 8.8.8.8" | sudo tee -a /etc/resolv.conf
systemctl restart systemd-resolved

# Firewall issues
sudo ufw allow 3000/tcp
sudo iptables -A INPUT -p tcp --dport 3000 -j ACCEPT
```

**Issue: SSL/TLS certificate problems**
```bash
# Diagnosis
openssl s_client -connect api.example.com:443
curl -v https://api.example.com

# Solutions
# Update CA certificates
sudo apt-get update && sudo apt-get install ca-certificates
sudo update-ca-certificates

# Disable SSL verification (development only)
claude-flow config set network.verifySSL false
export NODE_TLS_REJECT_UNAUTHORIZED=0

# Custom certificate handling
claude-flow config set network.customCA "/path/to/ca-cert.pem"
```

## Performance and Resource Issues

### System Performance Problems

**Issue: High CPU or memory usage**
```bash
# Diagnosis
claude-flow system resources --detailed
top -p $(pgrep -f claude-flow)
htop

# Solutions
# Optimize performance settings
claude-flow performance optimize --profile production
claude-flow config set orchestrator.resourceAllocationStrategy memory-optimized

# Limit resource usage
claude-flow config set orchestrator.maxConcurrentAgents 5
claude-flow config set memory.cacheSizeMB 128

# Enable resource monitoring
claude-flow monitoring enable --alerts true
```

**Issue: Slow response times**
```bash
# Diagnosis
claude-flow performance analyze --duration 5m
claude-flow benchmark --comprehensive
claude-flow bottleneck-analysis

# Solutions
# Performance tuning
claude-flow performance tune --aggressive
claude-flow cache optimize --preload

# Parallel processing optimization
claude-flow config set coordination.maxConcurrentTasks 8
claude-flow config set terminal.maxConcurrentCommands 10

# Database optimization
claude-flow memory optimize --rebuild-indexes
```

### Resource Exhaustion

**Issue: Out of memory errors**
```bash
# Diagnosis
free -h
claude-flow memory usage --breakdown
dmesg | grep -i "out of memory"

# Solutions
# Free memory immediately
claude-flow memory cleanup --emergency
claude-flow cache clear --all

# Increase swap space
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Optimize memory settings
claude-flow config set memory.cacheSizeMB 64
claude-flow config set orchestrator.maxConcurrentAgents 3
```

**Issue: Disk space exhaustion**
```bash
# Diagnosis
df -h
du -sh ~/.claude-flow/*
claude-flow disk-usage --analyze

# Solutions
# Clean up immediately
claude-flow cleanup --aggressive --logs --cache --temp
claude-flow memory archive --compress --older-than 7d

# Configure retention policies
claude-flow config set logging.maxFileSize "5MB"
claude-flow config set logging.maxFiles 3
claude-flow config set memory.retentionDays 7

# Move data to larger disk
claude-flow migrate --data-directory /mnt/large-disk/claude-flow
```

## Debugging and Diagnostic Tools

### System Diagnostics

**Comprehensive System Check:**
```bash
# Full system diagnostic
claude-flow diagnose --comprehensive --output diagnostic-report.json

# Component-specific diagnostics
claude-flow diagnose --component orchestrator --verbose
claude-flow diagnose --component memory --include-performance
claude-flow diagnose --component terminal --check-compatibility
claude-flow diagnose --component mcp --test-tools
```

**Performance Diagnostics:**
```bash
# Performance profiling
claude-flow profile --duration 10m --output performance-profile.json
claude-flow benchmark --save-baseline baseline-$(date +%Y%m%d).json

# Resource monitoring
claude-flow monitor --real-time --all-components
claude-flow resources --continuous --alert-thresholds "cpu:80,memory:90"
```

### Log Analysis

**Centralized Log Analysis:**
```bash
# View all system logs
claude-flow logs --all-components --since 1h
claude-flow logs --level error --grep "failed\|timeout\|error"

# Export logs for analysis
claude-flow logs export --format json --output logs-$(date +%Y%m%d).json
claude-flow logs aggregate --time-range 24h --analysis true

# Search and filter logs
claude-flow logs search "memory" --component orchestrator --time-range 6h
claude-flow logs pattern-analysis --detect-anomalies
```

### Debug Information Collection

**Collecting Debug Information:**
```bash
# Generate comprehensive debug package
claude-flow debug-info collect \
  --include-system \
  --include-logs \
  --include-configs \
  --include-performance \
  --output debug-package-$(date +%Y%m%d).tar.gz

# Privacy-safe debug collection
claude-flow debug-info collect \
  --sanitize-sensitive \
  --exclude-data \
  --include-structure-only \
  --output safe-debug-package.tar.gz
```

## Recovery Procedures

### Emergency Recovery

**System Recovery Procedures:**
```bash
# Safe mode startup
claude-flow start --safe-mode --minimal-agents --read-only-memory

# System reset (soft)
claude-flow reset --soft --backup-data --preserve-config

# System reset (hard) - use with caution
claude-flow reset --hard --confirm --backup-location /tmp/claude-flow-backup

# Restore from backup
claude-flow restore --backup claude-flow-backup-20241215.tar.gz --verify
```

**Data Recovery:**
```bash
# Memory data recovery
claude-flow memory recover --from-logs --since last-backup
claude-flow memory rebuild --verify-integrity

# Configuration recovery
claude-flow config restore --from-backup --merge-with-current
claude-flow config repair --fix-corruption

# Emergency data export
claude-flow export --emergency --all-data --output emergency-export.json
```

## Getting Additional Help

### Built-in Help and Documentation

**Interactive Help:**
```bash
# General help
claude-flow help
claude-flow <command> --help

# Interactive troubleshooting wizard
claude-flow troubleshoot --interactive --guided

# Self-diagnostic with auto-fix
claude-flow self-check --fix-issues --report-problems
```

### Support Resources

**Community Support:**
- **GitHub Issues**: https://github.com/sethdford/vibex-claude-code-flow/issues
- **Discussions**: https://github.com/sethdford/vibex-claude-code-flow/discussions
- **Original Project**: https://github.com/ruvnet/claude-code-flow (by @ruvnet)
- **Discord Community**: https://discord.gg/claude-flow

**Professional Support:**
- **Enterprise Support**: support@claude-flow.dev
- **Consulting Services**: consulting@claude-flow.dev
- **Training Programs**: training@claude-flow.dev

### Reporting Issues

**Issue Reporting:**
```bash
# Generate issue report
claude-flow report-issue \
  --title "Agent communication failures" \
  --description "Detailed problem description" \
  --include-diagnostics \
  --include-logs \
  --output issue-report.json

# Submit to GitHub (requires gh CLI)
gh issue create \
  --title "Claude-Flow Issue Report" \
  --body-file issue-report.json \
  --label "bug,needs-triage"
```

**Best Practices for Issue Reporting:**
1. Include Claude-Flow version: `claude-flow --version`
2. Provide system information: `claude-flow system-info`
3. Include relevant logs and error messages
4. Describe steps to reproduce the issue
5. Mention any recent configuration changes
6. Include diagnostic output when possible

This troubleshooting guide should help resolve most common issues with Claude-Flow. For persistent problems, don't hesitate to reach out to the community or professional support channels.