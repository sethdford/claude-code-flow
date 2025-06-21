/**
 * Models Command - Manage Claude model configurations
 */

import { Command } from "../cliffy-compat.js";
import { 
  getAvailableModels, 
  getModelHierarchy, 
  getModelDefinition, 
  getModelsForUseCase,
  getModelAliases,
  isModelAlias,
  resolveModelAlias,
  MODEL_HIERARCHIES,
  CLAUDE_MODELS 
} from "../../config/model-config.js";

export interface CommandContext {
  args: string[];
  flags: Record<string, any>;
}

export async function modelsAction(ctx: CommandContext): Promise<void> {
  const subcommand = ctx.args[0];
  
  switch (subcommand) {
    case "list":
      await listModels(ctx);
      break;
    case "info":
      await showModelInfo(ctx);
      break;
    case "hierarchy":
      await showModelHierarchy(ctx);
      break;
    case "use-case":
      await showUseCaseModels(ctx);
      break;
    case "validate":
      await validateModel(ctx);
      break;
    case "aliases":
      await showModelAliases(ctx);
      break;
    default:
      showModelsHelp();
  }
}

async function listModels(ctx: CommandContext): Promise<void> {
  const includeDeprecated = ctx.flags.all || ctx.flags.deprecated;
  const models = getAvailableModels(includeDeprecated);
  
  console.log("📋 Available Claude Models:\n");
  
  models.forEach(model => {
    const status = model.deprecated ? "🚫 DEPRECATED" : "✅ Active";
    const cost = getCostIndicator(model.capabilities.cost);
    const speed = getSpeedIndicator(model.capabilities.speed);
    
    console.log(`${status} ${model.name}`);
    console.log(`   ID: ${model.id}`);
    console.log(`   Reasoning: ${model.capabilities.reasoning.toUpperCase()}`);
    console.log(`   Speed: ${speed} | Cost: ${cost}`);
    console.log(`   Context: ${model.capabilities.contextWindow.toLocaleString()} tokens`);
    console.log(`   Use Cases: ${model.useCases.join(", ")}`);
    console.log();
  });
}

async function showModelInfo(ctx: CommandContext): Promise<void> {
  const modelId = ctx.args[1];
  
  if (!modelId) {
    console.error("Usage: claude-flow models info <model-id>");
    return;
  }
  
  const model = getModelDefinition(modelId);
  
  if (!model) {
    console.error(`❌ Model not found: ${modelId}`);
    console.log("Run 'claude-flow models list' to see available models");
    return;
  }
  
  console.log(`📊 Model Information: ${model.name}\n`);
  console.log(`ID: ${model.id}`);
  console.log(`Provider: ${model.provider}`);
  console.log(`Status: ${model.deprecated ? "🚫 DEPRECATED" : "✅ Active"}`);
  console.log();
  
  console.log("🔧 Capabilities:");
  console.log(`  Reasoning: ${model.capabilities.reasoning.toUpperCase()}`);
  console.log(`  Speed: ${getSpeedIndicator(model.capabilities.speed)}`);
  console.log(`  Cost: ${getCostIndicator(model.capabilities.cost)}`);
  console.log(`  Context Window: ${model.capabilities.contextWindow.toLocaleString()} tokens`);
  console.log(`  Max Output: ${model.capabilities.maxTokens.toLocaleString()} tokens`);
  console.log();
  
  console.log("🎯 Recommended Use Cases:");
  model.useCases.forEach(useCase => {
    console.log(`  • ${useCase}`);
  });
  
  if (model.deprecated) {
    console.log();
    console.log("⚠️  This model is deprecated. Consider upgrading to a newer version.");
  }
}

async function showModelHierarchy(ctx: CommandContext): Promise<void> {
  const useCase = ctx.args[1] || "development";
  
  if (!MODEL_HIERARCHIES[useCase]) {
    console.error(`❌ Unknown use case: ${useCase}`);
    console.log("Available use cases:", Object.keys(MODEL_HIERARCHIES).join(", "));
    return;
  }
  
  const hierarchy = getModelHierarchy(useCase as any);
  
  console.log(`🏗️  Model Hierarchy for "${useCase}" use case:\n`);
  
  console.log(`Primary Model (Complex reasoning):`);
  console.log(`  ${hierarchy.primary}`);
  const primaryModel = getModelDefinition(hierarchy.primary);
  if (primaryModel) {
    console.log(`  ${primaryModel.name} - ${primaryModel.capabilities.reasoning} reasoning`);
  }
  console.log();
  
  console.log(`Apply Model (Fast edits):`);
  console.log(`  ${hierarchy.apply}`);
  const applyModel = getModelDefinition(hierarchy.apply);
  if (applyModel) {
    console.log(`  ${applyModel.name} - ${applyModel.capabilities.speed} speed`);
  }
  console.log();
  
  console.log(`Review Model (Quality assurance):`);
  console.log(`  ${hierarchy.review}`);
  const reviewModel = getModelDefinition(hierarchy.review);
  if (reviewModel) {
    console.log(`  ${reviewModel.name} - ${reviewModel.capabilities.reasoning} reasoning`);
  }
  console.log();
  
  console.log(`Fallback Model (Error recovery):`);
  console.log(`  ${hierarchy.fallback}`);
  const fallbackModel = getModelDefinition(hierarchy.fallback);
  if (fallbackModel) {
    console.log(`  ${fallbackModel.name} - ${fallbackModel.capabilities.reasoning} reasoning`);
  }
}

