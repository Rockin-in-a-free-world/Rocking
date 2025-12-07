# Solana Wallet Demo App - Complete Tutorial

This tutorial will guide you through building a Solana wallet application with transaction monitoring, multisig wallet creation via Google sign-on, and on-chain storage.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Setup](#project-setup)
3. [Wallet Creation via Google Sign-On](#wallet-creation-via-google-sign-on)
4. [Wallet Integration](#wallet-integration)
5. [Transaction Monitoring](#transaction-monitoring)
6. [Dashboard Implementation](#dashboard-implementation)
7. [On-Chain Storage](#on-chain-storage)
8. [Deployment](#deployment)

## Prerequisites

- **Node.js**: v20.0.0 or higher
- **npm**: v9.0.0 or higher
- **MetaMask Developer Account**: [portal.metamask.io](https://portal.metamask.io)
- **Solana Devnet SOL**: Get from [faucet.solana.com](https://faucet.solana.com)
- **Basic knowledge**: React, TypeScript, Solana

## Project Setup

### 1. Create Next.js App

```bash
npx create-next-app@latest solana-wallet-app
cd solana-wallet-app
```

Select options:
- TypeScript: Yes
- ESLint: Yes
- Tailwind CSS: Yes
- App Router: Yes
- src/ directory: No

### 2. Install Dependencies

```bash
npm install @metamask/embedded-wallets @tetherto/wdk-wallet-solana @solana/web3.js bs58
npm install -D @types/node
```

### 3. Project Structure

```
solana-wallet-app/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── callback/
│   ├── dashboard/
│   └── api/
├── components/
│   ├── Dashboard/
│   ├── TransactionMonitor/
│   └── StatusAlert/
├── lib/
│   ├── wallet.ts
│   ├── transactions.ts
│   └── storage.ts
└── types/
    └── index.ts
```

## Wallet Creation via Google Sign-On

### 1. Get MetaMask Embedded Wallets SDK Credentials

The MetaMask Embedded Wallets SDK enables **multisig key creation** via Google OAuth. It doesn't authenticate with MetaMask - it creates a new wallet key using Google sign-on through a multisig process.

1. Visit [MetaMask Developer Portal](https://portal.metamask.io)
2. Create a new project
3. Enable "Embedded Wallets"
4. Configure Google OAuth
5. Copy `clientId` and `secretKey`

### 2. Environment Variables

Create `.env.local`:

```bash
METAMASK_CLIENT_ID=your_client_id
METAMASK_SECRET_KEY=your_secret_key
SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=devnet

# Solana privateKey (stored after MetaMask wallet creation)
# Format: bytes/hex/base64 string from MetaMask SDK
# Dev mode: Stored unencrypted in .env (as per user acceptance)
SOLANA_PRIVATE_KEY=your_private_key_here
```

### 3. Wallet Creation Component

Create `components/Auth/GoogleSignIn.tsx`:

```typescript
'use client';

import { useState } from 'react';

export function GoogleSignIn() {
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    // MetaMask Embedded Wallets SDK creates wallet key via Google OAuth
    // This is multisig key creation, not authentication
    // Implementation details in next section
  };

  return (
    <button onClick={handleSignIn} disabled={loading}>
      {loading ? 'Creating wallet...' : 'Sign in with Google'}
    </button>
  );
}
```

## Wallet Integration

### Understanding the Flow

**Important**: 
- MetaMask SDK creates a wallet via Google sign-on and gives you control over a Solana wallet (ed25519 keypair).
- **Tether WDK SDK** uses `getAccount(index)` and requires a **seed phrase** (BIP-39 mnemonic) to derive accounts.
- MetaMask SDK may provide **seed phrase** OR only **privateKey** (needs verification).

**Two Possible Flows:**

**Flow 1 (if seed phrase available):**
1. MetaMask SDK creates wallet → Returns seed phrase
2. Use seed phrase with Tether WDK SDK → `new WalletManagerSolana(seedPhrase, config)`
3. Get account via index → `walletManager.getAccount(0)` (derives from seed phrase)

**Flow 2 (if only privateKey available):**
1. MetaMask SDK creates wallet → Returns privateKey
2. Convert to Solana Keypair → `Keypair.fromSecretKey(bs58.decode(privateKey))`
3. Use `@solana/web3.js` directly → Bypass Tether WDK SDK

See [INTEGRATION_FLOW.md](./INTEGRATION_FLOW.md) for detailed explanation.

### 1. Get Wallet Credentials from MetaMask

**Important:** Tether WDK SDK uses `getAccount(index)` and requires a **seed phrase** (BIP-39 mnemonic), not a privateKey. Check what MetaMask SDK provides.

Create `lib/wallet.ts`:

```typescript
/**
 * Get wallet credentials from MetaMask Embedded Wallets SDK
 * 
 * MetaMask SDK creates a wallet via Google sign-on.
 * We need to check if it provides seed phrase or only privateKey.
 */
export async function getWalletFromMetaMask(
  embeddedWallet: any
): Promise<{ seedPhrase?: string; privateKey?: string; address: string }> {
  // Authenticate with Google
  await embeddedWallet.authenticate({ provider: 'google' });
  
  // Try to get seed phrase first (if available)
  let seedPhrase: string | undefined;
  try {
    seedPhrase = await embeddedWallet.getSeedPhrase(); // Verify this method exists
  } catch (e) {
    // Seed phrase not available
  }
  
  // Get Solana account (always available)
  const solanaAccount = await embeddedWallet.getAccountSolana();
  // Returns: { address: string, privateKey: string }
  
  return {
    seedPhrase,
    privateKey: solanaAccount.privateKey,
    address: solanaAccount.address,
  };
}
```

### 2. Initialize Wallet (Two Paths)

**Path 1: If seed phrase is available (use Tether WDK SDK)**

```typescript
import WalletManagerSolana from '@tetherto/wdk-wallet-solana';

/**
 * Create Tether WDK wallet manager from seed phrase
 * 
 * Tether WDK SDK uses getAccount(index) to derive accounts from seed phrase
 * via BIP-44: m/44'/501'/index'/0'
 */
export function createWalletFromSeedPhrase(
  seedPhrase: string
): WalletManagerSolana {
  // WDK SDK derives accounts from seed phrase
  const walletManager = new WalletManagerSolana(seedPhrase, {
    provider: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  });
  
  return walletManager;
}
```

**Path 2: If only privateKey is available (use @solana/web3.js directly)**

```typescript
import { Keypair } from '@solana/web3.js';
import * as bs58 from 'bs58';

/**
 * Create Solana Keypair from privateKey
 * 
 * If MetaMask only provides privateKey, we use @solana/web3.js directly
 * instead of Tether WDK SDK (which requires seed phrase)
 */
export function createKeypairFromPrivateKey(
  privateKey: string
): Keypair {
  // Convert privateKey to Solana Keypair
  const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));
  return keypair;
}
```

### 3. Use Wallet for Operations

**Path 1: With Tether WDK SDK (if seed phrase available)**

```typescript
/**
 * Use the wallet with Tether WDK for operations
 * 
 * Tether WDK SDK derives account 0 from seed phrase via BIP-44
 */
export async function useWalletWithWDK(
  walletManager: WalletManagerSolana
): Promise<void> {
  // Get account 0 (derived from seed phrase)
  const account = await walletManager.getAccount(0);
  
  // Use WDK methods
  const balance = await account.getBalance();
  console.log('Balance:', balance, 'lamports');
  
  // Send transaction
  const signature = await account.sendTransaction({
    recipient: '11111111111111111111111111111111',
    value: 1000000n, // 0.001 SOL
    commitment: 'confirmed',
  });
  
  console.log('Transaction signature:', signature);
}
```

**Path 2: With @solana/web3.js directly (if only privateKey available)**

```typescript
import { Connection, sendAndConfirmTransaction, Transaction, SystemProgram } from '@solana/web3.js';

/**
 * Use the wallet with @solana/web3.js directly
 * 
 * If MetaMask only provides privateKey, we bypass Tether WDK SDK
 * and use @solana/web3.js directly
 */
export async function useWalletDirectly(
  keypair: Keypair
): Promise<void> {
  const connection = new Connection(
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com'
  );
  
  // Get balance
  const balance = await connection.getBalance(keypair.publicKey);
  console.log('Balance:', balance, 'lamports');
  
  // Send transaction
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: keypair.publicKey,
      toPubkey: new PublicKey('11111111111111111111111111111111'),
      lamports: 1000000, // 0.001 SOL
    })
  );
  
  const signature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [keypair]
  );
  
  console.log('Transaction signature:', signature);
}
```

## Transaction Monitoring

### 1. Transaction Monitor

Create `lib/transactions.ts`:

```typescript
import { Connection, PublicKey } from '@solana/web3.js';

export async function getTransactionSignatures(
  address: string
): Promise<string[]> {
  const pubkey = new PublicKey(address);
  const signatures = await connection.getSignaturesForAddress(pubkey);
  return signatures.map(s => s.signature);
}

export async function getTransactionStatuses(
  signatures: string[]
): Promise<TransactionStatus[]> {
  const statuses = await connection.getSignatureStatuses(signatures);
  return statuses.value.map((status, index) => ({
    signature: signatures[index],
    status: status?.confirmationStatus || null,
    err: status?.err || null,
  }));
}
```

### 2. Metrics Calculation

```typescript
export function calculateMetrics(
  signatures: string[],
  statuses: TransactionStatus[]
): TransactionMetrics {
  // Calculate submitted, broadcast, confirmed, finalized counts
  // Return metrics object
}
```

## Dashboard Implementation

### 1. Dashboard Component

Create `app/dashboard/page.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { MetricsDisplay } from '@/components/Dashboard/MetricsDisplay';
import { StatusAlert } from '@/components/Dashboard/StatusAlert';
import { TransactionList } from '@/components/Dashboard/TransactionList';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<TransactionMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initial load
    refreshData();
    
    // Poll every 30 seconds
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, []);

  const refreshData = async () => {
    setIsLoading(true);
    // Fetch and calculate metrics
    // Update state
    setIsLoading(false);
  };

  return (
    <div className="container mx-auto p-4">
      <h1>Dashboard</h1>
      <StatusAlert metrics={metrics} isLoading={isLoading} />
      <MetricsDisplay metrics={metrics} isLoading={isLoading} />
      <TransactionList transactions={transactions} />
    </div>
  );
}
```

### 2. Status Alert Component

Create `components/Dashboard/StatusAlert.tsx`:

```typescript
export function StatusAlert({ metrics, isLoading }: Props) {
  const status = calculateStatus(metrics);
  
  const statusConfig = {
    Grand: { icon: '😊', color: 'green', message: 'All transactions finalized!' },
    Good: { icon: '😌', color: 'yellow', message: 'All transactions confirmed' },
    Gutted: { icon: '😢', color: 'red', message: 'Some transactions failed' },
  };
  
  return (
    <div className={`alert alert-${statusConfig[status].color}`}>
      {isLoading ? '🔄' : statusConfig[status].icon}
      <span>{statusConfig[status].message}</span>
    </div>
  );
}
```

## On-Chain Storage

### 1. Solana Program Setup

You'll need a Solana program to manage user accounts. For the demo, you can:

**Option A: Use a simple on-chain program**
- Deploy a program that manages 10KB PDA accounts
- Handle acknowledged failures storage

**Option B: Use Anchor Framework**
- Easier development
- Better tooling

### 2. User Account PDA

```typescript
import { PublicKey } from '@solana/web3.js';

export function deriveUserPDA(googleUserId: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('user_account'),
      Buffer.from(googleUserId),
    ],
    programId
  );
}
```

### 3. Acknowledge Failure

```typescript
export async function acknowledgeTransactionFailure(
  userPDA: PublicKey,
  signature: string
): Promise<void> {
  // Call Solana program to add signature to acknowledged failures
  // Update on-chain account
}
```

## Features Implementation

### 1. Transaction Correction

```typescript
export async function correctTransaction(
  failedSignature: string
): Promise<string> {
  // Retry failed transaction
  // Return new transaction signature
}
```

### 2. Feemaster Account Setup

**Note:** The feemaster account is managed through a **separate admin app** using Tether SDK (seed phrase controlled, no social sign-on).

See [FEEMASTER_ACCOUNT.md](./FEEMASTER_ACCOUNT.md) for complete setup instructions.

**Quick Setup:**

1. **Create feemaster account** (one-time, using Tether SDK):
   ```typescript
   import WalletManagerSolana from '@tetherto/wdk-wallet-solana';
   
   const feemasterWallet = new WalletManagerSolana(seedPhrase, {
     provider: 'https://api.devnet.solana.com',
   });
   const feemasterAccount = await feemasterWallet.getAccount(0);
   ```

2. **Fund the feemaster account** (send SOL to `feemasterAccount.publicKey`)

3. **Use feemaster admin app** to:
   - View private key (for funding)
   - Sign transactions to pay user account rent
   - Monitor rent payment queue

### 3. Close Account

```typescript
export async function closeAccount(
  userPDA: PublicKey
): Promise<void> {
  // Set closedAt timestamp
  // Clear sensitive data
  // User will see first-time flow on next login
}
```

## Testing

### 1. Test Transaction Flow

```typescript
// 1. Create wallet
// 2. Get devnet SOL from faucet
// 3. Send test transaction
// 4. Monitor through states
// 5. Verify dashboard updates
```

### 2. Test Failure Acknowledgment

```typescript
// 1. Create transaction that will fail
// 2. Wait for failure
// 3. Acknowledge failure
// 4. Verify status changes from "Gutted" to "Good"
```

## Next Steps

1. Implement Solana program for on-chain storage
2. Build feemaster admin app (see [FEEMASTER_ACCOUNT.md](./FEEMASTER_ACCOUNT.md))
3. Implement rent payment system (feemaster pays for new user accounts)
4. Add email notifications for feemaster (optional)
5. Implement transaction correction flow
6. Add error handling and retry logic
7. Deploy to production

## Resources

- [Tether WDK Solana Docs](https://github.com/tetherto/wdk-wallet-solana)
- [MetaMask Embedded Wallets](https://docs.metamask.io/embedded-wallets/)
- [Solana Web3.js Docs](https://solana-labs.github.io/solana-web3.js/)
- [Next.js Documentation](https://nextjs.org/docs)

