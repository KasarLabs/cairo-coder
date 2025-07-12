import { generationMetricFn } from './utils';
import { generationDataset } from '../datasets/generation.dataset';
import assert from 'assert';

// Test the metric function with a few examples
async function testMetric() {
  console.log('Testing generation metric function...\n');

  // Test 1: Valid Cairo code that should compile
  const test1 = {
    prediction: {
      answer: `Here's a simple function:

\`\`\`cairo
fn add(a: u32, b: u32) -> u32 {
    a + b
}
\`\`\``,
    },
    example: {
      query: 'Write an add function',
      expected: {
        answer: `\`\`\`cairo
fn add(a: u32, b: u32) -> u32 {
    a + b
}
\`\`\``,
      },
    },
  };

  console.log('Test 1: Valid Cairo code');
  const score1 = await generationMetricFn(test1);
  console.log(`Score: ${score1}\n`);
  assert(score1 == 1, 'Test 1 should pass');

  // Test 2: Non-Cairo query
  const test2 = {
    prediction: {
      answer:
        'I am designed to generate Cairo code. Could you please provide a specific Cairo coding request?',
    },
    example: {
      query: 'Tell me about Python',
      expected: {
        answer:
          'I am designed to generate Cairo code. Could you please provide a specific Cairo coding request?',
      },
    },
  };

  console.log('Test 2: Non-Cairo query');
  const score2 = await generationMetricFn(test2);
  console.log(`Score: ${score2}\n`);
  assert(score2 == 1, 'Test 2 should fail');

  // Test 3: Invalid Cairo code
  const test3 = {
    prediction: {
      answer: `Here's the code:

\`\`\`cairo
fn broken_function {
    // Missing parameters and return type
    invalid syntax here
}
\`\`\``,
    },
    example: {
      query: 'Write a function',
      expected: {
        answer: `\`\`\`cairo
fn my_function() -> u32 {
    42
}
\`\`\``,
      },
    },
  };

  console.log('Test 3: Invalid Cairo code');
  const score3 = await generationMetricFn(test3);
  console.log(`Score: ${score3}\n`);

  // Test with actual dataset example
  if (generationDataset.length > 0) {
    console.log('Test 4: Dataset example');
    const datasetExample = generationDataset[0];
    const test4 = {
      prediction: {
        answer: datasetExample.expected.answer,
      },
      example: datasetExample,
    };
    // @ts-ignore
    const score4 = await generationMetricFn(test4);
    console.log(
      `Score: ${score4} (should be high since prediction matches expected)\n`,
    );
  }
}

// Run the test
testMetric().catch(console.error);
