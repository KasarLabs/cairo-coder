import { BaseMessage } from '@langchain/core/messages';
import { AxMultiServiceRouter } from '@ax-llm/ax';
import { getAgentConfig, getAgentConfigById } from '../config/agent';
import EventEmitter from 'events';
import { CairoCoderFlow } from './pipeline/cairoCoderFlow';
import { VectorStore } from '../db/postgresVectorStore';
import { RagSearchConfig } from '../types';
import { getAgent } from '../config/agents';

export class RagAgentFactory {
  // Legacy method for backward compatibility
  static createAgent(
    message: string,
    history: BaseMessage[],
    axRouter: AxMultiServiceRouter,
    vectorStore: VectorStore,
    mcpMode: boolean = false,
  ): EventEmitter {
    const config = getAgentConfig(vectorStore);
    const flow = new CairoCoderFlow(axRouter, config);
    return flow.execute(
      {
        query: message,
        chatHistory: history,
        sources: config.sources,
      },
      mcpMode,
    );
  }

  // New method with agent ID support
  static async createAgentById(
    message: string,
    history: BaseMessage[],
    agentId: string,
    axRouter: AxMultiServiceRouter,
    vectorStore: VectorStore,
    mcpMode: boolean = false,
  ): Promise<EventEmitter> {
    // Get agent configuration
    const agentConfig = getAgent(agentId);
    if (!agentConfig) {
      throw new Error(`Agent configuration not found: ${agentId}`);
    }

    // Build RagSearchConfig from agent configuration
    const config: RagSearchConfig = await getAgentConfigById(
      agentId,
      vectorStore,
    );

    // Create CairoCoderFlow with the configuration
    const flow = new CairoCoderFlow(axRouter, config);

    return flow.execute(
      {
        query: message,
        chatHistory: history,
        sources: config.sources,
      },
      mcpMode,
    );
  }
}
