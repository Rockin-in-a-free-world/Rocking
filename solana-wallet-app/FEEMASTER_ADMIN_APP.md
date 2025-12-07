# Feemaster Admin App - Quick Start

## Overview

A separate admin application for managing the feemaster account. This app allows you to:
- Login with seed phrase (no social sign-on)
- View account details (public key, balance)
- View private key (for funding the account)
- Sign transactions to pay user account rent

## Project Setup

### Create New Next.js App

```bash
# Create feemaster admin app
npx create-next-app@latest feemaster-admin --typescript --tailwind --app

cd feemaster-admin
```

### Install Dependencies

```bash
npm install @tetherto/wdk-wallet-solana @solana/web3.js bs58
```

### Project Structure

```
feemaster-admin/
├── app/
│   ├── page.tsx              # Login page
│   ├── dashboard/
│   │   └── page.tsx         # Admin dashboard
│   └── layout.tsx
├── lib/
│   ├── feemaster.ts         # Feemaster account management
│   └── rent-payment.ts      # Rent payment logic
└── components/
    ├── LoginForm.tsx
    ├── AccountInfo.tsx
    ├── PrivateKeyDisplay.tsx
    └── RentPaymentQueue.tsx
```

## Implementation

### 1. Feemaster Account Management

Create `lib/feemaster.ts`:

```typescript
import WalletManagerSolana from '@tetherto/wdk-wallet-solana';

export function createFeemasterAccount(seedPhrase: string): WalletManagerSolana {
  return new WalletManagerSolana(seedPhrase, {
    provider: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  });
}

export async function getFeemasterAccount(walletManager: WalletManagerSolana) {
  return await walletManager.getAccount(0);
}
```

### 2. Login Page

**Two Modes:**
- **Setup (New)**: Leave seed phrase empty → generates new → creates new wallet
- **Login (Existing)**: Enter seed phrase → accesses existing wallet (account index 0)

