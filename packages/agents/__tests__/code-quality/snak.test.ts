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

describe('Code Generation and Compilation Tests', () => {
  const agent = request(API_URL);

  async function generateAndCompile(
    project_name: string,
    prompt_content: string,
    index: number,
  ): Promise<boolean> {
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

    console.log(
      'GENERATION RESPONSE:',
      JSON.stringify(generateResponse.body, null, 2),
    );
    const sucessfulGeneration = generateResponse.body.output[0].text
      .toLowerCase()
      .includes('```cairo');

    if (
      generateResponse.body.output[0].status !== 'success' ||
      !sucessfulGeneration
    ) {
      console.error('Generation failed:', generateResponse.body);
      return false;
    }

    console.log('Generated code successfully');

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

    console.log(
      'COMPILATION RESPONSE:',
      JSON.stringify(compileResponse.body, null, 2),
    );

    const sucessfulCompilation =
      compileResponse.body.output[0].text
        .toLowerCase()
        .includes('compilation') &&
      !compileResponse.body.output[0].text.toLowerCase().includes('failure') &&
      !compileResponse.body.output[0].text.toLowerCase().includes('failed') &&
      !compileResponse.body.output[0].text.toLowerCase().includes('error');
    if (
      compileResponse.body.output[0].status !== 'success' ||
      !sucessfulCompilation
    ) {
      console.error('Compilation request failed:', compileResponse.body);
      return false;
    }

    console.log('END REQUEST ////////');
    await new Promise((resolve) => setTimeout(resolve, 5000));

    return true;
  }

  describe('Cairo Functions and Basic Algorithms', () => {
    test('Factorial function', async () => {
      // const project_name = 'factorial';
      // const prompt_content =
      //   'a Cairo function that calculates the factorial of a number';
      // const success = await generateAndCompile(project_name, prompt_content, 1);
      // expect(success).toBe(true);
    }, 100000);

    // test('Max value in array', async () => {
    //   const project_name = 'max_value';
    //   const prompt_content = "a Cairo function that finds the maximum value in an array";
    //   const success = await generateAndCompile(project_name, prompt_content, 2);
    //   expect(success).toBe(true);
    // }, 100000);

    // test('Simple sorting algorithm', async () => {
    //   const project_name = 'sorting';
    //   const prompt_content = "a sorting algorithm";
    //   const success = await generateAndCompile(project_name, prompt_content, 3);
    //   expect(success).toBe(true);
    // }, 100000);
  });

  // describe('Simple Starknet Contracts', () => {
  //   test('Basic contract with storage', async () => {
  //     const project_name = 'basic_contract';
  //     const prompt_content = "a basic Starknet contract with a storage variable and getter/setter functions";
  //     const success = await generateAndCompile(project_name, prompt_content, 4);
  //     expect(success).toBe(true);
  //   }, 100000);

  //   test('Counter contract', async () => {
  //     const project_name = 'counter';
  //     const prompt_content = "a Starknet contract that maintains a counter with increment and decrement functions";
  //     const success = await generateAndCompile(project_name, prompt_content, 5);
  //     expect(success).toBe(true);
  //   }, 100000);

  //   test('Simple voting system', async () => {
  //     const project_name = 'voting';
  //     const prompt_content = "a Starknet contract for a simple voting system where users can vote only once";
  //     const success = await generateAndCompile(project_name, prompt_content, 6);
  //     expect(success).toBe(true);
  //   }, 100000);
  // });

  // describe('Standard and Complex Contracts', () => {
  //   test('ERC-20 token contract', async () => {
  //     const project_name = 'erc20';
  //     const prompt_content = "a minimal Starknet ERC-20 token contract";
  //     const success = await generateAndCompile(project_name, prompt_content, 7);
  //     expect(success).toBe(true);
  //   }, 100000);

  //   test('ERC-721 NFT contract', async () => {
  //     const project_name = 'erc721';
  //     const prompt_content = "a Starknet ERC-721 NFT contract with minting functionality";
  //     const success = await generateAndCompile(project_name, prompt_content, 8);
  //     expect(success).toBe(true);
  //   }, 100000);

  //   test('Multisig wallet contract', async () => {
  //     const project_name = 'multisig';
  //     const prompt_content = "a Starknet multisig wallet contract that requires multiple approvals for transactions";
  //     const success = await generateAndCompile(project_name, prompt_content, 9);
  //     expect(success).toBe(true);
  //   }, 100000);
  // });
});
