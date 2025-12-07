# Tether WDK SDK API Research

## Research Questions

1. Does `WalletManagerSolana` support `importAccount(keypair)`?
2. Does it support `createAccountFromKeypair(keypair)`?
3. Or does it only work with seed phrases?

## Findings from GitHub Repository

Based on the [Tether WDK Solana GitHub repository](https://github.com/tetherto/wdk-wallet-solana):

### WalletManagerSolana Constructor

From the README, the SDK is designed for:
- **BIP-39 seed phrases** and Solana-specific derivation paths
- Creating and managing **BIP-44 wallets**

### Key Observations

1. **Primary Design**: The SDK appears designed around seed phrases
   - Documentation emphasizes "BIP-39 seed phrases"
   - Mentions "Solana-specific derivation paths" (BIP-44: m/44'/501')

2. **Account Structure**: Accounts have a `keyPair` property
   - `WalletAccountSolana` exposes `keyPair: Ed25519Keypair`
   - This suggests keypairs are used internally

3. **No Explicit Keypair Import Method**: 
   - README doesn't show `importAccount(keypair)` method
   - README doesn't show `createAccountFromKeypair(keypair)` method
   - Constructor examples show seed phrase usage

## Likely API Structure

Based on typical BIP-44 wallet SDKs, the API likely looks like:

```typescript
// Constructor (likely)
new WalletManagerSolana(seedPhrase: string, config: Config)

// Account creation (likely)
getAccount(index: number): WalletAccountSolana
createAccount(): WalletAccountSolana
```

## Integration Options

### Option 1: Get Seed Phrase from MetaMask (If Available)

**Best case scenario:**
```typescript
// MetaMask SDK might expose seed phrase
const seedPhrase = await embeddedWallet.getSeedPhrase();

// Use directly with Tether WDK
const walletManager = new WalletManagerSolana(seedPhrase, {
  provider: 'https://api.devnet.solana.com',
});

const account = await walletManager.getAccount(0);
```

**Check MetaMask SDK docs for:**
- `getSeedPhrase()` method
- `getMnemonic()` method
- Any method that returns the BIP-39 mnemonic

### Option 2: Use Keypair Directly (Hybrid Approach)

**If WDK doesn't support keypair import:**

```typescript
// Get keypair from MetaMask
const solanaAccount = await embeddedWallet.getAccountSolana();
const keypair = Keypair.fromSecretKey(bs58.decode(solanaAccount.privateKey));

// Use keypair directly with @solana/web3.js for operations
import { Connection, sendAndConfirmTransaction } from '@solana/web3.js';

const connection = new Connection('https://api.devnet.solana.com');

// For operations that WDK provides, check if we can wrap the keypair
// For operations WDK doesn't support, use keypair directly
```

### Option 3: Create Wrapper Around WDK

**If we need WDK features but only have keypair:**

```typescript
// Create a minimal seed phrase that derives to our keypair
// This is complex and not recommended, but possible

// Better: Use keypair directly and implement WDK-like wrapper
class KeypairWalletAdapter {
  constructor(private keypair: Keypair, private connection: Connection) {}
  
  async getBalance(): Promise<bigint> {
    return await this.connection.getBalance(this.keypair.publicKey);
  }
  
  async sendTransaction(options: SendOptions): Promise<string> {
    // Implement using @solana/web3.js directly
  }
}
```

## Recommended Research Steps

### Step 1: Check Tether WDK Source Code

Look at the actual source code in the GitHub repo:
- Check `src/` directory for `WalletManagerSolana` class
- Look for constructor signatures
- Look for account creation methods
- Check if there's an `importAccount` or similar method

### Step 2: Check MetaMask SDK Documentation

Verify what MetaMask SDK provides:
- Can we get the seed phrase?
- Or do we only get the derived ed25519 key?
- Check: `getSeedPhrase()`, `getMnemonic()`, or similar methods

### Step 3: Test Integration

Create a test to verify:
```typescript
// Test 1: Try to get seed phrase from MetaMask
const seedPhrase = await embeddedWallet.getSeedPhrase(); // Does this exist?

// Test 2: Try to import keypair into WDK
const account = await walletManager.importAccount(keypair); // Does this exist?

// Test 3: Check WDK constructor
const wm = new WalletManagerSolana(keypair, config); // Does this work?
```

## Actual Implementation (Confirmed)

**Tether WDK SDK API:**
- ✅ Uses `getAccount(index)` to derive accounts from seed phrase
- ✅ Derives accounts using BIP-44: `m/44'/501'/index'/0'`
- ✅ Requires seed phrase (BIP-39 mnemonic) in constructor
- ❌ Does NOT have `importAccount(keypair)` method
- ❌ Does NOT accept `privateKey` directly in constructor

**MetaMask SDK:**
- ✅ Provides standard Solana `privateKey` via `getAccountSolana()`
- ✅ Returns: `{ address: string, privateKey: string }`
- ❓ May or may not provide seed phrase (needs verification)

## The Problem

**Mismatch:**
- Tether WDK SDK needs: **seed phrase** (BIP-39 mnemonic)
- MetaMask SDK provides: **privateKey** (derived ed25519 key)

**Solution Options:**

### Option 1: Get Seed Phrase from MetaMask (Best Case)

```typescript
// Check if MetaMask SDK exposes seed phrase
const seedPhrase = await embeddedWallet.getSeedPhrase(); // Does this exist?

// Use directly with Tether WDK
const walletManager = new WalletManagerSolana(seedPhrase, {
  provider: 'https://api.devnet.solana.com',
});

// Derive account 0 (the one MetaMask created)
const account = await walletManager.getAccount(0);
```

### Option 2: Use Keypair Directly (If No Seed Phrase)

If MetaMask SDK doesn't provide seed phrase, use `@solana/web3.js` directly:

```typescript
// Get keypair from MetaMask
const { privateKey } = await embeddedWallet.getAccountSolana();
const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));

// Use directly with @solana/web3.js (bypass Tether WDK)
import { Connection, sendAndConfirmTransaction } from '@solana/web3.js';

const connection = new Connection('https://api.devnet.solana.com');

// For operations, use keypair directly
const balance = await connection.getBalance(keypair.publicKey);
// Send transactions using keypair directly
```

### Option 3: Hybrid Approach

Use Tether WDK for features it provides, but fall back to `@solana/web3.js` for operations:

```typescript
// If we can't get seed phrase, use keypair directly
const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));

// For operations that need WDK features, check if we can wrap it
// For basic operations, use @solana/web3.js directly
```

## Next Steps

1. **Examine Tether WDK Source Code**: Check `src/` directory in GitHub repo
2. **Check MetaMask SDK Docs**: Verify seed phrase access
3. **Create Test Implementation**: Try both approaches
4. **Update Integration Guide**: Based on findings

## Resources

- [Tether WDK Solana GitHub](https://github.com/tetherto/wdk-wallet-solana)
- [Tether WDK Documentation](https://docs.wallet.tether.io/sdk/wallet-modules/wallet-solana/)
- [MetaMask Embedded Wallets Docs](https://docs.metamask.io/embedded-wallets/)

