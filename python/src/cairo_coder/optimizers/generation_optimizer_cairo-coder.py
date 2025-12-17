import marimo

__generated_with = "0.16.2"
app = marimo.App(width="medium")


@app.cell
def _():

    import os

    import dspy

    # Start mlflow for monitoring `mlflow ui --port 5000`
    from dspy.adapters.xml_adapter import XMLAdapter

    from cairo_coder.dspy.document_retriever import SourceFilteredPgVectorRM
    from cairo_coder.server.app import get_vector_store_config

    # Ensure the env var for optimizer is loaded (controls DB connection)
    if os.getenv("OPTIMIZER_RUN") is None:
        os.environ["OPTIMIZER_RUN"] = "true"
    assert os.getenv("OPTIMIZER_RUN") is not None, "OPTIMIZER_RUN should be active."

    # Ensure that LANGSMITH_TRACING is inactive (false)
    if os.getenv("LANGSMITH_TRACING"):
        os.environ["LANGSMITH_TRACING"] = "false"
    assert os.getenv("LANGSMITH_TRACING") != "true", "LANGSMITH_TRACING should be inactive."

    # mlflow.set_tracking_uri("http://127.0.0.1:5000")
    # mlflow.set_experiment("DSPy")
    # mlflow.dspy.autolog()

    ## Setup embedder and LM in dspy.configure
    embedder = dspy.Embedder("gemini/gemini-embedding-001", dimensions=3072, batch_size=512)
    lm = dspy.LM("gemini/gemini-3-flash-preview", max_tokens=30000, cache=False)
    dspy.configure(lm=lm, adapter=XMLAdapter(), embedder=embedder)

    ## Setup VectorDB for document retrieval - will use dspy.settings.embedder
    vector_store_config = get_vector_store_config()
    vector_db = SourceFilteredPgVectorRM(
        db_url=vector_store_config.dsn,
        pg_table_name=vector_store_config.table_name,
        content_field="content",
        fields=["id", "content", "metadata"],
        k=5,  # Default k, will be overridden by retriever
        include_similarity=True,
    )
    return XMLAdapter, dspy, os, vector_db, vector_store_config


@app.cell
def _(dspy, vector_db, vector_store_config):
    # Checking what responses look like without any Optimization / Training Set
    from cairo_coder.core.agent_factory import AgentFactory
    from cairo_coder.core.types import DocumentSource


    agent_factory = AgentFactory(vector_db=vector_db, vector_store_config=vector_store_config)
    documentation_fetcher = agent_factory.get_or_create_agent("cairo-coder", mcp_mode=True)

    # Why not using the RagPipeline directly? Because we want this optimizer run to focus only on the last part (program generation) without the module containing predictors related to fetching.

    class ProgramToOptimize(dspy.Module):
        def __init__(self):
            self.generation_program = documentation_fetcher.generation_program

        async def aforward(
            self,
            query: str,
            chat_history: list | None = None,
            mcp_mode: bool = False,
            sources: list[DocumentSource] | None = None,
        ) -> dspy.Prediction:
            context = await documentation_fetcher.aforward(query=query, mcp_mode=True)
            return await self.generation_program.aforward(
                query=query, context=context, chat_history=None
            )

    generation_program = dspy.syncify(ProgramToOptimize())
    return ProgramToOptimize, generation_program


