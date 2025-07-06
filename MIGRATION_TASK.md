# Executive Summary: Migration Plan from LangChain to `ax-llm`

## 1. Introduction & Rationale

This document outlines a strategic plan to migrate the `cairo-coder` agent framework from its current LangChain-based implementation to `ax-llm`. The primary objective of this refactoring is to enhance the framework's maintainability, performance, and capabilities by leveraging the modern, declarative abstractions provided by `ax-llm`.

The current implementation, while functional, relies on a complex stack of imperative code, including large prompt strings, manual XML/string parsing, and multi-step pipeline orchestration. Migrating to `ax-llm` will allow us to replace this complexity with a more robust, efficient, and feature-rich foundation.

Our analysis confirms the key benefits hypothesized for this migration:

#### 1.1. Superior Abstractions for Prompts & Providers

`ax-llm` replaces verbose prompt templates and parsing logic with clean, strongly-typed, signature-based programs. This dramatically improves readability and maintainability.

**Before (LangChain in `cairoCoderPrompts.ts`):** A large, hard-to-maintain prompt string requiring manual XML parsing.

```ts
export const CAIROCODER_RETRIEVER_PROMPT = `
You will be given a conversation history and a follow-up question. Your primary task is to...
...
5.  **Output Format:** Your response MUST use the following XML format:
    <search_terms>
    <term>term1</term>
    </search_terms>
    <resources>
    <resource>resource_name1</resource>
    </resources>
...
`;
```

**After (ax-llm):** A single, declarative, and type-safe signature.

```typescript
import { AxGen } from '@ax-llm/ax';

// The new program definition
const retrieverProgram = new AxGen(
  `chat_history, query -> search_terms:string[], resources:string[]`,
);

// Execution is type-safe and parsing is handled automatically
const { search_terms, resources } = await retrieverProgram.forward(ai, {
  chat_history: '...',
  query: 'How do I use maps in a contract?',
});
```

Furthermore, `ax-llm` provides a unified interface for multiple LLM providers through `AxAI` and `AxMultiServiceRouter`, abstracting away provider-specific configurations and simplifying the logic currently in `config/settings.ts`.

#### 1.2. Built-in Prompt Optimization

`ax-llm` includes powerful prompt engineering tools like `AxMiPRO` and `AxBootstrapFewShot` out-of-the-box. This enables automated, data-driven optimization of our prompts to improve accuracy, reduce token usage, and enhance performance—a capability entirely absent from our current architecture. We can leverage our existing `DocTestSet` data as training and validation sets for these optimizers.

```typescript
// Example of using AxMiPRO for optimization
const optimizer = new AxMiPRO({
  ai,
  program: retrieverProgram,
  examples: testCases, // from our DocTestSet
});

const optimizedProgram = await optimizer.compile(metricFn);
```

#### 1.3. Simplified and More Reliable Testing

By enforcing structured, typed inputs and outputs, `ax-llm` simplifies testing. We can move from validating raw string outputs to asserting structured data. `ax-llm` also offers powerful features like `addAssert` and `addStreamingAssert`, allowing for real-time validation of the LLM's output during generation, leading to more resilient and predictable behavior.

```typescript
// Example of a streaming assertion
retrieverProgram.addStreamingAssert(
  'resources',
  (value: string) => {
    // an assertion to ensure that the resources are valid
    return value.split(',').every((r) => VALID_RESOURCES.includes(r.trim()));
  },
  'The resource provided is not valid.',
);
```

#### 1.4. Drastic Codebase Reduction and Simplification

The migration will allow us to delete entire files and significantly reduce complexity. The logic spread across `QueryProcessor`, `AnswerGenerator`, and the orchestration code in `RagPipeline` can be condensed into a few declarative `AxGen` or `AxAgent` programs. This leads to a smaller, more focused, and easier-to-understand codebase.

## 2. Proposed Architecture with `ax-llm`

The new architecture will be centered around `ax-llm`'s core concepts, replacing multiple layers of our current application.

- **LLM & Provider Layer:**

  - The `LLMConfig` type and manual provider setup in `config/settings.ts` will be replaced by `AxAI` and `AxMultiServiceRouter`, providing a single, unified interface for all LLM interactions.

- **Agent & Program Layer:**

  - The `AgentConfiguration` in `config/agents.ts` and prompt files in `config/prompts/` will be refactored into `ax-llm` programs and agents.
  - **`QueryProcessor` Program:** Replaces `QueryProcessor` class.
    - **Signature:** `chat_history, query -> search_terms:string[], resources:string[]`
  - **`AnswerGenerator` Program:** Replaces `AnswerGenerator` class.
    - **Signature:** `chat_history, query, context:string -> answer:string`
  - **`CairoCoderAgent`:** An `AxAgent` will be created to orchestrate these programs, replacing the `RagPipeline` and `AgentFactory`.

