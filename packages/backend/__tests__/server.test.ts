import { createApplication } from '../src/server';
import { Container } from '../src/config/context';
import express from 'express';
import { Server } from 'http';
import supertest from 'supertest';

// Mock the LLM config initialization
jest.mock('../src/config/llm', () => ({
  initializeLLMConfig: jest.fn().mockResolvedValue({
    defaultLLM: {},
    fastLLM: {},
    embeddings: {},
  }),
}));

// Mock config to avoid the getStarknetFoundryVersion issue
jest.mock('@cairo-coder/agents/config/settings', () => ({
  getPort: jest.fn().mockReturnValue(3001),
  getStarknetFoundryVersion: jest.fn().mockReturnValue('0.1.0'),
  getScarbVersion: jest.fn().mockReturnValue('0.1.0'),
  getSimilarityMeasure: jest.fn().mockReturnValue('cosine'),
  getVectorDbConfig: jest.fn().mockReturnValue({
    POSTGRES_USER: 'test',
    POSTGRES_PASSWORD: 'test',
    POSTGRES_DB: 'test',
    POSTGRES_HOST: 'localhost',
    POSTGRES_PORT: '5432',
  }),
  getOpenaiApiKey: jest.fn().mockReturnValue('test-key'),
  getAnthropicApiKey: jest.fn().mockReturnValue(''),
  getGeminiApiKey: jest.fn().mockReturnValue('test-key'),
  getGroqApiKey: jest.fn().mockReturnValue(''),
  getDeepseekApiKey: jest.fn().mockReturnValue(''),
  getHostedModeConfig: jest.fn().mockReturnValue({
    DEFAULT_CHAT_PROVIDER: 'gemini',
    DEFAULT_CHAT_MODEL: 'Gemini Flash 2.5',
    DEFAULT_FAST_CHAT_PROVIDER: 'gemini',
    DEFAULT_FAST_CHAT_MODEL: 'Gemini Flash 2.5',
    DEFAULT_EMBEDDING_PROVIDER: 'openai',
    DEFAULT_EMBEDDING_MODEL: 'Text embedding 3 large',
  }),
}));

// Mock HTTP handling to avoid actual initialization
jest.mock('../src/config/http', () => ({
  initializeHTTP: jest.fn(),
}));

describe('Server', () => {
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

  it('should set up the correct Container context', async () => {
    // Act
    await createApplication();
    const context = Container.getInstance().getContext();

    // Assert
    expect(context.app).toBeDefined();
    expect(context.config).toBeDefined();
    expect(context.config.port).toBe(3001);
  });
});
