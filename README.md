# Modified ERC20 dApp with Identity Verification

This project implements a modified ERC20 token with identity verification requirements. Only addresses that have been verified by trusted identity providers (IDPs) can hold tokens.

## Overview

The BDAERC20 token contract includes the following features:

1. **Identity Verification**: Only addresses verified by trusted identity providers can hold tokens
2. **Daily Minting Limits**: Restricts how many tokens can be minted per day
3. **Transfer Restrictions**: Enforces daily transfer limits and only allows transfers to verified addresses
4. **Administrative Roles**: Separate roles for minting and restriction management

## Smart Contract Functions

### Identity Verification

- `verifyIdentity(uint256 timestamp, bytes memory signature)`: Verify a user's identity using a signature from a trusted IDP
- `isVerified(address user)`: Check if an address has been verified
- `addIdentityProvider(address provider)`: Add a trusted identity provider (admin only)
- `removeIdentityProvider(address provider)`: Remove a trusted identity provider (admin only)

### Token Operations

- `mint(address to, uint256 amount)`: Mint tokens to a verified address (admin only)
- `transfer(address to, uint256 amount)`: Transfer tokens to a verified address
- `setDailyTransferLimit(address user, uint256 limit)`: Set transfer limits for a user (admin only)

## Identity Provider Script

The project includes a JavaScript script (`scripts/identity_provider.js`) that simulates a centralized identity provider. This script can:

1. Generate key pairs for an identity provider
2. Sign verification messages for users

### Using the Identity Provider Script

#### Requirements

```
npm install ethers yargs
```

#### Generate Identity Provider Keys

```
node scripts/identity_provider.js generate-keys
```

This will create a file `idp_key.json` containing the IDP's private key and address.

#### Verify a User's Identity

```
node scripts/identity_provider.js verify 0xYourEthereumAddress
```

This will generate a signature that can be used to call the `verifyIdentity` function on the contract.

## Usage Workflow

1. Deploy the BDAERC20 contract with a list of trusted IDP addresses
2. The IDP verifies a user's identity off-chain
3. The IDP signs a verification message using the identity_provider.js script
4. The user calls `verifyIdentity` with the timestamp and signature
5. Once verified, the user can receive and transfer tokens

## Technical Implementation

The identity verification process uses Ethereum's cryptographic primitives:

1. The IDP signs a message in the format: `User with address <address> has verified their identity at <timestamp>`
2. The contract uses `ecrecover` via OpenZeppelin's ECDSA library to verify the signature
3. If the signature is valid and from a trusted IDP, the address is marked as verified

## Security Considerations

- IDP keys should be kept secure as they control who can hold tokens
- The verification timestamp can be used to implement expiration policies
- Only restriction admins can add or remove identity providers
