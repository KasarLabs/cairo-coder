import express from 'express';
import http from 'http';
import cors from 'cors';
import { getPort } from '@cairo-coder/agents/config/settings';
import { logger } from '@cairo-coder/agents/utils/index';
import { initializeHTTP } from './config/http';
import { Container } from './config/context';
import { validateConfig } from './config/validateConfig';

export async function createApplication() {
  try {
    // Initialize container
    const container = Container.getInstance();

    // Create config
    const config = {
      port: getPort(),
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

    // Initialize both HTTP with container
    initializeHTTP(app, container);

    // Update container with initialized services
    container.setContext({ app });

    return { server, container };
  } catch (error) {
    logger.error('Failed to create application:', error);
    throw error;
  }
}
