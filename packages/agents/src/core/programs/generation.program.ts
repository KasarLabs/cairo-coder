import { ax, AxGen, f } from '@ax-llm/ax';

// TODO(ax-migration): I dont think AX's programming style wants us to have a system prompt here... everything should be handled by the program + demos.
export const generationProgram: AxGen<
  {
    system_prompt: string;
    chat_history: string;
    query: string;
    context: string;
  },
  { answer: string }
> = ax`
  system_prompt:${f.string('The system prompt to use for the generation.')},
  chat_history:${f.string("Previous messages from this conversation, used to infer context and intent of the user's query.")},
  query:${f.string('The users query that must be sanitized and classified. This is the main query that will be used to retrieve relevant documentation or code examples.')},
  context:${f.string("The context of the user's query.")} ->
  answer:${f.string("The answer to the user's query.")}
`;
