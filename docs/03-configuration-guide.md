# Configuration Guide

Claude-Flow uses a comprehensive configuration system that allows fine-tuning of all system components. This guide covers all configuration options, examples, and best practices.

## Configuration File Structure

The main configuration file is `claude-flow.config.json`, located in your project root or specified via the `--config` flag.

### Default Configuration

```json
{
  "orchestrator": {
    "maxConcurrentAgents": 10,
    "taskQueueSize": 100,
    "healthCheckInterval": 30000,
    "shutdownTimeout": 30000,
    "agentTimeoutMs": 300000,
    "resourceAllocationStrategy": "balanced"
  },
  "terminal": {
    "type": "auto",
    "poolSize": 5,
    "recycleAfter": 10,
    "healthCheckInterval": 60000,
    "commandTimeout": 300000,
    "maxConcurrentCommands": 3,
    "shellPreference": ["bash", "zsh", "sh"]
  },
  "memory": {
    "backend": "hybrid",
    "cacheSizeMB": 100,
    "syncInterval": 5000,
    "conflictResolution": "crdt",
    "retentionDays": 30,
    "compressionEnabled": true,
    "encryptionEnabled": false
  },
  "coordination": {
    "maxRetries": 3,
    "retryDelay": 1000,
    "deadlockDetection": true,
    "resourceTimeout": 60000,
    "messageTimeout": 30000,
    "priorityLevels": 5,
    "loadBalancingStrategy": "round-robin"
  },
  "mcp": {
    "transport": "stdio",
    "port": 3000,
    "tlsEnabled": false,
    "allowedTools": ["*"],
    "maxRequestSize": "10MB",
    "requestTimeout": 30000
  },
  "logging": {
    "level": "info",
    "format": "json",
    "destination": "console",
    "fileOutput": "logs/claude-flow.log",
    "maxFileSize": "10MB",
    "maxFiles": 5
  }
}
```

## Configuration Sections

### Orchestrator Configuration

Controls the main orchestration system and agent management.

```json
{
  "orchestrator": {
    "maxConcurrentAgents": 10,
    "taskQueueSize": 100,
    "healthCheckInterval": 30000,
    "shutdownTimeout": 30000,
    "agentTimeoutMs": 300000,
    "resourceAllocationStrategy": "balanced",
    "agentRecycling": {
      "enabled": true,
      "maxAge": "2h",
      "maxTasks": 50
    },
    "failover": {
      "enabled": true,
      "detectionThreshold": 10000,
      "recoveryStrategy": "restart"
    }
  }
}
```

