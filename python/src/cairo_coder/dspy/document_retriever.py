"""
DSPy Document Retriever Program for Cairo Coder.

This module implements the DocumentRetrieverProgram that fetches and ranks
relevant documents from the vector store based on processed queries.
"""

import asyncio
from typing import List, Optional, Tuple
import numpy as np

import openai
import psycopg2

import dspy
from dspy.retrieve.pgvector_rm import PgVectorRM
from openai import AsyncOpenAI

from cairo_coder.core.types import Document, DocumentSource, ProcessedQuery
from cairo_coder.core.vector_store import VectorStore
import structlog

logger = structlog.get_logger()


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
        vector_store: VectorStore,
        max_source_count: int = 10,
        similarity_threshold: float = 0.4,
        embedding_model: str = "text-embedding-3-large",
    ):
        """
        Initialize the DocumentRetrieverProgram.

        Args:
            vector_store: VectorStore instance for document retrieval
            max_source_count: Maximum number of documents to retrieve
            similarity_threshold: Minimum similarity score for document inclusion
            embedding_model: OpenAI embedding model to use for reranking
        """
        super().__init__()
        self.vector_store = vector_store
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
            db_url = self.vector_store.config.dsn
            pg_table_name = self.vector_store.config.table_name
            retriever = PgVectorRM(
                db_url=db_url,
                pg_table_name=pg_table_name,
                openai_client=openai_client,
                content_field="content",
                fields=["id", "content", "metadata"],
                k=self.max_source_count,
            )
            dspy.settings.configure(rm=retriever)

            # TODO improve with proper re-phrased text.
            search_terms = ", ".join([st for st in processed_query.transformed])
            retrieval_query = f"{processed_query.original}, tags: {search_terms}"
            retrieved_examples: List[dspy.Example] = retriever(retrieval_query)

            # Convert to Document objects
            documents = []
            for ex in retrieved_examples:
                doc = Document(
                    page_content=ex.content,
                    metadata=ex.metadata
                )
                documents.append(doc)

            return documents

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

    # TODO: dead code elimination – remove once confirmed
    async def _get_embedding(self, text: str) -> List[float]:
        """
        Get embedding for a single text.

        Args:
            text: Text to embed

        Returns:
            List of embedding values
        """
        embeddings = self.vector_store.embedder([text])
        # DSPy Embedder returns a 2D array/list, we need the first row
        return embeddings[0] if isinstance(embeddings, list) else embeddings[0].tolist()

    # TODO: dead code elimination – remove once confirmed
    async def _get_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Get embeddings for multiple texts.

        Args:
            texts: List of texts to embed

        Returns:
            List of embedding lists
        """
        # Process in batches to avoid rate limits
        batch_size = 100
        all_embeddings = []

        for i in range(0, len(texts), batch_size):
            batch = texts[i : i + batch_size]

            # DSPy Embedder returns embeddings as 2D array/list
            embeddings = self.vector_store.embedder(batch)

            # Convert to list of lists if numpy array
            if hasattr(embeddings, "tolist"):
                embeddings = embeddings.tolist()

            all_embeddings.extend(embeddings)

        return all_embeddings

    # TODO: dead code elimination – remove once confirmed
    def _cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """
        Calculate cosine similarity between two vectors.

        Args:
            vec1: First vector
            vec2: Second vector

        Returns:
            Cosine similarity score (0-1)
        """
        if not vec1 or not vec2:
            return 0.0

        try:
            # Convert to numpy arrays
            a = np.array(vec1)
            b = np.array(vec2)

            # TODO: This is doing dot product, not cosine similarity.
            # Is this intended?
            # Calculate cosine similarity
            dot_product = np.dot(a, b)
            norm_a = np.linalg.norm(a)
            norm_b = np.linalg.norm(b)

            if norm_a == 0 or norm_b == 0:
                return 0.0

            return dot_product / (norm_a * norm_b)

        except Exception as e:
            print(f"Error calculating cosine similarity: {e}")
            return 0.0


def create_document_retriever(
    vector_store: VectorStore, max_source_count: int = 10, similarity_threshold: float = 0.4
) -> DocumentRetrieverProgram:
    """
    Factory function to create a DocumentRetrieverProgram instance.

    Args:
        vector_store: VectorStore instance for document retrieval
        max_source_count: Maximum number of documents to retrieve
        similarity_threshold: Minimum similarity score for document inclusion

    Returns:
        Configured DocumentRetrieverProgram instance
    """
    return DocumentRetrieverProgram(
        vector_store=vector_store,
        max_source_count=max_source_count,
        similarity_threshold=similarity_threshold,
    )
