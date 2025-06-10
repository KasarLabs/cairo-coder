import { RagPipeline } from './ragPipeline';
import { RagInput, StreamHandler } from '../../types';
import { logger, TokenTracker } from '../../utils';

/**
 * MCP Pipeline that extends RAG pipeline but stops at document retrieval
 * without generating answers, returning raw documents instead.
 */
export class McpPipeline extends RagPipeline {
  protected async runPipeline(
    input: RagInput,
    handler: StreamHandler,
  ): Promise<void> {
    try {
      // Reset token counters at the start of each pipeline run
      TokenTracker.resetSessionCounters();
      
      logger.info('Starting MCP pipeline', { query: input.query });

      // Step 1: Process the query
      const processedQuery = await this.queryProcessor.process(input);
      logger.debug('Processed query:', processedQuery);

      // Step 2: Retrieve documents
      const retrieved = await this.documentRetriever.retrieve(
        processedQuery,
        input.sources,
      );
      handler.emitSources(retrieved.documents);

      // Step 3: Return raw documents without answer generation
      logger.info('MCP mode - returning raw documents');
      
      const rawDocuments = retrieved.documents.map(doc => ({
        pageContent: doc.pageContent,
        metadata: doc.metadata
      }));

      handler.emitResponse({
        content: JSON.stringify(rawDocuments, null, 2),
      } as any);

      logger.debug('MCP pipeline ended');
      
      // Log final token usage
      const tokenUsage = TokenTracker.getSessionTokenUsage();
      logger.info('MCP Pipeline completed', { 
        query: input.query,
        tokenUsage: {
          promptTokens: tokenUsage.promptTokens,
          responseTokens: tokenUsage.responseTokens,
          totalTokens: tokenUsage.totalTokens
        }
      });
      
      handler.emitEnd();
    } catch (error) {
      logger.error('MCP Pipeline error:', error);
      handler.emitError('An error occurred while processing your request');
    }
  }
} 