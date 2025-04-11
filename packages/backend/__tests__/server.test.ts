import { createApplication } from '../src/server';
import { Container } from '../src/types/context';
import express from 'express';
import { Server } from 'http';
import supertest from 'supertest';
import { WebSocketServer } from 'ws';

describe('Server', () => {
  jest.mock('../src/lib/modelProviderService', () => ({
    initializeLLMConfig: jest.fn().mockResolvedValue({
      defaultLLM: {},
      fastLLM: {},
      embeddings: {},
    }),
  }));

  // Mock config to avoid the getStarknetFoundryVersion issue
  jest.mock('@starknet-agent/agents/config', () => ({
    getPort: jest.fn().mockReturnValue(3001),
    getStarknetFoundryVersion: jest.fn().mockReturnValue('0.1.0'),
    getScarbVersion: jest.fn().mockReturnValue('0.1.0'),
    getCairoDbConfig: jest.fn().mockReturnValue({}),
    getStarknetDbConfig: jest.fn().mockReturnValue({}),
    getStarknetEcosystemDbConfig: jest.fn().mockReturnValue({}),
    getStarknetFoundryDbConfig: jest.fn().mockReturnValue({}),
    getCairoByExampleDbConfig: jest.fn().mockReturnValue({}),
  }));

  // Mock WebSocket handling to avoid actual initialization
  jest.mock('../src/websocket', () => ({
    initializeWebSocket: jest
      .fn()
      .mockReturnValue(new WebSocketServer({ noServer: true })),
  }));

  // Mock HTTP handling to avoid actual initialization
  jest.mock('../src/http', () => ({
    initializeHTTP: jest.fn(),
  }));

  let container: Container;
  let server: Server;

  beforeEach(() => {
    // Reset container instance
    (Container as any).instance = undefined;
    container = Container.getInstance();

    // Set up container with minimal configuration
    container.setContext({
      config: {
        port: 3001,
        models: {
          defaultLLM: {} as any,
          fastLLM: {} as any,
          embeddings: {} as any,
        },
        cors: {
          origin: '*',
        },
      },
    });
  });

  afterEach(() => {
    // Close server if it's running
    if (server) {
      server.close();
    }
  });

  it('should create an HTTP server and container', async () => {
    // Act
    const result = await createApplication();
    server = result.server;

    // Assert
    expect(result.server).toBeDefined();
    expect(result.container).toBeDefined();
    expect(result.container).toBe(Container.getInstance());
  });

  it('should set up CORS', async () => {
    // Arrange
    const result = await createApplication();
    server = result.server;
    const app = Container.getInstance().getContext().app as express.Express;

    // Act - Send request with Origin header
    const response = await supertest(app)
      .options('/')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'GET');

    // Assert - CORS headers should be present
    expect(response.headers['access-control-allow-origin']).toBeDefined();
  });

  it('should create a WebSocketServer', async () => {
    // Act
    await createApplication();
    const context = Container.getInstance().getContext();

    // Assert
    expect(context.wss).toBeDefined();
    expect(context.wss).toBeInstanceOf(WebSocketServer);
  });

  it('should set up the correct Container context', async () => {
    // Act
    await createApplication();
    const context = Container.getInstance().getContext();

    // Assert
    expect(context.app).toBeDefined();
    expect(context.wss).toBeDefined();
    expect(context.config).toBeDefined();
    expect(context.config.port).toBe(3001);
  });
});
