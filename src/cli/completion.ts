/**
 * Shell completion generator for Claude-Flow CLI
 */

import { promises as fs } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";

export class CompletionGenerator {
  async generate(shell: string = "detect", install: boolean = false): Promise<void> {
    // Auto-detect shell if not specified
    if (shell === "detect") {
      shell = this.detectShell();
    }

    const script = this.generateScript(shell);
    
    if (install) {
      await this.installScript(shell, script);
      console.log(`✅ Completion script installed for ${shell}`);
    } else {
      console.log(script);
    }
  }

  private detectShell(): string {
    const shell = process.env.SHELL ?? "";
    
    if (shell.includes("bash")) return "bash";
    if (shell.includes("zsh")) return "zsh";
    if (shell.includes("fish")) return "fish";
    
    // Default to bash
    return "bash";
  }

  private generateScript(shell: string): string {
    switch (shell.toLowerCase()) {
      case "bash":
        return this.generateBashScript();
      case "zsh":
        return this.generateZshScript();
      case "fish":
        return this.generateFishScript();
      default:
        throw new Error(`Unsupported shell: ${shell}`);
    }
  }

  private generateBashScript(): string {
    return `# Claude-Flow bash completion script
_claude_flow_completions() {
    local cur prev opts
    COMPREPLY=()
    cur="\${COMP_WORDS[COMP_CWORD]}"
    prev="\${COMP_WORDS[COMP_CWORD-1]}"

    # Main commands
    local commands="start stop restart status monitor agent task memory config session workflow help version completion repl"
    
    # Start subcommands
    local start_commands="swarm mcp server ui"
    
    # Agent subcommands
    local agent_commands="create list remove status update"
    
    # Task subcommands
    local task_commands="create list complete cancel status update"
    
    # Memory subcommands
    local memory_commands="store retrieve list clear export import"
    
    # Session subcommands
    local session_commands="create list remove export import status"
    
    # Workflow subcommands
    local workflow_commands="create run list status export import"

    case \${COMP_CWORD} in
        1)
            COMPREPLY=( \$(compgen -W "\${commands}" -- \${cur}) )
            return 0
            ;;
        2)
            case "\${prev}" in
                start)
                    COMPREPLY=( \$(compgen -W "\${start_commands}" -- \${cur}) )
                    return 0
                    ;;
                agent)
                    COMPREPLY=( \$(compgen -W "\${agent_commands}" -- \${cur}) )
                    return 0
                    ;;
                task)
                    COMPREPLY=( \$(compgen -W "\${task_commands}" -- \${cur}) )
                    return 0
                    ;;
                memory)
                    COMPREPLY=( \$(compgen -W "\${memory_commands}" -- \${cur}) )
                    return 0
                    ;;
                session)
                    COMPREPLY=( \$(compgen -W "\${session_commands}" -- \${cur}) )
                    return 0
                    ;;
                workflow)
                    COMPREPLY=( \$(compgen -W "\${workflow_commands}" -- \${cur}) )
                    return 0
                    ;;
            esac
            ;;
    esac

    # Global options
    local global_opts="-c --config -v --verbose -q --quiet --log-level --no-color --json --profile -h --help"
    
    # File completion for config files
    if [[ \${prev} == "-c" || \${prev} == "--config" ]]; then
        COMPREPLY=( \$(compgen -f -- \${cur}) )
        return 0
    fi
    
    # Log level completion
    if [[ \${prev} == "--log-level" ]]; then
        COMPREPLY=( \$(compgen -W "debug info warn error" -- \${cur}) )
        return 0
    fi

    COMPREPLY=( \$(compgen -W "\${global_opts}" -- \${cur}) )
}

complete -F _claude_flow_completions claude-flow
`;
  }

