import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
  getVectorDbConfig,
  VectorStore,
  logger,
  RagInput,
  getAgentConfig,
  RagSearchConfig,
} from '@cairo-coder/agents'; // Adjust import paths if necessary based on monorepo structure
import { initializeLLMConfig } from './config/llm';
import { QueryProcessor } from '@cairo-coder/agents/core/pipeline/queryProcessor';
import { DocumentRetriever } from '@cairo-coder/agents/core/pipeline/documentRetriever';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Prompt } from "@modelcontextprotocol/sdk/types.js";
import { ContextSummarizer } from '@cairo-coder/agents/core/pipeline/summarizer';

const serverPrompt: Prompt = {
  name: "cairo-assistant-prompt",
  description: "Instructions for using the Cairo Assistant MCP server effectively",
  instructions: `This server provides access to Cairo Assistant, a useful assistant for Cairo and Starknet development tasks.

  Key capabilities:
	- Provides contextual information and documentation snippets to assist with Cairo and Starknet development tasks.

  Tool Usage:
  - assist_with_cairo:
	- Use this tool when the user's request involves **writing, refactoring, implementing from scratch, or completing specific parts (like TODOs)** of Cairo code or smart contracts.
	- The tool analyzes the query (which may include code snippets for context) against its knowledge base of Cairo/Starknet documentation and best practices, returning relevant information to aid in generating accurate code or explanations.
	- This tool should also be called to get a better understanding of Starknet's ecosystem, features, and capacities.
	- The tool will return a response composed by useful resources, code snippets, and explanations helping solve the user's problem.

  Best practices:
  - When using the cairo assistant:
	- Use specific, targeted queries for better results (e.g., "Using Openzeppelin to build an ERC20" rather than just "ERC20")
	- Integrate relevant code snippets if the task is related to some code
	-
`
};


export async function initializeDependencies() {
  try {
    // note: all stdout outputs should be redirected somewhere else instead, because the mcp server is catchng them.
    // logger.info('Initializing MCP server dependencies...');

    const models = await initializeLLMConfig();
    const dbConfig = getVectorDbConfig();
    const vectorStore = await VectorStore.getInstance(dbConfig, models.embeddings);

    if (!models.fastLLM) {
      throw new Error(
        'Fast LLM is required for QueryProcessor but was not initialized.',
      );
    }
    // logger.info('LLM Configuration initialized.');

    const ragConfig = getAgentConfig(vectorStore);
    if (!ragConfig) {
      throw new Error('RAG configuration not found in the main config.');
    }

    const queryProcessor = new QueryProcessor(models.fastLLM, ragConfig);
    // logger.info('QueryProcessor initialized.');
    const documentRetriever = new DocumentRetriever(models.embeddings, ragConfig);
    // logger.info('DocumentRetriever initialized.');

    const contextSummarizer = new ContextSummarizer(models.fastLLM, ragConfig);
    // logger.info('AnswerGenerator initialized.');




    return { queryProcessor, ragConfig, documentRetriever, contextSummarizer };
  } catch (error) {
    // logger.error('Failed to initialize MCP server dependencies:', error);
    process.exit(1); // Exit if essential components fail to initialize
  }
}

// Create MCP server instance
export const server = new McpServer({
  name: 'cairo_assistant_mcp',
  version: '1.0.0',
  capabilities: {
    prompts: {
      default: serverPrompt,
    },
    resources: {
      templates: true,
      read: true,
    },
  },
});

server.tool(
  "assist_with_cairo",
  `
Provides contextual information and documentation snippets to assist with Cairo and Starknet development tasks.

Call this tool when the user\'s request involves **writing, refactoring, implementing from scratch, or completing specific parts (like TODOs)** of Cairo code or smart contracts.

The tool analyzes the query (which may include code snippets for context) against its knowledge base of Cairo/Starknet documentation and best practices, returning relevant information to aid in generating accurate code or explanations.

This tool should also be called to get a better understanding of Starknet's ecosystem, features, and capacities.
`,
  {
    query: z
      .string()
      .describe(
        "The user's question regarding Cairo and Starknet development. Try to be as specific as possible.",
      ),
    codeSnippets: z
      .array(z.string())
      .optional()
      .describe(
        'Optional: Code snippets for context. This will help the tool to understand the user\'s intent and provide more accurate answers. Provide as much code as possible to fit the user\'s request.',
      ),
    history: z
      .array(z.string())
      .optional()
      .describe(
        'Optional: The preceding conversation history. This can help the tool understand the context of the discussion and provide more accurate answers.',
      ),
  },
  // Define the output schema if desired for stricter validation, or omit for flexibility
  // outputSchema: z.object({ content: z.array(z.object({ type: z.literal("text"), text: z.string() })) }),
  async ({ query, codeSnippets, history }) => {
    logger.info(`Tool 'assist_with_cairo' invoked with query: "${query}"`);
    const { queryProcessor, ragConfig, documentRetriever, contextSummarizer } = await initializeDependencies();
    try {
      query = query + ' ' + codeSnippets?.join(' ') + ' ' + history?.join(' ');
      const input: RagInput = {
        query,
        chatHistory: [], // Provide empty string if undefined
        // 'sources' might not be relevant here unless the user can pre-filter
        sources: ragConfig.sources || [], // Use available sources from config
      };

      // Use the QueryProcessor to get search terms and sources
      const processedQuery = await queryProcessor.process(input);
      // logger.debug('QueryProcessor result:', processedQuery);

      const documents = await documentRetriever.retrieve(processedQuery, processedQuery.resources || []);
      // logger.debug('DocumentRetriever result:', documents);

      //TODO: determine whether it's benefic to have a summarized context here.
      // my first intuition is that it's only useful to avoid passing too much context to the model that calls the MCP
      // which can be expensive - the problem is that, summarizing this context can be long, even with a "fast" model like
      // flash 2.5, AND, we still lose some information.
      // const summarizedContext = await contextSummarizer.process(input, documents);
      const context = contextSummarizer.buildContext(documents);

      // Return the result in MCP format
      return {
        content: [
          {
            type: 'text',
            text: context,
          },
        ],
      };
    } catch (error) {
      // logger.error('Error during tool execution:', error);
      // Provide a meaningful error response back to the MCP client
      return {
        content: [
          {
            type: 'text',
            text: `<error>Failed to process documentation retrieval request: ${error instanceof Error ? error.message : String(error)}</error>`,
          },
        ],
      };
    }
  }
);

/**
 * Create the MCP server instance and connect it to the stdio transport
 * This only works locally for now.
 */
export const createMcpServer = async () => {
  try {
    const transport = new StdioServerTransport();

    await server.connect(transport);

    process.stdin.resume();
  } catch (error) {
    // logger.error('Fatal error during server startup:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  // logger.info('Received SIGINT, shutting down MCP server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  // logger.info('Received SIGTERM, shutting down MCP server...');
  process.exit(0);
});

createMcpServer();
