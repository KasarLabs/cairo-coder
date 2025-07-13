import { DocumentRetrieverProgram } from '../src/core/programs/documentRetriever.program';
import { AxMultiServiceRouter, AxAIService } from '@ax-llm/ax';
import {
  DocumentSource,
  ProcessedQuery,
  RagSearchConfig,
  BookChunk,
} from '../src/types/index';
import { Document } from '@langchain/core/documents';
import { mockDeep, MockProxy } from 'jest-mock-extended';
import {
  mockRetrievalProgram,
  mockGenerationProgram,
} from './mocks/mockPrograms';

// Mock all utils including computeSimilarity and logger
jest.mock('../src/utils/index', () => ({
  __esModule: true,
  computeSimilarity: jest.fn().mockImplementation(() => 0.75), // Default high similarity
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
  },
}));

describe('DocumentRetrieverProgram', () => {
  let documentRetrieverProgram: DocumentRetrieverProgram;
  let mockAxRouter: MockProxy<AxMultiServiceRouter>;
  let mockAI: MockProxy<AxAIService>;
  let mockConfig: RagSearchConfig;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock instances
    mockAxRouter = mockDeep<AxMultiServiceRouter>();
    mockAI = mockDeep<AxAIService>();

    // Set up mock embed behavior for AxMultiServiceRouter
    mockAxRouter.embed.mockResolvedValue({
      embeddings: [
        [0.1, 0.2, 0.3], // Document embeddings
        [0.4, 0.5, 0.6],
        [0.4, 0.5, 0.6], // Query embedding (similar to second doc)
      ],
    } as any);

    // Create a basic config for testing
    mockConfig = {
      name: 'Test Agent',
      retrievalProgram: mockRetrievalProgram,
      generationProgram: mockGenerationProgram,
      vectorStore: {
        similaritySearch: jest.fn().mockResolvedValue([
          new Document({
            pageContent: 'This is a test document about Cairo contracts.',
            metadata: {
              title: 'Cairo Contracts',
              sourceLink: 'https://example.com',
            },
          }),
          new Document({
            pageContent: 'Another document about Starknet development.',
            metadata: {
              title: 'Starknet Dev',
              sourceLink: 'https://starknet.io',
            },
          }),
        ]),
      } as any,
      maxSourceCount: 10,
      similarityThreshold: 0.3,
    };

    // Create the DocumentRetrieverProgram instance
    documentRetrieverProgram = new DocumentRetrieverProgram(
      mockAxRouter,
      mockConfig,
    );
  });

  describe('forward', () => {
    it('should retrieve and rerank documents successfully', async () => {
      // Arrange
      const processedQuery: ProcessedQuery = {
        original: 'How do I write a Cairo contract?',
        transformed: ['How do I write a Cairo contract?', 'cairo contract'],
        isContractRelated: true,
        isTestRelated: false,
        resources: [DocumentSource.CAIRO_BOOK],
      };

      const input = {
        processedQuery,
        sources: [DocumentSource.CAIRO_BOOK] as DocumentSource[],
      };

      // Act
      const result = await documentRetrieverProgram.forward(mockAI, input);

      // Assert
      expect(result.documents).toHaveLength(2);
      expect(result.documents[0].pageContent).toContain('Cairo contracts');
      expect(result.documents[1].pageContent).toContain('Starknet development');

      // Verify vectorStore.similaritySearch was called
      expect(mockConfig.vectorStore.similaritySearch).toHaveBeenCalled();

      // Verify embeddings were computed for reranking
      expect(mockAxRouter.embed).toHaveBeenCalledTimes(2); // Once for docs, once for query
    });

    it('should use resources from processedQuery if available', async () => {
      // Arrange
      const processedQuery: ProcessedQuery = {
        original: 'How do I test Cairo?',
        transformed: ['cairo testing'],
        isContractRelated: false,
        isTestRelated: true,
        resources: [DocumentSource.STARKNET_FOUNDRY], // Different from input sources
      };

      const input = {
        processedQuery,
        sources: [DocumentSource.CAIRO_BOOK] as DocumentSource[], // This should be overridden
      };

      // Act
      const result = await documentRetrieverProgram.forward(mockAI, input);

      // Assert
      expect(mockConfig.vectorStore.similaritySearch).toHaveBeenCalledWith(
        'cairo testing',
        10,
        [DocumentSource.STARKNET_FOUNDRY], // Should use resources from processedQuery
      );
    });

    it('should handle multiple transformed queries', async () => {
      // Arrange
      const processedQuery: ProcessedQuery = {
        original: 'How do I write and deploy Cairo contracts?',
        transformed: ['cairo contracts', 'cairo deployment', 'starknet deploy'],
        isContractRelated: true,
        isTestRelated: false,
      };

      const input = {
        processedQuery,
        sources: [DocumentSource.CAIRO_BOOK] as DocumentSource[],
      };

      // Act
      const result = await documentRetrieverProgram.forward(mockAI, input);

      // Assert
      // Should call similaritySearch for each transformed query
      expect(mockConfig.vectorStore.similaritySearch).toHaveBeenCalledTimes(3);
      expect(mockConfig.vectorStore.similaritySearch).toHaveBeenCalledWith(
        'cairo contracts',
        10,
        [DocumentSource.CAIRO_BOOK],
      );
      expect(mockConfig.vectorStore.similaritySearch).toHaveBeenCalledWith(
        'cairo deployment',
        10,
        [DocumentSource.CAIRO_BOOK],
      );
      expect(mockConfig.vectorStore.similaritySearch).toHaveBeenCalledWith(
        'starknet deploy',
        10,
        [DocumentSource.CAIRO_BOOK],
      );
    });

    it('should filter documents by similarity threshold', async () => {
      // Arrange
      const { computeSimilarity } = require('../src/utils/index');
      computeSimilarity
        .mockReturnValueOnce(0.3) // Below threshold
        .mockReturnValueOnce(0.8); // Above threshold

      const processedQuery: ProcessedQuery = {
        original: 'test query',
        transformed: ['test'],
        isContractRelated: false,
        isTestRelated: false,
      };

      const input = {
        processedQuery,
        sources: [DocumentSource.CAIRO_BOOK] as DocumentSource[],
      };

      // Act
      const result = await documentRetrieverProgram.forward(mockAI, input);

      // Assert
      // Should only include the document with similarity above threshold
      expect(result.documents).toHaveLength(1);
      expect(result.documents[0].pageContent).toContain('Starknet development');
    });

    it('should handle empty document results', async () => {
      // Arrange
      mockConfig.vectorStore.similaritySearch = jest.fn().mockResolvedValue([]);

      const processedQuery: ProcessedQuery = {
        original: 'nonexistent query',
        transformed: ['nonexistent'],
        isContractRelated: false,
        isTestRelated: false,
      };

      const input = {
        processedQuery,
        sources: [DocumentSource.CAIRO_BOOK] as DocumentSource[],
      };

      // Act
      const result = await documentRetrieverProgram.forward(mockAI, input);

      // Assert
      expect(result.documents).toHaveLength(0);
      // Should not call embed if no documents
      expect(mockAxRouter.embed).not.toHaveBeenCalled();
    });

    it('should attach source metadata correctly', async () => {
      // Arrange
      const processedQuery: ProcessedQuery = {
        original: 'test query',
        transformed: ['test'],
        isContractRelated: false,
        isTestRelated: false,
      };

      const input = {
        processedQuery,
        sources: [DocumentSource.CAIRO_BOOK] as DocumentSource[],
      };

      // Act
      const result = await documentRetrieverProgram.forward(mockAI, input);

      // Assert
      expect(result.documents[0].metadata).toEqual({
        title: 'Cairo Contracts',
        sourceLink: 'https://example.com',
        url: 'https://example.com',
      });
      expect(result.documents[1].metadata).toEqual({
        title: 'Starknet Dev',
        sourceLink: 'https://starknet.io',
        url: 'https://starknet.io',
      });
    });

    it('should deduplicate documents with same content', async () => {
      // Arrange
      mockConfig.vectorStore.similaritySearch = jest
        .fn()
        .mockResolvedValueOnce([
          new Document({
            pageContent: 'Duplicate content',
            metadata: { title: 'Doc 1' },
          }),
        ])
        .mockResolvedValueOnce([
          new Document({
            pageContent: 'Duplicate content', // Same content
            metadata: { title: 'Doc 2' },
          }),
          new Document({
            pageContent: 'Unique content',
            metadata: { title: 'Doc 3' },
          }),
        ]);

      const processedQuery: ProcessedQuery = {
        original: 'test query',
        transformed: ['query1', 'query2'],
        isContractRelated: false,
        isTestRelated: false,
      };

      const input = {
        processedQuery,
        sources: [DocumentSource.CAIRO_BOOK] as DocumentSource[],
      };

      // Act
      const result = await documentRetrieverProgram.forward(mockAI, input);

      // Assert
      // Should only have 2 unique documents (duplicate content removed)
      expect(result.documents).toHaveLength(2);
      const contents = result.documents.map((d) => d.pageContent);
      expect(contents).toContain('Duplicate content');
      expect(contents).toContain('Unique content');
    });
  });
});
