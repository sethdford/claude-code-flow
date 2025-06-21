/**
 * Centralized Model Configuration
 * Defines all Claude models and their usage patterns across the codebase
 */

export interface ModelDefinition {
  id: string;
  name: string;
  provider: "anthropic" | "openai" | "google" | "mistral";
  capabilities: {
    reasoning: "high" | "medium" | "low";
    speed: "fast" | "medium" | "slow";
    cost: "high" | "medium" | "low";
    contextWindow: number;
    maxTokens: number;
  };
  useCases: string[];
  deprecated?: boolean;
}

export interface ModelHierarchyConfig {
  primary: string;    // Complex reasoning, architecture decisions
  apply: string;      // Fast, precise edits
  review: string;     // Quality assurance
  fallback: string;   // Backup when primary fails
}

// Available Claude Models (Based on official Anthropic documentation)
// Reference: https://docs.anthropic.com/en/docs/about-claude/models/overview#model-aliases
export const CLAUDE_MODELS: Record<string, ModelDefinition> = {
  // Claude 4 Models (Latest Generation)
  "claude-opus-4-20250514": {
    id: "claude-opus-4-20250514",
    name: "Claude Opus 4",
    provider: "anthropic",
    capabilities: {
      reasoning: "high",
      speed: "medium",
      cost: "high",
      contextWindow: 200000,
      maxTokens: 32000,
    },
    useCases: [
      "complex-reasoning",
      "research",
      "analysis",
      "architecture-design",
      "security-audit",
      "advanced-coding",
    ],
  },
  "claude-sonnet-4-20250514": {
    id: "claude-sonnet-4-20250514",
    name: "Claude Sonnet 4",
    provider: "anthropic",
    capabilities: {
      reasoning: "high",
      speed: "fast",
      cost: "medium",
      contextWindow: 200000,
      maxTokens: 64000,
    },
    useCases: [
      "code-generation",
      "complex-reasoning",
      "architecture-design",
      "code-review",
      "testing",
      "documentation",
      "production-workflows",
    ],
  },
  
  // Claude 3.7 Models
  "claude-3-7-sonnet-20250219": {
    id: "claude-3-7-sonnet-20250219",
    name: "Claude Sonnet 3.7",
    provider: "anthropic",
    capabilities: {
      reasoning: "high",
      speed: "fast",
      cost: "medium",
      contextWindow: 200000,
      maxTokens: 64000,
    },
    useCases: [
      "extended-thinking",
      "complex-reasoning",
      "code-generation",
      "analysis",
    ],
  },
  
  // Claude 3.5 Models
  "claude-3-5-sonnet-20241022": {
    id: "claude-3-5-sonnet-20241022",
    name: "Claude Sonnet 3.5 v2",
    provider: "anthropic",
    capabilities: {
      reasoning: "high",
      speed: "fast",
      cost: "medium",
      contextWindow: 200000,
      maxTokens: 8192,
    },
    useCases: [
      "code-generation",
      "general-purpose",
      "coding",
      "analysis",
    ],
  },
  "claude-3-5-haiku-20241022": {
    id: "claude-3-5-haiku-20241022",
    name: "Claude Haiku 3.5",
    provider: "anthropic",
    capabilities: {
      reasoning: "medium",
      speed: "fast",
      cost: "low",
      contextWindow: 200000,
      maxTokens: 8192,
    },
    useCases: [
      "fast-responses",
      "simple-tasks",
      "quick-edits",
      "cost-effective-processing",
    ],
  },
  
  // Claude 3 Models (Legacy)
  "claude-3-opus-20240229": {
    id: "claude-3-opus-20240229",
    name: "Claude Opus 3",
    provider: "anthropic",
    capabilities: {
      reasoning: "high",
      speed: "medium",
      cost: "high",
      contextWindow: 200000,
      maxTokens: 4096,
    },
    useCases: [
      "complex-reasoning",
      "research",
      "analysis",
    ],
    deprecated: true,
  },
  "claude-3-sonnet-20240229": {
    id: "claude-3-sonnet-20240229",
    name: "Claude Sonnet 3",
    provider: "anthropic",
    capabilities: {
      reasoning: "high",
      speed: "fast",
      cost: "medium",
      contextWindow: 200000,
      maxTokens: 4096,
    },
    useCases: [
      "general-purpose",
      "coding",
      "analysis",
    ],
    deprecated: true,
  },
  "claude-3-haiku-20240307": {
    id: "claude-3-haiku-20240307",
    name: "Claude Haiku 3",
    provider: "anthropic",
    capabilities: {
      reasoning: "medium",
      speed: "fast",
      cost: "low",
      contextWindow: 200000,
      maxTokens: 4096,
    },
    useCases: [
      "fast-responses",
      "simple-tasks",
      "quick-edits",
    ],
    deprecated: true,
  },
};

