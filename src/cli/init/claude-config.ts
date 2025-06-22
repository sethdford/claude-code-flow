// init/claude-config.ts - Claude configuration creation
import type { InitOptions } from "./index.js";
import { getVersion } from "../../utils/version.js";

export async function createClaudeConfig(options: InitOptions): Promise<void> {
  const fs = await import("fs/promises");
  const path = await import("path");
  
  // Create base configuration
  const claudeConfig = {
    version: getVersion(),
    project: {
      name: path.basename(process.cwd()),
      type: "claude-flow",
      created: new Date().toISOString(),
    },
    features: {
      swarm: true,
      sparc: options.sparc ?? false,
      memory: true,
      terminal: true,
      mcp: true,
      batchTools: true,
      orchestration: true,
    },
    batchTools: {
      enabled: true,
      maxConcurrentTasks: 10,
      memoryCoordination: true,
      taskOrchestration: true,
      parallelExecution: true,
    },
    swarmConfig: {
      defaultStrategy: "auto",
      defaultMode: "centralized", 
      defaultMaxAgents: 5,
      defaultTimeout: 60,
      enableMonitoring: true,
      enableParallel: true,
      outputFormats: ["json", "sqlite", "csv", "html"],
      defaultOutputDir: "./reports",
    },
    coordination: {
      todoIntegration: true,
      memorySharing: true,
      crossAgentCommunication: true,
      taskDependencyTracking: true,
      progressMonitoring: true,
    },
  };
  
  await fs.writeFile(".claude/config.json", JSON.stringify(claudeConfig, null, 2));
  console.log("  ✅ Created .claude/config.json with batch tools configuration");
  
  // Create additional configuration files
  await createBatchToolsConfig();
  await createSwarmConfig();
  await createCoordinationConfig();
  
  // Create configuration templates directory and examples
  await createConfigurationTemplates();
}

async function createBatchToolsConfig(): Promise<void> {
  const fs = await import("fs/promises");
  
  const batchConfig = {
    version: getVersion(),
    description: "Batch tools configuration for Claude Code orchestration",
    tools: {
      todoWrite: {
        enabled: true,
        features: ["task_breakdown", "dependency_tracking", "priority_management", "progress_monitoring"],
        maxTasks: 50,
        defaultPriority: "medium",
      },
      todoRead: {
        enabled: true,
        features: ["progress_tracking", "status_monitoring", "task_filtering"],
        autoRefresh: true,
        refreshInterval: 30,
      },
      task: {
        enabled: true,
        features: ["parallel_execution", "agent_coordination", "load_balancing"],
        maxConcurrentTasks: 10,
        timeoutDefault: 300,
        retryAttempts: 3,
      },
      memory: {
        enabled: true,
        features: ["cross_agent_sharing", "persistent_storage", "knowledge_coordination"],
        maxEntries: 1000,
        compressionEnabled: true,
        encryptionEnabled: false,
      },
      fileOperations: {
        batchRead: {
          enabled: true,
          maxConcurrentReads: 10,
          timeoutPerFile: 30,
        },
        batchWrite: {
          enabled: true,
          maxConcurrentWrites: 5,
          backupEnabled: true,
        },
        batchEdit: {
          enabled: true,
          maxConcurrentEdits: 5,
          validationEnabled: true,
        },
      },
      search: {
        batchGlob: {
          enabled: true,
          maxConcurrentSearches: 5,
          cacheResults: true,
        },
        batchGrep: {
          enabled: true,
          maxConcurrentSearches: 5,
          regexOptimization: true,
        },
      },
    },
    performance: {
      monitoring: {
        enabled: true,
        metricsCollection: true,
        performanceAlerts: true,
      },
      optimization: {
        resourcePooling: true,
        intelligentBatching: true,
        loadBalancing: true,
      },
    },
  };
  
  await fs.writeFile(".claude/configs/batch-tools.json", JSON.stringify(batchConfig, null, 2));
  console.log("  ✅ Created batch tools configuration");
}

