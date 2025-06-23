import { AnswerGenerator } from '../src/core/pipeline/answerGenerator';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import {
  RagInput,
  ProcessedQuery,
  RetrievedDocuments,
  RagSearchConfig,
  DocumentSource,
} from '../src/types/index';
import { Document } from '@langchain/core/documents';
import { mockDeep, MockProxy } from 'jest-mock-extended';
import { IterableReadableStream } from '@langchain/core/utils/stream';
import { StreamEvent } from '@langchain/core/tracers/log_stream';
import { BaseLanguageModelInput } from '@langchain/core/language_models/base';
import { AIMessageChunk } from '@langchain/core/messages'; // ✅ AJOUTÉ

// Mock the formatChatHistoryAsString utility
jest.mock('../src/utils/index', () => ({
  __esModule: true,
  formatChatHistoryAsString: jest
    .fn()
    .mockImplementation(() => 'mocked chat history'),
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
  },
  TokenTracker: {
    trackFullUsage: jest.fn().mockReturnValue({
      promptTokens: 100,
      responseTokens: 50,
      totalTokens: 150,
    }),
  },
}));

// No need to separately mock the logger since it's now mocked as part of utils/index

describe('AnswerGenerator', () => {
  let answerGenerator: AnswerGenerator;
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
        searchRetrieverPrompt: 'test retriever prompt',
        searchResponsePrompt: 'test response prompt',
        noSourceFoundPrompt: 'Sorry, no relevant information was found.',
      },
      vectorStore: mockDeep(),
      contractTemplate:
        '<contract_template>Example template</contract_template>',
      testTemplate: '<test_template>Example test template</test_template>',
    };

    // ✅ CHANGÉ: streamEvents au lieu de stream
    (mockLLM.streamEvents as any) = jest.fn().mockReturnValue({
      [Symbol.asyncIterator]: async function* () {
        yield {
          event: 'on_llm_stream',
          data: { 
            chunk: { content: 'This is a test response about Cairo.' }
          },
          run_id: 'test-run-123',
          name: 'TestLLM',
          tags: [],
          metadata: {}
        } as StreamEvent;
      },
    } as IterableReadableStream<StreamEvent>);

    // Create the AnswerGenerator instance
    answerGenerator = new AnswerGenerator(mockLLM, mockConfig);
  });

  describe('generate', () => {
    it('should generate an answer stream using retrieved documents', async () => {
      // Arrange
      const input: RagInput = {
        query: 'How do I write a Cairo contract?',
        chatHistory: [],
        sources: [DocumentSource.CAIRO_BOOK],
      };

      const processedQuery: ProcessedQuery = {
        original: input.query,
        transformed: 'cairo contract',
        isContractRelated: true,
      };

      const documents = [
        new Document({
          pageContent: 'Cairo is a programming language for Starknet.',
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
        documents,
        processedQuery,
      };

      // Act
      const result = await answerGenerator.generate(input, retrievedDocs);

      // Assert
      expect(mockLLM.streamEvents).toHaveBeenCalled(); // ✅ CHANGÉ: streamEvents

      // Collect the stream results
      const events: StreamEvent[] = [];
      for await (const event of result) {
        events.push(event);
      }

      // Check that we got the expected events
      expect(events.length).toBe(1);
      expect(events[0].event).toBe('on_llm_stream');
      expect(events[0].data.chunk.content).toBe('This is a test response about Cairo.');
    });

    it('should include contract template when query is contract-related', async () => {
      // Arrange
      const input: RagInput = {
        query: 'How do I write a Cairo contract?',
        chatHistory: [],
        sources: [DocumentSource.CAIRO_BOOK],
      };

      const processedQuery: ProcessedQuery = {
        original: input.query,
        transformed: 'cairo contract',
        isContractRelated: true,
      };

      const documents = [
        new Document({
          pageContent: 'Cairo is a programming language for Starknet.',
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
        documents,
        processedQuery,
      };

      // Create a spy on the LLM streamEvents method to capture the actual prompt
      let capturedPrompt: string | null = null;
      const mockReturnValue = {
        [Symbol.asyncIterator]: async function* () {
          yield {
            event: 'on_llm_stream',
            data: { 
              chunk: { content: 'This is a test response about Cairo contracts.' }
            },
            run_id: 'test-run-123',
            name: 'TestLLM',
            tags: [],
            metadata: {}
          } as StreamEvent;
        },
      } as IterableReadableStream<StreamEvent>;

      (mockLLM.streamEvents as any) = jest.fn().mockImplementation((...args) => {
        capturedPrompt = args[0] as string;
        return mockReturnValue;
      });

      // Act
      await answerGenerator.generate(input, retrievedDocs);

      // Assert
      expect(capturedPrompt).toBeDefined();
      const promptString = JSON.stringify(capturedPrompt);
      expect(promptString).toContain(
        '<contract_template>Example template</contract_template>',
      );
    });

    it('should include test template when query is test-related', async () => {
      // Arrange
      const input: RagInput = {
        query: 'How do I test a Cairo contract?',
        chatHistory: [],
        sources: [DocumentSource.CAIRO_BOOK],
      };

      const processedQuery: ProcessedQuery = {
        original: input.query,
        transformed: 'cairo test',
        isContractRelated: true,
        isTestRelated: true,
      };

      const documents = [
        new Document({
          pageContent: 'Testing Cairo contracts is important.',
          metadata: {
            name: 'Cairo Testing',
            title: 'Cairo Testing',
            sourceLink: 'https://example.com/cairo-testing',
            chunkNumber: 1,
            contentHash: '1234567890',
            uniqueId: '1234567890',
            source: DocumentSource.CAIRO_BOOK,
          },
        }),
      ];

      const retrievedDocs: RetrievedDocuments = {
        documents,
        processedQuery,
      };

      // Create a spy on the LLM streamEvents method to capture the actual prompt
      let capturedPrompt: string | null = null;
      const mockReturnValue = {
        [Symbol.asyncIterator]: async function* () {
          yield {
            event: 'on_llm_stream',
            data: { 
              chunk: { content: 'This is a test response about testing Cairo contracts.' }
            },
            run_id: 'test-run-123',
            name: 'TestLLM',
            tags: [],
            metadata: {}
          } as StreamEvent;
        },
      } as IterableReadableStream<StreamEvent>;

      (mockLLM.streamEvents as any) = jest.fn().mockImplementation((...args) => {
        capturedPrompt = args[0] as string;
        return mockReturnValue;
      });

      // Act
      await answerGenerator.generate(input, retrievedDocs);

      // Assert
      expect(capturedPrompt).toBeDefined();
      const promptString = JSON.stringify(capturedPrompt);
      expect(promptString).toContain(
        '<test_template>Example test template</test_template>',
      );
    });

    it('should use noSourceFoundPrompt when no documents are retrieved', async () => {
      // Arrange
      const input: RagInput = {
        query: 'How do I write a Cairo contract?',
        chatHistory: [],
        sources: [DocumentSource.CAIRO_BOOK],
      };

      const processedQuery: ProcessedQuery = {
        original: input.query,
        transformed: 'cairo contract',
        isContractRelated: true,
      };

      const retrievedDocs: RetrievedDocuments = {
        documents: [], // Empty document list
        processedQuery,
      };

      // Create a spy on the LLM streamEvents method to capture the actual prompt
      let capturedPrompt: string | null = null;
      const mockReturnValue = {
        [Symbol.asyncIterator]: async function* () {
          yield {
            event: 'on_llm_stream',
            data: { 
              chunk: { content: 'I cannot find any relevant information.' }
            },
            run_id: 'test-run-123',
            name: 'TestLLM',
            tags: [],
            metadata: {}
          } as StreamEvent;
        },
      } as IterableReadableStream<StreamEvent>;

      (mockLLM.streamEvents as any) = jest.fn().mockImplementation((...args) => {
        capturedPrompt = args[0] as string;
        return mockReturnValue;
      });

      // Act
      await answerGenerator.generate(input, retrievedDocs);

      // Assert
      expect(capturedPrompt).toBeDefined();
      const promptString = JSON.stringify(capturedPrompt);
      expect(promptString).toContain(
        'Sorry, no relevant information was found.',
      );
    });
  });
});