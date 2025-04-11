import { RagAgentFactory } from '../src/ragAgentFactory';
import { RagPipeline } from '../src/pipeline/ragPipeline';
import { AvailableAgents, LLMConfig } from '../src/config/agentConfigs';
import { Embeddings } from '@langchain/core/embeddings';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { VectorStore } from '../src/db/vectorStore';
import { mockDeep, MockProxy } from 'jest-mock-extended';
import { BaseMessage } from '@langchain/core/messages';
import EventEmitter from 'events';

// Mock the agent configuration and RagPipeline
jest.mock('../src/config/agentConfigs', () => ({
  AvailableAgents: {
    cairoBook: 'cairoBook',
    starknetDocs: 'starknetDocs',
  },
  getAgentConfig: jest.fn().mockImplementation(() => ({
    name: 'Mock Agent',
    prompts: {
      searchRetrieverPrompt: 'mock retriever prompt',
      searchResponsePrompt: 'mock response prompt',
    },
    vectorStore: {},
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
    it('should create an agent for Cairo Book', () => {
      // Arrange
      const agentName: AvailableAgents = 'cairoBook';
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
      });
    });

    it('should create an agent for Starknet Docs', () => {
      // Arrange
      const agentName: AvailableAgents = 'starknetDocs';
      const message = 'What are Starknet transactions?';
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
    });
  });
});
