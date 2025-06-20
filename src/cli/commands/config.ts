/**
 * Enterprise Configuration Management Commands
 * Features: Security masking, multi-format support, validation, change tracking
 */

import { Command } from "commander";
import chalk from "chalk";
import inquirer from "inquirer";
import { configManager } from "../../core/config.js";
import { deepMerge } from "../../utils/helpers.js";

// Local type definitions
interface ConfigShowOptions {
  format?: string;
  diff?: boolean;
  profile?: boolean;
}

interface ConfigSetOptions {
  type?: string;
  reason?: string;
  force?: boolean;
}

// Generic options interface for commands with file arguments
interface FileCommandOptions {
  force?: boolean;
  format?: string;
  [key: string]: any;
}

export const configCommand = new Command()
  .description("Manage Claude-Flow configuration")
  .action(() => {
    configCommand.help();
  })
  .command("show")
  .description("Show current configuration")
  .option("--format <format>", "Output format (json, yaml)", "json")
  .option("--diff", "Show only differences from defaults")
  .option("--profile", "Include profile information")
  .action(async (options: ConfigShowOptions) => {
    if (options.diff) {
      const diff = configManager.getDiff();
      console.log(JSON.stringify(diff, null, 2));
    } else if (options.profile) {
      const exported = configManager.export();
      console.log(JSON.stringify(exported, null, 2));
    } else {
      const config = configManager.get();
        
      if (options.format === "json") {
        console.log(JSON.stringify(config, null, 2));
      } else {
        console.log(chalk.yellow("YAML format not yet implemented"));
        console.log(JSON.stringify(config, null, 2));
      }
    }
  })
  .command("get")
  .description("Get a specific configuration value")
  .arguments("<path>")
  .action(async (path: string) => {
    try {
      const value = configManager.getValue(path);
        
      if (value === undefined) {
        console.error(chalk.red(`Configuration path not found: ${path}`));
        process.exit(1);
      } else {
        console.log(JSON.stringify(value, null, 2));
      }
    } catch (error) {
      console.error(chalk.red("Failed to get configuration value:"), (error as Error).message);
      process.exit(1);
    }
  })
  .command("set")
  .description("Set a configuration value with validation and change tracking")
  .arguments("<path:string> <value:string>")
  .option("--type <type>", "Value type (string, number, boolean, json)", "auto")
  .option("--reason <reason>", "Reason for the change (for audit trail)")
  .option("--force", "Skip validation warnings")
  .action(async (path: string, value: string, options: ConfigSetOptions) => {
    try {
      let parsedValue: any;
        
      switch (options.type) {
        case "string":
          parsedValue = value;
          break;
        case "number":
          parsedValue = parseFloat(value);
          if (isNaN(parsedValue)) {
            throw new Error("Invalid number format");
          }
          break;
        case "boolean":
          parsedValue = value.toLowerCase() === "true";
          break;
        case "json":
          parsedValue = JSON.parse(value);
          break;
        default:
          // Auto-detect type
          try {
            parsedValue = JSON.parse(value);
          } catch {
            parsedValue = value;
          }
      }

      // Get user info for change tracking
      const user = process.env.USER ?? process.env.USERNAME ?? "unknown";
      const { reason } = options;
        
      configManager.set(path, parsedValue, { user, reason, source: "cli" });
      console.log(chalk.green("✓"), `Set ${path} = ${JSON.stringify(parsedValue)}`);
        
      if (reason) {
        console.log(chalk.gray(`Reason: ${reason}`));
      }
    } catch (error) {
      console.error(chalk.red("Failed to set configuration:"), (error as Error).message);
      process.exit(1);
    }
  })
  .command("reset")
  .description("Reset configuration to defaults")
  .option("--confirm", "Skip confirmation prompt")
  .action(async (options: { confirm?: boolean }) => {
    if (!options.confirm) {
      const answers = await inquirer.prompt<{ confirmed: boolean }>([{
        type: "confirm",
        name: "confirmed",
        message: "Reset configuration to defaults?",
        default: false,
      }]);
      const { confirmed } = answers;
        
      if (!confirmed) {
        console.log(chalk.gray("Reset cancelled"));
        return;
      }
    }
      
    configManager.reset();
    console.log(chalk.green("✓ Configuration reset to defaults"));
  })
  .command("init")
  .description("Initialize a new configuration file with enterprise templates")
  .arguments("[output-file:string]")
  .option("--force", "Overwrite existing file")
  .option("--template <template>", "Configuration template (default, development, production, minimal, testing, enterprise)", "default")
  .option("--format <format>", "Output format (json, yaml, toml)", "json")
  .option("--interactive", "Interactive template selection")
  .action(async (options: any, outputFile: string = "claude-flow.config.json") => {
    try {
      // Check if file exists
      try {
        await import("fs").then(fs => fs.promises.stat(outputFile));
        if (!options.force) {
          console.error(chalk.red(`File already exists: ${outputFile}`));
          console.log(chalk.gray("Use --force to overwrite"));
          return;
        }
      } catch {
        // File doesn't exist, which is what we want
      }

      let templateName = options.template;
        
      // Interactive template selection
      if (options.interactive) {
        const availableTemplates = configManager.getAvailableTemplates();
        const templateAnswer = await inquirer.prompt([{
          type: "list",
          name: "template",
          message: "Select configuration template:",
          choices: availableTemplates,
        }]);
        templateName = templateAnswer.template;
      }
        
      const config = configManager.createTemplate(templateName);
        
      // Detect format from file extension or use option
      const ext = outputFile.split(".").pop()?.toLowerCase();
      const format = options.format || (ext === "yaml" || ext === "yml" ? "yaml" : ext === "toml" ? "toml" : "json");
        
      const formatParsers = configManager.getFormatParsers();
      const parser = formatParsers[format];
      const content = parser ? parser.stringify(config) : JSON.stringify(config, null, 2);
        
      await import("fs").then(fs => fs.promises.writeFile(outputFile, content, "utf-8"));
        
      console.log(chalk.green("✓"), `Configuration file created: ${outputFile}`);
      console.log(chalk.gray(`Template: ${templateName}`));
      console.log(chalk.gray(`Format: ${format}`));
    } catch (error) {
      console.error(chalk.red("Failed to create configuration file:"), (error as Error).message);
      process.exit(1);
    }
  })
  .command("validate")
  .description("Validate a configuration file")
  .arguments("<config-file>")
  .option("--strict", "Use strict validation")
  .action(async (options: any, configFile: string) => {
    try {
      await configManager.load(configFile);
      console.log(chalk.blue("Validating configuration file:"), configFile);
        
      // Use the new comprehensive validation method
      const result = await configManager.validateFile(configFile);
        
      if (result.valid) {
        console.log(chalk.green("✓"), "Configuration is valid");
          
        if (options.strict) {
          console.log(chalk.gray("✓ Strict validation passed"));
        }
      } else {
        console.error(chalk.red("✗"), "Configuration validation failed:");
        result.errors.forEach((error: string) => {
          console.error(chalk.red(`  • ${error}`));
        });
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red("✗"), "Configuration validation failed:");
      console.error((error as Error).message);
      process.exit(1);
    }
  })
  .command("profile")
  .description("Manage configuration profiles")
  .action(() => {
    console.log(chalk.gray("Usage: config profile <list|save|load|delete> [options]"));
  })
  .command("list")
  .description("List all configuration profiles")
  .action(async () => {
    try {
      const profiles = await configManager.listProfiles();
      const currentProfile = configManager.getCurrentProfile();
          
      if (profiles.length === 0) {
        console.log(chalk.gray("No profiles found"));
        return;
      }
          
      console.log(chalk.cyan.bold(`Configuration Profiles (${profiles.length})`));
      console.log("─".repeat(40));
          
      for (const profile of profiles) {
        const indicator = profile === currentProfile ? chalk.green("● ") : "  ";
        console.log(`${indicator}${profile}`);
      }
          
      if (currentProfile) {
        console.log();
        console.log(chalk.gray(`Current: ${currentProfile}`));
      }
    } catch (error) {
      console.error(chalk.red("Failed to list profiles:"), (error as Error).message);
    }
  })
  .command("save")
  .description("Save current configuration as a profile")
  .arguments("<profile-name>")
  .option("--force", "Overwrite existing profile")
  .action(async (profileName: string, options: FileCommandOptions) => {
    try {
      const existing = await configManager.getProfile(profileName);
      if (existing && !options.force) {
        console.error(chalk.red(`Profile '${profileName}' already exists`));
        console.log(chalk.gray("Use --force to overwrite"));
        return;
      }
          
      await configManager.saveProfile(profileName);
      console.log(chalk.green("✓"), `Profile '${profileName}' saved`);
    } catch (error) {
      console.error(chalk.red("Failed to save profile:"), (error as Error).message);
    }
  })
  .command("load")
  .description("Load a configuration profile")
  .arguments("<profile-name>")
  .action(async (profileName: string, options: FileCommandOptions) => {
    try {
      await configManager.applyProfile(profileName);
      console.log(chalk.green("✓"), `Profile '${profileName}' loaded`);
    } catch (error) {
      console.error(chalk.red("Failed to load profile:"), (error as Error).message);
    }
  })
  .command("delete")
  .description("Delete a configuration profile")
  .arguments("<profile-name>")
  .option("--force", "Skip confirmation prompt")
  .action(async (profileName: string, options: FileCommandOptions) => {
    try {
      if (!options.force) {
        const answers = await inquirer.prompt([{
          type: "confirm",
          name: "confirmed",
          message: `Delete profile '${profileName}'?`,
          default: false,
        }]);
        const { confirmed } = answers;
            
        if (!confirmed) {
          console.log(chalk.gray("Delete cancelled"));
          return;
        }
      }
          
      await configManager.deleteProfile(profileName);
      console.log(chalk.green("✓"), `Profile '${profileName}' deleted`);
    } catch (error) {
      console.error(chalk.red("Failed to delete profile:"), (error as Error).message);
    }
  })
  .command("show")
  .description("Show profile configuration")
  .arguments("<profile-name>")
  .action(async (profileName: string, options: FileCommandOptions) => {
    try {
      const profile = await configManager.getProfile(profileName);
      if (!profile) {
        console.error(chalk.red(`Profile '${profileName}' not found`));
        return;
      }
          
      console.log(JSON.stringify(profile, null, 2));
    } catch (error) {
      console.error(chalk.red("Failed to show profile:"), (error as Error).message);
    }
  })
  .command("export")
  .description("Export configuration")
  .arguments("<output-file>")
  .option("--include-defaults", "Include default values")
  .action(async (outputFile: string, options: FileCommandOptions) => {
    try {
      let data;
      if (options.includeDefaults) {
        data = configManager.export();
      } else {
        data = {
          version: "1.0.0",
          exported: new Date().toISOString(),
          profile: configManager.getCurrentProfile(),
          config: configManager.getDiff(),
        };
      }
        
      await import("fs").then(fs => fs.promises.writeFile(outputFile, JSON.stringify(data, null, 2)));
      console.log(chalk.green("✓"), `Configuration exported to ${outputFile}`);
    } catch (error) {
      console.error(chalk.red("Failed to export configuration:"), (error as Error).message);
    }
  })
  .command("import")
  .description("Import configuration")
  .arguments("<input-file>")
  .option("--merge", "Merge with current configuration")
  .action(async (inputFile: string, options: FileCommandOptions) => {
    try {
      const content = await import("fs").then(fs => fs.promises.readFile(inputFile, "utf-8"));
      const data = JSON.parse(content);
        
      if (options.merge) {
        const current = configManager.get();
        data.config = deepMerge(current as unknown as Record<string, unknown>, data.config) as any;
      }
        
      configManager.import(data);
      console.log(chalk.green("✓"), "Configuration imported successfully");
        
      if (data.profile) {
        console.log(chalk.gray(`Profile: ${data.profile}`));
      }
    } catch (error) {
      console.error(chalk.red("Failed to import configuration:"), (error as Error).message);
    }
  })
  .command("schema")
  .description("Show configuration schema")
  .option("--path <path>", "Show schema for specific path")
  .action(async (options: Record<string, any>) => {
    const schema = configManager.getSchema();
      
    if (options.path) {
      const value = getValueByPath(schema, options.path);
      if (value === undefined) {
        console.error(chalk.red(`Schema path not found: ${options.path}`));
        return;
      }
      console.log(JSON.stringify(value, null, 2));
    } else {
      console.log(JSON.stringify(schema, null, 2));
    }
  })
  .command("history")
  .description("Show configuration change history")
  .option("--path <path>", "Show history for specific configuration path")
  .option("--limit <limit:number>", "Maximum number of changes to show", "20")
  .option("--format <format>", "Output format (json, table)", "table")
  .action(async (options: Record<string, any>) => {
    try {
      const changes = options.path 
        ? configManager.getPathHistory()
        : configManager.getChangeHistory();
        
      if (changes.length === 0) {
        console.log(chalk.gray("No configuration changes found"));
        return;
      }
        
      if (options.format === "json") {
        console.log(JSON.stringify(changes, null, 2));
      } else {
        console.log(chalk.cyan.bold(`Configuration Change History (${changes.length} changes)`));
        console.log("─".repeat(80));
          
        changes.reverse().forEach((change: any, index: number) => {
          const timestamp = new Date(change.timestamp).toLocaleString();
          const user = change.user || "system";
          const source = change.source || "unknown";
            
          console.log(`${chalk.green(timestamp)} | ${chalk.blue(user)} | ${chalk.yellow(source)}`);
          console.log(`Path: ${chalk.cyan(change.path)}`);
            
          if (change.reason) {
            console.log(`Reason: ${chalk.gray(change.reason)}`);
          }
            
          if (change.oldValue !== undefined && change.newValue !== undefined) {
            console.log(`Old: ${chalk.red(JSON.stringify(change.oldValue))}`);
            console.log(`New: ${chalk.green(JSON.stringify(change.newValue))}`);
          }
            
          if (index < changes.length - 1) {
            console.log("");
          }
        });
      }
    } catch (error) {
      console.error(chalk.red("Failed to get change history:"), (error as Error).message);
    }
  })
  .command("backup")
  .description("Backup current configuration")
  .arguments("[backup-path:string]")
  .option("--auto-name", "Generate automatic backup filename")
  .action(async (backupPath: string | undefined, options: FileCommandOptions) => {
    try {
      const finalPath = backupPath || (options.autoName ? undefined : "config-backup.json");
      const savedPath = await configManager.backup(finalPath);
        
      console.log(chalk.green("✓"), `Configuration backed up to: ${savedPath}`);
      console.log(chalk.gray("Backup includes configuration and recent change history"));
    } catch (error) {
      console.error(chalk.red("Failed to backup configuration:"), (error as Error).message);
      process.exit(1);
    }
  })
  .command("restore")
  .description("Restore configuration from backup")
  .arguments("<backup-path>")
  .option("--force", "Skip confirmation prompt")
  .action(async (backupPath: string, options: FileCommandOptions) => {
    try {
      if (!options.force) {
        const answers = await inquirer.prompt([{
          type: "confirm",
          name: "confirmed",
          message: `Restore configuration from ${backupPath}? This will overwrite current configuration.`,
          default: false,
        }]);
        const { confirmed } = answers;
          
        if (!confirmed) {
          console.log(chalk.gray("Restore cancelled"));
          return;
        }
      }
        
      await configManager.restore(backupPath);
      console.log(chalk.green("✓"), "Configuration restored successfully");
      console.log(chalk.yellow("⚠️"), "You may need to restart the application for changes to take effect");
    } catch (error) {
      console.error(chalk.red("Failed to restore configuration:"), (error as Error).message);
      process.exit(1);
    }
  })
  .command("templates")
  .description("List available configuration templates")
  .option("--detailed", "Show detailed template information")
  .action(async (options: Record<string, any>) => {
    try {
      const templates = configManager.getAvailableTemplates();
        
      console.log(chalk.cyan.bold(`Available Configuration Templates (${templates.length})`));
      console.log("─".repeat(50));
        
      for (const template of templates) {
        console.log(chalk.green("●"), chalk.bold(template));
          
        if (options.detailed) {
          try {
            const config = configManager.createTemplate(template);
            const description = getTemplateDescription(template);
            console.log(`  ${chalk.gray(description)}`);
              
            if (config.orchestrator) {
              console.log(`  Max Agents: ${chalk.cyan(config.orchestrator.maxConcurrentAgents)}`);
            }
            if (config.logging) {
              console.log(`  Log Level: ${chalk.cyan(config.logging.level)}`);
            }
          } catch (error) {
            console.log(`  ${chalk.red("Error loading template")}`);
          }
        }
          
        console.log("");
      }
    } catch (error) {
      console.error(chalk.red("Failed to list templates:"), (error as Error).message);
    }
  });

// Helper function for template descriptions
function getTemplateDescription(templateName: string): string {
  const descriptions: Record<string, string> = {
    default: "Standard configuration with balanced settings",
    development: "Optimized for development with debug logging and lower limits",
    production: "Production-ready with enhanced security and performance",
    minimal: "Minimal resource usage for constrained environments",
    testing: "Optimized for testing with fast feedback and lower retention",
    enterprise: "Enterprise-grade with maximum security and scalability",
  };
  
  return descriptions[templateName] || "Custom configuration template";
}

function getValueByPath(obj: any, path: string): any {
  const parts = path.split(".");
  let current = obj;
  
  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  
  return current;
}

// Legacy function removed - now replaced by configManager.createTemplate()