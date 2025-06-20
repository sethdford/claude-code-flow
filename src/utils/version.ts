/**
 * Version utility - dynamically reads version from package.json
 * This eliminates hardcoded version references throughout the codebase
 */

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

let cachedVersion: string | null = null;

/**
 * Get the current version from package.json
 * Caches the result for performance
 */
export function getVersion(): string {
  if (cachedVersion) {
    return cachedVersion;
  }

  try {
    // Get the root directory of the project
    const currentDir = dirname(fileURLToPath(import.meta.url));
    const rootDir = join(currentDir, "..", "..");
    const packageJsonPath = join(rootDir, "package.json");
    
    // Read and parse package.json
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
    cachedVersion = packageJson.version;
    
    return cachedVersion;
  } catch (error) {
    // Fallback version if package.json can't be read
    console.warn("Warning: Could not read version from package.json, using fallback");
    return "1.0.0";
  }
}

/**
 * Get build date as ISO string
 */
export function getBuildDate(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Clear the cached version (useful for testing)
 */
export function clearVersionCache(): void {
  cachedVersion = null;
} 