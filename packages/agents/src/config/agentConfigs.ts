import { basicContractTemplate } from './templates/contractTemplate';
import { cairoCoderPrompts } from './prompts';
import { basicTestTemplate } from './templates/testTemplate';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { VectorStore } from '../db/vectorStore';
import { DocumentSource, RagSearchConfig } from '../core/types';

export interface LLMConfig {
  defaultLLM: BaseChatModel;
  fastLLM?: BaseChatModel;
}

export const parseXMLContent = (xml: string, tag: string): string[] => {
  const regex = new RegExp(`<${tag}>(.*?)</${tag}>`, 'gs');
  const matches = [...xml.matchAll(regex)];
  return matches.map((match) => match[1].trim());
};


export type AvailableAgents = 'cairoCoder';

// We'll make this a factory function instead of a static object
export const createAgentConfigs = (
  vectorStore: VectorStore,
): Record<AvailableAgents, RagSearchConfig> => ({
  cairoCoder: {
    name: 'Cairo Coder',
    prompts: cairoCoderPrompts,
    vectorStore,
    contractTemplate: basicContractTemplate,
    testTemplate: basicTestTemplate,
    maxSourceCount: 15,
    similarityThreshold: 0.4,
    sources: [
      DocumentSource.CAIRO_BOOK,
      DocumentSource.CAIRO_BY_EXAMPLE,
      DocumentSource.STARKNET_FOUNDRY,
    ],
  },
});

// Update the helper function to take vectorStore as parameter
export const getAgentConfig = (
  name: AvailableAgents,
  vectorStore: VectorStore,
): RagSearchConfig => {
  const configs = createAgentConfigs(vectorStore);
  const config = configs[name];
  if (!config) {
    throw new Error(`No configuration found for agent: ${name}`);
  }
  return config;
};
