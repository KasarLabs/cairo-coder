import express, { Router } from 'express';
import { logger } from '@cairo-coder/agents';
import { handleChatCompletion } from './chatCompletionHandler';

const router: Router = express.Router();

router.post('/', async (req, res) => {
  try {
    // Use the shared handler without agentId (uses default agent)
    await handleChatCompletion(req, res);
  } catch (error) {
    logger.error('Error in /chat/completions:', error);

    // Error handling is done in the shared handler
    // This is just a safety net for unexpected errors
    if (!res.headersSent) {
      res.status(500).json({
        error: {
          message: 'Internal Server Error',
          type: 'server_error',
          code: 'internal_error',
        },
      });
    }
  }
});

export default router;
