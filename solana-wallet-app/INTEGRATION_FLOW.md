# Integration Flow: MetaMask SDK + Tether WDK

MetaMask SDK creates a wallet via Google sign-on, giving you control over a Solana wallet. How do we use this with Tether WDK SDK?

## Flow Overview

```
1. User signs in with Google
   ↓
2. MetaMask Embedded Wallets SDK
   - Creates wallet via multisig (Google + MetaMask)
   - Generates seed phrase (managed by MetaMask)
   - Derives Solana ed25519 keypair
   - Returns: { address, privateKey }
   ↓
3. Extract the Solana keypair
   - Convert MetaMask's privateKey to Solana Keypair
   ↓
4. Use Tether WDK SDK
   - Option A: Import keypair directly (if supported)
   - Option B: Use keypair with WDK's account operations
   - Option C: Use keypair directly with @solana/web3.js (bypass WDK for some operations)
```

## Detailed Flow

### Step 1: MetaMask SDK Creates Wallet

```typescript
// MetaMask SDK handles Google OAuth and wallet creation
const embeddedWallet = await initializeEmbeddedWallet({
  clientId: METAMASK_CLIENT_ID,
  secretKey: METAMASK_SECRET_KEY,
});

await embeddedWallet.authenticate({ provider: 'google' });

// Get the Solana keypair that MetaMask created
const solanaAccount = await embeddedWallet.getAccountSolana();
// Returns: { address: string, privateKey: string }
```

**What MetaMask gives you:**
- A Solana wallet (ed25519 keypair)
- You have full control over this wallet
- The private key is derived from a seed phrase (managed by MetaMask)

### Step 2: Extract the Keypair

```typescript
import { Keypair } from '@solana/web3.js';
import * as bs58 from 'bs58';

// Convert MetaMask's private key to Solana Keypair
const privateKeyBytes = bs58.decode(solanaAccount.privateKey);
const keypair = Keypair.fromSecretKey(privateKeyBytes);

// Now you have a Solana Keypair you can use
const publicKey = keypair.publicKey.toBase58();
```

### Step 3: Integration Challenge

**The Problem:**

- **Tether WDK SDK** requires: **seed phrase** (BIP-39 mnemonic)
  - Uses `getAccount(index)` to derive accounts via BIP-44: `m/44'/501'/index'/0'`
  - Does NOT have `importAccount(keypair)` method
  - Does NOT accept `privateKey` directly

- **MetaMask SDK** provides: **privateKey** (derived ed25519 key)
  - Returns `{ address: string, privateKey: string }`
  - May or may not provide seed phrase (needs verification)

**Solution Options:**

#### Option 1: Get Seed Phrase from MetaMask (If Available)

```typescript
// Step 1: Check if MetaMask SDK exposes seed phrase
const seedPhrase = await embeddedWallet.getSeedPhrase(); // Verify this exists

// Step 2: Use seed phrase with Tether WDK SDK
import WalletManagerSolana from '@tetherto/wdk-wallet-solana';

const walletManager = new WalletManagerSolana(seedPhrase, {
  provider: 'https://api.devnet.solana.com',
});

// Step 3: Get account 0 (the one MetaMask created)
const account = await walletManager.getAccount(0);
await account.sendTransaction({...});
await account.getBalance();
```

#### Option 2: Use Keypair Directly (If No Seed Phrase)

If MetaMask SDK doesn't provide seed phrase, use `@solana/web3.js` directly:

```typescript
// Step 1: Get privateKey from MetaMask SDK
const { privateKey } = await embeddedWallet.getAccountSolana();

// Step 2: Convert to Solana Keypair
import { Keypair } from '@solana/web3.js';
import * as bs58 from 'bs58';

const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));

// Step 3: Use directly with @solana/web3.js (bypass Tether WDK)
import { Connection, sendAndConfirmTransaction, Transaction, SystemProgram } from '@solana/web3.js';

const connection = new Connection('https://api.devnet.solana.com');

// Get balance
const balance = await connection.getBalance(keypair.publicKey);

// Send transaction
const transaction = new Transaction().add(
  SystemProgram.transfer({
    fromPubkey: keypair.publicKey,
    toPubkey: recipientPubkey,
    lamports: amount,
  })
);

const signature = await sendAndConfirmTransaction(
  connection,
  transaction,
  [keypair]
);
```

**Key Points:**
- Tether WDK SDK uses `getAccount(index)` and derives from seed phrase
- If MetaMask provides seed phrase → Use Tether WDK SDK
- If MetaMask only provides privateKey → Use `@solana/web3.js` directly
- The wallet is **standard Solana wallet**, independent of MetaMask

## How It Actually Works

### The Real Flow (Two Possible Paths)

