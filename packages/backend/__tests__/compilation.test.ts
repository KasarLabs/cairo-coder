/**
 * @group integration
 */

import request from 'supertest';

const API_KEY = process.env.API_KEY;
const API_URL = process.env.API_URL;
const GENERATION_TIMEOUT = 50000;
const COMPILATION_TIMEOUT = 15000;

describe('Code Generation and Compilation Tests', () => {
  const agent = request(API_URL);

  async function generateAndCompile(prompt: string): Promise<boolean> {
    const generateResponse = await agent
      .post('/api/key/request')
      .set('Content-Type', 'application/json')
      .set('x-api-key', API_KEY)
      .send({
        request: `${prompt}. Do not compile it or do any other action after generating it, just return the code`,
      })
      .timeout(GENERATION_TIMEOUT);

    if (generateResponse.body.output[0].status !== 'success') {
      console.error('Generation failed:', generateResponse.body);
      return false;
    }

    console.log('Generated code successfully');

    const compileResponse = await agent
      .post('/api/key/request')
      .set('Content-Type', 'application/json')
      .set('x-api-key', API_KEY)
      .send({
        request:
          'Compile the previous code, if there is an error do NOT fix it, just return the error',
      })
      .timeout(COMPILATION_TIMEOUT);

    if (compileResponse.body.output[0].status !== 'success') {
      console.error('Compilation request failed:', compileResponse.body);
      return false;
    }

    const responseText = compileResponse.body.response || '';
    const isSuccessful =
      !responseText.includes('error') &&
      !responseText.includes('failed') &&
      !responseText.includes('cannot');

    if (!isSuccessful) {
      console.error('Compilation failed:', responseText);
    } else {
      console.log('Compilation successful');
    }

    return isSuccessful;
  }

  describe('Cairo Functions and Basic Algorithms', () => {
    test('Factorial function', async () => {
      const prompt =
        'Generate a Cairo function that calculates the factorial of a number.';
      const success = await generateAndCompile(prompt);
      expect(success).toBe(true);
    }, 100000);

    test('Max value in array', async () => {
      const prompt =
        'Generate a Cairo function that finds the maximum value in an array.';
      const success = await generateAndCompile(prompt);
      expect(success).toBe(true);
    }, 100000);

    test('Simple sorting algorithm', async () => {
      const prompt =
        'Generate a Cairo implementation of a simple sorting algorithm.';
      const success = await generateAndCompile(prompt);
      expect(success).toBe(true);
    }, 100000);
  });

  describe('Simple Starknet Contracts', () => {
    test('Basic contract with storage', async () => {
      const prompt =
        'Generate a basic Starknet contract with a storage variable and getter/setter functions.';
      const success = await generateAndCompile(prompt);
      expect(success).toBe(true);
    }, 100000);

    test('Counter contract', async () => {
      const prompt =
        'Generate a Starknet contract that maintains a counter with increment and decrement functions.';
      const success = await generateAndCompile(prompt);
      expect(success).toBe(true);
    }, 100000);

    test('Simple voting system', async () => {
      const prompt =
        'Generate a Starknet contract for a simple voting system where users can vote only once.';
      const success = await generateAndCompile(prompt);
      expect(success).toBe(true);
    }, 100000);
  });

  describe('Standard and Complex Contracts', () => {
    test('ERC-20 token contract', async () => {
      const prompt = 'Generate a minimal Starknet ERC-20 token contract.';
      const success = await generateAndCompile(prompt);
      expect(success).toBe(true);
    }, 100000);

    test('ERC-721 NFT contract', async () => {
      const prompt =
        'Generate a Starknet ERC-721 NFT contract with minting functionality.';
      const success = await generateAndCompile(prompt);
      expect(success).toBe(true);
    }, 100000);

    test('Multisig wallet contract', async () => {
      const prompt =
        'Generate a Starknet multisig wallet contract that requires multiple approvals for transactions.';
      const success = await generateAndCompile(prompt);
      expect(success).toBe(true);
    }, 100000);
  });
});
