"""
DSPy Document Retriever Program for Cairo Coder.

This module implements the DocumentRetrieverProgram that fetches and ranks
relevant documents from the vector store based on processed queries.
"""

import asyncio
from typing import List, Optional, Tuple
from cairo_coder.core.config import VectorStoreConfig
import numpy as np

import openai
import psycopg2
from psycopg2 import sql

import dspy
from dspy.retrieve.pgvector_rm import PgVectorRM
from openai import AsyncOpenAI

from cairo_coder.core.types import Document, DocumentSource, ProcessedQuery
from cairo_coder.core.vector_store import VectorStore
import structlog

logger = structlog.get_logger()


class SourceFilteredPgVectorRM(PgVectorRM):
    """
    Extended PgVectorRM that supports filtering by document sources.
    """

    def __init__(self, sources: Optional[List[DocumentSource]] = None, **kwargs):
        """
        Initialize with optional source filtering.

        Args:
            sources: List of DocumentSource to filter by
            **kwargs: Arguments passed to parent PgVectorRM
        """
        super().__init__(**kwargs)
        self.sources = sources or []

    def forward(self, query: str, k: int = None):
        """Search with PgVector for k top passages for query using cosine similarity with source filtering

        Args:
            query  (str): The query to search for
            k (int): The number of top passages to retrieve. Defaults to the value set in the constructor.
        Returns:
            dspy.Prediction: an object containing the retrieved passages.
        """
        # Embed query
        query_embedding = self._get_embeddings(query)

        retrieved_docs = []

        fields = sql.SQL(",").join([sql.Identifier(f) for f in self.fields])

        # Build WHERE clause for source filtering
        where_clause = sql.SQL("")
        args = []

        # First arg - WHERE clause
        # Add source filtering
        if self.sources:
            source_values = [source.value for source in self.sources]
            where_clause = sql.SQL(" WHERE metadata->>'source' = ANY(%s::text[])")
            args.append(source_values)

        # Always add query embedding first (for ORDER BY)
        args.append(query_embedding)

        # Add similarity embedding if needed (for SELECT)
        if self.include_similarity:
            similarity_field = sql.SQL(",") + sql.SQL(
                "1 - ({embedding_field} <=> %s::vector) AS similarity",
            ).format(embedding_field=sql.Identifier(self.embedding_field))
            fields += similarity_field
            args.append(query_embedding)  # Second embedding for similarity calculation

        # Add k parameter last
        args.append(k if k else self.k)

        sql_query = sql.SQL(
            "select {fields} from {table}{where_clause} order by {embedding_field} <=> %s::vector limit %s",
        ).format(
            fields=fields,
            table=sql.Identifier(self.pg_table_name),
            where_clause=where_clause,
            embedding_field=sql.Identifier(self.embedding_field),
        )

        with self.conn as conn:
            with conn.cursor() as cur:
                cur.execute(sql_query, args)
                rows = cur.fetchall()
                columns = [descrip[0] for descrip in cur.description]
                for row in rows:
                    data = dict(zip(columns, row))
                    data["long_text"] = data[self.content_field]
                    retrieved_docs.append(dspy.Example(**data))
        # Return Prediction
        return retrieved_docs


