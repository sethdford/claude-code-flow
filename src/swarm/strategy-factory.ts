import { IStrategy } from "./strategies/base.js";
import { AutoStrategy } from "./strategies/auto.js";
import { ResearchStrategy } from "./strategies/research.js";
import { DevelopmentStrategy } from "./strategies/development.js";
import { AnalysisStrategy } from "./strategies/analysis.js";
import { TestingStrategy } from "./strategies/testing.js";
import { OptimizationStrategy } from "./strategies/optimization.js";
import { MaintenanceStrategy } from "./strategies/maintenance.js";
import { SwarmStrategy } from "./types.js";
import { logger } from "../core/logger.js";

/**
 * Strategy Factory - Creates and manages swarm strategies
 * Integrates all available strategies including new ones from swarm documentation
 */
export class StrategyFactory {
  private static strategies: Map<SwarmStrategy, () => IStrategy> = new Map([
    ["auto", () => new AutoStrategy({})],
    ["research", () => new ResearchStrategy({})],
    ["development", () => new DevelopmentStrategy()],
    ["analysis", () => new AnalysisStrategy()],
    ["testing", () => new TestingStrategy()],
    ["optimization", () => new OptimizationStrategy()],
    ["maintenance", () => new MaintenanceStrategy()],
  ]);

