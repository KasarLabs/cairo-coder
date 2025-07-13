import {
  AxAIGoogleGeminiModel,
  AxGen,
  AxGenIn,
  AxGenOut,
  AxMultiServiceRouter,
  f,
  s,
  ax,
} from '@ax-llm/ax';
import {
  RagInput,
  StreamHandler,
  RagSearchConfig,
  RetrievedDocuments,
  DocumentSource,
  ProcessedQuery,
  BookChunk,
} from '../../types';
import { formatChatHistoryAsString, logger, TokenTracker } from '../../utils';
import EventEmitter from 'events';
import { AxFlow } from '@ax-llm/ax';
import { QueryProcessorProgram } from '../programs/queryProcessor.program';
import { DocumentRetrieverProgram } from '../programs/documentRetriever.program';
import { Document } from '@langchain/core/documents';
import { GET_DEFAULT_FAST_CHAT_MODEL } from '../../config/llm';
import { ContextFilterProgram } from '../programs/contextFilter.program';

// TODO move in its own file. Add proper examples
const filterProgram = ax`
"Classify whether the contextDocument helps answer the users query.
Assign a score between 0 and 10 on how much the context brings info related to the query.
If it's less than 6, return false.

The document will be fed to another LLM to augment its context. As such, is considered a document relevant:
1. If it's related to a topic of the query (e.g. if the query is about a contract, and the document is about a contract, it is relevant)
2. If it brings broader knowledge relevant to the query (e.g. if the query is about a cairo function and the document is about exposed contract entrypoints, it's relevant)

A document is considered irrelevant if it's not related to the query or if it's not relevant to the broader knowledge of the query.
It's also considered irrelevant if it cannot be leveraged for this direct query:
1. To write a smart contract, it's irrelevant to know details about the staking mechanism of the Starknet Token and its inflation.
2. To fix a bug in a smart contract, it's irrelevant to know what the Cairo / Starknet ZK-VM is.
"
contextDocument:${f.string('A document given as context to help answer the users query.')},
relatedQuery:${f.string('The users query that must be answered')} ->
helpsAnswerQuery:${f.boolean('Whether the contextDocument helps answer the users query.')}`;

filterProgram.setExamples([
  {
    contextDocument:
      'Public functions can also be defined outside an implementation of a trait using the `#[external(v0)]` attribute. These functions automatically generate an entry in the contract ABI, making them callable externally. They also require `self` as their first parameter.',
    relatedQuery: 'Write me a contract that implements an ERC20 token',
    helpsAnswerQuery: true,
  },
  {
    contextDocument: `#### Contract Class ABI

The **Application Binary Interface (ABI)** is the high-level specification of a contract's interface. It describes callable functions, their parameters, and return values, enabling external sources (off-chain or other contracts) to communicate by encoding/decoding data.

- **JSON Representation**: External sources (e.g., block explorers like Voyager or Starkscan) typically use a JSON representation of the ABI, generated from the contract class, containing types, functions, or events.
- **Dispatcher Pattern**: Other contracts interact directly in Cairo using the _dispatcher_ pattern, a specific type with auto-generated methods for calling functions and handling data encoding/decoding.`,
    relatedQuery: 'How do I call a function from another contract?',
    helpsAnswerQuery: true,
  },
  {
    contextDocument: `Inlining is a compiler optimization that directly impacts the generated Sierra and Casm code by embedding a function's body into the caller's context, thereby eliminating the overhead of a function call.`,
    relatedQuery:
      'Write me a contract that stores the list of users that call it in a storage variable',
    helpsAnswerQuery: false,
  },
]);

export class RagPipeline {
  private retrievalFlow: AxFlow<
    { input: RagInput },
    {
      retrieved: {
        documents: Document<BookChunk>[];
        processedQuery: ProcessedQuery;
      };
    }
  >;

  private queryProg: QueryProcessorProgram;
  private retrieveProg: DocumentRetrieverProgram;

