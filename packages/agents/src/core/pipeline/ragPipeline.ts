import { Embeddings } from '@langchain/core/embeddings';
import { RagInput, RagSearchConfig, LLMConfig } from '../../types';
import { QueryProcessor } from './queryProcessor';
import { DocumentRetriever } from './documentRetriever';
import { AnswerGenerator } from './answerGenerator';
import { logger, TokenTracker } from '../../utils';

/**
 * Orchestrates the RAG process in a clear, sequential flow.
 */
export class RagPipeline {
  protected queryProcessor: QueryProcessor;
  protected documentRetriever: DocumentRetriever;
  protected answerGenerator: AnswerGenerator;

  constructor(
    private llmConfig: LLMConfig,
    private embeddings: Embeddings,
    public config: RagSearchConfig,
  ) {
    this.queryProcessor = new QueryProcessor(llmConfig.fastLLM, config);
    this.documentRetriever = new DocumentRetriever(embeddings, config);
    this.answerGenerator = new AnswerGenerator(llmConfig.defaultLLM, config);
  }

  async execute(input: RagInput): Promise<{ answer: string; sources: any[] }> {
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

      // Step 3: Generate the answer
      const result = await this.answerGenerator.generate(input, retrieved);
      
      logger.debug('Answer generation completed');
      
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
      
      return {
        answer: typeof result.content === 'string' ? result.content : JSON.stringify(result.content),
        sources: retrieved.documents
      };
    } catch (error) {
      logger.error('Pipeline error:', error);
      throw new Error('An error occurred while processing your request');
    }
  }
}
