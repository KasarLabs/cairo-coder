"""
DSPy Document Retriever Program for Cairo Coder.

This module implements the DocumentRetrieverProgram that fetches and ranks
relevant documents from the vector store based on processed queries.
"""

import asyncio
from typing import List, Optional, Tuple
import numpy as np

import dspy
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

    def __init__(self, vector_store: VectorStore, max_source_count: int = 10,
                 similarity_threshold: float = 0.4, embedding_model: str = "text-embedding-3-large"):
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

        # Initialize OpenAI client for embeddings (if available)
        self.embedding_client = None
        if hasattr(vector_store, 'embedding_client') and vector_store.embedding_client:
            self.embedding_client = vector_store.embedding_client

    async def forward(self, processed_query: ProcessedQuery, sources: Optional[List[DocumentSource]] = None) -> List[Document]:
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

        if not documents:
            return []

        # Step 2: Rerank documents using embedding similarity
        if self.embedding_client:
            documents = await self._rerank_documents(processed_query.original, documents)

        # Final filtering and limiting
        return documents[:self.max_source_count]

    async def _fetch_documents(self, processed_query: ProcessedQuery, sources: List[DocumentSource]) -> List[Document]:
        """
        Fetch documents from vector store using similarity search.

        Args:
            processed_query: ProcessedQuery with search terms
            sources: List of DocumentSource to search within

        Returns:
            List of Document objects from vector store
        """
        try:
            # Use the original query for vector similarity search
            query_text = processed_query.original

            # Search in vector store
            documents = await self.vector_store.similarity_search(
                query=query_text,
                k=self.max_source_count * 2,  # Fetch more for reranking
                sources=sources
            )

            return documents

        except Exception as e:
            # Log error and return empty list
            logger.error(f"Error fetching documents: {e}")
            return []

    async def _rerank_documents(self, query: str, documents: List[Document]) -> List[Document]:
        """
        Rerank documents by cosine similarity using embeddings.

        Args:
            query: Original query text
            documents: List of documents to rerank

        Returns:
            List of documents ranked by similarity
        """
        if not self.embedding_client or not documents:
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
                (doc, sim) for doc, sim in doc_sim_pairs
                if sim >= self.similarity_threshold
            ]

            # Sort by similarity (descending)
            filtered_pairs.sort(key=lambda x: x[1], reverse=True)

            # Return ranked documents
            return [doc for doc, _ in filtered_pairs]

        except Exception as e:
            print(f"Error reranking documents: {e}")
            return documents

    async def _get_embedding(self, text: str) -> List[float]:
        """
        Get embedding for a single text.

        Args:
            text: Text to embed

        Returns:
            List of embedding values
        """
        try:
            response = await self.embedding_client.embeddings.create(
                model=self.embedding_model,
                input=text
            )
            return response.data[0].embedding
        except Exception as e:
            print(f"Error getting embedding: {e}")
            return []

    async def _get_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Get embeddings for multiple texts.

        Args:
            texts: List of texts to embed

        Returns:
            List of embedding lists
        """
        try:
            # Process in batches to avoid rate limits
            batch_size = 100
            embeddings = []

            for i in range(0, len(texts), batch_size):
                batch = texts[i:i + batch_size]

                response = await self.embedding_client.embeddings.create(
                    model=self.embedding_model,
                    input=batch
                )

                batch_embeddings = [data.embedding for data in response.data]
                embeddings.extend(batch_embeddings)

            return embeddings

        except Exception as e:
            print(f"Error getting embeddings: {e}")
            return [[] for _ in texts]

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


def create_document_retriever(vector_store: VectorStore, max_source_count: int = 10,
                             similarity_threshold: float = 0.4) -> DocumentRetrieverProgram:
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
        similarity_threshold=similarity_threshold
    )