Create `app/feemaster/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function FeemasterLogin() {
  const [seedPhrase, setSeedPhrase] = useState('');
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    try {
      const isEmpty = !seedPhrase.trim();
      
      // Confirmation only required when generating new seed phrase (empty input)
      if (isEmpty && !confirmed) {
        throw new Error('Please confirm that you understand the requirements');
      }

      // Call setup/login API
      const response = await fetch('/api/feemaster/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seedPhrase: seedPhrase.trim() || undefined }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Setup failed');
      }

      const data = await response.json();
      
      // Store in session (client-side only)
      sessionStorage.setItem('feemaster_public_key', data.publicKey);
      sessionStorage.setItem('feemaster_setup_complete', 'true');
      
      // Store seed phrase temporarily for dashboard operations
      if (data.seedPhrase) {
        sessionStorage.setItem('feemaster_seed_phrase_temp', data.seedPhrase);
      } else if (seedPhrase.trim()) {
        sessionStorage.setItem('feemaster_seed_phrase_temp', seedPhrase.trim());
      }
      
      // If seed phrase was generated, show it to user
      if (data.isNewSetup && data.seedPhrase) {
        alert(`⚠️ IMPORTANT: Save this seed phrase securely!\n\n${data.seedPhrase}`);
      }
      
      router.push('/feemaster/dashboard');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <h1 className="text-3xl font-bold text-center">Feemaster Admin</h1>
        <p className="text-center">Login with your seed phrase or generate a new one</p>
        
        <div>
          <label className="block text-sm font-medium mb-2">
            Seed Phrase (optional - leave empty to generate new)
          </label>
          <textarea
            value={seedPhrase}
            onChange={(e) => setSeedPhrase(e.target.value)}
            placeholder="Enter existing seed phrase or leave empty to generate new"
            rows={3}
            className="w-full p-2 border rounded"
          />
          
          {!seedPhrase.trim() && (
            <div className="mt-2">
              <label className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-1"
                />
                <span className="text-sm">
                  I understand that by logging in without a seed, I will create a new Solana wallet and must store the seed phrase.
                </span>
              </label>
            </div>
          )}
          
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          <button
            onClick={handleLogin}
            disabled={!seedPhrase.trim() && !confirmed}
            className="mt-4 w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            Gmail login
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 3. Dashboard

**Key Features:**
- Wallet address display with copy button
- Automatic balance loading on mount
- Programmatic airdrop (no GitHub auth required)
- Toggle private key display (View/Hide)
- Rent payment queue

Create `app/feemaster/dashboard/page.tsx`:

```typescript
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function FeemasterDashboard() {
  const router = useRouter();
  const [publicKey, setPublicKey] = useState<string>('');
  const [balance, setBalance] = useState<string>('0');
  const [privateKey, setPrivateKey] = useState<string>('');
  const [showPrivateKey, setShowPrivateKey] = useState(false);

  const handleCheckBalance = useCallback(async () => {
    const tempSeedPhrase = sessionStorage.getItem('feemaster_seed_phrase_temp');
    const response = await fetch('/api/feemaster/balance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seedPhrase: tempSeedPhrase || undefined }),
    });
    const data = await response.json();
    setBalance(data.balanceSOL);
  }, []);

  const handleViewPrivateKey = async () => {
    if (showPrivateKey) {
      setShowPrivateKey(false);
      return;
    }
    const tempSeedPhrase = sessionStorage.getItem('feemaster_seed_phrase_temp');
    const response = await fetch('/api/feemaster/private-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seedPhrase: tempSeedPhrase || undefined }),
    });
    const data = await response.json();
    setPrivateKey(data.privateKey);
    setShowPrivateKey(true);
  };

  const handleRequestAirdrop = async () => {
    const response = await fetch('/api/feemaster/airdrop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicKey, amount: 2 }),
    });
    const data = await response.json();
    alert(`✅ Airdrop successful! ${data.balanceSOL} SOL received.`);
    handleCheckBalance();
  };

  useEffect(() => {
    const setupComplete = sessionStorage.getItem('feemaster_setup_complete');
    const storedPublicKey = sessionStorage.getItem('feemaster_public_key');
    
    if (!setupComplete || !storedPublicKey) {
      router.push('/feemaster');
      return;
    }

    setPublicKey(storedPublicKey);
    handleCheckBalance(); // Automatically load balance
  }, [router, handleCheckBalance]);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Feemaster Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2>Account Info</h2>
          <div>
            <label>Wallet Address (Public Key)</label>
            <input type="text" value={publicKey} readOnly />
            <button onClick={() => navigator.clipboard.writeText(publicKey)}>Copy</button>
          </div>
          <div>Balance: {balance} SOL</div>
        </div>

        <div>
          <h2>Feemaster Operations</h2>
          <button onClick={handleCheckBalance}>Check Balance</button>
          <button onClick={handleViewPrivateKey}>
            {showPrivateKey ? 'Hide Private Key' : 'View Private Key'}
          </button>
          <button onClick={handleRequestAirdrop}>💧 Get Devnet SOL (2 SOL)</button>
        </div>
      </div>
    </div>
  );
}
```

### 4. Components

See [FEEMASTER_ACCOUNT.md](./FEEMASTER_ACCOUNT.md) for complete component implementations.

## Environment Variables

Create `.env.local`:

```bash
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
# Optional: For auto-login in dev (never commit seed phrase to git)
# FEEMASTER_SEED_PHRASE=word1 word2 ... word12
```

## Security Notes

1. **Never commit seed phrase to git**
2. **Use HTTPS in production**
3. **Clear session on logout**
4. **Consider IP whitelist for production**
5. **Use secure session storage**

## Running the App

```bash
npm run dev
```

Visit `http://localhost:3000` and login with your feemaster seed phrase.

## Next Steps

1. Implement rent payment queue (see [FEEMASTER_ACCOUNT.md](./FEEMASTER_ACCOUNT.md))
2. Add transaction monitoring
3. Add email notifications (optional)
4. Deploy to secure admin server

