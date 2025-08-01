import path from 'path';
import { VectorStoreConfig } from '../types';
import dotenv from 'dotenv';
const dotenvPath = path.join(__dirname, '../../../../.env');
dotenv.config({ path: dotenvPath });

// Provider configuration from environment variables with defaults
export const getHostedModeConfig = () => ({
  DEFAULT_CHAT_PROVIDER: process.env.DEFAULT_CHAT_PROVIDER || 'gemini',
  DEFAULT_CHAT_MODEL: process.env.DEFAULT_CHAT_MODEL || 'Gemini Flash 2.5',
  DEFAULT_FAST_CHAT_PROVIDER:
    process.env.DEFAULT_FAST_CHAT_PROVIDER || 'gemini',
  DEFAULT_FAST_CHAT_MODEL:
    process.env.DEFAULT_FAST_CHAT_MODEL || 'Gemini Flash 2.5',
  DEFAULT_EMBEDDING_PROVIDER:
    process.env.DEFAULT_EMBEDDING_PROVIDER || 'openai',
  DEFAULT_EMBEDDING_MODEL:
    process.env.DEFAULT_EMBEDDING_MODEL || 'Text embedding 3 large',
});

export const getPort = () => parseInt(process.env.PORT || '3001');

export const getSimilarityMeasure = () => process.env.SIMILARITY_MEASURE;

// API Keys from environment variables only
export const getOpenaiApiKey = () => process.env.OPENAI_API_KEY;

export const getGroqApiKey = () => process.env.GROQ_API_KEY;

export const getAnthropicApiKey = () => process.env.ANTHROPIC_API_KEY;

export const getDeepseekApiKey = () => process.env.DEEPSEEK_API_KEY;

export const getGeminiApiKey = () => process.env.GEMINI_API_KEY;

export const getVectorDbConfig = (): VectorStoreConfig => {
  // All database configuration from environment variables
  return {
    POSTGRES_USER: process.env.POSTGRES_USER || 'cairocoder',
    POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD || '',
    POSTGRES_DB: process.env.POSTGRES_DB || 'cairocoder',
    POSTGRES_HOST: process.env.POSTGRES_HOST || 'postgres',
    POSTGRES_PORT: process.env.POSTGRES_PORT || '5432',
  };
};

export const getStarknetFoundryVersion = () =>
  process.env.STARKNET_FOUNDRY_VERSION || '0.47.0';

export const getScarbVersion = () => process.env.SCARB_VERSION || '2.11.4';
