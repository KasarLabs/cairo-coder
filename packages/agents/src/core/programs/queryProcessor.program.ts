import { AxAIService, AxGen, AxProgram } from '@ax-llm/ax';
import { retrievalProgram, validateResources } from './retrieval.program';
import { getModelForTask } from '../../config/llm';
import { ProcessedQuery, DocumentSource } from '../../types';

export class QueryProcessorProgram extends AxGen<
  { chat_history: string; query: string },
  { processedQuery: ProcessedQuery }
> {
  constructor() {
    super(`chat_history:string, query:string -> processedQuery:json`);
  }

  async forward(
    ai: AxAIService,
    { chat_history, query }: { chat_history: string; query: string },
  ): Promise<{ processedQuery: ProcessedQuery }> {
    const result = await retrievalProgram.forward(
      ai,
      { chat_history, query },
      { model: getModelForTask('fast') },
    );

    const searchTerms = result.search_terms as string[];
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
