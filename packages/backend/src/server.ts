import express from 'express';
import http from 'http';
import cors from 'cors';
// import { initializeWebSocket } from './websocket';
import { initializeLLMConfig } from './lib/modelProviderService';
import { getPort } from '@starknet-agent/agents/config';
import logger from './utils/logger';
import { initializeHTTP } from './http';
import { Container } from './types/context';
import { validateConfig } from './config/server';

export async function createApplication() {
  try {
    // Initialize container
    const container = Container.getInstance();

    // Initialize LLM models
    const models = await initializeLLMConfig();

    // Create config
    const config = {
      port: getPort(),
      models,
      cors: {
        origin: '*',
      },
    };

    // Validate config
    validateConfig(config);

    // Create initial context
    container.setContext({ config });

    // Create Express app and HTTP server
    const app = express();
    const server = http.createServer(app);

    // Apply basic middleware
    app.use(cors(config.cors));
    app.use(express.json({ limit: '50mb' }));

    // Initialize both HTTP and WebSocket with container
    initializeHTTP(app, container);
    // const wss = initializeWebSocket(server, container);
    const wss = undefined;

    // Update container with initialized services
    container.setContext({ app, wss });

    return { server, container };
  } catch (error) {
    logger.error('Failed to create application:', error);
    throw error;
  }
}
