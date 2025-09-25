# Agents Working Protocol

This file documents conventions and checklists for making changes that affect the Cairo Coder agent system. Its scope applies to the entire repository.

## Adding a Documentation Source

When adding a new documentation source (e.g., a new docs site or SDK) make sure to complete all of the following steps:

1. TypeScript ingestion (packages/ingester)

   - Create an ingester class extending `BaseIngester` or `MarkdownIngester` under `packages/ingester/src/ingesters/`.
   - Register it in `packages/ingester/src/IngesterFactory.ts`.
   - Ensure chunks carry correct metadata: `uniqueId`, `contentHash`, `sourceLink`, and `source`.
   - Run `pnpm generate-embeddings` (or `generate-embeddings:yes`) to populate/update the vector store.

2. Agents (TS)

   - Add the new enum value to `packages/agents/src/types/index.ts` under `DocumentSource`.
   - Verify Postgres vector store accepts the new `source` and filters on it (`packages/agents/src/db/postgresVectorStore.ts`).

3. Retrieval Pipeline (Python)

   - Add the new enum value to `python/src/cairo_coder/core/types.py` under `DocumentSource`.
   - Ensure filtering by `metadata->>'source'` works with the new value in `python/src/cairo_coder/dspy/document_retriever.py`.
   - Update the query processor resource descriptions in `python/src/cairo_coder/dspy/query_processor.py` (`RESOURCE_DESCRIPTIONS`).

4. Optimized Program Files (Python) — required

   - If the query processor or retrieval prompts are optimized via compiled DSPy programs, you must also update the optimized program artifacts so they reflect the new resource.
   - Specifically, review and update: `python/optimizers/results/optimized_retrieval_program.json` (and any other relevant optimized files, e.g., `optimized_rag.json`, `optimized_mcp_program.json`).
   - Regenerate these artifacts if your change affects prompt instructions, available resource lists, or selection logic.

5. API and Docs

   - Ensure the new source appears where appropriate (e.g., `/v1/agents` output and documentation tables):
     - `API_DOCUMENTATION.md`
     - `packages/ingester/README.md`
     - Any user-facing lists of supported sources

6. Quick Sanity Check
   - Ingest a small subset (or run a dry-run) and verify: rows exist in the vector DB with the new `source`, links open correctly, and retrieval can filter by the new source.

## Notes

- Keep changes minimal and consistent with existing style.
- Do not commit credentials or large artifacts; optimized program JSONs are small and versioned.
- If you add new files that define agent behavior, document them here.
