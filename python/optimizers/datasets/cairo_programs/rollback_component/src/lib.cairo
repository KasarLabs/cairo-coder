// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts for Cairo ^2.0.0

use starknet::ClassHash;

/// Interface for the rollback upgradeable component
#[starknet::interface]
pub trait IRollbackUpgradeable<TContractState> {
    fn upgrade(ref self: TContractState, new_class_hash: ClassHash);
    fn rollback(ref self: TContractState);
}

/// Rollback Upgradeable Component
///
/// This component provides upgradeable functionality with rollback capabilities.
/// It maintains a history of class hashes and allows rolling back to the last version.
#[starknet::component]
pub mod RollbackUpgradeableComponent {
    use core::num::traits::Zero;
    use starknet::ClassHash;
    use starknet::storage::*;
    use starknet::syscalls::replace_class_syscall;

    #[storage]
    pub struct Storage {
        class_hash_history: Vec<ClassHash>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        Upgraded: Upgraded,
        RolledBack: RolledBack,
    }

    #[derive(Drop, starknet::Event)]
    pub struct Upgraded {
        pub old_class_hash: ClassHash,
        pub new_class_hash: ClassHash,
    }

    #[derive(Drop, starknet::Event)]
    pub struct RolledBack {
        pub from_class_hash: ClassHash,
        pub to_class_hash: ClassHash,
    }

    #[embeddable_as(RollbackUpgradeableImpl)]
    impl RollbackUpgradeable<
        TContractState, +HasComponent<TContractState>,
    > of super::IRollbackUpgradeable<ComponentState<TContractState>> {
        /// Upgrades the contract to a new class hash and adds it to version history
        fn upgrade(ref self: ComponentState<TContractState>, new_class_hash: ClassHash) {
            assert!(!new_class_hash.is_zero(), "Class hash cannot be zero");

            let current_class_hash = self.get_current_class_hash();
            assert!(current_class_hash != new_class_hash, "Same class hash");

            // Add new class hash to history
            self.class_hash_history.push(new_class_hash);
            // Perform the actual upgrade
            replace_class_syscall(new_class_hash).unwrap();

            // Emit event
            self
                .emit(
                    Event::Upgraded(
                        Upgraded { old_class_hash: current_class_hash, new_class_hash },
                    ),
                );
        }

        /// Rolls back to the last version
        fn rollback(ref self: ComponentState<TContractState>) {
            let maybe_current_class_hash = self.class_hash_history.pop();
            assert!(
                maybe_current_class_hash.is_some(), "Cannot rollback if no class hash was set.",
            );
            let current_class_hash = maybe_current_class_hash.unwrap();

            let last_index = self.class_hash_history.len().into() - 1;
            assert!(last_index >= 0, "No previous class hash to rollback to.");
            let previous_class_hash = self.class_hash_history.at(last_index).read();
            self
                .emit(
                    Event::RolledBack(
                        RolledBack {
                            from_class_hash: current_class_hash, to_class_hash: previous_class_hash,
                        },
                    ),
                );
            replace_class_syscall(previous_class_hash).unwrap();
        }
    }

    /// Internal implementation for component initialization and management
    #[generate_trait]
    pub impl InternalImpl<
        TContractState, +HasComponent<TContractState>,
    > of InternalTrait<TContractState> {
        fn get_current_class_hash(self: @ComponentState<TContractState>) -> ClassHash {
            self.class_hash_history.at(self.class_hash_history.len().into() - 1).read()
        }
    }
}
