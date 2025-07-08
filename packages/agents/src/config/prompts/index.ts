import { AgentPrompts } from '../../types';

// These prompts are no longer used as we've migrated to ax-native programs
// Keeping them as empty strings to maintain backward compatibility
// TODO(ax-migration): remove this once we've migrated to ax-native programs
export const cairoCoderPrompts: AgentPrompts = {
  searchRetrieverPrompt: '', // Now handled by retrievalProgram with embedded instructions
  searchResponsePrompt: '', // Now handled by generationProgram with embedded instructions
  noSourceFoundPrompt: '', // Now handled by generationProgram demos
};

export const scarbPrompts: AgentPrompts = {
  searchRetrieverPrompt: '', // Now handled by scarbRetrievalProgram with embedded instructions
  searchResponsePrompt: '', // Now handled by scarbGenerationProgram with embedded instructions
  noSourceFoundPrompt: '', // Now handled by scarbGenerationProgram demos
};

// Helper function to inject dynamic values into prompts
export const injectPromptVariables = (prompt: string): string => {
  return prompt.replace(
    '${new Date().toISOString()}',
    new Date().toISOString(),
  );
};
