# Solana Wallet Demo App

A Next.js application demonstrating Tether WDK Solana SDK with transaction monitoring, multisig wallet creation via Google sign-on, and dashboard metrics.

## High-Level Prerequisites

Before you begin, ensure you have:

1. **Node.js v20.0.0 or higher** (required for `@solana/kit` dependency)
   ```bash
   node --version  # Should be v20.0.0+
   ```

2. **npm v9.0.0 or higher**
   ```bash
   npm --version  # Should be v9.0.0+
   ```

3. **TypeScript v5.3.0 or higher**
   ```bash
   npm install -g typescript@latest
   tsc --version
   ```

4. **MetaMask Embedded Wallets SDK credentials**
   - Client ID
   - Secret Key
   - Get access from: https://docs.metamask.io/embedded-wallets/
   > Signup -> create new project -> add Solana to Chain Namespace

5. **Solana Devnet access**
   - Default network for development
   - Free SOL available from faucet (see below)

6. **Tether WDK Solana SDK**
   - `@tetherto/wdk-wallet-solana`
   - Installed via npm

## Testing Phase

### Step 1: Become Feemaster for the Demo Dashboard

The feemaster account is a special administrative account that:
- Pays rent for new user accounts (10KB PDA per user)
- Pays transaction fees (gas) for users
- Manages user allowlist

**Setup:**

1. **Generate a seed phrase** (BIP-39 mnemonic, 12 or 24 words)
   - Use a secure generator or password manager
   - Store it securely (never commit to git)

2. **Create feemaster account using Tether SDK**
   ```typescript
   import WalletManagerSolana from '@tetherto/wdk-wallet-solana';
   
   const feemasterWallet = new WalletManagerSolana(seedPhrase, {
     provider: 'https://api.devnet.solana.com',
   });
   const feemasterAccount = await feemasterWallet.getAccount(0);
   const feemasterPublicKey = feemasterAccount.publicKey;
   ```

3. **Get Devnet SOL for feemaster account**
   
   The feemaster needs Devnet SOL to:
   - Pay its own account rent
   - Pay rent for new user accounts (~0.001 SOL per user)
   - Pay transaction fees (gas) for users
   
   **Get Devnet SOL:**
   - **Web Faucet**: https://faucet.solana.com
     - Paste your feemaster public key
     - Request 2 SOL (recommended: request multiple times to get 5-10 SOL total)
   - **CLI Faucet**:
     ```bash
     solana config set --url devnet
     solana airdrop 2 <feemaster-public-key>
     ```
   - **Programmatic**:
     ```typescript
     const connection = new Connection('https://api.devnet.solana.com');
     const signature = await connection.requestAirdrop(
       feemasterPublicKey,
       2 * LAMPORTS_PER_SOL
     );
     ```
   
   **Recommended amount**: 5-10 SOL for testing (covers ~1000 user accounts + gas)

4. **Store feemaster credentials**
   - Seed phrase: Store securely (password manager)
   - Public key: Can be stored in `.env` for reference
   - Balance: Verify on [Solana Explorer (Devnet)](https://explorer.solana.com/?cluster=devnet)

5. **Access feemaster admin dashboard**
   - Use the separate feemaster admin app
   - Login with seed phrase
   - View account balance and private key
   - Manage user allowlist
   - Pay rent for new users

### Step 2: Launch the App and Create a New User

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   Create `.env.local`:
   ```bash
   # MetaMask Embedded Wallets
   NEXT_PUBLIC_METAMASK_CLIENT_ID=your_client_id
   METAMASK_SECRET_KEY=your_secret_key
   
   # Solana
   NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
   NEXT_PUBLIC_SOLANA_NETWORK=devnet
   
   # Feemaster (for reference)
   FEEMASTER_PUBLIC_KEY=<feemaster_public_key>
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open the app**
   - Visit `http://localhost:3000`
   - Click "Sign in with Google"
   - Accept terms and conditions
   - Account creation will be queued (feemaster needs to approve)

5. **New user account creation**
   - User signs in with Google
   - MetaMask SDK creates wallet key via multisig
   - User PDA is derived (10KB account)
   - Rent payment request is queued for feemaster
   - User account is pending until feemaster approves

### Step 3: Feemaster Adds User to Allowlist

1. **Access feemaster admin dashboard**
   - Login with feemaster seed phrase
   - Navigate to "User Management" or "Allowlist"

2. **View pending user requests**
   - See list of users waiting for approval
   - Each user shows:
     - Google User ID
     - User PDA address
     - Request timestamp
     - Rent amount needed (~0.001 SOL)

3. **Approve user and pay rent**
   - Click "Approve" for a user
   - Feemaster signs transaction to:
     - Add user to allowlist
     - Pay rent for user's 10KB PDA account
   - Transaction is broadcast and confirmed

4. **User account is activated**
   - User can now access dashboard
   - User can send transactions (feemaster pays gas)
   - User's on-chain account is initialized

## Additional Prerequisites

### Development Tools

- **Git** - Version control
- **VS Code** (recommended) - Code editor
- **Solana CLI** (optional) - For advanced testing
  ```bash
  sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
  ```

### Understanding the Architecture

Before testing, familiarize yourself with:
- [INTEGRATION_FLOW.md](../INTEGRATION_FLOW.md) - How MetaMask SDK + Tether WDK work together
- [FEEMASTER_ACCOUNT.md](../FEEMASTER_ACCOUNT.md) - Feemaster account management
- [STORAGE_DESIGN.md](../STORAGE_DESIGN.md) - 10KB per-account architecture
- [APP_ARCHITECTURE.md](../APP_ARCHITECTURE.md) - Overall app structure

### Network Configuration

- **Default**: Devnet (`https://api.devnet.solana.com`)
- **Why Devnet**: Free SOL, safe testing, fast iteration
- **Explorer**: https://explorer.solana.com/?cluster=devnet

### Security Notes

⚠️ **Important for Testing:**
- Never commit seed phrases or private keys to git
- Use `.env.local` (gitignored) for sensitive data
- Devnet SOL has no value, but still practice good security
- Feemaster seed phrase should be stored securely

## Next Steps

Once prerequisites are met and testing steps are complete:

1. ✅ Feemaster account created and funded
2. ✅ App launched and running
3. ✅ New user created
4. ✅ User added to allowlist
5. 🚀 **Ready to test transaction monitoring, dashboard, and all features!**

## Troubleshooting

### "Insufficient balance" error
- **Feemaster**: Request more Devnet SOL from faucet
- **User**: Feemaster needs to pay rent/gas

### "Connection refused" error
- Check internet connection
- Try different RPC endpoint
- Verify `SOLANA_RPC_URL` in `.env.local`

### "User not on allowlist" error
- Feemaster needs to approve user in admin dashboard
- Check feemaster account has sufficient balance

### Transaction not confirming
- Devnet can be slower than mainnet
- Wait 30-60 seconds
- Check transaction on [Solana Explorer](https://explorer.solana.com/?cluster=devnet)

## Resources

- [Solana Devnet Docs](https://docs.solana.com/clusters)
- [Solana Faucet](https://faucet.solana.com)
- [Solana Explorer (Devnet)](https://explorer.solana.com/?cluster=devnet)
- [MetaMask Embedded Wallets Docs](https://docs.metamask.io/embedded-wallets/)
- [Tether WDK Solana GitHub](https://github.com/tetherto/wdk-wallet-solana)
