import express, { Router } from 'express';
import { AIMessage } from '@langchain/core/messages';
import { HumanMessage } from '@langchain/core/messages';
import { SystemMessage } from '@langchain/core/messages';
import { BaseMessage } from '@langchain/core/messages';
import { v4 as uuidv4 } from 'uuid';
import { 
  getVectorDbConfig,
  logger,
  RagAgentFactory,
  LLMConfig,
  TokenTracker,
 } from '@cairo-coder/agents';
import { ChatCompletionRequest } from '../types';
import { VectorStore } from '@cairo-coder/agents/db/postgresVectorStore';

const router: Router = express.Router();

router.post('/', async (req, res) => {
  try {
    const {
      model,
      messages,
      temperature = 0.7,
      top_p = 1,
      n = 1,
      stream = false,
      response_format,
    } = req.body as ChatCompletionRequest;

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

    const chatModel = req.app.locals.defaultLLM;
    const fastChatModel = req.app.locals.fastLLM;
    const embeddings = req.app.locals.embeddings;

    if (!chatModel || !fastChatModel || !embeddings) {
      return res.status(500).json({
        error: {
          message: 'Internal Server Error',
        },
      });
    }

    // Check for MCP mode header
    const mcpMode = req.headers['mcp'] === 'true';

    // Convert messages to LangChain format
    const langChainMessages = convertToLangChainMessages(messages);

    // Get the last user message as the query
    const lastUserMessage = messages[messages.length - 1];
    if (lastUserMessage.role !== 'user') {
      return res.status(400).json({
        error: {
          message: 'Last message must be from user',
          type: 'invalid_request_error',
          param: 'messages',
          code: 'invalid_last_message',
        },
      });
    }

    // Call RAG search
    const llmConfig: LLMConfig = {
      defaultLLM: chatModel,
      fastLLM: fastChatModel,
    };

    //TODO: this should likely not be done here
    const dbConfig = getVectorDbConfig();
    const vectorStore = await VectorStore.getInstance(dbConfig, embeddings);

    // Get the response from the agent
    const result = await RagAgentFactory.createAgent(
      lastUserMessage.content,
      langChainMessages,
      llmConfig,
      embeddings,
      vectorStore,
      mcpMode,
    );

    const tokenUsage = TokenTracker.getSessionTokenUsage();
    
    res.setHeader('x-total-tokens', tokenUsage.totalTokens.toString());

    // Build the response object in OpenAI API-compatible format
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
            content: result.answer,
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

    res.json(responsePayload);
  } catch (error) {
    logger.error('Error in /chat/completions:', error);

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
});

// Convert OpenAI message format to LangChain format
function convertToLangChainMessages(messages: any[]): BaseMessage[] {
  return messages.map((msg) => {
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
}

export default router;
