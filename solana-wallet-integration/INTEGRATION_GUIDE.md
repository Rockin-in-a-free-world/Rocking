# Integration Guide: MetaMask Embedded Wallets + WDK Solana SDK

## Overview

This guide explains how to integrate **MetaMask Embedded Wallets SDK** with **@tetherto/wdk-wallet-solana** to create a Solana wallet application with social sign-on.

## Recommended SDK: `@metamask/embedded-wallets`

**Package**: `@metamask/embedded-wallets`  
**Documentation**: https://docs.metamask.io/embedded-wallets/  
**Solana Support**: ✅ Native support for Solana with `getAccountSolana()`

## Architecture Flow

```
User clicks "Sign in with Google"
         ↓
MetaMask Embedded Wallets SDK
  - Handles OAuth flow
  - Generates seed phrase (managed securely)
  - Creates ed25519 keypair for Solana
         ↓
Extract Solana private key
  - Call: embeddedWallet.getAccountSolana()
  - Returns: { address, privateKey }
         ↓
WDK Solana SDK
  - Initialize WalletManagerSolana
  - Create/import account from key
  - Perform wallet operations
```

## Prerequisites

- **Node.js**: v20.0.0 or higher (v20.x LTS **required**)
  - The `@solana/kit` dependency (used by `@tetherto/wdk-wallet-solana`) requires Node 20+
  - This project uses `@types/node ^20.10.0` which targets Node 20
- **npm**: v9.0.0 or higher
- **TypeScript**: v5.3.0 or higher

**Important**: Node 20 is required due to `@solana/kit` dependency. Node 18 may cause compatibility issues.

## Step-by-Step Implementation

### 1. Install Dependencies

```bash
npm install @metamask/embedded-wallets @tetherto/wdk-wallet-solana @solana/web3.js
```

### 2. Set Up MetaMask Embedded Wallets

#### Get API Credentials

