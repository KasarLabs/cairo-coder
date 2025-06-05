import express, { Router } from 'express';
import cairocoderRouter from './cairocoder';

const router: Router = express.Router();

router.use('/v1/chat/completions', cairocoderRouter);

export default router;