**Configuration Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxConcurrentAgents` | number | 10 | Maximum number of agents that can run simultaneously |
| `taskQueueSize` | number | 100 | Maximum number of tasks in the queue |
| `healthCheckInterval` | number | 30000 | Health check frequency in milliseconds |
| `shutdownTimeout` | number | 30000 | Grace period for clean shutdown in milliseconds |
| `agentTimeoutMs` | number | 300000 | Maximum time an agent can run a single task |
| `resourceAllocationStrategy` | string | "balanced" | Resource allocation strategy: `balanced`, `performance`, `memory-optimized` |

**Resource Allocation Strategies:**

- **balanced**: Optimal balance between performance and resource usage
- **performance**: Maximize performance, higher resource usage
- **memory-optimized**: Minimize memory usage, may impact performance

### Terminal Configuration

Manages terminal sessions and command execution.

```json
{
  "terminal": {
    "type": "auto",
    "poolSize": 5,
    "recycleAfter": 10,
    "healthCheckInterval": 60000,
    "commandTimeout": 300000,
    "maxConcurrentCommands": 3,
    "shellPreference": ["bash", "zsh", "sh"],
    "environment": {
      "PATH": "/usr/local/bin:/usr/bin:/bin",
      "LANG": "en_US.UTF-8"
    },
    "security": {
      "allowedCommands": ["*"],
      "blockedCommands": ["rm -rf /", "sudo rm", "format"],
      "sandboxed": false
    }
  }
}
```

**Terminal Types:**

- **auto**: Automatically detect best terminal type
- **integrated**: Use IDE integrated terminals (VS Code, etc.)
- **external**: Use external terminal applications
- **headless**: Use headless terminal sessions

**Security Configuration:**
```json
{
  "security": {
    "allowedCommands": [
      "npm.*",
      "git.*",
      "python.*",
      "node.*"
    ],
    "blockedCommands": [
      "rm -rf /",
      "sudo rm",
      "format.*",
      "del /s /q"
    ],
    "sandboxed": true,
    "maxExecutionTime": 600000
  }
}
```

### Memory Configuration

Controls the memory management system and storage.

```json
{
  "memory": {
    "backend": "hybrid",
    "cacheSizeMB": 100,
    "syncInterval": 5000,
    "conflictResolution": "crdt",
    "retentionDays": 30,
    "compressionEnabled": true,
    "encryptionEnabled": false,
    "backup": {
      "enabled": true,
      "interval": "6h",
      "location": "./backups",
      "maxBackups": 10
    },
    "optimization": {
      "autoCleanup": true,
      "cleanupThreshold": "1GB",
      "indexRebuildInterval": "24h"
    }
  }
}
```

**Backend Options:**

- **sqlite**: Pure SQLite backend for structured data
- **markdown**: Markdown files for documentation and human-readable content
- **hybrid**: Combines SQLite and Markdown (recommended)

**Conflict Resolution Strategies:**

- **crdt**: Conflict-free Replicated Data Types (recommended)
- **last-write-wins**: Simple last write wins
- **manual**: Manual conflict resolution required

**Encryption Options:**
```json
{
  "encryption": {
    "enabled": true,
    "algorithm": "AES-256-GCM",
    "keyRotation": "weekly",
    "keyStorage": "environment"
  }
}
```

### Coordination Configuration

Manages task coordination and agent communication.

```json
{
  "coordination": {
    "maxRetries": 3,
    "retryDelay": 1000,
    "deadlockDetection": true,
    "resourceTimeout": 60000,
    "messageTimeout": 30000,
    "priorityLevels": 5,
    "loadBalancingStrategy": "round-robin",
    "scheduling": {
      "algorithm": "priority-queue",
      "fairness": true,
      "starvationPrevention": true
    },
    "communication": {
      "protocol": "async",
      "bufferSize": 1000,
      "compression": true
    }
  }
}
```

**Load Balancing Strategies:**

- **round-robin**: Distribute tasks evenly across agents
- **weighted**: Distribute based on agent capabilities
- **adaptive**: Dynamically adjust based on performance
- **random**: Random distribution

**Scheduling Algorithms:**

- **priority-queue**: Priority-based task scheduling
- **fifo**: First-in-first-out
- **shortest-job-first**: Prioritize tasks with shortest estimated duration
- **deadline-aware**: Consider task deadlines

### MCP Configuration

Model Context Protocol server settings.

```json
{
  "mcp": {
    "transport": "stdio",
    "port": 3000,
    "host": "localhost",
    "tlsEnabled": false,
    "allowedTools": ["*"],
    "maxRequestSize": "10MB",
    "requestTimeout": 30000,
    "authentication": {
      "enabled": true,
      "method": "token",
      "tokenExpiry": "24h"
    },
    "rateLimiting": {
      "enabled": true,
      "requestsPerMinute": 100,
      "burstSize": 20
    }
  }
}
```

**Transport Options:**

- **stdio**: Standard input/output (default, fastest)
- **http**: HTTP REST API
- **websocket**: WebSocket for real-time communication

**Security Configuration:**
```json
{
  "security": {
    "tls": {
      "enabled": true,
      "certFile": "/path/to/cert.pem",
      "keyFile": "/path/to/key.pem"
    },
    "cors": {
      "enabled": true,
      "origins": ["http://localhost:3000"],
      "methods": ["GET", "POST"]
    }
  }
}
```

### Logging Configuration

Controls system logging and audit trails.

```json
{
  "logging": {
    "level": "info",
    "format": "json",
    "destination": "console",
    "fileOutput": "logs/claude-flow.log",
    "maxFileSize": "10MB",
    "maxFiles": 5,
    "components": {
      "orchestrator": "debug",
      "memory": "info",
      "terminal": "warn",
      "mcp": "info"
    },
    "audit": {
      "enabled": true,
      "includePayloads": false,
      "retention": "90d"
    }
  }
}
```

**Log Levels:**

- **debug**: Detailed debugging information
- **info**: General information messages
- **warn**: Warning messages
- **error**: Error messages only

## Environment-Specific Configurations

### Development Configuration

Optimized for development and debugging:

```json
{
  "orchestrator": {
    "maxConcurrentAgents": 3,
    "healthCheckInterval": 10000
  },
  "terminal": {
    "poolSize": 2,
    "commandTimeout": 60000
  },
  "memory": {
    "syncInterval": 1000,
    "retentionDays": 7
  },
  "logging": {
    "level": "debug",
    "destination": "console"
  }
}
```

### Production Configuration

Optimized for production environments:

```json
{
  "orchestrator": {
    "maxConcurrentAgents": 50,
    "healthCheckInterval": 60000,
    "resourceAllocationStrategy": "performance"
  },
  "terminal": {
    "poolSize": 20,
    "commandTimeout": 600000
  },
  "memory": {
    "cacheSizeMB": 1000,
    "syncInterval": 10000,
    "retentionDays": 90,
    "compressionEnabled": true,
    "encryptionEnabled": true
  },
  "logging": {
    "level": "info",
    "destination": "file",
    "fileOutput": "/var/log/claude-flow/app.log"
  }
}
```

### High-Availability Configuration

For enterprise deployments with redundancy:

```json
{
  "orchestrator": {
    "maxConcurrentAgents": 100,
    "failover": {
      "enabled": true,
      "replicationFactor": 3,
      "healthCheckInterval": 15000
    }
  },
  "memory": {
    "backend": "distributed",
    "replication": {
      "enabled": true,
      "replicas": 2,
      "consistency": "eventual"
    }
  },
  "coordination": {
    "loadBalancingStrategy": "adaptive",
    "clustering": {
      "enabled": true,
      "nodes": ["node1", "node2", "node3"]
    }
  }
}
```

## Configuration Management

### Using CLI Commands

```bash
# Show current configuration
claude-flow config show

