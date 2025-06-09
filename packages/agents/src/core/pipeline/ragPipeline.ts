import { Embeddings } from '@langchain/core/embeddings';
import { RagInput, StreamHandler, RagSearchConfig, LLMConfig } from '../../types';
import { QueryProcessor } from './queryProcessor';
import { DocumentRetriever } from './documentRetriever';
import { AnswerGenerator } from './answerGenerator';
import EventEmitter from 'events';
import { logger, TokenTracker } from '../../utils';

/**
 * Orchestrates the RAG process in a clear, sequential flow.
 */
export class RagPipeline {
  private queryProcessor: QueryProcessor;
  private documentRetriever: DocumentRetriever;
  private answerGenerator: AnswerGenerator;

  constructor(
    private llmConfig: LLMConfig,
    private embeddings: Embeddings,
    public config: RagSearchConfig,
  ) {
    this.queryProcessor = new QueryProcessor(llmConfig.fastLLM, config);
    this.documentRetriever = new DocumentRetriever(embeddings, config);
    this.answerGenerator = new AnswerGenerator(llmConfig.defaultLLM, config);
  }

  execute(input: RagInput): EventEmitter {
    const emitter = new EventEmitter();
    this.runPipeline(input, {
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
    });
    return emitter;
  }

  private async runPipeline(
    input: RagInput,
    handler: StreamHandler,
  ): Promise<void> {
    try {
      // Reset token counters at the start of each pipeline run
      TokenTracker.resetSessionCounters();
      
      logger.info('Starting RAG pipeline', { query: input.query });

      // Step 1: Process the query
      const processedQuery = await this.queryProcessor.process(input);
      logger.debug('Processed query:', processedQuery);

      // Step 2: Retrieve documents
      const retrieved = await this.documentRetriever.retrieve(
        processedQuery,
        input.sources,
      );
      handler.emitSources(retrieved.documents);

      // Step 3: Check if MCP mode is enabled
      if (input.mcpMode) {
        // In MCP mode, return documents directly without answer generation
        logger.info('MCP mode enabled - returning raw documents');
        
        const rawDocuments = retrieved.documents.map(doc => ({
          pageContent: doc.pageContent,
          metadata: doc.metadata
        }));

        handler.emitResponse({
          content: JSON.stringify(rawDocuments, null, 2),
        } as any);
      } else {
        // Step 3: Generate the answer as a stream (normal mode)
        const stream = await this.answerGenerator.generate(input, retrieved);
        for await (const chunk of stream) {
          handler.emitResponse(chunk);
        }
      }
      logger.debug('Stream ended');
      
      // Log final token usage
      const tokenUsage = TokenTracker.getSessionTokenUsage();
      logger.info('Pipeline completed', { 
        query: input.query,
        tokenUsage: {
          promptTokens: tokenUsage.promptTokens,
          responseTokens: tokenUsage.responseTokens,
          totalTokens: tokenUsage.totalTokens
        }
      });
      
      handler.emitEnd();
    } catch (error) {
      logger.error('Pipeline error:', error);
      handler.emitError('An error occurred while processing your request');
    }
  }
}
