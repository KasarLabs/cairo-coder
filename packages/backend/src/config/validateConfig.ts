import { ServerConfig } from '../types';

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
