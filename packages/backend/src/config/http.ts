import express from 'express';
import routes from '../routes';
import { logger } from '@cairo-coder/agents/utils/index';
import { Container } from './context';

export function initializeHTTP(app: express.Application, container: Container) {
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
