import request from 'supertest';
require('dotenv').config({ path: '.env.test' });

if (!process.env.API_KEY) {
  throw new Error('API_KEY not found in .env.test file');
}
if (!process.env.API_URL) {
  throw new Error('API_URL not found in .env.test file');
}

const API_KEY = process.env.API_KEY;
const API_URL = process.env.API_URL;

// Agent est défini au niveau global pour être utilisé dans beforeAll et dans les tests
const agent = request(API_URL);

// Le beforeAll est placé au niveau global, en dehors du describe
beforeAll(async () => {
  console.log('Setting up test environment - Installing Scarb...');

  try {
    const installResponse = await agent
      .post('/api/key/request')
      .set('Content-Type', 'application/json')
      .set('x-api-key', API_KEY)
      .send({
        request: 'Can you install scarb?',
      });

    console.log('Scarb Installation Status:', installResponse.status);
    console.log(
      'Scarb Installation Response:',
      installResponse.body.output
        ? JSON.stringify(installResponse.body.output[0], null, 2)
        : 'No output',
    );

    const isSuccess =
      installResponse.status === 201 &&
      installResponse.body.output &&
      installResponse.body.output[0].status === 'success';

    if (!isSuccess) {
      console.error(
        '⚠️ Warning: Scarb installation failed. : ',
        installResponse.body.output[0].text,
      );
    } else {
      console.log('✅ Scarb installation successful');
    }

    // Attendre que l'installation soit traitée
    await new Promise((resolve) => setTimeout(resolve, 5000));
  } catch (error) {
    console.error('❌ Error during Scarb installation:', error);
    console.warn('⚠️ Tests may fail if Scarb is not properly installed');
  }
}, 60000); // Timeout de 60 secondes pour l'installation

