import { AnswerGenerator } from '../src/core/pipeline/answerGenerator';
import { AxMultiServiceRouter } from '@ax-llm/ax';
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

// Mock the generation program
jest.mock('../src/core/programs/generation.program', () => ({
  generationProgram: {
    streamingForward: jest.fn().mockReturnValue({
      [Symbol.asyncIterator]: async function* () {
        yield {
          delta: { answer: 'This is a test response about Cairo.' },
          version: 1,
        };
      },
    }),
  },
}));

// Mock getModelForTask
jest.mock('../src/config/llm', () => ({
  getModelForTask: jest.fn().mockReturnValue('test-model'),
}));

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
        searchRetrieverPrompt: 'test retriever prompt',
        searchResponsePrompt: 'test response prompt',
        noSourceFoundPrompt: 'Sorry, no relevant information was found.',
      },
      vectorStore: mockDeep(),
      contractTemplate:
        '<contract_template>Example template</contract_template>',
      testTemplate: '<test_template>Example test template</test_template>',
    };

    // Mock the AxMultiServiceRouter methods
    // The AnswerGenerator will use generationProgram.streamingForward which returns an async generator
    // We don't need to mock streamEvents since we're using AX now

    // Create the AnswerGenerator instance
    answerGenerator = new AnswerGenerator(mockAxRouter, mockConfig);
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
      // Since we're using the generation program, we check that instead
      const {
        generationProgram,
      } = require('../src/core/programs/generation.program');
      expect(generationProgram.streamingForward).toHaveBeenCalled();

      // Collect the stream results
      const events: StreamEvent[] = [];
      for await (const event of result) {
        events.push(event);
      }

      // Check that we got the expected events
      expect(events.length).toBeGreaterThan(0);
      expect(events[0].event).toBe('on_llm_stream');
      expect(events[0].data.chunk).toBe('This is a test response about Cairo.');
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
              chunk: {
                content: 'This is a test response about Cairo contracts.',
              },
            },
            run_id: 'test-run-123',
            name: 'TestLLM',
            tags: [],
            metadata: {},
          } as StreamEvent;
        },
      } as IterableReadableStream<StreamEvent>;

      // Update the generation program mock
      const {
        generationProgram,
      } = require('../src/core/programs/generation.program');
      generationProgram.streamingForward.mockImplementation(
        (router, inputs) => {
          capturedPrompt = `${inputs.chat_history}\n\nUser: ${inputs.query}\n\nContext:\n${inputs.context}`;
          return mockReturnValue;
        },
      );

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
              chunk: {
                content:
                  'This is a test response about testing Cairo contracts.',
              },
            },
            run_id: 'test-run-123',
            name: 'TestLLM',
            tags: [],
            metadata: {},
          } as StreamEvent;
        },
      } as IterableReadableStream<StreamEvent>;

      // Update the generation program mock
      const {
        generationProgram,
      } = require('../src/core/programs/generation.program');
      generationProgram.streamingForward.mockImplementation(
        (router, inputs) => {
          capturedPrompt = `${inputs.chat_history}\n\nUser: ${inputs.query}\n\nContext:\n${inputs.context}`;
          return mockReturnValue;
        },
      );

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
              chunk: { content: 'I cannot find any relevant information.' },
            },
            run_id: 'test-run-123',
            name: 'TestLLM',
            tags: [],
            metadata: {},
          } as StreamEvent;
        },
      } as IterableReadableStream<StreamEvent>;

      // Update the generation program mock
      const {
        generationProgram,
      } = require('../src/core/programs/generation.program');
      generationProgram.streamingForward.mockImplementation(
        (router, inputs) => {
          capturedPrompt = `${inputs.chat_history}\n\nUser: ${inputs.query}\n\nContext:\n${inputs.context}`;
          return mockReturnValue;
        },
      );

      // Act
      await answerGenerator.generate(input, retrievedDocs);

      // Assert
      expect(capturedPrompt).toBeDefined();
      const promptString = JSON.stringify(capturedPrompt);
      expect(promptString).toContain(
        'No relevant documentation found for this query.',
      );
    });
  });
});
