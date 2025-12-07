# Devnet Setup Guide

This project is configured to use **Solana Devnet** by default for development and testing.

## Why Devnet?

✅ **Free SOL faucet** - Easy to get test tokens  
✅ **Fast iteration** - Quick development cycles  
✅ **Safe testing** - No risk to real funds  
✅ **Better for learning** - More forgiving environment  

## Default Configuration

The project defaults to devnet in all files:

```typescript
// Default RPC endpoint
provider: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com'
```

## Getting Devnet SOL

You'll need devnet SOL to test transactions. Here are three ways to get it:

### Option 1: Solana CLI (Recommended)

```bash
# Install Solana CLI if you haven't
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Set to devnet
solana config set --url devnet

# Get your wallet address
solana address

# Request airdrop (2 SOL)
solana airdrop 2 <your-wallet-address>
```

### Option 2: Web Faucet

1. Visit https://faucet.solana.com
2. Paste your wallet address
3. Click "Request Airdrop"
4. Wait a few seconds for confirmation

### Option 3: Programmatic (In Your Code)

```typescript
import { Connection, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';

async function requestAirdrop(publicKey: PublicKey) {
  const connection = new Connection('https://api.devnet.solana.com');
  const signature = await connection.requestAirdrop(
    publicKey,
    2 * LAMPORTS_PER_SOL // 2 SOL
  );
  await connection.confirmTransaction(signature);
  console.log(`Airdrop successful! Signature: ${signature}`);
}
```

## Environment Variables

Create a `.env` file (optional - devnet is already the default):

```bash
# Optional: Override default devnet RPC
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_NETWORK=devnet

# MetaMask Embedded Wallets (required)
METAMASK_CLIENT_ID=your_client_id_here
METAMASK_SECRET_KEY=your_secret_key_here

# Test Configuration
TEST_AMOUNT_LAMPORTS=1000000  # 0.001 SOL
```

## Testing Your Setup

1. **Check connection**:
   ```bash
   npm test
   ```

2. **Run the app**:
   ```bash
   npm run dev
   ```

3. **Verify balance**:
   The app will check your wallet balance before sending funds. If you don't have enough, it will show a helpful message.

## Devnet Explorer

View your transactions on the Solana Explorer:
- **Devnet Explorer**: https://explorer.solana.com/?cluster=devnet
- Just paste your transaction signature to view details

## Important Notes

⚠️ **Devnet can reset** - Don't rely on devnet data persisting forever  
⚠️ **Not real SOL** - Devnet tokens have no value  
⚠️ **Rate limits** - Faucets may have rate limits (usually 1-2 SOL per request)  

## Switching Networks

If you need to test on a different network, update your `.env`:

```bash
# For testnet
SOLANA_RPC_URL=https://api.testnet.solana.com
SOLANA_NETWORK=testnet

# For mainnet (production - use real SOL!)
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_NETWORK=mainnet
```

## Troubleshooting

### "Insufficient balance" error

**Solution**: Request devnet SOL using one of the methods above.

### "Connection refused" error

**Solution**: 
- Check your internet connection
- Try a different RPC endpoint (some public endpoints may be rate-limited)
- Consider using a private RPC provider for production

### Transaction not confirming

**Solution**:
- Devnet can be slower than mainnet
- Wait a bit longer (30-60 seconds)
- Check transaction status on explorer

## Resources

- [Solana Devnet Docs](https://docs.solana.com/clusters)
- [Solana Faucet](https://faucet.solana.com)
- [Solana Explorer (Devnet)](https://explorer.solana.com/?cluster=devnet)

