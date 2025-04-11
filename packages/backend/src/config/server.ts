import http from 'http';
import express from 'express';
import cors from 'cors';
import { CorsOptions } from 'cors';
import { ModelConfig } from '../lib/modelProviderService';

export interface ServerConfig {
  port: number;
  models: ModelConfig;
  cors: CorsOptions;
}

export function validateConfig(config: ServerConfig): void {
  if (!config.port) {
    throw new Error('Port is required');
  }
  if (!config.models) {
    throw new Error('Models configuration is required');
  }
  if (!config.models.defaultLLM) {
    throw new Error('Default LLM is required');
  }
  if (!config.models.embeddings) {
    throw new Error('Embeddings model is required');
  }
}