  private generateZshScript(): string {
    return `#compdef claude-flow

# Claude-Flow zsh completion script
_claude_flow() {
    local context state line
    typeset -A opt_args

    _arguments -C \\
        '(-c --config)'{-c,--config}'[Path to configuration file]:config file:_files' \\
        '(-v --verbose)'{-v,--verbose}'[Enable verbose logging]' \\
        '(-q --quiet)'{-q,--quiet}'[Suppress non-essential output]' \\
        '--log-level[Set log level]:level:(debug info warn error)' \\
        '--no-color[Disable colored output]' \\
        '--json[Output in JSON format where applicable]' \\
        '--profile[Use named configuration profile]:profile:' \\
        '(-h --help)'{-h,--help}'[Show help information]' \\
        '1: :_claude_flow_commands' \\
        '*: :_claude_flow_subcommands'
}

_claude_flow_commands() {
    local commands=(
        'start:Start Claude-Flow services'
        'stop:Stop Claude-Flow services'
        'restart:Restart Claude-Flow services'
        'status:Show system status'
        'monitor:Monitor system metrics'
        'agent:Agent management'
        'task:Task management'
        'memory:Memory operations'
        'config:Configuration management'
        'session:Session management'
        'workflow:Workflow management'
        'help:Show help information'
        'version:Show version information'
        'completion:Generate completion scripts'
        'repl:Start interactive REPL'
    )
    _describe 'commands' commands
}

_claude_flow_subcommands() {
    case "\${words[2]}" in
        start)
            local start_commands=(
                'swarm:Start swarm mode'
                'mcp:Start MCP server'
                'server:Start HTTP server'
                'ui:Start web UI'
            )
            _describe 'start commands' start_commands
            ;;
        agent)
            local agent_commands=(
                'create:Create new agent'
                'list:List all agents'
                'remove:Remove agent'
                'status:Show agent status'
                'update:Update agent configuration'
            )
            _describe 'agent commands' agent_commands
            ;;
        task)
            local task_commands=(
                'create:Create new task'
                'list:List all tasks'
                'complete:Mark task as complete'
                'cancel:Cancel task'
                'status:Show task status'
                'update:Update task'
            )
            _describe 'task commands' task_commands
            ;;
        memory)
            local memory_commands=(
                'store:Store data in memory'
                'retrieve:Retrieve data from memory'
                'list:List stored data'
                'clear:Clear memory'
                'export:Export memory data'
                'import:Import memory data'
            )
            _describe 'memory commands' memory_commands
            ;;
        session)
            local session_commands=(
                'create:Create new session'
                'list:List all sessions'
                'remove:Remove session'
                'export:Export session data'
                'import:Import session data'
                'status:Show session status'
            )
            _describe 'session commands' session_commands
            ;;
        workflow)
            local workflow_commands=(
                'create:Create new workflow'
                'run:Run workflow'
                'list:List workflows'
                'status:Show workflow status'
                'export:Export workflow'
                'import:Import workflow'
            )
            _describe 'workflow commands' workflow_commands
            ;;
    esac
}

_claude_flow "\$@"
`;
  }

