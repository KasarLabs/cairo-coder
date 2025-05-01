import { getGeminiApiKey } from '@cairo-coder/agents/config/settings';
import { logger } from '@cairo-coder/agents/utils/index';
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
      'Gemini Flash 2.5': new ChatGoogleGenerativeAI({
        temperature: 0.7,
        apiKey: geminiApiKey,
        modelName: 'gemini-2.5-flash-preview-04-17',
      }),
    };

    return chatModels;
  } catch (err) {
    logger.error(`Error loading Gemini models: ${err}`);
    return {};
  }
};
