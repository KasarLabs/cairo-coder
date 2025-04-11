import eventEmitter from 'events';
import { BaseMessage } from '@langchain/core/messages';
import { Embeddings } from '@langchain/core/embeddings';
import { LLMConfig, VectorStore } from '@starknet-agent/agents/index';

export interface HandlerOptions {
  vectorStore?: VectorStore;
}

export type SearchHandler = (
  content: string,
  history: BaseMessage[],
  llm: LLMConfig,
  embeddings: Embeddings,
  options: HandlerOptions,
) => eventEmitter;
