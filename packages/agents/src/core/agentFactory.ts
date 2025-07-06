import { BaseMessage } from '@langchain/core/messages';
import { AxMultiServiceRouter } from '@ax-llm/ax';
import { getAgentConfig, getAgentConfigById } from '../config/agent';
import EventEmitter from 'events';
import { RagPipeline } from './pipeline/ragPipeline';
import { McpPipeline } from './pipeline/mcpPipeline';
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
    const pipeline = mcpMode
      ? new McpPipeline(axRouter, config)
      : new RagPipeline(axRouter, config);
    return pipeline.execute({
      query: message,
      chatHistory: history,
      sources: config.sources,
    });
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

    // Create pipeline based on agent configuration or MCP mode
    const pipeline = this.createPipeline(mcpMode, axRouter, config);

    return pipeline.execute({
      query: message,
      chatHistory: history,
      sources: config.sources,
    });
  }

  private static createPipeline(
    mcpMode: boolean,
    axRouter: AxMultiServiceRouter,
    config: RagSearchConfig,
  ): RagPipeline | McpPipeline {
    // MCP mode overrides pipeline type
    if (mcpMode) {
      return new McpPipeline(axRouter, config);
    }
    return new RagPipeline(axRouter, config);
  }
}
