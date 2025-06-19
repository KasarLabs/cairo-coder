import { RagPipeline } from './ragPipeline';
import { RagInput, RetrievedDocuments } from '../../types';
import { logger, TokenTracker } from '../../utils';

/**
 * MCP Pipeline that extends RAG pipeline but stops at document retrieval
 * without generating answers, returning raw documents instead.
 */
export class McpPipeline extends RagPipeline {
  async execute(input: RagInput): Promise<{ answer: string; sources: any[] }> {
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

      // Step 3: Return raw documents without answer generation
      logger.info('MCP mode - returning raw documents');

      const context = this.assembleDocuments(retrieved);

      logger.debug('MCP pipeline ended');

      // Log final token usage
      const tokenUsage = TokenTracker.getSessionTokenUsage();
      logger.info('MCP Pipeline completed', {
        query: input.query,
        tokenUsage: {
          promptTokens: tokenUsage.promptTokens,
          responseTokens: tokenUsage.responseTokens,
          totalTokens: tokenUsage.totalTokens,
        },
      });

      return {
        answer: JSON.stringify(context, null, 2),
        sources: retrieved.documents
      };
    } catch (error) {
      logger.error('MCP Pipeline error:', error);
      throw new Error('An error occurred while processing your request');
    }
  }

  private assembleDocuments(retrieved: RetrievedDocuments): any[] {
    return retrieved.documents.map((doc) => ({
      content: doc.pageContent,
      metadata: doc.metadata,
    }));
  }
}
