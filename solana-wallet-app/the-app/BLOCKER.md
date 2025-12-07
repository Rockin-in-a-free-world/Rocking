# Build Blocker: Native Module Dependency

## Issue

The `@tetherto/wdk-wallet-solana` SDK depends on `sodium-native`, which is a native Node.js module that:
- Requires native compilation
- Cannot run in Next.js API routes (serverless functions)
- Needs to run in a Node.js environment with native bindings

## Error

```
Error: Cannot find addon '.' imported from 'file:///ROOT/node_modules/sodium-native/binding.js'
```

## Solutions

### Option 1: Separate Node.js Server (Recommended)
- Create a separate Express/Fastify server for feemaster operations
- Run Tether SDK operations on the Node.js server
- Next.js app calls the Node.js server via HTTP API
- Deploy Node.js server separately (not serverless)

### Option 2: Use @solana/web3.js Directly
- Skip Tether SDK for feemaster operations
- Use `@solana/web3.js` directly with keypair derived from seed phrase
- Implement wallet operations manually

### Option 3: Mock Tether SDK (Development Only)
- Create mock implementations for development
- Use real SDK only in separate Node.js server

## Current Status

✅ Core app structure built
✅ UI components created
✅ Dashboard structure ready
✅ Transaction monitoring logic ready
❌ Feemaster operations blocked (native module issue)

## Next Steps

1. Decide on solution approach
2. If Option 1: Create separate Node.js server for feemaster
3. If Option 2: Replace Tether SDK with direct @solana/web3.js usage
4. Continue with user account creation and allowlist features

