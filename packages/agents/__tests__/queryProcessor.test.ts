import { QueryProcessorProgram } from '../src/core/programs/queryProcessor.program';
import { AxAIService } from '@ax-llm/ax';
import { DocumentSource } from '../src/types/index';
import { mockDeep, MockProxy } from 'jest-mock-extended';

// Mock the retrieval program
jest.mock('../src/core/programs/retrieval.program', () => ({
  retrievalProgram: {
    forward: jest.fn().mockResolvedValue({
      search_terms: ['cairo contract', 'starknet'],
      resources: ['cairo_book', 'starknet_docs'],
    }),
  },
  validateResources: jest.fn((resources) =>
    resources.filter((r) =>
      Object.values(DocumentSource).includes(r as DocumentSource),
    ),
  ),
}));

// Mock getModelForTask
jest.mock('../src/config/llm', () => ({
  getModelForTask: jest.fn().mockReturnValue('test-model'),
}));

describe('QueryProcessorProgram', () => {
  let queryProcessorProgram: QueryProcessorProgram;
  let mockAI: MockProxy<AxAIService>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock instances
    mockAI = mockDeep<AxAIService>();

    // Create the QueryProcessorProgram instance
    queryProcessorProgram = new QueryProcessorProgram();
  });

  describe('forward', () => {
    it('should process a query and return ProcessedQuery with search terms', async () => {
      // Arrange
      const input = {
        chat_history: '',
        query: 'How do I write a Cairo contract?',
      };

      // Act
      const result = await queryProcessorProgram.forward(mockAI, input);

      // Assert
      const {
        retrievalProgram,
      } = require('../src/core/programs/retrieval.program');
      expect(retrievalProgram.forward).toHaveBeenCalledWith(mockAI, input, {
        model: 'test-model',
      });

      expect(result.processedQuery).toEqual({
        original: 'How do I write a Cairo contract?',
        transformed: [
          'How do I write a Cairo contract?',
          'cairo contract',
          'starknet',
        ],
        isContractRelated: true,
        isTestRelated: false,
        resources: ['cairo_book', 'starknet_docs'],
      });
    });

    it('should correctly identify test-related queries', async () => {
      // Arrange
      const input = {
        chat_history: '',
        query: 'How to write tests for Cairo?',
      };

      // Update the mock to return test-related response
      const {
        retrievalProgram,
      } = require('../src/core/programs/retrieval.program');
      retrievalProgram.forward.mockResolvedValueOnce({
        search_terms: ['cairo testing', 'starknet foundry'],
        resources: ['starknet_foundry'],
      });

      // Act
      const result = await queryProcessorProgram.forward(mockAI, input);

      // Assert
      expect(result.processedQuery.isTestRelated).toBe(true);
      expect(result.processedQuery.original).toBe(
        'How to write tests for Cairo?',
      );
      expect(result.processedQuery.transformed).toEqual([
        'How to write tests for Cairo?',
        'cairo testing',
        'starknet foundry',
      ]);
    });

    it('should handle queries with no search terms', async () => {
      // Arrange
      const input = {
        chat_history: '',
        query: 'Hello, how are you?',
      };

      // Update the mock to return empty search terms
      const {
        retrievalProgram,
      } = require('../src/core/programs/retrieval.program');
      retrievalProgram.forward.mockResolvedValueOnce({
        search_terms: [],
        resources: [],
      });

      // Act
      const result = await queryProcessorProgram.forward(mockAI, input);

      // Assert
      expect(result.processedQuery).toEqual({
        original: 'Hello, how are you?',
        transformed: ['Hello, how are you?'],
        isContractRelated: false,
        isTestRelated: false,
        resources: [],
      });
    });

    it('should filter invalid resources', async () => {
      // Arrange
      const input = {
        chat_history: '',
        query: 'How do I use Cairo?',
      };

      // Update the mock to return some invalid resources
      const {
        retrievalProgram,
      } = require('../src/core/programs/retrieval.program');
      retrievalProgram.forward.mockResolvedValueOnce({
        search_terms: ['cairo usage'],
        resources: ['cairo_book', 'invalid_resource', 'starknet_docs'],
      });

      // Act
      const result = await queryProcessorProgram.forward(mockAI, input);

      // Assert
      expect(result.processedQuery.resources).toEqual([
        'cairo_book',
        'starknet_docs',
      ]);
    });

    it('should detect contract-related queries from transformed terms', async () => {
      // Arrange
      const input = {
        chat_history: '',
        query: 'How do I use storage?',
      };

      // Update the mock to return contract-related terms
      const {
        retrievalProgram,
      } = require('../src/core/programs/retrieval.program');
      retrievalProgram.forward.mockResolvedValueOnce({
        search_terms: ['storage mapping', 'smart contract storage'],
        resources: ['cairo_book'],
      });

      // Act
      const result = await queryProcessorProgram.forward(mockAI, input);

      // Assert
      expect(result.processedQuery.isContractRelated).toBe(true);
      expect(result.processedQuery.transformed).toContain(
        'smart contract storage',
      );
    });
  });
});
