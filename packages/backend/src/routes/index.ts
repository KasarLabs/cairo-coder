import express, { Router } from 'express';
import configRouter from './config';
import openaiRouter from './openai';

const router: Router = express.Router();

router.use('/api/config', configRouter);
router.use('/v1', openaiRouter);

export default router;
