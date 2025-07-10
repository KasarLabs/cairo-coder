import { AVAILABLE_RESOURCES } from '../../core/programs/retrieval.program';

export type RetrievalExample = {
  // The user's query.
  query: string;
  // Optional chat history for context.
  chat_history?: string;
  // The ground truth we are comparing against.
  expected: {
    // The ideal search terms. Order does not matter.
    search_terms: string[];
    // The ideal resources to search.
    resources: (typeof AVAILABLE_RESOURCES)[number][];
  };
};

export const retrievalDataset: RetrievalExample[] = [
  {
    query: "How do you declare a mutable variable in Cairo?",
    expected: {
      search_terms: ["let keyword", "mut", "variables", "immutability"],
      resources: ["cairo_book", "cairo_by_example"]
    }
  },
  {
    query: "What happens if you try to reassign a variable declared without `mut`?",
    expected: {
      search_terms: ["immutability", "let keyword", "compile error"],
      resources: ["cairo_book", "cairo_by_example"]
    }
  },
  {
    query: "What is the default data type if no type is specified, and how does it behave with division?",
    expected: {
      search_terms: ["felt252", "field elements", "division", "type inference"],
      resources: ["cairo_book", "cairo_by_example"]
    }
  },
  {
    query: "How do you declare an unsigned 8-bit integer in Cairo?",
    expected: {
      search_terms: ["u8", "integer types", "type annotation"],
      resources: ["cairo_book", "cairo_by_example"]
    }
  },
  {
    query: "What is the range of values for an `i128` type?",
    expected: {
      search_terms: ["i128", "signed integers", "range"],
      resources: ["cairo_book", "corelib_docs"]
    }
  },
  {
    query: "How do you define a function with a generic type parameter?",
    expected: {
      search_terms: ["fn keyword", "generics", "type parameters"],
      resources: ["cairo_book", "cairo_by_example"]
    }
  },
  {
    query: "What keyword is used to declare a function in Cairo?",
    expected: {
      search_terms: ["fn keyword", "function declaration"],
      resources: ["cairo_book", "cairo_by_example"]
    }
  },
  {
    query: "How do you write a single-line comment in Cairo?",
    expected: {
      search_terms: ["comments", "//", "syntax"],
      resources: ["cairo_book", "cairo_by_example"]
    }
  },
  {
    query: "How do you create an array with initial values in Cairo?",
    expected: {
      search_terms: ["array!", "arrays", "collections"],
      resources: ["cairo_book", "corelib_docs", "cairo_by_example"]
    }
  },
  {
    query: "Why can’t you mutate an array after it has been moved?",
    expected: {
      search_terms: ["ownership", "move semantics", "arrays", "immutability"],
      resources: ["cairo_book"]
    }
  },
  {
    query: "How do you safely access the first element of an array in Cairo?",
    expected: {
      search_terms: ["get", "Option", "arrays"],
      resources: ["cairo_book", "corelib_docs"]
    }
  },
  {
    query: "What is the purpose of the `Felt252Dict` type in Cairo?",
    expected: {
      search_terms: ["Felt252Dict", "dictionaries", "mutable data"],
      resources: ["cairo_book", "corelib_docs"]
    }
  },
  {
    query: "How do you insert a key-value pair into a `Felt252Dict`?",
    expected: {
      search_terms: ["insert", "Felt252Dict", "key-value"],
      resources: ["cairo_book", "corelib_docs", "cairo_by_example"]
    }
  },
  {
    query: "What happens when you access a non-existent key in a `Felt252Dict`?",
    expected: {
      search_terms: ["get", "Felt252Dict", "default value"],
      resources: ["cairo_book", "corelib_docs"]
    }
  },
  {
    query: "How do you use a `for` loop to iterate over a range in Cairo?",
    expected: {
      search_terms: ["for", "range", "iteration"],
      resources: ["cairo_book", "cairo_by_example"]
    }
  },
  {
    query: "What is the difference between `loop` and `while` in Cairo?",
    expected: {
      search_terms: ["loop", "while", "control flow", "break"],
      resources: ["cairo_book"]
    }
  },
  {
    query: "How do you define a struct with two fields in Cairo?",
    expected: {
      search_terms: ["struct", "fields", "data structure"],
      resources: ["cairo_book", "cairo_by_example"]
    }
  },
  {
    query: "What does the `#[derive(Copy, Drop)]` attribute do in Cairo?",
    expected: {
      search_terms: ["derive", "Copy", "Drop", "traits"],
      resources: ["cairo_book"]
    }
  },
  {
    query: "How do you define a method for a struct in Cairo?",
    expected: {
      search_terms: ["impl", "method syntax", "self"],
      resources: ["cairo_book", "cairo_by_example"]
    }
  },
  {
    query: "How do you declare a Starknet smart contract in Cairo?",
    expected: {
      search_terms: ["#[starknet::contract]", "mod", "smart contracts", "Starknet"],
      resources: ["cairo_book"]
    }
  },
  {
    query: "What is the purpose of the `#[storage]` attribute in a Starknet contract?",
    expected: {
      search_terms: ["#[storage]", "struct", "state", "smart contracts"],
      resources: ["cairo_book"]
    }
  },
  {
    query: "How do you define an external function in a Starknet contract?",
    expected: {
      search_terms: ["#[external(v0)]", "#[abi(embed_v0)]", "impl", "smart contracts"],
      resources: ["cairo_book"]
    }
  },
  {
    query: "What is the role of `ContractState` in a Starknet contract?",
    expected: {
      search_terms: ["ContractState", "state", "smart contracts"],
      resources: ["cairo_book"]
    }
  },
  {
    query: "How do you define an interface for a Starknet contract?",
    expected: {
      search_terms: ["#[starknet::interface]", "trait", "smart contracts", "ABI"],
      resources: ["cairo_book"]
    }
  },
  {
    query: "What happens if you omit `ref` in a function that modifies storage?",
    expected: {
      search_terms: ["ref", "ContractState", "storage", "compile error"],
      resources: ["cairo_book"]
    }
  },
  {
    query: "How do you emit an event in a Starknet contract?",
    expected: {
      search_terms: ["#[event]", "emit", "smart contracts", "Starknet"],
      resources: ["cairo_book"]
    }
  },
  {
    query: "What is the difference between a Cairo program and a Starknet smart contract?",
    expected: {
      search_terms: ["Cairo program", "smart contract", "state", "Starknet"],
      resources: ["cairo_book", "starknet_docs"]
    }
  },
  {
    query: "How do you call another contract’s function from a Starknet contract?",
    expected: {
      search_terms: ["contract address", "dispatcher", "interfaces", "smart contracts"],
      resources: ["cairo_book"]
    }
  },
  {
    query: "What is the purpose of the `#[generate_trait]` attribute?",
    expected: {
      search_terms: ["#[generate_trait]", "traits", "code generation"],
      resources: ["cairo_book"]
    }
  },
  {
    query: "How do you make a function in a module visible to other modules?",
    expected: {
      search_terms: ["pub", "modules", "visibility"],
      resources: ["cairo_book"]
    }
  },
  {
    query: "What is the purpose of the `use` keyword in Cairo?",
    expected: {
      search_terms: ["use", "import", "scope"],
      resources: ["cairo_book", "cairo_by_example"]
    }
  },
  {
    query: "How do you create a generic struct in Cairo?",
    expected: {
      search_terms: ["struct", "generics", "type parameters"],
      resources: ["cairo_book", "cairo_by_example"]
    }
  },
  {
    query: "How do you implement a trait for a generic type in Cairo?",
    expected: {
      search_terms: ["impl", "trait", "generics", "trait bounds"],
      resources: ["cairo_book"]
    }
  },
  {
    query: "What is the difference between snapshots and references in Cairo?",
    expected: {
      search_terms: ["snapshots", "references", "ownership", "immutability"],
      resources: ["cairo_book", "cairo_by_example"]
    }
  },
  {
    query: "What is the difference between a contract call and a library call in Starknet?",
    expected: {
      search_terms: ["contract call", "library call", "state", "class hash"],
      resources: ["cairo_book", "starknet_docs"]
    }
  },
  {
    query: "What is the purpose of a constructor in a Starknet contract, and how is it defined?",
    expected: {
      search_terms: ["constructor", "#[constructor]", "state initialization"],
      resources: ["cairo_book"]
    }
  },
  {
    query: "What are the visibility modifiers for functions in a Starknet contract?",
    expected: {
      search_terms: ["visibility", "#[external(v0)]", "#[abi(embed_v0)]", "internal"],
      resources: ["cairo_book"]
    }
  },
  {
    query: "What is a negative implementation, and when is it useful?",
    expected: {
      search_terms: ["negative impl", "traits", "type constraints"],
      resources: ["cairo_book"]
    }
  },
  {
    query: "What are associated items in a Cairo trait?",
    expected: {
      search_terms: ["associated items", "traits", "associated types", "associated functions"],
      resources: ["cairo_book", "cairo_by_example"]
    }
  },
  {
    query: "What is a storage node in Cairo, and how is it used?",
    expected: {
      search_terms: ["storage node", "struct", "storage", "mappings"],
      resources: ["cairo_book"]
    }
  },
  {
    query: "What are the benefits of using components in a Starknet contract?",
    expected: {
      search_terms: ["components", "reusability", "modularity"],
      resources: ["cairo_book", "openzeppelin_docs"]
    }
  },
  {
    query: "How do you integrate a component into a Starknet contract?",
    expected: {
      search_terms: ["component!()", "storage", "events"],
      resources: ["cairo_book", "openzeppelin_docs"]
    }
  },
  {
    query: "How do you call a component’s function within a contract?",
    expected: {
      search_terms: ["component", "dispatcher", "ComponentState"],
      resources: ["cairo_book", "openzeppelin_docs"]
    }
  },
  {
    query: "What are the steps to upgrade a Starknet contract?",
    expected: {
      search_terms: ["upgrade", "replace_class_syscall", "class hash"],
      resources: ["cairo_book", "starknet_docs", "openzeppelin_docs"]
    }
  },
  {
    query: "What does the `?` operator do in Cairo?",
    expected: {
      search_terms: ["?", "Result", "Option", "error propagation"],
      resources: ["cairo_book", "corelib_docs", "cairo_by_example"]
    }
  },
  {
    query: "How does `#[should_panic]` work in Cairo testing?",
    expected: {
      search_terms: ["#[should_panic]", "testing", "panic"],
      resources: ["cairo_book", "starknet_foundry"]
    }
  },
  {
    query: "What is the purpose of the `#[cfg(test)]` attribute?",
    expected: {
      search_terms: ["#[cfg(test)]", "testing", "conditional compilation"],
      resources: ["cairo_book", "starknet_foundry", "cairo_by_example"]
    }
  },
  {
    query: "What is the difference between unit tests and integration tests in Cairo?",
    expected: {
      search_terms: ["unit tests", "integration tests", "testing"],
      resources: ["cairo_book", "starknet_foundry"]
    }
  },
  {
    query: "How can you test private functions in Cairo?",
    expected: {
      search_terms: ["private functions", "testing", "module visibility"],
      resources: ["cairo_book", "starknet_foundry"]
    }
  },
  {
    query: "How do you test a Starknet contract by deploying and interacting with it?",
    expected: {
      search_terms: ["deploy", "testing", "dispatcher", "Foundry"],
      resources: ["cairo_book", "starknet_foundry"]
    }
  },
  {
    query: "How do you add a dependency to a Cairo project?",
    expected: {
      search_terms: ["Scarb.toml", "dependencies", "package manager"],
      resources: ["cairo_book", "scarb_docs"]
    }
  },
  {
    query: "How are storage slots identified in a Starknet contract?",
    expected: {
      search_terms: ["storage", "storage slot", "storage address"],
      resources: ["cairo_book"]
    }
  },
  {
    query: "What are the benefits of using a ZK-ISA in Cairo?",
    expected: {
      search_terms: ["ZK-ISA", "STARKs", "efficiency"],
      resources: ["cairo_book", "starknet_docs"]
    }
  },
  {
    query: "What types of procedural macros exist in Cairo?",
    expected: {
      search_terms: ["procedural macros", "derive macros", "attribute-like macros", "function-like macros"],
      resources: ["cairo_book", "cairo_by_example"]
    }
  },
  {
    query: "How do you pack multiple small integers into a larger integer in Cairo?",
    expected: {
      search_terms: ["bit-packing", "bitwise operators", "storage optimization"],
      resources: ["cairo_book", "cairo_by_example", "corelib_docs"]
    }
  },
  {
    query: "When should you use bit-packing in a Starknet contract?",
    expected: {
      search_terms: ["bit-packing", "storage optimization", "gas costs"],
      resources: ["cairo_book", "cairo_by_example", "corelib_docs"]
    }
  },
  {
    query: "How does the `#[flat]` attribute affect events in Starknet?",
    expected: {
      search_terms: ["#[flat]", "events", "composability"],
      resources: ["cairo_book"]
    }
  },
  {
    query: "What is the role of the `#[key]` attribute in Starknet events?",
    expected: {
      search_terms: ["#[key]", "events", "indexed fields"],
      resources: ["cairo_book", "starknet_docs"]
    }
  },
  {
    query: "How does the Cairo compiler enforce `nopanic` function safety?",
    expected: {
      search_terms: ["nopanic", "compile-time checks", "panic"],
      resources: ["cairo_book"]
    }
  },
  {
    query: "How does Cairo’s write-once memory model affect mutable data structures?",
    expected: {
      search_terms: ["immutable memory", "mutable data structures", "Felt252Dict"],
      resources: ["cairo_book"]
    }
  },
  {
    query: "What is the role of `ComponentState` in Starknet components?",
    expected: {
      search_terms: ["ComponentState", "components", "storage access"],
      resources: ["cairo_book", "openzeppelin_docs"]
    }
  },
  {
    query: "When should you use a library call instead of a contract call?",
    expected: {
      search_terms: ["library call", "contract call", "state", "gas costs"],
      resources: ["cairo_book", "starknet_docs"]
    }
  },
  {
    query: "What architectural pattern does OpenZeppelin Contracts for Cairo use?",
    expected: {
      search_terms: ["components", "architecture", "design pattern"],
      resources: ["openzeppelin_docs"]
    }
  },
  {
    query: "How does the component model in Cairo contracts differ from the inheritance model in Solidity contracts?",
    expected: {
      search_terms: ["components", "inheritance", "Solidity comparison"],
      resources: ["openzeppelin_docs", "cairo_book"]
    }
  },
  {
    query: "How do you customize the behavior of a component in OpenZeppelin Contracts for Cairo?",
    expected: {
      search_terms: ["customization", "hooks", "custom implementations"],
      resources: ["openzeppelin_docs", "cairo_book"]
    }
  },
  {
    query: "How do you implement ERC20 token with OpenZeppelin Contracts for Cairo?",
    expected: {
      search_terms: ["ERC20", "token implementation", "ERC20Component"],
      resources: ["openzeppelin_docs", "cairo_book"]
    }
  },
  {
    query: "What are the supported decimals configuration options for ERC20 tokens?",
    expected: {
      search_terms: ["ERC20", "decimals", "configuration"],
      resources: ["openzeppelin_docs"]
    }
  },
  {
    query: "How does Cairo handle method naming conventions in smart contracts?",
    expected: {
      search_terms: ["naming conventions", "interfaces", "snake_case", "camelCase"],
      resources: ["openzeppelin_docs", "cairo_book"]
    }
  },
  {
    query: "How do you implement access control in OpenZeppelin Contracts for Cairo?",
    expected: {
      search_terms: ["access control", "OwnableComponent", "AccessControlComponent"],
      resources: ["openzeppelin_docs", "cairo_book"]
    }
  },
  {
    query: "What security components are available in OpenZeppelin Contracts for Cairo?",
    expected: {
      search_terms: ["security", "Initializable", "Pausable", "ReentrancyGuard"],
      resources: ["openzeppelin_docs"]
    }
  },
  {
    query: "How does contract upgradeability work in Starknet compared to EVM chains?",
    expected: {
      search_terms: ["upgrades", "replace_class", "proxy patterns"],
      resources: ["openzeppelin_docs", "starknet_docs"]
    }
  },
  {
    query: "What is the purpose of the Votes component in OpenZeppelin Contracts for Cairo?",
    expected: {
      search_terms: ["governance", "voting", "delegation"],
      resources: ["openzeppelin_docs"]
    }
  },
  {
    query: "How do you implement on-chain governance with OpenZeppelin Contracts for Cairo?",
    expected: {
      search_terms: ["governance", "Governor", "proposals", "voting"],
      resources: ["openzeppelin_docs"]
    }
  },
  {
    query: "What is the purpose of the Timelock Controller in governance systems?",
    expected: {
      search_terms: ["governance", "timelock", "execution delay"],
      resources: ["openzeppelin_docs"]
    }
  },
  {
    query: "How do you implement a Multisig wallet with OpenZeppelin Contracts for Cairo?",
    expected: {
      search_terms: ["multisig", "multiple signers", "quorum"],
      resources: ["openzeppelin_docs"]
    }
  },
  {
    query: "How does token URI work in the ERC721 implementation?",
    expected: {
      search_terms: ["ERC721", "token URI", "metadata"],
      resources: ["openzeppelin_docs"]
    }
  },
  {
    query: "What is the purpose of the SRC5 introspection standard?",
    expected: {
      search_terms: ["SRC5", "introspection", "interface detection"],
      resources: ["openzeppelin_docs", "starknet_docs"]
    }
  },
  {
    query: "How do you implement ERC1155 multi-token standard with OpenZeppelin Contracts for Cairo?",
    expected: {
      search_terms: ["ERC1155", "multi-token", "fungible and non-fungible"],
      resources: ["openzeppelin_docs"]
    }
  },
  {
    query: "What testing utilities does OpenZeppelin provide for Cairo contracts?",
    expected: {
      search_terms: ["testing", "Starknet Foundry", "test utilities"],
      resources: ["openzeppelin_docs", "starknet_foundry"]
    }
  },
  {
    query: "How do you implement the Permit extension for ERC20 tokens?",
    expected: {
      search_terms: ["ERC20", "permit", "signatures"],
      resources: ["openzeppelin_docs"]
    }
  },
  {
    query: "What is the Universal Deployer Contract (UDC) and how is it used?",
    expected: {
      search_terms: ["UDC", "deployment", "contracts"],
      resources: ["openzeppelin_docs", "cairo_book"]
    }
  },
  {
    query: "How do you implement safe transfers in ERC721?",
    expected: {
      search_terms: ["ERC721", "safe transfer", "receiver contracts"],
      resources: ["openzeppelin_docs"]
    }
  },
  {
    query: "What are the security considerations when upgrading contracts?",
    expected: {
      search_terms: ["upgrades", "security", "storage"],
      resources: ["openzeppelin_docs", "cairo_book"]
    }
  },
  {
    query: "How does the Pausable component work to provide emergency stop functionality?",
    expected: {
      search_terms: ["security", "Pausable", "emergency stop"],
      resources: ["openzeppelin_docs"]
    }
  },
  {
    query: "What is the difference between OwnableComponent and AccessControlComponent?",
    expected: {
      search_terms: ["access control", "ownership", "roles"],
      resources: ["openzeppelin_docs"]
    }
  },
  {
    query: "How do you implement custom token supply mechanisms in ERC20?",
    expected: {
      search_terms: ["ERC20", "supply", "minting", "burning"],
      resources: ["openzeppelin_docs"]
    }
  },
  {
    query: "How do you use the Initializable component to secure contract initialization?",
    expected: {
      search_terms: ["security", "initialization", "constructor alternative"],
      resources: ["openzeppelin_docs"]
    }
  },
  {
    query: "What is account abstraction in Starknet?",
    expected: {
      search_terms: ["account abstraction", "account contracts", "smart accounts"],
      resources: ["starknet_docs"]
    }
  },
  {
    query: "How are account contracts deployed in Starknet?",
    expected: {
      search_terms: ["account deployment", "Universal Deployer", "DEPLOY_ACCOUNT"],
      resources: ["starknet_docs", "cairo_book"]
    }
  },
  {
    query: "What functions must a Starknet account contract implement?",
    expected: {
      search_terms: ["account interface", "required functions", "validation"],
      resources: ["starknet_docs", "cairo_book"]
    }
  },
  {
    query: "What is Cairo and Sierra in the context of Starknet?",
    expected: {
      search_terms: ["Cairo", "Sierra", "compilation", "smart contracts"],
      resources: ["starknet_docs", "cairo_book"]
    }
  },
  {
    query: "How are contract classes and instances separated in Starknet?",
    expected: {
      search_terms: ["contract class", "contract instance", "class hash", "deployment"],
      resources: ["starknet_docs"]
    }
  },
  {
    query: "What hash functions are available in Starknet?",
    expected: {
      search_terms: ["hash functions", "Pedersen", "Poseidon", "Starknet Keccak"],
      resources: ["starknet_docs", "corelib_docs"]
    }
  },
  {
    query: "How is the Starknet state structured?",
    expected: {
      search_terms: ["state", "Merkle-Patricia tries", "state commitment"],
      resources: ["starknet_docs"]
    }
  },
  {
    query: "What is the transaction flow in Starknet?",
    expected: {
      search_terms: ["transaction flow", "validation", "execution", "fee mechanism"],
      resources: ["starknet_docs"]
    }
  },
  {
    query: "How does L1-L2 messaging work in Starknet?",
    expected: {
      search_terms: ["L1-L2 messaging", "L1 handler", "messaging mechanism"],
      resources: ["starknet_docs", "cairo_book"]
    }
  },
  {
    query: "What is the STRK token and its utility?",
    expected: {
      search_terms: ["STRK", "native token", "token economics"],
      resources: ["starknet_docs"]
    }
  },
  {
    query: "How does staking work in Starknet?",
    expected: {
      search_terms: ["staking", "validators", "delegation", "rewards"],
      resources: ["starknet_docs"]
    }
  },
  {
    query: "What is the minting curve formula for Starknet staking rewards?",
    expected: {
      search_terms: ["minting curve", "staking rewards", "token inflation"],
      resources: ["starknet_docs"]
    }
  },
  {
    query: "How does the StarkGate bridge work?",
    expected: {
      search_terms: ["StarkGate", "bridge", "token bridging", "L1-L2"],
      resources: ["starknet_docs"]
    }
  },
  {
    query: "What is the withdrawal process from Starknet to Ethereum?",
    expected: {
      search_terms: ["withdrawal", "L2-L1", "bridge", "finalization"],
      resources: ["starknet_docs"]
    }
  },
  {
    query: "What is a class hash in Starknet?",
    expected: {
      search_terms: ["class hash", "contract classes", "declaration"],
      resources: ["starknet_docs", "cairo_book"]
    }
  },
  {
    query: "What is a compiled class hash in Starknet?",
    expected: {
      search_terms: ["compiled class hash", "CASM", "Sierra", "compilation"],
      resources: ["starknet_docs", "cairo_book"]
    }
  },
  {
    query: "How are contract addresses determined in Starknet?",
    expected: {
      search_terms: ["contract address", "address calculation", "deployment"],
      resources: ["starknet_docs", "cairo_book"]
    }
  },
  {
    query: "What are the main development tools for Starknet?",
    expected: {
      search_terms: ["development tools", "Scarb", "Starknet Foundry", "Starkli"],
      resources: ["starknet_docs", "scarb_docs", "starknet_foundry", "cairo_book"]
    }
  },
  {
    query: "How can I set up a local Starknet development environment?",
    expected: {
      search_terms: ["development environment", "devnet", "setup"],
      resources: ["starknet_docs", "scarb_docs", "starknet_foundry"]
    }
  },
  {
    query: "What frameworks exist for building dApps on Starknet?",
    expected: {
      search_terms: ["dApp development", "frameworks", "frontend"],
      resources: ["starknet_docs"]
    }
  },
  {
    query: "How does the fee mechanism work in Starknet?",
    expected: {
      search_terms: ["fee mechanism", "gas", "transaction fees"],
      resources: ["starknet_docs"]
    }
  },
  {
    query: "What wallets support Starknet?",
    expected: {
      search_terms: ["wallets", "account contracts", "user interface"],
      resources: ["starknet_docs"]
    }
  },
  {
    query: "How do system calls work in Cairo contracts?",
    expected: {
      search_terms: ["system calls", "contract interaction", "OS"],
      resources: ["starknet_docs", "cairo_book"]
    }
  },
  {
    query: "What is data availability in Starknet?",
    expected: {
      search_terms: ["data availability", "state updates", "volition"],
      resources: ["starknet_docs"]
    }
  },
  {
    query: "How do Starknet full nodes work?",
    expected: {
      search_terms: ["full nodes", "synchronization", "state management"],
      resources: ["starknet_docs"]
    }
  },
  {
    query: "What is the SHARP prover system in Starknet?",
    expected: {
      search_terms: ["SHARP", "provers", "STARK proofs", "verification"],
      resources: ["starknet_docs"]
    }
  },
  {
    query: "How can I implement a custom ERC20 token with minting capabilities using OpenZeppelin, and test it with Foundry?",
    chat_history: "I'm building a token contract on Starknet.",
    expected: {
      search_terms: ["ERC20 mintable", "OpenZeppelin ERC20Component", "mint function", "testing ERC20 Foundry", "deploy token test"],
      resources: ["openzeppelin_docs", "starknet_foundry", "cairo_book"]
    }
  },
  {
    query: "Explain how to use Scarb to add OpenZeppelin as a dependency and compile a contract that uses AccessControl.",
    expected: {
      search_terms: ["Scarb add dependency", "OpenZeppelin Scarb.toml", "AccessControlComponent", "compile with Scarb"],
      resources: ["scarb_docs", "openzeppelin_docs"]
    }
  },
  {
    query: "What's the best way to handle errors in a Cairo function that interacts with Starknet storage?",
    chat_history: "I've been getting panics when reading non-existent keys.",
    expected: {
      search_terms: ["error handling Cairo", "Result Option types", "storage read panic", "Felt252Dict errors"],
      resources: ["cairo_book", "corelib_docs", "starknet_docs"]
    }
  },
  {
    query: "How do I deploy a contract using Starkli and then upgrade it later?",
    expected: {
      search_terms: ["Starkli deploy contract", "upgrade contract Starknet", "replace_class syscall"],
      resources: ["starknet_docs", "openzeppelin_docs"]
    }
  },
  {
    query: "Can you show how to use bitwise operations for packing data in storage to save gas?",
    chat_history: "Optimizing a contract with many small uints.",
    expected: {
      search_terms: ["bitwise packing Cairo", "storage optimization gas", "bit shift AND OR"],
      resources: ["cairo_book", "cairo_by_example", "starknet_docs"]
    }
  },
  {
    query: "Integrate an OZ Pausable component into my contract and write a test to verify pausing.",
    expected: {
      search_terms: ["PausableComponent OpenZeppelin", "pause unpause functions", "testing pausable Foundry"],
      resources: ["openzeppelin_docs", "starknet_foundry"]
    }
  },
  {
    query: "What's the difference between Pedersen and Poseidon hashes, and when to use each in contracts?",
    expected: {
      search_terms: ["Pedersen hash vs Poseidon", "hash functions Starknet", "ZK efficiency security"],
      resources: ["starknet_docs", "corelib_docs"]
    }
  },
  {
    query: "Set up a multisig account on Starknet using OZ, including signature validation.",
    expected: {
      search_terms: ["MultisigComponent OpenZeppelin", "account abstraction multisig", "signature validation __validate__"],
      resources: ["openzeppelin_docs", "starknet_docs"]
    }
  },
  {
    query: "How to bridge ETH to Starknet using StarkGate and then swap it in a contract call?",
    chat_history: "New to bridging.",
    expected: {
      search_terms: ["StarkGate deposit ETH", "bridge L1 to L2", "contract call after bridge"],
      resources: ["starknet_docs"]
    }
  },
  {
    query: "Implement a governance token with voting delegation using OZ Votes component.",
    expected: {
      search_terms: ["VotesComponent delegation", "governance token OZ", "snapshot voting"],
      resources: ["openzeppelin_docs"]
    }
  },
  {
    query: "Use Scarb to build a project with multiple crates and Starknet contracts.",
    expected: {
      search_terms: ["Scarb multi-crate project", "workspace Scarb.toml", "Starknet contracts build"],
      resources: ["scarb_docs", "cairo_book"]
    }
  },
  {
    query: "How does the Cairo VM handle memory allocation for dynamic structures like arrays?",
    expected: {
      search_terms: ["Cairo VM memory model", "array allocation", "write-once memory"],
      resources: ["cairo_book", "corelib_docs"]
    }
  },
  {
    query: "Test L1-L2 messaging in Foundry by mocking the L1 handler.",
    expected: {
      search_terms: ["L1 handler testing Foundry", "mock L1 message", "messaging syscalls test"],
      resources: ["starknet_foundry", "starknet_docs"]
    }
  },
  {
    query: "Create a custom trait for a generic enum and implement it for multiple types.",
    chat_history: "Working with enums in traits.",
    expected: {
      search_terms: ["generic trait enum", "impl for enum", "trait bounds generics"],
      resources: ["cairo_book", "cairo_by_example"]
    }
  },
  {
    query: "What are the gas costs for different syscalls in Starknet, like get_block_number?",
    expected: {
      search_terms: ["syscalls gas costs", "get_block_number cost", "Starknet execution fees"],
      resources: ["starknet_docs"]
    }
  },
  {
    query: "How to use the corelib's Array<T> in a contract function with snapshots.",
    expected: {
      search_terms: ["Array<T> corelib", "snapshots arrays", "contract function arrays"],
      resources: ["corelib_docs", "cairo_book"]
    }
  },
  {
    query: "Deploy an ERC721 NFT contract with metadata using OZ and set base URI.",
    expected: {
      search_terms: ["ERC721Component OZ", "token URI base", "NFT metadata setup"],
      resources: ["openzeppelin_docs"]
    }
  },
  {
    query: "Explain the role of Sierra in the compilation pipeline and how to generate it with Scarb.",
    expected: {
      search_terms: ["Sierra compilation", "Cairo to Sierra", "Scarb generate Sierra"],
      resources: ["starknet_docs", "scarb_docs", "cairo_book"]
    }
  },
  {
    query: "Implement reentrancy protection in a contract using OZ ReentrancyGuard.",
    chat_history: "Worried about reentrancy attacks.",
    expected: {
      search_terms: ["ReentrancyGuardComponent", "non_reentrant modifier", "security reentrancy"],
      resources: ["openzeppelin_docs", "cairo_book"]
    }
  },
  {
    query: "How to stake STRK tokens as a delegator and claim rewards?",
    expected: {
      search_terms: ["STRK staking delegation", "claim rewards Starknet", "staking pools"],
      resources: ["starknet_docs"]
    }
  },
  {
    query: "Use cairo_by_example to find a snippet for a simple loop that sums an array.",
    expected: {
      search_terms: ["loop sum array example", "Cairo loop snippet", "array iteration code"],
      resources: ["cairo_by_example"]
    }
  },
  {
    query: "What's the process for proposing and voting on Starknet governance changes?",
    expected: {
      search_terms: ["Starknet governance proposals", "voting process"],
      resources: ["starknet_docs"]
    }
  },
  {
    query: "Integrate OZ Initializable with a constructor to prevent reinitialization attacks.",
    expected: {
      search_terms: ["InitializableComponent", "one-time init", "constructor security"],
      resources: ["openzeppelin_docs"]
    }
  },
  {
    query: "How to debug a failing test in Foundry using print statements and cheatcodes?",
    chat_history: "My test is panicking unexpectedly.",
    expected: {
      search_terms: ["Foundry debug test", "print cheatcode", "spy events debug"],
      resources: ["starknet_foundry", "cairo_book"]
    }
  },
  {
    query: "Calculate the class hash for a contract manually in Cairo code.",
    expected: {
      search_terms: ["class hash calculation", "compute class hash Cairo", "Sierra class hash"],
      resources: ["starknet_docs", "corelib_docs", "cairo_book"]
    }
  },
  {
    query: "Implement a library call to reuse code from another contract without changing state.",
    expected: {
      search_terms: ["library_call syscall", "reuse code Starknet", "state isolation library"],
      resources: ["starknet_docs", "cairo_book", "corelib_docs"]
    }
  },
  {
    query: "How does the Volition data availability mode work, and how to choose between rollup and validium?",
    expected: {
      search_terms: ["Volition DA mode", "rollup vs validium", "data availability choice"],
      resources: ["starknet_docs"]
    }
  },
  {
    query: "Set up a full node with Pathfinder and sync it to mainnet.",
    expected: {
      search_terms: ["Pathfinder full node setup", "sync mainnet node", "Starknet node config"],
      resources: ["starknet_docs"]
    }
  },
  {
    query: "Use the permit extension for gasless approvals in an ERC20 token.",
    expected: {
      search_terms: ["ERC20PermitComponent", "gasless permit", "EIP-2612 Cairo"],
      resources: ["openzeppelin_docs"]
    }
  },
  {
    query: "What's the minting curve and how does it affect STRK inflation based on staking rate?",
    chat_history: "Trying to model token economics.",
    expected: {
      search_terms: ["minting curve formula", "STRK inflation staking", "reward calculation"],
      resources: ["starknet_docs"]
    }
  },
  {
    query: "Implement safe transfer for ERC1155 tokens with batch operations.",
    expected: {
      search_terms: ["ERC1155 safeBatchTransferFrom", "multi-token safe transfer", "receiver check"],
      resources: ["openzeppelin_docs"]
    }
  },
  {
    query: "How to use Scarb to target different Starknet versions in compilation.",
    expected: {
      search_terms: ["Scarb target Starknet version", "compilation flags version", "Scarb.toml config"],
      resources: ["scarb_docs", "cairo_book"]
    }
  },
  {
    query: "Test account abstraction by deploying a custom account contract and validating signatures.",
    expected: {
      search_terms: ["custom account test Foundry", "signature validation test", "__validate__ mock"],
      resources: ["starknet_foundry", "starknet_docs"]
    }
  },
  {
    query: "What's the role of SHARP in proving batches and how does it integrate with Ethereum?",
    expected: {
      search_terms: ["SHARP prover batches", "STARK proof Ethereum", "verification L1"],
      resources: ["starknet_docs"]
    }
  },
  {
    query: "Create a generic function that works with any Copy type and uses trait bounds.",
    expected: {
      search_terms: ["generic function Copy trait", "trait bounds syntax", "impl generic"],
      resources: ["cairo_book", "cairo_by_example"]
    }
  },
  {
    query: "How to emit indexed events with keys for efficient querying.",
    chat_history: "Need better event filtering.",
    expected: {
      search_terms: ["#[key] event attribute", "indexed events Starknet", "query events keys"],
      resources: ["cairo_book", "starknet_docs"]
    }
  },
  {
    query: "Use corelib's math functions for safe arithmetic to prevent overflows.",
    expected: {
      search_terms: ["safe math corelib", "overflow prevention", "checked add mul"],
      resources: ["corelib_docs", "cairo_book"]
    }
  },
  {
    query: "Deploy a contract counterfactually and fund it before activation.",
    expected: {
      search_terms: ["counterfactual deployment", "pre-fund account", "address calculation salt"],
      resources: ["starknet_docs"]
    }
  },
  {
    query: "Implement a timelock for governance proposals with delayed execution.",
    expected: {
      search_terms: ["TimelockController OZ", "delayed execution governance", "proposal timelock"],
      resources: ["openzeppelin_docs"]
    }
  },
  {
    query: "How to run integration tests that interact with multiple deployed contracts in Foundry.",
    expected: {
      search_terms: ["integration tests Foundry", "multi-contract deploy test", "dispatcher interactions"],
      resources: ["starknet_foundry"]
    }
  },
  {
    query: "What's the difference between declare and deploy transactions in Starknet?",
    expected: {
      search_terms: ["declare transaction class", "deploy instance", "class hash vs address"],
      resources: ["starknet_docs"]
    }
  },
  {
    query: "Use negative impl to constrain generics in a trait implementation.",
    expected: {
      search_terms: ["negative impl !Trait", "generic constraints negative", "type exclusion traits"],
      resources: ["cairo_book"]
    }
  },
  {
    query: "How to configure Scarb for custom build profiles and optimization levels.",
    chat_history: "Optimizing for gas.",
    expected: {
      search_terms: ["Scarb build profiles", "optimization flags", "Scarb.toml build config"],
      resources: ["scarb_docs"]
    }
  },
  {
    query: "Implement SRC5 interface detection in a custom contract.",
    expected: {
      search_terms: ["SRC5 introspection", "supports_interface function", "interface IDs"],
      resources: ["openzeppelin_docs", "starknet_docs"]
    }
  },
  {
    query: "Mock syscalls like get_execution_info in unit tests.",
    expected: {
      search_terms: ["mock syscalls Foundry", "get_execution_info cheatcode", "test syscall override"],
      resources: ["starknet_foundry"]
    }
  },
  {
    query: "How does the state commitment work with Merkle tries in Starknet?",
    expected: {
      search_terms: ["state commitment Merkle", "Patricia trie state", "contracts classes tries"],
      resources: ["starknet_docs"]
    }
  },
  {
    query: "Create a dApp frontend that connects to Starknet wallet and calls a contract.",
    expected: {
      search_terms: ["Starknet React hooks", "wallet connection GetStarknet", "call contract frontend"],
      resources: ["starknet_docs"]
    }
  },
  {
    query: "Use associated types in a trait for flexible return types.",
    expected: {
      search_terms: ["associated types trait", "flexible returns trait", "trait associated items"],
      resources: ["cairo_book"]
    }
  },
  {
    query: "What's the withdrawal limit mechanism in StarkGate for security?",
    chat_history: "Concerned about bridge risks.",
    expected: {
      search_terms: ["StarkGate withdrawal limits", "bridge security measures", "L2 to L1 limits"],
      resources: ["starknet_docs"]
    }
  },
  {
    query: "Implement a nopanic function that does safe division without panicking.",
    expected: {
      search_terms: ["nopanic attribute", "safe division no panic", "compile-time no panic"],
      resources: ["cairo_book"]
    }
  },
  {
    query: "How to use the UDC for deterministic deployments in scripts.",
    expected: {
      search_terms: ["UDC deploy deterministic", "Universal Deployer address", "salt class hash deploy"],
      resources: ["starknet_docs", "openzeppelin_docs"]
    }
  },
  {
    query: "Combine OZ components for an upgradable ERC20 with access control.",
    expected: {
      search_terms: ["UpgradeableComponent ERC20", "Ownable access OZ", "component composition"],
      resources: ["openzeppelin_docs", "cairo_book"]
    }
  },
  {
    query: "Test event emissions in a contract using Foundry spy.",
    expected: {
      search_terms: ["event testing Foundry", "spy events cheatcode", "assert event emitted"],
      resources: ["starknet_foundry", "cairo_book"]
    }
  },
  {
    query: "How to handle ByteArray in storage for large strings.",
    expected: {
      search_terms: ["ByteArray storage", "large strings Cairo", "storage node ByteArray"],
      resources: ["cairo_book", "corelib_docs"]
    }
  },
  {
    query: "What's the role of the sequencer in Starknet transaction processing?",
    expected: {
      search_terms: ["sequencer role Starknet", "transaction ordering", "block production sequencer"],
      resources: ["starknet_docs"]
    }
  },
  {
    query: "Implement a flat event structure for composability in components.",
    expected: {
      search_terms: ["#[flat] event", "composable events components", "event serialization flat"],
      resources: ["cairo_book", "openzeppelin_docs"]
    }
  },
  {
    query: "How to migrate data during a contract upgrade.",
    expected: {
      search_terms: ["data migration upgrade", "storage compatibility upgrade", "upgrade hook data"],
      resources: ["openzeppelin_docs", "cairo_book"]
    }
  },
  {
    query: "Set up Devnet for local testing with pre-deployed accounts.",
    expected: {
      search_terms: ["Starknet Devnet setup", "pre-deployed accounts devnet", "local network config"],
      resources: ["starknet_docs", "starknet_foundry"]
    }
  },
  {
    query: "Implement associated functions in a trait without self.",
    expected: {
      search_terms: ["associated functions trait", "static methods trait", "no self trait functions"],
      resources: ["cairo_book"]
    }
  },
  {
    query: "How does fee payment work with STRK vs ETH in transactions?",
    expected: {
      search_terms: ["fee payment STRK ETH", "transaction fees token", "burn convert fees"],
      resources: ["starknet_docs"]
    }
  }
];
