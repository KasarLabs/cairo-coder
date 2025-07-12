import {
  AxAI,
  AxAIGoogleGeminiModel,
  type AxMetricFn,
  AxDefaultCostTracker,
  AxCheckpointLoadFn,
} from '@ax-llm/ax';
import {
  generationDataset,
  type GenerationExample,
} from '../datasets/generation.dataset';
import { generationProgram } from '../../core/programs/generation.program';
import { getGeminiApiKey, logger } from '../..';
import { generationMetricFn } from './utils';
import { AxMiPRO } from '@ax-llm/ax';
import * as fs from 'fs';
import * as path from 'path';

// Setup student AI model
const apiKey = getGeminiApiKey();
const studentAI = new AxAI({
  name: 'google-gemini',
  apiKey,
  models: [
    {
      key: 'gemini-fast',
      model: AxAIGoogleGeminiModel.Gemini25Flash,
      description: 'Fast model for simple tasks',
    },
  ],
});

const costTracker = new AxDefaultCostTracker({
  maxTokens: 300000,
  maxCost: 1.0,
});

// Checkpoint functions
const checkpointSave = async (state: any) => {
  const id = `checkpoint_${Date.now()}`;
  try {
    fs.writeFileSync(`${id}.json`, JSON.stringify(state, null, 2));
    logger.info(`Checkpoint saved to ${id}.json`);
  } catch (error) {
    logger.error('Failed to save checkpoint:', error);
  }
  return id;
};

const checkpointLoad: AxCheckpointLoadFn = async (id) => {
  try {
    const data = fs.readFileSync(`${id}.json`, 'utf8');
    logger.info(`Checkpoint loaded successfully from ${id}.json`);
    return JSON.parse(data);
  } catch (error) {
    logger.error('Failed to load checkpoint:', error);
    return null;
  }
};

// Optimizer instance
const optimizer = new AxMiPRO({
  studentAI,
  // @ts-ignore
  examples: generationDataset,
  targetScore: 0.9,
  verbose: true,
  costTracker,
  checkpointSave,
  checkpointLoad,
  checkpointInterval: 10,
  options: {
    maxBootstrappedDemos: 15,
    maxLabeledDemos: 10,
    numTrials: 8,
  },
});

/**
 * Evaluates baseline performance on a subset of the dataset.
 */
const evaluateBaseline = async () => {
  console.log('Evaluating baseline performance...');
  let totalScore = 0;

  for (let i = 0; i < Math.min(5, generationDataset.length); i++) {
    const example = generationDataset[i];
    const modelKey = 'gemini-fast';

    try {
      const result = await generationProgram.forward(
        studentAI,
        {
          chat_history: example.chat_history || '',
          query: example.query,
          context: example.context,
        },
        { model: modelKey },
      );

      const score = await generationMetricFn({
        prediction: result,
        // @ts-ignore
        example,
      });

      totalScore += score;
    } catch (error) {
      console.error(`Example ${i + 1}: Error - ${error}`);
    }
  }

  const avgScore = totalScore / Math.min(5, generationDataset.length);
  console.log(`Baseline average score: ${avgScore.toFixed(4)}`);
  return avgScore;
};

/**
 * Main function to run the optimization.
 */
const main = async () => {
  console.log('Starting generation program optimization...');

  const baselineScore = await evaluateBaseline();

  const startTime = Date.now();
  const result = await optimizer.compile(generationProgram, generationMetricFn);
  const duration = (Date.now() - startTime) / 1000;

  console.log('Optimization Complete!');
  console.log(`Duration: ${duration.toFixed(2)}s`);
  console.log(`Baseline Score: ${baselineScore.toFixed(4)}`);
  console.log(`Best Score: ${result.bestScore.toFixed(4)}`);
  console.log(
    `Improvement: ${((result.bestScore - baselineScore) * 100).toFixed(1)}%`,
  );
  console.log(`Total API Calls: ${result.stats.totalCalls}`);
  console.log(`Demos Generated: ${result.demos?.length || 0}`);

  if (result.demos) {
    const outputPath = path.join(__dirname, 'optimized-generation-demos.json');
    fs.writeFileSync(outputPath, JSON.stringify(result.demos, null, 2));
    console.log(`Demos saved to: ${outputPath}`);
  }

  const programConfig = JSON.stringify(result.finalConfiguration, null, 2);
  fs.writeFileSync(
    path.join(__dirname, 'optimized-config.json'),
    programConfig,
  );

  console.log(`Cost: $${costTracker.getCurrentCost().toFixed(4)}`);
  console.log(`Tokens: ${JSON.stringify(costTracker.getTokenUsage())}`);
};

main().catch((error) => {
  console.error('Optimization failed:', error);
  process.exit(1);
});
