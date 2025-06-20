import { BaseMessage } from '@langchain/core/messages';
import { Embeddings } from '@langchain/core/embeddings';
import { getAgentConfig, getAgentConfigById } from '../config/agent';
import EventEmitter from 'events';
import { RagPipeline } from './pipeline/ragPipeline';
import { McpPipeline } from './pipeline/mcpPipeline';
import { VectorStore } from '../db/postgresVectorStore';
import { LLMConfig, RagSearchConfig } from '../types';
import { getAgent } from '../config/agents';

export class RagAgentFactory {
  // Legacy method for backward compatibility
  static createAgent(
    message: string,
    history: BaseMessage[],
    llm: LLMConfig,
    embeddings: Embeddings,
    vectorStore: VectorStore,
    mcpMode: boolean = false,
  ): EventEmitter {
    const config = getAgentConfig(vectorStore);
    const pipeline = mcpMode
      ? new McpPipeline(llm, embeddings, config)
      : new RagPipeline(llm, embeddings, config);
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
    llm: LLMConfig,
    embeddings: Embeddings,
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
    const pipeline = this.createPipeline(mcpMode, llm, embeddings, config);

    return pipeline.execute({
      query: message,
      chatHistory: history,
      sources: config.sources,
    });
  }

  private static createPipeline(
    mcpMode: boolean,
    llm: LLMConfig,
    embeddings: Embeddings,
    config: RagSearchConfig,
  ): RagPipeline | McpPipeline {
    // MCP mode overrides pipeline type
    if (mcpMode) {
      return new McpPipeline(llm, embeddings, config);
    }
    return new RagPipeline(llm, embeddings, config);
  }
}
