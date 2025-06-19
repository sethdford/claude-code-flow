const { parentPort, workerData } = require("worker_threads");
const fs = require("fs/promises");
const path = require("path");
const { createHash } = require("crypto");

async function copyFile(file) {
  try {
    // Ensure destination directory exists
    const destDir = path.dirname(file.destPath);
    await fs.mkdir(destDir, { recursive: true });
    
    // Copy the file
    await fs.copyFile(file.sourcePath, file.destPath);
    
    // Preserve permissions if requested
    if (file.permissions) {
      await fs.chmod(file.destPath, file.permissions);
    }
    
    let hash;
    
    // Calculate hash if verification is requested
    if (file.verify) {
      const content = await fs.readFile(file.destPath);
      hash = createHash("sha256").update(content).digest("hex");
    }
    
    return {
      success: true,
      file: file.sourcePath,
      hash,
    };
  } catch (error) {
    return {
      success: false,
      file: file.sourcePath,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main() {
  const data = workerData;
  
  if (!parentPort) {
    throw new Error("This script must be run as a worker thread");
  }
  
  for (const file of data.files) {
    const result = await copyFile(file);
    parentPort.postMessage(result);
  }
}

// Run the worker
main().catch(error => {
  if (parentPort) {
    parentPort.postMessage({
      success: false,
      file: "worker",
      error: error instanceof Error ? error.message : String(error),
    });
  }
  process.exit(1);
});