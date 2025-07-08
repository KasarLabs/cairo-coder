import {
  AxAIService,
  AxGenStreamingOut,
  AxMultiServiceRouter,
} from '@ax-llm/ax';
import { logger, TokenTracker } from '../../utils';
import { HumanMessage } from '@langchain/core/messages';
import { RetrievedDocuments, RagInput, RagSearchConfig } from '../../types';
import { formatChatHistoryAsString } from '../../utils';
import { getModelForTask } from '../../config/llm';
import { generationProgram } from '../programs/generation.program';

/**
 * Synthesizes a response based on retrieved documents and query context.
 */
export class AnswerGenerator {
  constructor(
    private axRouter: AxMultiServiceRouter,
    private config: RagSearchConfig,
  ) {}

  async generate(
    input: RagInput,
    retrieved: RetrievedDocuments,
  ): Promise<AsyncGenerator<any>> {
    const context = this.buildContext(retrieved);
    const chatHistory = formatChatHistoryAsString(
      input.chatHistory || [new HumanMessage('You are a helpful assistant.')],
    );

    // TODO(ax-migration): we should not be injecting prompts here in the inputs, it should be smarter, handled by ax.
    const promptString = `${chatHistory}\n\nUser: ${input.query}\n\nContext:\n${context}`;

    // Use streamingForward for streaming response
    const modelKey = getModelForTask('fast');
    const stream = generationProgram.streamingForward(
      this.axRouter,
      {
        chat_history: chatHistory,
        query: input.query,
        context: context,
      },
      { model: modelKey },
    );

    // Convert AX streaming format to the expected format
    return this.createTokenTrackingStream(stream, modelKey, promptString);
  }

  private async *createTokenTrackingStream(
    stream: AxGenStreamingOut<{ answer: string }>,
    modelName: string,
    prompt: string,
  ): AsyncGenerator<any, void, unknown> {
    try {
      let fullAnswer = '';

      for await (const chunk of stream) {
        // Convert AX streaming format to expected format
        if (chunk.delta?.answer) {
          fullAnswer += chunk.delta.answer;

          // Emit in a format compatible with the frontend
          yield {
            event: 'on_llm_stream',
            data: {
              chunk: chunk.delta.answer,
            },
          };
        }
      }

      // Track token usage at the end
      TokenTracker.trackFullUsage(prompt, { content: fullAnswer }, modelName);

      // Emit final event
      yield {
        event: 'on_llm_end',
        data: {
          output: {
            generations: [[{ message: { content: fullAnswer } }]],
          },
        },
      };
    } finally {
      logger.info(`LLM Call [${modelName}] completed`);
    }
  }

  private buildContext(retrieved: RetrievedDocuments): string {
    const docs = retrieved.documents;
    if (!docs.length) {
      return 'No relevant documentation found for this query.';
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
}
