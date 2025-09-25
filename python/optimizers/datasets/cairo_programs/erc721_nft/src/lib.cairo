// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts for Cairo ^2.0.0
use starknet::ContractAddress;

#[starknet::interface]
trait IMintableCappedERC721<TContractState> {
    fn safe_mint(ref self: TContractState, recipient: ContractAddress, token_id: u256, data: Span<felt252>);
    fn mint(ref self: TContractState, recipient: ContractAddress, token_id: u256);
    fn set_base_uri(ref self: TContractState, new_base_uri: ByteArray);
    fn max_supply(self: @TContractState) -> u256;
    fn current_supply(self: @TContractState) -> u256;
    fn remaining_supply(self: @TContractState) -> u256;
}

#[starknet::contract]
mod CappedNFTCollection {
    use openzeppelin::access::ownable::OwnableComponent;
    use openzeppelin::introspection::src5::SRC5Component;
    use openzeppelin::token::erc721::{ERC721Component, ERC721HooksEmptyImpl};
    use starknet::ContractAddress;
    use starknet::storage::*;

    component!(path: ERC721Component, storage: erc721, event: ERC721Event);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);
    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);

    // External
    #[abi(embed_v0)]
    impl ERC721MixinImpl = ERC721Component::ERC721MixinImpl<ContractState>;
    #[abi(embed_v0)]
    impl OwnableMixinImpl = OwnableComponent::OwnableMixinImpl<ContractState>;

    // Internal
    impl ERC721InternalImpl = ERC721Component::InternalImpl<ContractState>;
    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;

    // Constants
    const MAX_SUPPLY: u256 = 10000;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        erc721: ERC721Component::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage,
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
        current_supply: u256,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC721Event: ERC721Component::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
        #[flat]
        OwnableEvent: OwnableComponent::Event,
        BaseURIUpdated: BaseURIUpdated,
    }

    #[derive(Drop, starknet::Event)]
    struct BaseURIUpdated {
        pub new_base_uri: ByteArray,
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress) {
        self.erc721.initializer("CappedNFTCollection", "CNFT", "https://api.example.com/metadata/");
        self.ownable.initializer(owner);
        self.current_supply.write(0);
    }

    #[abi(embed_v0)]
    impl ExternalImpl of super::IMintableCappedERC721<ContractState> {
        fn safe_mint(
            ref self: ContractState,
            recipient: ContractAddress,
            token_id: u256,
            data: Span<felt252>,
        ) {
            self.ownable.assert_only_owner();

            // Check supply cap
            let current = self.current_supply.read();
            assert!(current < MAX_SUPPLY, "Maximum supply reached");

            self.erc721.safe_mint(recipient, token_id, data);
            self.current_supply.write(current + 1);
        }

        fn mint(ref self: ContractState, recipient: ContractAddress, token_id: u256) {
            self.ownable.assert_only_owner();

            // Check supply cap
            let current = self.current_supply.read();
            assert!(current < MAX_SUPPLY, "Maximum supply reached");

            self.erc721.mint(recipient, token_id);
            self.current_supply.write(current + 1);
        }

        fn set_base_uri(ref self: ContractState, new_base_uri: ByteArray) {
            self.ownable.assert_only_owner();
            // Using internal function from ERC721InternalImpl
            self.erc721._set_base_uri(new_base_uri.clone());
            self.emit(Event::BaseURIUpdated(BaseURIUpdated { new_base_uri }));
        }

        fn max_supply(self: @ContractState) -> u256 {
            MAX_SUPPLY
        }

        fn current_supply(self: @ContractState) -> u256 {
            self.current_supply.read()
        }

        fn remaining_supply(self: @ContractState) -> u256 {
            MAX_SUPPLY - self.current_supply.read()
        }
    }
}
