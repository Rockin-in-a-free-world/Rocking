# Feemaster Account Management

## Overview

The **Feemaster Account** is a special administrative account that:
- Pays rent for new user accounts when they're created
- Receives email notifications when fee payment is needed
- Is managed through Tether SDK (seed phrase controlled, no social sign-on)
- Has a separate admin app for management

## Feemaster Account Creation

### Using Tether WDK SDK

The feemaster account is created and managed using Tether WDK SDK with a seed phrase:

```typescript
import WalletManagerSolana from '@tetherto/wdk-wallet-solana';

/**
 * Create feemaster account from seed phrase
 * 
 * This is a one-time setup. Store the seed phrase securely.
 */
export function createFeemasterAccount(seedPhrase: string): WalletManagerSolana {
  const walletManager = new WalletManagerSolana(seedPhrase, {
    provider: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  });
  
  return walletManager;
}

/**
 * Get feemaster account (account 0)
 */
export async function getFeemasterAccount(
  walletManager: WalletManagerSolana
) {
  const account = await walletManager.getAccount(0);
  return account;
}
```

### Initial Setup

1. **Generate seed phrase** (BIP-39 mnemonic)
   ```bash
   # Use a secure method to generate seed phrase
   # Store it securely (password manager, hardware wallet, etc.)
   ```

2. **Create wallet manager**
   ```typescript
   const feemasterWallet = createFeemasterAccount(seedPhrase);
   const feemasterAccount = await getFeemasterAccount(feemasterWallet);
   ```

3. **Fund the account**
   - Get the public key: `feemasterAccount.publicKey`
   - Send SOL to this address (enough for rent payments)
   - Recommended: 1-2 SOL for devnet, 0.1-0.5 SOL for mainnet

4. **Store credentials securely**
   - Seed phrase: Store in secure location (never commit to git)
   - Public key: Can be stored in `.env` for reference
   - Private key: Derivable from seed phrase, but can be stored for convenience

## Feemaster Admin App

A separate admin app allows you to:
- Login with seed phrase
- View account details (public key, balance, private key)
- Sign transactions to pay user account rent
- Monitor pending rent payment requests

### App Structure

```
feemaster-admin/
├── app/
│   ├── page.tsx          # Login page (seed phrase input)
│   ├── dashboard/
│   │   └── page.tsx      # Admin dashboard
│   └── layout.tsx
├── lib/
│   ├── feemaster.ts     # Feemaster account management
│   ├── rent-payment.ts  # Rent payment transactions
│   └── wallet.ts        # Tether WDK integration
└── components/
    ├── LoginForm.tsx
    ├── AccountInfo.tsx
    ├── PrivateKeyDisplay.tsx
    └── RentPaymentQueue.tsx
```

### Login Flow

```typescript
// app/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function FeemasterLogin() {
  const [seedPhrase, setSeedPhrase] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    try {
      // Validate seed phrase (12 or 24 words)
      const words = seedPhrase.trim().split(/\s+/);
      if (words.length !== 12 && words.length !== 24) {
        throw new Error('Seed phrase must be 12 or 24 words');
      }

      // Store in session (client-side only, never send to server)
      sessionStorage.setItem('feemaster_seed_phrase', seedPhrase);
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h1>Feemaster Admin Login</h1>
      <textarea
        value={seedPhrase}
        onChange={(e) => setSeedPhrase(e.target.value)}
        placeholder="Enter seed phrase (12 or 24 words)"
        rows={3}
      />
      <button onClick={handleLogin}>Login</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
```

### Dashboard

```typescript
// app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { createFeemasterAccount, getFeemasterAccount } from '@/lib/feemaster';
import AccountInfo from '@/components/AccountInfo';
import PrivateKeyDisplay from '@/components/PrivateKeyDisplay';
import RentPaymentQueue from '@/components/RentPaymentQueue';

export default function FeemasterDashboard() {
  const [walletManager, setWalletManager] = useState(null);
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    // Get seed phrase from session
    const seedPhrase = sessionStorage.getItem('feemaster_seed_phrase');
    if (!seedPhrase) {
      window.location.href = '/';
      return;
    }

    // Initialize wallet
    const wm = createFeemasterAccount(seedPhrase);
    setWalletManager(wm);

    // Get account and balance
    getFeemasterAccount(wm).then(async (acc) => {
      setAccount(acc);
      const bal = await acc.getBalance();
      setBalance(bal);
    });
  }, []);

  if (!account) return <div>Loading...</div>;

  return (
    <div>
      <h1>Feemaster Admin Dashboard</h1>
      <AccountInfo account={account} balance={balance} />
      <PrivateKeyDisplay walletManager={walletManager} />
      <RentPaymentQueue account={account} />
    </div>
  );
}
```

### View Private Key

**Note:** Since Tether WDK SDK uses seed phrase and derives accounts, we need to derive the private key from the seed phrase. Alternatively, if you have the seed phrase, you can derive the keypair directly.

