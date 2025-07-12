#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import * as toml from 'toml';
import { execSync } from 'child_process';
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
import { QueryProcessorProgram } from '../../core/programs/queryProcessor.program';
import { RagPipeline } from '../../core/pipeline/ragPipeline';
import { getAgentConfig } from '../..';
import { summarizeContext } from './context-summarizer.program';

// Interface for our dataset structure
interface ProcessedExample extends GenerationExample {
  metadata?: {
    exerciseName: string;
    exercisePath: string;
    mode: string;
  };
}

/**
 * Global vector store instance
 */
let vectorStore: VectorStore | null = null;

/**
 * Set up the vector store with the appropriate configuration and embedding model
 */
async function setupVectorStore(): Promise<VectorStore> {
  if (vectorStore) {
    return vectorStore;
  }

  try {
    // Get database configuration
    const dbConfig = getVectorDbConfig();
    logger.info('VectorDB config:', dbConfig);

    // Get the ax router instance
    const axRouter = getAxRouter();

    // Initialize vector store
    vectorStore = await VectorStore.getInstance(dbConfig, axRouter);
    logger.info('VectorStore initialized successfully');
    return vectorStore;
  } catch (error) {
    logger.error('Failed to initialize VectorStore:', error);
    throw error;
  }
}

/**
 * Read the exercise source code to use as the query
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
    const content = fs.readFileSync(fullPath, 'utf8');
    // Return the raw exercise code with TODOs/FILL_ME/??? markers
    // This is what the user would see and need to complete
    return content;
  } catch (error) {
    logger.error(`Failed to read exercise file ${fullPath}:`, error);
    return null;
  }
}

/**
 * Get relevant context for a query using vector search and summarization
 */
async function getContextForQuery(
  searchQuery: string,
  fullQuery: string,
  vectorStore: VectorStore,
  router: AxMultiServiceRouter,
): Promise<string> {
  try {
    // Perform similarity search (vectorStore handles embedding generation internally)
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

    // Get raw context from RAG pipeline (MCP mode returns only context)
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

    logger.debug(`Raw context length: ${context.length} characters`);

    // Summarize the context to keep only relevant information
    const summarizedContext = await summarizeContext(fullQuery, context);

    logger.debug(
      `Summarized context length: ${summarizedContext.length} characters`,
    );

    return summarizedContext || 'No relevant documentation found.';
  } catch (error) {
    logger.error('Error getting context:', error);
    return 'Error retrieving context.';
  }
}

/**
 * Read exercise solution if available
 */
function readExerciseSolution(
  exercisePath: string,
  starklingsPath: string,
): string | null {
  // Try to find solution file
  const solutionPath = exercisePath.replace('exercises/', 'solutions/');
  const fullPath = path.join(starklingsPath, solutionPath);
  if (fs.existsSync(fullPath)) {
    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      // Wrap in code block for consistency
      return `\`\`\`cairo\n${content}\n\`\`\``;
    } catch (error) {
      logger.warn(`Failed to read solution at ${fullPath}:`, error);
    }
  }
  // If no solution found, return null.
  return null;
}

/**
 * Process a single Starklings exercise
 */
async function processExercise(
  exercise: StarklingsExercise,
  starklingsPath: string,
  vectorStore: VectorStore,
  router: AxMultiServiceRouter,
): Promise<ProcessedExample | null> {
  try {
    logger.info(`Processing exercise: ${exercise.name}`);

    // Read the exercise source code (with TODOs) as the query
    const exerciseCode = readExerciseSourceCode(exercise.path, starklingsPath);
    if (!exerciseCode) {
      logger.warn(
        `Could not read exercise code for ${exercise.name}, skipping...`,
      );
      return null;
    }

    // Use the hint to search for relevant context
    const searchQuery = exerciseCode
      .replace(/^\/\/\s*/gm, '')
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    logger.debug(`Search query from hint: ${searchQuery}`);

    // Try to get the solution first
    const solution = readExerciseSolution(exercise.path, starklingsPath);

    if (!solution) {
      logger.warn(`No solution found for ${exercise.name}, skipping...`);
      return null;
    }

    // The query is the incomplete exercise code that needs to be completed
    const query = `Complete the following Cairo code:\n\n\`\`\`cairo\n${exerciseCode}\n\`\`\`\n\nHint: ${exercise.hint}`;

    // Get relevant context based on the hint and full query
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
 * Main function to generate Starklings dataset
 */
async function generateStarklingsDataset() {
  console.log('🚀 Starting Starklings dataset generation...\n');

  // Initialize services
  const vectorStore = await setupVectorStore();
  const router = getAxRouter();

  // Setup Starklings repository
  const starklingsPath = path.join(
    __dirname,
    '../../../../../temp/starklings-cairo1',
  );

  console.log('📂 Ensuring Starklings repository...');
  const repoReady = await ensureStarklingsRepo(starklingsPath);
  if (!repoReady) {
    throw new Error('Failed to setup Starklings repository');
  }

  // Parse exercises
  const infoPath = path.join(starklingsPath, 'info.toml');
  console.log('📋 Parsing Starklings exercises...');
  const exercises = parseStarklingsInfo(infoPath);
  console.log(`Found ${exercises.length} exercises\n`);

  // Process exercises
  const processedExamples: ProcessedExample[] = [];
  const batchSize = 15; // Process in batches to avoid overwhelming the API

  for (let i = 0; i < exercises.length; i += batchSize) {
    const batch = exercises.slice(i, Math.min(i + batchSize, exercises.length));

    console.log(
      `\n📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(exercises.length / batchSize)}`,
    );

    const batchResults = await Promise.all(
      batch.map((exercise) =>
        processExercise(exercise, starklingsPath, vectorStore, router),
      ),
    );

    // Filter out null results
    const validResults = batchResults.filter(
      (result): result is ProcessedExample => result !== null,
    );
    processedExamples.push(...validResults);

    // Add a small delay between batches to avoid rate limiting
    if (i + batchSize < exercises.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  console.log(
    `\n✅ Successfully processed ${processedExamples.length} examples`,
  );

  // Generate the TypeScript file content
  const datasetContent = generateDatasetFile(processedExamples);

  // Write to file
  const outputPath = path.join(__dirname, '../datasets/generation.dataset.ts');
  fs.writeFileSync(outputPath, datasetContent);

  console.log(`\n📝 Dataset written to: ${outputPath}`);
  console.log('\n🎉 Starklings dataset generation complete!');

  // Note: VectorStore is a singleton with private pool, cleanup handled internally
}

/**
 * Generate the TypeScript dataset file content
 */
function generateDatasetFile(examples: ProcessedExample[]): string {
  // Sort examples by complexity (simple ones first)
  const sortedExamples = examples.sort((a, b) => {
    const aName = a.metadata?.exerciseName || '';
    const bName = b.metadata?.exerciseName || '';

    // Prioritize intro and basic exercises
    if (aName.includes('intro') || aName.includes('00')) return -1;
    if (bName.includes('intro') || bName.includes('00')) return 1;

    return aName.localeCompare(bName);
  });

  // Convert to dataset format (without metadata)
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

// Run the generation
generateStarklingsDataset().catch((error) => {
  console.error('\n❌ Dataset generation failed:', error);
  process.exit(1);
});
