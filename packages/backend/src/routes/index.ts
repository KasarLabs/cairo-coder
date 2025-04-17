import express, { Router } from 'express';
import cairocoderRouter from './cairocoder';

const router: Router = express.Router();

router.use('/generate', cairocoderRouter);

export default router;
