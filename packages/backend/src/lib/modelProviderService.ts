import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { Embeddings } from '@langchain/core/embeddings';
import {
  getAvailableEmbeddingModelProviders,
  getAvailableChatModelProviders,
} from './providers';
import { getHostedModeConfig } from '@starknet-agent/agents/config';
import logger from '../utils/logger';

export interface ModelConfig {
  defaultLLM: BaseChatModel;
  fastLLM: BaseChatModel;
  embeddings: Embeddings;
}

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
