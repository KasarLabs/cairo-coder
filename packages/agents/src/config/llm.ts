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
import {
  BasicTracerProvider,
  ConsoleSpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base'
import {
  MeterProvider,
  ConsoleMetricExporter,
  PeriodicExportingMetricReader,
} from '@opentelemetry/sdk-metrics'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { trace, metrics, Tracer, Meter } from '@opentelemetry/api'
import { axGlobals } from '@ax-llm/ax'




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
const initializeOpenAI = (tracer: Tracer, meter: Meter) => {
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
    options: {
      tracer,
    }
  });
};

const initializeAnthropic = (tracer: Tracer, meter: Meter) => {
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
    options: {
      tracer,
    }
  });
};

const initializeGemini = (tracer: Tracer, meter: Meter) => {
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
    options: {
      tracer,
    }
  });
};

const initializeTracer = () => {
  // Set up basic tracing

  const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  const langsmithApiKey = process.env.LANGSMITH_API_KEY;

  const langfusePublicApiKey = process.env.LANGFUSE_PUBLIC_API_KEY;
  const langfusePrivateApiKey = process.env.LANGFUSE_PRIVATE_API_KEY;
  const langfuseBase64Encoding = Buffer.from(`${langfusePublicApiKey}:${langfusePrivateApiKey}`).toString('base64');
  if (!langfusePublicApiKey || !langfusePrivateApiKey || !langfuseBase64Encoding) {
    throw new Error('LANGFUSE_PUBLIC_API_KEY and LANGFUSE_PRIVATE_API_KEY environment variables are required');
  }

  if (!otlpEndpoint) {
    throw new Error('OTEL_EXPORTER_OTLP_ENDPOINT environment variable is required');
  }

  if (!langsmithApiKey) {
    throw new Error('LANGSMITH_API_KEY environment variable is required');
  }
  const otlpExporter = new OTLPTraceExporter({
    url: otlpEndpoint,
    headers: {
      'Authorization': `Basic ${langfuseBase64Encoding}`,
    },
  })
  logger.info(`otlpExporter: ${otlpEndpoint}, langfuseBase64Encoding: ${langfuseBase64Encoding}`);
  const tracerProvider = new BasicTracerProvider({spanProcessors: [new SimpleSpanProcessor(otlpExporter)]})
  trace.setGlobalTracerProvider(tracerProvider)

  // Set up basic metrics
  const meterProvider = new MeterProvider({
    readers: [
      new PeriodicExportingMetricReader({
        exporter: new ConsoleMetricExporter(),
        exportIntervalMillis: 5000,
      }),
    ],
  })
  metrics.setGlobalMeterProvider(meterProvider)

  // Get your tracer and meter
  const tracer = trace.getTracer('cairo-coder')
  const meter = metrics.getMeter('cairo-coder')

    // Global tracer
  axGlobals.tracer = trace.getTracer('global-ax-tracer')
  // Global meter
  axGlobals.meter = metrics.getMeter('global-ax-meter')

return {tracer, meter}
};

// Create and export the singleton router instance
let axRouter: AxMultiServiceRouter | null = null;

export const getAxRouter = (): AxMultiServiceRouter => {
  if (axRouter) return axRouter;

  const services = [];
  const {tracer, meter} = initializeTracer();

  // Initialize all available providers
  const openai = initializeOpenAI(tracer, meter);
  if (openai) services.push(openai);

  const anthropic = initializeAnthropic(tracer, meter);
  if (anthropic) services.push(anthropic);

  const gemini = initializeGemini(tracer, meter);
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