```typescript
// components/PrivateKeyDisplay.tsx
'use client';

import { useState } from 'react';
import * as bs58 from 'bs58';
import { derivePath } from 'ed25519-hd-key';
import { Keypair } from '@solana/web3.js';

export default function PrivateKeyDisplay({ walletManager, seedPhrase }) {
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [privateKey, setPrivateKey] = useState('');

  const handleShowPrivateKey = async () => {
    if (!showPrivateKey) {
      try {
        // Option 1: If WDK exposes keypair
        const account = await walletManager.getAccount(0);
        if (account.keyPair) {
          const privateKeyBytes = account.keyPair.secretKey;
          const privateKeyBase58 = bs58.encode(privateKeyBytes);
          setPrivateKey(privateKeyBase58);
        } else {
          // Option 2: Derive from seed phrase (BIP-44: m/44'/501'/0'/0')
          // This requires bip39 and ed25519-hd-key libraries
          // For now, show seed phrase reminder
          setPrivateKey('Derive from seed phrase using BIP-44 path: m/44\'/501\'/0\'/0\'');
        }
      } catch (error) {
        console.error('Error getting private key:', error);
        setPrivateKey('Error: Could not derive private key');
      }
    }
    setShowPrivateKey(!showPrivateKey);
  };

  return (
    <div>
      <h2>Private Key</h2>
      <button onClick={handleShowPrivateKey}>
        {showPrivateKey ? 'Hide' : 'Show'} Private Key
      </button>
      {showPrivateKey && (
        <div>
          <textarea
            value={privateKey}
            readOnly
            rows={3}
            style={{ width: '100%', fontFamily: 'monospace' }}
          />
          <p style={{ fontSize: '12px', color: 'red' }}>
            ⚠️ Keep this private key secure. Never share it.
          </p>
          <p style={{ fontSize: '12px', color: 'gray' }}>
            Note: If private key is not available, you can derive it from the seed phrase
            using BIP-44 derivation path: m/44'/501'/0'/0'
          </p>
        </div>
      )}
    </div>
  );
}
```

**Alternative:** Store the derived private key when creating the feemaster account, then display it:

```typescript
// When creating feemaster account, derive and store private key
import { derivePath } from 'ed25519-hd-key';
import { Keypair } from '@solana/web3.js';

async function getFeemasterPrivateKey(seedPhrase: string): Promise<string> {
  // Derive account 0 using BIP-44: m/44'/501'/0'/0'
  // Implementation depends on bip39 and ed25519-hd-key libraries
  // Return base58-encoded private key
}
```

## Paying User Account Rent

When a new user account is created, the feemaster account pays the rent:

### Derive Keypair from Seed Phrase

```typescript
// lib/feemaster.ts
import { Keypair } from '@solana/web3.js';
import { derivePath } from 'ed25519-hd-key';
import * as bip39 from 'bip39';

/**
 * Derive Solana keypair from seed phrase using BIP-44
 * Path: m/44'/501'/accountIndex'/0'
 */
export async function deriveKeypairFromSeedPhrase(
  seedPhrase: string,
  accountIndex: number = 0
): Promise<Keypair> {
  // Convert seed phrase to seed
  const seed = await bip39.mnemonicToSeed(seedPhrase);
  
  // Derive using BIP-44 path for Solana: m/44'/501'/accountIndex'/0'
  const derivedSeed = derivePath(
    `m/44'/501'/${accountIndex}'/0'`,
    seed.toString('hex')
  ).key;
  
  // Create Solana keypair from derived seed
  const keypair = Keypair.fromSeed(derivedSeed);
  
  return keypair;
}
```

**Note:** This requires installing:
```bash
npm install bip39 ed25519-hd-key
```

### Rent Payment Transaction

```typescript
// lib/rent-payment.ts
import { Connection, SystemProgram, Transaction, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

/**
 * Calculate rent for a 10KB account
 */
export async function calculateRentExempt(
  connection: Connection,
  dataSize: number = 10240 // 10KB
): Promise<number> {
  const rentExemptBalance = await connection.getMinimumBalanceForRentExemption(dataSize);
  return rentExemptBalance;
}

/**
 * Pay rent for a new user account
 * 
 * @param feemasterAccount - Feemaster account (from Tether WDK)
 * @param feemasterKeypair - Feemaster keypair (derived from seed phrase)
 * @param userPDA - User's PDA address
 * @param connection - Solana connection
 */
export async function payUserAccountRent(
  feemasterAccount: any, // WalletAccountSolana from Tether WDK
  feemasterKeypair: Keypair, // Derived keypair for signing
  userPDA: PublicKey,
  connection: Connection
): Promise<string> {
  // Calculate rent-exempt minimum for 10KB account
  const rentAmount = await calculateRentExempt(connection, 10240);

  // Option 1: Use Tether WDK if it has sendTransaction method
  try {
    if (feemasterAccount.sendTransaction) {
      const signature = await feemasterAccount.sendTransaction({
        recipient: userPDA.toBase58(),
        value: BigInt(rentAmount),
        commitment: 'confirmed',
      });
      return signature;
    }
  } catch (error) {
    console.warn('Tether WDK sendTransaction not available, using @solana/web3.js directly');
  }

  // Option 2: Use @solana/web3.js directly
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: feemasterKeypair.publicKey,
      toPubkey: userPDA,
      lamports: rentAmount,
    })
  );

  const signature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [feemasterKeypair],
    { commitment: 'confirmed' }
  );

  return signature;
}
```

