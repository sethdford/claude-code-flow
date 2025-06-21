/**
 * Swarm Strategies Command - List and describe available swarm strategies
 */

import { Command } from "../cliffy-compat.js";
import { StrategyFactory } from "../../swarm/strategy-factory.js";
import { SwarmStrategy } from "../../swarm/types.js";

export interface CommandContext {
  args: string[];
  flags: Record<string, any>;
}

export async function swarmStrategiesAction(ctx: CommandContext): Promise<void> {
  const strategyInfo = StrategyFactory.getStrategyInfo();
  const availableStrategies = StrategyFactory.getAvailableStrategies();

  if (ctx.flags.help || ctx.flags.h) {
    showStrategiesHelp();
    return;
  }

  // If a specific strategy is requested, show detailed info
  const requestedStrategy = ctx.args[0];
  if (requestedStrategy) {
    if (!availableStrategies.includes(requestedStrategy as SwarmStrategy)) {
      console.error(`❌ Unknown strategy: ${requestedStrategy}`);
      console.error(`Available strategies: ${availableStrategies.join(", ")}`);
      return;
    }

    showDetailedStrategyInfo(requestedStrategy as SwarmStrategy, strategyInfo[requestedStrategy as SwarmStrategy]);
    return;
  }

  // Show all strategies
  console.log("🎯 Available Swarm Strategies\n");
  
  availableStrategies.forEach((strategy, index) => {
    const info = strategyInfo[strategy];
    const isLast = index === availableStrategies.length - 1;
    
    console.log(`${isLast ? "└" : "├"}─ ${strategy.toUpperCase()}`);
    console.log(`${isLast ? " " : "│"}  ${info.description}`);
    console.log(`${isLast ? " " : "│"}  Duration: ~${info.estimatedDuration} min | Mode: ${info.coordinationMode}`);
    console.log(`${isLast ? " " : "│"}  Best for: ${info.preferredFor.slice(0, 3).join(", ")}${info.preferredFor.length > 3 ? "..." : ""}`);
    if (!isLast) console.log("│");
  });

  console.log(`\n💡 Use 'claude-flow swarm-strategies <strategy>' for detailed information`);
  console.log(`💡 Use 'claude-flow swarm --strategy <strategy>' to use a specific strategy`);
}

function showDetailedStrategyInfo(strategy: SwarmStrategy, info: any): void {
  console.log(`🎯 ${strategy.toUpperCase()} Strategy\n`);
  
  console.log(`📝 Description:`);
  console.log(`   ${info.description}\n`);
  
  console.log(`🏗️  Coordination Mode: ${info.coordinationMode}`);
  console.log(`⏱️  Estimated Duration: ~${info.estimatedDuration} minutes\n`);
  
  console.log(`✨ Key Features:`);
  info.features.forEach((feature: string) => {
    console.log(`   • ${feature}`);
  });
  
  console.log(`\n🎯 Best Used For:`);
  info.preferredFor.forEach((use: string) => {
    console.log(`   • ${use}`);
  });
  
  console.log(`\n💡 Example Usage:`);
  console.log(`   claude-flow swarm "your objective here" --strategy ${strategy}`);
  
  // Add strategy-specific tips
  const tips = getStrategyTips(strategy);
  if (tips.length > 0) {
    console.log(`\n💡 Tips for ${strategy} strategy:`);
    tips.forEach((tip: string) => {
      console.log(`   • ${tip}`);
    });
  }
}

function getStrategyTips(strategy: string): string[] {
  const tips: Record<string, string[]> = {
    auto: [
      "Let the system choose the best strategy based on your objective",
      "Great for general tasks when you're unsure which approach to use",
    ],
    research: [
      "Provide specific research questions for better results",
      "Works best with objectives that require gathering information",
      "Includes web search and source credibility analysis",
    ],
    development: [
      "Specify the technology stack you want to use",
      "Include requirements for testing and documentation",
      "Works well for building applications, APIs, and features",
    ],
    analysis: [
      "Provide data sources or specify what needs to be analyzed",
      "Include context about what insights you're looking for",
      "Great for business intelligence and data-driven decisions",
    ],
    testing: [
      "Specify the type of testing needed (unit, integration, etc.)",
      "Include information about the codebase being tested",
      "Ensures comprehensive test coverage and quality assurance",
    ],
    optimization: [
      "Identify specific performance concerns or bottlenecks",
      "Include current performance metrics if available",
      "Best used when you have measurable performance issues",
    ],
    maintenance: [
      "Specify what systems or components need maintenance",
      "Include any known issues or update requirements",
      "Great for keeping systems healthy and up-to-date",
    ],
    custom: [
      "Use when you need specialized behavior not covered by other strategies",
      "Consider implementing your own strategy for unique workflows",
    ],
  };

  return tips[strategy] || [];
}

function showStrategiesHelp(): void {
  console.log(`
Usage: claude-flow swarm-strategies [strategy]

List and describe available swarm strategies.

Arguments:
  strategy                   Show detailed information for a specific strategy

Options:
  --help, -h                Show this help message

Examples:
  claude-flow swarm-strategies                    # List all strategies
  claude-flow swarm-strategies development        # Show development strategy details
  claude-flow swarm-strategies research           # Show research strategy details
`);
}

export const swarmStrategiesCommand = new Command()
  .name("swarm-strategies")
  .description("List and describe available swarm strategies")
  .arguments("[strategy]")
  .option("--help, -h", "Show help message")
  .action(async (strategy?: string, options?: any) => {
    await swarmStrategiesAction({
      args: strategy ? [strategy] : [],
      flags: options || {},
    });
  }); 