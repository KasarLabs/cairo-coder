
import {
  CAIROCODER_NO_SOURCE_PROMPT,
  CAIROCODER_RESPONSE_PROMPT,
  CAIROCODER_RETRIEVER_PROMPT,
} from './cairoCoderPrompts';

import { AgentPrompts } from '../../types';


export const cairoCoderPrompts: AgentPrompts = {
  searchRetrieverPrompt: CAIROCODER_RETRIEVER_PROMPT,
  searchResponsePrompt: CAIROCODER_RESPONSE_PROMPT,
  noSourceFoundPrompt: CAIROCODER_NO_SOURCE_PROMPT,
};

// Helper function to inject dynamic values into prompts
export const injectPromptVariables = (prompt: string): string => {
  return prompt.replace('${new Date().toISOString()}', new Date().toISOString());
};
