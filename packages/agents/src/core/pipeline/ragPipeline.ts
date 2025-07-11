import { AxGenIn, AxGenOut, AxMultiServiceRouter } from '@ax-llm/ax';
import {
  RagInput,
  StreamHandler,
  RagSearchConfig,
  RetrievedDocuments,
  DocumentSource,
  ProcessedQuery,
  BookChunk,
} from '../../types';
import { formatChatHistoryAsString, logger, TokenTracker } from '../../utils';
import EventEmitter from 'events';
import { AxFlow } from '@ax-llm/ax';
import { QueryProcessorProgram } from '../programs/queryProcessor.program';
import { DocumentRetrieverProgram } from '../programs/documentRetriever.program';
import { Document } from '@langchain/core/documents';
import { GET_DEFAULT_FAST_CHAT_MODEL } from '../../config/llm';

export class RagPipeline {
  private retrievalFlow: AxFlow<
    { input: RagInput },
    {
      retrieved: {
        documents: Document<BookChunk>[];
        processedQuery: ProcessedQuery;
      };
    }
  >;

  constructor(
    private axRouter: AxMultiServiceRouter,
    private config: RagSearchConfig,
  ) {
    const queryProg = new QueryProcessorProgram(this.config.retrievalProgram);
    const retrieveProg = new DocumentRetrieverProgram(
      this.axRouter,
      this.config,
    );

    // @ts-ignore
    this.retrievalFlow = new AxFlow<
      { input: RagInput },
      {
        retrieved: {
          documents: Document<BookChunk>[];
          processedQuery: ProcessedQuery;
        };
      }
    >()
      .node('queryProcess', queryProg)
      .node('retrieve', retrieveProg)
      .execute('queryProcess', (s) => ({
        chat_history: formatChatHistoryAsString(s.input.chatHistory),
        query: s.input.query,
      }))
      .map((s) => ({
        processedQuery: s.queryProcessResult.processedQuery,
        sources: s.input.sources,
      }))
      .execute('retrieve', (s) => ({
        processedQuery: s.processedQuery,
        sources: s.sources,
      }))
      .map((s) => ({
        retrieved: {
          documents: s.retrieveResult.documents,
          processedQuery: s.processedQuery,
        },
      }));
  }

  execute(input: RagInput, mcpMode: boolean = false): EventEmitter {
    const emitter = new EventEmitter();
    const handler: StreamHandler = {
      emitSources: (docs) =>
        emitter.emit('data', JSON.stringify({ type: 'sources', data: docs })),
      emitResponse: (chunk) =>
        emitter.emit(
          'data',
          JSON.stringify({ type: 'response', data: chunk.content }),
        ),
      emitEnd: () => emitter.emit('end'),
      emitError: (error) =>
        emitter.emit('error', JSON.stringify({ data: error })),
    };
    this.runPipeline(input, mcpMode, handler);
    return emitter;
  }

  private async runPipeline(
    input: RagInput,
    mcpMode: boolean,
    handler: StreamHandler,
  ): Promise<void> {
    try {
      TokenTracker.resetSessionCounters();
      logger.info('Starting RagPipeline', { query: input.query });

      const state = await this.retrievalFlow.forward(
        this.axRouter,
        { input },
        {
          debug: true,
          fastFail: true,
          autoParallel: false,
          logger: (message) => logger.debug(message),
        },
      );
      const retrieved = state.retrieved;
      handler.emitSources(retrieved.documents);

      if (mcpMode) {
        const assembled = this.assembleDocuments(retrieved);
        handler.emitResponse({
          content: JSON.stringify(assembled, null, 2),
        } as any);
      } else {
        const context = this.buildContext(retrieved);
        const chat_history = formatChatHistoryAsString(input.chatHistory);
        const query = input.query;
        const modelKey = GET_DEFAULT_FAST_CHAT_MODEL();
        // Note: not using the generationFlow here because streamingForward is not supported in AxFlow.
        const stream = this.config.generationProgram.streamingForward(
          this.axRouter,
          { chat_history, query, context },
          { model: modelKey },
        );
        let fullAnswer = '';
        const promptString = `${chat_history}\n\nUser: ${query}\n\nContext:\n${context}`;
        for await (const chunk of stream) {
          if (chunk.delta?.answer) {
            fullAnswer += chunk.delta.answer;
            handler.emitResponse({ content: chunk.delta.answer } as any);
          }
        }
        TokenTracker.trackFullUsage(
          promptString,
          { content: fullAnswer },
          modelKey,
        );
      }

      const tokenUsage = TokenTracker.getSessionTokenUsage();
      logger.info('Pipeline completed', {
        query: input.query,
        tokenUsage: {
          promptTokens: tokenUsage.promptTokens,
          responseTokens: tokenUsage.responseTokens,
          totalTokens: tokenUsage.totalTokens,
        },
      });

      handler.emitEnd();
    } catch (error) {
      logger.error('Pipeline error:', error);
      handler.emitError('An error occurred while processing your request');
    }
  }

