import {
  CAIROCODER_NO_SOURCE_PROMPT,
  CAIROCODER_RESPONSE_PROMPT,
  CAIROCODER_RETRIEVER_PROMPT,
} from './cairoCoderPrompts';

import {
  SCARB_NO_SOURCE_PROMPT,
  SCARB_RESPONSE_PROMPT,
  SCARB_RETRIEVER_PROMPT,
} from './scarbPrompts';

import { AgentPrompts } from '../../types';

export const cairoCoderPrompts: AgentPrompts = {
  searchRetrieverPrompt: CAIROCODER_RETRIEVER_PROMPT,
  searchResponsePrompt: CAIROCODER_RESPONSE_PROMPT,
  noSourceFoundPrompt: CAIROCODER_NO_SOURCE_PROMPT,
};

export const scarbPrompts: AgentPrompts = {
  searchRetrieverPrompt: SCARB_RETRIEVER_PROMPT,
  searchResponsePrompt: SCARB_RESPONSE_PROMPT,
  noSourceFoundPrompt: SCARB_NO_SOURCE_PROMPT,
};

// Helper function to inject dynamic values into prompts
export const injectPromptVariables = (prompt: string): string => {
  return prompt.replace(
    '${new Date().toISOString()}',
    new Date().toISOString(),
  );
};
