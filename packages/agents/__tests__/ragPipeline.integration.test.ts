import { RagPipeline } from '../src/core/pipeline/ragPipeline';
import { RagInput, DocumentSource } from '../src/types';
import { BaseMessage, HumanMessage } from '@langchain/core/messages';
import { Document } from '@langchain/core/documents';
import { retrievalProgram } from '../src/core/programs/retrieval.program';
import { generationProgram } from '../src/core/programs/generation.program';

// Mock the programs used in the flow
jest.mock('../src/core/programs/retrieval.program', () => ({
  retrievalProgram: {
    forward: jest.fn().mockImplementation(async (ai, params, options) => {
      return {
        search_terms: ['cairo contract', 'starknet'],
        resources: ['cairo_book'],
      };
    }),
    getUsage: jest.fn().mockReturnValue([]),
    resetUsage: jest.fn(),
  },
  validateResources: jest.fn((resources) => resources),
}));

jest.mock('../src/core/programs/generation.program', () => ({
  generationProgram: {
    streamingForward: jest.fn(),
    getUsage: jest.fn().mockReturnValue([]),
    resetUsage: jest.fn(),
  },
}));

// Mock the default model
jest.mock('../src/config/llm', () => ({
  GET_DEFAULT_FAST_CHAT_MODEL: jest.fn().mockReturnValue('openai-fast'),
}));

// Import mocked modules

