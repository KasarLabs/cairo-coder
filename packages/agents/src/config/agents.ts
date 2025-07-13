import { AxGen } from '@ax-llm/ax';
import { DocumentSource } from '../types';
import { basicContractTemplate } from './templates/contractTemplate';
import { basicTestTemplate } from './templates/testTemplate';
import {
  retrievalProgram,
  generationProgram,
  scarbRetrievalProgram,
  scarbGenerationProgram,
} from '../core/programs';

export interface AgentConfiguration {
  id: string;
  name: string;
  description: string;
  sources: DocumentSource[];
  templates?: {
    contract?: string;
    test?: string;
  };
  parameters: {
    maxSourceCount: number;
    similarityThreshold: number;
  };
  programs: {
    retrieval: AxGen<any, any>;
    generation: AxGen<any, any>;
  };
}

// All pre-configured agents
export const AGENTS: Record<string, AgentConfiguration> = {
  'cairo-coder': {
    id: 'cairo-coder',
    name: 'Cairo Coder',
    description:
      'Default Cairo language and smart contract assistant with full documentation access',
    sources: [
      DocumentSource.CAIRO_BOOK,
      DocumentSource.CAIRO_BY_EXAMPLE,
      DocumentSource.STARKNET_FOUNDRY,
      DocumentSource.CORELIB_DOCS,
      DocumentSource.OPENZEPPELIN_DOCS,
      DocumentSource.SCARB_DOCS,
    ],
    templates: {
      contract: basicContractTemplate,
      test: basicTestTemplate,
    },
    parameters: {
      maxSourceCount: 15,
      similarityThreshold: 0.3,
    },
    programs: {
      retrieval: retrievalProgram,
      generation: generationProgram,
    },
  },
  'scarb-assistant': {
    id: 'scarb-assistant',
    name: 'Scarb Assistant',
    description: 'Specialized Scarb build tool assistance',
    sources: [DocumentSource.SCARB_DOCS],
    parameters: {
      maxSourceCount: 10,
      similarityThreshold: 0.3,
    },
    programs: {
      retrieval: scarbRetrievalProgram,
      generation: scarbGenerationProgram,
    },
  },
};

// Helper functions
export function getAgent(agentId: string): AgentConfiguration | undefined {
  return AGENTS[agentId];
}

export function listAgents(): AgentConfiguration[] {
  return Object.values(AGENTS);
}

export function getDefaultAgent(): AgentConfiguration {
  return AGENTS['cairo-coder'];
}
