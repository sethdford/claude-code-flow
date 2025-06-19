#!/usr/bin/env node
/**
 * Create SEA (Single Executable Application) binaries for multiple platforms
 * This is a simplified version that works with Node.js SEA
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// Ensure bin directory exists
const binDir = path.join(projectRoot, 'bin');
if (!fs.existsSync(binDir)) {
  fs.mkdirSync(binDir, { recursive: true });
}

console.log('🔨 Creating SEA binaries...');

// Detect current platform
const platform = process.platform;
const arch = process.arch;

console.log(`📦 Building for current platform: ${platform}-${arch}...`);

try {
  const outputPath = path.join(binDir, platform === 'win32' ? 'claude-flow.exe' : 'claude-flow');
  
  // Copy Node.js executable
  const nodeExe = process.execPath;
  console.log(`   📋 Copying Node.js from: ${nodeExe}`);
  fs.copyFileSync(nodeExe, outputPath);
  
  // Make writable for modification
  fs.chmodSync(outputPath, '755');
  
  // Remove signature (macOS only)
  if (platform === 'darwin') {
    try {
      execSync(`codesign --remove-signature "${outputPath}"`, { stdio: 'ignore' });
      console.log('   🔓 Removed macOS code signature');
    } catch (e) {
      console.log('   ⚠️  Could not remove signature (codesign not available)');
    }
  }
  
  // Inject the blob using postject
  const blobPath = path.join(projectRoot, 'dist', 'sea-prep.blob');
  
  let postjectCmd = `npx postject "${outputPath}" NODE_SEA_BLOB "${blobPath}" --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2`;
  
  // Add macOS-specific flag
  if (platform === 'darwin') {
    postjectCmd += ' --macho-segment-name NODE_SEA';
  }
  
  console.log('   💉 Injecting SEA blob...');
  execSync(postjectCmd, { stdio: 'inherit' });
  
  // Re-sign (macOS only)
  if (platform === 'darwin') {
    try {
      execSync(`codesign --sign - "${outputPath}"`, { stdio: 'ignore' });
      console.log('   ✍️  Re-signed macOS binary');
    } catch (e) {
      console.log('   ⚠️  Could not re-sign binary (codesign not available)');
    }
  }
  
  // Make executable (Unix-like systems)
  if (platform !== 'win32') {
    fs.chmodSync(outputPath, '755');
  }
  
  console.log(`   ✅ ${path.basename(outputPath)} created successfully`);
  
  // Show file size
  const stats = fs.statSync(outputPath);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(1);
  console.log(`   📏 Binary size: ${sizeMB} MB`);
  
} catch (error) {
  console.error(`   ❌ Failed to create binary:`, error.message);
  process.exit(1);
}

console.log('🎉 SEA binary creation complete!');
console.log(`\n💡 To test the binary, run: ./bin/${platform === 'win32' ? 'claude-flow.exe' : 'claude-flow'} --version`); 