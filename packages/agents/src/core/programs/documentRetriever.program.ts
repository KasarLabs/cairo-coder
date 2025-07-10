import {
  AxAIService,
  AxGen,
  AxProgramForwardOptions,
  AxProgram,
} from '@ax-llm/ax';
import { Document } from '@langchain/core/documents';
import { computeSimilarity, logger } from '../../utils';
import {
  RagSearchConfig,
  ProcessedQuery,
  DocumentSource,
  BookChunk,
} from '../../types';
import { AxMultiServiceRouter } from '@ax-llm/ax';

export class DocumentRetrieverProgram extends AxGen<
  {
    processedQuery: ProcessedQuery;
    sources: DocumentSource | DocumentSource[];
  },
  { documents: Document<BookChunk>[] }
> {
  constructor(
    private axRouter: AxMultiServiceRouter,
    private config: RagSearchConfig,
  ) {
    super(`processedQuery:json, sources:string[] -> documents:json[]`);
  }

  // Note for future maintainers: ensure that you give the right inputs to forward, otherwise the program will silently fail.
  async forward(
    ai: Readonly<AxAIService>,
    {
      processedQuery,
      sources,
    }: {
      processedQuery: ProcessedQuery;
      sources: DocumentSource | DocumentSource[];
    },
  ): Promise<{ documents: Document<BookChunk>[] }> {
    if (processedQuery.resources?.length > 0) {
      sources = processedQuery.resources;
    }
    const docs = await this.fetchDocuments(processedQuery, sources);
    const refinedDocs = await this.rerankDocuments(
      processedQuery.original,
      docs,
    );
    const attachedDocs = await this.attachSources(
      refinedDocs as Document<BookChunk>[],
    );
    return { documents: attachedDocs };
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
    return uniqueDocs;
  }

  private async rerankDocuments(
    query: string,
    docs: Document[],
  ): Promise<Document[]> {
    if (docs.length === 0) {
      return docs;
    }

    const validDocs = docs.filter((doc) => doc.pageContent?.length > 0);
    const queryText = query;
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
    return docs
      .filter((doc) => doc?.pageContent)
      .map((doc) => ({
        pageContent: doc.pageContent,
        metadata: {
          ...doc.metadata,
          title: doc.metadata?.title,
          url: doc.metadata?.sourceLink,
        },
      }));
  }
}
