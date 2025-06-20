import * as fs from "fs/promises";
import * as fsSync from "fs";
import * as path from "path";
import { Worker } from "worker_threads";
import { fileURLToPath } from "url";
import { PromptCopier, CopyOptions, CopyResult, FileInfo } from "./prompt-copier";
import { Logger } from "../core/logger.js";

const logger = Logger.getInstance();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface WorkerPool {
  workers: Worker[];
  busy: Set<number>;
  queue: Array<() => void>;
}

export class EnhancedPromptCopier extends PromptCopier {
  private workerPool?: WorkerPool;
  private workerResults: Map<string, any> = new Map();

  constructor(options: CopyOptions) {
    super(options);
  }

  protected override async copyFilesParallel(): Promise<void> {
    const workerCount = Math.min(this.options.maxWorkers, this.fileQueue.length);
    
    try {
      // Initialize worker pool
      this.workerPool = await this.initializeWorkerPool(workerCount);
      
      // Process files using worker pool with a timeout
      const timeout = 30000; // 30 seconds timeout
      await Promise.race([
        this.processWithWorkerPool(),
        new Promise<void>((_, reject) => 
          setTimeout(() => reject(new Error("Worker pool processing timeout")), timeout),
        ),
      ]);
    } catch (error) {
      logger.error("Error in parallel file copy:", error);
      
      // If workers failed, fall back to sequential copy
      if (error instanceof Error && (error.message?.includes("Worker file not found") || 
          error.message?.includes("worker_threads"))) {
        logger.warn("Worker threads not available, falling back to sequential copy");
        // Implement simple sequential fallback
        await this.fallbackSequentialCopy();
      } else {
        throw error;
      }
    } finally {
      // Always cleanup workers if they were created
      await this.terminateWorkers();
    }
  }

  private async initializeWorkerPool(workerCount: number): Promise<WorkerPool> {
    const workers: Worker[] = [];
    const pool: WorkerPool = {
      workers,
      busy: new Set(),
      queue: [],
    };
    
    // Create workers
    for (let i = 0; i < workerCount; i++) {
      // Determine the correct worker path based on the environment
      let workerPath: string;
      
      // Try multiple possible paths for the worker
      const possiblePaths = [
        path.join(__dirname, "workers", "copy-worker.js"),
        path.join(__dirname, "..", "..", "dist", "swarm", "workers", "copy-worker.js"),
        path.join(process.cwd(), "dist", "swarm", "workers", "copy-worker.js"),
        path.join(process.cwd(), "src", "swarm", "workers", "copy-worker.js"),
      ];
      
      // Find the first existing worker file
      for (const tryPath of possiblePaths) {
        try {
          fsSync.accessSync(tryPath);
          workerPath = tryPath;
          break;
        } catch (e) {
          // Continue to next path
        }
      }
      
      if (!workerPath!) {
        throw new Error(`Worker file not found. Tried: ${possiblePaths.join(", ")}`);
      }
      
      // Additional check to see if we can actually create workers
      if (typeof Worker === "undefined") {
        throw new Error("Worker threads not available in this environment");
      }
      
      const worker = new Worker(
        workerPath,
        {
          workerData: { workerId: i },
          // Use eval to handle both .js and .ts files in development
          eval: __filename.endsWith(".ts"),
        },
      );
      
      // Setup worker message handler
      worker.on("message", (result) => {
        this.handleWorkerResult(result, i, pool);
      });
      
      worker.on("error", (error) => {
        logger.error(`Worker ${i} error:`, error);
        this.errors.push({
          file: "worker",
          error: error.message,
          phase: "write",
        });
        // Mark worker as no longer busy if it errors
        pool.busy.delete(i);
      });
      
      worker.on("exit", (code) => {
        if (code !== 0) {
          logger.warn(`Worker ${i} exited with code ${code}`);
        }
        // Clean up the worker from the pool
        pool.busy.delete(i);
      });
      
      workers.push(worker);
    }
    
    return pool;
  }

  private async processWithWorkerPool(): Promise<void> {
    const chunkSize = Math.max(1, Math.floor(this.fileQueue.length / this.workerPool!.workers.length / 2));
    const chunks: FileInfo[][] = [];
    
    // Create chunks for better distribution
    for (let i = 0; i < this.fileQueue.length; i += chunkSize) {
      chunks.push(this.fileQueue.slice(i, i + chunkSize));
    }
    
    // Process chunks
    const promises: Promise<void>[] = [];
    
    for (const chunk of chunks) {
      promises.push(this.processChunkWithWorker(chunk));
    }
    
    await Promise.all(promises);
  }

