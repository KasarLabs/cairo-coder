/**
 * LLM Provider Configuration and Router
 *
 * This module handles:
 * - Multi-provider LLM configuration (OpenAI, Anthropic, Google Gemini)
 * - Model selection based on configuration settings
 * - Automatic tracing integration for observability
 * - Provider-specific model mapping
 */

import {
  AxAI,
  AxAIAnthropicModel,
  AxAIGoogleGeminiModel,
  AxAIOpenAIEmbedModel,
  AxAIOpenAIModel,
  AxMultiServiceRouter,
} from '@ax-llm/ax';
import {
  getAnthropicApiKey,
  getGeminiApiKey,
  getHostedModeConfig,
  getOpenaiApiKey,
} from './settings';
import { initializeTracer } from './tracer';

/**
 * Get the default fast chat model based on configuration
 */
/**
 * Returns the key for the default fast chat model based on configuration settings.
 * Maps provider and model names to predefined keys, with a fallback to 'gemini-fast'.
 * @returns {string} The model key string.
 */
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

/**
 * Get the default chat model based on configuration
 */
/**
 * Returns the key for the default chat model based on configuration settings.
 * Maps provider and model names to predefined keys, with a fallback to 'gemini-fast'.
 * @returns {string} The model key string.
 */
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

/**
 * Get the default embedding model based on configuration
 * @private
 */
const _GET_DEFAULT_EMBEDDING_MODEL = () => {
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

/**
 * Initialize OpenAI provider with configured models
 */
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

/**
 * Initialize Anthropic provider with configured models
 */
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

/**
 * Initialize Google Gemini provider with configured models
 */
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

/**
 * Singleton router instance for multi-provider LLM access
 */
let axRouter: AxMultiServiceRouter | null = null;

/**
 * Get or create the multi-service LLM router
 *
 * This function:
 * - Initializes tracing for LLM operations
 * - Creates provider instances based on available API keys
 * - Returns a router that can route requests to appropriate providers
 *
 * @throws Error if no LLM providers are configured
 */
/**
 * Returns the singleton instance of the multi-service LLM router.
 * Initializes providers based on available API keys and throws an error if none are configured.
 * @returns {AxMultiServiceRouter} The configured router instance.
 * @throws {Error} If no LLM providers are configured.
 */
export const getAxRouter = (): AxMultiServiceRouter => {
  if (axRouter) return axRouter;

  const services = [];

  // Initialize tracing before creating LLM providers
  initializeTracer();

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
