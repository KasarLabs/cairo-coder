import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from '@langchain/core/prompts';
import { logger, TokenTracker } from '../../utils';
import { BaseMessage, HumanMessage } from '@langchain/core/messages';
import { RetrievedDocuments, RagInput, RagSearchConfig } from '../../types';
import { formatChatHistoryAsString } from '../../utils';

/**
 * Synthesizes a response based on retrieved documents and query context.
 */
export class AnswerGenerator {
  constructor(
    private llm: BaseChatModel,
    private config: RagSearchConfig,
  ) {}

  async generate(
    input: RagInput,
    retrieved: RetrievedDocuments,
  ): Promise<BaseMessage> {
    const context = this.buildContext(retrieved);
    const prompt = await this.createPrompt(input, context);

    const modelName = this.llm.constructor.name || 'defaultLLM';
    
    logger.debug('Starting LLM invocation');
    
    const result = await this.llm.invoke(prompt);
    
    logger.info(`LLM Call [${modelName}] completed`);
    const usage = TokenTracker.trackFullUsage(prompt, result, modelName);
    logger.info(`Tokens: ${usage.promptTokens} prompt + ${usage.responseTokens} response = ${usage.totalTokens} total`);
    
    return result;
  }

  private buildContext(retrieved: RetrievedDocuments): string {
    const docs = retrieved.documents;
    if (!docs.length) {
      return (
        this.config.prompts.noSourceFoundPrompt ||
        'No relevant information found.'
      );
    }

    let context = docs
      .map(
        (doc, i) =>
          `[${i + 1}] ${doc.pageContent}\nSource: ${doc.metadata.title || 'Unknown'}\n`,
      )
      .join('\n');

    const { isContractRelated, isTestRelated } = retrieved.processedQuery;
    if (isContractRelated && this.config.contractTemplate) {
      context += this.config.contractTemplate;
    }
    if (isTestRelated && this.config.testTemplate) {
      context += this.config.testTemplate;
    }
    return context;
  }

  private async createPrompt(
    input: RagInput,
    context: string,
  ): Promise<string> {
    if (!input.chatHistory || input.chatHistory.length === 0) {
      input.chatHistory = [new HumanMessage('You are a helpful assistant.')];
    }
    const promptTemplate = ChatPromptTemplate.fromMessages([
      ['system', this.config.prompts.searchResponsePrompt],
      new MessagesPlaceholder('chat_history'),
      ['user', '{query}\n\nContext:\n{context}'],
    ]);
    return promptTemplate.format({
      query: input.query,
      chat_history: formatChatHistoryAsString(input.chatHistory),
      context,
    });
  }
}


