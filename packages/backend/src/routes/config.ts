import express, { Router } from 'express';
import {
  getAvailableChatModelProviders,
  getAvailableEmbeddingModelProviders,
} from '../config/provider';
import {
  getGroqApiKey,
  getAnthropicApiKey,
  getOpenaiApiKey,
  getDeepseekApiKey,
  updateConfig,
  getGeminiApiKey,
} from '@starknet-agent/agents/config/settings';

const router: Router = express.Router();

router.get('/', async (_, res) => {
  return res
    .status(403)
    .json({ error: 'This route is disabled in hosted mode' });
});

router.post('/', async (req, res) => {
  return res
    .status(403)
    .json({ error: 'This route is disabled in hosted mode' });
});

export default router;