  constructor(
    private axRouter: AxMultiServiceRouter,
    private config: RagSearchConfig,
  ) {
    this.queryProg = new QueryProcessorProgram(this.config.retrievalProgram);
    this.retrieveProg = new DocumentRetrieverProgram(
      this.axRouter,
      this.config,
    );

    // @ts-ignore
    // TODO (feature-request): ask for flow.getUsage() to call getUsage() on all nodes and sum them?
    this.retrievalFlow = new AxFlow<
      { input: RagInput },
      {
        retrieved: {
          documents: Document<BookChunk>[];
          processedQuery: ProcessedQuery;
        };
      }
    >()
      .node('queryProcess', this.queryProg)
      .node('retrieve', this.retrieveProg)
      .node('documentFilter', filterProgram)
      .execute('queryProcess', (s) => ({
        chat_history: formatChatHistoryAsString(s.input.chatHistory),
        query: s.input.query,
      }))
      .map((s) => ({
        processedQuery: s.queryProcessResult.processedQuery,
        sources: s.input.sources,
      }))
      .execute('retrieve', (s) => ({
        processedQuery: s.processedQuery,
        sources: s.sources,
      }))
      .map((s) => ({
        relevantDocuments: [],
        retrievedDocuments: s.retrieveResult.documents,
        processedQuery: s.processedQuery,
        currentlyProcessed: 0,
      }))
      .while((s) => s.currentlyProcessed < s.retrievedDocuments.length)
      .execute('documentFilter', (s) => ({
        contextDocument: s.retrievedDocuments[s.currentlyProcessed].pageContent,
        relatedQuery: s.processedQuery.original,
      }))
      .map((s) => {
        const currentDoc = s.retrievedDocuments[s.currentlyProcessed];
        const relevantDocuments = s.documentFilterResult.helpsAnswerQuery
          ? [...s.relevantDocuments, currentDoc]
          : s.relevantDocuments;
        logger.info(
          `Document ${currentDoc.metadata.title} is relevant for query: ${s.documentFilterResult.helpsAnswerQuery}`,
        );
        return {
          ...s,
          relevantDocuments,
          currentlyProcessed: s.currentlyProcessed + 1,
        };
      })
      .end()
      .map((s) => {
        return {
          retrieved: {
            documents: s.relevantDocuments,
            processedQuery: s.processedQuery,
          },
        };
      });
  }

  execute(input: RagInput, mcpMode: boolean = false): EventEmitter {
    const emitter = new EventEmitter();
    const handler: StreamHandler = {
      emitSources: (docs) =>
        emitter.emit('data', JSON.stringify({ type: 'sources', data: docs })),
      emitResponse: (chunk) =>
        emitter.emit(
          'data',
          JSON.stringify({ type: 'response', data: chunk.content }),
        ),
      emitEnd: () => emitter.emit('end'),
      emitError: (error) =>
        emitter.emit('error', JSON.stringify({ data: error })),
    };
    this.runPipeline(input, mcpMode, handler).catch((error) => {
      logger.error('Unhandled pipeline error:', error);
      handler.emitError('An error occurred while processing your request');
    });
    return emitter;
  }

