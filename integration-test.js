#!/usr/bin/env node

/**
 * Claude Code Flow Integration Test
 * Demonstrates integration between new commands and existing swarm/task/workflow systems
 */

import { execSync } from 'child_process';
import chalk from 'chalk';

console.log(chalk.cyan.bold('\n🧪 Claude Code Flow Integration Test\n'));

const tests = [
  {
    name: 'Meta-Frameworks Integration',
    description: 'Test meta-frameworks with swarm coordination',
    commands: [
      'claude-flow meta-frameworks list',
      'claude-flow meta-frameworks info code-review-game',
      'claude-flow swarm "Review authentication module code" --strategy development --dry-run'
    ]
  },
  {
    name: 'Orchestration Integration', 
    description: 'Test orchestration with task workflows',
    commands: [
      'claude-flow orchestration list',
      'claude-flow orchestration info swarm-intelligence',
      'claude-flow task create workflow "Multi-agent code analysis"'
    ]
  },
  {
    name: 'Startup Integration',
    description: 'Test startup capabilities with swarm strategies',
    commands: [
      'claude-flow startup check',
      'claude-flow startup info metaclaude',
      'claude-flow swarm-strategies research'
    ]
  },
  {
    name: 'Synthesis Integration',
    description: 'Test synthesis with workflow patterns',
    commands: [
      'claude-flow synthesis list',
      'claude-flow synthesis patterns authentication',
      'claude-flow workflow list'
    ]
  },
  {
    name: 'Cross-System Integration',
    description: 'Test full system integration',
    commands: [
      'claude-flow swarm "Implement user authentication with JWT" --strategy development --dry-run',
      'claude-flow meta-frameworks run feature-discovery "JWT authentication system"',
      'claude-flow synthesis evolve security-patterns'
    ]
  }
];

let passed = 0;
let failed = 0;

for (const test of tests) {
  console.log(chalk.yellow.bold(`\n🔧 ${test.name}`));
  console.log(chalk.gray(`   ${test.description}\n`));
  
  for (const command of test.commands) {
    try {
      console.log(chalk.blue(`   Running: ${command}`));
      const result = execSync(command, { 
        encoding: 'utf8', 
        timeout: 10000,
        stdio: 'pipe'
      });
      
      if (result.includes('Error:') || result.includes('error:') || result.includes('Failed:')) {
        console.log(chalk.red('   ❌ Failed with error in output'));
        failed++;
      } else {
        console.log(chalk.green('   ✅ Passed'));
        passed++;
      }
    } catch (error) {
      console.log(chalk.red(`   ❌ Failed: ${error.message}`));
      failed++;
    }
  }
}

console.log(chalk.cyan.bold('\n📊 Integration Test Results'));
console.log(chalk.green(`✅ Passed: ${passed}`));
console.log(chalk.red(`❌ Failed: ${failed}`));
console.log(chalk.blue(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`));

if (failed === 0) {
  console.log(chalk.green.bold('\n🎉 All integration tests passed! Systems are properly connected.\n'));
} else {
  console.log(chalk.yellow.bold('\n⚠️  Some integration tests failed. Check system connections.\n'));
} 