# Get specific value
claude-flow config get orchestrator.maxConcurrentAgents

# Set configuration value
claude-flow config set memory.cacheSizeMB 200

# Validate configuration file
claude-flow config validate

# Initialize with defaults
claude-flow config init

# Use custom config file
claude-flow --config /path/to/custom-config.json start
```

### Environment Variables

Configuration values can be overridden using environment variables:

```bash
# Override orchestrator settings
export CLAUDE_FLOW_ORCHESTRATOR_MAX_CONCURRENT_AGENTS=20

# Override memory settings
export CLAUDE_FLOW_MEMORY_CACHE_SIZE_MB=500

# Override logging level
export CLAUDE_FLOW_LOGGING_LEVEL=debug
```

**Environment Variable Format:**
`CLAUDE_FLOW_<SECTION>_<SETTING>=<VALUE>`

### Configuration Inheritance

Create configuration hierarchies for different environments:

```bash
# Base configuration
claude-flow config create base --template base-config.json

# Development inherits from base
claude-flow config create development --inherit base --override dev-overrides.json

# Production inherits from base
claude-flow config create production --inherit base --override prod-overrides.json
```

## Advanced Configuration Patterns

### Dynamic Configuration

Enable runtime configuration updates:

```json
{
  "dynamicConfig": {
    "enabled": true,
    "reloadInterval": 60000,
    "hotReload": ["logging", "coordination"],
    "restartRequired": ["orchestrator", "memory"]
  }
}
```

### Feature Flags

Control feature availability:

```json
{
  "features": {
    "advancedScheduling": true,
    "distributedMemory": false,
    "experimentalTools": false,
    "performanceOptimizations": true
  }
}
```

### Resource Quotas

Set resource limits per component:

```json
{
  "resources": {
    "orchestrator": {
      "maxMemory": "2GB",
      "maxCPU": "2000m"
    },
    "memory": {
      "maxMemory": "4GB",
      "maxStorage": "50GB"
    },
    "terminal": {
      "maxSessions": 50,
      "maxMemoryPerSession": "100MB"
    }
  }
}
```

## Configuration Validation

### Schema Validation

Validate configuration against schema:

```bash
# Validate current configuration
claude-flow config validate

# Validate specific file
claude-flow config validate --file custom-config.json