  private static strategyInfo: Record<SwarmStrategy, StrategyInfo> = {
    auto: {
      name: 'Auto Strategy',
      description: 'Automatically determines the best approach based on objective analysis',
      features: [
        'Intelligent objective classification',
        'Dynamic strategy selection',
        'Adaptive task decomposition',
        'Performance monitoring and adjustment'
      ],
      coordinationMode: 'hybrid',
      estimatedDuration: 60,
      preferredFor: [
        'General purpose tasks',
        'Unknown or mixed requirements',
        'Experimental objectives',
        'Learning and exploration'
      ],
      workflowIntegrations: [
        'Adaptive meta-framework selection',
        'Dynamic SPARC mode assignment',
        'Intelligent orchestration patterns'
      ]
    },
    research: {
      name: 'Research Strategy',
      description: 'Multi-agent research coordination with distributed intelligence gathering and wisdom distillation',
      features: [
        'Parallel web search and data collection',
        'Source credibility analysis and validation',
        'Cross-domain knowledge synthesis',
        'Comprehensive report generation',
        'Wisdom distillation from historical patterns'
      ],
      coordinationMode: 'distributed',
      estimatedDuration: 90,
      preferredFor: [
        'Information gathering and analysis',
        'Market research and competitive analysis',
        'Technology evaluation and comparison',
        'Academic and scientific research',
        'Strategic planning and decision support'
      ],
      workflowIntegrations: [
        'Wisdom Distillation (.claude/commands/meta-frameworks/wisdom-distillation.md)',
        'Feature Discovery for research directions (.claude/commands/meta-frameworks/feature-discovery.md)',
        'SPARC researcher mode integration',
        'Meta-Learning DGM for pattern discovery'
      ]
    },
    development: {
      name: 'Development Strategy',
      description: 'Coordinated software development with meta-frameworks and advanced architectural patterns',
      features: [
        'Feature Discovery with cognitive explorers',
        'Virgil Protocol for architecture design (3% innovation rule)',
        'MCP Orchestration for parallel development',
        'Code Review Game with specialized reviewers',
        'Ulysses Protocol for complex debugging'
      ],
      coordinationMode: 'hierarchical',
      estimatedDuration: 330,
      preferredFor: [
        'Software application development',
        'System architecture design',
        'API and service creation',
        'Component library development',
        'Full-stack application building'
      ],
      workflowIntegrations: [
        'Feature Discovery Protocol (.claude/commands/meta-frameworks/feature-discovery.md)',
        'Virgil Protocol for architecture (.claude/commands/meta-frameworks/virgil-protocol.md)',
        'Code Review Game (.claude/commands/meta-frameworks/code-review-game.md)',
        'MCP Orchestration (.claude/commands/orchestration/mcp-orchestrate.md)',
        'Swarm Intelligence (.claude/commands/orchestration/swarm-intelligence.md)',
        'Ulysses Protocol for debugging (.claude/commands/meta-frameworks/ulysses-protocol.md)',
        'Pattern Synthesizer for reusable components'
      ]
    },
    analysis: {
      name: 'Analysis Strategy',
      description: 'Advanced data analysis with meta-learning, pattern synthesis, and knowledge graph construction',
      features: [
        'Meta-Learning DGM for pattern discovery',
        'Pattern Synthesizer for cross-domain analysis',
        'Advanced statistical and ML frameworks',
        'Knowledge graph construction and reasoning',
        'Organizational learning integration'
      ],
      coordinationMode: 'mesh',
      estimatedDuration: 240,
      preferredFor: [
        'Data analysis and insights generation',
        'Pattern recognition and trend analysis',
        'Business intelligence and reporting',
        'Scientific data analysis',
        'Performance analysis and optimization'
      ],
      workflowIntegrations: [
        'Meta-Learning DGM (.claude/commands/synthesis/meta-learning-dgm.md)',
        'Pattern Synthesizer (.claude/commands/synthesis/pattern-synthesizer.md)',
        'SPARC analyzer mode for data processing',
        'Knowledge base integration and updates',
        'Cross-project pattern libraries'
      ]
    },
    testing: {
      name: 'Testing Strategy',
      description: 'Comprehensive testing coordination with distributed validation and quality assurance',
      features: [
        'Test-driven development methodology',
        'Parallel test execution across multiple agents',
        'Comprehensive coverage analysis',
        'Performance and security testing',
        'Quality gate enforcement'
      ],
      coordinationMode: 'mesh',
      estimatedDuration: 120,
      preferredFor: [
        'Test suite development and execution',
        'Quality assurance and validation',
        'Performance testing and benchmarking',
        'Security testing and vulnerability assessment',
        'Regression testing and CI/CD integration'
      ],
      workflowIntegrations: [
        'SPARC TDD mode for test-driven development',
        'SPARC tester mode for comprehensive testing',
        'Code Review Game for test quality assurance',
        'Refactoring Game for test optimization',
        'Batch testing operations for efficiency'
      ]
    },
    optimization: {
      name: 'Optimization Strategy',
      description: 'Performance optimization with systematic profiling, analysis, and improvement coordination',
      features: [
        'Systematic performance profiling',
        'Bottleneck identification and analysis',
        'Multi-dimensional optimization approaches',
        'Validation and benchmarking',
        'Continuous improvement frameworks'
      ],
      coordinationMode: 'hybrid',
      estimatedDuration: 180,
      preferredFor: [
        'Performance optimization and tuning',
        'System efficiency improvements',
        'Resource utilization optimization',
        'Code quality and maintainability',
        'Scalability enhancements'
      ],
      workflowIntegrations: [
        'SPARC optimizer mode for performance analysis',
        'Refactoring Game for systematic improvements (.claude/commands/meta-frameworks/refactoring-game.md)',
        'Pattern Synthesizer for optimization patterns',
        'Meta-Learning for performance pattern recognition',
        'Ulysses Protocol for complex optimization challenges'
      ]
    },
    maintenance: {
      name: 'Maintenance Strategy',
      description: 'System maintenance and updates with coordinated health monitoring and improvement planning',
      features: [
        'Comprehensive system health checks',
        'Strategic update planning and coordination',
        'Risk assessment and mitigation',
        'Rollback and recovery procedures',
        'Documentation and knowledge capture'
      ],
      coordinationMode: 'centralized',
      estimatedDuration: 150,
      preferredFor: [
        'System maintenance and updates',
        'Dependency management and upgrades',
        'Security patching and hardening',
        'Infrastructure maintenance',
        'Technical debt reduction'
      ],
      workflowIntegrations: [
        'SPARC memory-manager for knowledge retention',
        'Wisdom Distillation for maintenance patterns',
        'Ulysses Protocol for complex maintenance issues',
        'Pattern Synthesizer for maintenance best practices',
        'Organizational learning for future maintenance'
      ]
    },
    custom: {
      name: 'Custom Strategy',
      description: 'User-defined custom strategy',
      features: ['Flexible task decomposition', 'Custom coordination patterns'],
      coordinationMode: 'hybrid',
      estimatedDuration: 60,
      preferredFor: ['Specialized requirements', 'Domain-specific tasks'],
      workflowIntegrations: ['All available workflows based on configuration']
    }
  };