- **Data Layer (Vector Database):**
  - The `PostgresVectorStore` will be retained, as `ax-llm` does not have a native Postgres connector.
  - The `embeddings` generation will be migrated from a LangChain-specific implementation to the provider-agnostic `ai.embed()` method from `ax-llm`. This is the primary change needed in `PostgresVectorStore.ts` and `DocumentRetriever.ts`.
  - We will create a lightweight `CustomDBManager` inspired by `AxDBManager` to integrate our `PostgresVectorStore` with the `ax-llm` workflow.

## 3. Phased Migration Plan

This migration will be executed in four distinct phases to ensure a smooth transition.

#### Phase 1: Foundational Setup & Provider Abstraction

1.  **Dependency:** Add `@ax-llm/ax` to `package.json`.
2.  **Configuration:** Refactor `config/settings.ts` to initialize `AxAI` for our supported providers (OpenAI, Gemini, etc.) and configure a central `AxMultiServiceRouter`.
3.  **Types:** Update `types/index.ts`, removing `LLMConfig` and other LangChain-specific types in favor of `ax-llm` types.
4.  **Factory:** Update `agentFactory.ts` to accept the `AxAI` router instance instead of the old `LLMConfig`.

#### Phase 2: Refactoring the RAG Pipeline

1.  **Query Processor:**
    - Delete `core/pipeline/queryProcessor.ts`.
    - Replace `config/prompts/cairoCoderPrompts.ts` with a new file, e.g., `core/programs/retrievalProgram.ts`, defining the `AxGen` program for query processing.
2.  **Document Retriever:**
    - Refactor `db/postgresVectorStore.ts` and `core/pipeline/documentRetriever.ts` to use `ai.embed()` for generating embeddings, removing the `Embeddings` dependency.
    - Create a simple adapter function that takes the structured output from the new retrieval program and calls the `PostgresVectorStore`.
3.  **Answer Generator:**
    - Delete `core/pipeline/answerGenerator.ts`.
    - Create `core/programs/generationProgram.ts` defining the `AxGen` program for generating the final answer based on the query and retrieved context.
4.  **Pipeline Orchestration:**
    - Delete `core/pipeline/ragPipeline.ts` and `core/pipeline/mcpPipeline.ts`.
    - The orchestration logic will now reside within a simplified agent execution flow.

#### Phase 3: Refactoring Agents to `AxAgent`

1.  **Agent Definition:** Refactor `config/agents.ts` to define `AxAgent` instances. Each agent will be configured with its respective `AxGen` programs (e.g., for retrieval and generation).
2.  **Agent Factory:** Completely refactor `core/agentFactory.ts`. The new factory will select the appropriate `AxAgent` and execute it using `agent.forward(ai, { ... })`.

#### Phase 4: Advanced Features & Testing

1.  **Testing Framework:** Update `core/pipeline/docQualityTester.ts` to work with the new `ax-llm`-based agents. Integrate `addAssert` for more precise, programmatic validation of LLM outputs.
2.  **Prompt Optimization:** Create new scripts to leverage `AxMiPRO`, using the test cases from `DocTestSet` to automatically tune and improve the performance and accuracy of our core prompt programs.
3.  **Streaming:** Refactor the streaming implementation to use `ax-llm`'s native streaming (`stream: true`) and adapt the output to the format expected by the frontend.

## 4. Impact Analysis

- **Code Reduction:** We project the deletion of at least 5-7 files (`queryProcessor.ts`, `answerGenerator.ts`, `ragPipeline.ts`, `mcpPipeline.ts`, `cairoCoderPrompts.ts`, etc.) and a significant reduction in lines of code in many others (`agentFactory.ts`, `agents.ts`).
- **Maintainability:** The codebase will shift from a complex, imperative style to a declarative, signature-based model. This will make it vastly easier to understand, modify, and extend agent capabilities.
- **Dependencies:** The `langchain` dependency can be significantly pruned or completely removed, leading to a smaller dependency tree and faster build times.
- **Performance & Cost:** The ability to use `AxMiPRO` for prompt optimization is expected to yield more efficient prompts, resulting in lower token consumption and reduced operational costs.

## 5. Risks and Mitigation

- **Risk:** No native `ax-llm` support for our Postgres-based vector store.
  - **Mitigation:** This is the most significant technical risk, but it is manageable. Our `PostgresVectorStore` is a well-contained module. The migration plan focuses on creating a minimal adapter, not a full rewrite. We will keep the existing, battle-tested SQL for similarity search and only replace the embedding generation call with `ai.embed()`, which is a straightforward change.
- **Risk:** Team learning curve for `ax-llm`.
  - **Mitigation:** `ax-llm` concepts are highly intuitive for developers familiar with LLMs. The phased rollout plan is designed to allow the team to adopt the new framework gradually.
- **Risk:** Adapting the existing streaming data format.
  - **Mitigation:** `ax-llm` has robust support for streaming. We will need to implement a thin transformation layer to wrap the `ax-llm` stream output into the JSON structure (`{ type: '...', data: '...' }`) our frontend currently expects. This is a low-complexity task.
