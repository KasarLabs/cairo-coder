import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as toml from '@iarna/toml';

export interface StarklingsExercise {
  name: string;
  path: string;
  hint: string;
  mode?: 'compile' | 'test';
}

/**
 * Parses Starklings info.toml to extract exercises.
 */
export function parseStarklingsInfo(infoPath: string): StarklingsExercise[] {
  try {
    const content = fs.readFileSync(infoPath, 'utf8');
    const parsed = toml.parse(content) as any;

    const exercises: StarklingsExercise[] = [];

    if (parsed.exercises && Array.isArray(parsed.exercises)) {
      for (const exercise of parsed.exercises) {
        exercises.push({
          name: exercise.name || 'unknown',
          path: exercise.path || '',
          hint: exercise.hint || '',
          mode: exercise.mode || 'compile',
        });
      }
    }

    return exercises;
  } catch (error) {
    console.error('Failed to parse Starklings info:', error);
    return [];
  }
}

/**
 * Ensures the Starklings repository is cloned and checked out to the correct branch.
 */
export async function ensureStarklingsRepo(
  targetPath: string,
): Promise<boolean> {
  if (fs.existsSync(targetPath)) {
    return true;
  }

  try {
    execSync(
      `git clone https://github.com/enitrat/starklings-cairo1.git ${targetPath}`,
      { stdio: 'inherit' },
    );

    execSync('git checkout feat/upgrade-cairo-and-use-scarb', {
      cwd: targetPath,
      stdio: 'pipe',
    });

    return true;
  } catch (error) {
    console.error('Failed to clone Starklings repo:', error);
    return false;
  }
}
