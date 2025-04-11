// Basic contract template used for contract-related queries
export const basicContractTemplate = `
<contract>
use core::starknet::ContractAddress;

// Define the contract interface
#[starknet::interface]
pub trait IRegistry<TContractState> {
    fn register_data(ref self: TContractState, data: felt252);
    fn update_data(ref self: TContractState, index: u64, new_data: felt252);
    fn get_data(self: @TContractState, index: u64) -> felt252;
    fn get_all_data(self: @TContractState) -> Array<felt252>;
    fn get_user_data(self: @TContractState, user: ContractAddress) -> felt252;
}

// Define the contract module
#[starknet::contract]
pub mod Registry {
    // Always add imports from inside the contract module
    // Always use full paths for core library imports.
    use core::starknet::ContractAddress;
    // Required for interactions with 'map' and the 'entry' method. Don't forget 'StoragePathEntry'!!
    use core::starknet::storage::{Map, StoragePathEntry};
    // Required for interactions with 'vec'
    use core::starknet::storage::{Vec, VecTrait, MutableVecTrait};
    // Required for all storage operations
    use core::starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
    use core::starknet::get_caller_address;

    // Define storage variables
    #[storage]
    pub struct Storage {
        data_vector: Vec<felt252>, // A vector to store data
        user_data_map: Map<ContractAddress, felt252>, // A mapping to store user-specific data
        foo: usize, // A simple storage variable
    }

    // events derive 'Drop, starknet::Event' and the '#[event]' attribute
    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        DataRegistered: DataRegistered,
        DataUpdated: DataUpdated,
    }

    #[derive(Drop, starknet::Event)]
    pub struct DataRegistered {
        user: ContractAddress,
        data: felt252,
    }

    #[derive(Drop, starknet::Event)]
    pub struct DataUpdated {
        user: ContractAddress,
        index: u64,
        new_data: felt252,
    }

    // Implement the contract interface
    // all these functions are public
    #[abi(embed_v0)]
    pub impl RegistryImpl of super::IRegistry<ContractState> {
        // Register data and emit an event
        fn register_data(ref self: ContractState, data: felt252) {
            let caller = get_caller_address();
            self.data_vector.append().write(data);
            self.user_data_map.entry(caller).write(data);
            self.emit(Event::DataRegistered(DataRegistered { user: caller, data }));
        }

        // Update data at a specific index and emit an event
        fn update_data(ref self: ContractState, index: u64, new_data: felt252) {
            let caller = get_caller_address();
            self.data_vector.at(index).write(new_data);
            self.user_data_map.entry(caller).write(new_data);
            self.emit(Event::DataUpdated(DataUpdated { user: caller, index, new_data }));
        }

        // Retrieve data at a specific index
        fn get_data(self: @ContractState, index: u64) -> felt252 {
            self.data_vector.at(index).read()
        }

        // Retrieve all data stored in the vector
        fn get_all_data(self: @ContractState) -> Array<felt252> {
            let mut all_data = array![];
            for i in 0..self.data_vector.len() {
                all_data.append(self.data_vector.at(i).read());
            };
            // for loops have an ending ';'
            all_data
        }

        // Retrieve data for a specific user
        fn get_user_data(self: @ContractState, user: ContractAddress) -> felt252 {
            self.user_data_map.entry(user).read()
        }
    }

    // this function is private
    fn foo(self: @ContractState)->usize{
        self.foo.read()
    }
}
</contract>

The content inside the <contract> tag is the contract code for a 'Registry' contract, demonstrating
the syntax of the Cairo language for Starknet Smart Contracts. Follow the important rules when writing a contract.

<important_rules>
- Always use full paths for core library imports.
- Always use the 'use core::starknet::ContractAddress;' import for the ContractAddress type.
- Always use the 'use core::starknet::storage::{Map, StoragePathEntry};' import for the Map and StoragePathEntry types.
- Always use the 'use core::starknet::storage::{Vec, VecTrait, MutableVecTrait};' import for the Vec, VecTrait, and MutableVecTrait types.
- Always use the 'use core::starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};' import for the StoragePointerReadAccess and StoragePointerWriteAccess types.
- Always define the interface right above the contract module.
- Always import strictly the required types in the module the interface is implemented in.
- Always import the required types of the contract inside the contract module.
- Always make the interface and the contract module 'pub'
</important_rules>
`;
