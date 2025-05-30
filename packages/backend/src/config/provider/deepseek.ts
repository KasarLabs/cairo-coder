import { getDeepseekApiKey } from '@cairo-coder/agents/config/settings';
import { logger } from '@cairo-coder/agents/utils/index';
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
