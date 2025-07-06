import {
  getAvailableEmbeddingModelProviders,
  getAvailableChatModelProviders,
} from './provider';
import { getHostedModeConfig } from '@cairo-coder/agents/config/settings';
import { logger } from '@cairo-coder/agents/utils/index';
import { ModelConfig } from '../types';
let modelConfig: ModelConfig | null = null;

export async function initializeLLMConfig(): Promise<ModelConfig> {
  // If already initialized, return the existing config
  if (modelConfig) {
    return modelConfig;
  }

  try {
    const [chatModelProviders, embeddingModelProviders] = await Promise.all([
      getAvailableChatModelProviders(),
      getAvailableEmbeddingModelProviders(),
    ]);

    const hostedModeConfig = getHostedModeConfig();

    // Default LLM setup
    const defaultLLM =
      chatModelProviders[hostedModeConfig.DEFAULT_CHAT_PROVIDER][
        hostedModeConfig.DEFAULT_CHAT_MODEL
      ];

    // Fast LLM setup
    const fastLLM =
      chatModelProviders[hostedModeConfig.DEFAULT_FAST_CHAT_PROVIDER][
        hostedModeConfig.DEFAULT_FAST_CHAT_MODEL
      ];

    // Embedding model setup
    // TODO(migrate-ax): this should be an AxAI service for embeddings.
    // We should create a new AxAI service for embeddings.
    // Example from doc:
    //     // Initialize the AI service with your API key
    // const embeddings = new AxAI({
    //   name: 'openai', // You can use 'anthropic', 'google-gemini', etc.
    //   apiKey: process.env.OPENAI_APIKEY as string,
    // })
    // Replace with the right hostedmodeconfig.

    const embeddingModelProvider =
      embeddingModelProviders[hostedModeConfig.DEFAULT_EMBEDDING_PROVIDER];
    const embeddings =
      embeddingModelProvider[hostedModeConfig.DEFAULT_EMBEDDING_MODEL];

    if (!defaultLLM || !fastLLM || !embeddings) {
      throw new Error(
        'Failed to initialize one or more required models (default LLM, fast LLM, or embeddings)',
      );
    }

    modelConfig = {
      defaultLLM,
      fastLLM,
      embeddings,
    };

    return modelConfig;
  } catch (error) {
    logger.error('Failed to initialize model configuration:', error);
    throw error;
  }
}

export function getModelConfig(): ModelConfig {
  if (!modelConfig) {
    throw new Error('Model configuration not initialized');
  }
  return modelConfig;
}
