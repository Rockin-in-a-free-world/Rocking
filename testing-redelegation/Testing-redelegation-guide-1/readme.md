# Testing Redelegation Guide

This directory contains tests to verify the redelegation guide from [MetaMask docs PR #2554](https://github.com/MetaMask/metamask-docs/pull/2554).

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the redelegation test:
   ```bash
   npm test
   ```
   Or directly:
   ```bash
   npx tsx test-redelegation.ts
   ```

## Test Coverage

The test file (`test-redelegation.ts`) verifies the actual code samples from PR #2554:

1. ✅ **Root delegation creation** - Alice → Bob with `erc20TransferAmount` scope (10 USDC)
2. ✅ **Redelegation creation** - Bob → Carol using `parentDelegation` parameter (5 USDC)
3. ✅ **Scope narrowing** - Redelegation reduces scope from 10 USDC to 5 USDC
4. ✅ **parseUnits usage** - Correctly uses 6 decimals for USDC token
5. ✅ **Delegation chain** - Verifies Alice → Bob → Carol chain structure
6. ✅ **Caveats enforcement** - Both delegations have proper caveats for scope enforcement

## What the Test Verifies

The test follows the exact code samples from the guide:
- Uses `createDelegation` with `erc20TransferAmount` scope (not `nativeTokenTransferAmount`)
- Uses `parseUnits("10", 6)` and `parseUnits("5", 6)` for USDC amounts
- Uses `parentDelegation` parameter to create redelegation (key feature)
- Verifies delegation structure with `delegator`/`delegate` properties
- Confirms caveats are properly set for scope enforcement

## Notes

- The test uses Sepolia testnet (chain ID: 11155111)
- The test verifies the core API - full integration with smart accounts and `signDelegation` would require private keys and a connected provider
- All code samples from the PR guide are tested and working correctly

## Troubleshooting

If imports fail:
- Verify `@metamask/smart-accounts-kit` is installed: `npm list @metamask/smart-accounts-kit`
- Check the package version and exports in `node_modules/@metamask/smart-accounts-kit/package.json`
- Refer to the PR #2554 for the correct API usage