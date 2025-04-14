import { getDeepseekApiKey } from '@starknet-agent/agents/config';
import logger from '../../utils/logger';
import { ChatOpenAI, OpenAI } from '@langchain/openai';

export const loadDeepseekChatModels = async () => {
  const deepseekApiKey = getDeepseekApiKey();

  if (!deepseekApiKey) return {};

  try {
    const chatModels = {
      'DeepSeek Chat': new ChatOpenAI({
        temperature: 0.7,
        openAIApiKey: deepseekApiKey,
        modelName: 'deepseek-chat',
        configuration: {
          apiKey: deepseekApiKey,
          baseURL: 'https://api.deepseek.com/v1',
        },
      }),
    };

    return chatModels;
  } catch (err) {
    logger.error(`Error loading DeepSeek models: ${err}`);
    return {};
  }
};
