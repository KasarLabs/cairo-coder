import { AVAILABLE_RESOURCES } from '../../core/programs/retrieval.program';

export type RetrievalExample = {
  // The user"s query.
  query: string;
  // Optional chat history for context.
  chat_history?: string;
  // The ground truth we are comparing against.
  expected: {
    // The ideal search terms. Order does not matter.
    search_terms: string[];
    // The ideal resources to search.
    resources: (typeof AVAILABLE_RESOURCES)[number][];
    // The ideal reformulated query.
    reformulatedQuery: string;
  };
};

export const retrievalDataset: RetrievalExample[] = [
  {
    query: 'How do you declare a mutable variable in Cairo?',
    expected: {
      search_terms: ['let keyword', 'mut', 'variables', 'immutability'],
      resources: ['cairo_book', 'cairo_by_example'],
      reformulatedQuery: 'Defining a mutable variable in Cairo.',
    },
  },
  {
    query:
      'What happens if you try to reassign a variable declared without `mut`?',
    expected: {
      search_terms: ['immutability', 'let keyword', 'compile error'],
      resources: ['cairo_book', 'cairo_by_example'],
      reformulatedQuery:
        'Reassigning a variable declared without `mut` in Cairo.',
    },
  },
  {
    query:
      'What is the default data type if no type is specified, and how does it behave with division?',
    expected: {
      search_terms: ['felt252', 'field elements', 'division', 'type inference'],
      resources: ['cairo_book', 'cairo_by_example'],
      reformulatedQuery:
        'Default data type in the Cairo Programming Language. Cairo felt252 type.',
    },
  },
  {
    query: 'How do you declare an unsigned 8-bit integer in Cairo?',
    expected: {
      search_terms: ['u8', 'integer types', 'type annotation'],
      resources: ['cairo_book', 'cairo_by_example'],
      reformulatedQuery:
        'Declaring an unsigned 8-bit u8 type integer in Cairo.',
    },
  },
  {
    query: 'What is the range of values for an `i128` type?',
    expected: {
      search_terms: ['i128', 'signed integers', 'range'],
      resources: ['cairo_book', 'corelib_docs'],
      reformulatedQuery:
        'What is the minimum and maximum value for an i128 type in Cairo?',
    },
  },
  {
    query: 'How do you define a function with a generic type parameter?',
    expected: {
      search_terms: ['fn keyword', 'generics', 'type parameters'],
      resources: ['cairo_book', 'cairo_by_example'],
      reformulatedQuery:
        'Defining a function with a generic type parameter in Cairo.',
    },
  },
  {
    query: 'What keyword is used to declare a function in Cairo?',
    expected: {
      search_terms: ['fn keyword', 'function declaration'],
      resources: ['cairo_book', 'cairo_by_example'],
      reformulatedQuery: 'What keyword is used to declare a function in Cairo?',
    },
  },
  {
    query: 'How do you write a single-line comment in Cairo?',
    expected: {
      search_terms: ['comments', '//', 'syntax'],
      resources: ['cairo_book', 'cairo_by_example'],
      reformulatedQuery: 'Writing a single-line comment in Cairo.',
    },
  },
  {
    query: 'How do you create an array with initial values in Cairo?',
    expected: {
      search_terms: ['array!', 'arrays', 'collections'],
      resources: ['cairo_book', 'corelib_docs', 'cairo_by_example'],
      reformulatedQuery:
        'Constructor method for creating an array with initial values in Cairo.',
    },
  },
  {
    query: 'Why can’t you mutate an array after it has been moved?',
    expected: {
      search_terms: ['ownership', 'move semantics', 'arrays', 'immutability'],
      resources: ['cairo_book'],
      reformulatedQuery:
        'Why can’t you mutate an array after it has been moved in Cairo?',
    },
  },
  {
    query: 'How do you safely access the first element of an array in Cairo?',
    expected: {
      search_terms: ['get', 'Option', 'arrays'],
      resources: ['cairo_book', 'corelib_docs'],
      reformulatedQuery:
        'Safely accessing the first element of an array in Cairo. Array accessor methods. Array core library access methods.',
    },
  },
  {
    query: 'What is the purpose of the `Felt252Dict` type in Cairo?',
    expected: {
      search_terms: ['Felt252Dict', 'dictionaries', 'mutable data'],
      resources: ['cairo_book', 'corelib_docs'],
      reformulatedQuery:
        'What is the purpose of the Felt252Dict type in Cairo?',
    },
  },
  {
    query: 'How do you insert a key-value pair into a `Felt252Dict`?',
    expected: {
      search_terms: ['insert', 'Felt252Dict', 'key-value'],
      resources: ['cairo_book', 'corelib_docs', 'cairo_by_example'],
      reformulatedQuery:
        'Inserting a key-value pair into a Felt252Dict in Cairo using the Felt252Dict core library methods.',
    },
  },
  {
    query:
      'What happens when you access a non-existent key in a `Felt252Dict`?',
    expected: {
      search_terms: ['get', 'Felt252Dict', 'default value'],
      resources: ['cairo_book', 'corelib_docs'],
      reformulatedQuery:
        'What happens when you access a non-existent key in a Felt252Dict in Cairo?',
    },
  },
  {
    query: 'How do you use a `for` loop to iterate over a range in Cairo?',
    expected: {
      search_terms: ['for', 'range', 'iteration'],
      resources: ['cairo_book', 'cairo_by_example'],
      reformulatedQuery:
        'What is the syntax of a for loop? How do I iterate over a range of values?',
    },
  },
  {
    query: 'What is the difference between `loop` and `while` in Cairo?',
    expected: {
      search_terms: ['loop', 'while', 'control flow', 'break'],
      resources: ['cairo_book'],
      reformulatedQuery:
        'What is the difference between loop and while in Cairo?',
    },
  },
  {
    query: 'How do you define a struct with two fields in Cairo?',
    expected: {
      search_terms: ['struct', 'fields', 'data structure'],
      resources: ['cairo_book', 'cairo_by_example'],
      reformulatedQuery: 'Defining structs with two initial fields in Cairo.',
    },
  },
  {
    query: 'What does the `#[derive(Copy, Drop)]` attribute do in Cairo?',
    expected: {
      search_terms: ['derive', 'Copy', 'Drop', 'traits'],
      resources: ['cairo_book'],
      reformulatedQuery:
        'What are derive attributes on top of structs, and what does the #[derive(Copy, Drop)] attribute do in Cairo?',
    },
  },
  {
    query: 'How do you define a method for a struct in Cairo?',
    expected: {
      search_terms: ['impl', 'method syntax', 'self'],
      resources: ['cairo_book', 'cairo_by_example'],
      reformulatedQuery:
        'Defining methods for a struct in Cairo. Writing impl for structs to define methods.',
    },
  },
  {
    query: 'How do you declare a Starknet smart contract in Cairo?',
    expected: {
      search_terms: [
        '#[starknet::contract]',
        'mod',
        'smart contracts',
        'Starknet',
      ],
      resources: ['cairo_book', 'openzeppelin_docs'],
      reformulatedQuery:
        'How do I write a smart contract in Cairo? What libraries, like Openzeppelin, can I use to write safe contracts?',
    },
  },
  {
    query:
      'What is the purpose of the `#[storage]` attribute in a Starknet contract?',
    expected: {
      search_terms: ['#[storage]', 'struct', 'state', 'smart contracts'],
      resources: ['cairo_book'],
      reformulatedQuery:
        'What is the purpose of the #[storage] attribute in a Starknet contract? How do I define storage in a Starknet contract?',
    },
  },
  {
    query: 'How do you define an external function in a Starknet contract?',
    expected: {
      search_terms: [
        '#[external(v0)]',
        '#[abi(embed_v0)]',
        'impl',
        'smart contracts',
      ],
      resources: ['cairo_book'],
      reformulatedQuery:
        'How do I define an external function in a Starknet contract? What are the #[external(v0)] and #[abi(embed_v0)] attributes?',
    },
  },
  {
    query: 'What is the role of `ContractState` in a Starknet contract?',
    expected: {
      search_terms: ['ContractState', 'state', 'smart contracts'],
      resources: ['cairo_book'],
      reformulatedQuery:
        'What is the role of ContractState in a Starknet contract? How do I define a contract state in a Starknet contract?',
    },
  },
  {
    query: 'How do you define an interface for a Starknet contract?',
    expected: {
      search_terms: [
        '#[starknet::interface]',
        'trait',
        'smart contracts',
        'ABI',
      ],
      resources: ['cairo_book'],
      reformulatedQuery:
        'How do I define an interface for a Starknet contract?',
    },
  },
  {
    query:
      'What happens if you omit `ref` in a function that modifies storage?',
    expected: {
      search_terms: ['ref', 'ContractState', 'storage', 'compile error'],
      resources: ['cairo_book'],
      reformulatedQuery:
        'What happens if you omit ref in a function that modifies storage? How do I access or modify state in a Starknet contract?',
    },
  },
  {
    query: 'How do you emit an event in a Starknet contract?',
    expected: {
      search_terms: ['#[event]', 'emit', 'smart contracts', 'Starknet'],
      resources: ['cairo_book'],
      reformulatedQuery:
        'Emitting events in Starknet contract? What is the #[event] attribute?',
    },
  },
  {
    query:
      'What is the difference between a Cairo program and a Starknet smart contract?',
    expected: {
      search_terms: ['Cairo program', 'smart contract', 'state', 'Starknet'],
      resources: ['cairo_book', 'starknet_docs'],
      reformulatedQuery:
        'What is the difference between a Cairo program and a Starknet smart contract?',
    },
  },
  {
    query:
      'How do you call another contract’s function from a Starknet contract?',
    expected: {
      search_terms: [
        'contract address',
        'dispatcher',
        'interfaces',
        'smart contracts',
      ],
      resources: ['cairo_book'],
      reformulatedQuery:
        'How do you call another contract’s function from a Starknet contract? What is the dispatcher?',
    },
  },
  {
    query: 'What is the purpose of the `#[generate_trait]` attribute?',
    expected: {
      search_terms: ['#[generate_trait]', 'traits', 'code generation'],
      resources: ['cairo_book'],
      reformulatedQuery:
        'What does the #[generate_trait] attribute do in Cairo? How does automatic trait generation work?',
    },
  },
  {
    query: 'How do you make a function in a module visible to other modules?',
    expected: {
      search_terms: ['pub', 'modules', 'visibility'],
      resources: ['cairo_book'],
      reformulatedQuery:
        'Making functions public with pub keyword. Module visibility and function accessibility in Cairo.',
    },
  },
  {
    query: 'What is the purpose of the `use` keyword in Cairo?',
    expected: {
      search_terms: ['use', 'import', 'scope'],
      resources: ['cairo_book', 'cairo_by_example'],
      reformulatedQuery:
        'What is the purpose of the use keyword in Cairo? How to import items into scope.',
    },
  },
  {
    query: 'How do you create a generic struct in Cairo?',
    expected: {
      search_terms: ['struct', 'generics', 'type parameters'],
      resources: ['cairo_book', 'cairo_by_example'],
      reformulatedQuery:
        'Creating generic structs with type parameters in Cairo. Struct generics syntax and usage.',
    },
  },
  {
    query: 'How do you implement a trait for a generic type in Cairo?',
    expected: {
      search_terms: ['impl', 'trait', 'generics', 'trait bounds'],
      resources: ['cairo_book'],
      reformulatedQuery:
        'Implementing traits for generic types in Cairo. Generic trait implementations and trait bounds.',
    },
  },
  {
    query: 'What is the difference between snapshots and references in Cairo?',
    expected: {
      search_terms: ['snapshots', 'references', 'ownership', 'immutability'],
      resources: ['cairo_book', 'cairo_by_example'],
      reformulatedQuery:
        'What is the difference between snapshots and references in Cairo? Ownership model and immutability.',
    },
  },
  {
    query:
      'What is the difference between a contract call and a library call in Starknet?',
    expected: {
      search_terms: ['contract call', 'library call', 'state', 'class hash'],
      resources: ['cairo_book', 'starknet_docs'],
      reformulatedQuery:
        'What is the difference between a contract call and a library call in Starknet? State isolation and execution context.',
    },
  },
  {
    query:
      'What is the purpose of a constructor in a Starknet contract, and how is it defined?',
    expected: {
      search_terms: ['constructor', '#[constructor]', 'state initialization'],
      resources: ['cairo_book'],
      reformulatedQuery:
        'What is the purpose of a constructor in a Starknet contract? How to define constructor with #[constructor] attribute.',
    },
  },
  {
    query:
      'What are the visibility modifiers for functions in a Starknet contract?',
    expected: {
      search_terms: [
        'visibility',
        '#[external(v0)]',
        '#[abi(embed_v0)]',
        'internal',
      ],
      resources: ['cairo_book'],
      reformulatedQuery:
        'What are the visibility modifiers for functions in a Starknet contract? External, internal, and ABI visibility.',
    },
  },
  {
    query: 'What is a negative implementation, and when is it useful?',
    expected: {
      search_terms: ['negative impl', 'traits', 'type constraints'],
      resources: ['cairo_book'],
      reformulatedQuery:
        'What is a negative implementation in Cairo? When to use negative impl for type constraints.',
    },
  },
  {
    query: 'What are associated items in a Cairo trait?',
    expected: {
      search_terms: [
        'associated items',
        'traits',
        'associated types',
        'associated functions',
      ],
      resources: ['cairo_book', 'cairo_by_example'],
      reformulatedQuery:
        'What are associated items in a Cairo trait? Associated types and associated functions in traits.',
    },
  },
  {
    query: 'What is a storage node in Cairo, and how is it used?',
    expected: {
      search_terms: ['storage node', 'struct', 'storage', 'mappings'],
      resources: ['cairo_book'],
      reformulatedQuery:
        'What is a storage node in Cairo? How to use storage nodes for mappings and complex storage structures.',
    },
  },
  {
    query: 'What are the benefits of using components in a Starknet contract?',
    expected: {
      search_terms: ['components', 'reusability', 'modularity'],
      resources: ['cairo_book', 'openzeppelin_docs'],
      reformulatedQuery:
        'What are the benefits of using components in a Starknet contract? Component reusability and modularity.',
    },
  },
  {
    query: 'How do you integrate a component into a Starknet contract?',
    expected: {
      search_terms: ['component!()', 'storage', 'events'],
      resources: ['cairo_book', 'openzeppelin_docs'],
      reformulatedQuery:
        'How do you integrate a component into a Starknet contract? Using component!() macro for storage and events.',
    },
  },
  {
    query: "How do you call a component's function within a contract?",
    expected: {
      search_terms: ['component', 'dispatcher', 'ComponentState'],
      resources: ['cairo_book', 'openzeppelin_docs'],
      reformulatedQuery:
        "How do you call a component's function within a contract? Component dispatcher and ComponentState usage.",
    },
  },
  {
    query: 'What are the steps to upgrade a Starknet contract?',
    expected: {
      search_terms: ['upgrade', 'replace_class_syscall', 'class hash'],
      resources: ['cairo_book', 'starknet_docs', 'openzeppelin_docs'],
      reformulatedQuery:
        'What are the steps to upgrade a Starknet contract? Using replace_class_syscall for contract upgrades.',
    },
  },
  {
    query: 'What does the `?` operator do in Cairo?',
    expected: {
      search_terms: ['?', 'Result', 'Option', 'error propagation'],
      resources: ['cairo_book', 'corelib_docs', 'cairo_by_example'],
      reformulatedQuery:
        'What does the ? operator do in Cairo? Error propagation with Result and Option types.',
    },
  },
  {
    query: 'How does `#[should_panic]` work in Cairo testing?',
    expected: {
      search_terms: ['#[should_panic]', 'testing', 'panic'],
      resources: ['cairo_book', 'starknet_foundry'],
      reformulatedQuery:
        'How does #[should_panic] work in Cairo testing? Testing functions that should panic.',
    },
  },
  {
    query: 'What is the purpose of the `#[cfg(test)]` attribute?',
    expected: {
      search_terms: ['#[cfg(test)]', 'testing', 'conditional compilation'],
      resources: ['cairo_book', 'starknet_foundry', 'cairo_by_example'],
      reformulatedQuery:
        'What is the purpose of the #[cfg(test)] attribute? Conditional compilation for test code.',
    },
  },
  {
    query:
      'What is the difference between unit tests and integration tests in Cairo?',
    expected: {
      search_terms: ['unit tests', 'integration tests', 'testing'],
      resources: ['cairo_book', 'starknet_foundry'],
      reformulatedQuery:
        'What is the difference between unit tests and integration tests in Cairo? Testing strategies and approaches.',
    },
  },
  {
    query: 'How can you test private functions in Cairo?',
    expected: {
      search_terms: ['private functions', 'testing', 'module visibility'],
      resources: ['cairo_book', 'starknet_foundry'],
      reformulatedQuery:
        'How can you test private functions in Cairo? Testing module visibility and private function access.',
    },
  },
  {
    query:
      'How do you test a Starknet contract by deploying and interacting with it?',
    expected: {
      search_terms: ['deploy', 'testing', 'dispatcher', 'Foundry'],
      resources: ['cairo_book', 'starknet_foundry'],
      reformulatedQuery:
        'How do you test a Starknet contract by deploying and interacting with it? Contract deployment testing with Foundry.',
    },
  },
  {
    query: 'How do you add a dependency to a Cairo project?',
    expected: {
      search_terms: ['Scarb.toml', 'dependencies', 'package manager'],
      resources: ['cairo_book', 'scarb_docs'],
      reformulatedQuery:
        'How do you add a dependency to a Cairo project? Managing dependencies in Scarb.toml.',
    },
  },
  {
    query: 'How are storage slots identified in a Starknet contract?',
    expected: {
      search_terms: ['storage', 'storage slot', 'storage address'],
      resources: ['cairo_book'],
      reformulatedQuery:
        'How are storage slots identified in a Starknet contract? Storage addressing and slot calculation.',
    },
  },
  {
    query: 'What are the benefits of using a ZK-ISA in Cairo?',
    expected: {
      search_terms: ['ZK-ISA', 'STARKs', 'efficiency'],
      resources: ['cairo_book', 'starknet_docs'],
      reformulatedQuery:
        'What are the benefits of using a ZK-ISA in Cairo? Zero-knowledge instruction set architecture and STARK efficiency.',
    },
  },
  {
    query: 'What types of procedural macros exist in Cairo?',
    expected: {
      search_terms: [
        'procedural macros',
        'derive macros',
        'attribute-like macros',
        'function-like macros',
      ],
      resources: ['cairo_book', 'cairo_by_example'],
      reformulatedQuery:
        'What types of procedural macros exist in Cairo? Derive macros, attribute-like macros, and function-like macros.',
    },
  },
  {
    query:
      'How do you pack multiple small integers into a larger integer in Cairo?',
    expected: {
      search_terms: [
        'bit-packing',
        'bitwise operators',
        'storage optimization',
      ],
      resources: ['cairo_book', 'cairo_by_example', 'corelib_docs'],
      reformulatedQuery:
        'How do you pack multiple small integers into a larger integer in Cairo? Bit-packing and bitwise operations for storage optimization.',
    },
  },
  {
    query: 'When should you use bit-packing in a Starknet contract?',
    expected: {
      search_terms: ['bit-packing', 'storage optimization', 'gas costs'],
      resources: ['cairo_book', 'cairo_by_example', 'corelib_docs'],
      reformulatedQuery:
        'When should you use bit-packing in a Starknet contract? Storage optimization and gas cost considerations.',
    },
  },
  {
    query: 'How does the `#[flat]` attribute affect events in Starknet?',
    expected: {
      search_terms: ['#[flat]', 'events', 'composability'],
      resources: ['cairo_book'],
      reformulatedQuery:
        'How does the #[flat] attribute affect events in Starknet? Event composability and flattening.',
    },
  },
  {
    query: 'What is the role of the `#[key]` attribute in Starknet events?',
    expected: {
      search_terms: ['#[key]', 'events', 'indexed fields'],
      resources: ['cairo_book', 'starknet_docs'],
      reformulatedQuery:
        'What is the role of the #[key] attribute in Starknet events? Indexed event fields and event querying.',
    },
  },
  {
    query: 'How does the Cairo compiler enforce `nopanic` function safety?',
    expected: {
      search_terms: ['nopanic', 'compile-time checks', 'panic'],
      resources: ['cairo_book'],
      reformulatedQuery:
        'How does the Cairo compiler enforce nopanic function safety? Compile-time panic analysis and safety guarantees.',
    },
  },
  {
    query:
      'How does Cairo"s write-once memory model affect mutable data structures?',
    expected: {
      search_terms: [
        'immutable memory',
        'mutable data structures',
        'Felt252Dict',
      ],
      resources: ['cairo_book'],
      reformulatedQuery:
        'How does Cairo"s write-once memory model affect mutable data structures? Immutable memory and Felt252Dict usage.',
    },
  },
  {
    query: 'What is the role of `ComponentState` in Starknet components?',
    expected: {
      search_terms: ['ComponentState', 'components', 'storage access'],
      resources: ['cairo_book', 'openzeppelin_docs'],
      reformulatedQuery:
        'What is the role of ComponentState in Starknet components? Component storage access and state management.',
    },
  },
  {
    query: 'When should you use a library call instead of a contract call?',
    expected: {
      search_terms: ['library call', 'contract call', 'state', 'gas costs'],
      resources: ['cairo_book', 'starknet_docs'],
      reformulatedQuery:
        'When should you use a library call instead of a contract call? State isolation and gas cost considerations.',
    },
  },
  {
    query:
      'What architectural pattern does OpenZeppelin Contracts for Cairo use?',
    expected: {
      search_terms: ['components', 'architecture', 'design pattern'],
      resources: ['openzeppelin_docs'],
      reformulatedQuery:
        'What architectural pattern does OpenZeppelin Contracts for Cairo use? Component-based architecture and design patterns.',
    },
  },
  {
    query:
      'How does the component model in Cairo contracts differ from the inheritance model in Solidity contracts?',
    expected: {
      search_terms: ['components', 'inheritance', 'Solidity comparison'],
      resources: ['openzeppelin_docs', 'cairo_book'],
      reformulatedQuery:
        'How does the component model in Cairo contracts differ from the inheritance model in Solidity contracts? Component composition vs inheritance.',
    },
  },
  {
    query:
      'How do you customize the behavior of a component in OpenZeppelin Contracts for Cairo?',
    expected: {
      search_terms: ['customization', 'hooks', 'custom implementations'],
      resources: ['openzeppelin_docs', 'cairo_book'],
      reformulatedQuery:
        'How do you customize the behavior of a component in OpenZeppelin Contracts for Cairo? Component hooks and custom implementations.',
    },
  },
  {
    query:
      'How do you implement ERC20 token with OpenZeppelin Contracts for Cairo?',
    expected: {
      search_terms: ['ERC20', 'token implementation', 'ERC20Component'],
      resources: ['openzeppelin_docs', 'cairo_book'],
      reformulatedQuery:
        'How do you implement ERC20 token with OpenZeppelin Contracts for Cairo? Using ERC20Component for token implementation.',
    },
  },
  {
    query:
      'What are the supported decimals configuration options for ERC20 tokens?',
    expected: {
      search_terms: ['ERC20', 'decimals', 'configuration'],
      resources: ['openzeppelin_docs'],
      reformulatedQuery:
        'What are the supported decimals configuration options for ERC20 tokens? Token decimals and precision configuration.',
    },
  },
  {
    query:
      'How does Cairo handle method naming conventions in smart contracts?',
    expected: {
      search_terms: [
        'naming conventions',
        'interfaces',
        'snake_case',
        'camelCase',
      ],
      resources: ['openzeppelin_docs', 'cairo_book'],
      reformulatedQuery:
        'How does Cairo handle method naming conventions in smart contracts? Interface naming and snake_case vs camelCase.',
    },
  },
  {
    query:
      'How do you implement access control in OpenZeppelin Contracts for Cairo?',
    expected: {
      search_terms: [
        'access control',
        'OwnableComponent',
        'AccessControlComponent',
      ],
      resources: ['openzeppelin_docs', 'cairo_book'],
      reformulatedQuery:
        'How do you implement access control in OpenZeppelin Contracts for Cairo? Using OwnableComponent and AccessControlComponent.',
    },
  },
  {
    query:
      'What security components are available in OpenZeppelin Contracts for Cairo?',
    expected: {
      search_terms: [
        'security',
        'Initializable',
        'Pausable',
        'ReentrancyGuard',
      ],
      resources: ['openzeppelin_docs'],
      reformulatedQuery:
        'What security components are available in OpenZeppelin Contracts for Cairo? Initializable, Pausable, and ReentrancyGuard components.',
    },
  },
  {
    query:
      'How does contract upgradeability work in Starknet compared to EVM chains?',
    expected: {
      search_terms: ['upgrades', 'replace_class', 'proxy patterns'],
      resources: ['openzeppelin_docs', 'starknet_docs'],
      reformulatedQuery:
        'How does contract upgradeability work in Starknet compared to EVM chains? Native upgrades vs proxy patterns.',
    },
  },
  {
    query:
      'What is the purpose of the Votes component in OpenZeppelin Contracts for Cairo?',
    expected: {
      search_terms: ['governance', 'voting', 'delegation'],
      resources: ['openzeppelin_docs'],
      reformulatedQuery:
        'What is the purpose of the Votes component in OpenZeppelin Contracts for Cairo? Governance voting and delegation mechanisms.',
    },
  },
  {
    query:
      'How do you implement on-chain governance with OpenZeppelin Contracts for Cairo?',
    expected: {
      search_terms: ['governance', 'Governor', 'proposals', 'voting'],
      resources: ['openzeppelin_docs'],
      reformulatedQuery:
        'How do you implement on-chain governance with OpenZeppelin Contracts for Cairo? Governor component for proposals and voting.',
    },
  },
  {
    query:
      'What is the purpose of the Timelock Controller in governance systems?',
    expected: {
      search_terms: ['governance', 'timelock', 'execution delay'],
      resources: ['openzeppelin_docs'],
      reformulatedQuery:
        'What is the purpose of the Timelock Controller in governance systems? Delayed execution and governance security.',
    },
  },
  {
    query:
      'How do you implement a Multisig wallet with OpenZeppelin Contracts for Cairo?',
    expected: {
      search_terms: ['multisig', 'multiple signers', 'quorum'],
      resources: ['openzeppelin_docs'],
      reformulatedQuery:
        'How do you implement a Multisig wallet with OpenZeppelin Contracts for Cairo? Multiple signers and quorum requirements.',
    },
  },
  {
    query: 'How does token URI work in the ERC721 implementation?',
    expected: {
      search_terms: ['ERC721', 'token URI', 'metadata'],
      resources: ['openzeppelin_docs'],
      reformulatedQuery:
        'How does token URI work in the ERC721 implementation? NFT metadata and token URI generation.',
    },
  },
  {
    query: 'What is the purpose of the SRC5 introspection standard?',
    expected: {
      search_terms: ['SRC5', 'introspection', 'interface detection'],
      resources: ['openzeppelin_docs', 'starknet_docs'],
      reformulatedQuery:
        'What is the purpose of the SRC5 introspection standard? Interface detection and contract introspection.',
    },
  },
  {
    query:
      'How do you implement ERC1155 multi-token standard with OpenZeppelin Contracts for Cairo?',
    expected: {
      search_terms: ['ERC1155', 'multi-token', 'fungible and non-fungible'],
      resources: ['openzeppelin_docs'],
      reformulatedQuery:
        'How do you implement ERC1155 multi-token standard with OpenZeppelin Contracts for Cairo? Multi-token contracts with fungible and non-fungible tokens.',
    },
  },
  {
    query:
      'What testing utilities does OpenZeppelin provide for Cairo contracts?',
    expected: {
      search_terms: ['testing', 'Starknet Foundry', 'test utilities'],
      resources: ['openzeppelin_docs', 'starknet_foundry'],
      reformulatedQuery:
        'What testing utilities does OpenZeppelin provide for Cairo contracts? Test utilities and Starknet Foundry integration.',
    },
  },
  {
    query: 'How do you implement the Permit extension for ERC20 tokens?',
    expected: {
      search_terms: ['ERC20', 'permit', 'signatures'],
      resources: ['openzeppelin_docs'],
      reformulatedQuery:
        'How do you implement the Permit extension for ERC20 tokens? Gasless approvals with signature-based permits.',
    },
  },
  {
    query: 'What is the Universal Deployer Contract (UDC) and how is it used?',
    expected: {
      search_terms: ['UDC', 'deployment', 'contracts'],
      resources: ['openzeppelin_docs', 'cairo_book'],
      reformulatedQuery:
        'What is the Universal Deployer Contract (UDC) and how is it used? Deterministic contract deployment with UDC.',
    },
  },
  {
    query: 'How do you implement safe transfers in ERC721?',
    expected: {
      search_terms: ['ERC721', 'safe transfer', 'receiver contracts'],
      resources: ['openzeppelin_docs'],
      reformulatedQuery:
        'How do you implement safe transfers in ERC721? Safe transfer mechanisms and receiver contract validation.',
    },
  },
  {
    query: 'What are the security considerations when upgrading contracts?',
    expected: {
      search_terms: ['upgrades', 'security', 'storage'],
      resources: ['openzeppelin_docs', 'cairo_book'],
      reformulatedQuery:
        'What are the security considerations when upgrading contracts? Storage compatibility and upgrade security.',
    },
  },
  {
    query:
      'How does the Pausable component work to provide emergency stop functionality?',
    expected: {
      search_terms: ['security', 'Pausable', 'emergency stop'],
      resources: ['openzeppelin_docs'],
      reformulatedQuery:
        'How does the Pausable component work to provide emergency stop functionality? Emergency pause mechanisms and security.',
    },
  },
  {
    query:
      'What is the difference between OwnableComponent and AccessControlComponent?',
    expected: {
      search_terms: ['access control', 'ownership', 'roles'],
      resources: ['openzeppelin_docs'],
      reformulatedQuery:
        'What is the difference between OwnableComponent and AccessControlComponent? Simple ownership vs role-based access control.',
    },
  },
  {
    query: 'How do you implement custom token supply mechanisms in ERC20?',
    expected: {
      search_terms: ['ERC20', 'supply', 'minting', 'burning'],
      resources: ['openzeppelin_docs'],
      reformulatedQuery:
        'How do you implement custom token supply mechanisms in ERC20? Token minting, burning, and supply management.',
    },
  },
  {
    query:
      'How do you use the Initializable component to secure contract initialization?',
    expected: {
      search_terms: ['security', 'initialization', 'constructor alternative'],
      resources: ['openzeppelin_docs'],
      reformulatedQuery:
        'How do you use the Initializable component to secure contract initialization? Secure initialization and constructor alternatives.',
    },
  },
  {
    query: 'What is account abstraction in Starknet?',
    expected: {
      search_terms: [
        'account abstraction',
        'account contracts',
        'smart accounts',
      ],
      resources: ['starknet_docs'],
      reformulatedQuery:
        'What is account abstraction in Starknet? Account contracts and smart account functionality.',
    },
  },
  {
    query: 'How are account contracts deployed in Starknet?',
    expected: {
      search_terms: [
        'account deployment',
        'Universal Deployer',
        'DEPLOY_ACCOUNT',
      ],
      resources: ['starknet_docs', 'cairo_book'],
      reformulatedQuery:
        'How are account contracts deployed in Starknet? Account deployment with Universal Deployer and DEPLOY_ACCOUNT transactions.',
    },
  },
  {
    query: 'What functions must a Starknet account contract implement?',
    expected: {
      search_terms: ['account interface', 'required functions', 'validation'],
      resources: ['starknet_docs', 'cairo_book'],
      reformulatedQuery:
        'What functions must a Starknet account contract implement? Account interface and required validation functions.',
    },
  },
  {
    query: 'What is Cairo and Sierra in the context of Starknet?',
    expected: {
      search_terms: ['Cairo', 'Sierra', 'compilation', 'smart contracts'],
      resources: ['starknet_docs', 'cairo_book'],
      reformulatedQuery:
        'What is Cairo and Sierra in the context of Starknet? Cairo compilation pipeline and Sierra intermediate representation.',
    },
  },
  {
    query: 'How are contract classes and instances separated in Starknet?',
    expected: {
      search_terms: [
        'contract class',
        'contract instance',
        'class hash',
        'deployment',
      ],
      resources: ['starknet_docs'],
      reformulatedQuery:
        'How are contract classes and instances separated in Starknet? Contract class declaration vs instance deployment.',
    },
  },
  {
    query: 'What hash functions are available in Starknet?',
    expected: {
      search_terms: [
        'hash functions',
        'Pedersen',
        'Poseidon',
        'Starknet Keccak',
      ],
      resources: ['starknet_docs', 'corelib_docs'],
      reformulatedQuery:
        'What hash functions are available in Starknet? Pedersen, Poseidon, and Starknet Keccak hash functions.',
    },
  },
  {
    query: 'How is the Starknet state structured?',
    expected: {
      search_terms: ['state', 'Merkle-Patricia tries', 'state commitment'],
      resources: ['starknet_docs'],
      reformulatedQuery:
        'How is the Starknet state structured? State commitment and Merkle-Patricia trie organization.',
    },
  },
  {
    query: 'What is the transaction flow in Starknet?',
    expected: {
      search_terms: [
        'transaction flow',
        'validation',
        'execution',
        'fee mechanism',
      ],
      resources: ['starknet_docs'],
      reformulatedQuery:
        'What is the transaction flow in Starknet? Transaction validation, execution, and fee mechanism.',
    },
  },
  {
    query: 'How does L1-L2 messaging work in Starknet?',
    expected: {
      search_terms: ['L1-L2 messaging', 'L1 handler', 'messaging mechanism'],
      resources: ['starknet_docs', 'cairo_book'],
      reformulatedQuery:
        'How does L1-L2 messaging work in Starknet? Cross-layer messaging and L1 handler functions.',
    },
  },
  {
    query: 'What is the STRK token and its utility?',
    expected: {
      search_terms: ['STRK', 'native token', 'token economics'],
      resources: ['starknet_docs'],
      reformulatedQuery:
        'What is the STRK token and its utility? Starknet native token and token economics.',
    },
  },
  {
    query: 'How does staking work in Starknet?',
    expected: {
      search_terms: ['staking', 'validators', 'delegation', 'rewards'],
      resources: ['starknet_docs'],
      reformulatedQuery:
        'How does staking work in Starknet? Validator staking, delegation, and reward mechanisms.',
    },
  },
  {
    query: 'What is the minting curve formula for Starknet staking rewards?',
    expected: {
      search_terms: ['minting curve', 'staking rewards', 'token inflation'],
      resources: ['starknet_docs'],
      reformulatedQuery:
        'What is the minting curve formula for Starknet staking rewards? Token inflation and reward calculation formula.',
    },
  },
  {
    query: 'How does the StarkGate bridge work?',
    expected: {
      search_terms: ['StarkGate', 'bridge', 'token bridging', 'L1-L2'],
      resources: ['starknet_docs'],
      reformulatedQuery:
        'How does the StarkGate bridge work? Token bridging between L1 and L2 with StarkGate.',
    },
  },
  {
    query: 'What is the withdrawal process from Starknet to Ethereum?',
    expected: {
      search_terms: ['withdrawal', 'L2-L1', 'bridge', 'finalization'],
      resources: ['starknet_docs'],
      reformulatedQuery:
        'What is the withdrawal process from Starknet to Ethereum? L2-L1 withdrawal and finalization process.',
    },
  },
  {
    query: 'What is a class hash in Starknet?',
    expected: {
      search_terms: ['class hash', 'contract classes', 'declaration'],
      resources: ['starknet_docs', 'cairo_book'],
      reformulatedQuery:
        'What is a class hash in Starknet? Contract class identification and declaration hashes.',
    },
  },
  {
    query: 'What is a compiled class hash in Starknet?',
    expected: {
      search_terms: ['compiled class hash', 'CASM', 'Sierra', 'compilation'],
      resources: ['starknet_docs', 'cairo_book'],
      reformulatedQuery:
        'What is a compiled class hash in Starknet? CASM compilation and Sierra to CASM hash.',
    },
  },
  {
    query: 'How are contract addresses determined in Starknet?',
    expected: {
      search_terms: ['contract address', 'address calculation', 'deployment'],
      resources: ['starknet_docs', 'cairo_book'],
      reformulatedQuery:
        'How are contract addresses determined in Starknet? Contract address calculation and deployment parameters.',
    },
  },
  {
    query: 'What are the main development tools for Starknet?',
    expected: {
      search_terms: [
        'development tools',
        'Scarb',
        'Starknet Foundry',
        'Starkli',
      ],
      resources: [
        'starknet_docs',
        'scarb_docs',
        'starknet_foundry',
        'cairo_book',
      ],
      reformulatedQuery:
        'What are the main development tools for Starknet? Scarb, Starknet Foundry, and Starkli development tools.',
    },
  },
  {
    query: 'How can I set up a local Starknet development environment?',
    expected: {
      search_terms: ['development environment', 'devnet', 'setup'],
      resources: ['starknet_docs', 'scarb_docs', 'starknet_foundry'],
      reformulatedQuery:
        'How can I set up a local Starknet development environment? Local devnet setup and development configuration.',
    },
  },
  {
    query: 'What frameworks exist for building dApps on Starknet?',
    expected: {
      search_terms: ['dApp development', 'frameworks', 'frontend'],
      resources: ['starknet_docs'],
      reformulatedQuery:
        'What frameworks exist for building dApps on Starknet? Frontend frameworks and dApp development tools.',
    },
  },
  {
    query: 'How does the fee mechanism work in Starknet?',
    expected: {
      search_terms: ['fee mechanism', 'gas', 'transaction fees'],
      resources: ['starknet_docs'],
      reformulatedQuery:
        'How does the fee mechanism work in Starknet? Transaction fees and gas calculation.',
    },
  },
  {
    query: 'What wallets support Starknet?',
    expected: {
      search_terms: ['wallets', 'account contracts', 'user interface'],
      resources: ['starknet_docs'],
      reformulatedQuery:
        'What wallets support Starknet? Wallet integration and account contract support.',
    },
  },
  {
    query: 'How do system calls work in Cairo contracts?',
    expected: {
      search_terms: ['system calls', 'contract interaction', 'OS'],
      resources: ['starknet_docs', 'cairo_book'],
      reformulatedQuery:
        'How do system calls work in Cairo contracts? Contract system calls and OS interaction.',
    },
  },
  {
    query: 'What is data availability in Starknet?',
    expected: {
      search_terms: ['data availability', 'state updates', 'volition'],
      resources: ['starknet_docs'],
      reformulatedQuery:
        'What is data availability in Starknet? State updates and Volition data availability modes.',
    },
  },
  {
    query: 'How do Starknet full nodes work?',
    expected: {
      search_terms: ['full nodes', 'synchronization', 'state management'],
      resources: ['starknet_docs'],
      reformulatedQuery:
        'How do Starknet full nodes work? Node synchronization and state management.',
    },
  },
  {
    query: 'What is the SHARP prover system in Starknet?',
    expected: {
      search_terms: ['SHARP', 'provers', 'STARK proofs', 'verification'],
      resources: ['starknet_docs'],
      reformulatedQuery:
        'What is the SHARP prover system in Starknet? STARK proof generation and verification system.',
    },
  },
  {
    query:
      'How can I implement a custom ERC20 token with minting capabilities using OpenZeppelin, and test it with Foundry?',
    chat_history: "I'm building a token contract on Starknet.",
    expected: {
      search_terms: [
        'ERC20 mintable',
        'OpenZeppelin ERC20Component',
        'mint function',
        'testing ERC20 Foundry',
        'deploy token test',
      ],
      resources: ['openzeppelin_docs', 'starknet_foundry', 'cairo_book'],
      reformulatedQuery:
        'How can I implement a custom ERC20 token with minting capabilities using OpenZeppelin? Testing mintable ERC20 tokens with Foundry.',
    },
  },
  {
    query:
      'Explain how to use Scarb to add OpenZeppelin as a dependency and compile a contract that uses AccessControl.',
    expected: {
      search_terms: [
        'Scarb add dependency',
        'OpenZeppelin Scarb.toml',
        'AccessControlComponent',
        'compile with Scarb',
      ],
      resources: ['scarb_docs', 'openzeppelin_docs'],
      reformulatedQuery:
        'Explain how to use Scarb to add OpenZeppelin as a dependency and compile a contract that uses AccessControl. Scarb dependency management and compilation.',
    },
  },
  {
    query:
      "What's the best way to handle errors in a Cairo function that interacts with Starknet storage?",
    chat_history: "I've been getting panics when reading non-existent keys.",
    expected: {
      search_terms: [
        'error handling Cairo',
        'Result Option types',
        'storage read panic',
        'Felt252Dict errors',
      ],
      resources: ['cairo_book', 'corelib_docs', 'starknet_docs'],
      reformulatedQuery:
        'What"s the best way to handle errors in a Cairo function that interacts with Starknet storage? Error handling for storage reads and Felt252Dict operations.',
    },
  },
  {
    query:
      'How do I deploy a contract using Starkli and then upgrade it later?',
    expected: {
      search_terms: [
        'Starkli deploy contract',
        'upgrade contract Starknet',
        'replace_class syscall',
      ],
      resources: ['starknet_docs', 'openzeppelin_docs'],
      reformulatedQuery:
        'How do I deploy a contract using Starkli and then upgrade it later? Contract deployment and upgrade with Starkli.',
    },
  },
  {
    query:
      'Can you show how to use bitwise operations for packing data in storage to save gas?',
    chat_history: 'Optimizing a contract with many small uints.',
    expected: {
      search_terms: [
        'bitwise packing Cairo',
        'storage optimization gas',
        'bit shift AND OR',
      ],
      resources: ['cairo_book', 'cairo_by_example', 'starknet_docs'],
      reformulatedQuery:
        'Can you show how to use bitwise operations for packing data in storage to save gas? Bitwise packing for storage optimization and gas efficiency.',
    },
  },
  {
    query:
      'Integrate an OZ Pausable component into my contract and write a test to verify pausing.',
    expected: {
      search_terms: [
        'PausableComponent OpenZeppelin',
        'pause unpause functions',
        'testing pausable Foundry',
      ],
      resources: ['openzeppelin_docs', 'starknet_foundry'],
      reformulatedQuery:
        'Integrate an OZ Pausable component into my contract and write a test to verify pausing. PausableComponent integration and testing.',
    },
  },
  {
    query:
      "What's the difference between Pedersen and Poseidon hashes, and when to use each in contracts?",
    expected: {
      search_terms: [
        'Pedersen hash vs Poseidon',
        'hash functions Starknet',
        'ZK efficiency security',
      ],
      resources: ['starknet_docs', 'corelib_docs'],
      reformulatedQuery:
        'What"s the difference between Pedersen and Poseidon hashes, and when to use each in contracts? Hash function comparison and use cases.',
    },
  },
  {
    query:
      'Set up a multisig account on Starknet using OZ, including signature validation.',
    expected: {
      search_terms: [
        'MultisigComponent OpenZeppelin',
        'account abstraction multisig',
        'signature validation __validate__',
      ],
      resources: ['openzeppelin_docs', 'starknet_docs'],
      reformulatedQuery:
        'Set up a multisig account on Starknet using OZ, including signature validation. MultisigComponent and account abstraction implementation.',
    },
  },
  {
    query:
      'How to bridge ETH to Starknet using StarkGate and then swap it in a contract call?',
    chat_history: 'New to bridging.',
    expected: {
      search_terms: [
        'StarkGate deposit ETH',
        'bridge L1 to L2',
        'contract call after bridge',
      ],
      resources: ['starknet_docs'],
      reformulatedQuery:
        'How to bridge ETH to Starknet using StarkGate and then swap it in a contract call? ETH bridging and contract interaction.',
    },
  },
  {
    query:
      'Implement a governance token with voting delegation using OZ Votes component.',
    expected: {
      search_terms: [
        'VotesComponent delegation',
        'governance token OZ',
        'snapshot voting',
      ],
      resources: ['openzeppelin_docs'],
      reformulatedQuery:
        'Implement a governance token with voting delegation using OZ Votes component. VotesComponent for governance and delegation.',
    },
  },
  {
    query:
      'Use Scarb to build a project with multiple crates and Starknet contracts.',
    expected: {
      search_terms: [
        'Scarb multi-crate project',
        'workspace Scarb.toml',
        'Starknet contracts build',
      ],
      resources: ['scarb_docs', 'cairo_book'],
      reformulatedQuery:
        'Use Scarb to build a project with multiple crates and Starknet contracts. Scarb workspace and multi-crate project structure.',
    },
  },
  {
    query:
      'How does the Cairo VM handle memory allocation for dynamic structures like arrays?',
    expected: {
      search_terms: [
        'Cairo VM memory model',
        'array allocation',
        'write-once memory',
      ],
      resources: ['cairo_book', 'corelib_docs'],
      reformulatedQuery:
        'How does the Cairo VM handle memory allocation for dynamic structures like arrays? Cairo VM memory model and array allocation.',
    },
  },
  {
    query: 'Test L1-L2 messaging in Foundry by mocking the L1 handler.',
    expected: {
      search_terms: [
        'L1 handler testing Foundry',
        'mock L1 message',
        'messaging syscalls test',
      ],
      resources: ['starknet_foundry', 'starknet_docs'],
      reformulatedQuery:
        'Test L1-L2 messaging in Foundry by mocking the L1 handler. L1 handler testing and message mocking.',
    },
  },
  {
    query:
      'Create a custom trait for a generic enum and implement it for multiple types.',
    chat_history: 'Working with enums in traits.',
    expected: {
      search_terms: [
        'generic trait enum',
        'impl for enum',
        'trait bounds generics',
      ],
      resources: ['cairo_book', 'cairo_by_example'],
      reformulatedQuery:
        'Create a custom trait for a generic enum and implement it for multiple types. Generic trait implementation for enums.',
    },
  },
  {
    query:
      'What are the gas costs for different syscalls in Starknet, like get_block_number?',
    expected: {
      search_terms: [
        'syscalls gas costs',
        'get_block_number cost',
        'Starknet execution fees',
      ],
      resources: ['starknet_docs'],
      reformulatedQuery:
        'What are the gas costs for different syscalls in Starknet, like get_block_number? Syscall execution costs and fee calculation.',
    },
  },
  {
    query:
      "How to use the corelib's Array<T> in a contract function with snapshots.",
    expected: {
      search_terms: [
        'Array<T> corelib',
        'snapshots arrays',
        'contract function arrays',
      ],
      resources: ['corelib_docs', 'cairo_book'],
      reformulatedQuery:
        'How to use the corelib"s Array<T> in a contract function with snapshots. Array usage and snapshot semantics.',
    },
  },
  {
    query:
      'Deploy an ERC721 NFT contract with metadata using OZ and set base URI.',
    expected: {
      search_terms: [
        'ERC721Component OZ',
        'token URI base',
        'NFT metadata setup',
      ],
      resources: ['openzeppelin_docs'],
      reformulatedQuery:
        'Deploy an ERC721 NFT contract with metadata using OZ and set base URI. ERC721Component deployment and metadata configuration.',
    },
  },
  {
    query:
      'Explain the role of Sierra in the compilation pipeline and how to generate it with Scarb.',
    expected: {
      search_terms: [
        'Sierra compilation',
        'Cairo to Sierra',
        'Scarb generate Sierra',
      ],
      resources: ['starknet_docs', 'scarb_docs', 'cairo_book'],
      reformulatedQuery:
        'Explain the role of Sierra in the compilation pipeline and how to generate it with Scarb. Sierra intermediate representation and compilation.',
    },
  },
  {
    query:
      'Implement reentrancy protection in a contract using OZ ReentrancyGuard.',
    chat_history: 'Worried about reentrancy attacks.',
    expected: {
      search_terms: [
        'ReentrancyGuardComponent',
        'non_reentrant modifier',
        'security reentrancy',
      ],
      resources: ['openzeppelin_docs', 'cairo_book'],
      reformulatedQuery:
        'Implement reentrancy protection in a contract using OZ ReentrancyGuard. ReentrancyGuardComponent for security protection.',
    },
  },
  {
    query: 'How to stake STRK tokens as a delegator and claim rewards?',
    expected: {
      search_terms: [
        'STRK staking delegation',
        'claim rewards Starknet',
        'staking pools',
      ],
      resources: ['starknet_docs'],
      reformulatedQuery:
        'How to stake STRK tokens as a delegator and claim rewards? STRK token staking and reward claiming process.',
    },
  },
  {
    query:
      'Use cairo_by_example to find a snippet for a simple loop that sums an array.',
    expected: {
      search_terms: [
        'loop sum array example',
        'Cairo loop snippet',
        'array iteration code',
      ],
      resources: ['cairo_by_example'],
      reformulatedQuery:
        'Use cairo_by_example to find a snippet for a simple loop that sums an array. Array iteration and sum calculation examples.',
    },
  },
  {
    query:
      "What's the process for proposing and voting on Starknet governance changes?",
    expected: {
      search_terms: ['Starknet governance proposals', 'voting process'],
      resources: ['starknet_docs'],
      reformulatedQuery:
        'What"s the process for proposing and voting on Starknet governance changes? Starknet governance mechanism and proposal process.',
    },
  },
  {
    query:
      'Integrate OZ Initializable with a constructor to prevent reinitialization attacks.',
    expected: {
      search_terms: [
        'InitializableComponent',
        'one-time init',
        'constructor security',
      ],
      resources: ['openzeppelin_docs'],
      reformulatedQuery:
        'Integrate OZ Initializable with a constructor to prevent reinitialization attacks. InitializableComponent for secure initialization.',
    },
  },
  {
    query:
      'How to debug a failing test in Foundry using print statements and cheatcodes?',
    chat_history: 'My test is panicking unexpectedly.',
    expected: {
      search_terms: [
        'Foundry debug test',
        'print cheatcode',
        'spy events debug',
      ],
      resources: ['starknet_foundry', 'cairo_book'],
      reformulatedQuery:
        'How to debug a failing test in Foundry using print statements and cheatcodes? Foundry debugging and test troubleshooting.',
    },
  },
  {
    query: 'Calculate the class hash for a contract manually in Cairo code.',
    expected: {
      search_terms: [
        'class hash calculation',
        'compute class hash Cairo',
        'Sierra class hash',
      ],
      resources: ['starknet_docs', 'corelib_docs', 'cairo_book'],
      reformulatedQuery:
        'Calculate the class hash for a contract manually in Cairo code. Class hash computation and Sierra hash calculation.',
    },
  },
  {
    query:
      'Implement a library call to reuse code from another contract without changing state.',
    expected: {
      search_terms: [
        'library_call syscall',
        'reuse code Starknet',
        'state isolation library',
      ],
      resources: ['starknet_docs', 'cairo_book', 'corelib_docs'],
      reformulatedQuery:
        'Implement a library call to reuse code from another contract without changing state. Library call syscall and state isolation.',
    },
  },
  {
    query:
      'How does the Volition data availability mode work, and how to choose between rollup and validium?',
    expected: {
      search_terms: [
        'Volition DA mode',
        'rollup vs validium',
        'data availability choice',
      ],
      resources: ['starknet_docs'],
      reformulatedQuery:
        'How does the Volition data availability mode work, and how to choose between rollup and validium? Volition data availability options.',
    },
  },
  {
    query: 'Set up a full node with Pathfinder and sync it to mainnet.',
    expected: {
      search_terms: [
        'Pathfinder full node setup',
        'sync mainnet node',
        'Starknet node config',
      ],
      resources: ['starknet_docs'],
      reformulatedQuery:
        'Set up a full node with Pathfinder and sync it to mainnet. Pathfinder node setup and mainnet synchronization.',
    },
  },
  {
    query: 'Use the permit extension for gasless approvals in an ERC20 token.',
    expected: {
      search_terms: [
        'ERC20PermitComponent',
        'gasless permit',
        'EIP-2612 Cairo',
      ],
      resources: ['openzeppelin_docs'],
      reformulatedQuery:
        'Use the permit extension for gasless approvals in an ERC20 token. ERC20PermitComponent for gasless transactions.',
    },
  },
  {
    query:
      "What's the minting curve and how does it affect STRK inflation based on staking rate?",
    chat_history: 'Trying to model token economics.',
    expected: {
      search_terms: [
        'minting curve formula',
        'STRK inflation staking',
        'reward calculation',
      ],
      resources: ['starknet_docs'],
      reformulatedQuery:
        'What"s the minting curve and how does it affect STRK inflation based on staking rate? STRK token minting curve and inflation mechanism.',
    },
  },
  {
    query: 'Implement safe transfer for ERC1155 tokens with batch operations.',
    expected: {
      search_terms: [
        'ERC1155 safeBatchTransferFrom',
        'multi-token safe transfer',
        'receiver check',
      ],
      resources: ['openzeppelin_docs'],
      reformulatedQuery:
        'Implement safe transfer for ERC1155 tokens with batch operations. ERC1155 batch transfers and safety checks.',
    },
  },
  {
    query:
      'How to use Scarb to target different Starknet versions in compilation.',
    expected: {
      search_terms: [
        'Scarb target Starknet version',
        'compilation flags version',
        'Scarb.toml config',
      ],
      resources: ['scarb_docs', 'cairo_book'],
      reformulatedQuery:
        'How to use Scarb to target different Starknet versions in compilation. Scarb version targeting and compilation configuration.',
    },
  },
  {
    query:
      'Test account abstraction by deploying a custom account contract and validating signatures.',
    expected: {
      search_terms: [
        'custom account test Foundry',
        'signature validation test',
        '__validate__ mock',
      ],
      resources: ['starknet_foundry', 'starknet_docs'],
      reformulatedQuery:
        'Test account abstraction by deploying a custom account contract and validating signatures. Account contract testing and signature validation.',
    },
  },
  {
    query:
      "What's the role of SHARP in proving batches and how does it integrate with Ethereum?",
    expected: {
      search_terms: [
        'SHARP prover batches',
        'STARK proof Ethereum',
        'verification L1',
      ],
      resources: ['starknet_docs'],
      reformulatedQuery:
        'What"s the role of SHARP in proving batches and how does it integrate with Ethereum? SHARP prover system and Ethereum integration.',
    },
  },
  {
    query:
      'Create a generic function that works with any Copy type and uses trait bounds.',
    expected: {
      search_terms: [
        'generic function Copy trait',
        'trait bounds syntax',
        'impl generic',
      ],
      resources: ['cairo_book', 'cairo_by_example'],
      reformulatedQuery:
        'Create a generic function that works with any Copy type and uses trait bounds. Generic functions with Copy trait bounds.',
    },
  },
  {
    query: 'How to emit indexed events with keys for efficient querying.',
    chat_history: 'Need better event filtering.',
    expected: {
      search_terms: [
        '#[key] event attribute',
        'indexed events Starknet',
        'query events keys',
      ],
      resources: ['cairo_book', 'starknet_docs'],
      reformulatedQuery:
        'How to emit indexed events with keys for efficient querying. Indexed events with #[key] attribute for efficient filtering.',
    },
  },
  {
    query:
      "Use corelib's math functions for safe arithmetic to prevent overflows.",
    expected: {
      search_terms: [
        'safe math corelib',
        'overflow prevention',
        'checked add mul',
      ],
      resources: ['corelib_docs', 'cairo_book'],
      reformulatedQuery:
        'Use corelib"s math functions for safe arithmetic to prevent overflows. Safe arithmetic operations and overflow prevention.',
    },
  },
  {
    query: 'Deploy a contract counterfactually and fund it before activation.',
    expected: {
      search_terms: [
        'counterfactual deployment',
        'pre-fund account',
        'address calculation salt',
      ],
      resources: ['starknet_docs'],
      reformulatedQuery:
        'Deploy a contract counterfactually and fund it before activation. Counterfactual deployment and pre-funding strategies.',
    },
  },
  {
    query:
      'Implement a timelock for governance proposals with delayed execution.',
    expected: {
      search_terms: [
        'TimelockController OZ',
        'delayed execution governance',
        'proposal timelock',
      ],
      resources: ['openzeppelin_docs'],
      reformulatedQuery:
        'Implement a timelock for governance proposals with delayed execution. TimelockController for governance security.',
    },
  },
  {
    query:
      'How to run integration tests that interact with multiple deployed contracts in Foundry.',
    expected: {
      search_terms: [
        'integration tests Foundry',
        'multi-contract deploy test',
        'dispatcher interactions',
      ],
      resources: ['starknet_foundry'],
      reformulatedQuery:
        'How to run integration tests that interact with multiple deployed contracts in Foundry. Multi-contract integration testing.',
    },
  },
  {
    query:
      "What's the difference between declare and deploy transactions in Starknet?",
    expected: {
      search_terms: [
        'declare transaction class',
        'deploy instance',
        'class hash vs address',
      ],
      resources: ['starknet_docs'],
      reformulatedQuery:
        'What"s the difference between declare and deploy transactions in Starknet? Contract class declaration vs instance deployment.',
    },
  },
  {
    query: 'Use negative impl to constrain generics in a trait implementation.',
    expected: {
      search_terms: [
        'negative impl !Trait',
        'generic constraints negative',
        'type exclusion traits',
      ],
      resources: ['cairo_book'],
      reformulatedQuery:
        'Use negative impl to constrain generics in a trait implementation. Negative implementations for type constraints.',
    },
  },
  {
    query:
      'How to configure Scarb for custom build profiles and optimization levels.',
    chat_history: 'Optimizing for gas.',
    expected: {
      search_terms: [
        'Scarb build profiles',
        'optimization flags',
        'Scarb.toml build config',
      ],
      resources: ['scarb_docs'],
      reformulatedQuery:
        'How to configure Scarb for custom build profiles and optimization levels. Scarb build configuration and optimization.',
    },
  },
  {
    query: 'Implement SRC5 interface detection in a custom contract.',
    expected: {
      search_terms: [
        'SRC5 introspection',
        'supports_interface function',
        'interface IDs',
      ],
      resources: ['openzeppelin_docs', 'starknet_docs'],
      reformulatedQuery:
        'Implement SRC5 interface detection in a custom contract. SRC5 introspection and interface detection.',
    },
  },
  {
    query: 'Mock syscalls like get_execution_info in unit tests.',
    expected: {
      search_terms: [
        'mock syscalls Foundry',
        'get_execution_info cheatcode',
        'test syscall override',
      ],
      resources: ['starknet_foundry'],
      reformulatedQuery:
        'Mock syscalls like get_execution_info in unit tests. Syscall mocking and test cheatcodes.',
    },
  },
  {
    query: 'How does the state commitment work with Merkle tries in Starknet?',
    expected: {
      search_terms: [
        'state commitment Merkle',
        'Patricia trie state',
        'contracts classes tries',
      ],
      resources: ['starknet_docs'],
      reformulatedQuery:
        'How does the state commitment work with Merkle tries in Starknet? State commitment and Merkle Patricia trie structure.',
    },
  },
  {
    query:
      'Create a dApp frontend that connects to Starknet wallet and calls a contract.',
    expected: {
      search_terms: [
        'Starknet React hooks',
        'wallet connection GetStarknet',
        'call contract frontend',
      ],
      resources: ['starknet_docs'],
      reformulatedQuery:
        'Create a dApp frontend that connects to Starknet wallet and calls a contract. Frontend wallet integration and contract interaction.',
    },
  },
  {
    query: 'Use associated types in a trait for flexible return types.',
    expected: {
      search_terms: [
        'associated types trait',
        'flexible returns trait',
        'trait associated items',
      ],
      resources: ['cairo_book'],
      reformulatedQuery:
        'Use associated types in a trait for flexible return types. Associated types for flexible trait design.',
    },
  },
  {
    query: "What's the withdrawal limit mechanism in StarkGate for security?",
    chat_history: 'Concerned about bridge risks.',
    expected: {
      search_terms: [
        'StarkGate withdrawal limits',
        'bridge security measures',
        'L2 to L1 limits',
      ],
      resources: ['starknet_docs'],
      reformulatedQuery:
        'What"s the withdrawal limit mechanism in StarkGate for security? StarkGate security measures and withdrawal limits.',
    },
  },
  {
    query:
      'Implement a nopanic function that does safe division without panicking.',
    expected: {
      search_terms: [
        'nopanic attribute',
        'safe division no panic',
        'compile-time no panic',
      ],
      resources: ['cairo_book'],
      reformulatedQuery:
        'Implement a nopanic function that does safe division without panicking. Nopanic functions and safe division operations.',
    },
  },
  {
    query: 'How to use the UDC for deterministic deployments in scripts.',
    expected: {
      search_terms: [
        'UDC deploy deterministic',
        'Universal Deployer address',
        'salt class hash deploy',
      ],
      resources: ['starknet_docs', 'openzeppelin_docs'],
      reformulatedQuery:
        'How to use the UDC for deterministic deployments in scripts. Universal Deployer Contract for deterministic deployment.',
    },
  },
  {
    query: 'Combine OZ components for an upgradable ERC20 with access control.',
    expected: {
      search_terms: [
        'UpgradeableComponent ERC20',
        'Ownable access OZ',
        'component composition',
      ],
      resources: ['openzeppelin_docs', 'cairo_book'],
      reformulatedQuery:
        'Combine OZ components for an upgradable ERC20 with access control. Component composition for upgradable tokens.',
    },
  },
  {
    query: 'Test event emissions in a contract using Foundry spy.',
    expected: {
      search_terms: [
        'event testing Foundry',
        'spy events cheatcode',
        'assert event emitted',
      ],
      resources: ['starknet_foundry', 'cairo_book'],
      reformulatedQuery:
        'Test event emissions in a contract using Foundry spy. Event testing and spy cheatcodes in Foundry.',
    },
  },
  {
    query: 'How to handle ByteArray in storage for large strings.',
    expected: {
      search_terms: [
        'ByteArray storage',
        'large strings Cairo',
        'storage node ByteArray',
      ],
      resources: ['cairo_book', 'corelib_docs'],
      reformulatedQuery:
        'How to handle ByteArray in storage for large strings. ByteArray storage and large string handling.',
    },
  },
  {
    query:
      "What's the role of the sequencer in Starknet transaction processing?",
    expected: {
      search_terms: [
        'sequencer role Starknet',
        'transaction ordering',
        'block production sequencer',
      ],
      resources: ['starknet_docs'],
      reformulatedQuery:
        'What"s the role of the sequencer in Starknet transaction processing? Sequencer functionality and transaction ordering.',
    },
  },
  {
    query: 'Implement a flat event structure for composability in components.',
    expected: {
      search_terms: [
        '#[flat] event',
        'composable events components',
        'event serialization flat',
      ],
      resources: ['cairo_book', 'openzeppelin_docs'],
      reformulatedQuery:
        'Implement a flat event structure for composability in components. Flat events and component composability.',
    },
  },
  {
    query: 'How to migrate data during a contract upgrade.',
    expected: {
      search_terms: [
        'data migration upgrade',
        'storage compatibility upgrade',
        'upgrade hook data',
      ],
      resources: ['openzeppelin_docs', 'cairo_book'],
      reformulatedQuery:
        'How to migrate data during a contract upgrade. Data migration strategies and storage compatibility.',
    },
  },
  {
    query: 'Set up Devnet for local testing with pre-deployed accounts.',
    expected: {
      search_terms: [
        'Starknet Devnet setup',
        'pre-deployed accounts devnet',
        'local network config',
      ],
      resources: ['starknet_docs', 'starknet_foundry'],
      reformulatedQuery:
        'Set up Devnet for local testing with pre-deployed accounts. Devnet configuration and account setup.',
    },
  },
  {
    query: 'Implement associated functions in a trait without self.',
    expected: {
      search_terms: [
        'associated functions trait',
        'static methods trait',
        'no self trait functions',
      ],
      resources: ['cairo_book'],
      reformulatedQuery:
        'Implement associated functions in a trait without self. Associated functions and static methods in traits.',
    },
  },
  {
    query: 'How does fee payment work with STRK vs ETH in transactions?',
    expected: {
      search_terms: [
        'fee payment STRK ETH',
        'transaction fees token',
        'burn convert fees',
      ],
      resources: ['starknet_docs'],
      reformulatedQuery:
        'How does fee payment work with STRK vs ETH in transactions? Transaction fee payment mechanisms and token options.',
    },
  },
];
