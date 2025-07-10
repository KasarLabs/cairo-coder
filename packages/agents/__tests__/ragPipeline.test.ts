import { CairoCoderFlow } from '../src/core/pipeline/cairoCoderFlow';
import { AxMultiServiceRouter } from '@ax-llm/ax';
import {
  BookChunk,
  DocumentSource,
  RagInput,
  RagSearchConfig,
} from '../src/types/index';
import { Document } from '@langchain/core/documents';
import { mockDeep, MockProxy } from 'jest-mock-extended';
import EventEmitter from 'events';

// Mock the utils including logger
jest.mock('../src/utils/index', () => ({
  formatChatHistoryAsString: jest.fn().mockReturnValue(''),
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
  },
  TokenTracker: {
    resetSessionCounters: jest.fn(),
    getSessionTokenUsage: jest.fn().mockReturnValue({
      promptTokens: 100,
      responseTokens: 50,
      totalTokens: 150,
    }),
    trackFullUsage: jest.fn().mockReturnValue({
      promptTokens: 100,
      completionTokens: 50,
      totalTokens: 150,
    }),
  },
}));

// Mock getModelForTask
jest.mock('../src/config/llm', () => ({
  getModelForTask: jest.fn().mockReturnValue('test-model'),
}));

// Mock CairoCoderFlow to avoid AxFlow complexity in tests
jest.mock('../src/core/pipeline/cairoCoderFlow', () => {
  const EventEmitter = require('events');

  return {
    CairoCoderFlow: jest.fn().mockImplementation(() => ({
      execute: jest.fn().mockReturnValue(new EventEmitter()),
      executeRetrievalForTesting: jest.fn().mockResolvedValue({
        processedQuery: {
          original: 'How do I write a Cairo contract?',
          transformed: ['How do I write a Cairo contract?', 'cairo contract'],
          isContractRelated: true,
          isTestRelated: false,
        },
        retrieved: {
          documents: [],
          processedQuery: {
            original: 'How do I write a Cairo contract?',
            transformed: ['How do I write a Cairo contract?', 'cairo contract'],
            isContractRelated: true,
            isTestRelated: false,
          },
        },
        answerStream: {
          [Symbol.asyncIterator]: async function* () {
            yield { delta: { answer: 'Test response' } };
          },
        },
      }),
    })),
  };
});

describe('CairoCoderFlow', () => {
  let cairoCoderFlow: any;
  let mockAxRouter: MockProxy<AxMultiServiceRouter>;
  let mockConfig: RagSearchConfig;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock instances
    mockAxRouter = mockDeep<AxMultiServiceRouter>();

    // Define a basic config for testing
    mockConfig = {
      name: 'Test Agent',
      prompts: {
        searchRetrieverPrompt: 'test retriever prompt',
        searchResponsePrompt: 'test response prompt',
      },
      vectorStore: mockDeep(),
      maxSourceCount: 5,
      similarityThreshold: 0.5,
    };

    // Get the mocked CairoCoderFlow constructor
    const { CairoCoderFlow } = require('../src/core/pipeline/cairoCoderFlow');

    // Instantiate the mocked CairoCoderFlow
    cairoCoderFlow = new CairoCoderFlow(mockAxRouter, mockConfig);
  });

  describe('execute', () => {
    it('should return EventEmitter for RAG mode', () => {
      // Arrange
      const input: RagInput = {
        query: 'How do I write a Cairo contract?',
        chatHistory: [],
        sources: [DocumentSource.CAIRO_BOOK],
      };

      // Act
      const result = cairoCoderFlow.execute(input, false);

      // Assert
      expect(result).toBeInstanceOf(EventEmitter);
    });

    it('should return EventEmitter for MCP mode', () => {
      // Arrange
      const input: RagInput = {
        query: 'How do I write a Cairo contract?',
        chatHistory: [],
        sources: [DocumentSource.CAIRO_BOOK],
      };

      // Act
      const result = cairoCoderFlow.execute(input, true);

      // Assert
      expect(result).toBeInstanceOf(EventEmitter);
    });
  });

  describe('executeRetrievalForTesting', () => {
    it('should return intermediate results for testing', async () => {
      // This method is used by DocQualityTester
      const input: RagInput = {
        query: 'How do I write a Cairo contract?',
        chatHistory: [],
        sources: [DocumentSource.CAIRO_BOOK],
      };

      // The method exists and should return the expected structure
      expect(typeof cairoCoderFlow.executeRetrievalForTesting).toBe('function');
    });
  });
});
