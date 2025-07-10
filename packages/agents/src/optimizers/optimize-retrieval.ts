import {
  AxAI,
  AxAIGoogleGeminiModel,
  AxBootstrapFewShot,
  AxMiPRO,
  type AxMetricFn,
  AxDefaultCostTracker,
} from '@ax-llm/ax';
import { retrievalProgram } from '../core/programs/retrieval.program';
import {
  retrievalDataset,
  type RetrievalExample,
} from './datasets/retrieval.dataset';
import { getAxRouter } from '../config/llm';
import { getGeminiApiKey, logger } from '..';

// Helper for Jaccard Index
const jaccard = <T>(setA: Set<T>, setB: Set<T>): number => {
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  if (union.size === 0) {
    return 1; // Both sets are empty, perfect match
  }
  return intersection.size / union.size;
};

export const retrievalMetricFn: AxMetricFn = async ({
  prediction,
  example,
}) => {
  // Convert arrays to sets for comparison

  const predictedResources = new Set(prediction.resources as string[]);
  const expectedResources = new Set(
    (example.expected as any).resources as string[],
  );

  const predictedSearchTerms = new Set(prediction.search_terms as string[]);
  const expectedSearchTerms = new Set(
    (example.expected as any).search_terms as string[],
  );

  // Calculate Jaccard score for both fields
  const resourcesScore = jaccard(predictedResources, expectedResources);
  const searchTermsScore = jaccard(predictedSearchTerms, expectedSearchTerms);

  // Return a weighted average. Resources are more critical, so we give them a higher weight.
  // Search terms cant really match, we should use a semantic meaning meaning...
  // TODO: Use semantic meaning to score search terms. For now -> Full on resource score.
  // const weightedScore = (0.8 * resourcesScore) + (0.2 * searchTermsScore);
  const weightedScore = resourcesScore;

  logger.debug(`weightedScore: ${weightedScore}`);

  return weightedScore;
};

// 1. Setup AI
// We optimize a cheaper "student" model.
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
  maxTokens: 200000, // Stop after 10K tokens
  maxCost: 0.5, // Stop after $0.5
});

// 2. Instantiate Optimizer
const optimizer = new AxMiPRO({
  studentAI,
  examples: retrievalDataset, // Use our new dataset as validation
  targetScore: 0.5,
  verbose: true,
  costTracker,
  options: {
    maxBootstrappedDemos: 15,
    maxLabeledDemos: 10,
  },
});

// 3. Main execution function
const main = async () => {
  console.log('🚀 Starting retrieval program optimization...');

  const startTime = Date.now();
  const result = await optimizer.compile(retrievalProgram, retrievalMetricFn);
  const duration = (Date.now() - startTime) / 1000;

  console.log('\n✅ Optimization Complete!');
  console.log('---------------------------');
  console.log(`Duration: ${duration.toFixed(2)}s`);
  console.log(`Best Score: ${result.bestScore.toFixed(4)}`);
  console.log(`Total API Calls: ${result.stats.totalCalls}`);
  console.log(`Demos Generated: ${result.demos?.length || 0}`);

  if (result.demos) {
    console.log('\nOptimized Demos:');
    console.log(JSON.stringify(result.demos, null, 2));

    // Dump demos to file
    const fs = require('fs');
    const path = require('path');
    const outputPath = path.join(__dirname, 'optimized-retrieval-demos2.json');
    fs.writeFileSync(outputPath, JSON.stringify(result.demos, null, 2));
    console.log(`📁 Demos saved to: ${outputPath}`);
  }

  // Show cost
  console.log(`Cost: ${costTracker.getCurrentCost()}`);
  console.log(`Tokens: ${JSON.stringify(costTracker.getTokenUsage())}`);
};

// Run the optimization
main().catch(console.error);
