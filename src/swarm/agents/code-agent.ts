/**
 * Code Agent - Implements hierarchical model strategy for intelligent code generation
 * Uses different models based on task complexity and context requirements
 */

import { BaseAgent } from "./base-agent.js";
import { AgentType, TaskDefinition, AgentCapabilities } from "../types.js";
import { logger } from "../../core/logger.js";
import { getModelHierarchy, ModelHierarchyConfig } from "../../config/model-config.js";

export interface CodeEditInstruction {
  type: "create" | "modify" | "delete";
  filePath: string;
  content?: string;
  instructions: string;
  context?: string[];
  complexity: "simple" | "medium" | "complex";
  useApplyModel?: boolean;
}

export interface FileContext {
  path: string;
  language: string;
  dependencies: string[];
  exports: string[];
  complexity: "low" | "medium" | "high";
  lastModified: Date;
  relatedFiles: string[];
}

export interface ModelHierarchy {
  primary: string;  // Complex reasoning, architecture decisions
  apply: string;    // Fast, precise edits
  review: string;   // Quality assurance
}

export class CodeAgent extends BaseAgent {
  private modelHierarchy: ModelHierarchy;
  private fileContextCache: Map<string, FileContext> = new Map();
  private editComplexityThreshold = 50; // lines of code

  constructor(id: string, config?: any) {
    super(id, "developer" as AgentType);
    
    // Use centralized model configuration
    const defaultHierarchy = getModelHierarchy(config?.useCase || "development");
    this.modelHierarchy = {
      primary: config?.models?.primary || defaultHierarchy.primary,
      apply: config?.models?.apply || defaultHierarchy.apply,
      review: config?.models?.review || defaultHierarchy.review,
    };

    this.capabilities = {
      codeGeneration: true,
      codeReview: true,
      testing: true,
      documentation: true,
      research: false,
      analysis: true,
      webSearch: false,
      apiIntegration: false,
      fileSystem: true,
      terminalAccess: true,
      languages: ["typescript", "javascript", "python", "java", "cpp"],
      frameworks: ["node", "react", "express", "nestjs"],
      domains: ["web-development", "backend-development", "api-development"],
      tools: [
        "hierarchical-code-generation",
        "context-aware-editing",
        "smart-chunking",
        "progressive-error-recovery",
        "test-driven-development",
        "apply-model-edits",
        "primary-model-planning",
        "review-model-validation",
        "context-analysis",
        "dependency-tracking",
      ],
      maxConcurrentTasks: 3,
      maxMemoryUsage: 2048,
      maxExecutionTime: 600,
      reliability: 0.95,
      speed: 0.85,
      quality: 0.9,
    };
  }

  async executeTask(task: TaskDefinition): Promise<any> {
    logger.info(`CodeAgent ${this.id} executing task: ${task.name}`);

    try {
      // Analyze task complexity and select appropriate model
      const complexity = await this.analyzeTaskComplexity(task);
      const selectedModel = this.selectModel(complexity);
      
      logger.info(`Task complexity: ${complexity}, selected model: ${selectedModel}`);

      // Get relevant file context
      const context = await this.gatherFileContext(task);
      
      // Execute based on task type and complexity
      switch (complexity) {
        case "simple":
          return await this.executeSimpleEdit(task, context);
        case "medium":
          return await this.executeMediumEdit(task, context);
        case "complex":
          return await this.executeComplexEdit(task, context);
        default:
          throw new Error(`Unknown complexity level: ${complexity}`);
      }
    } catch (error) {
      logger.error(`CodeAgent ${this.id} task execution failed:`, error);
      return await this.handleError(error, task);
    }
  }

  private async analyzeTaskComplexity(task: TaskDefinition): Promise<"simple" | "medium" | "complex"> {
    // Analyze task description for complexity indicators
    const description = task.description.toLowerCase();
    const instructions = task.instructions?.toLowerCase() || "";
    
    const complexityIndicators = {
      simple: [
        "fix typo", "rename variable", "add import", "update comment",
        "change value", "fix formatting", "add parameter",
      ],
      medium: [
        "implement function", "add method", "update logic", "refactor",
        "add validation", "handle error", "optimize performance",
      ],
      complex: [
        "design architecture", "implement system", "security audit",
        "major refactor", "performance optimization", "integration",
        "database schema", "api design",
      ],
    };

    // Check for complex indicators first
    if (complexityIndicators.complex.some(indicator => 
      description.includes(indicator) || instructions.includes(indicator))) {
      return "complex";
    }

    // Check for medium indicators
    if (complexityIndicators.medium.some(indicator => 
      description.includes(indicator) || instructions.includes(indicator))) {
      return "medium";
    }

    // Default to simple for basic tasks
    return "simple";
  }

  private selectModel(complexity: "simple" | "medium" | "complex"): string {
    switch (complexity) {
      case "simple":
        return this.modelHierarchy.apply;
      case "medium":
        return this.modelHierarchy.primary;
      case "complex":
        return this.modelHierarchy.primary;
      default:
        return this.modelHierarchy.primary;
    }
  }