  private async processChunkWithWorker(chunk: FileInfo[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const pool = this.workerPool!;
      
      const tryAssignWork = () => {
        // Find available worker
        const availableWorkerIndex = pool.workers.findIndex((_, index) => !pool.busy.has(index));
        
        if (availableWorkerIndex === -1) {
          // No workers available, queue the work
          pool.queue.push(tryAssignWork);
          return;
        }
        
        // Mark worker as busy
        pool.busy.add(availableWorkerIndex);
        
        // Prepare worker data
        const workerData = {
          files: chunk.map(file => ({
            sourcePath: file.path,
            destPath: path.join(this.options.destination, file.relativePath),
            permissions: this.options.preservePermissions ? file.permissions : undefined,
            verify: this.options.verify,
          })),
          workerId: availableWorkerIndex,
        };
        
        let remainingFiles = chunk.length;
        const chunkResults: any[] = [];
        
        // Setup temporary message handler for this chunk
        const messageHandler = (result: any) => {
          chunkResults.push(result);
          remainingFiles--;
          
          if (remainingFiles === 0) {
            // Chunk complete
            pool.workers[availableWorkerIndex].off("message", messageHandler);
            pool.busy.delete(availableWorkerIndex);
            
            // Process next queued work
            if (pool.queue.length > 0) {
              const nextWork = pool.queue.shift()!;
              nextWork();
            }
            
            // Process results
            this.processChunkResults(chunk, chunkResults);
            resolve();
          }
        };
        
        pool.workers[availableWorkerIndex].on("message", messageHandler);
        pool.workers[availableWorkerIndex].postMessage(workerData);
      };
      
      tryAssignWork();
    });
  }

  private processChunkResults(chunk: FileInfo[], results: any[]): void {
    for (const result of results) {
      if (result.success) {
        this.copiedFiles.add(result.file);
        if (result.hash) {
          this.workerResults.set(result.file, { hash: result.hash });
        }
      } else {
        this.errors.push({
          file: result.file,
          error: result.error,
          phase: "write",
        });
      }
    }
    
    this.reportProgress(this.copiedFiles.size);
  }

  private handleWorkerResult(result: any, workerId: number, pool: WorkerPool): void {
    // This is a fallback handler, actual handling happens in processChunkWithWorker
    logger.debug(`Worker ${workerId} result:`, result);
  }

  private async fallbackSequentialCopy(): Promise<void> {
    logger.info("Performing sequential file copy fallback...");
    let completed = 0;
    
    for (const file of this.fileQueue) {
      try {
        // Copy file using the same logic as parent class but accessible here
        const destPath = path.join(this.options.destination, file.relativePath);
        
        // Ensure destination directory exists
        await fs.mkdir(path.dirname(destPath), { recursive: true });
        
        // Copy the file
        await fs.copyFile(file.path, destPath);
        
        // Preserve permissions if requested
        if (this.options.preservePermissions && file.permissions) {
          await fs.chmod(destPath, file.permissions);
        }
        
        this.copiedFiles.add(file.path);
        completed++;
        this.reportProgress(completed);
      } catch (error) {
        this.errors.push({
          file: file.path,
          error: error instanceof Error ? error.message : String(error),
          phase: "write",
        });
      }
    }
  }

  private async terminateWorkers(): Promise<void> {
    if (!this.workerPool) return;
    
    // Clear the queue first
    this.workerPool.queue = [];
    
    // Terminate all workers with a timeout
    const terminationPromises = this.workerPool.workers.map(async (worker, index) => {
      try {
        // Remove all listeners to prevent memory leaks
        worker.removeAllListeners();
        
        // Give worker a chance to finish gracefully
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Terminate the worker
        await worker.terminate();
      } catch (error) {
        logger.warn(`Failed to terminate worker ${index}:`, error);
      }
    });
    
    await Promise.allSettled(terminationPromises);
    this.workerPool = undefined;
  }

  // Override verification to use worker results
  protected override async verifyFiles(): Promise<void> {
    logger.info("Verifying copied files...");
    
    for (const file of this.fileQueue) {
      if (!this.copiedFiles.has(file.path)) continue;
      
      try {
        const destPath = path.join(this.options.destination, file.relativePath);
        
        // Verify file exists
        if (!await this.fileExists(destPath)) {
          throw new Error("Destination file not found");
        }
        
        // Verify size
        const destStats = await fs.stat(destPath);
        const sourceStats = await fs.stat(file.path);
        
        if (destStats.size !== sourceStats.size) {
          throw new Error(`Size mismatch: ${destStats.size} != ${sourceStats.size}`);
        }
        
        // Use hash from worker if available
        const workerResult = this.workerResults.get(file.path);
        if (workerResult?.hash) {
          const sourceHash = await this.calculateFileHash(file.path);
          if (sourceHash !== workerResult.hash) {
            throw new Error(`Hash mismatch: ${sourceHash} != ${workerResult.hash}`);
          }
        }
        
      } catch (error) {
        this.errors.push({
          file: file.path,
          error: error instanceof Error ? error.message : String(error),
          phase: "verify",
        });
      }
    }
  }
}

// Export enhanced copy function
export async function copyPromptsEnhanced(options: CopyOptions): Promise<CopyResult> {
  const copier = new EnhancedPromptCopier(options);
  return copier.copy();
}