  private async runPipeline(
    input: RagInput,
    mcpMode: boolean,
    handler: StreamHandler,
  ): Promise<void> {
    try {
      this.queryProg.resetUsage();
      this.config.generationProgram.resetUsage();

      logger.info('Starting RagPipeline', { query: input.query });

      const modelKey = GET_DEFAULT_FAST_CHAT_MODEL();
      const state = await this.retrievalFlow.forward(
        this.axRouter,
        { input },
        {
          fastFail: true,
          autoParallel: false,
          model: modelKey,
        },
      );

      const retrieved = state.retrieved;
      handler.emitSources(retrieved.documents);

      if (mcpMode) {
        const assembled = this.assembleDocuments(retrieved);
        handler.emitResponse({
          content: JSON.stringify(assembled, null, 2),
        } as any);
      } else {
        const context = this.buildContext(retrieved);
        const chat_history = formatChatHistoryAsString(input.chatHistory);
        const query = input.query;
        const modelKey = GET_DEFAULT_FAST_CHAT_MODEL();
        // Note: not using the generationFlow here because streamingForward is not supported in AxFlow.
        const stream = this.config.generationProgram.streamingForward(
          this.axRouter,
          { chat_history, query, context },
          { model: modelKey },
        );
        let fullAnswer = '';
        const promptString = `${chat_history}\n\nUser: ${query}\n\nContext:\n${context}`;
        for await (const chunk of stream) {
          if (chunk.delta?.answer) {
            fullAnswer += chunk.delta.answer;
            handler.emitResponse({ content: chunk.delta.answer } as any);
          }
        }
        TokenTracker.trackFullUsage(
          promptString,
          { content: fullAnswer },
          modelKey,
        );
      }

      // Currently AX-LLM has an issue with token tracking for streaming models.
      // Transition to using this once solved.

      // const queryUsage = this.queryProg.getUsage()[0];
      // const generationUsage = this.config.generationProgram.getUsage()[0];

      // console.log('Query usage:', this.queryProg.getUsage());
      // console.log('Generation usage:', this.config.generationProgram.getUsage());

      // const totalTokens = {
      //   promptTokens: queryUsage.tokens.promptTokens + generationUsage.tokens.promptTokens,
      //   responseTokens: queryUsage.tokens.completionTokens + generationUsage.tokens.completionTokens,
      //   totalTokens: queryUsage.tokens.totalTokens + generationUsage.tokens.totalTokens,
      //   thinkingTokens: generationUsage.tokens.thoughtsTokens || 0 + queryUsage.tokens.thoughtsTokens || 0,
      // }

      const tokenUsage = TokenTracker.getSessionTokenUsage();

      logger.info('Pipeline completed', {
        query: input.query,
        tokenUsage: {
          promptTokens: tokenUsage.promptTokens,
          responseTokens: tokenUsage.responseTokens,
          totalTokens: tokenUsage.totalTokens,
        },
      });

      handler.emitEnd();
    } catch (error) {
      logger.error('Pipeline error:', error);
      handler.emitError('An error occurred while processing your request');
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

  private assembleDocuments(retrieved: RetrievedDocuments): string {
    const docs = retrieved.documents;
    if (!docs.length) {
      return 'No relevant information found.';
    }

    let context = docs.map((doc) => doc.pageContent).join('\n\n');

    const { isContractRelated, isTestRelated } = retrieved.processedQuery;
    if (isContractRelated && this.config.contractTemplate) {
      context += '\n\n' + this.config.contractTemplate;
    }
    if (isTestRelated && this.config.testTemplate) {
      context += '\n\n' + this.config.testTemplate;
    }

    return context;
  }

  /**
   * Execute retrieval flow and return intermediate results for testing purposes
   * This method is specifically designed for DocQualityTester to access intermediate states
   */
  public async executeRetrievalForTesting(input: RagInput): Promise<{
    processedQuery: any;
    retrieved: RetrievedDocuments;
    answerStream: AsyncIterable<any>;
  }> {
    // Execute retrieval flow to get intermediate results
    try {
      const state = await this.retrievalFlow.forward(this.axRouter, { input });
      const retrieved = state.retrieved;

      // Also get the processed query from the retrieval result
      const processedQuery = retrieved.processedQuery;

      // Generate answer stream
      const context = this.buildContext(retrieved);
      const chat_history = formatChatHistoryAsString(input.chatHistory);
      const query = input.query;
      const modelKey = GET_DEFAULT_FAST_CHAT_MODEL();
      const answerStream = this.config.generationProgram.streamingForward(
        this.axRouter,
        { chat_history, query, context },
        { model: modelKey },
      );

      return {
        processedQuery,
        retrieved,
        answerStream,
      };
    } catch (error) {
      // Create fallback values when retrieval fails
      const fallbackProcessedQuery = {
        original: input.query,
        searchTerms: [input.query],
        transformedQuery: input.query,
        isContractRelated: false,
        isTestRelated: false,
        resources: [],
      };

      const fallbackRetrieved: RetrievedDocuments = {
        documents: [],
        processedQuery: fallbackProcessedQuery,
      };

      // Create an error stream that satisfies the AsyncIterable type
      const errorStream = async function* () {
        yield 'Could not process request.';
      };

      return {
        processedQuery: fallbackProcessedQuery,
        retrieved: fallbackRetrieved,
        answerStream: errorStream(),
      };
    }
  }
}
