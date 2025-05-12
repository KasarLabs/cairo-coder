import { RagPipeline } from '../../src/core/pipeline/ragPipeline';
import { QueryProcessor } from '../../src/core/pipeline/queryProcessor';
import { DocumentRetriever } from '../../src/core/pipeline/documentRetriever';
import { AnswerGenerator } from '../../src/core/pipeline/answerGenerator';
import { Embeddings } from '@langchain/core/embeddings';
import {
  BookChunk,
  DocumentSource,
  RagInput,
  RagSearchConfig,
  RetrievedDocuments,
} from '../../src/types/index';
import { Document } from '@langchain/core/documents';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { IterableReadableStream } from '@langchain/core/utils/stream';
import { BaseMessage, AIMessage } from '@langchain/core/messages';
import { mockDeep, MockProxy } from 'jest-mock-extended';
import EventEmitter from 'events';

// Mock the dependencies at the module level
jest.mock('../../src/core/pipeline/queryProcessor');
jest.mock('../../src/core/pipeline/documentRetriever');
jest.mock('../../src/core/pipeline/answerGenerator');

// Mock the utils including logger
jest.mock('../../src/utils/index', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
  },
}));

describe('RagPipeline', () => {
  let ragPipeline: RagPipeline;
  let mockLLMConfig: {
    defaultLLM: MockProxy<BaseChatModel>;
    fastLLM: MockProxy<BaseChatModel>;
  };
  let mockEmbeddings: MockProxy<Embeddings>;
  let mockConfig: RagSearchConfig;
  let mockQueryProcessor: MockProxy<QueryProcessor>;
  let mockDocumentRetriever: MockProxy<DocumentRetriever>;
  let mockAnswerGenerator: MockProxy<AnswerGenerator>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock instances
    mockLLMConfig = {
      defaultLLM: mockDeep<BaseChatModel>(),
      fastLLM: mockDeep<BaseChatModel>(),
    };
    mockEmbeddings = mockDeep<Embeddings>();

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

    // Create properly typed mocks for the dependencies
    mockQueryProcessor = mockDeep<QueryProcessor>();
    mockDocumentRetriever = mockDeep<DocumentRetriever>();
    mockAnswerGenerator = mockDeep<AnswerGenerator>();

    // Mock the constructor implementations to return the deep mocks
    jest.mocked(QueryProcessor).mockImplementation(() => mockQueryProcessor);
    jest
      .mocked(DocumentRetriever)
      .mockImplementation(() => mockDocumentRetriever);
    jest.mocked(AnswerGenerator).mockImplementation(() => mockAnswerGenerator);

    // Instantiate the RagPipeline with mocks
    ragPipeline = new RagPipeline(mockLLMConfig, mockEmbeddings, mockConfig);
  });

  describe('execute', () => {
    it('should process query, retrieve documents, and generate answers in the happy path', async () => {
      // Arrange
      const input: RagInput = {
        query: 'How do I write a Cairo contract?',
        chatHistory: [],
        sources: [DocumentSource.CAIRO_BOOK],
      };

      const processedQuery = {
        original: input.query,
        transformed: 'Processed: How do I write a Cairo contract?',
        isContractRelated: true,
      };

      const mockDocuments: Document<BookChunk>[] = [
        new Document({
          pageContent: 'Cairo contracts are written in the Cairo language.',
          metadata: {
            name: 'Cairo Programming',
            title: 'Cairo Programming',
            chunkNumber: 1,
            contentHash: '1234567890',
            uniqueId: '1234567890',
            sourceLink: 'https://example.com/cairo',
            source: DocumentSource.CAIRO_BOOK,
          },
        }),
      ];

      const retrievedDocs: RetrievedDocuments = {
        documents: mockDocuments,
        processedQuery,
      };

      // Create a mock response stream
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield new AIMessage('This is a test answer about Cairo contracts.');
        },
      } as IterableReadableStream<BaseMessage>;

      // Setup mock behavior
      mockQueryProcessor.process.mockResolvedValue(processedQuery);
      mockDocumentRetriever.retrieve.mockResolvedValue(retrievedDocs);
      mockAnswerGenerator.generate.mockResolvedValue(mockStream);

      // Act - Capture the emitted data
      const dataPromise = new Promise<string[]>((resolve) => {
        const receivedData: string[] = [];
        const emitter = ragPipeline.execute(input);

        emitter.on('data', (chunk) => {
          receivedData.push(chunk);
          if (receivedData.length >= 2) {
            resolve(receivedData);
          }
        });

        // Timeout to prevent hanging
        setTimeout(() => resolve(receivedData), 1000);
      });

      // Assert
      const receivedData = await dataPromise;

      // Verify the mocks were called correctly
      expect(mockQueryProcessor.process).toHaveBeenCalledWith(input);
      expect(mockDocumentRetriever.retrieve).toHaveBeenCalledWith(
        processedQuery,
        [DocumentSource.CAIRO_BOOK],
      );
      expect(mockAnswerGenerator.generate).toHaveBeenCalledWith(
        input,
        retrievedDocs,
      );

      // Verify the emitted data
      expect(receivedData.length).toBeGreaterThanOrEqual(1);
      const parsedData = receivedData.map((data) => JSON.parse(data));

      expect(parsedData.some((item) => item.type === 'sources')).toBe(true);
      expect(parsedData.some((item) => item.type === 'response')).toBe(true);
    });
  });
});
