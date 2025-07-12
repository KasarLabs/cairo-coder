import { AxAIService, AxGen, AxProgram } from '@ax-llm/ax';
import { validateResources } from './retrieval.program';
import { ProcessedQuery, DocumentSource } from '../../types';
import { GET_DEFAULT_FAST_CHAT_MODEL } from '../../config/llm';
import { logger } from '../..';

export class QueryProcessorProgram extends AxGen<
  { chat_history: string; query: string },
  { processedQuery: ProcessedQuery }
> {
  constructor(
    private retrievalProgram: AxGen<
      { chat_history: string; query: string },
      { search_terms: string[]; resources: string[] }
    >,
  ) {
    super(`chat_history?:string, query:string -> processedQuery:json`);
  }

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
