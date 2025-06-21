/**
 * Command Handler for Claude Code Console
 * Processes and executes console commands
 */

export class CommandHandler {
  constructor(terminal, wsClient) {
    this.terminal = terminal;
    this.wsClient = wsClient;
    this.isProcessing = false;
    
    // Built-in commands
    this.builtinCommands = {
      "help": this.showHelp.bind(this),
      "clear": this.clearConsole.bind(this),
      "status": this.showStatus.bind(this),
      "connect": this.connectToServer.bind(this),
      "disconnect": this.disconnectFromServer.bind(this),
      "tools": this.listTools.bind(this),
      "health": this.checkHealth.bind(this),
      "history": this.showHistory.bind(this),
      "export": this.exportSession.bind(this),
      "theme": this.changeTheme.bind(this),
      "version": this.showVersion.bind(this)
    };
    
    // Claude Flow commands
    this.claudeFlowCommands = {
      "claude-flow": this.executeClaudeFlow.bind(this),
      "swarm": this.executeSwarm.bind(this),
      "init": this.initializeProject.bind(this),
      "config": this.manageConfig.bind(this),
      "memory": this.manageMemory.bind(this),
      "agents": this.manageAgents.bind(this),
      "benchmark": this.runBenchmark.bind(this),
      "sparc": this.executeSparc.bind(this)
    };
    
    this.allCommands = { ...this.builtinCommands, ...this.claudeFlowCommands };
  }
  
  /**
   * Process a command
   */
  async processCommand(command) {
    if (this.isProcessing) {
      this.terminal.writeWarning("Another command is still processing. Please wait...");
      return;
    }
    
    this.isProcessing = true;
    this.terminal.setLocked(true);
    
    try {
      const { cmd, args } = this.parseCommand(command);
      
      if (this.allCommands[cmd]) {
        await this.allCommands[cmd](args);
      } else {
        await this.executeRemoteCommand(cmd, args);
      }
    } catch (error) {
      this.terminal.writeError(error.message);
      console.error("Command execution error:", error);
    } finally {
      this.isProcessing = false;
      this.terminal.setLocked(false);
    }
  }
  
  /**
   * Parse command string into command and arguments
   */
  parseCommand(commandString) {
    const parts = commandString.trim().split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);
    