class DocumentRetrieverProgram(dspy.Module):
    """
    DSPy module for retrieving and ranking relevant documents from vector store.

    This module implements a three-step retrieval process:
    1. Fetch documents from vector store using similarity search
    2. Rerank documents using embedding cosine similarity
    3. Attach metadata and filter by similarity threshold
    """

    def __init__(
        self,
        vector_store_config: VectorStoreConfig,
        max_source_count: int = 10,
        similarity_threshold: float = 0.4,
        embedding_model: str = "text-embedding-3-large",
    ):
        """
        Initialize the DocumentRetrieverProgram.

        Args:
            vector_store_config: VectorStoreConfig for document retrieval
            max_source_count: Maximum number of documents to retrieve
            similarity_threshold: Minimum similarity score for document inclusion
            embedding_model: OpenAI embedding model to use for reranking
        """
        super().__init__()
        self.vector_store_config = vector_store_config
        self.max_source_count = max_source_count
        self.similarity_threshold = similarity_threshold
        self.embedding_model = embedding_model

    async def forward(
        self, processed_query: ProcessedQuery, sources: Optional[List[DocumentSource]] = None
    ) -> List[Document]:
        """
        Execute the document retrieval process.

        Args:
            processed_query: ProcessedQuery object with search terms and metadata
            sources: Optional list of DocumentSource to filter by

        Returns:
            List of relevant Document objects, ranked by similarity
        """
        # Use sources from processed query if not provided
        if sources is None:
            sources = processed_query.resources

        # Step 1: Fetch documents from vector store
        documents = await self._fetch_documents(processed_query, sources)

        # TODO: No source found means no answer can be given!
        if not documents:
            return []

        # TODO: dead code elimination once confirmed
        # Reraking should not be required as the retriever is already ranking documents.
        # # Step 2: Rerank documents using embedding similarity
        # documents = await self._rerank_documents(processed_query.original, documents)

        return documents

    async def _fetch_documents(
        self, processed_query: ProcessedQuery, sources: List[DocumentSource]
    ) -> List[Document]:
        """
        Fetch documents from vector store using similarity search.

        Args:
            processed_query: ProcessedQuery with search terms
            sources: List of DocumentSource to search within

        Returns:
            List of Document objects from vector store
        """
        try:
            openai_client = openai.OpenAI()
            db_url = self.vector_store_config.dsn
            pg_table_name = self.vector_store_config.table_name
            retriever = SourceFilteredPgVectorRM(
                db_url=db_url,
                pg_table_name=pg_table_name,
                openai_client=openai_client,
                content_field="content",
                fields=["id", "content", "metadata"],
                k=self.max_source_count,
                sources=sources,
            )
            dspy.settings.configure(rm=retriever)

            # TODO improve with proper re-phrased text.
            search_queries = processed_query.search_queries
            if len(search_queries) == 0:
                search_queries = [processed_query.original]

            retrieved_examples: List[dspy.Example] = []
            for search_query in search_queries:
                retrieved_examples.extend(retriever(search_query))

            # Convert to Document objects and deduplicate using a set
            documents = set()
            for ex in retrieved_examples:
                doc = Document(
                    page_content=ex.content,
                    metadata=ex.metadata
                )
                documents.add(doc)

            logger.info(f"Retrieved {len(documents)} documents with titles: {[doc.metadata['title'] for doc in documents]}")
            return list(documents)

        except Exception as e:
            import traceback
            logger.error(f"Error fetching documents: {traceback.format_exc()}")
            raise e

    # TODO: dead code elimination – remove once confirmed
    async def _rerank_documents(self, query: str, documents: List[Document]) -> List[Document]:
        """
        Rerank documents by cosine similarity using embeddings.

        Args:
            query: Original query text
            documents: List of documents to rerank

        Returns:
            List of documents ranked by similarity
        """
        if not documents:
            return documents

        try:
            # Get query embedding
            query_embedding = await self._get_embedding(query)
            if not query_embedding:
                return documents

            # Get document embeddings
            doc_texts = [doc.page_content for doc in documents]
            doc_embeddings = await self._get_embeddings(doc_texts)

            if not doc_embeddings or len(doc_embeddings) != len(documents):
                return documents

            # Calculate similarities
            similarities = []
            for doc_embedding in doc_embeddings:
                if doc_embedding:
                    similarity = self._cosine_similarity(query_embedding, doc_embedding)
                    similarities.append(similarity)
                else:
                    similarities.append(0.0)

            # Create document-similarity pairs
            doc_sim_pairs = list(zip(documents, similarities))

            # Filter by similarity threshold
            filtered_pairs = [
                (doc, sim) for doc, sim in doc_sim_pairs if sim >= self.similarity_threshold
            ]

            # Sort by similarity (descending)
            filtered_pairs.sort(key=lambda x: x[1], reverse=True)

            # Return ranked documents
            return [doc for doc, _ in filtered_pairs]

        except Exception as e:
            import traceback
            logger.error(f"Error reranking documents: {traceback.format_exc()}")
            raise e
