// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts for Cairo ^2.0.0
#[starknet::contract]
mod MY_ERC20 {
    use openzeppelin::token::erc20::{DefaultConfig, ERC20Component, ERC20HooksEmptyImpl};
    use starknet::ContractAddress;

    component!(path: ERC20Component, storage: erc20, event: ERC20Event);

    // External
    #[abi(embed_v0)]
    impl ERC20MixinImpl = ERC20Component::ERC20MixinImpl<ContractState>;

    // Internal
    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        erc20: ERC20Component::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC20Event: ERC20Component::Event,
    }

    #[constructor]
    fn constructor(ref self: ContractState, recipient: ContractAddress) {
        self.erc20.initializer("MY_ERC20", "MYT");

        // Mint initial supply with 18 decimals (1,000,000 tokens * 10^18)
        self.erc20.mint(recipient, 1000000000000000000);
    }
}
