import { RagAgentFactory } from '../agentFactory';
import { BaseMessage } from '@langchain/core/messages';
import { Embeddings } from '@langchain/core/embeddings';
import { VectorStore } from '../../db/postgresVectorStore';
import { LLMConfig } from '../../types';
import EventEmitter from 'events';

// Mock dependencies
jest.mock('../../db/postgresVectorStore');
jest.mock('../pipeline/ragPipeline', () => ({
  RagPipeline: jest.fn().mockImplementation(() => ({
    execute: jest.fn().mockReturnValue(new EventEmitter()),
  })),
}));
jest.mock('../pipeline/mcpPipeline', () => ({
  McpPipeline: jest.fn().mockImplementation(() => ({
    execute: jest.fn().mockReturnValue(new EventEmitter()),
  })),
}));
jest.mock('../../config/agents', () => ({
  getAgent: jest.fn().mockImplementation((agentId) => {
    if (agentId === 'cairo-coder') {
      return {
        id: 'cairo-coder',
        name: 'Cairo Coder',
        description: 'Default Cairo language assistant',
        sources: ['cairo_book'],
        prompts: {
          searchRetrieverPrompt: 'test prompt',
          searchResponsePrompt: 'test prompt',
        },
        parameters: {
          maxSourceCount: 15,
          similarityThreshold: 0.4,
        },
      };
    }
    return undefined;
  }),
}));
jest.mock('../../config/agent', () => ({
  getAgentConfig: jest.fn().mockReturnValue({
    vectorStore: {},
    sources: ['cairo_book'],
    prompts: {
      searchRetrieverPrompt: 'test prompt',
      searchResponsePrompt: 'test prompt',
    },
    templates: {},
    maxSourceCount: 15,
    similarityThreshold: 0.4,
  }),
  getAgentConfigById: jest.fn().mockResolvedValue({
    vectorStore: {},
    sources: ['cairo_book'],
    prompts: {
      searchRetrieverPrompt: 'test prompt',
      searchResponsePrompt: 'test prompt',
    },
    templates: {},
    maxSourceCount: 15,
    similarityThreshold: 0.4,
  }),
}));

describe('RagAgentFactory', () => {
  const mockMessage = 'Test query';
  const mockHistory: BaseMessage[] = [];
  const mockLLM: LLMConfig = {} as LLMConfig;
  const mockEmbeddings = {} as Embeddings;
  const mockVectorStore = {} as VectorStore;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createAgentById', () => {
    it('should create agent with specific ID', async () => {
      const result = await RagAgentFactory.createAgentById(
        mockMessage,
        mockHistory,
        'cairo-coder',
        mockLLM,
        mockEmbeddings,
        mockVectorStore,
        false,
      );

      expect(result).toBeInstanceOf(EventEmitter);
    });

    it('should throw error for non-existent agent', async () => {
      await expect(
        RagAgentFactory.createAgentById(
          mockMessage,
          mockHistory,
          'non-existent',
          mockLLM,
          mockEmbeddings,
          mockVectorStore,
          false,
        ),
      ).rejects.toThrow('Agent configuration not found: non-existent');
    });
  });
});