# Validate with strict mode
claude-flow config validate --strict
```

### Common Validation Errors

**Invalid Range Values:**
```json
{
  "orchestrator": {
    "maxConcurrentAgents": -1  // Error: Must be positive
  }
}
```

**Missing Required Fields:**
```json
{
  "mcp": {
    // Error: Missing required 'transport' field
    "port": 3000
  }
}
```

**Type Mismatches:**
```json
{
  "memory": {
    "cacheSizeMB": "large"  // Error: Must be number
  }
}
```

## Best Practices

### 1. Environment Separation
- Use separate configurations for dev/staging/production
- Never commit sensitive values to version control
- Use environment variables for secrets

### 2. Performance Tuning
- Monitor system metrics to optimize settings
- Adjust pool sizes based on workload
- Enable compression for large datasets

### 3. Security Hardening
- Enable encryption for sensitive data
- Use TLS for remote communications
- Implement proper access controls

### 4. Monitoring and Alerting
- Configure appropriate log levels
- Set up health check intervals
- Monitor resource usage patterns

### 5. Backup and Recovery
- Enable automatic backups
- Test backup restoration procedures
- Implement proper retention policies

This configuration guide provides comprehensive coverage of all Claude-Flow configuration options. Use these settings to optimize Claude-Flow for your specific use case and environment.

## Environment Variables

Claude Code Flow supports various environment variables for configuration:

### Core Configuration
- `CLAUDE_FLOW_DEBUG` - Enable debug logging
- `CLAUDE_FLOW_LOG_LEVEL` - Set log level (debug, info, warn, error)
- `CLAUDE_FLOW_CONFIG` - Path to custom config file
- `NODE_ENV` - Environment mode (development, production, test)

### API Keys
- `ANTHROPIC_API_KEY` - Anthropic API key for direct Claude API access
- `OPENAI_API_KEY` - OpenAI API key for GPT models

### AWS Bedrock Integration

Claude Code Flow supports using Claude 4 through AWS Bedrock instead of the direct Anthropic API. This is useful for enterprise deployments or when you want to use AWS credits.

#### Required Environment Variables

```bash
# Enable Bedrock integration for Claude Code
CLAUDE_CODE_USE_BEDROCK=true

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key

# Optional: Use AWS profile instead of access keys
# AWS_PROFILE=your_profile_name

# Optional: AWS session token for temporary credentials
# AWS_SESSION_TOKEN=your_session_token

# Claude model configuration
ANTHROPIC_MODEL=anthropic.claude-3-5-sonnet-20241022-v2:0
ANTHROPIC_SMALL_FAST_MODEL=anthropic.claude-3-haiku-20240307-v1:0
```

#### AWS Bedrock Setup

1. **Enable Claude Models in AWS Bedrock**:
   - Go to AWS Bedrock console
   - Navigate to Model Access
   - Request access to Claude models (Claude 3.5 Sonnet, Claude 3 Haiku, etc.)
   - Wait for approval (usually instant for most regions)

2. **Configure AWS Credentials**:
   
   **Option A: Environment Variables**
   ```bash
   export AWS_ACCESS_KEY_ID=your_access_key_id
   export AWS_SECRET_ACCESS_KEY=your_secret_access_key
   export AWS_REGION=us-east-1
   ```
   
   **Option B: AWS Profile**
   ```bash
   aws configure --profile claude-flow
   export AWS_PROFILE=claude-flow
   ```
   
   **Option C: IAM Role (for EC2/ECS/Lambda)**
   No additional configuration needed if running on AWS with proper IAM role.

3. **Enable Bedrock in Claude Code Flow**:
   ```bash
   export CLAUDE_CODE_USE_BEDROCK=true
   export ANTHROPIC_MODEL=anthropic.claude-opus-4-20250514-v1:0
   ```

#### Available Claude Models on Bedrock

| Model ID | Description | Use Case |
|----------|-------------|----------|
| `anthropic.claude-opus-4-20250514-v1:0` | **Claude 4 Opus (Latest)** | Most powerful model for complex coding, agents, long-running tasks |
| `anthropic.claude-sonnet-4-20250514-v1:0` | **Claude 4 Sonnet (Latest)** | High-performance balanced model for production workflows |
| `anthropic.claude-3-7-sonnet-20250219-v1:0` | Claude 3.7 Sonnet | Advanced reasoning with extended thinking |
| `anthropic.claude-3-5-sonnet-20241022-v2:0` | Claude 3.5 Sonnet | General purpose, coding, analysis |
| `anthropic.claude-3-5-haiku-20241022-v1:0` | Claude 3.5 Haiku | Fast responses, simple tasks |
| `anthropic.claude-3-opus-20240229-v1:0` | Claude 3 Opus | Complex reasoning, research |

#### Example .env File for Bedrock

Create a `.env` file in your project root:

```bash
# AWS Bedrock Configuration
CLAUDE_CODE_USE_BEDROCK=true
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
ANTHROPIC_MODEL=anthropic.claude-opus-4-20250514-v1:0
ANTHROPIC_SMALL_FAST_MODEL=anthropic.claude-sonnet-4-20250514-v1:0

