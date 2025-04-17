import { basicContractTemplate } from './templates/contractTemplate';
import { cairoCoderPrompts } from './prompts';
import { basicTestTemplate } from './templates/testTemplate';
import { VectorStore } from '../db/vectorStore';
import { DocumentSource, RagSearchConfig } from '../types';

export const getAgentConfig = (
  vectorStore: VectorStore,
): RagSearchConfig => {
  return {
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
  };
};
