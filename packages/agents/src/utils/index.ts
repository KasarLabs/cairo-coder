import { BaseMessage } from '@langchain/core/messages';
import winston from 'winston';
import { getSimilarityMeasure } from '../config/settings';
import dot from 'compute-dot';
import cosineSimilarity from 'compute-cosine-similarity';

export const formatChatHistoryAsString = (history: BaseMessage[]) => {
  return history
    .map((message) => `${message._getType()}: ${message.content}`)
    .join('\n');
};

export const parseXMLContent = (xml: string, tag: string): string[] => {
  const regex = new RegExp(`<${tag}>(.*?)</${tag}>`, 'gs');
  const matches = [...xml.matchAll(regex)];
  return matches.map((match) => match[1].trim());
};

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'debug',
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
    new winston.transports.File({
      filename: 'app.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
  ],
});

export const computeSimilarity = (x: number[], y: number[]): number => {
  const similarityMeasure = getSimilarityMeasure();

  if (similarityMeasure === 'cosine') {
    return cosineSimilarity(x, y);
  } else if (similarityMeasure === 'dot') {
    return dot(x, y);
  }

  throw new Error('Invalid similarity measure');
};

