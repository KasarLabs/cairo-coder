import { BaseMessage } from '@langchain/core/messages';
import { Embeddings } from '@langchain/core/embeddings';
import { getAgentConfig } from '../config/agent';
import EventEmitter from 'events';
import { RagPipeline } from './pipeline/ragPipeline';
import { VectorStore } from '../db/postgresVectorStore';
import { LLMConfig } from '../types';

export class RagAgentFactory {
  static createAgent(
    message: string,
    history: BaseMessage[],
    llm: LLMConfig,
    embeddings: Embeddings,
    vectorStore: VectorStore,
    mcpMode: boolean = false,
  ): EventEmitter {
    const config = getAgentConfig(vectorStore);
    const pipeline = new RagPipeline(llm, embeddings, config);
    return pipeline.execute({
      query: message,
      chatHistory: history,
      sources: config.sources,
      mcpMode,
    });
  }
}
