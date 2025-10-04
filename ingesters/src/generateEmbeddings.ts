import { createInterface } from 'readline';
import { logger } from './utils/logger';
import { VectorStore } from './db/postgresVectorStore';
import {
  getGeminiApiKey,
  getOpenaiApiKey,
  getVectorDbConfig,
} from './config/settings';
import { DocumentSource } from './types';
import { IngesterFactory } from './IngesterFactory';
import { OpenAIEmbeddings } from '@langchain/openai';
import type { Embeddings } from '@langchain/core/embeddings';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { TaskType } from '@google/generative-ai';

export const loadGeminiEmbeddingsModels = async (): Promise<
  Record<string, GoogleGenerativeAIEmbeddings>
> => {
  const geminiApiKey = getGeminiApiKey();
  if (!geminiApiKey) return {};
  const embeddings = new GoogleGenerativeAIEmbeddings({
    model: 'gemini-embedding-001', // 3072 dimensions
    taskType: TaskType.RETRIEVAL_DOCUMENT,
    title: 'Document title',
    apiKey: geminiApiKey,
  });
  return {
    'Gemini embedding 001': embeddings,
  };
};

export const loadOpenAIEmbeddingsModels = async (): Promise<
  Record<string, OpenAIEmbeddings>
> => {
  const openAIApiKey = getOpenaiApiKey();

  if (!openAIApiKey) return {};

  try {
    const embeddingModels = {
      'Text embedding 3 small': new OpenAIEmbeddings({
        openAIApiKey,
        modelName: 'text-embedding-3-small',
        batchSize: 512,
        dimensions: 1536,
      }),
      'Text embedding 3 large': new OpenAIEmbeddings({
        openAIApiKey,
        modelName: 'text-embedding-3-large',
        batchSize: 512,
        dimensions: 1536,
      }),
    };

    return embeddingModels;
  } catch (err) {
    logger.error(`Error loading OpenAI embeddings model: ${err}`);
    return {};
  }
};

/**
 * Global vector store instance
 */
let vectorStore: VectorStore | null = null;

/**
 * Global flag for yes mode (skip all prompts)
 */
export const YES_MODE =
  process.argv.includes('-y') || process.argv.includes('--yes');

/**
 * Set up the vector store with the appropriate configuration and embedding model
 *
 * @returns Promise<VectorStore> - The initialized vector store
 * @throws Error if initialization fails
 */
async function setupVectorStore(): Promise<VectorStore> {
  if (vectorStore) {
    return vectorStore;
  }

  try {
    // Get database configuration
    const dbConfig = getVectorDbConfig();

    const embeddingModels = await loadGeminiEmbeddingsModels();
    const embeddingModel = embeddingModels['Gemini embedding 001'];

    if (!embeddingModel) {
      throw new Error('Text embedding 3 large model not found');
    }

    // Initialize vector store
    vectorStore = await VectorStore.getInstance(
      dbConfig,
      embeddingModel as unknown as Embeddings,
    );
    logger.info('VectorStore initialized successfully');
    return vectorStore;
  } catch (error) {
    logger.error('Failed to initialize VectorStore:', error);
    throw error;
  }
}

/**
 * Prompt the user to select an ingestion target
 *
 * @returns Promise<string> - The selected target
 */
async function promptForTarget(): Promise<DocumentSource | 'Everything'> {
  // If yes mode is enabled, return 'Everything' without prompting
  if (YES_MODE) {
    logger.info('Yes mode enabled, ingesting everything without prompts');
    return 'Everything';
  }

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // Get available sources from the factory
  const availableSources = IngesterFactory.getAvailableSources();

  // Build the prompt string
  const sourcesPrompt = availableSources
    .map((source, index) => `${index + 1}: ${source}`)
    .join(', ');

  const prompt = `Select the ingestion target (${sourcesPrompt}, ${
    availableSources.length + 1
  }: Everything): `;

  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();

      const selectedIndex = parseInt(answer) - 1;

      // Check if the selection is valid
      if (selectedIndex >= 0 && selectedIndex < availableSources.length) {
        resolve(availableSources[selectedIndex]!);
      } else if (selectedIndex === availableSources.length) {
        resolve('Everything');
      } else {
        logger.error(
          `Invalid selection: ${answer}, defaulting to 'Everything'`,
        );
        process.exit(1);
      }
    });
  });
}

/**
 * Ingest documentation for a specific source
 *
 * @param source - The document source to ingest
 */
async function ingestSource(source: DocumentSource): Promise<void> {
  logger.info(`Starting ingestion process for ${source}...`);

  try {
    // Get vector store
    const store = await setupVectorStore();

    // Create ingester using factory
    const ingester = IngesterFactory.createIngester(source);

    // Run ingestion using the process method
    await ingester.process(store);

    logger.info(`${source} ingestion completed successfully.`);
  } catch (error) {
    logger.error(`Error during ${source} ingestion:`, error);
    throw error;
  }
}

/**
 * Main function to run the ingestion process
 */
async function main() {
  try {
    // Prompt user for target
    const target = await promptForTarget();
    logger.info(`Selected target: ${target}`);

    // Process the selected target
    if (target === 'Everything') {
      // Ingest all sources
      const sources = IngesterFactory.getAvailableSources();
      await Promise.all(sources.map((source) => ingestSource(source)));
    } else {
      // Ingest specific source
      await ingestSource(target);
    }

    logger.info('All specified ingestion processes completed successfully.');
  } catch (error) {
    logger.error('An error occurred during the ingestion process:', error);
  } finally {
    // Clean up resources
    if (vectorStore) {
      await vectorStore.close();
      process.exit(0);
    }
  }
}

// Run the main function only when this file is executed directly
if (require.main === module) {
  main();
}