  private generateFishScript(): string {
    return `# Claude-Flow fish completion script

# Main commands
complete -c claude-flow -f -n '__fish_use_subcommand' -a 'start' -d 'Start Claude-Flow services'
complete -c claude-flow -f -n '__fish_use_subcommand' -a 'stop' -d 'Stop Claude-Flow services'
complete -c claude-flow -f -n '__fish_use_subcommand' -a 'restart' -d 'Restart Claude-Flow services'
complete -c claude-flow -f -n '__fish_use_subcommand' -a 'status' -d 'Show system status'
complete -c claude-flow -f -n '__fish_use_subcommand' -a 'monitor' -d 'Monitor system metrics'
complete -c claude-flow -f -n '__fish_use_subcommand' -a 'agent' -d 'Agent management'
complete -c claude-flow -f -n '__fish_use_subcommand' -a 'task' -d 'Task management'
complete -c claude-flow -f -n '__fish_use_subcommand' -a 'memory' -d 'Memory operations'
complete -c claude-flow -f -n '__fish_use_subcommand' -a 'config' -d 'Configuration management'
complete -c claude-flow -f -n '__fish_use_subcommand' -a 'session' -d 'Session management'
complete -c claude-flow -f -n '__fish_use_subcommand' -a 'workflow' -d 'Workflow management'
complete -c claude-flow -f -n '__fish_use_subcommand' -a 'help' -d 'Show help information'
complete -c claude-flow -f -n '__fish_use_subcommand' -a 'version' -d 'Show version information'
complete -c claude-flow -f -n '__fish_use_subcommand' -a 'completion' -d 'Generate completion scripts'
complete -c claude-flow -f -n '__fish_use_subcommand' -a 'repl' -d 'Start interactive REPL'

# Global options
complete -c claude-flow -s c -l config -d 'Path to configuration file' -r
complete -c claude-flow -s v -l verbose -d 'Enable verbose logging'
complete -c claude-flow -s q -l quiet -d 'Suppress non-essential output'
complete -c claude-flow -l log-level -d 'Set log level' -xa 'debug info warn error'
complete -c claude-flow -l no-color -d 'Disable colored output'
complete -c claude-flow -l json -d 'Output in JSON format where applicable'
complete -c claude-flow -l profile -d 'Use named configuration profile'
complete -c claude-flow -s h -l help -d 'Show help information'

# Start subcommands
complete -c claude-flow -f -n '__fish_seen_subcommand_from start' -a 'swarm' -d 'Start swarm mode'
complete -c claude-flow -f -n '__fish_seen_subcommand_from start' -a 'mcp' -d 'Start MCP server'
complete -c claude-flow -f -n '__fish_seen_subcommand_from start' -a 'server' -d 'Start HTTP server'
complete -c claude-flow -f -n '__fish_seen_subcommand_from start' -a 'ui' -d 'Start web UI'

# Agent subcommands
complete -c claude-flow -f -n '__fish_seen_subcommand_from agent' -a 'create' -d 'Create new agent'
complete -c claude-flow -f -n '__fish_seen_subcommand_from agent' -a 'list' -d 'List all agents'
complete -c claude-flow -f -n '__fish_seen_subcommand_from agent' -a 'remove' -d 'Remove agent'
complete -c claude-flow -f -n '__fish_seen_subcommand_from agent' -a 'status' -d 'Show agent status'
complete -c claude-flow -f -n '__fish_seen_subcommand_from agent' -a 'update' -d 'Update agent configuration'

# Task subcommands
complete -c claude-flow -f -n '__fish_seen_subcommand_from task' -a 'create' -d 'Create new task'
complete -c claude-flow -f -n '__fish_seen_subcommand_from task' -a 'list' -d 'List all tasks'
complete -c claude-flow -f -n '__fish_seen_subcommand_from task' -a 'complete' -d 'Mark task as complete'
complete -c claude-flow -f -n '__fish_seen_subcommand_from task' -a 'cancel' -d 'Cancel task'
complete -c claude-flow -f -n '__fish_seen_subcommand_from task' -a 'status' -d 'Show task status'
complete -c claude-flow -f -n '__fish_seen_subcommand_from task' -a 'update' -d 'Update task'

# Memory subcommands
complete -c claude-flow -f -n '__fish_seen_subcommand_from memory' -a 'store' -d 'Store data in memory'
complete -c claude-flow -f -n '__fish_seen_subcommand_from memory' -a 'retrieve' -d 'Retrieve data from memory'
complete -c claude-flow -f -n '__fish_seen_subcommand_from memory' -a 'list' -d 'List stored data'
complete -c claude-flow -f -n '__fish_seen_subcommand_from memory' -a 'clear' -d 'Clear memory'
complete -c claude-flow -f -n '__fish_seen_subcommand_from memory' -a 'export' -d 'Export memory data'
complete -c claude-flow -f -n '__fish_seen_subcommand_from memory' -a 'import' -d 'Import memory data'

# Session subcommands
complete -c claude-flow -f -n '__fish_seen_subcommand_from session' -a 'create' -d 'Create new session'
complete -c claude-flow -f -n '__fish_seen_subcommand_from session' -a 'list' -d 'List all sessions'
complete -c claude-flow -f -n '__fish_seen_subcommand_from session' -a 'remove' -d 'Remove session'
complete -c claude-flow -f -n '__fish_seen_subcommand_from session' -a 'export' -d 'Export session data'
complete -c claude-flow -f -n '__fish_seen_subcommand_from session' -a 'import' -d 'Import session data'
complete -c claude-flow -f -n '__fish_seen_subcommand_from session' -a 'status' -d 'Show session status'

# Workflow subcommands
complete -c claude-flow -f -n '__fish_seen_subcommand_from workflow' -a 'create' -d 'Create new workflow'
complete -c claude-flow -f -n '__fish_seen_subcommand_from workflow' -a 'run' -d 'Run workflow'
complete -c claude-flow -f -n '__fish_seen_subcommand_from workflow' -a 'list' -d 'List workflows'
complete -c claude-flow -f -n '__fish_seen_subcommand_from workflow' -a 'status' -d 'Show workflow status'
complete -c claude-flow -f -n '__fish_seen_subcommand_from workflow' -a 'export' -d 'Export workflow'
complete -c claude-flow -f -n '__fish_seen_subcommand_from workflow' -a 'import' -d 'Import workflow'
`;
  }

  private async installScript(shell: string, script: string): Promise<void> {
    let paths: string[] = [];
    
    switch (shell.toLowerCase()) {
      case "bash":
        paths = [
          join(homedir(), ".local/share/bash-completion/completions/claude-flow"),
          join(homedir(), ".bash_completion.d/claude-flow"),
        ];
        break;
      case "zsh":
        paths = [
          join(homedir(), ".zsh/completions/_claude-flow"),
        ];
        break;
      case "fish":
        paths = [
          join(homedir(), ".config/fish/completions/claude-flow.fish"),
        ];
        break;
      default:
        throw new Error(`Installation not supported for shell: ${shell}`);
    }

    // Try to install to the first available path
    for (const path of paths) {
      try {
        const dir = dirname(path);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(path, script, "utf-8");
        console.log(`Installed completion script to: ${path}`);
        return;
      } catch (error) {
        console.warn(`Failed to install to ${path}: ${(error as Error).message}`);
      }
    }

    throw new Error(`Failed to install completion script for ${shell}`);
  }
}