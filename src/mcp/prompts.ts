/**
 * Prompt registry for MCP server
 * Manages prompts that appear as custom slash commands in Claude
 */

import { MCPPrompt } from "../utils/types.js";
import { ILogger } from "../core/logger.js";
import * as fs from "fs/promises";
import * as path from "path";

export interface PromptHandler {
  (args: Record<string, unknown>): Promise<string>;
}

export interface RegisteredPrompt extends MCPPrompt {
  handler: PromptHandler;
}

/**
 * Registry for managing MCP prompts
 */
export class PromptRegistry {
  private prompts = new Map<string, RegisteredPrompt>();

  constructor(private logger: ILogger) {}

  /**
   * Register a prompt
   */
  registerPrompt(prompt: RegisteredPrompt): void {
    this.prompts.set(prompt.name, prompt);
    this.logger.debug("Registered prompt", { name: prompt.name });
  }

  /**
   * Get a prompt by name
   */
  getPrompt(name: string): RegisteredPrompt | undefined {
    return this.prompts.get(name);
  }

  /**
   * List all available prompts
   */
  listPrompts(): MCPPrompt[] {
    return Array.from(this.prompts.values()).map(({ handler, ...prompt }) => prompt);
  }

  /**
   * Execute a prompt
   */
  async executePrompt(name: string, args: Record<string, unknown>): Promise<string> {
    const prompt = this.prompts.get(name);
    if (!prompt) {
      throw new Error(`Prompt not found: ${name}`);
    }

    try {
      return await prompt.handler(args);
    } catch (error) {
      this.logger.error("Error executing prompt", { name, error });
      throw error;
    }
  }

  /**
   * Load prompts from .claude directory
   */
  async loadClaudePrompts(): Promise<void> {
    try {
      const claudeDir = ".claude";
      const commandsDir = path.join(claudeDir, "commands");

      // Check if .claude/commands directory exists
      try {
        await fs.access(commandsDir);
      } catch {
        this.logger.info("No .claude/commands directory found, skipping prompt loading");
        return;
      }

      // Load prompts from different categories
      const categories = [
        "meta-frameworks",
        "orchestration", 
        "startup",
        "synthesis",
        "sparc",
        "swarm"
      ];

      for (const category of categories) {
        await this.loadCategoryPrompts(commandsDir, category);
      }

      this.logger.info(`Loaded ${this.prompts.size} prompts from .claude directory`);
    } catch (error) {
      this.logger.error("Error loading Claude prompts", error);
    }
  }

  /**
   * Load prompts from a specific category directory
   */
  private async loadCategoryPrompts(commandsDir: string, category: string): Promise<void> {
    const categoryDir = path.join(commandsDir, category);
    
    try {
      const files = await fs.readdir(categoryDir);
      
      for (const file of files) {
        if (file.endsWith('.md')) {
          const commandName = path.basename(file, '.md');
          const filePath = path.join(categoryDir, file);
          
          try {
            const content = await fs.readFile(filePath, 'utf-8');
            await this.registerPromptFromMarkdown(category, commandName, content);
          } catch (error) {
            this.logger.warn(`Failed to load prompt from ${filePath}`, error);
          }
        }
      }
    } catch (error) {
      // Category directory doesn't exist, skip silently
      this.logger.debug(`Category directory ${category} not found, skipping`);
    }
  }

  /**
   * Register a prompt from markdown content
   */
  private async registerPromptFromMarkdown(category: string, commandName: string, content: string): Promise<void> {
    // Extract title and description from markdown
    const lines = content.split('\n');
    let title = commandName;
    let description = `${category} command: ${commandName}`;
    
    // Look for title (first # heading)
    for (const line of lines) {
      if (line.startsWith('# ')) {
        title = line.substring(2).trim();
        break;
      }
    }
    
    // Look for description (first paragraph after title)
    let foundTitle = false;
    for (const line of lines) {
      if (line.startsWith('# ')) {
        foundTitle = true;
        continue;
      }
      if (foundTitle && line.trim() && !line.startsWith('#') && !line.startsWith('```')) {
        description = line.trim();
        break;
      }
    }

    const promptName = `${category}/${commandName}`;
    
    this.registerPrompt({
      name: promptName,
      description,
      arguments: [
        {
          name: "objective",
          description: "The objective or task to accomplish",
          required: false,
        },
        {
          name: "context",
          description: "Additional context for the command",
          required: false,
        }
      ],
      handler: async (args: Record<string, unknown>) => {
        const objective = args.objective as string || "";
        const context = args.context as string || "";
        
        // Build the prompt by combining the markdown content with user args
        let prompt = `# ${title}\n\n${content}\n\n`;
        
        if (objective) {
          prompt += `**Objective:** ${objective}\n\n`;
        }
        
        if (context) {
          prompt += `**Context:** ${context}\n\n`;
        }
        
        prompt += `Please execute this ${category} command with the provided objective and context.`;
        
        return prompt;
      }
    });
  }
} 