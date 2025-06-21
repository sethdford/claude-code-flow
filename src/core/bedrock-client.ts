/**
 * AWS Bedrock Client Implementation
 * Based on official AWS Bedrock documentation for Anthropic Claude models
 */

import { 
  getBedrockModelConfig, 
  getBedrockModelId, 
  requiresInferenceProfile 
} from "../config/model-config.js";

export interface BedrockMessage {
  role: "user" | "assistant";
  content: string | Array<{
    type: "text" | "image";
    text?: string;
    source?: {
      type: "base64";
      media_type: string;
      data: string;
    };
  }>;
}

export interface BedrockRequest {
  anthropic_version: "bedrock-2023-05-31";
  max_tokens: number;
  messages: BedrockMessage[];
  system?: string;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  stop_sequences?: string[];
}

export interface BedrockResponse {
  id: string;
  model: string;
  type: "message";
  role: "assistant";
  content: Array<{
    type: "text";
    text: string;
  }>;
  stop_reason: "end_turn" | "max_tokens" | "stop_sequence";
  stop_sequence?: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export class BedrockClient {
  private region: string;

  constructor(region = "us-east-1") {
    this.region = region;
  }

  /**
   * Invoke a Claude model on Bedrock using the correct Messages API format
   */
  async invokeModel(
    modelId: string,
    messages: BedrockMessage[],
    options: {
      max_tokens?: number;
      temperature?: number;
      top_p?: number;
      top_k?: number;
      system?: string;
      stop_sequences?: string[];
    } = {}
  ): Promise<BedrockResponse> {
    const bedrockConfig = getBedrockModelConfig(modelId);
    const actualModelId = bedrockConfig.modelId;

    // Prepare the request payload according to AWS Bedrock documentation
    const payload: BedrockRequest = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: options.max_tokens || 1000,
      messages: messages,
    };

    // Add optional parameters
    if (options.system) payload.system = options.system;
    if (options.temperature !== undefined) payload.temperature = options.temperature;
    if (options.top_p !== undefined) payload.top_p = options.top_p;
    if (options.top_k !== undefined) payload.top_k = options.top_k;
    if (options.stop_sequences) payload.stop_sequences = options.stop_sequences;

    try {
      // Use AWS SDK to invoke the model
      const response = await this.callBedrockAPI(actualModelId, payload, bedrockConfig);
      return response;
    } catch (error) {
      console.error("Bedrock API call failed:", error);
      throw new Error(`Bedrock invocation failed: ${error.message}`);
    }
  }

  /**
   * Invoke model with streaming response
   */
  async invokeModelWithStream(
    modelId: string,
    messages: BedrockMessage[],
    options: {
      max_tokens?: number;
      temperature?: number;
      top_p?: number;
      top_k?: number;
      system?: string;
      stop_sequences?: string[];
      onChunk?: (chunk: string) => void;
    } = {}
  ): Promise<string> {
    const bedrockConfig = getBedrockModelConfig(modelId);
    const actualModelId = bedrockConfig.modelId;

    const payload: BedrockRequest = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: options.max_tokens || 1000,
      messages: messages,
    };

    // Add optional parameters
    if (options.system) payload.system = options.system;
    if (options.temperature !== undefined) payload.temperature = options.temperature;
    if (options.top_p !== undefined) payload.top_p = options.top_p;
    if (options.top_k !== undefined) payload.top_k = options.top_k;
    if (options.stop_sequences) payload.stop_sequences = options.stop_sequences;

    try {
      const { BedrockRuntimeClient, InvokeModelWithResponseStreamCommand } = await import("@aws-sdk/client-bedrock-runtime");
      
      const client = new BedrockRuntimeClient({ region: this.region });

      const targetModelId = bedrockConfig.requiresProfile && bedrockConfig.inferenceProfile 
        ? bedrockConfig.inferenceProfile 
        : actualModelId;

      const command = new InvokeModelWithResponseStreamCommand({
        modelId: targetModelId,
        contentType: "application/json",
        body: JSON.stringify(payload),
      });

      const response = await client.send(command);
      let completeMessage = "";

      // Process the response stream
      if (response.body) {
        for await (const item of response.body) {
          if (item.chunk?.bytes) {
            const chunk = JSON.parse(new TextDecoder().decode(item.chunk.bytes));
            
            if (chunk.type === "content_block_delta" && chunk.delta?.text) {
              const text = chunk.delta.text;
              completeMessage += text;
              
              if (options.onChunk) {
                options.onChunk(text);
              }
            }
          }
        }
      }

      return completeMessage;
    } catch (error) {
      console.error("Bedrock streaming API call failed:", error);
      throw new Error(`Bedrock streaming invocation failed: ${error.message}`);
    }
  }

  /**
   * Call the Bedrock API using AWS SDK
   */
  private async callBedrockAPI(
    modelId: string, 
    payload: BedrockRequest,
    config: { requiresProfile: boolean; inferenceProfile?: string }
  ): Promise<BedrockResponse> {
    // Dynamic import to avoid loading AWS SDK unless needed
    const { BedrockRuntimeClient, InvokeModelCommand } = await import("@aws-sdk/client-bedrock-runtime");
    
    const client = new BedrockRuntimeClient({ 
      region: this.region,
      // Credentials will be automatically loaded from environment/IAM role
    });

    // Use inference profile if required for newer models
    const targetModelId = config.requiresProfile && config.inferenceProfile 
      ? config.inferenceProfile 
      : modelId;

    const command = new InvokeModelCommand({
      modelId: targetModelId,
      contentType: "application/json",
      body: JSON.stringify(payload),
    });

    const response = await client.send(command);
    
    // Decode the response body
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    return responseBody as BedrockResponse;
  }

  /**
   * Convert simple text prompt to Bedrock Messages format
   */
  static createSimpleMessage(prompt: string, role: "user" | "assistant" = "user"): BedrockMessage {
    return {
      role,
      content: prompt,
    };
  }

  /**
   * Check if Bedrock is properly configured
   */
  static async checkConfiguration(): Promise<{
    configured: boolean;
    region?: string;
    identity?: any;
    error?: string;
  }> {
    try {
      // Check if AWS credentials are available
      const { STSClient, GetCallerIdentityCommand } = await import("@aws-sdk/client-sts");
      
      const region = process.env.AWS_REGION || "us-east-1";
      const stsClient = new STSClient({ region });
      
      const identity = await stsClient.send(new GetCallerIdentityCommand({}));
      
      return {
        configured: true,
        region,
        identity,
      };
    } catch (error) {
      return {
        configured: false,
        error: error.message,
      };
    }
  }
}