async function createSwarmConfig(): Promise<void> {
  const fs = await import("fs/promises");
  
  const swarmConfig = {
    version: getVersion(),
    description: "Swarm orchestration configuration for Claude-Flow",
    strategies: {
      research: {
        description: "Multi-agent research coordination",
        defaultMode: "distributed",
        defaultAgents: 6,
        phases: ["planning", "execution", "synthesis", "reporting"],
        tools: ["WebSearch", "WebFetch", "Memory", "TodoWrite", "Task"],
        coordination: "memory_based",
      },
      development: {
        description: "Coordinated software development",
        defaultMode: "hierarchical", 
        defaultAgents: 8,
        phases: ["architecture", "implementation", "testing", "integration"],
        tools: ["Read", "Write", "Edit", "Bash", "Memory", "TodoWrite", "Task"],
        coordination: "hierarchical_teams",
      },
      analysis: {
        description: "Data analysis and insights generation",
        defaultMode: "mesh",
        defaultAgents: 10,
        phases: ["collection", "processing", "analysis", "visualization"],
        tools: ["Read", "Bash", "Memory", "TodoWrite", "Task"],
        coordination: "peer_to_peer",
      },
      testing: {
        description: "Comprehensive testing coordination",
        defaultMode: "distributed",
        defaultAgents: 12,
        phases: ["planning", "execution", "validation", "reporting"],
        tools: ["Read", "Write", "Bash", "TodoWrite", "Task"],
        coordination: "distributed_validation",
      },
      optimization: {
        description: "Performance optimization coordination",
        defaultMode: "hybrid",
        defaultAgents: 6,
        phases: ["profiling", "analysis", "optimization", "validation"],
        tools: ["Read", "Edit", "Bash", "Memory", "TodoWrite"],
        coordination: "adaptive_hybrid",
      },
      maintenance: {
        description: "System maintenance coordination",
        defaultMode: "centralized",
        defaultAgents: 4,
        phases: ["assessment", "planning", "execution", "verification"],
        tools: ["Read", "Write", "Bash", "TodoWrite", "Memory"],
        coordination: "centralized_safety",
      },
    },
    coordinationModes: {
      centralized: {
        description: "Single coordinator manages all agents",
        useCases: ["maintenance", "safety_critical", "simple_tasks"],
        coordination: "master_slave",
        communication: "hub_spoke",
      },
      distributed: {
        description: "Multiple coordinators manage agent groups", 
        useCases: ["research", "testing", "large_scale"],
        coordination: "multi_master",
        communication: "federated",
      },
      hierarchical: {
        description: "Tree-like organization with team leads",
        useCases: ["development", "structured_workflows", "large_teams"],
        coordination: "tree_structure",
        communication: "hierarchical_reporting",
      },
      mesh: {
        description: "Peer-to-peer agent communication",
        useCases: ["analysis", "dynamic_tasks", "adaptive_workflows"],
        coordination: "peer_to_peer",
        communication: "mesh_network",
      },
      hybrid: {
        description: "Adaptive coordination based on task phase",
        useCases: ["optimization", "complex_workflows", "multi_phase"],
        coordination: "adaptive_mixed",
        communication: "dynamic_topology",
      },
    },
  };
  
  await fs.writeFile(".claude/configs/swarm.json", JSON.stringify(swarmConfig, null, 2));
  console.log("  ✅ Created swarm orchestration configuration");
}

async function createCoordinationConfig(): Promise<void> {
  const fs = await import("fs/promises");
  
  const coordinationConfig = {
    version: getVersion(),
    description: "Agent coordination and orchestration configuration",
    coordination: {
      taskManagement: {
        todoIntegration: {
          enabled: true,
          autoBreakdown: true,
          dependencyTracking: true,
          progressMonitoring: true,
          priorityManagement: true,
        },
        taskDistribution: {
          algorithm: "intelligent_balancing",
          loadBalancing: true,
          skillMatching: true,
          resourceOptimization: true,
        },
      },
      communication: {
        memorySharing: {
          enabled: true,
          crossAgentAccess: true,
          knowledgeSync: true,
          conflictResolution: "timestamp_priority",
        },
        coordination: {
          realTimeUpdates: true,
          statusBroadcasting: true,
          emergencySignaling: true,
        },
      },
      monitoring: {
        progressTracking: {
          enabled: true,
          realTimeUpdates: true,
          milestoneTracking: true,
          performanceMetrics: true,
        },
        healthMonitoring: {
          agentHealth: true,
          taskHealth: true,
          systemHealth: true,
          alerting: true,
        },
      },
    },
    optimization: {
      resourceManagement: {
        pooling: true,
        allocation: "dynamic",
        recycling: true,
        monitoring: true,
      },
      performance: {
        batchOptimization: true,
        parallelExecution: true,
        caching: true,
        compression: true,
      },
    },
  };
  
  await fs.writeFile(".claude/configs/coordination.json", JSON.stringify(coordinationConfig, null, 2));
  console.log("  ✅ Created coordination configuration");
}