async function showUseCaseModels(ctx: CommandContext): Promise<void> {
  const useCase = ctx.args[1];
  
  if (!useCase) {
    console.error("Usage: claude-flow models use-case <use-case>");
    console.log("Examples: code-generation, research, analysis, testing");
    return;
  }
  
  const models = getModelsForUseCase(useCase);
  
  if (models.length === 0) {
    console.log(`❌ No models found for use case: ${useCase}`);
    return;
  }
  
  console.log(`🎯 Models suitable for "${useCase}":\n`);
  
  models.forEach(model => {
    const cost = getCostIndicator(model.capabilities.cost);
    const speed = getSpeedIndicator(model.capabilities.speed);
    
    console.log(`✅ ${model.name}`);
    console.log(`   ID: ${model.id}`);
    console.log(`   Reasoning: ${model.capabilities.reasoning.toUpperCase()}`);
    console.log(`   Speed: ${speed} | Cost: ${cost}`);
    console.log();
  });
}

async function validateModel(ctx: CommandContext): Promise<void> {
  const modelId = ctx.args[1];
  
  if (!modelId) {
    console.error("Usage: claude-flow models validate <model-id>");
    return;
  }
  
  const model = getModelDefinition(modelId);
  
  if (!model) {
    console.log(`❌ Invalid model: ${modelId}`);
    console.log("Run 'claude-flow models list' to see available models");
    return;
  }
  
  if (model.deprecated) {
    console.log(`⚠️  Model is deprecated: ${modelId}`);
    console.log(`   Name: ${model.name}`);
    console.log(`   Consider upgrading to a newer version`);
    return;
  }
  
  console.log(`✅ Valid model: ${modelId}`);
  console.log(`   Name: ${model.name}`);
  console.log(`   Status: Active`);
  
  if (isModelAlias(modelId)) {
    console.log(`   Alias resolves to: ${resolveModelAlias(modelId)}`);
  }
}

async function showModelAliases(ctx: CommandContext): Promise<void> {
  const aliases = getModelAliases();
  
  console.log("🔗 Model Aliases:\n");
  
  Object.entries(aliases).forEach(([alias, modelId]) => {
    const model = getModelDefinition(modelId);
    const status = model?.deprecated ? "🚫 DEPRECATED" : "✅ Active";
    
    console.log(`${alias}`);
    console.log(`   → ${modelId}`);
    if (model) {
      console.log(`   ${status} ${model.name}`);
    }
    console.log();
  });
  
  console.log("💡 Tip: Aliases automatically point to the latest version of a model.");
  console.log("    Use specific model IDs in production for consistent behavior.");
}

function getCostIndicator(cost: string): string {
  switch (cost) {
    case "high": return "💰💰💰 High";
    case "medium": return "💰💰 Medium";
    case "low": return "💰 Low";
    default: return cost;
  }
}

function getSpeedIndicator(speed: string): string {
  switch (speed) {
    case "fast": return "🚀 Fast";
    case "medium": return "⚡ Medium";
    case "slow": return "🐌 Slow";
    default: return speed;
  }
}

function showModelsHelp(): void {
  console.log(`
Usage: claude-flow models <command> [options]

Manage Claude model configurations and hierarchies.

Commands:
  list                       List all available models
  info <model-id>           Show detailed information about a specific model
  hierarchy [use-case]      Show model hierarchy for a use case (default: development)
  use-case <use-case>       Show models suitable for a specific use case
  validate <model-id>       Validate if a model ID is available and active
  aliases                   Show all available model aliases

Use Cases:
  development               Balanced performance and cost
  research                  Maximum reasoning capability
  production                Reliability focused
  testing                   Cost-effective

Options:
  --all, --deprecated       Include deprecated models in list

Examples:
  claude-flow models list
  claude-flow models info claude-sonnet-4-20250514
  claude-flow models hierarchy research
  claude-flow models use-case code-generation
  claude-flow models validate claude-opus-4-20250514
`);
}

// Export the command for CLI registration
export const modelsCommand = new Command()
  .name("models")
  .description("Manage Claude model configurations and hierarchies")
  .arguments("[subcommand] [args...]")
  .option("--all", "Include deprecated models in list")
  .option("--deprecated", "Include deprecated models in list")
  .action(async (subcommand: string, args: string[], options: any) => {
    const ctx: CommandContext = {
      args: [subcommand, ...args].filter(Boolean),
      flags: options,
    };
    await modelsAction(ctx);
  }); 