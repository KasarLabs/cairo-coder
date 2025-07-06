import { Request, Response } from 'express';
import {
  BaseMessage,
  HumanMessage,
  AIMessage,
  SystemMessage,
} from '@langchain/core/messages';
import {
  RagAgentFactory,
  TokenTracker,
  getVectorDbConfig,
} from '@cairo-coder/agents';
import { VectorStore } from '@cairo-coder/agents/db/postgresVectorStore';
import { getAxRouter } from '@cairo-coder/agents/config/llm';
import { ChatCompletionRequest } from '../types';
import { v4 as uuidv4 } from 'uuid';

type MessageType = {
  role: string;
  content: string;
};

interface ChatCompletionOptions {
  agentId?: string;
}

export async function handleChatCompletion(
  req: Request,
  res: Response,
  options: ChatCompletionOptions = {},
) {
  const request = req.body as ChatCompletionRequest;
  const { messages, stream = false, model = 'cairo-coder' } = request;
  const { agentId } = options;

  // Basic validation
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({
      error: {
        message: 'Invalid request: messages array is missing.',
        type: 'invalid_request_error',
        param: 'messages',
        code: 'invalid_messages',
      },
    });
  }

  // Get dependencies from app locals (backward compatibility)
  const chatModel = req.app.locals.defaultLLM;
  const fastChatModel = req.app.locals.fastLLM;

  if (!chatModel || !fastChatModel) {
    return res.status(500).json({
      error: {
        message: 'Internal Server Error: Models not initialized',
        type: 'server_error',
        code: 'models_not_initialized',
      },
    });
  }

  // Convert messages to BaseMessage format
  const history: BaseMessage[] = messages.map((msg: MessageType) => {
    switch (msg.role) {
      case 'system':
        return new SystemMessage(msg.content);
      case 'user':
        return new HumanMessage(msg.content);
      case 'assistant':
        return new AIMessage(msg.content);
      default:
        throw new Error(`Unsupported message role: ${msg.role}`);
    }
  });

  // Get the latest user message
  const latestMessage = messages[messages.length - 1];
  if (!latestMessage || latestMessage.role !== 'user') {
    return res.status(400).json({
      error: {
        message: 'Last message must be from user',
        type: 'invalid_request_error',
        param: 'messages',
        code: 'invalid_last_message',
      },
    });
  }

  const query = latestMessage.content;
  const mcp =
    req.headers['mcp'] === 'true' || req.headers['x-mcp-mode'] === 'true';

  // Get the ax router instance
  const axRouter = getAxRouter();

  // Get vector store
  const dbConfig = getVectorDbConfig();
  const vectorStore = await VectorStore.getInstance(dbConfig, axRouter);

  try {
    // Create agent based on whether agentId is provided
    const agent = agentId
      ? await RagAgentFactory.createAgentById(
          query,
          history,
          agentId,
          axRouter,
          vectorStore,
          mcp,
        )
      : RagAgentFactory.createAgent(query, history, axRouter, vectorStore, mcp);

    if (stream) {
      // Set up SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Transfer-Encoding', 'chunked');

      let responseContent = '';

      agent.on('data', (data: any) => {
        const parsed = JSON.parse(data);

        if (parsed.type === 'response') {
          responseContent += parsed.data;

          // If we have content to send
          if (parsed.data) {
            const chunk = {
              id: uuidv4(),
              object: 'chat.completion.chunk',
              created: Date.now(),
              model: model,
              choices: [
                {
                  index: 0,
                  delta: {
                    role: 'assistant',
                    content: parsed.data,
                  },
                  finish_reason: null,
                },
              ],
            };
            res.write(`data: ${JSON.stringify(chunk)}\n\n`);
          }
        }
      });

      agent.on('error', (error: any) => {
        console.error('Agent error:', error);
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
      });

      agent.on('end', () => {
        const tokenUsage = TokenTracker.getSessionTokenUsage();

        res.setHeader('x-total-tokens', tokenUsage.totalTokens.toString());

        const finalChunk = {
          id: uuidv4(),
          object: 'chat.completion.chunk',
          created: Date.now(),
          model: model,
          choices: [
            {
              index: 0,
              delta: {},
              finish_reason: 'stop',
            },
          ],
          usage: {
            prompt_tokens: tokenUsage.promptTokens,
            completion_tokens: tokenUsage.responseTokens,
            total_tokens: tokenUsage.totalTokens,
          },
        };
        res.write(`data: ${JSON.stringify(finalChunk)}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      });
    } else {
      // Non-streaming response
      let responseContent = '';
      let sources: any[] = [];

      agent.on('data', (data: any) => {
        const parsed = JSON.parse(data);

        if (parsed.type === 'response') {
          responseContent += parsed.data;
        } else if (parsed.type === 'sources') {
          sources = parsed.data;
        }
      });

      agent.on('error', (error: any) => {
        console.error('Agent error:', error);
        res.status(500).json({
          error: {
            message: error.message,
            type: 'server_error',
            code: 'internal_error',
          },
        });
      });

      agent.on('end', () => {
        const tokenUsage = TokenTracker.getSessionTokenUsage();

        res.setHeader('x-total-tokens', tokenUsage.totalTokens.toString());

        const responsePayload = {
          id: uuidv4(),
          object: 'chat.completion',
          created: Date.now(),
          model: model,
          choices: [
            {
              index: 0,
              message: {
                role: 'assistant',
                content: responseContent,
              },
              logprobs: null,
              finish_reason: 'stop',
            },
          ],
          usage: {
            prompt_tokens: tokenUsage.promptTokens,
            completion_tokens: tokenUsage.responseTokens,
            total_tokens: tokenUsage.totalTokens,
          },
        };

        // Add sources if in MCP mode
        if (mcp && sources.length > 0) {
          (responsePayload as any).sources = sources;
        }

        res.json(responsePayload);
      });
    }
  } catch (error) {
    console.error('Error in chat completion:', error);

    // Map common errors to OpenAI error format
    if (error instanceof Error) {
      const errorResponse: any = {
        error: {
          message: error.message,
          type: 'server_error',
          code: 'internal_error',
        },
      };

      // Map specific error types
      if (error.message.includes('rate limit')) {
        errorResponse.error.type = 'rate_limit_error';
        errorResponse.error.code = 'rate_limit_exceeded';
        return res.status(429).json(errorResponse);
      }

      if (error.message.includes('invalid')) {
        errorResponse.error.type = 'invalid_request_error';
        return res.status(400).json(errorResponse);
      }

      return res.status(500).json(errorResponse);
    }

    // Generic error
    res.status(500).json({
      error: {
        message: 'Internal Server Error',
        type: 'server_error',
        code: 'internal_error',
      },
    });
  }
}
