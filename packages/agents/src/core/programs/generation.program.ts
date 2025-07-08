import { ax, AxGen, f } from '@ax-llm/ax';

const ANSWER_DESCRIPTION = `Cairo code solution or explanation addressing the user's query. \
Guidelines: \
1. Focus on clean, idiomatic Cairo code \
2. For smart contracts: define interface traits, implement with #[starknet::contract], include all necessary imports \
3. Add minimal essential comments within code \
4. For non-Cairo queries: 'I am designed to generate Cairo code. Could you please provide a specific Cairo coding request?' \
5. For unclear requests: 'Your request is a bit unclear. Could you please provide more specific details about the Cairo code you need?' \
`;

export const generationProgram: AxGen<
  {
    chat_history: string;
    query: string;
    context: string;
  },
  { answer: string }
> = ax`
  chat_history:${f.string("Previous messages from this conversation, used to infer context and intent of the user's query.")},
  query:${f.string('The users query that must be answered with Cairo code examples or solutions.')},
  context:${f.string('Documentation context containing relevant Cairo/Starknet information to inform the response.')} ->
  answer:${f.string(ANSWER_DESCRIPTION)}
`;

// Set examples for the generation program
generationProgram.setExamples([
  {
    chat_history: '',
    query: 'How do I create a simple counter contract?',
    context:
      'Starknet contracts use #[starknet::contract] attribute. Storage is defined with #[storage]. Interface traits define the contract API.',
    answer: `Here's a simple counter contract:

\`\`\`cairo
use starknet::ContractAddress;

#[starknet::interface]
trait ICounter<TContractState> {
    fn get_count(self: @TContractState) -> u32;
    fn increment(ref self: TContractState);
    fn decrement(ref self: TContractState);
}

#[starknet::contract]
mod Counter {
    #[storage]
    struct Storage {
        count: u32,
    }

    #[abi(embed_v0)]
    impl CounterImpl of super::ICounter<ContractState> {
        fn get_count(self: @ContractState) -> u32 {
            self.count.read()
        }

        fn increment(ref self: ContractState) {
            let current = self.count.read();
            self.count.write(current + 1);
        }

        fn decrement(ref self: ContractState) {
            let current = self.count.read();
            self.count.write(current - 1);
        }
    }
}
\`\`\``,
  },
  {
    chat_history: 'Working with mappings',
    query: 'How do I store user balances in a contract?',
    context:
      'Use Map<K, V> for key-value storage. Import from starknet::storage. ContractAddress is commonly used as a key type.',
    answer: `Store user balances using Map:

\`\`\`cairo
use starknet::ContractAddress;
use starknet::storage::Map;

#[starknet::contract]
mod BalanceTracker {
    #[storage]
    struct Storage {
        balances: Map<ContractAddress, u256>,
    }

    #[generate_trait]
    #[abi(embed_v0)]
    impl BalanceTrackerImpl of IBalanceTracker {
        fn get_balance(self: @ContractState, user: ContractAddress) -> u256 {
            self.balances.read(user)
        }

        fn set_balance(ref self: ContractState, user: ContractAddress, amount: u256) {
            self.balances.write(user, amount);
        }
    }
}
\`\`\``,
  },
  {
    chat_history: '',
    query: 'Tell me about machine learning',
    context: 'Cairo is a programming language for writing provable programs.',
    answer:
      'I am designed to generate Cairo code. Could you please provide a specific Cairo coding request?',
  },
  {
    chat_history: '',
    query: 'How do I implement a hash function?',
    context: 'No relevant documentation found for this query.',
    answer:
      "I apologize, but I couldn't find specific information in the provided context about implementing hash functions in Cairo. To help you better, could you please provide more details, such as the specific hashing algorithm you want to implement or the use case for the hash function?",
  },
]);
