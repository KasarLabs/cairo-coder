from collections.abc import Callable
from typing import Optional

import dspy

try:
    import psycopg2
    from pgvector.psycopg2 import register_vector
    from psycopg2 import sql
except ImportError as e:
    raise ImportError(
        "The 'pgvector' extra is required to use PgVectorRM. Install it with `pip install dspy-ai[pgvector]`. Also, try `pip install pgvector psycopg2`.",
    ) from e


class PgVectorRM(dspy.Retrieve):
    """
    Implements a retriever that (as the name suggests) uses pgvector to retrieve passages,
    using a raw SQL query and a postgresql connection managed by psycopg2.

    It needs to register the pgvector extension with the psycopg2 connection

    Returns a list of dspy.Example objects

    Args:
        db_url (str): A PostgreSQL database URL in psycopg2's DSN format
        pg_table_name (Optional[str]): name of the table containing passages
        embedding_func (Callable): A function to use for computing query embeddings. If not provided, uses dspy.settings.embedder.
        content_field (str = "text"): Field containing the passage text. Defaults to "text"
        k (Optional[int]): Default number of top passages to retrieve. Defaults to 20
        embedding_field (str = "embedding"): Field containing passage embeddings. Defaults to "embedding"
        fields (List[str] = ['text']): Fields to retrieve from the table. Defaults to "text"

    Examples:
        Below is a code snippet that shows how to use PgVector as the default retriever

        ```python
        import dspy

        # Configure embedder at startup
        embedder = dspy.Embedder("gemini/gemini-embedding-001", dimensions=3072)
        dspy.configure(embedder=embedder)

        llm = dspy.LM("gemini/gemini-flash-latest")
        dspy.configure(lm=llm)

        # DATABASE_URL should be in the format:
        db_url = postgresql://user:password@host/database

        # embedding_func will default to dspy.settings.embedder
        retriever_model = PgVectorRM(db_url, "paragraphs", fields=["text", "document_id"], k=20)
        dspy.configure(rm=retriever_model)
        ```

        Below is a code snippet that shows how to use PgVector with a custom embedding function
        ```python
        def my_embedder(text: str) -> list[float]:
            # Your custom embedding logic
            return embeddings

        self.retrieve = PgVectorRM(db_url, "paragraphs", embedding_func=my_embedder, fields=["text", "document_id"], k=20)
        ```
    """

    def __init__(
        self,
        db_url: str,
        pg_table_name: str,
        embedding_func: Optional[Callable] = None,
        k: int = 20,
        embedding_field: str = "embedding",
        fields: Optional[list[str]] = None,
        content_field: str = "text",
        include_similarity: bool = False,
    ):
        """
        k = 20 is the number of paragraphs to retrieve
        """
        # Use provided embedding_func or fall back to dspy.settings.embedder
        if embedding_func is None:
            if dspy.settings.embedder is None:
                raise ValueError(
                    "No embedding_func provided and no embedder configured in dspy.settings. "
                    "Either pass embedding_func or configure with: dspy.configure(embedder=...)"
                )
            self.embedding_func = dspy.settings.embedder
        else:
            self.embedding_func = embedding_func

        self.conn = psycopg2.connect(db_url)
        register_vector(self.conn)
        self.pg_table_name = pg_table_name
        self.fields = fields or ["text"]
        self.content_field = content_field
        self.embedding_field = embedding_field
        self.include_similarity = include_similarity

        super().__init__(k=k)

    def forward(self, query: str, k: int = None):
        """Search with PgVector for k top passages for query using cosine similarity

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
        if self.include_similarity:
            similarity_field = sql.SQL(",") + sql.SQL(
                "1 - ({embedding_field} <=> %s::vector) AS similarity",
            ).format(embedding_field=sql.Identifier(self.embedding_field))
            fields += similarity_field
            args = (query_embedding, query_embedding, k if k else self.k)
        else:
            args = (query_embedding, k if k else self.k)

        sql_query = sql.SQL(
            "select {fields} from {table} order by {embedding_field} <=> %s::vector limit %s",
        ).format(
            fields=fields,
            table=sql.Identifier(self.pg_table_name),
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

    def _get_embeddings(self, query: str) -> list[float]:
        """Get embeddings for a query using the configured embedding function."""
        return self.embedding_func(query)
