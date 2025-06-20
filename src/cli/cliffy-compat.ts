/**
 * Compatibility layer for @cliffy imports
 * This provides Node.js equivalents for @cliffy modules that may be imported but not used
 */

import { Command as CommanderCommand } from "commander";
import chalk from "chalk";
import Table from "cli-table3";
import inquirer from "inquirer";

// Type definitions for compatibility
export interface TableOptions {
  head?: string[];
  style?: {
    head?: string[];
    border?: string[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface SelectOption {
  name: string;
  value: string | number | boolean;
}

export interface SelectPromptOptions {
  message: string;
  options: SelectOption[];
}

export interface ConfirmPromptOptions {
  message: string;
  default?: boolean;
}

export interface InputPromptOptions {
  message: string;
  default?: string;
}

export interface NumberPromptOptions {
  message: string;
  min?: number;
  max?: number;
  default?: number;
}

// @cliffy/command compatibility
export class Command extends CommanderCommand {
  showHelp(): void {
    this.help();
  }
  
  render() {
    // Compatibility method, does nothing
  }
  
  header(_headers: string[]) {
    // For table compatibility, this is handled in the Table wrapper
    return this;
  }
  
  border(_enable: boolean) {
    // For table compatibility, this is handled in the Table wrapper  
    return this;
  }
}

// @cliffy/ansi/colors compatibility
export const colors = {
  red: chalk.red,
  green: chalk.green,
  blue: chalk.blue,
  yellow: chalk.yellow,
  cyan: chalk.cyan,
  gray: chalk.gray,
  grey: chalk.gray,
  white: chalk.white,
  black: chalk.black,
  bold: chalk.bold,
  dim: chalk.dim,
  reset: "",
};

// @cliffy/table compatibility - wrap cli-table3 with @cliffy-like API
export class TableCompat extends Table {
  constructor(options?: TableOptions) {
    super({
      head: [],
      style: { head: [], border: [] },
      ...options,
    });
  }
  
  header(headers: string[]) {
    const opts = this.options as { head?: string[] };
    opts.head = headers;
    return this;
  }
  
  border(_enable: boolean) {
    // cli-table3 always has borders, just return this for compatibility
    return this;
  }
  
  render() {
    return this.toString();
  }
}

// @cliffy/prompt compatibility
export const Confirm = {
  async prompt(options: ConfirmPromptOptions) {
    const answers = await inquirer.prompt([{
      type: "confirm",
      name: "confirmed",
      message: options.message,
      default: options.default ?? false,
    }]);
    return answers.confirmed as boolean;
  },
};

export const Select = {
  async prompt(options: SelectPromptOptions) {
    const answers = await inquirer.prompt([{
      type: "list",
      name: "selected",
      message: options.message,
      choices: options.options,
    }]);
    return answers.selected as SelectOption["value"];
  },
};

export const Input = {
  async prompt(options: InputPromptOptions) {
    const answers = await inquirer.prompt([{
      type: "input",
      name: "input",
      message: options.message,
      default: options.default,
    }]);
    return answers.input as string;
  },
};

export const Number = {
  async prompt(options: NumberPromptOptions) {
    const answers = await inquirer.prompt([{
      type: "number",
      name: "number",
      message: options.message,
      default: options.default,
      validate: (input: number) => {
        if (options.min !== undefined && input < options.min) {
          return `Please enter a number >= ${options.min}`;
        }
        if (options.max !== undefined && input > options.max) {
          return `Please enter a number <= ${options.max}`;
        }
        return true;
      },
    }]);
    return answers.number as number;
  },
};



// Export everything for easy importing
export { TableCompat as Table };
export default {
  Command,
  colors,
  Table: TableCompat,
  Confirm,
  Select,
  Input,
  Number,
};