async function createConfigurationTemplates(): Promise<void> {
  const fs = await import("fs/promises");
  const path = await import("path");
  
  // Create templates directory
  const templatesDir = ".claude/configs/templates";
  await fs.mkdir(templatesDir, { recursive: true });
  
  // Minimal configuration template
  const minimalConfig = {
    name: "Minimal Configuration",
    description: "Bare minimum configuration - Claude Flow will use defaults for everything else",
    orchestrator: {
      model: "claude-sonnet-4-20250514"
    }
  };
  
  // Development configuration template
  const developmentConfig = {
    name: "Development Configuration",
    description: "Optimized for development with debug logging and enhanced monitoring",
    orchestrator: {
      model: "claude-sonnet-4-20250514",
      temperature: 0.7,
      maxTokens: 4096,
      timeout: 30000,
      maxConcurrentAgents: 8
    },
    memory: {
      backend: "json",
      location: "./memory/dev-flow.json",
      cacheSizeMB: 100
    },
    logging: {
      level: "debug",
      format: "pretty",
      destination: "console"
    },
    coordination: {
      maxRetries: 3,
      retryDelay: 1000,
      deadlockDetection: true
    }
  };
  
  // Production configuration template
  const productionConfig = {
    name: "Production Configuration", 
    description: "Production-ready with enhanced security, performance, and monitoring",
    orchestrator: {
      model: "claude-sonnet-4-20250514",
      temperature: 0.5,
      maxTokens: 8192,
      timeout: 60000,
      maxConcurrentAgents: 20
    },
    memory: {
      backend: "sqlite",
      location: "./memory/prod-flow.db",
      cacheSizeMB: 500,
      syncInterval: 10000,
      retentionDays: 90
    },
    logging: {
      level: "warn",
      format: "json",
      destination: "file",
      file: "./logs/claude-flow.log"
    },
    coordination: {
      maxRetries: 5,
      retryDelay: 2000,
      deadlockDetection: true,
      resourceTimeout: 60000
    },
    security: {
      encryptionEnabled: true,
      auditLogging: true,
      accessControl: true
    }
  };
  
  // Research configuration template
  const researchConfig = {
    name: "Research Configuration",
    description: "Optimized for research tasks with enhanced memory and web access",
    orchestrator: {
      model: "claude-sonnet-4-20250514",
      temperature: 0.8,
      maxTokens: 8192,
      maxConcurrentAgents: 12
    },
    memory: {
      backend: "hybrid",
      cacheSizeMB: 1000,
      compressionLevel: 6,
      knowledgeGraphing: true
    },
    tools: {
      webSearch: {
        enabled: true,
        maxResults: 50,
        timeout: 30000
      },
      documentAnalysis: {
        enabled: true,
        formats: ["pdf", "docx", "txt", "md"]
      }
    },
    coordination: {
      researchMode: true,
      citationTracking: true,
      sourceValidation: true
    }
  };
  
  // Testing configuration template
  const testingConfig = {
    name: "Testing Configuration",
    description: "Optimized for test generation and execution with coverage requirements",
    orchestrator: {
      model: "claude-sonnet-4-20250514",
      temperature: 0.3,
      maxTokens: 6144,
      maxConcurrentAgents: 15
    },
    testing: {
      frameworks: ["jest", "vitest", "mocha", "cypress"],
      coverageThreshold: 80,
      testTypes: ["unit", "integration", "e2e"],
      parallelExecution: true
    },
    coordination: {
      testOrchestration: true,
      failureAnalysis: true,
      regressionTracking: true
    }
  };
  
  // Batch processing examples
  const batchConfigSimple = {
    name: "Simple Batch Configuration",
    description: "Basic batch processing for multiple projects",
    projects: ["api-service", "web-frontend", "admin-dashboard"],
    baseOptions: {
      sparc: true,
      parallel: true,
      maxConcurrency: 3,
      template: "web-api",
      environments: ["dev", "staging"]
    }
  };
  
  const batchConfigAdvanced = {
    name: "Advanced Batch Configuration",
    description: "Advanced batch processing with specialized project configurations",
    baseOptions: {
      sparc: true,
      parallel: true,
      maxConcurrency: 4,
      force: true
    },
    projectConfigs: {
      "user-api": {
        template: "web-api",
        environment: "dev",
        customConfig: {
          database: "postgresql",
          auth: "jwt"
        }
      },
      "notification-service": {
        template: "microservice",
        environment: "dev",
        customConfig: {
          messageQueue: "rabbitmq",
          cache: "redis"
        }
      },
      "admin-portal": {
        template: "react-app",
        environment: "dev",
        customConfig: {
          ui: "material-ui",
          state: "redux"
        }
      }
    }
  };
  
  // Write all template files
  const templates = {
    "minimal.json": minimalConfig,
    "development.json": developmentConfig,
    "production.json": productionConfig,
    "research.json": researchConfig,
    "testing.json": testingConfig,
    "batch-simple.json": batchConfigSimple,
    "batch-advanced.json": batchConfigAdvanced
  };
  
  for (const [filename, config] of Object.entries(templates)) {
    const filePath = path.join(templatesDir, filename);
    await fs.writeFile(filePath, JSON.stringify(config, null, 2));
  }
  
  // Create templates README
  const templatesReadme = `# Configuration Templates

This directory contains pre-built configuration templates for different use cases and environments.

## Available Templates

### Environment Templates
- **minimal.json** - Bare minimum configuration with defaults
- **development.json** - Development-optimized with debug logging
- **production.json** - Production-ready with security and performance
- **research.json** - Research-optimized with enhanced memory and web access
- **testing.json** - Testing-focused with coverage requirements

### Batch Processing Templates  
- **batch-simple.json** - Simple multi-project batch processing
- **batch-advanced.json** - Advanced batch with specialized configurations

## Usage

### Using Templates with Commands
\`\`\`bash
# Use a specific template
claude-flow swarm "analyze codebase" --config .claude/configs/templates/research.json

# Use for batch processing
claude-flow batch --config .claude/configs/templates/batch-advanced.json

# Initialize with template
claude-flow config init --template .claude/configs/templates/production.json
\`\`\`

### Customizing Templates
1. Copy a template: \`cp templates/development.json my-config.json\`
2. Modify settings as needed
3. Use with: \`--config .claude/configs/my-config.json\`

### Template Inheritance
Templates can be combined and extended:
\`\`\`bash
# Merge multiple templates
claude-flow config merge templates/development.json my-overrides.json --output final-config.json
\`\`\`

## Configuration Sections

### Orchestrator
- \`model\`: Claude model selection
- \`temperature\`: Creativity level (0.0-1.0)
- \`maxTokens\`: Maximum response length
- \`maxConcurrentAgents\`: Parallel agent limit

### Memory
- \`backend\`: Storage type (json, sqlite, hybrid)
- \`cacheSizeMB\`: Memory cache size
- \`retentionDays\`: Data retention period

### Coordination
- \`maxRetries\`: Failed task retry attempts
- \`deadlockDetection\`: Enable deadlock prevention
- \`resourceTimeout\`: Resource allocation timeout

### Logging
- \`level\`: Detail level (debug, info, warn, error)
- \`format\`: Output format (json, text, pretty)
- \`destination\`: Output target (console, file, both)

*Generated by Claude Code Flow initialization*
`;
  
  await fs.writeFile(path.join(templatesDir, "README.md"), templatesReadme);
  console.log("  ✅ Created configuration templates and examples");
}