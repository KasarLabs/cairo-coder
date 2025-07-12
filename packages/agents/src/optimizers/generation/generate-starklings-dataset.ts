#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import * as toml from 'toml';
import {
  ensureStarklingsRepo,
  parseStarklingsInfo,
  type StarklingsExercise,
} from './starklings-helper';
import { VectorStore } from '../../db/postgresVectorStore';
import { getAxRouter } from '../../config/llm';
import { getVectorDbConfig } from '../../config/settings';
import type { GenerationExample } from '../datasets/generation.dataset';
import { AxMultiServiceRouter } from '@ax-llm/ax';
import { logger } from '../../utils';
import { DocumentSource, RagInput } from '../../types';
import { RagPipeline } from '../../core/pipeline/ragPipeline';
import { getAgentConfig } from '../..';
import { summarizeContext } from './context-summarizer.program';

/**
 * Interface for processed dataset examples with metadata.
 */
interface ProcessedExample extends GenerationExample {
  metadata?: {
    exerciseName: string;
    exercisePath: string;
    mode: string;
  };
}

let vectorStore: VectorStore | null = null;

/**
 * Sets up and returns the vector store instance.
 */
async function setupVectorStore(): Promise<VectorStore> {
  if (vectorStore) {
    return vectorStore;
  }

  const dbConfig = getVectorDbConfig();
  const axRouter = getAxRouter();
  vectorStore = await VectorStore.getInstance(dbConfig, axRouter);
  logger.info('VectorStore initialized successfully');
  return vectorStore;
}

/**
 * Reads the exercise source code from the given path.
 */
function readExerciseSourceCode(
  exercisePath: string,
  starklingsPath: string,
): string | null {
  const fullPath = path.join(starklingsPath, exercisePath);

  if (!fs.existsSync(fullPath)) {
    logger.warn(`Exercise file not found: ${fullPath}`);
    return null;
  }

  try {
    return fs.readFileSync(fullPath, 'utf8');
  } catch (error) {
    logger.error(`Failed to read exercise file ${fullPath}:`, error);
    return null;
  }
}

/**
 * Retrieves and summarizes relevant context for the query using vector search.
 */
async function getContextForQuery(
  searchQuery: string,
  fullQuery: string,
  vectorStore: VectorStore,
  router: AxMultiServiceRouter,
): Promise<string> {
  try {
    const sourcesToSearch = [
      DocumentSource.CAIRO_BOOK,
      DocumentSource.CAIRO_BY_EXAMPLE,
      DocumentSource.OPENZEPPELIN_DOCS,
      DocumentSource.STARKNET_FOUNDRY,
    ];

    const ragInput: RagInput = {
      query: searchQuery,
      chatHistory: [],
      sources: sourcesToSearch,
    };

    const ragConfig = getAgentConfig(vectorStore);
    const ragPipeline = new RagPipeline(router, ragConfig);

    const contextStreamer = ragPipeline.execute(ragInput, true);
    let rawContext = '';

    const context = await new Promise<string>((resolve) => {
      contextStreamer.on('data', (data) => {
        const parsed = JSON.parse(data);
        if (parsed.type === 'response') {
          rawContext += parsed.data;
        }
      });
      contextStreamer.on('end', () => {
        resolve(rawContext);
      });
      contextStreamer.on('error', (error) => {
        logger.error('Error getting context:', error);
        resolve('Error getting context.');
      });
    });

    const summarizedContext = await summarizeContext(fullQuery, context);

    return summarizedContext || 'No relevant documentation found.';
  } catch (error) {
    logger.error('Error getting context:', error);
    return 'Error retrieving context.';
  }
}

/**
 * Reads the exercise solution from the solutions directory if available.
 */
function readExerciseSolution(
  exercisePath: string,
  starklingsPath: string,
): string | null {
  const solutionPath = exercisePath.replace('exercises/', 'solutions/');
  const fullPath = path.join(starklingsPath, solutionPath);
  if (fs.existsSync(fullPath)) {
    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      return `\`\`\`cairo\n${content}\n\`\`\``;
    } catch (error) {
      logger.warn(`Failed to read solution at ${fullPath}:`, error);
    }
  }
  return null;
}

/**
 * Processes a single Starklings exercise into a dataset example.
 */
