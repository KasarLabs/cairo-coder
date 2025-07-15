# Requirements Document

## Introduction

This document outlines the requirements for porting the Cairo Coder agents package from TypeScript to Python while maintaining compatibility with the existing backend and ingester components. The agents package implements a Retrieval-Augmented Generation (RAG) system specifically designed for Cairo programming language assistance, featuring multi-step AI workflows for query processing, document retrieval, and answer generation.

## Requirements

### Requirement 1: Microservice Communication Interface

**User Story:** As a backend developer, I want the Python agents to run as a separate microservice that communicates with the TypeScript backend, so that I can leverage Python's AI ecosystem while maintaining the existing backend architecture.

#### Acceptance Criteria

1. WHEN the backend needs agent processing THEN it SHALL communicate with the Python microservice via HTTP/WebSocket API
2. WHEN the Python service processes a request THEN it SHALL stream responses back to the TypeScript backend in real-time
3. WHEN the agent processes a request THEN it SHALL send events with the same structure: `{'type': 'sources', 'data': documents}` and `{'type': 'response', 'data': content}`
4. WHEN the agent completes processing THEN it SHALL send an 'end' event
5. WHEN an error occurs THEN the agent SHALL send an 'error' event with error details
6. WHEN the TypeScript backend receives events THEN it SHALL convert them to EventEmitter events for backward compatibility

### Requirement 2: RAG Pipeline Implementation

**User Story:** As a system architect, I want the Python implementation to maintain the same RAG pipeline structure, so that the system behavior remains consistent.

#### Acceptance Criteria

1. WHEN a query is received THEN the system SHALL execute a three-stage pipeline: Query Processing → Document Retrieval → Answer Generation
2. WHEN processing a query THEN the system SHALL use the QueryProcessorProgram to transform the original query into search terms and identify relevant resources
3. WHEN retrieving documents THEN the system SHALL use the DocumentRetrieverProgram to fetch, rerank, and filter documents based on similarity thresholds
4. WHEN generating responses THEN the system SHALL use context from retrieved documents to generate Cairo-specific code solutions
5. WHEN in MCP mode THEN the system SHALL return raw document content instead of generated responses

### Requirement 3: Agent Configuration System

**User Story:** As a system administrator, I want to configure different agents with specific capabilities, so that I can provide specialized assistance for different use cases.

#### Acceptance Criteria

1. WHEN an agent is requested by ID THEN the system SHALL load the corresponding configuration including sources, templates, and parameters
2. WHEN no agent ID is provided THEN the system SHALL use the default 'cairo-coder' agent configuration
3. WHEN configuring an agent THEN the system SHALL support specifying document sources (cairo_book, starknet_docs, etc.), similarity thresholds, and maximum source counts
4. WHEN using agent templates THEN the system SHALL support contract and test templates for context enhancement
5. WHEN multiple agents are defined THEN the system SHALL support agent-specific retrieval and generation programs

### Requirement 4: Vector Store Integration

**User Story:** As a developer, I want the Python agents to integrate with the existing PostgreSQL vector store, so that document retrieval remains consistent.

#### Acceptance Criteria

1. WHEN performing similarity search THEN the system SHALL query the PostgreSQL vector store using the same table structure and indices
2. WHEN filtering by document sources THEN the system SHALL support filtering by DocumentSource enum values
3. WHEN computing embeddings THEN the system SHALL use the same embedding model (OpenAI text-embedding-3-large) for consistency
4. WHEN reranking documents THEN the system SHALL compute cosine similarity and filter by configurable thresholds
5. WHEN handling database errors THEN the system SHALL provide appropriate error handling and logging

### Requirement 5: DSPy Framework Integration

**User Story:** As an AI developer, I want the Python implementation to use the DSPy framework for structured AI programming, so that I can build modular and optimizable AI components instead of managing brittle prompt strings.

#### Acceptance Criteria