// Model Aliases (for convenience during development)
// Reference: https://docs.anthropic.com/en/docs/about-claude/models/overview#model-aliases
export const MODEL_ALIASES: Record<string, string> = {
  "claude-opus-4-0": "claude-opus-4-20250514",
  "claude-sonnet-4-0": "claude-sonnet-4-20250514",
  "claude-3-7-sonnet-latest": "claude-3-7-sonnet-20250219",
  "claude-3-5-sonnet-latest": "claude-3-5-sonnet-20241022",
  "claude-3-5-haiku-latest": "claude-3-5-haiku-20241022",
  "claude-3-opus-latest": "claude-3-opus-20240229",
};

// Default Model Hierarchies for Different Use Cases
export const MODEL_HIERARCHIES: Record<string, ModelHierarchyConfig> = {
  // Development workflow (balanced performance and cost)
  development: {
    primary: "claude-sonnet-4-0",  // Alias for latest Claude 4 Sonnet
    apply: "claude-sonnet-4-0",
    review: "claude-sonnet-4-0",
    fallback: "claude-3-5-sonnet-latest",
  },
  
  // Research workflow (maximum reasoning capability)
  research: {
    primary: "claude-opus-4-0",  // Alias for latest Claude 4 Opus
    apply: "claude-sonnet-4-0",
    review: "claude-sonnet-4-0",
    fallback: "claude-3-7-sonnet-latest",
  },
  
  // Production workflow (reliability focused - use specific versions)
  production: {
    primary: "claude-sonnet-4-20250514",  // Specific version for stability
    apply: "claude-sonnet-4-20250514",
    review: "claude-sonnet-4-20250514",
    fallback: "claude-3-5-sonnet-20241022",
  },
  
  // Testing workflow (cost-effective)
  testing: {
    primary: "claude-sonnet-4-0",
    apply: "claude-3-5-haiku-latest",  // Fast and cheap for simple tasks
    review: "claude-sonnet-4-0",
    fallback: "claude-3-5-haiku-latest",
  },
};

// Global Default Configuration
export const DEFAULT_MODEL_CONFIG: ModelHierarchyConfig = MODEL_HIERARCHIES.development;

/**
 * Resolve a model alias to its actual model ID
 */
export function resolveModelAlias(modelIdOrAlias: string): string {
  return MODEL_ALIASES[modelIdOrAlias] || modelIdOrAlias;
}

/**
 * Get model hierarchy for a specific use case (with alias resolution)
 */
export function getModelHierarchy(useCase: keyof typeof MODEL_HIERARCHIES = "development"): ModelHierarchyConfig {
  const hierarchy = MODEL_HIERARCHIES[useCase] || DEFAULT_MODEL_CONFIG;
  
  // Resolve all aliases to actual model IDs
  return {
    primary: resolveModelAlias(hierarchy.primary),
    apply: resolveModelAlias(hierarchy.apply),
    review: resolveModelAlias(hierarchy.review),
    fallback: resolveModelAlias(hierarchy.fallback),
  };
}

/**
 * Get model definition by ID (with alias resolution)
 */
export function getModelDefinition(modelIdOrAlias: string): ModelDefinition | undefined {
  const actualModelId = resolveModelAlias(modelIdOrAlias);
  return CLAUDE_MODELS[actualModelId];
}

/**
 * Get all available models (excluding deprecated ones by default)
 */
export function getAvailableModels(includeDeprecated = false): ModelDefinition[] {
  return Object.values(CLAUDE_MODELS).filter(model => 
    includeDeprecated || !model.deprecated
  );
}

/**
 * Get models suitable for a specific use case
 */
export function getModelsForUseCase(useCase: string): ModelDefinition[] {
  return Object.values(CLAUDE_MODELS).filter(model =>
    model.useCases.includes(useCase) && !model.deprecated
  );
}

/**
 * Validate if a model ID is available and not deprecated (with alias resolution)
 */
export function isValidModel(modelIdOrAlias: string, allowDeprecated = false): boolean {
  const actualModelId = resolveModelAlias(modelIdOrAlias);
  const model = CLAUDE_MODELS[actualModelId];
  return model !== undefined && (allowDeprecated || !model.deprecated);
}

/**
 * Get all available model aliases
 */
export function getModelAliases(): Record<string, string> {
  return { ...MODEL_ALIASES };
}

/**
 * Check if a string is a model alias
 */
export function isModelAlias(modelIdOrAlias: string): boolean {
  return modelIdOrAlias in MODEL_ALIASES;
}

/**
 * Get the best model for a specific capability
 */
export function getBestModelForCapability(
  capability: keyof ModelDefinition["capabilities"],
  preferredLevel: "high" | "medium" | "low" = "high"
): ModelDefinition | undefined {
  const availableModels = getAvailableModels();
  return availableModels.find(model => 
    model.capabilities[capability] === preferredLevel
  ) || availableModels[0]; // fallback to first available
}

/**
 * Create a custom model hierarchy
 */
export function createModelHierarchy(config: Partial<ModelHierarchyConfig>): ModelHierarchyConfig {
  return {
    ...DEFAULT_MODEL_CONFIG,
    ...config,
  };
} 