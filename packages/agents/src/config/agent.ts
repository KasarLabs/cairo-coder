import { VectorStore } from '../db/postgresVectorStore';
import { RagSearchConfig } from '../types';
import { getAgent, getDefaultAgent } from './agents';

// Legacy function for backward compatibility
export const getAgentConfig = (vectorStore: VectorStore): RagSearchConfig => {
  const agent = getDefaultAgent();
  return {
    name: agent.name,
    prompts: agent.prompts,
    vectorStore,
    contractTemplate: agent.templates?.contract,
    testTemplate: agent.templates?.test,
    maxSourceCount: agent.parameters.maxSourceCount,
    similarityThreshold: agent.parameters.similarityThreshold,
    sources: agent.sources,
  };
};

// Get agent configuration by ID
export const getAgentConfigById = async (
  agentId: string,
  vectorStore: VectorStore,
): Promise<RagSearchConfig> => {
  const agentConfig = getAgent(agentId);

  if (!agentConfig) {
    throw new Error(`Agent configuration not found: ${agentId}`);
  }

  return {
    name: agentConfig.name,
    prompts: agentConfig.prompts,
    vectorStore,
    contractTemplate: agentConfig.templates?.contract,
    testTemplate: agentConfig.templates?.test,
    maxSourceCount: agentConfig.parameters.maxSourceCount,
    similarityThreshold: agentConfig.parameters.similarityThreshold,
    sources: agentConfig.sources,
  };
};
