import { type VectorStoreConfig } from '../types';
import dotenv from 'dotenv';
import { getRepoPath } from '../utils/paths';

dotenv.config({ path: getRepoPath('.env') });

// API Keys from environment variables only
export const getOpenaiApiKey = () => process.env.OPENAI_API_KEY;

export const getGeminiApiKey = () => process.env.GEMINI_API_KEY;

export const getVectorDbConfig = (): VectorStoreConfig => {
  // All database configuration from environment variables
  return {
    POSTGRES_USER: process.env.POSTGRES_USER || 'cairocoder',
    POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD || '',
    POSTGRES_DB: process.env.POSTGRES_DB || 'cairocoder',
    POSTGRES_HOST: process.env.POSTGRES_HOST || 'postgres',
    POSTGRES_PORT: process.env.POSTGRES_PORT || '5432',
    POSTGRES_TABLE_NAME: process.env.POSTGRES_TABLE_NAME || 'documents',
  };
};