@app.cell
def _(dspy, os):
    import random

    ### Let's add some examples

    # Note: we can add non-input fields in examples - others are considered labels or metadata
    # print current path
    reference_path = f"{os.getcwd()}/optimizers/datasets/cairo_programs"

    def read_lib_file(program_name: str):
        filepath = f"{reference_path}/{program_name}/src/lib.cairo"
        with open(filepath) as f:
          return f.read()


    example_dataset = [
        {"query": "How to debug the value of a struct? Give a code example", "reference": read_lib_file("debugging_values")},
        {
            "query": "Implement a simple counter contract in Cairo that anyone can increment or decrement with events for each action",
            "reference": read_lib_file("counter_contract")
        },
        {
            "query": "Create an ERC20 token contract named 'MY_ERC20' with 18 decimals and an initial supply minted to the deployer. Once deployed, nothing else can be minted, and there is no owner.",
            "reference": read_lib_file("erc20_supply")

        },
        {
            "query": "Create an ERC721 NFT collection capped at 10,000 items with a base URI setter restricted to an owner and only the owner can mint.",
            "reference": read_lib_file("erc721_nft")
        },
        {
            "query": "Build a simple default ERC20 contract with Ownable access control module with transfer_ownership and renounce_ownership functions",
            "reference": read_lib_file("ownable_erc20")
        },
        {
            "query": "Implement an upgradable class hash manager as a component that supports rolling back a contract that embeds it to the last implementation (with events). Just the component.",
            "reference": read_lib_file("rollback_component")
        },
        {
            "query": "Integrate a reentrancy guard in a simple counter contract.",
            "reference": read_lib_file("reentrancy_guard")
        },
        {
            "query": "Implement a way to pause and unpause transfers for a basic template ERC20 token.",
            "reference": read_lib_file("pausable_erc20")
        },
        # Hand-picked starklings examples
            {
          "query": "Complete the following Cairo code and address the TODOs:\n\n```cairo\n// Address all the TODOs to make the tests pass!\n\n// I AM NOT DONE\n\n#[starknet::interface]\ntrait IContractA<TContractState> {\n    fn set_value(ref self: TContractState, value: u128) -> bool;\n    fn get_value(self: @TContractState) -> u128;\n}\n\n\n#[starknet::contract]\nmod ContractA {\n    use starknet::ContractAddress;\n    use super::IContractBDispatcher;\n    use super::IContractBDispatcherTrait;\n\n    #[storage]\n    struct Storage {\n        contract_b: ContractAddress,\n        value: u128,\n    }\n\n    #[constructor]\n    fn constructor(ref self: ContractState, contract_b: ContractAddress) {\n        self.contract_b.write(contract_b)\n    }\n\n    #[abi(embed_v0)]\n    impl ContractAImpl of super::IContractA<ContractState> {\n        fn set_value(ref self: ContractState, value: u128) -> bool {\n            // TODO: check if contract_b is enabled.\n            // If it is, set the value and return true. Otherwise, return false.\n        }\n\n        fn get_value(self: @ContractState) -> u128 {\n            self.value.read()\n        }\n    }\n}\n\n#[starknet::interface]\ntrait IContractB<TContractState> {\n    fn enable(ref self: TContractState);\n    fn disable(ref self: TContractState);\n    fn is_enabled(self: @TContractState) -> bool;\n}\n\n#[starknet::contract]\nmod ContractB {\n    #[storage]\n    struct Storage {\n        enabled: bool\n    }\n\n    #[constructor]\n    fn constructor(ref self: ContractState) {}\n\n    #[abi(embed_v0)]\n    impl ContractBImpl of super::IContractB<ContractState> {\n        fn enable(ref self: ContractState) {\n            self.enabled.write(true);\n        }\n\n        fn disable(ref self: ContractState) {\n            self.enabled.write(false);\n        }\n\n        fn is_enabled(self: @ContractState) -> bool {\n            self.enabled.read()\n        }\n    }\n}\n\n#[cfg(test)]\nmod test {\n    use snforge_std::{declare, ContractClassTrait, DeclareResultTrait};\n    use starknet::ContractAddress;\n    use super::{IContractBDispatcher, IContractADispatcher, IContractADispatcherTrait, IContractBDispatcherTrait};\n\n\n    fn deploy_contract_b() -> IContractBDispatcher {\n        let contract = declare(\"ContractB\").unwrap().contract_class();\n        let (contract_address, _) = contract.deploy(@array![]).unwrap();\n        IContractBDispatcher { contract_address }\n    }\n\n    fn deploy_contract_a(contract_b_address: ContractAddress) -> IContractADispatcher {\n        let contract = declare(\"ContractA\").unwrap().contract_class();\n        let constructor_calldata = array![contract_b_address.into()];\n        let (contract_address, _) = contract.deploy(@constructor_calldata).unwrap();\n        IContractADispatcher { contract_address }\n    }\n\n    #[test]\n    fn test_interoperability() {\n        // Deploy ContractB\n        let contract_b = deploy_contract_b();\n\n        // Deploy ContractA\n        let contract_a = deploy_contract_a(contract_b.contract_address);\n\n        //TODO interact with contract_b to make the test pass.\n\n        // Tests\n        assert!(contract_a.set_value(300) == true, \"Could not set value\");\n        assert!(contract_a.get_value() == 300, \"Value was not set\");\n        assert!(contract_b.is_enabled() == true, \"Contract b is not enabled\");\n    }\n}\n```\n\nHint: \nYou can call other contracts from inside a contract. To do this, you will need to create a Dispatcher object\nof the type of the called contract. Dispatchers have associated methods available under the `DispatcherTrait`, corresponding to the external functions of the contract that you want to call.\n",
          "reference": "// Address all the TODOs to make the tests pass!\n\n\n\n#[starknet::interface]\ntrait IContractA<TContractState> {\n    fn set_value(ref self: TContractState, value: u128) -> bool;\n    fn get_value(self: @TContractState) -> u128;\n}\n\n\n#[starknet::contract]\nmod ContractA {\n    use starknet::ContractAddress;\n    use super::IContractBDispatcher;\n    use super::IContractBDispatcherTrait;\n    use starknet::storage::*;\n\n    #[storage]\n    struct Storage {\n        contract_b: ContractAddress,\n        value: u128,\n    }\n\n    #[constructor]\n    fn constructor(ref self: ContractState, contract_b: ContractAddress) {\n        self.contract_b.write(contract_b)\n    }\n\n    #[abi(embed_v0)]\n    impl ContractAImpl of super::IContractA<ContractState> {\n        fn set_value(ref self: ContractState, value: u128) -> bool {\n            // TODO: check if contract_b is enabled.\n            // If it is, set the value and return true. Otherwise, return false.\n            let contract_b = self.contract_b.read();\n            let contract_b_dispatcher = IContractBDispatcher { contract_address: contract_b };\n            if contract_b_dispatcher.is_enabled() {\n                self.value.write(value);\n                return true;\n            }\n            return false;\n        }\n\n        fn get_value(self: @ContractState) -> u128 {\n            self.value.read()\n        }\n    }\n}\n\n#[starknet::interface]\ntrait IContractB<TContractState> {\n    fn enable(ref self: TContractState);\n    fn disable(ref self: TContractState);\n    fn is_enabled(self: @TContractState) -> bool;\n}\n\n#[starknet::contract]\nmod ContractB {\n    use starknet::storage::*;\n\n    #[storage]\n    struct Storage {\n        enabled: bool\n    }\n\n    #[constructor]\n    fn constructor(ref self: ContractState) {}\n\n    #[abi(embed_v0)]\n    impl ContractBImpl of super::IContractB<ContractState> {\n        fn enable(ref self: ContractState) {\n            self.enabled.write(true);\n        }\n\n        fn disable(ref self: ContractState) {\n            self.enabled.write(false);\n        }\n\n        fn is_enabled(self: @ContractState) -> bool {\n            self.enabled.read()\n        }\n    }\n}\n\n#[cfg(test)]\nmod test {\n    use snforge_std::{declare, ContractClassTrait, DeclareResultTrait};\n    use starknet::ContractAddress;\n    use super::{IContractBDispatcher, IContractADispatcher, IContractADispatcherTrait, IContractBDispatcherTrait};\n\n\n    fn deploy_contract_b() -> IContractBDispatcher {\n        let contract = declare(\"ContractB\").unwrap().contract_class();\n        let (contract_address, _) = contract.deploy(@array![]).unwrap();\n        IContractBDispatcher { contract_address }\n    }\n\n    fn deploy_contract_a(contract_b_address: ContractAddress) -> IContractADispatcher {\n        let contract = declare(\"ContractA\").unwrap().contract_class();\n        let constructor_calldata = array![contract_b_address.into()];\n        let (contract_address, _) = contract.deploy(@constructor_calldata).unwrap();\n        IContractADispatcher { contract_address }\n    }\n\n    #[test]\n    fn test_interoperability() {\n        // Deploy ContractB\n        let contract_b = deploy_contract_b();\n\n        // Deploy ContractA\n        let contract_a = deploy_contract_a(contract_b.contract_address);\n\n        // Enable contract_b to make the test pass\n        contract_b.enable();\n\n        // Tests\n        assert!(contract_a.set_value(300) == true, \"Could not set value\");\n        assert!(contract_a.get_value() == 300, \"Value was not set\");\n        assert!(contract_b.is_enabled() == true, \"Contract b is not enabled\");\n    }\n}"
        },
        {
          "query": "Complete the following Cairo code and address the TODOs:\n\n```cairo\n// Joe liked Jill's work very much. He really likes how useful storage can be.\n// Now they decided to write a contract to track the number of exercises they\n// complete successfully. Jill says they can use the owner code and allow\n// only the owner to update the contract, they agree.\n// Can you help them write this contract?\n\n// I AM NOT DONE\n\nuse starknet::ContractAddress;\n\n#[starknet::interface]\ntrait IProgressTracker<TContractState> {\n    fn set_progress(ref self: TContractState, user: ContractAddress, new_progress: u16);\n    fn get_progress(self: @TContractState, user: ContractAddress) -> u16;\n    fn get_contract_owner(self: @TContractState) -> ContractAddress;\n}\n\n#[starknet::contract]\nmod ProgressTracker {\n    use starknet::ContractAddress;\n    use starknet::get_caller_address; // Required to use get_caller_address function\n    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess, StoragePathEntry, Map};\n\n    #[storage]\n    struct Storage {\n        contract_owner: ContractAddress,\n        // TODO: Set types for Map\n        progress: Map<>\n    }\n\n    #[constructor]\n    fn constructor(ref self: ContractState, owner: ContractAddress) {\n        self.contract_owner.write(owner);\n    }\n\n\n    #[abi(embed_v0)]\n    impl ProgressTrackerImpl of super::IProgressTracker<ContractState> {\n        fn set_progress(\n            ref self: ContractState, user: ContractAddress, new_progress: u16\n        ) { // TODO: assert owner is calling\n        // TODO: set new_progress for user,\n        }\n\n        fn get_progress(self: @ContractState, user: ContractAddress) -> u16 { // Get user progress\n        }\n\n        fn get_contract_owner(self: @ContractState) -> ContractAddress {\n            self.contract_owner.read()\n        }\n    }\n}\n\n#[cfg(test)]\nmod test {\n    use starknet::ContractAddress;\n    use super::IProgressTrackerDispatcher;\n    use super::IProgressTrackerDispatcherTrait;\n    use super::ProgressTracker;\n    use snforge_std::{declare, ContractClassTrait, DeclareResultTrait, start_cheat_caller_address, stop_cheat_caller_address};\n\n    #[test]\n    fn test_owner() {\n        let owner: ContractAddress = 'Sensei'.try_into().unwrap();\n        let dispatcher = deploy_contract();\n        assert!(owner == dispatcher.get_contract_owner(), \"Mr. Sensei should be the owner\");\n    }\n\n    #[test]\n    fn test_set_progress() {\n        let owner = util_felt_addr('Sensei');\n        let dispatcher = deploy_contract();\n\n        // Call contract as owner\n        start_cheat_caller_address(dispatcher.contract_address, owner);\n\n        // Set progress\n        dispatcher.set_progress('Joe'.try_into().unwrap(), 20);\n        dispatcher.set_progress('Jill'.try_into().unwrap(), 25);\n\n        let joe_score = dispatcher.get_progress('Joe'.try_into().unwrap());\n        assert(joe_score == 20, 'Joe\\'s progress should be 20');\n\n        stop_cheat_caller_address(dispatcher.contract_address);\n    }\n\n    #[test]\n    #[should_panic]\n    fn test_set_progress_fail() {\n        let dispatcher = deploy_contract();\n\n        let jon_doe = util_felt_addr('JonDoe');\n        // Caller not owner\n        start_cheat_caller_address(dispatcher.contract_address, jon_doe);\n\n        // Try to set progress, should panic to pass test!\n        dispatcher.set_progress('Joe'.try_into().unwrap(), 20);\n\n        stop_cheat_caller_address(dispatcher.contract_address);\n    }\n\n    fn util_felt_addr(addr_felt: felt252) -> ContractAddress {\n        addr_felt.try_into().unwrap()\n    }\n\n    fn deploy_contract() -> IProgressTrackerDispatcher {\n        let owner: felt252 = 'Sensei';\n        let mut calldata = ArrayTrait::new();\n        calldata.append(owner);\n\n        let contract = declare(\"ProgressTracker\").unwrap().contract_class();\n        let (contract_address, _) = contract.deploy(@calldata).unwrap();\n        IProgressTrackerDispatcher { contract_address }\n    }\n}\n```\n\nHint: No hints this time ;)\n",
          "reference": "// Joe liked Jill's work very much. He really likes how useful storage can be.\n// Now they decided to write a contract to track the number of exercises they\n// complete successfully. Jill says they can use the owner code and allow\n// only the owner to update the contract, they agree.\n// Can you help them write this contract?\n\nuse starknet::ContractAddress;\n\n#[starknet::interface]\ntrait IProgressTracker<TContractState> {\n    fn set_progress(ref self: TContractState, user: ContractAddress, new_progress: u16);\n    fn get_progress(self: @TContractState, user: ContractAddress) -> u16;\n    fn get_contract_owner(self: @TContractState) -> ContractAddress;\n}\n\n#[starknet::contract]\nmod ProgressTracker {\n    use starknet::ContractAddress;\n    use starknet::get_caller_address; // Required to use get_caller_address function\n    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess, StoragePathEntry, Map, StorageMapReadAccess, StorageMapWriteAccess};\n\n    #[storage]\n    struct Storage {\n        contract_owner: ContractAddress,\n        progress: Map<ContractAddress, u16>\n    }\n\n    #[constructor]\n    fn constructor(ref self: ContractState, owner: ContractAddress) {\n        self.contract_owner.write(owner);\n    }\n\n\n    #[abi(embed_v0)]\n    impl ProgressTrackerImpl of super::IProgressTracker<ContractState> {\n        fn set_progress(\n            ref self: ContractState, user: ContractAddress, new_progress: u16\n        ) {\n            // Assert owner is calling\n            let caller = get_caller_address();\n            let owner = self.contract_owner.read();\n            assert!(caller == owner, \"Only owner can set progress\");\n\n            // Set new_progress for user\n            self.progress.write(user, new_progress);\n        }\n\n        fn get_progress(self: @ContractState, user: ContractAddress) -> u16 {\n            // Get user progress\n            self.progress.read(user)\n        }\n\n        fn get_contract_owner(self: @ContractState) -> ContractAddress {\n            self.contract_owner.read()\n        }\n    }\n}\n\n#[cfg(test)]\nmod test {\n    use starknet::ContractAddress;\n    use super::IProgressTrackerDispatcher;\n    use super::IProgressTrackerDispatcherTrait;\n    use super::ProgressTracker;\n    use snforge_std::{declare, ContractClassTrait, DeclareResultTrait, start_cheat_caller_address, stop_cheat_caller_address};\n\n    #[test]\n    fn test_owner() {\n        let owner: ContractAddress = 'Sensei'.try_into().unwrap();\n        let dispatcher = deploy_contract();\n        assert!(owner == dispatcher.get_contract_owner(), \"Mr. Sensei should be the owner\");\n    }\n\n    #[test]\n    fn test_set_progress() {\n        let owner = util_felt_addr('Sensei');\n        let dispatcher = deploy_contract();\n\n        // Call contract as owner\n        start_cheat_caller_address(dispatcher.contract_address, owner);\n\n        // Set progress\n        dispatcher.set_progress('Joe'.try_into().unwrap(), 20);\n        dispatcher.set_progress('Jill'.try_into().unwrap(), 25);\n\n        let joe_score = dispatcher.get_progress('Joe'.try_into().unwrap());\n        assert(joe_score == 20, 'Joe\\'s progress should be 20');\n\n        stop_cheat_caller_address(dispatcher.contract_address);\n    }\n\n    #[test]\n    #[should_panic]\n    fn test_set_progress_fail() {\n        let dispatcher = deploy_contract();\n\n        let jon_doe = util_felt_addr('JonDoe');\n        // Caller not owner\n        start_cheat_caller_address(dispatcher.contract_address, jon_doe);\n\n        // Try to set progress, should panic to pass test!\n        dispatcher.set_progress('Joe'.try_into().unwrap(), 20);\n\n        stop_cheat_caller_address(dispatcher.contract_address);\n    }\n\n    fn util_felt_addr(addr_felt: felt252) -> ContractAddress {\n        addr_felt.try_into().unwrap()\n    }\n\n    fn deploy_contract() -> IProgressTrackerDispatcher {\n        let owner: felt252 = 'Sensei';\n        let mut calldata = ArrayTrait::new();\n        calldata.append(owner);\n\n        let contract = declare(\"ProgressTracker\").unwrap().contract_class();\n        let (contract_address, _) = contract.deploy(@calldata).unwrap();\n        IProgressTrackerDispatcher { contract_address }\n    }\n}"
        },
            {
          "query": "Complete the following Cairo code and address the TODOs:\n\n```cairo\n// Joe's contract in the last exercise showed that Joe is the owner of the contract.\n// He thanks you for helping him out!\n// Jill says that contract should allow setting the owner when contract is deployed.\n// Help Jill rewrite the contract with a Storage and a constructor.\n// There is a `ContractAddress` type which should be used for Wallet addresses.\n\n// I AM NOT DONE\n\nuse starknet::ContractAddress;\n\n#[starknet::contract]\nmod JillsContract {\n    // This is required to use ContractAddress type\n    use starknet::ContractAddress;\n\n    #[storage]\n    struct Storage { // TODO: Add `contract_owner` storage, with ContractAddress type\n    }\n\n    #[constructor]\n    fn constructor(\n        ref self: ContractState, owner: ContractAddress,\n    ) { // TODO: Write `owner` to contract_owner storage\n    }\n\n    #[abi(embed_v0)]\n    impl IJillsContractImpl of super::IJillsContract<ContractState> {\n        fn get_owner(self: @ContractState) -> ContractAddress { // TODO: Read contract_owner storage\n        }\n    }\n}\n\n#[starknet::interface]\ntrait IJillsContract<TContractState> {\n    fn get_owner(self: @TContractState) -> ContractAddress;\n}\n\n#[cfg(test)]\nmod test {\n    use snforge_std::{ContractClassTrait, DeclareResultTrait, declare};\n    use super::{IJillsContractDispatcher, IJillsContractDispatcherTrait, JillsContract};\n\n    #[test]\n    fn test_owner_setting() {\n        let mut calldata = ArrayTrait::new();\n        calldata.append('Jill');\n\n        let contract = declare(\"JillsContract\").unwrap().contract_class();\n        let (contract_address, _) = contract.deploy(@calldata).unwrap();\n        let dispatcher = IJillsContractDispatcher { contract_address };\n        let owner = dispatcher.get_owner();\n        assert!(owner == 'Jill'.try_into().unwrap(), \"Owner should be Jill\");\n    }\n}\n```\n\nHint: No hints this time ;)\n",
          "reference": "// Joe's contract in the last exercise showed that Joe is the owner of the contract.\n// He thanks you for helping him out!\n// Jill says that contract should allow setting the owner when contract is deployed.\n// Help Jill rewrite the contract with a Storage and a constructor.\n// There is a `ContractAddress` type which should be used for Wallet addresses.\n\nuse starknet::ContractAddress;\n\n#[starknet::contract]\nmod JillsContract {\n    // This is required to use ContractAddress type\n    use starknet::ContractAddress;\n    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};\n\n    #[storage]\n    struct Storage {\n        contract_owner: ContractAddress,\n    }\n\n    #[constructor]\n    fn constructor(\n        ref self: ContractState, owner: ContractAddress\n    ) {\n        self.contract_owner.write(owner);\n    }\n\n    #[abi(embed_v0)]\n    impl IJillsContractImpl of super::IJillsContract<ContractState> {\n        fn get_owner(self: @ContractState) -> ContractAddress {\n            self.contract_owner.read()\n        }\n    }\n}\n\n#[starknet::interface]\ntrait IJillsContract<TContractState> {\n    fn get_owner(self: @TContractState) -> ContractAddress;\n}\n\n#[cfg(test)]\nmod test {\n    use super::IJillsContractDispatcher;\n    use super::IJillsContractDispatcherTrait;\n    use super::JillsContract;\n    use snforge_std::{declare, ContractClassTrait, DeclareResultTrait};\n\n    #[test]\n    fn test_owner_setting() {\n        let mut calldata = ArrayTrait::new();\n        calldata.append('Jill');\n\n        let contract = declare(\"JillsContract\").unwrap().contract_class();\n        let (contract_address, _) = contract.deploy(@calldata).unwrap();\n        let dispatcher = IJillsContractDispatcher { contract_address };\n        let owner = dispatcher.get_owner();\n        assert!(owner == 'Jill'.try_into().unwrap(), \"Owner should be Jill\");\n    }\n}"
        },
        {
          "query": "Complete the following Cairo code and address the TODOs:\n\n```cairo\n// Liz, a friend of Jill, wants to manage inventory for her store on-chain.\n// This is a bit challenging for Joe and Jill, Liz prepared an outline\n// for how contract should work, can you help Jill and Joe write it?\n\n// I AM NOT DONE\n\nuse starknet::ContractAddress;\n\n#[starknet::interface]\ntrait ILizInventory<TContractState> {\n    fn add_stock(ref self: TContractState, product: felt252, new_stock: u32);\n    fn purchase(ref self: TContractState, product: felt252, quantity: u32);\n    fn get_stock(self: @TContractState, product: felt252) -> u32;\n    fn get_owner(self: @TContractState) -> ContractAddress;\n}\n\n#[starknet::contract]\nmod LizInventory {\n    use starknet::ContractAddress;\n    use starknet::get_caller_address;\n    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess, StoragePathEntry, Map};\n\n    #[storage]\n    struct Storage {\n        contract_owner: ContractAddress,\n        // TODO: add storage inventory, that maps product (felt252) to stock quantity (u32)\n    }\n\n    #[constructor]\n    fn constructor(ref self: ContractState, owner: ContractAddress) {\n        self.contract_owner.write(owner);\n    }\n\n\n    #[abi(embed_v0)]\n    impl LizInventoryImpl of super::ILizInventory<ContractState> {\n        fn add_stock(ref self: ContractState, ) {\n            // TODO:\n            // * takes product and new_stock\n            // * adds new_stock to stock in inventory\n            // * only owner can call this\n        }\n\n        fn purchase(ref self: ContractState, ) {\n            // TODO:\n            // * takes product and quantity\n            // * subtracts quantity from stock in inventory\n            // * anybody can call this\n        }\n\n        fn get_stock(self: @ContractState, ) -> u32 {\n            // TODO:\n            // * takes product\n            // * returns product stock in inventory\n        }\n\n        fn get_owner(self: @ContractState) -> ContractAddress {\n            self.contract_owner.read()\n        }\n    }\n}\n\n#[cfg(test)]\nmod test {\n    use starknet::ContractAddress;\n    use super::LizInventory;\n    use super::ILizInventoryDispatcher;\n    use super::ILizInventoryDispatcherTrait;\n    use snforge_std::{declare, ContractClassTrait, DeclareResultTrait, start_cheat_caller_address, stop_cheat_caller_address};\n\n    #[test]\n    fn test_owner() {\n        let owner: ContractAddress = 'Elizabeth'.try_into().unwrap();\n        let dispatcher = deploy_contract();\n\n        // Check that contract owner is set\n        let contract_owner = dispatcher.get_owner();\n        assert!(contract_owner == owner, \"Elizabeth should be the owner\");\n    }\n\n    #[test]\n    fn test_stock() {\n        let dispatcher = deploy_contract();\n        let owner = util_felt_addr('Elizabeth');\n\n        // Call contract as owner\n        start_cheat_caller_address(dispatcher.contract_address, owner);\n\n        // Add stock\n        dispatcher.add_stock('Nano', 10);\n        let stock = dispatcher.get_stock('Nano');\n        assert!(stock == 10, \"stock should be 10\");\n\n        dispatcher.add_stock('Nano', 15);\n        let stock = dispatcher.get_stock('Nano');\n        assert!(stock == 25, \"stock should be 25\");\n\n        stop_cheat_caller_address(dispatcher.contract_address);\n    }\n\n    #[test]\n    fn test_stock_purchase() {\n        let owner = util_felt_addr('Elizabeth');\n        let dispatcher = deploy_contract();\n        // Call contract as owner\n        start_cheat_caller_address(dispatcher.contract_address, owner);\n\n        // Add stock\n        dispatcher.add_stock('Nano', 10);\n        let stock = dispatcher.get_stock('Nano');\n        assert!(stock == 10, \"stock should be 10\");\n\n        // Call contract as different address\n        stop_cheat_caller_address(dispatcher.contract_address);\n        start_cheat_caller_address(dispatcher.contract_address, 0.try_into().unwrap());\n\n        dispatcher.purchase('Nano', 2);\n        let stock = dispatcher.get_stock('Nano');\n        assert!(stock == 8, \"stock should be 8\");\n\n        stop_cheat_caller_address(dispatcher.contract_address);\n    }\n\n    #[test]\n    #[should_panic]\n    fn test_set_stock_fail() {\n        let dispatcher = deploy_contract();\n        // Try to add stock, should panic to pass test!\n        dispatcher.add_stock('Nano', 20);\n    }\n\n    #[test]\n    #[should_panic]\n    fn test_purchase_out_of_stock() {\n        let dispatcher = deploy_contract();\n        // Purchase out of stock\n        dispatcher.purchase('Nano', 2);\n    }\n\n    fn util_felt_addr(addr_felt: felt252) -> ContractAddress {\n        addr_felt.try_into().unwrap()\n    }\n\n    fn deploy_contract() -> ILizInventoryDispatcher {\n        let owner: felt252 = 'Elizabeth';\n        let mut calldata = ArrayTrait::new();\n        calldata.append(owner);\n\n        let contract = declare(\"LizInventory\").unwrap().contract_class();\n        let (contract_address, _) = contract.deploy(@calldata).unwrap();\n        ILizInventoryDispatcher { contract_address }\n    }\n}\n```\n\nHint: \nYou can use Map<felt252, u32> for inventory.\n",
          "reference": "// Liz, a friend of Jill, wants to manage inventory for her store on-chain.\n// This is a bit challenging for Joe and Jill, Liz prepared an outline\n// for how contract should work, can you help Jill and Joe write it?\n\nuse starknet::ContractAddress;\n\n#[starknet::interface]\ntrait ILizInventory<TContractState> {\n    fn add_stock(ref self: TContractState, product: felt252, new_stock: u32);\n    fn purchase(ref self: TContractState, product: felt252, quantity: u32);\n    fn get_stock(self: @TContractState, product: felt252) -> u32;\n    fn get_owner(self: @TContractState) -> ContractAddress;\n}\n\n#[starknet::contract]\nmod LizInventory {\n    use starknet::ContractAddress;\n    use starknet::get_caller_address;\n    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess, StoragePathEntry, Map, StorageMapReadAccess, StorageMapWriteAccess};\n\n    #[storage]\n    struct Storage {\n        contract_owner: ContractAddress,\n        inventory: Map<felt252, u32>,\n    }\n\n    #[constructor]\n    fn constructor(ref self: ContractState, owner: ContractAddress) {\n        self.contract_owner.write(owner);\n    }\n\n\n    #[abi(embed_v0)]\n    impl LizInventoryImpl of super::ILizInventory<ContractState> {\n        fn add_stock(ref self: ContractState, product: felt252, new_stock: u32) {\n            // Only owner can call this\n            let caller = get_caller_address();\n            let owner = self.contract_owner.read();\n            assert!(caller == owner, \"Only owner can add stock\");\n\n            // Add new_stock to existing stock in inventory\n            let current_stock = self.inventory.entry(product).read();\n            let updated_stock = current_stock + new_stock;\n            self.inventory.entry(product).write(updated_stock);\n        }\n\n        fn purchase(ref self: ContractState, product: felt252, quantity: u32) {\n            // Anybody can call this\n            // Subtract quantity from stock in inventory\n            let current_stock = self.inventory.entry(product).read();\n            assert!(current_stock >= quantity, \"Insufficient stock\");\n\n            let updated_stock = current_stock - quantity;\n            self.inventory.entry(product).write(updated_stock);\n        }\n\n        fn get_stock(self: @ContractState, product: felt252) -> u32 {\n            // Returns product stock in inventory\n            self.inventory.entry(product).read()\n        }\n\n        fn get_owner(self: @ContractState) -> ContractAddress {\n            self.contract_owner.read()\n        }\n    }\n}\n\n#[cfg(test)]\nmod test {\n    use starknet::ContractAddress;\n    use super::LizInventory;\n    use super::ILizInventoryDispatcher;\n    use super::ILizInventoryDispatcherTrait;\n    use snforge_std::{declare, ContractClassTrait, DeclareResultTrait, start_cheat_caller_address, stop_cheat_caller_address};\n\n    #[test]\n    fn test_owner() {\n        let owner: ContractAddress = 'Elizabeth'.try_into().unwrap();\n        let dispatcher = deploy_contract();\n\n        // Check that contract owner is set\n        let contract_owner = dispatcher.get_owner();\n        assert!(contract_owner == owner, \"Elizabeth should be the owner\");\n    }\n\n    #[test]\n    fn test_stock() {\n        let dispatcher = deploy_contract();\n        let owner = util_felt_addr('Elizabeth');\n\n        // Call contract as owner\n        start_cheat_caller_address(dispatcher.contract_address, owner);\n\n        // Add stock\n        dispatcher.add_stock('Nano', 10);\n        let stock = dispatcher.get_stock('Nano');\n        assert!(stock == 10, \"stock should be 10\");\n\n        dispatcher.add_stock('Nano', 15);\n        let stock = dispatcher.get_stock('Nano');\n        assert!(stock == 25, \"stock should be 25\");\n\n        stop_cheat_caller_address(dispatcher.contract_address);\n    }\n\n    #[test]\n    fn test_stock_purchase() {\n        let owner = util_felt_addr('Elizabeth');\n        let dispatcher = deploy_contract();\n        // Call contract as owner\n        start_cheat_caller_address(dispatcher.contract_address, owner);\n\n        // Add stock\n        dispatcher.add_stock('Nano', 10);\n        let stock = dispatcher.get_stock('Nano');\n        assert!(stock == 10, \"stock should be 10\");\n\n        // Call contract as different address\n        stop_cheat_caller_address(dispatcher.contract_address);\n        start_cheat_caller_address(dispatcher.contract_address, 0.try_into().unwrap());\n\n        dispatcher.purchase('Nano', 2);\n        let stock = dispatcher.get_stock('Nano');\n        assert!(stock == 8, \"stock should be 8\");\n\n        stop_cheat_caller_address(dispatcher.contract_address);\n    }\n\n    #[test]\n    #[should_panic]\n    fn test_set_stock_fail() {\n        let dispatcher = deploy_contract();\n        // Try to add stock, should panic to pass test!\n        dispatcher.add_stock('Nano', 20);\n    }\n\n    #[test]\n    #[should_panic]\n    fn test_purchase_out_of_stock() {\n        let dispatcher = deploy_contract();\n        // Purchase out of stock\n        dispatcher.purchase('Nano', 2);\n    }\n\n    fn util_felt_addr(addr_felt: felt252) -> ContractAddress {\n        addr_felt.try_into().unwrap()\n    }\n\n    fn deploy_contract() -> ILizInventoryDispatcher {\n        let owner: felt252 = 'Elizabeth';\n        let mut calldata = ArrayTrait::new();\n        calldata.append(owner);\n\n        let contract = declare(\"LizInventory\").unwrap().contract_class();\n        let (contract_address, _) = contract.deploy(@calldata).unwrap();\n        ILizInventoryDispatcher { contract_address }\n    }\n}"
        },
            {
          "query": "Complete the following Cairo code and address the TODOs:\n\n```cairo\n// Starkling, Joe, is writing a really simple contract.\n// The contract shows that he is the owner of the contract.\n// However, his contract is not working. What's he missing?\n\n// I AM NOT DONE\n\n#[starknet::interface]\ntrait IJoesContract<TContractState> {\n    fn get_owner(self: @TContractState) -> felt252;\n}\n\n#[starknet::contract]\nmod JoesContract {\n    #[storage]\n    struct Storage {}\n\n    impl IJoesContractImpl of super::IJoesContract<ContractState> {\n        fn get_owner(self: @ContractState) -> felt252 {\n            'Joe'\n        }\n    }\n}\n\n#[cfg(test)]\nmod test {\n    use snforge_std::{ContractClassTrait, DeclareResultTrait, declare};\n    use super::{IJoesContractDispatcher, IJoesContractDispatcherTrait, JoesContract};\n\n    #[test]\n    fn test_contract_view() {\n        let dispatcher = deploy_contract();\n        assert!('Joe' == dispatcher.get_owner(), \"Joe should be the owner.\");\n    }\n\n    fn deploy_contract() -> IJoesContractDispatcher {\n        let contract = declare(\"JoesContract\").unwrap().contract_class();\n        let (contract_address, _) = contract.deploy(@array![]).unwrap();\n        IJoesContractDispatcher { contract_address }\n    }\n}\n```\n\nHint: No hints this time ;)\n",
          "reference": "// Starkling, Joe, is writing a really simple contract.\n// The contract shows that he is the owner of the contract.\n// However, his contract is not working. What's he missing?\n\n#[starknet::interface]\ntrait IJoesContract<TContractState> {\n    fn get_owner(self: @TContractState) -> felt252;\n}\n\n#[starknet::contract]\nmod JoesContract {\n    #[storage]\n    struct Storage {}\n\n    #[abi(embed_v0)]\n    impl IJoesContractImpl of super::IJoesContract<ContractState> {\n        fn get_owner(self: @ContractState) -> felt252 {\n            'Joe'\n        }\n    }\n}\n\n#[cfg(test)]\nmod test {\n    use super::JoesContract;\n    use super::IJoesContractDispatcher;\n    use super::IJoesContractDispatcherTrait;\n    use snforge_std::{declare, ContractClassTrait, DeclareResultTrait};\n\n    #[test]\n    fn test_contract_view() {\n        let dispatcher = deploy_contract();\n        assert!('Joe' == dispatcher.get_owner(), \"Joe should be the owner.\");\n    }\n\n    fn deploy_contract() -> IJoesContractDispatcher {\n        let contract = declare(\"JoesContract\").unwrap().contract_class();\n        let (contract_address, _) = contract.deploy(@array![]).unwrap();\n        IJoesContractDispatcher { contract_address }\n    }\n}"
        },
        {
          "query": "Complete the following Cairo code and address the TODOs:\n\n```cairo\n// This code is using Starknet components to make a reusable owner feature.\n// This should add OwnableComponent containing functionality which any contracts can include.\n// But something is fishy here as this component is not working, can you find the error and make the tests pass?\n\n// I AM NOT DONE\n\nuse starknet::ContractAddress;\n\n#[starknet::interface]\ntrait IOwnable<TContractState> {\n    fn owner(self: @TContractState) -> ContractAddress;\n    fn set_owner(ref self: TContractState, new_owner: ContractAddress);\n}\n\npub mod OwnableComponent {\n    use starknet::ContractAddress;\n    use super::IOwnable;\n\n    #[storage]\n    pub struct Storage {\n        owner: ContractAddress,\n    }\n\n    #[embeddable_as(Ownable)]\n    impl OwnableImpl<\n        TContractState, +HasComponent<TContractState>\n    > of IOwnable<ComponentState<TContractState>> {\n        fn owner(self: @ComponentState<TContractState>) -> ContractAddress {\n            self.owner.read()\n        }\n        fn set_owner(ref self: ComponentState<TContractState>, new_owner: ContractAddress) {\n            self.owner.write(new_owner);\n        }\n    }\n}\n\n#[starknet::contract]\npub mod OwnableCounter {\n    use starknet::ContractAddress;\n    use super::OwnableComponent;\n\n    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);\n\n    #[abi(embed_v0)]\n    impl OwnableImpl = OwnableComponent::Ownable<ContractState>;\n\n    #[event]\n    #[derive(Drop, starknet::Event)]\n    enum Event {\n        #[flat]\n        OwnableEvent: OwnableComponent::Event,\n    }\n    #[storage]\n    pub struct Storage {\n        counter: u128,\n        #[substorage(v0)]\n        ownable: OwnableComponent::Storage,\n    }\n}\n\n#[cfg(test)]\nmod tests {\n    use crate::IOwnableDispatcherTrait;\n    use snforge_std::{declare, ContractClassTrait, DeclareResultTrait};\n    use starknet::{contract_address_const, ContractAddress};\n    use super::IOwnableDispatcher;\n\n    fn deploy_ownable_counter() -> IOwnableDispatcher {\n        let contract = declare(\"OwnableCounter\").unwrap().contract_class();\n        let (contract_address, _) = contract.deploy(@array![]).unwrap();\n        IOwnableDispatcher { contract_address }\n    }\n\n    #[test]\n    fn test_contract_read() {\n        let dispatcher = deploy_ownable_counter();\n        let address_0 = 0;\n        dispatcher.set_owner(address_0.try_into().unwrap());\n        assert(address_0.try_into().unwrap() == dispatcher.owner(), 'Some fuck up happened');\n    }\n\n    #[test]\n    #[should_panic]\n    fn test_contract_read_fail() {\n        let dispatcher = deploy_ownable_counter();\n        let address_0 = 0;\n        let address_1 = 1;\n        dispatcher.set_owner(address_0.try_into().unwrap());\n        assert(address_1.try_into().unwrap() == dispatcher.owner(), 'Some fuck up happened');\n    }\n}\n```\n\nHint: Is there maybe a decorator that annotates that a module is a component? 🤔🤔🤔\n",
          "reference": "// This code is using Starknet components to make a reusable owner feature.\n// This should add OwnableComponent containing functionality which any contracts can include.\n// But something is fishy here as this component is not working, can you find the error and make the tests pass?\n\nuse starknet::ContractAddress;\n\n#[starknet::interface]\ntrait IOwnable<TContractState> {\n    fn owner(self: @TContractState) -> ContractAddress;\n    fn set_owner(ref self: TContractState, new_owner: ContractAddress);\n}\n\n#[starknet::component]\npub mod OwnableComponent {\n    use starknet::ContractAddress;\n    use starknet::storage::*;\n    use super::IOwnable;\n\n    #[storage]\n    pub struct Storage {\n        owner: ContractAddress,\n    }\n\n    #[embeddable_as(Ownable)]\n    impl OwnableImpl<\n        TContractState, +HasComponent<TContractState>\n    > of IOwnable<ComponentState<TContractState>> {\n        fn owner(self: @ComponentState<TContractState>) -> ContractAddress {\n            self.owner.read()\n        }\n        fn set_owner(ref self: ComponentState<TContractState>, new_owner: ContractAddress) {\n            self.owner.write(new_owner);\n        }\n    }\n}\n\n#[starknet::contract]\npub mod OwnableCounter {\n    use starknet::ContractAddress;\n    use super::OwnableComponent;\n\n    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);\n\n    #[abi(embed_v0)]\n    impl OwnableImpl = OwnableComponent::Ownable<ContractState>;\n\n    #[event]\n    #[derive(Drop, starknet::Event)]\n    enum Event {\n        #[flat]\n        OwnableEvent: OwnableComponent::Event,\n    }\n    #[storage]\n    pub struct Storage {\n        counter: u128,\n        #[substorage(v0)]\n        ownable: OwnableComponent::Storage,\n    }\n}\n\n#[cfg(test)]\nmod tests {\n    use crate::IOwnableDispatcherTrait;\n    use snforge_std::{declare, ContractClassTrait, DeclareResultTrait};\n    use starknet::{contract_address_const, ContractAddress};\n    use super::IOwnableDispatcher;\n\n    fn deploy_ownable_counter() -> IOwnableDispatcher {\n        let contract = declare(\"OwnableCounter\").unwrap().contract_class();\n        let (contract_address, _) = contract.deploy(@array![]).unwrap();\n        IOwnableDispatcher { contract_address }\n    }\n\n    #[test]\n    fn test_contract_read() {\n        let dispatcher = deploy_ownable_counter();\n        let address_0 = 0;\n        dispatcher.set_owner(address_0.try_into().unwrap());\n        assert(address_0.try_into().unwrap() == dispatcher.owner(), 'Some fuck up happened');\n    }\n\n    #[test]\n    #[should_panic]\n    fn test_contract_read_fail() {\n        let dispatcher = deploy_ownable_counter();\n        let address_0 = 0;\n        let address_1 = 1;\n        dispatcher.set_owner(address_0.try_into().unwrap());\n        assert(address_1.try_into().unwrap() == dispatcher.owner(), 'Some fuck up happened');\n    }\n}"
        }
        # {
        #     "query": "Write a Cairo function to find the smallest number in a u32 array input and return its index"
        # },

        # {
        #     "query": "Implement a minimal fixed-point math library using Q32.32 with a single add function"
        # },
        # {
        #     "query": "Write a unit test suite for Cairo for a classic OpenZeppelin ERC20: tests for mint, burn, transfer, allowance, and edge cases"
        # },
        # {
        #     "query": "Write a u256 arithmetic library (add, sub, mul, div, mod) using Cairo builtins and safe overflow checks"
        # },
        # {
        #     "query": "Develop an upgradeable proxy contract for Starknet with get_implementation, set_implementation (owner-only), and delegate calls"
        # },
        # {
        #     "query": "Implement an ERC1155 multi-token contract"
        # },
        # {
        #     "query": "Write a library to compute Poseidon hash of an array and verify a given hash matches contents"
        # },
        # {
        #     "query": "Create a Merkle tree proof verifier for membership proofs over felt252 leaves"
        # }
    ]

    data = [dspy.Example(**d).with_inputs("query") for d in example_dataset]

    # Take maximum 300 random values from the dataset
    random.seed(42)
    random.shuffle(data)
    data = data[0:300]
    # train_set = data[: int(len(data) * 0.33)]
    # val_set = data[int(len(data) * 0.33) : int(len(data) * 0.66)]
    # test_set = data[int(len(data) * 0.66) :]

    train_set = data[: int(len(data) * 0.5)]
    val_set = data[int(len(data) * 0.5):]
    test_set = data
    return data, test_set, train_set, val_set


