import { QueryProcessor } from '../src/core/pipeline/queryProcessor';
import { AxMultiServiceRouter } from '@ax-llm/ax';
import { RagInput, RagSearchConfig, DocumentSource } from '../src/types/index';
import { mockDeep, MockProxy } from 'jest-mock-extended';
import { AIMessage } from '@langchain/core/messages';

// Mock the retrieval program
jest.mock('../src/core/programs/retrieval.program', () => ({
  retrievalProgram: {
    forward: jest.fn().mockResolvedValue({
      search_terms: ['cairo contract', 'starknet'],
      resources: ['cairo_book', 'starknet_docs'],
    }),
  },
  retrievalInstructions: 'Mock instructions',
}));

// Mock getModelForTask
jest.mock('../src/config/llm', () => ({
  getModelForTask: jest.fn().mockReturnValue('test-model'),
}));

// Mock the logger
jest.mock('../src/utils/index', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
  },
  formatChatHistoryAsString: jest.fn((history) =>
    history
      .map((message) => `${message._getType()}: ${message.content}`)
      .join('\n'),
  ),
  parseXMLContent: jest.fn((xml, tag) => {
    const regex = new RegExp(`<${tag}>(.*?)</${tag}>`, 'gs');
    const matches = [...xml.matchAll(regex)];
    return matches.map((match) => match[1].trim());
  }),
  TokenTracker: {
    trackFullUsage: jest.fn().mockReturnValue({
      promptTokens: 100,
      completionTokens: 50,
      totalTokens: 150,
    }),
  },
}));

describe('QueryProcessor', () => {
  let queryProcessor: QueryProcessor;
  let mockAxRouter: MockProxy<AxMultiServiceRouter>;
  let mockConfig: RagSearchConfig;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock instances
    mockAxRouter = mockDeep<AxMultiServiceRouter>();

    // Create a basic config for testing
    mockConfig = {
      name: 'Test Agent',
      prompts: {
        searchRetrieverPrompt:
          'Your task is to rephrase this question: {query}\nChat history: {chat_history}',
        searchResponsePrompt: 'test response prompt',
      },
      vectorStore: mockDeep(),
    };

    // Mock the retrieval program forward method
    // The QueryProcessor now uses the retrieval program instead of direct LLM calls

    // Create the QueryProcessor instance
    queryProcessor = new QueryProcessor(mockAxRouter, mockConfig);
  });

  describe('process', () => {
    it('should process a query and extract search terms when the LLM returns terms', async () => {
      // Arrange
      const input: RagInput = {
        query: 'How do I write a Cairo contract?',
        chatHistory: [],
        sources: [DocumentSource.CAIRO_BOOK],
      };

      // Act
      const result = await queryProcessor.process(input);

      // Assert
      // Since we're using the retrieval program, we check that instead
      const {
        retrievalProgram,
      } = require('../src/core/programs/retrieval.program');
      expect(retrievalProgram.forward).toHaveBeenCalled();

      // Check that result contains the extracted terms
      expect(result).toEqual(
        expect.objectContaining({
          original: input.query,
          transformed: [
            'How do I write a Cairo contract?',
            'cairo contract',
            'starknet',
          ],
          isContractRelated: true,
          isTestRelated: false,
          resources: [DocumentSource.CAIRO_BOOK, DocumentSource.STARKNET_DOCS],
        }),
      );
    });

    it('should use fallback when LLM is not provided', async () => {
      // Arrange
      const input: RagInput = {
        query: 'How do I write a Cairo contract?',
        chatHistory: [],
        sources: [DocumentSource.CAIRO_BOOK],
      };

      // Create a processor without LLM
      const processorWithoutLLM = new QueryProcessor(undefined, mockConfig);

      // Act
      const result = await processorWithoutLLM.process(input);

      // Assert - should use the fallback processing
      expect(result).toEqual(
        expect.objectContaining({
          original: input.query,
          transformed: input.query,
          isContractRelated: true, // Because it contains the word "contract"
        }),
      );
    });

    it('should correctly identify test-related queries', async () => {
      // Arrange
      const input: RagInput = {
        query: 'How to write tests for Cairo?',
        chatHistory: [],
        sources: [DocumentSource.CAIRO_BOOK],
      };

      // Update the mock to return test-related response
      const {
        retrievalProgram,
      } = require('../src/core/programs/retrieval.program');
      retrievalProgram.forward.mockResolvedValue({
        search_terms: ['cairo test', 'starknet foundry'],
        resources: [],
      });

      // Act
      const result = await queryProcessor.process(input);

      // Assert
      expect(result.isTestRelated).toBe(true);
    });

    it('should handle a direct response from LLM instead of terms', async () => {
      // Arrange
      const input: RagInput = {
        query: 'How do I build on Starknet?',
        chatHistory: [],
        sources: [DocumentSource.CAIRO_BOOK],
      };

      // Update the mock to return a different response
      const {
        retrievalProgram,
      } = require('../src/core/programs/retrieval.program');
      retrievalProgram.forward.mockResolvedValue({
        search_terms: ['How to develop contracts on Starknet?'],
        resources: [],
      });

      // Act
      const result = await queryProcessor.process(input);

      // Assert
      expect(result).toEqual(
        expect.objectContaining({
          original: input.query,
          transformed: [input.query, 'How to develop contracts on Starknet?'],
          isContractRelated: true, // because "contract" is in the transformed query
          resources: [],
        }),
      );
    });
  });
});
