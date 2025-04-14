import express, { Router } from 'express';
import configRouter from './config';
import cairocoderRouter from './cairocoder';

const router: Router = express.Router();

router.use('/config', configRouter);
router.use('/cairocoder', cairocoderRouter);

export default router;
