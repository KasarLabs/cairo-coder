import { ax, AxGen, f } from '@ax-llm/ax';
import path from 'path';
import fs from 'fs';

// Available documentation resources
export const AVAILABLE_RESOURCES = [
  'cairo_book',
  'starknet_docs',
  'starknet_foundry',
  'cairo_by_example',
  'openzeppelin_docs',
  'corelib_docs',
  'scarb_docs',
] as const;

// Resource descriptions for internal reference (kept for demos)
export const RESOURCE_DESCRIPTIONS = {
  cairo_book:
    'The Cairo Programming Language Book. Essential for core language syntax, semantics, types (felt252, structs, enums, Vec), traits, generics, control flow, memory management, writing tests, organizing a project, standard library usage, starknet interactions. Crucial for smart contract structure, storage, events, ABI, syscalls, contract deployment, interaction, L1<>L2 messaging, Starknet-specific attributes.',
  starknet_docs:
    'The Starknet Documentation. For Starknet protocol, architecture, APIs, syscalls, network interaction, deployment, ecosystem tools (Starkli, indexers), general Starknet knowledge.',
  starknet_foundry:
    'The Starknet Foundry Documentation. For using the Foundry toolchain: writing, compiling, testing (unit tests, integration tests), and debugging Starknet contracts.',
  cairo_by_example:
    'Cairo by Example Documentation. Provides practical Cairo code snippets for specific language features or common patterns. Useful for how-to syntax questions.',
  openzeppelin_docs:
    'OpenZeppelin Cairo Contracts Documentation. For using the OZ library: standard implementations (ERC20, ERC721), access control, security patterns, contract upgradeability. Crucial for building standard-compliant contracts.',
  corelib_docs:
    'Cairo Core Library Documentation. For using the Cairo core library: basic types, stdlib functions, stdlib structs, macros, and other core concepts. Essential for Cairo programming questions.',
  scarb_docs:
    'Scarb Documentation. For using the Scarb package manager: building, compiling, generating compilation artifacts, managing dependencies, configuration of Scarb.toml.',
};

export const RESOURCE_DESCRIPTIONS_STRING = Object.entries(
  RESOURCE_DESCRIPTIONS,
)
  .map(([key, value]) => `${key}: ${value}`)
  .join(', ');

const RETRIEVAL_INSTRUCTIONS = `Analyze the user's Cairo/Starknet query to generate search terms and select documentation resources.

Instructions:
1. Identify the specific Cairo programming problem, smart contract requirement, or concept
2. Extract core technical components (storage types, traits, testing methods, errors, components, openzeppelin, starknet foundry, scarb, etc.)
3. Extract a list of search terms that will be used to retrieve relevant documentation or code examples through vector search. Typically, keywords related to the query, linked to Cairo, Starknet, and programming in general.
4. For general terms like 'events' or 'storage', add Cairo/Starknet context to search terms.
5. Return empty arrays for non-Cairo queries (e.g. 'Hello, how are you?')

If the user is providing a snippet of code, extrapolate from the code programming concepts, starknet concepts, and smart contract concepts to build the answer.
`;

const RESOURCES_SELECTION_INSTRUCTIONS = `Select relevant documentation resources from the available options: ${Object.keys(
  RESOURCE_DESCRIPTIONS,
).join(', ')}`;

export const retrievalProgram: AxGen<
  { chat_history?: string; query: string },
  { search_terms: string[]; resources: string[] }
> = ax`
  "${RETRIEVAL_INSTRUCTIONS}"
  chat_history?:${f.string("Previous messages from this conversation, used to infer context and intent of the user's query.")},
  query:${f.string('The users query that must be sanitized and classified. This is the main query that will be used to retrieve relevant documentation or code examples.')} ->
  search_terms:${f.array(f.string(RETRIEVAL_INSTRUCTIONS))},
  resources:${f.array(f.string(RESOURCES_SELECTION_INSTRUCTIONS))}
`;

// Set examples for the retrieval program
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
    resources: ['cairo_book'],
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
    resources: ['openzeppelin_docs', 'cairo_book'],
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
  {
    chat_history: '',
    query: 'Hello, how are you?',
    search_terms: [],
    resources: [],
  },
  {
    chat_history: 'Working on array operations',
    query: 'How do I use Vec in Cairo?',
    search_terms: [
      'Cairo Vec Usage',
      'Cairo Array Operations',
      'Cairo Collections',
      'Cairo Vec Methods',
      'Cairo Standard Library Vec',
    ],
    resources: ['cairo_book', 'corelib_docs', 'cairo_by_example'],
  },
]);

const retrieverDemos = JSON.parse(
  fs.readFileSync(
    path.join(
      __dirname,
      '../../../src/optimizers/optimized-retrieval-demos.json',
    ),
    'utf8',
  ),
);
retrievalProgram.setDemos(retrieverDemos);

// Helper function to validate resources
export function validateResources(resources: string[]): string[] {
  return resources.filter((r) => AVAILABLE_RESOURCES.includes(r as any));
}
