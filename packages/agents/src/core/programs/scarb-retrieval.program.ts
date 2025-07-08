import { ax, AxGen, f } from '@ax-llm/ax';
import { AVAILABLE_RESOURCES } from './retrieval.program';

const RETRIEVAL_INSTRUCTIONS = `Analyze the user's Scarb build tool query to generate search terms for Scarb documentation.

Instructions:
1. Identify specific Scarb features, commands, configuration issues, or troubleshooting needs
2. Extract core Scarb concepts (dependencies, workspace, compilation, testing, profiles, scripts)
3. Generate precise search terms targeting Scarb features and configurations
4. Always include 'scarb_docs' as the primary resource
5. Return empty arrays for non-Scarb queries
`;

const RESOURCES_SELECTION_INSTRUCTIONS = `Select relevant documentation resources from: ${AVAILABLE_RESOURCES.join(', ')}`;

export const scarbRetrievalProgram: AxGen<
  { chat_history: string; query: string },
  { search_terms: string[]; resources: string[] }
> = ax`
  chat_history:${f.string('Previous messages from this conversation')},
  query:${f.string('The users Scarb-related query')} ->
  search_terms:${f.array(f.string(RETRIEVAL_INSTRUCTIONS))},
  resources:${f.array(f.string(RESOURCES_SELECTION_INSTRUCTIONS))}
`;

// Set examples for Scarb-specific queries
scarbRetrievalProgram.setExamples([
  {
    chat_history: '',
    query: 'How do I add a new dependency to my Scarb project?',
    search_terms: [
      'Scarb add dependency',
      'Scarb.toml dependencies',
      'Managing Scarb dependencies',
      'Scarb package registry',
    ],
    resources: ['scarb_docs'],
  },
  {
    chat_history: '',
    query: 'My Scarb build is failing with a workspace error',
    search_terms: [
      'Scarb workspace configuration',
      'Scarb workspace errors',
      'Scarb.toml workspace section',
      'Scarb build troubleshooting',
    ],
    resources: ['scarb_docs'],
  },
  {
    chat_history: 'Working on package management',
    query: 'How do I publish a package to the Scarb registry?',
    search_terms: [
      'Scarb publish command',
      'Scarb package registry',
      'Publishing Scarb packages',
      'Scarb.toml package metadata',
    ],
    resources: ['scarb_docs'],
  },
  {
    chat_history: '',
    query: 'How do I write a smart contract?',
    search_terms: [],
    resources: [],
  },
]);
