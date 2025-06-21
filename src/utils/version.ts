/**
 * Version utility - dynamically reads version from package.json
 * This eliminates hardcoded version references throughout the codebase
 */

import { readFileSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

let cachedVersion: string | null = null;
let cachedBuildDate: string | null = null;

/**
 * Get the current version from package.json
 * Caches the result for performance
 */
export function getVersion(): string {
  if (cachedVersion) {
    return cachedVersion;
  }

  try {
    // Check if we're in a SEA (Single Executable Application) environment
    // In SEA, import.meta.url might be undefined or not work properly
    let packageJsonContent: string;
    
    try {
      // First try to read from SEA assets (if available)
      const seaAssetPath = "package.json";
      if (existsSync(seaAssetPath)) {
        packageJsonContent = readFileSync(seaAssetPath, "utf-8");
      } else {
        throw new Error("SEA asset not found");
      }
    } catch {
      // Fallback to normal file system lookup
      if (!import.meta.url || import.meta.url === "undefined") {
        // If import.meta.url is not available, use hardcoded fallback
        cachedVersion = "1.0.81";
        return cachedVersion;
      }

      // Try multiple strategies to find package.json
      const currentDir = dirname(fileURLToPath(import.meta.url));
      
      // Strategy 1: Go up two levels from src/utils
      let packageJsonPath = resolve(currentDir, "..", "..", "package.json");
      
      if (!existsSync(packageJsonPath)) {
        // Strategy 2: Go up three levels (in case we're in dist)
        packageJsonPath = resolve(currentDir, "..", "..", "..", "package.json");
      }
      
      if (!existsSync(packageJsonPath)) {
        // Strategy 3: Search upwards from current directory
        let searchDir = currentDir;
        let found = false;
        
        for (let i = 0; i < 10; i++) { // Limit search depth
          const testPath = join(searchDir, "package.json");
          if (existsSync(testPath)) {
            packageJsonPath = testPath;
            found = true;
            break;
          }
          const parentDir = dirname(searchDir);
          if (parentDir === searchDir) break; // Reached root
          searchDir = parentDir;
        }
        
        if (!found) {
          throw new Error("package.json not found in any parent directory");
        }
      }
      
      packageJsonContent = readFileSync(packageJsonPath, "utf-8");
    }
    
    // Parse package.json
    const packageJson = JSON.parse(packageJsonContent);
    
    if (!packageJson.version) {
      throw new Error("No version field found in package.json");
    }
    
    cachedVersion = packageJson.version;
    return cachedVersion as string;
    
  } catch (error) {
    // Fallback version if package.json can't be read
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`Warning: Could not read version from package.json (${errorMessage}), using fallback`);
    cachedVersion = "1.0.0-fallback";
    return cachedVersion;
  }
}

/**
 * Get build date as ISO string
 */
export function getBuildDate(): string {
  if (cachedBuildDate) {
    return cachedBuildDate;
  }
  
  cachedBuildDate = new Date().toISOString().split("T")[0];
  return cachedBuildDate;
}

/**
 * Clear the cached version (useful for testing)
 */
export function clearVersionCache(): void {
  cachedVersion = null;
  cachedBuildDate = null;
} 