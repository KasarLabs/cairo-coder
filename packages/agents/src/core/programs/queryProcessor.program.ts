import { AxAIService, AxGen, AxProgram } from '@ax-llm/ax';
import { validateResources } from './retrieval.program';
import { ProcessedQuery, DocumentSource } from '../../types';
import { GET_DEFAULT_FAST_CHAT_MODEL } from '../../config/llm';
import { logger } from '../..';

/**
 * Program for processing queries into structured formats for retrieval.
 */
export class QueryProcessorProgram extends AxGen<
  { chat_history: string; query: string },
  { processedQuery: ProcessedQuery }
> {
  /**
   * Initializes the QueryProcessorProgram with a retrieval program.
   * @param {AxGen} retrievalProgram - The program for generating search terms and resources.
   */
  constructor(
    private retrievalProgram: AxGen<
      { chat_history: string; query: string },
      { search_terms: string[]; resources: string[] }
    >,
  ) {
    super(`chat_history?:string, query:string -> processedQuery:json`);
  }

  /**
   * Processes the query using the retrieval program and derives additional flags.
   * @param {AxAIService} ai - The AI service instance.
   * @param {Object} param - Input parameters.
   * @param {string} param.chat_history - Chat history string.
   * @param {string} param.query - The user query.
   * @returns {Promise<{ processedQuery: ProcessedQuery }>} The processed query object.
   */
  async forward(
    ai: AxAIService,
    { chat_history, query }: { chat_history: string; query: string },
  ): Promise<{ processedQuery: ProcessedQuery }> {
    const modelKey = GET_DEFAULT_FAST_CHAT_MODEL();
    const result = await this.retrievalProgram.forward(
      ai,
      { chat_history, query },
      { model: modelKey },
    );

    logger.info(`result: ${JSON.stringify(result)}`);
    if (!result.search_terms) {
      return {
        processedQuery: {
          original: query,
          transformed: [query],
          isContractRelated: false,
          isTestRelated: false,
          resources: [],
        },
      };
    }

    const searchTerms = result.search_terms;
    const transformed: string[] =
      searchTerms.length > 0 ? [query, ...searchTerms] : [query];
    const isContractRelated = transformed.some((t) =>
      t.toLowerCase().includes('contract'),
    );
    const testTerms = ['test', 'tests', 'testing', 'starknet foundry'];
    const isTestRelated = testTerms.some((term) =>
      query.toLowerCase().includes(term),
    );
    const resources = validateResources(result.resources) as DocumentSource[];

    return {
      processedQuery: {
        original: query,
        transformed,
        isContractRelated,
        isTestRelated,
        resources,
      },
    };
  }
}