    return { cmd, args };
  }
  
  /**
   * Show help information
   */
  async showHelp(args) {
    if (args.length > 0) {
      const command = args[0].toLowerCase();
      if (this.allCommands[command]) {
        this.showCommandHelp(command);
      } else {
        this.terminal.writeError(`Unknown command: ${command}`);
      }
      return;
    }
    
    this.terminal.writeInfo("Claude Code Console Commands:");
    this.terminal.writeLine("");
    
    this.terminal.writeInfo("Built-in Commands:");
    Object.keys(this.builtinCommands).forEach(cmd => {
      this.terminal.writeLine(`  ${cmd.padEnd(12)} - ${this.getCommandDescription(cmd)}`);
    });
    
    this.terminal.writeLine("");
    this.terminal.writeInfo("Claude Flow Commands:");
    Object.keys(this.claudeFlowCommands).forEach(cmd => {
      this.terminal.writeLine(`  ${cmd.padEnd(12)} - ${this.getCommandDescription(cmd)}`);
    });
    
    this.terminal.writeLine("");
    this.terminal.writeInfo("Use \"help <command>\" for detailed information about a specific command.");
    this.terminal.writeInfo("Use Ctrl+L to clear console, Ctrl+C to interrupt, Tab for autocomplete.");
  }
  
  /**
   * Get command description
   */
  getCommandDescription(command) {
    const descriptions = {
      "help": "Show help information",
      "clear": "Clear console output",
      "status": "Show connection and system status",
      "connect": "Connect to Claude Code server",
      "disconnect": "Disconnect from server",
      "tools": "List available tools",
      "health": "Check server health",
      "history": "Show command history",
      "export": "Export session data",
      "theme": "Change console theme",
      "version": "Show version information",
      "claude-flow": "Execute Claude Flow commands",
      "swarm": "Manage and execute swarms",
      "init": "Initialize new project",
      "config": "Manage configuration",
      "memory": "Manage memory and data",
      "agents": "Manage agents",
      "benchmark": "Run benchmarks",
      "sparc": "Execute SPARC mode commands"
    };
    
    return descriptions[command] || "No description available";
  }
  
  /**
   * Show detailed command help
   */
  showCommandHelp(command) {
    const helpText = {
      "help": `
Usage: help [command]
Show help information for all commands or a specific command.

Examples:
  help              - Show all commands
  help claude-flow  - Show help for claude-flow command`,
      
      "clear": `
Usage: clear
Clear the console output. You can also use Ctrl+L.`,
      
      "connect": `
Usage: connect [url] [token]
Connect to Claude Code server.

Arguments:
  url     - WebSocket URL (default: ws://localhost:3000/ws)
  token   - Authentication token (optional)

Examples:
  connect
  connect ws://localhost:3000/ws
  connect ws://localhost:3000/ws my-auth-token`,
      
      "claude-flow": `
Usage: claude-flow <subcommand> [options]
Execute Claude Flow commands.

Subcommands:
  start [mode]     - Start Claude Flow in specified mode
  stop             - Stop Claude Flow
  status           - Show Claude Flow status
  modes            - List available SPARC modes
  
Examples:
  claude-flow start coder
  claude-flow status
  claude-flow modes`,
      
      "swarm": `
Usage: swarm <action> [options]
Manage and execute swarms.

Actions:
  create <name>    - Create new swarm
  start <name>     - Start existing swarm
  stop <name>      - Stop running swarm
  list             - List all swarms
  status <name>    - Show swarm status
  
Examples:
  swarm create my-swarm
  swarm start my-swarm
  swarm list`
    };
    
    if (helpText[command]) {
      this.terminal.writeInfo(helpText[command].trim());
    } else {
      this.terminal.writeInfo(`No detailed help available for: ${command}`);
    }
  }
  
  /**
   * Clear console
   */
  async clearConsole() {
    this.terminal.clear();
    this.terminal.writeSuccess("Console cleared");
  }
  
  /**
   * Show status
   */
  async showStatus() {
    const wsStatus = this.wsClient.getStatus();
    const terminalStats = this.terminal.getStats();
    
    this.terminal.writeInfo("System Status:");
    this.terminal.writeLine("");
    
    this.terminal.writeInfo("Connection:");
    this.terminal.writeLine(`  Status: ${wsStatus.connected ? "Connected" : "Disconnected"}`);
    this.terminal.writeLine(`  URL: ${wsStatus.url || "Not set"}`);
    this.terminal.writeLine(`  Reconnect attempts: ${wsStatus.reconnectAttempts}`);
    this.terminal.writeLine(`  Queued messages: ${wsStatus.queuedMessages}`);
    this.terminal.writeLine(`  Pending requests: ${wsStatus.pendingRequests}`);
    
    this.terminal.writeLine("");
    this.terminal.writeInfo("Terminal:");
    this.terminal.writeLine(`  Total lines: ${terminalStats.totalLines}`);
    this.terminal.writeLine(`  History size: ${terminalStats.historySize}`);
    this.terminal.writeLine(`  Input locked: ${terminalStats.isLocked}`);
    this.terminal.writeLine(`  Current prompt: ${terminalStats.currentPrompt}`);
    
    if (wsStatus.connected) {
      try {
        const healthStatus = await this.wsClient.getHealthStatus();
        this.terminal.writeLine("");
        this.terminal.writeInfo("Server Health:");
        this.terminal.writeLine(`  Status: ${healthStatus.healthy ? "Healthy" : "Unhealthy"}`);
        
        if (healthStatus.metrics) {
          Object.entries(healthStatus.metrics).forEach(([key, value]) => {
            this.terminal.writeLine(`  ${key}: ${value}`);
          });
        }
      } catch (error) {
        this.terminal.writeWarning("Failed to get server health status");
      }
    }
  }
  
  /**
   * Connect to server
   */
  async connectToServer(args) {
    const url = args[0] || "ws://localhost:3000/ws";
    const token = args[1] || "";
    
    this.terminal.writeInfo(`Connecting to ${url}...`);
    
    try {
      await this.wsClient.connect(url, token);
      
      // Initialize session
      await this.wsClient.initializeSession();
      
      this.terminal.writeSuccess("Connected successfully");
      this.terminal.setPrompt("claude-flow>");
    } catch (error) {
      this.terminal.writeError(`Connection failed: ${error.message}`);
    }
  }
  
  /**
   * Disconnect from server
   */
  async disconnectFromServer() {
    this.wsClient.disconnect();
    this.terminal.writeSuccess("Disconnected from server");
    this.terminal.setPrompt("offline>");
  }
  
  /**
   * List available tools
   */
  async listTools() {
    if (!this.wsClient.isConnected) {
      this.terminal.writeError("Not connected to server");
      return;
    }
    
    try {
      const tools = await this.wsClient.getAvailableTools();
      
      this.terminal.writeInfo("Available Tools:");
      this.terminal.writeLine("");
      
      if (tools && tools.length > 0) {
        tools.forEach(tool => {
          this.terminal.writeLine(`  ${tool.name.padEnd(20)} - ${tool.description || "No description"}`);
        });
      } else {
        this.terminal.writeWarning("No tools available");
      }
    } catch (error) {
      this.terminal.writeError(`Failed to list tools: ${error.message}`);
    }
  }
  
  /**
   * Check server health
   */
  async checkHealth() {
    if (!this.wsClient.isConnected) {
      this.terminal.writeError("Not connected to server");
      return;
    }
    
    try {
      const health = await this.wsClient.getHealthStatus();
      
      if (health.healthy) {
        this.terminal.writeSuccess("Server is healthy");
      } else {
        this.terminal.writeError(`Server is unhealthy: ${health.error || "Unknown error"}`);
      }
      
      if (health.metrics) {
        this.terminal.writeLine("");
        this.terminal.writeInfo("Metrics:");
        Object.entries(health.metrics).forEach(([key, value]) => {
          this.terminal.writeLine(`  ${key}: ${value}`);
        });
      }
    } catch (error) {
      this.terminal.writeError(`Health check failed: ${error.message}`);
    }
  }
  
  /**
   * Show command history
   */
  async showHistory() {
    const history = this.terminal.history;
    
    if (history.length === 0) {
      this.terminal.writeInfo("No command history");
      return;
    }
    
    this.terminal.writeInfo("Command History:");
    history.forEach((cmd, index) => {
      this.terminal.writeLine(`  ${(index + 1).toString().padStart(3)}: ${cmd}`);
    });
  }
  
  /**
   * Export session data
   */
  async exportSession(args) {
    const format = args[0] || "json";
    
    const sessionData = {
      timestamp: new Date().toISOString(),
      terminal: this.terminal.exportHistory(),
      history: this.terminal.history,
      status: this.wsClient.getStatus()
    };
    
    if (format === "json") {
      const blob = new Blob([JSON.stringify(sessionData, null, 2)], { type: "application/json" });
      this.downloadFile(blob, `console-session-${Date.now()}.json`);
      this.terminal.writeSuccess("Session exported as JSON");
    } else {
      this.terminal.writeError(`Unsupported export format: ${format}`);
    }
  }
  
  /**
   * Change theme
   */
  async changeTheme(args) {
    const theme = args[0];
    const validThemes = ["dark", "light", "classic", "matrix"];
    
    if (!theme) {
      this.terminal.writeInfo(`Available themes: ${validThemes.join(", ")}`);
      return;
    }
    
    if (!validThemes.includes(theme)) {
      this.terminal.writeError(`Invalid theme: ${theme}`);
      return;
    }
    
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("console_theme", theme);
    this.terminal.writeSuccess(`Theme changed to: ${theme}`);
  }
  
  /**
   * Show version information
   */
  async showVersion() {
    this.terminal.writeInfo("Claude Code Console v1.0.0");
    this.terminal.writeLine("Part of Claude Code CLI tool");
    this.terminal.writeLine("Built with modern web technologies");
  }
  
  /**
   * Execute Claude Flow command
   */
  async executeClaudeFlow(args) {
    if (!this.wsClient.isConnected) {
      this.terminal.writeError("Not connected to server");
      return;
    }
    
    if (args.length === 0) {
      this.terminal.writeError("Usage: claude-flow <subcommand> [options]");
      return;
    }
    
    const subcommand = args[0];
    const subArgs = args.slice(1);
    
    try {
      const result = await this.wsClient.executeCommand("claude-flow", {
        subcommand,
        args: subArgs
      });
      
      this.terminal.writeSuccess(`Claude Flow ${subcommand} executed successfully`);
      if (result && result.output) {
        this.terminal.writeLine(result.output);
      }
    } catch (error) {
      this.terminal.writeError(`Claude Flow command failed: ${error.message}`);
    }
  }
  
  /**
   * Execute swarm command
   */
  async executeSwarm(args) {
    if (!this.wsClient.isConnected) {
      this.terminal.writeError("Not connected to server");
      return;
    }
    
    // Implementation would call the swarm coordination system
    this.terminal.writeWarning("Swarm commands not yet implemented in web console");
  }
  
  /**
   * Initialize project
   */
  async initializeProject(args) {
    if (!this.wsClient.isConnected) {
      this.terminal.writeError("Not connected to server");
      return;
    }
    
    this.terminal.writeWarning("Project initialization not yet implemented in web console");
  }
  
  /**
   * Manage configuration
   */
  async manageConfig(args) {
    this.terminal.writeInfo("Use the Settings panel (⚙️ button) to manage configuration");
  }
  
  /**
   * Manage memory
   */
  async manageMemory(args) {
    if (!this.wsClient.isConnected) {
      this.terminal.writeError("Not connected to server");
      return;
    }
    
    this.terminal.writeWarning("Memory management not yet implemented in web console");
  }
  
  /**
   * Manage agents
   */
  async manageAgents(args) {
    if (!this.wsClient.isConnected) {
      this.terminal.writeError("Not connected to server");
      return;
    }
    
    this.terminal.writeWarning("Agent management not yet implemented in web console");
  }
  
  /**
   * Run benchmark
   */
  async runBenchmark(args) {
    if (!this.wsClient.isConnected) {
      this.terminal.writeError("Not connected to server");
      return;
    }
    
    this.terminal.writeWarning("Benchmarking not yet implemented in web console");
  }
  
  /**
   * Execute SPARC mode
   */
  async executeSparc(args) {
    if (!this.wsClient.isConnected) {
      this.terminal.writeError("Not connected to server");
      return;
    }
    
    if (args.length === 0) {
      this.terminal.writeInfo("Available SPARC modes:");
      const modes = ["coder", "architect", "analyzer", "researcher", "reviewer", 
                    "tester", "debugger", "documenter", "optimizer", "designer"];
      modes.forEach(mode => {
        this.terminal.writeLine(`  ${mode}`);
      });
      return;
    }
    
    this.terminal.writeWarning("SPARC mode execution not yet implemented in web console");
  }
  
  /**
   * Execute remote command via WebSocket
   */
  async executeRemoteCommand(command, args) {
    if (!this.wsClient.isConnected) {
      this.terminal.writeError("Not connected to server. Use \"connect\" command first.");
      return;
    }
    
    try {
      this.terminal.writeInfo(`Executing remote command: ${command}`);
      
      const result = await this.wsClient.executeCommand(command, { args });
      
      if (result && result.output) {
        this.terminal.writeLine(result.output);
      } else {
        this.terminal.writeSuccess("Command executed successfully");
      }
    } catch (error) {
      this.terminal.writeError(`Remote command failed: ${error.message}`);
    }
  }
  
  /**
   * Download file helper
   */
  downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  
  /**
   * Get command suggestions
   */
  getCommandSuggestions(input) {
    const allCommands = Object.keys(this.allCommands);
    return allCommands.filter(cmd => cmd.startsWith(input.toLowerCase()));
  }
  
  /**
   * Check if command exists
   */
  hasCommand(command) {
    return this.allCommands.hasOwnProperty(command.toLowerCase());
  }
}