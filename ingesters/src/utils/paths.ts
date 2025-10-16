import path from 'path';
import { existsSync } from 'fs';

/**
 * Find the repository root by looking for package.json and going up the directory tree
 */
function findRepoRoot(): string {
  let currentDir = import.meta.dir; // Bun's way to get current directory

  // Walk up the directory tree looking for package.json
  while (currentDir !== '/') {
    if (existsSync(path.join(currentDir, 'package.json'))) {
      // Go one level up from the package.json location
      return path.dirname(currentDir);
    }
    currentDir = path.dirname(currentDir);
  }

  throw new Error('Could not find repository root');
}

/**
 * Get the repository root directory (cached)
 */
export const REPO_ROOT = findRepoRoot();

/**
 * Get a path relative to the repository root
 */
export function getRepoPath(...segments: string[]): string {
  return path.join(REPO_ROOT, ...segments);
}

/**
 * Get the ingesters temp directory
 */
export function getTempDir(...segments: string[]): string {
  return path.join(REPO_ROOT, 'ingesters', 'temp', ...segments);
}

/**
 * Get a path in the python directory
 */
export function getPythonPath(...segments: string[]): string {
  return path.join(REPO_ROOT, 'python', ...segments);
}
