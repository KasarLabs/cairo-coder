import { getGeminiApiKey } from '@starknet-agent/agents/config/settings';
import { logger } from '@starknet-agent/agents/utils/index';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

export const loadGeminiChatModels = async () => {
  const geminiApiKey = getGeminiApiKey();

  if (!geminiApiKey) return {};

  try {
    const chatModels = {
      'Gemini Flash': new ChatGoogleGenerativeAI({
        temperature: 0.7,
        apiKey: geminiApiKey,
        modelName: 'gemini-2.0-flash',
      }),
    };

    return chatModels;
  } catch (err) {
    logger.error(`Error loading Gemini models: ${err}`);
    return {};
  }
};
