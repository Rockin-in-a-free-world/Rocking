# Quick Start Guide

## Recommended SDK: `@metamask/embedded-wallets`

This is the **MetaMask Embedded Wallets SDK** - the official package for creating wallets with social sign-on that supports Solana natively.

## Why This SDK?

✅ **Native Solana Support**: Provides `getAccountSolana()` method that returns ed25519 keys  
✅ **Social Sign-On**: Built-in Google, Apple, and email authentication  
✅ **Seed Phrase Management**: Handles seed phrase generation and recovery securely  
✅ **Production Ready**: Official MetaMask SDK, actively maintained  

## Prerequisites

- **Node.js**: v20.0.0 or higher (v20.x LTS **required**)
  - The `@solana/kit` dependency (used by Tether SDK) requires Node 20+
  - This project uses `@types/node ^20.10.0` which targets Node 20
- **npm**: v9.0.0 or higher

Check your versions:
```bash
node -v  # Should be v20.0.0 or higher
npm -v
```

**Important**: Node 20 is required due to `@solana/kit` dependency. Node 18 may cause compatibility issues.

## Installation

```bash
cd solana-wallet-integration
npm install
```

## Setup

1. **Get MetaMask API Credentials**:
   - Visit https://portal.metamask.io
   - Create a project
   - Enable "Embedded Wallets"
   - Configure Google OAuth
   - Copy `clientId` and `secretKey`

2. **Create `.env` file** (optional - devnet is default):
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. **Get Devnet SOL** (for testing transactions):
   - Visit https://faucet.solana.com
   - Or use Solana CLI: `solana airdrop 2 <your-address> --url devnet`
   - See [DEVNET_SETUP.md](./DEVNET_SETUP.md) for details

4. **Run the app**:
   ```bash
   npm run dev
   ```

**Note**: This project uses **Solana Devnet** by default (no API key needed, free SOL available).

## What This App Does

1. ✅ **Creates wallet with Google sign-on** - Uses MetaMask Embedded Wallets SDK
2. ✅ **Sends funds to burner wallet** - Uses WDK Solana SDK for transactions
3. ✅ **Tests wallet functionality** - Verifies balance, fees, transactions

## Key Integration Points

### MetaMask Embedded Wallets → WDK Solana SDK

```typescript
// 1. Get Solana account from MetaMask
const solanaAccount = await embeddedWallet.getAccountSolana();
// Returns: { address: string, privateKey: string }

// 2. Convert to Solana Keypair
const keyBytes = bs58.decode(solanaAccount.privateKey);
const keypair = Keypair.fromSecretKey(keyBytes);

// 3. Use with WDK Solana SDK
const walletManager = new WalletManagerSolana({...});
const account = await walletManager.importAccount(keypair);
```

## Testing

```bash
# Run tests
npm test

# Run app
npm run dev
```

## Documentation

- **Full Integration Guide**: See `INTEGRATION_GUIDE.md`
- **Code Examples**: See `src/app.ts`
- **MetaMask Docs**: https://docs.metamask.io/embedded-wallets/
- **WDK Solana Docs**: https://github.com/tetherto/wdk-wallet-solana

