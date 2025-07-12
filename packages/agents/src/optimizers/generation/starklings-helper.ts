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
 * Parse Starklings info.toml to extract exercises
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
 * Test a single exercise with provided code
 */
export async function testStarklingsExercise(
  code: string,
  exerciseName: string,
  mode: 'compile' | 'test' = 'compile',
): Promise<{ success: boolean; error?: string }> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'starklings-test-'));

  try {
    // Copy the runner_crate template to temp directory
    const runnerCratePath = path.join(
      __dirname,
      '../../../../fixtures/runner_crate',
    );
    const projectDir = path.join(tmpDir, exerciseName);

    try {
      fs.cpSync(runnerCratePath, projectDir, { recursive: true });
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to copy runner crate template: ${error.message}`,
      };
    }

    // Write the exercise code
    const libPath = path.join(projectDir, 'src', 'lib.cairo');
    fs.writeFileSync(libPath, code);

    // Try to build or test based on mode
    try {
      const command = mode === 'test' ? 'scarb test' : 'scarb build';
      execSync(command, {
        cwd: projectDir,
        stdio: 'pipe',
        timeout: 30000,
      });
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.stderr?.toString() || error.message,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: `Setup error: ${error.message}`,
    };
  } finally {
    // Clean up
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

/**
 * Convert Starklings exercise to generation example format
 */
export function starklingsToGenerationExample(
  exercise: StarklingsExercise,
  context: string,
  solution?: string,
): any {
  // Convert the hint to a user query
  const query = exercise.hint.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

  return {
    query,
    chat_history: '',
    context,
    expected: {
      answer: solution || '// Solution not provided',
    },
  };
}

/**
 * Clone Starklings repository if not already present
 */
export async function ensureStarklingsRepo(
  targetPath: string,
): Promise<boolean> {
  if (fs.existsSync(targetPath)) {
    console.log('Starklings repo already exists');
    return true;
  }

  try {
    console.log('Cloning Starklings repository...');
    execSync(
      `git clone https://github.com/enitrat/starklings-cairo1.git ${targetPath}`,
      { stdio: 'inherit' },
    );

    // Checkout the specific branch mentioned in requirements
    console.log(
      'Checking out the specific branch mentioned in requirements...',
    );
    execSync('git checkout feat/upgrade-cairo-and-use-scarb', {
      cwd: targetPath,
      stdio: 'pipe',
    });

    console.log(
      'Current branch:',
      execSync('git branch --show-current', { cwd: targetPath })
        .toString()
        .trim(),
    );

    return true;
  } catch (error) {
    console.error('Failed to clone Starklings repo:', error);
    return false;
  }
}

// Re-export os for the temporary directory
import * as os from 'os';
