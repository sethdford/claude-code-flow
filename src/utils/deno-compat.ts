/**
 * Deno compatibility layer for Node.js
 * Provides Node.js equivalents for Deno APIs
 */

import { homedir, platform } from "node:os";
import { exit } from "node:process";
import { existsSync as fsExistsSync, readFileSync } from "node:fs";
import { isatty } from "node:tty";

// Deno namespace compatibility
export const Deno = {
  // Process control
  exit: (code?: number) => exit(code ?? 0),
  
  // File system
  cwd: () => process.cwd(),
  
  // Environment
  env: {
    get: (key: string) => process.env[key],
    set: (key: string, value: string) => { process.env[key] = value; },
    delete: (key: string) => { delete process.env[key]; },
    toObject: () => ({ ...process.env }),
  },
  
  // Platform info
  build: {
    os: platform() as "darwin" | "linux" | "windows" | "freebsd" | "netbsd" | "aix" | "solaris" | "illumos",
    arch: process.arch as "x86_64" | "aarch64",
  },
  
  // TTY
  isatty: (rid: number) => {
    if (rid === 0) return isatty(0); // stdin
    if (rid === 1) return isatty(1); // stdout
    if (rid === 2) return isatty(2); // stderr
    return false;
  },
  
  // Console dimensions
  consoleSize: () => {
    const { stdout } = process;
    if (stdout && stdout.columns && stdout.rows) {
      return { columns: stdout.columns, rows: stdout.rows };
    }
    return { columns: 80, rows: 24 }; // Default fallback
  },
  
  // Read text file
  readTextFile: async (path: string): Promise<string> => {
    const { promises: fs } = await import("node:fs");
    return fs.readFile(path, "utf-8");
  },
  
  readTextFileSync: (path: string): string => {
    return readFileSync(path, "utf-8");
  },
  
  // Write text file
  writeTextFile: async (path: string, data: string): Promise<void> => {
    const { promises: fs } = await import("node:fs");
    await fs.writeFile(path, data, "utf-8");
  },
  
  writeTextFileSync: (path: string, data: string): void => {
    const { writeFileSync } = require("node:fs");
    writeFileSync(path, data, "utf-8");
  },
  
  // Stats
  stat: async (path: string) => {
    const { promises: fs } = await import("node:fs");
    const stats = await fs.stat(path);
    return {
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
      isSymlink: stats.isSymbolicLink(),
      size: stats.size,
      mtime: stats.mtime,
      atime: stats.atime,
      birthtime: stats.birthtime,
      mode: stats.mode,
      uid: stats.uid,
      gid: stats.gid,
    };
  },
  
  statSync: (path: string) => {
    const { statSync } = require("node:fs");
    const stats = statSync(path);
    return {
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
      isSymlink: stats.isSymbolicLink(),
      size: stats.size,
      mtime: stats.mtime,
      atime: stats.atime,
      birthtime: stats.birthtime,
      mode: stats.mode,
      uid: stats.uid,
      gid: stats.gid,
    };
  },
  
  // Create/remove directories
  mkdir: async (path: string, options?: { recursive?: boolean }) => {
    const { promises: fs } = await import("node:fs");
    await fs.mkdir(path, options);
  },
  
  mkdirSync: (path: string, options?: { recursive?: boolean }) => {
    const { mkdirSync } = require("node:fs");
    mkdirSync(path, options);
  },
  
  remove: async (path: string) => {
    const { promises: fs } = await import("node:fs");
    const stats = await fs.stat(path).catch(() => null);
    if (!stats) return;
    
    if (stats.isDirectory()) {
      await fs.rmdir(path, { recursive: true });
    } else {
      await fs.unlink(path);
    }
  },
  
  removeSync: (path: string) => {
    const { rmSync } = require("node:fs");
    rmSync(path, { recursive: true, force: true });
  },
  
  // Read directory
  readDir: async (path: string) => {
    const { promises: fs } = await import("node:fs");
    const entries = await fs.readdir(path, { withFileTypes: true });
    return entries.map(entry => ({
      name: entry.name,
      isFile: entry.isFile(),
      isDirectory: entry.isDirectory(),
      isSymlink: entry.isSymbolicLink(),
    }));
  },
  
  readDirSync: (path: string) => {
    const { readdirSync } = require("node:fs");
    const entries = readdirSync(path, { withFileTypes: true });
    return entries.map((entry: any) => ({
      name: entry.name,
      isFile: entry.isFile(),
      isDirectory: entry.isDirectory(),
      isSymlink: entry.isSymbolicLink(),
    }));
  },
  
  // Home directory
  homeDir: () => homedir(),
  
  // Args (command line arguments)
  args: process.argv.slice(2),
  
  // Stdin/stdout/stderr
  stdin: {
    readable: process.stdin,
  },
  stdout: {
    writable: process.stdout,
  },
  stderr: {
    writable: process.stderr,
  },
};

// Export existsSync for direct use
export { fsExistsSync as existsSync };

// Default export for easy migration
export default Deno;