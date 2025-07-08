import { Document } from '@langchain/core/documents';
import { AxMultiServiceRouter } from '@ax-llm/ax';
import {
  ProcessedQuery,
  RetrievedDocuments,
  RagSearchConfig,
  BookChunk,
  DocumentSource,
} from '../../types';
import { computeSimilarity, logger } from '../../utils';
/**
 * Retrieves and refines relevant documents based on a processed query.
 */
export class DocumentRetriever {
  constructor(
    private axRouter: AxMultiServiceRouter,
    private config: RagSearchConfig,
  ) {}

  async retrieve(
    processedQuery: ProcessedQuery,
    sources: DocumentSource | DocumentSource[],
  ): Promise<RetrievedDocuments> {
    logger.debug('Retrieving documents', { processedQuery, sources });
    const docs = await this.fetchDocuments(processedQuery, sources);
    const refinedDocs = (await this.rerankDocuments(
      processedQuery.transformed,
      docs,
    )) as Document<BookChunk>[];
    const attachedDocs = await this.attachSources(refinedDocs);
    return { documents: attachedDocs, processedQuery };
  }

  private async fetchDocuments(
    query: ProcessedQuery,
    sources: DocumentSource | DocumentSource[],
  ): Promise<Document[]> {
    const searchQuery = Array.isArray(query.transformed)
      ? query.transformed
      : [query.transformed];
    if (query.resources?.length > 0) {
      sources = query.resources;
    }
    const searchPromises = searchQuery.map((q) =>
      this.config.vectorStore.similaritySearch(
        q,
        this.config.maxSourceCount || 10,
        sources,
      ),
    );
    const results = await Promise.all(searchPromises);
    const uniqueDocs = [
      ...new Set(results.flat().map((doc) => doc.pageContent)),
    ].map(
      (content) => results.flat().find((doc) => doc.pageContent === content)!,
    );
    const sourceSet = new Set(uniqueDocs.map((doc) => doc.metadata.source));
    logger.debug('Retrieved documents:', {
      count: uniqueDocs.length,
      sources: Array.from(sourceSet),
    });
    return uniqueDocs;
  }

  private async rerankDocuments(
    query: string | string[],
    docs: Document[],
  ): Promise<Document[]> {
    if (
      docs.length === 0 ||
      (typeof query === 'string' && query === 'Summarize')
    ) {
      return docs;
    }

    const validDocs = docs.filter((doc) => doc.pageContent?.length > 0);
    const queryText = Array.isArray(query) ? query.join(' ') : query;
    const [docEmbeddingsResult, queryEmbeddingResult] = await Promise.all([
      this.axRouter.embed({
        texts: validDocs.map((doc) => doc.pageContent),
        embedModel: 'openai-embeddings',
      }),
      this.axRouter.embed({
        texts: [queryText],
        embedModel: 'openai-embeddings',
      }),
    ]);

    const docEmbeddings = docEmbeddingsResult.embeddings;
    const queryEmbedding = queryEmbeddingResult.embeddings[0];

    const similarities = docEmbeddings.map((docEmbedding, i) => ({
      index: i,
      similarity: computeSimilarity([...queryEmbedding], [...docEmbedding]),
    }));

    return similarities
      .filter(
        (sim) => sim.similarity > (this.config.similarityThreshold || 0.4),
      )
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10)
      .map((sim) => validDocs[sim.index]);
  }

  private async attachSources(
    docs: Document<BookChunk>[],
  ): Promise<Document<BookChunk>[]> {
    return docs.map((doc) => ({
      pageContent: doc.pageContent,
      metadata: {
        ...doc.metadata,
        title: doc.metadata.title,
        url: doc.metadata.sourceLink,
      },
    }));
  }
}
