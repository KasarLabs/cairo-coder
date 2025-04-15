import { RagAgentFactory } from '../src/core/agentFactory';
import { RagPipeline } from '../src/core/pipeline/ragPipeline';
import { AvailableAgents, LLMConfig, DocumentSource } from '../src/types';
import { Embeddings } from '@langchain/core/embeddings';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { VectorStore } from '../src/db/vectorStore';
import { mockDeep, MockProxy } from 'jest-mock-extended';
import { BaseMessage } from '@langchain/core/messages';
import EventEmitter from 'events';

// Mock the agent configuration and RagPipeline
jest.mock('../src/config/agentConfigs', () => ({
  AvailableAgents: {
    cairoCoder: 'cairoCoder',
  },
  getAgentConfig: jest.fn().mockImplementation(() => ({
    name: 'Cairo Coder',
    prompts: {
      searchRetrieverPrompt: 'mock retriever prompt',
      searchResponsePrompt: 'mock response prompt',
    },
    vectorStore: {},
    maxSourceCount: 15,
    similarityThreshold: 0.4,
    sources: [
      DocumentSource.CAIRO_BOOK,
      DocumentSource.CAIRO_BY_EXAMPLE,
      DocumentSource.STARKNET_FOUNDRY,
    ],
  })),
}));

jest.mock('../src/pipeline/ragPipeline', () => ({
  RagPipeline: jest.fn().mockImplementation(() => ({
    execute: jest.fn().mockReturnValue(new EventEmitter()),
  })),
}));

describe('RagAgentFactory', () => {
  let mockLLM: LLMConfig;
  let mockEmbeddings: MockProxy<Embeddings>;
  let mockVectorStore: MockProxy<VectorStore>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock instances
    mockLLM = {
      defaultLLM: mockDeep<BaseChatModel>(),
      fastLLM: mockDeep<BaseChatModel>(),
    };
    mockEmbeddings = mockDeep<Embeddings>();
    mockVectorStore = mockDeep<VectorStore>();
  });

  describe('createAgent', () => {
    it('should create a cairoCoder agent', () => {
      // Arrange
      const agentName: AvailableAgents = 'cairoCoder';
      const message = 'How do I write a Cairo contract?';
      const history: BaseMessage[] = [];

      // Act
      const emitter = RagAgentFactory.createAgent(
        agentName,
        message,
        history,
        mockLLM,
        mockEmbeddings,
        mockVectorStore,
      );

      // Assert
      expect(RagPipeline).toHaveBeenCalledTimes(1);
      expect(emitter).toBeInstanceOf(EventEmitter);

      // Check that the pipeline execute method was called with the right parameters
      const executeSpy = (RagPipeline as jest.Mock).mock.results[0].value
        .execute;
      expect(executeSpy).toHaveBeenCalledWith({
        query: message,
        chatHistory: history,
        sources: [
          DocumentSource.CAIRO_BOOK,
          DocumentSource.CAIRO_BY_EXAMPLE,
          DocumentSource.STARKNET_FOUNDRY,
        ],
      });
    });

    it('should handle complex Cairo queries', () => {
      // Arrange
      const agentName: AvailableAgents = 'cairoCoder';
      const message = 'Explain how to implement ERC20 token in Cairo';
      const history: BaseMessage[] = [];

      // Act
      const emitter = RagAgentFactory.createAgent(
        agentName,
        message,
        history,
        mockLLM,
        mockEmbeddings,
        mockVectorStore,
      );

      // Assert
      expect(RagPipeline).toHaveBeenCalledTimes(1);
      expect(emitter).toBeInstanceOf(EventEmitter);
      
      // Check streaming option is passed
      const executeSpy = (RagPipeline as jest.Mock).mock.results[0].value
        .execute;
      expect(executeSpy).toHaveBeenCalledWith({
        query: message,
        chatHistory: history,
        sources: [
          DocumentSource.CAIRO_BOOK,
          DocumentSource.CAIRO_BY_EXAMPLE,
          DocumentSource.STARKNET_FOUNDRY,
        ],
      });
    });
  });
});
