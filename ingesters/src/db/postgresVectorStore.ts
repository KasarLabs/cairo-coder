import { Embeddings } from '@langchain/core/embeddings';
import { type DocumentInterface } from '@langchain/core/documents';
import { logger } from '../utils/logger';
import {
  type VectorStoreConfig,
  DocumentSource,
  type BookChunk,
} from '../types';
import pg, { Pool, type PoolClient } from 'pg';
import { DatabaseError as PgError } from 'pg';

/**
 * Custom error class for handling Postgres-specific errors
 */
class DatabaseError extends Error {
  code?: string;
  detail?: string;
  table?: string;

  public constructor(message: string, error?: PgError) {
    if (error) {
      super(`${message}: ${error.message}`);
    } else {
      super(message);
    }

    if (error) {
      this.code = error.code;
      this.detail = error.detail;
      this.table = error.table;
    }
  }

  /**
   * Handles a { @see PgError } associated to a database query, logging some
   * extra information in the process.
   *
   * @throws { DatabaseError }
   */
  public static handlePgError(err: PgError): DatabaseError {
    // See https://www.postgresql.org/docs/current/errcodes-appendix.html
    switch (err.code) {
      case '23505': // unique_violation
        return new DatabaseError('Duplicate key violation', err);

      case '23503': // foreign_key_violation
        return new DatabaseError('Referenced record does not exist', err);

      case '28P01': // invalid_password
        return new DatabaseError('Database authentication failed', err);

      case '57P01': // admin_shutdown
      case '57P02': // crash_shutdown
      case '57P03': // cannot_connect_now
        return new DatabaseError('Database server unavailable', err);

      case '42P01': // undefined_table
        return new DatabaseError('Schema error: table not found', err);

      case '42P07': // duplicate_table
        return new DatabaseError('Table already exists', err);

      case '42501': // insufficient_privilege
        return new DatabaseError('Insufficient database privileges', err);

      case '42601': // syntax error
        return new DatabaseError('Syntax error', err);

      case '42703': // undefined_column
        return new DatabaseError('Schema error: column not found', err);

      default:
        return new DatabaseError('Database operation failed', err);
    }
  }
}

/**
 * A query and its associated values.
 */
class Query {
  public readonly query: string;
  public readonly values?: any[];

  public constructor(query: string, values?: any[]) {
    this.query = query;
    this.values = values;
  }
}

/**
 * PostgresVectorStore class for managing document storage and similarity search with PostgreSQL
 */
export class VectorStore {
  private static instance: VectorStore | null = null;
  private static initializing: Promise<VectorStore> | null = null;
  private pool: Pool;
  private embeddings: Embeddings;
  private tableName: string;

  private constructor(pool: Pool, embeddings: Embeddings, tableName: string) {
    this.pool = pool;
    this.embeddings = embeddings;
    this.tableName = tableName;
  }

  static async getInstance(
    config: VectorStoreConfig,
    embeddings: Embeddings,
  ): Promise<VectorStore> {
    if (VectorStore.instance) {
      return VectorStore.instance;
    }

    if (VectorStore.initializing) {
      return await VectorStore.initializing;
    }

    // Single-flight initialization block
    VectorStore.initializing = (async () => {
      if (VectorStore.instance) {
        return VectorStore.instance;
      }

      let pool: Pool | null = null;
      try {
        pool = new Pool({
          user: config.POSTGRES_USER,
          host: config.POSTGRES_HOST,
          database: config.POSTGRES_DB,
          password: config.POSTGRES_PASSWORD,
          port: parseInt(config.POSTGRES_PORT),
          max: 10,
          min: 5,
        });

        pool.on('error', (err) => {
          logger.error('Postgres pool error:', err);
        });

        logger.info('Connected to PostgreSQL');

        // Create instance but do not publish it until DB is ready
        const newInstance = new VectorStore(
          pool,
          embeddings,
          config.POSTGRES_TABLE_NAME,
        );
        await newInstance.initializeDb();

        VectorStore.instance = newInstance;
        return newInstance;
      } catch (err) {
        // Ensure pool is closed on failure to avoid leaks
        if (pool) {
          try {
            await pool.end();
          } catch {}
        }
        throw err;
      }
    })();

    try {
      return await VectorStore.initializing;
    } finally {
      // Clear the initializing flag (instance is set on success, remains null on failure)
      VectorStore.initializing = null;
    }
  }

