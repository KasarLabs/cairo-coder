import express, { Router } from 'express';
import { chatEndpoint } from './openai/chat';

const router: Router = express.Router();

router.post('/chat/completions', async (req, res) => {
  chatEndpoint(req, res);
});

export default router;
