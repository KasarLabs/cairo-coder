import express, { Router } from 'express';
import logger from '../utils/logger';
import { getHostedModeConfig } from '@starknet-agent/agents/config';
import { chatEndpoint } from './openai/chat';

const router: Router = express.Router();

router.post('/chat/completions', async (req, res) => {
  chatEndpoint(req, res);
});

// Vous pouvez supprimer l'endpoint models si vous n'en avez pas besoin
// router.get('/models', async (req, res) => {
//   try {
//     const hostedModeConfig = getHostedModeConfig();
//
//     // Return a simplified list of models
//     const chatModel = req.app.locals.defaultLLM;
//     const fastChatModel = req.app.locals.fastLLM;
//     const embeddings = req.app.locals.embeddings;
//
//     // ... code supprimé ...
//   } catch (error) {
//     logger.error('Error in /v1/models:', error);
//     res.status(500).json({
//       error: {
//         message: 'Internal Server Error',
//         type: 'server_error',
//       },
//     });
//   }
// });

export default router;
