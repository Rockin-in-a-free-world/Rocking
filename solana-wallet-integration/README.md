# Solana Wallet Integration Guide

This project demonstrates integrating **MetaMask Embedded Wallets SDK** with **@tetherto/wdk-wallet-solana** to:

1. ✅ Create a wallet with seed phrase using Google social sign-on
2. ✅ Send funds to a burner wallet on Solana
3. ✅ Test wallet functionality

## Architecture

```
┌─────────────────────────────────────┐
│  MetaMask Embedded Wallets SDK      │
│  - Google OAuth login               │
│  - Seed phrase generation           │
│  - ed25519 key extraction           │
└──────────────┬──────────────────────┘
               │
               │ Provides ed25519 private key
               ▼
┌─────────────────────────────────────┐
│  @tetherto/wdk-wallet-solana        │
│  - Wallet operations                │
│  - Transaction signing              │
│  - SOL transfers                    │
└─────────────────────────────────────┘
```

## Prerequisites

- **Node.js**: v20.0.0 or higher (v20.x LTS required)
  - The `@solana/kit` dependency (used by Tether SDK) requires Node 20+
  - This project uses `@types/node ^20.10.0` which targets Node 20
- **npm**: v9.0.0 or higher (comes with Node.js)
- **TypeScript**: v5.3.0 or higher (installed as dev dependency)

Check your versions:
```bash
node -v    # Should be v20.0.0 or higher
npm -v     # Should be v9.0.0 or higher
```

**Note**: If you're using Node 18, you may encounter compatibility issues with `@solana/kit`. Upgrade to Node 20 LTS for best compatibility.

## Installation

```bash
npm install @metamask/embedded-wallets @tetherto/wdk-wallet-solana @solana/web3.js
```

## Setup

1. Get MetaMask API credentials from [MetaMask Developer Portal](https://portal.metamask.io)
2. Set up Google OAuth in MetaMask dashboard
3. Configure environment variables (see `.env.example`)
4. **Get Devnet SOL** - See [DEVNET_SETUP.md](./DEVNET_SETUP.md) for instructions

## Network Configuration

This project uses **Solana Devnet** by default (recommended for development).

- ✅ Free SOL faucet available
- ✅ Safe for testing
- ✅ Fast development cycles

See [DEVNET_SETUP.md](./DEVNET_SETUP.md) for complete devnet setup guide.

## Usage

See `src/app.ts` for the complete implementation.

## Testing

```bash
npm test
```

**Note**: Make sure you have devnet SOL in your wallet before testing fund transfers. See [DEVNET_SETUP.md](./DEVNET_SETUP.md) for how to get free devnet SOL.

