"""PostgreSQL vector store integration for document retrieval."""

import json
from typing import Any, Dict, List, Optional, Union

import asyncpg
import numpy as np
from openai import AsyncOpenAI

from ..utils.logging import get_logger
from .config import VectorStoreConfig
from .types import Document, DocumentSource

logger = get_logger(__name__)


class VectorStore:
    """PostgreSQL vector store for document storage and retrieval."""

    def __init__(self, config: VectorStoreConfig, openai_api_key: Optional[str] = None):
        """
        Initialize vector store with configuration.

        Args:
            config: Vector store configuration.
            openai_api_key: Optional OpenAI API key for embeddings.
        """
        self.config = config
        self.pool: Optional[asyncpg.Pool] = None

        # Initialize embedding client only if API key is provided
        if openai_api_key:
            self.embedding_client = AsyncOpenAI(api_key=openai_api_key)
        else:
            self.embedding_client = None

    async def initialize(self) -> None:
        """Initialize database connection pool."""
        if self.pool is None:
            self.pool = await asyncpg.create_pool(
                dsn=self.config.dsn,
                min_size=2,
                max_size=10,
                command_timeout=60
            )
            logger.info("Vector store initialized", dsn=self.config.dsn)

    async def close(self) -> None:
        """Close database connection pool."""
        if self.pool:
            await self.pool.close()
            self.pool = None
            logger.info("Vector store closed")

    async def similarity_search(
        self,
        query: str,
        k: int = 5,
        sources: Optional[Union[DocumentSource, List[DocumentSource]]] = None
    ) -> List[Document]:
        """
        Search for similar documents using vector similarity.

        Args:
            query: Search query text.
            k: Number of documents to return.
            sources: Filter by document sources.

        Returns:
            List of similar documents.
        """
        if not self.pool:
            await self.initialize()

        # Convert single source to list
        if sources and isinstance(sources, DocumentSource):
            sources = [sources]

        # Generate query embedding
        query_embedding = await self._embed_text(query)

        # Build similarity query based on measure
        if self.config.similarity_measure == "cosine":
            similarity_expr = "1 - (embedding <=> $1::vector)"
            order_expr = "embedding <=> $1::vector"
        elif self.config.similarity_measure == "dot_product":
            similarity_expr = "(embedding <#> $1::vector) * -1"
            order_expr = "embedding <#> $1::vector"
        else:  # euclidean
            similarity_expr = "1 / (1 + (embedding <-> $1::vector))"
            order_expr = "embedding <-> $1::vector"

        # Build query with optional source filtering
        base_query = f"""
            SELECT
                id,
                content,
                metadata,
                {similarity_expr} as similarity
            FROM {self.config.table_name}
        """

        if sources:
            source_values = [s.value for s in sources]
            base_query += f"""
            WHERE metadata->>'source' = ANY($2::text[])
            """

        # TODO what is this LIMIT number?
        base_query += f"""
            ORDER BY {order_expr}
            LIMIT ${'3' if sources else '2'}
        """

        async with self.pool.acquire() as conn:
            # Execute query
            if sources:
                source_values = [s.value for s in sources]
                rows = await conn.fetch(
                    base_query,
                    query_embedding,
                    source_values,
                    k
                )
            else:
                rows = await conn.fetch(
                    base_query,
                    query_embedding,
                    k
                )

            # Convert to Document objects
            documents = []
            for row in rows:
                metadata = json.loads(row["metadata"]) if row["metadata"] else {}
                metadata["similarity"] = float(row["similarity"])
                metadata["id"] = row["id"]

                doc = Document(
                    page_content=row["content"],
                    metadata=metadata
                )
                documents.append(doc)

            logger.debug(
                "Similarity search completed",
                query_length=len(query),
                num_results=len(documents),
                sources=[s.value for s in sources] if sources else None
            )

            return documents

    async def add_documents(
        self,
        documents: List[Document],
        ids: Optional[List[str]] = None
    ) -> None:
        """
        Add documents to the vector store.

        Args:
            documents: Documents to add.
            ids: Optional document IDs.
        """
        if not self.pool:
            await self.initialize()

        if ids and len(ids) != len(documents):
            raise ValueError("Number of IDs must match number of documents")

        # Generate embeddings for all documents
        texts = [doc.page_content for doc in documents]
        embeddings = await self._embed_texts(texts)

        # Prepare data for insertion
        rows = []
        for i, (doc, embedding) in enumerate(zip(documents, embeddings)):
            doc_id = ids[i] if ids else None
            metadata_json = json.dumps(doc.metadata)
            rows.append((doc_id, doc.page_content, embedding, metadata_json))

        # Insert documents
        async with self.pool.acquire() as conn:
            if ids:
                # Upsert with provided IDs
                await conn.executemany(
                    f"""
                    INSERT INTO {self.config.table_name} (id, content, embedding, metadata)
                    VALUES ($1, $2, $3::vector, $4::jsonb)
                    ON CONFLICT (id) DO UPDATE SET
                        content = EXCLUDED.content,
                        embedding = EXCLUDED.embedding,
                        metadata = EXCLUDED.metadata,
                        updated_at = NOW()
                    """,
                    rows
                )
            else:
                # Insert without IDs (auto-generate)
                await conn.executemany(
                    f"""
                    INSERT INTO {self.config.table_name} (content, embedding, metadata)
                    VALUES ($1, $2::vector, $3::jsonb)
                    """,
                    [(r[1], r[2], r[3]) for r in rows]
                )

        logger.info(
            "Documents added to vector store",
            num_documents=len(documents),
            with_ids=bool(ids)
        )

    async def delete_by_source(self, source: DocumentSource) -> int:
        """
        Delete all documents from a specific source.

        Args:
            source: Document source to delete.

        Returns:
            Number of documents deleted.
        """
        if not self.pool:
            await self.initialize()

        async with self.pool.acquire() as conn:
            result = await conn.execute(
                f"""
                DELETE FROM {self.config.table_name}
                WHERE metadata->>'source' = $1
                """,
                source.value
            )

            deleted_count = int(result.split()[-1])
            logger.info(
                "Documents deleted by source",
                source=source.value,
                count=deleted_count
            )

            return deleted_count

    async def count_by_source(self) -> Dict[str, int]:
        """
        Get document count by source.

        Returns:
            Dictionary mapping source names to document counts.
        """
        if not self.pool:
            await self.initialize()

        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                f"""
                SELECT
                    metadata->>'source' as source,
                    COUNT(*) as count
                FROM {self.config.table_name}
                GROUP BY metadata->>'source'
                ORDER BY count DESC
                """
            )

            counts = {row["source"]: int(row["count"]) for row in rows if row["source"]}
            logger.debug("Document counts by source", counts=counts)

            return counts

    async def _embed_text(self, text: str) -> List[float]:
        """
        Generate embedding for a single text.

        Args:
            text: Text to embed.

        Returns:
            Embedding vector.
        """
        if not self.embedding_client:
            raise ValueError("OpenAI API key required for generating embeddings")

        response = await self.embedding_client.embeddings.create(
            model=self.config.embedding_model or "text-embedding-3-large",
            input=text
        )
        return response.data[0].embedding

    async def _embed_texts(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for multiple texts.

        Args:
            texts: Texts to embed.

        Returns:
            List of embedding vectors.
        """
        if not self.embedding_client:
            raise ValueError("OpenAI API key required for generating embeddings")

        # OpenAI supports batching up to 2048 embeddings
        batch_size = 2048
        all_embeddings = []

        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            response = await self.embedding_client.embeddings.create(
                model=self.config.embedding_model or "text-embedding-3-large",
                input=batch
            )
            embeddings = [item.embedding for item in response.data]
            all_embeddings.extend(embeddings)

        return all_embeddings

    @staticmethod
    def cosine_similarity(a: List[float], b: List[float]) -> float:
        """
        Calculate cosine similarity between two vectors.

        Args:
            a: First vector.
            b: Second vector.

        Returns:
            Cosine similarity score.
        """
        a_arr = np.array(a)
        b_arr = np.array(b)
        return float(np.dot(a_arr, b_arr) / (np.linalg.norm(a_arr) * np.linalg.norm(b_arr)))
