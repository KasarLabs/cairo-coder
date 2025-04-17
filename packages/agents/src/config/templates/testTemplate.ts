// Basic template for contract testing
export const basicTestTemplate = `
<contract_test>
// Import the contract module itself
use registry::Registry;
// Make the required inner structs available in scope
use registry::Registry::{DataRegistered, DataUpdated};

// Traits derived from the interface, allowing to interact with a deployed contract
use registry::{IRegistryDispatcher, IRegistryDispatcherTrait};

// Required for declaring and deploying a contract
use snforge_std::{declare, DeclareResultTrait, ContractClassTrait};
// Cheatcodes to spy on events and assert their emissions
use snforge_std::{EventSpyAssertionsTrait, spy_events};
// Cheatcodes to cheat environment values - more cheatcodes exist
use snforge_std::{
    start_cheat_block_number, start_cheat_block_timestamp, start_cheat_caller_address,
    stop_cheat_caller_address,
};
use starknet::ContractAddress;

// Helper function to deploy the contract
fn deploy_contract() -> IRegistryDispatcher {
    // Deploy the contract -
    // 1. Declare the contract class
    // 2. Create constructor arguments - serialize each one in a felt252 array
    // 3. Deploy the contract
    // 4. Create a dispatcher to interact with the contract
    let contract = declare("Registry");
    let mut constructor_args = array![];
    Serde::serialize(@1_u8, ref constructor_args);
    let (contract_address, _err) = contract
        .unwrap()
        .contract_class()
        .deploy(@constructor_args)
        .unwrap();
    // Create a dispatcher to interact with the contract
    IRegistryDispatcher { contract_address }
}

#[test]
fn test_register_data() {
    // Deploy the contract
    let dispatcher = deploy_contract();

    // Setup event spy
    let mut spy = spy_events();

    // Set caller address for the transaction
    let caller: ContractAddress = 123.try_into().unwrap();
    start_cheat_caller_address(dispatcher.contract_address, caller);

    // Register data
    dispatcher.register_data(42);

    // Verify the data was stored correctly
    let stored_data = dispatcher.get_data(0);
    assert(stored_data == 42, 'Wrong stored data');

    // Verify user-specific data
    let user_data = dispatcher.get_user_data(caller);
    assert(user_data == 42, 'Wrong user data');

    // Verify event emission:
    // 1. Create the expected event
    let expected_registered_event = Registry::Event::DataRegistered(
        // Don't forgot to import the event struct!
        DataRegistered { user: caller, data: 42 },
    );
    // 2. Create the expected events array of tuple (address, event)
    let expected_events = array![(dispatcher.contract_address, expected_registered_event)];
    // 3. Assert the events were emitted
    spy.assert_emitted(@expected_events);

    stop_cheat_caller_address(dispatcher.contract_address);
}

#[test]
fn test_update_data() {
    let dispatcher = deploy_contract();
    let mut spy = spy_events();

    // Set caller address
    let caller: ContractAddress = 456.try_into().unwrap();
    start_cheat_caller_address(dispatcher.contract_address, caller);

    // First register some data
    dispatcher.register_data(42);

    // Update the data
    dispatcher.update_data(0, 100);

    // Verify the update
    let updated_data = dispatcher.get_data(0);
    assert(updated_data == 100, 'Wrong updated data');

    // Verify user data was updated
    let user_data = dispatcher.get_user_data(caller);
    assert(user_data == 100, 'Wrong updated user data');

    // Verify update event
    let expected_updated_event = Registry::Event::DataUpdated(
        Registry::DataUpdated { user: caller, index: 0, new_data: 100 },
    );
    let expected_events = array![(dispatcher.contract_address, expected_updated_event)];
    spy.assert_emitted(@expected_events);

    stop_cheat_caller_address(dispatcher.contract_address);
}

#[test]
fn test_get_all_data() {
    let dispatcher = deploy_contract();

    // Set caller address
    let caller: ContractAddress = 789.try_into().unwrap();
    start_cheat_caller_address(dispatcher.contract_address, caller);

    // Register multiple data entries
    dispatcher.register_data(10);
    dispatcher.register_data(20);
    dispatcher.register_data(30);

    // Get all data
    let all_data = dispatcher.get_all_data();

    // Verify array contents
    assert(*all_data.at(0) == 10, 'Wrong data at index 0');
    assert(*all_data.at(1) == 20, 'Wrong data at index 1');
    assert(*all_data.at(2) == 30, 'Wrong data at index 2');
    assert(all_data.len() == 3, 'Wrong array length');

    stop_cheat_caller_address(dispatcher.contract_address);
}

#[test]
#[should_panic(expected: "Index out of bounds")]
fn test_get_data_out_of_bounds() {
    let dispatcher = deploy_contract();

    // Try to access non-existent index
    dispatcher.get_data(999);
}
</contract_test>

The content inside the <contract_test> tag is the test code for the 'Registry' contract. It is assumed
that the contract is part of a package named 'registry'. When writing tests, follow the important rules.

<important_rules>
- Always use full paths for core library imports.
- Always consider that the interface of the contract is defined in the parent of the contract module;
for example: 'use registry::{IRegistryDispatcher, IRegistryDispatcherTrait};' for contract 'use registry::Registry;'.
- Always import the Dispatcher from the path the interface is defined in. If the interface is defined in
'use registry::IRegistry', then the dispatcher is 'use registry::{IRegistryDispatcher, IRegistryDispatcherTrait};'.
</important_rules>
`;