  /**
   * Create a strategy instance based on the strategy type
   */
  static createStrategy(strategyType: SwarmStrategy): IStrategy {
    const strategyFactory = this.strategies.get(strategyType);
    if (!strategyFactory) {
      logger.warn(`Unknown strategy type: ${strategyType}, falling back to auto`);
      return new AutoStrategy({});
    }
    return strategyFactory();
  }

  /**
   * Get all available strategy types
   */
  static getAvailableStrategies(): SwarmStrategy[] {
    return Array.from(this.strategies.keys());
  }

  /**
   * Get strategy information for CLI help and documentation
   */
  static getStrategyInfo(): Record<SwarmStrategy, StrategyInfo> {
    return { ...this.strategyInfo };
  }

  /**
   * Recommend a strategy based on objective analysis
   */
  static recommendStrategy(objective: string): SwarmStrategy {
    const lowerObjective = objective.toLowerCase();
    
    // Development keywords
    if (/build|create|implement|develop|code|app|service|api|feature/.test(lowerObjective)) {
      return "development";
    }
    
    // Research keywords
    if (/research|analyze|investigate|study|explore|find|discover/.test(lowerObjective)) {
      return "research";
    }
    
    // Testing keywords
    if (/test|validate|verify|quality|qa|bug|regression/.test(lowerObjective)) {
      return "testing";
    }
    
    // Analysis keywords
    if (/data|analytics|insights|patterns|statistics|metrics/.test(lowerObjective)) {
      return "analysis";
    }
    
    // Optimization keywords
    if (/optimize|performance|speed|efficiency|improve|faster/.test(lowerObjective)) {
      return "optimization";
    }
    
    // Maintenance keywords
    if (/maintain|update|upgrade|fix|repair|health|monitor/.test(lowerObjective)) {
      return "maintenance";
    }
    
    // Default to auto strategy
    return "auto";
  }

  /**
   * Register a custom strategy
   */
  static registerStrategy(strategyType: SwarmStrategy, strategyFactory: () => IStrategy): void {
    this.strategies.set(strategyType, strategyFactory);
    logger.info(`Registered custom strategy: ${strategyType}`);
  }

  static getWorkflowIntegrations(strategy: SwarmStrategy): string[] {
    const info = this.strategyInfo[strategy];
    return info?.workflowIntegrations || [];
  }

  static getAvailableWorkflows(): string[] {
    return [
      // Meta-Frameworks
      '.claude/commands/meta-frameworks/code-review-game.md',
      '.claude/commands/meta-frameworks/feature-discovery.md',
      '.claude/commands/meta-frameworks/refactoring-game.md',
      '.claude/commands/meta-frameworks/ulysses-protocol.md',
      '.claude/commands/meta-frameworks/virgil-protocol.md',
      '.claude/commands/meta-frameworks/wisdom-distillation.md',
      
      // Orchestration
      '.claude/commands/orchestration/mcp-orchestrate.md',
      '.claude/commands/orchestration/swarm-intelligence.md',
      
      // Synthesis
      '.claude/commands/synthesis/meta-learning-dgm.md',
      '.claude/commands/synthesis/pattern-synthesizer.md',
      
      // Startup
      '.claude/commands/startup/metaclaude.md',
      
      // SPARC Modes (all 17 specialized modes)
      '.claude/commands/sparc/analyzer.md',
      '.claude/commands/sparc/architect.md',
      '.claude/commands/sparc/batch-executor.md',
      '.claude/commands/sparc/coder.md',
      '.claude/commands/sparc/debugger.md',
      '.claude/commands/sparc/designer.md',
      '.claude/commands/sparc/documenter.md',
      '.claude/commands/sparc/innovator.md',
      '.claude/commands/sparc/memory-manager.md',
      '.claude/commands/sparc/optimizer.md',
      '.claude/commands/sparc/orchestrator.md',
      '.claude/commands/sparc/researcher.md',
      '.claude/commands/sparc/reviewer.md',
      '.claude/commands/sparc/swarm-coordinator.md',
      '.claude/commands/sparc/tdd.md',
      '.claude/commands/sparc/tester.md',
      '.claude/commands/sparc/workflow-manager.md'
    ];
  }
}

export interface StrategyInfo {
  name: string;
  description: string;
  features: string[];
  coordinationMode: "centralized" | "distributed" | "hierarchical" | "mesh" | "hybrid";
  estimatedDuration: number; // in minutes
  preferredFor: string[];
  workflowIntegrations?: string[];
} 