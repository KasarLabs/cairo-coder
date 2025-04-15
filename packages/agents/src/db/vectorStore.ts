import { MongoDBAtlasVectorSearch } from '@langchain/mongodb';
import { MongoClient, Collection, ObjectId, Filter } from 'mongodb';
import { DocumentInterface } from '@langchain/core/documents';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Embeddings } from '@langchain/core/embeddings';
import logger from '../utils/logger';
import { VectorStoreConfig } from '../config';
import { DocumentSource } from '../types';

/**
 * VectorStore class for managing document storage and similarity search
 */
export class VectorStore {
  private static instance: VectorStore | null = null;
  private client: MongoClient;
  collection: Collection;
  private vectorSearch: MongoDBAtlasVectorSearch;

  private constructor(
    client: MongoClient,
    collection: Collection,
    vectorSearch: MongoDBAtlasVectorSearch,
  ) {
    this.client = client;
    this.collection = collection;
    this.vectorSearch = vectorSearch;
  }

  static async getInstance(
    config: VectorStoreConfig,
    embeddings: Embeddings,
  ): Promise<VectorStore> {
    if (!VectorStore.instance) {
      const client = new MongoClient(config.MONGODB_URI, {
        maxPoolSize: 10, // Adjust this value based on your needs
        minPoolSize: 5,
      });
      await client.connect();
      logger.info('Connected to MongoDB');

      const collection = client
        .db(config.DB_NAME)
        .collection(config.COLLECTION_NAME);

      const vectorSearch = new MongoDBAtlasVectorSearch(embeddings, {
        collection,
        indexName: 'default',
        textKey: 'content',
        embeddingKey: 'embedding',
      });

      VectorStore.instance = new VectorStore(client, collection, vectorSearch);
    }
    return VectorStore.instance;
  }

  /**
   * Perform similarity search
   * @param query - The query string
   * @param k - Number of results to return
   * @param sources - Optional source filter
   * @returns Promise<Document[]>
   */
  async similaritySearch(
    query: string,
    k: number = 5,
    sources: DocumentSource | DocumentSource[],
  ): Promise<DocumentInterface[]> {
    if (!sources) {
      return this.vectorSearch.similaritySearch(query, k);
    }

    const sourcesArray = Array.isArray(sources) ? sources : [sources];
    const filter: Filter<any> = {
      preFilter: { source: { $in: sourcesArray } },
    };

    return this.vectorSearch.similaritySearch(query, k, filter);
  }

  /**
   * Add documents to the vector store
   * @param documents - Array of documents to add
   * @param uniqueIds - Optional array of unique IDs for the documents
   * @returns Promise<void>
   */
  async addDocuments(documents: any[], uniqueIds?: string[]): Promise<void> {
    logger.info(`Adding ${documents.length} documents to the vector store`);
    await this.vectorSearch.addDocuments(documents, { ids: uniqueIds });
  }

  /**
   * Find a specific book chunk by name
   * @param name - Name of the book chunk
   * @returns Promise<Document | null>
   */
  async findBookChunk(name: string): Promise<DocumentInterface | null> {
    try {
      const match = await this.collection.findOne({
        _id: name as unknown as ObjectId,
      });
      if (match) {
        return {
          metadata: { _id: name, contentHash: match.contentHash },
          pageContent: match.text,
        };
      }
      return null;
    } catch (error) {
      logger.error('Error finding book chunk:', error);
      throw error;
    }
  }

  /**
   * Remove book pages by their unique IDs
   * @param uniqueIds - Array of unique IDs to remove
   * @param source - Optional source filter
   * @returns Promise<void>
   */
  async removeBookPages(
    uniqueIds: string[],
    source: DocumentSource,
  ): Promise<void> {
    const filter: Filter<any> = {
      uniqueId: { $in: uniqueIds },
      source: { $in: [source] },
    };

    logger.info('Removing book pages with filter', filter);
    await this.collection.deleteMany(filter);
  }

  /**
   * Get hashes of stored book pages
   * @param source - Optional source filter
   * @returns Promise<Array<{uniqueId: string, contentHash: string}>>
   */
  async getStoredBookPagesHashes(
    source: DocumentSource,
  ): Promise<Array<{ uniqueId: string; contentHash: string }>> {
    const filter: Filter<any> = { source: { $in: [source] } };
    const documents = await this.collection
      .find(filter, { projection: { uniqueId: 1, contentHash: 1 } })
      .toArray();

    return documents.map((doc) => ({
      uniqueId: doc.uniqueId,
      contentHash: doc.contentHash,
    }));
  }

  /**
   * Close the connection to the database
   * @returns Promise<void>
   */
  async close(): Promise<void> {
    logger.info('Disconnecting from MongoDB');
    if (this.client) {
      await this.client.close(true); // Force close all connections in the pool
      VectorStore.instance = null; // Reset the singleton instance
    }
  }
}
