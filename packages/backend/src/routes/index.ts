import express, { Router } from 'express';
import configRouter from './config';
// import modelsRouter from './models';
// import suggestionsRouter from './suggestions';
import openaiRouter from './openai';

const router: Router = express.Router();

router.use('/api/config', configRouter);
// router.use('/api/models', modelsRouter);
// router.use('/api/suggestions', suggestionsRouter);
router.use('/v1', openaiRouter);

export default router;
