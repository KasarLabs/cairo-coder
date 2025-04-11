// Import individual prompt files
// Vous pouvez supprimer les imports que vous n'utilisez pas
// import {
//   CAIRO_BOOK_RETRIEVER_PROMPT,
//   CAIRO_BOOK_RESPONSE_PROMPT,
//   CAIRO_BOOK_NO_SOURCE_PROMPT,
// } from './cairoBookPrompts';

// import {
//   STARKNET_DOCS_RETRIEVER_PROMPT,
//   STARKNET_DOCS_RESPONSE_PROMPT,
//   STARKNET_DOCS_NO_SOURCE_PROMPT,
// } from './starknetDocsPrompts';

// etc.

import {
  CAIROCODER_NO_SOURCE_PROMPT,
  CAIROCODER_RESPONSE_PROMPT,
  CAIROCODER_RETRIEVER_PROMPT,
} from './cairoCoderPrompts';

import { AgentPrompts } from '../../core/types';

// Vous pouvez supprimer les exports des prompts que vous n'utilisez pas
// export const cairoBookPrompts: AgentPrompts = { ... };
// export const starknetDocsPrompts: AgentPrompts = { ... };
// etc.

export const cairoCoderPrompts: AgentPrompts = {
  searchRetrieverPrompt: CAIROCODER_RETRIEVER_PROMPT,
  searchResponsePrompt: CAIROCODER_RESPONSE_PROMPT,
  noSourceFoundPrompt: CAIROCODER_NO_SOURCE_PROMPT,
};

// Helper function to inject dynamic values into prompts
export const injectPromptVariables = (prompt: string): string => {
  return prompt
    // .replace('${getStarknetFoundryVersion()}', getStarknetFoundryVersion())
    // .replace('${getScarbVersion()}', getScarbVersion())
    .replace('${new Date().toISOString()}', new Date().toISOString());
};
