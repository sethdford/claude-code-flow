/**
 * Prompt registry for MCP server
 * Manages prompts that appear as custom slash commands in Claude Code
 * Following the pattern: /mcp__<server-name>__<prompt-name>
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
 * Registry for managing MCP prompts that become slash commands
 */
export class PromptRegistry {
  private prompts = new Map<string, RegisteredPrompt>();
  private readonly serverName = "claude-flow";

  constructor(private logger: ILogger) {}

  /**
   * Register a prompt that will become a slash command
   */
  registerPrompt(prompt: RegisteredPrompt): void {
    this.prompts.set(prompt.name, prompt);
    this.logger.debug("Registered MCP prompt", { 
      name: prompt.name, 
      slashCommand: `/mcp__${this.serverName}__${prompt.name}` 
    });
  }

  /**
   * Get a prompt by name
   */
  getPrompt(name: string): RegisteredPrompt | undefined {
    return this.prompts.get(name);
  }

  /**
   * List all registered prompts (for MCP prompts/list)
   */
  listPrompts(): MCPPrompt[] {
    return Array.from(this.prompts.values()).map(prompt => ({
      name: prompt.name,
      description: prompt.description,
      arguments: prompt.arguments,
    }));
  }

  /**
   * Execute a prompt with given arguments
   */
  async executePrompt(name: string, args: Record<string, unknown>): Promise<string> {
    const prompt = this.prompts.get(name);
    if (!prompt) {
      throw new Error(`Prompt not found: ${name}`);
    }

    this.logger.debug("Executing MCP prompt", { 
      name, 
      args,
      slashCommand: `/mcp__${this.serverName}__${name}`
    });

    try {
      return await prompt.handler(args);
    } catch (error) {
      this.logger.error("Error executing prompt", { name, error });
      throw error;
    }
  }

  /**
   * Load prompts from .claude directory structure
   * Creates MCP prompts that become slash commands like /mcp__claude-flow__<command>
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

      // Load prompts from different command categories
      await this.loadPromptsFromDirectory(path.join(commandsDir, "sparc"), "sparc");
      await this.loadPromptsFromDirectory(path.join(commandsDir, "swarm"), "swarm");
      await this.loadPromptsFromDirectory(path.join(commandsDir, "meta-frameworks"), "meta-frameworks");
      await this.loadPromptsFromDirectory(path.join(commandsDir, "orchestration"), "orchestration");
      await this.loadPromptsFromDirectory(path.join(commandsDir, "startup"), "startup");
      await this.loadPromptsFromDirectory(path.join(commandsDir, "synthesis"), "synthesis");

      // Load root level commands
      await this.loadPromptsFromDirectory(commandsDir, "");

      this.logger.info(`Loaded ${this.prompts.size} MCP prompts as slash commands`, {
        prompts: Array.from(this.prompts.keys()).map(name => `/mcp__${this.serverName}__${name}`)
      });

    } catch (error) {
      this.logger.error("Error loading Claude prompts", error);
    }
  }

  /**
   * Load prompts from a specific directory
   */
  private async loadPromptsFromDirectory(dirPath: string, category: string): Promise<void> {
    try {
      await fs.access(dirPath);
      const files = await fs.readdir(dirPath);

      for (const file of files) {
        if (file.endsWith('.md')) {
          const filePath = path.join(dirPath, file);
          const promptName = this.createPromptName(file, category);
          
          await this.loadPromptFromFile(filePath, promptName, category);
        }
      }
    } catch (error) {
      // Directory doesn't exist or other error - skip silently
      this.logger.debug(`Skipping directory ${dirPath}:`, error);
    }
  }

  /**
   * Create a prompt name from file and category
   */
  private createPromptName(filename: string, category: string): string {
    const baseName = path.basename(filename, '.md');
    
    if (category) {
      return `${category}_${baseName}`.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    }
    
    return baseName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  }

  /**
   * Load a single prompt from a markdown file
   */
  private async loadPromptFromFile(filePath: string, promptName: string, category: string): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Parse frontmatter if present
      const { frontmatter, body } = this.parseFrontmatter(content);
      
      // Create description from frontmatter or filename
      const description = frontmatter.description || 
                         frontmatter.title || 
                         `${category ? category + ': ' : ''}${path.basename(filePath, '.md')}`;

      // Create arguments schema from frontmatter
      const promptArguments = this.createArgumentsSchema(frontmatter, body);

      // Register the prompt
      this.registerPrompt({
        name: promptName,
        description,
        arguments: promptArguments,
        handler: async (args: Record<string, unknown>) => {
          return this.executeClaudeCommand(filePath, promptName, category, args, body);
        }
      });

    } catch (error) {
      this.logger.error(`Error loading prompt from ${filePath}:`, error);
    }
  }

  /**
   * Parse frontmatter from markdown content
   */
  private parseFrontmatter(content: string): { frontmatter: Record<string, any>, body: string } {
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);

    if (match) {
      try {
        // Simple YAML parsing for basic frontmatter
        const frontmatterText = match[1];
        const frontmatter: Record<string, any> = {};
        
        frontmatterText.split('\n').forEach(line => {
          const colonIndex = line.indexOf(':');
          if (colonIndex > 0) {
            const key = line.substring(0, colonIndex).trim();
            const value = line.substring(colonIndex + 1).trim();
            frontmatter[key] = value;
          }
        });

        return { frontmatter, body: match[2] };
      } catch (error) {
        this.logger.warn(`Error parsing frontmatter in ${content.substring(0, 100)}...`);
      }
    }

    return { frontmatter: {}, body: content };
  }

  /**
   * Create arguments schema for the prompt
   */
  private createArgumentsSchema(frontmatter: Record<string, any>, body: string): MCPPrompt["arguments"] {
    // Look for $ARGUMENTS placeholder in the body
    if (body.includes('$ARGUMENTS')) {
      return [
        {
          name: "task",
          description: "Task description or arguments for the command",
          required: false
        }
      ];
    }

    // Could be extended to parse more sophisticated argument schemas from frontmatter
    return [];
  }

  /**
   * Execute a Claude command (simulated - in real implementation this would call the actual command)
   */
  private async executeClaudeCommand(
    filePath: string, 
    promptName: string, 
    category: string, 
    args: Record<string, unknown>,
    body: string
  ): Promise<string> {
    // Substitute arguments in the command body
    let processedBody = body;
    
    if (args.task && typeof args.task === 'string') {
      processedBody = processedBody.replace(/\$ARGUMENTS/g, args.task);
    }

    // Create the command execution instruction
    const instruction = `Execute Claude-Flow command: ${promptName}

Category: ${category || 'general'}
File: ${filePath}

Command Content:
${processedBody}

${args.task ? `Task Arguments: ${args.task}` : ''}

Please execute this command according to the Claude-Flow workflow specifications.`;

    return instruction;
  }
} 