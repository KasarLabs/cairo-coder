import { AxMultiServiceRouter } from '@ax-llm/ax';
import { retrievalProgram } from '../programs/retrieval.program';
import {
  DocumentSource,
  ProcessedQuery,
  RagInput,
  RagSearchConfig,
} from '../../types';
import { formatChatHistoryAsString, logger } from '../../utils';
import { getModelForTask } from '../../config/llm';
/**
 * Transforms a raw user query into an actionable form (e.g., rephrased query or search terms).
 */
export class QueryProcessor {
  constructor(
    private axRouter: AxMultiServiceRouter | undefined,
    private config: RagSearchConfig,
  ) {}

  async process(input: RagInput): Promise<ProcessedQuery> {
    const context = formatChatHistoryAsString(input.chatHistory);

    if (!this.axRouter) {
      return this.fallbackProcess(input.query, context);
    }

    try {
      // Use the AxGen program to get structured output
      const modelKey = getModelForTask('fast');
      const result = await retrievalProgram.forward(
        this.axRouter,
        {
          chat_history: context,
          query: input.query,
        },
        { model: modelKey },
      );

      // Convert the structured result to ProcessedQuery format
      // TODO(ax-migration): verify it's needed.
      const validResources = (result.resources as string[]).filter(
        (resource: string) =>
          Object.values(DocumentSource).includes(resource as DocumentSource),
      ) as DocumentSource[];

      const searchTerms = result.search_terms as string[];

      if (searchTerms.length > 0) {
        return {
          original: input.query,
          transformed: [input.query, ...searchTerms],
          isContractRelated: searchTerms.some((t: string) =>
            t.toLowerCase().includes('contract'),
          ),
          isTestRelated: this.isTestRelated(searchTerms.join(' ')),
          resources: validResources,
        };
      }

      // If no search terms, just return the original query
      return {
        original: input.query,
        transformed: input.query,
        isContractRelated: input.query.toLowerCase().includes('contract'),
        isTestRelated: this.isTestRelated(input.query),
        resources: validResources,
      };
    } catch (error) {
      logger.error('Error in QueryProcessor:', error);
      return this.fallbackProcess(input.query, context);
    }
  }

  private fallbackProcess(query: string, context: string): ProcessedQuery {
    return {
      original: query,
      transformed: query,
      isContractRelated:
        query.toLowerCase().includes('contract') ||
        context.includes('<search_terms>'),
      isTestRelated: this.isTestRelated(query),
    };
  }

  private isTestRelated(query: string): boolean {
    const testTerms = ['test', 'tests', 'testing', 'starknet foundry'];
    return testTerms.some((term) => query.toLowerCase().includes(term));
  }
}
