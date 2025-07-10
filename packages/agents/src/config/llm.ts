import {
  AxAI,
  AxMultiServiceRouter,
  AxAIOpenAIModel,
  AxAIAnthropicModel,
  AxAIGoogleGeminiModel,
  AxAIService,
  AxAIOpenAIEmbedModel,
} from '@ax-llm/ax';
import {
  getOpenaiApiKey,
  getGroqApiKey,
  getAnthropicApiKey,
  getDeepseekApiKey,
  getGeminiApiKey,
  getHostedModeConfig,
} from './settings';
import { logger } from '../utils';

export const GET_DEFAULT_FAST_CHAT_MODEL = () => {
  const config = getHostedModeConfig();
  const provider = config.DEFAULT_FAST_CHAT_PROVIDER;
  const model = config.DEFAULT_FAST_CHAT_MODEL;

  // Map provider and model to the corresponding key
  if (provider === 'gemini' && model === 'Gemini Flash 2.5') {
    return 'gemini-fast';
  }
  if (provider === 'openai' && model === 'GPT-4o Mini') {
    return 'openai-fast';
  }
  if (provider === 'openai' && model === 'GPT-4o') {
    return 'openai-default';
  }
  if (provider === 'anthropic' && model === 'Claude 4 Sonnet') {
    return 'anthropic-default';
  }

  // Default fallback
  return 'gemini-fast';
};

export const GET_DEFAULT_CHAT_MODEL = () => {
  const config = getHostedModeConfig();
  const provider = config.DEFAULT_CHAT_PROVIDER;
  const model = config.DEFAULT_CHAT_MODEL;

  // Map provider and model to the corresponding key
  if (provider === 'gemini' && model === 'Gemini Flash 2.5') {
    return 'gemini-fast';
  }
  if (provider === 'openai' && model === 'GPT-4o Mini') {
    return 'openai-fast';
  }
  if (provider === 'openai' && model === 'GPT-4o') {
    return 'openai-default';
  }
  if (provider === 'anthropic' && model === 'Claude 4 Sonnet') {
    return 'anthropic-default';
  }

  // Default fallback
  return 'gemini-fast';
};

const GET_DEFAULT_EMBEDDING_MODEL = () => {
  const config = getHostedModeConfig();
  const provider = config.DEFAULT_EMBEDDING_PROVIDER;
  const model = config.DEFAULT_EMBEDDING_MODEL;

  // Map provider and model to the corresponding key
  if (provider === 'openai' && model === 'Text embedding 3 large') {
    return 'openai-embeddings';
  }

  // Default fallback
  return 'openai-embeddings';
};

// Initialize AxAI instances for each provider
const initializeOpenAI = () => {
  const apiKey = getOpenaiApiKey();
  if (!apiKey) return null;

  return new AxAI({
    name: 'openai',
    apiKey,
    models: [
      {
        key: 'openai-fast',
        model: AxAIOpenAIModel.GPT4OMini,
        description: 'Model for simple tasks and fast responses',
      },
      {
        key: 'openai-default',
        model: AxAIOpenAIModel.GPT4O,
        description: 'Model for complex tasks like code generation',
      },
      {
        key: 'openai-embeddings',
        embedModel: AxAIOpenAIEmbedModel.TextEmbedding3Large,
        description: 'Model for embeddings',
      },
    ],
  });
};

const initializeAnthropic = () => {
  const apiKey = getAnthropicApiKey();
  if (!apiKey) return null;

  return new AxAI({
    name: 'anthropic',
    apiKey,
    models: [
      {
        key: 'anthropic-default',
        model: AxAIAnthropicModel.Claude4Sonnet,
        description: 'Model for complex reasoning and code generation',
      },
    ],
  });
};

const initializeGemini = () => {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;

  return new AxAI({
    name: 'google-gemini',
    apiKey,
    models: [
      {
        key: 'gemini-fast',
        model: AxAIGoogleGeminiModel.Gemini25Flash,
        description: 'Fast model for simple tasks',
      },
      {
        key: 'gemini-default',
        model: AxAIGoogleGeminiModel.Gemini25Pro,
        description: 'Advanced model for complex tasks',
      },
    ],
  });
};

// Create and export the singleton router instance
let axRouter: AxMultiServiceRouter | null = null;

export const getAxRouter = (): AxMultiServiceRouter => {
  if (axRouter) return axRouter;

  const services = [];

  // Initialize all available providers
  const openai = initializeOpenAI();
  if (openai) services.push(openai);

  const anthropic = initializeAnthropic();
  if (anthropic) services.push(anthropic);

  const gemini = initializeGemini();
  if (gemini) services.push(gemini);

  if (services.length === 0) {
    throw new Error(
      'No LLM providers configured. Please set at least one API key in config.toml',
    );
  }

  // Create the router with all available services
  axRouter = new AxMultiServiceRouter(services);

  return axRouter;
};