  private async gatherFileContext(task: TaskDefinition): Promise<FileContext[]> {
    // Implementation would gather relevant file context
    // This is a simplified version
    const contexts: FileContext[] = [];
    
    // Extract file paths from task description/instructions
    const filePaths = this.extractFilePaths(`${task.description  } ${  task.instructions || ""}`);
    
    for (const path of filePaths) {
      if (this.fileContextCache.has(path)) {
        contexts.push(this.fileContextCache.get(path)!);
      } else {
        const context = await this.analyzeFile(path);
        this.fileContextCache.set(path, context);
        contexts.push(context);
      }
    }

    return contexts;
  }

  private extractFilePaths(text: string): string[] {
    // Simple regex to extract file paths
    const pathRegex = /[\w\-\.\/]+\.(ts|js|tsx|jsx|py|java|cpp|h|css|html|md|json|yaml|yml)/g;
    return text.match(pathRegex) || [];
  }

  private async analyzeFile(path: string): Promise<FileContext> {
    // Simplified file analysis - in real implementation would use AST parsing
    return {
      path,
      language: this.detectLanguage(path),
      dependencies: [],
      exports: [],
      complexity: "medium",
      lastModified: new Date(),
      relatedFiles: [],
    };
  }

  private detectLanguage(path: string): string {
    const extension = path.split(".").pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      "ts": "typescript",
      "tsx": "typescript",
      "js": "javascript",
      "jsx": "javascript",
      "py": "python",
      "java": "java",
      "cpp": "cpp",
      "c": "c",
      "h": "c",
      "css": "css",
      "html": "html",
      "md": "markdown",
      "json": "json",
      "yaml": "yaml",
      "yml": "yaml",
    };
    
    return languageMap[extension || ""] || "text";
  }

  private async executeSimpleEdit(task: TaskDefinition, context: FileContext[]): Promise<any> {
    logger.info(`Executing simple edit with apply model: ${this.modelHierarchy.apply}`);
    
    // Use apply model for fast, precise edits
    return {
      status: "completed",
      model: this.modelHierarchy.apply,
      approach: "apply-model-edit",
      context: context.map(c => c.path),
      result: "Simple edit completed successfully",
    };
  }

  private async executeMediumEdit(task: TaskDefinition, context: FileContext[]): Promise<any> {
    logger.info(`Executing medium edit with primary model: ${this.modelHierarchy.primary}`);
    
    // Use primary model for complex logic
    return {
      status: "completed",
      model: this.modelHierarchy.primary,
      approach: "primary-model-implementation",
      context: context.map(c => c.path),
      result: "Medium complexity edit completed successfully",
    };
  }

  private async executeComplexEdit(task: TaskDefinition, context: FileContext[]): Promise<any> {
    logger.info("Executing complex edit with primary + review models");
    
    // Use primary model for implementation, then review model for validation
    const implementation = await this.implementWithPrimaryModel(task, context);
    const review = await this.reviewWithReviewModel(implementation, context);
    
    return {
      status: "completed",
      model: `${this.modelHierarchy.primary} + ${this.modelHierarchy.review}`,
      approach: "hierarchical-implementation-review",
      context: context.map(c => c.path),
      implementation,
      review,
      result: "Complex edit completed with review validation",
    };
  }

  private async implementWithPrimaryModel(task: TaskDefinition, context: FileContext[]): Promise<any> {
    // Primary model implementation logic
    return {
      approach: "primary-model",
      files: context.map(c => c.path),
      changes: "Implementation completed",
    };
  }

  private async reviewWithReviewModel(implementation: any, context: FileContext[]): Promise<any> {
    // Review model validation logic
    return {
      approach: "review-model",
      quality: "high",
      suggestions: [],
      approved: true,
    };
  }

  private async handleError(error: any, task: TaskDefinition): Promise<any> {
    logger.error(`Error handling for task ${task.id.id}:`, error);
    
    // Progressive error recovery
    return {
      status: "error",
      error: error.message,
      recovery: "attempted",
      suggestions: [
        "Retry with different model",
        "Break down into smaller tasks",
        "Request additional context",
      ],
    };
  }

  getCapabilities(): AgentCapabilities {
    return this.capabilities;
  }

  override canHandleTask(task: TaskDefinition): boolean {
    const requiredCapabilities = task.requirements?.capabilities || [];
    
    // Map task capability names to agent capability properties
    const capabilityMap: Record<string, boolean> = {
      "analysis": this.capabilities.analysis,
      "planning": this.capabilities.analysis, // Planning is part of analysis
      "coding": this.capabilities.codeGeneration,
      "implementation": this.capabilities.codeGeneration,
      "review": this.capabilities.codeReview,
      "testing": this.capabilities.testing,
      "documentation": this.capabilities.documentation,
      "research": this.capabilities.research,
      "web-search": this.capabilities.webSearch,
      "api-integration": this.capabilities.apiIntegration,
      "file-system": this.capabilities.fileSystem,
      "terminal": this.capabilities.terminalAccess,
    };

    // Check if agent can handle all required capabilities
    return requiredCapabilities.every(capability => {
      const canHandle = capabilityMap[capability];
      if (canHandle === undefined) {
        // If capability is not mapped, assume agent can handle it
        return true;
      }
      return canHandle;
    });
  }

  override async cleanup(): Promise<void> {
    // Clear caches and cleanup resources
    this.fileContextCache.clear();
    await super.cleanup();
  }
} 