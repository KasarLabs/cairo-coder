import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { getOpenaiApiKey } from '@cairo-coder/agents/config/settings';
import { logger } from '@cairo-coder/agents/utils/index';

export const loadOpenAIChatModels = async () => {
  const openAIApiKey = getOpenaiApiKey();

  if (!openAIApiKey) return {};

  try {
    const chatModels = {
      'GPT-3.5 turbo': new ChatOpenAI({
        openAIApiKey,
        modelName: 'gpt-3.5-turbo',
        temperature: 0.7,
      }),
      'GPT-4': new ChatOpenAI({
        openAIApiKey,
        modelName: 'gpt-4',
        temperature: 0.7,
      }),
      'GPT-4 turbo': new ChatOpenAI({
        openAIApiKey,
        modelName: 'gpt-4-turbo',
        temperature: 0.7,
      }),
      'GPT-4 omni': new ChatOpenAI({
        openAIApiKey,
        modelName: 'gpt-4o',
        temperature: 0.7,
      }),
      'GPT-4 omni mini': new ChatOpenAI({
        openAIApiKey,
        modelName: 'gpt-4o-mini',
        temperature: 0.7,
      }),
    };

    return chatModels;
  } catch (err) {
    logger.error(`Error loading OpenAI models: ${err}`);
    return {};
  }
};

export const loadOpenAIEmbeddingsModels = async () => {
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
