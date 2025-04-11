import { QueryProcessor } from '../src/pipeline/queryProcessor';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import {
  RagInput,
  ProcessedQuery,
  RagSearchConfig,
  DocumentSource,
} from '../src/core/types';
import { mockDeep, MockProxy } from 'jest-mock-extended';
import { AIMessage } from '@langchain/core/messages';

// Mock the logger
jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
}));

describe('QueryProcessor', () => {
  let queryProcessor: QueryProcessor;
  let mockLLM: MockProxy<BaseChatModel>;
  let mockConfig: RagSearchConfig;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock instances
    mockLLM = mockDeep<BaseChatModel>();

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

    // Mock the LLM invoke method to return a simulated response
    // Using a simple object that has the content property
    mockLLM.invoke.mockResolvedValue({
      content:
        '<term>cairo contract</term><term>starknet</term><resources><resource>cairo_book</resource><resource>starknet_docs</resource></resources>',
    } as any);

    // Create the QueryProcessor instance
    queryProcessor = new QueryProcessor(mockLLM, mockConfig);
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
      expect(mockLLM.invoke).toHaveBeenCalled();

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

      // Mock LLM to return a test-related response
      mockLLM.invoke.mockResolvedValue({
        content: '<term>cairo test</term><term>starknet foundry</term>',
      } as any);

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

      // Mock LLM to return a direct answer instead of terms
      mockLLM.invoke.mockResolvedValue({
        content: '<response>How to develop contracts on Starknet?</response>',
      } as any);

      // Act
      const result = await queryProcessor.process(input);

      // Assert
      expect(result).toEqual(
        expect.objectContaining({
          original: input.query,
          transformed: 'How to develop contracts on Starknet?',
          isContractRelated: true, // because "contract" is in the transformed query
        }),
      );
    });
  });
});
