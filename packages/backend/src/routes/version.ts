import express, { Router } from 'express';
import cairocoderRouter from './cairocoder';

const router: Router = express.Router();

router.use('/chat/completions', cairocoderRouter);

export default router;
