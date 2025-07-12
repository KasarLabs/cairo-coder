import { VectorStore } from '../db/postgresVectorStore';
import { RagSearchConfig } from '../types';
import { getAgent, getDefaultAgent } from './agents';

// Legacy function for backward compatibility
export const getAgentConfig = (vectorStore: VectorStore): RagSearchConfig => {
  const agent = getDefaultAgent();

  if (!agent.programs) {
    throw new Error(`Programs not defined for default agent`);
  }

  return {
    name: agent.name,
    vectorStore,
    contractTemplate: agent.templates?.contract,
    testTemplate: agent.templates?.test,
    maxSourceCount: agent.parameters.maxSourceCount,
    similarityThreshold: agent.parameters.similarityThreshold,
    sources: agent.sources,
    retrievalProgram: agent.programs.retrieval,
    generationProgram: agent.programs.generation,
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

  if (!agentConfig.programs) {
    throw new Error(`Programs not defined for agent: ${agentId}`);
  }

  return {
    name: agentConfig.name,
    vectorStore,
    contractTemplate: agentConfig.templates?.contract,
    testTemplate: agentConfig.templates?.test,
    maxSourceCount: agentConfig.parameters.maxSourceCount,
    similarityThreshold: agentConfig.parameters.similarityThreshold,
    sources: agentConfig.sources,
    retrievalProgram: agentConfig.programs.retrieval,
    generationProgram: agentConfig.programs.generation,
  };
};
