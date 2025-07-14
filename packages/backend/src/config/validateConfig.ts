import { ServerConfig } from '../types';

export function validateConfig(config: ServerConfig): void {
  if (!config.port) {
    throw new Error('Port is required');
  }
}
