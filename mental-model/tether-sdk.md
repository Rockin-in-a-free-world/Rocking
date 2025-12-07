- Seed phrase created and stored locally


The SDK enables you to create your own seed phrase and then sign transactions with it.

The Solana SDK lets you:

- Create a Solana account
- Transact via Solana write accounts
- Close a account

and more.

It does this by:

- Sign transactions (txs)
- Broadcast txs to validators

Your keys:

- All cryptography done by you: non-custodial

## Native compilation required

- Requires native compilation: 
	- Cannot run in serverless functions (Vercel, AWS Lambda, etc.)
	- Needs a full Node.js environment with native bindings

Dependency: @tetherto/wdk-wallet-solana SDK uses sodium-native, hence native compilation.

