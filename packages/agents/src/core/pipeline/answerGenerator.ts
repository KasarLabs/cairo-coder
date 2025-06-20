import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from '@langchain/core/prompts';
import { IterableReadableStream } from '@langchain/core/utils/stream';
import { logger, TokenTracker } from '../../utils';
import { BaseMessage, HumanMessage } from '@langchain/core/messages';
import { RetrievedDocuments, RagInput, RagSearchConfig } from '../../types';
import { formatChatHistoryAsString } from '../../utils';
import { StreamEvent } from '@langchain/core/tracers/log_stream';

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
  ): Promise<IterableReadableStream<StreamEvent>> {
    const context = this.buildContext(retrieved);
    const prompt = await this.createPrompt(input, context);

    const modelName = this.llm.constructor.name || 'defaultLLM';

    const eventStream = this.llm.streamEvents(prompt, { version: 'v1' });

    logger.debug('Started streaming response');

    const generator = this.createTokenTrackingStream(
      eventStream,
      modelName,
      prompt,
    );
    return {
      [Symbol.asyncIterator]: () => generator,
    } as IterableReadableStream<StreamEvent>;
  }

  private async *createTokenTrackingStream(
    eventStream: IterableReadableStream<StreamEvent>,
    modelName: string,
    prompt: string,
  ): AsyncGenerator<StreamEvent, void, unknown> {
    try {
      for await (const event of eventStream) {
        if (event.event === 'on_llm_end') {
          TokenTracker.trackFullUsage(
            prompt,
            event.data?.output?.generations?.[0]?.[0]?.message,
            modelName,
          );
        }

        yield event;
      }
    } finally {
      logger.info(`LLM Call [${modelName}] completed`);
    }
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
