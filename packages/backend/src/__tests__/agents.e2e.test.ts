// Place all mocks at the top level, outside describe
jest.mock('@cairo-coder/agents/utils/index', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@cairo-coder/agents/config/settings', () => ({
  getVectorDbConfig: jest.fn().mockReturnValue({
    host: 'localhost',
    port: 5432,
    user: 'test',
    password: 'test',
    database: 'test',
  }),
  getPort: jest.fn().mockReturnValue(3000),
  getHostedModeConfig: jest.fn().mockReturnValue({
    DEFAULT_CHAT_PROVIDER: 'openai',
    DEFAULT_CHAT_MODEL: 'gpt-4',
    DEFAULT_FAST_CHAT_PROVIDER: 'openai',
    DEFAULT_FAST_CHAT_MODEL: 'gpt-3.5-turbo',
    DEFAULT_EMBEDDING_PROVIDER: 'openai',
    DEFAULT_EMBEDDING_MODEL: 'text-embedding-ada-002',
  }),
}));

jest.mock('../config/provider', () => ({
  getAvailableChatModelProviders: jest.fn().mockResolvedValue({
    openai: {
      'gpt-4': {
        invoke: jest.fn().mockResolvedValue({ content: 'Mocked response' }),
      },
      'gpt-3.5-turbo': {
        invoke: jest.fn().mockResolvedValue({ content: 'Mocked response' }),
      },
    },
  }),
  getAvailableEmbeddingModelProviders: jest.fn().mockResolvedValue({
    openai: {
      'text-embedding-ada-002': {
        embedQuery: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]),
      },
    },
  }),
}));

jest.mock('@cairo-coder/agents/db/postgresVectorStore', () => ({
  VectorStore: {
    getInstance: jest.fn().mockResolvedValue({
      similaritySearch: jest.fn().mockResolvedValue([]),
    }),
  },
}));

const EventEmitter = require('events');
jest.mock('@cairo-coder/agents', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
  getVectorDbConfig: jest.fn().mockReturnValue({
    host: 'localhost',
    port: 5432,
    user: 'test',
    password: 'test',
    database: 'test',
  }),
  RagAgentFactory: {
    createAgent: jest.fn().mockImplementation(() => {
      const emitter = new EventEmitter();
      process.nextTick(() => {
        emitter.emit(
          'data',
          JSON.stringify({ type: 'response', data: 'Test response' }),
        );
        emitter.emit('end');
      });
      return emitter;
    }),
    createAgentById: jest.fn().mockImplementation(() => {
      const emitter = new EventEmitter();
      process.nextTick(() => {
        emitter.emit(
          'data',
          JSON.stringify({ type: 'response', data: 'Agent response' }),
        );
        emitter.emit('end');
      });
      return emitter;
    }),
  },
  TokenTracker: Object.assign(
    jest.fn().mockImplementation(() => ({
      getTotalTokens: jest.fn().mockReturnValue(100),
      reset: jest.fn(),
    })),
    {
      getSessionTokenUsage: jest.fn().mockReturnValue({
        totalTokens: 100,
        promptTokens: 50,
        completionTokens: 50,
      }),
    },
  ),
  getAgent: jest.fn().mockImplementation((id) => {
    if (id === 'cairo-coder') {
      return {
        id: 'cairo-coder',
        name: 'Cairo Coder',
        description: 'Cairo assistant',
      };
    }
    return null;
  }),
  listAgents: jest.fn().mockReturnValue([
    {
      id: 'cairo-coder',
      name: 'Cairo Coder',
      description: 'Cairo assistant',
      sources: ['cairo-docs'],
    },
  ]),
  getAgents: jest.fn().mockReturnValue([
    {
      id: 'cairo-coder',
      name: 'Cairo Coder',
      description: 'Cairo assistant',
      sources: ['cairo-docs'],
    },
  ]),
}));

import request from 'supertest';
import { Express } from 'express';
import { createApplication } from '../server';

describe('Agents E2E Tests (Mocked)', () => {
  let app: Express;

  beforeAll(async () => {
    const { server, container } = await createApplication();
    app = container.getContext().app;
  });

  describe('Basic functionality', () => {
    it('should list agents', async () => {
      const response = await request(app).get('/v1/agents').expect(200);

      expect(response.body).toHaveProperty('agents');
      expect(response.body.agents).toHaveLength(1);
      expect(response.body.agents[0].id).toBe('cairo-coder');
    });

    it('should handle chat completions', async () => {
      const response = await request(app)
        .post('/v1/chat/completions')
        .send({
          messages: [{ role: 'user', content: 'Hello' }],
          stream: false,
        })
        .expect(200);

      expect(response.body).toHaveProperty('choices');
      expect(response.body.choices[0].message.content).toBe('Test response');
      expect(response.body).toHaveProperty('usage');
      expect(response.headers['x-total-tokens']).toBe('100');
    });

    it('should handle agent-specific completions', async () => {
      const response = await request(app)
        .post('/v1/agents/cairo-coder/chat/completions')
        .send({
          messages: [{ role: 'user', content: 'Hello' }],
          stream: false,
        })
        .expect(200);

      expect(response.body.choices[0].message.content).toBe('Agent response');
    });

    it('should return 404 for unknown agent', async () => {
      const response = await request(app)
        .post('/v1/agents/unknown/chat/completions')
        .send({
          messages: [{ role: 'user', content: 'Hello' }],
        })
        .expect(404);

      expect(response.body.error.code).toBe('agent_not_found');
    });

    it('should validate empty messages', async () => {
      const response = await request(app)
        .post('/v1/chat/completions')
        .send({
          messages: [],
        })
        .expect(400);

      expect(response.body.error.code).toBe('invalid_messages');
    });

    it('should validate last message is from user', async () => {
      const response = await request(app)
        .post('/v1/chat/completions')
        .send({
          messages: [
            { role: 'user', content: 'Hello' },
            { role: 'assistant', content: 'Hi' },
          ],
        })
        .expect(400);

      expect(response.body.error.code).toBe('invalid_last_message');
    });
  });

  describe('Error handling', () => {
    it('should handle invalid message roles', async () => {
      const response = await request(app)
        .post('/v1/chat/completions')
        .send({
          messages: [{ role: 'invalid-role', content: 'Hello' }],
        })
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle missing content in messages', async () => {
      const response = await request(app)
        .post('/v1/chat/completions')
        .send({
          messages: [{ role: 'user' }],
        })
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('MCP Mode', () => {
    it('should handle MCP mode requests', async () => {
      // Update mock for MCP mode
      const { RagAgentFactory } = require('@cairo-coder/agents');
      RagAgentFactory.createAgentById.mockImplementationOnce(() => {
        const emitter = new EventEmitter();
        process.nextTick(() => {
          emitter.emit(
            'data',
            JSON.stringify({ type: 'response', data: 'MCP response' }),
          );
          emitter.emit(
            'data',
            JSON.stringify({
              type: 'sources',
              data: [
                { pageContent: 'Source content', metadata: { source: 'test' } },
              ],
            }),
          );
          emitter.emit('end');
        });
        return emitter;
      });

      const response = await request(app)
        .post('/v1/agents/cairo-coder/chat/completions')
        .set('x-mcp-mode', 'true')
        .send({
          messages: [{ role: 'user', content: 'Test MCP' }],
          stream: false,
        })
        .expect(200);

      expect(response.body).toHaveProperty('sources');
      expect(Array.isArray(response.body.sources)).toBe(true);
      expect(response.body.sources[0]).toHaveProperty('pageContent');
    });
  });
});
