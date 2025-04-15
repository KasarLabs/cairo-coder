import { DocumentRetriever } from '../src/core/pipeline/documentRetriever';
import { Embeddings } from '@langchain/core/embeddings';
import {
  DocumentSource,
  ProcessedQuery,
  RagSearchConfig,
} from '../src/types/index';
import { Document } from '@langchain/core/documents';
import { mockDeep, MockProxy } from 'jest-mock-extended';

// Mock computeSimilarity to control the similarity scores
jest.mock('../src/utils/computeSimilarity', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => 0.75), // Default high similarity
}));

// Mock the logger
jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
}));

describe('DocumentRetriever', () => {
  let documentRetriever: DocumentRetriever;
  let mockEmbeddings: MockProxy<Embeddings>;
  let mockConfig: RagSearchConfig;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock instances
    mockEmbeddings = mockDeep<Embeddings>();

    // Set up mock embeddings behavior
    mockEmbeddings.embedQuery.mockResolvedValue([0.1, 0.2, 0.3]);
    mockEmbeddings.embedDocuments.mockResolvedValue([
      [0.1, 0.2, 0.3],
      [0.4, 0.5, 0.6],
    ]);

    // Create a basic config for testing
    mockConfig = {
      name: 'Test Agent',
      prompts: {
        searchRetrieverPrompt: 'test retriever prompt',
        searchResponsePrompt: 'test response prompt',
      },
      vectorStore: {
        similaritySearch: jest.fn().mockResolvedValue([
          new Document({
            pageContent: 'Cairo is a programming language for Starknet.',
            metadata: {
              title: 'Cairo Programming',
              sourceLink: 'https://example.com/cairo',
            },
          }),
          new Document({
            pageContent: 'Starknet is a layer 2 solution powered by Cairo.',
            metadata: {
              title: 'Starknet Overview',
              sourceLink: 'https://example.com/starknet',
            },
          }),
        ]),
      } as any,
      maxSourceCount: 5,
      similarityThreshold: 0.5,
    };

    // Create the DocumentRetriever instance
    documentRetriever = new DocumentRetriever(mockEmbeddings, mockConfig);
  });

  describe('retrieve', () => {
    it('should retrieve documents for a single query string', async () => {
      // Arrange
      const processedQuery: ProcessedQuery = {
        original: 'How do I write a Cairo contract?',
        transformed: 'cairo contract',
        isContractRelated: true,
      };

      // Act
      const result = await documentRetriever.retrieve(
        processedQuery,
        DocumentSource.CAIRO_BOOK,
      );

      // Assert
      expect(mockConfig.vectorStore.similaritySearch).toHaveBeenCalledWith(
        'cairo contract',
        5,
        DocumentSource.CAIRO_BOOK,
      );
      expect(result.documents.length).toBe(2);
      expect(result.processedQuery).toBe(processedQuery);

      // Check that documents have the expected metadata
      expect(result.documents[0].metadata).toEqual(
        expect.objectContaining({
          url: expect.any(String),
          title: expect.any(String),
        }),
      );
    });

    it('should retrieve and merge documents for an array of search terms', async () => {
      // Arrange
      const processedQuery: ProcessedQuery = {
        original: 'How do I write a Cairo contract?',
        transformed: ['cairo', 'starknet', 'contract'],
        isContractRelated: true,
      };

      // Act
      const result = await documentRetriever.retrieve(
        processedQuery,
        DocumentSource.CAIRO_BOOK,
      );

      // Assert
      // Should search for each term
      expect(mockConfig.vectorStore.similaritySearch).toHaveBeenCalledTimes(3);
      expect(mockConfig.vectorStore.similaritySearch).toHaveBeenCalledWith(
        'cairo',
        5,
        DocumentSource.CAIRO_BOOK,
      );
      expect(mockConfig.vectorStore.similaritySearch).toHaveBeenCalledWith(
        'starknet',
        5,
        DocumentSource.CAIRO_BOOK,
      );
      expect(mockConfig.vectorStore.similaritySearch).toHaveBeenCalledWith(
        'contract',
        5,
        DocumentSource.CAIRO_BOOK,
      );

      // Should deduplicate documents
      expect(result.documents.length).toBe(2);
    });

    it('should rerank documents based on similarity scores', async () => {
      // Arrange
      const processedQuery: ProcessedQuery = {
        original: 'How do I write a Cairo contract?',
        transformed: 'cairo contract',
        isContractRelated: true,
      };

      // Set up embeddings mock
      mockEmbeddings.embedQuery.mockResolvedValue([0.1, 0.2, 0.3]);
      mockEmbeddings.embedDocuments.mockResolvedValue([
        [0.1, 0.2, 0.3],
        [0.4, 0.5, 0.6],
      ]);

      // Import the real computeSimilarity function to control scores
      const computeSimilarityMock = jest.requireMock(
        '../src/utils/computeSimilarity',
      ).default;

      // Set up different similarity scores for different documents
      computeSimilarityMock
        .mockImplementationOnce(() => 0.3) // Below threshold
        .mockImplementationOnce(() => 0.6); // Above threshold

      // Act
      const result = await documentRetriever.retrieve(
        processedQuery,
        DocumentSource.CAIRO_BOOK,
      );

      // Assert
      expect(mockEmbeddings.embedQuery).toHaveBeenCalledWith('cairo contract');
      expect(mockEmbeddings.embedDocuments).toHaveBeenCalled();

      // Should only include documents above the similarity threshold
      expect(result.documents.length).toBe(1);
    });

    it('should handle the special case of "Summarize" query', async () => {
      // Arrange
      const processedQuery: ProcessedQuery = {
        original: 'Give me a summary',
        transformed: 'Summarize',
        isContractRelated: false,
      };

      // Act
      const result = await documentRetriever.retrieve(
        processedQuery,
        DocumentSource.CAIRO_BOOK,
      );

      // Assert
      expect(mockConfig.vectorStore.similaritySearch).toHaveBeenCalledWith(
        'Summarize',
        5,
        DocumentSource.CAIRO_BOOK,
      );

      // Should skip reranking for "Summarize" queries
      expect(mockEmbeddings.embedQuery).not.toHaveBeenCalled();
      expect(mockEmbeddings.embedDocuments).not.toHaveBeenCalled();
    });
  });
});
