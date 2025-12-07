# Solana Wallet App Tutorial

**Target Audience:** Junior Web2 Developers  
**Goal:** Understand how this Solana wallet app works, from seed phrases to transactions

---

## Table of Contents

1. [Overview](#overview)
2. [Key Concepts](#key-concepts)
3. [App Architecture](#app-architecture)
4. [Wallet Setup & Authentication](#wallet-setup--authentication)
5. [How the App Knows Your Wallet Address](#how-the-app-knows-your-wallet-address)
6. [How Signing Works (Private Keys)](#how-signing-works-private-keys)
7. [TetherTo WDK SDK vs @solana/web3.js](#tetherto-wdk-sdk-vs-solanweb3js)
8. [Security: How Secrets Are Protected](#security-how-secrets-are-protected)
9. [Transaction Flow](#transaction-flow)
10. [Code Walkthrough](#code-walkthrough)

---

## Overview

This app is a **local-only** Solana wallet dashboard. Unlike traditional web apps that store data on servers, this app:

- Runs entirely on your machine (Next.js local dev server)
- Uses **seed phrases** (12-word mnemonic) to derive wallets
- Never sends seed phrases to external servers
- Uses **TetherTo WDK SDK** for wallet operations (balance, send)
- Uses **@solana/web3.js** for read-only queries (transaction history)

Think of it like a local password manager, but for cryptocurrency wallets.

---

## Key Concepts

### Seed Phrase (Mnemonic)
A **12-word phrase** that acts as the master key to your wallet. From this phrase, you can derive:
- Private keys (for signing transactions)
- Public keys (your wallet address)
- Multiple accounts (account index 0, 1, 2, etc.)

**Example:** `abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about`

### Public Key (Address)
Your **wallet address** - like a bank account number. Anyone can send SOL to this address. It's derived from your seed phrase but cannot be reversed to get your seed phrase.

**Example:** `BaNTnuoCQm82ZSjVprmXjAUphevUauLpm3eNVEVrVppJ`

### Private Key
A secret key used to **sign transactions**. Never share this! It's derived from your seed phrase and stored securely by the TetherTo WDK SDK.

### Account Index
A single seed phrase can generate multiple accounts. This app uses **account index 0** (the first account).

---

## App Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Client)                     │
│  ┌──────────────────────────────────────────────────┐  │
│  │  app/page.tsx (Login)                            │  │
│  │  - User enters/generates seed phrase             │  │
│  │  - Stores in sessionStorage (temporary)           │  │
│  └──────────────────────────────────────────────────┘  │
│                        │                                │
│                        ▼                                │
│  ┌──────────────────────────────────────────────────┐  │
│  │  app/dashboard/page.tsx (Dashboard)             │  │
│  │  - Displays balance, transactions, metrics       │  │
│  │  - Calls API routes                              │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Next.js API Routes (Server)                │
│  ┌──────────────────────────────────────────────────┐  │
│  │  /api/user/setup                                 │  │
│  │  - Creates wallet from seed phrase               │  │
│  │  - Returns public key                            │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  /api/user/balance                               │  │
│  │  - Uses TetherTo WDK SDK                         │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  /api/user/send                                  │  │
│  │  - Uses TetherTo WDK SDK to sign & send          │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  /api/dashboard/transactions                     │  │
│  │  - Uses @solana/web3.js (read-only)              │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Solana Blockchain (Devnet)                  │
│  - Transaction history                                  │
│  - Balance queries                                      │
│  - Transaction submission                               │
└─────────────────────────────────────────────────────────┘
```

---

## Wallet Setup & Authentication

### Step 1: User Enters/Generates Seed Phrase

**File:** [`app/page.tsx`](../app/page.tsx#L13-L32)

When a user visits the home page, they can:
1. **Enter an existing seed phrase** (login)
2. **Leave it empty** to generate a new one (setup)

```typescript
// User enters seed phrase or leaves empty
const response = await fetch('/api/user/setup', {
  method: 'POST',
  body: JSON.stringify({ seedPhrase: seedPhrase.trim() || undefined }),
});
```

### Step 2: API Creates Wallet Manager

**File:** [`app/api/user/setup/route.ts`](../app/api/user/setup/route.ts#L14-L40)

The API route receives the seed phrase and:

1. **Generates a new seed phrase** if none provided:
   ```typescript
   // See: lib/seed-generate.ts
   if (isNewSetup) {
     seedPhrase = generateSeedPhrase(); // Uses @scure/bip39
   }
   ```

2. **Creates a TetherTo WDK wallet manager**:
   ```typescript
   // See: lib/user-wallet.ts:20-25
   walletManager = createUserWalletManagerFromSeed(seedPhrase);
   ```

3. **Derives account index 0** and gets the public key:
   ```typescript
   const account = await getUserAccount(walletManager, 0);
   publicKey = await account.getAddress();
   ```

4. **Returns the public key** (and seed phrase if newly generated)

### Step 3: Client Stores Credentials

**File:** [`app/page.tsx`](../app/page.tsx#L42-L51)

The client stores credentials in **sessionStorage** (temporary, cleared on browser close):

```typescript
sessionStorage.setItem('user_public_key', data.publicKey);
sessionStorage.setItem('user_seed_phrase_temp', seedPhrase);
```

**⚠️ Important:** Seed phrases are stored in `sessionStorage`, which is:
- ✅ Cleared when the browser tab closes
- ✅ Not sent to external servers
- ❌ Not encrypted (this is a demo app - production would use encryption)

---

## How the App Knows Your Wallet Address

### The Magic: Seed Phrase → Public Key

Your wallet address (public key) is **deterministically derived** from your seed phrase. This means:
- Same seed phrase → Same wallet address (always)
- The derivation is one-way: you cannot reverse a public key to get the seed phrase

### Code Flow

1. **User provides seed phrase** → [`app/page.tsx`](../app/page.tsx#L28)

2. **API creates wallet manager** → [`lib/user-wallet.ts:20-25`](../lib/user-wallet.ts#L20-L25)
   ```typescript
   export function createUserWalletManagerFromSeed(seedPhrase: string) {
     return new WalletManagerSolana(seedPhrase, {
       rpcUrl: SOLANA_RPC_URL,
       commitment: 'confirmed'
     });
   }
   ```

3. **TetherTo WDK derives account** → [`lib/user-wallet.ts:34-39`](../lib/user-wallet.ts#L34-L39)
   ```typescript
   const account = await walletManager.getAccount(0); // Account index 0
   ```

4. **Get public key from account** → [`lib/user-wallet.ts:64-71`](../lib/user-wallet.ts#L64-L71)
   ```typescript
   const publicKey = await account.getAddress(); // Returns wallet address
   ```

### How TetherTo WDK Does This

The TetherTo WDK SDK internally:
1. Converts seed phrase → seed bytes (using BIP-39)
2. Derives private key using BIP-44 path: `m/44'/501'/0'/0'` (account index 0)
3. Derives public key from private key (using Ed25519 curve)
4. Returns the public key as a base58 string

**You don't need to understand the crypto details** - TetherTo WDK handles it all!

---

## How Signing Works (Private Keys)

### The Problem
To send a transaction, you need to **prove you own the wallet**. This is done by signing the transaction with your private key.

### The Solution: TetherTo WDK SDK

The TetherTo WDK SDK **never exposes your private key**. Instead:

1. **You provide the seed phrase** (temporarily, in memory)
2. **TetherTo WDK derives the private key** internally
3. **TetherTo WDK signs the transaction** using the private key
4. **The private key never leaves TetherTo WDK's secure context**

### Code Example: Sending a Transaction

**File:** [`app/api/user/send/route.ts`](../app/api/user/send/route.ts#L49-61)

```typescript
// 1. Create wallet manager from seed phrase
const walletManager = createUserWalletManagerFromSeed(seedPhrase);

// 2. Get account (TetherTo WDK derives private key internally)
const account = await walletManager.getAccount(0);

// 3. Send transaction (TetherTo WDK signs it internally)
const signature = await account.sendTransaction({
  to: recipient,
  value: amountLamports,
});
```

**What happens inside TetherTo WDK:**
1. Derives private key from seed phrase (in memory, never stored)
2. Creates transaction object
3. Signs transaction with private key
4. Submits signed transaction to Solana network
5. Returns transaction signature

**You never see or handle the private key directly!**

### Alternative: Using @solana/web3.js Directly

If you wanted to use `@solana/web3.js` instead (we don't in this app), you would:

```typescript
// ❌ This is NOT how we do it, but here's the alternative:
import { Keypair } from '@solana/web3.js';
import { derivePath } from 'ed25519-hd-key';

// Derive private key from seed phrase
const seed = mnemonicToSeedSync(seedPhrase);
const derivedSeed = derivePath("m/44'/501'/0'/0'", seed.toString('hex'));
const keypair = Keypair.fromSeed(derivedSeed.key);

// Sign transaction
const signature = await connection.sendTransaction(transaction, [keypair]);
```

**Why we use TetherTo WDK instead:**
- ✅ Simpler API (no manual key derivation)
- ✅ Better security (private keys never exposed)
- ✅ Consistent with production requirements

---

## TetherTo WDK SDK vs @solana/web3.js {#tetherto-wdk-sdk-vs-solanweb3js}

This app uses **both** libraries, but for different purposes:

### TetherTo WDK SDK (`@tetherto/wdk-wallet-solana`)

**Used for:** Wallet operations (operations that require private keys)

| Operation | File | Code Reference |
|-----------|------|----------------|
| Get balance | [`app/api/user/balance/route.ts`](../app/api/user/balance/route.ts#L23-L24) | Uses `account.getBalance()` |
| Send transaction | [`app/api/user/send/route.ts`](../app/api/user/send/route.ts#L56-L61) | Uses `account.sendTransaction()` |
| Get public key | [`lib/user-wallet.ts:64-71`](../lib/user-wallet.ts#L64-L71) | Uses `account.getAddress()` |

**Why:** TetherTo WDK SDK handles private key management securely and provides a simple API.

### @solana/web3.js

**Used for:** Read-only network queries (no private keys needed)

| Operation | File | Code Reference |
|-----------|------|----------------|
| Transaction history | [`lib/transactions.ts:7-13`](../lib/transactions.ts#L7-L13) | Uses `connection.getSignaturesForAddress()` |
| Transaction status | [`lib/transactions.ts:32`](../lib/transactions.ts#L32) | Uses `connection.getSignatureStatuses()` |
| Transaction details | [`lib/transactions.ts:85-90`](../lib/transactions.ts#L85-L90) | Uses `connection.getTransaction()` |
| Airdrop | [`app/api/user/airdrop/route.ts`](../app/api/user/airdrop/route.ts) | Uses `connection.requestAirdrop()` |
| Balance (fallback) | [`app/api/dashboard/transactions/route.ts:53`](../app/api/dashboard/transactions/route.ts#L53) | Uses `connection.getBalance()` |

**Why:** @solana/web3.js is excellent for read-only queries and doesn't require wallet management.

### When to Use Which?

```
┌─────────────────────────────────────────┐
│  Do you need to sign a transaction?     │
└──────────────┬──────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
      YES              NO
       │                │
       ▼                ▼
┌──────────────┐  ┌──────────────┐
│ TetherTo WDK │  │ @solana/web3 │
│     SDK      │  │     .js      │
└──────────────┘  └──────────────┘
```

**Examples:**
- ✅ **Send SOL** → TetherTo WDK SDK (needs signing)
- ✅ **Get balance** → TetherTo WDK SDK (uses wallet context)
- ✅ **Transaction history** → @solana/web3.js (read-only)
- ✅ **Airdrop** → @solana/web3.js (no signing needed)

---

## Security: How Secrets Are Protected

### 1. Seed Phrase Storage

**Location:** Browser `sessionStorage` (temporary)

**File:** [`app/page.tsx`](../app/page.tsx#L42-L51)

```typescript
sessionStorage.setItem('user_seed_phrase_temp', seedPhrase);
```

**Security characteristics:**
- ✅ **Temporary:** Cleared when browser tab closes
- ✅ **Local only:** Never sent to external servers
- ✅ **Same-origin:** Only accessible by this app's JavaScript
- ❌ **Not encrypted:** This is a demo - production would encrypt

**Production improvements:**
- Encrypt seed phrase before storing
- Use secure key derivation
- Consider hardware wallets for production

### 2. API Route Security

**Important:** Seed phrases are sent to Next.js API routes, but:

- ✅ **Server-side only:** API routes run on your local machine (not exposed to internet)
- ✅ **No external calls:** Seed phrases never leave your machine
- ✅ **In-memory only:** Seed phrases exist only during request processing

**File:** [`app/api/user/send/route.ts`](../app/api/user/send/route.ts#L15-L16)

```typescript
// Seed phrase received in request body
const { seedPhrase } = await request.json();
// Used immediately, then garbage collected
```

### 3. TetherTo WDK SDK Security

**File:** [`lib/user-wallet.ts:20-25`](../lib/user-wallet.ts#L20-L25)

TetherTo WDK SDK:
- ✅ **Derives private keys in memory** (never stored)
- ✅ **Signs transactions internally** (private key never exposed)
- ✅ **Uses secure cryptographic libraries** (ed25519, BIP-39, BIP-44)

```typescript
// Private key is derived internally, never exposed
const walletManager = new WalletManagerSolana(seedPhrase, {...});
const account = await walletManager.getAccount(0);
// Private key exists only in TetherTo WDK's secure context
```

### 4. Network Security

- ✅ **HTTPS in production:** All API calls use HTTPS
- ✅ **Local dev server:** Runs on `localhost` (not exposed to internet)
- ✅ **No external wallet services:** No MetaMask, no Web3Auth (removed)

### Security Best Practices (For Production)

1. **Encrypt seed phrases** before storing
2. **Use environment variables** for sensitive config
3. **Implement rate limiting** on API routes
4. **Add authentication** (not just sessionStorage)
5. **Use hardware wallets** for high-value operations
6. **Audit dependencies** regularly

---

## Transaction Flow

### Complete Flow: User Sends SOL

```
1. User enters recipient & amount
   └─> app/dashboard/page.tsx (client)

2. Client calls API route
   └─> POST /api/user/send
       └─> app/api/user/send/route.ts

3. API creates wallet manager
   └─> createUserWalletManagerFromSeed(seedPhrase)
       └─> lib/user-wallet.ts:20-25

4. API gets account (derives private key internally)
   └─> walletManager.getAccount(0)
       └─> lib/user-wallet.ts:34-39

5. API sends transaction (signs internally)
   └─> account.sendTransaction({ to, value })
       └─> lib/user-wallet.ts:83-102
       └─> TetherTo WDK signs with private key
       └─> Submits to Solana network

6. API returns signature
   └─> Client displays success message
```

### Code References

**Client:** [`app/dashboard/page.tsx`](../app/dashboard/page.tsx#L100-L130)  
**API Route:** [`app/api/user/send/route.ts`](../app/api/user/send/route.ts#L13-L75)  
**Wallet Function:** [`lib/user-wallet.ts:83-102`](../lib/user-wallet.ts#L83-L102)

---

## Code Walkthrough

### Interesting Code Sections

#### 1. Seed Phrase Generation

**File:** [`lib/seed-generate.ts`](../lib/seed-generate.ts#L8-L11)

```typescript
export function generateSeedPhrase(): string {
  // Generate 12-word mnemonic (128 bits of entropy)
  return generateMnemonic(wordlist, 128);
}
```

**What it does:** Uses BIP-39 standard to generate a cryptographically secure 12-word mnemonic.

**Why it matters:** This is the industry standard for wallet seed phrases (used by Ledger, Trezor, etc.).

---

#### 2. Wallet Manager Creation

**File:** [`lib/user-wallet.ts:20-25`](../lib/user-wallet.ts#L20-L25)

```typescript
export function createUserWalletManagerFromSeed(seedPhrase: string): WalletManagerSolana {
  return new WalletManagerSolana(seedPhrase, {
    rpcUrl: SOLANA_RPC_URL,
    commitment: 'confirmed'
  });
}
```

**What it does:** Creates a TetherTo WDK wallet manager that can derive accounts from the seed phrase.

**Why it matters:** This is the entry point for all wallet operations. The wallet manager handles all private key derivation internally.

---

#### 3. Transaction Status Detection

**File:** [`lib/transactions.ts:93-140`](../lib/transactions.ts#L93-L140)

```typescript
// Determines if transaction is user-initiated (sent) vs received
const accountKeys = tx.transaction?.message?.staticAccountKeys || [];
const feePayerAddress = extractAddress(accountKeys[0]);
isUserInitiated = feePayerAddress === userAddressStr;
```

**What it does:** Checks if the user is the fee payer (first account in transaction) to determine if they sent the transaction.

**Why it matters:** The dashboard only counts user-initiated transactions in the "submitted" metric, not received deposits/airdrops.

**Interesting detail:** Uses `staticAccountKeys` (not `accountKeys`) because we use `encoding: 'json'` which returns PublicKey objects.

---

#### 4. Balance Query (TetherTo WDK)

**File:** [`lib/user-wallet.ts:48-55`](../lib/user-wallet.ts#L48-L55)

```typescript
export async function getUserBalance(
  walletManager: WalletManagerSolana,
  accountIndex: number = 0
): Promise<bigint> {
  const account = await getUserAccount(walletManager, accountIndex);
  return await account.getBalance();
}
```

**What it does:** Gets balance using TetherTo WDK SDK's native method.

**Why it matters:** This uses the wallet context (derived from seed phrase) rather than just querying by address.

---

#### 5. Transaction Sending

**File:** [`lib/user-wallet.ts:83-102`](../lib/user-wallet.ts#L83-L102)

```typescript
export async function sendTransactionWithWDK(
  walletManager: WalletManagerSolana,
  accountIndex: number,
  recipient: string,
  amountLamports: bigint
): Promise<string> {
  const account = await getUserAccount(walletManager, accountIndex);
  const result = await account.sendTransaction({
    to: recipient, // TetherTo WDK expects 'to', not 'recipient'
    value: amountLamports,
  });
  return typeof result === 'string' ? result : result.signature;
}
```

**What it does:** Sends a transaction using TetherTo WDK SDK. The SDK handles signing internally.

**Why it matters:** This is the core wallet operation. Notice:
- Uses `to` parameter (not `recipient`) - TetherTo WDK API
- Returns signature (transaction ID on Solana)
- Private key never exposed

---

#### 6. Transaction History (Read-Only)

**File:** [`lib/transactions.ts:7-13`](../lib/transactions.ts#L7-L13)

```typescript
export async function getTransactionSignatures(
  connection: Connection,
  address: PublicKey
): Promise<string[]> {
  const signatures = await connection.getSignaturesForAddress(address);
  return signatures.map(s => s.signature);
}
```

**What it does:** Gets all transaction signatures for an address using @solana/web3.js (read-only).

**Why it matters:** This doesn't require wallet access - just the public address. Perfect for read-only queries.

---

### Key Files Summary

| File | Purpose | Key Concept |
|------|---------|-------------|
| [`lib/user-wallet.ts`](../lib/user-wallet.ts) | TetherTo WDK wallet operations | Wallet manager, account derivation, transactions |
| [`lib/transactions.ts`](../lib/transactions.ts) | Transaction history & status | Read-only queries, user-initiated detection |
| [`lib/solana.ts`](../lib/solana.ts) | Solana connection setup | RPC URL, network config |
| [`app/api/user/setup/route.ts`](../app/api/user/setup/route.ts) | Wallet setup/login | Seed phrase → public key |
| [`app/api/user/send/route.ts`](../app/api/user/send/route.ts) | Send SOL transaction | TetherTo WDK transaction signing |
| [`app/api/dashboard/transactions/route.ts`](../app/api/dashboard/transactions/route.ts) | Dashboard data | Combines TetherTo WDK (balance) + @solana/web3.js (history) |

---

## Summary

### Key Takeaways

1. **Seed phrase → Wallet:** A 12-word phrase deterministically generates your wallet address and private keys.

2. **TetherTo WDK SDK:** Handles all wallet operations (balance, send) and manages private keys securely.

3. **@solana/web3.js:** Used for read-only queries (transaction history, airdrops) that don't need private keys.

4. **Security:** Seed phrases stored in sessionStorage (temporary), never sent to external servers, private keys never exposed.

5. **Local-only:** This app runs entirely on your machine - no external hosting required.

### Next Steps

- Explore the code files linked in this tutorial
- Try modifying the dashboard to add new features
- Experiment with different account indices (currently uses index 0)
- Read the [TetherTo WDK SDK documentation](https://github.com/tetherto/wdk-wallet-solana)

---

**Questions?** Check the code comments or explore the files referenced in this tutorial!

