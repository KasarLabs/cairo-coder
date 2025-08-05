# docs.openzeppelin.com — Snapshot (2025-08-02)

Clean documentation content extracted from sitemap.

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0/

## Contracts for Cairo - OpenZeppelin Docs

# Contracts for Cairo

**A library for secure smart contract development** written in Cairo for Starknet. This library consists of a set of reusable components to build custom smart contracts, as well as
ready-to-deploy presets. You can also find other utilities including interfaces and dispatchers and test utilities
that facilitate testing with Starknet Foundry.

|  |  |
| --- | --- |
|  | This repo contains highly experimental code. Expect rapid iteration. **Use at your own risk.** |

|  |  |
| --- | --- |
|  | You can track our roadmap and future milestones in our Github Project. |

## Installation

The library is available as a Scarb package. Follow this guide for installing Cairo and Scarb on your machine
before proceeding, and run the following command to check that the installation was successful:

```
$ scarb --version

scarb 2.9.4 (d3be9ebe1 2025-02-19)
cairo: 2.9.4 (https://crates.io/crates/cairo-lang-compiler/2.9.4)
sierra: 1.6.0
```

### Set up your project

Create an empty directory, and `cd` into it:

```
mkdir my_project/ && cd my_project/
```

Initialize a new Scarb project:

```
scarb init
```

The contents of `my_project/` should now look like this:

```
$ ls

Scarb.toml src
```

### Install the library

Install the library by declaring it as a dependency in the project’s `Scarb.toml` file:

```
[dependencies]
openzeppelin = "2.0.0"
```

The previous example would import the entire library. We can also add each package as a separate dependency to
improve the building time by not including modules that won’t be used:

```
[dependencies]
openzeppelin_access = "2.0.0"
openzeppelin_token = "2.0.0"
```

## Basic usage

This is how it looks to build an ERC20 contract using the ERC20 component.
Copy the code into `src/lib.cairo`.

```
#[starknet::contract]
mod MyERC20Token {
    // NOTE: If you added the entire library as a dependency,
    // use `openzeppelin::token` instead.
    use openzeppelin_token::erc20::{ERC20Component, ERC20HooksEmptyImpl, DefaultConfig};
    use starknet::ContractAddress;

    component!(path: ERC20Component, storage: erc20, event: ERC20Event);

    // ERC20 Mixin
    #[abi(embed_v0)]
    impl ERC20MixinImpl = ERC20Component::ERC20MixinImpl<ContractState>;
    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        erc20: ERC20Component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC20Event: ERC20Component::Event
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        name: ByteArray,
        symbol: ByteArray,
        fixed_supply: u256,
        recipient: ContractAddress
    ) {
        self.erc20.initializer(name, symbol);
        self.erc20.mint(recipient, fixed_supply);
    }
}
```

You can now compile it:

```
scarb build
```

Wizard →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0/access

## Access - OpenZeppelin Docs

# Access

Access control—​that is, "who is allowed to do this thing"—is incredibly important in the world of smart contracts.
The access control of your contract may govern who can mint tokens, vote on proposals, freeze transfers, and many other things.
It is therefore critical to understand how you implement it, lest someone else
steals your whole system.

## Ownership and `Ownable`

The most common and basic form of access control is the concept of ownership: there’s an account that is the `owner`
of a contract and can do administrative tasks on it.
This approach is perfectly reasonable for contracts that have a single administrative user.

OpenZeppelin Contracts for Cairo provides OwnableComponent for implementing ownership in your contracts.

### Usage

Integrating this component into a contract first requires assigning an owner.
The implementing contract’s constructor should set the initial owner by passing the owner’s address to Ownable’s
`initializer` like this:

```
#[starknet::contract]
mod MyContract {
    use openzeppelin_access::ownable::OwnableComponent;
    use starknet::ContractAddress;

    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);

    // Ownable Mixin
    #[abi(embed_v0)]
    impl OwnableMixinImpl = OwnableComponent::OwnableMixinImpl<ContractState>;
    impl InternalImpl = OwnableComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        ownable: OwnableComponent::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        OwnableEvent: OwnableComponent::Event
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress) {
        // Set the initial owner of the contract
        self.ownable.initializer(owner);
    }

    (...)
}
```

To restrict a function’s access to the owner only, add in the `assert_only_owner` method:

```
#[starknet::contract]
mod MyContract {
    (...)

    #[external(v0)]
    fn only_owner_allowed(ref self: ContractState) {
        // This function can only be called by the owner
        self.ownable.assert_only_owner();

        (...)
    }
}
```

### Interface

This is the full interface of the `OwnableMixinImpl` implementation:

```
#[starknet::interface]
pub trait OwnableABI {
    // IOwnable
    fn owner() -> ContractAddress;
    fn transfer_ownership(new_owner: ContractAddress);
    fn renounce_ownership();

    // IOwnableCamelOnly
    fn transferOwnership(newOwner: ContractAddress);
    fn renounceOwnership();
}
```

Ownable also lets you:

* `transfer_ownership` from the owner account to a new one, and
* `renounce_ownership` for the owner to relinquish this administrative privilege, a common pattern
  after an initial stage with centralized administration is over.

|  |  |
| --- | --- |
|  | Removing the owner altogether will mean that administrative tasks that are protected by `assert_only_owner` will no longer be callable! |

### Two step transfer

The component also offers a more robust way of transferring ownership via the
OwnableTwoStepImpl implementation. A two step transfer mechanism helps
to prevent unintended and irreversible owner transfers. Simply replace the `OwnableMixinImpl`
with its respective two step variant:

```
#[abi(embed_v0)]
impl OwnableTwoStepMixinImpl = OwnableComponent::OwnableTwoStepMixinImpl<ContractState>;
```

#### Interface

This is the full interface of the two step `OwnableTwoStepMixinImpl` implementation:

```
#[starknet::interface]
pub trait OwnableTwoStepABI {
    // IOwnableTwoStep
    fn owner() -> ContractAddress;
    fn pending_owner() -> ContractAddress;
    fn accept_ownership();
    fn transfer_ownership(new_owner: ContractAddress);
    fn renounce_ownership();

    // IOwnableTwoStepCamelOnly
    fn pendingOwner() -> ContractAddress;
    fn acceptOwnership();
    fn transferOwnership(newOwner: ContractAddress);
    fn renounceOwnership();
}
```

## Role-Based `AccessControl`

While the simplicity of ownership can be useful for simple systems or quick prototyping, different levels of
authorization are often needed. You may want for an account to have permission to ban users from a system, but not
create new tokens. Role-Based Access Control (RBAC) offers
flexibility in this regard.

In essence, we will be defining multiple roles, each allowed to perform different sets of actions.
An account may have, for example, 'moderator', 'minter' or 'admin' roles, which you will then check for
instead of simply using `assert_only_owner`. This check can be enforced through `assert_only_role`.
Separately, you will be able to define rules for how accounts can be granted a role, have it revoked, and more.

Most software uses access control systems that are role-based: some users are regular users, some may be supervisors
or managers, and a few will often have administrative privileges.

### Usage

For each role that you want to define, you will create a new *role identifier* that is used to grant, revoke, and
check if an account has that role. See Creating role identifiers for information
on creating identifiers.

Here’s a simple example of implementing AccessControl on a portion of an ERC20 token contract which defines
and sets a 'minter' role:

```
const MINTER_ROLE: felt252 = selector!("MINTER_ROLE");

#[starknet::contract]
mod MyContract {
    use openzeppelin_access::accesscontrol::AccessControlComponent;
    use openzeppelin_introspection::src5::SRC5Component;
    use openzeppelin_token::erc20::{ERC20Component, ERC20HooksEmptyImpl, DefaultConfig};
    use starknet::ContractAddress;
    use super::MINTER_ROLE;

    component!(path: AccessControlComponent, storage: accesscontrol, event: AccessControlEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);
    component!(path: ERC20Component, storage: erc20, event: ERC20Event);

    // AccessControl
    #[abi(embed_v0)]
    impl AccessControlImpl =
        AccessControlComponent::AccessControlImpl<ContractState>;
    impl AccessControlInternalImpl = AccessControlComponent::InternalImpl<ContractState>;

    // SRC5
    #[abi(embed_v0)]
    impl SRC5Impl = SRC5Component::SRC5Impl<ContractState>;

    // ERC20
    #[abi(embed_v0)]
    impl ERC20Impl = ERC20Component::ERC20Impl<ContractState>;
    #[abi(embed_v0)]
    impl ERC20MetadataImpl = ERC20Component::ERC20MetadataImpl<ContractState>;
    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        accesscontrol: AccessControlComponent::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage,
        #[substorage(v0)]
        erc20: ERC20Component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        AccessControlEvent: AccessControlComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
        #[flat]
        ERC20Event: ERC20Component::Event
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        name: ByteArray,
        symbol: ByteArray,
        initial_supply: u256,
        recipient: ContractAddress,
        minter: ContractAddress
    ) {
        // ERC20-related initialization
        self.erc20.initializer(name, symbol);
        self.erc20.mint(recipient, initial_supply);

        // AccessControl-related initialization
        self.accesscontrol.initializer();
        self.accesscontrol._grant_role(MINTER_ROLE, minter);
    }

    /// This function can only be called by a minter.
    #[external(v0)]
    fn mint(ref self: ContractState, recipient: ContractAddress, amount: u256) {
        self.accesscontrol.assert_only_role(MINTER_ROLE);
        self.erc20.mint(recipient, amount);
    }
}
```

|  |  |
| --- | --- |
|  | Make sure you fully understand how AccessControl works before using it on your system, or copy-pasting the examples from this guide. |

While clear and explicit, this isn’t anything we wouldn’t have been able to achieve with
Ownable. Where AccessControl shines the most is in scenarios where granular
permissions are required, which can be implemented by defining *multiple* roles.

Let’s augment our ERC20 token example by also defining a 'burner' role, which lets accounts destroy tokens:

```
const MINTER_ROLE: felt252 = selector!("MINTER_ROLE");
const BURNER_ROLE: felt252 = selector!("BURNER_ROLE");

#[starknet::contract]
mod MyContract {
    use openzeppelin_access::accesscontrol::AccessControlComponent;
    use openzeppelin_introspection::src5::SRC5Component;
    use openzeppelin_token::erc20::{ERC20Component, ERC20HooksEmptyImpl, DefaultConfig};
    use starknet::ContractAddress;
    use super::{MINTER_ROLE, BURNER_ROLE};

    component!(path: AccessControlComponent, storage: accesscontrol, event: AccessControlEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);
    component!(path: ERC20Component, storage: erc20, event: ERC20Event);

    // AccessControl
    #[abi(embed_v0)]
    impl AccessControlImpl =
        AccessControlComponent::AccessControlImpl<ContractState>;
    impl AccessControlInternalImpl = AccessControlComponent::InternalImpl<ContractState>;

    // SRC5
    #[abi(embed_v0)]
    impl SRC5Impl = SRC5Component::SRC5Impl<ContractState>;

    // ERC20
    #[abi(embed_v0)]
    impl ERC20Impl = ERC20Component::ERC20Impl<ContractState>;
    #[abi(embed_v0)]
    impl ERC20MetadataImpl = ERC20Component::ERC20MetadataImpl<ContractState>;
    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        accesscontrol: AccessControlComponent::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage,
        #[substorage(v0)]
        erc20: ERC20Component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        AccessControlEvent: AccessControlComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
        #[flat]
        ERC20Event: ERC20Component::Event
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        name: ByteArray,
        symbol: ByteArray,
        initial_supply: u256,
        recipient: ContractAddress,
        minter: ContractAddress,
        burner: ContractAddress
    ) {
        // ERC20-related initialization
        self.erc20.initializer(name, symbol);
        self.erc20.mint(recipient, initial_supply);

        // AccessControl-related initialization
        self.accesscontrol.initializer();
        self.accesscontrol._grant_role(MINTER_ROLE, minter);
        self.accesscontrol._grant_role(BURNER_ROLE, burner);
    }

    /// This function can only be called by a minter.
    #[external(v0)]
    fn mint(ref self: ContractState, recipient: ContractAddress, amount: u256) {
        self.accesscontrol.assert_only_role(MINTER_ROLE);
        self.erc20.mint(recipient, amount);
    }

    /// This function can only be called by a burner.
    #[external(v0)]
    fn burn(ref self: ContractState, account: ContractAddress, amount: u256) {
        self.accesscontrol.assert_only_role(BURNER_ROLE);
        self.erc20.burn(account, amount);
    }
}
```

So clean!
By splitting concerns this way, more granular levels of permission may be implemented than were possible with the
simpler ownership approach to access control. Limiting what each component of a system is able to do is known
as the principle of least privilege, and is a good
security practice. Note that each account may still have more than one role, if so desired.

### Granting and revoking roles

The ERC20 token example above uses `_grant_role`,
an `internal` function that is useful when programmatically assigning
roles (such as during construction). But what if we later want to grant the 'minter' role to additional accounts?

By default, **accounts with a role cannot grant it or revoke it from other accounts**: all having a role does is making
the `assert_only_role` check pass. To grant and revoke roles dynamically, you will need help from the role’s *admin*.

Every role has an associated admin role, which grants permission to call the
`grant_role` and
`revoke_role` functions.
A role can be granted or revoked by using these if the calling account has the corresponding admin role.
Multiple roles may have the same admin role to make management easier.
A role’s admin can even be the same role itself, which would cause accounts with that role to be able
to also grant and revoke it.

This mechanism can be used to create complex permissioning structures resembling organizational charts, but it also
provides an easy way to manage simpler applications. `AccessControl` includes a special role with the role identifier
of `0`, called `DEFAULT_ADMIN_ROLE`, which acts as the **default admin role for all roles**.
An account with this role will be able to manage any other role, unless
`set_role_admin` is used to select a new admin role.

Let’s take a look at the ERC20 token example, this time taking advantage of the default admin role:

```
const MINTER_ROLE: felt252 = selector!("MINTER_ROLE");
const BURNER_ROLE: felt252 = selector!("BURNER_ROLE");

#[starknet::contract]
mod MyContract {
    use openzeppelin_access::accesscontrol::AccessControlComponent;
    use openzeppelin_access::accesscontrol::DEFAULT_ADMIN_ROLE;
    use openzeppelin_introspection::src5::SRC5Component;
    use openzeppelin_token::erc20::{ERC20Component, ERC20HooksEmptyImpl, DefaultConfig};
    use starknet::ContractAddress;
    use super::{MINTER_ROLE, BURNER_ROLE};

    component!(path: AccessControlComponent, storage: accesscontrol, event: AccessControlEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);
    component!(path: ERC20Component, storage: erc20, event: ERC20Event);

    // AccessControl
    #[abi(embed_v0)]
    impl AccessControlImpl =
        AccessControlComponent::AccessControlImpl<ContractState>;
    impl AccessControlInternalImpl = AccessControlComponent::InternalImpl<ContractState>;

    // SRC5
    #[abi(embed_v0)]
    impl SRC5Impl = SRC5Component::SRC5Impl<ContractState>;

    // ERC20
    #[abi(embed_v0)]
    impl ERC20Impl = ERC20Component::ERC20Impl<ContractState>;
    #[abi(embed_v0)]
    impl ERC20MetadataImpl = ERC20Component::ERC20MetadataImpl<ContractState>;
    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;

    (...)

    #[constructor]
    fn constructor(
        ref self: ContractState,
        name: ByteArray,
        symbol: ByteArray,
        initial_supply: u256,
        recipient: ContractAddress,
        admin: ContractAddress
    ) {
        // ERC20-related initialization
        self.erc20.initializer(name, symbol);
        self.erc20.mint(recipient, initial_supply);

        // AccessControl-related initialization
        self.accesscontrol.initializer();
        self.accesscontrol._grant_role(DEFAULT_ADMIN_ROLE, admin);
    }

    /// This function can only be called by a minter.
    #[external(v0)]
    fn mint(ref self: ContractState, recipient: ContractAddress, amount: u256) {
        self.accesscontrol.assert_only_role(MINTER_ROLE);
        self.erc20.mint(recipient, amount);
    }

    /// This function can only be called by a burner.
    #[external(v0)]
    fn burn(ref self: ContractState, account: ContractAddress, amount: u256) {
        self.accesscontrol.assert_only_role(BURNER_ROLE);
        self.erc20.burn(account, amount);
    }
}
```

|  |  |
| --- | --- |
|  | The `grant_role` and `revoke_role` functions are automatically exposed as `external` functions from the `AccessControlImpl` by leveraging the `#[abi(embed_v0)]` annotation. |

Note that, unlike the previous examples, no accounts are granted the 'minter' or 'burner' roles.
However, because those roles' admin role is the default admin role, and that role was granted to the 'admin', that
same account can call `grant_role` to give minting or burning permission, and `revoke_role` to remove it.

Dynamic role allocation is often a desirable property, for example in systems where trust in a participant may vary
over time. It can also be used to support use cases such as KYC,
where the list of role-bearers may not be known up-front, or may be prohibitively expensive to include in a single transaction.

### Creating role identifiers

In the Solidity implementation of AccessControl, contracts generally refer to the
keccak256 hash
of a role as the role identifier.

For example:

```
bytes32 public constant SOME_ROLE = keccak256("SOME_ROLE")
```

These identifiers take up 32 bytes (256 bits).

Cairo field elements (`felt252`) store a maximum of 252 bits.
With this discrepancy, this library maintains an agnostic stance on how contracts should create identifiers.
Some ideas to consider:

* Use sn\_keccak instead.
* Use Cairo friendly hashing algorithms like Poseidon, which are implemented in the
  Cairo corelib.

|  |  |
| --- | --- |
|  | The `selector!` macro can be used to compute sn\_keccak in Cairo. |

### Interface

This is the full interface of the `AccessControlMixinImpl` implementation:

```
#[starknet::interface]
pub trait AccessControlABI {
    // IAccessControl
    fn has_role(role: felt252, account: ContractAddress) -> bool;
    fn get_role_admin(role: felt252) -> felt252;
    fn grant_role(role: felt252, account: ContractAddress);
    fn revoke_role(role: felt252, account: ContractAddress);
    fn renounce_role(role: felt252, account: ContractAddress);

    // IAccessControlCamel
    fn hasRole(role: felt252, account: ContractAddress) -> bool;
    fn getRoleAdmin(role: felt252) -> felt252;
    fn grantRole(role: felt252, account: ContractAddress);
    fn revokeRole(role: felt252, account: ContractAddress);
    fn renounceRole(role: felt252, account: ContractAddress);

    // ISRC5
    fn supports_interface(interface_id: felt252) -> bool;
}
```

`AccessControl` also lets you `renounce_role` from the calling account.
The method expects an account as input as an extra security measure, to ensure you are
not renouncing a role from an unintended account.

← SNIP12 and Typed Messages

API Reference →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0/accounts

## Accounts - OpenZeppelin Docs

# Accounts

Unlike Ethereum where accounts are derived from a private key, all Starknet accounts are contracts. This means there’s no Externally Owned Account (EOA)
concept on Starknet.

Instead, the network features native account abstraction and signature validation happens at the contract level.

For a general overview of account abstraction, see
Starknet’s documentation.
A more detailed discussion on the topic can be found in
Starknet Shaman’s forum.

|  |  |
| --- | --- |
|  | For detailed information on the usage and implementation check the API Reference section. |

## What is an account?

Accounts in Starknet are smart contracts, and so they can be deployed and interacted
with like any other contract, and can be extended to implement any custom logic. However, an account is a special type
of contract that is used to validate and execute transactions. For this reason, it must implement a set of entrypoints
that the protocol uses for this execution flow. The SNIP-6 proposal defines a standard interface for accounts,
supporting this execution flow and interoperability with DApps in the ecosystem.

### ISRC6 Interface

```
/// Represents a call to a target contract function.
struct Call {
    to: ContractAddress,
    selector: felt252,
    calldata: Span<felt252>
}

/// Standard Account Interface
#[starknet::interface]
pub trait ISRC6 {
    /// Executes a transaction through the account.
    fn __execute__(calls: Array<Call>);

    /// Asserts whether the transaction is valid to be executed.
    fn __validate__(calls: Array<Call>) -> felt252;

    /// Asserts whether a given signature for a given hash is valid.
    fn is_valid_signature(hash: felt252, signature: Array<felt252>) -> felt252;
}
```

|  |  |
| --- | --- |
|  | The `calldata` member of the `Call` struct in the accounts has been updated to `Span<felt252>` for optimization purposes, but the interface ID remains the same for backwards compatibility. This inconsistency will be fixed in future releases. |

SNIP-6 adds the `is_valid_signature` method. This method is not used by the protocol, but it’s useful for
DApps to verify the validity of signatures, supporting features like Sign In with Starknet.

SNIP-6 also defines that compliant accounts must implement the SRC5 interface following SNIP-5, as
a mechanism for detecting whether a contract is an account or not through introspection.

### ISRC5 Interface

```
/// Standard Interface Detection
#[starknet::interface]
pub trait ISRC5 {
    /// Queries if a contract implements a given interface.
    fn supports_interface(interface_id: felt252) -> bool;
}
```

SNIP-6 compliant accounts must return `true` when queried for the ISRC6 interface ID.

Even though these interfaces are not enforced by the protocol, it’s recommended to implement them for enabling
interoperability with the ecosystem.

### Protocol-level methods

The Starknet protocol uses a few entrypoints for abstracting the accounts. We already mentioned the first two
as part of the ISRC6 interface, and both are required for enabling accounts to be used for executing transactions. The rest are optional:

1. `__validate__` verifies the validity of the transaction to be executed. This is usually used to validate signatures,
   but the entrypoint implementation can be customized to feature any validation mechanism with some limitations.
2. `__execute__` executes the transaction if the validation is successful.
3. `__validate_declare__` optional entrypoint similar to `__validate__` but for transactions
   meant to declare other contracts.
4. `__validate_deploy__` optional entrypoint similar to `__validate__` but meant for counterfactual deployments.

|  |  |
| --- | --- |
|  | Although these entrypoints are available to the protocol for its regular transaction flow, they can also be called like any other method. |

## Starknet Account

Starknet native account abstraction pattern allows for the creation of custom accounts with different validation schemes, but
usually most account implementations validate transactions using the Stark curve which is the most efficient way
of validating signatures since it is a STARK-friendly curve.

OpenZeppelin Contracts for Cairo provides AccountComponent for implementing this validation scheme.

### Usage

Constructing an account contract requires integrating both AccountComponent and SRC5Component. The contract should also set up the constructor to initialize the public key that will be used as the account’s signer. Here’s an example of a basic contract:

```
#[starknet::contract(account)]
mod MyAccount {
    use openzeppelin_account::AccountComponent;
    use openzeppelin_introspection::src5::SRC5Component;

    component!(path: AccountComponent, storage: account, event: AccountEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    // Account Mixin
    #[abi(embed_v0)]
    impl AccountMixinImpl = AccountComponent::AccountMixinImpl<ContractState>;
    impl AccountInternalImpl = AccountComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        account: AccountComponent::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        AccountEvent: AccountComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event
    }

    #[constructor]
    fn constructor(ref self: ContractState, public_key: felt252) {
        self.account.initializer(public_key);
    }
}
```

### Interface

This is the full interface of the `AccountMixinImpl` implementation:

```
#[starknet::interface]
pub trait AccountABI {
    // ISRC6
    fn __execute__(calls: Array<Call>);
    fn __validate__(calls: Array<Call>) -> felt252;
    fn is_valid_signature(hash: felt252, signature: Array<felt252>) -> felt252;

    // ISRC5
    fn supports_interface(interface_id: felt252) -> bool;

    // IDeclarer
    fn __validate_declare__(class_hash: felt252) -> felt252;

    // IDeployable
    fn __validate_deploy__(
        class_hash: felt252, contract_address_salt: felt252, public_key: felt252
    ) -> felt252;

    // IPublicKey
    fn get_public_key() -> felt252;
    fn set_public_key(new_public_key: felt252, signature: Span<felt252>);

    // ISRC6CamelOnly
    fn isValidSignature(hash: felt252, signature: Array<felt252>) -> felt252;

    // IPublicKeyCamel
    fn getPublicKey() -> felt252;
    fn setPublicKey(newPublicKey: felt252, signature: Span<felt252>);
}
```

## Ethereum Account

Besides the Stark-curve account, OpenZeppelin Contracts for Cairo also offers Ethereum-flavored accounts that use the secp256k1 curve for signature validation.
For this the EthAccountComponent must be used.

### Usage

Constructing a secp256k1 account contract also requires integrating both EthAccountComponent and SRC5Component.
The contract should also set up the constructor to initialize the public key that will be used as the account’s signer.
Here’s an example of a basic contract:

```
#[starknet::contract(account)]
mod MyEthAccount {
    use openzeppelin_account::EthAccountComponent;
    use openzeppelin_account::interface::EthPublicKey;
    use openzeppelin_introspection::src5::SRC5Component;
    use starknet::ClassHash;

    component!(path: EthAccountComponent, storage: eth_account, event: EthAccountEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    // EthAccount Mixin
    #[abi(embed_v0)]
    impl EthAccountMixinImpl =
        EthAccountComponent::EthAccountMixinImpl<ContractState>;
    impl EthAccountInternalImpl = EthAccountComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        eth_account: EthAccountComponent::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        EthAccountEvent: EthAccountComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event
    }

    #[constructor]
    fn constructor(ref self: ContractState, public_key: EthPublicKey) {
        self.eth_account.initializer(public_key);
    }
}
```

### Interface

This is the full interface of the `EthAccountMixinImpl` implementation:

```
#[starknet::interface]
pub trait EthAccountABI {
    // ISRC6
    fn __execute__(calls: Array<Call>);
    fn __validate__(calls: Array<Call>) -> felt252;
    fn is_valid_signature(hash: felt252, signature: Array<felt252>) -> felt252;

    // ISRC5
    fn supports_interface(interface_id: felt252) -> bool;

    // IDeclarer
    fn __validate_declare__(class_hash: felt252) -> felt252;

    // IEthDeployable
    fn __validate_deploy__(
        class_hash: felt252, contract_address_salt: felt252, public_key: EthPublicKey
    ) -> felt252;

    // IEthPublicKey
    fn get_public_key() -> EthPublicKey;
    fn set_public_key(new_public_key: EthPublicKey, signature: Span<felt252>);

    // ISRC6CamelOnly
    fn isValidSignature(hash: felt252, signature: Array<felt252>) -> felt252;

    // IEthPublicKeyCamel
    fn getPublicKey() -> EthPublicKey;
    fn setPublicKey(newPublicKey: EthPublicKey, signature: Span<felt252>);
}
```

## Deploying an account

In Starknet there are two ways of deploying smart contracts: using the `deploy_syscall` and doing
counterfactual deployments.
The former can be easily done with the Universal Deployer Contract (UDC), a contract that
wraps and exposes the `deploy_syscall` to provide arbitrary deployments through regular contract calls.
But if you don’t have an account to invoke it, you will probably want to use the latter.

To do counterfactual deployments, you need to implement another protocol-level entrypoint named
`__validate_deploy__`. Check the counterfactual deployments guide to learn how.

## Sending transactions

Let’s now explore how to send transactions through these accounts.

### Starknet Account

First, let’s take the example account we created before and deploy it:

```
#[starknet::contract(account)]
mod MyAccount {
    use openzeppelin_account::AccountComponent;
    use openzeppelin_introspection::src5::SRC5Component;

    component!(path: AccountComponent, storage: account, event: AccountEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    // Account Mixin
    #[abi(embed_v0)]
    impl AccountMixinImpl = AccountComponent::AccountMixinImpl<ContractState>;
    impl AccountInternalImpl = AccountComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        account: AccountComponent::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        AccountEvent: AccountComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event
    }

    #[constructor]
    fn constructor(ref self: ContractState, public_key: felt252) {
        self.account.initializer(public_key);
    }
}
```

To deploy the account variant, compile the contract and declare the class hash because custom accounts are likely not declared.
This means that you’ll need an account already deployed.

Next, create the account JSON with Starknet Foundry’s custom account setup and include the `--class-hash` flag with the declared class hash.
The flag enables custom account variants.

|  |  |
| --- | --- |
|  | The following examples use `sncast` v0.23.0. |

```
$ sncast \
  --url http://127.0.0.1:5050 \
  account create \
  --name my-custom-account \
  --class-hash 0x123456...
```

This command will output the precomputed contract address and the recommended `max-fee`.
To counterfactually deploy the account, send funds to the address and then deploy the custom account.

```
$ sncast \
  --url http://127.0.0.1:5050 \
  account deploy \
  --name my-custom-account
```

Once the account is deployed, set the `--account` flag with the custom account name to send transactions from that account.

```
$ sncast \
  --account my-custom-account \
  --url http://127.0.0.1:5050 \
  invoke \
  --contract-address 0x123... \
  --function "some_function" \
  --calldata 1 2 3
```

### Ethereum Account

First, let’s take the example account we created before and deploy it:

```
#[starknet::contract(account)]
mod MyEthAccount {
    use openzeppelin_account::EthAccountComponent;
    use openzeppelin_account::interface::EthPublicKey;
    use openzeppelin_introspection::src5::SRC5Component;

    component!(path: EthAccountComponent, storage: eth_account, event: EthAccountEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    // EthAccount Mixin
    #[abi(embed_v0)]
    impl EthAccountMixinImpl =
        EthAccountComponent::EthAccountMixinImpl<ContractState>;
    impl EthAccountInternalImpl = EthAccountComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        eth_account: EthAccountComponent::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        EthAccountEvent: EthAccountComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event
    }

    #[constructor]
    fn constructor(ref self: ContractState, public_key: EthPublicKey) {
        self.eth_account.initializer(public_key);
    }
}
```

Special tooling is required in order to deploy and send transactions with an Ethereum-flavored account contract.
The following examples utilize the StarknetJS library.

Compile and declare the contract on the target network.
Next, precompute the EthAccount contract address using the declared class hash.

|  |  |
| --- | --- |
|  | The following examples use unreleased features from StarknetJS (`starknetjs@next`) at commit d002baea0abc1de3ac6e87a671f3dec3757437b3. |

```
import * as dotenv from 'dotenv';
import { CallData, EthSigner, hash } from 'starknet';
import { ABI as ETH_ABI } from '../abis/eth_account.js';
dotenv.config();

// Calculate EthAccount address
const ethSigner = new EthSigner(process.env.ETH_PRIVATE_KEY);
const ethPubKey = await ethSigner.getPubKey();
const ethAccountClassHash = '<ETH_ACCOUNT_CLASS_HASH>';
const ethCallData = new CallData(ETH_ABI);
const ethAccountConstructorCalldata = ethCallData.compile('constructor', {
    public_key: ethPubKey
})
const salt = '0x12345';
const deployerAddress = '0x0';
const ethContractAddress = hash.calculateContractAddressFromHash(
    salt,
    ethAccountClassHash,
    ethAccountConstructorCalldata,
    deployerAddress
);
console.log('Pre-calculated EthAccount address: ', ethContractAddress);
```

Send funds to the pre-calculated EthAccount address and deploy the contract.

```
import * as dotenv from 'dotenv';
import { Account, CallData, EthSigner, RpcProvider, stark } from 'starknet';
import { ABI as ETH_ABI } from '../abis/eth_account.js';
dotenv.config();

// Prepare EthAccount
const provider = new RpcProvider({ nodeUrl: process.env.API_URL });
const ethSigner = new EthSigner(process.env.ETH_PRIVATE_KEY);
const ethPubKey = await ethSigner.getPubKey();
const ethAccountAddress = '<ETH_ACCOUNT_ADDRESS>'
const ethAccount = new Account(provider, ethAccountAddress, ethSigner);

// Prepare payload
const ethAccountClassHash = '<ETH_ACCOUNT_CLASS_HASH>'
const ethCallData = new CallData(ETH_ABI);
const ethAccountConstructorCalldata = ethCallData.compile('constructor', {
    public_key: ethPubKey
})
const salt = '0x12345';
const deployPayload = {
    classHash: ethAccountClassHash,
    constructorCalldata: ethAccountConstructorCalldata,
    addressSalt: salt,
};

// Deploy
const { suggestedMaxFee: feeDeploy } = await ethAccount.estimateAccountDeployFee(deployPayload);
const { transaction_hash, contract_address } = await ethAccount.deployAccount(
    deployPayload,
    { maxFee: stark.estimatedFeeToMaxFee(feeDeploy, 100) }
);
await provider.waitForTransaction(transaction_hash);
console.log('EthAccount deployed at: ', contract_address);
```

Once deployed, connect the EthAccount instance to the target contract which enables calls to come from the EthAccount.
Here’s what an ERC20 transfer from an EthAccount looks like.

```
import * as dotenv from 'dotenv';
import { Account, RpcProvider, Contract, EthSigner } from 'starknet';
dotenv.config();

// Prepare EthAccount
const provider = new RpcProvider({ nodeUrl: process.env.API_URL });
const ethSigner = new EthSigner(process.env.ETH_PRIVATE_KEY);
const ethAccountAddress = '<ETH_ACCOUNT_CONTRACT_ADDRESS>'
const ethAccount = new Account(provider, ethAccountAddress, ethSigner);

// Prepare target contract
const erc20 = new Contract(compiledErc20.abi, erc20Address, provider);

// Connect EthAccount with the target contract
erc20.connect(ethAccount);

// Execute ERC20 transfer
const transferCall = erc20.populate('transfer', {
    recipient: recipient.address,
    amount: 50n
});
const tx = await erc20.transfer(
    transferCall.calldata, { maxFee: 900_000_000_000_000 }
);
await provider.waitForTransaction(tx.transaction_hash);
```

← API Reference

API Reference →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0/backwards-compatibility

## Backwards Compatibility - OpenZeppelin Docs

# Backwards Compatibility

OpenZeppelin Contracts uses semantic versioning to communicate backwards compatibility of its API and storage layout. Patch and minor updates will generally be backwards compatible, with rare exceptions as detailed below. Major updates should be assumed incompatible with previous releases. On this page, we provide details about these guarantees.

Bear in mind that while releasing versions, we treat minors as majors and patches as minors, in accordance with semantic versioning. This means that `v2.1.0` could be adding features to `v2.0.0`, while `v3.0.0` would be considered a breaking release.

## API

In backwards compatible releases, all changes should be either additions or modifications to internal implementation details. Most code should continue to compile and behave as expected. The exceptions to this rule are listed below.

### Security

Infrequently, a patch or minor update will remove or change an API in a breaking way but only if the previous API is considered insecure. These breaking changes will be noted in the changelog and release notes, and published along with a security advisory.

### Errors

The specific error format and data that is included with reverts should not be assumed stable unless otherwise specified.

### Major releases

Major releases should be assumed incompatible. Nevertheless, the external interfaces of contracts will remain compatible if they are standardized, or if the maintainers judge that changing them would cause significant strain on the ecosystem.

An important aspect that major releases may break is "upgrade compatibility", in particular storage layout compatibility. It will never be safe for a live contract to upgrade from one major release to another.

In the case of breaking "upgrade compatibility", an entry to the changelog will be added listing those breaking changes.

## Storage layout

Patch updates will always preserve storage layout compatibility, and after `v2.0.0` minors will too. This means that a live contract can be upgraded from one minor to another without corrupting the storage layout. In some cases it may be necessary to initialize new state variables when upgrading, although we expect this to be infrequent.

## Cairo version

The minimum Cairo version required to compile the contracts will remain unchanged for patch updates, but it may change for minors.

← Test Utilities

Contracts for Solidity →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0/components

## Components - OpenZeppelin Docs

# Components

The following documentation provides reasoning and examples on how to use Contracts for Cairo components.

Starknet components are separate modules that contain storage, events, and implementations that can be integrated into a contract.
Components themselves cannot be declared or deployed.
Another way to think of components is that they are abstract modules that must be instantiated.

|  |  |
| --- | --- |
|  | For more information on the construction and design of Starknet components, see the Starknet Shamans post and the Cairo book. |

## Building a contract

### Setup

The contract should first import the component and declare it with the `component!` macro:

```
#[starknet::contract]
mod MyContract {
    // Import the component
    use openzeppelin_security::InitializableComponent;

    // Declare the component
    component!(path: InitializableComponent, storage: initializable, event: InitializableEvent);
}
```

The `path` argument should be the imported component itself (in this case, InitializableComponent).
The `storage` and `event` arguments are the variable names that will be set in the `Storage` struct and `Event` enum, respectively.
Note that even if the component doesn’t define any events, the compiler will still create an empty event enum inside the component module.

```
#[starknet::contract]
mod MyContract {
    use openzeppelin_security::InitializableComponent;

    component!(path: InitializableComponent, storage: initializable, event: InitializableEvent);

    #[storage]
    struct Storage {
        #[substorage(v0)]
        initializable: InitializableComponent::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        InitializableEvent: InitializableComponent::Event
    }
}
```

The `#[substorage(v0)]` attribute must be included for each component in the `Storage` trait.
This allows the contract to have indirect access to the component’s storage.
See Accessing component storage for more on this.

The `#[flat]` attribute for events in the `Event` enum, however, is not required.
For component events, the first key in the event log is the component ID.
Flattening the component event removes it, leaving the event ID as the first key.

### Implementations

Components come with granular implementations of different interfaces.
This allows contracts to integrate only the implementations that they’ll use and avoid unnecessary bloat.
Integrating an implementation looks like this:

```
mod MyContract {
    use openzeppelin_security::InitializableComponent;

    component!(path: InitializableComponent, storage: initializable, event: InitializableEvent);

    (...)

    // Gives the contract access to the implementation methods
    impl InitializableImpl =
        InitializableComponent::InitializableImpl<ContractState>;
}
```

Defining an `impl` gives the contract access to the methods within the implementation from the component.
For example, `is_initialized` is defined in the `InitializableImpl`.
A function on the contract level can expose it like this:

```
#[starknet::contract]
mod MyContract {
    use openzeppelin_security::InitializableComponent;

    component!(path: InitializableComponent, storage: initializable, event: InitializableEvent);

    (...)

    impl InitializableImpl =
        InitializableComponent::InitializableImpl<ContractState>;

    #[external(v0)]
    fn is_initialized(ref self: ContractState) -> bool {
        self.initializable.is_initialized()
    }
}
```

While there’s nothing wrong with manually exposing methods like in the previous example, this process can be tedious for implementations with many methods.
Fortunately, a contract can embed implementations which will expose all of the methods of the implementation.
To embed an implementation, add the `#[abi(embed_v0)]` attribute above the `impl`:

```
#[starknet::contract]
mod MyContract {
    (...)

    // This attribute exposes the methods of the `impl`
    #[abi(embed_v0)]
    impl InitializableImpl =
        InitializableComponent::InitializableImpl<ContractState>;
}
```

`InitializableImpl` defines the `is_initialized` method in the component.
By adding the embed attribute, `is_initialized` becomes a contract entrypoint for `MyContract`.

|  |  |
| --- | --- |
|  | Embeddable implementations, when available in this library’s components, are segregated from the internal component implementation which makes it easier to safely expose. Components also separate granular implementations from mixin implementations. The API documentation design reflects these groupings. See ERC20Component as an example which includes:  * **Embeddable Mixin Implementation** * **Embeddable Implementations** * **Internal Implementations** * **Events** |

### Mixins

Mixins are impls made of a combination of smaller, more specific impls.
While separating components into granular implementations offers flexibility,
integrating components with many implementations can appear crowded especially if the contract uses all of them.
Mixins simplify this by allowing contracts to embed groups of implementations with a single directive.

Compare the following code blocks to see the benefit of using a mixin when creating an account contract.

#### Account without mixin

```
component!(path: AccountComponent, storage: account, event: AccountEvent);
component!(path: SRC5Component, storage: src5, event: SRC5Event);

#[abi(embed_v0)]
impl SRC6Impl = AccountComponent::SRC6Impl<ContractState>;
#[abi(embed_v0)]
impl DeclarerImpl = AccountComponent::DeclarerImpl<ContractState>;
#[abi(embed_v0)]
impl DeployableImpl = AccountComponent::DeployableImpl<ContractState>;
#[abi(embed_v0)]
impl PublicKeyImpl = AccountComponent::PublicKeyImpl<ContractState>;
#[abi(embed_v0)]
impl SRC6CamelOnlyImpl = AccountComponent::SRC6CamelOnlyImpl<ContractState>;
#[abi(embed_v0)]
impl PublicKeyCamelImpl = AccountComponent::PublicKeyCamelImpl<ContractState>;
impl AccountInternalImpl = AccountComponent::InternalImpl<ContractState>;

#[abi(embed_v0)]
impl SRC5Impl = SRC5Component::SRC5Impl<ContractState>;
```

#### Account with mixin

```
component!(path: AccountComponent, storage: account, event: AccountEvent);
component!(path: SRC5Component, storage: src5, event: SRC5Event);

#[abi(embed_v0)]
impl AccountMixinImpl = AccountComponent::AccountMixinImpl<ContractState>;
impl AccountInternalImpl = AccountComponent::InternalImpl<ContractState>;
```

The rest of the setup for the contract, however, does not change.
This means that component dependencies must still be included in the `Storage` struct and `Event` enum.
Here’s a full example of an account contract that embeds the `AccountMixinImpl`:

```
#[starknet::contract]
mod Account {
    use openzeppelin_account::AccountComponent;
    use openzeppelin_introspection::src5::SRC5Component;

    component!(path: AccountComponent, storage: account, event: AccountEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    // This embeds all of the methods from the many AccountComponent implementations
    // and also includes `supports_interface` from `SRC5Impl`
    #[abi(embed_v0)]
    impl AccountMixinImpl = AccountComponent::AccountMixinImpl<ContractState>;
    impl AccountInternalImpl = AccountComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        account: AccountComponent::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        AccountEvent: AccountComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event
    }

    #[constructor]
    fn constructor(ref self: ContractState, public_key: felt252) {
        self.account.initializer(public_key);
    }
}
```

### Initializers

|  |  |
| --- | --- |
|  | Failing to use a component’s `initializer` can result in irreparable contract deployments. Always read the API documentation for each integrated component. |

Some components require some sort of setup upon construction.
Usually, this would be a job for a constructor; however, components themselves cannot implement constructors.
Components instead offer `initializer`s within their `InternalImpl` to call from the contract’s constructor.
Let’s look at how a contract would integrate OwnableComponent:

```
#[starknet::contract]
mod MyContract {
    use openzeppelin_access::ownable::OwnableComponent;
    use starknet::ContractAddress;

    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);

    // Instantiate `InternalImpl` to give the contract access to the `initializer`
    impl InternalImpl = OwnableComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        ownable: OwnableComponent::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        OwnableEvent: OwnableComponent::Event
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress) {
        // Invoke ownable's `initializer`
        self.ownable.initializer(owner);
    }
}
```

### Immutable Config

While initializers help set up the component’s initial state, some require configuration that may be defined
as constants, saving gas by avoiding the necessity of reading from storage each time the variable needs to be used. The
Immutable Component Config pattern helps with this matter by allowing the implementing contract to define a set of
constants declared in the component, customizing its functionality.

|  |  |
| --- | --- |
|  | The Immutable Component Config standard is defined in the SRC-107. |

Here’s an example of how to use the Immutable Component Config pattern with the ERC2981Component:

```
#[starknet::contract]
mod MyContract {
    use openzeppelin_introspection::src5::SRC5Component;
    use openzeppelin_token::common::erc2981::ERC2981Component;
    use starknet::contract_address_const;

    component!(path: ERC2981Component, storage: erc2981, event: ERC2981Event);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    // SRC5
    #[abi(embed_v0)]
    impl SRC5Impl = SRC5Component::SRC5Impl<ContractState>;

    // Instantiate `InternalImpl` to give the contract access to the `initializer`
    impl InternalImpl = ERC2981Component::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        erc2981: ERC2981Component::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC2981Event: ERC2981Component::Event,
        #[flat]
        SRC5Event: SRC5Component::Event
    }

    // Define the immutable config
    pub impl ERC2981ImmutableConfig of ERC2981Component::ImmutableConfig {
        const FEE_DENOMINATOR: u128 = 10_000;
    }

    #[constructor]
    fn constructor(ref self: ContractState) {
        let default_receiver = contract_address_const::<'RECEIVER'>();
        let default_royalty_fraction = 1000;
        // Invoke erc2981's `initializer`
        self.erc2981.initializer(default_receiver, default_royalty_fraction);
    }
}
```

#### Default config

Sometimes, components implementing the Immutable Component Config pattern provide a default configuration that can be
directly used without implementing the `ImmutableConfig` trait locally. When provided, this implementation will be named
`DefaultConfig` and will be available in the same module containing the component, as a sibling.

In the following example, the `DefaultConfig` trait is used to define the `FEE_DENOMINATOR` config constant.

```
#[starknet::contract]
mod MyContract {
    use openzeppelin_introspection::src5::SRC5Component;
    // Bring the DefaultConfig trait into scope
    use openzeppelin_token::common::erc2981::{ERC2981Component, DefaultConfig};
    use starknet::contract_address_const;

    component!(path: ERC2981Component, storage: erc2981, event: ERC2981Event);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    // SRC5
    #[abi(embed_v0)]
    impl SRC5Impl = SRC5Component::SRC5Impl<ContractState>;

    // Instantiate `InternalImpl` to give the contract access to the `initializer`
    impl InternalImpl = ERC2981Component::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        (...)
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        (...)
    }

    #[constructor]
    fn constructor(ref self: ContractState) {
        let default_receiver = contract_address_const::<'RECEIVER'>();
        let default_royalty_fraction = 1000;
        // Invoke erc2981's `initializer`
        self.erc2981.initializer(default_receiver, default_royalty_fraction);
    }
}
```

#### `validate` function

The `ImmutableConfig` trait may also include a `validate` function with a default implementation, which
asserts that the configuration is correct, and must not be overridden by the implementing contract. For more information
on how to use this function, refer to the validate section of the SRC-107.

### Dependencies

Some components include dependencies of other components.
Contracts that integrate components with dependencies must also include the component dependency.
For instance, AccessControlComponent depends on SRC5Component.
Creating a contract with `AccessControlComponent` should look like this:

```
#[starknet::contract]
mod MyContract {
    use openzeppelin_access::accesscontrol::AccessControlComponent;
    use openzeppelin_introspection::src5::SRC5Component;

    component!(path: AccessControlComponent, storage: accesscontrol, event: AccessControlEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    // AccessControl
    #[abi(embed_v0)]
    impl AccessControlImpl =
        AccessControlComponent::AccessControlImpl<ContractState>;
    #[abi(embed_v0)]
    impl AccessControlCamelImpl =
        AccessControlComponent::AccessControlCamelImpl<ContractState>;
    impl AccessControlInternalImpl = AccessControlComponent::InternalImpl<ContractState>;

    // SRC5
    #[abi(embed_v0)]
    impl SRC5Impl = SRC5Component::SRC5Impl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        accesscontrol: AccessControlComponent::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        AccessControlEvent: AccessControlComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event
    }

    (...)
}
```

## Customization

|  |  |
| --- | --- |
|  | Customizing implementations and accessing component storage can potentially corrupt the state, bypass security checks, and undermine the component logic. **Exercise extreme caution**. See Security. |

### Hooks

Hooks are entrypoints to the business logic of a token component that are accessible at the contract level.
This allows contracts to insert additional behaviors before and/or after token transfers (including mints and burns).
Prior to hooks, extending functionality required contracts to create custom implementations.

All token components include a generic hooks trait that include empty default functions.
When creating a token contract, the using contract must create an implementation of the hooks trait.
Suppose an ERC20 contract wanted to include Pausable functionality on token transfers.
The following snippet leverages the `before_update` hook to include this behavior.

```
#[starknet::contract]
mod MyToken {
    use openzeppelin_security::pausable::PausableComponent::InternalTrait;
    use openzeppelin_security::pausable::PausableComponent;
    use openzeppelin_token::erc20::{ERC20Component, DefaultConfig};
    use starknet::ContractAddress;

    component!(path: ERC20Component, storage: erc20, event: ERC20Event);
    component!(path: PausableComponent, storage: pausable, event: PausableEvent);

    // ERC20 Mixin
    #[abi(embed_v0)]
    impl ERC20MixinImpl = ERC20Component::ERC20MixinImpl<ContractState>;
    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;

    #[abi(embed_v0)]
    impl PausableImpl = PausableComponent::PausableImpl<ContractState>;
    impl PausableInternalImpl = PausableComponent::InternalImpl<ContractState>;

    // Create the hooks implementation
    impl ERC20HooksImpl of ERC20Component::ERC20HooksTrait<ContractState> {
        // Occurs before token transfers
        fn before_update(
            ref self: ERC20Component::ComponentState<ContractState>,
            from: ContractAddress,
            recipient: ContractAddress,
            amount: u256
        ) {
            // Access local state from component state
            let contract_state = self.get_contract();
            // Call function from integrated component
            contract_state.pausable.assert_not_paused();
        }

        // Omitting the `after_update` hook because the default behavior
        // is already implemented in the trait
    }

    (...)
}
```

Notice that the `self` parameter expects a component state type.
Instead of passing the component state, the using contract’s state can be passed which simplifies the syntax.
The hook then moves the scope up with the Cairo-generated `get_contract` through the `HasComponent` trait (as illustrated with ERC20Component in this example).
From here, the hook can access the using contract’s integrated components, storage, and implementations.

Be advised that even if a token contract does not require hooks, the hooks trait must still be implemented.
The using contract may instantiate an empty impl of the trait;
however, the Contracts for Cairo library already provides the instantiated impl to abstract this away from contracts.
The using contract just needs to bring the implementation into scope like this:

```
#[starknet::contract]
mod MyToken {
    use openzeppelin_token::erc20::{ERC20Component, DefaultConfig};
    use openzeppelin_token::erc20::ERC20HooksEmptyImpl;

    (...)
}
```

|  |  |
| --- | --- |
|  | For a more in-depth guide on hooks, see Extending Cairo Contracts with Hooks. |

### Custom implementations

There are instances where a contract requires different or amended behaviors from a component implementation.
In these scenarios, a contract must create a custom implementation of the interface.
Let’s break down a pausable ERC20 contract to see what that looks like.
Here’s the setup:

```
#[starknet::contract]
mod ERC20Pausable {
    use openzeppelin_security::pausable::PausableComponent;
    use openzeppelin_token::erc20::{ERC20Component, ERC20HooksEmptyImpl, DefaultConfig};
    // Import the ERC20 interfaces to create custom implementations
    use openzeppelin_token::erc20::interface::{IERC20, IERC20CamelOnly};
    use starknet::ContractAddress;

    component!(path: PausableComponent, storage: pausable, event: PausableEvent);
    component!(path: ERC20Component, storage: erc20, event: ERC20Event);

    #[abi(embed_v0)]
    impl PausableImpl = PausableComponent::PausableImpl<ContractState>;
    impl PausableInternalImpl = PausableComponent::InternalImpl<ContractState>;

    // `ERC20MetadataImpl` can keep the embed directive because the implementation
    // will not change
    #[abi(embed_v0)]
    impl ERC20MetadataImpl = ERC20Component::ERC20MetadataImpl<ContractState>;
    // Do not add the embed directive to these implementations because
    // these will be customized
    impl ERC20Impl = ERC20Component::ERC20Impl<ContractState>;
    impl ERC20CamelOnlyImpl = ERC20Component::ERC20CamelOnlyImpl<ContractState>;

    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;

    (...)
}
```

The first thing to notice is that the contract imports the interfaces of the implementations that will be customized.
These will be used in the next code example.

Next, the contract includes the ERC20Component implementations; however, `ERC20Impl` and `ERC20CamelOnlyImplt` are **not** embedded.
Instead, we want to expose our custom implementation of an interface.
The following example shows the pausable logic integrated into the ERC20 implementations:

```
#[starknet::contract]
mod ERC20Pausable {
    (...)

    // Custom ERC20 implementation
    #[abi(embed_v0)]
    impl CustomERC20Impl of IERC20<ContractState> {
        fn transfer(
            ref self: ContractState, recipient: ContractAddress, amount: u256
        ) -> bool {
            // Add the custom logic
            self.pausable.assert_not_paused();
            // Add the original implementation method from `IERC20Impl`
            self.erc20.transfer(recipient, amount)
        }

        fn total_supply(self: @ContractState) -> u256 {
            // This method's behavior does not change from the component
            // implementation, but this method must still be defined.
            // Simply add the original implementation method from `IERC20Impl`
            self.erc20.total_supply()
        }

        (...)
    }

    // Custom ERC20CamelOnly implementation
    #[abi(embed_v0)]
    impl CustomERC20CamelOnlyImpl of IERC20CamelOnly<ContractState> {
        fn totalSupply(self: @ContractState) -> u256 {
            self.erc20.total_supply()
        }

        fn balanceOf(self: @ContractState, account: ContractAddress) -> u256 {
            self.erc20.balance_of(account)
        }

        fn transferFrom(
            ref self: ContractState,
            sender: ContractAddress,
            recipient: ContractAddress,
            amount: u256
        ) -> bool {
            self.pausable.assert_not_paused();
            self.erc20.transfer_from(sender, recipient, amount)
        }
    }
}
```

Notice that in the `CustomERC20Impl`, the `transfer` method integrates `pausable.assert_not_paused` as well as `erc20.transfer` from `PausableImpl` and `ERC20Impl` respectively.
This is why the contract defined the `ERC20Impl` from the component in the previous example.

Creating a custom implementation of an interface must define **all** methods from that interface.
This is true even if the behavior of a method does not change from the component implementation (as `total_supply` exemplifies in this example).

### Accessing component storage

There may be cases where the contract must read or write to an integrated component’s storage.
To do so, use the same syntax as calling an implementation method except replace the name of the method with the storage variable like this:

```
#[starknet::contract]
mod MyContract {
    use openzeppelin_security::InitializableComponent;

    component!(path: InitializableComponent, storage: initializable, event: InitializableEvent);

    #[storage]
    struct Storage {
        #[substorage(v0)]
        initializable: InitializableComponent::Storage
    }

    (...)

    fn write_to_comp_storage(ref self: ContractState) {
        self.initializable.Initializable_initialized.write(true);
    }

    fn read_from_comp_storage(self: @ContractState) -> bool {
        self.initializable.Initializable_initialized.read()
    }
}
```

## Security

The maintainers of OpenZeppelin Contracts for Cairo are mainly concerned with the correctness and security of the code as published in the library.

Customizing implementations and manipulating the component state may break some important assumptions and introduce vulnerabilities.
While we try to ensure the components remain secure in the face of a wide range of potential customizations, this is done in a best-effort manner.
Any and all customizations to the component logic should be carefully reviewed and checked against the source code of the component they are customizing so as to fully understand their impact and guarantee their security.

← Wizard

Presets →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0/erc1155

## ERC1155 - OpenZeppelin Docs

# ERC1155

The ERC1155 multi token standard is a specification for fungibility-agnostic token contracts.
The ERC1155 library implements an approximation of EIP-1155 in Cairo for StarkNet.

## Multi Token Standard

The distinctive feature of ERC1155 is that it uses a single smart contract to represent multiple tokens at once. This
is why its balance\_of function differs from ERC20’s and ERC777’s: it has an additional ID argument for the
identifier of the token that you want to query the balance of.

This is similar to how ERC721 does things, but in that standard a token ID has no concept of balance: each token is
non-fungible and exists or doesn’t. The ERC721 balance\_of function refers to how many different tokens an account
has, not how many of each. On the other hand, in ERC1155 accounts have a distinct balance for each token ID, and
non-fungible tokens are implemented by simply minting a single one of them.

This approach leads to massive gas savings for projects that require multiple tokens. Instead of deploying a new
contract for each token type, a single ERC1155 token contract can hold the entire system state, reducing deployment
costs and complexity.

## Usage

Using Contracts for Cairo, constructing an ERC1155 contract requires integrating both `ERC1155Component` and `SRC5Component`.
The contract should also set up the constructor to initialize the token’s URI and interface support.
Here’s an example of a basic contract:

```
#[starknet::contract]
mod MyERC1155 {
    use openzeppelin_introspection::src5::SRC5Component;
    use openzeppelin_token::erc1155::{ERC1155Component, ERC1155HooksEmptyImpl};
    use starknet::ContractAddress;

    component!(path: ERC1155Component, storage: erc1155, event: ERC1155Event);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    // ERC1155 Mixin
    #[abi(embed_v0)]
    impl ERC1155MixinImpl = ERC1155Component::ERC1155MixinImpl<ContractState>;
    impl ERC1155InternalImpl = ERC1155Component::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        erc1155: ERC1155Component::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC1155Event: ERC1155Component::Event,
        #[flat]
        SRC5Event: SRC5Component::Event
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        token_uri: ByteArray,
        recipient: ContractAddress,
        token_ids: Span<u256>,
        values: Span<u256>
    ) {
        self.erc1155.initializer(token_uri);
        self
            .erc1155
            .batch_mint_with_acceptance_check(recipient, token_ids, values, array![].span());
    }
}
```

## Interface

The following interface represents the full ABI of the Contracts for Cairo ERC1155Component.
The interface includes the IERC1155 standard interface and the optional IERC1155MetadataURI interface together with ISRC5.

To support older token deployments, as mentioned in Dual interfaces, the component also includes implementations of the interface written in camelCase.

```
#[starknet::interface]
pub trait ERC1155ABI {
    // IERC1155
    fn balance_of(account: ContractAddress, token_id: u256) -> u256;
    fn balance_of_batch(
        accounts: Span<ContractAddress>, token_ids: Span<u256>
    ) -> Span<u256>;
    fn safe_transfer_from(
        from: ContractAddress,
        to: ContractAddress,
        token_id: u256,
        value: u256,
        data: Span<felt252>
    );
    fn safe_batch_transfer_from(
        from: ContractAddress,
        to: ContractAddress,
        token_ids: Span<u256>,
        values: Span<u256>,
        data: Span<felt252>
    );
    fn is_approved_for_all(
        owner: ContractAddress, operator: ContractAddress
    ) -> bool;
    fn set_approval_for_all(operator: ContractAddress, approved: bool);

    // IERC1155MetadataURI
    fn uri(token_id: u256) -> ByteArray;

    // ISRC5
    fn supports_interface(interface_id: felt252) -> bool;

    // IERC1155Camel
    fn balanceOf(account: ContractAddress, tokenId: u256) -> u256;
    fn balanceOfBatch(
        accounts: Span<ContractAddress>, tokenIds: Span<u256>
    ) -> Span<u256>;
    fn safeTransferFrom(
        from: ContractAddress,
        to: ContractAddress,
        tokenId: u256,
        value: u256,
        data: Span<felt252>
    );
    fn safeBatchTransferFrom(
        from: ContractAddress,
        to: ContractAddress,
        tokenIds: Span<u256>,
        values: Span<u256>,
        data: Span<felt252>
    );
    fn isApprovedForAll(owner: ContractAddress, operator: ContractAddress) -> bool;
    fn setApprovalForAll(operator: ContractAddress, approved: bool);
}
```

## ERC1155 Compatibility

Although Starknet is not EVM compatible, this implementation aims to be as close as possible to the ERC1155 standard but some differences can still be found, such as:

* The optional `data` argument in both `safe_transfer_from` and `safe_batch_transfer_from` is implemented as `Span<felt252>`.
* `IERC1155Receiver` compliant contracts must implement SRC5 and register the `IERC1155Receiver` interface ID.
* `IERC1155Receiver::on_erc1155_received` must return that interface ID on success.

## Batch operations

Because all state is held in a single contract, it is possible to operate over multiple tokens in a single transaction very efficiently. The standard provides two functions, balance\_of\_batch and safe\_batch\_transfer\_from, that make querying multiple balances and transferring multiple tokens simpler and less gas-intensive. We also have safe\_transfer\_from for non-batch operations.

In the spirit of the standard, we’ve also included batch operations in the non-standard functions, such as
batch\_mint\_with\_acceptance\_check.

|  |  |
| --- | --- |
|  | While safe\_transfer\_from and safe\_batch\_transfer\_from prevent loss by checking the receiver can handle the tokens, this yields execution to the receiver which can result in a reentrant call. |

## Receiving tokens

In order to be sure a non-account contract can safely accept ERC1155 tokens, said contract must implement the `IERC1155Receiver` interface.
The recipient contract must also implement the SRC5 interface which supports interface introspection.

### IERC1155Receiver

```
#[starknet::interface]
pub trait IERC1155Receiver {
    fn on_erc1155_received(
        operator: ContractAddress,
        from: ContractAddress,
        token_id: u256,
        value: u256,
        data: Span<felt252>
    ) -> felt252;
    fn on_erc1155_batch_received(
        operator: ContractAddress,
        from: ContractAddress,
        token_ids: Span<u256>,
        values: Span<u256>,
        data: Span<felt252>
    ) -> felt252;
}
```

Implementing the `IERC1155Receiver` interface exposes the on\_erc1155\_received and on\_erc1155\_batch\_received methods.
When safe\_transfer\_from and safe\_batch\_transfer\_from are called, they invoke the recipient contract’s `on_erc1155_received` or `on_erc1155_batch_received` methods respectively which **must** return the IERC1155Receiver interface ID.
Otherwise, the transaction will fail.

|  |  |
| --- | --- |
|  | For information on how to calculate interface IDs, see Computing the interface ID. |

### Creating a token receiver contract

The Contracts for Cairo ERC1155ReceiverComponent already returns the correct interface ID for safe token transfers.
To integrate the `IERC1155Receiver` interface into a contract, simply include the ABI embed directive to the implementations and add the `initializer` in the contract’s constructor.
Here’s an example of a simple token receiver contract:

```
#[starknet::contract]
mod MyTokenReceiver {
    use openzeppelin_introspection::src5::SRC5Component;
    use openzeppelin_token::erc1155::ERC1155ReceiverComponent;
    use starknet::ContractAddress;

    component!(path: ERC1155ReceiverComponent, storage: erc1155_receiver, event: ERC1155ReceiverEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    // ERC1155Receiver Mixin
    #[abi(embed_v0)]
    impl ERC1155ReceiverMixinImpl = ERC1155ReceiverComponent::ERC1155ReceiverMixinImpl<ContractState>;
    impl ERC1155ReceiverInternalImpl = ERC1155ReceiverComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        erc1155_receiver: ERC1155ReceiverComponent::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC1155ReceiverEvent: ERC1155ReceiverComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event
    }

    #[constructor]
    fn constructor(ref self: ContractState) {
        self.erc1155_receiver.initializer();
    }
}
```

← API Reference

API Reference →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0/erc20

## ERC20 - OpenZeppelin Docs

# ERC20

The ERC20 token standard is a specification for fungible tokens, a type of token where all the units are exactly equal to each other.
`token::erc20::ERC20Component` provides an approximation of EIP-20 in Cairo for Starknet.

|  |  |
| --- | --- |
|  | Prior to Contracts v0.7.0, ERC20 contracts store and read `decimals` from storage; however, this implementation returns a static `18`. If upgrading an older ERC20 contract that has a decimals value other than `18`, the upgraded contract **must** use a custom `decimals` implementation. See the Customizing decimals guide. |

## Usage

Using Contracts for Cairo, constructing an ERC20 contract requires setting up the constructor and instantiating the token implementation.
Here’s what that looks like:

```
#[starknet::contract]
mod MyToken {
    use openzeppelin_token::erc20::{ERC20Component, ERC20HooksEmptyImpl, DefaultConfig};
    use starknet::ContractAddress;

    component!(path: ERC20Component, storage: erc20, event: ERC20Event);

    // ERC20 Mixin
    #[abi(embed_v0)]
    impl ERC20MixinImpl = ERC20Component::ERC20MixinImpl<ContractState>;
    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        erc20: ERC20Component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC20Event: ERC20Component::Event
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        initial_supply: u256,
        recipient: ContractAddress
    ) {
        let name = "MyToken";
        let symbol = "MTK";

        self.erc20.initializer(name, symbol);
        self.erc20.mint(recipient, initial_supply);
    }
}
```

`MyToken` integrates both the `ERC20Impl` and `ERC20MetadataImpl` with the embed directive which marks the implementations as external in the contract.
While the `ERC20MetadataImpl` is optional, it’s generally recommended to include it because the vast majority of ERC20 tokens provide the metadata methods.
The above example also includes the `ERC20InternalImpl` instance.
This allows the contract’s constructor to initialize the contract and create an initial supply of tokens.

|  |  |
| --- | --- |
|  | For a more complete guide on ERC20 token mechanisms, see Creating ERC20 Supply. |

## Interface

The following interface represents the full ABI of the Contracts for Cairo ERC20Component.
The interface includes the IERC20 standard interface as well as the optional IERC20Metadata.

To support older token deployments, as mentioned in Dual interfaces, the component also includes an implementation of the interface written in camelCase.

```
#[starknet::interface]
pub trait ERC20ABI {
    // IERC20
    fn total_supply() -> u256;
    fn balance_of(account: ContractAddress) -> u256;
    fn allowance(owner: ContractAddress, spender: ContractAddress) -> u256;
    fn transfer(recipient: ContractAddress, amount: u256) -> bool;
    fn transfer_from(
        sender: ContractAddress, recipient: ContractAddress, amount: u256
    ) -> bool;
    fn approve(spender: ContractAddress, amount: u256) -> bool;

    // IERC20Metadata
    fn name() -> ByteArray;
    fn symbol() -> ByteArray;
    fn decimals() -> u8;

    // IERC20Camel
    fn totalSupply() -> u256;
    fn balanceOf(account: ContractAddress) -> u256;
    fn transferFrom(
        sender: ContractAddress, recipient: ContractAddress, amount: u256
    ) -> bool;
}
```

## ERC20 compatibility

Although Starknet is not EVM compatible, this component aims to be as close as possible to the ERC20 token standard.
Some notable differences, however, can still be found, such as:

* The `ByteArray` type is used to represent strings in Cairo.
* The component offers a dual interface which supports both snake\_case and camelCase methods, as opposed to just camelCase in Solidity.
* `transfer`, `transfer_from` and `approve` will never return anything different from `true` because they will revert on any error.
* Function selectors are calculated differently between Cairo and Solidity.

## Customizing decimals

Cairo, like Solidity, does not support floating-point numbers.
To get around this limitation, ERC20 token contracts may offer a `decimals` field which communicates to outside interfaces (wallets, exchanges, etc.) how the token should be displayed.
For instance, suppose a token had a `decimals` value of `3` and the total token supply was `1234`.
An outside interface would display the token supply as `1.234`.
In the actual contract, however, the supply would still be the integer `1234`.
In other words, **the decimals field in no way changes the actual arithmetic** because all operations are still performed on integers.

Most contracts use `18` decimals and this was even proposed to be compulsory (see the EIP discussion).

### The static approach (SRC-107)

The Contracts for Cairo `ERC20` component leverages SRC-107 to allow for a static and configurable number of decimals.
To use the default `18` decimals, you can use the `DefaultConfig` implementation by just importing it:

```
#[starknet::contract]
mod MyToken {
    // Importing the DefaultConfig implementation would make decimals 18 by default.
    use openzeppelin_token::erc20::{ERC20Component, ERC20HooksEmptyImpl, DefaultConfig};
    use starknet::ContractAddress;

    component!(path: ERC20Component, storage: erc20, event: ERC20Event);

    #[abi(embed_v0)]
    impl ERC20Impl = ERC20Component::ERC20Impl<ContractState>;
    #[abi(embed_v0)]
    impl ERC20CamelOnlyImpl = ERC20Component::ERC20CamelOnlyImpl<ContractState>;
    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;

    (...)
}
```

To customize this value, you can implement the ImmutableConfig trait locally in the contract.
The following example shows how to set the decimals to `6`:

```
mod MyToken {
    use openzeppelin_token::erc20::{ERC20Component, ERC20HooksEmptyImpl};
    use starknet::ContractAddress;

    component!(path: ERC20Component, storage: erc20, event: ERC20Event);

    #[abi(embed_v0)]
    impl ERC20Impl = ERC20Component::ERC20Impl<ContractState>;
    #[abi(embed_v0)]
    impl ERC20CamelOnlyImpl = ERC20Component::ERC20CamelOnlyImpl<ContractState>;
    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;

    (...)

    // Custom implementation of the ERC20Component ImmutableConfig.
    impl ERC20ImmutableConfig of ERC20Component::ImmutableConfig {
        const DECIMALS: u8 = 6;
    }
}
```

### The storage approach

For more complex scenarios, such as a factory deploying multiple tokens with differing values for decimals, a flexible solution might be appropriate.

|  |  |
| --- | --- |
|  | Note that we are not using the MixinImpl or the DefaultConfig in this case, since we need to customize the IERC20Metadata implementation. |

```
#[starknet::contract]
mod MyToken {
    use openzeppelin_token::erc20::interface;
    use openzeppelin_token::erc20::{ERC20Component, ERC20HooksEmptyImpl};
    use starknet::ContractAddress;

    component!(path: ERC20Component, storage: erc20, event: ERC20Event);

    #[abi(embed_v0)]
    impl ERC20Impl = ERC20Component::ERC20Impl<ContractState>;
    #[abi(embed_v0)]
    impl ERC20CamelOnlyImpl = ERC20Component::ERC20CamelOnlyImpl<ContractState>;
    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        erc20: ERC20Component::Storage,
        // The decimals value is stored locally
        decimals: u8,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC20Event: ERC20Component::Event,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState, decimals: u8, initial_supply: u256, recipient: ContractAddress,
    ) {
        // Call the internal function that writes decimals to storage
        self._set_decimals(decimals);

        // Initialize ERC20
        let name = "MyToken";
        let symbol = "MTK";

        self.erc20.initializer(name, symbol);
        self.erc20.mint(recipient, initial_supply);
    }

    #[abi(embed_v0)]
    impl ERC20CustomMetadataImpl of interface::IERC20Metadata<ContractState> {
        fn name(self: @ContractState) -> ByteArray {
            self.erc20.ERC20_name.read()
        }

        fn symbol(self: @ContractState) -> ByteArray {
            self.erc20.ERC20_symbol.read()
        }

        fn decimals(self: @ContractState) -> u8 {
            self.decimals.read()
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn _set_decimals(ref self: ContractState, decimals: u8) {
            self.decimals.write(decimals);
        }
    }
}
```

This contract expects a `decimals` argument in the constructor and uses an internal function to write the decimals to storage.
Note that the `decimals` state variable must be defined in the contract’s storage because this variable does not exist in the component offered by OpenZeppelin Contracts for Cairo.
It’s important to include a custom ERC20 metadata implementation and NOT use the Contracts for Cairo `ERC20MetadataImpl` in this specific case since the `decimals` method will always return `18`.

← API Reference

Creating Supply →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0/erc4626

## ERC4626 - OpenZeppelin Docs

# ERC4626

ERC4626 is an extension of ERC20 that proposes a standard interface for token vaults. This standard interface can be used by widely different contracts (including lending markets, aggregators, and intrinsically interest bearing tokens), which brings a number of subtleties. Navigating these potential issues is essential to implementing a compliant and composable token vault.

We provide a base component of ERC4626 which is designed to allow developers to easily re-configure the vault’s behavior, using traits and hooks, while staying compliant. In this guide, we will discuss some security considerations that affect ERC4626. We will also discuss common customizations of the vault.

## Security concern: Inflation attack

### Visualizing the vault

In exchange for the assets deposited into an ERC4626 vault, a user receives shares. These shares can later be burned to redeem the corresponding underlying assets. The number of shares a user gets depends on the amount of assets they put in and on the exchange rate of the vault. This exchange rate is defined by the current liquidity held by the vault.

* If a vault has 100 tokens to back 200 shares, then each share is worth 0.5 assets.
* If a vault has 200 tokens to back 100 shares, then each share is worth 2.0 assets.

In other words, the exchange rate can be defined as the slope of the line that passes through the origin and the current number of assets and shares in the vault. Deposits and withdrawals move the vault in this line.

When plotted in log-log scale, the rate is defined similarly, but appears differently (because the point (0,0) is infinitely far away). Rates are represented by "diagonal" lines with different offsets.

In such a representation, widely different rates can be clearly visible in the same graph. This wouldn’t be the case in linear scale.

### The attack

When depositing tokens, the number of shares a user gets is rounded towards zero. This rounding takes away value from the user in favor of the vault (i.e. in favor of all the current shareholders). This rounding is often negligible because of the amount at stake. If you deposit 1e9 shares worth of tokens, the rounding will have you lose at most 0.0000001% of your deposit. However if you deposit 10 shares worth of tokens, you could lose 10% of your deposit. Even worse, if you deposit less than 1 share worth of tokens, you will receive 0 shares, effectively making a donation.

For a given amount of assets, the more shares you receive the safer you are. If you want to limit your losses to at most 1%, you need to receive at least 100 shares.

In the figure we can see that for a given deposit of 500 assets, the number of shares we get and the corresponding rounding losses depend on the exchange rate. If the exchange rate is that of the orange curve, we are getting less than a share, so we lose 100% of our deposit. However, if the exchange rate is that of the green curve, we get 5000 shares, which limits our rounding losses to at most 0.02%.

Symmetrically, if we focus on limiting our losses to a maximum of 0.5%, we need to get at least 200 shares. With the green exchange rate that requires just 20 tokens, but with the orange rate that requires 200000 tokens.

We can clearly see that the blue and green curves correspond to vaults that are safer than the yellow and orange curves.

The idea of an inflation attack is that an attacker can donate assets to the vault to move the rate curve to the right, and make the vault unsafe.

Figure 6 shows how an attacker can manipulate the rate of an empty vault. First the attacker must deposit a small amount of tokens (1 token) and follow up with a donation of 1e5 tokens directly to the vault to move the exchange rate "right". This puts the vault in a state where any deposit smaller than 1e5 would be completely lost to the vault. Given that the attacker is the only shareholder (from their donation), the attacker would steal all the tokens deposited.

An attacker would typically wait for a user to do the first deposit into the vault, and would frontrun that operation with the attack described above. The risk is low, and the size of the "donation" required to manipulate the vault is equivalent to the size of the deposit that is being attacked.

In math that gives:

* \(a\_0\) the attacker deposit
* \(a\_1\) the attacker donation
* \(u\) the user deposit

|  | Assets | Shares | Rate |
| --- | --- | --- | --- |
| initial | \(0\) | \(0\) | - |
| after attacker’s deposit | \(a\_0\) | \(a\_0\) | \(1\) |
| after attacker’s donation | \(a\_0+a\_1\) | \(a\_0\) | \(\frac{a\_0}{a\_0+a\_1}\) |

This means a deposit of \(u\) will give \(\frac{u \times a\_0}{a\_0 + a\_1}\) shares.

For the attacker to dilute that deposit to 0 shares, causing the user to lose all its deposit, it must ensure that

\[\frac{u \times a\_0}{a\_0+a\_1} < 1 \iff u < 1 + \frac{a\_1}{a\_0}\]

Using \(a\_0 = 1\) and \(a\_1 = u\) is enough. So the attacker only needs \(u+1\) assets to perform a successful attack.

It is easy to generalize the above results to scenarios where the attacker is going after a smaller fraction of the user’s deposit. In order to target \(\frac{u}{n}\), the user needs to suffer rounding of a similar fraction, which means the user must receive at most \(n\) shares. This results in:

\[\frac{u \times a\_0}{a\_0+a\_1} < n \iff \frac{u}{n} < 1 + \frac{a\_1}{a\_0}\]

In this scenario, the attack is \(n\) times less powerful (in how much it is stealing) and costs \(n\) times less to execute. In both cases, the amount of funds the attacker needs to commit is equivalent to its potential earnings.

### Defending with a virtual offset

The defense we propose is based on the approach used in YieldBox. It consists of two parts:

* Use an offset between the "precision" of the representation of shares and assets. Said otherwise, we use more decimal places to represent the shares than the underlying token does to represent the assets.
* Include virtual shares and virtual assets in the exchange rate computation. These virtual assets enforce the conversion rate when the vault is empty.

These two parts work together in enforcing the security of the vault. First, the increased precision corresponds to a high rate, which we saw is safer as it reduces the rounding error when computing the amount of shares. Second, the virtual assets and shares (in addition to simplifying a lot of the computations) capture part of the donation, making it unprofitable to perform an attack.

Following the previous math definitions, we have:

* \(\delta\) the vault offset
* \(a\_0\) the attacker deposit
* \(a\_1\) the attacker donation
* \(u\) the user deposit

|  | Assets | Shares | Rate |
| --- | --- | --- | --- |
| initial | \(1\) | \(10^\delta\) | \(10^\delta\) |
| after attacker’s deposit | \(1+a\_0\) | \(10^\delta \times (1+a\_0)\) | \(10^\delta\) |
| after attacker’s donation | \(1+a\_0+a\_1\) | \(10^\delta \times (1+a\_0)\) | \(10^\delta \times \frac{1+a\_0}{1+a\_0+a\_1}\) |

One important thing to note is that the attacker only owns a fraction \(\frac{a\_0}{1 + a\_0}\) of the shares, so when doing the donation, he will only be able to recover that fraction \(\frac{a\_1 \times a\_0}{1 + a\_0}\) of the donation. The remaining \(\frac{a\_1}{1+a\_0}\) are captured by the vault.

\[\mathit{loss} = \frac{a\_1}{1+a\_0}\]

When the user deposits \(u\), he receives

\[10^\delta \times u \times \frac{1+a\_0}{1+a\_0+a\_1}\]

For the attacker to dilute that deposit to 0 shares, causing the user to lose all its deposit, it must ensure that

\[10^\delta \times u \times \frac{1+a\_0}{1+a\_0+a\_1} < 1\]

\[\iff 10^\delta \times u < \frac{1+a\_0+a\_1}{1+a\_0}\]

\[\iff 10^\delta \times u < 1 + \frac{a\_1}{1+a\_0}\]

\[\iff 10^\delta \times u \le \mathit{loss}\]

* If the offset is 0, the attacker loss is at least equal to the user’s deposit.
* If the offset is greater than 0, the attacker will have to suffer losses that are orders of magnitude bigger than the amount of value that can hypothetically be stolen from the user.

This shows that even with an offset of 0, the virtual shares and assets make this attack non profitable for the attacker. Bigger offsets increase the security even further by making any attack on the user extremely wasteful.

The following figure shows how the offset impacts the initial rate and limits the ability of an attacker with limited funds to inflate it effectively.

\(\delta = 3\), \(a\_0 = 1\), \(a\_1 = 10^5\)

\(\delta = 3\), \(a\_0 = 100\), \(a\_1 = 10^5\)

\(\delta = 6\), \(a\_0 = 1\), \(a\_1 = 10^5\)

## Usage

### Custom behavior: Adding fees to the vault

In ERC4626 vaults, fees can be captured during the deposit/mint and/or during the withdraw/redeem steps.
In both cases, it is essential to remain compliant with the ERC4626 requirements in regard to the preview functions.

For example, if calling `deposit(100, receiver)`, the caller should deposit exactly 100 underlying tokens, including fees, and the receiver should receive a number of shares that matches the value returned by `preview_deposit(100)`.
Similarly, `preview_mint` should account for the fees that the user will have to pay on top of share’s cost.

As for the `Deposit` event, while this is less clear in the EIP spec itself,
there seems to be consensus that it should include the number of assets paid for by the user, including the fees.

On the other hand, when withdrawing assets, the number given by the user should correspond to what the user receives.
Any fees should be added to the quote (in shares) performed by `preview_withdraw`.

The `Withdraw` event should include the number of shares the user burns (including fees) and the number of assets the user actually receives (after fees are deducted).

The consequence of this design is that both the `Deposit` and `Withdraw` events will describe two exchange rates.
The spread between the "Buy-in" and the "Exit" prices correspond to the fees taken by the vault.

The following example describes how fees proportional to the deposited/withdrawn amount can be implemented:

```
/// The mock contract charges fees in terms of assets, not shares.
/// This means that the fees are calculated based on the amount of assets that are being deposited
/// or withdrawn, and not based on the amount of shares that are being minted or redeemed.
/// This is an opinionated design decision for the purpose of testing.
/// DO NOT USE IN PRODUCTION
#[starknet::contract]
pub mod ERC4626Fees {
    use openzeppelin_token::erc20::extensions::erc4626::ERC4626Component;
    use openzeppelin_token::erc20::extensions::erc4626::ERC4626Component::FeeConfigTrait;
    use openzeppelin_token::erc20::extensions::erc4626::ERC4626Component::InternalTrait as ERC4626InternalTrait;
    use openzeppelin_token::erc20::extensions::erc4626::{DefaultConfig, ERC4626DefaultLimits};
    use openzeppelin_token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
    use openzeppelin_token::erc20::{ERC20Component, ERC20HooksEmptyImpl};
    use openzeppelin_utils::math;
    use openzeppelin_utils::math::Rounding;
    use starknet::ContractAddress;
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};

    component!(path: ERC4626Component, storage: erc4626, event: ERC4626Event);
    component!(path: ERC20Component, storage: erc20, event: ERC20Event);

    // ERC4626
    #[abi(embed_v0)]
    impl ERC4626ComponentImpl = ERC4626Component::ERC4626Impl<ContractState>;
    // ERC4626MetadataImpl is a custom impl of IERC20Metadata
    #[abi(embed_v0)]
    impl ERC4626MetadataImpl = ERC4626Component::ERC4626MetadataImpl<ContractState>;

    // ERC20
    #[abi(embed_v0)]
    impl ERC20Impl = ERC20Component::ERC20Impl<ContractState>;
    #[abi(embed_v0)]
    impl ERC20CamelOnlyImpl = ERC20Component::ERC20CamelOnlyImpl<ContractState>;

    impl ERC4626InternalImpl = ERC4626Component::InternalImpl<ContractState>;
    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;

    #[storage]
    pub struct Storage {
        #[substorage(v0)]
        pub erc4626: ERC4626Component::Storage,
        #[substorage(v0)]
        pub erc20: ERC20Component::Storage,
        pub entry_fee_basis_point_value: u256,
        pub entry_fee_recipient: ContractAddress,
        pub exit_fee_basis_point_value: u256,
        pub exit_fee_recipient: ContractAddress,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC4626Event: ERC4626Component::Event,
        #[flat]
        ERC20Event: ERC20Component::Event,
    }

    const _BASIS_POINT_SCALE: u256 = 10_000;

    ///
    /// Hooks
    ///

    impl ERC4626HooksImpl of ERC4626Component::ERC4626HooksTrait<ContractState> {
        fn after_deposit(
            ref self: ERC4626Component::ComponentState<ContractState>, assets: u256, shares: u256,
        ) {
            let mut contract_state = self.get_contract_mut();
            let entry_basis_points = contract_state.entry_fee_basis_point_value.read();
            let fee = contract_state.fee_on_total(assets, entry_basis_points);
            let recipient = contract_state.entry_fee_recipient.read();

            if fee > 0 && recipient != starknet::get_contract_address() {
                contract_state.transfer_fees(recipient, fee);
            }
        }

        fn before_withdraw(
            ref self: ERC4626Component::ComponentState<ContractState>, assets: u256, shares: u256,
        ) {
            let mut contract_state = self.get_contract_mut();
            let exit_basis_points = contract_state.exit_fee_basis_point_value.read();
            let fee = contract_state.fee_on_raw(assets, exit_basis_points);
            let recipient = contract_state.exit_fee_recipient.read();

            if fee > 0 && recipient != starknet::get_contract_address() {
                contract_state.transfer_fees(recipient, fee);
            }
        }
    }

    /// Adjust fees
    impl AdjustFeesImpl of FeeConfigTrait<ContractState> {
        fn adjust_deposit(
            self: @ERC4626Component::ComponentState<ContractState>, assets: u256,
        ) -> u256 {
            let contract_state = self.get_contract();
            contract_state.remove_fee_from_deposit(assets)
        }

        fn adjust_mint(
            self: @ERC4626Component::ComponentState<ContractState>, assets: u256,
        ) -> u256 {
            let contract_state = self.get_contract();
            contract_state.add_fee_to_mint(assets)
        }

        fn adjust_withdraw(
            self: @ERC4626Component::ComponentState<ContractState>, assets: u256,
        ) -> u256 {
            let contract_state = self.get_contract();
            contract_state.add_fee_to_withdraw(assets)
        }

        fn adjust_redeem(
            self: @ERC4626Component::ComponentState<ContractState>, assets: u256,
        ) -> u256 {
            let contract_state = self.get_contract();
            contract_state.remove_fee_from_redeem(assets)
        }
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        name: ByteArray,
        symbol: ByteArray,
        underlying_asset: ContractAddress,
        initial_supply: u256,
        recipient: ContractAddress,
        entry_fee: u256,
        entry_treasury: ContractAddress,
        exit_fee: u256,
        exit_treasury: ContractAddress,
    ) {
        self.erc20.initializer(name, symbol);
        self.erc20.mint(recipient, initial_supply);
        self.erc4626.initializer(underlying_asset);

        self.entry_fee_basis_point_value.write(entry_fee);
        self.entry_fee_recipient.write(entry_treasury);
        self.exit_fee_basis_point_value.write(exit_fee);
        self.exit_fee_recipient.write(exit_treasury);
    }

    #[generate_trait]
    pub impl InternalImpl of InternalTrait {
        fn transfer_fees(ref self: ContractState, recipient: ContractAddress, fee: u256) {
            let asset_address = self.asset();
            let asset_dispatcher = IERC20Dispatcher { contract_address: asset_address };
            assert(asset_dispatcher.transfer(recipient, fee), 'Fee transfer failed');
        }

        fn remove_fee_from_deposit(self: @ContractState, assets: u256) -> u256 {
            let fee = self.fee_on_total(assets, self.entry_fee_basis_point_value.read());
            assets - fee
        }

        fn add_fee_to_mint(self: @ContractState, assets: u256) -> u256 {
            assets + self.fee_on_raw(assets, self.entry_fee_basis_point_value.read())
        }

        fn add_fee_to_withdraw(self: @ContractState, assets: u256) -> u256 {
            let fee = self.fee_on_raw(assets, self.exit_fee_basis_point_value.read());
            assets + fee
        }

        fn remove_fee_from_redeem(self: @ContractState, assets: u256) -> u256 {
            assets - self.fee_on_total(assets, self.exit_fee_basis_point_value.read())
        }

        ///
        /// Fee operations
        ///

        /// Calculates the fees that should be added to an amount `assets` that does not already
        /// include fees.
        /// Used in IERC4626::mint and IERC4626::withdraw operations.
        fn fee_on_raw(self: @ContractState, assets: u256, fee_basis_points: u256) -> u256 {
            math::u256_mul_div(assets, fee_basis_points, _BASIS_POINT_SCALE, Rounding::Ceil)
        }

        /// Calculates the fee part of an amount `assets` that already includes fees.
        /// Used in IERC4626::deposit and IERC4626::redeem operations.
        fn fee_on_total(self: @ContractState, assets: u256, fee_basis_points: u256) -> u256 {
            math::u256_mul_div(
                assets, fee_basis_points, fee_basis_points + _BASIS_POINT_SCALE, Rounding::Ceil,
            )
        }
    }
}
```

## Interface

The following interface represents the full ABI of the Contracts for Cairo ERC4626Component.
The full interface includes the IERC4626, IERC20, and IERC20Metadata interfaces.
Note that implementing the IERC20Metadata interface is a requirement of IERC4626.

```
#[starknet::interface]
pub trait ERC4626ABI {
    // IERC4626
    fn asset() -> ContractAddress;
    fn total_assets() -> u256;
    fn convert_to_shares(assets: u256) -> u256;
    fn convert_to_assets(shares: u256) -> u256;
    fn max_deposit(receiver: ContractAddress) -> u256;
    fn preview_deposit(assets: u256) -> u256;
    fn deposit(assets: u256, receiver: ContractAddress) -> u256;
    fn max_mint(receiver: ContractAddress) -> u256;
    fn preview_mint(shares: u256) -> u256;
    fn mint(shares: u256, receiver: ContractAddress) -> u256;
    fn max_withdraw(owner: ContractAddress) -> u256;
    fn preview_withdraw(assets: u256) -> u256;
    fn withdraw(
        assets: u256, receiver: ContractAddress, owner: ContractAddress,
    ) -> u256;
    fn max_redeem(owner: ContractAddress) -> u256;
    fn preview_redeem(shares: u256) -> u256;
    fn redeem(
        shares: u256, receiver: ContractAddress, owner: ContractAddress,
    ) -> u256;

    // IERC20
    fn total_supply() -> u256;
    fn balance_of(account: ContractAddress) -> u256;
    fn allowance(owner: ContractAddress, spender: ContractAddress) -> u256;
    fn transfer(recipient: ContractAddress, amount: u256) -> bool;
    fn transfer_from(
        sender: ContractAddress, recipient: ContractAddress, amount: u256,
    ) -> bool;
    fn approve(spender: ContractAddress, amount: u256) -> bool;

    // IERC20Metadata
    fn name() -> ByteArray;
    fn symbol() -> ByteArray;
    fn decimals() -> u8;

    // IERC20CamelOnly
    fn totalSupply() -> u256;
    fn balanceOf(account: ContractAddress) -> u256;
    fn transferFrom(
        sender: ContractAddress, recipient: ContractAddress, amount: u256,
    ) -> bool;
}
```

← API Reference

API Reference →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0/erc721

## ERC721 - OpenZeppelin Docs

# ERC721

The ERC721 token standard is a specification for non-fungible tokens, or more colloquially: NFTs.
`token::erc721::ERC721Component` provides an approximation of EIP-721 in Cairo for Starknet.

## Usage

Using Contracts for Cairo, constructing an ERC721 contract requires integrating both `ERC721Component` and `SRC5Component`.
The contract should also set up the constructor to initialize the token’s name, symbol, and interface support.
Here’s an example of a basic contract:

```
#[starknet::contract]
mod MyNFT {
    use openzeppelin_introspection::src5::SRC5Component;
    use openzeppelin_token::erc721::{ERC721Component, ERC721HooksEmptyImpl};
    use starknet::ContractAddress;

    component!(path: ERC721Component, storage: erc721, event: ERC721Event);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    // ERC721 Mixin
    #[abi(embed_v0)]
    impl ERC721MixinImpl = ERC721Component::ERC721MixinImpl<ContractState>;
    impl ERC721InternalImpl = ERC721Component::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        erc721: ERC721Component::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC721Event: ERC721Component::Event,
        #[flat]
        SRC5Event: SRC5Component::Event
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        recipient: ContractAddress
    ) {
        let name = "MyNFT";
        let symbol = "NFT";
        let base_uri = "https://api.example.com/v1/";
        let token_id = 1;

        self.erc721.initializer(name, symbol, base_uri);
        self.erc721.mint(recipient, token_id);
    }
}
```

## Interface

The following interface represents the full ABI of the Contracts for Cairo ERC721Component.
The interface includes the IERC721 standard interface and the optional IERC721Metadata interface.

To support older token deployments, as mentioned in Dual interfaces, the component also includes implementations of the interface written in camelCase.

```
#[starknet::interface]
pub trait ERC721ABI {
    // IERC721
    fn balance_of(account: ContractAddress) -> u256;
    fn owner_of(token_id: u256) -> ContractAddress;
    fn safe_transfer_from(
        from: ContractAddress,
        to: ContractAddress,
        token_id: u256,
        data: Span<felt252>
    );
    fn transfer_from(from: ContractAddress, to: ContractAddress, token_id: u256);
    fn approve(to: ContractAddress, token_id: u256);
    fn set_approval_for_all(operator: ContractAddress, approved: bool);
    fn get_approved(token_id: u256) -> ContractAddress;
    fn is_approved_for_all(owner: ContractAddress, operator: ContractAddress) -> bool;

    // IERC721Metadata
    fn name() -> ByteArray;
    fn symbol() -> ByteArray;
    fn token_uri(token_id: u256) -> ByteArray;

    // IERC721CamelOnly
    fn balanceOf(account: ContractAddress) -> u256;
    fn ownerOf(tokenId: u256) -> ContractAddress;
    fn safeTransferFrom(
        from: ContractAddress,
        to: ContractAddress,
        tokenId: u256,
        data: Span<felt252>
    );
    fn transferFrom(from: ContractAddress, to: ContractAddress, tokenId: u256);
    fn setApprovalForAll(operator: ContractAddress, approved: bool);
    fn getApproved(tokenId: u256) -> ContractAddress;
    fn isApprovedForAll(owner: ContractAddress, operator: ContractAddress) -> bool;

    // IERC721MetadataCamelOnly
    fn tokenURI(tokenId: u256) -> ByteArray;
}
```

## ERC721 compatibility

Although Starknet is not EVM compatible, this implementation aims to be as close as possible to the ERC721 standard.
This implementation does, however, include a few notable differences such as:

* `interface_id`s are hardcoded and initialized by the constructor.
  The hardcoded values derive from Starknet’s selector calculations.
  See the Introspection docs.
* `safe_transfer_from` can only be expressed as a single function in Cairo as opposed to the two functions declared in EIP721, because function overloading is currently not possible in Cairo.
  The difference between both functions consists of accepting `data` as an argument.
  `safe_transfer_from` by default accepts the `data` argument which is interpreted as `Span<felt252>`.
  If `data` is not used, simply pass an empty array.
* ERC721 utilizes SRC5 to declare and query interface support on Starknet as opposed to Ethereum’s EIP165.
  The design for `SRC5` is similar to OpenZeppelin’s ERC165Storage.
* `IERC721Receiver` compliant contracts return a hardcoded interface ID according to Starknet selectors (as opposed to selector calculation in Solidity).

## Token transfers

This library includes transfer\_from and safe\_transfer\_from to transfer NFTs.
If using `transfer_from`, **the caller is responsible to confirm that the recipient is capable of receiving NFTs or else they may be permanently lost.**
The `safe_transfer_from` method mitigates this risk by querying the recipient contract’s interface support.

|  |  |
| --- | --- |
|  | Usage of `safe_transfer_from` prevents loss, though the caller must understand this adds an external call which potentially creates a reentrancy vulnerability. |

## Receiving tokens

In order to be sure a non-account contract can safely accept ERC721 tokens, said contract must implement the `IERC721Receiver` interface.
The recipient contract must also implement the SRC5 interface which, as described earlier, supports interface introspection.

### IERC721Receiver

```
#[starknet::interface]
pub trait IERC721Receiver {
    fn on_erc721_received(
        operator: ContractAddress,
        from: ContractAddress,
        token_id: u256,
        data: Span<felt252>
    ) -> felt252;
}
```

Implementing the `IERC721Receiver` interface exposes the on\_erc721\_received method.
When safe methods such as safe\_transfer\_from and safe\_mint are called, they invoke the recipient contract’s `on_erc721_received` method which **must** return the IERC721Receiver interface ID.
Otherwise, the transaction will fail.

|  |  |
| --- | --- |
|  | For information on how to calculate interface IDs, see Computing the interface ID. |

### Creating a token receiver contract

The Contracts for Cairo `IERC721ReceiverImpl` already returns the correct interface ID for safe token transfers.
To integrate the `IERC721Receiver` interface into a contract, simply include the ABI embed directive to the implementation and add the `initializer` in the contract’s constructor.
Here’s an example of a simple token receiver contract:

```
#[starknet::contract]
mod MyTokenReceiver {
    use openzeppelin_introspection::src5::SRC5Component;
    use openzeppelin_token::erc721::ERC721ReceiverComponent;
    use starknet::ContractAddress;

    component!(path: ERC721ReceiverComponent, storage: erc721_receiver, event: ERC721ReceiverEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    // ERC721Receiver Mixin
    #[abi(embed_v0)]
    impl ERC721ReceiverMixinImpl = ERC721ReceiverComponent::ERC721ReceiverMixinImpl<ContractState>;
    impl ERC721ReceiverInternalImpl = ERC721ReceiverComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        erc721_receiver: ERC721ReceiverComponent::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC721ReceiverEvent: ERC721ReceiverComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event
    }

    #[constructor]
    fn constructor(ref self: ContractState) {
        self.erc721_receiver.initializer();
    }
}
```

## Storing ERC721 URIs

Token URIs were previously stored as single field elements prior to Cairo v0.2.5.
ERC721Component now stores only the base URI as a `ByteArray` and the full token URI is returned as the `ByteArray` concatenation of the base URI and the token ID through the token\_uri method.
This design mirrors OpenZeppelin’s default Solidity implementation for ERC721.

← API Reference

API Reference →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0/finance

## Finance - OpenZeppelin Docs

# Finance

This module includes primitives for financial systems.

## Vesting component

The VestingComponent manages the gradual release of ERC-20 tokens to a designated beneficiary based on a predefined vesting schedule.
The implementing contract must implement the OwnableComponent, where the contract owner is regarded as the vesting beneficiary.
This structure allows ownership rights of both the contract and the vested tokens to be assigned and transferred.

|  |  |
| --- | --- |
|  | Any assets transferred to this contract will follow the vesting schedule as if they were locked from the beginning of the vesting period. As a result, if the vesting has already started, a portion of the newly transferred tokens may become immediately releasable. |

|  |  |
| --- | --- |
|  | By setting the duration to 0, it’s possible to configure this contract to behave like an asset timelock that holds tokens for a beneficiary until a specified date. |

### Vesting schedule

The VestingSchedule trait defines the logic for calculating the vested amount based on a given timestamp. This
logic is not part of the VestingComponent, so any contract implementing the VestingComponent must provide its own
implementation of the VestingSchedule trait.

|  |  |
| --- | --- |
|  | There’s a ready-made implementation of the VestingSchedule trait available named LinearVestingSchedule. It incorporates a cliff period by returning 0 vested amount until the cliff ends. After the cliff, the vested amount is calculated as directly proportional to the time elapsed since the beginning of the vesting schedule. |

### Usage

The contract must integrate VestingComponent and OwnableComponent as dependencies. The contract’s constructor
should initialize both components. Core vesting parameters, such as `beneficiary`, `start`, `duration`
and `cliff_duration`, are passed as arguments to the constructor and set at the time of deployment.

The implementing contract must provide an implementation of the VestingSchedule trait. This can be achieved either by importing
a ready-made LinearVestingSchedule implementation or by defining a custom one.

Here’s an example of a simple vesting wallet contract with a LinearVestingSchedule, where the vested amount
is calculated as being directly proportional to the time elapsed since the start of the vesting period.

```
#[starknet::contract]
mod LinearVestingWallet {
    use openzeppelin_access::ownable::OwnableComponent;
    use openzeppelin_finance::vesting::{VestingComponent, LinearVestingSchedule};
    use starknet::ContractAddress;

    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);
    component!(path: VestingComponent, storage: vesting, event: VestingEvent);

    #[abi(embed_v0)]
    impl OwnableMixinImpl = OwnableComponent::OwnableMixinImpl<ContractState>;
    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;

    #[abi(embed_v0)]
    impl VestingImpl = VestingComponent::VestingImpl<ContractState>;
    impl VestingInternalImpl = VestingComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
        #[substorage(v0)]
        vesting: VestingComponent::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        OwnableEvent: OwnableComponent::Event,
        #[flat]
        VestingEvent: VestingComponent::Event
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        beneficiary: ContractAddress,
        start: u64,
        duration: u64,
        cliff_duration: u64
    ) {
        self.ownable.initializer(beneficiary);
        self.vesting.initializer(start, duration, cliff_duration);
    }
}
```

A vesting schedule will often follow a custom formula. In such cases, the VestingSchedule trait is useful.
To support a custom vesting schedule, the contract must provide an implementation of the
calculate\_vested\_amount function based on the desired formula.

|  |  |
| --- | --- |
|  | When using a custom VestingSchedule implementation, the LinearVestingSchedule must be excluded from the imports. |

|  |  |
| --- | --- |
|  | If there are additional parameters required for calculations, which are stored in the contract’s storage, you can access them using `self.get_contract()`. |

Here’s an example of a vesting wallet contract with a custom VestingSchedule implementation, where tokens
are vested in a number of steps.

```
#[starknet::contract]
mod StepsVestingWallet {
    use openzeppelin_access::ownable::OwnableComponent;
    use openzeppelin_finance::vesting::VestingComponent::VestingScheduleTrait;
    use openzeppelin_finance::vesting::VestingComponent;
    use starknet::ContractAddress;
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};

    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);
    component!(path: VestingComponent, storage: vesting, event: VestingEvent);

    #[abi(embed_v0)]
    impl OwnableMixinImpl = OwnableComponent::OwnableMixinImpl<ContractState>;
    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;

    #[abi(embed_v0)]
    impl VestingImpl = VestingComponent::VestingImpl<ContractState>;
    impl VestingInternalImpl = VestingComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        total_steps: u64,
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
        #[substorage(v0)]
        vesting: VestingComponent::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        OwnableEvent: OwnableComponent::Event,
        #[flat]
        VestingEvent: VestingComponent::Event
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        total_steps: u64,
        beneficiary: ContractAddress,
        start: u64,
        duration: u64,
        cliff: u64,
    ) {
        self.total_steps.write(total_steps);
        self.ownable.initializer(beneficiary);
        self.vesting.initializer(start, duration, cliff);
    }

    impl VestingSchedule of VestingScheduleTrait<ContractState> {
        fn calculate_vested_amount(
            self: @VestingComponent::ComponentState<ContractState>,
            token: ContractAddress,
            total_allocation: u256,
            timestamp: u64,
            start: u64,
            duration: u64,
            cliff: u64,
        ) -> u256 {
            if timestamp < cliff {
                0
            } else if timestamp >= start + duration {
                total_allocation
            } else {
                let total_steps = self.get_contract().total_steps.read();
                let vested_per_step = total_allocation / total_steps.into();
                let step_duration = duration / total_steps;
                let current_step = (timestamp - start) / step_duration;
                let vested_amount = vested_per_step * current_step.into();
                vested_amount
            }
        }
    }
}
```

### Interface

Here is the full interface of a standard contract implementing the vesting functionality:

```
#[starknet::interface]
pub trait VestingABI<TState> {
    // IVesting
    fn start(self: @TState) -> u64;
    fn cliff(self: @TState) -> u64;
    fn duration(self: @TState) -> u64;
    fn end(self: @TState) -> u64;
    fn released(self: @TState, token: ContractAddress) -> u256;
    fn releasable(self: @TState, token: ContractAddress) -> u256;
    fn vested_amount(self: @TState, token: ContractAddress, timestamp: u64) -> u256;
    fn release(ref self: TState, token: ContractAddress) -> u256;

    // IOwnable
    fn owner(self: @TState) -> ContractAddress;
    fn transfer_ownership(ref self: TState, new_owner: ContractAddress);
    fn renounce_ownership(ref self: TState);

    // IOwnableCamelOnly
    fn transferOwnership(ref self: TState, newOwner: ContractAddress);
    fn renounceOwnership(ref self: TState);
}
```

← API Reference

API Reference →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0/governance/governor

## Governor - OpenZeppelin Docs

# Governor

Decentralized protocols are in constant evolution from the moment they are publicly released. Often,
the initial team retains control of this evolution in the first stages, but eventually delegates it
to a community of stakeholders. The process by which this community makes decisions is called
on-chain governance, and it has become a central component of decentralized protocols, fueling
varied decisions such as parameter tweaking, smart contract upgrades, integrations with other
protocols, treasury management, grants, etc.

This governance protocol is generally implemented in a special-purpose contract called “Governor”. In
OpenZeppelin Contracts for Cairo, we set out to build a modular system of Governor components where different
requirements can be accommodated by implementing specific traits. You will find the most common requirements out of the box,
but writing additional ones is simple, and we will be adding new features as requested by the community in future releases.

## Usage and setup

### Token

The voting power of each account in our governance setup will be determined by an ERC20 or an ERC721 token. The token has
to implement the VotesComponent extension. This extension will keep track of historical balances so that voting power
is retrieved from past snapshots rather than current balance, which is an important protection that prevents double voting.

If your project already has a live token that does not include Votes and is not upgradeable, you can wrap it in a
governance token by using a wrapper. This will allow token holders to participate in governance by wrapping their tokens 1-to-1.

|  |  |
| --- | --- |
|  | The library currently does not include a wrapper for tokens, but it will be added in a future release. |

|  |  |
| --- | --- |
|  | Currently, the clock mode is fixed to block timestamps, since the Votes component uses the block timestamp to track checkpoints. We plan to add support for more flexible clock modes in Votes in a future release, allowing to use, for example, block numbers instead. |

### Governor

We will initially build a Governor without a timelock. The core logic is given by the GovernorComponent, but we
still need to choose:

1) how voting power is determined,

2) how many votes are needed for quorum,

3) what options people have when casting a vote and how those votes are counted, and

4) the execution mechanism that should be used.

Each of these aspects is customizable by writing your own extensions,
or more easily choosing one from the library.

**For 1)** we will use the GovernorVotes extension, which hooks to an IVotes instance to determine the voting power
of an account based on the token balance they hold when a proposal becomes active.
This module requires the address of the token to be passed as an argument to the initializer.

**For 2)** we will use GovernorVotesQuorumFraction. This works together with the IVotes instance to define the quorum as a
percentage of the total supply at the block when a proposal’s voting power is retrieved. This requires an initializer
parameter to set the percentage besides the votes token address. Most Governors nowadays use 4%. Since the quorum denominator
is 1000 for precision, we initialize the module with a numerator of 40, resulting in a 4% quorum (40/1000 = 0.04 or 4%).

**For 3)** we will use GovernorCountingSimple, an extension that offers 3 options to voters: For, Against, and Abstain,
and where only For and Abstain votes are counted towards quorum.

**For 4)** we will use GovernorCoreExecution, an extension that allows proposal execution directly through the governor.

|  |  |
| --- | --- |
|  | Another option is GovernorTimelockExecution. An example can be found in the next section. |

Besides these, we also need an implementation for the GovernorSettingsTrait defining the voting delay, voting period,
and proposal threshold. While we can use the GovernorSettings extension which allows to set these parameters by the
governor itself, we will implement the trait locally in the contract and set the voting delay, voting period,
and proposal threshold as constant values.

*voting\_delay*: How long after a proposal is created should voting power be fixed. A large voting delay gives
users time to unstake tokens if necessary.

*voting\_period*: How long does a proposal remain open to votes.

|  |  |
| --- | --- |
|  | These parameters are specified in the unit defined in the token’s clock, which is for now always timestamps. |

*proposal\_threshold*: This restricts proposal creation to accounts who have enough voting power.

An implementation of `GovernorComponent::ImmutableConfig` is also required. For the example below, we have used
the `DefaultConfig`. Check the Immutable Component Config guide for more details.

The last missing step is to add an `SNIP12Metadata` implementation used to retrieve the name and version of the governor.

```
#[starknet::contract]
mod MyGovernor {
    use openzeppelin_governance::governor::GovernorComponent::InternalTrait as GovernorInternalTrait;
    use openzeppelin_governance::governor::extensions::GovernorVotesQuorumFractionComponent::InternalTrait;
    use openzeppelin_governance::governor::extensions::{
        GovernorVotesQuorumFractionComponent, GovernorCountingSimpleComponent,
        GovernorCoreExecutionComponent,
    };
    use openzeppelin_governance::governor::{GovernorComponent, DefaultConfig};
    use openzeppelin_introspection::src5::SRC5Component;
    use openzeppelin_utils::cryptography::snip12::SNIP12Metadata;
    use starknet::ContractAddress;

    pub const VOTING_DELAY: u64 = 86400; // 1 day
    pub const VOTING_PERIOD: u64 = 604800; // 1 week
    pub const PROPOSAL_THRESHOLD: u256 = 10;
    pub const QUORUM_NUMERATOR: u256 = 40; // 4%

    component!(path: GovernorComponent, storage: governor, event: GovernorEvent);
    component!(
        path: GovernorVotesQuorumFractionComponent,
        storage: governor_votes,
        event: GovernorVotesEvent
    );
    component!(
        path: GovernorCountingSimpleComponent,
        storage: governor_counting_simple,
        event: GovernorCountingSimpleEvent
    );
    component!(
        path: GovernorCoreExecutionComponent,
        storage: governor_core_execution,
        event: GovernorCoreExecutionEvent
    );
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    // Governor
    #[abi(embed_v0)]
    impl GovernorImpl = GovernorComponent::GovernorImpl<ContractState>;

    // Extensions external
    #[abi(embed_v0)]
    impl QuorumFractionImpl =
        GovernorVotesQuorumFractionComponent::QuorumFractionImpl<ContractState>;

    // Extensions internal
    impl GovernorQuorumImpl = GovernorVotesQuorumFractionComponent::GovernorQuorum<ContractState>;
    impl GovernorVotesImpl = GovernorVotesQuorumFractionComponent::GovernorVotes<ContractState>;
    impl GovernorCountingSimpleImpl =
        GovernorCountingSimpleComponent::GovernorCounting<ContractState>;
    impl GovernorCoreExecutionImpl =
        GovernorCoreExecutionComponent::GovernorExecution<ContractState>;

    // SRC5
    #[abi(embed_v0)]
    impl SRC5Impl = SRC5Component::SRC5Impl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        pub governor: GovernorComponent::Storage,
        #[substorage(v0)]
        pub governor_votes: GovernorVotesQuorumFractionComponent::Storage,
        #[substorage(v0)]
        pub governor_counting_simple: GovernorCountingSimpleComponent::Storage,
        #[substorage(v0)]
        pub governor_core_execution: GovernorCoreExecutionComponent::Storage,
        #[substorage(v0)]
        pub src5: SRC5Component::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        GovernorEvent: GovernorComponent::Event,
        #[flat]
        GovernorVotesEvent: GovernorVotesQuorumFractionComponent::Event,
        #[flat]
        GovernorCountingSimpleEvent: GovernorCountingSimpleComponent::Event,
        #[flat]
        GovernorCoreExecutionEvent: GovernorCoreExecutionComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
    }

    #[constructor]
    fn constructor(ref self: ContractState, votes_token: ContractAddress) {
        self.governor.initializer();
        self.governor_votes.initializer(votes_token, QUORUM_NUMERATOR);
    }

    //
    // SNIP12 Metadata
    //

    pub impl SNIP12MetadataImpl of SNIP12Metadata {
        fn name() -> felt252 {
            'DAPP_NAME'
        }

        fn version() -> felt252 {
            'DAPP_VERSION'
        }
    }

    //
    // Locally implemented extensions
    //

    pub impl GovernorSettings of GovernorComponent::GovernorSettingsTrait<ContractState> {
        /// See `GovernorComponent::GovernorSettingsTrait::voting_delay`.
        fn voting_delay(self: @GovernorComponent::ComponentState<ContractState>) -> u64 {
            VOTING_DELAY
        }

        /// See `GovernorComponent::GovernorSettingsTrait::voting_period`.
        fn voting_period(self: @GovernorComponent::ComponentState<ContractState>) -> u64 {
            VOTING_PERIOD
        }

        /// See `GovernorComponent::GovernorSettingsTrait::proposal_threshold`.
        fn proposal_threshold(self: @GovernorComponent::ComponentState<ContractState>) -> u256 {
            PROPOSAL_THRESHOLD
        }
    }
}
```

### Timelock

It is good practice to add a timelock to governance decisions. This allows users to exit the system if they disagree
with a decision before it is executed. We will use OpenZeppelin’s TimelockController in combination with the
GovernorTimelockExecution extension.

|  |  |
| --- | --- |
|  | When using a timelock, it is the timelock that will execute proposals and thus the timelock that should hold any funds, ownership, and access control roles. |

TimelockController uses an AccessControl setup that we need to understand in order to set up roles.

The Proposer role is in charge of queueing operations: this is the role the Governor instance must be granted,
and it MUST be the only proposer (and canceller) in the system.

The Executor role is in charge of executing already available operations: we can assign this role to the special
zero address to allow anyone to execute (if operations can be particularly time sensitive, the Governor should be made Executor instead).

The Canceller role is in charge of canceling operations: the Governor instance must be granted this role,
and it MUST be the only canceller in the system.

Lastly, there is the Admin role, which can grant and revoke the two previous roles: this is a very sensitive role that will be granted automatically to the timelock itself, and optionally to a second account, which can be used for ease of setup but should promptly renounce the role.

The following example uses the GovernorTimelockExecution extension, together with GovernorSettings, and uses a
fixed quorum value instead of a percentage:

```
#[starknet::contract]
pub mod MyTimelockedGovernor {
    use openzeppelin_governance::governor::GovernorComponent::InternalTrait as GovernorInternalTrait;
    use openzeppelin_governance::governor::extensions::GovernorSettingsComponent::InternalTrait as GovernorSettingsInternalTrait;
    use openzeppelin_governance::governor::extensions::GovernorTimelockExecutionComponent::InternalTrait as GovernorTimelockExecutionInternalTrait;
    use openzeppelin_governance::governor::extensions::GovernorVotesComponent::InternalTrait as GovernorVotesInternalTrait;
    use openzeppelin_governance::governor::extensions::{
        GovernorVotesComponent, GovernorSettingsComponent, GovernorCountingSimpleComponent,
        GovernorTimelockExecutionComponent
    };
    use openzeppelin_governance::governor::{GovernorComponent, DefaultConfig};
    use openzeppelin_introspection::src5::SRC5Component;
    use openzeppelin_utils::cryptography::snip12::SNIP12Metadata;
    use starknet::ContractAddress;

    pub const VOTING_DELAY: u64 = 86400; // 1 day
    pub const VOTING_PERIOD: u64 = 604800; // 1 week
    pub const PROPOSAL_THRESHOLD: u256 = 10;
    pub const QUORUM: u256 = 100_000_000;

    component!(path: GovernorComponent, storage: governor, event: GovernorEvent);
    component!(path: GovernorVotesComponent, storage: governor_votes, event: GovernorVotesEvent);
    component!(
        path: GovernorSettingsComponent, storage: governor_settings, event: GovernorSettingsEvent
    );
    component!(
        path: GovernorCountingSimpleComponent,
        storage: governor_counting_simple,
        event: GovernorCountingSimpleEvent
    );
    component!(
        path: GovernorTimelockExecutionComponent,
        storage: governor_timelock_execution,
        event: GovernorTimelockExecutionEvent
    );
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    // Governor
    #[abi(embed_v0)]
    impl GovernorImpl = GovernorComponent::GovernorImpl<ContractState>;

    // Extensions external
    #[abi(embed_v0)]
    impl VotesTokenImpl = GovernorVotesComponent::VotesTokenImpl<ContractState>;
    #[abi(embed_v0)]
    impl GovernorSettingsAdminImpl =
        GovernorSettingsComponent::GovernorSettingsAdminImpl<ContractState>;
    #[abi(embed_v0)]
    impl TimelockedImpl =
        GovernorTimelockExecutionComponent::TimelockedImpl<ContractState>;

    // Extensions internal
    impl GovernorVotesImpl = GovernorVotesComponent::GovernorVotes<ContractState>;
    impl GovernorSettingsImpl = GovernorSettingsComponent::GovernorSettings<ContractState>;
    impl GovernorCountingSimpleImpl =
        GovernorCountingSimpleComponent::GovernorCounting<ContractState>;
    impl GovernorTimelockExecutionImpl =
        GovernorTimelockExecutionComponent::GovernorExecution<ContractState>;

    // SRC5
    #[abi(embed_v0)]
    impl SRC5Impl = SRC5Component::SRC5Impl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        pub governor: GovernorComponent::Storage,
        #[substorage(v0)]
        pub governor_votes: GovernorVotesComponent::Storage,
        #[substorage(v0)]
        pub governor_settings: GovernorSettingsComponent::Storage,
        #[substorage(v0)]
        pub governor_counting_simple: GovernorCountingSimpleComponent::Storage,
        #[substorage(v0)]
        pub governor_timelock_execution: GovernorTimelockExecutionComponent::Storage,
        #[substorage(v0)]
        pub src5: SRC5Component::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        GovernorEvent: GovernorComponent::Event,
        #[flat]
        GovernorVotesEvent: GovernorVotesComponent::Event,
        #[flat]
        GovernorSettingsEvent: GovernorSettingsComponent::Event,
        #[flat]
        GovernorCountingSimpleEvent: GovernorCountingSimpleComponent::Event,
        #[flat]
        GovernorTimelockExecutionEvent: GovernorTimelockExecutionComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState, votes_token: ContractAddress, timelock_controller: ContractAddress
    ) {
        self.governor.initializer();
        self.governor_votes.initializer(votes_token);
        self.governor_settings.initializer(VOTING_DELAY, VOTING_PERIOD, PROPOSAL_THRESHOLD);
        self.governor_timelock_execution.initializer(timelock_controller);
    }

    //
    // SNIP12 Metadata
    //

    pub impl SNIP12MetadataImpl of SNIP12Metadata {
        fn name() -> felt252 {
            'DAPP_NAME'
        }

        fn version() -> felt252 {
            'DAPP_VERSION'
        }
    }

    //
    // Locally implemented extensions
    //

    impl GovernorQuorum of GovernorComponent::GovernorQuorumTrait<ContractState> {
        /// See `GovernorComponent::GovernorQuorumTrait::quorum`.
        fn quorum(self: @GovernorComponent::ComponentState<ContractState>, timepoint: u64) -> u256 {
            QUORUM
        }
    }
}
```

## Interface

This is the full interface of the `Governor` implementation:

```
#[starknet::interface]
pub trait IGovernor<TState> {
    fn name(self: @TState) -> felt252;
    fn version(self: @TState) -> felt252;
    fn COUNTING_MODE(self: @TState) -> ByteArray;
    fn hash_proposal(self: @TState, calls: Span<Call>, description_hash: felt252) -> felt252;
    fn state(self: @TState, proposal_id: felt252) -> ProposalState;
    fn proposal_threshold(self: @TState) -> u256;
    fn proposal_snapshot(self: @TState, proposal_id: felt252) -> u64;
    fn proposal_deadline(self: @TState, proposal_id: felt252) -> u64;
    fn proposal_proposer(self: @TState, proposal_id: felt252) -> ContractAddress;
    fn proposal_eta(self: @TState, proposal_id: felt252) -> u64;
    fn proposal_needs_queuing(self: @TState, proposal_id: felt252) -> bool;
    fn voting_delay(self: @TState) -> u64;
    fn voting_period(self: @TState) -> u64;
    fn quorum(self: @TState, timepoint: u64) -> u256;
    fn get_votes(self: @TState, account: ContractAddress, timepoint: u64) -> u256;
    fn get_votes_with_params(
        self: @TState, account: ContractAddress, timepoint: u64, params: Span<felt252>
    ) -> u256;
    fn has_voted(self: @TState, proposal_id: felt252, account: ContractAddress) -> bool;
    fn propose(ref self: TState, calls: Span<Call>, description: ByteArray) -> felt252;
    fn queue(ref self: TState, calls: Span<Call>, description_hash: felt252) -> felt252;
    fn execute(ref self: TState, calls: Span<Call>, description_hash: felt252) -> felt252;
    fn cancel(ref self: TState, calls: Span<Call>, description_hash: felt252) -> felt252;
    fn cast_vote(ref self: TState, proposal_id: felt252, support: u8) -> u256;
    fn cast_vote_with_reason(
        ref self: TState, proposal_id: felt252, support: u8, reason: ByteArray
    ) -> u256;
    fn cast_vote_with_reason_and_params(
        ref self: TState,
        proposal_id: felt252,
        support: u8,
        reason: ByteArray,
        params: Span<felt252>
    ) -> u256;
    fn cast_vote_by_sig(
        ref self: TState,
        proposal_id: felt252,
        support: u8,
        voter: ContractAddress,
        signature: Span<felt252>
    ) -> u256;
    fn cast_vote_with_reason_and_params_by_sig(
        ref self: TState,
        proposal_id: felt252,
        support: u8,
        voter: ContractAddress,
        reason: ByteArray,
        params: Span<felt252>,
        signature: Span<felt252>
    ) -> u256;
    fn nonces(self: @TState, voter: ContractAddress) -> felt252;
    fn relay(ref self: TState, call: Call);
}
```

← API Reference

Multisig →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0/governance/multisig

## Multisig - OpenZeppelin Docs

# Multisig

The Multisig component implements a multi-signature mechanism to enhance the security and
governance of smart contract transactions. It ensures that no single signer can unilaterally
execute critical actions, requiring multiple registered signers to approve and collectively
execute transactions.

This component is designed to secure operations such as fund management or protocol governance,
where collective decision-making is essential. The Multisig Component is self-administered,
meaning that changes to signers or quorum must be approved through the multisig process itself.

## Key features

* **Multi-Signature Security**: transactions must be approved by multiple signers, ensuring
  distributed governance.
* **Quorum Enforcement**: defines the minimum number of approvals required for transaction execution.
* **Self-Administration**: all modifications to the component (e.g., adding or removing signers)
  must pass through the multisig process.
* **Event Logging**: provides comprehensive event logging for transparency and auditability.

## Signer management

The Multisig component introduces the concept of signers and quorum:

* **Signers**: only registered signers can submit, confirm, revoke, or execute transactions. The Multisig
  Component supports adding, removing, or replacing signers.
* **Quorum**: the quorum defines the minimum number of confirmations required to approve a transaction.

|  |  |
| --- | --- |
|  | To prevent unauthorized modifications, only the contract itself can add, remove, or replace signers or change the quorum. This ensures that all modifications pass through the multisig approval process. |

## Transaction lifecycle

The state of a transaction is represented by the `TransactionState` enum and can be retrieved
by calling the `get_transaction_state` function with the transaction’s identifier.

The identifier of a multisig transaction is a `felt252` value, computed as the Pedersen hash
of the transaction’s calls and salt. It can be computed by invoking the implementing contract’s
`hash_transaction` method for single-call transactions or `hash_transaction_batch` for multi-call
transactions. Submitting a transaction with identical calls and the same salt value a second time
will fail, as transaction identifiers must be unique. To resolve this, use a different salt value
to generate a unique identifier.

A transaction in the Multisig component follows a specific lifecycle:

`NotFound` → `Pending` → `Confirmed` → `Executed`

* **NotFound**: the transaction does not exist.
* **Pending**: the transaction exists but has not reached the required confirmations.
* **Confirmed**: the transaction has reached the quorum but has not yet been executed.
* **Executed**: the transaction has been successfully executed.

## Usage

Integrating the Multisig functionality into a contract requires implementing MultisigComponent.
The contract’s constructor should initialize the component with a quorum value and a list of initial signers.

Here’s an example of a simple wallet contract featuring the Multisig functionality:

```
#[starknet::contract]
mod MultisigWallet {
    use openzeppelin_governance::multisig::MultisigComponent;
    use starknet::ContractAddress;

    component!(path: MultisigComponent, storage: multisig, event: MultisigEvent);

    #[abi(embed_v0)]
    impl MultisigImpl = MultisigComponent::MultisigImpl<ContractState>;
    impl MultisigInternalImpl = MultisigComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        multisig: MultisigComponent::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        MultisigEvent: MultisigComponent::Event,
    }

    #[constructor]
    fn constructor(ref self: ContractState, quorum: u32, signers: Span<ContractAddress>) {
        self.multisig.initializer(quorum, signers);
    }
}
```

## Interface

This is the interface of a contract implementing the MultisigComponent:

```
#[starknet::interface]
pub trait MultisigABI<TState> {
    // Read functions
    fn get_quorum(self: @TState) -> u32;
    fn is_signer(self: @TState, signer: ContractAddress) -> bool;
    fn get_signers(self: @TState) -> Span<ContractAddress>;
    fn is_confirmed(self: @TState, id: TransactionID) -> bool;
    fn is_confirmed_by(self: @TState, id: TransactionID, signer: ContractAddress) -> bool;
    fn is_executed(self: @TState, id: TransactionID) -> bool;
    fn get_submitted_block(self: @TState, id: TransactionID) -> u64;
    fn get_transaction_state(self: @TState, id: TransactionID) -> TransactionState;
    fn get_transaction_confirmations(self: @TState, id: TransactionID) -> u32;
    fn hash_transaction(
        self: @TState,
        to: ContractAddress,
        selector: felt252,
        calldata: Span<felt252>,
        salt: felt252,
    ) -> TransactionID;
    fn hash_transaction_batch(self: @TState, calls: Span<Call>, salt: felt252) -> TransactionID;

    // Write functions
    fn add_signers(ref self: TState, new_quorum: u32, signers_to_add: Span<ContractAddress>);
    fn remove_signers(ref self: TState, new_quorum: u32, signers_to_remove: Span<ContractAddress>);
    fn replace_signer(
        ref self: TState, signer_to_remove: ContractAddress, signer_to_add: ContractAddress,
    );
    fn change_quorum(ref self: TState, new_quorum: u32);
    fn submit_transaction(
        ref self: TState,
        to: ContractAddress,
        selector: felt252,
        calldata: Span<felt252>,
        salt: felt252,
    ) -> TransactionID;
    fn submit_transaction_batch(
        ref self: TState, calls: Span<Call>, salt: felt252,
    ) -> TransactionID;
    fn confirm_transaction(ref self: TState, id: TransactionID);
    fn revoke_confirmation(ref self: TState, id: TransactionID);
    fn execute_transaction(
        ref self: TState,
        to: ContractAddress,
        selector: felt252,
        calldata: Span<felt252>,
        salt: felt252,
    );
    fn execute_transaction_batch(ref self: TState, calls: Span<Call>, salt: felt252);
}
```

← Governor

Timelock Controller →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0/governance/timelock

## Timelock Controller - OpenZeppelin Docs

# Timelock Controller

The Timelock Controller provides a means of enforcing time delays on the execution of transactions. This is considered good practice regarding governance systems because it allows users the opportunity to exit the system if they disagree with a decision before it is executed.

|  |  |
| --- | --- |
|  | The Timelock contract itself executes transactions, not the user. The Timelock should, therefore, hold associated funds, ownership, and access control roles. |

## Operation lifecycle

The state of an operation is represented by the `OperationState` enum and can be retrieved
by calling the `get_operation_state` function with the operation’s identifier.

The identifier of an operation is a `felt252` value, computed as the Pedersen hash of the
operation’s call or calls, its predecessor, and salt. It can be computed by invoking the
implementing contract’s `hash_operation` function for single-call operations or
`hash_operation_batch` for multi-call operations. Submitting an operation with identical calls,
predecessor, and the same salt value a second time will fail, as operation identifiers must be
unique. To resolve this, use a different salt value to generate a unique identifier.

Timelocked operations follow a specific lifecycle:

`Unset` → `Waiting` → `Ready` → `Done`

* `Unset`: the operation has not been scheduled or has been canceled.
* `Waiting`: the operation has been scheduled and is pending the scheduled delay.
* `Ready`: the timer has expired, and the operation is eligible for execution.
* `Done`: the operation has been executed.

## Timelock flow

### Schedule

When a proposer calls schedule, the `OperationState` moves from `Unset` to `Waiting`.
This starts a timer that must be greater than or equal to the minimum delay.
The timer expires at a timestamp accessible through get\_timestamp.
Once the timer expires, the `OperationState` automatically moves to the `Ready` state.
At this point, it can be executed.

### Execute

By calling execute, an executor triggers the operation’s underlying transactions and moves it to the `Done` state. If the operation has a predecessor, the predecessor’s operation must be in the `Done` state for this transaction to succeed.

### Cancel

The cancel function allows cancellers to cancel any pending operations.
This resets the operation to the `Unset` state.
It is therefore possible for a proposer to re-schedule an operation that has been cancelled.
In this case, the timer restarts when the operation is re-scheduled.

### Roles

TimelockControllerComponent leverages an AccessControlComponent setup that we need to understand in order to set up roles.

* `PROPOSER_ROLE` - in charge of queueing operations.
* `CANCELLER_ROLE` - may cancel scheduled operations.
  During initialization, accounts granted with `PROPOSER_ROLE` will also be granted `CANCELLER_ROLE`.
  Therefore, the initial proposers may also cancel operations after they are scheduled.
* `EXECUTOR_ROLE` - in charge of executing already available operations.
* `DEFAULT_ADMIN_ROLE` - can grant and revoke the three previous roles.

|  |  |
| --- | --- |
|  | The `DEFAULT_ADMIN_ROLE` is a sensitive role that will be granted automatically to the timelock itself and optionally to a second account. The latter case may be required to ease a contract’s initial configuration; however, this role should promptly be renounced. |

Furthermore, the timelock component supports the concept of open roles for the `EXECUTOR_ROLE`.
This allows anyone to execute an operation once it’s in the `Ready` OperationState.
To enable the `EXECUTOR_ROLE` to be open, grant the zero address with the `EXECUTOR_ROLE`.

|  |  |
| --- | --- |
|  | Be very careful with enabling open roles as *anyone* can call the function. |

### Minimum delay

The minimum delay of the timelock acts as a buffer from when a proposer schedules an operation to the earliest point at which an executor may execute that operation.
The idea is for users, should they disagree with a scheduled proposal, to have options such as exiting the system or making their case for cancellers to cancel the operation.

After initialization, the only way to change the timelock’s minimum delay is to schedule it and execute it with the same flow as any other operation.

The minimum delay of a contract is accessible through get\_min\_delay.

### Usage

Integrating the timelock into a contract requires integrating TimelockControllerComponent as well as SRC5Component and AccessControlComponent as dependencies.
The contract’s constructor should initialize the timelock which consists of setting the:

* Proposers and executors.
* Minimum delay between scheduling and executing an operation.
* Optional admin if additional configuration is required.

|  |  |
| --- | --- |
|  | The optional admin should renounce their role once configuration is complete. |

Here’s an example of a simple timelock contract:

```
#[starknet::contract]
mod TimelockControllerContract {
    use openzeppelin_access::accesscontrol::AccessControlComponent;
    use openzeppelin_governance::timelock::TimelockControllerComponent;
    use openzeppelin_introspection::src5::SRC5Component;
    use starknet::ContractAddress;

    component!(path: AccessControlComponent, storage: access_control, event: AccessControlEvent);
    component!(path: TimelockControllerComponent, storage: timelock, event: TimelockEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    // Timelock Mixin
    #[abi(embed_v0)]
    impl TimelockMixinImpl =
        TimelockControllerComponent::TimelockMixinImpl<ContractState>;
    impl TimelockInternalImpl = TimelockControllerComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        access_control: AccessControlComponent::Storage,
        #[substorage(v0)]
        timelock: TimelockControllerComponent::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        AccessControlEvent: AccessControlComponent::Event,
        #[flat]
        TimelockEvent: TimelockControllerComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        min_delay: u64,
        proposers: Span<ContractAddress>,
        executors: Span<ContractAddress>,
        admin: ContractAddress
    ) {
        self.timelock.initializer(min_delay, proposers, executors, admin);
    }
}
```

### Interface

This is the full interface of the TimelockMixinImpl implementation:

```
#[starknet::interface]
pub trait TimelockABI<TState> {
    // ITimelock
    fn is_operation(self: @TState, id: felt252) -> bool;
    fn is_operation_pending(self: @TState, id: felt252) -> bool;
    fn is_operation_ready(self: @TState, id: felt252) -> bool;
    fn is_operation_done(self: @TState, id: felt252) -> bool;
    fn get_timestamp(self: @TState, id: felt252) -> u64;
    fn get_operation_state(self: @TState, id: felt252) -> OperationState;
    fn get_min_delay(self: @TState) -> u64;
    fn hash_operation(self: @TState, call: Call, predecessor: felt252, salt: felt252) -> felt252;
    fn hash_operation_batch(
        self: @TState, calls: Span<Call>, predecessor: felt252, salt: felt252
    ) -> felt252;
    fn schedule(ref self: TState, call: Call, predecessor: felt252, salt: felt252, delay: u64);
    fn schedule_batch(
        ref self: TState, calls: Span<Call>, predecessor: felt252, salt: felt252, delay: u64
    );
    fn cancel(ref self: TState, id: felt252);
    fn execute(ref self: TState, call: Call, predecessor: felt252, salt: felt252);
    fn execute_batch(ref self: TState, calls: Span<Call>, predecessor: felt252, salt: felt252);
    fn update_delay(ref self: TState, new_delay: u64);

    // ISRC5
    fn supports_interface(self: @TState, interface_id: felt252) -> bool;

    // IAccessControl
    fn has_role(self: @TState, role: felt252, account: ContractAddress) -> bool;
    fn get_role_admin(self: @TState, role: felt252) -> felt252;
    fn grant_role(ref self: TState, role: felt252, account: ContractAddress);
    fn revoke_role(ref self: TState, role: felt252, account: ContractAddress);
    fn renounce_role(ref self: TState, role: felt252, account: ContractAddress);

    // IAccessControlCamel
    fn hasRole(self: @TState, role: felt252, account: ContractAddress) -> bool;
    fn getRoleAdmin(self: @TState, role: felt252) -> felt252;
    fn grantRole(ref self: TState, role: felt252, account: ContractAddress);
    fn revokeRole(ref self: TState, role: felt252, account: ContractAddress);
    fn renounceRole(ref self: TState, role: felt252, account: ContractAddress);
}
```

← Multisig

Votes →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0/governance/votes

## Votes - OpenZeppelin Docs

# Votes

The VotesComponent provides a flexible system for tracking and delegating voting power. This system allows users to delegate their voting power to other addresses, enabling more active participation in governance.

|  |  |
| --- | --- |
|  | By default, token balance does not account for voting power. This makes transfers cheaper. The downside is that it requires users to delegate to themselves in order to activate checkpoints and have their voting power tracked. |

|  |  |
| --- | --- |
|  | The transferring of voting units must be handled by the implementing contract. In the case of `ERC20` and `ERC721` this is usually done via the hooks. You can check the usage section for examples of how to implement this. |

## Key features

1. **Delegation**: Users can delegate their voting power to any address, including themselves. Vote power can be delegated either by calling the delegate function directly, or by providing a signature to be used with delegate\_by\_sig.
2. **Historical lookups**: The system keeps track of historical snapshots for each account, which allows the voting power of an account to be queried at a specific timestamp.  
   This can be used for example to determine the voting power of an account when a proposal was created, rather than using the current balance.

## Usage

When integrating the `VotesComponent`, the VotingUnitsTrait must be implemented to get the voting units for a given account as a function of the implementing contract.  
For simplicity, this module already provides two implementations for `ERC20` and `ERC721` tokens, which will work out of the box if the respective components are integrated.  
Additionally, you must implement the NoncesComponent and the SNIP12Metadata trait to enable delegation by signatures.

Here’s an example of how to structure a simple ERC20Votes contract:

```
#[starknet::contract]
mod ERC20VotesContract {
    use openzeppelin_governance::votes::VotesComponent;
    use openzeppelin_token::erc20::{ERC20Component, DefaultConfig};
    use openzeppelin_utils::cryptography::nonces::NoncesComponent;
    use openzeppelin_utils::cryptography::snip12::SNIP12Metadata;
    use starknet::ContractAddress;

    component!(path: VotesComponent, storage: erc20_votes, event: ERC20VotesEvent);
    component!(path: ERC20Component, storage: erc20, event: ERC20Event);
    component!(path: NoncesComponent, storage: nonces, event: NoncesEvent);

    // Votes
    #[abi(embed_v0)]
    impl VotesImpl = VotesComponent::VotesImpl<ContractState>;
    impl VotesInternalImpl = VotesComponent::InternalImpl<ContractState>;

    // ERC20
    #[abi(embed_v0)]
    impl ERC20MixinImpl = ERC20Component::ERC20MixinImpl<ContractState>;
    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;

    // Nonces
    #[abi(embed_v0)]
    impl NoncesImpl = NoncesComponent::NoncesImpl<ContractState>;

    #[storage]
    pub struct Storage {
        #[substorage(v0)]
        pub erc20_votes: VotesComponent::Storage,
        #[substorage(v0)]
        pub erc20: ERC20Component::Storage,
        #[substorage(v0)]
        pub nonces: NoncesComponent::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC20VotesEvent: VotesComponent::Event,
        #[flat]
        ERC20Event: ERC20Component::Event,
        #[flat]
        NoncesEvent: NoncesComponent::Event
    }

    // Required for hash computation.
    pub impl SNIP12MetadataImpl of SNIP12Metadata {
        fn name() -> felt252 {
            'DAPP_NAME'
        }
        fn version() -> felt252 {
            'DAPP_VERSION'
        }
    }

    // We need to call the `transfer_voting_units` function after
    // every mint, burn and transfer.
    // For this, we use the `after_update` hook of the `ERC20Component::ERC20HooksTrait`.
    impl ERC20VotesHooksImpl of ERC20Component::ERC20HooksTrait<ContractState> {
        fn after_update(
            ref self: ERC20Component::ComponentState<ContractState>,
            from: ContractAddress,
            recipient: ContractAddress,
            amount: u256
        ) {
            let mut contract_state = self.get_contract_mut();
            contract_state.erc20_votes.transfer_voting_units(from, recipient, amount);
        }
    }

    #[constructor]
    fn constructor(ref self: ContractState) {
        self.erc20.initializer("MyToken", "MTK");
    }
}
```

And here’s an example of how to structure a simple ERC721Votes contract:

```
#[starknet::contract]
pub mod ERC721VotesContract {
    use openzeppelin_governance::votes::VotesComponent;
    use openzeppelin_introspection::src5::SRC5Component;
    use openzeppelin_token::erc721::ERC721Component;
    use openzeppelin_utils::cryptography::nonces::NoncesComponent;
    use openzeppelin_utils::cryptography::snip12::SNIP12Metadata;
    use starknet::ContractAddress;

    component!(path: VotesComponent, storage: erc721_votes, event: ERC721VotesEvent);
    component!(path: ERC721Component, storage: erc721, event: ERC721Event);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);
    component!(path: NoncesComponent, storage: nonces, event: NoncesEvent);

    // Votes
    #[abi(embed_v0)]
    impl VotesImpl = VotesComponent::VotesImpl<ContractState>;
    impl VotesInternalImpl = VotesComponent::InternalImpl<ContractState>;

    // ERC721
    #[abi(embed_v0)]
    impl ERC721MixinImpl = ERC721Component::ERC721MixinImpl<ContractState>;
    impl ERC721InternalImpl = ERC721Component::InternalImpl<ContractState>;

    // Nonces
    #[abi(embed_v0)]
    impl NoncesImpl = NoncesComponent::NoncesImpl<ContractState>;

    #[storage]
    pub struct Storage {
        #[substorage(v0)]
        pub erc721_votes: VotesComponent::Storage,
        #[substorage(v0)]
        pub erc721: ERC721Component::Storage,
        #[substorage(v0)]
        pub src5: SRC5Component::Storage,
        #[substorage(v0)]
        pub nonces: NoncesComponent::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC721VotesEvent: VotesComponent::Event,
        #[flat]
        ERC721Event: ERC721Component::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
        #[flat]
        NoncesEvent: NoncesComponent::Event
    }

    /// Required for hash computation.
    pub impl SNIP12MetadataImpl of SNIP12Metadata {
        fn name() -> felt252 {
            'DAPP_NAME'
        }
        fn version() -> felt252 {
            'DAPP_VERSION'
        }
    }

    // We need to call the `transfer_voting_units` function after
    // every mint, burn and transfer.
    // For this, we use the `before_update` hook of the
    //`ERC721Component::ERC721HooksTrait`.
    // This hook is called before the transfer is executed.
    // This gives us access to the previous owner.
    impl ERC721VotesHooksImpl of ERC721Component::ERC721HooksTrait<ContractState> {
        fn before_update(
            ref self: ERC721Component::ComponentState<ContractState>,
            to: ContractAddress,
            token_id: u256,
            auth: ContractAddress
        ) {
            let mut contract_state = self.get_contract_mut();

            // We use the internal function here since it does not check if the token
            // id exists which is necessary for mints
            let previous_owner = self._owner_of(token_id);
            contract_state.erc721_votes.transfer_voting_units(previous_owner, to, 1);
        }
    }

    #[constructor]
    fn constructor(ref self: ContractState) {
        self.erc721.initializer("MyToken", "MTK", "");
    }
}
```

## Interface

This is the full interface of the `VotesImpl` implementation:

```
#[starknet::interface]
pub trait VotesABI<TState> {
    // IVotes
    fn get_votes(self: @TState, account: ContractAddress) -> u256;
    fn get_past_votes(self: @TState, account: ContractAddress, timepoint: u64) -> u256;
    fn get_past_total_supply(self: @TState, timepoint: u64) -> u256;
    fn delegates(self: @TState, account: ContractAddress) -> ContractAddress;
    fn delegate(ref self: TState, delegatee: ContractAddress);
    fn delegate_by_sig(ref self: TState, delegator: ContractAddress, delegatee: ContractAddress, nonce: felt252, expiry: u64, signature: Span<felt252>);

    // INonces
    fn nonces(self: @TState, owner: ContractAddress) -> felt252;
}
```

← Timelock Controller

API Reference →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0/guides/deploy-udc

## UDC Appchain Deployment - OpenZeppelin Docs

# UDC Appchain Deployment

While the Universal Deployer Contract (UDC) is deployed on Starknet public networks, appchains may need to deploy
their own instance of the UDC for their own use. This guide will walk you through this process while keeping the
same final address on all networks.

## Prerequisites

This guide assumes you have:

* Familiarity with Scarb and Starknet development environment.
* A functional account available on the network you’re deploying to.
* Familiarity with the process of declaring contracts through the declare transaction.

|  |  |
| --- | --- |
|  | For declaring contracts on Starknet, you can use the sncast tool from the starknet-foundry project. |

## Note on the UDC final address

It is important that the Universal Deployer Contract (UDC) in Starknet maintains the same address across all
networks because essential developer tools like **starkli** and **sncast** rely on this address by default when deploying contracts.
These tools are widely used in the Starknet ecosystem to streamline and standardize contract deployment workflows.

If the UDC address is consistent, developers can write deployment scripts, CI/CD pipelines, and integrations that work seamlessly
across testnets, mainnet, and appchains without needing to update configuration files or handle special cases for each
environment.

In the following sections, we’ll walk you through the process of deploying the UDC on appchains while keeping the same address,
under one important assumption: **the declared UDC class hash MUST be the same across all networks**.
Different compiler versions may produce different class hashes for the same contract, so you need to make
sure you are using the same compiler version to build the UDC class (and the release profile).

The latest version of the UDC available in the `openzeppelin_presets` package was compiled with **Cairo v2.11.4** (release profile) and the resulting class hash is `0x01b2df6d8861670d4a8ca4670433b2418d78169c2947f46dc614e69f333745c8`.

|  |  |
| --- | --- |
|  | If you are using a different compiler version, you need to make sure the class hash is the same as the one above in order to keep the same address across all networks. |

|  |  |
| --- | --- |
|  | To avoid potential issues by using a different compiler version, you can directly import the contract class deployed on Starknet mainnet and declare it on your appchain. At the time of writing, this is not easily achievable with the `sncast` tool, but you can leverage `starkli` to do it. Quick reference:  ``` starkli class-by-hash --parse \     0x01b2df6d8861670d4a8ca4670433b2418d78169c2947f46dc614e69f333745c8 \     --network mainnet \     > udc.json ```  This will output a `udc.json` file that you can use to declare the UDC on your appchain.  ``` starkli declare udc.json --rpc <rpc-url> ``` |

## Madara Appchains

Madara is a popular Starknet node implementation that has a friendly and robust interface for building appchains. If
you are using it for this purpose, you are probably familiar with the Madara Bootstrapper, which already declares and
deploys a few contracts for you when you create a new appchain, including accounts and the UDC.

However, since the UDC was migrated to a new version in June 2025, it’s possible that the appchain was created before
this change, meaning the UDC on the appchain is an older version. If that’s the case, you can follow the steps below to
deploy the new UDC.

### 1. Declare and deploy the Bootstrapper

In the Starknet ecosystem, contracts need to be declared before they can be deployed, and deployments can only happen
either via the `deploy_syscall`, or using a `deploy_account` transaction. The latter would require adding account
functionality to the UDC, which is not optimal, so we’ll use the `deploy_syscall`, which requires having an account
with this functionality enabled.

|  |  |
| --- | --- |
|  | Madara declares an account with this functionality enabled as part of the bootstrapping process. You may be able to use that implementation directly to skip this step. |

#### Bootstrapper Contract

The bootstrapper contract is a simple contract that declares the UDC and allows for its deployment via the `deploy_syscall`.
You can find a reference implementation below:

|  |  |
| --- | --- |
|  | This reference implementation targets Cairo v2.11.4. If you are using a different version of Cairo, you may need to update the code to match your compiler version. |

```
#[starknet::contract(account)]
mod UniversalDeployerBootstrapper {
    use core::num::traits::Zero;
    use openzeppelin_account::AccountComponent;
    use openzeppelin_introspection::src5::SRC5Component;
    use openzeppelin_utils::deployments::calculate_contract_address_from_deploy_syscall;
    use starknet::{ClassHash, ContractAddress, SyscallResultTrait};

    component!(path: AccountComponent, storage: account, event: AccountEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    //
    // Account features (deployable, declarer, and invoker)
    //

    #[abi(embed_v0)]
    pub(crate) impl DeployableImpl =
        AccountComponent::DeployableImpl<ContractState>;
    #[abi(embed_v0)]
    impl DeclarerImpl = AccountComponent::DeclarerImpl<ContractState>;
    #[abi(embed_v0)]
    impl SRC6Impl = AccountComponent::SRC6Impl<ContractState>;
    impl AccountInternalImpl = AccountComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        pub account: AccountComponent::Storage,
        #[substorage(v0)]
        pub src5: SRC5Component::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub(crate) enum Event {
        #[flat]
        AccountEvent: AccountComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
    }

    #[constructor]
    pub fn constructor(ref self: ContractState, public_key: felt252) {
        self.account.initializer(public_key);
    }

    #[abi(per_item)]
    #[generate_trait]
    impl ExternalImpl of ExternalTrait {
        #[external(v0)]
        fn deploy_udc(ref self: ContractState, udc_class_hash: ClassHash) {
            self.account.assert_only_self();
            starknet::syscalls::deploy_syscall(udc_class_hash, 0, array![].span(), true)
                .unwrap_syscall();
        }

        #[external(v0)]
        fn get_udc_address(ref self: ContractState, udc_class_hash: ClassHash) -> ContractAddress {
            calculate_contract_address_from_deploy_syscall(
                0, udc_class_hash, array![].span(), Zero::zero(),
            )
        }
    }
}
```

#### Deploying the Bootstrapper

This guide assumes you have a functional account available on the network you’re deploying to, and familiarity
with the process of declaring contracts through the `declare` transaction. To recap, the reason we are deploying
this bootstrapper account contract is to be able to deploy the UDC via the `deploy_syscall`.

|  |  |
| --- | --- |
|  | sncast v0.45.0 was used in the examples below. |

As a quick example, if your account is configured for **sncast**, you can declare the bootstrapper contract with the following command:

```
sncast -p <profile-name> declare \
    --contract-name UniversalDeployerBootstrapper
```

The bootstrapper implements the `IDeployable` trait, meaning it can be counterfactually deployed. Check out the
Counterfactual Deployments guide. Continuing with the **sncast** examples, you can create and deploy the bootstrapper with the following commands:

##### Create the account

```
sncast account create --name bootstrapper \
    --network <network-name> \
    --class-hash <declared-class-hash> \
    --type oz
```

##### Deploy it to the network

|  |  |
| --- | --- |
|  | You need to prefund the account with enough funds before you can deploy it. |

```
sncast account deploy \
    --network <network-name> \
    --name bootstrapper
```

### 2. Declare and deploy the UDC

Once the bootstrapper is deployed, you can declare and deploy the UDC through it.

#### Declaring the UDC

The UDC source code is available in the `openzeppelin_presets` package. You can copy it to your project and declare it with the following command:

```
sncast -p <profile-name> declare \
    --contract-name UniversalDeployer
```

|  |  |
| --- | --- |
|  | If you followed the Note on the UDC final address section, your declared class hash should be `0x01b2df6d8861670d4a8ca4670433b2418d78169c2947f46dc614e69f333745c8`. |

#### Previewing the UDC address

You can preview the UDC address with the following command:

```
sncast call \
  --network <network-name> \
  --contract-address <bootstrapper-address> \
  --function "get_udc_address" \
  --arguments '<udc-class-hash>'
```

If the UDC class hash is the same as the one in the Note on the UDC final address section,
the output should be `0x2ceed65a4bd731034c01113685c831b01c15d7d432f71afb1cf1634b53a2125`.

#### Deploying the UDC

Now everything is set up to deploy the UDC. You can use the following command to deploy it:

|  |  |
| --- | --- |
|  | Note that the bootstrapper contract MUST call itself to successfully deploy the UDC, since the `deploy_udc` function is protected. |

```
sncast \
  --account bootstrapper \
  invoke \
  --network <network-name> \
  --contract-address <bootstrapper-address> \
  --function "deploy_udc" \
  --arguments '<udc-class-hash>'
```

## Other Appchain providers

If you are using an appchain provider different from Madara, you can follow the same steps to deploy the UDC
as long as you have access to an account that can declare contracts.

Summarizing, the steps to follow are:

1. Declare the Bootstrapper
2. Counterfactually deploy the Bootstrapper
3. Declare the UDC
4. Preview the UDC address
5. Deploy the UDC from the Bootstrapper

## Conclusion

By following this guide, you have successfully deployed the Universal Deployer Contract on your appchain while ensuring consistency with
Starknet’s public networks. Maintaining the same UDC address and class hash across all environments is crucial for seamless contract deployment
and tooling compatibility, allowing developers to leverage tools like **sncast** and **starkli** without additional configuration. This process not only
improves the reliability of your deployment workflows but also ensures that your appchain remains compatible with the broader Starknet ecosystem.
With the UDC correctly deployed, you are now ready to take full advantage of streamlined contract
deployments and robust developer tooling on your appchain.

← Universal Deployer Contract

API Reference →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0/guides/deployment

## Counterfactual deployments - OpenZeppelin Docs

# Counterfactual deployments

A counterfactual contract is a contract we can interact with even before actually deploying it on-chain.
For example, we can send funds or assign privileges to a contract that doesn’t yet exist.
Why? Because deployments in Starknet are deterministic, allowing us to predict the address where our contract will be deployed.
We can leverage this property to make a contract pay for its own deployment by simply sending funds in advance. We call this a counterfactual deployment.

This process can be described with the following steps:

|  |  |
| --- | --- |
|  | For testing this flow you can check the Starknet Foundry or the Starkli guides for deploying accounts. |

1. Deterministically precompute the `contract_address` given a `class_hash`, `salt`, and constructor `calldata`.
   Note that the `class_hash` must be previously declared for the deployment to succeed.
2. Send funds to the `contract_address`. Usually you will estimate the fee of the transaction first. Existing
   tools usually do this for you.
3. Send a `DeployAccount` type transaction to the network.
4. The protocol will then validate the transaction with the `__validate_deploy__` entrypoint of the contract to be deployed.
5. If the validation succeeds, the protocol will charge the fee and then register the contract as deployed.

|  |  |
| --- | --- |
|  | Although this method is very popular to deploy accounts, this works for any kind of contract. |

## Deployment validation

To be counterfactually deployed, the deploying contract must implement the `__validate_deploy__` entrypoint,
called by the protocol when a `DeployAccount` transaction is sent to the network.

```
trait IDeployable {
    /// Must return 'VALID' when the validation is successful.
    fn __validate_deploy__(
        class_hash: felt252, contract_address_salt: felt252, public_key: felt252
    ) -> felt252;
}
```

← Interfaces and Dispatchers

SNIP12 and Typed Messages →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0/guides/erc20-permit

## ERC20Permit - OpenZeppelin Docs

# ERC20Permit

The EIP-2612 standard, commonly referred to as ERC20Permit, is designed to support gasless token approvals. This is achieved with an off-chain
signature following the SNIP12 standard, rather than with an on-chain transaction. The permit function verifies the signature and sets
the spender’s allowance if the signature is valid. This approach improves user experience and reduces gas costs.

## Differences from Solidity

Although this extension is mostly similar to the Solidity implementation of EIP-2612, there are some notable differences in the parameters of the permit function:

* The `deadline` parameter is represented by `u64` rather than `u256`.
* The `signature` parameter is represented by a span of felts rather than `v`, `r`, and `s` values.

|  |  |
| --- | --- |
|  | Unlike Solidity, there is no enforced format for signatures on Starknet. A signature is represented by an array or span of felts, and there is no universal method for validating signatures of unknown formats. Consequently, a signature provided to the permit function is validated through an external `is_valid_signature` call to the contract at the `owner` address. |

## Usage

The functionality is provided as an embeddable ERC20Permit trait of the ERC20Component.

```
#[abi(embed_v0)]
impl ERC20PermitImpl = ERC20Component::ERC20PermitImpl<ContractState>;
```

A contract must meet the following requirements to be able to use the ERC20Permit trait:

* Implement ERC20Component.
* Implement NoncesComponent.
* Implement SNIP12Metadata trait (used in signature generation).

## Typed message

To safeguard against replay attacks and ensure the uniqueness of each approval via permit, the data signed includes:

* The address of the `owner`.
* The parameters specified in the approve function (`spender` and `amount`)
* The address of the `token` contract itself.
* A `nonce`, which must be unique for each operation.
* The `chain_id`, which protects against cross-chain replay attacks.

The format of the `Permit` structure in a signed permit message is as follows:

```
struct Permit {
    token: ContractAddress,
    spender: ContractAddress,
    amount: u256,
    nonce: felt252,
    deadline: u64,
}
```

|  |  |
| --- | --- |
|  | The owner of the tokens is also part of the signed message. It is used as the `signer` parameter in the `get_message_hash` call. |

Further details on preparing and signing a typed message can be found in the SNIP12 guide.

← Creating Supply

API Reference →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0/guides/erc20-supply

## Creating ERC20 Supply - OpenZeppelin Docs

# Creating ERC20 Supply

The standard interface implemented by tokens built on Starknet comes from the popular token standard on Ethereum called ERC20.
EIP20, from which ERC20 contracts are derived, does not specify how tokens are created.
This guide will go over strategies for creating both a fixed and dynamic token supply.

## Fixed Supply

Let’s say we want to create a token named `MyToken` with a fixed token supply.
We can achieve this by setting the token supply in the constructor which will execute upon deployment.

```
#[starknet::contract]
mod MyToken {
    use openzeppelin_token::erc20::{ERC20Component, ERC20HooksEmptyImpl};
    use starknet::ContractAddress;

    component!(path: ERC20Component, storage: erc20, event: ERC20Event);

    // ERC20 Mixin
    #[abi(embed_v0)]
    impl ERC20MixinImpl = ERC20Component::ERC20MixinImpl<ContractState>;
    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        erc20: ERC20Component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC20Event: ERC20Component::Event
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        fixed_supply: u256,
        recipient: ContractAddress
    ) {
        let name = "MyToken";
        let symbol = "MTK";

        self.erc20.initializer(name, symbol);
        self.erc20.mint(recipient, fixed_supply);
    }
}
```

In the constructor, we’re first calling the ERC20 initializer to set the token name and symbol.
Next, we’re calling the internal `mint` function which creates `fixed_supply` of tokens and allocates them to `recipient`.
Since the internal `mint` is not exposed in our contract, it will not be possible to create any more tokens.
In other words, we’ve implemented a fixed token supply!

## Dynamic Supply

ERC20 contracts with a dynamic supply include a mechanism for creating or destroying tokens.
Let’s make a few changes to the almighty `MyToken` contract and create a minting mechanism.

```
#[starknet::contract]
mod MyToken {
    use openzeppelin_token::erc20::{ERC20Component, ERC20HooksEmptyImpl};
    use starknet::ContractAddress;

    component!(path: ERC20Component, storage: erc20, event: ERC20Event);

   // ERC20 Mixin
    #[abi(embed_v0)]
    impl ERC20MixinImpl = ERC20Component::ERC20MixinImpl<ContractState>;
    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        erc20: ERC20Component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC20Event: ERC20Component::Event
    }

    #[constructor]
    fn constructor(ref self: ContractState) {
        let name = "MyToken";
        let symbol = "MTK";

        self.erc20.initializer(name, symbol);
    }

    #[external(v0)]
    fn mint(
        ref self: ContractState,
        recipient: ContractAddress,
        amount: u256
    ) {
        // This function is NOT protected which means
        // ANYONE can mint tokens
        self.erc20.mint(recipient, amount);
    }
}
```

The exposed `mint` above will create `amount` tokens and allocate them to `recipient`.
We now have our minting mechanism!

There is, however, a big problem.
`mint` does not include any restrictions on who can call this function.
For the sake of good practices, let’s implement a simple permissioning mechanism with `Ownable`.

```
#[starknet::contract]
mod MyToken {

    (...)

    // Integrate Ownable

    #[external(v0)]
    fn mint(
        ref self: ContractState,
        recipient: ContractAddress,
        amount: u256
    ) {
        // Set permissions with Ownable
        self.ownable.assert_only_owner();

        // Mint tokens if called by the contract owner
        self.erc20.mint(recipient, amount);
    }
}
```

In the constructor, we pass the owner address to set the owner of the `MyToken` contract.
The `mint` function includes `assert_only_owner` which will ensure that only the contract owner can call this function.
Now, we have a protected ERC20 minting mechanism to create a dynamic token supply.

|  |  |
| --- | --- |
|  | For a more thorough explanation of permission mechanisms, see Access Control. |

← ERC20

ERC20Permit →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0/guides/snip12

## SNIP12 and Typed Messages - OpenZeppelin Docs

# SNIP12 and Typed Messages

Similar to EIP712, SNIP12 is a standard for secure off-chain signature verification on Starknet.
It provides a way to hash and sign generic typed structs rather than just strings. When building decentralized
applications, usually you might need to sign a message with complex data. The purpose of signature verification
is then to ensure that the received message was indeed signed by the expected signer, and it hasn’t been tampered with.

OpenZeppelin Contracts for Cairo provides a set of utilities to make the implementation of this standard
as easy as possible, and in this guide we will walk you through the process of generating the hashes of typed messages
using these utilities for on-chain signature verification. For that, let’s build an example with a custom ERC20 contract
adding an extra `transfer_with_signature` method.

|  |  |
| --- | --- |
|  | This is an educational example, and it is not intended to be used in production environments. |

## CustomERC20

Let’s start with a basic ERC20 contract leveraging the ERC20Component, and let’s add the new function.
Note that some declarations are omitted for brevity. The full example will be available at the end of the guide.

```
#[starknet::contract]
mod CustomERC20 {
    use openzeppelin_token::erc20::{ERC20Component, ERC20HooksEmptyImpl};
    use starknet::ContractAddress;

    component!(path: ERC20Component, storage: erc20, event: ERC20Event);

    #[abi(embed_v0)]
    impl ERC20MixinImpl = ERC20Component::ERC20MixinImpl<ContractState>;
    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;

    (...)

    #[constructor]
    fn constructor(
        ref self: ContractState,
        initial_supply: u256,
        recipient: ContractAddress
    ) {
        self.erc20.initializer("MyToken", "MTK");
        self.erc20.mint(recipient, initial_supply);
    }

    #[external(v0)]
    fn transfer_with_signature(
        ref self: ContractState,
        recipient: ContractAddress,
        amount: u256,
        nonce: felt252,
        expiry: u64,
        signature: Array<felt252>
    ) {
        (...)
    }
}
```

The `transfer_with_signature` function will allow a user to transfer tokens to another account by providing a signature.
The signature will be generated off-chain, and it will be used to verify the message on-chain. Note that the message
we need to verify is a struct with the following fields:

* `recipient`: The address of the recipient.
* `amount`: The amount of tokens to transfer.
* `nonce`: A unique number to prevent replay attacks.
* `expiry`: The timestamp when the signature expires.

Note that generating the hash of this message on-chain is a requirement to verify the signature, because if we accept
the message as a parameter, it could be easily tampered with.

## Generating the Typed Message Hash

To generate the hash of the message, we need to follow these steps:

### 1. Define the message struct.

In this particular example, the message struct looks like this:

```
struct Message {
    recipient: ContractAddress,
    amount: u256,
    nonce: felt252,
    expiry: u64
}
```

### 2. Get the message type hash.

This is the `starknet_keccak(encode_type(message))` as defined in the SNIP.

In this case it can be computed as follows:

```
// Since there's no u64 type in SNIP-12, we use u128 for `expiry` in the type hash generation.
let message_type_hash = selector!(
    "\"Message\"(\"recipient\":\"ContractAddress\",\"amount\":\"u256\",\"nonce\":\"felt\",\"expiry\":\"u128\")\"u256\"(\"low\":\"u128\",\"high\":\"u128\")"
);
```

which is the same as:

```
let message_type_hash = 0x28bf13f11bba405c77ce010d2781c5903cbed100f01f72fcff1664f98343eb6;
```

|  |  |
| --- | --- |
|  | In practice it’s better to compute the type hash off-chain and hardcode it in the contract, since it is a constant value. |

### 3. Implement the `StructHash` trait for the struct.

You can import the trait from: `openzeppelin_utils::snip12::StructHash`. And this implementation
is nothing more than the encoding of the message as defined in the SNIP.

```
use core::hash::{HashStateExTrait, HashStateTrait};
use core::poseidon::PoseidonTrait;
use openzeppelin_utils::snip12::StructHash;
use starknet::ContractAddress;

const MESSAGE_TYPE_HASH: felt252 =
    0x28bf13f11bba405c77ce010d2781c5903cbed100f01f72fcff1664f98343eb6;

#[derive(Copy, Drop, Hash)]
struct Message {
    recipient: ContractAddress,
    amount: u256,
    nonce: felt252,
    expiry: u64
}

impl StructHashImpl of StructHash<Message> {
    fn hash_struct(self: @Message) -> felt252 {
        let hash_state = PoseidonTrait::new();
        hash_state.update_with(MESSAGE_TYPE_HASH).update_with(*self).finalize()
    }
}
```

### 4. Implement the `SNIP12Metadata` trait.

This implementation determines the values of the domain separator. Only the `name` and `version` fields are required
because the `chain_id` is obtained on-chain, and the `revision` is hardcoded to `1`.

```
use openzeppelin_utils::snip12::SNIP12Metadata;

impl SNIP12MetadataImpl of SNIP12Metadata {
    fn name() -> felt252 { 'DAPP_NAME' }
    fn version() -> felt252 { 'v1' }
}
```

In the above example, no storage reads are required which avoids unnecessary extra gas costs, but in
some cases we may need to read from storage to get the domain separator values. This can be accomplished even when
the trait is not bounded to the ContractState, like this:

```
use openzeppelin_utils::snip12::SNIP12Metadata;

impl SNIP12MetadataImpl of SNIP12Metadata {
    fn name() -> felt252 {
        let state = unsafe_new_contract_state();

        // Some logic to get the name from storage
        state.erc20.name().at(0).unwrap().into()
    }

    fn version() -> felt252 { 'v1' }
}
```

### 5. Generate the hash.

The final step is to use the `OffchainMessageHashImpl` implementation to generate the hash of the message
using the `get_message_hash` function. The implementation is already available as a utility.

```
use core::hash::{HashStateExTrait, HashStateTrait};
use core::poseidon::PoseidonTrait;
use openzeppelin_utils::snip12::{SNIP12Metadata, StructHash, OffchainMessageHash};
use starknet::ContractAddress;

const MESSAGE_TYPE_HASH: felt252 =
    0x28bf13f11bba405c77ce010d2781c5903cbed100f01f72fcff1664f98343eb6;

#[derive(Copy, Drop, Hash)]
struct Message {
    recipient: ContractAddress,
    amount: u256,
    nonce: felt252,
    expiry: u64
}

impl StructHashImpl of StructHash<Message> {
    fn hash_struct(self: @Message) -> felt252 {
        let hash_state = PoseidonTrait::new();
        hash_state.update_with(MESSAGE_TYPE_HASH).update_with(*self).finalize()
    }
}

impl SNIP12MetadataImpl of SNIP12Metadata {
    fn name() -> felt252 {
        'DAPP_NAME'
    }
    fn version() -> felt252 {
        'v1'
    }
}

fn get_hash(
    account: ContractAddress, recipient: ContractAddress, amount: u256, nonce: felt252, expiry: u64
) -> felt252 {
    let message = Message { recipient, amount, nonce, expiry };
    message.get_message_hash(account)
}
```

|  |  |
| --- | --- |
|  | The expected parameter for the `get_message_hash` function is the address of account that signed the message. |

## Full Implementation

Finally, the full implementation of the `CustomERC20` contract looks like this:

|  |  |
| --- | --- |
|  | We are using the `ISRC6Dispatcher` to verify the signature, and the `NoncesComponent` to handle nonces to prevent replay attacks. |

```
use core::hash::{HashStateExTrait, HashStateTrait};
use core::poseidon::PoseidonTrait;
use openzeppelin_utils::snip12::{SNIP12Metadata, StructHash, OffchainMessageHash};
use starknet::ContractAddress;

const MESSAGE_TYPE_HASH: felt252 =
    0x28bf13f11bba405c77ce010d2781c5903cbed100f01f72fcff1664f98343eb6;

#[derive(Copy, Drop, Hash)]
struct Message {
    recipient: ContractAddress,
    amount: u256,
    nonce: felt252,
    expiry: u64
}

impl StructHashImpl of StructHash<Message> {
    fn hash_struct(self: @Message) -> felt252 {
        let hash_state = PoseidonTrait::new();
        hash_state.update_with(MESSAGE_TYPE_HASH).update_with(*self).finalize()
    }
}

#[starknet::contract]
mod CustomERC20 {
    use openzeppelin_account::interface::{ISRC6Dispatcher, ISRC6DispatcherTrait};
    use openzeppelin_token::erc20::{ERC20Component, ERC20HooksEmptyImpl};
    use openzeppelin_utils::cryptography::nonces::NoncesComponent;
    use starknet::ContractAddress;

    use super::{Message, OffchainMessageHash, SNIP12Metadata};

    component!(path: ERC20Component, storage: erc20, event: ERC20Event);
    component!(path: NoncesComponent, storage: nonces, event: NoncesEvent);

    #[abi(embed_v0)]
    impl ERC20MixinImpl = ERC20Component::ERC20MixinImpl<ContractState>;
    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;

    #[abi(embed_v0)]
    impl NoncesImpl = NoncesComponent::NoncesImpl<ContractState>;
    impl NoncesInternalImpl = NoncesComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        erc20: ERC20Component::Storage,
        #[substorage(v0)]
        nonces: NoncesComponent::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC20Event: ERC20Component::Event,
        #[flat]
        NoncesEvent: NoncesComponent::Event
    }

    #[constructor]
    fn constructor(ref self: ContractState, initial_supply: u256, recipient: ContractAddress) {
        self.erc20.initializer("MyToken", "MTK");
        self.erc20.mint(recipient, initial_supply);
    }

    /// Required for hash computation.
    impl SNIP12MetadataImpl of SNIP12Metadata {
        fn name() -> felt252 {
            'CustomERC20'
        }
        fn version() -> felt252 {
            'v1'
        }
    }

    #[external(v0)]
    fn transfer_with_signature(
        ref self: ContractState,
        recipient: ContractAddress,
        amount: u256,
        nonce: felt252,
        expiry: u64,
        signature: Array<felt252>
    ) {
        assert(starknet::get_block_timestamp() <= expiry, 'Expired signature');
        let owner = starknet::get_caller_address();

        // Check and increase nonce
        self.nonces.use_checked_nonce(owner, nonce);

        // Build hash for calling `is_valid_signature`
        let message = Message { recipient, amount, nonce, expiry };
        let hash = message.get_message_hash(owner);

        let is_valid_signature_felt = ISRC6Dispatcher { contract_address: owner }
            .is_valid_signature(hash, signature);

        // Check either 'VALID' or true for backwards compatibility
        let is_valid_signature = is_valid_signature_felt == starknet::VALIDATED
            || is_valid_signature_felt == 1;
        assert(is_valid_signature, 'Invalid signature');

        // Transfer tokens
        self.erc20._transfer(owner, recipient, amount);
    }
}
```

← Counterfactual Deployments

Access →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0/guides/src5-migration

## Migrating ERC165 to SRC5 - OpenZeppelin Docs

# Migrating ERC165 to SRC5

In the smart contract ecosystem, having the ability to query if a contract supports a given interface is an extremely important feature.
The initial introspection design for Contracts for Cairo before version v0.7.0 followed Ethereum’s EIP-165.
Since the Cairo language evolved introducing native types, we needed an introspection solution tailored to the Cairo ecosystem: the SNIP-5 standard.
SNIP-5 allows interface ID calculations to use Cairo types and the Starknet keccak (`sn_keccak`) function.
For more information on the decision, see the Starknet Shamans proposal or the Dual Introspection Detection discussion.

## How to migrate

Migrating from ERC165 to SRC5 involves four major steps:

1. Integrate SRC5 into the contract.
2. Register SRC5 IDs.
3. Add a `migrate` function to apply introspection changes.
4. Upgrade the contract and call `migrate`.

The following guide will go through the steps with examples.

### Component integration

The first step is to integrate the necessary components into the new contract.
The contract should include the new introspection mechanism, SRC5Component.
It should also include the InitializableComponent which will be used in the `migrate` function.
Here’s the setup:

```
#[starknet::contract]
mod MigratingContract {
    use openzeppelin_introspection::src5::SRC5Component;
    use openzeppelin_security::initializable::InitializableComponent;

    component!(path: SRC5Component, storage: src5, event: SRC5Event);
    component!(path: InitializableComponent, storage: initializable, event: InitializableEvent);

    // SRC5
    #[abi(embed_v0)]
    impl SRC5Impl = SRC5Component::SRC5Impl<ContractState>;
    impl SRC5InternalImpl = SRC5Component::InternalImpl<ContractState>;

    // Initializable
    impl InitializableInternalImpl = InitializableComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        src5: SRC5Component::Storage,
        #[substorage(v0)]
        initializable: InitializableComponent::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        SRC5Event: SRC5Component::Event,
        #[flat]
        InitializableEvent: InitializableComponent::Event
    }
}
```

### Interface registration

To successfully migrate ERC165 to SRC5, the contract needs to register the interface IDs that the contract supports with SRC5.

For this example, let’s say that this contract supports the IERC721 and IERC721Metadata interfaces.
The contract should implement an `InternalImpl` and add a function to register those interfaces like this:

```
#[starknet::contract]
mod MigratingContract {
    use openzeppelin_token::erc721::interface::{IERC721_ID, IERC721_METADATA_ID};

    (...)

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        // Register SRC5 interfaces
        fn register_src5_interfaces(ref self: ContractState) {
            self.src5.register_interface(IERC721_ID);
            self.src5.register_interface(IERC721_METADATA_ID);
        }
    }
}
```

Since the new contract integrates `SRC5Component`, it can leverage SRC5’s register\_interface function to register the supported interfaces.

### Migration initializer

Next, the contract should define and expose a migration function that will invoke the `register_src5_interfaces` function.
Since the `migrate` function will be publicly callable, it should include some sort of Access Control so that only permitted addresses can execute the migration.
Finally, `migrate` should include a reinitialization check to ensure that it cannot be called more than once.

|  |  |
| --- | --- |
|  | If the original contract implemented `Initializable` at any point and called the `initialize` method, the `InitializableComponent` will not be usable at this time. Instead, the contract can take inspiration from `InitializableComponent` and create its own initialization mechanism. |

```
#[starknet::contract]
mod MigratingContract {
    (...)

    #[external(v0)]
    fn migrate(ref self: ContractState) {
        // WARNING: Missing Access Control mechanism. Make sure to add one

        // WARNING: If the contract ever implemented `Initializable` in the past,
        // this will not work. Make sure to create a new initialization mechanism
        self.initializable.initialize();

        // Register SRC5 interfaces
        self.register_src5_interfaces();
    }
}
```

### Execute migration

Once the new contract is prepared for migration and **rigorously tested**, all that’s left is to migrate!
Simply upgrade the contract and then call `migrate`.

← Introspection

API Reference →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0/interfaces

## Interfaces and Dispatchers - OpenZeppelin Docs

# Interfaces and Dispatchers

This section describes the interfaces OpenZeppelin Contracts for Cairo offer, and explains the design choices behind them.

Interfaces can be found in the module tree under the `interface` submodule, such as `token::erc20::interface`. For example:

```
use openzeppelin_token::erc20::interface::IERC20;
```

or

```
use openzeppelin_token::erc20::interface::ERC20ABI;
```

|  |  |
| --- | --- |
|  | For simplicity, we’ll use ERC20 as example but the same concepts apply to other modules. |

## Interface traits

The library offers three types of traits to implement or interact with contracts:

### Standard traits

These are associated with a predefined interface such as a standard.
This includes only the functions defined in the interface, and is the standard way to interact with a compliant contract.

```
#[starknet::interface]
pub trait IERC20<TState> {
    fn total_supply(self: @TState) -> u256;
    fn balance_of(self: @TState, account: ContractAddress) -> u256;
    fn allowance(self: @TState, owner: ContractAddress, spender: ContractAddress) -> u256;
    fn transfer(ref self: TState, recipient: ContractAddress, amount: u256) -> bool;
    fn transfer_from(
        ref self: TState, sender: ContractAddress, recipient: ContractAddress, amount: u256
    ) -> bool;
    fn approve(ref self: TState, spender: ContractAddress, amount: u256) -> bool;
}
```

### ABI traits

They describe a contract’s complete interface. This is useful to interface with a preset contract offered by this library, such as the ERC20 preset that includes functions from different traits such as `IERC20` and `IERC20Camel`.

|  |  |
| --- | --- |
|  | The library offers an ABI trait for most components, providing all external function signatures even when most of the time all of them don’t need to be implemented at the same time. This can be helpful when interacting with a contract implementing the component, instead of defining a new dispatcher. |

```
#[starknet::interface]
pub trait ERC20ABI<TState> {
    // IERC20
    fn total_supply(self: @TState) -> u256;
    fn balance_of(self: @TState, account: ContractAddress) -> u256;
    fn allowance(self: @TState, owner: ContractAddress, spender: ContractAddress) -> u256;
    fn transfer(ref self: TState, recipient: ContractAddress, amount: u256) -> bool;
    fn transfer_from(
        ref self: TState, sender: ContractAddress, recipient: ContractAddress, amount: u256
    ) -> bool;
    fn approve(ref self: TState, spender: ContractAddress, amount: u256) -> bool;

    // IERC20Metadata
    fn name(self: @TState) -> ByteArray;
    fn symbol(self: @TState) -> ByteArray;
    fn decimals(self: @TState) -> u8;

    // IERC20CamelOnly
    fn totalSupply(self: @TState) -> u256;
    fn balanceOf(self: @TState, account: ContractAddress) -> u256;
    fn transferFrom(
        ref self: TState, sender: ContractAddress, recipient: ContractAddress, amount: u256
    ) -> bool;
}
```

### Dispatcher traits

Traits annotated with `#[starknet::interface]` automatically generate a dispatcher that can be used to interact with contracts that implement the given interface. They can be imported by appending the `Dispatcher` and `DispatcherTrait` suffixes to the trait name, like this:

```
use openzeppelin_token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
```

Other types of dispatchers are also auto-generated from the annotated trait. See the
Interacting with another contract section of the Cairo book for more information.

|  |  |
| --- | --- |
|  | In the example, the `IERC20Dispatcher` is the one used to interact with contracts, but the `IERC20DispatcherTrait` needs to be in scope for the functions to be available. |

## Dual interfaces

|  |  |
| --- | --- |
|  | `camelCase` functions are deprecated and maintained only for Backwards Compatibility. It’s recommended to only use `snake_case` interfaces with contracts and components. The `camelCase` functions will be removed in future versions. |

Following the Great Interface Migration plan, we added `snake_case` functions to all of our preexisting `camelCase` contracts with the goal of eventually dropping support for the latter.

In short, the library offers two types of interfaces and utilities to handle them:

1. `camelCase` interfaces, which are the ones we’ve been using so far.
2. `snake_case` interfaces, which are the ones we’re migrating to.

This means that currently most of our contracts implement *dual interfaces*. For example, the ERC20 preset contract exposes `transferFrom`, `transfer_from`, `balanceOf`, `balance_of`, etc.

|  |  |
| --- | --- |
|  | Dual interfaces are available for all external functions present in previous versions of OpenZeppelin Contracts for Cairo (v0.6.1 and below). |

### `IERC20`

The default version of the ERC20 interface trait exposes `snake_case` functions:

```
#[starknet::interface]
pub trait IERC20<TState> {
    fn name(self: @TState) -> ByteArray;
    fn symbol(self: @TState) -> ByteArray;
    fn decimals(self: @TState) -> u8;
    fn total_supply(self: @TState) -> u256;
    fn balance_of(self: @TState, account: ContractAddress) -> u256;
    fn allowance(self: @TState, owner: ContractAddress, spender: ContractAddress) -> u256;
    fn transfer(ref self: TState, recipient: ContractAddress, amount: u256) -> bool;
    fn transfer_from(
        ref self: TState, sender: ContractAddress, recipient: ContractAddress, amount: u256
    ) -> bool;
    fn approve(ref self: TState, spender: ContractAddress, amount: u256) -> bool;
}
```

### `IERC20Camel`

On top of that, the library also offers a `camelCase` version of the same interface:

```
#[starknet::interface]
pub trait IERC20Camel<TState> {
    fn name(self: @TState) -> ByteArray;
    fn symbol(self: @TState) -> ByteArray;
    fn decimals(self: @TState) -> u8;
    fn totalSupply(self: @TState) -> u256;
    fn balanceOf(self: @TState, account: ContractAddress) -> u256;
    fn allowance(self: @TState, owner: ContractAddress, spender: ContractAddress) -> u256;
    fn transfer(ref self: TState, recipient: ContractAddress, amount: u256) -> bool;
    fn transferFrom(
        ref self: TState, sender: ContractAddress, recipient: ContractAddress, amount: u256
    ) -> bool;
    fn approve(ref self: TState, spender: ContractAddress, amount: u256) -> bool;
}
```

← Presets

Counterfactual Deployments →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0/introspection

## Introspection - OpenZeppelin Docs

# Introspection

To smooth interoperability, often standards require smart contracts to implement introspection mechanisms.

In Ethereum, the EIP165 standard defines how contracts should declare
their support for a given interface, and how other contracts may query this support.

Starknet offers a similar mechanism for interface introspection defined by the SRC5 standard.

## SRC5

Similar to its Ethereum counterpart, the SRC5 standard requires contracts to implement the `supports_interface` function,
which can be used by others to query if a given interface is supported.

### Usage

To expose this functionality, the contract must implement the SRC5Component, which defines the `supports_interface` function.
Here is an example contract:

```
#[starknet::contract]
mod MyContract {
    use openzeppelin_introspection::src5::SRC5Component;

    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    #[abi(embed_v0)]
    impl SRC5Impl = SRC5Component::SRC5Impl<ContractState>;
    impl SRC5InternalImpl = SRC5Component::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        src5: SRC5Component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        SRC5Event: SRC5Component::Event
    }

    #[constructor]
    fn constructor(ref self: ContractState) {
        self.src5.register_interface(selector!("some_interface"));
    }
}
```

### Interface

```
#[starknet::interface]
pub trait ISRC5 {
    /// Query if a contract implements an interface.
    /// Receives the interface identifier as specified in SRC-5.
    /// Returns `true` if the contract implements `interface_id`, `false` otherwise.
    fn supports_interface(interface_id: felt252) -> bool;
}
```

## Computing the interface ID

The interface ID, as specified in the standard, is the XOR of all the
Extended Function Selectors
of the interface. We strongly advise reading the SNIP to understand the specifics of computing these
extended function selectors. There are tools such as src5-rs that can help with this process.

## Registering interfaces

For a contract to declare its support for a given interface, we recommend using the SRC5 component to register support upon contract deployment through a constructor either directly or indirectly (as an initializer) like this:

```
#[starknet::contract]
mod MyContract {
    use openzeppelin_account::interface;
    use openzeppelin_introspection::src5::SRC5Component;

    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    #[abi(embed_v0)]
    impl SRC5Impl = SRC5Component::SRC5Impl<ContractState>;
    impl InternalImpl = SRC5Component::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        src5: SRC5Component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        SRC5Event: SRC5Component::Event
    }

    #[constructor]
    fn constructor(ref self: ContractState) {
        // Register the contract's support for the ISRC6 interface
        self.src5.register_interface(interface::ISRC6_ID);
    }

    (...)
}
```

## Querying interfaces

Use the `supports_interface` function to query a contract’s support for a given interface.

```
#[starknet::contract]
mod MyContract {
    use openzeppelin_account::interface;
    use openzeppelin_introspection::interface::ISRC5DispatcherTrait;
    use openzeppelin_introspection::interface::ISRC5Dispatcher;
    use starknet::ContractAddress;

    #[storage]
    struct Storage {}

    #[external(v0)]
    fn query_is_account(self: @ContractState, target: ContractAddress) -> bool {
        let dispatcher = ISRC5Dispatcher { contract_address: target };
        dispatcher.supports_interface(interface::ISRC6_ID)
    }
}
```

|  |  |
| --- | --- |
|  | If you are unsure whether a contract implements SRC5 or not, you can follow the process described in here. |

← API Reference

Migrating ERC165 to SRC5 →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0/macros

## Macros - OpenZeppelin Docs

# Macros

This crate provides a collection of macros that streamline and simplify development with the library.
To use them, you need to add the `openzeppelin_macros` crate as a dependency in your `Scarb.toml` file:

```
[dependencies]
openzeppelin_macros = "2.0.0"
```

## Attribute macros

* with\_components
* type\_hash

← API Reference

with\_components →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0/macros/type_hash

## <code>type_hash</code> - OpenZeppelin Docs

# `type_hash`

This macro generates a SNIP-12-compatible type hash for a given struct or enum.

|  |  |
| --- | --- |
|  | This macro is fully compatible with the SNIP-12 standard revision 1. |

## Usage

```
/// name and debug are optional arguments
#[type_hash(name: "My Struct", debug: true)]
struct MyStruct {
    #[snip12(name: "My Field")]
    my_field: felt252,
}
```

This will generate a type hash for the struct.

```
// Encoded type: "My Struct"("My Field":"felt")
pub const MY_STRUCT_TYPE_HASH: felt252 = 0x1735aa9819941b96c651b740b792a96c854565eaff089b7e293d996828b88a8;
```

And because of the `debug` argument, it will generate the following code:

```
pub fn __MY_STRUCT_encoded_type() {
    println!("\"My Struct\"(\"My Field\":\"felt\")");
}
```

## Basic types

The list of supported basic types as defined in the SNIP-12 standard is:

* felt252
* shortstring
* ClassHash
* ContractAddress
* timestamp
* selector
* merkletree
* u128
* i128

### Examples

Struct with basic types and custom names and kinds:

```
#[type_hash(name: "My Struct", debug: true)]
pub struct MyStruct {
    #[snip12(name: "Simple Felt")] // Optional custom name
    pub simple_felt: felt252,
    #[snip12(name: "Class Hash")]
    pub class_hash: ClassHash,
    #[snip12(name: "Target Token")]
    pub target: ContractAddress,
    #[snip12(name: "Timestamp", kind: "timestamp")]
    pub timestamp: u128,
    #[snip12(name: "Selector", kind: "selector")]
    pub selector: felt252,
}

// Encoded type: "My Struct"("Simple Felt":"felt","Class Hash":"ClassHash",
// "Target Token":"ContractAddress","Timestamp":"timestamp","Selector":"selector")
pub const MY_STRUCT_TYPE_HASH: felt252
    = 0x522e0c3dc5e13b0978f4645760a436b1e119fd335842523fee8fbae6057b8c;
```

Enum with basic types and custom names and kinds:

```
#[type_hash(name: "My Enum", debug: true)]
pub enum MyEnum {
    #[snip12(name: "Simple Felt")]
    SimpleFelt: felt252,
    #[snip12(name: "Class Hash")]
    ClassHash: ClassHash,
    #[snip12(name: "Target Token")]
    ContractAddress: ContractAddress,
    #[snip12(name: "Timestamp", kind: "timestamp")]
    Timestamp: u128,
    #[snip12(name: "Selector", kind: "selector")]
    Selector: felt252,
}

// Encoded type: "My Enum"("Simple Felt"("felt"),"Class Hash"("ClassHash"),
// "Target Token"("ContractAddress"),"Timestamp"("timestamp"),"Selector"("selector"))
pub const MY_ENUM_TYPE_HASH: felt252
    = 0x3f30aaa6cda9f699d4131940b10602b78b986feb88f28a19f3b48567cb4b566;
```

## Collection types

The list of supported collection types as defined in the SNIP-12 standard is:

* Array
* Tuple **(Only supported for enums)**
* Span **(Treated as an array)**

|  |  |
| --- | --- |
|  | While Span is not directly supported by the SNIP-12 standard, it is treated as an array for the purposes of this macro, since it is sometimes helpful to use `Span<felt252>` instead of `Array<felt252>` in order to save on gas. |

### Examples

Struct with collection types:

```
#[type_hash(name: "My Struct", debug: true)]
pub struct MyStruct {
    #[snip12(name: "Member 1")]
    pub member1: Array<felt252>,
    #[snip12(name: "Member 2")]
    pub member2: Span<u128>,
    #[snip12(name: "Timestamps", kind: "Array<timestamp>")]
    pub timestamps: Array<u128>,
}

// Encoded type: "My Struct"("Member 1":"felt*","Member 2":"u128*",
// "Timestamps":"timestamp*")
pub const MY_STRUCT_TYPE_HASH: felt252
    = 0x369cdec45d8c55e70986aed44da0e330375171ba6e25b58e741c0ce02fa8ac;
```

Enum with collection types:

```
#[type_hash(name: "My Enum", debug: true)]
pub enum MyEnum {
    #[snip12(name: "Member 1")]
    Member1: Array<felt252>,
    #[snip12(name: "Member 2")]
    Member2: Span<u128>,
    #[snip12(name: "Timestamps", kind: "Array<timestamp>")]
    Timestamps: Array<u128>,
    #[snip12(name: "Name and Last Name", kind: "(shortstring, shortstring)")]
    NameAndLastName: (felt252, felt252),
}

// Encoded type: "My Enum"("Member 1"("felt*"),"Member 2"("u128*"),
// "Timestamps"("timestamp*"),"Name and Last Name"("shortstring","shortstring"))
pub const MY_ENUM_TYPE_HASH: felt252
    = 0x9e3e1ebad4448a8344b3318f9cfda5df237588fd8328e1c2968635f09c735d;
```

## Preset types

The list of supported preset types as defined in the SNIP-12 standard is:

* TokenAmount
* NftId
* u256

### Examples

Struct with preset types:

```
#[type_hash(name: "My Struct", debug: true)]
pub struct MyStruct {
    #[snip12(name: "Token Amount")]
    pub token_amount: TokenAmount,
    #[snip12(name: "NFT ID")]
    pub nft_id: NftId,
    #[snip12(name: "Number")]
    pub number: u256,
}

// Encoded type: "My Struct"("Token Amount":"TokenAmount","NFT ID":"NftId","Number":"u256")"NftId"
// ("collection_address":"ContractAddress","token_id":"u256")"TokenAmount"
// ("token_address":"ContractAddress","amount":"u256")
// "u256"("low":"u128","high":"u128")
pub const MY_STRUCT_TYPE_HASH: felt252
    = 0x19f63528d68c4f44b7d9003a5a6b7793f5bb6ffc8a22bdec82b413ddf4f9412;
```

Enum with preset types:

```
#[type_hash(name: "My Enum", debug: true)]
pub enum MyEnum {
    #[snip12(name: "Token Amount")]
    TokenAmount: TokenAmount,
    #[snip12(name: "NFT ID")]
    NftId: NftId,
    #[snip12(name: "Number")]
    Number: u256,
}

// Encoded type: "My Enum"("Token Amount"("TokenAmount"),"NFT ID"("NftId"),"Number"("u256"))"NftId"
// ("collection_address":"ContractAddress","token_id":"u256")"TokenAmount"
// ("token_address":"ContractAddress","amount":"u256")
// "u256"("low":"u128","high":"u128")
pub const MY_ENUM_TYPE_HASH: felt252
    = 0x39dd19c7e5c5f89e084b78a26200b712c6ae3265f2bae774471c588858421b7;
```

## User-defined types

User-defined types are currently **NOT SUPPORTED** since the macro doesn’t have access to scope outside of the
target struct/enum. In the future it may be supported by extending the syntax to explicitly declare the custom type
definition.

← with\_components

Merkle Tree →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0/macros/with_components

## <code>with_components</code> - OpenZeppelin Docs

# `with_components`

This macro simplifies the syntax for adding a set of components to a contract. It:

* *Imports the corresponding components into the contract.*
* *Adds the corresponding `component!` macro entries.*
* *Adds the storage entries for each component to the Storage struct.*
* *Adds the event entries for each component to the Event struct, or creates the struct if it is missing.*
* *Brings the corresponding internal implementations into scope.*
* *Provides some diagnostics for each specific component to help the developer avoid common mistakes.*

|  |  |
| --- | --- |
|  | Since the macro does not expose any external implementations, developers must make sure to specify explicitly the ones required by the contract. |

## Security considerations

The macro was designed to be simple and effective while still being very hard to misuse. For this reason, the features
that it provides are limited, and things that might make the contract behave in unexpected ways must be
explicitly specified by the developer. It does not specify external implementations, so contracts won’t find
themselves in a situation where external functions are exposed without the developer’s knowledge. It brings
the internal implementations into scope so these functions are available by default, but if they are not used,
they won’t have any effect on the contract’s behavior.

## Usage

This is how a contract with multiple components looks when using the macro.

```
#[with_components(Account, SRC5, SRC9, Upgradeable)]
#[starknet::contract(account)]
mod OutsideExecutionAccountUpgradeable {
    use openzeppelin_upgrades::interface::IUpgradeable;
    use starknet::{ClassHash, ContractAddress};

    // External
    #[abi(embed_v0)]
    impl AccountMixinImpl = AccountComponent::AccountMixinImpl<ContractState>;
    #[abi(embed_v0)]
    impl OutsideExecutionV2Impl =
        SRC9Component::OutsideExecutionV2Impl<ContractState>;

    #[storage]
    struct Storage {}

    #[constructor]
    fn constructor(ref self: ContractState, public_key: felt252) {
        self.account.initializer(public_key);
        self.src9.initializer();
    }

    #[abi(embed_v0)]
    impl UpgradeableImpl of IUpgradeable<ContractState> {
        fn upgrade(ref self: ContractState, new_class_hash: ClassHash) {
            self.account.assert_only_self();
            self.upgradeable.upgrade(new_class_hash);
        }
    }
}
```

This is how the same contract looks using regular syntax.

```
#[starknet::contract(account)]
mod OutsideExecutionAccountUpgradeable {
    use openzeppelin::account::AccountComponent;
    use openzeppelin::account::extensions::SRC9Component;
    use openzeppelin::introspection::src5::SRC5Component;
    use openzeppelin::upgrades::UpgradeableComponent;
    use openzeppelin::upgrades::interface::IUpgradeable;
    use starknet::ClassHash;

    component!(path: AccountComponent, storage: account, event: AccountEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);
    component!(path: SRC9Component, storage: src9, event: SRC9Event);
    component!(path: UpgradeableComponent, storage: upgradeable, event: UpgradeableEvent);

    // External
    #[abi(embed_v0)]
    impl AccountMixinImpl = AccountComponent::AccountMixinImpl<ContractState>;
    #[abi(embed_v0)]
    impl OutsideExecutionV2Impl =
        SRC9Component::OutsideExecutionV2Impl<ContractState>;

    // Internal
    impl AccountInternalImpl = AccountComponent::InternalImpl<ContractState>;
    impl OutsideExecutionInternalImpl = SRC9Component::InternalImpl<ContractState>;
    impl UpgradeableInternalImpl = UpgradeableComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        account: AccountComponent::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage,
        #[substorage(v0)]
        src9: SRC9Component::Storage,
        #[substorage(v0)]
        upgradeable: UpgradeableComponent::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        AccountEvent: AccountComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
        #[flat]
        SRC9Event: SRC9Component::Event,
        #[flat]
        UpgradeableEvent: UpgradeableComponent::Event,
    }

    #[constructor]
    fn constructor(ref self: ContractState, public_key: felt252) {
        self.account.initializer(public_key);
        self.src9.initializer();
    }

    #[abi(embed_v0)]
    impl UpgradeableImpl of IUpgradeable<ContractState> {
        fn upgrade(ref self: ContractState, new_class_hash: ClassHash) {
            self.account.assert_only_self();
            self.upgradeable.upgrade(new_class_hash);
        }
    }
}
```

← Macros

type\_hash →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0/presets

## Presets - OpenZeppelin Docs

# Presets

Presets are ready-to-deploy contracts provided by the library. Since presets are intended to be very simple
and as generic as possible, there’s no support for custom or complex contracts such as `ERC20Pausable` or `ERC721Mintable`.

|  |  |
| --- | --- |
|  | For contract customization and combination of modules you can use Wizard for Cairo, our code-generation tool. |

## Available presets

List of available presets and their corresponding Sierra class hashes. Like Contracts for Cairo,
use of preset contracts are subject to the terms of the
MIT License.

|  |  |
| --- | --- |
|  | Class hashes were computed using cairo 2.11.4 and the `scarb --release` profile. |

|  |  |
| --- | --- |
|  | Before version 2.0.0, class hashes were computed using the `scarb --dev` profile. |

| Name | Sierra Class Hash |
| --- | --- |
| `AccountUpgradeable` | `0x79a9a12fdfa0481e8d8d46599b90226cd7247b2667358bb00636dd864002314` |
| `ERC20Upgradeable` | `0x65daa9c6005dcbccb0571ffdf530e2e263d1ff00eac2cbd66b2d0fa0871dafa` |
| `ERC721Upgradeable` | `0x6d1cd9d8c2008d36bd627e204c3e5f565d4e632de4e50b36d2388c7ba7a64ce` |
| `ERC1155Upgradeable` | `0x36d453774916578336db8f5f18257f0211011270a5c31adf3a2bd86416943b7` |
| `EthAccountUpgradeable` | `0x70177fca30a0a9025465f16f8174d4ea220f61bf44cb1beecb89459fe966285` |
| `UniversalDeployer` | `0x1b2df6d8861670d4a8ca4670433b2418d78169c2947f46dc614e69f333745c8` |
| `VestingWallet` | `0x10a786d4e5f74d68e0a500aeadbf7a81486f069c06afa242a050a1a09ac42f0` |

|  |  |
| --- | --- |
|  | starkli class-hash command can be used to compute the class hash from a Sierra artifact. |

## Usage

These preset contracts are ready-to-deploy which means they should already be declared on the Sepolia network.
Simply deploy the preset class hash and add the appropriate constructor arguments.
Deploying the ERC20Upgradeable preset with starkli, for example, will look like this:

```
starkli deploy 0x65daa9c6005dcbccb0571ffdf530e2e263d1ff00eac2cbd66b2d0fa0871dafa \
  <CONSTRUCTOR_ARGS> \
  --network="sepolia"
```

If a class hash has yet to be declared, copy/paste the preset contract code and declare it locally.
Start by setting up a project and installing the Contracts for Cairo library.
Copy the target preset contract from the presets directory and paste it in the new project’s `src/lib.cairo` like this:

```
// src/lib.cairo

#[starknet::contract]
mod ERC20Upgradeable {
    use openzeppelin_access::ownable::OwnableComponent;
    use openzeppelin_token::erc20::{ERC20Component, ERC20HooksEmptyImpl};
    use openzeppelin_upgrades::UpgradeableComponent;
    use openzeppelin_upgrades::interface::IUpgradeable;
    use starknet::{ContractAddress, ClassHash};

    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);
    component!(path: ERC20Component, storage: erc20, event: ERC20Event);
    component!(path: UpgradeableComponent, storage: upgradeable, event: UpgradeableEvent);

    // Ownable Mixin
    #[abi(embed_v0)]
    impl OwnableMixinImpl = OwnableComponent::OwnableMixinImpl<ContractState>;
    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;

    // ERC20 Mixin
    #[abi(embed_v0)]
    impl ERC20MixinImpl = ERC20Component::ERC20MixinImpl<ContractState>;
    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;

    // Upgradeable
    impl UpgradeableInternalImpl = UpgradeableComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
        #[substorage(v0)]
        erc20: ERC20Component::Storage,
        #[substorage(v0)]
        upgradeable: UpgradeableComponent::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        OwnableEvent: OwnableComponent::Event,
        #[flat]
        ERC20Event: ERC20Component::Event,
        #[flat]
        UpgradeableEvent: UpgradeableComponent::Event
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        name: ByteArray,
        symbol: ByteArray,
        fixed_supply: u256,
        recipient: ContractAddress,
        owner: ContractAddress
    ) {
        self.ownable.initializer(owner);
        self.erc20.initializer(name, symbol);
        self.erc20.mint(recipient, fixed_supply);
    }

    #[abi(embed_v0)]
    impl UpgradeableImpl of IUpgradeable<ContractState> {
        fn upgrade(ref self: ContractState, new_class_hash: ClassHash) {
            self.ownable.assert_only_owner();
            self.upgradeable.upgrade(new_class_hash);
        }
    }
}
```

Next, compile the contract.

```
scarb build
```

Finally, declare the preset.

```
starkli declare target/dev/my_project_ERC20Upgradeable.contract_class.json \
  --network="sepolia"
```

← Components

Interfaces and Dispatchers →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0/security

## Security - OpenZeppelin Docs

# Security

The following documentation provides context, reasoning, and examples of modules found under `openzeppelin_security`.

|  |  |
| --- | --- |
|  | Expect these modules to evolve. |

## Initializable

The Initializable component provides a simple mechanism that mimics
the functionality of a constructor.
More specifically, it enables logic to be performed once and only once which is useful to set up a contract’s initial state when a constructor cannot be used, for example when there are circular dependencies at construction time.

### Usage

You can use the component in your contracts like this:

```
#[starknet::contract]
mod MyInitializableContract {
    use openzeppelin_security::InitializableComponent;

    component!(path: InitializableComponent, storage: initializable, event: InitializableEvent);

    impl InternalImpl = InitializableComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        initializable: InitializableComponent::Storage,
        param: felt252
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        InitializableEvent: InitializableComponent::Event
    }

    fn initializer(ref self: ContractState, some_param: felt252) {
        // Makes the method callable only once
        self.initializable.initialize();

        // Initialization logic
        self.param.write(some_param);
    }
}
```

|  |  |
| --- | --- |
|  | This Initializable pattern should only be used in one function. |

### Interface

The component provides the following external functions as part of the `InitializableImpl` implementation:

```
#[starknet::interface]
pub trait InitializableABI {
    fn is_initialized() -> bool;
}
```

## Pausable

The Pausable component allows contracts to implement an emergency stop mechanism.
This can be useful for scenarios such as preventing trades until the end of an evaluation period or having an emergency switch to freeze all transactions in the event of a large bug.

To become pausable, the contract should include `pause` and `unpause` functions (which should be protected).
For methods that should be available only when paused or not, insert calls to `assert_paused` and `assert_not_paused`
respectively.

### Usage

For example (using the Ownable component for access control):

```
#[starknet::contract]
mod MyPausableContract {
    use openzeppelin_access::ownable::OwnableComponent;
    use openzeppelin_security::PausableComponent;
    use starknet::ContractAddress;

    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);
    component!(path: PausableComponent, storage: pausable, event: PausableEvent);

    // Ownable Mixin
    #[abi(embed_v0)]
    impl OwnableMixinImpl = OwnableComponent::OwnableMixinImpl<ContractState>;
    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;

    // Pausable
    #[abi(embed_v0)]
    impl PausableImpl = PausableComponent::PausableImpl<ContractState>;
    impl PausableInternalImpl = PausableComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
        #[substorage(v0)]
        pausable: PausableComponent::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        OwnableEvent: OwnableComponent::Event,
        #[flat]
        PausableEvent: PausableComponent::Event
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress) {
        self.ownable.initializer(owner);
    }

    #[external(v0)]
    fn pause(ref self: ContractState) {
        self.ownable.assert_only_owner();
        self.pausable.pause();
    }

    #[external(v0)]
    fn unpause(ref self: ContractState) {
        self.ownable.assert_only_owner();
        self.pausable.unpause();
    }

    #[external(v0)]
    fn when_not_paused(ref self: ContractState) {
        self.pausable.assert_not_paused();
        // Do something
    }

    #[external(v0)]
    fn when_paused(ref self: ContractState) {
        self.pausable.assert_paused();
        // Do something
    }
}
```

### Interface

The component provides the following external functions as part of the `PausableImpl` implementation:

```
#[starknet::interface]
pub trait PausableABI {
    fn is_paused() -> bool;
}
```

## Reentrancy Guard

A reentrancy attack occurs when the caller is able to obtain more resources than allowed by recursively calling a target’s function.

### Usage

Since Cairo does not support modifiers like Solidity, the ReentrancyGuard
component exposes two methods `start` and `end` to protect functions against reentrancy attacks.
The protected function must call `start` before the first function statement, and `end` before the return statement, as shown below:

```
#[starknet::contract]
mod MyReentrancyContract {
    use openzeppelin_security::ReentrancyGuardComponent;

    component!(
        path: ReentrancyGuardComponent, storage: reentrancy_guard, event: ReentrancyGuardEvent
    );

    impl InternalImpl = ReentrancyGuardComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        reentrancy_guard: ReentrancyGuardComponent::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ReentrancyGuardEvent: ReentrancyGuardComponent::Event
    }

    #[external(v0)]
    fn protected_function(ref self: ContractState) {
        self.reentrancy_guard.start();

        // Do something

        self.reentrancy_guard.end();
    }

    #[external(v0)]
    fn another_protected_function(ref self: ContractState) {
        self.reentrancy_guard.start();

        // Do something

        self.reentrancy_guard.end();
    }
}
```

|  |  |
| --- | --- |
|  | The guard prevents the execution flow occurring inside `protected_function` to call itself or `another_protected_function`, and vice versa. |

← Merkle Tree

API Reference →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0/udc

## Universal Deployer Contract - OpenZeppelin Docs

# Universal Deployer Contract

The Universal Deployer Contract (UDC) is a singleton smart contract that wraps the deploy syscall to expose it to any contract that doesn’t implement it, such as account contracts. You can think of it as a standardized generic factory for Starknet contracts.

Since Starknet has no deployment transaction type, it offers a standardized way to deploy smart contracts by following the Standard Deployer Interface and emitting a ContractDeployed event.

For details on the motivation and the decision making process, see the Universal Deployer Contract proposal.

## UDC contract address

The UDC is deployed at address `0x02ceed65a4bd731034c01113685c831b01c15d7d432f71afb1cf1634b53a2125` on Starknet sepolia and mainnet.

## Interface

```
#[starknet::interface]
pub trait IUniversalDeployer {
    fn deploy_contract(
        class_hash: ClassHash,
        salt: felt252,
        not_from_zero: bool,
        calldata: Span<felt252>
    ) -> ContractAddress;
}
```

## Deploying a contract with the UDC

First, declare the target contract (if it’s not already declared).
Next, call the UDC’s `deploy_contract` method.
Here’s an implementation example in Cairo:

```
use openzeppelin_utils::interfaces::{IUniversalDeployerDispatcher, IUniversalDeployerDispatcherTrait};

const UDC_ADDRESS: felt252 = 0x04...;

fn deploy() -> ContractAddress {
    let dispatcher = IUniversalDeployerDispatcher {
        contract_address: UDC_ADDRESS.try_into().unwrap()
    };

    // Deployment parameters
    let class_hash = class_hash_const::<
       0x5c478ee27f2112411f86f207605b2e2c58cdb647bac0df27f660ef2252359c6
    >();
    let salt = 1234567879;
    let not_from_zero = true;
    let calldata = array![];

    // The UDC returns the deployed contract address
    dispatcher.deploy_contract(class_hash, salt, not_from_zero, calldata.span())
}
```

## Deployment types

The Universal Deployer Contract offers two types of addresses to deploy: origin-dependent and origin-independent.
As the names suggest, the origin-dependent type includes the deployer’s address in the address calculation,
whereas, the origin-independent type does not.
The `not_from_zero` boolean parameter ultimately determines the type of deployment.

|  |  |
| --- | --- |
|  | When deploying a contract that uses `get_caller_address` in the constructor calldata, remember that the UDC, not the account, deploys that contract. Therefore, querying `get_caller_address` in a contract’s constructor returns the UDC’s address, *not the account’s address*. |

### Origin-dependent

By making deployments dependent upon the origin address, users can reserve a whole address space to prevent someone else from taking ownership of the address.

Only the owner of the origin address can deploy to those addresses.

Achieving this type of deployment necessitates that the origin sets `not_from_zero` to `true` in the deploy\_contract call.
Under the hood, the function passes a modified salt to the `deploy_syscall`, which is the hash of the origin’s address with the given salt.

To deploy a unique contract address pass:

```
let deployed_addr = udc.deploy_contract(class_hash, salt, true, calldata.span());
```

### Origin-independent

Origin-independent contract deployments create contract addresses independent of the deployer and the UDC instance.
Instead, only the class hash, salt, and constructor arguments determine the address.
This type of deployment enables redeployments of accounts and known systems across multiple networks.
To deploy a reproducible deployment, set `not_from_zero` to `false`.

```
let deployed_addr = udc.deploy_contract(class_hash, salt, false, calldata.span());
```

## Version changes

|  |  |
| --- | --- |
|  | See the previous Universal Deployer API for the initial spec. |

The latest iteration of the UDC includes some notable changes to the API which include:

* `deployContract` method is replaced with the snake\_case deploy\_contract.
* `unique` parameter is replaced with `not_from_zero` in both the `deploy_contract` method and ContractDeployed event.

## Precomputing contract addresses

This library offers utility functions written in Cairo to precompute contract addresses.
They include the generic calculate\_contract\_address\_from\_deploy\_syscall as well as the UDC-specific calculate\_contract\_address\_from\_udc.
Check out the deployments for more information.

← Common

UDC Appchain Deployment →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0/upgrades

## Upgrades - OpenZeppelin Docs

# Upgrades

In different blockchains, multiple patterns have been developed for making a contract upgradeable including the widely adopted proxy patterns.

Starknet has native upgradeability through a syscall that updates the contract source code, removing the need for proxies.

|  |  |
| --- | --- |
|  | Make sure you follow our security recommendations before upgrading. |

## Replacing contract classes

To better comprehend how upgradeability works in Starknet, it’s important to understand the difference between a contract and its contract class.

Contract Classes represent the source code of a program. All contracts are associated to a class, and many contracts can be instances of the same one. Classes are usually represented by a class hash, and before a contract of a class can be deployed, the class hash needs to be declared.

### `replace_class_syscall`

The `replace_class` syscall allows a contract to update its source code by replacing its class hash once deployed.

```
/// Upgrades the contract source code to the new contract class.
fn upgrade(new_class_hash: ClassHash) {
    assert(!new_class_hash.is_zero(), 'Class hash cannot be zero');
    starknet::replace_class_syscall(new_class_hash).unwrap_syscall();
}
```

|  |  |
| --- | --- |
|  | If a contract is deployed without this mechanism, its class hash can still be replaced through library calls. |

## `Upgradeable` component

OpenZeppelin Contracts for Cairo provides Upgradeable to add upgradeability support to your contracts.

### Usage

Upgrades are often very sensitive operations, and some form of access control is usually required to
avoid unauthorized upgrades. The Ownable module is used in this example.

|  |  |
| --- | --- |
|  | We will be using the following module to implement the IUpgradeable interface described in the API Reference section. |

```
#[starknet::contract]
mod UpgradeableContract {
    use openzeppelin_access::ownable::OwnableComponent;
    use openzeppelin_upgrades::UpgradeableComponent;
    use openzeppelin_upgrades::interface::IUpgradeable;
    use starknet::ClassHash;
    use starknet::ContractAddress;

    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);
    component!(path: UpgradeableComponent, storage: upgradeable, event: UpgradeableEvent);

    // Ownable Mixin
    #[abi(embed_v0)]
    impl OwnableMixinImpl = OwnableComponent::OwnableMixinImpl<ContractState>;
    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;

    // Upgradeable
    impl UpgradeableInternalImpl = UpgradeableComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
        #[substorage(v0)]
        upgradeable: UpgradeableComponent::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        OwnableEvent: OwnableComponent::Event,
        #[flat]
        UpgradeableEvent: UpgradeableComponent::Event
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress) {
        self.ownable.initializer(owner);
    }

    #[abi(embed_v0)]
    impl UpgradeableImpl of IUpgradeable<ContractState> {
        fn upgrade(ref self: ContractState, new_class_hash: ClassHash) {
            // This function can only be called by the owner
            self.ownable.assert_only_owner();

            // Replace the class hash upgrading the contract
            self.upgradeable.upgrade(new_class_hash);
        }
    }
}
```

## Security

Upgrades can be very sensitive operations, and security should always be top of mind while performing one. Please make sure you thoroughly review the changes and their consequences before upgrading. Some aspects to consider are:

* API changes that might affect integration. For example, changing an external function’s arguments might break existing contracts or offchain systems calling your contract.
* Storage changes that might result in lost data (e.g. changing a storage slot name, making existing storage inaccessible).
* Collisions (e.g. mistakenly reusing the same storage slot from another component) are also possible, although less likely if best practices are followed, for example prepending storage variables with the component’s name (e.g. `ERC20_balances`).
* Always check for backwards compatibility before upgrading between versions of OpenZeppelin Contracts.

## Proxies in Starknet

Proxies enable different patterns such as upgrades and clones. But since Starknet achieves the same in different ways is that there’s no support to implement them.

In the case of contract upgrades, it is achieved by simply changing the contract’s class hash. As of clones, contracts already are like clones of the class they implement.

Implementing a proxy pattern in Starknet has an important limitation: there is no fallback mechanism to be used
for redirecting every potential function call to the implementation. This means that a generic proxy contract
can’t be implemented. Instead, a limited proxy contract can implement specific functions that forward
their execution to another contract class.
This can still be useful for example to upgrade the logic of some functions.

← API Reference

API Reference →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0/wizard

## Wizard for Cairo - OpenZeppelin Docs

# Wizard for Cairo

Not sure where to start? Use the interactive generator below to bootstrap your
contract and learn about the components offered in OpenZeppelin Contracts for Cairo.

|  |  |
| --- | --- |
|  | We strongly recommend checking the Components section to understand how to extend from our library. |

← Overview

Components →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0-alpha.1/

## Contracts for Cairo - OpenZeppelin Docs

You are not reading the current version of this documentation. 2.0.0 is the current version.

# Contracts for Cairo

**A library for secure smart contract development** written in Cairo for Starknet. This library consists of a set of reusable components to build custom smart contracts, as well as
ready-to-deploy presets. You can also find other utilities including interfaces and dispatchers and test utilities
that facilitate testing with Starknet Foundry.

|  |  |
| --- | --- |
|  | This repo contains highly experimental code. Expect rapid iteration. **Use at your own risk.** |

|  |  |
| --- | --- |
|  | You can track our roadmap and future milestones in our Github Project. |

## Installation

The library is available as a Scarb package. Follow this guide for installing Cairo and Scarb on your machine
before proceeding, and run the following command to check that the installation was successful:

```
$ scarb --version

scarb 2.9.4 (d3be9ebe1 2025-02-19)
cairo: 2.9.4 (https://crates.io/crates/cairo-lang-compiler/2.9.4)
sierra: 1.6.0
```

### Set up your project

Create an empty directory, and `cd` into it:

```
mkdir my_project/ && cd my_project/
```

Initialize a new Scarb project:

```
scarb init
```

The contents of `my_project/` should now look like this:

```
$ ls

Scarb.toml src
```

### Install the library

Install the library by declaring it as a dependency in the project’s `Scarb.toml` file:

```
[dependencies]
openzeppelin = "2.0.0-alpha.1"
```

The previous example would import the entire library. We can also add each package as a separate dependency to
improve the building time by not including modules that won’t be used:

```
[dependencies]
openzeppelin_access = "2.0.0-alpha.1"
openzeppelin_token = "2.0.0-alpha.1"
```

## Basic usage

This is how it looks to build an ERC20 contract using the ERC20 component.
Copy the code into `src/lib.cairo`.

```
#[starknet::contract]
mod MyERC20Token {
    // NOTE: If you added the entire library as a dependency,
    // use `openzeppelin::token` instead.
    use openzeppelin_token::erc20::{ERC20Component, ERC20HooksEmptyImpl, DefaultConfig};
    use starknet::ContractAddress;

    component!(path: ERC20Component, storage: erc20, event: ERC20Event);

    // ERC20 Mixin
    #[abi(embed_v0)]
    impl ERC20MixinImpl = ERC20Component::ERC20MixinImpl<ContractState>;
    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        erc20: ERC20Component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC20Event: ERC20Component::Event
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        name: ByteArray,
        symbol: ByteArray,
        fixed_supply: u256,
        recipient: ContractAddress
    ) {
        self.erc20.initializer(name, symbol);
        self.erc20.mint(recipient, fixed_supply);
    }
}
```

You can now compile it:

```
scarb build
```

Wizard →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0-alpha.1/access

## Access - OpenZeppelin Docs

You are not reading the current version of this documentation. 2.0.0 is the current version.

# Access

Access control—​that is, "who is allowed to do this thing"—is incredibly important in the world of smart contracts.
The access control of your contract may govern who can mint tokens, vote on proposals, freeze transfers, and many other things.
It is therefore critical to understand how you implement it, lest someone else
steals your whole system.

## Ownership and `Ownable`

The most common and basic form of access control is the concept of ownership: there’s an account that is the `owner`
of a contract and can do administrative tasks on it.
This approach is perfectly reasonable for contracts that have a single administrative user.

OpenZeppelin Contracts for Cairo provides OwnableComponent for implementing ownership in your contracts.

### Usage

Integrating this component into a contract first requires assigning an owner.
The implementing contract’s constructor should set the initial owner by passing the owner’s address to Ownable’s
`initializer` like this:

```
#[starknet::contract]
mod MyContract {
    use openzeppelin_access::ownable::OwnableComponent;
    use starknet::ContractAddress;

    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);

    // Ownable Mixin
    #[abi(embed_v0)]
    impl OwnableMixinImpl = OwnableComponent::OwnableMixinImpl<ContractState>;
    impl InternalImpl = OwnableComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        ownable: OwnableComponent::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        OwnableEvent: OwnableComponent::Event
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress) {
        // Set the initial owner of the contract
        self.ownable.initializer(owner);
    }

    (...)
}
```

To restrict a function’s access to the owner only, add in the `assert_only_owner` method:

```
#[starknet::contract]
mod MyContract {
    (...)

    #[external(v0)]
    fn only_owner_allowed(ref self: ContractState) {
        // This function can only be called by the owner
        self.ownable.assert_only_owner();

        (...)
    }
}
```

### Interface

This is the full interface of the `OwnableMixinImpl` implementation:

```
#[starknet::interface]
pub trait OwnableABI {
    // IOwnable
    fn owner() -> ContractAddress;
    fn transfer_ownership(new_owner: ContractAddress);
    fn renounce_ownership();

    // IOwnableCamelOnly
    fn transferOwnership(newOwner: ContractAddress);
    fn renounceOwnership();
}
```

Ownable also lets you:

* `transfer_ownership` from the owner account to a new one, and
* `renounce_ownership` for the owner to relinquish this administrative privilege, a common pattern
  after an initial stage with centralized administration is over.

|  |  |
| --- | --- |
|  | Removing the owner altogether will mean that administrative tasks that are protected by `assert_only_owner` will no longer be callable! |

### Two step transfer

The component also offers a more robust way of transferring ownership via the
OwnableTwoStepImpl implementation. A two step transfer mechanism helps
to prevent unintended and irreversible owner transfers. Simply replace the `OwnableMixinImpl`
with its respective two step variant:

```
#[abi(embed_v0)]
impl OwnableTwoStepMixinImpl = OwnableComponent::OwnableTwoStepMixinImpl<ContractState>;
```

#### Interface

This is the full interface of the two step `OwnableTwoStepMixinImpl` implementation:

```
#[starknet::interface]
pub trait OwnableTwoStepABI {
    // IOwnableTwoStep
    fn owner() -> ContractAddress;
    fn pending_owner() -> ContractAddress;
    fn accept_ownership();
    fn transfer_ownership(new_owner: ContractAddress);
    fn renounce_ownership();

    // IOwnableTwoStepCamelOnly
    fn pendingOwner() -> ContractAddress;
    fn acceptOwnership();
    fn transferOwnership(newOwner: ContractAddress);
    fn renounceOwnership();
}
```

## Role-Based `AccessControl`

While the simplicity of ownership can be useful for simple systems or quick prototyping, different levels of
authorization are often needed. You may want for an account to have permission to ban users from a system, but not
create new tokens. Role-Based Access Control (RBAC) offers
flexibility in this regard.

In essence, we will be defining multiple roles, each allowed to perform different sets of actions.
An account may have, for example, 'moderator', 'minter' or 'admin' roles, which you will then check for
instead of simply using `assert_only_owner`. This check can be enforced through `assert_only_role`.
Separately, you will be able to define rules for how accounts can be granted a role, have it revoked, and more.

Most software uses access control systems that are role-based: some users are regular users, some may be supervisors
or managers, and a few will often have administrative privileges.

### Usage

For each role that you want to define, you will create a new *role identifier* that is used to grant, revoke, and
check if an account has that role. See Creating role identifiers for information
on creating identifiers.

Here’s a simple example of implementing AccessControl on a portion of an ERC20 token contract which defines
and sets a 'minter' role:

```
const MINTER_ROLE: felt252 = selector!("MINTER_ROLE");

#[starknet::contract]
mod MyContract {
    use openzeppelin_access::accesscontrol::AccessControlComponent;
    use openzeppelin_introspection::src5::SRC5Component;
    use openzeppelin_token::erc20::{ERC20Component, ERC20HooksEmptyImpl, DefaultConfig};
    use starknet::ContractAddress;
    use super::MINTER_ROLE;

    component!(path: AccessControlComponent, storage: accesscontrol, event: AccessControlEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);
    component!(path: ERC20Component, storage: erc20, event: ERC20Event);

    // AccessControl
    #[abi(embed_v0)]
    impl AccessControlImpl =
        AccessControlComponent::AccessControlImpl<ContractState>;
    impl AccessControlInternalImpl = AccessControlComponent::InternalImpl<ContractState>;

    // SRC5
    #[abi(embed_v0)]
    impl SRC5Impl = SRC5Component::SRC5Impl<ContractState>;

    // ERC20
    #[abi(embed_v0)]
    impl ERC20Impl = ERC20Component::ERC20Impl<ContractState>;
    #[abi(embed_v0)]
    impl ERC20MetadataImpl = ERC20Component::ERC20MetadataImpl<ContractState>;
    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        accesscontrol: AccessControlComponent::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage,
        #[substorage(v0)]
        erc20: ERC20Component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        AccessControlEvent: AccessControlComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
        #[flat]
        ERC20Event: ERC20Component::Event
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        name: ByteArray,
        symbol: ByteArray,
        initial_supply: u256,
        recipient: ContractAddress,
        minter: ContractAddress
    ) {
        // ERC20-related initialization
        self.erc20.initializer(name, symbol);
        self.erc20.mint(recipient, initial_supply);

        // AccessControl-related initialization
        self.accesscontrol.initializer();
        self.accesscontrol._grant_role(MINTER_ROLE, minter);
    }

    /// This function can only be called by a minter.
    #[external(v0)]
    fn mint(ref self: ContractState, recipient: ContractAddress, amount: u256) {
        self.accesscontrol.assert_only_role(MINTER_ROLE);
        self.erc20.mint(recipient, amount);
    }
}
```

|  |  |
| --- | --- |
|  | Make sure you fully understand how AccessControl works before using it on your system, or copy-pasting the examples from this guide. |

While clear and explicit, this isn’t anything we wouldn’t have been able to achieve with
Ownable. Where AccessControl shines the most is in scenarios where granular
permissions are required, which can be implemented by defining *multiple* roles.

Let’s augment our ERC20 token example by also defining a 'burner' role, which lets accounts destroy tokens:

```
const MINTER_ROLE: felt252 = selector!("MINTER_ROLE");
const BURNER_ROLE: felt252 = selector!("BURNER_ROLE");

#[starknet::contract]
mod MyContract {
    use openzeppelin_access::accesscontrol::AccessControlComponent;
    use openzeppelin_introspection::src5::SRC5Component;
    use openzeppelin_token::erc20::{ERC20Component, ERC20HooksEmptyImpl, DefaultConfig};
    use starknet::ContractAddress;
    use super::{MINTER_ROLE, BURNER_ROLE};

    component!(path: AccessControlComponent, storage: accesscontrol, event: AccessControlEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);
    component!(path: ERC20Component, storage: erc20, event: ERC20Event);

    // AccessControl
    #[abi(embed_v0)]
    impl AccessControlImpl =
        AccessControlComponent::AccessControlImpl<ContractState>;
    impl AccessControlInternalImpl = AccessControlComponent::InternalImpl<ContractState>;

    // SRC5
    #[abi(embed_v0)]
    impl SRC5Impl = SRC5Component::SRC5Impl<ContractState>;

    // ERC20
    #[abi(embed_v0)]
    impl ERC20Impl = ERC20Component::ERC20Impl<ContractState>;
    #[abi(embed_v0)]
    impl ERC20MetadataImpl = ERC20Component::ERC20MetadataImpl<ContractState>;
    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        accesscontrol: AccessControlComponent::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage,
        #[substorage(v0)]
        erc20: ERC20Component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        AccessControlEvent: AccessControlComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
        #[flat]
        ERC20Event: ERC20Component::Event
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        name: ByteArray,
        symbol: ByteArray,
        initial_supply: u256,
        recipient: ContractAddress,
        minter: ContractAddress,
        burner: ContractAddress
    ) {
        // ERC20-related initialization
        self.erc20.initializer(name, symbol);
        self.erc20.mint(recipient, initial_supply);

        // AccessControl-related initialization
        self.accesscontrol.initializer();
        self.accesscontrol._grant_role(MINTER_ROLE, minter);
        self.accesscontrol._grant_role(BURNER_ROLE, burner);
    }

    /// This function can only be called by a minter.
    #[external(v0)]
    fn mint(ref self: ContractState, recipient: ContractAddress, amount: u256) {
        self.accesscontrol.assert_only_role(MINTER_ROLE);
        self.erc20.mint(recipient, amount);
    }

    /// This function can only be called by a burner.
    #[external(v0)]
    fn burn(ref self: ContractState, account: ContractAddress, amount: u256) {
        self.accesscontrol.assert_only_role(BURNER_ROLE);
        self.erc20.burn(account, amount);
    }
}
```

So clean!
By splitting concerns this way, more granular levels of permission may be implemented than were possible with the
simpler ownership approach to access control. Limiting what each component of a system is able to do is known
as the principle of least privilege, and is a good
security practice. Note that each account may still have more than one role, if so desired.

### Granting and revoking roles

The ERC20 token example above uses `_grant_role`,
an `internal` function that is useful when programmatically assigning
roles (such as during construction). But what if we later want to grant the 'minter' role to additional accounts?

By default, **accounts with a role cannot grant it or revoke it from other accounts**: all having a role does is making
the `assert_only_role` check pass. To grant and revoke roles dynamically, you will need help from the role’s *admin*.

Every role has an associated admin role, which grants permission to call the
`grant_role` and
`revoke_role` functions.
A role can be granted or revoked by using these if the calling account has the corresponding admin role.
Multiple roles may have the same admin role to make management easier.
A role’s admin can even be the same role itself, which would cause accounts with that role to be able
to also grant and revoke it.

This mechanism can be used to create complex permissioning structures resembling organizational charts, but it also
provides an easy way to manage simpler applications. `AccessControl` includes a special role with the role identifier
of `0`, called `DEFAULT_ADMIN_ROLE`, which acts as the **default admin role for all roles**.
An account with this role will be able to manage any other role, unless
`set_role_admin` is used to select a new admin role.

Let’s take a look at the ERC20 token example, this time taking advantage of the default admin role:

```
const MINTER_ROLE: felt252 = selector!("MINTER_ROLE");
const BURNER_ROLE: felt252 = selector!("BURNER_ROLE");

#[starknet::contract]
mod MyContract {
    use openzeppelin_access::accesscontrol::AccessControlComponent;
    use openzeppelin_access::accesscontrol::DEFAULT_ADMIN_ROLE;
    use openzeppelin_introspection::src5::SRC5Component;
    use openzeppelin_token::erc20::{ERC20Component, ERC20HooksEmptyImpl, DefaultConfig};
    use starknet::ContractAddress;
    use super::{MINTER_ROLE, BURNER_ROLE};

    component!(path: AccessControlComponent, storage: accesscontrol, event: AccessControlEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);
    component!(path: ERC20Component, storage: erc20, event: ERC20Event);

    // AccessControl
    #[abi(embed_v0)]
    impl AccessControlImpl =
        AccessControlComponent::AccessControlImpl<ContractState>;
    impl AccessControlInternalImpl = AccessControlComponent::InternalImpl<ContractState>;

    // SRC5
    #[abi(embed_v0)]
    impl SRC5Impl = SRC5Component::SRC5Impl<ContractState>;

    // ERC20
    #[abi(embed_v0)]
    impl ERC20Impl = ERC20Component::ERC20Impl<ContractState>;
    #[abi(embed_v0)]
    impl ERC20MetadataImpl = ERC20Component::ERC20MetadataImpl<ContractState>;
    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;

    (...)

    #[constructor]
    fn constructor(
        ref self: ContractState,
        name: ByteArray,
        symbol: ByteArray,
        initial_supply: u256,
        recipient: ContractAddress,
        admin: ContractAddress
    ) {
        // ERC20-related initialization
        self.erc20.initializer(name, symbol);
        self.erc20.mint(recipient, initial_supply);

        // AccessControl-related initialization
        self.accesscontrol.initializer();
        self.accesscontrol._grant_role(DEFAULT_ADMIN_ROLE, admin);
    }

    /// This function can only be called by a minter.
    #[external(v0)]
    fn mint(ref self: ContractState, recipient: ContractAddress, amount: u256) {
        self.accesscontrol.assert_only_role(MINTER_ROLE);
        self.erc20.mint(recipient, amount);
    }

    /// This function can only be called by a burner.
    #[external(v0)]
    fn burn(ref self: ContractState, account: ContractAddress, amount: u256) {
        self.accesscontrol.assert_only_role(BURNER_ROLE);
        self.erc20.burn(account, amount);
    }
}
```

|  |  |
| --- | --- |
|  | The `grant_role` and `revoke_role` functions are automatically exposed as `external` functions from the `AccessControlImpl` by leveraging the `#[abi(embed_v0)]` annotation. |

Note that, unlike the previous examples, no accounts are granted the 'minter' or 'burner' roles.
However, because those roles' admin role is the default admin role, and that role was granted to the 'admin', that
same account can call `grant_role` to give minting or burning permission, and `revoke_role` to remove it.

Dynamic role allocation is often a desirable property, for example in systems where trust in a participant may vary
over time. It can also be used to support use cases such as KYC,
where the list of role-bearers may not be known up-front, or may be prohibitively expensive to include in a single transaction.

### Creating role identifiers

In the Solidity implementation of AccessControl, contracts generally refer to the
keccak256 hash
of a role as the role identifier.

For example:

```
bytes32 public constant SOME_ROLE = keccak256("SOME_ROLE")
```

These identifiers take up 32 bytes (256 bits).

Cairo field elements (`felt252`) store a maximum of 252 bits.
With this discrepancy, this library maintains an agnostic stance on how contracts should create identifiers.
Some ideas to consider:

* Use sn\_keccak instead.
* Use Cairo friendly hashing algorithms like Poseidon, which are implemented in the
  Cairo corelib.

|  |  |
| --- | --- |
|  | The `selector!` macro can be used to compute sn\_keccak in Cairo. |

### Interface

This is the full interface of the `AccessControlMixinImpl` implementation:

```
#[starknet::interface]
pub trait AccessControlABI {
    // IAccessControl
    fn has_role(role: felt252, account: ContractAddress) -> bool;
    fn get_role_admin(role: felt252) -> felt252;
    fn grant_role(role: felt252, account: ContractAddress);
    fn revoke_role(role: felt252, account: ContractAddress);
    fn renounce_role(role: felt252, account: ContractAddress);

    // IAccessControlCamel
    fn hasRole(role: felt252, account: ContractAddress) -> bool;
    fn getRoleAdmin(role: felt252) -> felt252;
    fn grantRole(role: felt252, account: ContractAddress);
    fn revokeRole(role: felt252, account: ContractAddress);
    fn renounceRole(role: felt252, account: ContractAddress);

    // ISRC5
    fn supports_interface(interface_id: felt252) -> bool;
}
```

`AccessControl` also lets you `renounce_role` from the calling account.
The method expects an account as input as an extra security measure, to ensure you are
not renouncing a role from an unintended account.

← SNIP12 and Typed Messages

API Reference →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0-alpha.1/accounts

## Accounts - OpenZeppelin Docs

You are not reading the current version of this documentation. 2.0.0 is the current version.

# Accounts

Unlike Ethereum where accounts are derived from a private key, all Starknet accounts are contracts. This means there’s no Externally Owned Account (EOA)
concept on Starknet.

Instead, the network features native account abstraction and signature validation happens at the contract level.

For a general overview of account abstraction, see
Starknet’s documentation.
A more detailed discussion on the topic can be found in
Starknet Shaman’s forum.

|  |  |
| --- | --- |
|  | For detailed information on the usage and implementation check the API Reference section. |

## What is an account?

Accounts in Starknet are smart contracts, and so they can be deployed and interacted
with like any other contract, and can be extended to implement any custom logic. However, an account is a special type
of contract that is used to validate and execute transactions. For this reason, it must implement a set of entrypoints
that the protocol uses for this execution flow. The SNIP-6 proposal defines a standard interface for accounts,
supporting this execution flow and interoperability with DApps in the ecosystem.

### ISRC6 Interface

```
/// Represents a call to a target contract function.
struct Call {
    to: ContractAddress,
    selector: felt252,
    calldata: Span<felt252>
}

/// Standard Account Interface
#[starknet::interface]
pub trait ISRC6 {
    /// Executes a transaction through the account.
    fn __execute__(calls: Array<Call>);

    /// Asserts whether the transaction is valid to be executed.
    fn __validate__(calls: Array<Call>) -> felt252;

    /// Asserts whether a given signature for a given hash is valid.
    fn is_valid_signature(hash: felt252, signature: Array<felt252>) -> felt252;
}
```

|  |  |
| --- | --- |
|  | The `calldata` member of the `Call` struct in the accounts has been updated to `Span<felt252>` for optimization purposes, but the interface ID remains the same for backwards compatibility. This inconsistency will be fixed in future releases. |

SNIP-6 adds the `is_valid_signature` method. This method is not used by the protocol, but it’s useful for
DApps to verify the validity of signatures, supporting features like Sign In with Starknet.

SNIP-6 also defines that compliant accounts must implement the SRC5 interface following SNIP-5, as
a mechanism for detecting whether a contract is an account or not through introspection.

### ISRC5 Interface

```
/// Standard Interface Detection
#[starknet::interface]
pub trait ISRC5 {
    /// Queries if a contract implements a given interface.
    fn supports_interface(interface_id: felt252) -> bool;
}
```

SNIP-6 compliant accounts must return `true` when queried for the ISRC6 interface ID.

Even though these interfaces are not enforced by the protocol, it’s recommended to implement them for enabling
interoperability with the ecosystem.

### Protocol-level methods

The Starknet protocol uses a few entrypoints for abstracting the accounts. We already mentioned the first two
as part of the ISRC6 interface, and both are required for enabling accounts to be used for executing transactions. The rest are optional:

1. `__validate__` verifies the validity of the transaction to be executed. This is usually used to validate signatures,
   but the entrypoint implementation can be customized to feature any validation mechanism with some limitations.
2. `__execute__` executes the transaction if the validation is successful.
3. `__validate_declare__` optional entrypoint similar to `__validate__` but for transactions
   meant to declare other contracts.
4. `__validate_deploy__` optional entrypoint similar to `__validate__` but meant for counterfactual deployments.

|  |  |
| --- | --- |
|  | Although these entrypoints are available to the protocol for its regular transaction flow, they can also be called like any other method. |

## Starknet Account

Starknet native account abstraction pattern allows for the creation of custom accounts with different validation schemes, but
usually most account implementations validate transactions using the Stark curve which is the most efficient way
of validating signatures since it is a STARK-friendly curve.

OpenZeppelin Contracts for Cairo provides AccountComponent for implementing this validation scheme.

### Usage

Constructing an account contract requires integrating both AccountComponent and SRC5Component. The contract should also set up the constructor to initialize the public key that will be used as the account’s signer. Here’s an example of a basic contract:

```
#[starknet::contract(account)]
mod MyAccount {
    use openzeppelin_account::AccountComponent;
    use openzeppelin_introspection::src5::SRC5Component;

    component!(path: AccountComponent, storage: account, event: AccountEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    // Account Mixin
    #[abi(embed_v0)]
    impl AccountMixinImpl = AccountComponent::AccountMixinImpl<ContractState>;
    impl AccountInternalImpl = AccountComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        account: AccountComponent::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        AccountEvent: AccountComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event
    }

    #[constructor]
    fn constructor(ref self: ContractState, public_key: felt252) {
        self.account.initializer(public_key);
    }
}
```

### Interface

This is the full interface of the `AccountMixinImpl` implementation:

```
#[starknet::interface]
pub trait AccountABI {
    // ISRC6
    fn __execute__(calls: Array<Call>);
    fn __validate__(calls: Array<Call>) -> felt252;
    fn is_valid_signature(hash: felt252, signature: Array<felt252>) -> felt252;

    // ISRC5
    fn supports_interface(interface_id: felt252) -> bool;

    // IDeclarer
    fn __validate_declare__(class_hash: felt252) -> felt252;

    // IDeployable
    fn __validate_deploy__(
        class_hash: felt252, contract_address_salt: felt252, public_key: felt252
    ) -> felt252;

    // IPublicKey
    fn get_public_key() -> felt252;
    fn set_public_key(new_public_key: felt252, signature: Span<felt252>);

    // ISRC6CamelOnly
    fn isValidSignature(hash: felt252, signature: Array<felt252>) -> felt252;

    // IPublicKeyCamel
    fn getPublicKey() -> felt252;
    fn setPublicKey(newPublicKey: felt252, signature: Span<felt252>);
}
```

## Ethereum Account

Besides the Stark-curve account, OpenZeppelin Contracts for Cairo also offers Ethereum-flavored accounts that use the secp256k1 curve for signature validation.
For this the EthAccountComponent must be used.

### Usage

Constructing a secp256k1 account contract also requires integrating both EthAccountComponent and SRC5Component.
The contract should also set up the constructor to initialize the public key that will be used as the account’s signer.
Here’s an example of a basic contract:

```
#[starknet::contract(account)]
mod MyEthAccount {
    use openzeppelin_account::EthAccountComponent;
    use openzeppelin_account::interface::EthPublicKey;
    use openzeppelin_introspection::src5::SRC5Component;
    use starknet::ClassHash;

    component!(path: EthAccountComponent, storage: eth_account, event: EthAccountEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    // EthAccount Mixin
    #[abi(embed_v0)]
    impl EthAccountMixinImpl =
        EthAccountComponent::EthAccountMixinImpl<ContractState>;
    impl EthAccountInternalImpl = EthAccountComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        eth_account: EthAccountComponent::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        EthAccountEvent: EthAccountComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event
    }

    #[constructor]
    fn constructor(ref self: ContractState, public_key: EthPublicKey) {
        self.eth_account.initializer(public_key);
    }
}
```

### Interface

This is the full interface of the `EthAccountMixinImpl` implementation:

```
#[starknet::interface]
pub trait EthAccountABI {
    // ISRC6
    fn __execute__(calls: Array<Call>);
    fn __validate__(calls: Array<Call>) -> felt252;
    fn is_valid_signature(hash: felt252, signature: Array<felt252>) -> felt252;

    // ISRC5
    fn supports_interface(interface_id: felt252) -> bool;

    // IDeclarer
    fn __validate_declare__(class_hash: felt252) -> felt252;

    // IEthDeployable
    fn __validate_deploy__(
        class_hash: felt252, contract_address_salt: felt252, public_key: EthPublicKey
    ) -> felt252;

    // IEthPublicKey
    fn get_public_key() -> EthPublicKey;
    fn set_public_key(new_public_key: EthPublicKey, signature: Span<felt252>);

    // ISRC6CamelOnly
    fn isValidSignature(hash: felt252, signature: Array<felt252>) -> felt252;

    // IEthPublicKeyCamel
    fn getPublicKey() -> EthPublicKey;
    fn setPublicKey(newPublicKey: EthPublicKey, signature: Span<felt252>);
}
```

## Deploying an account

In Starknet there are two ways of deploying smart contracts: using the `deploy_syscall` and doing
counterfactual deployments.
The former can be easily done with the Universal Deployer Contract (UDC), a contract that
wraps and exposes the `deploy_syscall` to provide arbitrary deployments through regular contract calls.
But if you don’t have an account to invoke it, you will probably want to use the latter.

To do counterfactual deployments, you need to implement another protocol-level entrypoint named
`__validate_deploy__`. Check the counterfactual deployments guide to learn how.

## Sending transactions

Let’s now explore how to send transactions through these accounts.

### Starknet Account

First, let’s take the example account we created before and deploy it:

```
#[starknet::contract(account)]
mod MyAccount {
    use openzeppelin_account::AccountComponent;
    use openzeppelin_introspection::src5::SRC5Component;

    component!(path: AccountComponent, storage: account, event: AccountEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    // Account Mixin
    #[abi(embed_v0)]
    impl AccountMixinImpl = AccountComponent::AccountMixinImpl<ContractState>;
    impl AccountInternalImpl = AccountComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        account: AccountComponent::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        AccountEvent: AccountComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event
    }

    #[constructor]
    fn constructor(ref self: ContractState, public_key: felt252) {
        self.account.initializer(public_key);
    }
}
```

To deploy the account variant, compile the contract and declare the class hash because custom accounts are likely not declared.
This means that you’ll need an account already deployed.

Next, create the account JSON with Starknet Foundry’s custom account setup and include the `--class-hash` flag with the declared class hash.
The flag enables custom account variants.

|  |  |
| --- | --- |
|  | The following examples use `sncast` v0.23.0. |

```
$ sncast \
  --url http://127.0.0.1:5050 \
  account create \
  --name my-custom-account \
  --class-hash 0x123456...
```

This command will output the precomputed contract address and the recommended `max-fee`.
To counterfactually deploy the account, send funds to the address and then deploy the custom account.

```
$ sncast \
  --url http://127.0.0.1:5050 \
  account deploy \
  --name my-custom-account
```

Once the account is deployed, set the `--account` flag with the custom account name to send transactions from that account.

```
$ sncast \
  --account my-custom-account \
  --url http://127.0.0.1:5050 \
  invoke \
  --contract-address 0x123... \
  --function "some_function" \
  --calldata 1 2 3
```

### Ethereum Account

First, let’s take the example account we created before and deploy it:

```
#[starknet::contract(account)]
mod MyEthAccount {
    use openzeppelin_account::EthAccountComponent;
    use openzeppelin_account::interface::EthPublicKey;
    use openzeppelin_introspection::src5::SRC5Component;

    component!(path: EthAccountComponent, storage: eth_account, event: EthAccountEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    // EthAccount Mixin
    #[abi(embed_v0)]
    impl EthAccountMixinImpl =
        EthAccountComponent::EthAccountMixinImpl<ContractState>;
    impl EthAccountInternalImpl = EthAccountComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        eth_account: EthAccountComponent::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        EthAccountEvent: EthAccountComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event
    }

    #[constructor]
    fn constructor(ref self: ContractState, public_key: EthPublicKey) {
        self.eth_account.initializer(public_key);
    }
}
```

Special tooling is required in order to deploy and send transactions with an Ethereum-flavored account contract.
The following examples utilize the StarknetJS library.

Compile and declare the contract on the target network.
Next, precompute the EthAccount contract address using the declared class hash.

|  |  |
| --- | --- |
|  | The following examples use unreleased features from StarknetJS (`starknetjs@next`) at commit d002baea0abc1de3ac6e87a671f3dec3757437b3. |

```
import * as dotenv from 'dotenv';
import { CallData, EthSigner, hash } from 'starknet';
import { ABI as ETH_ABI } from '../abis/eth_account.js';
dotenv.config();

// Calculate EthAccount address
const ethSigner = new EthSigner(process.env.ETH_PRIVATE_KEY);
const ethPubKey = await ethSigner.getPubKey();
const ethAccountClassHash = '<ETH_ACCOUNT_CLASS_HASH>';
const ethCallData = new CallData(ETH_ABI);
const ethAccountConstructorCalldata = ethCallData.compile('constructor', {
    public_key: ethPubKey
})
const salt = '0x12345';
const deployerAddress = '0x0';
const ethContractAddress = hash.calculateContractAddressFromHash(
    salt,
    ethAccountClassHash,
    ethAccountConstructorCalldata,
    deployerAddress
);
console.log('Pre-calculated EthAccount address: ', ethContractAddress);
```

Send funds to the pre-calculated EthAccount address and deploy the contract.

```
import * as dotenv from 'dotenv';
import { Account, CallData, EthSigner, RpcProvider, stark } from 'starknet';
import { ABI as ETH_ABI } from '../abis/eth_account.js';
dotenv.config();

// Prepare EthAccount
const provider = new RpcProvider({ nodeUrl: process.env.API_URL });
const ethSigner = new EthSigner(process.env.ETH_PRIVATE_KEY);
const ethPubKey = await ethSigner.getPubKey();
const ethAccountAddress = '<ETH_ACCOUNT_ADDRESS>'
const ethAccount = new Account(provider, ethAccountAddress, ethSigner);

// Prepare payload
const ethAccountClassHash = '<ETH_ACCOUNT_CLASS_HASH>'
const ethCallData = new CallData(ETH_ABI);
const ethAccountConstructorCalldata = ethCallData.compile('constructor', {
    public_key: ethPubKey
})
const salt = '0x12345';
const deployPayload = {
    classHash: ethAccountClassHash,
    constructorCalldata: ethAccountConstructorCalldata,
    addressSalt: salt,
};

// Deploy
const { suggestedMaxFee: feeDeploy } = await ethAccount.estimateAccountDeployFee(deployPayload);
const { transaction_hash, contract_address } = await ethAccount.deployAccount(
    deployPayload,
    { maxFee: stark.estimatedFeeToMaxFee(feeDeploy, 100) }
);
await provider.waitForTransaction(transaction_hash);
console.log('EthAccount deployed at: ', contract_address);
```

Once deployed, connect the EthAccount instance to the target contract which enables calls to come from the EthAccount.
Here’s what an ERC20 transfer from an EthAccount looks like.

```
import * as dotenv from 'dotenv';
import { Account, RpcProvider, Contract, EthSigner } from 'starknet';
dotenv.config();

// Prepare EthAccount
const provider = new RpcProvider({ nodeUrl: process.env.API_URL });
const ethSigner = new EthSigner(process.env.ETH_PRIVATE_KEY);
const ethAccountAddress = '<ETH_ACCOUNT_CONTRACT_ADDRESS>'
const ethAccount = new Account(provider, ethAccountAddress, ethSigner);

// Prepare target contract
const erc20 = new Contract(compiledErc20.abi, erc20Address, provider);

// Connect EthAccount with the target contract
erc20.connect(ethAccount);

// Execute ERC20 transfer
const transferCall = erc20.populate('transfer', {
    recipient: recipient.address,
    amount: 50n
});
const tx = await erc20.transfer(
    transferCall.calldata, { maxFee: 900_000_000_000_000 }
);
await provider.waitForTransaction(tx.transaction_hash);
```

← API Reference

API Reference →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0-alpha.1/backwards-compatibility

## Backwards Compatibility - OpenZeppelin Docs

You are not reading the current version of this documentation. 2.0.0 is the current version.

# Backwards Compatibility

OpenZeppelin Contracts uses semantic versioning to communicate backwards compatibility of its API and storage layout. Patch and minor updates will generally be backwards compatible, with rare exceptions as detailed below. Major updates should be assumed incompatible with previous releases. On this page, we provide details about these guarantees.

Bear in mind that while releasing versions, we treat minors as majors and patches as minors, in accordance with semantic versioning. This means that `v2.1.0` could be adding features to `v2.0.0`, while `v3.0.0` would be considered a breaking release.

## API

In backwards compatible releases, all changes should be either additions or modifications to internal implementation details. Most code should continue to compile and behave as expected. The exceptions to this rule are listed below.

### Security

Infrequently, a patch or minor update will remove or change an API in a breaking way but only if the previous API is considered insecure. These breaking changes will be noted in the changelog and release notes, and published along with a security advisory.

### Errors

The specific error format and data that is included with reverts should not be assumed stable unless otherwise specified.

### Major releases

Major releases should be assumed incompatible. Nevertheless, the external interfaces of contracts will remain compatible if they are standardized, or if the maintainers judge that changing them would cause significant strain on the ecosystem.

An important aspect that major releases may break is "upgrade compatibility", in particular storage layout compatibility. It will never be safe for a live contract to upgrade from one major release to another.

In the case of breaking "upgrade compatibility", an entry to the changelog will be added listing those breaking changes.

## Storage layout

Patch updates will always preserve storage layout compatibility, and after `v2.0.0-alpha.1` minors will too. This means that a live contract can be upgraded from one minor to another without corrupting the storage layout. In some cases it may be necessary to initialize new state variables when upgrading, although we expect this to be infrequent.

## Cairo version

The minimum Cairo version required to compile the contracts will remain unchanged for patch updates, but it may change for minors.

← Test Utilities

Contracts for Solidity →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0-alpha.1/components

## Components - OpenZeppelin Docs

You are not reading the current version of this documentation. 2.0.0 is the current version.

# Components

The following documentation provides reasoning and examples on how to use Contracts for Cairo components.

Starknet components are separate modules that contain storage, events, and implementations that can be integrated into a contract.
Components themselves cannot be declared or deployed.
Another way to think of components is that they are abstract modules that must be instantiated.

|  |  |
| --- | --- |
|  | For more information on the construction and design of Starknet components, see the Starknet Shamans post and the Cairo book. |

## Building a contract

### Setup

The contract should first import the component and declare it with the `component!` macro:

```
#[starknet::contract]
mod MyContract {
    // Import the component
    use openzeppelin_security::InitializableComponent;

    // Declare the component
    component!(path: InitializableComponent, storage: initializable, event: InitializableEvent);
}
```

The `path` argument should be the imported component itself (in this case, InitializableComponent).
The `storage` and `event` arguments are the variable names that will be set in the `Storage` struct and `Event` enum, respectively.
Note that even if the component doesn’t define any events, the compiler will still create an empty event enum inside the component module.

```
#[starknet::contract]
mod MyContract {
    use openzeppelin_security::InitializableComponent;

    component!(path: InitializableComponent, storage: initializable, event: InitializableEvent);

    #[storage]
    struct Storage {
        #[substorage(v0)]
        initializable: InitializableComponent::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        InitializableEvent: InitializableComponent::Event
    }
}
```

The `#[substorage(v0)]` attribute must be included for each component in the `Storage` trait.
This allows the contract to have indirect access to the component’s storage.
See Accessing component storage for more on this.

The `#[flat]` attribute for events in the `Event` enum, however, is not required.
For component events, the first key in the event log is the component ID.
Flattening the component event removes it, leaving the event ID as the first key.

### Implementations

Components come with granular implementations of different interfaces.
This allows contracts to integrate only the implementations that they’ll use and avoid unnecessary bloat.
Integrating an implementation looks like this:

```
mod MyContract {
    use openzeppelin_security::InitializableComponent;

    component!(path: InitializableComponent, storage: initializable, event: InitializableEvent);

    (...)

    // Gives the contract access to the implementation methods
    impl InitializableImpl =
        InitializableComponent::InitializableImpl<ContractState>;
}
```

Defining an `impl` gives the contract access to the methods within the implementation from the component.
For example, `is_initialized` is defined in the `InitializableImpl`.
A function on the contract level can expose it like this:

```
#[starknet::contract]
mod MyContract {
    use openzeppelin_security::InitializableComponent;

    component!(path: InitializableComponent, storage: initializable, event: InitializableEvent);

    (...)

    impl InitializableImpl =
        InitializableComponent::InitializableImpl<ContractState>;

    #[external(v0)]
    fn is_initialized(ref self: ContractState) -> bool {
        self.initializable.is_initialized()
    }
}
```

While there’s nothing wrong with manually exposing methods like in the previous example, this process can be tedious for implementations with many methods.
Fortunately, a contract can embed implementations which will expose all of the methods of the implementation.
To embed an implementation, add the `#[abi(embed_v0)]` attribute above the `impl`:

```
#[starknet::contract]
mod MyContract {
    (...)

    // This attribute exposes the methods of the `impl`
    #[abi(embed_v0)]
    impl InitializableImpl =
        InitializableComponent::InitializableImpl<ContractState>;
}
```

`InitializableImpl` defines the `is_initialized` method in the component.
By adding the embed attribute, `is_initialized` becomes a contract entrypoint for `MyContract`.

|  |  |
| --- | --- |
|  | Embeddable implementations, when available in this library’s components, are segregated from the internal component implementation which makes it easier to safely expose. Components also separate granular implementations from mixin implementations. The API documentation design reflects these groupings. See ERC20Component as an example which includes:  * **Embeddable Mixin Implementation** * **Embeddable Implementations** * **Internal Implementations** * **Events** |

### Mixins

Mixins are impls made of a combination of smaller, more specific impls.
While separating components into granular implementations offers flexibility,
integrating components with many implementations can appear crowded especially if the contract uses all of them.
Mixins simplify this by allowing contracts to embed groups of implementations with a single directive.

Compare the following code blocks to see the benefit of using a mixin when creating an account contract.

#### Account without mixin

```
component!(path: AccountComponent, storage: account, event: AccountEvent);
component!(path: SRC5Component, storage: src5, event: SRC5Event);

#[abi(embed_v0)]
impl SRC6Impl = AccountComponent::SRC6Impl<ContractState>;
#[abi(embed_v0)]
impl DeclarerImpl = AccountComponent::DeclarerImpl<ContractState>;
#[abi(embed_v0)]
impl DeployableImpl = AccountComponent::DeployableImpl<ContractState>;
#[abi(embed_v0)]
impl PublicKeyImpl = AccountComponent::PublicKeyImpl<ContractState>;
#[abi(embed_v0)]
impl SRC6CamelOnlyImpl = AccountComponent::SRC6CamelOnlyImpl<ContractState>;
#[abi(embed_v0)]
impl PublicKeyCamelImpl = AccountComponent::PublicKeyCamelImpl<ContractState>;
impl AccountInternalImpl = AccountComponent::InternalImpl<ContractState>;

#[abi(embed_v0)]
impl SRC5Impl = SRC5Component::SRC5Impl<ContractState>;
```

#### Account with mixin

```
component!(path: AccountComponent, storage: account, event: AccountEvent);
component!(path: SRC5Component, storage: src5, event: SRC5Event);

#[abi(embed_v0)]
impl AccountMixinImpl = AccountComponent::AccountMixinImpl<ContractState>;
impl AccountInternalImpl = AccountComponent::InternalImpl<ContractState>;
```

The rest of the setup for the contract, however, does not change.
This means that component dependencies must still be included in the `Storage` struct and `Event` enum.
Here’s a full example of an account contract that embeds the `AccountMixinImpl`:

```
#[starknet::contract]
mod Account {
    use openzeppelin_account::AccountComponent;
    use openzeppelin_introspection::src5::SRC5Component;

    component!(path: AccountComponent, storage: account, event: AccountEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    // This embeds all of the methods from the many AccountComponent implementations
    // and also includes `supports_interface` from `SRC5Impl`
    #[abi(embed_v0)]
    impl AccountMixinImpl = AccountComponent::AccountMixinImpl<ContractState>;
    impl AccountInternalImpl = AccountComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        account: AccountComponent::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        AccountEvent: AccountComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event
    }

    #[constructor]
    fn constructor(ref self: ContractState, public_key: felt252) {
        self.account.initializer(public_key);
    }
}
```

### Initializers

|  |  |
| --- | --- |
|  | Failing to use a component’s `initializer` can result in irreparable contract deployments. Always read the API documentation for each integrated component. |

Some components require some sort of setup upon construction.
Usually, this would be a job for a constructor; however, components themselves cannot implement constructors.
Components instead offer `initializer`s within their `InternalImpl` to call from the contract’s constructor.
Let’s look at how a contract would integrate OwnableComponent:

```
#[starknet::contract]
mod MyContract {
    use openzeppelin_access::ownable::OwnableComponent;
    use starknet::ContractAddress;

    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);

    // Instantiate `InternalImpl` to give the contract access to the `initializer`
    impl InternalImpl = OwnableComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        ownable: OwnableComponent::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        OwnableEvent: OwnableComponent::Event
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress) {
        // Invoke ownable's `initializer`
        self.ownable.initializer(owner);
    }
}
```

### Immutable Config

While initializers help set up the component’s initial state, some require configuration that may be defined
as constants, saving gas by avoiding the necessity of reading from storage each time the variable needs to be used. The
Immutable Component Config pattern helps with this matter by allowing the implementing contract to define a set of
constants declared in the component, customizing its functionality.

|  |  |
| --- | --- |
|  | The Immutable Component Config standard is defined in the SRC-107. |

Here’s an example of how to use the Immutable Component Config pattern with the ERC2981Component:

```
#[starknet::contract]
mod MyContract {
    use openzeppelin_introspection::src5::SRC5Component;
    use openzeppelin_token::common::erc2981::ERC2981Component;
    use starknet::contract_address_const;

    component!(path: ERC2981Component, storage: erc2981, event: ERC2981Event);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    // SRC5
    #[abi(embed_v0)]
    impl SRC5Impl = SRC5Component::SRC5Impl<ContractState>;

    // Instantiate `InternalImpl` to give the contract access to the `initializer`
    impl InternalImpl = ERC2981Component::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        erc2981: ERC2981Component::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC2981Event: ERC2981Component::Event,
        #[flat]
        SRC5Event: SRC5Component::Event
    }

    // Define the immutable config
    pub impl ERC2981ImmutableConfig of ERC2981Component::ImmutableConfig {
        const FEE_DENOMINATOR: u128 = 10_000;
    }

    #[constructor]
    fn constructor(ref self: ContractState) {
        let default_receiver = contract_address_const::<'RECEIVER'>();
        let default_royalty_fraction = 1000;
        // Invoke erc2981's `initializer`
        self.erc2981.initializer(default_receiver, default_royalty_fraction);
    }
}
```

#### Default config

Sometimes, components implementing the Immutable Component Config pattern provide a default configuration that can be
directly used without implementing the `ImmutableConfig` trait locally. When provided, this implementation will be named
`DefaultConfig` and will be available in the same module containing the component, as a sibling.

In the following example, the `DefaultConfig` trait is used to define the `FEE_DENOMINATOR` config constant.

```
#[starknet::contract]
mod MyContract {
    use openzeppelin_introspection::src5::SRC5Component;
    // Bring the DefaultConfig trait into scope
    use openzeppelin_token::common::erc2981::{ERC2981Component, DefaultConfig};
    use starknet::contract_address_const;

    component!(path: ERC2981Component, storage: erc2981, event: ERC2981Event);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    // SRC5
    #[abi(embed_v0)]
    impl SRC5Impl = SRC5Component::SRC5Impl<ContractState>;

    // Instantiate `InternalImpl` to give the contract access to the `initializer`
    impl InternalImpl = ERC2981Component::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        (...)
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        (...)
    }

    #[constructor]
    fn constructor(ref self: ContractState) {
        let default_receiver = contract_address_const::<'RECEIVER'>();
        let default_royalty_fraction = 1000;
        // Invoke erc2981's `initializer`
        self.erc2981.initializer(default_receiver, default_royalty_fraction);
    }
}
```

#### `validate` function

The `ImmutableConfig` trait may also include a `validate` function with a default implementation, which
asserts that the configuration is correct, and must not be overridden by the implementing contract. For more information
on how to use this function, refer to the validate section of the SRC-107.

### Dependencies

Some components include dependencies of other components.
Contracts that integrate components with dependencies must also include the component dependency.
For instance, AccessControlComponent depends on SRC5Component.
Creating a contract with `AccessControlComponent` should look like this:

```
#[starknet::contract]
mod MyContract {
    use openzeppelin_access::accesscontrol::AccessControlComponent;
    use openzeppelin_introspection::src5::SRC5Component;

    component!(path: AccessControlComponent, storage: accesscontrol, event: AccessControlEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    // AccessControl
    #[abi(embed_v0)]
    impl AccessControlImpl =
        AccessControlComponent::AccessControlImpl<ContractState>;
    #[abi(embed_v0)]
    impl AccessControlCamelImpl =
        AccessControlComponent::AccessControlCamelImpl<ContractState>;
    impl AccessControlInternalImpl = AccessControlComponent::InternalImpl<ContractState>;

    // SRC5
    #[abi(embed_v0)]
    impl SRC5Impl = SRC5Component::SRC5Impl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        accesscontrol: AccessControlComponent::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        AccessControlEvent: AccessControlComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event
    }

    (...)
}
```

## Customization

|  |  |
| --- | --- |
|  | Customizing implementations and accessing component storage can potentially corrupt the state, bypass security checks, and undermine the component logic. **Exercise extreme caution**. See Security. |

### Hooks

Hooks are entrypoints to the business logic of a token component that are accessible at the contract level.
This allows contracts to insert additional behaviors before and/or after token transfers (including mints and burns).
Prior to hooks, extending functionality required contracts to create custom implementations.

All token components include a generic hooks trait that include empty default functions.
When creating a token contract, the using contract must create an implementation of the hooks trait.
Suppose an ERC20 contract wanted to include Pausable functionality on token transfers.
The following snippet leverages the `before_update` hook to include this behavior.

```
#[starknet::contract]
mod MyToken {
    use openzeppelin_security::pausable::PausableComponent::InternalTrait;
    use openzeppelin_security::pausable::PausableComponent;
    use openzeppelin_token::erc20::{ERC20Component, DefaultConfig};
    use starknet::ContractAddress;

    component!(path: ERC20Component, storage: erc20, event: ERC20Event);
    component!(path: PausableComponent, storage: pausable, event: PausableEvent);

    // ERC20 Mixin
    #[abi(embed_v0)]
    impl ERC20MixinImpl = ERC20Component::ERC20MixinImpl<ContractState>;
    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;

    #[abi(embed_v0)]
    impl PausableImpl = PausableComponent::PausableImpl<ContractState>;
    impl PausableInternalImpl = PausableComponent::InternalImpl<ContractState>;

    // Create the hooks implementation
    impl ERC20HooksImpl of ERC20Component::ERC20HooksTrait<ContractState> {
        // Occurs before token transfers
        fn before_update(
            ref self: ERC20Component::ComponentState<ContractState>,
            from: ContractAddress,
            recipient: ContractAddress,
            amount: u256
        ) {
            // Access local state from component state
            let contract_state = self.get_contract();
            // Call function from integrated component
            contract_state.pausable.assert_not_paused();
        }

        // Omitting the `after_update` hook because the default behavior
        // is already implemented in the trait
    }

    (...)
}
```

Notice that the `self` parameter expects a component state type.
Instead of passing the component state, the using contract’s state can be passed which simplifies the syntax.
The hook then moves the scope up with the Cairo-generated `get_contract` through the `HasComponent` trait (as illustrated with ERC20Component in this example).
From here, the hook can access the using contract’s integrated components, storage, and implementations.

Be advised that even if a token contract does not require hooks, the hooks trait must still be implemented.
The using contract may instantiate an empty impl of the trait;
however, the Contracts for Cairo library already provides the instantiated impl to abstract this away from contracts.
The using contract just needs to bring the implementation into scope like this:

```
#[starknet::contract]
mod MyToken {
    use openzeppelin_token::erc20::{ERC20Component, DefaultConfig};
    use openzeppelin_token::erc20::ERC20HooksEmptyImpl;

    (...)
}
```

|  |  |
| --- | --- |
|  | For a more in-depth guide on hooks, see Extending Cairo Contracts with Hooks. |

### Custom implementations

There are instances where a contract requires different or amended behaviors from a component implementation.
In these scenarios, a contract must create a custom implementation of the interface.
Let’s break down a pausable ERC20 contract to see what that looks like.
Here’s the setup:

```
#[starknet::contract]
mod ERC20Pausable {
    use openzeppelin_security::pausable::PausableComponent;
    use openzeppelin_token::erc20::{ERC20Component, ERC20HooksEmptyImpl, DefaultConfig};
    // Import the ERC20 interfaces to create custom implementations
    use openzeppelin_token::erc20::interface::{IERC20, IERC20CamelOnly};
    use starknet::ContractAddress;

    component!(path: PausableComponent, storage: pausable, event: PausableEvent);
    component!(path: ERC20Component, storage: erc20, event: ERC20Event);

    #[abi(embed_v0)]
    impl PausableImpl = PausableComponent::PausableImpl<ContractState>;
    impl PausableInternalImpl = PausableComponent::InternalImpl<ContractState>;

    // `ERC20MetadataImpl` can keep the embed directive because the implementation
    // will not change
    #[abi(embed_v0)]
    impl ERC20MetadataImpl = ERC20Component::ERC20MetadataImpl<ContractState>;
    // Do not add the embed directive to these implementations because
    // these will be customized
    impl ERC20Impl = ERC20Component::ERC20Impl<ContractState>;
    impl ERC20CamelOnlyImpl = ERC20Component::ERC20CamelOnlyImpl<ContractState>;

    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;

    (...)
}
```

The first thing to notice is that the contract imports the interfaces of the implementations that will be customized.
These will be used in the next code example.

Next, the contract includes the ERC20Component implementations; however, `ERC20Impl` and `ERC20CamelOnlyImplt` are **not** embedded.
Instead, we want to expose our custom implementation of an interface.
The following example shows the pausable logic integrated into the ERC20 implementations:

```
#[starknet::contract]
mod ERC20Pausable {
    (...)

    // Custom ERC20 implementation
    #[abi(embed_v0)]
    impl CustomERC20Impl of IERC20<ContractState> {
        fn transfer(
            ref self: ContractState, recipient: ContractAddress, amount: u256
        ) -> bool {
            // Add the custom logic
            self.pausable.assert_not_paused();
            // Add the original implementation method from `IERC20Impl`
            self.erc20.transfer(recipient, amount)
        }

        fn total_supply(self: @ContractState) -> u256 {
            // This method's behavior does not change from the component
            // implementation, but this method must still be defined.
            // Simply add the original implementation method from `IERC20Impl`
            self.erc20.total_supply()
        }

        (...)
    }

    // Custom ERC20CamelOnly implementation
    #[abi(embed_v0)]
    impl CustomERC20CamelOnlyImpl of IERC20CamelOnly<ContractState> {
        fn totalSupply(self: @ContractState) -> u256 {
            self.erc20.total_supply()
        }

        fn balanceOf(self: @ContractState, account: ContractAddress) -> u256 {
            self.erc20.balance_of(account)
        }

        fn transferFrom(
            ref self: ContractState,
            sender: ContractAddress,
            recipient: ContractAddress,
            amount: u256
        ) -> bool {
            self.pausable.assert_not_paused();
            self.erc20.transfer_from(sender, recipient, amount)
        }
    }
}
```

Notice that in the `CustomERC20Impl`, the `transfer` method integrates `pausable.assert_not_paused` as well as `erc20.transfer` from `PausableImpl` and `ERC20Impl` respectively.
This is why the contract defined the `ERC20Impl` from the component in the previous example.

Creating a custom implementation of an interface must define **all** methods from that interface.
This is true even if the behavior of a method does not change from the component implementation (as `total_supply` exemplifies in this example).

### Accessing component storage

There may be cases where the contract must read or write to an integrated component’s storage.
To do so, use the same syntax as calling an implementation method except replace the name of the method with the storage variable like this:

```
#[starknet::contract]
mod MyContract {
    use openzeppelin_security::InitializableComponent;

    component!(path: InitializableComponent, storage: initializable, event: InitializableEvent);

    #[storage]
    struct Storage {
        #[substorage(v0)]
        initializable: InitializableComponent::Storage
    }

    (...)

    fn write_to_comp_storage(ref self: ContractState) {
        self.initializable.Initializable_initialized.write(true);
    }

    fn read_from_comp_storage(self: @ContractState) -> bool {
        self.initializable.Initializable_initialized.read()
    }
}
```

## Security

The maintainers of OpenZeppelin Contracts for Cairo are mainly concerned with the correctness and security of the code as published in the library.

Customizing implementations and manipulating the component state may break some important assumptions and introduce vulnerabilities.
While we try to ensure the components remain secure in the face of a wide range of potential customizations, this is done in a best-effort manner.
Any and all customizations to the component logic should be carefully reviewed and checked against the source code of the component they are customizing so as to fully understand their impact and guarantee their security.

← Wizard

Presets →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0-alpha.1/erc1155

## ERC1155 - OpenZeppelin Docs

You are not reading the current version of this documentation. 2.0.0 is the current version.

# ERC1155

The ERC1155 multi token standard is a specification for fungibility-agnostic token contracts.
The ERC1155 library implements an approximation of EIP-1155 in Cairo for StarkNet.

## Multi Token Standard

The distinctive feature of ERC1155 is that it uses a single smart contract to represent multiple tokens at once. This
is why its balance\_of function differs from ERC20’s and ERC777’s: it has an additional ID argument for the
identifier of the token that you want to query the balance of.

This is similar to how ERC721 does things, but in that standard a token ID has no concept of balance: each token is
non-fungible and exists or doesn’t. The ERC721 balance\_of function refers to how many different tokens an account
has, not how many of each. On the other hand, in ERC1155 accounts have a distinct balance for each token ID, and
non-fungible tokens are implemented by simply minting a single one of them.

This approach leads to massive gas savings for projects that require multiple tokens. Instead of deploying a new
contract for each token type, a single ERC1155 token contract can hold the entire system state, reducing deployment
costs and complexity.

## Usage

Using Contracts for Cairo, constructing an ERC1155 contract requires integrating both `ERC1155Component` and `SRC5Component`.
The contract should also set up the constructor to initialize the token’s URI and interface support.
Here’s an example of a basic contract:

```
#[starknet::contract]
mod MyERC1155 {
    use openzeppelin_introspection::src5::SRC5Component;
    use openzeppelin_token::erc1155::{ERC1155Component, ERC1155HooksEmptyImpl};
    use starknet::ContractAddress;

    component!(path: ERC1155Component, storage: erc1155, event: ERC1155Event);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    // ERC1155 Mixin
    #[abi(embed_v0)]
    impl ERC1155MixinImpl = ERC1155Component::ERC1155MixinImpl<ContractState>;
    impl ERC1155InternalImpl = ERC1155Component::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        erc1155: ERC1155Component::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC1155Event: ERC1155Component::Event,
        #[flat]
        SRC5Event: SRC5Component::Event
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        token_uri: ByteArray,
        recipient: ContractAddress,
        token_ids: Span<u256>,
        values: Span<u256>
    ) {
        self.erc1155.initializer(token_uri);
        self
            .erc1155
            .batch_mint_with_acceptance_check(recipient, token_ids, values, array![].span());
    }
}
```

## Interface

The following interface represents the full ABI of the Contracts for Cairo ERC1155Component.
The interface includes the IERC1155 standard interface and the optional IERC1155MetadataURI interface together with ISRC5.

To support older token deployments, as mentioned in Dual interfaces, the component also includes implementations of the interface written in camelCase.

```
#[starknet::interface]
pub trait ERC1155ABI {
    // IERC1155
    fn balance_of(account: ContractAddress, token_id: u256) -> u256;
    fn balance_of_batch(
        accounts: Span<ContractAddress>, token_ids: Span<u256>
    ) -> Span<u256>;
    fn safe_transfer_from(
        from: ContractAddress,
        to: ContractAddress,
        token_id: u256,
        value: u256,
        data: Span<felt252>
    );
    fn safe_batch_transfer_from(
        from: ContractAddress,
        to: ContractAddress,
        token_ids: Span<u256>,
        values: Span<u256>,
        data: Span<felt252>
    );
    fn is_approved_for_all(
        owner: ContractAddress, operator: ContractAddress
    ) -> bool;
    fn set_approval_for_all(operator: ContractAddress, approved: bool);

    // IERC1155MetadataURI
    fn uri(token_id: u256) -> ByteArray;

    // ISRC5
    fn supports_interface(interface_id: felt252) -> bool;

    // IERC1155Camel
    fn balanceOf(account: ContractAddress, tokenId: u256) -> u256;
    fn balanceOfBatch(
        accounts: Span<ContractAddress>, tokenIds: Span<u256>
    ) -> Span<u256>;
    fn safeTransferFrom(
        from: ContractAddress,
        to: ContractAddress,
        tokenId: u256,
        value: u256,
        data: Span<felt252>
    );
    fn safeBatchTransferFrom(
        from: ContractAddress,
        to: ContractAddress,
        tokenIds: Span<u256>,
        values: Span<u256>,
        data: Span<felt252>
    );
    fn isApprovedForAll(owner: ContractAddress, operator: ContractAddress) -> bool;
    fn setApprovalForAll(operator: ContractAddress, approved: bool);
}
```

## ERC1155 Compatibility

Although Starknet is not EVM compatible, this implementation aims to be as close as possible to the ERC1155 standard but some differences can still be found, such as:

* The optional `data` argument in both `safe_transfer_from` and `safe_batch_transfer_from` is implemented as `Span<felt252>`.
* `IERC1155Receiver` compliant contracts must implement SRC5 and register the `IERC1155Receiver` interface ID.
* `IERC1155Receiver::on_erc1155_received` must return that interface ID on success.

## Batch operations

Because all state is held in a single contract, it is possible to operate over multiple tokens in a single transaction very efficiently. The standard provides two functions, balance\_of\_batch and safe\_batch\_transfer\_from, that make querying multiple balances and transferring multiple tokens simpler and less gas-intensive. We also have safe\_transfer\_from for non-batch operations.

In the spirit of the standard, we’ve also included batch operations in the non-standard functions, such as
batch\_mint\_with\_acceptance\_check.

|  |  |
| --- | --- |
|  | While safe\_transfer\_from and safe\_batch\_transfer\_from prevent loss by checking the receiver can handle the tokens, this yields execution to the receiver which can result in a reentrant call. |

## Receiving tokens

In order to be sure a non-account contract can safely accept ERC1155 tokens, said contract must implement the `IERC1155Receiver` interface.
The recipient contract must also implement the SRC5 interface which supports interface introspection.

### IERC1155Receiver

```
#[starknet::interface]
pub trait IERC1155Receiver {
    fn on_erc1155_received(
        operator: ContractAddress,
        from: ContractAddress,
        token_id: u256,
        value: u256,
        data: Span<felt252>
    ) -> felt252;
    fn on_erc1155_batch_received(
        operator: ContractAddress,
        from: ContractAddress,
        token_ids: Span<u256>,
        values: Span<u256>,
        data: Span<felt252>
    ) -> felt252;
}
```

Implementing the `IERC1155Receiver` interface exposes the on\_erc1155\_received and on\_erc1155\_batch\_received methods.
When safe\_transfer\_from and safe\_batch\_transfer\_from are called, they invoke the recipient contract’s `on_erc1155_received` or `on_erc1155_batch_received` methods respectively which **must** return the IERC1155Receiver interface ID.
Otherwise, the transaction will fail.

|  |  |
| --- | --- |
|  | For information on how to calculate interface IDs, see Computing the interface ID. |

### Creating a token receiver contract

The Contracts for Cairo ERC1155ReceiverComponent already returns the correct interface ID for safe token transfers.
To integrate the `IERC1155Receiver` interface into a contract, simply include the ABI embed directive to the implementations and add the `initializer` in the contract’s constructor.
Here’s an example of a simple token receiver contract:

```
#[starknet::contract]
mod MyTokenReceiver {
    use openzeppelin_introspection::src5::SRC5Component;
    use openzeppelin_token::erc1155::ERC1155ReceiverComponent;
    use starknet::ContractAddress;

    component!(path: ERC1155ReceiverComponent, storage: erc1155_receiver, event: ERC1155ReceiverEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    // ERC1155Receiver Mixin
    #[abi(embed_v0)]
    impl ERC1155ReceiverMixinImpl = ERC1155ReceiverComponent::ERC1155ReceiverMixinImpl<ContractState>;
    impl ERC1155ReceiverInternalImpl = ERC1155ReceiverComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        erc1155_receiver: ERC1155ReceiverComponent::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC1155ReceiverEvent: ERC1155ReceiverComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event
    }

    #[constructor]
    fn constructor(ref self: ContractState) {
        self.erc1155_receiver.initializer();
    }
}
```

← API Reference

API Reference →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0-alpha.1/erc20

## ERC20 - OpenZeppelin Docs

You are not reading the current version of this documentation. 2.0.0 is the current version.

# ERC20

The ERC20 token standard is a specification for fungible tokens, a type of token where all the units are exactly equal to each other.
`token::erc20::ERC20Component` provides an approximation of EIP-20 in Cairo for Starknet.

|  |  |
| --- | --- |
|  | Prior to Contracts v0.7.0, ERC20 contracts store and read `decimals` from storage; however, this implementation returns a static `18`. If upgrading an older ERC20 contract that has a decimals value other than `18`, the upgraded contract **must** use a custom `decimals` implementation. See the Customizing decimals guide. |

## Usage

Using Contracts for Cairo, constructing an ERC20 contract requires setting up the constructor and instantiating the token implementation.
Here’s what that looks like:

```
#[starknet::contract]
mod MyToken {
    use openzeppelin_token::erc20::{ERC20Component, ERC20HooksEmptyImpl, DefaultConfig};
    use starknet::ContractAddress;

    component!(path: ERC20Component, storage: erc20, event: ERC20Event);

    // ERC20 Mixin
    #[abi(embed_v0)]
    impl ERC20MixinImpl = ERC20Component::ERC20MixinImpl<ContractState>;
    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        erc20: ERC20Component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC20Event: ERC20Component::Event
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        initial_supply: u256,
        recipient: ContractAddress
    ) {
        let name = "MyToken";
        let symbol = "MTK";

        self.erc20.initializer(name, symbol);
        self.erc20.mint(recipient, initial_supply);
    }
}
```

`MyToken` integrates both the `ERC20Impl` and `ERC20MetadataImpl` with the embed directive which marks the implementations as external in the contract.
While the `ERC20MetadataImpl` is optional, it’s generally recommended to include it because the vast majority of ERC20 tokens provide the metadata methods.
The above example also includes the `ERC20InternalImpl` instance.
This allows the contract’s constructor to initialize the contract and create an initial supply of tokens.

|  |  |
| --- | --- |
|  | For a more complete guide on ERC20 token mechanisms, see Creating ERC20 Supply. |

## Interface

The following interface represents the full ABI of the Contracts for Cairo ERC20Component.
The interface includes the IERC20 standard interface as well as the optional IERC20Metadata.

To support older token deployments, as mentioned in Dual interfaces, the component also includes an implementation of the interface written in camelCase.

```
#[starknet::interface]
pub trait ERC20ABI {
    // IERC20
    fn total_supply() -> u256;
    fn balance_of(account: ContractAddress) -> u256;
    fn allowance(owner: ContractAddress, spender: ContractAddress) -> u256;
    fn transfer(recipient: ContractAddress, amount: u256) -> bool;
    fn transfer_from(
        sender: ContractAddress, recipient: ContractAddress, amount: u256
    ) -> bool;
    fn approve(spender: ContractAddress, amount: u256) -> bool;

    // IERC20Metadata
    fn name() -> ByteArray;
    fn symbol() -> ByteArray;
    fn decimals() -> u8;

    // IERC20Camel
    fn totalSupply() -> u256;
    fn balanceOf(account: ContractAddress) -> u256;
    fn transferFrom(
        sender: ContractAddress, recipient: ContractAddress, amount: u256
    ) -> bool;
}
```

## ERC20 compatibility

Although Starknet is not EVM compatible, this component aims to be as close as possible to the ERC20 token standard.
Some notable differences, however, can still be found, such as:

* The `ByteArray` type is used to represent strings in Cairo.
* The component offers a dual interface which supports both snake\_case and camelCase methods, as opposed to just camelCase in Solidity.
* `transfer`, `transfer_from` and `approve` will never return anything different from `true` because they will revert on any error.
* Function selectors are calculated differently between Cairo and Solidity.

## Customizing decimals

Cairo, like Solidity, does not support floating-point numbers.
To get around this limitation, ERC20 token contracts may offer a `decimals` field which communicates to outside interfaces (wallets, exchanges, etc.) how the token should be displayed.
For instance, suppose a token had a `decimals` value of `3` and the total token supply was `1234`.
An outside interface would display the token supply as `1.234`.
In the actual contract, however, the supply would still be the integer `1234`.
In other words, **the decimals field in no way changes the actual arithmetic** because all operations are still performed on integers.

Most contracts use `18` decimals and this was even proposed to be compulsory (see the EIP discussion).

### The static approach (SRC-107)

The Contracts for Cairo `ERC20` component leverages SRC-107 to allow for a static and configurable number of decimals.
To use the default `18` decimals, you can use the `DefaultConfig` implementation by just importing it:

```
#[starknet::contract]
mod MyToken {
    // Importing the DefaultConfig implementation would make decimals 18 by default.
    use openzeppelin_token::erc20::{ERC20Component, ERC20HooksEmptyImpl, DefaultConfig};
    use starknet::ContractAddress;

    component!(path: ERC20Component, storage: erc20, event: ERC20Event);

    #[abi(embed_v0)]
    impl ERC20Impl = ERC20Component::ERC20Impl<ContractState>;
    #[abi(embed_v0)]
    impl ERC20CamelOnlyImpl = ERC20Component::ERC20CamelOnlyImpl<ContractState>;
    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;

    (...)
}
```

To customize this value, you can implement the ImmutableConfig trait locally in the contract.
The following example shows how to set the decimals to `6`:

```
mod MyToken {
    use openzeppelin_token::erc20::{ERC20Component, ERC20HooksEmptyImpl};
    use starknet::ContractAddress;

    component!(path: ERC20Component, storage: erc20, event: ERC20Event);

    #[abi(embed_v0)]
    impl ERC20Impl = ERC20Component::ERC20Impl<ContractState>;
    #[abi(embed_v0)]
    impl ERC20CamelOnlyImpl = ERC20Component::ERC20CamelOnlyImpl<ContractState>;
    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;

    (...)

    // Custom implementation of the ERC20Component ImmutableConfig.
    impl ERC20ImmutableConfig of ERC20Component::ImmutableConfig {
        const DECIMALS: u8 = 6;
    }
}
```

### The storage approach

For more complex scenarios, such as a factory deploying multiple tokens with differing values for decimals, a flexible solution might be appropriate.

|  |  |
| --- | --- |
|  | Note that we are not using the MixinImpl or the DefaultConfig in this case, since we need to customize the IERC20Metadata implementation. |

```
#[starknet::contract]
mod MyToken {
    use openzeppelin_token::erc20::interface;
    use openzeppelin_token::erc20::{ERC20Component, ERC20HooksEmptyImpl};
    use starknet::ContractAddress;

    component!(path: ERC20Component, storage: erc20, event: ERC20Event);

    #[abi(embed_v0)]
    impl ERC20Impl = ERC20Component::ERC20Impl<ContractState>;
    #[abi(embed_v0)]
    impl ERC20CamelOnlyImpl = ERC20Component::ERC20CamelOnlyImpl<ContractState>;
    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        erc20: ERC20Component::Storage,
        // The decimals value is stored locally
        decimals: u8,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC20Event: ERC20Component::Event,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState, decimals: u8, initial_supply: u256, recipient: ContractAddress,
    ) {
        // Call the internal function that writes decimals to storage
        self._set_decimals(decimals);

        // Initialize ERC20
        let name = "MyToken";
        let symbol = "MTK";

        self.erc20.initializer(name, symbol);
        self.erc20.mint(recipient, initial_supply);
    }

    #[abi(embed_v0)]
    impl ERC20CustomMetadataImpl of interface::IERC20Metadata<ContractState> {
        fn name(self: @ContractState) -> ByteArray {
            self.erc20.ERC20_name.read()
        }

        fn symbol(self: @ContractState) -> ByteArray {
            self.erc20.ERC20_symbol.read()
        }

        fn decimals(self: @ContractState) -> u8 {
            self.decimals.read()
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn _set_decimals(ref self: ContractState, decimals: u8) {
            self.decimals.write(decimals);
        }
    }
}
```

This contract expects a `decimals` argument in the constructor and uses an internal function to write the decimals to storage.
Note that the `decimals` state variable must be defined in the contract’s storage because this variable does not exist in the component offered by OpenZeppelin Contracts for Cairo.
It’s important to include a custom ERC20 metadata implementation and NOT use the Contracts for Cairo `ERC20MetadataImpl` in this specific case since the `decimals` method will always return `18`.

← API Reference

Creating Supply →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0-alpha.1/erc4626

## ERC4626 - OpenZeppelin Docs

You are not reading the current version of this documentation. 2.0.0 is the current version.

# ERC4626

ERC4626 is an extension of ERC20 that proposes a standard interface for token vaults. This standard interface can be used by widely different contracts (including lending markets, aggregators, and intrinsically interest bearing tokens), which brings a number of subtleties. Navigating these potential issues is essential to implementing a compliant and composable token vault.

We provide a base component of ERC4626 which is designed to allow developers to easily re-configure the vault’s behavior, using traits and hooks, while staying compliant. In this guide, we will discuss some security considerations that affect ERC4626. We will also discuss common customizations of the vault.

## Security concern: Inflation attack

### Visualizing the vault

In exchange for the assets deposited into an ERC4626 vault, a user receives shares. These shares can later be burned to redeem the corresponding underlying assets. The number of shares a user gets depends on the amount of assets they put in and on the exchange rate of the vault. This exchange rate is defined by the current liquidity held by the vault.

* If a vault has 100 tokens to back 200 shares, then each share is worth 0.5 assets.
* If a vault has 200 tokens to back 100 shares, then each share is worth 2.0 assets.

In other words, the exchange rate can be defined as the slope of the line that passes through the origin and the current number of assets and shares in the vault. Deposits and withdrawals move the vault in this line.

When plotted in log-log scale, the rate is defined similarly, but appears differently (because the point (0,0) is infinitely far away). Rates are represented by "diagonal" lines with different offsets.

In such a representation, widely different rates can be clearly visible in the same graph. This wouldn’t be the case in linear scale.

### The attack

When depositing tokens, the number of shares a user gets is rounded towards zero. This rounding takes away value from the user in favor of the vault (i.e. in favor of all the current shareholders). This rounding is often negligible because of the amount at stake. If you deposit 1e9 shares worth of tokens, the rounding will have you lose at most 0.0000001% of your deposit. However if you deposit 10 shares worth of tokens, you could lose 10% of your deposit. Even worse, if you deposit less than 1 share worth of tokens, you will receive 0 shares, effectively making a donation.

For a given amount of assets, the more shares you receive the safer you are. If you want to limit your losses to at most 1%, you need to receive at least 100 shares.

In the figure we can see that for a given deposit of 500 assets, the number of shares we get and the corresponding rounding losses depend on the exchange rate. If the exchange rate is that of the orange curve, we are getting less than a share, so we lose 100% of our deposit. However, if the exchange rate is that of the green curve, we get 5000 shares, which limits our rounding losses to at most 0.02%.

Symmetrically, if we focus on limiting our losses to a maximum of 0.5%, we need to get at least 200 shares. With the green exchange rate that requires just 20 tokens, but with the orange rate that requires 200000 tokens.

We can clearly see that the blue and green curves correspond to vaults that are safer than the yellow and orange curves.

The idea of an inflation attack is that an attacker can donate assets to the vault to move the rate curve to the right, and make the vault unsafe.

Figure 6 shows how an attacker can manipulate the rate of an empty vault. First the attacker must deposit a small amount of tokens (1 token) and follow up with a donation of 1e5 tokens directly to the vault to move the exchange rate "right". This puts the vault in a state where any deposit smaller than 1e5 would be completely lost to the vault. Given that the attacker is the only shareholder (from their donation), the attacker would steal all the tokens deposited.

An attacker would typically wait for a user to do the first deposit into the vault, and would frontrun that operation with the attack described above. The risk is low, and the size of the "donation" required to manipulate the vault is equivalent to the size of the deposit that is being attacked.

In math that gives:

* \(a\_0\) the attacker deposit
* \(a\_1\) the attacker donation
* \(u\) the user deposit

|  | Assets | Shares | Rate |
| --- | --- | --- | --- |
| initial | \(0\) | \(0\) | - |
| after attacker’s deposit | \(a\_0\) | \(a\_0\) | \(1\) |
| after attacker’s donation | \(a\_0+a\_1\) | \(a\_0\) | \(\frac{a\_0}{a\_0+a\_1}\) |

This means a deposit of \(u\) will give \(\frac{u \times a\_0}{a\_0 + a\_1}\) shares.

For the attacker to dilute that deposit to 0 shares, causing the user to lose all its deposit, it must ensure that

\[\frac{u \times a\_0}{a\_0+a\_1} < 1 \iff u < 1 + \frac{a\_1}{a\_0}\]

Using \(a\_0 = 1\) and \(a\_1 = u\) is enough. So the attacker only needs \(u+1\) assets to perform a successful attack.

It is easy to generalize the above results to scenarios where the attacker is going after a smaller fraction of the user’s deposit. In order to target \(\frac{u}{n}\), the user needs to suffer rounding of a similar fraction, which means the user must receive at most \(n\) shares. This results in:

\[\frac{u \times a\_0}{a\_0+a\_1} < n \iff \frac{u}{n} < 1 + \frac{a\_1}{a\_0}\]

In this scenario, the attack is \(n\) times less powerful (in how much it is stealing) and costs \(n\) times less to execute. In both cases, the amount of funds the attacker needs to commit is equivalent to its potential earnings.

### Defending with a virtual offset

The defense we propose is based on the approach used in YieldBox. It consists of two parts:

* Use an offset between the "precision" of the representation of shares and assets. Said otherwise, we use more decimal places to represent the shares than the underlying token does to represent the assets.
* Include virtual shares and virtual assets in the exchange rate computation. These virtual assets enforce the conversion rate when the vault is empty.

These two parts work together in enforcing the security of the vault. First, the increased precision corresponds to a high rate, which we saw is safer as it reduces the rounding error when computing the amount of shares. Second, the virtual assets and shares (in addition to simplifying a lot of the computations) capture part of the donation, making it unprofitable to perform an attack.

Following the previous math definitions, we have:

* \(\delta\) the vault offset
* \(a\_0\) the attacker deposit
* \(a\_1\) the attacker donation
* \(u\) the user deposit

|  | Assets | Shares | Rate |
| --- | --- | --- | --- |
| initial | \(1\) | \(10^\delta\) | \(10^\delta\) |
| after attacker’s deposit | \(1+a\_0\) | \(10^\delta \times (1+a\_0)\) | \(10^\delta\) |
| after attacker’s donation | \(1+a\_0+a\_1\) | \(10^\delta \times (1+a\_0)\) | \(10^\delta \times \frac{1+a\_0}{1+a\_0+a\_1}\) |

One important thing to note is that the attacker only owns a fraction \(\frac{a\_0}{1 + a\_0}\) of the shares, so when doing the donation, he will only be able to recover that fraction \(\frac{a\_1 \times a\_0}{1 + a\_0}\) of the donation. The remaining \(\frac{a\_1}{1+a\_0}\) are captured by the vault.

\[\mathit{loss} = \frac{a\_1}{1+a\_0}\]

When the user deposits \(u\), he receives

\[10^\delta \times u \times \frac{1+a\_0}{1+a\_0+a\_1}\]

For the attacker to dilute that deposit to 0 shares, causing the user to lose all its deposit, it must ensure that

\[10^\delta \times u \times \frac{1+a\_0}{1+a\_0+a\_1} < 1\]

\[\iff 10^\delta \times u < \frac{1+a\_0+a\_1}{1+a\_0}\]

\[\iff 10^\delta \times u < 1 + \frac{a\_1}{1+a\_0}\]

\[\iff 10^\delta \times u \le \mathit{loss}\]

* If the offset is 0, the attacker loss is at least equal to the user’s deposit.
* If the offset is greater than 0, the attacker will have to suffer losses that are orders of magnitude bigger than the amount of value that can hypothetically be stolen from the user.

This shows that even with an offset of 0, the virtual shares and assets make this attack non profitable for the attacker. Bigger offsets increase the security even further by making any attack on the user extremely wasteful.

The following figure shows how the offset impacts the initial rate and limits the ability of an attacker with limited funds to inflate it effectively.

\(\delta = 3\), \(a\_0 = 1\), \(a\_1 = 10^5\)

\(\delta = 3\), \(a\_0 = 100\), \(a\_1 = 10^5\)

\(\delta = 6\), \(a\_0 = 1\), \(a\_1 = 10^5\)

## Usage

### Custom behavior: Adding fees to the vault

In ERC4626 vaults, fees can be captured during the deposit/mint and/or during the withdraw/redeem steps.
In both cases, it is essential to remain compliant with the ERC4626 requirements in regard to the preview functions.

For example, if calling `deposit(100, receiver)`, the caller should deposit exactly 100 underlying tokens, including fees, and the receiver should receive a number of shares that matches the value returned by `preview_deposit(100)`.
Similarly, `preview_mint` should account for the fees that the user will have to pay on top of share’s cost.

As for the `Deposit` event, while this is less clear in the EIP spec itself,
there seems to be consensus that it should include the number of assets paid for by the user, including the fees.

On the other hand, when withdrawing assets, the number given by the user should correspond to what the user receives.
Any fees should be added to the quote (in shares) performed by `preview_withdraw`.

The `Withdraw` event should include the number of shares the user burns (including fees) and the number of assets the user actually receives (after fees are deducted).

The consequence of this design is that both the `Deposit` and `Withdraw` events will describe two exchange rates.
The spread between the "Buy-in" and the "Exit" prices correspond to the fees taken by the vault.

The following example describes how fees proportional to the deposited/withdrawn amount can be implemented:

```
/// The mock contract charges fees in terms of assets, not shares.
/// This means that the fees are calculated based on the amount of assets that are being deposited
/// or withdrawn, and not based on the amount of shares that are being minted or redeemed.
/// This is an opinionated design decision for the purpose of testing.
/// DO NOT USE IN PRODUCTION
#[starknet::contract]
pub mod ERC4626Fees {
    use openzeppelin_token::erc20::extensions::erc4626::ERC4626Component;
    use openzeppelin_token::erc20::extensions::erc4626::ERC4626Component::FeeConfigTrait;
    use openzeppelin_token::erc20::extensions::erc4626::ERC4626Component::InternalTrait as ERC4626InternalTrait;
    use openzeppelin_token::erc20::extensions::erc4626::{DefaultConfig, ERC4626DefaultLimits};
    use openzeppelin_token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
    use openzeppelin_token::erc20::{ERC20Component, ERC20HooksEmptyImpl};
    use openzeppelin_utils::math;
    use openzeppelin_utils::math::Rounding;
    use starknet::ContractAddress;
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};

    component!(path: ERC4626Component, storage: erc4626, event: ERC4626Event);
    component!(path: ERC20Component, storage: erc20, event: ERC20Event);

    // ERC4626
    #[abi(embed_v0)]
    impl ERC4626ComponentImpl = ERC4626Component::ERC4626Impl<ContractState>;
    // ERC4626MetadataImpl is a custom impl of IERC20Metadata
    #[abi(embed_v0)]
    impl ERC4626MetadataImpl = ERC4626Component::ERC4626MetadataImpl<ContractState>;

    // ERC20
    #[abi(embed_v0)]
    impl ERC20Impl = ERC20Component::ERC20Impl<ContractState>;
    #[abi(embed_v0)]
    impl ERC20CamelOnlyImpl = ERC20Component::ERC20CamelOnlyImpl<ContractState>;

    impl ERC4626InternalImpl = ERC4626Component::InternalImpl<ContractState>;
    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;

    #[storage]
    pub struct Storage {
        #[substorage(v0)]
        pub erc4626: ERC4626Component::Storage,
        #[substorage(v0)]
        pub erc20: ERC20Component::Storage,
        pub entry_fee_basis_point_value: u256,
        pub entry_fee_recipient: ContractAddress,
        pub exit_fee_basis_point_value: u256,
        pub exit_fee_recipient: ContractAddress,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC4626Event: ERC4626Component::Event,
        #[flat]
        ERC20Event: ERC20Component::Event,
    }

    const _BASIS_POINT_SCALE: u256 = 10_000;

    /// Hooks
    impl ERC4626HooksEmptyImpl of ERC4626Component::ERC4626HooksTrait<ContractState> {
        fn after_deposit(
            ref self: ERC4626Component::ComponentState<ContractState>, assets: u256, shares: u256,
        ) {
            let mut contract_state = self.get_contract_mut();
            let entry_basis_points = contract_state.entry_fee_basis_point_value.read();
            let fee = contract_state.fee_on_total(assets, entry_basis_points);
            let recipient = contract_state.entry_fee_recipient.read();

            if fee > 0 && recipient != starknet::get_contract_address() {
                contract_state.transfer_fees(recipient, fee);
            }
        }

        fn before_withdraw(
            ref self: ERC4626Component::ComponentState<ContractState>, assets: u256, shares: u256,
        ) {
            let mut contract_state = self.get_contract_mut();
            let exit_basis_points = contract_state.exit_fee_basis_point_value.read();
            let fee = contract_state.fee_on_raw(assets, exit_basis_points);
            let recipient = contract_state.exit_fee_recipient.read();

            if fee > 0 && recipient != starknet::get_contract_address() {
                contract_state.transfer_fees(recipient, fee);
            }
        }
    }

    /// Adjust fees
    impl AdjustFeesImpl of FeeConfigTrait<ContractState> {
        fn adjust_deposit(
            self: @ERC4626Component::ComponentState<ContractState>, assets: u256,
        ) -> u256 {
            let contract_state = self.get_contract();
            contract_state.remove_fee_from_deposit(assets)
        }

        fn adjust_mint(
            self: @ERC4626Component::ComponentState<ContractState>, assets: u256,
        ) -> u256 {
            let contract_state = self.get_contract();
            contract_state.add_fee_to_mint(assets)
        }

        fn adjust_withdraw(
            self: @ERC4626Component::ComponentState<ContractState>, assets: u256,
        ) -> u256 {
            let contract_state = self.get_contract();
            contract_state.add_fee_to_withdraw(assets)
        }

        fn adjust_redeem(
            self: @ERC4626Component::ComponentState<ContractState>, assets: u256,
        ) -> u256 {
            let contract_state = self.get_contract();
            contract_state.remove_fee_from_redeem(assets)
        }
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        name: ByteArray,
        symbol: ByteArray,
        underlying_asset: ContractAddress,
        initial_supply: u256,
        recipient: ContractAddress,
        entry_fee: u256,
        entry_treasury: ContractAddress,
        exit_fee: u256,
        exit_treasury: ContractAddress,
    ) {
        self.erc20.initializer(name, symbol);
        self.erc20.mint(recipient, initial_supply);
        self.erc4626.initializer(underlying_asset);

        self.entry_fee_basis_point_value.write(entry_fee);
        self.entry_fee_recipient.write(entry_treasury);
        self.exit_fee_basis_point_value.write(exit_fee);
        self.exit_fee_recipient.write(exit_treasury);
    }

    #[generate_trait]
    pub impl InternalImpl of InternalTrait {
        fn transfer_fees(ref self: ContractState, recipient: ContractAddress, fee: u256) {
            let asset_address = self.asset();
            let asset_dispatcher = IERC20Dispatcher { contract_address: asset_address };
            assert(asset_dispatcher.transfer(recipient, fee), 'Fee transfer failed');
        }

        fn remove_fee_from_deposit(self: @ContractState, assets: u256) -> u256 {
            let fee = self.fee_on_total(assets, self.entry_fee_basis_point_value.read());
            assets - fee
        }

        fn add_fee_to_mint(self: @ContractState, assets: u256) -> u256 {
            assets + self.fee_on_raw(assets, self.entry_fee_basis_point_value.read())
        }

        fn add_fee_to_withdraw(self: @ContractState, assets: u256) -> u256 {
            let fee = self.fee_on_raw(assets, self.exit_fee_basis_point_value.read());
            assets + fee
        }

        fn remove_fee_from_redeem(self: @ContractState, assets: u256) -> u256 {
            assets - self.fee_on_total(assets, self.exit_fee_basis_point_value.read())
        }

        ///
        /// Fee operations
        ///

        /// Calculates the fees that should be added to an amount `assets` that does not already
        /// include fees.
        /// Used in IERC4626::mint and IERC4626::withdraw operations.
        fn fee_on_raw(self: @ContractState, assets: u256, fee_basis_points: u256) -> u256 {
            math::u256_mul_div(assets, fee_basis_points, _BASIS_POINT_SCALE, Rounding::Ceil)
        }

        /// Calculates the fee part of an amount `assets` that already includes fees.
        /// Used in IERC4626::deposit and IERC4626::redeem operations.
        fn fee_on_total(self: @ContractState, assets: u256, fee_basis_points: u256) -> u256 {
            math::u256_mul_div(
                assets, fee_basis_points, fee_basis_points + _BASIS_POINT_SCALE, Rounding::Ceil,
            )
        }
    }
}
```

## Interface

The following interface represents the full ABI of the Contracts for Cairo ERC4626Component.
The full interface includes the IERC4626, IERC20, and IERC20Metadata interfaces.
Note that implementing the IERC20Metadata interface is a requirement of IERC4626.

```
#[starknet::interface]
pub trait ERC4626ABI {
    // IERC4626
    fn asset() -> ContractAddress;
    fn total_assets() -> u256;
    fn convert_to_shares(assets: u256) -> u256;
    fn convert_to_assets(shares: u256) -> u256;
    fn max_deposit(receiver: ContractAddress) -> u256;
    fn preview_deposit(assets: u256) -> u256;
    fn deposit(assets: u256, receiver: ContractAddress) -> u256;
    fn max_mint(receiver: ContractAddress) -> u256;
    fn preview_mint(shares: u256) -> u256;
    fn mint(shares: u256, receiver: ContractAddress) -> u256;
    fn max_withdraw(owner: ContractAddress) -> u256;
    fn preview_withdraw(assets: u256) -> u256;
    fn withdraw(
        assets: u256, receiver: ContractAddress, owner: ContractAddress,
    ) -> u256;
    fn max_redeem(owner: ContractAddress) -> u256;
    fn preview_redeem(shares: u256) -> u256;
    fn redeem(
        shares: u256, receiver: ContractAddress, owner: ContractAddress,
    ) -> u256;

    // IERC20
    fn total_supply() -> u256;
    fn balance_of(account: ContractAddress) -> u256;
    fn allowance(owner: ContractAddress, spender: ContractAddress) -> u256;
    fn transfer(recipient: ContractAddress, amount: u256) -> bool;
    fn transfer_from(
        sender: ContractAddress, recipient: ContractAddress, amount: u256,
    ) -> bool;
    fn approve(spender: ContractAddress, amount: u256) -> bool;

    // IERC20Metadata
    fn name() -> ByteArray;
    fn symbol() -> ByteArray;
    fn decimals() -> u8;

    // IERC20CamelOnly
    fn totalSupply() -> u256;
    fn balanceOf(account: ContractAddress) -> u256;
    fn transferFrom(
        sender: ContractAddress, recipient: ContractAddress, amount: u256,
    ) -> bool;
}
```

← API Reference

API Reference →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0-alpha.1/erc721

## ERC721 - OpenZeppelin Docs

You are not reading the current version of this documentation. 2.0.0 is the current version.

# ERC721

The ERC721 token standard is a specification for non-fungible tokens, or more colloquially: NFTs.
`token::erc721::ERC721Component` provides an approximation of EIP-721 in Cairo for Starknet.

## Usage

Using Contracts for Cairo, constructing an ERC721 contract requires integrating both `ERC721Component` and `SRC5Component`.
The contract should also set up the constructor to initialize the token’s name, symbol, and interface support.
Here’s an example of a basic contract:

```
#[starknet::contract]
mod MyNFT {
    use openzeppelin_introspection::src5::SRC5Component;
    use openzeppelin_token::erc721::{ERC721Component, ERC721HooksEmptyImpl};
    use starknet::ContractAddress;

    component!(path: ERC721Component, storage: erc721, event: ERC721Event);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    // ERC721 Mixin
    #[abi(embed_v0)]
    impl ERC721MixinImpl = ERC721Component::ERC721MixinImpl<ContractState>;
    impl ERC721InternalImpl = ERC721Component::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        erc721: ERC721Component::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC721Event: ERC721Component::Event,
        #[flat]
        SRC5Event: SRC5Component::Event
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        recipient: ContractAddress
    ) {
        let name = "MyNFT";
        let symbol = "NFT";
        let base_uri = "https://api.example.com/v1/";
        let token_id = 1;

        self.erc721.initializer(name, symbol, base_uri);
        self.erc721.mint(recipient, token_id);
    }
}
```

## Interface

The following interface represents the full ABI of the Contracts for Cairo ERC721Component.
The interface includes the IERC721 standard interface and the optional IERC721Metadata interface.

To support older token deployments, as mentioned in Dual interfaces, the component also includes implementations of the interface written in camelCase.

```
#[starknet::interface]
pub trait ERC721ABI {
    // IERC721
    fn balance_of(account: ContractAddress) -> u256;
    fn owner_of(token_id: u256) -> ContractAddress;
    fn safe_transfer_from(
        from: ContractAddress,
        to: ContractAddress,
        token_id: u256,
        data: Span<felt252>
    );
    fn transfer_from(from: ContractAddress, to: ContractAddress, token_id: u256);
    fn approve(to: ContractAddress, token_id: u256);
    fn set_approval_for_all(operator: ContractAddress, approved: bool);
    fn get_approved(token_id: u256) -> ContractAddress;
    fn is_approved_for_all(owner: ContractAddress, operator: ContractAddress) -> bool;

    // IERC721Metadata
    fn name() -> ByteArray;
    fn symbol() -> ByteArray;
    fn token_uri(token_id: u256) -> ByteArray;

    // IERC721CamelOnly
    fn balanceOf(account: ContractAddress) -> u256;
    fn ownerOf(tokenId: u256) -> ContractAddress;
    fn safeTransferFrom(
        from: ContractAddress,
        to: ContractAddress,
        tokenId: u256,
        data: Span<felt252>
    );
    fn transferFrom(from: ContractAddress, to: ContractAddress, tokenId: u256);
    fn setApprovalForAll(operator: ContractAddress, approved: bool);
    fn getApproved(tokenId: u256) -> ContractAddress;
    fn isApprovedForAll(owner: ContractAddress, operator: ContractAddress) -> bool;

    // IERC721MetadataCamelOnly
    fn tokenURI(tokenId: u256) -> ByteArray;
}
```

## ERC721 compatibility

Although Starknet is not EVM compatible, this implementation aims to be as close as possible to the ERC721 standard.
This implementation does, however, include a few notable differences such as:

* `interface_id`s are hardcoded and initialized by the constructor.
  The hardcoded values derive from Starknet’s selector calculations.
  See the Introspection docs.
* `safe_transfer_from` can only be expressed as a single function in Cairo as opposed to the two functions declared in EIP721, because function overloading is currently not possible in Cairo.
  The difference between both functions consists of accepting `data` as an argument.
  `safe_transfer_from` by default accepts the `data` argument which is interpreted as `Span<felt252>`.
  If `data` is not used, simply pass an empty array.
* ERC721 utilizes SRC5 to declare and query interface support on Starknet as opposed to Ethereum’s EIP165.
  The design for `SRC5` is similar to OpenZeppelin’s ERC165Storage.
* `IERC721Receiver` compliant contracts return a hardcoded interface ID according to Starknet selectors (as opposed to selector calculation in Solidity).

## Token transfers

This library includes transfer\_from and safe\_transfer\_from to transfer NFTs.
If using `transfer_from`, **the caller is responsible to confirm that the recipient is capable of receiving NFTs or else they may be permanently lost.**
The `safe_transfer_from` method mitigates this risk by querying the recipient contract’s interface support.

|  |  |
| --- | --- |
|  | Usage of `safe_transfer_from` prevents loss, though the caller must understand this adds an external call which potentially creates a reentrancy vulnerability. |

## Receiving tokens

In order to be sure a non-account contract can safely accept ERC721 tokens, said contract must implement the `IERC721Receiver` interface.
The recipient contract must also implement the SRC5 interface which, as described earlier, supports interface introspection.

### IERC721Receiver

```
#[starknet::interface]
pub trait IERC721Receiver {
    fn on_erc721_received(
        operator: ContractAddress,
        from: ContractAddress,
        token_id: u256,
        data: Span<felt252>
    ) -> felt252;
}
```

Implementing the `IERC721Receiver` interface exposes the on\_erc721\_received method.
When safe methods such as safe\_transfer\_from and safe\_mint are called, they invoke the recipient contract’s `on_erc721_received` method which **must** return the IERC721Receiver interface ID.
Otherwise, the transaction will fail.

|  |  |
| --- | --- |
|  | For information on how to calculate interface IDs, see Computing the interface ID. |

### Creating a token receiver contract

The Contracts for Cairo `IERC721ReceiverImpl` already returns the correct interface ID for safe token transfers.
To integrate the `IERC721Receiver` interface into a contract, simply include the ABI embed directive to the implementation and add the `initializer` in the contract’s constructor.
Here’s an example of a simple token receiver contract:

```
#[starknet::contract]
mod MyTokenReceiver {
    use openzeppelin_introspection::src5::SRC5Component;
    use openzeppelin_token::erc721::ERC721ReceiverComponent;
    use starknet::ContractAddress;

    component!(path: ERC721ReceiverComponent, storage: erc721_receiver, event: ERC721ReceiverEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    // ERC721Receiver Mixin
    #[abi(embed_v0)]
    impl ERC721ReceiverMixinImpl = ERC721ReceiverComponent::ERC721ReceiverMixinImpl<ContractState>;
    impl ERC721ReceiverInternalImpl = ERC721ReceiverComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        erc721_receiver: ERC721ReceiverComponent::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC721ReceiverEvent: ERC721ReceiverComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event
    }

    #[constructor]
    fn constructor(ref self: ContractState) {
        self.erc721_receiver.initializer();
    }
}
```

## Storing ERC721 URIs

Token URIs were previously stored as single field elements prior to Cairo v0.2.5.
ERC721Component now stores only the base URI as a `ByteArray` and the full token URI is returned as the `ByteArray` concatenation of the base URI and the token ID through the token\_uri method.
This design mirrors OpenZeppelin’s default Solidity implementation for ERC721.

← API Reference

API Reference →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0-alpha.1/finance

## Finance - OpenZeppelin Docs

You are not reading the current version of this documentation. 2.0.0 is the current version.

# Finance

This module includes primitives for financial systems.

## Vesting component

The VestingComponent manages the gradual release of ERC-20 tokens to a designated beneficiary based on a predefined vesting schedule.
The implementing contract must implement the OwnableComponent, where the contract owner is regarded as the vesting beneficiary.
This structure allows ownership rights of both the contract and the vested tokens to be assigned and transferred.

|  |  |
| --- | --- |
|  | Any assets transferred to this contract will follow the vesting schedule as if they were locked from the beginning of the vesting period. As a result, if the vesting has already started, a portion of the newly transferred tokens may become immediately releasable. |

|  |  |
| --- | --- |
|  | By setting the duration to 0, it’s possible to configure this contract to behave like an asset timelock that holds tokens for a beneficiary until a specified date. |

### Vesting schedule

The VestingSchedule trait defines the logic for calculating the vested amount based on a given timestamp. This
logic is not part of the VestingComponent, so any contract implementing the VestingComponent must provide its own
implementation of the VestingSchedule trait.

|  |  |
| --- | --- |
|  | There’s a ready-made implementation of the VestingSchedule trait available named LinearVestingSchedule. It incorporates a cliff period by returning 0 vested amount until the cliff ends. After the cliff, the vested amount is calculated as directly proportional to the time elapsed since the beginning of the vesting schedule. |

### Usage

The contract must integrate VestingComponent and OwnableComponent as dependencies. The contract’s constructor
should initialize both components. Core vesting parameters, such as `beneficiary`, `start`, `duration`
and `cliff_duration`, are passed as arguments to the constructor and set at the time of deployment.

The implementing contract must provide an implementation of the VestingSchedule trait. This can be achieved either by importing
a ready-made LinearVestingSchedule implementation or by defining a custom one.

Here’s an example of a simple vesting wallet contract with a LinearVestingSchedule, where the vested amount
is calculated as being directly proportional to the time elapsed since the start of the vesting period.

```
#[starknet::contract]
mod LinearVestingWallet {
    use openzeppelin_access::ownable::OwnableComponent;
    use openzeppelin_finance::vesting::{VestingComponent, LinearVestingSchedule};
    use starknet::ContractAddress;

    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);
    component!(path: VestingComponent, storage: vesting, event: VestingEvent);

    #[abi(embed_v0)]
    impl OwnableMixinImpl = OwnableComponent::OwnableMixinImpl<ContractState>;
    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;

    #[abi(embed_v0)]
    impl VestingImpl = VestingComponent::VestingImpl<ContractState>;
    impl VestingInternalImpl = VestingComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
        #[substorage(v0)]
        vesting: VestingComponent::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        OwnableEvent: OwnableComponent::Event,
        #[flat]
        VestingEvent: VestingComponent::Event
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        beneficiary: ContractAddress,
        start: u64,
        duration: u64,
        cliff_duration: u64
    ) {
        self.ownable.initializer(beneficiary);
        self.vesting.initializer(start, duration, cliff_duration);
    }
}
```

A vesting schedule will often follow a custom formula. In such cases, the VestingSchedule trait is useful.
To support a custom vesting schedule, the contract must provide an implementation of the
calculate\_vested\_amount function based on the desired formula.

|  |  |
| --- | --- |
|  | When using a custom VestingSchedule implementation, the LinearVestingSchedule must be excluded from the imports. |

|  |  |
| --- | --- |
|  | If there are additional parameters required for calculations, which are stored in the contract’s storage, you can access them using `self.get_contract()`. |

Here’s an example of a vesting wallet contract with a custom VestingSchedule implementation, where tokens
are vested in a number of steps.

```
#[starknet::contract]
mod StepsVestingWallet {
    use openzeppelin_access::ownable::OwnableComponent;
    use openzeppelin_finance::vesting::VestingComponent::VestingScheduleTrait;
    use openzeppelin_finance::vesting::VestingComponent;
    use starknet::ContractAddress;
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};

    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);
    component!(path: VestingComponent, storage: vesting, event: VestingEvent);

    #[abi(embed_v0)]
    impl OwnableMixinImpl = OwnableComponent::OwnableMixinImpl<ContractState>;
    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;

    #[abi(embed_v0)]
    impl VestingImpl = VestingComponent::VestingImpl<ContractState>;
    impl VestingInternalImpl = VestingComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        total_steps: u64,
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
        #[substorage(v0)]
        vesting: VestingComponent::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        OwnableEvent: OwnableComponent::Event,
        #[flat]
        VestingEvent: VestingComponent::Event
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        total_steps: u64,
        beneficiary: ContractAddress,
        start: u64,
        duration: u64,
        cliff: u64,
    ) {
        self.total_steps.write(total_steps);
        self.ownable.initializer(beneficiary);
        self.vesting.initializer(start, duration, cliff);
    }

    impl VestingSchedule of VestingScheduleTrait<ContractState> {
        fn calculate_vested_amount(
            self: @VestingComponent::ComponentState<ContractState>,
            token: ContractAddress,
            total_allocation: u256,
            timestamp: u64,
            start: u64,
            duration: u64,
            cliff: u64,
        ) -> u256 {
            if timestamp < cliff {
                0
            } else if timestamp >= start + duration {
                total_allocation
            } else {
                let total_steps = self.get_contract().total_steps.read();
                let vested_per_step = total_allocation / total_steps.into();
                let step_duration = duration / total_steps;
                let current_step = (timestamp - start) / step_duration;
                let vested_amount = vested_per_step * current_step.into();
                vested_amount
            }
        }
    }
}
```

### Interface

Here is the full interface of a standard contract implementing the vesting functionality:

```
#[starknet::interface]
pub trait VestingABI<TState> {
    // IVesting
    fn start(self: @TState) -> u64;
    fn cliff(self: @TState) -> u64;
    fn duration(self: @TState) -> u64;
    fn end(self: @TState) -> u64;
    fn released(self: @TState, token: ContractAddress) -> u256;
    fn releasable(self: @TState, token: ContractAddress) -> u256;
    fn vested_amount(self: @TState, token: ContractAddress, timestamp: u64) -> u256;
    fn release(ref self: TState, token: ContractAddress) -> u256;

    // IOwnable
    fn owner(self: @TState) -> ContractAddress;
    fn transfer_ownership(ref self: TState, new_owner: ContractAddress);
    fn renounce_ownership(ref self: TState);

    // IOwnableCamelOnly
    fn transferOwnership(ref self: TState, newOwner: ContractAddress);
    fn renounceOwnership(ref self: TState);
}
```

← API Reference

API Reference →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0-alpha.1/governance/governor

## Governor - OpenZeppelin Docs

You are not reading the current version of this documentation. 2.0.0 is the current version.

# Governor

Decentralized protocols are in constant evolution from the moment they are publicly released. Often,
the initial team retains control of this evolution in the first stages, but eventually delegates it
to a community of stakeholders. The process by which this community makes decisions is called
on-chain governance, and it has become a central component of decentralized protocols, fueling
varied decisions such as parameter tweaking, smart contract upgrades, integrations with other
protocols, treasury management, grants, etc.

This governance protocol is generally implemented in a special-purpose contract called “Governor”. In
OpenZeppelin Contracts for Cairo, we set out to build a modular system of Governor components where different
requirements can be accommodated by implementing specific traits. You will find the most common requirements out of the box,
but writing additional ones is simple, and we will be adding new features as requested by the community in future releases.

## Usage and setup

### Token

The voting power of each account in our governance setup will be determined by an ERC20 or an ERC721 token. The token has
to implement the VotesComponent extension. This extension will keep track of historical balances so that voting power
is retrieved from past snapshots rather than current balance, which is an important protection that prevents double voting.

If your project already has a live token that does not include Votes and is not upgradeable, you can wrap it in a
governance token by using a wrapper. This will allow token holders to participate in governance by wrapping their tokens 1-to-1.

|  |  |
| --- | --- |
|  | The library currently does not include a wrapper for tokens, but it will be added in a future release. |

|  |  |
| --- | --- |
|  | Currently, the clock mode is fixed to block timestamps, since the Votes component uses the block timestamp to track checkpoints. We plan to add support for more flexible clock modes in Votes in a future release, allowing to use, for example, block numbers instead. |

### Governor

We will initially build a Governor without a timelock. The core logic is given by the GovernorComponent, but we
still need to choose:

1) how voting power is determined,

2) how many votes are needed for quorum,

3) what options people have when casting a vote and how those votes are counted, and

4) the execution mechanism that should be used.

Each of these aspects is customizable by writing your own extensions,
or more easily choosing one from the library.

**For 1)** we will use the GovernorVotes extension, which hooks to an IVotes instance to determine the voting power
of an account based on the token balance they hold when a proposal becomes active.
This module requires the address of the token to be passed as an argument to the initializer.

**For 2)** we will use GovernorVotesQuorumFraction. This works together with the IVotes instance to define the quorum as a
percentage of the total supply at the block when a proposal’s voting power is retrieved. This requires an initializer
parameter to set the percentage besides the votes token address. Most Governors nowadays use 4%. Since the quorum denominator
is 1000 for precision, we initialize the module with a numerator of 40, resulting in a 4% quorum (40/1000 = 0.04 or 4%).

**For 3)** we will use GovernorCountingSimple, an extension that offers 3 options to voters: For, Against, and Abstain,
and where only For and Abstain votes are counted towards quorum.

**For 4)** we will use GovernorCoreExecution, an extension that allows proposal execution directly through the governor.

|  |  |
| --- | --- |
|  | Another option is GovernorTimelockExecution. An example can be found in the next section. |

Besides these, we also need an implementation for the GovernorSettingsTrait defining the voting delay, voting period,
and proposal threshold. While we can use the GovernorSettings extension which allows to set these parameters by the
governor itself, we will implement the trait locally in the contract and set the voting delay, voting period,
and proposal threshold as constant values.

*voting\_delay*: How long after a proposal is created should voting power be fixed. A large voting delay gives
users time to unstake tokens if necessary.

*voting\_period*: How long does a proposal remain open to votes.

|  |  |
| --- | --- |
|  | These parameters are specified in the unit defined in the token’s clock, which is for now always timestamps. |

*proposal\_threshold*: This restricts proposal creation to accounts who have enough voting power.

An implementation of `GovernorComponent::ImmutableConfig` is also required. For the example below, we have used
the `DefaultConfig`. Check the Immutable Component Config guide for more details.

The last missing step is to add an `SNIP12Metadata` implementation used to retrieve the name and version of the governor.

```
#[starknet::contract]
mod MyGovernor {
    use openzeppelin_governance::governor::GovernorComponent::InternalTrait as GovernorInternalTrait;
    use openzeppelin_governance::governor::extensions::GovernorVotesQuorumFractionComponent::InternalTrait;
    use openzeppelin_governance::governor::extensions::{
        GovernorVotesQuorumFractionComponent, GovernorCountingSimpleComponent,
        GovernorCoreExecutionComponent,
    };
    use openzeppelin_governance::governor::{GovernorComponent, DefaultConfig};
    use openzeppelin_introspection::src5::SRC5Component;
    use openzeppelin_utils::cryptography::snip12::SNIP12Metadata;
    use starknet::ContractAddress;

    pub const VOTING_DELAY: u64 = 86400; // 1 day
    pub const VOTING_PERIOD: u64 = 604800; // 1 week
    pub const PROPOSAL_THRESHOLD: u256 = 10;
    pub const QUORUM_NUMERATOR: u256 = 40; // 4%

    component!(path: GovernorComponent, storage: governor, event: GovernorEvent);
    component!(
        path: GovernorVotesQuorumFractionComponent,
        storage: governor_votes,
        event: GovernorVotesEvent
    );
    component!(
        path: GovernorCountingSimpleComponent,
        storage: governor_counting_simple,
        event: GovernorCountingSimpleEvent
    );
    component!(
        path: GovernorCoreExecutionComponent,
        storage: governor_core_execution,
        event: GovernorCoreExecutionEvent
    );
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    // Governor
    #[abi(embed_v0)]
    impl GovernorImpl = GovernorComponent::GovernorImpl<ContractState>;

    // Extensions external
    #[abi(embed_v0)]
    impl QuorumFractionImpl =
        GovernorVotesQuorumFractionComponent::QuorumFractionImpl<ContractState>;

    // Extensions internal
    impl GovernorQuorumImpl = GovernorVotesQuorumFractionComponent::GovernorQuorum<ContractState>;
    impl GovernorVotesImpl = GovernorVotesQuorumFractionComponent::GovernorVotes<ContractState>;
    impl GovernorCountingSimpleImpl =
        GovernorCountingSimpleComponent::GovernorCounting<ContractState>;
    impl GovernorCoreExecutionImpl =
        GovernorCoreExecutionComponent::GovernorExecution<ContractState>;

    // SRC5
    #[abi(embed_v0)]
    impl SRC5Impl = SRC5Component::SRC5Impl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        pub governor: GovernorComponent::Storage,
        #[substorage(v0)]
        pub governor_votes: GovernorVotesQuorumFractionComponent::Storage,
        #[substorage(v0)]
        pub governor_counting_simple: GovernorCountingSimpleComponent::Storage,
        #[substorage(v0)]
        pub governor_core_execution: GovernorCoreExecutionComponent::Storage,
        #[substorage(v0)]
        pub src5: SRC5Component::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        GovernorEvent: GovernorComponent::Event,
        #[flat]
        GovernorVotesEvent: GovernorVotesQuorumFractionComponent::Event,
        #[flat]
        GovernorCountingSimpleEvent: GovernorCountingSimpleComponent::Event,
        #[flat]
        GovernorCoreExecutionEvent: GovernorCoreExecutionComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
    }

    #[constructor]
    fn constructor(ref self: ContractState, votes_token: ContractAddress) {
        self.governor.initializer();
        self.governor_votes.initializer(votes_token, QUORUM_NUMERATOR);
    }

    //
    // SNIP12 Metadata
    //

    pub impl SNIP12MetadataImpl of SNIP12Metadata {
        fn name() -> felt252 {
            'DAPP_NAME'
        }

        fn version() -> felt252 {
            'DAPP_VERSION'
        }
    }

    //
    // Locally implemented extensions
    //

    pub impl GovernorSettings of GovernorComponent::GovernorSettingsTrait<ContractState> {
        /// See `GovernorComponent::GovernorSettingsTrait::voting_delay`.
        fn voting_delay(self: @GovernorComponent::ComponentState<ContractState>) -> u64 {
            VOTING_DELAY
        }

        /// See `GovernorComponent::GovernorSettingsTrait::voting_period`.
        fn voting_period(self: @GovernorComponent::ComponentState<ContractState>) -> u64 {
            VOTING_PERIOD
        }

        /// See `GovernorComponent::GovernorSettingsTrait::proposal_threshold`.
        fn proposal_threshold(self: @GovernorComponent::ComponentState<ContractState>) -> u256 {
            PROPOSAL_THRESHOLD
        }
    }
}
```

### Timelock

It is good practice to add a timelock to governance decisions. This allows users to exit the system if they disagree
with a decision before it is executed. We will use OpenZeppelin’s TimelockController in combination with the
GovernorTimelockExecution extension.

|  |  |
| --- | --- |
|  | When using a timelock, it is the timelock that will execute proposals and thus the timelock that should hold any funds, ownership, and access control roles. |

TimelockController uses an AccessControl setup that we need to understand in order to set up roles.

The Proposer role is in charge of queueing operations: this is the role the Governor instance must be granted,
and it MUST be the only proposer (and canceller) in the system.

The Executor role is in charge of executing already available operations: we can assign this role to the special
zero address to allow anyone to execute (if operations can be particularly time sensitive, the Governor should be made Executor instead).

The Canceller role is in charge of canceling operations: the Governor instance must be granted this role,
and it MUST be the only canceller in the system.

Lastly, there is the Admin role, which can grant and revoke the two previous roles: this is a very sensitive role that will be granted automatically to the timelock itself, and optionally to a second account, which can be used for ease of setup but should promptly renounce the role.

The following example uses the GovernorTimelockExecution extension, together with GovernorSettings, and uses a
fixed quorum value instead of a percentage:

```
#[starknet::contract]
pub mod MyTimelockedGovernor {
    use openzeppelin_governance::governor::GovernorComponent::InternalTrait as GovernorInternalTrait;
    use openzeppelin_governance::governor::extensions::GovernorSettingsComponent::InternalTrait as GovernorSettingsInternalTrait;
    use openzeppelin_governance::governor::extensions::GovernorTimelockExecutionComponent::InternalTrait as GovernorTimelockExecutionInternalTrait;
    use openzeppelin_governance::governor::extensions::GovernorVotesComponent::InternalTrait as GovernorVotesInternalTrait;
    use openzeppelin_governance::governor::extensions::{
        GovernorVotesComponent, GovernorSettingsComponent, GovernorCountingSimpleComponent,
        GovernorTimelockExecutionComponent
    };
    use openzeppelin_governance::governor::{GovernorComponent, DefaultConfig};
    use openzeppelin_introspection::src5::SRC5Component;
    use openzeppelin_utils::cryptography::snip12::SNIP12Metadata;
    use starknet::ContractAddress;

    pub const VOTING_DELAY: u64 = 86400; // 1 day
    pub const VOTING_PERIOD: u64 = 604800; // 1 week
    pub const PROPOSAL_THRESHOLD: u256 = 10;
    pub const QUORUM: u256 = 100_000_000;

    component!(path: GovernorComponent, storage: governor, event: GovernorEvent);
    component!(path: GovernorVotesComponent, storage: governor_votes, event: GovernorVotesEvent);
    component!(
        path: GovernorSettingsComponent, storage: governor_settings, event: GovernorSettingsEvent
    );
    component!(
        path: GovernorCountingSimpleComponent,
        storage: governor_counting_simple,
        event: GovernorCountingSimpleEvent
    );
    component!(
        path: GovernorTimelockExecutionComponent,
        storage: governor_timelock_execution,
        event: GovernorTimelockExecutionEvent
    );
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    // Governor
    #[abi(embed_v0)]
    impl GovernorImpl = GovernorComponent::GovernorImpl<ContractState>;

    // Extensions external
    #[abi(embed_v0)]
    impl VotesTokenImpl = GovernorVotesComponent::VotesTokenImpl<ContractState>;
    #[abi(embed_v0)]
    impl GovernorSettingsAdminImpl =
        GovernorSettingsComponent::GovernorSettingsAdminImpl<ContractState>;
    #[abi(embed_v0)]
    impl TimelockedImpl =
        GovernorTimelockExecutionComponent::TimelockedImpl<ContractState>;

    // Extensions internal
    impl GovernorVotesImpl = GovernorVotesComponent::GovernorVotes<ContractState>;
    impl GovernorSettingsImpl = GovernorSettingsComponent::GovernorSettings<ContractState>;
    impl GovernorCountingSimpleImpl =
        GovernorCountingSimpleComponent::GovernorCounting<ContractState>;
    impl GovernorTimelockExecutionImpl =
        GovernorTimelockExecutionComponent::GovernorExecution<ContractState>;

    // SRC5
    #[abi(embed_v0)]
    impl SRC5Impl = SRC5Component::SRC5Impl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        pub governor: GovernorComponent::Storage,
        #[substorage(v0)]
        pub governor_votes: GovernorVotesComponent::Storage,
        #[substorage(v0)]
        pub governor_settings: GovernorSettingsComponent::Storage,
        #[substorage(v0)]
        pub governor_counting_simple: GovernorCountingSimpleComponent::Storage,
        #[substorage(v0)]
        pub governor_timelock_execution: GovernorTimelockExecutionComponent::Storage,
        #[substorage(v0)]
        pub src5: SRC5Component::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        GovernorEvent: GovernorComponent::Event,
        #[flat]
        GovernorVotesEvent: GovernorVotesComponent::Event,
        #[flat]
        GovernorSettingsEvent: GovernorSettingsComponent::Event,
        #[flat]
        GovernorCountingSimpleEvent: GovernorCountingSimpleComponent::Event,
        #[flat]
        GovernorTimelockExecutionEvent: GovernorTimelockExecutionComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState, votes_token: ContractAddress, timelock_controller: ContractAddress
    ) {
        self.governor.initializer();
        self.governor_votes.initializer(votes_token);
        self.governor_settings.initializer(VOTING_DELAY, VOTING_PERIOD, PROPOSAL_THRESHOLD);
        self.governor_timelock_execution.initializer(timelock_controller);
    }

    //
    // SNIP12 Metadata
    //

    pub impl SNIP12MetadataImpl of SNIP12Metadata {
        fn name() -> felt252 {
            'DAPP_NAME'
        }

        fn version() -> felt252 {
            'DAPP_VERSION'
        }
    }

    //
    // Locally implemented extensions
    //

    impl GovernorQuorum of GovernorComponent::GovernorQuorumTrait<ContractState> {
        /// See `GovernorComponent::GovernorQuorumTrait::quorum`.
        fn quorum(self: @GovernorComponent::ComponentState<ContractState>, timepoint: u64) -> u256 {
            QUORUM
        }
    }
}
```

## Interface

This is the full interface of the `Governor` implementation:

```
#[starknet::interface]
pub trait IGovernor<TState> {
    fn name(self: @TState) -> felt252;
    fn version(self: @TState) -> felt252;
    fn COUNTING_MODE(self: @TState) -> ByteArray;
    fn hash_proposal(self: @TState, calls: Span<Call>, description_hash: felt252) -> felt252;
    fn state(self: @TState, proposal_id: felt252) -> ProposalState;
    fn proposal_threshold(self: @TState) -> u256;
    fn proposal_snapshot(self: @TState, proposal_id: felt252) -> u64;
    fn proposal_deadline(self: @TState, proposal_id: felt252) -> u64;
    fn proposal_proposer(self: @TState, proposal_id: felt252) -> ContractAddress;
    fn proposal_eta(self: @TState, proposal_id: felt252) -> u64;
    fn proposal_needs_queuing(self: @TState, proposal_id: felt252) -> bool;
    fn voting_delay(self: @TState) -> u64;
    fn voting_period(self: @TState) -> u64;
    fn quorum(self: @TState, timepoint: u64) -> u256;
    fn get_votes(self: @TState, account: ContractAddress, timepoint: u64) -> u256;
    fn get_votes_with_params(
        self: @TState, account: ContractAddress, timepoint: u64, params: Span<felt252>
    ) -> u256;
    fn has_voted(self: @TState, proposal_id: felt252, account: ContractAddress) -> bool;
    fn propose(ref self: TState, calls: Span<Call>, description: ByteArray) -> felt252;
    fn queue(ref self: TState, calls: Span<Call>, description_hash: felt252) -> felt252;
    fn execute(ref self: TState, calls: Span<Call>, description_hash: felt252) -> felt252;
    fn cancel(ref self: TState, calls: Span<Call>, description_hash: felt252) -> felt252;
    fn cast_vote(ref self: TState, proposal_id: felt252, support: u8) -> u256;
    fn cast_vote_with_reason(
        ref self: TState, proposal_id: felt252, support: u8, reason: ByteArray
    ) -> u256;
    fn cast_vote_with_reason_and_params(
        ref self: TState,
        proposal_id: felt252,
        support: u8,
        reason: ByteArray,
        params: Span<felt252>
    ) -> u256;
    fn cast_vote_by_sig(
        ref self: TState,
        proposal_id: felt252,
        support: u8,
        voter: ContractAddress,
        signature: Span<felt252>
    ) -> u256;
    fn cast_vote_with_reason_and_params_by_sig(
        ref self: TState,
        proposal_id: felt252,
        support: u8,
        voter: ContractAddress,
        reason: ByteArray,
        params: Span<felt252>,
        signature: Span<felt252>
    ) -> u256;
    fn nonces(self: @TState, voter: ContractAddress) -> felt252;
    fn relay(ref self: TState, call: Call);
}
```

← API Reference

Multisig →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0-alpha.1/governance/multisig

## Multisig - OpenZeppelin Docs

You are not reading the current version of this documentation. 2.0.0 is the current version.

# Multisig

The Multisig component implements a multi-signature mechanism to enhance the security and
governance of smart contract transactions. It ensures that no single signer can unilaterally
execute critical actions, requiring multiple registered signers to approve and collectively
execute transactions.

This component is designed to secure operations such as fund management or protocol governance,
where collective decision-making is essential. The Multisig Component is self-administered,
meaning that changes to signers or quorum must be approved through the multisig process itself.

## Key features

* **Multi-Signature Security**: transactions must be approved by multiple signers, ensuring
  distributed governance.
* **Quorum Enforcement**: defines the minimum number of approvals required for transaction execution.
* **Self-Administration**: all modifications to the component (e.g., adding or removing signers)
  must pass through the multisig process.
* **Event Logging**: provides comprehensive event logging for transparency and auditability.

## Signer management

The Multisig component introduces the concept of signers and quorum:

* **Signers**: only registered signers can submit, confirm, revoke, or execute transactions. The Multisig
  Component supports adding, removing, or replacing signers.
* **Quorum**: the quorum defines the minimum number of confirmations required to approve a transaction.

|  |  |
| --- | --- |
|  | To prevent unauthorized modifications, only the contract itself can add, remove, or replace signers or change the quorum. This ensures that all modifications pass through the multisig approval process. |

## Transaction lifecycle

The state of a transaction is represented by the `TransactionState` enum and can be retrieved
by calling the `get_transaction_state` function with the transaction’s identifier.

The identifier of a multisig transaction is a `felt252` value, computed as the Pedersen hash
of the transaction’s calls and salt. It can be computed by invoking the implementing contract’s
`hash_transaction` method for single-call transactions or `hash_transaction_batch` for multi-call
transactions. Submitting a transaction with identical calls and the same salt value a second time
will fail, as transaction identifiers must be unique. To resolve this, use a different salt value
to generate a unique identifier.

A transaction in the Multisig component follows a specific lifecycle:

`NotFound` → `Pending` → `Confirmed` → `Executed`

* **NotFound**: the transaction does not exist.
* **Pending**: the transaction exists but has not reached the required confirmations.
* **Confirmed**: the transaction has reached the quorum but has not yet been executed.
* **Executed**: the transaction has been successfully executed.

## Usage

Integrating the Multisig functionality into a contract requires implementing MultisigComponent.
The contract’s constructor should initialize the component with a quorum value and a list of initial signers.

Here’s an example of a simple wallet contract featuring the Multisig functionality:

```
#[starknet::contract]
mod MultisigWallet {
    use openzeppelin_governance::multisig::MultisigComponent;
    use starknet::ContractAddress;

    component!(path: MultisigComponent, storage: multisig, event: MultisigEvent);

    #[abi(embed_v0)]
    impl MultisigImpl = MultisigComponent::MultisigImpl<ContractState>;
    impl MultisigInternalImpl = MultisigComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        multisig: MultisigComponent::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        MultisigEvent: MultisigComponent::Event,
    }

    #[constructor]
    fn constructor(ref self: ContractState, quorum: u32, signers: Span<ContractAddress>) {
        self.multisig.initializer(quorum, signers);
    }
}
```

## Interface

This is the interface of a contract implementing the MultisigComponent:

```
#[starknet::interface]
pub trait MultisigABI<TState> {
    // Read functions
    fn get_quorum(self: @TState) -> u32;
    fn is_signer(self: @TState, signer: ContractAddress) -> bool;
    fn get_signers(self: @TState) -> Span<ContractAddress>;
    fn is_confirmed(self: @TState, id: TransactionID) -> bool;
    fn is_confirmed_by(self: @TState, id: TransactionID, signer: ContractAddress) -> bool;
    fn is_executed(self: @TState, id: TransactionID) -> bool;
    fn get_submitted_block(self: @TState, id: TransactionID) -> u64;
    fn get_transaction_state(self: @TState, id: TransactionID) -> TransactionState;
    fn get_transaction_confirmations(self: @TState, id: TransactionID) -> u32;
    fn hash_transaction(
        self: @TState,
        to: ContractAddress,
        selector: felt252,
        calldata: Span<felt252>,
        salt: felt252,
    ) -> TransactionID;
    fn hash_transaction_batch(self: @TState, calls: Span<Call>, salt: felt252) -> TransactionID;

    // Write functions
    fn add_signers(ref self: TState, new_quorum: u32, signers_to_add: Span<ContractAddress>);
    fn remove_signers(ref self: TState, new_quorum: u32, signers_to_remove: Span<ContractAddress>);
    fn replace_signer(
        ref self: TState, signer_to_remove: ContractAddress, signer_to_add: ContractAddress,
    );
    fn change_quorum(ref self: TState, new_quorum: u32);
    fn submit_transaction(
        ref self: TState,
        to: ContractAddress,
        selector: felt252,
        calldata: Span<felt252>,
        salt: felt252,
    ) -> TransactionID;
    fn submit_transaction_batch(
        ref self: TState, calls: Span<Call>, salt: felt252,
    ) -> TransactionID;
    fn confirm_transaction(ref self: TState, id: TransactionID);
    fn revoke_confirmation(ref self: TState, id: TransactionID);
    fn execute_transaction(
        ref self: TState,
        to: ContractAddress,
        selector: felt252,
        calldata: Span<felt252>,
        salt: felt252,
    );
    fn execute_transaction_batch(ref self: TState, calls: Span<Call>, salt: felt252);
}
```

← Governor

Timelock Controller →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0-alpha.1/governance/timelock

## Timelock Controller - OpenZeppelin Docs

You are not reading the current version of this documentation. 2.0.0 is the current version.

# Timelock Controller

The Timelock Controller provides a means of enforcing time delays on the execution of transactions. This is considered good practice regarding governance systems because it allows users the opportunity to exit the system if they disagree with a decision before it is executed.

|  |  |
| --- | --- |
|  | The Timelock contract itself executes transactions, not the user. The Timelock should, therefore, hold associated funds, ownership, and access control roles. |

## Operation lifecycle

The state of an operation is represented by the `OperationState` enum and can be retrieved
by calling the `get_operation_state` function with the operation’s identifier.

The identifier of an operation is a `felt252` value, computed as the Pedersen hash of the
operation’s call or calls, its predecessor, and salt. It can be computed by invoking the
implementing contract’s `hash_operation` function for single-call operations or
`hash_operation_batch` for multi-call operations. Submitting an operation with identical calls,
predecessor, and the same salt value a second time will fail, as operation identifiers must be
unique. To resolve this, use a different salt value to generate a unique identifier.

Timelocked operations follow a specific lifecycle:

`Unset` → `Waiting` → `Ready` → `Done`

* `Unset`: the operation has not been scheduled or has been canceled.
* `Waiting`: the operation has been scheduled and is pending the scheduled delay.
* `Ready`: the timer has expired, and the operation is eligible for execution.
* `Done`: the operation has been executed.

## Timelock flow

### Schedule

When a proposer calls schedule, the `OperationState` moves from `Unset` to `Waiting`.
This starts a timer that must be greater than or equal to the minimum delay.
The timer expires at a timestamp accessible through get\_timestamp.
Once the timer expires, the `OperationState` automatically moves to the `Ready` state.
At this point, it can be executed.

### Execute

By calling execute, an executor triggers the operation’s underlying transactions and moves it to the `Done` state. If the operation has a predecessor, the predecessor’s operation must be in the `Done` state for this transaction to succeed.

### Cancel

The cancel function allows cancellers to cancel any pending operations.
This resets the operation to the `Unset` state.
It is therefore possible for a proposer to re-schedule an operation that has been cancelled.
In this case, the timer restarts when the operation is re-scheduled.

### Roles

TimelockControllerComponent leverages an AccessControlComponent setup that we need to understand in order to set up roles.

* `PROPOSER_ROLE` - in charge of queueing operations.
* `CANCELLER_ROLE` - may cancel scheduled operations.
  During initialization, accounts granted with `PROPOSER_ROLE` will also be granted `CANCELLER_ROLE`.
  Therefore, the initial proposers may also cancel operations after they are scheduled.
* `EXECUTOR_ROLE` - in charge of executing already available operations.
* `DEFAULT_ADMIN_ROLE` - can grant and revoke the three previous roles.

|  |  |
| --- | --- |
|  | The `DEFAULT_ADMIN_ROLE` is a sensitive role that will be granted automatically to the timelock itself and optionally to a second account. The latter case may be required to ease a contract’s initial configuration; however, this role should promptly be renounced. |

Furthermore, the timelock component supports the concept of open roles for the `EXECUTOR_ROLE`.
This allows anyone to execute an operation once it’s in the `Ready` OperationState.
To enable the `EXECUTOR_ROLE` to be open, grant the zero address with the `EXECUTOR_ROLE`.

|  |  |
| --- | --- |
|  | Be very careful with enabling open roles as *anyone* can call the function. |

### Minimum delay

The minimum delay of the timelock acts as a buffer from when a proposer schedules an operation to the earliest point at which an executor may execute that operation.
The idea is for users, should they disagree with a scheduled proposal, to have options such as exiting the system or making their case for cancellers to cancel the operation.

After initialization, the only way to change the timelock’s minimum delay is to schedule it and execute it with the same flow as any other operation.

The minimum delay of a contract is accessible through get\_min\_delay.

### Usage

Integrating the timelock into a contract requires integrating TimelockControllerComponent as well as SRC5Component and AccessControlComponent as dependencies.
The contract’s constructor should initialize the timelock which consists of setting the:

* Proposers and executors.
* Minimum delay between scheduling and executing an operation.
* Optional admin if additional configuration is required.

|  |  |
| --- | --- |
|  | The optional admin should renounce their role once configuration is complete. |

Here’s an example of a simple timelock contract:

```
#[starknet::contract]
mod TimelockControllerContract {
    use openzeppelin_access::accesscontrol::AccessControlComponent;
    use openzeppelin_governance::timelock::TimelockControllerComponent;
    use openzeppelin_introspection::src5::SRC5Component;
    use starknet::ContractAddress;

    component!(path: AccessControlComponent, storage: access_control, event: AccessControlEvent);
    component!(path: TimelockControllerComponent, storage: timelock, event: TimelockEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    // Timelock Mixin
    #[abi(embed_v0)]
    impl TimelockMixinImpl =
        TimelockControllerComponent::TimelockMixinImpl<ContractState>;
    impl TimelockInternalImpl = TimelockControllerComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        access_control: AccessControlComponent::Storage,
        #[substorage(v0)]
        timelock: TimelockControllerComponent::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        AccessControlEvent: AccessControlComponent::Event,
        #[flat]
        TimelockEvent: TimelockControllerComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        min_delay: u64,
        proposers: Span<ContractAddress>,
        executors: Span<ContractAddress>,
        admin: ContractAddress
    ) {
        self.timelock.initializer(min_delay, proposers, executors, admin);
    }
}
```

### Interface

This is the full interface of the TimelockMixinImpl implementation:

```
#[starknet::interface]
pub trait TimelockABI<TState> {
    // ITimelock
    fn is_operation(self: @TState, id: felt252) -> bool;
    fn is_operation_pending(self: @TState, id: felt252) -> bool;
    fn is_operation_ready(self: @TState, id: felt252) -> bool;
    fn is_operation_done(self: @TState, id: felt252) -> bool;
    fn get_timestamp(self: @TState, id: felt252) -> u64;
    fn get_operation_state(self: @TState, id: felt252) -> OperationState;
    fn get_min_delay(self: @TState) -> u64;
    fn hash_operation(self: @TState, call: Call, predecessor: felt252, salt: felt252) -> felt252;
    fn hash_operation_batch(
        self: @TState, calls: Span<Call>, predecessor: felt252, salt: felt252
    ) -> felt252;
    fn schedule(ref self: TState, call: Call, predecessor: felt252, salt: felt252, delay: u64);
    fn schedule_batch(
        ref self: TState, calls: Span<Call>, predecessor: felt252, salt: felt252, delay: u64
    );
    fn cancel(ref self: TState, id: felt252);
    fn execute(ref self: TState, call: Call, predecessor: felt252, salt: felt252);
    fn execute_batch(ref self: TState, calls: Span<Call>, predecessor: felt252, salt: felt252);
    fn update_delay(ref self: TState, new_delay: u64);

    // ISRC5
    fn supports_interface(self: @TState, interface_id: felt252) -> bool;

    // IAccessControl
    fn has_role(self: @TState, role: felt252, account: ContractAddress) -> bool;
    fn get_role_admin(self: @TState, role: felt252) -> felt252;
    fn grant_role(ref self: TState, role: felt252, account: ContractAddress);
    fn revoke_role(ref self: TState, role: felt252, account: ContractAddress);
    fn renounce_role(ref self: TState, role: felt252, account: ContractAddress);

    // IAccessControlCamel
    fn hasRole(self: @TState, role: felt252, account: ContractAddress) -> bool;
    fn getRoleAdmin(self: @TState, role: felt252) -> felt252;
    fn grantRole(ref self: TState, role: felt252, account: ContractAddress);
    fn revokeRole(ref self: TState, role: felt252, account: ContractAddress);
    fn renounceRole(ref self: TState, role: felt252, account: ContractAddress);
}
```

← Multisig

Votes →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0-alpha.1/governance/votes

## Votes - OpenZeppelin Docs

You are not reading the current version of this documentation. 2.0.0 is the current version.

# Votes

The VotesComponent provides a flexible system for tracking and delegating voting power. This system allows users to delegate their voting power to other addresses, enabling more active participation in governance.

|  |  |
| --- | --- |
|  | By default, token balance does not account for voting power. This makes transfers cheaper. The downside is that it requires users to delegate to themselves in order to activate checkpoints and have their voting power tracked. |

|  |  |
| --- | --- |
|  | The transferring of voting units must be handled by the implementing contract. In the case of `ERC20` and `ERC721` this is usually done via the hooks. You can check the usage section for examples of how to implement this. |

## Key features

1. **Delegation**: Users can delegate their voting power to any address, including themselves. Vote power can be delegated either by calling the delegate function directly, or by providing a signature to be used with delegate\_by\_sig.
2. **Historical lookups**: The system keeps track of historical snapshots for each account, which allows the voting power of an account to be queried at a specific timestamp.  
   This can be used for example to determine the voting power of an account when a proposal was created, rather than using the current balance.

## Usage

When integrating the `VotesComponent`, the VotingUnitsTrait must be implemented to get the voting units for a given account as a function of the implementing contract.  
For simplicity, this module already provides two implementations for `ERC20` and `ERC721` tokens, which will work out of the box if the respective components are integrated.  
Additionally, you must implement the NoncesComponent and the SNIP12Metadata trait to enable delegation by signatures.

Here’s an example of how to structure a simple ERC20Votes contract:

```
#[starknet::contract]
mod ERC20VotesContract {
    use openzeppelin_governance::votes::VotesComponent;
    use openzeppelin_token::erc20::{ERC20Component, DefaultConfig};
    use openzeppelin_utils::cryptography::nonces::NoncesComponent;
    use openzeppelin_utils::cryptography::snip12::SNIP12Metadata;
    use starknet::ContractAddress;

    component!(path: VotesComponent, storage: erc20_votes, event: ERC20VotesEvent);
    component!(path: ERC20Component, storage: erc20, event: ERC20Event);
    component!(path: NoncesComponent, storage: nonces, event: NoncesEvent);

    // Votes
    #[abi(embed_v0)]
    impl VotesImpl = VotesComponent::VotesImpl<ContractState>;
    impl VotesInternalImpl = VotesComponent::InternalImpl<ContractState>;

    // ERC20
    #[abi(embed_v0)]
    impl ERC20MixinImpl = ERC20Component::ERC20MixinImpl<ContractState>;
    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;

    // Nonces
    #[abi(embed_v0)]
    impl NoncesImpl = NoncesComponent::NoncesImpl<ContractState>;

    #[storage]
    pub struct Storage {
        #[substorage(v0)]
        pub erc20_votes: VotesComponent::Storage,
        #[substorage(v0)]
        pub erc20: ERC20Component::Storage,
        #[substorage(v0)]
        pub nonces: NoncesComponent::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC20VotesEvent: VotesComponent::Event,
        #[flat]
        ERC20Event: ERC20Component::Event,
        #[flat]
        NoncesEvent: NoncesComponent::Event
    }

    // Required for hash computation.
    pub impl SNIP12MetadataImpl of SNIP12Metadata {
        fn name() -> felt252 {
            'DAPP_NAME'
        }
        fn version() -> felt252 {
            'DAPP_VERSION'
        }
    }

    // We need to call the `transfer_voting_units` function after
    // every mint, burn and transfer.
    // For this, we use the `after_update` hook of the `ERC20Component::ERC20HooksTrait`.
    impl ERC20VotesHooksImpl of ERC20Component::ERC20HooksTrait<ContractState> {
        fn after_update(
            ref self: ERC20Component::ComponentState<ContractState>,
            from: ContractAddress,
            recipient: ContractAddress,
            amount: u256
        ) {
            let mut contract_state = self.get_contract_mut();
            contract_state.erc20_votes.transfer_voting_units(from, recipient, amount);
        }
    }

    #[constructor]
    fn constructor(ref self: ContractState) {
        self.erc20.initializer("MyToken", "MTK");
    }
}
```

And here’s an example of how to structure a simple ERC721Votes contract:

```
#[starknet::contract]
pub mod ERC721VotesContract {
    use openzeppelin_governance::votes::VotesComponent;
    use openzeppelin_introspection::src5::SRC5Component;
    use openzeppelin_token::erc721::ERC721Component;
    use openzeppelin_utils::cryptography::nonces::NoncesComponent;
    use openzeppelin_utils::cryptography::snip12::SNIP12Metadata;
    use starknet::ContractAddress;

    component!(path: VotesComponent, storage: erc721_votes, event: ERC721VotesEvent);
    component!(path: ERC721Component, storage: erc721, event: ERC721Event);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);
    component!(path: NoncesComponent, storage: nonces, event: NoncesEvent);

    // Votes
    #[abi(embed_v0)]
    impl VotesImpl = VotesComponent::VotesImpl<ContractState>;
    impl VotesInternalImpl = VotesComponent::InternalImpl<ContractState>;

    // ERC721
    #[abi(embed_v0)]
    impl ERC721MixinImpl = ERC721Component::ERC721MixinImpl<ContractState>;
    impl ERC721InternalImpl = ERC721Component::InternalImpl<ContractState>;

    // Nonces
    #[abi(embed_v0)]
    impl NoncesImpl = NoncesComponent::NoncesImpl<ContractState>;

    #[storage]
    pub struct Storage {
        #[substorage(v0)]
        pub erc721_votes: VotesComponent::Storage,
        #[substorage(v0)]
        pub erc721: ERC721Component::Storage,
        #[substorage(v0)]
        pub src5: SRC5Component::Storage,
        #[substorage(v0)]
        pub nonces: NoncesComponent::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC721VotesEvent: VotesComponent::Event,
        #[flat]
        ERC721Event: ERC721Component::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
        #[flat]
        NoncesEvent: NoncesComponent::Event
    }

    /// Required for hash computation.
    pub impl SNIP12MetadataImpl of SNIP12Metadata {
        fn name() -> felt252 {
            'DAPP_NAME'
        }
        fn version() -> felt252 {
            'DAPP_VERSION'
        }
    }

    // We need to call the `transfer_voting_units` function after
    // every mint, burn and transfer.
    // For this, we use the `before_update` hook of the
    //`ERC721Component::ERC721HooksTrait`.
    // This hook is called before the transfer is executed.
    // This gives us access to the previous owner.
    impl ERC721VotesHooksImpl of ERC721Component::ERC721HooksTrait<ContractState> {
        fn before_update(
            ref self: ERC721Component::ComponentState<ContractState>,
            to: ContractAddress,
            token_id: u256,
            auth: ContractAddress
        ) {
            let mut contract_state = self.get_contract_mut();

            // We use the internal function here since it does not check if the token
            // id exists which is necessary for mints
            let previous_owner = self._owner_of(token_id);
            contract_state.erc721_votes.transfer_voting_units(previous_owner, to, 1);
        }
    }

    #[constructor]
    fn constructor(ref self: ContractState) {
        self.erc721.initializer("MyToken", "MTK", "");
    }
}
```

## Interface

This is the full interface of the `VotesImpl` implementation:

```
#[starknet::interface]
pub trait VotesABI<TState> {
    // IVotes
    fn get_votes(self: @TState, account: ContractAddress) -> u256;
    fn get_past_votes(self: @TState, account: ContractAddress, timepoint: u64) -> u256;
    fn get_past_total_supply(self: @TState, timepoint: u64) -> u256;
    fn delegates(self: @TState, account: ContractAddress) -> ContractAddress;
    fn delegate(ref self: TState, delegatee: ContractAddress);
    fn delegate_by_sig(ref self: TState, delegator: ContractAddress, delegatee: ContractAddress, nonce: felt252, expiry: u64, signature: Span<felt252>);

    // INonces
    fn nonces(self: @TState, owner: ContractAddress) -> felt252;
}
```

← Timelock Controller

API Reference →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0-alpha.1/guides/deployment

## Counterfactual deployments - OpenZeppelin Docs

You are not reading the current version of this documentation. 2.0.0 is the current version.

# Counterfactual deployments

A counterfactual contract is a contract we can interact with even before actually deploying it on-chain.
For example, we can send funds or assign privileges to a contract that doesn’t yet exist.
Why? Because deployments in Starknet are deterministic, allowing us to predict the address where our contract will be deployed.
We can leverage this property to make a contract pay for its own deployment by simply sending funds in advance. We call this a counterfactual deployment.

This process can be described with the following steps:

|  |  |
| --- | --- |
|  | For testing this flow you can check the Starknet Foundry or the Starkli guides for deploying accounts. |

1. Deterministically precompute the `contract_address` given a `class_hash`, `salt`, and constructor `calldata`.
   Note that the `class_hash` must be previously declared for the deployment to succeed.
2. Send funds to the `contract_address`. Usually you will estimate the fee of the transaction first. Existing
   tools usually do this for you.
3. Send a `DeployAccount` type transaction to the network.
4. The protocol will then validate the transaction with the `__validate_deploy__` entrypoint of the contract to be deployed.
5. If the validation succeeds, the protocol will charge the fee and then register the contract as deployed.

|  |  |
| --- | --- |
|  | Although this method is very popular to deploy accounts, this works for any kind of contract. |

## Deployment validation

To be counterfactually deployed, the deploying contract must implement the `__validate_deploy__` entrypoint,
called by the protocol when a `DeployAccount` transaction is sent to the network.

```
trait IDeployable {
    /// Must return 'VALID' when the validation is successful.
    fn __validate_deploy__(
        class_hash: felt252, contract_address_salt: felt252, public_key: felt252
    ) -> felt252;
}
```

← Interfaces and Dispatchers

SNIP12 and Typed Messages →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0-alpha.1/guides/erc20-permit

## ERC20Permit - OpenZeppelin Docs

You are not reading the current version of this documentation. 2.0.0 is the current version.

# ERC20Permit

The EIP-2612 standard, commonly referred to as ERC20Permit, is designed to support gasless token approvals. This is achieved with an off-chain
signature following the SNIP12 standard, rather than with an on-chain transaction. The permit function verifies the signature and sets
the spender’s allowance if the signature is valid. This approach improves user experience and reduces gas costs.

## Differences from Solidity

Although this extension is mostly similar to the Solidity implementation of EIP-2612, there are some notable differences in the parameters of the permit function:

* The `deadline` parameter is represented by `u64` rather than `u256`.
* The `signature` parameter is represented by a span of felts rather than `v`, `r`, and `s` values.

|  |  |
| --- | --- |
|  | Unlike Solidity, there is no enforced format for signatures on Starknet. A signature is represented by an array or span of felts, and there is no universal method for validating signatures of unknown formats. Consequently, a signature provided to the permit function is validated through an external `is_valid_signature` call to the contract at the `owner` address. |

## Usage

The functionality is provided as an embeddable ERC20Permit trait of the ERC20Component.

```
#[abi(embed_v0)]
impl ERC20PermitImpl = ERC20Component::ERC20PermitImpl<ContractState>;
```

A contract must meet the following requirements to be able to use the ERC20Permit trait:

* Implement ERC20Component.
* Implement NoncesComponent.
* Implement SNIP12Metadata trait (used in signature generation).

## Typed message

To safeguard against replay attacks and ensure the uniqueness of each approval via permit, the data signed includes:

* The address of the `owner`.
* The parameters specified in the approve function (`spender` and `amount`)
* The address of the `token` contract itself.
* A `nonce`, which must be unique for each operation.
* The `chain_id`, which protects against cross-chain replay attacks.

The format of the `Permit` structure in a signed permit message is as follows:

```
struct Permit {
    token: ContractAddress,
    spender: ContractAddress,
    amount: u256,
    nonce: felt252,
    deadline: u64,
}
```

|  |  |
| --- | --- |
|  | The owner of the tokens is also part of the signed message. It is used as the `signer` parameter in the `get_message_hash` call. |

Further details on preparing and signing a typed message can be found in the SNIP12 guide.

← Creating Supply

API Reference →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0-alpha.1/guides/erc20-supply

## Creating ERC20 Supply - OpenZeppelin Docs

You are not reading the current version of this documentation. 2.0.0 is the current version.

# Creating ERC20 Supply

The standard interface implemented by tokens built on Starknet comes from the popular token standard on Ethereum called ERC20.
EIP20, from which ERC20 contracts are derived, does not specify how tokens are created.
This guide will go over strategies for creating both a fixed and dynamic token supply.

## Fixed Supply

Let’s say we want to create a token named `MyToken` with a fixed token supply.
We can achieve this by setting the token supply in the constructor which will execute upon deployment.

```
#[starknet::contract]
mod MyToken {
    use openzeppelin_token::erc20::{ERC20Component, ERC20HooksEmptyImpl};
    use starknet::ContractAddress;

    component!(path: ERC20Component, storage: erc20, event: ERC20Event);

    // ERC20 Mixin
    #[abi(embed_v0)]
    impl ERC20MixinImpl = ERC20Component::ERC20MixinImpl<ContractState>;
    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        erc20: ERC20Component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC20Event: ERC20Component::Event
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        fixed_supply: u256,
        recipient: ContractAddress
    ) {
        let name = "MyToken";
        let symbol = "MTK";

        self.erc20.initializer(name, symbol);
        self.erc20.mint(recipient, fixed_supply);
    }
}
```

In the constructor, we’re first calling the ERC20 initializer to set the token name and symbol.
Next, we’re calling the internal `mint` function which creates `fixed_supply` of tokens and allocates them to `recipient`.
Since the internal `mint` is not exposed in our contract, it will not be possible to create any more tokens.
In other words, we’ve implemented a fixed token supply!

## Dynamic Supply

ERC20 contracts with a dynamic supply include a mechanism for creating or destroying tokens.
Let’s make a few changes to the almighty `MyToken` contract and create a minting mechanism.

```
#[starknet::contract]
mod MyToken {
    use openzeppelin_token::erc20::{ERC20Component, ERC20HooksEmptyImpl};
    use starknet::ContractAddress;

    component!(path: ERC20Component, storage: erc20, event: ERC20Event);

   // ERC20 Mixin
    #[abi(embed_v0)]
    impl ERC20MixinImpl = ERC20Component::ERC20MixinImpl<ContractState>;
    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        erc20: ERC20Component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC20Event: ERC20Component::Event
    }

    #[constructor]
    fn constructor(ref self: ContractState) {
        let name = "MyToken";
        let symbol = "MTK";

        self.erc20.initializer(name, symbol);
    }

    #[external(v0)]
    fn mint(
        ref self: ContractState,
        recipient: ContractAddress,
        amount: u256
    ) {
        // This function is NOT protected which means
        // ANYONE can mint tokens
        self.erc20.mint(recipient, amount);
    }
}
```

The exposed `mint` above will create `amount` tokens and allocate them to `recipient`.
We now have our minting mechanism!

There is, however, a big problem.
`mint` does not include any restrictions on who can call this function.
For the sake of good practices, let’s implement a simple permissioning mechanism with `Ownable`.

```
#[starknet::contract]
mod MyToken {

    (...)

    // Integrate Ownable

    #[external(v0)]
    fn mint(
        ref self: ContractState,
        recipient: ContractAddress,
        amount: u256
    ) {
        // Set permissions with Ownable
        self.ownable.assert_only_owner();

        // Mint tokens if called by the contract owner
        self.erc20.mint(recipient, amount);
    }
}
```

In the constructor, we pass the owner address to set the owner of the `MyToken` contract.
The `mint` function includes `assert_only_owner` which will ensure that only the contract owner can call this function.
Now, we have a protected ERC20 minting mechanism to create a dynamic token supply.

|  |  |
| --- | --- |
|  | For a more thorough explanation of permission mechanisms, see Access Control. |

← ERC20

ERC20Permit →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0-alpha.1/guides/snip12

## SNIP12 and Typed Messages - OpenZeppelin Docs

You are not reading the current version of this documentation. 2.0.0 is the current version.

# SNIP12 and Typed Messages

Similar to EIP712, SNIP12 is a standard for secure off-chain signature verification on Starknet.
It provides a way to hash and sign generic typed structs rather than just strings. When building decentralized
applications, usually you might need to sign a message with complex data. The purpose of signature verification
is then to ensure that the received message was indeed signed by the expected signer, and it hasn’t been tampered with.

OpenZeppelin Contracts for Cairo provides a set of utilities to make the implementation of this standard
as easy as possible, and in this guide we will walk you through the process of generating the hashes of typed messages
using these utilities for on-chain signature verification. For that, let’s build an example with a custom ERC20 contract
adding an extra `transfer_with_signature` method.

|  |  |
| --- | --- |
|  | This is an educational example, and it is not intended to be used in production environments. |

## CustomERC20

Let’s start with a basic ERC20 contract leveraging the ERC20Component, and let’s add the new function.
Note that some declarations are omitted for brevity. The full example will be available at the end of the guide.

```
#[starknet::contract]
mod CustomERC20 {
    use openzeppelin_token::erc20::{ERC20Component, ERC20HooksEmptyImpl};
    use starknet::ContractAddress;

    component!(path: ERC20Component, storage: erc20, event: ERC20Event);

    #[abi(embed_v0)]
    impl ERC20MixinImpl = ERC20Component::ERC20MixinImpl<ContractState>;
    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;

    (...)

    #[constructor]
    fn constructor(
        ref self: ContractState,
        initial_supply: u256,
        recipient: ContractAddress
    ) {
        self.erc20.initializer("MyToken", "MTK");
        self.erc20.mint(recipient, initial_supply);
    }

    #[external(v0)]
    fn transfer_with_signature(
        ref self: ContractState,
        recipient: ContractAddress,
        amount: u256,
        nonce: felt252,
        expiry: u64,
        signature: Array<felt252>
    ) {
        (...)
    }
}
```

The `transfer_with_signature` function will allow a user to transfer tokens to another account by providing a signature.
The signature will be generated off-chain, and it will be used to verify the message on-chain. Note that the message
we need to verify is a struct with the following fields:

* `recipient`: The address of the recipient.
* `amount`: The amount of tokens to transfer.
* `nonce`: A unique number to prevent replay attacks.
* `expiry`: The timestamp when the signature expires.

Note that generating the hash of this message on-chain is a requirement to verify the signature, because if we accept
the message as a parameter, it could be easily tampered with.

## Generating the Typed Message Hash

To generate the hash of the message, we need to follow these steps:

### 1. Define the message struct.

In this particular example, the message struct looks like this:

```
struct Message {
    recipient: ContractAddress,
    amount: u256,
    nonce: felt252,
    expiry: u64
}
```

### 2. Get the message type hash.

This is the `starknet_keccak(encode_type(message))` as defined in the SNIP.

In this case it can be computed as follows:

```
// Since there's no u64 type in SNIP-12, we use u128 for `expiry` in the type hash generation.
let message_type_hash = selector!(
    "\"Message\"(\"recipient\":\"ContractAddress\",\"amount\":\"u256\",\"nonce\":\"felt\",\"expiry\":\"u128\")\"u256\"(\"low\":\"u128\",\"high\":\"u128\")"
);
```

which is the same as:

```
let message_type_hash = 0x28bf13f11bba405c77ce010d2781c5903cbed100f01f72fcff1664f98343eb6;
```

|  |  |
| --- | --- |
|  | In practice it’s better to compute the type hash off-chain and hardcode it in the contract, since it is a constant value. |

### 3. Implement the `StructHash` trait for the struct.

You can import the trait from: `openzeppelin_utils::snip12::StructHash`. And this implementation
is nothing more than the encoding of the message as defined in the SNIP.

```
use core::hash::{HashStateExTrait, HashStateTrait};
use core::poseidon::PoseidonTrait;
use openzeppelin_utils::snip12::StructHash;
use starknet::ContractAddress;

const MESSAGE_TYPE_HASH: felt252 =
    0x28bf13f11bba405c77ce010d2781c5903cbed100f01f72fcff1664f98343eb6;

#[derive(Copy, Drop, Hash)]
struct Message {
    recipient: ContractAddress,
    amount: u256,
    nonce: felt252,
    expiry: u64
}

impl StructHashImpl of StructHash<Message> {
    fn hash_struct(self: @Message) -> felt252 {
        let hash_state = PoseidonTrait::new();
        hash_state.update_with(MESSAGE_TYPE_HASH).update_with(*self).finalize()
    }
}
```

### 4. Implement the `SNIP12Metadata` trait.

This implementation determines the values of the domain separator. Only the `name` and `version` fields are required
because the `chain_id` is obtained on-chain, and the `revision` is hardcoded to `1`.

```
use openzeppelin_utils::snip12::SNIP12Metadata;

impl SNIP12MetadataImpl of SNIP12Metadata {
    fn name() -> felt252 { 'DAPP_NAME' }
    fn version() -> felt252 { 'v1' }
}
```

In the above example, no storage reads are required which avoids unnecessary extra gas costs, but in
some cases we may need to read from storage to get the domain separator values. This can be accomplished even when
the trait is not bounded to the ContractState, like this:

```
use openzeppelin_utils::snip12::SNIP12Metadata;

impl SNIP12MetadataImpl of SNIP12Metadata {
    fn name() -> felt252 {
        let state = unsafe_new_contract_state();

        // Some logic to get the name from storage
        state.erc20.name().at(0).unwrap().into()
    }

    fn version() -> felt252 { 'v1' }
}
```

### 5. Generate the hash.

The final step is to use the `OffchainMessageHashImpl` implementation to generate the hash of the message
using the `get_message_hash` function. The implementation is already available as a utility.

```
use core::hash::{HashStateExTrait, HashStateTrait};
use core::poseidon::PoseidonTrait;
use openzeppelin_utils::snip12::{SNIP12Metadata, StructHash, OffchainMessageHash};
use starknet::ContractAddress;

const MESSAGE_TYPE_HASH: felt252 =
    0x28bf13f11bba405c77ce010d2781c5903cbed100f01f72fcff1664f98343eb6;

#[derive(Copy, Drop, Hash)]
struct Message {
    recipient: ContractAddress,
    amount: u256,
    nonce: felt252,
    expiry: u64
}

impl StructHashImpl of StructHash<Message> {
    fn hash_struct(self: @Message) -> felt252 {
        let hash_state = PoseidonTrait::new();
        hash_state.update_with(MESSAGE_TYPE_HASH).update_with(*self).finalize()
    }
}

impl SNIP12MetadataImpl of SNIP12Metadata {
    fn name() -> felt252 {
        'DAPP_NAME'
    }
    fn version() -> felt252 {
        'v1'
    }
}

fn get_hash(
    account: ContractAddress, recipient: ContractAddress, amount: u256, nonce: felt252, expiry: u64
) -> felt252 {
    let message = Message { recipient, amount, nonce, expiry };
    message.get_message_hash(account)
}
```

|  |  |
| --- | --- |
|  | The expected parameter for the `get_message_hash` function is the address of account that signed the message. |

## Full Implementation

Finally, the full implementation of the `CustomERC20` contract looks like this:

|  |  |
| --- | --- |
|  | We are using the `ISRC6Dispatcher` to verify the signature, and the `NoncesComponent` to handle nonces to prevent replay attacks. |

```
use core::hash::{HashStateExTrait, HashStateTrait};
use core::poseidon::PoseidonTrait;
use openzeppelin_utils::snip12::{SNIP12Metadata, StructHash, OffchainMessageHash};
use starknet::ContractAddress;

const MESSAGE_TYPE_HASH: felt252 =
    0x28bf13f11bba405c77ce010d2781c5903cbed100f01f72fcff1664f98343eb6;

#[derive(Copy, Drop, Hash)]
struct Message {
    recipient: ContractAddress,
    amount: u256,
    nonce: felt252,
    expiry: u64
}

impl StructHashImpl of StructHash<Message> {
    fn hash_struct(self: @Message) -> felt252 {
        let hash_state = PoseidonTrait::new();
        hash_state.update_with(MESSAGE_TYPE_HASH).update_with(*self).finalize()
    }
}

#[starknet::contract]
mod CustomERC20 {
    use openzeppelin_account::interface::{ISRC6Dispatcher, ISRC6DispatcherTrait};
    use openzeppelin_token::erc20::{ERC20Component, ERC20HooksEmptyImpl};
    use openzeppelin_utils::cryptography::nonces::NoncesComponent;
    use starknet::ContractAddress;

    use super::{Message, OffchainMessageHash, SNIP12Metadata};

    component!(path: ERC20Component, storage: erc20, event: ERC20Event);
    component!(path: NoncesComponent, storage: nonces, event: NoncesEvent);

    #[abi(embed_v0)]
    impl ERC20MixinImpl = ERC20Component::ERC20MixinImpl<ContractState>;
    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;

    #[abi(embed_v0)]
    impl NoncesImpl = NoncesComponent::NoncesImpl<ContractState>;
    impl NoncesInternalImpl = NoncesComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        erc20: ERC20Component::Storage,
        #[substorage(v0)]
        nonces: NoncesComponent::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC20Event: ERC20Component::Event,
        #[flat]
        NoncesEvent: NoncesComponent::Event
    }

    #[constructor]
    fn constructor(ref self: ContractState, initial_supply: u256, recipient: ContractAddress) {
        self.erc20.initializer("MyToken", "MTK");
        self.erc20.mint(recipient, initial_supply);
    }

    /// Required for hash computation.
    impl SNIP12MetadataImpl of SNIP12Metadata {
        fn name() -> felt252 {
            'CustomERC20'
        }
        fn version() -> felt252 {
            'v1'
        }
    }

    #[external(v0)]
    fn transfer_with_signature(
        ref self: ContractState,
        recipient: ContractAddress,
        amount: u256,
        nonce: felt252,
        expiry: u64,
        signature: Array<felt252>
    ) {
        assert(starknet::get_block_timestamp() <= expiry, 'Expired signature');
        let owner = starknet::get_caller_address();

        // Check and increase nonce
        self.nonces.use_checked_nonce(owner, nonce);

        // Build hash for calling `is_valid_signature`
        let message = Message { recipient, amount, nonce, expiry };
        let hash = message.get_message_hash(owner);

        let is_valid_signature_felt = ISRC6Dispatcher { contract_address: owner }
            .is_valid_signature(hash, signature);

        // Check either 'VALID' or true for backwards compatibility
        let is_valid_signature = is_valid_signature_felt == starknet::VALIDATED
            || is_valid_signature_felt == 1;
        assert(is_valid_signature, 'Invalid signature');

        // Transfer tokens
        self.erc20._transfer(owner, recipient, amount);
    }
}
```

← Counterfactual Deployments

Access →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0-alpha.1/guides/src5-migration

## Migrating ERC165 to SRC5 - OpenZeppelin Docs

You are not reading the current version of this documentation. 2.0.0 is the current version.

# Migrating ERC165 to SRC5

In the smart contract ecosystem, having the ability to query if a contract supports a given interface is an extremely important feature.
The initial introspection design for Contracts for Cairo before version v0.7.0 followed Ethereum’s EIP-165.
Since the Cairo language evolved introducing native types, we needed an introspection solution tailored to the Cairo ecosystem: the SNIP-5 standard.
SNIP-5 allows interface ID calculations to use Cairo types and the Starknet keccak (`sn_keccak`) function.
For more information on the decision, see the Starknet Shamans proposal or the Dual Introspection Detection discussion.

## How to migrate

Migrating from ERC165 to SRC5 involves four major steps:

1. Integrate SRC5 into the contract.
2. Register SRC5 IDs.
3. Add a `migrate` function to apply introspection changes.
4. Upgrade the contract and call `migrate`.

The following guide will go through the steps with examples.

### Component integration

The first step is to integrate the necessary components into the new contract.
The contract should include the new introspection mechanism, SRC5Component.
It should also include the InitializableComponent which will be used in the `migrate` function.
Here’s the setup:

```
#[starknet::contract]
mod MigratingContract {
    use openzeppelin_introspection::src5::SRC5Component;
    use openzeppelin_security::initializable::InitializableComponent;

    component!(path: SRC5Component, storage: src5, event: SRC5Event);
    component!(path: InitializableComponent, storage: initializable, event: InitializableEvent);

    // SRC5
    #[abi(embed_v0)]
    impl SRC5Impl = SRC5Component::SRC5Impl<ContractState>;
    impl SRC5InternalImpl = SRC5Component::InternalImpl<ContractState>;

    // Initializable
    impl InitializableInternalImpl = InitializableComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        src5: SRC5Component::Storage,
        #[substorage(v0)]
        initializable: InitializableComponent::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        SRC5Event: SRC5Component::Event,
        #[flat]
        InitializableEvent: InitializableComponent::Event
    }
}
```

### Interface registration

To successfully migrate ERC165 to SRC5, the contract needs to register the interface IDs that the contract supports with SRC5.

For this example, let’s say that this contract supports the IERC721 and IERC721Metadata interfaces.
The contract should implement an `InternalImpl` and add a function to register those interfaces like this:

```
#[starknet::contract]
mod MigratingContract {
    use openzeppelin_token::erc721::interface::{IERC721_ID, IERC721_METADATA_ID};

    (...)

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        // Register SRC5 interfaces
        fn register_src5_interfaces(ref self: ContractState) {
            self.src5.register_interface(IERC721_ID);
            self.src5.register_interface(IERC721_METADATA_ID);
        }
    }
}
```

Since the new contract integrates `SRC5Component`, it can leverage SRC5’s register\_interface function to register the supported interfaces.

### Migration initializer

Next, the contract should define and expose a migration function that will invoke the `register_src5_interfaces` function.
Since the `migrate` function will be publicly callable, it should include some sort of Access Control so that only permitted addresses can execute the migration.
Finally, `migrate` should include a reinitialization check to ensure that it cannot be called more than once.

|  |  |
| --- | --- |
|  | If the original contract implemented `Initializable` at any point and called the `initialize` method, the `InitializableComponent` will not be usable at this time. Instead, the contract can take inspiration from `InitializableComponent` and create its own initialization mechanism. |

```
#[starknet::contract]
mod MigratingContract {
    (...)

    #[external(v0)]
    fn migrate(ref self: ContractState) {
        // WARNING: Missing Access Control mechanism. Make sure to add one

        // WARNING: If the contract ever implemented `Initializable` in the past,
        // this will not work. Make sure to create a new initialization mechanism
        self.initializable.initialize();

        // Register SRC5 interfaces
        self.register_src5_interfaces();
    }
}
```

### Execute migration

Once the new contract is prepared for migration and **rigorously tested**, all that’s left is to migrate!
Simply upgrade the contract and then call `migrate`.

← Introspection

API Reference →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0-alpha.1/interfaces

## Interfaces and Dispatchers - OpenZeppelin Docs

You are not reading the current version of this documentation. 2.0.0 is the current version.

# Interfaces and Dispatchers

This section describes the interfaces OpenZeppelin Contracts for Cairo offer, and explains the design choices behind them.

Interfaces can be found in the module tree under the `interface` submodule, such as `token::erc20::interface`. For example:

```
use openzeppelin_token::erc20::interface::IERC20;
```

or

```
use openzeppelin_token::erc20::interface::ERC20ABI;
```

|  |  |
| --- | --- |
|  | For simplicity, we’ll use ERC20 as example but the same concepts apply to other modules. |

## Interface traits

The library offers three types of traits to implement or interact with contracts:

### Standard traits

These are associated with a predefined interface such as a standard.
This includes only the functions defined in the interface, and is the standard way to interact with a compliant contract.

```
#[starknet::interface]
pub trait IERC20<TState> {
    fn total_supply(self: @TState) -> u256;
    fn balance_of(self: @TState, account: ContractAddress) -> u256;
    fn allowance(self: @TState, owner: ContractAddress, spender: ContractAddress) -> u256;
    fn transfer(ref self: TState, recipient: ContractAddress, amount: u256) -> bool;
    fn transfer_from(
        ref self: TState, sender: ContractAddress, recipient: ContractAddress, amount: u256
    ) -> bool;
    fn approve(ref self: TState, spender: ContractAddress, amount: u256) -> bool;
}
```

### ABI traits

They describe a contract’s complete interface. This is useful to interface with a preset contract offered by this library, such as the ERC20 preset that includes functions from different traits such as `IERC20` and `IERC20Camel`.

|  |  |
| --- | --- |
|  | The library offers an ABI trait for most components, providing all external function signatures even when most of the time all of them don’t need to be implemented at the same time. This can be helpful when interacting with a contract implementing the component, instead of defining a new dispatcher. |

```
#[starknet::interface]
pub trait ERC20ABI<TState> {
    // IERC20
    fn total_supply(self: @TState) -> u256;
    fn balance_of(self: @TState, account: ContractAddress) -> u256;
    fn allowance(self: @TState, owner: ContractAddress, spender: ContractAddress) -> u256;
    fn transfer(ref self: TState, recipient: ContractAddress, amount: u256) -> bool;
    fn transfer_from(
        ref self: TState, sender: ContractAddress, recipient: ContractAddress, amount: u256
    ) -> bool;
    fn approve(ref self: TState, spender: ContractAddress, amount: u256) -> bool;

    // IERC20Metadata
    fn name(self: @TState) -> ByteArray;
    fn symbol(self: @TState) -> ByteArray;
    fn decimals(self: @TState) -> u8;

    // IERC20CamelOnly
    fn totalSupply(self: @TState) -> u256;
    fn balanceOf(self: @TState, account: ContractAddress) -> u256;
    fn transferFrom(
        ref self: TState, sender: ContractAddress, recipient: ContractAddress, amount: u256
    ) -> bool;
}
```

### Dispatcher traits

Traits annotated with `#[starknet::interface]` automatically generate a dispatcher that can be used to interact with contracts that implement the given interface. They can be imported by appending the `Dispatcher` and `DispatcherTrait` suffixes to the trait name, like this:

```
use openzeppelin_token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
```

Other types of dispatchers are also auto-generated from the annotated trait. See the
Interacting with another contract section of the Cairo book for more information.

|  |  |
| --- | --- |
|  | In the example, the `IERC20Dispatcher` is the one used to interact with contracts, but the `IERC20DispatcherTrait` needs to be in scope for the functions to be available. |

## Dual interfaces

|  |  |
| --- | --- |
|  | `camelCase` functions are deprecated and maintained only for Backwards Compatibility. It’s recommended to only use `snake_case` interfaces with contracts and components. The `camelCase` functions will be removed in future versions. |

Following the Great Interface Migration plan, we added `snake_case` functions to all of our preexisting `camelCase` contracts with the goal of eventually dropping support for the latter.

In short, the library offers two types of interfaces and utilities to handle them:

1. `camelCase` interfaces, which are the ones we’ve been using so far.
2. `snake_case` interfaces, which are the ones we’re migrating to.

This means that currently most of our contracts implement *dual interfaces*. For example, the ERC20 preset contract exposes `transferFrom`, `transfer_from`, `balanceOf`, `balance_of`, etc.

|  |  |
| --- | --- |
|  | Dual interfaces are available for all external functions present in previous versions of OpenZeppelin Contracts for Cairo (v0.6.1 and below). |

### `IERC20`

The default version of the ERC20 interface trait exposes `snake_case` functions:

```
#[starknet::interface]
pub trait IERC20<TState> {
    fn name(self: @TState) -> ByteArray;
    fn symbol(self: @TState) -> ByteArray;
    fn decimals(self: @TState) -> u8;
    fn total_supply(self: @TState) -> u256;
    fn balance_of(self: @TState, account: ContractAddress) -> u256;
    fn allowance(self: @TState, owner: ContractAddress, spender: ContractAddress) -> u256;
    fn transfer(ref self: TState, recipient: ContractAddress, amount: u256) -> bool;
    fn transfer_from(
        ref self: TState, sender: ContractAddress, recipient: ContractAddress, amount: u256
    ) -> bool;
    fn approve(ref self: TState, spender: ContractAddress, amount: u256) -> bool;
}
```

### `IERC20Camel`

On top of that, the library also offers a `camelCase` version of the same interface:

```
#[starknet::interface]
pub trait IERC20Camel<TState> {
    fn name(self: @TState) -> ByteArray;
    fn symbol(self: @TState) -> ByteArray;
    fn decimals(self: @TState) -> u8;
    fn totalSupply(self: @TState) -> u256;
    fn balanceOf(self: @TState, account: ContractAddress) -> u256;
    fn allowance(self: @TState, owner: ContractAddress, spender: ContractAddress) -> u256;
    fn transfer(ref self: TState, recipient: ContractAddress, amount: u256) -> bool;
    fn transferFrom(
        ref self: TState, sender: ContractAddress, recipient: ContractAddress, amount: u256
    ) -> bool;
    fn approve(ref self: TState, spender: ContractAddress, amount: u256) -> bool;
}
```

← Presets

Counterfactual Deployments →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0-alpha.1/introspection

## Introspection - OpenZeppelin Docs

You are not reading the current version of this documentation. 2.0.0 is the current version.

# Introspection

To smooth interoperability, often standards require smart contracts to implement introspection mechanisms.

In Ethereum, the EIP165 standard defines how contracts should declare
their support for a given interface, and how other contracts may query this support.

Starknet offers a similar mechanism for interface introspection defined by the SRC5 standard.

## SRC5

Similar to its Ethereum counterpart, the SRC5 standard requires contracts to implement the `supports_interface` function,
which can be used by others to query if a given interface is supported.

### Usage

To expose this functionality, the contract must implement the SRC5Component, which defines the `supports_interface` function.
Here is an example contract:

```
#[starknet::contract]
mod MyContract {
    use openzeppelin_introspection::src5::SRC5Component;

    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    #[abi(embed_v0)]
    impl SRC5Impl = SRC5Component::SRC5Impl<ContractState>;
    impl SRC5InternalImpl = SRC5Component::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        src5: SRC5Component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        SRC5Event: SRC5Component::Event
    }

    #[constructor]
    fn constructor(ref self: ContractState) {
        self.src5.register_interface(selector!("some_interface"));
    }
}
```

### Interface

```
#[starknet::interface]
pub trait ISRC5 {
    /// Query if a contract implements an interface.
    /// Receives the interface identifier as specified in SRC-5.
    /// Returns `true` if the contract implements `interface_id`, `false` otherwise.
    fn supports_interface(interface_id: felt252) -> bool;
}
```

## Computing the interface ID

The interface ID, as specified in the standard, is the XOR of all the
Extended Function Selectors
of the interface. We strongly advise reading the SNIP to understand the specifics of computing these
extended function selectors. There are tools such as src5-rs that can help with this process.

## Registering interfaces

For a contract to declare its support for a given interface, we recommend using the SRC5 component to register support upon contract deployment through a constructor either directly or indirectly (as an initializer) like this:

```
#[starknet::contract]
mod MyContract {
    use openzeppelin_account::interface;
    use openzeppelin_introspection::src5::SRC5Component;

    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    #[abi(embed_v0)]
    impl SRC5Impl = SRC5Component::SRC5Impl<ContractState>;
    impl InternalImpl = SRC5Component::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        src5: SRC5Component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        SRC5Event: SRC5Component::Event
    }

    #[constructor]
    fn constructor(ref self: ContractState) {
        // Register the contract's support for the ISRC6 interface
        self.src5.register_interface(interface::ISRC6_ID);
    }

    (...)
}
```

## Querying interfaces

Use the `supports_interface` function to query a contract’s support for a given interface.

```
#[starknet::contract]
mod MyContract {
    use openzeppelin_account::interface;
    use openzeppelin_introspection::interface::ISRC5DispatcherTrait;
    use openzeppelin_introspection::interface::ISRC5Dispatcher;
    use starknet::ContractAddress;

    #[storage]
    struct Storage {}

    #[external(v0)]
    fn query_is_account(self: @ContractState, target: ContractAddress) -> bool {
        let dispatcher = ISRC5Dispatcher { contract_address: target };
        dispatcher.supports_interface(interface::ISRC6_ID)
    }
}
```

|  |  |
| --- | --- |
|  | If you are unsure whether a contract implements SRC5 or not, you can follow the process described in here. |

← API Reference

Migrating ERC165 to SRC5 →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0-alpha.1/macros

## Macros - OpenZeppelin Docs

You are not reading the current version of this documentation. 2.0.0 is the current version.

# Macros

This crate provides a collection of macros that streamline and simplify development with the library.
To use them, you need to add the `openzeppelin_macros` crate as a dependency in your `Scarb.toml` file:

```
[dependencies]
openzeppelin_macros = "2.0.0-alpha.1"
```

## Attribute macros

* with\_components
* type\_hash

← API Reference

with\_components →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0-alpha.1/macros/type_hash

## <code>type_hash</code> - OpenZeppelin Docs

You are not reading the current version of this documentation. 2.0.0 is the current version.

# `type_hash`

This macro generates a SNIP-12-compatible type hash for a given struct or enum.

|  |  |
| --- | --- |
|  | This macro is fully compatible with the SNIP-12 standard revision 1. |

## Usage

```
/// name and debug are optional arguments
#[type_hash(name: "My Struct", debug: true)]
struct MyStruct {
    #[snip12(name: "My Field")]
    my_field: felt252,
}
```

This will generate a type hash for the struct.

```
// Encoded type: "My Struct"("My Field":"felt")
pub const MY_STRUCT_TYPE_HASH: felt252 = 0x1735aa9819941b96c651b740b792a96c854565eaff089b7e293d996828b88a8;
```

And because of the `debug` argument, it will generate the following code:

```
pub fn __MY_STRUCT_encoded_type() {
    println!("\"My Struct\"(\"My Field\":\"felt\")");
}
```

## Basic types

The list of supported basic types as defined in the SNIP-12 standard is:

* felt252
* shortstring
* ClassHash
* ContractAddress
* timestamp
* selector
* merkletree
* u128
* i128

### Examples

Struct with basic types and custom names and kinds:

```
#[type_hash(name: "My Struct", debug: true)]
pub struct MyStruct {
    #[snip12(name: "Simple Felt")] // Optional custom name
    pub simple_felt: felt252,
    #[snip12(name: "Class Hash")]
    pub class_hash: ClassHash,
    #[snip12(name: "Target Token")]
    pub target: ContractAddress,
    #[snip12(name: "Timestamp", kind: "timestamp")]
    pub timestamp: u128,
    #[snip12(name: "Selector", kind: "selector")]
    pub selector: felt252,
}

// Encoded type: "My Struct"("Simple Felt":"felt","Class Hash":"ClassHash",
// "Target Token":"ContractAddress","Timestamp":"timestamp","Selector":"selector")
pub const MY_STRUCT_TYPE_HASH: felt252
    = 0x522e0c3dc5e13b0978f4645760a436b1e119fd335842523fee8fbae6057b8c;
```

Enum with basic types and custom names and kinds:

```
#[type_hash(name: "My Enum", debug: true)]
pub enum MyEnum {
    #[snip12(name: "Simple Felt")]
    SimpleFelt: felt252,
    #[snip12(name: "Class Hash")]
    ClassHash: ClassHash,
    #[snip12(name: "Target Token")]
    ContractAddress: ContractAddress,
    #[snip12(name: "Timestamp", kind: "timestamp")]
    Timestamp: u128,
    #[snip12(name: "Selector", kind: "selector")]
    Selector: felt252,
}

// Encoded type: "My Enum"("Simple Felt"("felt"),"Class Hash"("ClassHash"),
// "Target Token"("ContractAddress"),"Timestamp"("timestamp"),"Selector"("selector"))
pub const MY_ENUM_TYPE_HASH: felt252
    = 0x3f30aaa6cda9f699d4131940b10602b78b986feb88f28a19f3b48567cb4b566;
```

## Collection types

The list of supported collection types as defined in the SNIP-12 standard is:

* Array
* Tuple **(Only supported for enums)**
* Span **(Treated as an array)**

|  |  |
| --- | --- |
|  | While Span is not directly supported by the SNIP-12 standard, it is treated as an array for the purposes of this macro, since it is sometimes helpful to use `Span<felt252>` instead of `Array<felt252>` in order to save on gas. |

### Examples

Struct with collection types:

```
#[type_hash(name: "My Struct", debug: true)]
pub struct MyStruct {
    #[snip12(name: "Member 1")]
    pub member1: Array<felt252>,
    #[snip12(name: "Member 2")]
    pub member2: Span<u128>,
    #[snip12(name: "Timestamps", kind: "Array<timestamp>")]
    pub timestamps: Array<u128>,
}

// Encoded type: "My Struct"("Member 1":"felt*","Member 2":"u128*",
// "Timestamps":"timestamp*")
pub const MY_STRUCT_TYPE_HASH: felt252
    = 0x369cdec45d8c55e70986aed44da0e330375171ba6e25b58e741c0ce02fa8ac;
```

Enum with collection types:

```
#[type_hash(name: "My Enum", debug: true)]
pub enum MyEnum {
    #[snip12(name: "Member 1")]
    Member1: Array<felt252>,
    #[snip12(name: "Member 2")]
    Member2: Span<u128>,
    #[snip12(name: "Timestamps", kind: "Array<timestamp>")]
    Timestamps: Array<u128>,
    #[snip12(name: "Name and Last Name", kind: "(shortstring, shortstring)")]
    NameAndLastName: (felt252, felt252),
}

// Encoded type: "My Enum"("Member 1"("felt*"),"Member 2"("u128*"),
// "Timestamps"("timestamp*"),"Name and Last Name"("shortstring","shortstring"))
pub const MY_ENUM_TYPE_HASH: felt252
    = 0x9e3e1ebad4448a8344b3318f9cfda5df237588fd8328e1c2968635f09c735d;
```

## Preset types

The list of supported preset types as defined in the SNIP-12 standard is:

* TokenAmount
* NftId
* u256

### Examples

Struct with preset types:

```
#[type_hash(name: "My Struct", debug: true)]
pub struct MyStruct {
    #[snip12(name: "Token Amount")]
    pub token_amount: TokenAmount,
    #[snip12(name: "NFT ID")]
    pub nft_id: NftId,
    #[snip12(name: "Number")]
    pub number: u256,
}

// Encoded type: "My Struct"("Token Amount":"TokenAmount","NFT ID":"NftId","Number":"u256")"NftId"
// ("collection_address":"ContractAddress","token_id":"u256")"TokenAmount"
// ("token_address":"ContractAddress","amount":"u256")
// "u256"("low":"u128","high":"u128")
pub const MY_STRUCT_TYPE_HASH: felt252
    = 0x19f63528d68c4f44b7d9003a5a6b7793f5bb6ffc8a22bdec82b413ddf4f9412;
```

Enum with preset types:

```
#[type_hash(name: "My Enum", debug: true)]
pub enum MyEnum {
    #[snip12(name: "Token Amount")]
    TokenAmount: TokenAmount,
    #[snip12(name: "NFT ID")]
    NftId: NftId,
    #[snip12(name: "Number")]
    Number: u256,
}

// Encoded type: "My Enum"("Token Amount"("TokenAmount"),"NFT ID"("NftId"),"Number"("u256"))"NftId"
// ("collection_address":"ContractAddress","token_id":"u256")"TokenAmount"
// ("token_address":"ContractAddress","amount":"u256")
// "u256"("low":"u128","high":"u128")
pub const MY_ENUM_TYPE_HASH: felt252
    = 0x39dd19c7e5c5f89e084b78a26200b712c6ae3265f2bae774471c588858421b7;
```

## User-defined types

User-defined types are currently **NOT SUPPORTED** since the macro doesn’t have access to scope outside of the
target struct/enum. In the future it may be supported by extending the syntax to explicitly declare the custom type
definition.

← with\_components

Merkle Tree →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0-alpha.1/macros/with_components

## <code>with_components</code> - OpenZeppelin Docs

You are not reading the current version of this documentation. 2.0.0 is the current version.

# `with_components`

This macro simplifies the syntax for adding a set of components to a contract. It:

* *Imports the corresponding components into the contract.*
* *Adds the corresponding `component!` macro entries.*
* *Adds the storage entries for each component to the Storage struct.*
* *Adds the event entries for each component to the Event struct, or creates the struct if it is missing.*
* *Brings the corresponding internal implementations into scope.*
* *Provides some diagnostics for each specific component to help the developer avoid common mistakes.*

|  |  |
| --- | --- |
|  | Since the macro does not expose any external implementations, developers must make sure to specify explicitly the ones required by the contract. |

## Security considerations

The macro was designed to be simple and effective while still being very hard to misuse. For this reason, the features
that it provides are limited, and things that might make the contract behave in unexpected ways must be
explicitly specified by the developer. It does not specify external implementations, so contracts won’t find
themselves in a situation where external functions are exposed without the developer’s knowledge. It brings
the internal implementations into scope so these functions are available by default, but if they are not used,
they won’t have any effect on the contract’s behavior.

## Usage

This is how a contract with multiple components looks when using the macro.

```
#[with_components(Account, SRC5, SRC9, Upgradeable)]
#[starknet::contract(account)]
mod OutsideExecutionAccountUpgradeable {
    use openzeppelin_upgrades::interface::IUpgradeable;
    use starknet::{ClassHash, ContractAddress};

    // External
    #[abi(embed_v0)]
    impl AccountMixinImpl = AccountComponent::AccountMixinImpl<ContractState>;
    #[abi(embed_v0)]
    impl OutsideExecutionV2Impl =
        SRC9Component::OutsideExecutionV2Impl<ContractState>;

    #[storage]
    struct Storage {}

    #[constructor]
    fn constructor(ref self: ContractState, public_key: felt252) {
        self.account.initializer(public_key);
        self.src9.initializer();
    }

    #[abi(embed_v0)]
    impl UpgradeableImpl of IUpgradeable<ContractState> {
        fn upgrade(ref self: ContractState, new_class_hash: ClassHash) {
            self.account.assert_only_self();
            self.upgradeable.upgrade(new_class_hash);
        }
    }
}
```

This is how the same contract looks using regular syntax.

```
#[starknet::contract(account)]
mod OutsideExecutionAccountUpgradeable {
    use openzeppelin::account::AccountComponent;
    use openzeppelin::account::extensions::SRC9Component;
    use openzeppelin::introspection::src5::SRC5Component;
    use openzeppelin::upgrades::UpgradeableComponent;
    use openzeppelin::upgrades::interface::IUpgradeable;
    use starknet::ClassHash;

    component!(path: AccountComponent, storage: account, event: AccountEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);
    component!(path: SRC9Component, storage: src9, event: SRC9Event);
    component!(path: UpgradeableComponent, storage: upgradeable, event: UpgradeableEvent);

    // External
    #[abi(embed_v0)]
    impl AccountMixinImpl = AccountComponent::AccountMixinImpl<ContractState>;
    #[abi(embed_v0)]
    impl OutsideExecutionV2Impl =
        SRC9Component::OutsideExecutionV2Impl<ContractState>;

    // Internal
    impl AccountInternalImpl = AccountComponent::InternalImpl<ContractState>;
    impl OutsideExecutionInternalImpl = SRC9Component::InternalImpl<ContractState>;
    impl UpgradeableInternalImpl = UpgradeableComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        account: AccountComponent::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage,
        #[substorage(v0)]
        src9: SRC9Component::Storage,
        #[substorage(v0)]
        upgradeable: UpgradeableComponent::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        AccountEvent: AccountComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
        #[flat]
        SRC9Event: SRC9Component::Event,
        #[flat]
        UpgradeableEvent: UpgradeableComponent::Event,
    }

    #[constructor]
    fn constructor(ref self: ContractState, public_key: felt252) {
        self.account.initializer(public_key);
        self.src9.initializer();
    }

    #[abi(embed_v0)]
    impl UpgradeableImpl of IUpgradeable<ContractState> {
        fn upgrade(ref self: ContractState, new_class_hash: ClassHash) {
            self.account.assert_only_self();
            self.upgradeable.upgrade(new_class_hash);
        }
    }
}
```

← Macros

type\_hash →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0-alpha.1/presets

## Presets - OpenZeppelin Docs

You are not reading the current version of this documentation. 2.0.0 is the current version.

# Presets

Presets are ready-to-deploy contracts provided by the library. Since presets are intended to be very simple
and as generic as possible, there’s no support for custom or complex contracts such as `ERC20Pausable` or `ERC721Mintable`.

|  |  |
| --- | --- |
|  | For contract customization and combination of modules you can use Wizard for Cairo, our code-generation tool. |

## Available presets

List of available presets and their corresponding Sierra class hashes. Like Contracts for Cairo,
use of preset contracts are subject to the terms of the
MIT License.

|  |  |
| --- | --- |
|  | Class hashes were computed using cairo 2.11.4. |

| Name | Sierra Class Hash |
| --- | --- |
| `AccountUpgradeable` | `0x07fa937960fd981bc9a7f54f02786cfa6c6f194fc66cb0c35c1588bd83448062` |
| `ERC20Upgradeable` | `0x05ae0a6a994b2145a80c31fb3cd46f7150d984de8e104becdebe481d7724daf3` |
| `ERC721Upgradeable` | `0x0077dcbd0d9907cff8b84dcf0c3006ab07b27a7db1e1e4e12b272d6b1fcdad4c` |
| `ERC1155Upgradeable` | `0x019f291ac71b768cef21602a19bedbc2f45d38374bba086585cd434c2c0e28cd` |
| `EthAccountUpgradeable` | `0x06c71d751a10084fa31758b50348bfaa7f0b8e4b1ce36c2ab5b159cb4c307f74` |
| `UniversalDeployer` | `0x025cc49fb4b211e46b3b91bfbdd4741202ca371cd25abe2806d1b5e1250e1759` |
| `VestingWallet` | `0x01865aa64d7cbc465ab675d87b493c4c58af82eef726e702d87ca8ca4f6040e2` |

|  |  |
| --- | --- |
|  | starkli class-hash command can be used to compute the class hash from a Sierra artifact. |

## Usage

These preset contracts are ready-to-deploy which means they should already be declared on the Sepolia network.
Simply deploy the preset class hash and add the appropriate constructor arguments.
Deploying the ERC20Upgradeable preset with starkli, for example, will look like this:

```
starkli deploy 0x05ae0a6a994b2145a80c31fb3cd46f7150d984de8e104becdebe481d7724daf3 \
  <CONSTRUCTOR_ARGS> \
  --network="sepolia"
```

If a class hash has yet to be declared, copy/paste the preset contract code and declare it locally.
Start by setting up a project and installing the Contracts for Cairo library.
Copy the target preset contract from the presets directory and paste it in the new project’s `src/lib.cairo` like this:

```
// src/lib.cairo

#[starknet::contract]
mod ERC20Upgradeable {
    use openzeppelin_access::ownable::OwnableComponent;
    use openzeppelin_token::erc20::{ERC20Component, ERC20HooksEmptyImpl};
    use openzeppelin_upgrades::UpgradeableComponent;
    use openzeppelin_upgrades::interface::IUpgradeable;
    use starknet::{ContractAddress, ClassHash};

    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);
    component!(path: ERC20Component, storage: erc20, event: ERC20Event);
    component!(path: UpgradeableComponent, storage: upgradeable, event: UpgradeableEvent);

    // Ownable Mixin
    #[abi(embed_v0)]
    impl OwnableMixinImpl = OwnableComponent::OwnableMixinImpl<ContractState>;
    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;

    // ERC20 Mixin
    #[abi(embed_v0)]
    impl ERC20MixinImpl = ERC20Component::ERC20MixinImpl<ContractState>;
    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;

    // Upgradeable
    impl UpgradeableInternalImpl = UpgradeableComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
        #[substorage(v0)]
        erc20: ERC20Component::Storage,
        #[substorage(v0)]
        upgradeable: UpgradeableComponent::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        OwnableEvent: OwnableComponent::Event,
        #[flat]
        ERC20Event: ERC20Component::Event,
        #[flat]
        UpgradeableEvent: UpgradeableComponent::Event
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        name: ByteArray,
        symbol: ByteArray,
        fixed_supply: u256,
        recipient: ContractAddress,
        owner: ContractAddress
    ) {
        self.ownable.initializer(owner);
        self.erc20.initializer(name, symbol);
        self.erc20.mint(recipient, fixed_supply);
    }

    #[abi(embed_v0)]
    impl UpgradeableImpl of IUpgradeable<ContractState> {
        fn upgrade(ref self: ContractState, new_class_hash: ClassHash) {
            self.ownable.assert_only_owner();
            self.upgradeable.upgrade(new_class_hash);
        }
    }
}
```

Next, compile the contract.

```
scarb build
```

Finally, declare the preset.

```
starkli declare target/dev/my_project_ERC20Upgradeable.contract_class.json \
  --network="sepolia"
```

← Components

Interfaces and Dispatchers →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0-alpha.1/security

## Security - OpenZeppelin Docs

You are not reading the current version of this documentation. 2.0.0 is the current version.

# Security

The following documentation provides context, reasoning, and examples of modules found under `openzeppelin_security`.

|  |  |
| --- | --- |
|  | Expect these modules to evolve. |

## Initializable

The Initializable component provides a simple mechanism that mimics
the functionality of a constructor.
More specifically, it enables logic to be performed once and only once which is useful to set up a contract’s initial state when a constructor cannot be used, for example when there are circular dependencies at construction time.

### Usage

You can use the component in your contracts like this:

```
#[starknet::contract]
mod MyInitializableContract {
    use openzeppelin_security::InitializableComponent;

    component!(path: InitializableComponent, storage: initializable, event: InitializableEvent);

    impl InternalImpl = InitializableComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        initializable: InitializableComponent::Storage,
        param: felt252
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        InitializableEvent: InitializableComponent::Event
    }

    fn initializer(ref self: ContractState, some_param: felt252) {
        // Makes the method callable only once
        self.initializable.initialize();

        // Initialization logic
        self.param.write(some_param);
    }
}
```

|  |  |
| --- | --- |
|  | This Initializable pattern should only be used in one function. |

### Interface

The component provides the following external functions as part of the `InitializableImpl` implementation:

```
#[starknet::interface]
pub trait InitializableABI {
    fn is_initialized() -> bool;
}
```

## Pausable

The Pausable component allows contracts to implement an emergency stop mechanism.
This can be useful for scenarios such as preventing trades until the end of an evaluation period or having an emergency switch to freeze all transactions in the event of a large bug.

To become pausable, the contract should include `pause` and `unpause` functions (which should be protected).
For methods that should be available only when paused or not, insert calls to `assert_paused` and `assert_not_paused`
respectively.

### Usage

For example (using the Ownable component for access control):

```
#[starknet::contract]
mod MyPausableContract {
    use openzeppelin_access::ownable::OwnableComponent;
    use openzeppelin_security::PausableComponent;
    use starknet::ContractAddress;

    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);
    component!(path: PausableComponent, storage: pausable, event: PausableEvent);

    // Ownable Mixin
    #[abi(embed_v0)]
    impl OwnableMixinImpl = OwnableComponent::OwnableMixinImpl<ContractState>;
    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;

    // Pausable
    #[abi(embed_v0)]
    impl PausableImpl = PausableComponent::PausableImpl<ContractState>;
    impl PausableInternalImpl = PausableComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
        #[substorage(v0)]
        pausable: PausableComponent::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        OwnableEvent: OwnableComponent::Event,
        #[flat]
        PausableEvent: PausableComponent::Event
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress) {
        self.ownable.initializer(owner);
    }

    #[external(v0)]
    fn pause(ref self: ContractState) {
        self.ownable.assert_only_owner();
        self.pausable.pause();
    }

    #[external(v0)]
    fn unpause(ref self: ContractState) {
        self.ownable.assert_only_owner();
        self.pausable.unpause();
    }

    #[external(v0)]
    fn when_not_paused(ref self: ContractState) {
        self.pausable.assert_not_paused();
        // Do something
    }

    #[external(v0)]
    fn when_paused(ref self: ContractState) {
        self.pausable.assert_paused();
        // Do something
    }
}
```

### Interface

The component provides the following external functions as part of the `PausableImpl` implementation:

```
#[starknet::interface]
pub trait PausableABI {
    fn is_paused() -> bool;
}
```

## Reentrancy Guard

A reentrancy attack occurs when the caller is able to obtain more resources than allowed by recursively calling a target’s function.

### Usage

Since Cairo does not support modifiers like Solidity, the ReentrancyGuard
component exposes two methods `start` and `end` to protect functions against reentrancy attacks.
The protected function must call `start` before the first function statement, and `end` before the return statement, as shown below:

```
#[starknet::contract]
mod MyReentrancyContract {
    use openzeppelin_security::ReentrancyGuardComponent;

    component!(
        path: ReentrancyGuardComponent, storage: reentrancy_guard, event: ReentrancyGuardEvent
    );

    impl InternalImpl = ReentrancyGuardComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        reentrancy_guard: ReentrancyGuardComponent::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ReentrancyGuardEvent: ReentrancyGuardComponent::Event
    }

    #[external(v0)]
    fn protected_function(ref self: ContractState) {
        self.reentrancy_guard.start();

        // Do something

        self.reentrancy_guard.end();
    }

    #[external(v0)]
    fn another_protected_function(ref self: ContractState) {
        self.reentrancy_guard.start();

        // Do something

        self.reentrancy_guard.end();
    }
}
```

|  |  |
| --- | --- |
|  | The guard prevents the execution flow occurring inside `protected_function` to call itself or `another_protected_function`, and vice versa. |

← Merkle Tree

API Reference →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0-alpha.1/udc

## Universal Deployer Contract - OpenZeppelin Docs

You are not reading the current version of this documentation. 2.0.0 is the current version.

# Universal Deployer Contract

The Universal Deployer Contract (UDC) is a singleton smart contract that wraps the deploy syscall to expose it to any contract that doesn’t implement it, such as account contracts. You can think of it as a standardized generic factory for Starknet contracts.

Since Starknet has no deployment transaction type, it offers a standardized way to deploy smart contracts by following the Standard Deployer Interface and emitting a ContractDeployed event.

For details on the motivation and the decision making process, see the Universal Deployer Contract proposal.

## UDC contract address

This version of the UDC is not deployed yet. Check the current deployed version here.

## Interface

```
#[starknet::interface]
pub trait IUniversalDeployer {
    fn deploy_contract(
        class_hash: ClassHash,
        salt: felt252,
        from_zero: bool,
        calldata: Span<felt252>
    ) -> ContractAddress;
}
```

## Deploying a contract with the UDC

First, declare the target contract (if it’s not already declared).
Next, call the UDC’s `deploy_contract` method.
Here’s an implementation example in Cairo:

```
use openzeppelin_utils::interfaces::{IUniversalDeployerDispatcher, IUniversalDeployerDispatcherTrait};

const UDC_ADDRESS: felt252 = 0x04...;

fn deploy() -> ContractAddress {
    let dispatcher = IUniversalDeployerDispatcher {
        contract_address: UDC_ADDRESS.try_into().unwrap()
    };

    // Deployment parameters
    let class_hash = class_hash_const::<
       0x5c478ee27f2112411f86f207605b2e2c58cdb647bac0df27f660ef2252359c6
    >();
    let salt = 1234567879;
    let not_from_zero = true;
    let calldata = array![];

    // The UDC returns the deployed contract address
    dispatcher.deploy_contract(class_hash, salt, not_from_zero, calldata.span())
}
```

## Deployment types

The Universal Deployer Contract offers two types of addresses to deploy: origin-dependent and origin-independent.
As the names suggest, the origin-dependent type includes the deployer’s address in the address calculation,
whereas, the origin-independent type does not.
The `from_zero` boolean parameter ultimately determines the type of deployment.

|  |  |
| --- | --- |
|  | When deploying a contract that uses `get_caller_address` in the constructor calldata, remember that the UDC, not the account, deploys that contract. Therefore, querying `get_caller_address` in a contract’s constructor returns the UDC’s address, *not the account’s address*. |

### Origin-dependent

By making deployments dependent upon the origin address, users can reserve a whole address space to prevent someone else from taking ownership of the address.

Only the owner of the origin address can deploy to those addresses.

Achieving this type of deployment necessitates that the origin sets `from_zero` to `false` in the deploy\_contract call.
Under the hood, the function passes a modified salt to the `deploy_syscall`, which is the hash of the origin’s address with the given salt.

To deploy a unique contract address pass:

```
let deployed_addr = udc.deploy_contract(class_hash, salt, true, calldata.span());
```

### Origin-independent

Origin-independent contract deployments create contract addresses independent of the deployer and the UDC instance.
Instead, only the class hash, salt, and constructor arguments determine the address.
This type of deployment enables redeployments of accounts and known systems across multiple networks.
To deploy a reproducible deployment, set `from_zero` to `true`.

```
let deployed_addr = udc.deploy_contract(class_hash, salt, false, calldata.span());
```

## Version changes

|  |  |
| --- | --- |
|  | See the previous Universal Deployer API for the initial spec. |

The latest iteration of the UDC includes some notable changes to the API which include:

* `deployContract` method is replaced with the snake\_case deploy\_contract.
* `unique` parameter is replaced with `not_from_zero` in both the `deploy_contract` method and ContractDeployed event.

## Precomputing contract addresses

This library offers utility functions written in Cairo to precompute contract addresses.
They include the generic calculate\_contract\_address\_from\_deploy\_syscall as well as the UDC-specific calculate\_contract\_address\_from\_udc.
Check out the deployments for more information.

← Common

API Reference →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0-alpha.1/upgrades

## Upgrades - OpenZeppelin Docs

You are not reading the current version of this documentation. 2.0.0 is the current version.

# Upgrades

In different blockchains, multiple patterns have been developed for making a contract upgradeable including the widely adopted proxy patterns.

Starknet has native upgradeability through a syscall that updates the contract source code, removing the need for proxies.

|  |  |
| --- | --- |
|  | Make sure you follow our security recommendations before upgrading. |

## Replacing contract classes

To better comprehend how upgradeability works in Starknet, it’s important to understand the difference between a contract and its contract class.

Contract Classes represent the source code of a program. All contracts are associated to a class, and many contracts can be instances of the same one. Classes are usually represented by a class hash, and before a contract of a class can be deployed, the class hash needs to be declared.

### `replace_class_syscall`

The `replace_class` syscall allows a contract to update its source code by replacing its class hash once deployed.

```
/// Upgrades the contract source code to the new contract class.
fn upgrade(new_class_hash: ClassHash) {
    assert(!new_class_hash.is_zero(), 'Class hash cannot be zero');
    starknet::replace_class_syscall(new_class_hash).unwrap_syscall();
}
```

|  |  |
| --- | --- |
|  | If a contract is deployed without this mechanism, its class hash can still be replaced through library calls. |

## `Upgradeable` component

OpenZeppelin Contracts for Cairo provides Upgradeable to add upgradeability support to your contracts.

### Usage

Upgrades are often very sensitive operations, and some form of access control is usually required to
avoid unauthorized upgrades. The Ownable module is used in this example.

|  |  |
| --- | --- |
|  | We will be using the following module to implement the IUpgradeable interface described in the API Reference section. |

```
#[starknet::contract]
mod UpgradeableContract {
    use openzeppelin_access::ownable::OwnableComponent;
    use openzeppelin_upgrades::UpgradeableComponent;
    use openzeppelin_upgrades::interface::IUpgradeable;
    use starknet::ClassHash;
    use starknet::ContractAddress;

    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);
    component!(path: UpgradeableComponent, storage: upgradeable, event: UpgradeableEvent);

    // Ownable Mixin
    #[abi(embed_v0)]
    impl OwnableMixinImpl = OwnableComponent::OwnableMixinImpl<ContractState>;
    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;

    // Upgradeable
    impl UpgradeableInternalImpl = UpgradeableComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
        #[substorage(v0)]
        upgradeable: UpgradeableComponent::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        OwnableEvent: OwnableComponent::Event,
        #[flat]
        UpgradeableEvent: UpgradeableComponent::Event
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress) {
        self.ownable.initializer(owner);
    }

    #[abi(embed_v0)]
    impl UpgradeableImpl of IUpgradeable<ContractState> {
        fn upgrade(ref self: ContractState, new_class_hash: ClassHash) {
            // This function can only be called by the owner
            self.ownable.assert_only_owner();

            // Replace the class hash upgrading the contract
            self.upgradeable.upgrade(new_class_hash);
        }
    }
}
```

## Security

Upgrades can be very sensitive operations, and security should always be top of mind while performing one. Please make sure you thoroughly review the changes and their consequences before upgrading. Some aspects to consider are:

* API changes that might affect integration. For example, changing an external function’s arguments might break existing contracts or offchain systems calling your contract.
* Storage changes that might result in lost data (e.g. changing a storage slot name, making existing storage inaccessible).
* Collisions (e.g. mistakenly reusing the same storage slot from another component) are also possible, although less likely if best practices are followed, for example prepending storage variables with the component’s name (e.g. `ERC20_balances`).
* Always check for backwards compatibility before upgrading between versions of OpenZeppelin Contracts.

## Proxies in Starknet

Proxies enable different patterns such as upgrades and clones. But since Starknet achieves the same in different ways is that there’s no support to implement them.

In the case of contract upgrades, it is achieved by simply changing the contract’s class hash. As of clones, contracts already are like clones of the class they implement.

Implementing a proxy pattern in Starknet has an important limitation: there is no fallback mechanism to be used
for redirecting every potential function call to the implementation. This means that a generic proxy contract
can’t be implemented. Instead, a limited proxy contract can implement specific functions that forward
their execution to another contract class.
This can still be useful for example to upgrade the logic of some functions.

← API Reference

API Reference →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0-alpha.1/wizard

## Wizard for Cairo - OpenZeppelin Docs

You are not reading the current version of this documentation. 2.0.0 is the current version.

# Wizard for Cairo

Not sure where to start? Use the interactive generator below to bootstrap your
contract and learn about the components offered in OpenZeppelin Contracts for Cairo.

|  |  |
| --- | --- |
|  | We strongly recommend checking the Components section to understand how to extend from our library. |

← Overview

Components →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0-alpha.0/

## Contracts for Cairo - OpenZeppelin Docs

You are not reading the current version of this documentation. 2.0.0 is the current version.

# Contracts for Cairo

**A library for secure smart contract development** written in Cairo for Starknet. This library consists of a set of reusable components to build custom smart contracts, as well as
ready-to-deploy presets. You can also find other utilities including interfaces and dispatchers and test utilities
that facilitate testing with Starknet Foundry.

|  |  |
| --- | --- |
|  | This repo contains highly experimental code. Expect rapid iteration. **Use at your own risk.** |

|  |  |
| --- | --- |
|  | You can track our roadmap and future milestones in our Github Project. |

## Installation

The library is available as a Scarb package. Follow this guide for installing Cairo and Scarb on your machine
before proceeding, and run the following command to check that the installation was successful:

```
$ scarb --version

scarb 2.11.3 (15764158b 2025-03-13)
cairo: 2.11.2 (https://crates.io/crates/cairo-lang-compiler/2.11.2)
sierra: 1.7.0
```

### Set up your project

Create an empty directory, and `cd` into it:

```
mkdir my_project/ && cd my_project/
```

Initialize a new Scarb project:

```
scarb init
```

The contents of `my_project/` should now look like this:

```
$ ls

Scarb.toml src
```

### Install the library

Install the library by declaring it as a dependency in the project’s `Scarb.toml` file:

|  |  |
| --- | --- |
|  | Alpha releases are not deployed to scarbs.xyz. To add the library as a dependency, it should be declared as a git dependency. |

```
[dependencies]
openzeppelin = { git = "https://github.com/OpenZeppelin/cairo-contracts.git", tag = "v2.0.0-alpha.0" }
```

The previous example would import the entire library. We can also add each package as a separate dependency to
improve the building time by not including modules that won’t be used:

```
[dependencies]
openzeppelin_access = { git = "https://github.com/OpenZeppelin/cairo-contracts.git", tag = "v2.0.0-alpha.0" }
openzeppelin_token = { git = "https://github.com/OpenZeppelin/cairo-contracts.git", tag = "v2.0.0-alpha.0" }
```

## Basic usage

This is how it looks to build an ERC20 contract using the ERC20 component.
Copy the code into `src/lib.cairo`.

```
#[starknet::contract]
mod MyERC20Token {
    // NOTE: If you added the entire library as a dependency,
    // use `openzeppelin::token` instead.
    use openzeppelin_token::erc20::{ERC20Component, ERC20HooksEmptyImpl, DefaultConfig};
    use starknet::ContractAddress;

    component!(path: ERC20Component, storage: erc20, event: ERC20Event);

    // ERC20 Mixin
    #[abi(embed_v0)]
    impl ERC20MixinImpl = ERC20Component::ERC20MixinImpl<ContractState>;
    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        erc20: ERC20Component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC20Event: ERC20Component::Event
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        name: ByteArray,
        symbol: ByteArray,
        fixed_supply: u256,
        recipient: ContractAddress
    ) {
        self.erc20.initializer(name, symbol);
        self.erc20.mint(recipient, fixed_supply);
    }
}
```

You can now compile it:

```
scarb build
```

Wizard →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0-alpha.0/access

## Access - OpenZeppelin Docs

You are not reading the current version of this documentation. 2.0.0 is the current version.

# Access

Access control—​that is, "who is allowed to do this thing"—is incredibly important in the world of smart contracts.
The access control of your contract may govern who can mint tokens, vote on proposals, freeze transfers, and many other things.
It is therefore critical to understand how you implement it, lest someone else
steals your whole system.

## Ownership and `Ownable`

The most common and basic form of access control is the concept of ownership: there’s an account that is the `owner`
of a contract and can do administrative tasks on it.
This approach is perfectly reasonable for contracts that have a single administrative user.

OpenZeppelin Contracts for Cairo provides OwnableComponent for implementing ownership in your contracts.

### Usage

Integrating this component into a contract first requires assigning an owner.
The implementing contract’s constructor should set the initial owner by passing the owner’s address to Ownable’s
`initializer` like this:

```
#[starknet::contract]
mod MyContract {
    use openzeppelin_access::ownable::OwnableComponent;
    use starknet::ContractAddress;

    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);

    // Ownable Mixin
    #[abi(embed_v0)]
    impl OwnableMixinImpl = OwnableComponent::OwnableMixinImpl<ContractState>;
    impl InternalImpl = OwnableComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        ownable: OwnableComponent::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        OwnableEvent: OwnableComponent::Event
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress) {
        // Set the initial owner of the contract
        self.ownable.initializer(owner);
    }

    (...)
}
```

To restrict a function’s access to the owner only, add in the `assert_only_owner` method:

```
#[starknet::contract]
mod MyContract {
    (...)

    #[external(v0)]
    fn only_owner_allowed(ref self: ContractState) {
        // This function can only be called by the owner
        self.ownable.assert_only_owner();

        (...)
    }
}
```

### Interface

This is the full interface of the `OwnableMixinImpl` implementation:

```
#[starknet::interface]
pub trait OwnableABI {
    // IOwnable
    fn owner() -> ContractAddress;
    fn transfer_ownership(new_owner: ContractAddress);
    fn renounce_ownership();

    // IOwnableCamelOnly
    fn transferOwnership(newOwner: ContractAddress);
    fn renounceOwnership();
}
```

Ownable also lets you:

* `transfer_ownership` from the owner account to a new one, and
* `renounce_ownership` for the owner to relinquish this administrative privilege, a common pattern
  after an initial stage with centralized administration is over.

|  |  |
| --- | --- |
|  | Removing the owner altogether will mean that administrative tasks that are protected by `assert_only_owner` will no longer be callable! |

### Two step transfer

The component also offers a more robust way of transferring ownership via the
OwnableTwoStepImpl implementation. A two step transfer mechanism helps
to prevent unintended and irreversible owner transfers. Simply replace the `OwnableMixinImpl`
with its respective two step variant:

```
#[abi(embed_v0)]
impl OwnableTwoStepMixinImpl = OwnableComponent::OwnableTwoStepMixinImpl<ContractState>;
```

#### Interface

This is the full interface of the two step `OwnableTwoStepMixinImpl` implementation:

```
#[starknet::interface]
pub trait OwnableTwoStepABI {
    // IOwnableTwoStep
    fn owner() -> ContractAddress;
    fn pending_owner() -> ContractAddress;
    fn accept_ownership();
    fn transfer_ownership(new_owner: ContractAddress);
    fn renounce_ownership();

    // IOwnableTwoStepCamelOnly
    fn pendingOwner() -> ContractAddress;
    fn acceptOwnership();
    fn transferOwnership(newOwner: ContractAddress);
    fn renounceOwnership();
}
```

## Role-Based `AccessControl`

While the simplicity of ownership can be useful for simple systems or quick prototyping, different levels of
authorization are often needed. You may want for an account to have permission to ban users from a system, but not
create new tokens. Role-Based Access Control (RBAC) offers
flexibility in this regard.

In essence, we will be defining multiple roles, each allowed to perform different sets of actions.
An account may have, for example, 'moderator', 'minter' or 'admin' roles, which you will then check for
instead of simply using `assert_only_owner`. This check can be enforced through `assert_only_role`.
Separately, you will be able to define rules for how accounts can be granted a role, have it revoked, and more.

Most software uses access control systems that are role-based: some users are regular users, some may be supervisors
or managers, and a few will often have administrative privileges.

### Usage

For each role that you want to define, you will create a new *role identifier* that is used to grant, revoke, and
check if an account has that role. See Creating role identifiers for information
on creating identifiers.

Here’s a simple example of implementing AccessControl on a portion of an ERC20 token contract which defines
and sets a 'minter' role:

```
const MINTER_ROLE: felt252 = selector!("MINTER_ROLE");

#[starknet::contract]
mod MyContract {
    use openzeppelin_access::accesscontrol::AccessControlComponent;
    use openzeppelin_introspection::src5::SRC5Component;
    use openzeppelin_token::erc20::{ERC20Component, ERC20HooksEmptyImpl, DefaultConfig};
    use starknet::ContractAddress;
    use super::MINTER_ROLE;

    component!(path: AccessControlComponent, storage: accesscontrol, event: AccessControlEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);
    component!(path: ERC20Component, storage: erc20, event: ERC20Event);

    // AccessControl
    #[abi(embed_v0)]
    impl AccessControlImpl =
        AccessControlComponent::AccessControlImpl<ContractState>;
    impl AccessControlInternalImpl = AccessControlComponent::InternalImpl<ContractState>;

    // SRC5
    #[abi(embed_v0)]
    impl SRC5Impl = SRC5Component::SRC5Impl<ContractState>;

    // ERC20
    #[abi(embed_v0)]
    impl ERC20Impl = ERC20Component::ERC20Impl<ContractState>;
    #[abi(embed_v0)]
    impl ERC20MetadataImpl = ERC20Component::ERC20MetadataImpl<ContractState>;
    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        accesscontrol: AccessControlComponent::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage,
        #[substorage(v0)]
        erc20: ERC20Component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        AccessControlEvent: AccessControlComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
        #[flat]
        ERC20Event: ERC20Component::Event
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        name: ByteArray,
        symbol: ByteArray,
        initial_supply: u256,
        recipient: ContractAddress,
        minter: ContractAddress
    ) {
        // ERC20-related initialization
        self.erc20.initializer(name, symbol);
        self.erc20.mint(recipient, initial_supply);

        // AccessControl-related initialization
        self.accesscontrol.initializer();
        self.accesscontrol._grant_role(MINTER_ROLE, minter);
    }

    /// This function can only be called by a minter.
    #[external(v0)]
    fn mint(ref self: ContractState, recipient: ContractAddress, amount: u256) {
        self.accesscontrol.assert_only_role(MINTER_ROLE);
        self.erc20.mint(recipient, amount);
    }
}
```

|  |  |
| --- | --- |
|  | Make sure you fully understand how AccessControl works before using it on your system, or copy-pasting the examples from this guide. |

While clear and explicit, this isn’t anything we wouldn’t have been able to achieve with
Ownable. Where AccessControl shines the most is in scenarios where granular
permissions are required, which can be implemented by defining *multiple* roles.

Let’s augment our ERC20 token example by also defining a 'burner' role, which lets accounts destroy tokens:

```
const MINTER_ROLE: felt252 = selector!("MINTER_ROLE");
const BURNER_ROLE: felt252 = selector!("BURNER_ROLE");

#[starknet::contract]
mod MyContract {
    use openzeppelin_access::accesscontrol::AccessControlComponent;
    use openzeppelin_introspection::src5::SRC5Component;
    use openzeppelin_token::erc20::{ERC20Component, ERC20HooksEmptyImpl, DefaultConfig};
    use starknet::ContractAddress;
    use super::{MINTER_ROLE, BURNER_ROLE};

    component!(path: AccessControlComponent, storage: accesscontrol, event: AccessControlEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);
    component!(path: ERC20Component, storage: erc20, event: ERC20Event);

    // AccessControl
    #[abi(embed_v0)]
    impl AccessControlImpl =
        AccessControlComponent::AccessControlImpl<ContractState>;
    impl AccessControlInternalImpl = AccessControlComponent::InternalImpl<ContractState>;

    // SRC5
    #[abi(embed_v0)]
    impl SRC5Impl = SRC5Component::SRC5Impl<ContractState>;

    // ERC20
    #[abi(embed_v0)]
    impl ERC20Impl = ERC20Component::ERC20Impl<ContractState>;
    #[abi(embed_v0)]
    impl ERC20MetadataImpl = ERC20Component::ERC20MetadataImpl<ContractState>;
    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        accesscontrol: AccessControlComponent::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage,
        #[substorage(v0)]
        erc20: ERC20Component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        AccessControlEvent: AccessControlComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
        #[flat]
        ERC20Event: ERC20Component::Event
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        name: ByteArray,
        symbol: ByteArray,
        initial_supply: u256,
        recipient: ContractAddress,
        minter: ContractAddress,
        burner: ContractAddress
    ) {
        // ERC20-related initialization
        self.erc20.initializer(name, symbol);
        self.erc20.mint(recipient, initial_supply);

        // AccessControl-related initialization
        self.accesscontrol.initializer();
        self.accesscontrol._grant_role(MINTER_ROLE, minter);
        self.accesscontrol._grant_role(BURNER_ROLE, burner);
    }

    /// This function can only be called by a minter.
    #[external(v0)]
    fn mint(ref self: ContractState, recipient: ContractAddress, amount: u256) {
        self.accesscontrol.assert_only_role(MINTER_ROLE);
        self.erc20.mint(recipient, amount);
    }

    /// This function can only be called by a burner.
    #[external(v0)]
    fn burn(ref self: ContractState, account: ContractAddress, amount: u256) {
        self.accesscontrol.assert_only_role(BURNER_ROLE);
        self.erc20.burn(account, amount);
    }
}
```

So clean!
By splitting concerns this way, more granular levels of permission may be implemented than were possible with the
simpler ownership approach to access control. Limiting what each component of a system is able to do is known
as the principle of least privilege, and is a good
security practice. Note that each account may still have more than one role, if so desired.

### Granting and revoking roles

The ERC20 token example above uses `_grant_role`,
an `internal` function that is useful when programmatically assigning
roles (such as during construction). But what if we later want to grant the 'minter' role to additional accounts?

By default, **accounts with a role cannot grant it or revoke it from other accounts**: all having a role does is making
the `assert_only_role` check pass. To grant and revoke roles dynamically, you will need help from the role’s *admin*.

Every role has an associated admin role, which grants permission to call the
`grant_role` and
`revoke_role` functions.
A role can be granted or revoked by using these if the calling account has the corresponding admin role.
Multiple roles may have the same admin role to make management easier.
A role’s admin can even be the same role itself, which would cause accounts with that role to be able
to also grant and revoke it.

This mechanism can be used to create complex permissioning structures resembling organizational charts, but it also
provides an easy way to manage simpler applications. `AccessControl` includes a special role with the role identifier
of `0`, called `DEFAULT_ADMIN_ROLE`, which acts as the **default admin role for all roles**.
An account with this role will be able to manage any other role, unless
`set_role_admin` is used to select a new admin role.

Let’s take a look at the ERC20 token example, this time taking advantage of the default admin role:

```
const MINTER_ROLE: felt252 = selector!("MINTER_ROLE");
const BURNER_ROLE: felt252 = selector!("BURNER_ROLE");

#[starknet::contract]
mod MyContract {
    use openzeppelin_access::accesscontrol::AccessControlComponent;
    use openzeppelin_access::accesscontrol::DEFAULT_ADMIN_ROLE;
    use openzeppelin_introspection::src5::SRC5Component;
    use openzeppelin_token::erc20::{ERC20Component, ERC20HooksEmptyImpl, DefaultConfig};
    use starknet::ContractAddress;
    use super::{MINTER_ROLE, BURNER_ROLE};

    component!(path: AccessControlComponent, storage: accesscontrol, event: AccessControlEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);
    component!(path: ERC20Component, storage: erc20, event: ERC20Event);

    // AccessControl
    #[abi(embed_v0)]
    impl AccessControlImpl =
        AccessControlComponent::AccessControlImpl<ContractState>;
    impl AccessControlInternalImpl = AccessControlComponent::InternalImpl<ContractState>;

    // SRC5
    #[abi(embed_v0)]
    impl SRC5Impl = SRC5Component::SRC5Impl<ContractState>;

    // ERC20
    #[abi(embed_v0)]
    impl ERC20Impl = ERC20Component::ERC20Impl<ContractState>;
    #[abi(embed_v0)]
    impl ERC20MetadataImpl = ERC20Component::ERC20MetadataImpl<ContractState>;
    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;

    (...)

    #[constructor]
    fn constructor(
        ref self: ContractState,
        name: ByteArray,
        symbol: ByteArray,
        initial_supply: u256,
        recipient: ContractAddress,
        admin: ContractAddress
    ) {
        // ERC20-related initialization
        self.erc20.initializer(name, symbol);
        self.erc20.mint(recipient, initial_supply);

        // AccessControl-related initialization
        self.accesscontrol.initializer();
        self.accesscontrol._grant_role(DEFAULT_ADMIN_ROLE, admin);
    }

    /// This function can only be called by a minter.
    #[external(v0)]
    fn mint(ref self: ContractState, recipient: ContractAddress, amount: u256) {
        self.accesscontrol.assert_only_role(MINTER_ROLE);
        self.erc20.mint(recipient, amount);
    }

    /// This function can only be called by a burner.
    #[external(v0)]
    fn burn(ref self: ContractState, account: ContractAddress, amount: u256) {
        self.accesscontrol.assert_only_role(BURNER_ROLE);
        self.erc20.burn(account, amount);
    }
}
```

|  |  |
| --- | --- |
|  | The `grant_role` and `revoke_role` functions are automatically exposed as `external` functions from the `AccessControlImpl` by leveraging the `#[abi(embed_v0)]` annotation. |

Note that, unlike the previous examples, no accounts are granted the 'minter' or 'burner' roles.
However, because those roles' admin role is the default admin role, and that role was granted to the 'admin', that
same account can call `grant_role` to give minting or burning permission, and `revoke_role` to remove it.

Dynamic role allocation is often a desirable property, for example in systems where trust in a participant may vary
over time. It can also be used to support use cases such as KYC,
where the list of role-bearers may not be known up-front, or may be prohibitively expensive to include in a single transaction.

### Creating role identifiers

In the Solidity implementation of AccessControl, contracts generally refer to the
keccak256 hash
of a role as the role identifier.

For example:

```
bytes32 public constant SOME_ROLE = keccak256("SOME_ROLE")
```

These identifiers take up 32 bytes (256 bits).

Cairo field elements (`felt252`) store a maximum of 252 bits.
With this discrepancy, this library maintains an agnostic stance on how contracts should create identifiers.
Some ideas to consider:

* Use sn\_keccak instead.
* Use Cairo friendly hashing algorithms like Poseidon, which are implemented in the
  Cairo corelib.

|  |  |
| --- | --- |
|  | The `selector!` macro can be used to compute sn\_keccak in Cairo. |

### Interface

This is the full interface of the `AccessControlMixinImpl` implementation:

```
#[starknet::interface]
pub trait AccessControlABI {
    // IAccessControl
    fn has_role(role: felt252, account: ContractAddress) -> bool;
    fn get_role_admin(role: felt252) -> felt252;
    fn grant_role(role: felt252, account: ContractAddress);
    fn revoke_role(role: felt252, account: ContractAddress);
    fn renounce_role(role: felt252, account: ContractAddress);

    // IAccessControlCamel
    fn hasRole(role: felt252, account: ContractAddress) -> bool;
    fn getRoleAdmin(role: felt252) -> felt252;
    fn grantRole(role: felt252, account: ContractAddress);
    fn revokeRole(role: felt252, account: ContractAddress);
    fn renounceRole(role: felt252, account: ContractAddress);

    // ISRC5
    fn supports_interface(interface_id: felt252) -> bool;
}
```

`AccessControl` also lets you `renounce_role` from the calling account.
The method expects an account as input as an extra security measure, to ensure you are
not renouncing a role from an unintended account.

← SNIP12 and Typed Messages

API Reference →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0-alpha.0/accounts

## Accounts - OpenZeppelin Docs

You are not reading the current version of this documentation. 2.0.0 is the current version.

# Accounts

Unlike Ethereum where accounts are derived from a private key, all Starknet accounts are contracts. This means there’s no Externally Owned Account (EOA)
concept on Starknet.

Instead, the network features native account abstraction and signature validation happens at the contract level.

For a general overview of account abstraction, see
Starknet’s documentation.
A more detailed discussion on the topic can be found in
Starknet Shaman’s forum.

|  |  |
| --- | --- |
|  | For detailed information on the usage and implementation check the API Reference section. |

## What is an account?

Accounts in Starknet are smart contracts, and so they can be deployed and interacted
with like any other contract, and can be extended to implement any custom logic. However, an account is a special type
of contract that is used to validate and execute transactions. For this reason, it must implement a set of entrypoints
that the protocol uses for this execution flow. The SNIP-6 proposal defines a standard interface for accounts,
supporting this execution flow and interoperability with DApps in the ecosystem.

### ISRC6 Interface

```
/// Represents a call to a target contract function.
struct Call {
    to: ContractAddress,
    selector: felt252,
    calldata: Span<felt252>
}

/// Standard Account Interface
#[starknet::interface]
pub trait ISRC6 {
    /// Executes a transaction through the account.
    fn __execute__(calls: Array<Call>);

    /// Asserts whether the transaction is valid to be executed.
    fn __validate__(calls: Array<Call>) -> felt252;

    /// Asserts whether a given signature for a given hash is valid.
    fn is_valid_signature(hash: felt252, signature: Array<felt252>) -> felt252;
}
```

|  |  |
| --- | --- |
|  | The `calldata` member of the `Call` struct in the accounts has been updated to `Span<felt252>` for optimization purposes, but the interface ID remains the same for backwards compatibility. This inconsistency will be fixed in future releases. |

SNIP-6 adds the `is_valid_signature` method. This method is not used by the protocol, but it’s useful for
DApps to verify the validity of signatures, supporting features like Sign In with Starknet.

SNIP-6 also defines that compliant accounts must implement the SRC5 interface following SNIP-5, as
a mechanism for detecting whether a contract is an account or not through introspection.

### ISRC5 Interface

```
/// Standard Interface Detection
#[starknet::interface]
pub trait ISRC5 {
    /// Queries if a contract implements a given interface.
    fn supports_interface(interface_id: felt252) -> bool;
}
```

SNIP-6 compliant accounts must return `true` when queried for the ISRC6 interface ID.

Even though these interfaces are not enforced by the protocol, it’s recommended to implement them for enabling
interoperability with the ecosystem.

### Protocol-level methods

The Starknet protocol uses a few entrypoints for abstracting the accounts. We already mentioned the first two
as part of the ISRC6 interface, and both are required for enabling accounts to be used for executing transactions. The rest are optional:

1. `__validate__` verifies the validity of the transaction to be executed. This is usually used to validate signatures,
   but the entrypoint implementation can be customized to feature any validation mechanism with some limitations.
2. `__execute__` executes the transaction if the validation is successful.
3. `__validate_declare__` optional entrypoint similar to `__validate__` but for transactions
   meant to declare other contracts.
4. `__validate_deploy__` optional entrypoint similar to `__validate__` but meant for counterfactual deployments.

|  |  |
| --- | --- |
|  | Although these entrypoints are available to the protocol for its regular transaction flow, they can also be called like any other method. |

## Starknet Account

Starknet native account abstraction pattern allows for the creation of custom accounts with different validation schemes, but
usually most account implementations validate transactions using the Stark curve which is the most efficient way
of validating signatures since it is a STARK-friendly curve.

OpenZeppelin Contracts for Cairo provides AccountComponent for implementing this validation scheme.

### Usage

Constructing an account contract requires integrating both AccountComponent and SRC5Component. The contract should also set up the constructor to initialize the public key that will be used as the account’s signer. Here’s an example of a basic contract:

```
#[starknet::contract(account)]
mod MyAccount {
    use openzeppelin_account::AccountComponent;
    use openzeppelin_introspection::src5::SRC5Component;

    component!(path: AccountComponent, storage: account, event: AccountEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    // Account Mixin
    #[abi(embed_v0)]
    impl AccountMixinImpl = AccountComponent::AccountMixinImpl<ContractState>;
    impl AccountInternalImpl = AccountComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        account: AccountComponent::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        AccountEvent: AccountComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event
    }

    #[constructor]
    fn constructor(ref self: ContractState, public_key: felt252) {
        self.account.initializer(public_key);
    }
}
```

### Interface

This is the full interface of the `AccountMixinImpl` implementation:

```
#[starknet::interface]
pub trait AccountABI {
    // ISRC6
    fn __execute__(calls: Array<Call>);
    fn __validate__(calls: Array<Call>) -> felt252;
    fn is_valid_signature(hash: felt252, signature: Array<felt252>) -> felt252;

    // ISRC5
    fn supports_interface(interface_id: felt252) -> bool;

    // IDeclarer
    fn __validate_declare__(class_hash: felt252) -> felt252;

    // IDeployable
    fn __validate_deploy__(
        class_hash: felt252, contract_address_salt: felt252, public_key: felt252
    ) -> felt252;

    // IPublicKey
    fn get_public_key() -> felt252;
    fn set_public_key(new_public_key: felt252, signature: Span<felt252>);

    // ISRC6CamelOnly
    fn isValidSignature(hash: felt252, signature: Array<felt252>) -> felt252;

    // IPublicKeyCamel
    fn getPublicKey() -> felt252;
    fn setPublicKey(newPublicKey: felt252, signature: Span<felt252>);
}
```

## Ethereum Account

Besides the Stark-curve account, OpenZeppelin Contracts for Cairo also offers Ethereum-flavored accounts that use the secp256k1 curve for signature validation.
For this the EthAccountComponent must be used.

### Usage

Constructing a secp256k1 account contract also requires integrating both EthAccountComponent and SRC5Component.
The contract should also set up the constructor to initialize the public key that will be used as the account’s signer.
Here’s an example of a basic contract:

```
#[starknet::contract(account)]
mod MyEthAccount {
    use openzeppelin_account::EthAccountComponent;
    use openzeppelin_account::interface::EthPublicKey;
    use openzeppelin_introspection::src5::SRC5Component;
    use starknet::ClassHash;

    component!(path: EthAccountComponent, storage: eth_account, event: EthAccountEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    // EthAccount Mixin
    #[abi(embed_v0)]
    impl EthAccountMixinImpl =
        EthAccountComponent::EthAccountMixinImpl<ContractState>;
    impl EthAccountInternalImpl = EthAccountComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        eth_account: EthAccountComponent::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        EthAccountEvent: EthAccountComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event
    }

    #[constructor]
    fn constructor(ref self: ContractState, public_key: EthPublicKey) {
        self.eth_account.initializer(public_key);
    }
}
```

### Interface

This is the full interface of the `EthAccountMixinImpl` implementation:

```
#[starknet::interface]
pub trait EthAccountABI {
    // ISRC6
    fn __execute__(calls: Array<Call>);
    fn __validate__(calls: Array<Call>) -> felt252;
    fn is_valid_signature(hash: felt252, signature: Array<felt252>) -> felt252;

    // ISRC5
    fn supports_interface(interface_id: felt252) -> bool;

    // IDeclarer
    fn __validate_declare__(class_hash: felt252) -> felt252;

    // IEthDeployable
    fn __validate_deploy__(
        class_hash: felt252, contract_address_salt: felt252, public_key: EthPublicKey
    ) -> felt252;

    // IEthPublicKey
    fn get_public_key() -> EthPublicKey;
    fn set_public_key(new_public_key: EthPublicKey, signature: Span<felt252>);

    // ISRC6CamelOnly
    fn isValidSignature(hash: felt252, signature: Array<felt252>) -> felt252;

    // IEthPublicKeyCamel
    fn getPublicKey() -> EthPublicKey;
    fn setPublicKey(newPublicKey: EthPublicKey, signature: Span<felt252>);
}
```

## Deploying an account

In Starknet there are two ways of deploying smart contracts: using the `deploy_syscall` and doing
counterfactual deployments.
The former can be easily done with the Universal Deployer Contract (UDC), a contract that
wraps and exposes the `deploy_syscall` to provide arbitrary deployments through regular contract calls.
But if you don’t have an account to invoke it, you will probably want to use the latter.

To do counterfactual deployments, you need to implement another protocol-level entrypoint named
`__validate_deploy__`. Check the counterfactual deployments guide to learn how.

## Sending transactions

Let’s now explore how to send transactions through these accounts.

### Starknet Account

First, let’s take the example account we created before and deploy it:

```
#[starknet::contract(account)]
mod MyAccount {
    use openzeppelin_account::AccountComponent;
    use openzeppelin_introspection::src5::SRC5Component;

    component!(path: AccountComponent, storage: account, event: AccountEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    // Account Mixin
    #[abi(embed_v0)]
    impl AccountMixinImpl = AccountComponent::AccountMixinImpl<ContractState>;
    impl AccountInternalImpl = AccountComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        account: AccountComponent::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        AccountEvent: AccountComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event
    }

    #[constructor]
    fn constructor(ref self: ContractState, public_key: felt252) {
        self.account.initializer(public_key);
    }
}
```

To deploy the account variant, compile the contract and declare the class hash because custom accounts are likely not declared.
This means that you’ll need an account already deployed.

Next, create the account JSON with Starknet Foundry’s custom account setup and include the `--class-hash` flag with the declared class hash.
The flag enables custom account variants.

|  |  |
| --- | --- |
|  | The following examples use `sncast` v0.23.0. |

```
$ sncast \
  --url http://127.0.0.1:5050 \
  account create \
  --name my-custom-account \
  --class-hash 0x123456...
```

This command will output the precomputed contract address and the recommended `max-fee`.
To counterfactually deploy the account, send funds to the address and then deploy the custom account.

```
$ sncast \
  --url http://127.0.0.1:5050 \
  account deploy \
  --name my-custom-account
```

Once the account is deployed, set the `--account` flag with the custom account name to send transactions from that account.

```
$ sncast \
  --account my-custom-account \
  --url http://127.0.0.1:5050 \
  invoke \
  --contract-address 0x123... \
  --function "some_function" \
  --calldata 1 2 3
```

### Ethereum Account

First, let’s take the example account we created before and deploy it:

```
#[starknet::contract(account)]
mod MyEthAccount {
    use openzeppelin_account::EthAccountComponent;
    use openzeppelin_account::interface::EthPublicKey;
    use openzeppelin_introspection::src5::SRC5Component;

    component!(path: EthAccountComponent, storage: eth_account, event: EthAccountEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    // EthAccount Mixin
    #[abi(embed_v0)]
    impl EthAccountMixinImpl =
        EthAccountComponent::EthAccountMixinImpl<ContractState>;
    impl EthAccountInternalImpl = EthAccountComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        eth_account: EthAccountComponent::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        EthAccountEvent: EthAccountComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event
    }

    #[constructor]
    fn constructor(ref self: ContractState, public_key: EthPublicKey) {
        self.eth_account.initializer(public_key);
    }
}
```

Special tooling is required in order to deploy and send transactions with an Ethereum-flavored account contract.
The following examples utilize the StarknetJS library.

Compile and declare the contract on the target network.
Next, precompute the EthAccount contract address using the declared class hash.

|  |  |
| --- | --- |
|  | The following examples use unreleased features from StarknetJS (`starknetjs@next`) at commit d002baea0abc1de3ac6e87a671f3dec3757437b3. |

```
import * as dotenv from 'dotenv';
import { CallData, EthSigner, hash } from 'starknet';
import { ABI as ETH_ABI } from '../abis/eth_account.js';
dotenv.config();

// Calculate EthAccount address
const ethSigner = new EthSigner(process.env.ETH_PRIVATE_KEY);
const ethPubKey = await ethSigner.getPubKey();
const ethAccountClassHash = '<ETH_ACCOUNT_CLASS_HASH>';
const ethCallData = new CallData(ETH_ABI);
const ethAccountConstructorCalldata = ethCallData.compile('constructor', {
    public_key: ethPubKey
})
const salt = '0x12345';
const deployerAddress = '0x0';
const ethContractAddress = hash.calculateContractAddressFromHash(
    salt,
    ethAccountClassHash,
    ethAccountConstructorCalldata,
    deployerAddress
);
console.log('Pre-calculated EthAccount address: ', ethContractAddress);
```

Send funds to the pre-calculated EthAccount address and deploy the contract.

```
import * as dotenv from 'dotenv';
import { Account, CallData, EthSigner, RpcProvider, stark } from 'starknet';
import { ABI as ETH_ABI } from '../abis/eth_account.js';
dotenv.config();

// Prepare EthAccount
const provider = new RpcProvider({ nodeUrl: process.env.API_URL });
const ethSigner = new EthSigner(process.env.ETH_PRIVATE_KEY);
const ethPubKey = await ethSigner.getPubKey();
const ethAccountAddress = '<ETH_ACCOUNT_ADDRESS>'
const ethAccount = new Account(provider, ethAccountAddress, ethSigner);

// Prepare payload
const ethAccountClassHash = '<ETH_ACCOUNT_CLASS_HASH>'
const ethCallData = new CallData(ETH_ABI);
const ethAccountConstructorCalldata = ethCallData.compile('constructor', {
    public_key: ethPubKey
})
const salt = '0x12345';
const deployPayload = {
    classHash: ethAccountClassHash,
    constructorCalldata: ethAccountConstructorCalldata,
    addressSalt: salt,
};

// Deploy
const { suggestedMaxFee: feeDeploy } = await ethAccount.estimateAccountDeployFee(deployPayload);
const { transaction_hash, contract_address } = await ethAccount.deployAccount(
    deployPayload,
    { maxFee: stark.estimatedFeeToMaxFee(feeDeploy, 100) }
);
await provider.waitForTransaction(transaction_hash);
console.log('EthAccount deployed at: ', contract_address);
```

Once deployed, connect the EthAccount instance to the target contract which enables calls to come from the EthAccount.
Here’s what an ERC20 transfer from an EthAccount looks like.

```
import * as dotenv from 'dotenv';
import { Account, RpcProvider, Contract, EthSigner } from 'starknet';
dotenv.config();

// Prepare EthAccount
const provider = new RpcProvider({ nodeUrl: process.env.API_URL });
const ethSigner = new EthSigner(process.env.ETH_PRIVATE_KEY);
const ethAccountAddress = '<ETH_ACCOUNT_CONTRACT_ADDRESS>'
const ethAccount = new Account(provider, ethAccountAddress, ethSigner);

// Prepare target contract
const erc20 = new Contract(compiledErc20.abi, erc20Address, provider);

// Connect EthAccount with the target contract
erc20.connect(ethAccount);

// Execute ERC20 transfer
const transferCall = erc20.populate('transfer', {
    recipient: recipient.address,
    amount: 50n
});
const tx = await erc20.transfer(
    transferCall.calldata, { maxFee: 900_000_000_000_000 }
);
await provider.waitForTransaction(tx.transaction_hash);
```

← API Reference

API Reference →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0-alpha.0/backwards-compatibility

## Backwards Compatibility - OpenZeppelin Docs

You are not reading the current version of this documentation. 2.0.0 is the current version.

# Backwards Compatibility

OpenZeppelin Contracts uses semantic versioning to communicate backwards compatibility of its API and storage layout. Patch and minor updates will generally be backwards compatible, with rare exceptions as detailed below. Major updates should be assumed incompatible with previous releases. On this page, we provide details about these guarantees.

Bear in mind that while releasing versions, we treat minors as majors and patches as minors, in accordance with semantic versioning. This means that `v2.1.0` could be adding features to `v2.0.0`, while `v3.0.0` would be considered a breaking release.

## API

In backwards compatible releases, all changes should be either additions or modifications to internal implementation details. Most code should continue to compile and behave as expected. The exceptions to this rule are listed below.

### Security

Infrequently, a patch or minor update will remove or change an API in a breaking way but only if the previous API is considered insecure. These breaking changes will be noted in the changelog and release notes, and published along with a security advisory.

### Errors

The specific error format and data that is included with reverts should not be assumed stable unless otherwise specified.

### Major releases

Major releases should be assumed incompatible. Nevertheless, the external interfaces of contracts will remain compatible if they are standardized, or if the maintainers judge that changing them would cause significant strain on the ecosystem.

An important aspect that major releases may break is "upgrade compatibility", in particular storage layout compatibility. It will never be safe for a live contract to upgrade from one major release to another.

In the case of breaking "upgrade compatibility", an entry to the changelog will be added listing those breaking changes.

## Storage layout

Patch updates will always preserve storage layout compatibility, and after `v2.0.0-alpha.0` minors will too. This means that a live contract can be upgraded from one minor to another without corrupting the storage layout. In some cases it may be necessary to initialize new state variables when upgrading, although we expect this to be infrequent.

## Cairo version

The minimum Cairo version required to compile the contracts will remain unchanged for patch updates, but it may change for minors.

← Test Utilities

Contracts for Solidity →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0-alpha.0/components

## Components - OpenZeppelin Docs

You are not reading the current version of this documentation. 2.0.0 is the current version.

# Components

The following documentation provides reasoning and examples on how to use Contracts for Cairo components.

Starknet components are separate modules that contain storage, events, and implementations that can be integrated into a contract.
Components themselves cannot be declared or deployed.
Another way to think of components is that they are abstract modules that must be instantiated.

|  |  |
| --- | --- |
|  | For more information on the construction and design of Starknet components, see the Starknet Shamans post and the Cairo book. |

## Building a contract

### Setup

The contract should first import the component and declare it with the `component!` macro:

```
#[starknet::contract]
mod MyContract {
    // Import the component
    use openzeppelin_security::InitializableComponent;

    // Declare the component
    component!(path: InitializableComponent, storage: initializable, event: InitializableEvent);
}
```

The `path` argument should be the imported component itself (in this case, InitializableComponent).
The `storage` and `event` arguments are the variable names that will be set in the `Storage` struct and `Event` enum, respectively.
Note that even if the component doesn’t define any events, the compiler will still create an empty event enum inside the component module.

```
#[starknet::contract]
mod MyContract {
    use openzeppelin_security::InitializableComponent;

    component!(path: InitializableComponent, storage: initializable, event: InitializableEvent);

    #[storage]
    struct Storage {
        #[substorage(v0)]
        initializable: InitializableComponent::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        InitializableEvent: InitializableComponent::Event
    }
}
```

The `#[substorage(v0)]` attribute must be included for each component in the `Storage` trait.
This allows the contract to have indirect access to the component’s storage.
See Accessing component storage for more on this.

The `#[flat]` attribute for events in the `Event` enum, however, is not required.
For component events, the first key in the event log is the component ID.
Flattening the component event removes it, leaving the event ID as the first key.

### Implementations

Components come with granular implementations of different interfaces.
This allows contracts to integrate only the implementations that they’ll use and avoid unnecessary bloat.
Integrating an implementation looks like this:

```
mod MyContract {
    use openzeppelin_security::InitializableComponent;

    component!(path: InitializableComponent, storage: initializable, event: InitializableEvent);

    (...)

    // Gives the contract access to the implementation methods
    impl InitializableImpl =
        InitializableComponent::InitializableImpl<ContractState>;
}
```

Defining an `impl` gives the contract access to the methods within the implementation from the component.
For example, `is_initialized` is defined in the `InitializableImpl`.
A function on the contract level can expose it like this:

```
#[starknet::contract]
mod MyContract {
    use openzeppelin_security::InitializableComponent;

    component!(path: InitializableComponent, storage: initializable, event: InitializableEvent);

    (...)

    impl InitializableImpl =
        InitializableComponent::InitializableImpl<ContractState>;

    #[external(v0)]
    fn is_initialized(ref self: ContractState) -> bool {
        self.initializable.is_initialized()
    }
}
```

While there’s nothing wrong with manually exposing methods like in the previous example, this process can be tedious for implementations with many methods.
Fortunately, a contract can embed implementations which will expose all of the methods of the implementation.
To embed an implementation, add the `#[abi(embed_v0)]` attribute above the `impl`:

```
#[starknet::contract]
mod MyContract {
    (...)

    // This attribute exposes the methods of the `impl`
    #[abi(embed_v0)]
    impl InitializableImpl =
        InitializableComponent::InitializableImpl<ContractState>;
}
```

`InitializableImpl` defines the `is_initialized` method in the component.
By adding the embed attribute, `is_initialized` becomes a contract entrypoint for `MyContract`.

|  |  |
| --- | --- |
|  | Embeddable implementations, when available in this library’s components, are segregated from the internal component implementation which makes it easier to safely expose. Components also separate granular implementations from mixin implementations. The API documentation design reflects these groupings. See ERC20Component as an example which includes:  * **Embeddable Mixin Implementation** * **Embeddable Implementations** * **Internal Implementations** * **Events** |

### Mixins

Mixins are impls made of a combination of smaller, more specific impls.
While separating components into granular implementations offers flexibility,
integrating components with many implementations can appear crowded especially if the contract uses all of them.
Mixins simplify this by allowing contracts to embed groups of implementations with a single directive.

Compare the following code blocks to see the benefit of using a mixin when creating an account contract.

#### Account without mixin

```
component!(path: AccountComponent, storage: account, event: AccountEvent);
component!(path: SRC5Component, storage: src5, event: SRC5Event);

#[abi(embed_v0)]
impl SRC6Impl = AccountComponent::SRC6Impl<ContractState>;
#[abi(embed_v0)]
impl DeclarerImpl = AccountComponent::DeclarerImpl<ContractState>;
#[abi(embed_v0)]
impl DeployableImpl = AccountComponent::DeployableImpl<ContractState>;
#[abi(embed_v0)]
impl PublicKeyImpl = AccountComponent::PublicKeyImpl<ContractState>;
#[abi(embed_v0)]
impl SRC6CamelOnlyImpl = AccountComponent::SRC6CamelOnlyImpl<ContractState>;
#[abi(embed_v0)]
impl PublicKeyCamelImpl = AccountComponent::PublicKeyCamelImpl<ContractState>;
impl AccountInternalImpl = AccountComponent::InternalImpl<ContractState>;

#[abi(embed_v0)]
impl SRC5Impl = SRC5Component::SRC5Impl<ContractState>;
```

#### Account with mixin

```
component!(path: AccountComponent, storage: account, event: AccountEvent);
component!(path: SRC5Component, storage: src5, event: SRC5Event);

#[abi(embed_v0)]
impl AccountMixinImpl = AccountComponent::AccountMixinImpl<ContractState>;
impl AccountInternalImpl = AccountComponent::InternalImpl<ContractState>;
```

The rest of the setup for the contract, however, does not change.
This means that component dependencies must still be included in the `Storage` struct and `Event` enum.
Here’s a full example of an account contract that embeds the `AccountMixinImpl`:

```
#[starknet::contract]
mod Account {
    use openzeppelin_account::AccountComponent;
    use openzeppelin_introspection::src5::SRC5Component;

    component!(path: AccountComponent, storage: account, event: AccountEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    // This embeds all of the methods from the many AccountComponent implementations
    // and also includes `supports_interface` from `SRC5Impl`
    #[abi(embed_v0)]
    impl AccountMixinImpl = AccountComponent::AccountMixinImpl<ContractState>;
    impl AccountInternalImpl = AccountComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        account: AccountComponent::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        AccountEvent: AccountComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event
    }

    #[constructor]
    fn constructor(ref self: ContractState, public_key: felt252) {
        self.account.initializer(public_key);
    }
}
```

### Initializers

|  |  |
| --- | --- |
|  | Failing to use a component’s `initializer` can result in irreparable contract deployments. Always read the API documentation for each integrated component. |

Some components require some sort of setup upon construction.
Usually, this would be a job for a constructor; however, components themselves cannot implement constructors.
Components instead offer `initializer`s within their `InternalImpl` to call from the contract’s constructor.
Let’s look at how a contract would integrate OwnableComponent:

```
#[starknet::contract]
mod MyContract {
    use openzeppelin_access::ownable::OwnableComponent;
    use starknet::ContractAddress;

    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);

    // Instantiate `InternalImpl` to give the contract access to the `initializer`
    impl InternalImpl = OwnableComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        ownable: OwnableComponent::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        OwnableEvent: OwnableComponent::Event
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress) {
        // Invoke ownable's `initializer`
        self.ownable.initializer(owner);
    }
}
```

### Immutable Config

While initializers help set up the component’s initial state, some require configuration that may be defined
as constants, saving gas by avoiding the necessity of reading from storage each time the variable needs to be used. The
Immutable Component Config pattern helps with this matter by allowing the implementing contract to define a set of
constants declared in the component, customizing its functionality.

|  |  |
| --- | --- |
|  | The Immutable Component Config standard is defined in the SRC-107. |

Here’s an example of how to use the Immutable Component Config pattern with the ERC2981Component:

```
#[starknet::contract]
mod MyContract {
    use openzeppelin_introspection::src5::SRC5Component;
    use openzeppelin_token::common::erc2981::ERC2981Component;
    use starknet::contract_address_const;

    component!(path: ERC2981Component, storage: erc2981, event: ERC2981Event);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    // SRC5
    #[abi(embed_v0)]
    impl SRC5Impl = SRC5Component::SRC5Impl<ContractState>;

    // Instantiate `InternalImpl` to give the contract access to the `initializer`
    impl InternalImpl = ERC2981Component::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        erc2981: ERC2981Component::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC2981Event: ERC2981Component::Event,
        #[flat]
        SRC5Event: SRC5Component::Event
    }

    // Define the immutable config
    pub impl ERC2981ImmutableConfig of ERC2981Component::ImmutableConfig {
        const FEE_DENOMINATOR: u128 = 10_000;
    }

    #[constructor]
    fn constructor(ref self: ContractState) {
        let default_receiver = contract_address_const::<'RECEIVER'>();
        let default_royalty_fraction = 1000;
        // Invoke erc2981's `initializer`
        self.erc2981.initializer(default_receiver, default_royalty_fraction);
    }
}
```

#### Default config

Sometimes, components implementing the Immutable Component Config pattern provide a default configuration that can be
directly used without implementing the `ImmutableConfig` trait locally. When provided, this implementation will be named
`DefaultConfig` and will be available in the same module containing the component, as a sibling.

In the following example, the `DefaultConfig` trait is used to define the `FEE_DENOMINATOR` config constant.

```
#[starknet::contract]
mod MyContract {
    use openzeppelin_introspection::src5::SRC5Component;
    // Bring the DefaultConfig trait into scope
    use openzeppelin_token::common::erc2981::{ERC2981Component, DefaultConfig};
    use starknet::contract_address_const;

    component!(path: ERC2981Component, storage: erc2981, event: ERC2981Event);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    // SRC5
    #[abi(embed_v0)]
    impl SRC5Impl = SRC5Component::SRC5Impl<ContractState>;

    // Instantiate `InternalImpl` to give the contract access to the `initializer`
    impl InternalImpl = ERC2981Component::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        (...)
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        (...)
    }

    #[constructor]
    fn constructor(ref self: ContractState) {
        let default_receiver = contract_address_const::<'RECEIVER'>();
        let default_royalty_fraction = 1000;
        // Invoke erc2981's `initializer`
        self.erc2981.initializer(default_receiver, default_royalty_fraction);
    }
}
```

#### `validate` function

The `ImmutableConfig` trait may also include a `validate` function with a default implementation, which
asserts that the configuration is correct, and must not be overridden by the implementing contract. For more information
on how to use this function, refer to the validate section of the SRC-107.

### Dependencies

Some components include dependencies of other components.
Contracts that integrate components with dependencies must also include the component dependency.
For instance, AccessControlComponent depends on SRC5Component.
Creating a contract with `AccessControlComponent` should look like this:

```
#[starknet::contract]
mod MyContract {
    use openzeppelin_access::accesscontrol::AccessControlComponent;
    use openzeppelin_introspection::src5::SRC5Component;

    component!(path: AccessControlComponent, storage: accesscontrol, event: AccessControlEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    // AccessControl
    #[abi(embed_v0)]
    impl AccessControlImpl =
        AccessControlComponent::AccessControlImpl<ContractState>;
    #[abi(embed_v0)]
    impl AccessControlCamelImpl =
        AccessControlComponent::AccessControlCamelImpl<ContractState>;
    impl AccessControlInternalImpl = AccessControlComponent::InternalImpl<ContractState>;

    // SRC5
    #[abi(embed_v0)]
    impl SRC5Impl = SRC5Component::SRC5Impl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        accesscontrol: AccessControlComponent::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        AccessControlEvent: AccessControlComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event
    }

    (...)
}
```

## Customization

|  |  |
| --- | --- |
|  | Customizing implementations and accessing component storage can potentially corrupt the state, bypass security checks, and undermine the component logic. **Exercise extreme caution**. See Security. |

### Hooks

Hooks are entrypoints to the business logic of a token component that are accessible at the contract level.
This allows contracts to insert additional behaviors before and/or after token transfers (including mints and burns).
Prior to hooks, extending functionality required contracts to create custom implementations.

All token components include a generic hooks trait that include empty default functions.
When creating a token contract, the using contract must create an implementation of the hooks trait.
Suppose an ERC20 contract wanted to include Pausable functionality on token transfers.
The following snippet leverages the `before_update` hook to include this behavior.

```
#[starknet::contract]
mod MyToken {
    use openzeppelin_security::pausable::PausableComponent::InternalTrait;
    use openzeppelin_security::pausable::PausableComponent;
    use openzeppelin_token::erc20::{ERC20Component, DefaultConfig};
    use starknet::ContractAddress;

    component!(path: ERC20Component, storage: erc20, event: ERC20Event);
    component!(path: PausableComponent, storage: pausable, event: PausableEvent);

    // ERC20 Mixin
    #[abi(embed_v0)]
    impl ERC20MixinImpl = ERC20Component::ERC20MixinImpl<ContractState>;
    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;

    #[abi(embed_v0)]
    impl PausableImpl = PausableComponent::PausableImpl<ContractState>;
    impl PausableInternalImpl = PausableComponent::InternalImpl<ContractState>;

    // Create the hooks implementation
    impl ERC20HooksImpl of ERC20Component::ERC20HooksTrait<ContractState> {
        // Occurs before token transfers
        fn before_update(
            ref self: ERC20Component::ComponentState<ContractState>,
            from: ContractAddress,
            recipient: ContractAddress,
            amount: u256
        ) {
            // Access local state from component state
            let contract_state = self.get_contract();
            // Call function from integrated component
            contract_state.pausable.assert_not_paused();
        }

        // Omitting the `after_update` hook because the default behavior
        // is already implemented in the trait
    }

    (...)
}
```

Notice that the `self` parameter expects a component state type.
Instead of passing the component state, the using contract’s state can be passed which simplifies the syntax.
The hook then moves the scope up with the Cairo-generated `get_contract` through the `HasComponent` trait (as illustrated with ERC20Component in this example).
From here, the hook can access the using contract’s integrated components, storage, and implementations.

Be advised that even if a token contract does not require hooks, the hooks trait must still be implemented.
The using contract may instantiate an empty impl of the trait;
however, the Contracts for Cairo library already provides the instantiated impl to abstract this away from contracts.
The using contract just needs to bring the implementation into scope like this:

```
#[starknet::contract]
mod MyToken {
    use openzeppelin_token::erc20::{ERC20Component, DefaultConfig};
    use openzeppelin_token::erc20::ERC20HooksEmptyImpl;

    (...)
}
```

|  |  |
| --- | --- |
|  | For a more in-depth guide on hooks, see Extending Cairo Contracts with Hooks. |

### Custom implementations

There are instances where a contract requires different or amended behaviors from a component implementation.
In these scenarios, a contract must create a custom implementation of the interface.
Let’s break down a pausable ERC20 contract to see what that looks like.
Here’s the setup:

```
#[starknet::contract]
mod ERC20Pausable {
    use openzeppelin_security::pausable::PausableComponent;
    use openzeppelin_token::erc20::{ERC20Component, ERC20HooksEmptyImpl, DefaultConfig};
    // Import the ERC20 interfaces to create custom implementations
    use openzeppelin_token::erc20::interface::{IERC20, IERC20CamelOnly};
    use starknet::ContractAddress;

    component!(path: PausableComponent, storage: pausable, event: PausableEvent);
    component!(path: ERC20Component, storage: erc20, event: ERC20Event);

    #[abi(embed_v0)]
    impl PausableImpl = PausableComponent::PausableImpl<ContractState>;
    impl PausableInternalImpl = PausableComponent::InternalImpl<ContractState>;

    // `ERC20MetadataImpl` can keep the embed directive because the implementation
    // will not change
    #[abi(embed_v0)]
    impl ERC20MetadataImpl = ERC20Component::ERC20MetadataImpl<ContractState>;
    // Do not add the embed directive to these implementations because
    // these will be customized
    impl ERC20Impl = ERC20Component::ERC20Impl<ContractState>;
    impl ERC20CamelOnlyImpl = ERC20Component::ERC20CamelOnlyImpl<ContractState>;

    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;

    (...)
}
```

The first thing to notice is that the contract imports the interfaces of the implementations that will be customized.
These will be used in the next code example.

Next, the contract includes the ERC20Component implementations; however, `ERC20Impl` and `ERC20CamelOnlyImplt` are **not** embedded.
Instead, we want to expose our custom implementation of an interface.
The following example shows the pausable logic integrated into the ERC20 implementations:

```
#[starknet::contract]
mod ERC20Pausable {
    (...)

    // Custom ERC20 implementation
    #[abi(embed_v0)]
    impl CustomERC20Impl of IERC20<ContractState> {
        fn transfer(
            ref self: ContractState, recipient: ContractAddress, amount: u256
        ) -> bool {
            // Add the custom logic
            self.pausable.assert_not_paused();
            // Add the original implementation method from `IERC20Impl`
            self.erc20.transfer(recipient, amount)
        }

        fn total_supply(self: @ContractState) -> u256 {
            // This method's behavior does not change from the component
            // implementation, but this method must still be defined.
            // Simply add the original implementation method from `IERC20Impl`
            self.erc20.total_supply()
        }

        (...)
    }

    // Custom ERC20CamelOnly implementation
    #[abi(embed_v0)]
    impl CustomERC20CamelOnlyImpl of IERC20CamelOnly<ContractState> {
        fn totalSupply(self: @ContractState) -> u256 {
            self.erc20.total_supply()
        }

        fn balanceOf(self: @ContractState, account: ContractAddress) -> u256 {
            self.erc20.balance_of(account)
        }

        fn transferFrom(
            ref self: ContractState,
            sender: ContractAddress,
            recipient: ContractAddress,
            amount: u256
        ) -> bool {
            self.pausable.assert_not_paused();
            self.erc20.transfer_from(sender, recipient, amount)
        }
    }
}
```

Notice that in the `CustomERC20Impl`, the `transfer` method integrates `pausable.assert_not_paused` as well as `erc20.transfer` from `PausableImpl` and `ERC20Impl` respectively.
This is why the contract defined the `ERC20Impl` from the component in the previous example.

Creating a custom implementation of an interface must define **all** methods from that interface.
This is true even if the behavior of a method does not change from the component implementation (as `total_supply` exemplifies in this example).

### Accessing component storage

There may be cases where the contract must read or write to an integrated component’s storage.
To do so, use the same syntax as calling an implementation method except replace the name of the method with the storage variable like this:

```
#[starknet::contract]
mod MyContract {
    use openzeppelin_security::InitializableComponent;

    component!(path: InitializableComponent, storage: initializable, event: InitializableEvent);

    #[storage]
    struct Storage {
        #[substorage(v0)]
        initializable: InitializableComponent::Storage
    }

    (...)

    fn write_to_comp_storage(ref self: ContractState) {
        self.initializable.Initializable_initialized.write(true);
    }

    fn read_from_comp_storage(self: @ContractState) -> bool {
        self.initializable.Initializable_initialized.read()
    }
}
```

## Security

The maintainers of OpenZeppelin Contracts for Cairo are mainly concerned with the correctness and security of the code as published in the library.

Customizing implementations and manipulating the component state may break some important assumptions and introduce vulnerabilities.
While we try to ensure the components remain secure in the face of a wide range of potential customizations, this is done in a best-effort manner.
Any and all customizations to the component logic should be carefully reviewed and checked against the source code of the component they are customizing so as to fully understand their impact and guarantee their security.

← Wizard

Presets →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0-alpha.0/erc1155

## ERC1155 - OpenZeppelin Docs

You are not reading the current version of this documentation. 2.0.0 is the current version.

# ERC1155

The ERC1155 multi token standard is a specification for fungibility-agnostic token contracts.
The ERC1155 library implements an approximation of EIP-1155 in Cairo for StarkNet.

## Multi Token Standard

The distinctive feature of ERC1155 is that it uses a single smart contract to represent multiple tokens at once. This
is why its balance\_of function differs from ERC20’s and ERC777’s: it has an additional ID argument for the
identifier of the token that you want to query the balance of.

This is similar to how ERC721 does things, but in that standard a token ID has no concept of balance: each token is
non-fungible and exists or doesn’t. The ERC721 balance\_of function refers to how many different tokens an account
has, not how many of each. On the other hand, in ERC1155 accounts have a distinct balance for each token ID, and
non-fungible tokens are implemented by simply minting a single one of them.

This approach leads to massive gas savings for projects that require multiple tokens. Instead of deploying a new
contract for each token type, a single ERC1155 token contract can hold the entire system state, reducing deployment
costs and complexity.

## Usage

Using Contracts for Cairo, constructing an ERC1155 contract requires integrating both `ERC1155Component` and `SRC5Component`.
The contract should also set up the constructor to initialize the token’s URI and interface support.
Here’s an example of a basic contract:

```
#[starknet::contract]
mod MyERC1155 {
    use openzeppelin_introspection::src5::SRC5Component;
    use openzeppelin_token::erc1155::{ERC1155Component, ERC1155HooksEmptyImpl};
    use starknet::ContractAddress;

    component!(path: ERC1155Component, storage: erc1155, event: ERC1155Event);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    // ERC1155 Mixin
    #[abi(embed_v0)]
    impl ERC1155MixinImpl = ERC1155Component::ERC1155MixinImpl<ContractState>;
    impl ERC1155InternalImpl = ERC1155Component::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        erc1155: ERC1155Component::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC1155Event: ERC1155Component::Event,
        #[flat]
        SRC5Event: SRC5Component::Event
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        token_uri: ByteArray,
        recipient: ContractAddress,
        token_ids: Span<u256>,
        values: Span<u256>
    ) {
        self.erc1155.initializer(token_uri);
        self
            .erc1155
            .batch_mint_with_acceptance_check(recipient, token_ids, values, array![].span());
    }
}
```

## Interface

The following interface represents the full ABI of the Contracts for Cairo ERC1155Component.
The interface includes the IERC1155 standard interface and the optional IERC1155MetadataURI interface together with ISRC5.

To support older token deployments, as mentioned in Dual interfaces, the component also includes implementations of the interface written in camelCase.

```
#[starknet::interface]
pub trait ERC1155ABI {
    // IERC1155
    fn balance_of(account: ContractAddress, token_id: u256) -> u256;
    fn balance_of_batch(
        accounts: Span<ContractAddress>, token_ids: Span<u256>
    ) -> Span<u256>;
    fn safe_transfer_from(
        from: ContractAddress,
        to: ContractAddress,
        token_id: u256,
        value: u256,
        data: Span<felt252>
    );
    fn safe_batch_transfer_from(
        from: ContractAddress,
        to: ContractAddress,
        token_ids: Span<u256>,
        values: Span<u256>,
        data: Span<felt252>
    );
    fn is_approved_for_all(
        owner: ContractAddress, operator: ContractAddress
    ) -> bool;
    fn set_approval_for_all(operator: ContractAddress, approved: bool);

    // IERC1155MetadataURI
    fn uri(token_id: u256) -> ByteArray;

    // ISRC5
    fn supports_interface(interface_id: felt252) -> bool;

    // IERC1155Camel
    fn balanceOf(account: ContractAddress, tokenId: u256) -> u256;
    fn balanceOfBatch(
        accounts: Span<ContractAddress>, tokenIds: Span<u256>
    ) -> Span<u256>;
    fn safeTransferFrom(
        from: ContractAddress,
        to: ContractAddress,
        tokenId: u256,
        value: u256,
        data: Span<felt252>
    );
    fn safeBatchTransferFrom(
        from: ContractAddress,
        to: ContractAddress,
        tokenIds: Span<u256>,
        values: Span<u256>,
        data: Span<felt252>
    );
    fn isApprovedForAll(owner: ContractAddress, operator: ContractAddress) -> bool;
    fn setApprovalForAll(operator: ContractAddress, approved: bool);
}
```

## ERC1155 Compatibility

Although Starknet is not EVM compatible, this implementation aims to be as close as possible to the ERC1155 standard but some differences can still be found, such as:

* The optional `data` argument in both `safe_transfer_from` and `safe_batch_transfer_from` is implemented as `Span<felt252>`.
* `IERC1155Receiver` compliant contracts must implement SRC5 and register the `IERC1155Receiver` interface ID.
* `IERC1155Receiver::on_erc1155_received` must return that interface ID on success.

## Batch operations

Because all state is held in a single contract, it is possible to operate over multiple tokens in a single transaction very efficiently. The standard provides two functions, balance\_of\_batch and safe\_batch\_transfer\_from, that make querying multiple balances and transferring multiple tokens simpler and less gas-intensive. We also have safe\_transfer\_from for non-batch operations.

In the spirit of the standard, we’ve also included batch operations in the non-standard functions, such as
batch\_mint\_with\_acceptance\_check.

|  |  |
| --- | --- |
|  | While safe\_transfer\_from and safe\_batch\_transfer\_from prevent loss by checking the receiver can handle the tokens, this yields execution to the receiver which can result in a reentrant call. |

## Receiving tokens

In order to be sure a non-account contract can safely accept ERC1155 tokens, said contract must implement the `IERC1155Receiver` interface.
The recipient contract must also implement the SRC5 interface which supports interface introspection.

### IERC1155Receiver

```
#[starknet::interface]
pub trait IERC1155Receiver {
    fn on_erc1155_received(
        operator: ContractAddress,
        from: ContractAddress,
        token_id: u256,
        value: u256,
        data: Span<felt252>
    ) -> felt252;
    fn on_erc1155_batch_received(
        operator: ContractAddress,
        from: ContractAddress,
        token_ids: Span<u256>,
        values: Span<u256>,
        data: Span<felt252>
    ) -> felt252;
}
```

Implementing the `IERC1155Receiver` interface exposes the on\_erc1155\_received and on\_erc1155\_batch\_received methods.
When safe\_transfer\_from and safe\_batch\_transfer\_from are called, they invoke the recipient contract’s `on_erc1155_received` or `on_erc1155_batch_received` methods respectively which **must** return the IERC1155Receiver interface ID.
Otherwise, the transaction will fail.

|  |  |
| --- | --- |
|  | For information on how to calculate interface IDs, see Computing the interface ID. |

### Creating a token receiver contract

The Contracts for Cairo ERC1155ReceiverComponent already returns the correct interface ID for safe token transfers.
To integrate the `IERC1155Receiver` interface into a contract, simply include the ABI embed directive to the implementations and add the `initializer` in the contract’s constructor.
Here’s an example of a simple token receiver contract:

```
#[starknet::contract]
mod MyTokenReceiver {
    use openzeppelin_introspection::src5::SRC5Component;
    use openzeppelin_token::erc1155::ERC1155ReceiverComponent;
    use starknet::ContractAddress;

    component!(path: ERC1155ReceiverComponent, storage: erc1155_receiver, event: ERC1155ReceiverEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    // ERC1155Receiver Mixin
    #[abi(embed_v0)]
    impl ERC1155ReceiverMixinImpl = ERC1155ReceiverComponent::ERC1155ReceiverMixinImpl<ContractState>;
    impl ERC1155ReceiverInternalImpl = ERC1155ReceiverComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        erc1155_receiver: ERC1155ReceiverComponent::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC1155ReceiverEvent: ERC1155ReceiverComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event
    }

    #[constructor]
    fn constructor(ref self: ContractState) {
        self.erc1155_receiver.initializer();
    }
}
```

← API Reference

API Reference →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0-alpha.0/erc20

## ERC20 - OpenZeppelin Docs

You are not reading the current version of this documentation. 2.0.0 is the current version.

# ERC20

The ERC20 token standard is a specification for fungible tokens, a type of token where all the units are exactly equal to each other.
`token::erc20::ERC20Component` provides an approximation of EIP-20 in Cairo for Starknet.

|  |  |
| --- | --- |
|  | Prior to Contracts v0.7.0, ERC20 contracts store and read `decimals` from storage; however, this implementation returns a static `18`. If upgrading an older ERC20 contract that has a decimals value other than `18`, the upgraded contract **must** use a custom `decimals` implementation. See the Customizing decimals guide. |

## Usage

Using Contracts for Cairo, constructing an ERC20 contract requires setting up the constructor and instantiating the token implementation.
Here’s what that looks like:

```
#[starknet::contract]
mod MyToken {
    use openzeppelin_token::erc20::{ERC20Component, ERC20HooksEmptyImpl, DefaultConfig};
    use starknet::ContractAddress;

    component!(path: ERC20Component, storage: erc20, event: ERC20Event);

    // ERC20 Mixin
    #[abi(embed_v0)]
    impl ERC20MixinImpl = ERC20Component::ERC20MixinImpl<ContractState>;
    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        erc20: ERC20Component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC20Event: ERC20Component::Event
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        initial_supply: u256,
        recipient: ContractAddress
    ) {
        let name = "MyToken";
        let symbol = "MTK";

        self.erc20.initializer(name, symbol);
        self.erc20.mint(recipient, initial_supply);
    }
}
```

`MyToken` integrates both the `ERC20Impl` and `ERC20MetadataImpl` with the embed directive which marks the implementations as external in the contract.
While the `ERC20MetadataImpl` is optional, it’s generally recommended to include it because the vast majority of ERC20 tokens provide the metadata methods.
The above example also includes the `ERC20InternalImpl` instance.
This allows the contract’s constructor to initialize the contract and create an initial supply of tokens.

|  |  |
| --- | --- |
|  | For a more complete guide on ERC20 token mechanisms, see Creating ERC20 Supply. |

## Interface

The following interface represents the full ABI of the Contracts for Cairo ERC20Component.
The interface includes the IERC20 standard interface as well as the optional IERC20Metadata.

To support older token deployments, as mentioned in Dual interfaces, the component also includes an implementation of the interface written in camelCase.

```
#[starknet::interface]
pub trait ERC20ABI {
    // IERC20
    fn total_supply() -> u256;
    fn balance_of(account: ContractAddress) -> u256;
    fn allowance(owner: ContractAddress, spender: ContractAddress) -> u256;
    fn transfer(recipient: ContractAddress, amount: u256) -> bool;
    fn transfer_from(
        sender: ContractAddress, recipient: ContractAddress, amount: u256
    ) -> bool;
    fn approve(spender: ContractAddress, amount: u256) -> bool;

    // IERC20Metadata
    fn name() -> ByteArray;
    fn symbol() -> ByteArray;
    fn decimals() -> u8;

    // IERC20Camel
    fn totalSupply() -> u256;
    fn balanceOf(account: ContractAddress) -> u256;
    fn transferFrom(
        sender: ContractAddress, recipient: ContractAddress, amount: u256
    ) -> bool;
}
```

## ERC20 compatibility

Although Starknet is not EVM compatible, this component aims to be as close as possible to the ERC20 token standard.
Some notable differences, however, can still be found, such as:

* The `ByteArray` type is used to represent strings in Cairo.
* The component offers a dual interface which supports both snake\_case and camelCase methods, as opposed to just camelCase in Solidity.
* `transfer`, `transfer_from` and `approve` will never return anything different from `true` because they will revert on any error.
* Function selectors are calculated differently between Cairo and Solidity.

## Customizing decimals

Cairo, like Solidity, does not support floating-point numbers.
To get around this limitation, ERC20 token contracts may offer a `decimals` field which communicates to outside interfaces (wallets, exchanges, etc.) how the token should be displayed.
For instance, suppose a token had a `decimals` value of `3` and the total token supply was `1234`.
An outside interface would display the token supply as `1.234`.
In the actual contract, however, the supply would still be the integer `1234`.
In other words, **the decimals field in no way changes the actual arithmetic** because all operations are still performed on integers.

Most contracts use `18` decimals and this was even proposed to be compulsory (see the EIP discussion).

### The static approach (SRC-107)

The Contracts for Cairo `ERC20` component leverages SRC-107 to allow for a static and configurable number of decimals.
To use the default `18` decimals, you can use the `DefaultConfig` implementation by just importing it:

```
#[starknet::contract]
mod MyToken {
    // Importing the DefaultConfig implementation would make decimals 18 by default.
    use openzeppelin_token::erc20::{ERC20Component, ERC20HooksEmptyImpl, DefaultConfig};
    use starknet::ContractAddress;

    component!(path: ERC20Component, storage: erc20, event: ERC20Event);

    #[abi(embed_v0)]
    impl ERC20Impl = ERC20Component::ERC20Impl<ContractState>;
    #[abi(embed_v0)]
    impl ERC20CamelOnlyImpl = ERC20Component::ERC20CamelOnlyImpl<ContractState>;
    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;

    (...)
}
```

To customize this value, you can implement the ImmutableConfig trait locally in the contract.
The following example shows how to set the decimals to `6`:

```
mod MyToken {
    use openzeppelin_token::erc20::{ERC20Component, ERC20HooksEmptyImpl};
    use starknet::ContractAddress;

    component!(path: ERC20Component, storage: erc20, event: ERC20Event);

    #[abi(embed_v0)]
    impl ERC20Impl = ERC20Component::ERC20Impl<ContractState>;
    #[abi(embed_v0)]
    impl ERC20CamelOnlyImpl = ERC20Component::ERC20CamelOnlyImpl<ContractState>;
    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;

    (...)

    // Custom implementation of the ERC20Component ImmutableConfig.
    impl ERC20ImmutableConfig of ERC20Component::ImmutableConfig {
        const DECIMALS: u8 = 6;
    }
}
```

### The storage approach

For more complex scenarios, such as a factory deploying multiple tokens with differing values for decimals, a flexible solution might be appropriate.

|  |  |
| --- | --- |
|  | Note that we are not using the MixinImpl or the DefaultConfig in this case, since we need to customize the IERC20Metadata implementation. |

```
#[starknet::contract]
mod MyToken {
    use openzeppelin_token::erc20::interface;
    use openzeppelin_token::erc20::{ERC20Component, ERC20HooksEmptyImpl};
    use starknet::ContractAddress;

    component!(path: ERC20Component, storage: erc20, event: ERC20Event);

    #[abi(embed_v0)]
    impl ERC20Impl = ERC20Component::ERC20Impl<ContractState>;
    #[abi(embed_v0)]
    impl ERC20CamelOnlyImpl = ERC20Component::ERC20CamelOnlyImpl<ContractState>;
    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        erc20: ERC20Component::Storage,
        // The decimals value is stored locally
        decimals: u8,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC20Event: ERC20Component::Event,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState, decimals: u8, initial_supply: u256, recipient: ContractAddress,
    ) {
        // Call the internal function that writes decimals to storage
        self._set_decimals(decimals);

        // Initialize ERC20
        let name = "MyToken";
        let symbol = "MTK";

        self.erc20.initializer(name, symbol);
        self.erc20.mint(recipient, initial_supply);
    }

    #[abi(embed_v0)]
    impl ERC20CustomMetadataImpl of interface::IERC20Metadata<ContractState> {
        fn name(self: @ContractState) -> ByteArray {
            self.erc20.ERC20_name.read()
        }

        fn symbol(self: @ContractState) -> ByteArray {
            self.erc20.ERC20_symbol.read()
        }

        fn decimals(self: @ContractState) -> u8 {
            self.decimals.read()
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn _set_decimals(ref self: ContractState, decimals: u8) {
            self.decimals.write(decimals);
        }
    }
}
```

This contract expects a `decimals` argument in the constructor and uses an internal function to write the decimals to storage.
Note that the `decimals` state variable must be defined in the contract’s storage because this variable does not exist in the component offered by OpenZeppelin Contracts for Cairo.
It’s important to include a custom ERC20 metadata implementation and NOT use the Contracts for Cairo `ERC20MetadataImpl` in this specific case since the `decimals` method will always return `18`.

← API Reference

Creating Supply →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0-alpha.0/erc4626

## ERC4626 - OpenZeppelin Docs

You are not reading the current version of this documentation. 2.0.0 is the current version.

# ERC4626

ERC4626 is an extension of ERC20 that proposes a standard interface for token vaults. This standard interface can be used by widely different contracts (including lending markets, aggregators, and intrinsically interest bearing tokens), which brings a number of subtleties. Navigating these potential issues is essential to implementing a compliant and composable token vault.

We provide a base component of ERC4626 which is designed to allow developers to easily re-configure the vault’s behavior, using traits and hooks, while staying compliant. In this guide, we will discuss some security considerations that affect ERC4626. We will also discuss common customizations of the vault.

## Security concern: Inflation attack

### Visualizing the vault

In exchange for the assets deposited into an ERC4626 vault, a user receives shares. These shares can later be burned to redeem the corresponding underlying assets. The number of shares a user gets depends on the amount of assets they put in and on the exchange rate of the vault. This exchange rate is defined by the current liquidity held by the vault.

* If a vault has 100 tokens to back 200 shares, then each share is worth 0.5 assets.
* If a vault has 200 tokens to back 100 shares, then each share is worth 2.0 assets.

In other words, the exchange rate can be defined as the slope of the line that passes through the origin and the current number of assets and shares in the vault. Deposits and withdrawals move the vault in this line.

When plotted in log-log scale, the rate is defined similarly, but appears differently (because the point (0,0) is infinitely far away). Rates are represented by "diagonal" lines with different offsets.

In such a representation, widely different rates can be clearly visible in the same graph. This wouldn’t be the case in linear scale.

### The attack

When depositing tokens, the number of shares a user gets is rounded towards zero. This rounding takes away value from the user in favor of the vault (i.e. in favor of all the current shareholders). This rounding is often negligible because of the amount at stake. If you deposit 1e9 shares worth of tokens, the rounding will have you lose at most 0.0000001% of your deposit. However if you deposit 10 shares worth of tokens, you could lose 10% of your deposit. Even worse, if you deposit less than 1 share worth of tokens, you will receive 0 shares, effectively making a donation.

For a given amount of assets, the more shares you receive the safer you are. If you want to limit your losses to at most 1%, you need to receive at least 100 shares.

In the figure we can see that for a given deposit of 500 assets, the number of shares we get and the corresponding rounding losses depend on the exchange rate. If the exchange rate is that of the orange curve, we are getting less than a share, so we lose 100% of our deposit. However, if the exchange rate is that of the green curve, we get 5000 shares, which limits our rounding losses to at most 0.02%.

Symmetrically, if we focus on limiting our losses to a maximum of 0.5%, we need to get at least 200 shares. With the green exchange rate that requires just 20 tokens, but with the orange rate that requires 200000 tokens.

We can clearly see that the blue and green curves correspond to vaults that are safer than the yellow and orange curves.

The idea of an inflation attack is that an attacker can donate assets to the vault to move the rate curve to the right, and make the vault unsafe.

Figure 6 shows how an attacker can manipulate the rate of an empty vault. First the attacker must deposit a small amount of tokens (1 token) and follow up with a donation of 1e5 tokens directly to the vault to move the exchange rate "right". This puts the vault in a state where any deposit smaller than 1e5 would be completely lost to the vault. Given that the attacker is the only shareholder (from their donation), the attacker would steal all the tokens deposited.

An attacker would typically wait for a user to do the first deposit into the vault, and would frontrun that operation with the attack described above. The risk is low, and the size of the "donation" required to manipulate the vault is equivalent to the size of the deposit that is being attacked.

In math that gives:

* \(a\_0\) the attacker deposit
* \(a\_1\) the attacker donation
* \(u\) the user deposit

|  | Assets | Shares | Rate |
| --- | --- | --- | --- |
| initial | \(0\) | \(0\) | - |
| after attacker’s deposit | \(a\_0\) | \(a\_0\) | \(1\) |
| after attacker’s donation | \(a\_0+a\_1\) | \(a\_0\) | \(\frac{a\_0}{a\_0+a\_1}\) |

This means a deposit of \(u\) will give \(\frac{u \times a\_0}{a\_0 + a\_1}\) shares.

For the attacker to dilute that deposit to 0 shares, causing the user to lose all its deposit, it must ensure that

\[\frac{u \times a\_0}{a\_0+a\_1} < 1 \iff u < 1 + \frac{a\_1}{a\_0}\]

Using \(a\_0 = 1\) and \(a\_1 = u\) is enough. So the attacker only needs \(u+1\) assets to perform a successful attack.

It is easy to generalize the above results to scenarios where the attacker is going after a smaller fraction of the user’s deposit. In order to target \(\frac{u}{n}\), the user needs to suffer rounding of a similar fraction, which means the user must receive at most \(n\) shares. This results in:

\[\frac{u \times a\_0}{a\_0+a\_1} < n \iff \frac{u}{n} < 1 + \frac{a\_1}{a\_0}\]

In this scenario, the attack is \(n\) times less powerful (in how much it is stealing) and costs \(n\) times less to execute. In both cases, the amount of funds the attacker needs to commit is equivalent to its potential earnings.

### Defending with a virtual offset

The defense we propose is based on the approach used in YieldBox. It consists of two parts:

* Use an offset between the "precision" of the representation of shares and assets. Said otherwise, we use more decimal places to represent the shares than the underlying token does to represent the assets.
* Include virtual shares and virtual assets in the exchange rate computation. These virtual assets enforce the conversion rate when the vault is empty.

These two parts work together in enforcing the security of the vault. First, the increased precision corresponds to a high rate, which we saw is safer as it reduces the rounding error when computing the amount of shares. Second, the virtual assets and shares (in addition to simplifying a lot of the computations) capture part of the donation, making it unprofitable to perform an attack.

Following the previous math definitions, we have:

* \(\delta\) the vault offset
* \(a\_0\) the attacker deposit
* \(a\_1\) the attacker donation
* \(u\) the user deposit

|  | Assets | Shares | Rate |
| --- | --- | --- | --- |
| initial | \(1\) | \(10^\delta\) | \(10^\delta\) |
| after attacker’s deposit | \(1+a\_0\) | \(10^\delta \times (1+a\_0)\) | \(10^\delta\) |
| after attacker’s donation | \(1+a\_0+a\_1\) | \(10^\delta \times (1+a\_0)\) | \(10^\delta \times \frac{1+a\_0}{1+a\_0+a\_1}\) |

One important thing to note is that the attacker only owns a fraction \(\frac{a\_0}{1 + a\_0}\) of the shares, so when doing the donation, he will only be able to recover that fraction \(\frac{a\_1 \times a\_0}{1 + a\_0}\) of the donation. The remaining \(\frac{a\_1}{1+a\_0}\) are captured by the vault.

\[\mathit{loss} = \frac{a\_1}{1+a\_0}\]

When the user deposits \(u\), he receives

\[10^\delta \times u \times \frac{1+a\_0}{1+a\_0+a\_1}\]

For the attacker to dilute that deposit to 0 shares, causing the user to lose all its deposit, it must ensure that

\[10^\delta \times u \times \frac{1+a\_0}{1+a\_0+a\_1} < 1\]

\[\iff 10^\delta \times u < \frac{1+a\_0+a\_1}{1+a\_0}\]

\[\iff 10^\delta \times u < 1 + \frac{a\_1}{1+a\_0}\]

\[\iff 10^\delta \times u \le \mathit{loss}\]

* If the offset is 0, the attacker loss is at least equal to the user’s deposit.
* If the offset is greater than 0, the attacker will have to suffer losses that are orders of magnitude bigger than the amount of value that can hypothetically be stolen from the user.

This shows that even with an offset of 0, the virtual shares and assets make this attack non profitable for the attacker. Bigger offsets increase the security even further by making any attack on the user extremely wasteful.

The following figure shows how the offset impacts the initial rate and limits the ability of an attacker with limited funds to inflate it effectively.

\(\delta = 3\), \(a\_0 = 1\), \(a\_1 = 10^5\)

\(\delta = 3\), \(a\_0 = 100\), \(a\_1 = 10^5\)

\(\delta = 6\), \(a\_0 = 1\), \(a\_1 = 10^5\)

## Usage

### Custom behavior: Adding fees to the vault

In ERC4626 vaults, fees can be captured during the deposit/mint and/or during the withdraw/redeem steps.
In both cases, it is essential to remain compliant with the ERC4626 requirements in regard to the preview functions.

For example, if calling `deposit(100, receiver)`, the caller should deposit exactly 100 underlying tokens, including fees, and the receiver should receive a number of shares that matches the value returned by `preview_deposit(100)`.
Similarly, `preview_mint` should account for the fees that the user will have to pay on top of share’s cost.

As for the `Deposit` event, while this is less clear in the EIP spec itself,
there seems to be consensus that it should include the number of assets paid for by the user, including the fees.

On the other hand, when withdrawing assets, the number given by the user should correspond to what the user receives.
Any fees should be added to the quote (in shares) performed by `preview_withdraw`.

The `Withdraw` event should include the number of shares the user burns (including fees) and the number of assets the user actually receives (after fees are deducted).

The consequence of this design is that both the `Deposit` and `Withdraw` events will describe two exchange rates.
The spread between the "Buy-in" and the "Exit" prices correspond to the fees taken by the vault.

The following example describes how fees proportional to the deposited/withdrawn amount can be implemented:

```
/// The mock contract charges fees in terms of assets, not shares.
/// This means that the fees are calculated based on the amount of assets that are being deposited
/// or withdrawn, and not based on the amount of shares that are being minted or redeemed.
/// This is an opinionated design decision for the purpose of testing.
/// DO NOT USE IN PRODUCTION
#[starknet::contract]
pub mod ERC4626Fees {
    use openzeppelin_token::erc20::extensions::erc4626::ERC4626Component;
    use openzeppelin_token::erc20::extensions::erc4626::ERC4626Component::FeeConfigTrait;
    use openzeppelin_token::erc20::extensions::erc4626::ERC4626Component::InternalTrait as ERC4626InternalTrait;
    use openzeppelin_token::erc20::extensions::erc4626::{DefaultConfig, ERC4626DefaultLimits};
    use openzeppelin_token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
    use openzeppelin_token::erc20::{ERC20Component, ERC20HooksEmptyImpl};
    use openzeppelin_utils::math;
    use openzeppelin_utils::math::Rounding;
    use starknet::ContractAddress;
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};

    component!(path: ERC4626Component, storage: erc4626, event: ERC4626Event);
    component!(path: ERC20Component, storage: erc20, event: ERC20Event);

    // ERC4626
    #[abi(embed_v0)]
    impl ERC4626ComponentImpl = ERC4626Component::ERC4626Impl<ContractState>;
    // ERC4626MetadataImpl is a custom impl of IERC20Metadata
    #[abi(embed_v0)]
    impl ERC4626MetadataImpl = ERC4626Component::ERC4626MetadataImpl<ContractState>;

    // ERC20
    #[abi(embed_v0)]
    impl ERC20Impl = ERC20Component::ERC20Impl<ContractState>;
    #[abi(embed_v0)]
    impl ERC20CamelOnlyImpl = ERC20Component::ERC20CamelOnlyImpl<ContractState>;

    impl ERC4626InternalImpl = ERC4626Component::InternalImpl<ContractState>;
    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;

    #[storage]
    pub struct Storage {
        #[substorage(v0)]
        pub erc4626: ERC4626Component::Storage,
        #[substorage(v0)]
        pub erc20: ERC20Component::Storage,
        pub entry_fee_basis_point_value: u256,
        pub entry_fee_recipient: ContractAddress,
        pub exit_fee_basis_point_value: u256,
        pub exit_fee_recipient: ContractAddress,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC4626Event: ERC4626Component::Event,
        #[flat]
        ERC20Event: ERC20Component::Event,
    }

    const _BASIS_POINT_SCALE: u256 = 10_000;

    /// Hooks
    impl ERC4626HooksEmptyImpl of ERC4626Component::ERC4626HooksTrait<ContractState> {
        fn after_deposit(
            ref self: ERC4626Component::ComponentState<ContractState>, assets: u256, shares: u256,
        ) {
            let mut contract_state = self.get_contract_mut();
            let entry_basis_points = contract_state.entry_fee_basis_point_value.read();
            let fee = contract_state.fee_on_total(assets, entry_basis_points);
            let recipient = contract_state.entry_fee_recipient.read();

            if fee > 0 && recipient != starknet::get_contract_address() {
                contract_state.transfer_fees(recipient, fee);
            }
        }

        fn before_withdraw(
            ref self: ERC4626Component::ComponentState<ContractState>, assets: u256, shares: u256,
        ) {
            let mut contract_state = self.get_contract_mut();
            let exit_basis_points = contract_state.exit_fee_basis_point_value.read();
            let fee = contract_state.fee_on_raw(assets, exit_basis_points);
            let recipient = contract_state.exit_fee_recipient.read();

            if fee > 0 && recipient != starknet::get_contract_address() {
                contract_state.transfer_fees(recipient, fee);
            }
        }
    }

    /// Adjust fees
    impl AdjustFeesImpl of FeeConfigTrait<ContractState> {
        fn adjust_deposit(
            self: @ERC4626Component::ComponentState<ContractState>, assets: u256,
        ) -> u256 {
            let contract_state = self.get_contract();
            contract_state.remove_fee_from_deposit(assets)
        }

        fn adjust_mint(
            self: @ERC4626Component::ComponentState<ContractState>, assets: u256,
        ) -> u256 {
            let contract_state = self.get_contract();
            contract_state.add_fee_to_mint(assets)
        }

        fn adjust_withdraw(
            self: @ERC4626Component::ComponentState<ContractState>, assets: u256,
        ) -> u256 {
            let contract_state = self.get_contract();
            contract_state.add_fee_to_withdraw(assets)
        }

        fn adjust_redeem(
            self: @ERC4626Component::ComponentState<ContractState>, assets: u256,
        ) -> u256 {
            let contract_state = self.get_contract();
            contract_state.remove_fee_from_redeem(assets)
        }
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        name: ByteArray,
        symbol: ByteArray,
        underlying_asset: ContractAddress,
        initial_supply: u256,
        recipient: ContractAddress,
        entry_fee: u256,
        entry_treasury: ContractAddress,
        exit_fee: u256,
        exit_treasury: ContractAddress,
    ) {
        self.erc20.initializer(name, symbol);
        self.erc20.mint(recipient, initial_supply);
        self.erc4626.initializer(underlying_asset);

        self.entry_fee_basis_point_value.write(entry_fee);
        self.entry_fee_recipient.write(entry_treasury);
        self.exit_fee_basis_point_value.write(exit_fee);
        self.exit_fee_recipient.write(exit_treasury);
    }

    #[generate_trait]
    pub impl InternalImpl of InternalTrait {
        fn transfer_fees(ref self: ContractState, recipient: ContractAddress, fee: u256) {
            let asset_address = self.asset();
            let asset_dispatcher = IERC20Dispatcher { contract_address: asset_address };
            assert(asset_dispatcher.transfer(recipient, fee), 'Fee transfer failed');
        }

        fn remove_fee_from_deposit(self: @ContractState, assets: u256) -> u256 {
            let fee = self.fee_on_total(assets, self.entry_fee_basis_point_value.read());
            assets - fee
        }

        fn add_fee_to_mint(self: @ContractState, assets: u256) -> u256 {
            assets + self.fee_on_raw(assets, self.entry_fee_basis_point_value.read())
        }

        fn add_fee_to_withdraw(self: @ContractState, assets: u256) -> u256 {
            let fee = self.fee_on_raw(assets, self.exit_fee_basis_point_value.read());
            assets + fee
        }

        fn remove_fee_from_redeem(self: @ContractState, assets: u256) -> u256 {
            assets - self.fee_on_total(assets, self.exit_fee_basis_point_value.read())
        }

        ///
        /// Fee operations
        ///

        /// Calculates the fees that should be added to an amount `assets` that does not already
        /// include fees.
        /// Used in IERC4626::mint and IERC4626::withdraw operations.
        fn fee_on_raw(self: @ContractState, assets: u256, fee_basis_points: u256) -> u256 {
            math::u256_mul_div(assets, fee_basis_points, _BASIS_POINT_SCALE, Rounding::Ceil)
        }

        /// Calculates the fee part of an amount `assets` that already includes fees.
        /// Used in IERC4626::deposit and IERC4626::redeem operations.
        fn fee_on_total(self: @ContractState, assets: u256, fee_basis_points: u256) -> u256 {
            math::u256_mul_div(
                assets, fee_basis_points, fee_basis_points + _BASIS_POINT_SCALE, Rounding::Ceil,
            )
        }
    }
}
```

## Interface

The following interface represents the full ABI of the Contracts for Cairo ERC4626Component.
The full interface includes the IERC4626, IERC20, and IERC20Metadata interfaces.
Note that implementing the IERC20Metadata interface is a requirement of IERC4626.

```
#[starknet::interface]
pub trait ERC4626ABI {
    // IERC4626
    fn asset() -> ContractAddress;
    fn total_assets() -> u256;
    fn convert_to_shares(assets: u256) -> u256;
    fn convert_to_assets(shares: u256) -> u256;
    fn max_deposit(receiver: ContractAddress) -> u256;
    fn preview_deposit(assets: u256) -> u256;
    fn deposit(assets: u256, receiver: ContractAddress) -> u256;
    fn max_mint(receiver: ContractAddress) -> u256;
    fn preview_mint(shares: u256) -> u256;
    fn mint(shares: u256, receiver: ContractAddress) -> u256;
    fn max_withdraw(owner: ContractAddress) -> u256;
    fn preview_withdraw(assets: u256) -> u256;
    fn withdraw(
        assets: u256, receiver: ContractAddress, owner: ContractAddress,
    ) -> u256;
    fn max_redeem(owner: ContractAddress) -> u256;
    fn preview_redeem(shares: u256) -> u256;
    fn redeem(
        shares: u256, receiver: ContractAddress, owner: ContractAddress,
    ) -> u256;

    // IERC20
    fn total_supply() -> u256;
    fn balance_of(account: ContractAddress) -> u256;
    fn allowance(owner: ContractAddress, spender: ContractAddress) -> u256;
    fn transfer(recipient: ContractAddress, amount: u256) -> bool;
    fn transfer_from(
        sender: ContractAddress, recipient: ContractAddress, amount: u256,
    ) -> bool;
    fn approve(spender: ContractAddress, amount: u256) -> bool;

    // IERC20Metadata
    fn name() -> ByteArray;
    fn symbol() -> ByteArray;
    fn decimals() -> u8;

    // IERC20CamelOnly
    fn totalSupply() -> u256;
    fn balanceOf(account: ContractAddress) -> u256;
    fn transferFrom(
        sender: ContractAddress, recipient: ContractAddress, amount: u256,
    ) -> bool;
}
```

← API Reference

API Reference →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0-alpha.0/erc721

## ERC721 - OpenZeppelin Docs

You are not reading the current version of this documentation. 2.0.0 is the current version.

# ERC721

The ERC721 token standard is a specification for non-fungible tokens, or more colloquially: NFTs.
`token::erc721::ERC721Component` provides an approximation of EIP-721 in Cairo for Starknet.

## Usage

Using Contracts for Cairo, constructing an ERC721 contract requires integrating both `ERC721Component` and `SRC5Component`.
The contract should also set up the constructor to initialize the token’s name, symbol, and interface support.
Here’s an example of a basic contract:

```
#[starknet::contract]
mod MyNFT {
    use openzeppelin_introspection::src5::SRC5Component;
    use openzeppelin_token::erc721::{ERC721Component, ERC721HooksEmptyImpl};
    use starknet::ContractAddress;

    component!(path: ERC721Component, storage: erc721, event: ERC721Event);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    // ERC721 Mixin
    #[abi(embed_v0)]
    impl ERC721MixinImpl = ERC721Component::ERC721MixinImpl<ContractState>;
    impl ERC721InternalImpl = ERC721Component::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        erc721: ERC721Component::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC721Event: ERC721Component::Event,
        #[flat]
        SRC5Event: SRC5Component::Event
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        recipient: ContractAddress
    ) {
        let name = "MyNFT";
        let symbol = "NFT";
        let base_uri = "https://api.example.com/v1/";
        let token_id = 1;

        self.erc721.initializer(name, symbol, base_uri);
        self.erc721.mint(recipient, token_id);
    }
}
```

## Interface

The following interface represents the full ABI of the Contracts for Cairo ERC721Component.
The interface includes the IERC721 standard interface and the optional IERC721Metadata interface.

To support older token deployments, as mentioned in Dual interfaces, the component also includes implementations of the interface written in camelCase.

```
#[starknet::interface]
pub trait ERC721ABI {
    // IERC721
    fn balance_of(account: ContractAddress) -> u256;
    fn owner_of(token_id: u256) -> ContractAddress;
    fn safe_transfer_from(
        from: ContractAddress,
        to: ContractAddress,
        token_id: u256,
        data: Span<felt252>
    );
    fn transfer_from(from: ContractAddress, to: ContractAddress, token_id: u256);
    fn approve(to: ContractAddress, token_id: u256);
    fn set_approval_for_all(operator: ContractAddress, approved: bool);
    fn get_approved(token_id: u256) -> ContractAddress;
    fn is_approved_for_all(owner: ContractAddress, operator: ContractAddress) -> bool;

    // IERC721Metadata
    fn name() -> ByteArray;
    fn symbol() -> ByteArray;
    fn token_uri(token_id: u256) -> ByteArray;

    // IERC721CamelOnly
    fn balanceOf(account: ContractAddress) -> u256;
    fn ownerOf(tokenId: u256) -> ContractAddress;
    fn safeTransferFrom(
        from: ContractAddress,
        to: ContractAddress,
        tokenId: u256,
        data: Span<felt252>
    );
    fn transferFrom(from: ContractAddress, to: ContractAddress, tokenId: u256);
    fn setApprovalForAll(operator: ContractAddress, approved: bool);
    fn getApproved(tokenId: u256) -> ContractAddress;
    fn isApprovedForAll(owner: ContractAddress, operator: ContractAddress) -> bool;

    // IERC721MetadataCamelOnly
    fn tokenURI(tokenId: u256) -> ByteArray;
}
```

## ERC721 compatibility

Although Starknet is not EVM compatible, this implementation aims to be as close as possible to the ERC721 standard.
This implementation does, however, include a few notable differences such as:

* `interface_id`s are hardcoded and initialized by the constructor.
  The hardcoded values derive from Starknet’s selector calculations.
  See the Introspection docs.
* `safe_transfer_from` can only be expressed as a single function in Cairo as opposed to the two functions declared in EIP721, because function overloading is currently not possible in Cairo.
  The difference between both functions consists of accepting `data` as an argument.
  `safe_transfer_from` by default accepts the `data` argument which is interpreted as `Span<felt252>`.
  If `data` is not used, simply pass an empty array.
* ERC721 utilizes SRC5 to declare and query interface support on Starknet as opposed to Ethereum’s EIP165.
  The design for `SRC5` is similar to OpenZeppelin’s ERC165Storage.
* `IERC721Receiver` compliant contracts return a hardcoded interface ID according to Starknet selectors (as opposed to selector calculation in Solidity).

## Token transfers

This library includes transfer\_from and safe\_transfer\_from to transfer NFTs.
If using `transfer_from`, **the caller is responsible to confirm that the recipient is capable of receiving NFTs or else they may be permanently lost.**
The `safe_transfer_from` method mitigates this risk by querying the recipient contract’s interface support.

|  |  |
| --- | --- |
|  | Usage of `safe_transfer_from` prevents loss, though the caller must understand this adds an external call which potentially creates a reentrancy vulnerability. |

## Receiving tokens

In order to be sure a non-account contract can safely accept ERC721 tokens, said contract must implement the `IERC721Receiver` interface.
The recipient contract must also implement the SRC5 interface which, as described earlier, supports interface introspection.

### IERC721Receiver

```
#[starknet::interface]
pub trait IERC721Receiver {
    fn on_erc721_received(
        operator: ContractAddress,
        from: ContractAddress,
        token_id: u256,
        data: Span<felt252>
    ) -> felt252;
}
```

Implementing the `IERC721Receiver` interface exposes the on\_erc721\_received method.
When safe methods such as safe\_transfer\_from and safe\_mint are called, they invoke the recipient contract’s `on_erc721_received` method which **must** return the IERC721Receiver interface ID.
Otherwise, the transaction will fail.

|  |  |
| --- | --- |
|  | For information on how to calculate interface IDs, see Computing the interface ID. |

### Creating a token receiver contract

The Contracts for Cairo `IERC721ReceiverImpl` already returns the correct interface ID for safe token transfers.
To integrate the `IERC721Receiver` interface into a contract, simply include the ABI embed directive to the implementation and add the `initializer` in the contract’s constructor.
Here’s an example of a simple token receiver contract:

```
#[starknet::contract]
mod MyTokenReceiver {
    use openzeppelin_introspection::src5::SRC5Component;
    use openzeppelin_token::erc721::ERC721ReceiverComponent;
    use starknet::ContractAddress;

    component!(path: ERC721ReceiverComponent, storage: erc721_receiver, event: ERC721ReceiverEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    // ERC721Receiver Mixin
    #[abi(embed_v0)]
    impl ERC721ReceiverMixinImpl = ERC721ReceiverComponent::ERC721ReceiverMixinImpl<ContractState>;
    impl ERC721ReceiverInternalImpl = ERC721ReceiverComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        erc721_receiver: ERC721ReceiverComponent::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC721ReceiverEvent: ERC721ReceiverComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event
    }

    #[constructor]
    fn constructor(ref self: ContractState) {
        self.erc721_receiver.initializer();
    }
}
```

## Storing ERC721 URIs

Token URIs were previously stored as single field elements prior to Cairo v0.2.5.
ERC721Component now stores only the base URI as a `ByteArray` and the full token URI is returned as the `ByteArray` concatenation of the base URI and the token ID through the token\_uri method.
This design mirrors OpenZeppelin’s default Solidity implementation for ERC721.

← API Reference

API Reference →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0-alpha.0/finance

## Finance - OpenZeppelin Docs

You are not reading the current version of this documentation. 2.0.0 is the current version.

# Finance

This module includes primitives for financial systems.

## Vesting component

The VestingComponent manages the gradual release of ERC-20 tokens to a designated beneficiary based on a predefined vesting schedule.
The implementing contract must implement the OwnableComponent, where the contract owner is regarded as the vesting beneficiary.
This structure allows ownership rights of both the contract and the vested tokens to be assigned and transferred.

|  |  |
| --- | --- |
|  | Any assets transferred to this contract will follow the vesting schedule as if they were locked from the beginning of the vesting period. As a result, if the vesting has already started, a portion of the newly transferred tokens may become immediately releasable. |

|  |  |
| --- | --- |
|  | By setting the duration to 0, it’s possible to configure this contract to behave like an asset timelock that holds tokens for a beneficiary until a specified date. |

### Vesting schedule

The VestingSchedule trait defines the logic for calculating the vested amount based on a given timestamp. This
logic is not part of the VestingComponent, so any contract implementing the VestingComponent must provide its own
implementation of the VestingSchedule trait.

|  |  |
| --- | --- |
|  | There’s a ready-made implementation of the VestingSchedule trait available named LinearVestingSchedule. It incorporates a cliff period by returning 0 vested amount until the cliff ends. After the cliff, the vested amount is calculated as directly proportional to the time elapsed since the beginning of the vesting schedule. |

### Usage

The contract must integrate VestingComponent and OwnableComponent as dependencies. The contract’s constructor
should initialize both components. Core vesting parameters, such as `beneficiary`, `start`, `duration`
and `cliff_duration`, are passed as arguments to the constructor and set at the time of deployment.

The implementing contract must provide an implementation of the VestingSchedule trait. This can be achieved either by importing
a ready-made LinearVestingSchedule implementation or by defining a custom one.

Here’s an example of a simple vesting wallet contract with a LinearVestingSchedule, where the vested amount
is calculated as being directly proportional to the time elapsed since the start of the vesting period.

```
#[starknet::contract]
mod LinearVestingWallet {
    use openzeppelin_access::ownable::OwnableComponent;
    use openzeppelin_finance::vesting::{VestingComponent, LinearVestingSchedule};
    use starknet::ContractAddress;

    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);
    component!(path: VestingComponent, storage: vesting, event: VestingEvent);

    #[abi(embed_v0)]
    impl OwnableMixinImpl = OwnableComponent::OwnableMixinImpl<ContractState>;
    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;

    #[abi(embed_v0)]
    impl VestingImpl = VestingComponent::VestingImpl<ContractState>;
    impl VestingInternalImpl = VestingComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
        #[substorage(v0)]
        vesting: VestingComponent::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        OwnableEvent: OwnableComponent::Event,
        #[flat]
        VestingEvent: VestingComponent::Event
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        beneficiary: ContractAddress,
        start: u64,
        duration: u64,
        cliff_duration: u64
    ) {
        self.ownable.initializer(beneficiary);
        self.vesting.initializer(start, duration, cliff_duration);
    }
}
```

A vesting schedule will often follow a custom formula. In such cases, the VestingSchedule trait is useful.
To support a custom vesting schedule, the contract must provide an implementation of the
calculate\_vested\_amount function based on the desired formula.

|  |  |
| --- | --- |
|  | When using a custom VestingSchedule implementation, the LinearVestingSchedule must be excluded from the imports. |

|  |  |
| --- | --- |
|  | If there are additional parameters required for calculations, which are stored in the contract’s storage, you can access them using `self.get_contract()`. |

Here’s an example of a vesting wallet contract with a custom VestingSchedule implementation, where tokens
are vested in a number of steps.

```
#[starknet::contract]
mod StepsVestingWallet {
    use openzeppelin_access::ownable::OwnableComponent;
    use openzeppelin_finance::vesting::VestingComponent::VestingScheduleTrait;
    use openzeppelin_finance::vesting::VestingComponent;
    use starknet::ContractAddress;
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};

    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);
    component!(path: VestingComponent, storage: vesting, event: VestingEvent);

    #[abi(embed_v0)]
    impl OwnableMixinImpl = OwnableComponent::OwnableMixinImpl<ContractState>;
    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;

    #[abi(embed_v0)]
    impl VestingImpl = VestingComponent::VestingImpl<ContractState>;
    impl VestingInternalImpl = VestingComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        total_steps: u64,
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
        #[substorage(v0)]
        vesting: VestingComponent::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        OwnableEvent: OwnableComponent::Event,
        #[flat]
        VestingEvent: VestingComponent::Event
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        total_steps: u64,
        beneficiary: ContractAddress,
        start: u64,
        duration: u64,
        cliff: u64,
    ) {
        self.total_steps.write(total_steps);
        self.ownable.initializer(beneficiary);
        self.vesting.initializer(start, duration, cliff);
    }

    impl VestingSchedule of VestingScheduleTrait<ContractState> {
        fn calculate_vested_amount(
            self: @VestingComponent::ComponentState<ContractState>,
            token: ContractAddress,
            total_allocation: u256,
            timestamp: u64,
            start: u64,
            duration: u64,
            cliff: u64,
        ) -> u256 {
            if timestamp < cliff {
                0
            } else if timestamp >= start + duration {
                total_allocation
            } else {
                let total_steps = self.get_contract().total_steps.read();
                let vested_per_step = total_allocation / total_steps.into();
                let step_duration = duration / total_steps;
                let current_step = (timestamp - start) / step_duration;
                let vested_amount = vested_per_step * current_step.into();
                vested_amount
            }
        }
    }
}
```

### Interface

Here is the full interface of a standard contract implementing the vesting functionality:

```
#[starknet::interface]
pub trait VestingABI<TState> {
    // IVesting
    fn start(self: @TState) -> u64;
    fn cliff(self: @TState) -> u64;
    fn duration(self: @TState) -> u64;
    fn end(self: @TState) -> u64;
    fn released(self: @TState, token: ContractAddress) -> u256;
    fn releasable(self: @TState, token: ContractAddress) -> u256;
    fn vested_amount(self: @TState, token: ContractAddress, timestamp: u64) -> u256;
    fn release(ref self: TState, token: ContractAddress) -> u256;

    // IOwnable
    fn owner(self: @TState) -> ContractAddress;
    fn transfer_ownership(ref self: TState, new_owner: ContractAddress);
    fn renounce_ownership(ref self: TState);

    // IOwnableCamelOnly
    fn transferOwnership(ref self: TState, newOwner: ContractAddress);
    fn renounceOwnership(ref self: TState);
}
```

← API Reference

API Reference →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0-alpha.0/governance/governor

## Governor - OpenZeppelin Docs

You are not reading the current version of this documentation. 2.0.0 is the current version.

# Governor

Decentralized protocols are in constant evolution from the moment they are publicly released. Often,
the initial team retains control of this evolution in the first stages, but eventually delegates it
to a community of stakeholders. The process by which this community makes decisions is called
on-chain governance, and it has become a central component of decentralized protocols, fueling
varied decisions such as parameter tweaking, smart contract upgrades, integrations with other
protocols, treasury management, grants, etc.

This governance protocol is generally implemented in a special-purpose contract called “Governor”. In
OpenZeppelin Contracts for Cairo, we set out to build a modular system of Governor components where different
requirements can be accommodated by implementing specific traits. You will find the most common requirements out of the box,
but writing additional ones is simple, and we will be adding new features as requested by the community in future releases.

## Usage and setup

### Token

The voting power of each account in our governance setup will be determined by an ERC20 or an ERC721 token. The token has
to implement the VotesComponent extension. This extension will keep track of historical balances so that voting power
is retrieved from past snapshots rather than current balance, which is an important protection that prevents double voting.

If your project already has a live token that does not include Votes and is not upgradeable, you can wrap it in a
governance token by using a wrapper. This will allow token holders to participate in governance by wrapping their tokens 1-to-1.

|  |  |
| --- | --- |
|  | The library currently does not include a wrapper for tokens, but it will be added in a future release. |

|  |  |
| --- | --- |
|  | Currently, the clock mode is fixed to block timestamps, since the Votes component uses the block timestamp to track checkpoints. We plan to add support for more flexible clock modes in Votes in a future release, allowing to use, for example, block numbers instead. |

### Governor

We will initially build a Governor without a timelock. The core logic is given by the GovernorComponent, but we
still need to choose:

1) how voting power is determined,

2) how many votes are needed for quorum,

3) what options people have when casting a vote and how those votes are counted, and

4) the execution mechanism that should be used.

Each of these aspects is customizable by writing your own extensions,
or more easily choosing one from the library.

**For 1)** we will use the GovernorVotes extension, which hooks to an IVotes instance to determine the voting power
of an account based on the token balance they hold when a proposal becomes active.
This module requires the address of the token to be passed as an argument to the initializer.

**For 2)** we will use GovernorVotesQuorumFraction. This works together with the IVotes instance to define the quorum as a
percentage of the total supply at the block when a proposal’s voting power is retrieved. This requires an initializer
parameter to set the percentage besides the votes token address. Most Governors nowadays use 4%. Since the quorum denominator
is 1000 for precision, we initialize the module with a numerator of 40, resulting in a 4% quorum (40/1000 = 0.04 or 4%).

**For 3)** we will use GovernorCountingSimple, an extension that offers 3 options to voters: For, Against, and Abstain,
and where only For and Abstain votes are counted towards quorum.

**For 4)** we will use GovernorCoreExecution, an extension that allows proposal execution directly through the governor.

|  |  |
| --- | --- |
|  | Another option is GovernorTimelockExecution. An example can be found in the next section. |

Besides these, we also need an implementation for the GovernorSettingsTrait defining the voting delay, voting period,
and proposal threshold. While we can use the GovernorSettings extension which allows to set these parameters by the
governor itself, we will implement the trait locally in the contract and set the voting delay, voting period,
and proposal threshold as constant values.

*voting\_delay*: How long after a proposal is created should voting power be fixed. A large voting delay gives
users time to unstake tokens if necessary.

*voting\_period*: How long does a proposal remain open to votes.

|  |  |
| --- | --- |
|  | These parameters are specified in the unit defined in the token’s clock, which is for now always timestamps. |

*proposal\_threshold*: This restricts proposal creation to accounts who have enough voting power.

An implementation of `GovernorComponent::ImmutableConfig` is also required. For the example below, we have used
the `DefaultConfig`. Check the Immutable Component Config guide for more details.

The last missing step is to add an `SNIP12Metadata` implementation used to retrieve the name and version of the governor.

```
#[starknet::contract]
mod MyGovernor {
    use openzeppelin_governance::governor::GovernorComponent::InternalTrait as GovernorInternalTrait;
    use openzeppelin_governance::governor::extensions::GovernorVotesQuorumFractionComponent::InternalTrait;
    use openzeppelin_governance::governor::extensions::{
        GovernorVotesQuorumFractionComponent, GovernorCountingSimpleComponent,
        GovernorCoreExecutionComponent,
    };
    use openzeppelin_governance::governor::{GovernorComponent, DefaultConfig};
    use openzeppelin_introspection::src5::SRC5Component;
    use openzeppelin_utils::cryptography::snip12::SNIP12Metadata;
    use starknet::ContractAddress;

    pub const VOTING_DELAY: u64 = 86400; // 1 day
    pub const VOTING_PERIOD: u64 = 604800; // 1 week
    pub const PROPOSAL_THRESHOLD: u256 = 10;
    pub const QUORUM_NUMERATOR: u256 = 40; // 4%

    component!(path: GovernorComponent, storage: governor, event: GovernorEvent);
    component!(
        path: GovernorVotesQuorumFractionComponent,
        storage: governor_votes,
        event: GovernorVotesEvent
    );
    component!(
        path: GovernorCountingSimpleComponent,
        storage: governor_counting_simple,
        event: GovernorCountingSimpleEvent
    );
    component!(
        path: GovernorCoreExecutionComponent,
        storage: governor_core_execution,
        event: GovernorCoreExecutionEvent
    );
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    // Governor
    #[abi(embed_v0)]
    impl GovernorImpl = GovernorComponent::GovernorImpl<ContractState>;

    // Extensions external
    #[abi(embed_v0)]
    impl QuorumFractionImpl =
        GovernorVotesQuorumFractionComponent::QuorumFractionImpl<ContractState>;

    // Extensions internal
    impl GovernorQuorumImpl = GovernorVotesQuorumFractionComponent::GovernorQuorum<ContractState>;
    impl GovernorVotesImpl = GovernorVotesQuorumFractionComponent::GovernorVotes<ContractState>;
    impl GovernorCountingSimpleImpl =
        GovernorCountingSimpleComponent::GovernorCounting<ContractState>;
    impl GovernorCoreExecutionImpl =
        GovernorCoreExecutionComponent::GovernorExecution<ContractState>;

    // SRC5
    #[abi(embed_v0)]
    impl SRC5Impl = SRC5Component::SRC5Impl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        pub governor: GovernorComponent::Storage,
        #[substorage(v0)]
        pub governor_votes: GovernorVotesQuorumFractionComponent::Storage,
        #[substorage(v0)]
        pub governor_counting_simple: GovernorCountingSimpleComponent::Storage,
        #[substorage(v0)]
        pub governor_core_execution: GovernorCoreExecutionComponent::Storage,
        #[substorage(v0)]
        pub src5: SRC5Component::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        GovernorEvent: GovernorComponent::Event,
        #[flat]
        GovernorVotesEvent: GovernorVotesQuorumFractionComponent::Event,
        #[flat]
        GovernorCountingSimpleEvent: GovernorCountingSimpleComponent::Event,
        #[flat]
        GovernorCoreExecutionEvent: GovernorCoreExecutionComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
    }

    #[constructor]
    fn constructor(ref self: ContractState, votes_token: ContractAddress) {
        self.governor.initializer();
        self.governor_votes.initializer(votes_token, QUORUM_NUMERATOR);
    }

    //
    // SNIP12 Metadata
    //

    pub impl SNIP12MetadataImpl of SNIP12Metadata {
        fn name() -> felt252 {
            'DAPP_NAME'
        }

        fn version() -> felt252 {
            'DAPP_VERSION'
        }
    }

    //
    // Locally implemented extensions
    //

    pub impl GovernorSettings of GovernorComponent::GovernorSettingsTrait<ContractState> {
        /// See `GovernorComponent::GovernorSettingsTrait::voting_delay`.
        fn voting_delay(self: @GovernorComponent::ComponentState<ContractState>) -> u64 {
            VOTING_DELAY
        }

        /// See `GovernorComponent::GovernorSettingsTrait::voting_period`.
        fn voting_period(self: @GovernorComponent::ComponentState<ContractState>) -> u64 {
            VOTING_PERIOD
        }

        /// See `GovernorComponent::GovernorSettingsTrait::proposal_threshold`.
        fn proposal_threshold(self: @GovernorComponent::ComponentState<ContractState>) -> u256 {
            PROPOSAL_THRESHOLD
        }
    }
}
```

### Timelock

It is good practice to add a timelock to governance decisions. This allows users to exit the system if they disagree
with a decision before it is executed. We will use OpenZeppelin’s TimelockController in combination with the
GovernorTimelockExecution extension.

|  |  |
| --- | --- |
|  | When using a timelock, it is the timelock that will execute proposals and thus the timelock that should hold any funds, ownership, and access control roles. |

TimelockController uses an AccessControl setup that we need to understand in order to set up roles.

The Proposer role is in charge of queueing operations: this is the role the Governor instance must be granted,
and it MUST be the only proposer (and canceller) in the system.

The Executor role is in charge of executing already available operations: we can assign this role to the special
zero address to allow anyone to execute (if operations can be particularly time sensitive, the Governor should be made Executor instead).

The Canceller role is in charge of canceling operations: the Governor instance must be granted this role,
and it MUST be the only canceller in the system.

Lastly, there is the Admin role, which can grant and revoke the two previous roles: this is a very sensitive role that will be granted automatically to the timelock itself, and optionally to a second account, which can be used for ease of setup but should promptly renounce the role.

The following example uses the GovernorTimelockExecution extension, together with GovernorSettings, and uses a
fixed quorum value instead of a percentage:

```
#[starknet::contract]
pub mod MyTimelockedGovernor {
    use openzeppelin_governance::governor::GovernorComponent::InternalTrait as GovernorInternalTrait;
    use openzeppelin_governance::governor::extensions::GovernorSettingsComponent::InternalTrait as GovernorSettingsInternalTrait;
    use openzeppelin_governance::governor::extensions::GovernorTimelockExecutionComponent::InternalTrait as GovernorTimelockExecutionInternalTrait;
    use openzeppelin_governance::governor::extensions::GovernorVotesComponent::InternalTrait as GovernorVotesInternalTrait;
    use openzeppelin_governance::governor::extensions::{
        GovernorVotesComponent, GovernorSettingsComponent, GovernorCountingSimpleComponent,
        GovernorTimelockExecutionComponent
    };
    use openzeppelin_governance::governor::{GovernorComponent, DefaultConfig};
    use openzeppelin_introspection::src5::SRC5Component;
    use openzeppelin_utils::cryptography::snip12::SNIP12Metadata;
    use starknet::ContractAddress;

    pub const VOTING_DELAY: u64 = 86400; // 1 day
    pub const VOTING_PERIOD: u64 = 604800; // 1 week
    pub const PROPOSAL_THRESHOLD: u256 = 10;
    pub const QUORUM: u256 = 100_000_000;

    component!(path: GovernorComponent, storage: governor, event: GovernorEvent);
    component!(path: GovernorVotesComponent, storage: governor_votes, event: GovernorVotesEvent);
    component!(
        path: GovernorSettingsComponent, storage: governor_settings, event: GovernorSettingsEvent
    );
    component!(
        path: GovernorCountingSimpleComponent,
        storage: governor_counting_simple,
        event: GovernorCountingSimpleEvent
    );
    component!(
        path: GovernorTimelockExecutionComponent,
        storage: governor_timelock_execution,
        event: GovernorTimelockExecutionEvent
    );
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    // Governor
    #[abi(embed_v0)]
    impl GovernorImpl = GovernorComponent::GovernorImpl<ContractState>;

    // Extensions external
    #[abi(embed_v0)]
    impl VotesTokenImpl = GovernorVotesComponent::VotesTokenImpl<ContractState>;
    #[abi(embed_v0)]
    impl GovernorSettingsAdminImpl =
        GovernorSettingsComponent::GovernorSettingsAdminImpl<ContractState>;
    #[abi(embed_v0)]
    impl TimelockedImpl =
        GovernorTimelockExecutionComponent::TimelockedImpl<ContractState>;

    // Extensions internal
    impl GovernorVotesImpl = GovernorVotesComponent::GovernorVotes<ContractState>;
    impl GovernorSettingsImpl = GovernorSettingsComponent::GovernorSettings<ContractState>;
    impl GovernorCountingSimpleImpl =
        GovernorCountingSimpleComponent::GovernorCounting<ContractState>;
    impl GovernorTimelockExecutionImpl =
        GovernorTimelockExecutionComponent::GovernorExecution<ContractState>;

    // SRC5
    #[abi(embed_v0)]
    impl SRC5Impl = SRC5Component::SRC5Impl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        pub governor: GovernorComponent::Storage,
        #[substorage(v0)]
        pub governor_votes: GovernorVotesComponent::Storage,
        #[substorage(v0)]
        pub governor_settings: GovernorSettingsComponent::Storage,
        #[substorage(v0)]
        pub governor_counting_simple: GovernorCountingSimpleComponent::Storage,
        #[substorage(v0)]
        pub governor_timelock_execution: GovernorTimelockExecutionComponent::Storage,
        #[substorage(v0)]
        pub src5: SRC5Component::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        GovernorEvent: GovernorComponent::Event,
        #[flat]
        GovernorVotesEvent: GovernorVotesComponent::Event,
        #[flat]
        GovernorSettingsEvent: GovernorSettingsComponent::Event,
        #[flat]
        GovernorCountingSimpleEvent: GovernorCountingSimpleComponent::Event,
        #[flat]
        GovernorTimelockExecutionEvent: GovernorTimelockExecutionComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState, votes_token: ContractAddress, timelock_controller: ContractAddress
    ) {
        self.governor.initializer();
        self.governor_votes.initializer(votes_token);
        self.governor_settings.initializer(VOTING_DELAY, VOTING_PERIOD, PROPOSAL_THRESHOLD);
        self.governor_timelock_execution.initializer(timelock_controller);
    }

    //
    // SNIP12 Metadata
    //

    pub impl SNIP12MetadataImpl of SNIP12Metadata {
        fn name() -> felt252 {
            'DAPP_NAME'
        }

        fn version() -> felt252 {
            'DAPP_VERSION'
        }
    }

    //
    // Locally implemented extensions
    //

    impl GovernorQuorum of GovernorComponent::GovernorQuorumTrait<ContractState> {
        /// See `GovernorComponent::GovernorQuorumTrait::quorum`.
        fn quorum(self: @GovernorComponent::ComponentState<ContractState>, timepoint: u64) -> u256 {
            QUORUM
        }
    }
}
```

## Interface

This is the full interface of the `Governor` implementation:

```
#[starknet::interface]
pub trait IGovernor<TState> {
    fn name(self: @TState) -> felt252;
    fn version(self: @TState) -> felt252;
    fn COUNTING_MODE(self: @TState) -> ByteArray;
    fn hash_proposal(self: @TState, calls: Span<Call>, description_hash: felt252) -> felt252;
    fn state(self: @TState, proposal_id: felt252) -> ProposalState;
    fn proposal_threshold(self: @TState) -> u256;
    fn proposal_snapshot(self: @TState, proposal_id: felt252) -> u64;
    fn proposal_deadline(self: @TState, proposal_id: felt252) -> u64;
    fn proposal_proposer(self: @TState, proposal_id: felt252) -> ContractAddress;
    fn proposal_eta(self: @TState, proposal_id: felt252) -> u64;
    fn proposal_needs_queuing(self: @TState, proposal_id: felt252) -> bool;
    fn voting_delay(self: @TState) -> u64;
    fn voting_period(self: @TState) -> u64;
    fn quorum(self: @TState, timepoint: u64) -> u256;
    fn get_votes(self: @TState, account: ContractAddress, timepoint: u64) -> u256;
    fn get_votes_with_params(
        self: @TState, account: ContractAddress, timepoint: u64, params: Span<felt252>
    ) -> u256;
    fn has_voted(self: @TState, proposal_id: felt252, account: ContractAddress) -> bool;
    fn propose(ref self: TState, calls: Span<Call>, description: ByteArray) -> felt252;
    fn queue(ref self: TState, calls: Span<Call>, description_hash: felt252) -> felt252;
    fn execute(ref self: TState, calls: Span<Call>, description_hash: felt252) -> felt252;
    fn cancel(ref self: TState, calls: Span<Call>, description_hash: felt252) -> felt252;
    fn cast_vote(ref self: TState, proposal_id: felt252, support: u8) -> u256;
    fn cast_vote_with_reason(
        ref self: TState, proposal_id: felt252, support: u8, reason: ByteArray
    ) -> u256;
    fn cast_vote_with_reason_and_params(
        ref self: TState,
        proposal_id: felt252,
        support: u8,
        reason: ByteArray,
        params: Span<felt252>
    ) -> u256;
    fn cast_vote_by_sig(
        ref self: TState,
        proposal_id: felt252,
        support: u8,
        voter: ContractAddress,
        signature: Span<felt252>
    ) -> u256;
    fn cast_vote_with_reason_and_params_by_sig(
        ref self: TState,
        proposal_id: felt252,
        support: u8,
        voter: ContractAddress,
        reason: ByteArray,
        params: Span<felt252>,
        signature: Span<felt252>
    ) -> u256;
    fn nonces(self: @TState, voter: ContractAddress) -> felt252;
    fn relay(ref self: TState, call: Call);
}
```

← API Reference

Multisig →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0-alpha.0/governance/multisig

## Multisig - OpenZeppelin Docs

You are not reading the current version of this documentation. 2.0.0 is the current version.

# Multisig

The Multisig component implements a multi-signature mechanism to enhance the security and
governance of smart contract transactions. It ensures that no single signer can unilaterally
execute critical actions, requiring multiple registered signers to approve and collectively
execute transactions.

This component is designed to secure operations such as fund management or protocol governance,
where collective decision-making is essential. The Multisig Component is self-administered,
meaning that changes to signers or quorum must be approved through the multisig process itself.

## Key features

* **Multi-Signature Security**: transactions must be approved by multiple signers, ensuring
  distributed governance.
* **Quorum Enforcement**: defines the minimum number of approvals required for transaction execution.
* **Self-Administration**: all modifications to the component (e.g., adding or removing signers)
  must pass through the multisig process.
* **Event Logging**: provides comprehensive event logging for transparency and auditability.

## Signer management

The Multisig component introduces the concept of signers and quorum:

* **Signers**: only registered signers can submit, confirm, revoke, or execute transactions. The Multisig
  Component supports adding, removing, or replacing signers.
* **Quorum**: the quorum defines the minimum number of confirmations required to approve a transaction.

|  |  |
| --- | --- |
|  | To prevent unauthorized modifications, only the contract itself can add, remove, or replace signers or change the quorum. This ensures that all modifications pass through the multisig approval process. |

## Transaction lifecycle

The state of a transaction is represented by the `TransactionState` enum and can be retrieved
by calling the `get_transaction_state` function with the transaction’s identifier.

The identifier of a multisig transaction is a `felt252` value, computed as the Pedersen hash
of the transaction’s calls and salt. It can be computed by invoking the implementing contract’s
`hash_transaction` method for single-call transactions or `hash_transaction_batch` for multi-call
transactions. Submitting a transaction with identical calls and the same salt value a second time
will fail, as transaction identifiers must be unique. To resolve this, use a different salt value
to generate a unique identifier.

A transaction in the Multisig component follows a specific lifecycle:

`NotFound` → `Pending` → `Confirmed` → `Executed`

* **NotFound**: the transaction does not exist.
* **Pending**: the transaction exists but has not reached the required confirmations.
* **Confirmed**: the transaction has reached the quorum but has not yet been executed.
* **Executed**: the transaction has been successfully executed.

## Usage

Integrating the Multisig functionality into a contract requires implementing MultisigComponent.
The contract’s constructor should initialize the component with a quorum value and a list of initial signers.

Here’s an example of a simple wallet contract featuring the Multisig functionality:

```
#[starknet::contract]
mod MultisigWallet {
    use openzeppelin_governance::multisig::MultisigComponent;
    use starknet::ContractAddress;

    component!(path: MultisigComponent, storage: multisig, event: MultisigEvent);

    #[abi(embed_v0)]
    impl MultisigImpl = MultisigComponent::MultisigImpl<ContractState>;
    impl MultisigInternalImpl = MultisigComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        multisig: MultisigComponent::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        MultisigEvent: MultisigComponent::Event,
    }

    #[constructor]
    fn constructor(ref self: ContractState, quorum: u32, signers: Span<ContractAddress>) {
        self.multisig.initializer(quorum, signers);
    }
}
```

## Interface

This is the interface of a contract implementing the MultisigComponent:

```
#[starknet::interface]
pub trait MultisigABI<TState> {
    // Read functions
    fn get_quorum(self: @TState) -> u32;
    fn is_signer(self: @TState, signer: ContractAddress) -> bool;
    fn get_signers(self: @TState) -> Span<ContractAddress>;
    fn is_confirmed(self: @TState, id: TransactionID) -> bool;
    fn is_confirmed_by(self: @TState, id: TransactionID, signer: ContractAddress) -> bool;
    fn is_executed(self: @TState, id: TransactionID) -> bool;
    fn get_submitted_block(self: @TState, id: TransactionID) -> u64;
    fn get_transaction_state(self: @TState, id: TransactionID) -> TransactionState;
    fn get_transaction_confirmations(self: @TState, id: TransactionID) -> u32;
    fn hash_transaction(
        self: @TState,
        to: ContractAddress,
        selector: felt252,
        calldata: Span<felt252>,
        salt: felt252,
    ) -> TransactionID;
    fn hash_transaction_batch(self: @TState, calls: Span<Call>, salt: felt252) -> TransactionID;

    // Write functions
    fn add_signers(ref self: TState, new_quorum: u32, signers_to_add: Span<ContractAddress>);
    fn remove_signers(ref self: TState, new_quorum: u32, signers_to_remove: Span<ContractAddress>);
    fn replace_signer(
        ref self: TState, signer_to_remove: ContractAddress, signer_to_add: ContractAddress,
    );
    fn change_quorum(ref self: TState, new_quorum: u32);
    fn submit_transaction(
        ref self: TState,
        to: ContractAddress,
        selector: felt252,
        calldata: Span<felt252>,
        salt: felt252,
    ) -> TransactionID;
    fn submit_transaction_batch(
        ref self: TState, calls: Span<Call>, salt: felt252,
    ) -> TransactionID;
    fn confirm_transaction(ref self: TState, id: TransactionID);
    fn revoke_confirmation(ref self: TState, id: TransactionID);
    fn execute_transaction(
        ref self: TState,
        to: ContractAddress,
        selector: felt252,
        calldata: Span<felt252>,
        salt: felt252,
    );
    fn execute_transaction_batch(ref self: TState, calls: Span<Call>, salt: felt252);
}
```

← Governor

Timelock Controller →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0-alpha.0/governance/timelock

## Timelock Controller - OpenZeppelin Docs

You are not reading the current version of this documentation. 2.0.0 is the current version.

# Timelock Controller

The Timelock Controller provides a means of enforcing time delays on the execution of transactions. This is considered good practice regarding governance systems because it allows users the opportunity to exit the system if they disagree with a decision before it is executed.

|  |  |
| --- | --- |
|  | The Timelock contract itself executes transactions, not the user. The Timelock should, therefore, hold associated funds, ownership, and access control roles. |

## Operation lifecycle

The state of an operation is represented by the `OperationState` enum and can be retrieved
by calling the `get_operation_state` function with the operation’s identifier.

The identifier of an operation is a `felt252` value, computed as the Pedersen hash of the
operation’s call or calls, its predecessor, and salt. It can be computed by invoking the
implementing contract’s `hash_operation` function for single-call operations or
`hash_operation_batch` for multi-call operations. Submitting an operation with identical calls,
predecessor, and the same salt value a second time will fail, as operation identifiers must be
unique. To resolve this, use a different salt value to generate a unique identifier.

Timelocked operations follow a specific lifecycle:

`Unset` → `Waiting` → `Ready` → `Done`

* `Unset`: the operation has not been scheduled or has been canceled.
* `Waiting`: the operation has been scheduled and is pending the scheduled delay.
* `Ready`: the timer has expired, and the operation is eligible for execution.
* `Done`: the operation has been executed.

## Timelock flow

### Schedule

When a proposer calls schedule, the `OperationState` moves from `Unset` to `Waiting`.
This starts a timer that must be greater than or equal to the minimum delay.
The timer expires at a timestamp accessible through get\_timestamp.
Once the timer expires, the `OperationState` automatically moves to the `Ready` state.
At this point, it can be executed.

### Execute

By calling execute, an executor triggers the operation’s underlying transactions and moves it to the `Done` state. If the operation has a predecessor, the predecessor’s operation must be in the `Done` state for this transaction to succeed.

### Cancel

The cancel function allows cancellers to cancel any pending operations.
This resets the operation to the `Unset` state.
It is therefore possible for a proposer to re-schedule an operation that has been cancelled.
In this case, the timer restarts when the operation is re-scheduled.

### Roles

TimelockControllerComponent leverages an AccessControlComponent setup that we need to understand in order to set up roles.

* `PROPOSER_ROLE` - in charge of queueing operations.
* `CANCELLER_ROLE` - may cancel scheduled operations.
  During initialization, accounts granted with `PROPOSER_ROLE` will also be granted `CANCELLER_ROLE`.
  Therefore, the initial proposers may also cancel operations after they are scheduled.
* `EXECUTOR_ROLE` - in charge of executing already available operations.
* `DEFAULT_ADMIN_ROLE` - can grant and revoke the three previous roles.

|  |  |
| --- | --- |
|  | The `DEFAULT_ADMIN_ROLE` is a sensitive role that will be granted automatically to the timelock itself and optionally to a second account. The latter case may be required to ease a contract’s initial configuration; however, this role should promptly be renounced. |

Furthermore, the timelock component supports the concept of open roles for the `EXECUTOR_ROLE`.
This allows anyone to execute an operation once it’s in the `Ready` OperationState.
To enable the `EXECUTOR_ROLE` to be open, grant the zero address with the `EXECUTOR_ROLE`.

|  |  |
| --- | --- |
|  | Be very careful with enabling open roles as *anyone* can call the function. |

### Minimum delay

The minimum delay of the timelock acts as a buffer from when a proposer schedules an operation to the earliest point at which an executor may execute that operation.
The idea is for users, should they disagree with a scheduled proposal, to have options such as exiting the system or making their case for cancellers to cancel the operation.

After initialization, the only way to change the timelock’s minimum delay is to schedule it and execute it with the same flow as any other operation.

The minimum delay of a contract is accessible through get\_min\_delay.

### Usage

Integrating the timelock into a contract requires integrating TimelockControllerComponent as well as SRC5Component and AccessControlComponent as dependencies.
The contract’s constructor should initialize the timelock which consists of setting the:

* Proposers and executors.
* Minimum delay between scheduling and executing an operation.
* Optional admin if additional configuration is required.

|  |  |
| --- | --- |
|  | The optional admin should renounce their role once configuration is complete. |

Here’s an example of a simple timelock contract:

```
#[starknet::contract]
mod TimelockControllerContract {
    use openzeppelin_access::accesscontrol::AccessControlComponent;
    use openzeppelin_governance::timelock::TimelockControllerComponent;
    use openzeppelin_introspection::src5::SRC5Component;
    use starknet::ContractAddress;

    component!(path: AccessControlComponent, storage: access_control, event: AccessControlEvent);
    component!(path: TimelockControllerComponent, storage: timelock, event: TimelockEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    // Timelock Mixin
    #[abi(embed_v0)]
    impl TimelockMixinImpl =
        TimelockControllerComponent::TimelockMixinImpl<ContractState>;
    impl TimelockInternalImpl = TimelockControllerComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        access_control: AccessControlComponent::Storage,
        #[substorage(v0)]
        timelock: TimelockControllerComponent::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        AccessControlEvent: AccessControlComponent::Event,
        #[flat]
        TimelockEvent: TimelockControllerComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        min_delay: u64,
        proposers: Span<ContractAddress>,
        executors: Span<ContractAddress>,
        admin: ContractAddress
    ) {
        self.timelock.initializer(min_delay, proposers, executors, admin);
    }
}
```

### Interface

This is the full interface of the TimelockMixinImpl implementation:

```
#[starknet::interface]
pub trait TimelockABI<TState> {
    // ITimelock
    fn is_operation(self: @TState, id: felt252) -> bool;
    fn is_operation_pending(self: @TState, id: felt252) -> bool;
    fn is_operation_ready(self: @TState, id: felt252) -> bool;
    fn is_operation_done(self: @TState, id: felt252) -> bool;
    fn get_timestamp(self: @TState, id: felt252) -> u64;
    fn get_operation_state(self: @TState, id: felt252) -> OperationState;
    fn get_min_delay(self: @TState) -> u64;
    fn hash_operation(self: @TState, call: Call, predecessor: felt252, salt: felt252) -> felt252;
    fn hash_operation_batch(
        self: @TState, calls: Span<Call>, predecessor: felt252, salt: felt252
    ) -> felt252;
    fn schedule(ref self: TState, call: Call, predecessor: felt252, salt: felt252, delay: u64);
    fn schedule_batch(
        ref self: TState, calls: Span<Call>, predecessor: felt252, salt: felt252, delay: u64
    );
    fn cancel(ref self: TState, id: felt252);
    fn execute(ref self: TState, call: Call, predecessor: felt252, salt: felt252);
    fn execute_batch(ref self: TState, calls: Span<Call>, predecessor: felt252, salt: felt252);
    fn update_delay(ref self: TState, new_delay: u64);

    // ISRC5
    fn supports_interface(self: @TState, interface_id: felt252) -> bool;

    // IAccessControl
    fn has_role(self: @TState, role: felt252, account: ContractAddress) -> bool;
    fn get_role_admin(self: @TState, role: felt252) -> felt252;
    fn grant_role(ref self: TState, role: felt252, account: ContractAddress);
    fn revoke_role(ref self: TState, role: felt252, account: ContractAddress);
    fn renounce_role(ref self: TState, role: felt252, account: ContractAddress);

    // IAccessControlCamel
    fn hasRole(self: @TState, role: felt252, account: ContractAddress) -> bool;
    fn getRoleAdmin(self: @TState, role: felt252) -> felt252;
    fn grantRole(ref self: TState, role: felt252, account: ContractAddress);
    fn revokeRole(ref self: TState, role: felt252, account: ContractAddress);
    fn renounceRole(ref self: TState, role: felt252, account: ContractAddress);
}
```

← Multisig

Votes →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0-alpha.0/governance/votes

## Votes - OpenZeppelin Docs

You are not reading the current version of this documentation. 2.0.0 is the current version.

# Votes

The VotesComponent provides a flexible system for tracking and delegating voting power. This system allows users to delegate their voting power to other addresses, enabling more active participation in governance.

|  |  |
| --- | --- |
|  | By default, token balance does not account for voting power. This makes transfers cheaper. The downside is that it requires users to delegate to themselves in order to activate checkpoints and have their voting power tracked. |

|  |  |
| --- | --- |
|  | The transferring of voting units must be handled by the implementing contract. In the case of `ERC20` and `ERC721` this is usually done via the hooks. You can check the usage section for examples of how to implement this. |

## Key features

1. **Delegation**: Users can delegate their voting power to any address, including themselves. Vote power can be delegated either by calling the delegate function directly, or by providing a signature to be used with delegate\_by\_sig.
2. **Historical lookups**: The system keeps track of historical snapshots for each account, which allows the voting power of an account to be queried at a specific timestamp.  
   This can be used for example to determine the voting power of an account when a proposal was created, rather than using the current balance.

## Usage

When integrating the `VotesComponent`, the VotingUnitsTrait must be implemented to get the voting units for a given account as a function of the implementing contract.  
For simplicity, this module already provides two implementations for `ERC20` and `ERC721` tokens, which will work out of the box if the respective components are integrated.  
Additionally, you must implement the NoncesComponent and the SNIP12Metadata trait to enable delegation by signatures.

Here’s an example of how to structure a simple ERC20Votes contract:

```
#[starknet::contract]
mod ERC20VotesContract {
    use openzeppelin_governance::votes::VotesComponent;
    use openzeppelin_token::erc20::{ERC20Component, DefaultConfig};
    use openzeppelin_utils::cryptography::nonces::NoncesComponent;
    use openzeppelin_utils::cryptography::snip12::SNIP12Metadata;
    use starknet::ContractAddress;

    component!(path: VotesComponent, storage: erc20_votes, event: ERC20VotesEvent);
    component!(path: ERC20Component, storage: erc20, event: ERC20Event);
    component!(path: NoncesComponent, storage: nonces, event: NoncesEvent);

    // Votes
    #[abi(embed_v0)]
    impl VotesImpl = VotesComponent::VotesImpl<ContractState>;
    impl VotesInternalImpl = VotesComponent::InternalImpl<ContractState>;

    // ERC20
    #[abi(embed_v0)]
    impl ERC20MixinImpl = ERC20Component::ERC20MixinImpl<ContractState>;
    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;

    // Nonces
    #[abi(embed_v0)]
    impl NoncesImpl = NoncesComponent::NoncesImpl<ContractState>;

    #[storage]
    pub struct Storage {
        #[substorage(v0)]
        pub erc20_votes: VotesComponent::Storage,
        #[substorage(v0)]
        pub erc20: ERC20Component::Storage,
        #[substorage(v0)]
        pub nonces: NoncesComponent::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC20VotesEvent: VotesComponent::Event,
        #[flat]
        ERC20Event: ERC20Component::Event,
        #[flat]
        NoncesEvent: NoncesComponent::Event
    }

    // Required for hash computation.
    pub impl SNIP12MetadataImpl of SNIP12Metadata {
        fn name() -> felt252 {
            'DAPP_NAME'
        }
        fn version() -> felt252 {
            'DAPP_VERSION'
        }
    }

    // We need to call the `transfer_voting_units` function after
    // every mint, burn and transfer.
    // For this, we use the `after_update` hook of the `ERC20Component::ERC20HooksTrait`.
    impl ERC20VotesHooksImpl of ERC20Component::ERC20HooksTrait<ContractState> {
        fn after_update(
            ref self: ERC20Component::ComponentState<ContractState>,
            from: ContractAddress,
            recipient: ContractAddress,
            amount: u256
        ) {
            let mut contract_state = self.get_contract_mut();
            contract_state.erc20_votes.transfer_voting_units(from, recipient, amount);
        }
    }

    #[constructor]
    fn constructor(ref self: ContractState) {
        self.erc20.initializer("MyToken", "MTK");
    }
}
```

And here’s an example of how to structure a simple ERC721Votes contract:

```
#[starknet::contract]
pub mod ERC721VotesContract {
    use openzeppelin_governance::votes::VotesComponent;
    use openzeppelin_introspection::src5::SRC5Component;
    use openzeppelin_token::erc721::ERC721Component;
    use openzeppelin_utils::cryptography::nonces::NoncesComponent;
    use openzeppelin_utils::cryptography::snip12::SNIP12Metadata;
    use starknet::ContractAddress;

    component!(path: VotesComponent, storage: erc721_votes, event: ERC721VotesEvent);
    component!(path: ERC721Component, storage: erc721, event: ERC721Event);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);
    component!(path: NoncesComponent, storage: nonces, event: NoncesEvent);

    // Votes
    #[abi(embed_v0)]
    impl VotesImpl = VotesComponent::VotesImpl<ContractState>;
    impl VotesInternalImpl = VotesComponent::InternalImpl<ContractState>;

    // ERC721
    #[abi(embed_v0)]
    impl ERC721MixinImpl = ERC721Component::ERC721MixinImpl<ContractState>;
    impl ERC721InternalImpl = ERC721Component::InternalImpl<ContractState>;

    // Nonces
    #[abi(embed_v0)]
    impl NoncesImpl = NoncesComponent::NoncesImpl<ContractState>;

    #[storage]
    pub struct Storage {
        #[substorage(v0)]
        pub erc721_votes: VotesComponent::Storage,
        #[substorage(v0)]
        pub erc721: ERC721Component::Storage,
        #[substorage(v0)]
        pub src5: SRC5Component::Storage,
        #[substorage(v0)]
        pub nonces: NoncesComponent::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC721VotesEvent: VotesComponent::Event,
        #[flat]
        ERC721Event: ERC721Component::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
        #[flat]
        NoncesEvent: NoncesComponent::Event
    }

    /// Required for hash computation.
    pub impl SNIP12MetadataImpl of SNIP12Metadata {
        fn name() -> felt252 {
            'DAPP_NAME'
        }
        fn version() -> felt252 {
            'DAPP_VERSION'
        }
    }

    // We need to call the `transfer_voting_units` function after
    // every mint, burn and transfer.
    // For this, we use the `before_update` hook of the
    //`ERC721Component::ERC721HooksTrait`.
    // This hook is called before the transfer is executed.
    // This gives us access to the previous owner.
    impl ERC721VotesHooksImpl of ERC721Component::ERC721HooksTrait<ContractState> {
        fn before_update(
            ref self: ERC721Component::ComponentState<ContractState>,
            to: ContractAddress,
            token_id: u256,
            auth: ContractAddress
        ) {
            let mut contract_state = self.get_contract_mut();

            // We use the internal function here since it does not check if the token
            // id exists which is necessary for mints
            let previous_owner = self._owner_of(token_id);
            contract_state.erc721_votes.transfer_voting_units(previous_owner, to, 1);
        }
    }

    #[constructor]
    fn constructor(ref self: ContractState) {
        self.erc721.initializer("MyToken", "MTK", "");
    }
}
```

## Interface

This is the full interface of the `VotesImpl` implementation:

```
#[starknet::interface]
pub trait VotesABI<TState> {
    // IVotes
    fn get_votes(self: @TState, account: ContractAddress) -> u256;
    fn get_past_votes(self: @TState, account: ContractAddress, timepoint: u64) -> u256;
    fn get_past_total_supply(self: @TState, timepoint: u64) -> u256;
    fn delegates(self: @TState, account: ContractAddress) -> ContractAddress;
    fn delegate(ref self: TState, delegatee: ContractAddress);
    fn delegate_by_sig(ref self: TState, delegator: ContractAddress, delegatee: ContractAddress, nonce: felt252, expiry: u64, signature: Span<felt252>);

    // INonces
    fn nonces(self: @TState, owner: ContractAddress) -> felt252;
}
```

← Timelock Controller

API Reference →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0-alpha.0/guides/deployment

## Counterfactual deployments - OpenZeppelin Docs

You are not reading the current version of this documentation. 2.0.0 is the current version.

# Counterfactual deployments

A counterfactual contract is a contract we can interact with even before actually deploying it on-chain.
For example, we can send funds or assign privileges to a contract that doesn’t yet exist.
Why? Because deployments in Starknet are deterministic, allowing us to predict the address where our contract will be deployed.
We can leverage this property to make a contract pay for its own deployment by simply sending funds in advance. We call this a counterfactual deployment.

This process can be described with the following steps:

|  |  |
| --- | --- |
|  | For testing this flow you can check the Starknet Foundry or the Starkli guides for deploying accounts. |

1. Deterministically precompute the `contract_address` given a `class_hash`, `salt`, and constructor `calldata`.
   Note that the `class_hash` must be previously declared for the deployment to succeed.
2. Send funds to the `contract_address`. Usually you will estimate the fee of the transaction first. Existing
   tools usually do this for you.
3. Send a `DeployAccount` type transaction to the network.
4. The protocol will then validate the transaction with the `__validate_deploy__` entrypoint of the contract to be deployed.
5. If the validation succeeds, the protocol will charge the fee and then register the contract as deployed.

|  |  |
| --- | --- |
|  | Although this method is very popular to deploy accounts, this works for any kind of contract. |

## Deployment validation

To be counterfactually deployed, the deploying contract must implement the `__validate_deploy__` entrypoint,
called by the protocol when a `DeployAccount` transaction is sent to the network.

```
trait IDeployable {
    /// Must return 'VALID' when the validation is successful.
    fn __validate_deploy__(
        class_hash: felt252, contract_address_salt: felt252, public_key: felt252
    ) -> felt252;
}
```

← Interfaces and Dispatchers

SNIP12 and Typed Messages →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0-alpha.0/guides/erc20-permit

## ERC20Permit - OpenZeppelin Docs

You are not reading the current version of this documentation. 2.0.0 is the current version.

# ERC20Permit

The EIP-2612 standard, commonly referred to as ERC20Permit, is designed to support gasless token approvals. This is achieved with an off-chain
signature following the SNIP12 standard, rather than with an on-chain transaction. The permit function verifies the signature and sets
the spender’s allowance if the signature is valid. This approach improves user experience and reduces gas costs.

## Differences from Solidity

Although this extension is mostly similar to the Solidity implementation of EIP-2612, there are some notable differences in the parameters of the permit function:

* The `deadline` parameter is represented by `u64` rather than `u256`.
* The `signature` parameter is represented by a span of felts rather than `v`, `r`, and `s` values.

|  |  |
| --- | --- |
|  | Unlike Solidity, there is no enforced format for signatures on Starknet. A signature is represented by an array or span of felts, and there is no universal method for validating signatures of unknown formats. Consequently, a signature provided to the permit function is validated through an external `is_valid_signature` call to the contract at the `owner` address. |

## Usage

The functionality is provided as an embeddable ERC20Permit trait of the ERC20Component.

```
#[abi(embed_v0)]
impl ERC20PermitImpl = ERC20Component::ERC20PermitImpl<ContractState>;
```

A contract must meet the following requirements to be able to use the ERC20Permit trait:

* Implement ERC20Component.
* Implement NoncesComponent.
* Implement SNIP12Metadata trait (used in signature generation).

## Typed message

To safeguard against replay attacks and ensure the uniqueness of each approval via permit, the data signed includes:

* The address of the `owner`.
* The parameters specified in the approve function (`spender` and `amount`)
* The address of the `token` contract itself.
* A `nonce`, which must be unique for each operation.
* The `chain_id`, which protects against cross-chain replay attacks.

The format of the `Permit` structure in a signed permit message is as follows:

```
struct Permit {
    token: ContractAddress,
    spender: ContractAddress,
    amount: u256,
    nonce: felt252,
    deadline: u64,
}
```

|  |  |
| --- | --- |
|  | The owner of the tokens is also part of the signed message. It is used as the `signer` parameter in the `get_message_hash` call. |

Further details on preparing and signing a typed message can be found in the SNIP12 guide.

← Creating Supply

API Reference →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0-alpha.0/guides/erc20-supply

## Creating ERC20 Supply - OpenZeppelin Docs

You are not reading the current version of this documentation. 2.0.0 is the current version.

# Creating ERC20 Supply

The standard interface implemented by tokens built on Starknet comes from the popular token standard on Ethereum called ERC20.
EIP20, from which ERC20 contracts are derived, does not specify how tokens are created.
This guide will go over strategies for creating both a fixed and dynamic token supply.

## Fixed Supply

Let’s say we want to create a token named `MyToken` with a fixed token supply.
We can achieve this by setting the token supply in the constructor which will execute upon deployment.

```
#[starknet::contract]
mod MyToken {
    use openzeppelin_token::erc20::{ERC20Component, ERC20HooksEmptyImpl};
    use starknet::ContractAddress;

    component!(path: ERC20Component, storage: erc20, event: ERC20Event);

    // ERC20 Mixin
    #[abi(embed_v0)]
    impl ERC20MixinImpl = ERC20Component::ERC20MixinImpl<ContractState>;
    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        erc20: ERC20Component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC20Event: ERC20Component::Event
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        fixed_supply: u256,
        recipient: ContractAddress
    ) {
        let name = "MyToken";
        let symbol = "MTK";

        self.erc20.initializer(name, symbol);
        self.erc20.mint(recipient, fixed_supply);
    }
}
```

In the constructor, we’re first calling the ERC20 initializer to set the token name and symbol.
Next, we’re calling the internal `mint` function which creates `fixed_supply` of tokens and allocates them to `recipient`.
Since the internal `mint` is not exposed in our contract, it will not be possible to create any more tokens.
In other words, we’ve implemented a fixed token supply!

## Dynamic Supply

ERC20 contracts with a dynamic supply include a mechanism for creating or destroying tokens.
Let’s make a few changes to the almighty `MyToken` contract and create a minting mechanism.

```
#[starknet::contract]
mod MyToken {
    use openzeppelin_token::erc20::{ERC20Component, ERC20HooksEmptyImpl};
    use starknet::ContractAddress;

    component!(path: ERC20Component, storage: erc20, event: ERC20Event);

   // ERC20 Mixin
    #[abi(embed_v0)]
    impl ERC20MixinImpl = ERC20Component::ERC20MixinImpl<ContractState>;
    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        erc20: ERC20Component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC20Event: ERC20Component::Event
    }

    #[constructor]
    fn constructor(ref self: ContractState) {
        let name = "MyToken";
        let symbol = "MTK";

        self.erc20.initializer(name, symbol);
    }

    #[external(v0)]
    fn mint(
        ref self: ContractState,
        recipient: ContractAddress,
        amount: u256
    ) {
        // This function is NOT protected which means
        // ANYONE can mint tokens
        self.erc20.mint(recipient, amount);
    }
}
```

The exposed `mint` above will create `amount` tokens and allocate them to `recipient`.
We now have our minting mechanism!

There is, however, a big problem.
`mint` does not include any restrictions on who can call this function.
For the sake of good practices, let’s implement a simple permissioning mechanism with `Ownable`.

```
#[starknet::contract]
mod MyToken {

    (...)

    // Integrate Ownable

    #[external(v0)]
    fn mint(
        ref self: ContractState,
        recipient: ContractAddress,
        amount: u256
    ) {
        // Set permissions with Ownable
        self.ownable.assert_only_owner();

        // Mint tokens if called by the contract owner
        self.erc20.mint(recipient, amount);
    }
}
```

In the constructor, we pass the owner address to set the owner of the `MyToken` contract.
The `mint` function includes `assert_only_owner` which will ensure that only the contract owner can call this function.
Now, we have a protected ERC20 minting mechanism to create a dynamic token supply.

|  |  |
| --- | --- |
|  | For a more thorough explanation of permission mechanisms, see Access Control. |

← ERC20

ERC20Permit →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0-alpha.0/guides/snip12

## SNIP12 and Typed Messages - OpenZeppelin Docs

You are not reading the current version of this documentation. 2.0.0 is the current version.

# SNIP12 and Typed Messages

Similar to EIP712, SNIP12 is a standard for secure off-chain signature verification on Starknet.
It provides a way to hash and sign generic typed structs rather than just strings. When building decentralized
applications, usually you might need to sign a message with complex data. The purpose of signature verification
is then to ensure that the received message was indeed signed by the expected signer, and it hasn’t been tampered with.

OpenZeppelin Contracts for Cairo provides a set of utilities to make the implementation of this standard
as easy as possible, and in this guide we will walk you through the process of generating the hashes of typed messages
using these utilities for on-chain signature verification. For that, let’s build an example with a custom ERC20 contract
adding an extra `transfer_with_signature` method.

|  |  |
| --- | --- |
|  | This is an educational example, and it is not intended to be used in production environments. |

## CustomERC20

Let’s start with a basic ERC20 contract leveraging the ERC20Component, and let’s add the new function.
Note that some declarations are omitted for brevity. The full example will be available at the end of the guide.

```
#[starknet::contract]
mod CustomERC20 {
    use openzeppelin_token::erc20::{ERC20Component, ERC20HooksEmptyImpl};
    use starknet::ContractAddress;

    component!(path: ERC20Component, storage: erc20, event: ERC20Event);

    #[abi(embed_v0)]
    impl ERC20MixinImpl = ERC20Component::ERC20MixinImpl<ContractState>;
    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;

    (...)

    #[constructor]
    fn constructor(
        ref self: ContractState,
        initial_supply: u256,
        recipient: ContractAddress
    ) {
        self.erc20.initializer("MyToken", "MTK");
        self.erc20.mint(recipient, initial_supply);
    }

    #[external(v0)]
    fn transfer_with_signature(
        ref self: ContractState,
        recipient: ContractAddress,
        amount: u256,
        nonce: felt252,
        expiry: u64,
        signature: Array<felt252>
    ) {
        (...)
    }
}
```

The `transfer_with_signature` function will allow a user to transfer tokens to another account by providing a signature.
The signature will be generated off-chain, and it will be used to verify the message on-chain. Note that the message
we need to verify is a struct with the following fields:

* `recipient`: The address of the recipient.
* `amount`: The amount of tokens to transfer.
* `nonce`: A unique number to prevent replay attacks.
* `expiry`: The timestamp when the signature expires.

Note that generating the hash of this message on-chain is a requirement to verify the signature, because if we accept
the message as a parameter, it could be easily tampered with.

## Generating the Typed Message Hash

To generate the hash of the message, we need to follow these steps:

### 1. Define the message struct.

In this particular example, the message struct looks like this:

```
struct Message {
    recipient: ContractAddress,
    amount: u256,
    nonce: felt252,
    expiry: u64
}
```

### 2. Get the message type hash.

This is the `starknet_keccak(encode_type(message))` as defined in the SNIP.

In this case it can be computed as follows:

```
// Since there's no u64 type in SNIP-12, we use u128 for `expiry` in the type hash generation.
let message_type_hash = selector!(
    "\"Message\"(\"recipient\":\"ContractAddress\",\"amount\":\"u256\",\"nonce\":\"felt\",\"expiry\":\"u128\")\"u256\"(\"low\":\"u128\",\"high\":\"u128\")"
);
```

which is the same as:

```
let message_type_hash = 0x28bf13f11bba405c77ce010d2781c5903cbed100f01f72fcff1664f98343eb6;
```

|  |  |
| --- | --- |
|  | In practice it’s better to compute the type hash off-chain and hardcode it in the contract, since it is a constant value. |

### 3. Implement the `StructHash` trait for the struct.

You can import the trait from: `openzeppelin_utils::snip12::StructHash`. And this implementation
is nothing more than the encoding of the message as defined in the SNIP.

```
use core::hash::{HashStateExTrait, HashStateTrait};
use core::poseidon::PoseidonTrait;
use openzeppelin_utils::snip12::StructHash;
use starknet::ContractAddress;

const MESSAGE_TYPE_HASH: felt252 =
    0x28bf13f11bba405c77ce010d2781c5903cbed100f01f72fcff1664f98343eb6;

#[derive(Copy, Drop, Hash)]
struct Message {
    recipient: ContractAddress,
    amount: u256,
    nonce: felt252,
    expiry: u64
}

impl StructHashImpl of StructHash<Message> {
    fn hash_struct(self: @Message) -> felt252 {
        let hash_state = PoseidonTrait::new();
        hash_state.update_with(MESSAGE_TYPE_HASH).update_with(*self).finalize()
    }
}
```

### 4. Implement the `SNIP12Metadata` trait.

This implementation determines the values of the domain separator. Only the `name` and `version` fields are required
because the `chain_id` is obtained on-chain, and the `revision` is hardcoded to `1`.

```
use openzeppelin_utils::snip12::SNIP12Metadata;

impl SNIP12MetadataImpl of SNIP12Metadata {
    fn name() -> felt252 { 'DAPP_NAME' }
    fn version() -> felt252 { 'v1' }
}
```

In the above example, no storage reads are required which avoids unnecessary extra gas costs, but in
some cases we may need to read from storage to get the domain separator values. This can be accomplished even when
the trait is not bounded to the ContractState, like this:

```
use openzeppelin_utils::snip12::SNIP12Metadata;

impl SNIP12MetadataImpl of SNIP12Metadata {
    fn name() -> felt252 {
        let state = unsafe_new_contract_state();

        // Some logic to get the name from storage
        state.erc20.name().at(0).unwrap().into()
    }

    fn version() -> felt252 { 'v1' }
}
```

### 5. Generate the hash.

The final step is to use the `OffchainMessageHashImpl` implementation to generate the hash of the message
using the `get_message_hash` function. The implementation is already available as a utility.

```
use core::hash::{HashStateExTrait, HashStateTrait};
use core::poseidon::PoseidonTrait;
use openzeppelin_utils::snip12::{SNIP12Metadata, StructHash, OffchainMessageHash};
use starknet::ContractAddress;

const MESSAGE_TYPE_HASH: felt252 =
    0x28bf13f11bba405c77ce010d2781c5903cbed100f01f72fcff1664f98343eb6;

#[derive(Copy, Drop, Hash)]
struct Message {
    recipient: ContractAddress,
    amount: u256,
    nonce: felt252,
    expiry: u64
}

impl StructHashImpl of StructHash<Message> {
    fn hash_struct(self: @Message) -> felt252 {
        let hash_state = PoseidonTrait::new();
        hash_state.update_with(MESSAGE_TYPE_HASH).update_with(*self).finalize()
    }
}

impl SNIP12MetadataImpl of SNIP12Metadata {
    fn name() -> felt252 {
        'DAPP_NAME'
    }
    fn version() -> felt252 {
        'v1'
    }
}

fn get_hash(
    account: ContractAddress, recipient: ContractAddress, amount: u256, nonce: felt252, expiry: u64
) -> felt252 {
    let message = Message { recipient, amount, nonce, expiry };
    message.get_message_hash(account)
}
```

|  |  |
| --- | --- |
|  | The expected parameter for the `get_message_hash` function is the address of account that signed the message. |

## Full Implementation

Finally, the full implementation of the `CustomERC20` contract looks like this:

|  |  |
| --- | --- |
|  | We are using the `ISRC6Dispatcher` to verify the signature, and the `NoncesComponent` to handle nonces to prevent replay attacks. |

```
use core::hash::{HashStateExTrait, HashStateTrait};
use core::poseidon::PoseidonTrait;
use openzeppelin_utils::snip12::{SNIP12Metadata, StructHash, OffchainMessageHash};
use starknet::ContractAddress;

const MESSAGE_TYPE_HASH: felt252 =
    0x28bf13f11bba405c77ce010d2781c5903cbed100f01f72fcff1664f98343eb6;

#[derive(Copy, Drop, Hash)]
struct Message {
    recipient: ContractAddress,
    amount: u256,
    nonce: felt252,
    expiry: u64
}

impl StructHashImpl of StructHash<Message> {
    fn hash_struct(self: @Message) -> felt252 {
        let hash_state = PoseidonTrait::new();
        hash_state.update_with(MESSAGE_TYPE_HASH).update_with(*self).finalize()
    }
}

#[starknet::contract]
mod CustomERC20 {
    use openzeppelin_account::interface::{ISRC6Dispatcher, ISRC6DispatcherTrait};
    use openzeppelin_token::erc20::{ERC20Component, ERC20HooksEmptyImpl};
    use openzeppelin_utils::cryptography::nonces::NoncesComponent;
    use starknet::ContractAddress;

    use super::{Message, OffchainMessageHash, SNIP12Metadata};

    component!(path: ERC20Component, storage: erc20, event: ERC20Event);
    component!(path: NoncesComponent, storage: nonces, event: NoncesEvent);

    #[abi(embed_v0)]
    impl ERC20MixinImpl = ERC20Component::ERC20MixinImpl<ContractState>;
    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;

    #[abi(embed_v0)]
    impl NoncesImpl = NoncesComponent::NoncesImpl<ContractState>;
    impl NoncesInternalImpl = NoncesComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        erc20: ERC20Component::Storage,
        #[substorage(v0)]
        nonces: NoncesComponent::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC20Event: ERC20Component::Event,
        #[flat]
        NoncesEvent: NoncesComponent::Event
    }

    #[constructor]
    fn constructor(ref self: ContractState, initial_supply: u256, recipient: ContractAddress) {
        self.erc20.initializer("MyToken", "MTK");
        self.erc20.mint(recipient, initial_supply);
    }

    /// Required for hash computation.
    impl SNIP12MetadataImpl of SNIP12Metadata {
        fn name() -> felt252 {
            'CustomERC20'
        }
        fn version() -> felt252 {
            'v1'
        }
    }

    #[external(v0)]
    fn transfer_with_signature(
        ref self: ContractState,
        recipient: ContractAddress,
        amount: u256,
        nonce: felt252,
        expiry: u64,
        signature: Array<felt252>
    ) {
        assert(starknet::get_block_timestamp() <= expiry, 'Expired signature');
        let owner = starknet::get_caller_address();

        // Check and increase nonce
        self.nonces.use_checked_nonce(owner, nonce);

        // Build hash for calling `is_valid_signature`
        let message = Message { recipient, amount, nonce, expiry };
        let hash = message.get_message_hash(owner);

        let is_valid_signature_felt = ISRC6Dispatcher { contract_address: owner }
            .is_valid_signature(hash, signature);

        // Check either 'VALID' or true for backwards compatibility
        let is_valid_signature = is_valid_signature_felt == starknet::VALIDATED
            || is_valid_signature_felt == 1;
        assert(is_valid_signature, 'Invalid signature');

        // Transfer tokens
        self.erc20._transfer(owner, recipient, amount);
    }
}
```

← Counterfactual Deployments

Access →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0-alpha.0/guides/src5-migration

## Migrating ERC165 to SRC5 - OpenZeppelin Docs

You are not reading the current version of this documentation. 2.0.0 is the current version.

# Migrating ERC165 to SRC5

In the smart contract ecosystem, having the ability to query if a contract supports a given interface is an extremely important feature.
The initial introspection design for Contracts for Cairo before version v0.7.0 followed Ethereum’s EIP-165.
Since the Cairo language evolved introducing native types, we needed an introspection solution tailored to the Cairo ecosystem: the SNIP-5 standard.
SNIP-5 allows interface ID calculations to use Cairo types and the Starknet keccak (`sn_keccak`) function.
For more information on the decision, see the Starknet Shamans proposal or the Dual Introspection Detection discussion.

## How to migrate

Migrating from ERC165 to SRC5 involves four major steps:

1. Integrate SRC5 into the contract.
2. Register SRC5 IDs.
3. Add a `migrate` function to apply introspection changes.
4. Upgrade the contract and call `migrate`.

The following guide will go through the steps with examples.

### Component integration

The first step is to integrate the necessary components into the new contract.
The contract should include the new introspection mechanism, SRC5Component.
It should also include the InitializableComponent which will be used in the `migrate` function.
Here’s the setup:

```
#[starknet::contract]
mod MigratingContract {
    use openzeppelin_introspection::src5::SRC5Component;
    use openzeppelin_security::initializable::InitializableComponent;

    component!(path: SRC5Component, storage: src5, event: SRC5Event);
    component!(path: InitializableComponent, storage: initializable, event: InitializableEvent);

    // SRC5
    #[abi(embed_v0)]
    impl SRC5Impl = SRC5Component::SRC5Impl<ContractState>;
    impl SRC5InternalImpl = SRC5Component::InternalImpl<ContractState>;

    // Initializable
    impl InitializableInternalImpl = InitializableComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        src5: SRC5Component::Storage,
        #[substorage(v0)]
        initializable: InitializableComponent::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        SRC5Event: SRC5Component::Event,
        #[flat]
        InitializableEvent: InitializableComponent::Event
    }
}
```

### Interface registration

To successfully migrate ERC165 to SRC5, the contract needs to register the interface IDs that the contract supports with SRC5.

For this example, let’s say that this contract supports the IERC721 and IERC721Metadata interfaces.
The contract should implement an `InternalImpl` and add a function to register those interfaces like this:

```
#[starknet::contract]
mod MigratingContract {
    use openzeppelin_token::erc721::interface::{IERC721_ID, IERC721_METADATA_ID};

    (...)

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        // Register SRC5 interfaces
        fn register_src5_interfaces(ref self: ContractState) {
            self.src5.register_interface(IERC721_ID);
            self.src5.register_interface(IERC721_METADATA_ID);
        }
    }
}
```

Since the new contract integrates `SRC5Component`, it can leverage SRC5’s register\_interface function to register the supported interfaces.

### Migration initializer

Next, the contract should define and expose a migration function that will invoke the `register_src5_interfaces` function.
Since the `migrate` function will be publicly callable, it should include some sort of Access Control so that only permitted addresses can execute the migration.
Finally, `migrate` should include a reinitialization check to ensure that it cannot be called more than once.

|  |  |
| --- | --- |
|  | If the original contract implemented `Initializable` at any point and called the `initialize` method, the `InitializableComponent` will not be usable at this time. Instead, the contract can take inspiration from `InitializableComponent` and create its own initialization mechanism. |

```
#[starknet::contract]
mod MigratingContract {
    (...)

    #[external(v0)]
    fn migrate(ref self: ContractState) {
        // WARNING: Missing Access Control mechanism. Make sure to add one

        // WARNING: If the contract ever implemented `Initializable` in the past,
        // this will not work. Make sure to create a new initialization mechanism
        self.initializable.initialize();

        // Register SRC5 interfaces
        self.register_src5_interfaces();
    }
}
```

### Execute migration

Once the new contract is prepared for migration and **rigorously tested**, all that’s left is to migrate!
Simply upgrade the contract and then call `migrate`.

← Introspection

API Reference →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0-alpha.0/interfaces

## Interfaces and Dispatchers - OpenZeppelin Docs

You are not reading the current version of this documentation. 2.0.0 is the current version.

# Interfaces and Dispatchers

This section describes the interfaces OpenZeppelin Contracts for Cairo offer, and explains the design choices behind them.

Interfaces can be found in the module tree under the `interface` submodule, such as `token::erc20::interface`. For example:

```
use openzeppelin_token::erc20::interface::IERC20;
```

or

```
use openzeppelin_token::erc20::interface::ERC20ABI;
```

|  |  |
| --- | --- |
|  | For simplicity, we’ll use ERC20 as example but the same concepts apply to other modules. |

## Interface traits

The library offers three types of traits to implement or interact with contracts:

### Standard traits

These are associated with a predefined interface such as a standard.
This includes only the functions defined in the interface, and is the standard way to interact with a compliant contract.

```
#[starknet::interface]
pub trait IERC20<TState> {
    fn total_supply(self: @TState) -> u256;
    fn balance_of(self: @TState, account: ContractAddress) -> u256;
    fn allowance(self: @TState, owner: ContractAddress, spender: ContractAddress) -> u256;
    fn transfer(ref self: TState, recipient: ContractAddress, amount: u256) -> bool;
    fn transfer_from(
        ref self: TState, sender: ContractAddress, recipient: ContractAddress, amount: u256
    ) -> bool;
    fn approve(ref self: TState, spender: ContractAddress, amount: u256) -> bool;
}
```

### ABI traits

They describe a contract’s complete interface. This is useful to interface with a preset contract offered by this library, such as the ERC20 preset that includes functions from different traits such as `IERC20` and `IERC20Camel`.

|  |  |
| --- | --- |
|  | The library offers an ABI trait for most components, providing all external function signatures even when most of the time all of them don’t need to be implemented at the same time. This can be helpful when interacting with a contract implementing the component, instead of defining a new dispatcher. |

```
#[starknet::interface]
pub trait ERC20ABI<TState> {
    // IERC20
    fn total_supply(self: @TState) -> u256;
    fn balance_of(self: @TState, account: ContractAddress) -> u256;
    fn allowance(self: @TState, owner: ContractAddress, spender: ContractAddress) -> u256;
    fn transfer(ref self: TState, recipient: ContractAddress, amount: u256) -> bool;
    fn transfer_from(
        ref self: TState, sender: ContractAddress, recipient: ContractAddress, amount: u256
    ) -> bool;
    fn approve(ref self: TState, spender: ContractAddress, amount: u256) -> bool;

    // IERC20Metadata
    fn name(self: @TState) -> ByteArray;
    fn symbol(self: @TState) -> ByteArray;
    fn decimals(self: @TState) -> u8;

    // IERC20CamelOnly
    fn totalSupply(self: @TState) -> u256;
    fn balanceOf(self: @TState, account: ContractAddress) -> u256;
    fn transferFrom(
        ref self: TState, sender: ContractAddress, recipient: ContractAddress, amount: u256
    ) -> bool;
}
```

### Dispatcher traits

Traits annotated with `#[starknet::interface]` automatically generate a dispatcher that can be used to interact with contracts that implement the given interface. They can be imported by appending the `Dispatcher` and `DispatcherTrait` suffixes to the trait name, like this:

```
use openzeppelin_token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
```

Other types of dispatchers are also auto-generated from the annotated trait. See the
Interacting with another contract section of the Cairo book for more information.

|  |  |
| --- | --- |
|  | In the example, the `IERC20Dispatcher` is the one used to interact with contracts, but the `IERC20DispatcherTrait` needs to be in scope for the functions to be available. |

## Dual interfaces

|  |  |
| --- | --- |
|  | `camelCase` functions are deprecated and maintained only for Backwards Compatibility. It’s recommended to only use `snake_case` interfaces with contracts and components. The `camelCase` functions will be removed in future versions. |

Following the Great Interface Migration plan, we added `snake_case` functions to all of our preexisting `camelCase` contracts with the goal of eventually dropping support for the latter.

In short, the library offers two types of interfaces and utilities to handle them:

1. `camelCase` interfaces, which are the ones we’ve been using so far.
2. `snake_case` interfaces, which are the ones we’re migrating to.

This means that currently most of our contracts implement *dual interfaces*. For example, the ERC20 preset contract exposes `transferFrom`, `transfer_from`, `balanceOf`, `balance_of`, etc.

|  |  |
| --- | --- |
|  | Dual interfaces are available for all external functions present in previous versions of OpenZeppelin Contracts for Cairo (v0.6.1 and below). |

### `IERC20`

The default version of the ERC20 interface trait exposes `snake_case` functions:

```
#[starknet::interface]
pub trait IERC20<TState> {
    fn name(self: @TState) -> ByteArray;
    fn symbol(self: @TState) -> ByteArray;
    fn decimals(self: @TState) -> u8;
    fn total_supply(self: @TState) -> u256;
    fn balance_of(self: @TState, account: ContractAddress) -> u256;
    fn allowance(self: @TState, owner: ContractAddress, spender: ContractAddress) -> u256;
    fn transfer(ref self: TState, recipient: ContractAddress, amount: u256) -> bool;
    fn transfer_from(
        ref self: TState, sender: ContractAddress, recipient: ContractAddress, amount: u256
    ) -> bool;
    fn approve(ref self: TState, spender: ContractAddress, amount: u256) -> bool;
}
```

### `IERC20Camel`

On top of that, the library also offers a `camelCase` version of the same interface:

```
#[starknet::interface]
pub trait IERC20Camel<TState> {
    fn name(self: @TState) -> ByteArray;
    fn symbol(self: @TState) -> ByteArray;
    fn decimals(self: @TState) -> u8;
    fn totalSupply(self: @TState) -> u256;
    fn balanceOf(self: @TState, account: ContractAddress) -> u256;
    fn allowance(self: @TState, owner: ContractAddress, spender: ContractAddress) -> u256;
    fn transfer(ref self: TState, recipient: ContractAddress, amount: u256) -> bool;
    fn transferFrom(
        ref self: TState, sender: ContractAddress, recipient: ContractAddress, amount: u256
    ) -> bool;
    fn approve(ref self: TState, spender: ContractAddress, amount: u256) -> bool;
}
```

← Presets

Counterfactual Deployments →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0-alpha.0/introspection

## Introspection - OpenZeppelin Docs

You are not reading the current version of this documentation. 2.0.0 is the current version.

# Introspection

To smooth interoperability, often standards require smart contracts to implement introspection mechanisms.

In Ethereum, the EIP165 standard defines how contracts should declare
their support for a given interface, and how other contracts may query this support.

Starknet offers a similar mechanism for interface introspection defined by the SRC5 standard.

## SRC5

Similar to its Ethereum counterpart, the SRC5 standard requires contracts to implement the `supports_interface` function,
which can be used by others to query if a given interface is supported.

### Usage

To expose this functionality, the contract must implement the SRC5Component, which defines the `supports_interface` function.
Here is an example contract:

```
#[starknet::contract]
mod MyContract {
    use openzeppelin_introspection::src5::SRC5Component;

    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    #[abi(embed_v0)]
    impl SRC5Impl = SRC5Component::SRC5Impl<ContractState>;
    impl SRC5InternalImpl = SRC5Component::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        src5: SRC5Component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        SRC5Event: SRC5Component::Event
    }

    #[constructor]
    fn constructor(ref self: ContractState) {
        self.src5.register_interface(selector!("some_interface"));
    }
}
```

### Interface

```
#[starknet::interface]
pub trait ISRC5 {
    /// Query if a contract implements an interface.
    /// Receives the interface identifier as specified in SRC-5.
    /// Returns `true` if the contract implements `interface_id`, `false` otherwise.
    fn supports_interface(interface_id: felt252) -> bool;
}
```

## Computing the interface ID

The interface ID, as specified in the standard, is the XOR of all the
Extended Function Selectors
of the interface. We strongly advise reading the SNIP to understand the specifics of computing these
extended function selectors. There are tools such as src5-rs that can help with this process.

## Registering interfaces

For a contract to declare its support for a given interface, we recommend using the SRC5 component to register support upon contract deployment through a constructor either directly or indirectly (as an initializer) like this:

```
#[starknet::contract]
mod MyContract {
    use openzeppelin_account::interface;
    use openzeppelin_introspection::src5::SRC5Component;

    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    #[abi(embed_v0)]
    impl SRC5Impl = SRC5Component::SRC5Impl<ContractState>;
    impl InternalImpl = SRC5Component::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        src5: SRC5Component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        SRC5Event: SRC5Component::Event
    }

    #[constructor]
    fn constructor(ref self: ContractState) {
        // Register the contract's support for the ISRC6 interface
        self.src5.register_interface(interface::ISRC6_ID);
    }

    (...)
}
```

## Querying interfaces

Use the `supports_interface` function to query a contract’s support for a given interface.

```
#[starknet::contract]
mod MyContract {
    use openzeppelin_account::interface;
    use openzeppelin_introspection::interface::ISRC5DispatcherTrait;
    use openzeppelin_introspection::interface::ISRC5Dispatcher;
    use starknet::ContractAddress;

    #[storage]
    struct Storage {}

    #[external(v0)]
    fn query_is_account(self: @ContractState, target: ContractAddress) -> bool {
        let dispatcher = ISRC5Dispatcher { contract_address: target };
        dispatcher.supports_interface(interface::ISRC6_ID)
    }
}
```

|  |  |
| --- | --- |
|  | If you are unsure whether a contract implements SRC5 or not, you can follow the process described in here. |

← API Reference

Migrating ERC165 to SRC5 →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0-alpha.0/presets

## Presets - OpenZeppelin Docs

You are not reading the current version of this documentation. 2.0.0 is the current version.

# Presets

Presets are ready-to-deploy contracts provided by the library. Since presets are intended to be very simple
and as generic as possible, there’s no support for custom or complex contracts such as `ERC20Pausable` or `ERC721Mintable`.

|  |  |
| --- | --- |
|  | For contract customization and combination of modules you can use Wizard for Cairo, our code-generation tool. |

## Available presets

List of available presets and their corresponding Sierra class hashes. Like Contracts for Cairo,
use of preset contracts are subject to the terms of the
MIT License.

|  |  |
| --- | --- |
|  | Class hashes were computed using cairo 2.11.2. |

| Name | Sierra Class Hash |
| --- | --- |
| `AccountUpgradeable` | `0x07bdb254c058d952ce0a7447911514717c0c390a3a9c39215981bad421860a58` |
| `ERC20Upgradeable` | `0x07af6b75c3ae627338a222e534589db217880398b2194b8710f24a649d4baee7` |
| `ERC721Upgradeable` | `0x0511ec65c43f2bdf5ed24d63342aad96849f34a64e29ce05f8fcb4ef37cc22dc` |
| `ERC1155Upgradeable` | `0x045fd9554115e724d3ef018b8db08a60f13444f3e14eef9cd45f3372867d0b59` |
| `EthAccountUpgradeable` | `0x02d0d36adf3157b5b7962a69484a64d2721f43d5db519ab8a9cdd09e8f93f04c` |
| `UniversalDeployer` | `0x050e13234a6abdb992c9e07aab8b88c7067b8acb243d2e2d08eeb6b8ccd26c7c` |
| `VestingWallet` | `0x0745aa2994fd595de93fa4fdbfdff3f8d8d7ebf2067f33ec90a93e039c4a2f32` |

|  |  |
| --- | --- |
|  | starkli class-hash command can be used to compute the class hash from a Sierra artifact. |

## Usage

These preset contracts are ready-to-deploy which means they should already be declared on the Sepolia network.
Simply deploy the preset class hash and add the appropriate constructor arguments.
Deploying the ERC20Upgradeable preset with starkli, for example, will look like this:

```
starkli deploy 0x07af6b75c3ae627338a222e534589db217880398b2194b8710f24a649d4baee7 \
  <CONSTRUCTOR_ARGS> \
  --network="sepolia"
```

If a class hash has yet to be declared, copy/paste the preset contract code and declare it locally.
Start by setting up a project and installing the Contracts for Cairo library.
Copy the target preset contract from the presets directory and paste it in the new project’s `src/lib.cairo` like this:

```
// src/lib.cairo

#[starknet::contract]
mod ERC20Upgradeable {
    use openzeppelin_access::ownable::OwnableComponent;
    use openzeppelin_token::erc20::{ERC20Component, ERC20HooksEmptyImpl};
    use openzeppelin_upgrades::UpgradeableComponent;
    use openzeppelin_upgrades::interface::IUpgradeable;
    use starknet::{ContractAddress, ClassHash};

    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);
    component!(path: ERC20Component, storage: erc20, event: ERC20Event);
    component!(path: UpgradeableComponent, storage: upgradeable, event: UpgradeableEvent);

    // Ownable Mixin
    #[abi(embed_v0)]
    impl OwnableMixinImpl = OwnableComponent::OwnableMixinImpl<ContractState>;
    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;

    // ERC20 Mixin
    #[abi(embed_v0)]
    impl ERC20MixinImpl = ERC20Component::ERC20MixinImpl<ContractState>;
    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;

    // Upgradeable
    impl UpgradeableInternalImpl = UpgradeableComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
        #[substorage(v0)]
        erc20: ERC20Component::Storage,
        #[substorage(v0)]
        upgradeable: UpgradeableComponent::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        OwnableEvent: OwnableComponent::Event,
        #[flat]
        ERC20Event: ERC20Component::Event,
        #[flat]
        UpgradeableEvent: UpgradeableComponent::Event
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        name: ByteArray,
        symbol: ByteArray,
        fixed_supply: u256,
        recipient: ContractAddress,
        owner: ContractAddress
    ) {
        self.ownable.initializer(owner);
        self.erc20.initializer(name, symbol);
        self.erc20.mint(recipient, fixed_supply);
    }

    #[abi(embed_v0)]
    impl UpgradeableImpl of IUpgradeable<ContractState> {
        fn upgrade(ref self: ContractState, new_class_hash: ClassHash) {
            self.ownable.assert_only_owner();
            self.upgradeable.upgrade(new_class_hash);
        }
    }
}
```

Next, compile the contract.

```
scarb build
```

Finally, declare the preset.

```
starkli declare target/dev/my_project_ERC20Upgradeable.contract_class.json \
  --network="sepolia"
```

← Components

Interfaces and Dispatchers →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0-alpha.0/security

## Security - OpenZeppelin Docs

You are not reading the current version of this documentation. 2.0.0 is the current version.

# Security

The following documentation provides context, reasoning, and examples of modules found under `openzeppelin_security`.

|  |  |
| --- | --- |
|  | Expect these modules to evolve. |

## Initializable

The Initializable component provides a simple mechanism that mimics
the functionality of a constructor.
More specifically, it enables logic to be performed once and only once which is useful to set up a contract’s initial state when a constructor cannot be used, for example when there are circular dependencies at construction time.

### Usage

You can use the component in your contracts like this:

```
#[starknet::contract]
mod MyInitializableContract {
    use openzeppelin_security::InitializableComponent;

    component!(path: InitializableComponent, storage: initializable, event: InitializableEvent);

    impl InternalImpl = InitializableComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        initializable: InitializableComponent::Storage,
        param: felt252
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        InitializableEvent: InitializableComponent::Event
    }

    fn initializer(ref self: ContractState, some_param: felt252) {
        // Makes the method callable only once
        self.initializable.initialize();

        // Initialization logic
        self.param.write(some_param);
    }
}
```

|  |  |
| --- | --- |
|  | This Initializable pattern should only be used in one function. |

### Interface

The component provides the following external functions as part of the `InitializableImpl` implementation:

```
#[starknet::interface]
pub trait InitializableABI {
    fn is_initialized() -> bool;
}
```

## Pausable

The Pausable component allows contracts to implement an emergency stop mechanism.
This can be useful for scenarios such as preventing trades until the end of an evaluation period or having an emergency switch to freeze all transactions in the event of a large bug.

To become pausable, the contract should include `pause` and `unpause` functions (which should be protected).
For methods that should be available only when paused or not, insert calls to `assert_paused` and `assert_not_paused`
respectively.

### Usage

For example (using the Ownable component for access control):

```
#[starknet::contract]
mod MyPausableContract {
    use openzeppelin_access::ownable::OwnableComponent;
    use openzeppelin_security::PausableComponent;
    use starknet::ContractAddress;

    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);
    component!(path: PausableComponent, storage: pausable, event: PausableEvent);

    // Ownable Mixin
    #[abi(embed_v0)]
    impl OwnableMixinImpl = OwnableComponent::OwnableMixinImpl<ContractState>;
    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;

    // Pausable
    #[abi(embed_v0)]
    impl PausableImpl = PausableComponent::PausableImpl<ContractState>;
    impl PausableInternalImpl = PausableComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
        #[substorage(v0)]
        pausable: PausableComponent::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        OwnableEvent: OwnableComponent::Event,
        #[flat]
        PausableEvent: PausableComponent::Event
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress) {
        self.ownable.initializer(owner);
    }

    #[external(v0)]
    fn pause(ref self: ContractState) {
        self.ownable.assert_only_owner();
        self.pausable.pause();
    }

    #[external(v0)]
    fn unpause(ref self: ContractState) {
        self.ownable.assert_only_owner();
        self.pausable.unpause();
    }

    #[external(v0)]
    fn when_not_paused(ref self: ContractState) {
        self.pausable.assert_not_paused();
        // Do something
    }

    #[external(v0)]
    fn when_paused(ref self: ContractState) {
        self.pausable.assert_paused();
        // Do something
    }
}
```

### Interface

The component provides the following external functions as part of the `PausableImpl` implementation:

```
#[starknet::interface]
pub trait PausableABI {
    fn is_paused() -> bool;
}
```

## Reentrancy Guard

A reentrancy attack occurs when the caller is able to obtain more resources than allowed by recursively calling a target’s function.

### Usage

Since Cairo does not support modifiers like Solidity, the ReentrancyGuard
component exposes two methods `start` and `end` to protect functions against reentrancy attacks.
The protected function must call `start` before the first function statement, and `end` before the return statement, as shown below:

```
#[starknet::contract]
mod MyReentrancyContract {
    use openzeppelin_security::ReentrancyGuardComponent;

    component!(
        path: ReentrancyGuardComponent, storage: reentrancy_guard, event: ReentrancyGuardEvent
    );

    impl InternalImpl = ReentrancyGuardComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        reentrancy_guard: ReentrancyGuardComponent::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ReentrancyGuardEvent: ReentrancyGuardComponent::Event
    }

    #[external(v0)]
    fn protected_function(ref self: ContractState) {
        self.reentrancy_guard.start();

        // Do something

        self.reentrancy_guard.end();
    }

    #[external(v0)]
    fn another_protected_function(ref self: ContractState) {
        self.reentrancy_guard.start();

        // Do something

        self.reentrancy_guard.end();
    }
}
```

|  |  |
| --- | --- |
|  | The guard prevents the execution flow occurring inside `protected_function` to call itself or `another_protected_function`, and vice versa. |

← Merkle Tree

API Reference →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0-alpha.0/udc

## Universal Deployer Contract - OpenZeppelin Docs

You are not reading the current version of this documentation. 2.0.0 is the current version.

# Universal Deployer Contract

The Universal Deployer Contract (UDC) is a singleton smart contract that wraps the deploy syscall to expose it to any contract that doesn’t implement it, such as account contracts. You can think of it as a standardized generic factory for Starknet contracts.

Since Starknet has no deployment transaction type, it offers a standardized way to deploy smart contracts by following the Standard Deployer Interface and emitting a ContractDeployed event.

For details on the motivation and the decision making process, see the Universal Deployer Contract proposal.

## UDC contract address

This version of the UDC is not deployed yet. Check the current deployed version here.

## Interface

```
#[starknet::interface]
pub trait IUniversalDeployer {
    fn deploy_contract(
        class_hash: ClassHash,
        salt: felt252,
        from_zero: bool,
        calldata: Span<felt252>
    ) -> ContractAddress;
}
```

## Deploying a contract with the UDC

First, declare the target contract (if it’s not already declared).
Next, call the UDC’s `deploy_contract` method.
Here’s an implementation example in Cairo:

```
use openzeppelin_utils::interfaces::{IUniversalDeployerDispatcher, IUniversalDeployerDispatcherTrait};

const UDC_ADDRESS: felt252 = 0x04...;

fn deploy() -> ContractAddress {
    let dispatcher = IUniversalDeployerDispatcher {
        contract_address: UDC_ADDRESS.try_into().unwrap()
    };

    // Deployment parameters
    let class_hash = class_hash_const::<
       0x5c478ee27f2112411f86f207605b2e2c58cdb647bac0df27f660ef2252359c6
    >();
    let salt = 1234567879;
    let not_from_zero = true;
    let calldata = array![];

    // The UDC returns the deployed contract address
    dispatcher.deploy_contract(class_hash, salt, not_from_zero, calldata.span())
}
```

## Deployment types

The Universal Deployer Contract offers two types of addresses to deploy: origin-dependent and origin-independent.
As the names suggest, the origin-dependent type includes the deployer’s address in the address calculation,
whereas, the origin-independent type does not.
The `from_zero` boolean parameter ultimately determines the type of deployment.

|  |  |
| --- | --- |
|  | When deploying a contract that uses `get_caller_address` in the constructor calldata, remember that the UDC, not the account, deploys that contract. Therefore, querying `get_caller_address` in a contract’s constructor returns the UDC’s address, *not the account’s address*. |

### Origin-dependent

By making deployments dependent upon the origin address, users can reserve a whole address space to prevent someone else from taking ownership of the address.

Only the owner of the origin address can deploy to those addresses.

Achieving this type of deployment necessitates that the origin sets `from_zero` to `false` in the deploy\_contract call.
Under the hood, the function passes a modified salt to the `deploy_syscall`, which is the hash of the origin’s address with the given salt.

To deploy a unique contract address pass:

```
let deployed_addr = udc.deploy_contract(class_hash, salt, true, calldata.span());
```

### Origin-independent

Origin-independent contract deployments create contract addresses independent of the deployer and the UDC instance.
Instead, only the class hash, salt, and constructor arguments determine the address.
This type of deployment enables redeployments of accounts and known systems across multiple networks.
To deploy a reproducible deployment, set `from_zero` to `true`.

```
let deployed_addr = udc.deploy_contract(class_hash, salt, false, calldata.span());
```

## Version changes

|  |  |
| --- | --- |
|  | See the previous Universal Deployer API for the initial spec. |

The latest iteration of the UDC includes some notable changes to the API which include:

* `deployContract` method is replaced with the snake\_case deploy\_contract.
* `unique` parameter is replaced with `not_from_zero` in both the `deploy_contract` method and ContractDeployed event.

## Precomputing contract addresses

This library offers utility functions written in Cairo to precompute contract addresses.
They include the generic calculate\_contract\_address\_from\_deploy\_syscall as well as the UDC-specific calculate\_contract\_address\_from\_udc.
Check out the deployments for more information.

← Common

API Reference →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0-alpha.0/upgrades

## Upgrades - OpenZeppelin Docs

You are not reading the current version of this documentation. 2.0.0 is the current version.

# Upgrades

In different blockchains, multiple patterns have been developed for making a contract upgradeable including the widely adopted proxy patterns.

Starknet has native upgradeability through a syscall that updates the contract source code, removing the need for proxies.

|  |  |
| --- | --- |
|  | Make sure you follow our security recommendations before upgrading. |

## Replacing contract classes

To better comprehend how upgradeability works in Starknet, it’s important to understand the difference between a contract and its contract class.

Contract Classes represent the source code of a program. All contracts are associated to a class, and many contracts can be instances of the same one. Classes are usually represented by a class hash, and before a contract of a class can be deployed, the class hash needs to be declared.

### `replace_class_syscall`

The `replace_class` syscall allows a contract to update its source code by replacing its class hash once deployed.

```
/// Upgrades the contract source code to the new contract class.
fn upgrade(new_class_hash: ClassHash) {
    assert(!new_class_hash.is_zero(), 'Class hash cannot be zero');
    starknet::replace_class_syscall(new_class_hash).unwrap_syscall();
}
```

|  |  |
| --- | --- |
|  | If a contract is deployed without this mechanism, its class hash can still be replaced through library calls. |

## `Upgradeable` component

OpenZeppelin Contracts for Cairo provides Upgradeable to add upgradeability support to your contracts.

### Usage

Upgrades are often very sensitive operations, and some form of access control is usually required to
avoid unauthorized upgrades. The Ownable module is used in this example.

|  |  |
| --- | --- |
|  | We will be using the following module to implement the IUpgradeable interface described in the API Reference section. |

```
#[starknet::contract]
mod UpgradeableContract {
    use openzeppelin_access::ownable::OwnableComponent;
    use openzeppelin_upgrades::UpgradeableComponent;
    use openzeppelin_upgrades::interface::IUpgradeable;
    use starknet::ClassHash;
    use starknet::ContractAddress;

    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);
    component!(path: UpgradeableComponent, storage: upgradeable, event: UpgradeableEvent);

    // Ownable Mixin
    #[abi(embed_v0)]
    impl OwnableMixinImpl = OwnableComponent::OwnableMixinImpl<ContractState>;
    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;

    // Upgradeable
    impl UpgradeableInternalImpl = UpgradeableComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
        #[substorage(v0)]
        upgradeable: UpgradeableComponent::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        OwnableEvent: OwnableComponent::Event,
        #[flat]
        UpgradeableEvent: UpgradeableComponent::Event
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress) {
        self.ownable.initializer(owner);
    }

    #[abi(embed_v0)]
    impl UpgradeableImpl of IUpgradeable<ContractState> {
        fn upgrade(ref self: ContractState, new_class_hash: ClassHash) {
            // This function can only be called by the owner
            self.ownable.assert_only_owner();

            // Replace the class hash upgrading the contract
            self.upgradeable.upgrade(new_class_hash);
        }
    }
}
```

## Security

Upgrades can be very sensitive operations, and security should always be top of mind while performing one. Please make sure you thoroughly review the changes and their consequences before upgrading. Some aspects to consider are:

* API changes that might affect integration. For example, changing an external function’s arguments might break existing contracts or offchain systems calling your contract.
* Storage changes that might result in lost data (e.g. changing a storage slot name, making existing storage inaccessible).
* Collisions (e.g. mistakenly reusing the same storage slot from another component) are also possible, although less likely if best practices are followed, for example prepending storage variables with the component’s name (e.g. `ERC20_balances`).
* Always check for backwards compatibility before upgrading between versions of OpenZeppelin Contracts.

## Proxies in Starknet

Proxies enable different patterns such as upgrades and clones. But since Starknet achieves the same in different ways is that there’s no support to implement them.

In the case of contract upgrades, it is achieved by simply changing the contract’s class hash. As of clones, contracts already are like clones of the class they implement.

Implementing a proxy pattern in Starknet has an important limitation: there is no fallback mechanism to be used
for redirecting every potential function call to the implementation. This means that a generic proxy contract
can’t be implemented. Instead, a limited proxy contract can implement specific functions that forward
their execution to another contract class.
This can still be useful for example to upgrade the logic of some functions.

← API Reference

API Reference →

---

**Source URL:** https://docs.openzeppelin.com/contracts-cairo/2.0.0-alpha.0/wizard

## Wizard for Cairo - OpenZeppelin Docs

You are not reading the current version of this documentation. 2.0.0 is the current version.

# Wizard for Cairo

Not sure where to start? Use the interactive generator below to bootstrap your
contract and learn about the components offered in OpenZeppelin Contracts for Cairo.

|  |  |
| --- | --- |
|  | We strongly recommend checking the Components section to understand how to extend from our library. |

← Overview

Components →

---