1. WHEN implementing AI components THEN the system SHALL use DSPy modules (Predict, ChainOfThought, ProgramOfThought) with structured signatures
2. WHEN defining signatures THEN the system SHALL use `dspy.Signature` classes with `InputField` and `OutputField` specifications:
   ```python
   class QueryTransformation(dspy.Signature):
       """Transform a user query into search terms and identify relevant documentation sources."""
       chat_history = dspy.InputField(desc="Previous conversation context")
       query = dspy.InputField(desc="User's Cairo programming question")
       search_terms = dspy.OutputField(desc="List of search terms for retrieval")
       resources = dspy.OutputField(desc="List of relevant documentation sources")
   ```
3. WHEN composing AI workflows THEN the system SHALL use `dspy.Module` base class and chain DSPy modules:
   ```python
   class RagPipeline(dspy.Module):
       def __init__(self, config):
           super().__init__()
           self.query_processor = dspy.ChainOfThought(QueryTransformation)
           self.document_retriever = DocumentRetriever(config)
           self.answer_generator = dspy.ChainOfThought(AnswerGeneration)
       
       def forward(self, query, history):
           # Chain modules together
           processed = self.query_processor(query=query, chat_history=history)
           docs = self.document_retriever(processed_query=processed, sources=processed.resources)
           answer = self.answer_generator(query=query, context=docs, chat_history=history)
           return answer
   ```
4. WHEN optimizing performance THEN the system SHALL support DSPy teleprompters (optimizers):
   ```python
   # Use MIPROv2 for automatic prompt optimization
   optimizer = dspy.MIPROv2(metric=cairo_accuracy_metric, auto="medium")
   optimized_pipeline = optimizer.compile(
       program=rag_pipeline,
       trainset=cairo_examples,
       requires_permission_to_run=False
   )
   
   # Or use BootstrapFewShot for simpler optimization
   optimizer = dspy.BootstrapFewShot(metric=cairo_accuracy_metric, max_bootstrapped_demos=4)
   optimized_pipeline = optimizer.compile(rag_pipeline, trainset=cairo_examples)
   ```
5. WHEN saving/loading programs THEN the system SHALL use DSPy's serialization:
   ```python
   # Save optimized program with learned prompts and demonstrations
   optimized_pipeline.save("optimized_cairo_rag.json")
   
   # Load for inference
   pipeline = dspy.load("optimized_cairo_rag.json")
   ```

### Requirement 6: Ax-to-DSPy Program Mapping

**User Story:** As a system architect, I want each Ax Program from the TypeScript implementation to map 1-to-1 to a DSPy module, so that the AI workflow logic remains equivalent between implementations.

#### Acceptance Criteria

1. WHEN implementing QueryProcessorProgram THEN it SHALL map to a DSPy module using ChainOfThought:
   ```python
   class QueryProcessor(dspy.Module):
       def __init__(self, retrieval_program):
           super().__init__()
           self.retrieval_program = retrieval_program
       
       def forward(self, chat_history: str, query: str) -> ProcessedQuery:
           # Use the retrieval program (mapped from retrieval.program.ts)
           result = self.retrieval_program(chat_history=chat_history, query=query)
           
           # Build ProcessedQuery matching TypeScript structure
           return ProcessedQuery(
               original=query,
               transformed=result.search_terms,
               is_contract_related=self._check_contract_related(query),
               is_test_related=self._check_test_related(query),
               resources=self._validate_resources(result.resources)
           )
   ```

2. WHEN implementing DocumentRetrieverProgram THEN it SHALL map to a DSPy module maintaining the three-step process:
   ```python
   class DocumentRetriever(dspy.Module):
       def __init__(self, config: RagSearchConfig):
           super().__init__()
           self.config = config
           self.vector_store = config.vector_store
           self.embedder = dspy.Embedder(model="text-embedding-3-large")
       
       async def forward(self, processed_query: ProcessedQuery, sources: List[DocumentSource]):
           # Step 1: Fetch documents (maps to fetchDocuments)
           docs = await self.vector_store.similarity_search(
               query=processed_query.original,
               k=self.config.max_source_count,
               sources=sources
           )
           
           # Step 2: Rerank documents (maps to rerankDocuments)
           query_embedding = await self.embedder.embed([processed_query.original])
           ranked_docs = self._rerank_by_similarity(docs, query_embedding[0])
           
           # Step 3: Attach sources (maps to attachSources)
           return self._attach_metadata(ranked_docs)
   ```

