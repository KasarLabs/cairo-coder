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

// Default query classifier that checks for contract-related terms
const defaultQueryClassifier = {
  isNotNeeded: (query: string): boolean => {
    return query.includes('<response>not_needed</response>');
  },

  isTermQuery: (query: string, tag: string): boolean => {
    return query.includes(`<${tag}>`);
  },

  isContractQuery: (query: string, context: string): boolean => {
    const contractTerms = [
      'contract',
      'storage',
      'event',
      'interface',
      'abi',
      'function',
      'map',
      'vec',
    ];

    const lowercaseQuery = query.toLowerCase();
    const lowercaseContext = context.toLowerCase();

    return (
      contractTerms.some((term) => lowercaseQuery.includes(term)) ||
      context.includes('<search_terms>')
    );
  },
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
    queryClassifier: defaultQueryClassifier,
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
