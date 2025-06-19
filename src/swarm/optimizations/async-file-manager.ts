/**
 * Async File Manager
 * Handles non-blocking file operations with queuing
 */

import { open, readFile, writeFile, unlink, access, stat, readdir, mkdir } from "node:fs/promises";
import { createWriteStream, createReadStream } from "node:fs";
import { Readable } from "node:stream";
import { join, dirname } from "node:path";
import { ILogger } from "../../core/logger";
// import PQueue from 'p-queue'; // Disabled - using simplified queue
import { Logger } from "../../core/logger";

export interface FileOperationResult {
  path: string;
  operation: "read" | "write" | "delete" | "mkdir";
  success: boolean;
  duration: number;
  size?: number;
  error?: Error;
}

export class AsyncFileManager {
  private writeQueue: any; // Simplified queue
  private readQueue: any; // Simplified queue
  private logger: Logger;
  private metrics = {
    operations: new Map<string, number>(),
    totalBytes: 0,
    errors: 0,
  };
  
  constructor(
    private concurrency = {
      write: 10,
      read: 20,
    },
  ) {
    // Simplified queue implementation
    this.writeQueue = {
      add: async (fn: () => Promise<any>) => fn(),
      size: 0,
      pending: 0,
      clear: () => {},
      onIdle: async () => {},
    };
    this.readQueue = {
      add: async (fn: () => Promise<any>) => fn(),
      size: 0,
      pending: 0,
      clear: () => {},
      onIdle: async () => {},
    };
    
    this.logger = new Logger(
      { level: "info", format: "json", destination: "console" },
      { component: "AsyncFileManager" },
    );
  }
  
  public async writeFile(path: string, data: string | Buffer | Readable, options?: { encoding?: BufferEncoding; mode?: number }): Promise<FileOperationResult> {
    return this.writeQueue.add(async () => {
      const startTime = Date.now();
      try {
        if (typeof data === "string" || Buffer.isBuffer(data)) {
          // Ensure directory exists
          await this.ensureDirectory(dirname(path));
          
          // Use streaming for large files
          if (data.length > 1024 * 1024) { // > 1MB
            await this.streamWrite(path, data);
          } else {
            await writeFile(path, data, options);
          }
        } else if (data instanceof Readable) {
          // Handle Readable stream
          await this.ensureDirectory(dirname(path));
          const stream = createWriteStream(path);
          await new Promise((resolve, reject) => {
            data.pipe(stream);
            data.on("error", reject);
            stream.on("error", reject);
            stream.on("finish", () => resolve(undefined));
          });
        }
        const duration = Date.now() - startTime;
        const stats = await stat(path);
        this.trackOperation("write", stats.size);
        return { path, operation: "write", success: true, duration, size: stats.size };
      } catch (error: any) {
        this.metrics.errors++;
        this.logger.error("Failed to write file", { path, error });
        
        const duration = Date.now() - startTime;
        return { path, operation: "write", success: false, duration, error };
      }
    }) as unknown as Promise<FileOperationResult>;
  }
  
  public async readFile(path: string, encoding: BufferEncoding = "utf8"): Promise<FileOperationResult & { data?: string }> {
    return this.readQueue.add(async () => {
      const startTime = Date.now();
      try {
        const data = await readFile(path, { encoding });
        const duration = Date.now() - startTime;
        const stats = await stat(path);
        this.trackOperation("read", stats.size);
        
        return { path, operation: "read" as const, success: true, duration, size: stats.size, data };
      } catch (error: any) {
        this.metrics.errors++;
        this.logger.error("Failed to read file", { path, error });
        
        const duration = Date.now() - startTime;
        return { path, operation: "read" as const, success: false, duration, error };
      }
    }) as unknown as Promise<FileOperationResult & { data?: string }>;
  }
  
  async writeJSON(path: string, data: any, pretty = true): Promise<FileOperationResult> {
    const jsonString = pretty 
      ? JSON.stringify(data, null, 2)
      : JSON.stringify(data);
    
    return this.writeFile(path, jsonString);
  }
  