  private buildContext(retrieved: RetrievedDocuments): string {
    const docs = retrieved.documents;
    if (!docs.length) {
      return 'No relevant documentation found for this query.';
    }

    let context = docs
      .map(
        (doc, i) =>
          `[${i + 1}] ${doc.pageContent}\nSource: ${doc.metadata.title || 'Unknown'}\n`,
      )
      .join('\n');

    const { isContractRelated, isTestRelated } = retrieved.processedQuery;
    if (isContractRelated && this.config.contractTemplate) {
      context += this.config.contractTemplate;
    }
    if (isTestRelated && this.config.testTemplate) {
      context += this.config.testTemplate;
    }
    return context;
  }

  private assembleDocuments(retrieved: RetrievedDocuments): string {
    const docs = retrieved.documents;
    if (!docs.length) {
      return 'No relevant information found.';
    }

    let context = docs.map((doc) => doc.pageContent).join('\n\n');

    const { isContractRelated, isTestRelated } = retrieved.processedQuery;
    if (isContractRelated && this.config.contractTemplate) {
      context += '\n\n' + this.config.contractTemplate;
    }
    if (isTestRelated && this.config.testTemplate) {
      context += '\n\n' + this.config.testTemplate;
    }

    return context;
  }

  /**
   * Execute retrieval flow and return intermediate results for testing purposes
   * This method is specifically designed for DocQualityTester to access intermediate states
   */
  public async executeRetrievalForTesting(input: RagInput): Promise<{
    processedQuery: any;
    retrieved: RetrievedDocuments;
    answerStream: AsyncIterable<any>;
  }> {
    // Execute retrieval flow to get intermediate results
    try {
      const state = await this.retrievalFlow.forward(this.axRouter, { input });
      const retrieved = state.retrieved;

      // Also get the processed query from the retrieval result
      const processedQuery = retrieved.processedQuery;

      // Generate answer stream
      const context = this.buildContext(retrieved);
      const chat_history = formatChatHistoryAsString(input.chatHistory);
      const query = input.query;
      const modelKey = GET_DEFAULT_FAST_CHAT_MODEL();
      const answerStream = this.config.generationProgram.streamingForward(
        this.axRouter,
        { chat_history, query, context },
        { model: modelKey },
      );

      return {
        processedQuery,
        retrieved,
        answerStream,
      };
    } catch (error) {
      // Create fallback values when retrieval fails
      const fallbackProcessedQuery = {
        original: input.query,
        transformed: [input.query],
        isContractRelated: false,
        isTestRelated: false,
        resources: [],
      };

      const fallbackRetrieved: RetrievedDocuments = {
        documents: [],
        processedQuery: fallbackProcessedQuery,
      };

      // Create an error stream that satisfies the AsyncIterable type
      const errorStream = async function* () {
        yield "Could not process request.";
      };

      return {
        processedQuery: fallbackProcessedQuery,
        retrieved: fallbackRetrieved,
        answerStream: errorStream(),
      };
    }
  }
}
