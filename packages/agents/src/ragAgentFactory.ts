import { BaseMessage } from '@langchain/core/messages';
import { Embeddings } from '@langchain/core/embeddings';
import {
  AvailableAgents,
  getAgentConfig,
  LLMConfig,
} from './config/agentConfigs';
import EventEmitter from 'events';
import { RagPipeline } from './pipeline/ragPipeline';
import { VectorStore } from './db/vectorStore';

export class RagAgentFactory {
  static createAgent(
    agentName: AvailableAgents,
    message: string,
    history: BaseMessage[],
    llm: LLMConfig,
    embeddings: Embeddings,
    vectorStore: VectorStore,
  ): EventEmitter {
    const config = getAgentConfig(agentName, vectorStore);
    const pipeline = new RagPipeline(llm, embeddings, config);
    return pipeline.execute({
      query: message,
      chatHistory: history,
      sources: config.sources,
    });
  }
}
