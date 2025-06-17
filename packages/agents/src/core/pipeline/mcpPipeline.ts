import { RagPipeline } from './ragPipeline';
import { RagInput, RetrievedDocuments, StreamHandler } from '../../types';
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

      const context = this.assembleDocuments(retrieved);

      handler.emitResponse({
        content: JSON.stringify(context, null, 2),
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

  public assembleDocuments(retrieved: RetrievedDocuments): string {
    const docs = retrieved.documents;
    if (!docs.length) {
      return (
        this.config.prompts.noSourceFoundPrompt ||
        'No relevant information found.'
      );
    }

    // Concatenate all document content into a single string
    let context = docs
      .map(doc => doc.pageContent)
      .join('\n\n');

    // Add contract and test templates at the end if applicable
    const { isContractRelated, isTestRelated } = retrieved.processedQuery;
    if (isContractRelated && this.config.contractTemplate) {
      context += '\n\n' + this.config.contractTemplate;
    }
    if (isTestRelated && this.config.testTemplate) {
      context += '\n\n' + this.config.testTemplate;
    }

    return context;
  }

}