3. WHEN implementing GenerationProgram THEN it SHALL use DSPy's ChainOfThought with reasoning:
   ```python
   class CairoGeneration(dspy.Signature):
       """Generate Cairo smart contract code based on context and query."""
       chat_history = dspy.InputField(desc="Previous conversation context")
       query = dspy.InputField(desc="User's Cairo programming question")
       context = dspy.InputField(desc="Retrieved documentation and examples")
       answer = dspy.OutputField(desc="Cairo code solution with explanation")
   
   # Maps to generation.program.ts
   generation_program = dspy.ChainOfThought(
       CairoGeneration,
       rationale_field=dspy.OutputField(
           prefix="Reasoning: Let me analyze the Cairo requirements step by step."
       )
   )
   ```

4. WHEN implementing specialized Scarb programs THEN they SHALL use domain-specific signatures:
   ```python
   class ScarbRetrieval(dspy.Signature):
       """Extract search terms for Scarb build tool queries."""
       chat_history = dspy.InputField(desc="optional", default="")
       query = dspy.InputField()
       search_terms = dspy.OutputField(desc="Scarb-specific search terms")
       resources = dspy.OutputField(desc="Always includes 'scarb_docs'")
   
   class ScarbGeneration(dspy.Signature):
       """Generate Scarb configuration and command guidance."""
       chat_history = dspy.InputField()
       query = dspy.InputField()
       context = dspy.InputField(desc="Scarb documentation context")
       answer = dspy.OutputField(desc="Scarb commands, TOML configs, or troubleshooting")
   ```

5. WHEN loading optimized configurations THEN the system SHALL support JSON demos:
   ```python
   # Load TypeScript-generated optimization data
   if os.path.exists("demos/generation_demos.json"):
       with open("demos/generation_demos.json") as f:
           demos = json.load(f)
           generation_program.demos = [dspy.Example(**demo) for demo in demos]
   ```

### Requirement 7: LLM Provider Integration

**User Story:** As a system integrator, I want the Python implementation to support the same LLM providers and models through DSPy's LM interface, so that response quality remains consistent.

#### Acceptance Criteria

1. WHEN configuring LLM providers THEN the system SHALL use DSPy's unified LM interface:
   ```python
   # Configure different providers
   openai_lm = dspy.LM(model="openai/gpt-4o", api_key=config.openai_key)
   anthropic_lm = dspy.LM(model="anthropic/claude-3-5-sonnet", api_key=config.anthropic_key)
   gemini_lm = dspy.LM(model="google/gemini-1.5-pro", api_key=config.gemini_key)
   
   # Set default LM for all DSPy modules
   dspy.configure(lm=openai_lm)
   ```

2. WHEN implementing model routing THEN the system SHALL support provider selection:
   ```python
   class LLMRouter:
       def __init__(self, config: Config):
           self.providers = {
               "openai": dspy.LM(model=config.openai_model, api_key=config.openai_key),
               "anthropic": dspy.LM(model=config.anthropic_model, api_key=config.anthropic_key),
               "gemini": dspy.LM(model=config.gemini_model, api_key=config.gemini_key)
           }
           self.default_provider = config.default_provider
       
       def get_lm(self, provider: Optional[str] = None) -> dspy.LM:
           provider = provider or self.default_provider
           return self.providers.get(provider, self.providers[self.default_provider])
   ```

3. WHEN streaming responses THEN the system SHALL use DSPy's streaming capabilities:
   ```python
   from dspy.utils import streamify
   
   async def stream_generation(pipeline: dspy.Module, query: str, history: List[Message]):
       # Enable streaming for the pipeline
       streaming_pipeline = streamify(pipeline)
       
       async for chunk in streaming_pipeline(query=query, history=history):
           yield {"type": "response", "data": chunk}
   ```

