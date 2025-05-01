import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
  getVectorDbConfig,
  VectorStore,
  logger,
  RagInput,
  getAgentConfig,
} from '@cairo-coder/agents'; // Adjust import paths if necessary based on monorepo structure
import { initializeLLMConfig } from '@cairo-coder/backend/config/llm';
import { QueryProcessor } from '@cairo-coder/agents/core/pipeline/queryProcessor';
import { DocumentRetriever } from '@cairo-coder/agents/core/pipeline/documentRetriever';
import { AnswerGenerator } from '@cairo-coder/agents/core/pipeline/answerGenerator';

export async function initializeDependencies() {
  try {
    logger.info('Initializing MCP server dependencies...');

    const models = await initializeLLMConfig();
    const dbConfig = getVectorDbConfig();
    const vectorStore = await VectorStore.getInstance(dbConfig, models.embeddings);

    if (!models.fastLLM) {
      throw new Error(
        'Fast LLM is required for QueryProcessor but was not initialized.',
      );
    }
    logger.info('LLM Configuration initialized.');

    const ragConfig = getAgentConfig(vectorStore);
    if (!ragConfig) {
      throw new Error('RAG configuration not found in the main config.');
    }

    const queryProcessor = new QueryProcessor(models.fastLLM, ragConfig);
    logger.info('QueryProcessor initialized.');
    const documentRetriever = new DocumentRetriever(models.embeddings, ragConfig);
    logger.info('DocumentRetriever initialized.');

    const answerGenerator = new AnswerGenerator(models.fastLLM, ragConfig);
    logger.info('AnswerGenerator initialized.');




    return { queryProcessor, ragConfig, documentRetriever, answerGenerator };
  } catch (error) {
    logger.error('Failed to initialize MCP server dependencies:', error);
    process.exit(1); // Exit if essential components fail to initialize
  }
}

// Create MCP server instance
export const server = new McpServer({
  name: 'cairo_assistant_mcp',
  version: '1.0.0',
  capabilities: {
    // Define resources if needed, otherwise empty
    resources: {},
    // Define the tools provided by this server
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
                "The user's question regarding Cairo and Starknet development.",
              ),
            codeSnippets: z
              .array(z.string())
              .optional()
              .describe(
                'Optional: Code snippets for context. This will help the tool to understand the user\'s intent and provide more accurate answers.',
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
          logger.info(`Tool 'retrieve_cairo_documentation' invoked with query: "${query}"`);
          const { queryProcessor, ragConfig, documentRetriever, answerGenerator } = await initializeDependencies();
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
            logger.debug('QueryProcessor result:', processedQuery);

            const documents = await documentRetriever.retrieve(processedQuery, processedQuery.resources || []);
            logger.debug('DocumentRetriever result:', documents);

            const context = answerGenerator.buildContext(documents);

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
            logger.error('Error during tool execution:', error);
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

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down MCP server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down MCP server...');
  process.exit(0);
});
