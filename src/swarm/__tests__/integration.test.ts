import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
import { PromptManager } from "../prompt-manager";
import { PromptConfigManager } from "../prompt-utils";

describe('Prompt Copying Integration Tests', () => {
  let tempDir: string;
  let testManager: PromptManager;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'integration-test-'));
    
    // Create test structure
    const sourceDir = path.join(tempDir, 'source');
    const destDir = path.join(tempDir, 'dest');
    
    await fs.mkdir(sourceDir, { recursive: true });
    await fs.mkdir(destDir, { recursive: true });
    
    // Create test files
    await createTestPromptStructure(sourceDir);
    
    // Verify directories exist before continuing
    await fs.access(sourceDir);
    await fs.access(destDir);
    
    // Initialize manager with absolute paths for testing
    testManager = new PromptManager({
      basePath: tempDir,
      configPath: '.test-config.json',
      autoDiscovery: false
    });
    
    // Configure manager with absolute paths
    await testManager.updateConfig({
      sourceDirectories: [sourceDir], // Use absolute path
      destinationDirectory: destDir   // Use absolute path
    });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  async function createTestPromptStructure(sourceDir: string) {
    const structure = {
      'sparc/architect.md': '# Architect\nSystem design expert.',
      'sparc/tdd.md': '# TDD\nTest-driven development.',
      'sparc/code.md': '# Code\nImplementation expert.',
      'templates/api.md': '# API Template\n{{endpoint}}',
      'rules/general.md': '# Rules\nGeneral guidelines.',
      'invalid.md': '', // Empty file for validation testing
      'large.md': 'Large content\n'.repeat(100)
    };

    for (const [filePath, content] of Object.entries(structure)) {
      const fullPath = path.join(sourceDir, filePath);
      const dir = path.dirname(fullPath);
      
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(fullPath, content);
    }
  }

  test('should initialize and auto-discover prompt directories', async () => {
    const discoveryManager = new PromptManager({
      basePath: tempDir,
      autoDiscovery: true
    });

    await discoveryManager.initialize();
    
    const config = discoveryManager.getConfig();
    expect(config.sourceDirectories.length).toBeGreaterThan(0);
  });

  test('should copy prompts using different profiles', async () => {
    await testManager.initialize();
    
    // Test with safe profile
    const safeResult = await testManager.copyPrompts({
      conflictResolution: 'skip',
      parallel: false
    });
    
    expect(safeResult.success).toBe(true);
    expect(safeResult.copiedFiles).toBeGreaterThan(0);
    
    // Verify files exist
    const destFiles = await fs.readdir(path.join(tempDir, 'dest'), { recursive: true });
    expect(destFiles.length).toBeGreaterThan(0);
  });

  test('should validate prompts and generate reports', async () => {
    await testManager.initialize();
    
    // Copy files first - disable parallel for testing
    await testManager.copyPrompts({
      parallel: false
    });
    
    // Validate prompts
    const validation = await testManager.validatePrompts();
    
    expect(validation.totalFiles).toBeGreaterThan(0);
    expect(validation.validFiles).toBeGreaterThan(0);
    expect(validation.invalidFiles).toBeGreaterThan(0); // Should find the empty file
    
    // Check that empty file is flagged as invalid
    const emptyFileIssue = validation.issues.find(issue => 
      issue.file.includes('invalid.md')
    );
    expect(emptyFileIssue).toBeDefined();
    expect(emptyFileIssue!.issues).toContain('File is empty');
  });

  test('should handle multiple sources', async () => {
    // Create second source
    const sourceDir = path.join(tempDir, 'source');
    const source2Dir = path.join(tempDir, 'source2');
    const destDir = path.join(tempDir, 'dest');
    
    await fs.mkdir(source2Dir, { recursive: true });
    await fs.writeFile(path.join(source2Dir, 'extra.md'), '# Extra\nExtra prompt.');
    
    // Verify directory exists
    await fs.access(source2Dir);
    
    // Update config with absolute paths
    await testManager.updateConfig({
      sourceDirectories: [sourceDir, source2Dir],
      destinationDirectory: destDir
    });
    
    await testManager.initialize();
    
    // Copy from multiple sources (disable parallel for testing)
    const results = await testManager.copyFromMultipleSources({
      parallel: false
    });
    
    expect(results.length).toBe(2);
    expect(results.every(r => r.success)).toBe(true);
    
    // Verify files from both sources
    const destFiles = await fs.readdir(destDir, { recursive: true });
    expect(destFiles).toContain('extra.md');
  });

  test('should generate comprehensive system report', async () => {
    await testManager.initialize();
    await testManager.copyPrompts({
      parallel: false
    });
    
    const report = await testManager.generateReport();
    
    expect(report.configuration).toBeDefined();
    expect(report.sources).toBeDefined();
    expect(report.sources.length).toBeGreaterThan(0);
    
    // Check source analysis
    const sourceInfo = report.sources[0];
    expect(sourceInfo.exists).toBe(true);
    expect(sourceInfo.fileCount).toBeGreaterThan(0);
    expect(sourceInfo.totalSize).toBeGreaterThan(0);
  });

  test('should handle configuration persistence', async () => {
    const configManager = new PromptConfigManager(
      path.join(tempDir, '.test-config.json')
    );
    
    // Save custom config
    await configManager.saveConfig({
      destinationDirectory: './custom-dest',
      defaultOptions: {
        maxWorkers: 8,
        conflictResolution: 'merge'
      }
    });
    
    // Load config in new instance
    const newConfigManager = new PromptConfigManager(
      path.join(tempDir, '.test-config.json')
    );
    
    const config = await newConfigManager.loadConfig();
    
    expect(config.destinationDirectory).toBe('./custom-dest');
    expect(config.defaultOptions.maxWorkers).toBe(8);
    expect(config.defaultOptions.conflictResolution).toBe('merge');
  });

  test('should handle errors gracefully', async () => {
    // Test with invalid source directory
    const nonExistentDir = path.join(tempDir, 'nonexistent');
    const destDir = path.join(tempDir, 'dest');
    
    await testManager.updateConfig({
      sourceDirectories: [nonExistentDir],
      destinationDirectory: destDir
    });
    
    await testManager.initialize();
    
    // Should not throw but return failed result
    const result = await testManager.copyPrompts();
    
    // The result should indicate failure or no files copied
    expect(result.copiedFiles).toBe(0);
  });

  test('should support incremental sync', async () => {
    await testManager.initialize();
    
    // Initial copy - disable parallel for testing
    const firstResult = await testManager.copyPrompts({
      parallel: false
    });
    expect(firstResult.success).toBe(true);
    
    // Modify source file
    const sourceFile = path.join(tempDir, 'source', 'sparc', 'architect.md');
    await fs.writeFile(sourceFile, '# Modified Architect\nUpdated content.');
    
    // Sync should detect changes
    const syncResult = await testManager.syncPrompts({
      incrementalOnly: true,
      compareHashes: true
    });
    
    expect(syncResult.forward.success).toBe(true);
  });

  test('should respect include/exclude patterns', async () => {
    await testManager.initialize();
    
    // Debug: Check source files
    const sourceDir = path.join(tempDir, 'source');
    const sourceFiles = await fs.readdir(sourceDir, { recursive: true });
    console.log('Source files:', sourceFiles);
    
    // Copy only .md files from sparc directory
    const result = await testManager.copyPrompts({
      includePatterns: ['sparc/*.md'],  // Simplified pattern
      excludePatterns: ['**/tdd.md'],
      parallel: false
    });
    
    expect(result.success).toBe(true);
    expect(result.copiedFiles).toBeGreaterThan(0);
    
    // Debug: Check what was actually copied
    const destFiles = await fs.readdir(path.join(tempDir, 'dest'), { recursive: true });
    console.log('Copied files:', destFiles);
    console.log('Copy result:', result);
    
    // Check that only architect.md and code.md were copied to sparc directory
    const sparcDir = path.join(tempDir, 'dest', 'sparc');
    try {
      const sparcFiles = await fs.readdir(sparcDir);
      expect(sparcFiles).toContain('architect.md');
      expect(sparcFiles).toContain('code.md');
      expect(sparcFiles).not.toContain('tdd.md');
    } catch (error) {
      // If directory doesn't exist, fail with more helpful error
      console.error('Sparc directory not found:', sparcDir);
      console.error('Available files:', destFiles);
      throw error;
    }
  });

  test('should handle concurrent operations', async () => {
    await testManager.initialize();
    
    // Start multiple copy operations - disable parallel for testing
    const operations = [
      testManager.copyPrompts({ destination: path.join(tempDir, 'dest1'), parallel: false }),
      testManager.copyPrompts({ destination: path.join(tempDir, 'dest2'), parallel: false }),
      testManager.copyPrompts({ destination: path.join(tempDir, 'dest3'), parallel: false })
    ];
    
    const results = await Promise.all(operations);
    
    // All operations should succeed
    expect(results.every(r => r.success)).toBe(true);
    
    // Verify all destinations have files
    for (let i = 1; i <= 3; i++) {
      const destDir = path.join(tempDir, `dest${i}`);
      const files = await fs.readdir(destDir, { recursive: true });
      expect(files.length).toBeGreaterThan(0);
    }
  });
});