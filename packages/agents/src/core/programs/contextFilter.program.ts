import {
  AxAIService,
  AxGen,
  AxProgram,
  AxProgramTrace,
  AxProgramUsage,
  ax,
} from '@ax-llm/ax';
import { Document } from '@langchain/core/documents';
import { validateResources } from './retrieval.program';
import { ProcessedQuery, DocumentSource, BookChunk } from '../../types';
import { GET_DEFAULT_FAST_CHAT_MODEL } from '../../config/llm';
import { logger } from '../..';

/**
 * Program for filtering documents based on the input query.
 * Returns all documents that pass the filter program.
 */
export class ContextFilterProgram extends AxGen<
  { documents: Document<BookChunk>[]; processedQuery: ProcessedQuery },
  { documents: Document<BookChunk>[] }
> {
  private filterProgram: AxGen<
    { document: Document<BookChunk>; processedQuery: ProcessedQuery },
    { relevantForQuery: boolean }
  >;
  private accumulatedUsage: AxProgramUsage[];

  /**
   * Initializes the ContextFilterProgram.
   */
  constructor() {
    super(
      `documents:Document<BookChunk>[], inputQuery:string -> documents:Document<BookChunk>[]`,
    );

    this.filterProgram = ax`document: string, inputQuery: string -> relevantForQuery: boolean`;
  }

  /**
   * Get the usage of the underlying retrieval program.
   * If we don't implement this, the usage will not be tracked and the default `[]` will be returned.
   * @returns {AxProgramUsage[]} The usage of the retrieval program.
   */
  getUsage(): AxProgramUsage[] {
    return this.filterProgram.getUsage();
  }

  /**
   * Reset the usage of the underlying retrieval program.
   */
  resetUsage(): void {
    this.filterProgram.resetUsage();
  }

  /**
   * Filters the documents based on the input query.
   * Iterates over the documents. Given the input string, classifies whether the document helps answer the query.
   * @param {AxAIService} ai - The AI service instance.
   * @param {Object} param - Input parameters.
   * @param {Document<BookChunk>[]} param.documents - The documents to filter.
   * @param {ProcessedQuery} param.processedQuery - The processed query.
   * @returns {Promise<{ documents: Document<BookChunk>[] }>} The filtered documents.
   */
  async forward(
    ai: AxAIService,
    {
      documents,
      processedQuery,
    }: { documents: Document<BookChunk>[]; processedQuery: ProcessedQuery },
  ): Promise<{ documents: Document<BookChunk>[] }> {
    const modelKey = GET_DEFAULT_FAST_CHAT_MODEL();
    const filteredDocuments: Document<BookChunk>[] = [];

    for (const document of documents) {
      const result = await this.filterProgram.forward(
        ai,
        { document, processedQuery },
        { model: modelKey },
      );
      if (result.relevantForQuery) {
        filteredDocuments.push(document);
      }
    }

    return { documents: filteredDocuments };
  }
}