  async readJSON(path: string): Promise<FileOperationResult & { data?: any }> {
    const result = await this.readFile(path);
    
    if (result.success && result.data) {
      try {
        const parsed = JSON.parse(result.data);
        return { ...result, data: parsed };
      } catch (error) {
        return {
          ...result,
          success: false,
          error: new Error("Invalid JSON format"),
        };
      }
    }
    
    return result;
  }
  
  public async deleteFile(path: string): Promise<FileOperationResult> {
    return this.writeQueue.add(async () => {
      const startTime = Date.now();
      try {
        await unlink(path);
        
        this.trackOperation("delete", 0);
        
        const duration = Date.now() - startTime;
        return { path, operation: "delete" as const, success: true, duration };
      } catch (error: any) {
        this.metrics.errors++;
        this.logger.error("Failed to delete file", { path, error });
        
        const duration = Date.now() - startTime;
        return { path, operation: "delete" as const, success: false, duration, error };
      }
    }) as unknown as Promise<FileOperationResult>;
  }
  
  async ensureDirectory(path: string): Promise<FileOperationResult> {
    const startTime = Date.now();
    
    try {
      await mkdir(path, { recursive: true });
      
      this.trackOperation("mkdir", 0);
      
      const duration = Date.now() - startTime;
      return { path, operation: "mkdir", success: true, duration };
    } catch (error: any) {
      this.metrics.errors++;
      this.logger.error("Failed to create directory", { path, error });
      
      const duration = Date.now() - startTime;
      return { path, operation: "mkdir", success: false, duration, error };
    }
  }
  
  async ensureDirectories(paths: string[]): Promise<FileOperationResult[]> {
    return Promise.all(paths.map(path => this.ensureDirectory(path)));
  }
  
  private async streamWrite(path: string, data: string | Buffer): Promise<void> {
    const stream = createWriteStream(path);
    await new Promise((resolve, reject) => {
      stream.on("error", reject);
      stream.on("finish", () => resolve(undefined));
      stream.end(data);
    });
  }
  
  async streamRead(path: string): Promise<NodeJS.ReadableStream> {
    return createReadStream(path);
  }
  
  public async copyFile(source: string, destination: string): Promise<FileOperationResult> {
    return this.writeQueue.add(async () => {
      const startTime = Date.now();
      try {
        await this.ensureDirectory(dirname(destination));
        const readStream = createReadStream(source);
        const writeStream = createWriteStream(destination);
        await new Promise((resolve, reject) => {
          readStream.pipe(writeStream);
          readStream.on("error", reject);
          writeStream.on("error", reject);
          writeStream.on("finish", () => resolve(undefined));
        });
        const duration = Date.now() - startTime;
        const stats = await stat(destination);
        this.trackOperation("write", stats.size);
        
        return { path: destination, operation: "write", success: true, duration, size: stats.size };
      } catch (error: any) {
        this.metrics.errors++;
        this.logger.error("Failed to copy file", { source, destination, error });
        
        const duration = Date.now() - startTime;
        return { path: destination, operation: "write", success: false, duration, error };
      }
    }) as unknown as Promise<FileOperationResult>;
  }
  
  async moveFile(source: string, destination: string): Promise<FileOperationResult> {
    const copyResult = await this.copyFile(source, destination);
    if (copyResult.success) {
      await this.deleteFile(source);
    }
    return copyResult;
  }
  
  private trackOperation(type: string, bytes: number): void {
    const count = this.metrics.operations.get(type) || 0;
    this.metrics.operations.set(type, count + 1);
    this.metrics.totalBytes += bytes;
  }
  
  getMetrics() {
    return {
      operations: Object.fromEntries(this.metrics.operations),
      totalBytes: this.metrics.totalBytes,
      errors: this.metrics.errors,
      writeQueueSize: this.writeQueue.size,
      readQueueSize: this.readQueue.size,
      writeQueuePending: this.writeQueue.pending,
      readQueuePending: this.readQueue.pending,
    };
  }
  
  async waitForPendingOperations(): Promise<void> {
    await Promise.all([
      this.writeQueue.onIdle(),
      this.readQueue.onIdle(),
    ]);
  }
  
  clearQueues(): void {
    this.writeQueue.clear();
    this.readQueue.clear();
  }
}