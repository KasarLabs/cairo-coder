"""
DSPy Document Retriever Program for Cairo Coder.

This module implements the DocumentRetrieverProgram that fetches and ranks
relevant documents from the vector store based on processed queries.
"""


import asyncpg
import os
import structlog
from langsmith import traceable
from psycopg2 import sql

import dspy
from cairo_coder.core.config import VectorStoreConfig
from cairo_coder.core.constants import SIMILARITY_THRESHOLD
from cairo_coder.core.types import Document, DocumentSource, ProcessedQuery
from cairo_coder.dspy.pgvector_rm import PgVectorRM
from cairo_coder.dspy.templates import (
    CONTRACT_TEMPLATE,
    CONTRACT_TEMPLATE_TITLE,
    TEST_TEMPLATE,
    TEST_TEMPLATE_TITLE,
)

logger = structlog.get_logger(__name__)





class SourceFilteredPgVectorRM(PgVectorRM):
    """
    Extended PgVectorRM that supports filtering by document sources.
    """

    def __init__(self, **kwargs):
        """
        Initialize with optional source filtering.

        Args:
            sources: List of DocumentSource to filter by
            **kwargs: Arguments passed to parent PgVectorRM (e.g., db_url, pg_table_name, etc.)
        """
        logger.info("Initializing instance of SourceFilteredPgVectorRM with sources")
        super().__init__(**kwargs)
        self.pool = None  # Lazy-init async pool
        self.db_url = kwargs.get("db_url")

    async def _ensure_pool(self):
        """Lazily create asyncpg pool if not initialized."""
        if self.pool is None:
            # Assuming self.db_url exists from parent init; adjust if needed
            self.pool = await asyncpg.create_pool(
                dsn=self.db_url,  # Or kwargs['db_url'] if passed
                min_size=1,
                max_size=10,  # Tune based on load
                timeout=30,
            )

    @traceable(name="AsyncDocumentRetriever", run_type="retriever")
    async def aforward(self, query: str, k: int | None = None, sources: list[DocumentSource] | None = None) -> list[dspy.Example]:
        """Async search with PgVector for k top passages using cosine similarity with source filtering.

        Args:
            query (str): The query to search for.
            k (int): The number of top passages to retrieve. Defaults to the value set in the constructor.

        Returns:
            list[dspy.Example]: List of retrieved passages as DSPy Examples.
        """
        # Select connection strategy via env var.
        # If OPTIMIZER_RUN is truthy, use per-call connections;
        # otherwise use a (loop-local) pool.
        per_call = os.getenv("OPTIMIZER_RUN", "").lower() in {"1", "true", "yes", "on"}

        # Embed query (assuming _get_embeddings is sync; make async if needed)
        query_embedding_raw = self._get_embeddings(query)

        if hasattr(query_embedding_raw, "tolist"):
            # numpy array
            query_embedding_list = query_embedding_raw.tolist()
        else:
            # already a list or other format
            query_embedding_list = query_embedding_raw if isinstance(query_embedding_raw, list) else list(query_embedding_raw)

        # Convert to PGVector compatible string '[0.1,2.2,...]'
        query_embedding = '[' + ','.join(str(x) for x in query_embedding_list) + ']'

        retrieved_docs = []

        # Build fields string (plain string for asyncpg)
        fields = ", ".join(self.fields)

        where_conditions = []
        params = []

        # Add source filtering
        if sources:
            source_values = [source.value for source in sources]
            where_conditions.append(f"metadata->>'source' = ANY(${len(params) + 1}::text[])")
            params.append(source_values)

        # Add similarity threshold condition
        # Note: PostgreSQL cosine distance is 1 - cosine_similarity, so we use < for threshold
        similarity_threshold = getattr(self, 'similarity_threshold', 0.35)  # Default threshold
        where_conditions.append(f"({self.embedding_field} <=> ${len(params) + 1}::vector) < ${len(params) + 2}")
        params.append(query_embedding)  # Embedding for similarity calculation
        params.append(1 - similarity_threshold)  # Convert similarity to distance

        # Build complete WHERE clause
        where_clause = ""
        if where_conditions:
            where_clause = " WHERE " + " AND ".join(where_conditions)

        # Add similarity if included
        if self.include_similarity:
            sim_param_idx = len(params) + 1
            fields += f", 1 - ({self.embedding_field} <=> ${sim_param_idx}::vector) AS similarity"
            params.append(query_embedding)

        # Order param
        order_param_idx = len(params) + 1
        params.append(query_embedding)

        # Limit param
        limit_param_idx = len(params) + 1
        params.append(k if k else self.k)

        # Build SQL query as plain string for asyncpg
        sql_query = f"SELECT {fields} FROM {self.pg_table_name}{where_clause} ORDER BY {self.embedding_field} <=> ${order_param_idx}::vector LIMIT ${limit_param_idx}"

        if per_call:
            conn = await asyncpg.connect(dsn=self.db_url)
            try:
                rows = await conn.fetch(sql_query, *params)
            finally:
                await conn.close()
        else:
            await self._ensure_pool()
            async with self.pool.acquire() as conn:
                rows = await conn.fetch(sql_query, *params)

        for row in rows:
            # Convert asyncpg Record to dict using column names
            columns = list(row.keys())
            data = dict(zip(columns, row.values(), strict=False))
            data["long_text"] = data[self.content_field]

            # Deserialize JSON metadata if it exists
            if "metadata" in data and isinstance(data["metadata"], str):
                try:
                    import json
                    data["metadata"] = json.loads(data["metadata"])
                except (json.JSONDecodeError, TypeError):
                    # Keep original value if JSON parsing fails
                    pass

            retrieved_docs.append(dspy.Example(**data))

        return retrieved_docs

    @traceable(name="DocumentRetriever", run_type="retriever")
    def forward(self, query: str, k: int | None = None, sources: list[DocumentSource] | None = None) -> list[dspy.Example]:
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

        # Build WHERE clause for source filtering and similarity threshold
        where_conditions = []
        args = []

        # Add source filtering
        if sources:
            source_values = [source.value for source in sources]
            where_conditions.append(sql.SQL("metadata->>'source' = ANY(%s::text[])"))
            args.append(source_values)

        # Add similarity threshold condition
        # Note: PostgreSQL cosine distance is 1 - cosine_similarity, so we use < for threshold
        similarity_threshold = getattr(self, 'similarity_threshold', 0.35)  # Default threshold
        where_conditions.append(sql.SQL("({embedding_field} <=> %s::vector) < %s").format(
            embedding_field=sql.Identifier(self.embedding_field)
        ))
        args.append(query_embedding)  # Embedding for similarity calculation
        args.append(1 - similarity_threshold)  # Convert similarity to distance

        # Build complete WHERE clause
        where_clause = sql.SQL("")
        if where_conditions:
            where_clause = sql.SQL(" WHERE ") + sql.SQL(" AND ").join(where_conditions)

        # Always add query embedding for ORDER BY
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

        with self.conn as conn, conn.cursor() as cur:
            cur.execute(sql_query, args)
            rows = cur.fetchall()
            columns = [descrip[0] for descrip in cur.description]
            for row in rows:
                data = dict(zip(columns, row, strict=False))
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
        vector_db: SourceFilteredPgVectorRM | None = None,
        max_source_count: int = 5,
        similarity_threshold: float = SIMILARITY_THRESHOLD,
    ):
        """
        Initialize the DocumentRetrieverProgram.

        Args:
            vector_store_config: VectorStoreConfig for document retrieval
            vector_db: Optional pre-initialized vector database instance
            max_source_count: Maximum number of documents to retrieve
            similarity_threshold: Minimum similarity score for document inclusion
        """
        super().__init__()

        self.vector_store_config = vector_store_config
        if vector_db is None:
                db_url = self.vector_store_config.dsn
                pg_table_name = self.vector_store_config.table_name
                self.vector_db = SourceFilteredPgVectorRM(
                    db_url=db_url,
                    pg_table_name=pg_table_name,
                    content_field="content",
                    fields=["id", "content", "metadata"],
                    k=max_source_count,
                    include_similarity=True,
                )
        else:
            self.vector_db = vector_db
        self.max_source_count = max_source_count
        self.similarity_threshold = similarity_threshold

    async def aforward(
        self, processed_query: ProcessedQuery, sources: list[DocumentSource] | None = None
    ) -> dspy.Prediction:
        """
        Execute the document retrieval process asynchronously.

        Args:
            processed_query: ProcessedQuery object with search terms and metadata
            sources: Optional list of DocumentSource to filter by

        Returns:
            dspy.Prediction containing list of relevant Document objects, ranked by similarity
        """
        # Use sources from processed query if not provided
        if sources is None:
            sources = processed_query.resources

        # Step 1: Fetch documents from vector store
        documents = await self._afetch_documents(processed_query, sources)

        if not documents:
            empty_prediction = dspy.Prediction(documents=[])
            empty_prediction.set_lm_usage({})
            return empty_prediction

        # Step 2: Enrich context with appropriate templates based on query type.
        enhanced_documents = self._enhance_context(processed_query, documents)
        prediction = dspy.Prediction(documents=enhanced_documents)
        prediction.set_lm_usage({})
        return prediction

    def forward(
        self, processed_query: ProcessedQuery, sources: list[DocumentSource] | None = None
    ) -> list[Document]:
        """Execute the document retrieval process.

        Args:
            processed_query: ProcessedQuery object with search terms and metadata
            sources: Optional list of DocumentSource to filter by

        Returns:
            List of relevant Document objects, ranked by similarity
        """
        try:
            search_queries = processed_query.search_queries
            if not search_queries or len(search_queries) == 0:
                search_queries = [processed_query.original]


            db_url = self.vector_store_config.dsn
            pg_table_name = self.vector_store_config.table_name
            sync_retriever = SourceFilteredPgVectorRM(
                db_url=db_url,
                pg_table_name=pg_table_name,
                content_field="content",
                fields=["id", "content", "metadata"],
                k=self.max_source_count,
            )

            retrieved_examples: list[dspy.Example] = []
            for search_query in search_queries:
                examples = sync_retriever.forward(query=search_query, sources=sources, k=self.max_source_count)
                retrieved_examples.extend(examples)

            # Convert to Document objects and deduplicate using a set
            documents = set()
            for ex in retrieved_examples:
                doc = Document(page_content=ex.content, metadata=ex.metadata)
                try:
                    documents.add(doc)
                except Exception as e:
                    logger.error(f"Error adding document: {e}. Type of fields: {[type(field) for field in ex]}")

            return list(documents)
        except Exception as e:
            import traceback

            logger.error(f"Error fetching documents: {traceback.format_exc()}")
            raise e

    async def _afetch_documents(
        self, processed_query: ProcessedQuery, sources: list[DocumentSource]
    ) -> list[Document]:
        """
        Fetch documents from vector store using similarity search asynchronously.

        Args:
            processed_query: ProcessedQuery with search terms
            sources: List of DocumentSource to search within

        Returns:
            List of Document objects from vector store
        """
        try:

            search_queries = processed_query.search_queries
            if not search_queries or len(search_queries) == 0:
                search_queries = [processed_query.original]


            retrieved_examples: list[dspy.Example] = []
            for search_query in search_queries:
                # Use async version of retriever
                examples = await self.vector_db.aforward(query=search_query, sources=sources)
                retrieved_examples.extend(examples)

            # Convert to Document objects and deduplicate using a set
            documents = set()
            for ex in retrieved_examples:
                doc = Document(page_content=ex.content, metadata=ex.metadata)
                try:
                    documents.add(doc)
                except Exception as e:
                    logger.error(f"Error adding document: {e}. Type of fields: {[type(field) for field in ex]}")

            return list(documents)

        except Exception as e:
            import traceback

            logger.error(f"Error fetching documents: {traceback.format_exc()}")
            raise e

    def _enhance_context(self, processed_query: ProcessedQuery, context: list[Document]) -> list[Document]:
        """
        Enhance context with appropriate templates based on query type.

        Args:
            query: User's query
            context: Retrieved documentation context

        Returns:
            Enhanced context with relevant templates
        """
        query_lower = processed_query.original.lower()

        # Add contract template for contract-related queries
        if any(
            keyword in query_lower for keyword in ["contract", "storage", "external", "interface"]
        ) or processed_query.is_contract_related:
            context.append(
                Document(
                    page_content=CONTRACT_TEMPLATE,
                    metadata={
                        "title": CONTRACT_TEMPLATE_TITLE,
                        "source": DocumentSource.CAIRO_BOOK,
                        "sourceLink": "https://www.starknet.io/cairo-book/ch103-06-01-deploying-and-interacting-with-a-voting-contract.html",
                    },
                )
            )

        # Add test template for test-related queries
        if any(keyword in query_lower for keyword in ["test", "testing", "assert", "mock"]) or processed_query.is_test_related:
            context.append(
                Document(
                    page_content=TEST_TEMPLATE,
                    metadata={
                        "title": TEST_TEMPLATE_TITLE,
                        "source": DocumentSource.CAIRO_BOOK,
                        "sourceLink": "https://www.starknet.io/cairo-book/ch104-02-testing-smart-contracts.html",
                    },
                )
            )
        return context

    def get_lm_usage(self) -> dict[str, int]:
        """
        Get the total number of tokens used by the LLM.
        Note: Document retrieval doesn't use LLM tokens directly, but embedding tokens might be tracked.
        """
        # Document retrieval doesn't use LLM tokens, but we return empty dict for consistency
        return {}


def create_document_retriever(
    vector_store_config: VectorStoreConfig,
    vector_db: SourceFilteredPgVectorRM | None = None,
    max_source_count: int = 5,
    similarity_threshold: float = SIMILARITY_THRESHOLD,
) -> DocumentRetrieverProgram:
    """
    Factory function to create a DocumentRetrieverProgram instance.

    Args:
        vector_store_config: VectorStoreConfig for document retrieval
        vector_db: Optional pre-initialized vector database instance
        max_source_count: Maximum number of documents to retrieve
        similarity_threshold: Minimum similarity score for document inclusion

    Returns:
        Configured DocumentRetrieverProgram instance
    """
    return DocumentRetrieverProgram(
        vector_store_config=vector_store_config,
        vector_db=vector_db,
        max_source_count=max_source_count,
        similarity_threshold=similarity_threshold,
    )