**Path 1: If MetaMask SDK provides seed phrase**
1. **MetaMask SDK creates wallet** → Returns `seedPhrase` (BIP-39 mnemonic)
2. **Use seed phrase with Tether WDK SDK** → `new WalletManagerSolana(seedPhrase, config)`
3. **Get account via index** → `walletManager.getAccount(0)` (derives from seed phrase)
4. **Use WDK for operations** → All wallet operations go through WDK

**Path 2: If MetaMask SDK only provides privateKey**
1. **MetaMask SDK creates wallet** → Returns `privateKey` (bytes/hex/base64 string)
2. **Convert to Solana Keypair** → `Keypair.fromSecretKey(bs58.decode(privateKey))`
3. **Use `@solana/web3.js` directly** → Bypass Tether WDK SDK
4. **Perform operations** → Use Connection, Transaction, etc. directly

### Key Insight

- **Tether WDK SDK** uses `getAccount(index)` and derives from **seed phrase** (BIP-44)
- **MetaMask SDK** may provide seed phrase OR only privateKey (needs verification)
- If seed phrase available → Use Tether WDK SDK
- If only privateKey → Use `@solana/web3.js` directly
- The wallet is **standard Solana wallet**, independent of MetaMask

### Implementation (Path 1: With Seed Phrase)

```typescript
// MetaMask SDK gives you seed phrase
const seedPhrase = await embeddedWallet.getSeedPhrase(); // Verify this exists

// Use with Tether WDK SDK
const walletManager = new WalletManagerSolana(seedPhrase, {
  provider: 'https://api.devnet.solana.com',
});

// Get account 0 (derived from seed phrase via BIP-44)
const account = await walletManager.getAccount(0);
await account.sendTransaction({...});
```

### Implementation (Path 2: With PrivateKey Only)

```typescript
// MetaMask SDK gives you privateKey
const { privateKey } = await embeddedWallet.getAccountSolana();

// Convert to Solana Keypair
import { Keypair } from '@solana/web3.js';
import * as bs58 from 'bs58';

const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));

// Use @solana/web3.js directly (bypass Tether WDK)
import { Connection, sendAndConfirmTransaction } from '@solana/web3.js';

const connection = new Connection('https://api.devnet.solana.com');
const balance = await connection.getBalance(keypair.publicKey);
// ... perform operations with keypair directly
```

**Important:**
- Tether WDK SDK requires **seed phrase** and uses `getAccount(index)` for derivation
- If MetaMask only provides `privateKey`, use `@solana/web3.js` directly
- Both approaches work - choose based on what MetaMask SDK provides

## Recommended Implementation Strategy

### Phase 1: Verify WDK API

```typescript
// Check WDK documentation for:
// 1. Can we import a keypair?
// 2. Can we use a seed phrase?
// 3. What's the exact API?
```

### Phase 2: Choose Integration Method

Based on WDK's API, choose one:

**If WDK supports keypair import:**
```typescript
const account = await walletManager.importAccount(keypair);
```

**If WDK only supports seed phrases:**
```typescript
// Try to get seed phrase from MetaMask
// Or use keypair directly with @solana/web3.js
```

**If WDK has a wrapper method:**
```typescript
const account = await walletManager.createAccountFromKeypair(keypair);
```

## Summary

**The Flow (Two Possible Paths):**

**Path 1: If MetaMask SDK provides seed phrase**
1. MetaMask SDK creates wallet via Google → Returns `seedPhrase` (BIP-39 mnemonic)
2. Use `seedPhrase` with Tether WDK SDK → `new WalletManagerSolana(seedPhrase, config)`
3. Get account via index → `walletManager.getAccount(0)` (derives from seed phrase via BIP-44)
4. Use WDK for all operations → It handles derivation and operations

**Path 2: If MetaMask SDK only provides privateKey**
1. MetaMask SDK creates wallet via Google → Returns `privateKey` (standard Solana format)
2. Convert to Solana Keypair → `Keypair.fromSecretKey(bs58.decode(privateKey))`
3. Use `@solana/web3.js` directly → Bypass Tether WDK SDK
4. Perform operations → Use Connection, Transaction, etc. directly

**The Key Points:**
- MetaMask SDK **creates** a standard Solana wallet (via multisig with Google)
- May return **seed phrase** OR **privateKey** (needs verification)
- Tether WDK SDK uses `getAccount(index)` and requires **seed phrase** (BIP-44 derivation)
- If only `privateKey` available → Use `@solana/web3.js` directly
- The wallet is **independent of MetaMask** after creation
- Works with **any Solana-compatible environment**

**Next Step:** Verify what MetaMask Embedded Wallets SDK actually provides (seed phrase vs privateKey only).