@app.cell
def _(data, dspy, generation_program):
    # Extract cairo code from answer, if any
    from cairo_coder.optimizers.generation.utils import check_compilation, extract_cairo_code

    # Selecting one example
    example = data[0]
    print(example)
    # Querying with the examples
    response = generation_program(example.query)
    print(response)
    dspy.inspect_history(n=1)

    answer_code = extract_cairo_code(response.answer)
    compil_res = check_compilation(answer_code)
    if compil_res["success"] is False:
        err_str = compil_res["error"]
        print(err_str)
    else:
        print("Compiles! 🔥")
    return check_compilation, extract_cairo_code


@app.cell
def _(XMLAdapter, check_compilation, dspy, extract_cairo_code):
    # Defining our metrics here.
    from typing import Optional

    from cairo_coder.dspy.query_processor import RESOURCE_DESCRIPTIONS

    ", ".join(
        [f"{key.value}: {value}" for key, value in RESOURCE_DESCRIPTIONS.items()]
    )

    class GeneratedCodeRater(dspy.Signature):
        """
        Analyze the user's query and its generated code. Use the compilation result and the logic of the generated code to assign it a score on how well it answers the user's query, and provide feedback on what to improve based on Cairo and its ecosystem knowledge and the golden code reference.
        """

        query: str = dspy.InputField(desc="The query of the user")
        generated_code: str = dspy.InputField(desc="The cairo code that was generated from the user's query")
        compilation_result: str = dspy.InputField(desc="The result of compiling the generated code. If it succeeded, this is a string 'The program compiles successfully.'. Otherwise, it's the error message. ")
        golden_reference: str = dspy.InputField(desc="A golden code reference of what the ideal code looks like.")
        score: float = dspy.OutputField(
            desc="A confidence score in range [0, 1.0] on the possibility to give a precise and fully accurate answer based on the provided context. 0 means that the code is totally wrong, as it has logical issues AND wont compile; 0.5 means that the code is _mostly_ correct but there might be a few minor compilation issues left, but it's close to the golden reference; 1.0 means that the code is correct, similar on behavior to the reference AND it compiles."
        )
        feedback: Optional[str] = dspy.OutputField(
            desc="A textual feedback on how to improve the generated code. First, have we properly leveraged libraries (mostly openzeppelin), are our corelib imports correct, have we imported the right items; and if not, what should we change, based on the reference? Second, how can we fix our compilation issues, based on the golden reference? Third, is the logic implemented correct? If we made logical issues, how to fix them? Are we properly leveraging the Cairo features outlined in the golden example? Third, note all differences between the gold reference and the prediction and make feedback on how to code closer to the gold reference.\n A few Cairo-specific things for feedback:\n 1. Events should #[derive(Drop, starknet::Event)]. No need to `use starknet::Event`, which will cause further conflicts. 2. If the compilation errors are cryptic, base your feedback on mostly what you observe are the diffs between the gold reference and the generated code."
        )

    ## Metrics for self-improvement: Rating whether the context provided can be used to answer the question properly or not.
    gencode_rater = dspy.Predict(GeneratedCodeRater)

    def compute_metrics(gold, pred, trace=None) -> dict:
        gen_code = extract_cairo_code(pred.answer)
        if gen_code == "":
            return {"score": 0.0, "feedback": f"No code was successfully generated for this query. The reference was: {gold.reference}"}
        compil_res = check_compilation(gen_code)
        if compil_res["success"] is False:
            compil_string = compil_res["error"]
        else:
            compil_string = "The program compiles successfully."
        with dspy.context(
            lm=dspy.LM("gemini/gemini-3-flash-preview", max_tokens=30000), adapter=XMLAdapter()
        ):
            response_rating = gencode_rater(
                query=gold.query,
                generated_code=gen_code,
                compilation_result=compil_string,
                golden_reference=gold.reference,
            )
        if response_rating.score > 1.0:
            response_rating.score /= 10

        # print(f"Compilation result: {compil_string}")
        # print(f"Golden reference: {gold.reference}")
        # print(f"Score: {response_rating.score}, feedback: {response_rating.feedback}")
        return {"score": response_rating.score, "feedback": response_rating.feedback or ""}

    def compute_overall_score_with_feedback(
        gold, pred, trace=None, pred_name=None, pred_trace=None
    ):
        metrics = compute_metrics(gold, pred, trace)
        score = metrics["score"]
        llm_feedback = metrics["feedback"]
        if score < 0.2:
            import json
            from pathlib import Path

            # Create logs directory if it doesn't exist
            logs_dir = Path("optimizer_logs")
            logs_dir.mkdir(exist_ok=True)

            # Prepare data to save
            log_data = {
                "score": score,
                "gold": {"query": gold.query if hasattr(gold, "query") else str(gold)},
                "pred": {
                    "response": pred.answer
                },
                "feedback": llm_feedback,
            }

            # Save to JSON file with thread safety
            import threading
            log_file = logs_dir / "gencode_optimizer_logs.json"

            # Use a global lock for thread safety
            if not hasattr(compute_overall_score_with_feedback, '_log_lock'):
                compute_overall_score_with_feedback._log_lock = threading.Lock()

            with compute_overall_score_with_feedback._log_lock:
                # Load existing logs or create new list
                existing_logs = []
                if log_file.exists():
                    try:
                        with open(log_file) as f:
                            existing_logs = json.load(f)
                    except (json.JSONDecodeError, FileNotFoundError):
                        existing_logs = []

                # Append new log entry
                existing_logs.append(log_data)

                # Save updated logs
                with open(log_file, "w") as f:
                    json.dump(existing_logs, f, indent=2)
        feedback_text = f"The score assigned to this request is {score:.2f}. Here's an eventual associated feedback:\n {llm_feedback}"
        return dspy.Prediction(
            score=score,
            feedback=feedback_text,
        )
    return (compute_overall_score_with_feedback,)


