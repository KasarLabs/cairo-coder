// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts for Cairo ^2.0.0

#[starknet::interface]
pub trait ICounter<TContractState> {
    fn increment(ref self: TContractState);
    fn decrement(ref self: TContractState);
    fn get_counter(self: @TContractState) -> u256;
}

#[starknet::contract]
mod Counter {
    use openzeppelin::access::ownable::OwnableComponent;
    use openzeppelin::security::reentrancyguard::ReentrancyGuardComponent;
    use starknet::storage::*;
    use starknet::{ContractAddress, get_caller_address};

    // Component declarations
    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);
    component!(
        path: ReentrancyGuardComponent, storage: reentrancy_guard, event: ReentrancyGuardEvent,
    );

    // External implementations
    #[abi(embed_v0)]
    impl OwnableMixinImpl = OwnableComponent::OwnableMixinImpl<ContractState>;

    // Internal implementations
    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;
    impl ReentrancyGuardInternalImpl = ReentrancyGuardComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
        #[substorage(v0)]
        reentrancy_guard: ReentrancyGuardComponent::Storage,
        counter: u256,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        OwnableEvent: OwnableComponent::Event,
        #[flat]
        ReentrancyGuardEvent: ReentrancyGuardComponent::Event,
        CounterIncremented: CounterIncremented,
        CounterDecremented: CounterDecremented,
    }

    #[derive(Drop, starknet::Event)]
    struct CounterIncremented {
        pub by: u256,
        pub new_value: u256,
        pub caller: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    struct CounterDecremented {
        pub by: u256,
        pub new_value: u256,
        pub caller: ContractAddress,
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress, initial_value: u256) {
        self.ownable.initializer(owner);
        self.counter.write(initial_value);
    }

    #[abi(embed_v0)]
    impl CounterImpl of super::ICounter<ContractState> {
        fn increment(ref self: ContractState) {
            // Start reentrancy guard
            self.reentrancy_guard.start();

            let current_value = self.counter.read();
            let new_value = current_value + 1;
            self.counter.write(new_value);

            let caller = get_caller_address();
            self.emit(Event::CounterIncremented(CounterIncremented { by: 1, new_value, caller }));

            // End reentrancy guard
            self.reentrancy_guard.end();
        }

        fn decrement(ref self: ContractState) {
            // Start reentrancy guard
            self.reentrancy_guard.start();

            let current_value = self.counter.read();
            assert!(current_value > 0, "Counter cannot go below zero");

            let new_value = current_value - 1;
            self.counter.write(new_value);

            let caller = get_caller_address();
            self.emit(Event::CounterDecremented(CounterDecremented { by: 1, new_value, caller }));

            // End reentrancy guard
            self.reentrancy_guard.end();
        }

        fn get_counter(self: @ContractState) -> u256 {
            self.counter.read()
        }
    }
}