  /**
   * Initialize the database schema
   */
  private async initializeDb(): Promise<void> {
    try {
      const client = await this.pool.connect();
      try {
        // Enable vector extension
        await client.query('CREATE EXTENSION IF NOT EXISTS vector;');
        // Create documents table if it doesn't exist
        await client.query(`
          CREATE TABLE IF NOT EXISTS ${this.tableName} (
            id SERIAL PRIMARY KEY,
            content TEXT NOT NULL,
            metadata JSONB NOT NULL,
            embedding halfvec(3072) NOT NULL,
            uniqueId VARCHAR(255),
            contentHash VARCHAR(255),
            source VARCHAR(50),
            UNIQUE(uniqueId)
          );
        `);

        // Create index on source for filtering
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_${this.tableName}_source ON ${this.tableName} (source);
        `);

        // Create vector index for similarity search
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_${this.tableName}_embedding ON ${this.tableName} USING ivfflat (embedding halfvec_cosine_ops)
          WITH (lists = 100);
        `);
        logger.info('PostgreSQL database initialized');
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Error initializing database:', error);
      throw DatabaseError.handlePgError(error as PgError);
    }
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
    sources?: DocumentSource | DocumentSource[],
  ): Promise<DocumentInterface[]> {
    try {
      // Generate embedding for the query
      const embedding = await this.embeddings.embedQuery(query);

      // Build SQL query
      let sql = `
        SELECT
          content,
          metadata,
          1 - (embedding <=> $1) as similarity
        FROM ${this.tableName}
        WHERE 1=1
      `;

      const values: any[] = [JSON.stringify(embedding)];
      let paramIndex = 2;

      // Add source filter if provided
      if (sources) {
        const sourcesArray = Array.isArray(sources) ? sources : [sources];
        if (sourcesArray.length > 0) {
          sql += ` AND source = ANY($${paramIndex})`;
          values.push(sourcesArray);
          paramIndex++;
        }
      }

      // Add order by and limit
      sql += `
        ORDER BY similarity DESC
        LIMIT $${paramIndex}
      `;
      values.push(k);

      // Execute query
      const client = await this.pool.connect();
      try {
        const result = await client.query(sql, values);

        // Convert to DocumentInterface format
        return result.rows.map((row) => ({
          pageContent: row.content,
          metadata: row.metadata,
        }));
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Error in similarity search:', error);
      throw DatabaseError.handlePgError(error as PgError);
    }
  }

  /**
   * Add documents to the vector store
   * @param documents - Array of documents to add
   * @param uniqueIds - Optional array of unique IDs for the documents
   * @returns Promise<void>
   */
  async addDocuments(
    documents: DocumentInterface[],
    options?: { ids?: string[] },
  ): Promise<void> {
    logger.info(`Adding ${documents.length} documents to the vector store`);

    if (documents.length === 0) return;

    try {
      // Generate embeddings in batches by content length
      const documentBatches = documents.reduce((batches: string[][], doc) => {
        const batch = batches[batches.length - 1] || [];
        const totalLength = batch.reduce((sum, text) => sum + text.length, 0);
        totalLength + doc.pageContent.length > 100000 && batch.length > 0
          ? batches.push([doc.pageContent])
          : batch.push(doc.pageContent);
        return batches.length === 0 ? [[doc.pageContent]] : batches;
      }, []);

      // Process all batches
      const batchEmbeddings = await Promise.all(
        documentBatches.map((batch) => this.embeddings.embedDocuments(batch)),
      );

      // Merge all embeddings
      const embeddings = batchEmbeddings.flat();

      const client = await this.pool.connect();
      try {
        await client.query('BEGIN');

        // Prepare batch insert
        const insertPromises = documents.map((doc, i) => {
          const uniqueId = options?.ids?.[i] || doc.metadata.uniqueId || null;
          const contentHash = doc.metadata.contentHash || null;
          const source = doc.metadata.source || null;

          const query = `
            INSERT INTO ${this.tableName} (content, metadata, embedding, uniqueId, contentHash, source)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (uniqueId)
            DO UPDATE SET
              content = EXCLUDED.content,
              metadata = EXCLUDED.metadata,
              embedding = EXCLUDED.embedding,
              contentHash = EXCLUDED.contentHash
          `;

          return client.query(query, [
            doc.pageContent,
            JSON.stringify(doc.metadata),
            JSON.stringify(embeddings[i]),
            uniqueId,
            contentHash,
            source,
          ]);
        });

        await Promise.all(insertPromises);
        await client.query('COMMIT');

        logger.info(`Successfully added ${documents.length} documents`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Error adding documents:', error);
      throw DatabaseError.handlePgError(error as PgError);
    }
  }

  /**
   * Update only the metadata (and source column for consistency) for existing documents.
   * Does NOT modify content, embedding, or contentHash.
   */
  async updateDocumentsMetadata(
    documents: DocumentInterface[],
    options?: { ids?: string[] },
  ): Promise<void> {
    if (documents.length === 0) return;

    logger.info(`Updating metadata for ${documents.length} documents`);

    try {
      const client = await this.pool.connect();
      try {
        await client.query('BEGIN');

        const updates = documents.map((doc, i) => {
          const uniqueId = options?.ids?.[i] || doc.metadata.uniqueId || null;
          const source = doc.metadata.source || null;
          const query = `
            UPDATE ${this.tableName}
            SET metadata = $2,
                source = $3
            WHERE uniqueId = $1
          `;
          return client.query(query, [
            uniqueId,
            JSON.stringify(doc.metadata),
            source,
          ]);
        });

        await Promise.all(updates);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Error updating document metadata:', error);
      throw DatabaseError.handlePgError(error as PgError);
    }
  }

  /**
   * Find a specific book chunk by name
   * @param name - Name of the book chunk
   * @returns Promise<Document | null>
   */
  async findBookChunk(name: string): Promise<DocumentInterface | null> {
    try {
      const client = await this.pool.connect();
      try {
        const result = await client.query(
          `SELECT content, metadata, contentHash FROM ${this.tableName} WHERE uniqueId = $1`,
          [name],
        );

        if (result.rows.length > 0) {
          const row = result.rows[0];
          return {
            metadata: {
              _id: name,
              contentHash: row.contentHash,
              ...JSON.parse(row.metadata),
            },
            pageContent: row.content,
          };
        }
        return null;
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Error finding book chunk:', error);
      throw DatabaseError.handlePgError(error as PgError);
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
    if (uniqueIds.length === 0) return;

    try {
      const client = await this.pool.connect();
      try {
        const query = `
          DELETE FROM ${this.tableName}
          WHERE uniqueId = ANY($1)
          AND source = $2
        `;

        await client.query(query, [uniqueIds, source]);
        logger.info(`Removed ${uniqueIds.length} pages from source ${source}`);
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Error removing book pages:', error);
      throw DatabaseError.handlePgError(error as PgError);
    }
  }

  /**
   * Get hashes and metadata of stored book pages
   * @param source - Source filter
   * @returns Promise<Array<{uniqueId: string, metadata: BookChunk}>>
   */
  async getStoredBookPagesMetadata(source: DocumentSource): Promise<
    Array<{
      uniqueId: string;
      metadata: BookChunk;
    }>
  > {
    try {
      const client = await this.pool.connect();
      try {
        const result = await client.query(
          `SELECT uniqueId, metadata FROM ${this.tableName} WHERE source = $1`,
          [source],
        );

        return result.rows.map((row) => ({
          uniqueId: row.uniqueid,
          metadata: row.metadata || {},
        }));
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Error getting stored book pages metadata:', error);
      throw DatabaseError.handlePgError(error as PgError);
    }
  }

  /**
   * Close the connection to the database
   * @returns Promise<void>
   */
  async close(): Promise<void> {
    logger.info('Disconnecting from PostgreSQL');
    if (this.pool) {
      await this.pool.end();
      // Reset singletons so future calls can re-initialize cleanly
      VectorStore.instance = null;
      VectorStore.initializing = null;
    }
  }

  /**
   * Execute a query against the database
   * @param q - The query to execute
   * @returns Promise<any[]>
   */
  private async query<T = any>(q: Query): Promise<T[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(q.query, q.values);
      return result.rows as T[];
    } catch (error) {
      throw DatabaseError.handlePgError(error as PgError);
    } finally {
      client.release();
    }
  }

  /**
   * Execute a transaction against the database
   * @param queries - The queries to execute
   * @returns Promise<any[]>
   */
  private async transaction<T = any>(queries: Query[]): Promise<T[]> {
    const client = await this.pool.connect();
    let result;

    try {
      await client.query('BEGIN');

      for (const q of queries) {
        result = await client.query(q.query, q.values);
      }

      await client.query('COMMIT');
      return result ? result.rows : [];
    } catch (error) {
      await client.query('ROLLBACK');
      throw DatabaseError.handlePgError(error as PgError);
    } finally {
      client.release();
    }
  }
}
