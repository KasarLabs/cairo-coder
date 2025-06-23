import express, { Router } from 'express';
import cairocoderRouter from './cairocoder';
import agentsRouter from './agents';

const router: Router = express.Router();

// Legacy endpoint for backward compatibility
router.use('/chat/completions', cairocoderRouter);

// New agent-specific endpoints
router.use('/agents', agentsRouter);

export default router;
