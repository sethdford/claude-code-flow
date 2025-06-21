#!/usr/bin/env node

/**
 * Root Directory Cleanup Script
 * Removes temporary files and artifacts that shouldn't be in the repository
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMP_PATTERNS = [
  // Status and output files
  'status_*.txt',
  '*-output.txt',
  '*-test.txt',
  
  // Test artifacts
  'hello-world*.js',
  'hello-world*.json',
  'test-*.js',
  '*-integration.js',
  
  // Analysis files
  '*-analysis.md',
  'linter-error-analysis.md',
  'lint-errors.log',
  
  // History and temp files
  '.claude-flow-history',
  '*.tmp',
  '*.temp',
  
  // Config files that should be generated
  'claude-flow.config.json',
];

const TEMP_DIRECTORIES = [
  'swarm-runs',
];

function matchesPattern(filename, pattern) {
  // Convert glob pattern to regex
  const regexPattern = pattern
    .replace(/\./g, '\\.')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  
  return new RegExp(`^${regexPattern}$`).test(filename);
}

function cleanupRoot() {
  // Go to project root (parent of scripts directory)
  const rootDir = path.dirname(__dirname);
  process.chdir(rootDir);
  
  console.log(`🧹 Cleaning up root directory: ${rootDir}`);
  
  let removedCount = 0;
  
  // Get all files in root directory
  const items = fs.readdirSync(rootDir);
  
  for (const item of items) {
    const itemPath = path.join(rootDir, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isFile()) {
      // Check if file matches any temp pattern
      for (const pattern of TEMP_PATTERNS) {
        if (matchesPattern(item, pattern)) {
          try {
            fs.unlinkSync(itemPath);
            console.log(`  ✅ Removed file: ${item}`);
            removedCount++;
            break;
          } catch (error) {
            console.log(`  ❌ Failed to remove ${item}: ${error.message}`);
          }
        }
      }
    } else if (stat.isDirectory()) {
      // Check if directory matches temp patterns
      for (const pattern of TEMP_DIRECTORIES) {
        if (matchesPattern(item, pattern)) {
          try {
            fs.rmSync(itemPath, { recursive: true, force: true });
            console.log(`  ✅ Removed directory: ${item}/`);
            removedCount++;
            break;
          } catch (error) {
            console.log(`  ❌ Failed to remove ${item}/: ${error.message}`);
          }
        }
      }
    }
  }
  
  if (removedCount === 0) {
    console.log(`  ✨ Root directory is already clean!`);
  } else {
    console.log(`  🎉 Cleanup complete! Removed ${removedCount} items.`);
  }
}

// Run cleanup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanupRoot();
}

export { cleanupRoot }; 