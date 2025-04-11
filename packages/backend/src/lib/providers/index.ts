import { loadGroqChatModels } from './groq';
import { loadOllamaChatModels, loadOllamaEmbeddingsModels } from './ollama';
import { loadOpenAIChatModels, loadOpenAIEmbeddingsModels } from './openai';
import { loadAnthropicChatModels } from './anthropic';
import { loadDeepseekChatModels } from './deepseek';
import {
  getHostedModeConfig,
  isHostedMode,
} from '@starknet-agent/agents/config';
import { loadGeminiChatModels } from './gemini';

const chatModelProviders = {
  openai: loadOpenAIChatModels,
  groq: loadGroqChatModels,
  ollama: loadOllamaChatModels,
  anthropic: loadAnthropicChatModels,
  deepseek: loadDeepseekChatModels,
  gemini: loadGeminiChatModels,
};

const embeddingModelProviders = {
  openai: loadOpenAIEmbeddingsModels,
  ollama: loadOllamaEmbeddingsModels,
};

export const getAvailableChatModelProviders = async () => {
  const models = {};

  for (const provider in chatModelProviders) {
    const providerModels = await chatModelProviders[provider]();
    if (Object.keys(providerModels).length > 0) {
      models[provider] = providerModels;
    }
  }

  if (isHostedMode()) {
    const hostedModeConfig = getHostedModeConfig();
    return {
      [hostedModeConfig.DEFAULT_CHAT_PROVIDER]: {
        [hostedModeConfig.DEFAULT_CHAT_MODEL]:
          models[hostedModeConfig.DEFAULT_CHAT_PROVIDER][
            hostedModeConfig.DEFAULT_CHAT_MODEL
          ],
      },
      [hostedModeConfig.DEFAULT_FAST_CHAT_PROVIDER]: {
        [hostedModeConfig.DEFAULT_FAST_CHAT_MODEL]:
          models[hostedModeConfig.DEFAULT_FAST_CHAT_PROVIDER][
            hostedModeConfig.DEFAULT_FAST_CHAT_MODEL
          ],
      },
    };
  }

  models['custom_openai'] = {};

  return models;
};

export const getAvailableEmbeddingModelProviders = async () => {
  const models = {};

  for (const provider in embeddingModelProviders) {
    const providerModels = await embeddingModelProviders[provider]();
    if (Object.keys(providerModels).length > 0) {
      models[provider] = providerModels;
    }
  }

  if (isHostedMode()) {
    const hostedModeConfig = getHostedModeConfig();
    const hosted_model =
      models[hostedModeConfig.DEFAULT_EMBEDDING_PROVIDER][
        hostedModeConfig.DEFAULT_EMBEDDING_MODEL
      ];
    return {
      [hostedModeConfig.DEFAULT_EMBEDDING_PROVIDER]: {
        [hostedModeConfig.DEFAULT_EMBEDDING_MODEL]: hosted_model,
      },
    };
  }

  return models;
};
