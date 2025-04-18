import eventEmitter from 'events';
import { BaseMessage } from '@langchain/core/messages';
import { Embeddings } from '@langchain/core/embeddings';
import { LLMConfig } from '@starknet-agent/agents/types/index';
import { VectorStore } from '@starknet-agent/agents/db/postgresVectorStore';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { CorsOptions } from 'cors';
import { Express } from 'express';

export interface ServerConfig {
  port: number;
  models: ModelConfig;
  cors: CorsOptions;
}

export interface ModelConfig {
  defaultLLM: BaseChatModel;
  fastLLM: BaseChatModel;
  embeddings: Embeddings;
}

export interface ServerContext {
  config: ServerConfig;
  app?: Express;
}

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

export interface ChatCompletionRequest {
  model: string;
  messages: Array<{
    role: string;
    content: string;
    name?: string;
    function_call?: {
      name: string;
      arguments: string;
    };
  }>;
  functions?: Array<{
    name: string;
    description?: string;
    parameters: Record<string, any>;
  }>;
  function_call?: string | { name: string };
  tools?: Array<{
    type: string;
    function: {
      name: string;
      description?: string;
      parameters: Record<string, any>;
    };
  }>;
  tool_choice?: string | { type: string; function: { name: string } };
  temperature?: number;
  top_p?: number;
  n?: number;
  stream?: boolean;
  stop?: string | string[];
  max_tokens?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  logit_bias?: Record<string, number>;
  user?: string;
  response_format?: { type: 'text' | 'json_object' };
}
