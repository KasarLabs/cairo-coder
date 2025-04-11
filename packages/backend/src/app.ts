import { createApplication } from './server';
import logger from './utils/logger';

// Error handling for uncaught exceptions
process.on('uncaughtException', (err, origin) => {
  logger.error(`Uncaught Exception at ${origin}: ${err}`);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
});

// Start the application
async function startApplication() {
  try {
    const { server, container } = await createApplication();
    const { port } = container.getContext().config;

    server.listen(port, () => {
      logger.info(`Server is running on port ${port}`);
    });
  } catch (error) {
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
}

startApplication();
