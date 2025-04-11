import express from 'express';
import routes from '../routes';
import logger from '../utils/logger';
import { Container } from '../types/context';

export function initializeHTTP(app: express.Application, container: Container) {
  const context = container.getContext();

  // Store models in app.locals for backward compatibility
  app.locals.defaultLLM = context.config.models.defaultLLM;
  app.locals.fastLLM = context.config.models.fastLLM;
  app.locals.embeddings = context.config.models.embeddings;

  // Mount routes
  app.use('/', routes);

  // Health check endpoint
  app.get('/', (_, res) => {
    res.status(200).json({ status: 'ok' });
  });

  // Error handling middleware
  app.use(
    (
      err: any,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      logger.error('Express error handler:', err);
      res.status(500).json({
        error: {
          message: 'Internal Server Error',
          type: 'server_error',
        },
      });
    },
  );
}
