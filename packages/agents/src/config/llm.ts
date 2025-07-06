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

// Initialize AxAI instances for each provider
const initializeOpenAI = () => {
  const apiKey = getOpenaiApiKey();
  if (!apiKey) return null;

  return new AxAI({
    name: 'openai',
    apiKey,
    models: [
      {
        key: 'fast',
        model: AxAIOpenAIModel.GPT4OMini,
        description: 'Model for simple tasks and fast responses',
      },
      {
        key: 'default',
        model: AxAIOpenAIModel.GPT4O,
        description: 'Model for complex tasks like code generation',
      },
      {
        key: 'embeddings',
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
        key: 'default',
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
        key: 'fast',
        model: AxAIGoogleGeminiModel.Gemini25Flash,
        description: 'Fast model for simple tasks',
      },
      {
        key: 'default',
        model: AxAIGoogleGeminiModel.Gemini25Pro,
        description: 'Advanced model for complex tasks',
      },
    ],
  });
};

const initializeGroq = () => {
  const apiKey = getGroqApiKey();
  return null;
};

const initializeDeepSeek = () => {
  const apiKey = getDeepseekApiKey();
  return null;
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

  // TODO(migrate-ax): remove dead code
  const groq = initializeGroq();
  if (groq) services.push(groq);

  const deepseek = initializeDeepSeek();
  if (deepseek) services.push(deepseek);

  if (services.length === 0) {
    throw new Error(
      'No LLM providers configured. Please set at least one API key in config.toml',
    );
  }

  // Create the router with all available services
  axRouter = new AxMultiServiceRouter(services);

  return axRouter;
};

// Helper function to get the appropriate model based on config
// TODO: fix the names to return the proper names
export const getModelForTask = (
  taskType: 'default' | 'fast' = 'default',
): string => {
  const config = getHostedModeConfig();

  if (taskType === 'fast' && config.DEFAULT_FAST_CHAT_PROVIDER) {
    // Map provider + model to router key
    const provider = config.DEFAULT_FAST_CHAT_PROVIDER;
    const model = config.DEFAULT_FAST_CHAT_MODEL;

    if (provider === 'groq') return 'fast';
    if (provider === 'anthropic') return 'default';
    if (provider === 'openai' && model?.includes('mini')) return 'fast';
    if (
      (provider === 'google-gemini' || provider === 'gemini') &&
      model?.includes('flash')
    )
      return 'fast';
  }

  // Default model selection based on provider config
  const defaultProvider = config.DEFAULT_CHAT_PROVIDER;

  if (defaultProvider === 'openai') return 'default';
  if (defaultProvider === 'anthropic') return 'default';
  if (defaultProvider === 'google-genai' || defaultProvider === 'gemini')
    return 'default';
  if (defaultProvider === 'deepseek') return 'default';

  // Fallback to any available model
  return 'default';
};
