import path from 'path';
import fs from 'fs';
import os from 'os';
import { execSync } from 'child_process';
import { logger } from '../..';
import { AxMetricFn } from '@ax-llm/ax';

// Extract Cairo code from the answer
export const extractCairoCode = (answer: string): string | null => {
  // Match code blocks with ```cairo or ```rust or just ```
  const codeBlockRegex = /```(?:cairo|rust|)?\n([\s\S]*?)```/g;
  const matches = [...answer.matchAll(codeBlockRegex)];

  if (matches.length > 0) {
    // Concatenate all code blocks
    return matches.map((match) => match[1]).join('\n\n');
  }

  // If no code blocks found, check if the entire answer might be code
  if (
    answer.includes('mod ') ||
    answer.includes('fn ') ||
    answer.includes('#[')
  ) {
    return answer;
  }

  return null;
};

// Check if code compiles using Scarb
export const checkCompilation = async (
  code: string,
): Promise<{ success: boolean; error?: string }> => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cairo-test-'));

  try {
    // Copy the runner_crate template to temp directory
    const runnerCratePath = path.join(
      __dirname,
      '../../../../../fixtures/runner_crate',
    );
    const projectDir = path.join(tmpDir, 'test_project');

    try {
      fs.cpSync(runnerCratePath, projectDir, { recursive: true });
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to copy runner crate template: ${error.message}`,
      };
    }

    // Write the code to src/lib.cairo
    const libPath = path.join(projectDir, 'src', 'lib.cairo');
    fs.writeFileSync(libPath, code);

    // Try to build
    try {
      const result = execSync('scarb build', {
        cwd: projectDir,
        stdio: 'pipe',
        timeout: 30000, // 30 second timeout
        encoding: 'utf8',
      });
      return { success: true };
    } catch (error: any) {
      const stderr = error.stderr?.toString() || '';
      const stdout = error.stdout?.toString() || '';
      const errorMessage =
        stderr || stdout || error.message || 'Unknown compilation error';

      logger.debug(
        `Scarb build failed with exit code ${error.status}: ${errorMessage}`,
      );

      // Save failed code to error_logs directory for manual analysis
      try {
        const errorLogsDir = path.join(__dirname, '../../../../../error_logs');
        fs.mkdirSync(errorLogsDir, { recursive: true });

        // Find next available index
        let index = 1;
        let runDir = path.join(errorLogsDir, `run_${index}.cairo`);
        while (fs.existsSync(runDir)) {
          index++;
          runDir = path.join(errorLogsDir, `run_${index}.cairo`);
        }

        // Write the failed code
        fs.writeFileSync(runDir, code);
        logger.debug(`Failed code saved to: ${runDir}`);
      } catch (saveError: any) {
        logger.debug(`Failed to save error code: ${saveError.message}`);
      }

      return {
        success: false,
        error: errorMessage,
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
};

export const generationMetricFn: AxMetricFn = async ({
  prediction,
  example,
}) => {
  const predictedAnswer = prediction.answer as string;
  const expectedAnswer = (example.expected as any).answer as string;
  const query = example.query as string;

  // Extract code from the predicted answer
  const predictedCode = extractCairoCode(predictedAnswer);
  const expectedCode = extractCairoCode(expectedAnswer);

  let compilationScore = 0;
  let hasCodeWhenExpected = 1;

  // Check if code is expected
  if (expectedCode) {
    hasCodeWhenExpected = predictedCode ? 1 : 0;

    // Check compilation if code is present
    if (predictedCode) {
      const compilationResult = await checkCompilation(predictedCode);
      compilationScore = compilationResult.success ? 1 : 0;

      if (!compilationResult.success) {
        logger.debug(`Compilation failed: ${compilationResult.error}`);
      }
    }
  } else {
    // No code expected (non-Cairo query)
    hasCodeWhenExpected = predictedCode ? 0 : 1;
    compilationScore = 1; // Give full score for correctly not providing code
  }

  // Weighted combination of scores
  const weightedScore = 0.8 * compilationScore + 0.2 * hasCodeWhenExpected;

  logger.debug(
    `Generation score: ${weightedScore} (Compilation: ${compilationScore}, HasCode: ${hasCodeWhenExpected})`,
  );

  return weightedScore;
};
