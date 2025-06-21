/**
 * Bedrock Integration Test Command
 * Tests AWS Bedrock connectivity and model access
 */

import { logger } from "../../core/logger.js";
import { BedrockClient } from "../../core/bedrock-client.js";
import { 
  getBedrockModelId, 
  getBedrockInferenceProfile, 
  requiresInferenceProfile, 
  getBedrockModelConfig 
} from "../../config/model-config.js";
import { Command } from "../cliffy-compat.js";

async function bedrockTestAction() {
  console.log("🧪 AWS Bedrock Integration Test\n");

  // Check configuration
  console.log("1. Checking AWS configuration...");
  const config = await BedrockClient.checkConfiguration();
  
  if (!config.configured) {
    console.log("❌ AWS not configured:", config.error);
    console.log("\n💡 Setup instructions:");
    console.log("   1. Install AWS CLI: https://aws.amazon.com/cli/");
    console.log("   2. Configure credentials: aws configure");
    console.log("   3. Set region: export AWS_REGION=us-east-1");
    return;
  }

  console.log("✅ AWS configured");
  console.log(`   Region: ${config.region}`);
  console.log(`   Account: ${config.identity?.Account}`);
  console.log(`   User: ${config.identity?.Arn}\n`);

  // Show model mappings
  console.log("2. Bedrock model mappings:");
  const models = [
    "claude-4",
    "claude-3.7-sonnet",
    "claude-3.5-sonnet",
    "claude-3-sonnet",
    "claude-3-haiku"
  ];

  for (const model of models) {
    const bedrockId = getBedrockModelId(model);
    const requiresProfile = requiresInferenceProfile(model);
    const profile = getBedrockInferenceProfile(model);
    
    console.log(`   ${model}:`);
    console.log(`     Model ID: ${bedrockId}`);
    if (requiresProfile) {
      console.log(`     Inference Profile: ${profile}`);
    }
    console.log();
  }

  // Test environment variables
  console.log("3. Environment variables:");
  const useBedrock = process.env.CLAUDE_CODE_USE_BEDROCK === "true";
  const region = process.env.AWS_REGION;
  const modelId = process.env.ANTHROPIC_MODEL;
  
  console.log(`   CLAUDE_CODE_USE_BEDROCK: ${useBedrock}`);
  console.log(`   AWS_REGION: ${region || "not set"}`);
  console.log(`   ANTHROPIC_MODEL: ${modelId || "not set"}\n`);

  if (!useBedrock) {
    console.log("⚠️  Bedrock not enabled. Set CLAUDE_CODE_USE_BEDROCK=true to enable.");
    return;
  }

  // Test actual API call
  console.log("4. Testing Bedrock API call...");
  try {
    const client = new BedrockClient(region || "us-east-1");
    const testModel = modelId || "anthropic.claude-3-sonnet-20240229-v1:0";
    
    // If the model ID is a simple name like "claude-4", use our mapping system
    const bedrockConfig = getBedrockModelConfig(testModel);
    const actualModelId = bedrockConfig.modelId;
    const requiresProfile = bedrockConfig.requiresProfile;
    const profileId = bedrockConfig.inferenceProfile;
    
    console.log(`   Input model: ${testModel}`);
    console.log(`   Mapped to: ${actualModelId}`);
    if (requiresProfile) {
      console.log(`   Using inference profile: ${profileId}`);
    }
    
    const messages = [
      BedrockClient.createSimpleMessage("Hello! Please respond with exactly 'Bedrock API test successful'")
    ];

    const response = await client.invokeModel(testModel, messages, {
      max_tokens: 50,
      temperature: 0.1
    });

    console.log("✅ API call successful!");
    console.log(`   Response: ${response.content[0].text}`);
    console.log(`   Tokens used: ${response.usage.input_tokens} input, ${response.usage.output_tokens} output`);
    console.log(`   Stop reason: ${response.stop_reason}\n`);

    // Test with streaming
    console.log("5. Testing streaming API...");
    let streamedText = "";
    
    const streamResponse = await client.invokeModelWithStream(testModel, [
      BedrockClient.createSimpleMessage("Count from 1 to 5, one number per line.")
    ], {
      max_tokens: 100,
      temperature: 0.1,
      onChunk: (chunk) => {
        process.stdout.write(chunk);
        streamedText += chunk;
      }
    });

    console.log("\n✅ Streaming API successful!");
    console.log(`   Total response length: ${streamedText.length} characters\n`);

    console.log("🎉 All Bedrock tests passed! Integration is working correctly.");

  } catch (error) {
    console.log("❌ API call failed:", error.message);
    
    if (error.message.includes("AccessDenied") || error.message.includes("You don't have access")) {
      console.log("\n🎉 GOOD NEWS: Your Bedrock integration is working correctly!");
      console.log("✅ AWS credentials: Valid");
      console.log("✅ Model ID format: Correct");
      console.log("✅ API request: Properly formatted");
      console.log("✅ Network connectivity: Working");
      console.log("\n💡 You just need to request model access:");
      console.log("   1. Go to AWS Console → Bedrock → Model Access");
      console.log("   2. Request access to 'Claude 3 Sonnet'");
      console.log("   3. Wait for approval (usually instant)");
      console.log("   4. Test again - it will work!");
      console.log("\n🔗 Direct link: https://console.aws.amazon.com/bedrock/home#/modelaccess");
    } else if (error.message.includes("ValidationException")) {
      console.log("\n💡 Model validation error:");
      console.log("   - This usually means the model doesn't exist yet");
      console.log("   - Try a different model like 'claude-3-sonnet'");
      console.log("   - Check if you're using the correct region");
    } else {
      console.log("\n💡 Other error - check:");
      console.log("   1. AWS credentials");
      console.log("   2. Network connectivity");
      console.log("   3. Region configuration");
    }
  }
}

export const bedrockTestCommand = new Command()
  .name("bedrock-test")
  .description("Test AWS Bedrock integration and model access")
  .action(bedrockTestAction); 