@app.cell
def _(compute_overall_score_with_feedback, dspy, os):
    from dspy import GEPA
    gepa_run_dir = os.path.join(os.getcwd(), "./gepa-run-logs")
    prog_candidates_dir = os.path.join(gepa_run_dir, "prog_candidates")
    # Explicitly create inner prog_candidates to enable checkpoints
    os.makedirs(prog_candidates_dir, exist_ok=True)
    optimizer = GEPA(
        metric=compute_overall_score_with_feedback,
        # auto="light", # <-- We will use a light budget for this tutorial. However, we typically recommend using auto="heavy" for optimized performance!
        max_full_evals=9,
        num_threads=12,
        track_stats=True,
        log_dir="./gepa-run-logs",
        reflection_lm=dspy.LM(
            model="gemini/gemini-3-flash-preview", temperature=1.0, max_tokens=32000
        ),
    )
    return (optimizer,)


@app.cell
def _(generation_program, optimizer, train_set, val_set):
    optimized_program = optimizer.compile(
        generation_program,
        trainset=train_set,
        valset=val_set,
    )
    return (optimized_program,)


@app.cell
def _():
    return


@app.cell
def _(optimized_program):
    print(optimized_program)

    for name, pred in optimized_program.named_predictors():
        print("================================")
        print(f"Predictor: {name}")
        print("================================")
        print("Prompt:")
        print(pred.signature.instructions)
        print("*********************************")
    return


@app.cell
def _(optimized_program, os):
    os.makedirs("./dspy_program", exist_ok=True)
    optimized_program.save("./dspy_program/program.json", save_program=False)
    return


@app.cell
def _(compute_overall_score_with_feedback, dspy, test_set):
    evaluate = dspy.Evaluate(
        devset=test_set,
        metric=compute_overall_score_with_feedback,
        num_threads=12,
        display_table=True,
        display_progress=True,
    )
    return (evaluate,)


@app.cell
def _(evaluate, generation_program):
    evaluate(generation_program)
    return


@app.cell
def _(evaluate, optimized_program):
    evaluate(optimized_program)
    return


@app.cell
def _(ProgramToOptimize, dspy, os):
    compiled_program_path = "./dspy_program/program.json"
    if not os.path.exists(compiled_program_path):
        raise FileNotFoundError(f"{compiled_program_path} not found")

    loading_progr = dspy.syncify(ProgramToOptimize())
    loading_progr.load(compiled_program_path)
    return (loading_progr,)


@app.cell
def _(evaluate, loading_progr):
    evaluate(loading_progr)
    return


@app.cell
def _():
    return


@app.cell
def _():
    return


if __name__ == "__main__":
    app.run()