async function processExercise(
  exercise: StarklingsExercise,
  starklingsPath: string,
  vectorStore: VectorStore,
  router: AxMultiServiceRouter,
): Promise<ProcessedExample | null> {
  try {
    logger.info(`Processing exercise: ${exercise.name}`);

    const exerciseCode = readExerciseSourceCode(exercise.path, starklingsPath);
    if (!exerciseCode) {
      logger.warn(
        `Could not read exercise code for ${exercise.name}, skipping...`,
      );
      return null;
    }

    const searchQuery = exerciseCode
      .replace(/^\/\/\s*/gm, '')
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const solution = readExerciseSolution(exercise.path, starklingsPath);

    if (!solution) {
      logger.warn(`No solution found for ${exercise.name}, skipping...`);
      return null;
    }

    const query = `Complete the following Cairo code:\n\n\`\`\`cairo\n${exerciseCode}\n\`\`\`\n\nHint: ${exercise.hint}`;

    const context = await getContextForQuery(
      searchQuery,
      query,
      vectorStore,
      router,
    );

    return {
      query,
      chat_history: '',
      context,
      expected: {
        answer: solution,
      },
      metadata: {
        exerciseName: exercise.name,
        exercisePath: exercise.path,
        mode: exercise.mode,
      },
    };
  } catch (error) {
    logger.error(`Failed to process exercise ${exercise.name}:`, error);
    return null;
  }
}

/**
 * Generates the Starklings dataset for optimization.
 */
async function generateStarklingsDataset() {
  console.log('Starting Starklings dataset generation...');

  const vectorStore = await setupVectorStore();
  const router = getAxRouter();

  const starklingsPath = path.join(
    __dirname,
    '../../../../../temp/starklings-cairo1',
  );

  const repoReady = await ensureStarklingsRepo(starklingsPath);
  if (!repoReady) {
    throw new Error('Failed to setup Starklings repository');
  }

  const infoPath = path.join(starklingsPath, 'info.toml');
  const exercises = parseStarklingsInfo(infoPath);

  const processedExamples: ProcessedExample[] = [];
  const batchSize = 15;

  for (let i = 0; i < exercises.length; i += batchSize) {
    const batch = exercises.slice(i, Math.min(i + batchSize, exercises.length));

    const batchResults = await Promise.all(
      batch.map((exercise) =>
        processExercise(exercise, starklingsPath, vectorStore, router),
      ),
    );

    const validResults = batchResults.filter(
      (result): result is ProcessedExample => result !== null,
    );
    processedExamples.push(...validResults);

    if (i + batchSize < exercises.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  const datasetContent = generateDatasetFile(processedExamples);

  const outputPath = path.join(__dirname, '../datasets/generation.dataset.ts');
  fs.writeFileSync(outputPath, datasetContent);

  console.log(`Dataset written to: ${outputPath}`);
}

/**
 * Generates the TypeScript file content for the dataset.
 */
function generateDatasetFile(examples: ProcessedExample[]): string {
  const sortedExamples = examples.sort((a, b) => {
    const aName = a.metadata?.exerciseName || '';
    const bName = b.metadata?.exerciseName || '';

    if (aName.includes('intro') || aName.includes('00')) return -1;
    if (bName.includes('intro') || bName.includes('00')) return 1;

    return aName.localeCompare(bName);
  });

  const datasetExamples = sortedExamples.map(
    ({ metadata, ...example }) => example,
  );

  return `// This dataset was automatically generated from Starklings exercises
// Generated on: ${new Date().toISOString()}
// Total examples: ${datasetExamples.length}

export interface GenerationExample {
  query: string;
  chat_history: string;
  context: string;
  expected: {
    answer: string;
  };
}

export const generationDataset: GenerationExample[] = ${JSON.stringify(datasetExamples, null, 2)};

// Export metadata separately for reference
export const datasetMetadata = {
  source: 'Starklings Cairo 1',
  generatedAt: '${new Date().toISOString()}',
  totalExamples: ${datasetExamples.length},
  exerciseNames: ${JSON.stringify(sortedExamples.map((e) => e.metadata?.exerciseName || 'unknown'))}
};
`;
}

generateStarklingsDataset().catch((error) => {
  console.error('Dataset generation failed:', error);
  process.exit(1);
});
