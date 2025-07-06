import express from 'express';
import routes from '../routes';
import { logger } from '@cairo-coder/agents/utils/index';
import { Container } from './context';

export function initializeHTTP(app: express.Application, container: Container) {
  const context = container.getContext();

  // TODO: is this still required for "backward compatibility"?
  // Store models in app.locals for backward compatibility
  app.locals.defaultLLM = context.config.models.defaultLLM;
  app.locals.fastLLM = context.config.models.fastLLM;
  // TODO(migrate-ax): this should be an AxAI service for embeddings.
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