4. WHEN tracking usage THEN the system SHALL leverage DSPy's built-in tracking:
   ```python
   # DSPy automatically tracks usage for each LM call
   response = pipeline(query=query, history=history)
   
   # Access usage information
   usage_info = dspy.inspect_history(n=1)
   tokens_used = usage_info[-1].get("usage", {}).get("total_tokens", 0)
   
   # Log usage for monitoring
   logger.info(f"Tokens used: {tokens_used}")
   ```

5. WHEN handling errors THEN the system SHALL use DSPy's error handling:
   ```python
   try:
       response = pipeline(query=query, history=history)
   except dspy.errors.LMError as e:
       # Handle LLM-specific errors (rate limits, API failures)
       logger.error(f"LLM error: {e}")
       
       # Retry with exponential backoff (built into DSPy)
       response = pipeline.forward_with_retry(
           query=query, 
           history=history,
           max_retries=3
       )
   ```

### Requirement 8: Cairo-Specific Intelligence

**User Story:** As a Cairo developer, I want the agents to provide accurate Cairo programming assistance, so that I can get relevant help for my coding tasks.

#### Acceptance Criteria

1. WHEN processing Cairo queries THEN the system SHALL identify contract-related and test-related queries for specialized handling
2. WHEN generating code THEN the system SHALL produce syntactically correct Cairo code following language conventions
3. WHEN using templates THEN the system SHALL apply contract and test templates to enhance context for specific query types
4. WHEN handling non-Cairo queries THEN the system SHALL respond with appropriate redirection messages
5. WHEN providing examples THEN the system SHALL include proper imports, interface definitions, and implementation patterns

### Requirement 9: Event-Driven Architecture

**User Story:** As a backend developer, I want the Python agents to maintain the same event-driven pattern, so that streaming responses work correctly.

#### Acceptance Criteria

1. WHEN processing requests THEN the system SHALL emit events asynchronously to allow for streaming responses
2. WHEN sources are retrieved THEN the system SHALL emit a 'sources' event before generating responses
3. WHEN generating responses THEN the system SHALL emit incremental 'response' events for streaming
4. WHEN processing completes THEN the system SHALL emit an 'end' event to signal completion
5. WHEN errors occur THEN the system SHALL emit 'error' events with descriptive error messages

### Requirement 10: Configuration Management

**User Story:** As a system administrator, I want the Python implementation to use the same configuration system, so that deployment and management remain consistent.

#### Acceptance Criteria

1. WHEN loading configuration THEN the system SHALL read from the same TOML configuration files
2. WHEN accessing API keys THEN the system SHALL support the same environment variable and configuration file structure
3. WHEN configuring providers THEN the system SHALL support the same provider selection and model mapping logic
4. WHEN setting parameters THEN the system SHALL support the same similarity thresholds, source counts, and other tunable parameters
5. WHEN handling missing configuration THEN the system SHALL provide appropriate defaults and error messages

### Requirement 11: Logging and Observability

**User Story:** As a system operator, I want the Python implementation to provide the same logging and monitoring capabilities, so that I can troubleshoot issues effectively.

#### Acceptance Criteria

1. WHEN processing requests THEN the system SHALL log query processing steps with appropriate detail levels
2. WHEN tracking performance THEN the system SHALL log token usage, response times, and document retrieval metrics
3. WHEN errors occur THEN the system SHALL log detailed error information including stack traces and context
4. WHEN debugging THEN the system SHALL support debug-level logging for detailed pipeline execution traces
5. WHEN monitoring THEN the system SHALL provide metrics compatible with existing monitoring infrastructure

### Requirement 12: Testing and Quality Assurance

**User Story:** As a quality assurance engineer, I want comprehensive testing capabilities, so that I can ensure the Python port maintains the same quality and behavior.

#### Acceptance Criteria

1. WHEN running unit tests THEN the system SHALL provide test coverage for all major components and workflows
2. WHEN testing agent behavior THEN the system SHALL support mocking of LLM providers and vector stores
3. WHEN validating responses THEN the system SHALL include tests for Cairo code generation quality and accuracy
4. WHEN testing error handling THEN the system SHALL verify appropriate error responses for various failure scenarios
5. WHEN performing integration tests THEN the system SHALL validate end-to-end workflows with real or mock dependencies
