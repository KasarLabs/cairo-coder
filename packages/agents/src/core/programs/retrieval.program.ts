import { ax, AxGen, f } from '@ax-llm/ax';

// Available documentation resources
const AVAILABLE_RESOURCES = [
  'cairo_book',
  'starknet_docs',
  'starknet_foundry',
  'cairo_by_example',
  'openzeppelin_docs',
  'corelib_docs',
  'scarb_docs',
];

const instructions = `You are analyzing a Cairo programming query. Your task is to:

1. Analyze Coding Need: Examine the conversation and query to identify the specific Cairo programming problem, smart contract requirement, debugging issue, or concept clarification needed.

2. Extract Requirements: Determine the core technical components or concepts involved (e.g., storage types, function signatures, control flow, traits, testing methods, specific errors).

3. Generate Search Terms: Create a list of precise search terms that target the identified Cairo concepts. Think in terms of fundamental Cairo language features, Starknet contract elements, core library components, or common error patterns.

4. Select Resources: Choose the most relevant documentation resources from the available list that likely contain the information needed to address the coding challenge.

5. Specificity: If the query mentions general programming terms like "events", "storage", "Map", "Vec", ensure your search terms specify "Cairo" or "Starknet Smart Contracts" context (e.g., "Cairo Vec Usage", "Starknet Smart Contract Events").

6. Non-Coding Queries: If the query is a greeting, general conversation, or clearly not related to Cairo or a Starknet concept, return empty arrays for both search_terms and resources.

Resource Descriptions (Focus on Coding Relevance):
- cairo_book: The Cairo Programming Language Book. Essential for core language syntax, semantics, types (felt252, structs, enums, Vec), traits, generics, control flow, memory management, writing tests, organizing a project, standard library usage, starknet interactions. Crucial for smart contract structure, storage, events, ABI, syscalls, contract deployment, interaction, L1<>L2 messaging, Starknet-specific attributes.
- starknet_docs: The Starknet Documentation. For Starknet protocol, architecture, APIs, syscalls, network interaction, deployment, ecosystem tools (Starkli, indexers), general Starknet knowledge.
- starknet_foundry: The Starknet Foundry Documentation. For using the Foundry toolchain: writing, compiling, testing (unit tests, integration tests), and debugging Starknet contracts.
- cairo_by_example: Cairo by Example Documentation. Provides practical Cairo code snippets for specific language features or common patterns. Useful for "how-to" syntax questions.
- openzeppelin_docs: OpenZeppelin Cairo Contracts Documentation. For using the OZ library: standard implementations (ERC20, ERC721), access control, security patterns, contract upgradeability. Crucial for building standard-compliant contracts.
- corelib_docs: Cairo Core Library Documentation. For using the Cairo core library: basic types, stdlib functions, stdlib structs, macros, and other core concepts. Essential for Cairo programming questions.
- scarb_docs: Scarb Documentation. For using the Scarb package manager: building, compiling, generating compilation artifacts, managing dependencies, configuration of Scarb.toml.

Now analyze the provided conversation history and query to generate appropriate search terms and resources.
`;

export const retrievalProgram = ax`
  ${f.string(instructions)} \n
  chat_history:${f.string("Previous messages from this conversation, used to infer context and intent of the user's query.")} ->
  query:${f.string('The users query that must be sanitized and classified. This is the main query that will be used to retrieve relevant documentation or code examples.')}
  ->
  search_terms:${f.array(f.string('A list of search terms that will be used to retrieve relevant documentation or code examples. Typically, keywords related to the query, linked to Cairo, Starknet, and programming in general.'))}
  resources:${f.array(f.string('A list of resources that will be used to retrieve relevant documentation or code examples.'))}
`;

// Set examples after creation
retrievalProgram.setExamples([
  {
    chat_history: '',
    query:
      'How do I make a contract that keeps track of user scores using a map?',
    search_terms: [
      'Starknet Smart Contract Storage',
      'Cairo Mapping',
      'Writing to Contract Storage',
      'Reading from Contract Storage',
      'Defining Contract Functions',
      'Contract Interface Trait',
    ],
    resources: ['cairo_book', 'starknet_docs', 'cairo_by_example'],
  },
  {
    chat_history: 'Discussion about tokens',
    query: 'I want to make my ERC20 token mintable only by the owner.',
    search_terms: [
      'OpenZeppelin Cairo ERC20',
      'OpenZeppelin Cairo Ownable',
      'Access Control in Starknet Contracts',
      'Extending OpenZeppelin Contracts',
      'Using Cairo Traits',
      'Contract Function Assertions',
      'Getting Caller Address Syscall',
    ],
    resources: ['openzeppelin_docs', 'starknet_docs', 'cairo_book'],
  },
  {
    chat_history: '',
    query:
      'My test fails when calling another contract. How do I mock contract calls in Foundry?',
    search_terms: [
      'Starknet Foundry Testing',
      'Foundry Mocking Contract Calls',
      'Foundry Cheatcodes',
      'Integration Testing Starknet Contracts',
      'Mocking Return Values Foundry',
    ],
    resources: ['cairo_book', 'starknet_foundry'],
  },
]);

// Helper function to validate resources
export function validateResources(resources: string[]): string[] {
  return resources.filter((r) => AVAILABLE_RESOURCES.includes(r));
}
