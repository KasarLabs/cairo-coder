import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { initializeDependencies, server } from './server';
import { logger, RagSearchConfig } from '@cairo-coder/agents';
import { QueryProcessor } from '@cairo-coder/agents/core/pipeline/queryProcessor';

async function main() {
  try {
    const transport = new StdioServerTransport();

    // Initialize dependencies and start server
    let queryProcessor: QueryProcessor;
    let ragConfig: RagSearchConfig; // Replace 'any' with proper type from your config

    // Initialize dependencies before server starts accepting connections
    const { queryProcessor: qp, ragConfig: rc } = await initializeDependencies();
    await server.connect(transport);

    logger.info('MCP Cairo Coder server connected and running on stdio');

    // Keep the process running
    process.stdin.resume();
  } catch (error) {
    logger.error('Fatal error during server startup:', error);
    process.exit(1);
  }
}

// Handle any unhandled promise rejections
process.on('unhandledRejection', (error) => {
  logger.error('Unhandled promise rejection:', error);
  process.exit(1);
});

// Start the server
main().catch((error) => {
  logger.error('Fatal error in main():', error);
  process.exit(1);
});