### Integration with User Account Creation

```typescript
// In main app: When creating new user account
import { payUserAccountRent } from '@/lib/rent-payment';

async function createNewUserAccount(googleUserId: string) {
  // 1. Derive user PDA
  const [userPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("user_account"), Buffer.from(googleUserId)],
    programId
  );

  // 2. Check if account already exists
  const existingAccount = await connection.getAccountInfo(userPDA);
  if (existingAccount) {
    throw new Error('Account already exists');
  }

  // 3. Request feemaster to pay rent
  // Option A: Direct call (if feemaster is available)
  // Option B: Queue request (if feemaster needs to sign manually)
  
  // For now, we'll queue the request
  await queueRentPaymentRequest(userPDA, googleUserId);

  // 4. Create the account (rent will be paid by feemaster)
  await program.methods
    .initializeUserAccount(googleUserId)
    .accounts({
      userAccount: userPDA,
      user: userWallet.publicKey,
      feemaster: feemasterPublicKey, // Feemaster pays rent
    })
    .rpc();
}
```

### Rent Payment Queue

```typescript
// components/RentPaymentQueue.tsx
'use client';

import { useState, useEffect } from 'react';
import { payUserAccountRent } from '@/lib/rent-payment';
import { Connection, PublicKey } from '@solana/web3.js';

interface RentPaymentRequest {
  userPDA: string;
  googleUserId: string;
  requestedAt: number;
  status: 'pending' | 'paid' | 'failed';
}

export default function RentPaymentQueue({ account }) {
  const [requests, setRequests] = useState<RentPaymentRequest[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load pending rent payment requests
    // This could be from:
    // - On-chain storage (program account)
    // - Database
    // - API endpoint
    loadPendingRequests();
  }, []);

  const handlePayRent = async (request: RentPaymentRequest) => {
    setLoading(true);
    try {
      const connection = new Connection(
        process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com'
      );
      
      // Get feemaster keypair (derive from seed phrase stored in session)
      const seedPhrase = sessionStorage.getItem('feemaster_seed_phrase');
      const feemasterKeypair = await deriveKeypairFromSeedPhrase(seedPhrase, 0);
      
      const signature = await payUserAccountRent(
        account,
        feemasterKeypair,
        new PublicKey(request.userPDA),
        connection
      );

      // Update request status
      await markRequestAsPaid(request.userPDA, signature);
      setRequests(requests.filter(r => r.userPDA !== request.userPDA));
    } catch (error) {
      console.error('Failed to pay rent:', error);
      alert('Failed to pay rent: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Rent Payment Queue</h2>
      {requests.length === 0 ? (
        <p>No pending rent payments</p>
      ) : (
        <ul>
          {requests.map((request) => (
            <li key={request.userPDA}>
              <div>
                <p>User PDA: {request.userPDA}</p>
                <p>Google User ID: {request.googleUserId}</p>
                <p>Requested: {new Date(request.requestedAt).toLocaleString()}</p>
                <button
                  onClick={() => handlePayRent(request)}
                  disabled={loading}
                >
                  Pay Rent
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

## Security Considerations

1. **Seed Phrase Storage**
   - Never commit seed phrase to git
   - Store in secure password manager
   - Use environment variables for production (encrypted)
   - Consider hardware wallet for mainnet

2. **Private Key Display**
   - Only show in admin app (not main user app)
   - Require additional authentication (password, 2FA)
   - Log access to private key
   - Clear from memory after use

3. **Rent Payment Authorization**
   - Verify user PDA before paying
   - Set maximum rent amount per transaction
   - Monitor for suspicious activity
   - Require confirmation for large payments

4. **Session Management**
   - Clear seed phrase from session on logout
   - Set session timeout
   - Use secure session storage (HTTPS only)

## Environment Variables

```bash
# .env.local (feemaster admin app)
FEEMASTER_SEED_PHRASE=word1 word2 ... word12  # Optional: for auto-login (dev only)
SOLANA_RPC_URL=https://api.devnet.solana.com
FEEMASTER_PUBLIC_KEY=<feemaster_public_key>  # For reference
```

## Deployment

The feemaster admin app should be:
- **Separate from main user app** (different domain/subdomain)
- **Access-controlled** (IP whitelist, VPN, etc.)
- **HTTPS only** (never send seed phrase over HTTP)
- **Not publicly accessible** (admin-only)

## Summary

- ✅ Feemaster account created via Tether SDK (seed phrase)
- ✅ Separate admin app for management
- ✅ View private key (for funding account)
- ✅ Sign transactions to pay user account rent
- ✅ Queue-based rent payment system
- ✅ Secure seed phrase handling