1. Go to [MetaMask Developer Portal](https://portal.metamask.io)
2. Create a new project
3. Enable "Embedded Wallets"
4. Configure Google OAuth provider
5. Get your `clientId` and `secretKey`

#### Initialize the SDK

```typescript
import { initializeEmbeddedWallet } from '@metamask/embedded-wallets';

const embeddedWallet = await initializeEmbeddedWallet({
  clientId: process.env.METAMASK_CLIENT_ID!,
  secretKey: process.env.METAMASK_SECRET_KEY!,
});
```

### 3. Authenticate with Google

```typescript
// Authenticate user with Google
await embeddedWallet.authenticate({
  provider: 'google', // or 'apple', 'email'
});

// Get Solana account (ed25519 key)
const solanaAccount = await embeddedWallet.getAccountSolana();
// Returns: { address: string, privateKey: string }
```

### 4. Integrate with WDK Solana SDK

#### Option A: If WDK supports keypair import

```typescript
import WalletManagerSolana from '@tetherto/wdk-wallet-solana';
import { Keypair } from '@solana/web3.js';
import * as bs58 from 'bs58';

// Convert MetaMask's private key to Solana Keypair
const privateKeyBytes = bs58.decode(solanaAccount.privateKey);
const keypair = Keypair.fromSecretKey(privateKeyBytes);

// Initialize WDK with the keypair
const walletManager = new WalletManagerSolana({
  provider: 'https://api.devnet.solana.com',
});

// Create account from keypair (if WDK supports it)
const account = await walletManager.importAccount(keypair);
```

#### Option B: If WDK only supports seed phrases

You may need to:
1. Extract the seed phrase from MetaMask (if exposed via API)
2. Or create an adapter layer that converts the ed25519 key to a format WDK accepts

```typescript
// Adapter pattern (conceptual)
class MetaMaskToWDKAdapter {
  static async createAccountFromMetaMaskKey(
    metamaskKey: string,
    walletManager: WalletManagerSolana
  ) {
    // Convert MetaMask key to WDK-compatible format
    // This depends on WDK's internal implementation
  }
}
```

### 5. Create Burner Wallet

```typescript
import { Keypair } from '@solana/web3.js';

function createBurnerWallet(): string {
  const keypair = Keypair.generate();
  return keypair.publicKey.toBase58();
}

const burnerAddress = createBurnerWallet();
```

### 6. Send Funds to Burner Wallet

```typescript
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

async function sendToBurner(
  account: WalletAccountSolana,
  burnerAddress: string,
  amountSOL: number
) {
  const amountLamports = amountSOL * LAMPORTS_PER_SOL;
  
  const signature = await account.sendTransaction({
    recipient: burnerAddress,
    value: BigInt(amountLamports),
    commitment: 'confirmed',
  });
  
  return signature;
}
```

### 7. Test Wallet Functionality

```typescript
async function testWallet(account: WalletAccountSolana) {
  // Get balance
  const balance = await account.getBalance();
  console.log(`Balance: ${balance} lamports`);
  
  // Quote transaction
  const quote = await account.quoteSendTransaction({
    recipient: '11111111111111111111111111111111',
    value: 1000000n,
  });
  console.log(`Fee estimate: ${quote.fee} lamports`);
}
```

## Complete Example

```typescript
import { initializeEmbeddedWallet } from '@metamask/embedded-wallets';
import WalletManagerSolana from '@tetherto/wdk-wallet-solana';
import { Keypair } from '@solana/web3.js';
import * as bs58 from 'bs58';

async function createAndTestWallet() {
  // 1. Initialize MetaMask Embedded Wallets
  const embeddedWallet = await initializeEmbeddedWallet({
    clientId: process.env.METAMASK_CLIENT_ID!,
    secretKey: process.env.METAMASK_SECRET_KEY!,
  });

  // 2. Authenticate with Google
  await embeddedWallet.authenticate({ provider: 'google' });

  // 3. Get Solana account
  const solanaAccount = await embeddedWallet.getAccountSolana();

  // 4. Convert to Solana Keypair
  const privateKeyBytes = bs58.decode(solanaAccount.privateKey);
  const keypair = Keypair.fromSecretKey(privateKeyBytes);

  // 5. Initialize WDK Solana SDK
  const walletManager = new WalletManagerSolana({
    provider: 'https://api.devnet.solana.com',
  });

  // 6. Create account (method depends on WDK API)
  const account = await walletManager.importAccount(keypair);

  // 7. Test wallet
  const balance = await account.getBalance();
  console.log(`Wallet balance: ${balance} lamports`);

  // 8. Create burner and send funds
  const burnerKeypair = Keypair.generate();
  const burnerAddress = burnerKeypair.publicKey.toBase58();

  const signature = await account.sendTransaction({
    recipient: burnerAddress,
    value: 1000000n, // 0.001 SOL
    commitment: 'confirmed',
  });

  console.log(`Sent funds! Signature: ${signature}`);
}
```

## Important Notes

### Key Format Compatibility

- **MetaMask Embedded Wallets** provides ed25519 keys in base58 or hex format
- **WDK Solana SDK** may expect seed phrases or specific key formats
- You may need an adapter layer to convert between formats

### Seed Phrase Access

- MetaMask Embedded Wallets manages seed phrases securely
- The seed phrase may not be directly accessible via API
- You'll likely work with the derived ed25519 key instead

### Network Configuration

```typescript
const networks = {
  devnet: 'https://api.devnet.solana.com',
  testnet: 'https://api.testnet.solana.com',
  mainnet: 'https://api.mainnet-beta.solana.com',
};
```

## Troubleshooting

### Issue: WDK doesn't support keypair import

**Solution**: Check WDK documentation for alternative methods, or create an adapter that:
1. Converts the ed25519 key to a seed phrase format WDK accepts
2. Or extends WDK to support direct keypair import

### Issue: Private key format mismatch

**Solution**: Use `bs58` or `@solana/web3.js` utilities to convert between formats:
```typescript
import * as bs58 from 'bs58';
import { Keypair } from '@solana/web3.js';

// If MetaMask provides hex
const keyBytes = Buffer.from(privateKeyHex, 'hex');
const keypair = Keypair.fromSecretKey(keyBytes);

// If MetaMask provides base58
const keyBytes = bs58.decode(privateKeyBase58);
const keypair = Keypair.fromSecretKey(keyBytes);
```

### Issue: Authentication fails

**Solution**: 
1. Verify Google OAuth is configured in MetaMask dashboard
2. Check `clientId` and `secretKey` are correct
3. Ensure redirect URIs match your app domain

## Next Steps

1. **Check WDK API**: Review `@tetherto/wdk-wallet-solana` documentation for exact import/account creation methods
2. **Test Integration**: Start with devnet to test the full flow
3. **Handle Edge Cases**: Add error handling for insufficient balance, network errors, etc.
4. **Add UI**: Build a simple React/Vue app to demonstrate the integration

## Resources

- [MetaMask Embedded Wallets Docs](https://docs.metamask.io/embedded-wallets/)
- [MetaMask Solana Integration](https://docs.metamask.io/embedded-wallets/connect-blockchain/solana/)
- [WDK Solana SDK](https://github.com/tetherto/wdk-wallet-solana)
- [Solana Web3.js Docs](https://solana-labs.github.io/solana-web3.js/)

