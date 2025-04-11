# How does Starknet Agent work?

Curious about how Starknet Agent works? Don't worry, we'll cover it here. Before we begin, make sure you've read about the architecture of Starknet Agent to ensure you understand what it's made up of. Haven't read it? You can read it [here](https://github.com/cairo-book/starknet-agent/tree/master/docs/architecture/README.md).

We'll understand how Starknet Agent works by taking an example of a scenario where a user asks: "How are transactions proven?". We'll break down the process into steps to make it easier to understand.

## The RAG Pipeline Flow

1. **User Query Submission**:

   - The user submits a query through the UI.
   - The message is sent via WebSocket to the backend server.
   - The backend identifies the appropriate focus mode (e.g., "starknetDocs", "cairoBook", etc.).

2. **Query Processing**:

   - The `QueryProcessor` component analyzes the chat history and the current query.
   - It reformulates the query to make it more precise and effective for retrieval.
   - This step uses a fast LLM to quickly process the query.

3. **Document Retrieval**:

   - The reformulated query is converted into an embedding vector.
   - The `DocumentRetriever` component performs a similarity search in the appropriate vector store.
   - It retrieves the most relevant document chunks based on vector similarity.
   - The retrieved documents are sent back to the UI to display sources.

4. **Answer Generation**:
   - The `AnswerGenerator` component takes the original query, chat history, and retrieved documents.
   - It uses a more powerful LLM to generate a comprehensive response.
   - The response is streamed back to the UI in real-time.
   - The LLM is prompted to include citations to the source documents.

## System Components in Detail

### Backend Service

The backend service is built with Express and handles:

- WebSocket connections for real-time chat
- API endpoints for configuration and system information
- Connection to the agent system

### RAG Agent System

The RAG (Retrieval-Augmented Generation) system consists of:

- `RagAgentFactory`: Creates the appropriate agent based on the focus mode
- `RagPipeline`: Orchestrates the entire RAG process
- `QueryProcessor`: Reformulates queries for better retrieval
- `DocumentRetriever`: Finds relevant documents using vector search
- `AnswerGenerator`: Generates responses with citations

### Vector Databases

- Each focus mode has its own MongoDB Atlas collection with vector search capabilities
- Documents are stored as chunks with metadata and vector embeddings
- The system uses cosine similarity to find the most relevant documents

### Ingester System

The ingester is responsible for:

- Downloading content from various Starknet ecosystem resources
- Processing and chunking the content into manageable pieces
- Generating embeddings for each chunk
- Storing the chunks and embeddings in the vector database

## How are the answers cited?

The LLMs are prompted to cite their sources when generating responses. The prompts include specific instructions to:

1. Reference the source documents when providing information
2. Include citation markers that can be parsed by the UI
3. Only provide information that can be found in the source documents

The UI then processes these citations and displays them in a user-friendly format, allowing users to click on citations to view the source material.

## Focus Modes Implementation

Each focus mode targets a specific set of resources:

1. **Starknet Ecosystem**: Aggregates all available resources for comprehensive search
2. **Cairo Book**: Focuses on the Cairo programming language documentation
3. **Starknet Docs**: Concentrates on official Starknet documentation
4. **Starknet Foundry**: Targets the Starknet Foundry documentation
5. **Cairo By Example**: Searches the Cairo By Example resource

The system selects the appropriate vector database based on the user's chosen focus mode, ensuring that search results are relevant to the specific context the user is interested in.
