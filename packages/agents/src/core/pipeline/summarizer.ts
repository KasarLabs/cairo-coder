import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from '@langchain/core/prompts';
import { IterableReadableStream } from '@langchain/core/utils/stream';
import { logger } from '../../utils';
import { BaseMessage, HumanMessage } from '@langchain/core/messages';
import { RetrievedDocuments, RagInput, RagSearchConfig } from '../../types';
import { formatChatHistoryAsString } from '../../utils';
import { StringOutputParser } from '@langchain/core/output_parsers';


// TODO: Abstract the prompt instead of a hardcoded one.
const SUMMARIZER_PROMPT = `
**ROLE:** You are an **AI Expert Technical Distiller** specializing in programming language documentation and blockchain concepts, specifically Cairo and Starknet. Your audience is another advanced AI Language Model (AnswererLLM).

**OBJECTIVE:** Process the provided **pre-selected technical context** (compiled from various sources) and generate a highly **condensed, structured, and factually complete summary**. This summary's **sole purpose** is to serve as the *minimal sufficient input* for the AnswererLLM to accurately and comprehensively answer a specific technical question based *only* on the information present in your summary. Assume the provided context contains all necessary information for that target question.

**TASK:**

1.  **Identify and Extract Core Technical Information:** Analyze the input context to pinpoint all essential facts, definitions, rules, syntax patterns, code examples illustrating specific concepts, function/method signatures, type definitions (structs, enums, traits), attribute names (e.g., \`#[storage]\`, \`#[storage_node]\`, \`#[substorage(v0)]\`), specific type names (\`Vec<T>\`, \`Map<K,V>\`, \`Array<T>\`), required imports or traits (e.g., \`starknet::Store\`, \`VecTrait\`), constraints, operational steps, key differences between related concepts, and potential error conditions or critical warnings mentioned.
2.  **Distill and Condense:**
    *   Eliminate *all* redundant information, introductory/concluding remarks, analogies (unless they convey unique technical insight), rhetorical questions, and conversational filler.
    *   Rephrase verbose explanations into direct, concise statements or bullet points.
    *   Retain specific keywords, type names, function names, attribute names, and code syntax *exactly* as they appear, as these are critical for the AnswererLLM.
    *   Preserve essential code snippets that demonstrate syntax or core logic, but remove non-essential surrounding code or comments within those snippets if possible without losing context.
3.  **Structure for Clarity (for an LLM):**
    *   Organize the distilled information logically. Use clear headings (if applicable within the summary, perhaps using simple markers like \`## Concept: ...\`), bullet points for lists of rules/properties/steps, and short paragraphs for definitions or explanations.
    *   Maintain relationships between concepts (e.g., explicitly state if Type A *requires* Trait B, or if Function X *is used for* Task Y).
4.  **Ensure Lossless Criticality:** **Crucially, absolutely no information vital for understanding the core technical concepts, rules, and procedures described in the original context should be lost.** The summary *must* be sufficient for the AnswererLLM to reconstruct the necessary understanding to answer the target question accurately *without* referring back to the original context. If a detail seems minor but explains a rule or constraint, retain it.

**INPUT FORMAT:**
You will receive a block of text representing the pre-selected, compiled context.

**OUTPUT FORMAT:**
Produce a single block of text containing the condensed summary. Use Markdown for structure (bullets, inline code ticks \` \` \` , code blocks if necessary). Avoid conversational tone. Be direct and factual.

**CONSTRAINTS:**
*   **DO NOT** introduce external information or knowledge beyond the provided context.
*   **DO NOT** interpret or infer beyond what is explicitly stated or directly demonstrated in the context.
*   **DO NOT** simplify technical terms or syntax.
*   **Prioritize accuracy and completeness of critical details over extreme brevity if there is a conflict.** The goal is the *minimal sufficient* context, not the absolute shortest summary possible if it sacrifices necessary information.

**EXAMPLE (Conceptual):**
*If the input context explains storage nodes:*
*   *Bad Summary:* "Storage nodes group data."
*   *Good Summary:*
    *   "Storage nodes group storage variables, including storage types like \`Vec<T>\` and \`Map<K,V>\`."
    *   "Define with \`#[starknet::storage_node]\` attribute."
    *   "Cannot be instantiated outside storage."
    *   "Used within \`#[storage]\` struct via a field annotated with \`#[substorage(v0)]\`."
    *   "Access members via path: \`self.map_var.entry(key).node_member\`."
    *   "Cannot \`read\`/\`write\` the node directly; access members individually."

**BEGIN CONTEXT:**

\`\`\`
{context}
\`\`\`

**END CONTEXT**

**Generate the condensed, information-rich summary based *only* on the context above.**
`

/**
 * Synthesizes a response based on retrieved documents and query context.
 */
export class ContextSummarizer {
  constructor(
    private llm: BaseChatModel,
    private config: RagSearchConfig,
  ) {}

  // Changed to return a stream instead of a single string
  async process(
    input: RagInput,
    retrieved: RetrievedDocuments,
  ): Promise<string> {
    const context = this.buildContext(retrieved);
    const prompt = await this.createPrompt(input, context);
    logger.debug('Final Prompt:' + prompt);

    const response = await this.llm
    .invoke(prompt)
    .then((res) => new StringOutputParser().parse(res.content as string));
    logger.debug('Processed query response:', { response });
    return response;
  }

  public buildContext(retrieved: RetrievedDocuments): string {
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
      ['system', SUMMARIZER_PROMPT],
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