describe('RagPipeline Integration Test', () => {
  let axRouter: any;
  let flow: RagPipeline;
  let mockVectorStore: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock vector store
    mockVectorStore = {
      similaritySearchVectorWithScore: jest.fn().mockResolvedValue([
        [
          new Document({
            pageContent:
              'To create a Starknet contract, use #[starknet::contract] attribute...',
            metadata: {
              title: 'Starknet Contracts',
              source: DocumentSource.CAIRO_BOOK,
              chunkNumber: 1,
            },
          }),
          0.8,
        ],
        [
          new Document({
            pageContent:
              'Storage variables are defined with #[storage] struct...',
            metadata: {
              title: 'Contract Storage',
              source: DocumentSource.CAIRO_BOOK,
              chunkNumber: 2,
            },
          }),
          0.7,
        ],
      ]),
      similaritySearch: jest.fn().mockResolvedValue([
        new Document({
          pageContent:
            'To create a Starknet contract, use #[starknet::contract] attribute...',
          metadata: {
            title: 'Starknet Contracts',
            source: DocumentSource.CAIRO_BOOK,
            chunkNumber: 1,
          },
        }),
        new Document({
          pageContent:
            'Storage variables are defined with #[storage] struct...',
          metadata: {
            title: 'Contract Storage',
            source: DocumentSource.CAIRO_BOOK,
            chunkNumber: 2,
          },
        }),
      ]),
      embedQuery: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]),
    };

    // Create router with minimal requirements
    axRouter = {
      embed: jest.fn().mockResolvedValue({
        embeddings: [[0.1, 0.2, 0.3]],
      }),
    };

    const config = {
      name: 'test-agent',
      vectorStore: mockVectorStore,
      contractTemplate: 'Basic contract template',
      testTemplate: 'Basic test template',
      maxSourceCount: 10,
      similarityThreshold: 0.5,
      sources: [DocumentSource.CAIRO_BOOK],
      retrievalProgram: retrievalProgram,
      generationProgram: generationProgram,
    };

    flow = new RagPipeline(axRouter, config);
  });

  it('should execute full RAG pipeline from query to response', async () => {
    // Input data
    const input: RagInput = {
      query: 'How do I create a simple counter contract?',
      chatHistory: [],
      sources: DocumentSource.CAIRO_BOOK,
    };

    // Mock streaming response for generation
    const mockStream = (async function* () {
      yield {
        delta: { answer: "Here's a simple counter contract:\n\n```cairo\n" },
      };
      yield { delta: { answer: 'use starknet::ContractAddress;\n\n' } };
      yield { delta: { answer: '#[starknet::interface]\n' } };
      yield { delta: { answer: 'trait ICounter<TContractState> {\n' } };
      yield {
        delta: { answer: '    fn get_count(self: @TContractState) -> u32;\n' },
      };
      yield { delta: { answer: '}\n```' } };
    })();

    (generationProgram.streamingForward as jest.Mock).mockReturnValue(
      mockStream,
    );

    // Execute the flow
    const emitter = flow.execute(input, false);

    // Collect results
    const sources: any[] = [];
    const responses: string[] = [];
    let ended = false;
    let error: any = null;

    emitter.on('data', (data) => {
      const parsed = JSON.parse(data);
      if (parsed.type === 'sources') {
        sources.push(parsed.data);
      } else if (parsed.type === 'response') {
        responses.push(parsed.data);
      }
    });

    emitter.on('end', () => {
      ended = true;
    });

    emitter.on('error', (err) => {
      error = err;
    });

    // Wait for completion
    await new Promise<void>((resolve) => {
      emitter.on('end', resolve);
      emitter.on('error', () => resolve());
    });

    // Assertions
    expect(error).toBeNull();
    expect(ended).toBe(true);

    // Verify sources were emitted
    expect(sources).toHaveLength(1);
    expect(sources[0].length).toBeGreaterThanOrEqual(1);
    expect(sources[0][0].pageContent).toContain('Starknet contract');

    // Verify response was streamed
    expect(responses.length).toBeGreaterThan(0);
    const fullResponse = responses.join('');
    expect(fullResponse).toContain('counter contract');
    expect(fullResponse).toContain('#[starknet::interface]');
    expect(fullResponse).toContain('trait ICounter');

    // Verify the generation was called with the correct parameters
    expect(generationProgram.streamingForward).toHaveBeenCalledTimes(1);
    const streamingCall = (generationProgram.streamingForward as jest.Mock).mock
      .calls[0];
    expect(streamingCall[1].context).toContain('Starknet contract');
    // The context should contain at least some document content
    expect(streamingCall[1].context).toBeTruthy();
    expect(streamingCall[1].context).toContain('Basic contract template');
    expect(streamingCall[2].model).toBe('openai-fast');
  });

  it('should handle MCP mode correctly', async () => {
    const input: RagInput = {
      query: 'What is a trait in Cairo?',
      chatHistory: [],
      sources: DocumentSource.CAIRO_BOOK,
    };

    // Mock vector store to return different documents
    mockVectorStore.similaritySearchVectorWithScore.mockResolvedValue([
      [
        new Document({
          pageContent: 'Traits in Cairo are similar to interfaces...',
          metadata: {
            title: 'Cairo Traits',
            source: DocumentSource.CAIRO_BOOK,
          },
        }),
        0.9,
      ],
    ]);
    mockVectorStore.similaritySearch.mockResolvedValue([
      new Document({
        pageContent: 'Traits in Cairo are similar to interfaces...',
        metadata: {
          title: 'Cairo Traits',
          source: DocumentSource.CAIRO_BOOK,
        },
      }),
    ]);

    // Execute in MCP mode
    const emitter = flow.execute(input, true);

    const responses: string[] = [];
    emitter.on('data', (data) => {
      const parsed = JSON.parse(data);
      if (parsed.type === 'response') {
        responses.push(parsed.data);
      }
    });

    await new Promise<void>((resolve) => {
      emitter.on('end', resolve);
      emitter.on('error', () => resolve());
    });

    // In MCP mode, should return raw documents as JSON
    expect(responses).toHaveLength(1);
    const mcpResponse = JSON.parse(responses[0]);
    expect(mcpResponse).toContain('Traits in Cairo');

    // Should not call streamingForward in MCP mode
    expect(generationProgram.streamingForward).not.toHaveBeenCalled();
  });

  it('should handle errors gracefully', async () => {
    const input: RagInput = {
      query: 'Test error handling',
      chatHistory: [],
      sources: DocumentSource.CAIRO_BOOK,
    };

    // Mock an error during vector search
    mockVectorStore.similaritySearch.mockRejectedValue(
      new Error('Simulated search error'),
    );

    const emitter = flow.execute(input, false);

    let error: string | null = null;
    let ended = false;

    emitter.on('error', (err) => {
      error = err;
    });

    emitter.on('end', () => {
      ended = true;
    });

    await new Promise<void>((resolve) => {
      emitter.on('error', () => {
        // Wait a bit to ensure no 'end' event follows
        setTimeout(() => resolve(), 100);
      });
      emitter.on('end', () => resolve());
      // Add timeout to prevent hanging
      setTimeout(() => resolve(), 2000);
    });

    expect(error).toBeTruthy();
    const parsedError = JSON.parse(error!);
    expect(parsedError.data).toBe(
      'An error occurred while processing your request',
    );
  }, 15000);

  it('should include chat history in the pipeline', async () => {
    const chatHistory: BaseMessage[] = [
      new HumanMessage('I want to build a game'),
    ];

    const input: RagInput = {
      query: 'How do I store player scores?',
      chatHistory,
      sources: DocumentSource.CAIRO_BOOK,
    };

    mockVectorStore.similaritySearchVectorWithScore.mockResolvedValue([
      [
        new Document({
          pageContent:
            'Use Map<ContractAddress, u256> for storing user data...',
          metadata: {
            title: 'Storage Maps',
            source: DocumentSource.CAIRO_BOOK,
          },
        }),
        0.85,
      ],
    ]);
    mockVectorStore.similaritySearch.mockResolvedValue([
      new Document({
        pageContent: 'Use Map<ContractAddress, u256> for storing user data...',
        metadata: { title: 'Storage Maps', source: DocumentSource.CAIRO_BOOK },
      }),
    ]);

    const mockStream = (async function* () {
      yield { delta: { answer: 'Based on your game context...' } };
    })();

    (generationProgram.streamingForward as jest.Mock).mockReturnValue(
      mockStream,
    );

    const emitter = flow.execute(input, false);

    let ended = false;
    let error: any = null;

    emitter.on('end', () => {
      ended = true;
    });

    emitter.on('error', (err) => {
      error = err;
    });

    await new Promise<void>((resolve) => {
      emitter.on('end', () => resolve());
      emitter.on('error', () => resolve());
      // Add timeout to prevent hanging
      setTimeout(() => resolve(), 5000);
    });

    expect(error).toBeNull();
    expect(ended).toBe(true);

    // Verify chat history was passed to generation
    const streamingCall = (generationProgram.streamingForward as jest.Mock).mock
      .calls[0];
    expect(streamingCall[1].chat_history).toContain('I want to build a game');
  }, 15000);
});
