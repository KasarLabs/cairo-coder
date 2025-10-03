import path from 'path';
import { existsSync } from 'fs';

/**
 * Find the repository root by looking for .git directory
 */
function findRepoRoot(): string {
  // @ts-ignore
  let currentDir = import.meta.dir; // Bun's way to get current directory

  // Walk up the directory tree looking for .env
  while (currentDir !== '/') {
    if (
      existsSync(path.join(currentDir, '.env')) ||
      existsSync(path.join(currentDir, '.git'))
    ) {
      return currentDir;
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
