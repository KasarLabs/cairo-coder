#[starknet::interface]
pub trait ICounter<TContractState> {
    fn increment(ref self: TContractState);
    fn decrement(ref self: TContractState);
    fn get_counter(self: @TContractState) -> u256;
}

#[starknet::contract]
pub mod Counter {
    use starknet::ContractAddress;
    use starknet::storage::*;
    use starknet::get_caller_address;

    #[storage]
    pub struct Storage {
        counter: u256,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        CounterIncremented: CounterIncremented,
        CounterDecremented: CounterDecremented,
    }

    #[derive(Drop, starknet::Event)]
    pub struct CounterIncremented {
        #[key]
        pub caller: ContractAddress,
        pub new_value: u256,
    }

    #[derive(Drop, starknet::Event)]
    pub struct CounterDecremented {
        #[key]
        pub caller: ContractAddress,
        pub new_value: u256,
    }

    #[constructor]
    fn constructor(ref self: ContractState, initial_value: u256) {
        self.counter.write(initial_value);
    }

    #[abi(embed_v0)]
    pub impl CounterImpl of super::ICounter<ContractState> {
        /// Increment the counter by 1
        fn increment(ref self: ContractState) {
            let caller = get_caller_address();
            let current_value = self.counter.read();
            let new_value = current_value + 1;
            self.counter.write(new_value);
            self.emit(Event::CounterIncremented(CounterIncremented { caller, new_value }));
        }

        /// Decrement the counter by 1
        fn decrement(ref self: ContractState) {
            let caller = get_caller_address();
            let current_value = self.counter.read();
            assert!(current_value > 0, "Counter cannot go below zero");
            let new_value = current_value - 1;
            self.counter.write(new_value);
            self.emit(Event::CounterDecremented(CounterDecremented { caller, new_value }));
        }

        /// Get the current counter value
        fn get_counter(self: @ContractState) -> u256 {
            self.counter.read()
        }
    }
}
