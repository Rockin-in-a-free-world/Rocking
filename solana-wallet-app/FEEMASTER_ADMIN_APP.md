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

Create `app/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [seedPhrase, setSeedPhrase] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = () => {
    // Validate seed phrase
    const words = seedPhrase.trim().split(/\s+/);
    if (words.length !== 12 && words.length !== 24) {
      setError('Seed phrase must be 12 or 24 words');
      return;
    }

    // Store in session (client-side only)
    sessionStorage.setItem('feemaster_seed_phrase', seedPhrase);
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <h1 className="text-3xl font-bold text-center">Feemaster Admin</h1>
        <div>
          <label className="block text-sm font-medium mb-2">
            Seed Phrase
          </label>
          <textarea
            value={seedPhrase}
            onChange={(e) => setSeedPhrase(e.target.value)}
            placeholder="Enter seed phrase (12 or 24 words)"
            rows={3}
            className="w-full p-2 border rounded"
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          <button
            onClick={handleLogin}
            className="mt-4 w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 3. Dashboard

Create `app/dashboard/page.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createFeemasterAccount, getFeemasterAccount } from '@/lib/feemaster';
import AccountInfo from '@/components/AccountInfo';
import PrivateKeyDisplay from '@/components/PrivateKeyDisplay';
import RentPaymentQueue from '@/components/RentPaymentQueue';

export default function Dashboard() {
  const router = useRouter();
  const [walletManager, setWalletManager] = useState<any>(null);
  const [account, setAccount] = useState<any>(null);
  const [balance, setBalance] = useState<bigint | null>(null);

  useEffect(() => {
    const seedPhrase = sessionStorage.getItem('feemaster_seed_phrase');
    if (!seedPhrase) {
      router.push('/');
      return;
    }

    const wm = createFeemasterAccount(seedPhrase);
    setWalletManager(wm);

    getFeemasterAccount(wm).then(async (acc) => {
      setAccount(acc);
      const bal = await acc.getBalance();
      setBalance(bal);
    });
  }, [router]);

  if (!account) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Feemaster Admin Dashboard</h1>
      <AccountInfo account={account} balance={balance} />
      <PrivateKeyDisplay walletManager={walletManager} />
      <RentPaymentQueue account={account} />
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