# Claude Code Flow Configuration
CLAUDE_FLOW_LOG_LEVEL=info
NODE_ENV=production
```

#### Testing Bedrock Integration

1. **Verify AWS Credentials**:
   ```bash
   aws bedrock list-foundation-models --region us-east-1
   ```

2. **Test Claude Code Flow with Bedrock**:
   ```bash
   # Set environment variables
   export CLAUDE_CODE_USE_BEDROCK=true
   export AWS_REGION=us-east-1
   export ANTHROPIC_MODEL=anthropic.claude-opus-4-20250514-v1:0
   
   # Test with a simple task
   claude-flow claude spawn "Hello, please introduce yourself and confirm you're running via AWS Bedrock"
   ```

3. **Check Logs**:
   Look for log messages indicating Bedrock integration is enabled:
   ```
   AWS Bedrock integration enabled for Claude Code {
     region: 'us-east-1',
     model: 'anthropic.claude-opus-4-20250514-v1:0',
     smallFastModel: 'anthropic.claude-sonnet-4-20250514-v1:0'
   }
   ```

#### Cost Considerations

- AWS Bedrock pricing is per-token, similar to direct Anthropic API
- Costs may vary by region
- Consider using Claude 3.5 Haiku for simple tasks to reduce costs
- Monitor usage through AWS Cost Explorer

#### Troubleshooting

**Common Issues:**

1. **Model Access Denied**:
   - Ensure you've requested access to Claude models in Bedrock console
   - Check that your AWS region supports the requested model

2. **Authentication Errors**:
   - Verify AWS credentials are correctly configured
   - Check IAM permissions for Bedrock service

3. **Region Issues**:
   - Claude models may not be available in all regions
   - Try `us-east-1` or `us-west-2` which typically have the latest models

**Debug Commands:**
```bash
# Check AWS configuration
aws configure list

# Test Bedrock access
aws bedrock list-foundation-models --region us-east-1

# Enable debug logging
export CLAUDE_FLOW_LOG_LEVEL=debug
```

### Terminal Configuration
- `CLAUDE_FLOW_TERMINAL_TYPE` - Terminal adapter (vscode, native, auto)

### Memory Configuration
- `CLAUDE_FLOW_MEMORY_BACKEND` - Memory backend (sqlite, markdown, hybrid)

### MCP Configuration
- `CLAUDE_FLOW_MCP_TRANSPORT` - MCP transport (stdio, http, websocket)
- `CLAUDE_FLOW_MCP_PORT` - MCP server port

### Orchestrator Configuration
- `CLAUDE_FLOW_MAX_AGENTS` - Maximum concurrent agents

## Config Files

Claude Code Flow uses JSON configuration files for advanced settings. The default location is `.claude-flow/config.json` in your project directory.

### Example config.json

```json
{
  "orchestrator": {
    "maxConcurrentAgents": 5,
    "defaultTimeout": 300000,
    "retryAttempts": 3
  },
  "terminal": {
    "type": "auto",
    "timeout": 30000
  },
  "memory": {
    "backend": "sqlite",
    "maxEntries": 10000,
    "ttl": 86400000
  },
  "mcp": {
    "transport": "stdio",
    "port": 3000,
    "timeout": 10000
  },
  "logging": {
    "level": "info",
    "file": "claude-flow.log"
  }
}
```

## Advanced Configuration

### Custom Tool Configurations

You can configure custom tools and their permissions in the config file:

```json
{
  "tools": {
    "allowed": ["View", "Edit", "Bash", "WebFetch"],
    "restricted": ["SystemControl"],
    "custom": {
      "MyTool": {
        "path": "./tools/my-tool.js",
        "permissions": ["read", "write"]
      }
    }
  }
}
```

### Workflow Templates

Define reusable workflow templates:

```json
{
  "workflows": {
    "templates": {
      "web-development": {
        "description": "Full-stack web development workflow",
        "steps": [
          {
            "name": "setup",
            "tools": ["Bash", "Edit"],
            "task": "Set up project structure"
          },
          {
            "name": "backend",
            "tools": ["Edit", "Bash", "WebFetch"],
            "task": "Implement backend API"
          }
        ]
      }
    }
  }
}
```