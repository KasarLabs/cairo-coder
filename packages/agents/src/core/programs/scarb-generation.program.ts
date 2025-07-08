import { ax, AxGen, f } from '@ax-llm/ax';

const ANSWER_DESCRIPTION = `Practical Scarb guidance and solutions.

Guidelines:
1. Focus on Scarb commands, configuration examples, and troubleshooting steps
2. Use TOML syntax highlighting for Scarb.toml configuration
3. Use bash syntax highlighting for commands
4. Include expected output when relevant
5. Keep explanations concise and action-oriented
6. For non-Scarb queries: "I specialize in Scarb build tool assistance. Could you please ask a Scarb-specific question?"
`;

export const scarbGenerationProgram: AxGen<
  {
    chat_history: string;
    query: string;
    context: string;
  },
  { answer: string }
> = ax`
  Provide clear, accurate guidance on using Scarb commands, configuration, and troubleshooting.

  Guidelines:
  1. Focus on Scarb commands, configuration examples, and troubleshooting steps
  2. Use TOML syntax highlighting for Scarb.toml configuration
  3. Use bash syntax highlighting for commands
  4. Include expected output when relevant
  5. Keep explanations concise and action-oriented
  6. For non-Scarb queries: "I specialize in Scarb build tool assistance. Could you please ask a Scarb-specific question?"

  chat_history:${f.string('Previous messages from this conversation')},
  query:${f.string('The users Scarb-related query')},
  context:${f.string('Scarb documentation context')} ->
  answer:${f.string(ANSWER_DESCRIPTION)}
`;

// Set examples for Scarb response generation
scarbGenerationProgram.setExamples([
  {
    chat_history: '',
    query: 'How do I create a new Scarb project?',
    context:
      'scarb new creates a new Scarb project. Use --name to specify project name. Creates Scarb.toml and src/lib.cairo.',
    answer: `To create a new Scarb project:

\`\`\`bash
# Create a new project with a specific name
scarb new --name my_project

# Or create in the current directory
scarb new
\`\`\`

This creates:
- \`Scarb.toml\` - project configuration
- \`src/lib.cairo\` - main library file`,
  },
  {
    chat_history: 'Setting up dependencies',
    query: 'How do I add openzeppelin as a dependency?',
    context:
      'Dependencies are added to Scarb.toml under [dependencies] section. Use package_name = version format.',
    answer: `Add OpenZeppelin to your \`Scarb.toml\`:

\`\`\`toml
[dependencies]
openzeppelin = "2.0.0"

# Or specify from a Git repository
openzeppelin = { git = "https://github.com/OpenZeppelin/cairo-contracts.git", tag = "v2.0.0" }
\`\`\`

Then run:
\`\`\`bash
scarb build
\`\`\``,
  },
  {
    chat_history: '',
    query: 'Tell me about Python',
    context: 'Scarb is a build tool for Cairo projects.',
    answer:
      'I specialize in Scarb build tool assistance. Could you please ask a Scarb-specific question?',
  },
  {
    chat_history: '',
    query: 'How do I configure custom build scripts?',
    context: 'No relevant documentation found for this query.',
    answer:
      "I apologize, but I couldn't find specific information in the provided context about custom build scripts in Scarb. To help with your Scarb issue, could you please provide more details such as:\n- The exact error message you're seeing\n- Your Scarb.toml configuration\n- The Scarb command you're running\n- Your Scarb version (run 'scarb --version')",
  },
]);