describe('Code Generation and Compilation Tests', () => {
  async function generateAndCompile(
    project_name: string,
    prompt_content: string,
    index: number,
  ): Promise<{ success: boolean; error?: string }> {
    console.log(`\n=== Test #${index}: ${project_name} ===`);
    console.log(`Generating code for: ${prompt_content}`);

    try {
      const generation_prompt = `Test #${index}: Generate Cairo code for ${prompt_content}

      1. First, register a new project named "${project_name}" using the cairocoder_register_project tool
      2. Then, generate the Cairo code using the cairocoder_generate_code tool
      
      If generation is successful:
      - Return the generated Cairo code with syntax highlighting
      
      If generation fails:
      - Return only the error message from the tool
      - Do not try to fix or retry the generation
      
      Do not perform any additional actions.`;
      const generateResponse = await agent
        .post('/api/key/request')
        .set('Content-Type', 'application/json')
        .set('x-api-key', API_KEY)
        .send({
          request: generation_prompt,
        });

      console.log('CODE GENERATION STATUS:', generateResponse.status);

      if (generateResponse.status !== 201) {
        return {
          success: false,
          error: `Generation HTTP request failed with status ${generateResponse.status}: ${JSON.stringify(generateResponse.body)}`,
        };
      }

      console.log(
        'CODE GENERATION RESPONSE:',
        JSON.stringify(generateResponse.body.output[0], null, 2),
      );
      const sucessfulGeneration = generateResponse.body.output[0].text
        .toLowerCase()
        .includes('```cairo');

      if (
        generateResponse.body.output[0].status !== 'success' ||
        !sucessfulGeneration
      ) {
        return {
          success: false,
          error: `Generation failed: ${JSON.stringify(generateResponse.body.output[0].text)}`,
        };
      }

      console.log('✅ Code generated successfully');

      const compilation_prompt = `Test #${index}: Compile the project "${project_name}" using the scarb_compile_contract tool.

      After compilation, report whether it succeeded or failed.
      
      For successful compilation: Report "Compilation successful" and include any relevant output.
      For failed compilation: Report "Compilation failed" and include the specific error messages.
      
      Only use the compilation tool and no other tools.
      If another tool is used, instead or additionally to the compilation tool, report it as a failure.`;

      const compileResponse = await agent
        .post('/api/key/request')
        .set('Content-Type', 'application/json')
        .set('x-api-key', API_KEY)
        .send({
          request: compilation_prompt,
        });

      console.log('COMPILATION STATUS:', compileResponse.status);

      if (compileResponse.status !== 201) {
        return {
          success: false,
          error: `Compilation HTTP request failed with status ${compileResponse.status}: ${JSON.stringify(compileResponse.body)}`,
        };
      }

      console.log(
        'COMPILATION RESPONSE:',
        JSON.stringify(compileResponse.body.output[0], null, 2),
      );

      const sucessfulCompilation =
        compileResponse.body.output[0].text
          .toLowerCase()
          .includes('compilation') &&
        !compileResponse.body.output[0].text
          .toLowerCase()
          .includes('failure') &&
        !compileResponse.body.output[0].text.toLowerCase().includes('failed') &&
        !compileResponse.body.output[0].text.toLowerCase().includes('error');

      if (
        compileResponse.body.output[0].status !== 'success' ||
        !sucessfulCompilation
      ) {
        return {
          success: false,
          error: `Compilation failed: ${JSON.stringify(compileResponse.body.output[0].text)}`,
        };
      }

      console.log('✅ Compilation successful');
      await new Promise((resolve) => setTimeout(resolve, 5000));

      return { success: true };
    } catch (error) {
      console.error(`❌ Unexpected error in Test #${index}:`, error);
      return {
        success: false,
        error: `Unexpected error: ${error.message}`,
      };
    }
  }

  describe('Cairo Functions and Basic Algorithms', () => {
    test('Hello World test', async () => {
      const project_name = 'hello_world';
      const prompt_content = 'a cairo function that returns "Hello World"';
      const result = await generateAndCompile(project_name, prompt_content, 0);

      if (!result.success) {
        console.error(`❌ TEST FAILED: ${result.error}`);
      }

      expect(result.success).toBe(true);
    }, 100000);

    test('Fibonacci function', async () => {
      const project_name = 'fibonacci';
      const prompt_content =
        'a Cairo function that calculates the Fibonacci sequence';
      const result = await generateAndCompile(project_name, prompt_content, 1);

      if (!result.success) {
        console.error(`❌ TEST FAILED: ${result.error}`);
      }

      expect(result.success).toBe(true);
    }, 100000);

    test('Max value in array', async () => {
      const project_name = 'max_value';
      const prompt_content =
        'a Cairo function that finds the maximum value in an array';
      const result = await generateAndCompile(project_name, prompt_content, 2);

      if (!result.success) {
        console.error(`❌ TEST FAILED: ${result.error}`);
      }

      expect(result.success).toBe(true);
    }, 100000);

    test('Simple sorting algorithm', async () => {
      const project_name = 'sorting';
      const prompt_content = 'a sorting algorithm';
      const result = await generateAndCompile(project_name, prompt_content, 3);

      if (!result.success) {
        console.error(`❌ TEST FAILED: ${result.error}`);
      }

      expect(result.success).toBe(true);
    }, 100000);
  });

  describe('Simple Starknet Contracts', () => {
    test('Basic contract with storage', async () => {
      const project_name = 'basic_contract';
      const prompt_content =
        'a basic Starknet contract with a storage variable and getter/setter functions';
      const result = await generateAndCompile(project_name, prompt_content, 4);

      if (!result.success) {
        console.error(`❌ TEST FAILED: ${result.error}`);
      }

      expect(result.success).toBe(true);
    }, 100000);

    test('Counter contract', async () => {
      const project_name = 'counter';
      const prompt_content =
        'a Starknet contract that maintains a counter with increment and decrement functions';
      const result = await generateAndCompile(project_name, prompt_content, 5);

      if (!result.success) {
        console.error(`❌ TEST FAILED: ${result.error}`);
      }

      expect(result.success).toBe(true);
    }, 100000);

    test('Simple voting system', async () => {
      const project_name = 'voting';
      const prompt_content =
        'a Starknet contract for a simple voting system where users can vote only once';
      const result = await generateAndCompile(project_name, prompt_content, 6);

      if (!result.success) {
        console.error(`❌ TEST FAILED: ${result.error}`);
      }

      expect(result.success).toBe(true);
    }, 100000);
  });

  describe('Standard and Complex Contracts', () => {
    test('ERC-20 token contract', async () => {
      const project_name = 'erc20';
      const prompt_content = 'a minimal Starknet ERC-20 token contract';
      const result = await generateAndCompile(project_name, prompt_content, 7);

      if (!result.success) {
        console.error(`❌ TEST FAILED: ${result.error}`);
      }

      expect(result.success).toBe(true);
    }, 100000);

    test('ERC-721 NFT contract', async () => {
      const project_name = 'erc721';
      const prompt_content =
        'a Starknet ERC-721 NFT contract with minting functionality';
      const result = await generateAndCompile(project_name, prompt_content, 8);

      if (!result.success) {
        console.error(`❌ TEST FAILED: ${result.error}`);
      }

      expect(result.success).toBe(true);
    }, 100000);

    test('Multisig wallet contract', async () => {
      const project_name = 'multisig';
      const prompt_content =
        'a Starknet multisig wallet contract that requires multiple approvals for transactions';
      const result = await generateAndCompile(project_name, prompt_content, 9);

      if (!result.success) {
        console.error(`❌ TEST FAILED: ${result.error}`);
      }

      expect(result.success).toBe(true);
    }, 100000);
  });
});
