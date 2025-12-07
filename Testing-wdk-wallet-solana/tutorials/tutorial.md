# 🚀 Building Your First Solana Wallet Dashboard with wdk-wallet-solana

> **Welcome!** This tutorial will guide you through building a real, working Solana wallet dashboard using the `@tetherto/wdk-wallet-solana` SDK. By the end, you'll understand how to create wallets, manage accounts, send transactions, and think critically about Web3 security.

## 📚 Table of Contents

1. [Introduction: What is wdk-wallet-solana?](#introduction)
2. [Fundamentals: Understanding the Building Blocks](#fundamentals)
3. [Setting Up Your Development Environment](#setup)
4. [Your First Wallet: Creating and Managing Accounts](#first-wallet)
5. [Reading On-Chain Data: Checking Balances](#reading-data)
6. [Sending Transactions: Your First SOL Transfer](#sending-transactions)
7. [Mini-Project: Build a Wallet Dashboard](#mini-project)
8. [Security: Understanding the Risks](#security)
9. [System Constraints: What You Need to Know](#system-constraints)
10. [Next Steps: Where to Go From Here](#next-steps)

---

## <a name="introduction"></a>1. Introduction: What is wdk-wallet-solana?

### TL;DR

The `@tetherto/wdk-wallet-solana` SDKis a clean, beginner-friendly API for building Solana wallet features without becoming a cryptography or secuirty expert first.

### What Problems Does This SDK Solve?

If you want to build a Solana dapp (decentralized application) where users can:
- Create new wallets
- Manage multiple accounts from one seed phrase
- Send SOL (Solana's native token) to other users
- Check balances
- Sign messages securely

Doing this from scratch would require understanding:
- BIP-39 (seed phrase generation)
- BIP-44 (derivation paths)
- Solana's Ed25519 cryptography
- RPC endpoints and transaction building
- Fee estimation

**That's a lot!** 😅

### How It Fits Into dApp Architecture

```
┌─────────────────────────────────────────┐
│         Your Frontend (React/Vue/etc)   │
│  ┌───────────────────────────────────┐  │
│  │   Your Wallet UI Components       │  │
│  └──────────────┬────────────────────┘  │
└─────────────────┼───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│    @tetherto/wdk-wallet-solana SDK     │
│  • Wallet creation                      │
│  • Account management                   │
│  • Transaction building                 │
│  • Message signing                      │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│      Solana RPC Endpoint                │
│  (Mainnet/Devnet/Testnet)               │
└─────────────────────────────────────────┘
```

The SDK sits between your UI and the Solana blockchain, handling all wallet operations.

### Key Concepts You'll Learn

- **Wallet**: A container that holds your seed phrase and can generate multiple accounts
- **Account**: A specific address on Solana derived from your wallet
- **Seed Phrase (Mnemonic)**: 12 or 24 words that represent your private keys
- **RPC Endpoint**: gateway to read and write onchain data
- **Transaction**: A signed instruction to move SOL or interact with programs

### 🔗 Documentation Links

- [Official SDK Documentation](https://docs.wallet.tether.io/sdk/wallet-modules/wallet-solana)
- [Solana Documentation](https://docs.solana.com/)
- [BIP-39 Standard](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki)
- [BIP-44 Standard](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki)

### 🤔 Critical Thinking: What Assumptions Does This System Make?

Before we dive in, let's think critically:

1. **Trust in the SDK**: We're trusting that `@tetherto/wdk-wallet-solana` correctly implements cryptography. How do you verify this?
2. **RPC Provider**: The SDK needs an RPC endpoint. Who runs it? Can they see your transactions?
3. **Seed Phrase Storage**: Where will you store the seed phrase? What happens if someone gets it?

We'll explore these questions throughout the tutorial.

---

## <a name="fundamentals"></a>2. Fundamentals: Understanding the Building Blocks

### Learning Objective
Grasp the core concepts needed to work with Solana wallets.

### RPCs: Your Window to the Blockchain

An **RPC (Remote Procedure Call) endpoint** is like a library's catalog system. You ask it questions:
- "What's the balance of this address?"
- "Send this transaction"
- "What's the latest block?"

**Important**: RPCs are NOT magic backends. They:
- Can see your transactions (they're public anyway)
- Can be rate-limited or go down
- May charge fees for heavy usage
- Are run by various providers (Infura, public Solana RPCs)

**Common Solana RPC Endpoints:**
- Mainnet: `https://api.mainnet-beta.solana.com` (public, rate-limited)
- Devnet: `https://api.devnet.solana.com` (free, for testing)
- Testnet: `https://api.testnet.solana.com` (free, for testing)

### Wallets: Your Keychain

A Solana **wallet** in this SDK is an object that:
- Controlled by your seed phrase (12 or 24 words)
  - derive multiple accounts from that phrase
- Uses BIP-44 derivation paths (`m/44'/501'/0'`, `m/44'/501'/1'`, etc.)

Think of it like a master key that can create many locks (accounts).

### Accounts: Your Addresses

An **account** is:
- A specific Solana address (public key)
- Derived from your wallet using a derivation path
- Has its own balance and transaction history
- Can sign transactions and messages

One wallet → Many accounts (like one keyhoop → Many keys).

### Networks: Where Are You?

Solana has different networks:
- **Mainnet**: Real SOL, real money, real consequences
- **Devnet**: Free SOL from faucets, for development
- **Testnet**: Free SOL, for testing
- **Localnet**: Your own local blockchain (advanced)

**Always use Devnet or Testnet for learning!**

### 🔗 Go Deeper

- [Solana Networks Explained](https://docs.solana.com/clusters)
- [Understanding RPC Providers](https://www.alchemy.com/overviews/solana-rpc-node-providers)
- [BIP-44 Derivation Paths](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki)

### 🤔 Security Considerations

1. **What happens if you lose your seed phrase?** → You lose access to all accounts forever
2. **Can someone guess your seed phrase?** → Practically impossible (2^256 possibilities)
3. **What if the RPC is malicious?** → They can't steal your funds, but they could:
   - Censor your transactions
   - Show you incorrect data
   - Track your activity

---

## <a name="setup"></a>3. Setting Up Your Development Environment

### Learning Objective
Get your development environment ready to build with the SDK.

> **Note**: If you just want to run the examples, you can skip this section! The examples in this folder (`example-basic.js` and `example-restore.js`) are already set up. Just run `npm install` in the `Testing-wdk-wallet-solana` folder and then `node example-basic.js`. This section is for building your own project from scratch.

### Prerequisites

- **Node.js 20.18.0 or higher** installed ([Download here](https://nodejs.org/))
  - Check your version with: `node --version`
  - Note: While the SDK package itself doesn't specify a Node version, its dependencies (like `@solana/kit`) require Node.js 20.18.0+
- A code editor (VS Code recommended)
- Basic familiarity with JavaScript/TypeScript
- A terminal/command line

### Step 1: Create Your Project

**Important**: This creates a NEW project folder. You're building your own project, separate from the examples in this tutorial folder.

```bash
# Create a new directory
mkdir solana-wallet-dashboard
cd solana-wallet-dashboard

# Initialize npm project
npm init -y
```
> it will ask you to setup, here's how we did it:
package name: (tether-solana) 
version: (1.0.0) 
description: testing tether's solana sdk
entry point: (index.js) 
test command: npm run dev

### Step 2: Install Dependencies

```bash
# Install the SDK
npm install @tetherto/wdk-wallet-solana

# Install dotenv for .env file support (for testing - see security note below)
npm install dotenv

# Install TypeScript and build tools (optional but recommended)
npm install -D typescript @types/node tsx
```

**Important**: Create a `.gitignore` file to prevent committing sensitive data:

```gitignore
# Environment variables (may contain seed phrases in testing)
.env
.env.local

# Node modules
node_modules/

# Build outputs
dist/
build/
```

### Step 3: Create Your First File

Create `index.ts`:

```typescript
// index.ts
import WalletManagerSolana from '@tetherto/wdk-wallet-solana';

console.log('Hello, Solana! 🚀');
```

### Step 4: Set Up TypeScript

> Development can run .ts files directly (no compiler setup)

If using TypeScript, create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020"],
    "moduleResolution": "node",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true
  }
}
```

### Step 5: Add a Script to package.json

```json
{
  "scripts": {
    "start": "node index.js",
    "dev": "tsx index.ts"
  }
}
```

### 🎉 Checkpoint

Run `npm start` (or `npm run dev` for TypeScript). You should see "Hello, Solana! 🚀"

If you get an error about ES modules, add `"type": "module"` to your `package.json`.

### 🔗 Documentation Links

- [Node.js Installation Guide](https://nodejs.org/en/download/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### 🤔 Critical Thinking: Where Can Failure Occur?

1. **Node version mismatch**: What if you have Node 14 but the SDK needs Node 18?
2. **Network issues**: What if the SDK services aren't available?
3. **Module system**: What if your project uses CommonJS but the SDK uses ES modules?

Always check error messages carefully—they usually tell you what's wrong!

---

## <a name="first-wallet"></a>4. Your First Wallet: Creating and Managing Accounts

### Learning Objective
Create a wallet, generate a seed phrase, and create multiple accounts.

### Step 1: Create a New Wallet

```javascript
// index.js
import WalletManagerSolana from '@tetherto/wdk-wallet-solana';
import { generateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';

// Generate a mnemonic seed phrase (12 words)
const mnemonic = generateMnemonic(wordlist, 128);

// Create wallet with the mnemonic and RPC configuration
const wallet = new WalletManagerSolana(mnemonic, {
  rpcUrl: 'https://api.devnet.solana.com',
  commitment: 'confirmed'
});

console.log('🔑 Your seed phrase:', mnemonic);
console.log('⚠️  KEEP THIS SECRET! Never share it with anyone!');
```

**Important**: In a real app, you'd never log the seed phrase to the console! This is just for learning.

### Step 2: Restore a Wallet from Seed Phrase

For testing purposes, you can store your seed phrase in a `.env` file. **⚠️ WARNING: This is NOT secure for production!** See the [Encrypting Seed Phrases at Rest](./encrypt-seed-phrase-at-rest.md) side quest tutorial for production-ready encryption.

**Option A: Using .env file (for testing only)**

1. Install dotenv: `npm install dotenv`
2. Create `.env` file:
   ```
   SEED_PHRASE=your twelve word seed phrase goes here
   ```
3. Add `.env` to `.gitignore` (important!)
4. Use it in your code:

```javascript
import 'dotenv/config';
import WalletManagerSolana from '@tetherto/wdk-wallet-solana';

// Load seed phrase from .env (testing only!)
const existingMnemonic = process.env.SEED_PHRASE;

if (!existingMnemonic) {
  throw new Error('SEED_PHRASE not found in .env file');
}

const restoredWallet = new WalletManagerSolana(existingMnemonic, {
  rpcUrl: 'https://api.devnet.solana.com',
  commitment: 'confirmed'
});
```

**Option B: Hardcoded (for quick testing)**

```javascript
// Restore wallet from existing seed phrase
const existingMnemonic = 'your twelve word seed phrase goes here';
const restoredWallet = new WalletManagerSolana(existingMnemonic, {
  rpcUrl: 'https://api.devnet.solana.com',
  commitment: 'confirmed'
});
```

> **🔐 Security Note**: Storing seed phrases in `.env` files or hardcoding them is **ONLY for testing/development**. For production apps, you MUST encrypt seed phrases at rest. See the [Encrypting Seed Phrases at Rest](./encrypt-seed-phrase-at-rest.md) tutorial for proper implementation.

### Step 3: Get Your First Account

```javascript
// Get the first account (derivation path: m/44'/501'/0'/0')
// Note: getAccount is async and returns a Promise
const account1 = await wallet.getAccount(0);
const address1 = await account1.getAddress();
console.log('📝 Account 1 Public Key:', address1);
```

### Step 4: Get Multiple Accounts

```javascript
// Get more accounts from the same wallet
// Each account has a different derivation path
const account2 = await wallet.getAccount(1);
const account3 = await wallet.getAccount(2);

const address2 = await account2.getAddress();
const address3 = await account3.getAddress();

console.log('📝 Account 2:', address2);
console.log('📝 Account 3:', address3);
```

### Complete Example

```javascript
// index.js
import WalletManagerSolana from '@tetherto/wdk-wallet-solana';
import { generateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';

async function main() {
  console.log('🚀 Creating your first Solana wallet...\n');
  
  // Generate mnemonic and create wallet
  const mnemonic = generateMnemonic(wordlist, 128);
  const wallet = new WalletManagerSolana(mnemonic, {
    rpcUrl: 'https://api.devnet.solana.com',
    commitment: 'confirmed'
  });
  
  console.log('✅ Wallet created!');
  console.log('🔑 Seed phrase:', mnemonic);
  console.log('⚠️  In production, NEVER log or expose your seed phrase!\n');
  
  // Get accounts (getAccount is async!)
  const account1 = await wallet.getAccount(0);
  const account2 = await wallet.getAccount(1);
  
  const address1 = await account1.getAddress();
  const address2 = await account2.getAddress();
  console.log('📝 Account 1:', address1);
  console.log('📝 Account 2:', address2);
  console.log('');
  
  // Check balances
  const balance1 = await account1.getBalance();
  const balance2 = await account2.getBalance();
  console.log('💰 Account 1 balance:', Number(balance1) / 1e9, 'SOL');
  console.log('💰 Account 2 balance:', Number(balance2) / 1e9, 'SOL');
  
  console.log('\n🎉 Success! You now have a wallet with 2 accounts!');
}

main().catch(console.error);
```

> **Understanding the Script**: This script creates one wallet from a mnemonic seed phrase, then explicitly requests 2 accounts (index 0 and 1) from that wallet on Solana's devnet. The mnemonic is the master key material—it's not an account itself, but the source from which accounts are derived. Both accounts are "full access" accounts, meaning they can read balances AND sign/send transactions. Accounts are created on-demand when you call `getAccount(index)`—the wallet doesn't automatically create any accounts. You can derive unlimited accounts from the same mnemonic by requesting different indices (0, 1, 2, 3, etc.). The script demonstrates reading balances from both accounts. New accounts will have 0 SOL until they are funded.

### 🎉 Checkpoint: You Did It!

Run your code. You should see:
- A 12-word seed phrase
- Two different Solana addresses (public keys)
- Balance information for both accounts (0 SOL for new accounts)

### 🔗 Documentation Links

- [SDK Wallet Creation Docs](https://docs.wallet.tether.io/sdk/wallet-modules/wallet-solana)
- [BIP-39 Mnemonic Generation](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki)

### 🤔 Critical Thinking: Security Constraints

1. **Where is the seed phrase stored in memory?** → In the WalletManagerSolana object. What happens when your app closes?
2. **Can two wallets have the same seed phrase?** → No, the probability is astronomically low
3. **What if someone gets your seed phrase?** → They have full control of all accounts derived from it

### 🔍 Go Deeper: Understanding Derivation Paths

Each account uses a derivation path:
- Account 1: `m/44'/501'/0'`
- Account 2: `m/44'/501'/1'`
- Account 3: `m/44'/501'/2'`

The `501'` is Solana's coin type in BIP-44. This ensures Solana addresses are different from Bitcoin or Ethereum addresses, even with the same seed phrase.

---

## <a name="reading-data"></a>5. Reading On-Chain Data: Checking Balances

### Learning Objective
Query the Solana blockchain to get account balances and other data.

### Step 1: Configure the Wallet for Devnet

By default, the SDK might use mainnet. For learning, we want devnet (free SOL from faucets).

```javascript
import WalletManagerSolana from '@tetherto/wdk-wallet-solana';

// Create wallet configured for devnet
const wallet = new WalletManagerSolana({
  // You can configure RPC endpoint here
  // Default uses public Solana RPCs
});

// Or restore from seed phrase
const wallet = new WalletManagerSolana('your seed phrase', {
  // Configuration options
});
```

### Step 2: Check Account Balance

```javascript
async function checkBalance() {
  const wallet = new WalletManagerSolana();
  const account = wallet.createAccount();
  
  console.log('📝 Account:', account.publicKey.toBase58());
  
  // Get balance (returns amount in SOL)
  const balance = await account.getBalance();
  console.log('💰 Balance:', balance, 'SOL');
  
  // Balance is 0 for new accounts
  // You'll need to get devnet SOL from a faucet!
}
```

### Step 3: Get Devnet SOL from Faucet

New accounts start with 0 SOL. To test transactions, you need devnet SOL:

1. Visit [Solana Faucet](https://faucet.solana.com/)
2. Paste your account's public key
3. Request airdrop (usually 1-2 SOL)
4. Wait a few seconds, then check balance again

### Complete Example

```javascript
// index.js
import WalletManagerSolana from '@tetherto/wdk-wallet-solana';

async function main() {
  console.log('🔍 Checking account balance...\n');
  
  const wallet = new WalletManagerSolana();
  const account = wallet.createAccount();
  
  const publicKey = account.publicKey.toBase58();
  console.log('📝 Account:', publicKey);
  
  const balance = await account.getBalance();
  console.log('💰 Balance:', balance, 'SOL');
  
  if (balance === 0) {
    console.log('\n💡 Tip: Get free devnet SOL at https://faucet.solana.com/');
    console.log('   Paste this address:', publicKey);
  }
}

main().catch(console.error);
```

### 🎉 Checkpoint: You Did It!

After getting SOL from the faucet, run the code again. You should see a balance > 0!

### 🔗 Documentation Links

- [Solana Faucet](https://faucet.solana.com/)
- [Solana RPC Methods](https://docs.solana.com/api/http)

### 🤔 Critical Thinking: What Trust Assumptions Are Built In?

1. **RPC endpoint**: You're trusting the RPC to give you accurate balance data. What if it's wrong?
2. **Network state**: The balance reflects the blockchain's current state. What if there's a pending transaction?
3. **Finality**: On Solana, transactions are "final" after ~400ms. But what if there's a network fork?

### 🔍 Go Deeper: Understanding RPC Calls

Under the hood, `getBalance()` makes an RPC call:
```javascript
// Simplified version of what happens
const response = await fetch('https://api.devnet.solana.com', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'getBalance',
    params: [publicKey]
  })
});
```

The SDK abstracts this away, but it's useful to know what's happening!

---

## <a name="sending-transactions"></a>6. Sending Transactions: Your First SOL Transfer

### Learning Objective
Send SOL from one account to another on Solana devnet.

### Step 1: Prepare Two Accounts

```javascript
const wallet = new WalletManagerSolana();
const sender = wallet.createAccount();
const recipient = wallet.createAccount(); // Or use a known address

console.log('📤 Sender:', sender.publicKey.toBase58());
console.log('📥 Recipient:', recipient.publicKey.toBase58());
```

### Step 2: Fund the Sender Account

Make sure the sender has SOL (get it from the faucet if needed):

```javascript
const senderBalance = await sender.getBalance();
if (senderBalance === 0) {
  console.log('⚠️  Sender has no SOL. Get some from the faucet!');
  return;
}
```

### Step 3: Send a Transaction

```javascript
async function sendTransaction() {
  const wallet = new WalletManagerSolana();
  const sender = wallet.createAccount();
  const recipient = wallet.createAccount();
  
  // Check sender balance
  const balance = await sender.getBalance();
  console.log('💰 Sender balance:', balance, 'SOL');
  
  if (balance < 0.1) {
    console.log('⚠️  Not enough SOL. Need at least 0.1 SOL for transaction + fees');
    return;
  }
  
  // Send 0.1 SOL
  const amount = 0.1; // Amount in SOL
  console.log(`\n📤 Sending ${amount} SOL...`);
  
  try {
    const signature = await sender.sendTransaction(
      recipient.publicKey.toBase58(),
      amount
    );
    
    console.log('✅ Transaction sent!');
    console.log('🔗 Signature:', signature);
    console.log('🔗 View on explorer: https://explorer.solana.com/tx/' + signature + '?cluster=devnet');
  } catch (error) {
    console.error('❌ Transaction failed:', error.message);
  }
}
```

### Step 4: Verify the Transaction

```javascript
// Wait a moment, then check recipient balance
await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

const recipientBalance = await recipient.getBalance();
console.log('💰 Recipient balance:', recipientBalance, 'SOL');
```

### Complete Example

```javascript
// index.js
import WalletManagerSolana from '@tetherto/wdk-wallet-solana';

async function main() {
  console.log('💸 Sending your first Solana transaction...\n');
  
  const wallet = new WalletManagerSolana();
  const sender = wallet.createAccount();
  const recipient = wallet.createAccount();
  
  console.log('📤 Sender:', sender.publicKey.toBase58());
  console.log('📥 Recipient:', recipient.publicKey.toBase58());
  
  // Check balances
  const senderBalance = await sender.getBalance();
  console.log('\n💰 Sender balance:', senderBalance, 'SOL');
  
  if (senderBalance < 0.1) {
    console.log('\n⚠️  Sender needs SOL!');
    console.log('💡 Get devnet SOL at: https://faucet.solana.com/');
    console.log('   Address:', sender.publicKey.toBase58());
    return;
  }
  
  // Send transaction
  const amount = 0.1;
  console.log(`\n📤 Sending ${amount} SOL...`);
  
  try {
    const signature = await sender.sendTransaction(
      recipient.publicKey.toBase58(),
      amount
    );
    
    console.log('✅ Success!');
    console.log('🔗 Transaction:', signature);
    console.log('🔗 Explorer: https://explorer.solana.com/tx/' + signature + '?cluster=devnet');
    
    // Wait and check recipient
    console.log('\n⏳ Waiting for confirmation...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const recipientBalance = await recipient.getBalance();
    console.log('💰 Recipient balance:', recipientBalance, 'SOL');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main().catch(console.error);
```

### 🎉 Checkpoint: You Did It!

If everything worked:
1. You sent SOL from one account to another
2. You got a transaction signature
3. You can view it on Solana Explorer
4. The recipient's balance increased

### 🔗 Documentation Links

- [Solana Transaction Format](https://docs.solana.com/developing/programming-model/transactions)
- [Solana Explorer](https://explorer.solana.com/)
- [Understanding Transaction Fees](https://docs.solana.com/transaction-fees)

### 🤔 Critical Thinking: Where Can Failure Occur?

1. **Insufficient balance**: What if you try to send more than you have?
2. **Network congestion**: What if the RPC is slow or down?
3. **Invalid recipient**: What if the recipient address is malformed?
4. **Transaction dropped**: What if your transaction doesn't get included in a block?

### 🔍 Go Deeper: Understanding Transaction Fees

Every Solana transaction costs a small fee (usually ~0.000005 SOL, or ~$0.0001). This fee:
- Prevents spam
- Compensates validators
- Is paid by the sender

The SDK handles fee estimation automatically, but it's good to know it exists!

---

## <a name="mini-project"></a>7. Mini-Project: Build a Wallet Dashboard

### Learning Objective
Build a complete, working wallet dashboard that displays accounts, balances, and allows sending transactions.

### Project Overview

We'll build a simple HTML/JavaScript app that:
- ✅ Creates or restores a wallet
- ✅ Displays all accounts from the wallet
- ✅ Shows balances for each account
- ✅ Allows sending SOL between accounts
- ✅ Shows transaction history (basic)

### Project Structure

```
wallet-dashboard/
├── index.html
├── app.js
├── styles.css
├── package.json
└── README.md
```

### Step 1: Set Up the Project

```bash
mkdir wallet-dashboard
cd wallet-dashboard
npm init -y
npm install @tetherto/wdk-wallet-solana
```

### Step 2: Create index.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Solana Wallet Dashboard</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="container">
    <header>
      <h1>🚀 Solana Wallet Dashboard</h1>
      <p class="subtitle">Manage your Solana accounts and transactions</p>
    </header>

    <div class="wallet-section">
      <h2>Wallet Setup</h2>
      <div class="button-group">
        <button id="createWallet" class="btn btn-primary">Create New Wallet</button>
        <button id="restoreWallet" class="btn btn-secondary">Restore from Seed Phrase</button>
      </div>
      <div id="seedPhraseDisplay" class="seed-phrase" style="display: none;">
        <p><strong>⚠️ Save this seed phrase securely:</strong></p>
        <p id="seedPhraseText" class="seed-text"></p>
        <button id="hideSeedPhrase" class="btn btn-small">Hide</button>
      </div>
      <div id="restoreInput" style="display: none;">
        <textarea id="seedPhraseInput" placeholder="Enter your 12-word seed phrase"></textarea>
        <button id="confirmRestore" class="btn btn-primary">Restore Wallet</button>
      </div>
    </div>

    <div id="dashboard" class="dashboard" style="display: none;">
      <h2>Your Accounts</h2>
      <div id="accountsList"></div>
      
      <div class="transaction-section">
        <h2>Send Transaction</h2>
        <div class="form-group">
          <label>From Account:</label>
          <select id="fromAccount"></select>
        </div>
        <div class="form-group">
          <label>To Address:</label>
          <input type="text" id="toAddress" placeholder="Enter recipient address">
        </div>
        <div class="form-group">
          <label>Amount (SOL):</label>
          <input type="number" id="amount" step="0.01" min="0" placeholder="0.1">
        </div>
        <button id="sendTransaction" class="btn btn-primary">Send Transaction</button>
        <div id="transactionStatus"></div>
      </div>
    </div>
  </div>

  <script type="module" src="app.js"></script>
</body>
</html>
```

### Step 3: Create styles.css

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  padding: 20px;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}

header {
  text-align: center;
  margin-bottom: 30px;
}

h1 {
  color: #333;
  margin-bottom: 10px;
}

.subtitle {
  color: #666;
}

.wallet-section, .dashboard {
  margin-top: 30px;
}

.button-group {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5568d3;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}

.btn-small {
  padding: 6px 12px;
  font-size: 14px;
}

.seed-phrase {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  margin-top: 15px;
}

.seed-text {
  font-family: monospace;
  font-size: 14px;
  word-spacing: 4px;
  margin: 10px 0;
  color: #333;
}

textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  margin-bottom: 10px;
  min-height: 80px;
}

.account-card {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 15px;
}

.account-card h3 {
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
}

.account-address {
  font-family: monospace;
  font-size: 12px;
  color: #333;
  word-break: break-all;
  margin-bottom: 10px;
}

.account-balance {
  font-size: 18px;
  font-weight: bold;
  color: #667eea;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  color: #333;
  font-weight: 500;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.transaction-section {
  margin-top: 30px;
  padding-top: 30px;
  border-top: 1px solid #eee;
}

#transactionStatus {
  margin-top: 15px;
  padding: 10px;
  border-radius: 6px;
}

.status-success {
  background: #d4edda;
  color: #155724;
}

.status-error {
  background: #f8d7da;
  color: #721c24;
}
```

### Step 4: Create app.js

```javascript
// app.js
import WalletManagerSolana from '@tetherto/wdk-wallet-solana';

let wallet = null;
let accounts = [];

// DOM Elements
const createWalletBtn = document.getElementById('createWallet');
const restoreWalletBtn = document.getElementById('restoreWallet');
const seedPhraseDisplay = document.getElementById('seedPhraseDisplay');
const seedPhraseText = document.getElementById('seedPhraseText');
const hideSeedPhraseBtn = document.getElementById('hideSeedPhrase');
const restoreInput = document.getElementById('restoreInput');
const seedPhraseInput = document.getElementById('seedPhraseInput');
const confirmRestoreBtn = document.getElementById('confirmRestore');
const dashboard = document.getElementById('dashboard');
const accountsList = document.getElementById('accountsList');
const fromAccountSelect = document.getElementById('fromAccount');
const toAddressInput = document.getElementById('toAddress');
const amountInput = document.getElementById('amount');
const sendTransactionBtn = document.getElementById('sendTransaction');
const transactionStatus = document.getElementById('transactionStatus');

// Create new wallet
createWalletBtn.addEventListener('click', () => {
  wallet = new WalletManagerSolana();
  const mnemonic = wallet.generateMnemonic();
  
  seedPhraseText.textContent = mnemonic;
  seedPhraseDisplay.style.display = 'block';
  restoreInput.style.display = 'none';
  
  initializeDashboard();
});

// Restore wallet
restoreWalletBtn.addEventListener('click', () => {
  restoreInput.style.display = 'block';
  seedPhraseDisplay.style.display = 'none';
});

confirmRestoreBtn.addEventListener('click', () => {
  const mnemonic = seedPhraseInput.value.trim();
  if (!mnemonic) {
    alert('Please enter a seed phrase');
    return;
  }
  
  try {
    wallet = new WalletManagerSolana(mnemonic);
    restoreInput.style.display = 'none';
    initializeDashboard();
  } catch (error) {
    alert('Invalid seed phrase: ' + error.message);
  }
});

hideSeedPhraseBtn.addEventListener('click', () => {
  seedPhraseDisplay.style.display = 'none';
});

// Initialize dashboard
async function initializeDashboard() {
  // Create 3 accounts for demo
  accounts = [];
  for (let i = 0; i < 3; i++) {
    accounts.push(wallet.createAccount());
  }
  
  dashboard.style.display = 'block';
  await updateAccounts();
  updateFromAccountSelect();
}

// Update accounts display
async function updateAccounts() {
  accountsList.innerHTML = '';
  
  for (const account of accounts) {
    const balance = await account.getBalance();
    
    const accountCard = document.createElement('div');
    accountCard.className = 'account-card';
    accountCard.innerHTML = `
      <h3>Account ${accounts.indexOf(account) + 1}</h3>
      <div class="account-address">${account.publicKey.toBase58()}</div>
      <div class="account-balance">${balance} SOL</div>
    `;
    
    accountsList.appendChild(accountCard);
  }
}

// Update from account select
function updateFromAccountSelect() {
  fromAccountSelect.innerHTML = '';
  accounts.forEach((account, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = `Account ${index + 1} (${account.publicKey.toBase58().slice(0, 8)}...)`;
    fromAccountSelect.appendChild(option);
  });
}

// Send transaction
sendTransactionBtn.addEventListener('click', async () => {
  const fromIndex = parseInt(fromAccountSelect.value);
  const toAddress = toAddressInput.value.trim();
  const amount = parseFloat(amountInput.value);
  
  if (!toAddress || !amount || amount <= 0) {
    showStatus('Please fill in all fields with valid values', 'error');
    return;
  }
  
  const sender = accounts[fromIndex];
  
  try {
    showStatus('Sending transaction...', 'info');
    sendTransactionBtn.disabled = true;
    
    const signature = await sender.sendTransaction(toAddress, amount);
    
    showStatus(`✅ Transaction sent! Signature: ${signature}`, 'success');
    
    // Update balances after a delay
    setTimeout(async () => {
      await updateAccounts();
    }, 3000);
    
    // Clear form
    toAddressInput.value = '';
    amountInput.value = '';
    sendTransactionBtn.disabled = false;
    
  } catch (error) {
    showStatus('❌ Error: ' + error.message, 'error');
    sendTransactionBtn.disabled = false;
  }
});

function showStatus(message, type) {
  transactionStatus.textContent = message;
  transactionStatus.className = `status-${type}`;
  transactionStatus.style.display = 'block';
}
```

### Step 5: Update package.json

```json
{
  "name": "wallet-dashboard",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "npx serve ."
  },
  "dependencies": {
    "@tetherto/wdk-wallet-solana": "^1.0.0"
  }
}
```

### Step 6: Run the Project

```bash
# Install a simple server (if needed)
npm install -g serve

# Or use npx
npx serve .

# Open http://localhost:3000 in your browser
```

### 🎉 Checkpoint: You Did It!

You now have a working wallet dashboard! Try:
1. Creating a new wallet
2. Viewing your accounts and balances
3. Sending transactions between accounts
4. Viewing transactions on Solana Explorer

### 🔗 Documentation Links

- [HTML5 Canvas Tutorial](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial)
- [JavaScript ES6 Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)

### 🤔 Critical Thinking: How Would You Monitor or Debug This?

1. **Transaction failures**: How would you know if a transaction failed? What error messages should you show?
2. **Balance updates**: The balance updates after 3 seconds. What if the transaction takes longer?
3. **Network errors**: What if the RPC endpoint is down? How would you handle that?
4. **User experience**: What if the user closes the browser before the transaction completes?

### 🔍 Go Deeper: Building a Production-Ready Dashboard

For production, you'd want to:
- Add loading states and spinners
- Implement proper error handling
- Add transaction history
- Support SPL tokens (not just SOL)
- Add account management (create/delete accounts)
- Implement proper seed phrase storage (encrypted, never in localStorage!)
- Add network switching (mainnet/devnet)
- Implement transaction status polling

---

## <a name="security"></a>8. Security: Understanding the Risks

### Learning Objective
Understand common security pitfalls and how to avoid them.

### What Can Go Wrong?

#### 1. Seed Phrase Exposure

**The Problem**: If someone gets your seed phrase, they control all your accounts forever.

**Common Mistakes**:
- Logging seed phrases to console
- Storing seed phrases in localStorage (accessible to any script)
- Sending seed phrases over unencrypted connections
- Taking screenshots of seed phrases

**The Solution**:
- Never log seed phrases in production
- Use encrypted storage (like browser extension storage with encryption)
- Never send seed phrases over the network
- Use hardware wallets for large amounts

```javascript
// ❌ BAD: Never do this in production
console.log('Seed phrase:', mnemonic);
localStorage.setItem('seedPhrase', mnemonic);

// ✅ GOOD: Keep it in memory, encrypt if storing
// Only keep in memory during active session
// If you must store, encrypt it first
```

#### 2. Phishing Attacks

**The Problem**: Malicious websites trick you into signing transactions that drain your wallet.

**How It Works**:
1. You visit a fake dApp
2. It asks you to "approve" something
3. The transaction actually sends all your SOL to the attacker

**The Solution**:
- Always verify transaction details before signing
- Check the recipient address carefully
- Use trusted dApps only
- Be suspicious of "free airdrops" or "verify your wallet" prompts

```javascript
// Always show transaction details to user
function showTransactionDetails(transaction) {
  console.log('Recipient:', transaction.recipient);
  console.log('Amount:', transaction.amount);
  console.log('Fee:', transaction.fee);
  // User must explicitly confirm
}
```

#### 3. Replay Attacks

**The Problem**: A transaction signed for one network could be replayed on another.

**Example**: You sign a transaction on devnet, but someone replays it on mainnet.

**The Solution**: The SDK handles this by including network information in transactions. But you should:
- Always specify the network explicitly
- Never reuse transaction signatures
- Use recent blockhashes (the SDK does this automatically)

#### 4. Untrusted RPC Endpoints

**The Problem**: A malicious RPC could:
- Show you incorrect balances
- Censor your transactions
- Track your activity

**The Solution**:
- Use reputable RPC providers (Alchemy, QuickNode, public Solana RPCs)
- Consider running your own RPC node for critical applications
- Verify important data from multiple sources

```javascript
// ✅ GOOD: Use trusted RPC endpoints
const wallet = new WalletManagerSolana({
  rpcEndpoint: 'https://api.mainnet-beta.solana.com' // Public Solana RPC
  // Or use a trusted provider
});
```

### Trusted vs Untrusted Inputs

**Trusted Inputs**: Data from your own code or verified sources
- Your seed phrase (from secure storage)
- Account addresses you generate
- Transaction amounts you calculate

**Untrusted Inputs**: Data from external sources
- User-provided addresses
- URLs or transaction data from websites
- Data from APIs

**Rule**: Always validate and sanitize untrusted inputs!

```javascript
// ❌ BAD: Trusting user input
function sendToAddress(address) {
  account.sendTransaction(address, 1.0); // What if address is malicious?
}

// ✅ GOOD: Validate first
function sendToAddress(address) {
  // Validate address format
  if (!isValidSolanaAddress(address)) {
    throw new Error('Invalid address');
  }
  
  // Show user the address and ask for confirmation
  if (!confirm(`Send to ${address}?`)) {
    return;
  }
  
  account.sendTransaction(address, 1.0);
}

function isValidSolanaAddress(address) {
  // Solana addresses are base58 encoded, 32-44 characters
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}
```

### Why RPCs Are Not "Magic Backends"

RPC endpoints are:
- **Public**: Anyone can query them
- **Centralized**: Run by specific companies/organizations
- **Fallible**: Can go down, be rate-limited, or be malicious
- **Observable**: Can see all your transactions (they're public anyway)

**Key Insight**: The blockchain is public. RPCs just give you a window into it. They can't steal your funds (you need the private key for that), but they can:
- Censor transactions
- Show incorrect data
- Track your activity

### 🔗 Documentation Links

- [Solana Security Best Practices](https://docs.solana.com/security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Web3 Security Guide](https://consensys.github.io/smart-contract-best-practices/)

### 🤔 Critical Thinking: Security Constraints

1. **What if your seed phrase is compromised?** → You must move all funds to a new wallet immediately
2. **What if the RPC is malicious?** → They can't steal funds, but could show wrong data or censor you
3. **What if a transaction fails?** → Your funds aren't lost, but you might have paid fees
4. **What if you send to the wrong address?** → Transactions are irreversible. Always double-check!

### 🔍 Go Deeper: Understanding Private Keys

Your seed phrase generates private keys using cryptographic functions. The private key:
- Never leaves your device (in a secure implementation)
- Is used to sign transactions
- If leaked, gives full control of that account
- Cannot be recovered if lost

The SDK handles private key management securely, but understanding this helps you make better security decisions.

---

## <a name="system-constraints"></a>9. System Constraints: What You Need to Know

### Learning Objective
Understand the limitations and constraints of working with Solana and the SDK.

### Network Latency

**The Reality**: Blockchain operations are not instant.

- **Transaction submission**: ~100-500ms
- **Confirmation**: ~400ms (Solana is fast!)
- **Finality**: ~13 seconds (when you're really sure)

**Impact on Your App**:
- Show loading states
- Don't assume transactions are instant
- Handle timeouts gracefully

```javascript
// ✅ GOOD: Handle async operations properly
async function sendWithFeedback() {
  showLoading('Sending transaction...');
  
  try {
    const signature = await account.sendTransaction(recipient, amount);
    showLoading('Waiting for confirmation...');
    
    // Wait for confirmation
    await waitForConfirmation(signature);
    
    showSuccess('Transaction confirmed!');
  } catch (error) {
    showError('Transaction failed: ' + error.message);
  } finally {
    hideLoading();
  }
}
```

### Transaction Fees

**The Reality**: Every transaction costs a small fee (~0.000005 SOL).

**Impact**:
- Users need SOL for fees, not just the amount they're sending
- Fees are deducted from the sender's balance
- Fees are very low on Solana (unlike Ethereum!)

**Best Practice**: Always check if the user has enough SOL for the transaction + fees.

```javascript
async function canAffordTransaction(account, amount) {
  const balance = await account.getBalance();
  const estimatedFee = 0.000005; // Rough estimate
  const totalNeeded = amount + estimatedFee;
  
  return balance >= totalNeeded;
}
```

### Block Times and Finality

**Solana Block Time**: ~400ms (very fast!)

**Finality**: 
- **Optimistic confirmation**: ~400ms (good for most use cases)
- **Full confirmation**: ~13 seconds (when you need to be absolutely sure)

**Impact**:
- Most apps can use optimistic confirmation
- For high-value transactions, wait for full confirmation
- Transactions can theoretically be rolled back before finality (extremely rare)

### What Happens When RPCs Fail?

**Scenarios**:
1. **RPC is down**: Your app can't read data or send transactions
2. **RPC is slow**: Operations timeout
3. **RPC rate limits you**: Too many requests, you get blocked

**Solutions**:
- Implement retry logic with exponential backoff
- Use multiple RPC endpoints as fallbacks
- Cache data when possible
- Show clear error messages to users

```javascript
async function getBalanceWithRetry(account, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await account.getBalance();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

### When and Why Transactions Get Dropped

**Reasons transactions fail**:
1. **Insufficient balance**: Not enough SOL for amount + fees
2. **Invalid recipient**: Address doesn't exist or is malformed
3. **Stale blockhash**: Transaction uses an old blockhash (expires after ~60 seconds)
4. **Network congestion**: Validators are too busy (rare on Solana)
5. **Account doesn't exist**: Trying to send to a new account without initializing it

**The SDK handles most of this**, but you should:
- Check balances before sending
- Validate addresses
- Handle errors gracefully
- Show clear error messages

### SDK Limitations and Assumptions

**What the SDK assumes**:
- You have a working internet connection
- RPC endpoints are accessible
- You're using valid Solana addresses
- You understand the difference between mainnet and devnet

**SDK limitations**:
- Doesn't handle SPL tokens by default (you'd need additional libraries)
- Doesn't provide transaction history (you'd query RPC directly)
- Doesn't handle smart contract interactions (you'd use @solana/web3.js for that)
- Focuses on wallet management, not full dApp development

**When to use additional tools**:
- **@solana/web3.js**: For advanced transaction building, program interactions
- **@solana/spl-token**: For SPL token operations
- **Wallet adapters**: For connecting to browser wallets (Phantom, Solflare)

### 🔗 Documentation Links

- [Solana Performance](https://docs.solana.com/cluster/performance)
- [Solana Transaction Processing](https://docs.solana.com/developing/programming-model/transactions)
- [Handling RPC Errors](https://docs.solana.com/api/http)

### 🤔 Critical Thinking: System Constraints

1. **What if Solana mainnet goes down?** → Your app can't function. How would you handle this?
2. **What if fees increase dramatically?** → Your app might become unusable for small transactions
3. **What if a transaction is stuck?** → It will eventually expire, but the user might be confused
4. **What if the SDK has a bug?** → Always have a fallback plan, test thoroughly, and monitor for issues

### 🔍 Go Deeper: Understanding Solana's Architecture

Solana uses:
- **Proof of History**: For ordering transactions
- **Proof of Stake**: For consensus
- **Turbine**: For block propagation
- **Gulf Stream**: For transaction forwarding

You don't need to understand all of this to use the SDK, but it helps explain why Solana is fast and how it differs from other blockchains.

---

## <a name="next-steps"></a>10. Next Steps: Where to Go From Here

### Learning Paths

#### Path 1: Deeper Wallet Integration
- Learn about browser wallet adapters (Phantom, Solflare)
- Implement wallet connection flows
- Handle multiple wallet providers
- Build wallet switching functionality

**Resources**:
- [Solana Wallet Adapter](https://github.com/solana-labs/wallet-adapter)
- [Phantom Wallet Docs](https://docs.phantom.app/)

#### Path 2: Smart Contract Basics
- Learn Solana Program (smart contract) development
- Understand Program Derived Addresses (PDAs)
- Build interactions with existing programs
- Deploy your own programs

**Resources**:
- [Solana Program Development](https://docs.solana.com/developing/programming-model/overview)
- [Anchor Framework](https://www.anchor-lang.com/) (makes Solana development easier)

#### Path 3: Extend Your Mini-Project
- Add SPL token support
- Implement transaction history
- Add account management (create/delete)
- Build a mobile version
- Add dark mode and better UX

#### Path 4: Security Deep Dive
- Learn about cryptographic primitives
- Understand key derivation in detail
- Study common attack vectors
- Get security audits for your code

**Resources**:
- [Applied Cryptography](https://www.schneier.com/books/applied-cryptography/)
- [Solana Security Best Practices](https://docs.solana.com/security)

### Recommended Reading

1. **Solana Cookbook**: [cookbook.solana.com](https://solanacookbook.com/) - Code examples for common tasks
2. **Solana Documentation**: [docs.solana.com](https://docs.solana.com/) - Official docs
3. **Web3 Security**: Study common vulnerabilities and how to avoid them
4. **Blockchain Basics**: Understand how blockchains work at a fundamental level

### Exercises to Reinforce Intuition

1. **Build a Balance Checker**: Create a tool that checks balances for multiple addresses
2. **Transaction Simulator**: Build a tool that simulates transactions before sending
3. **Multi-Signature Wallet**: Research and implement a multi-sig wallet (advanced)
4. **Fee Calculator**: Build a tool that calculates exact fees for transactions
5. **Network Monitor**: Create a dashboard that monitors Solana network health

### "Try Breaking Your Own Code" Prompts

1. **What happens if you send to an invalid address?** → Try it and see the error
2. **What if you send more SOL than you have?** → Test the error handling
3. **What if the RPC is down?** → Disconnect your internet and see what happens
4. **What if you use a mainnet address on devnet?** → Try it and observe
5. **What if you restore a wallet with a typo in the seed phrase?** → See what error you get

### Building a Portfolio Project

Consider building one of these to showcase your skills:

1. **NFT Marketplace**: Buy/sell NFTs using the SDK
2. **DeFi Dashboard**: Track DeFi positions and yields
3. **Gaming Wallet**: In-game currency management
4. **Payment App**: Send/receive SOL with a clean UI
5. **Multi-Account Manager**: Manage multiple wallets from one interface

### Community and Support

- **Solana Discord**: [discord.gg/solana](https://discord.gg/solana) - Get help from the community
- **Solana Stack Exchange**: Ask technical questions
- **GitHub Issues**: Report bugs or request features for the SDK
- **Twitter/X**: Follow @solana for updates

### 🎉 Congratulations!

You've completed the tutorial! You now understand:
- ✅ How to create and manage Solana wallets
- ✅ How to read on-chain data
- ✅ How to send transactions
- ✅ Security best practices
- ✅ System constraints and limitations
- ✅ How to think critically about Web3 development

**Keep building, keep learning, and most importantly—keep your seed phrases safe!** 🔐

---

## Appendix: Quick Reference

### Common Patterns

```javascript
// Create wallet
const wallet = new WalletManagerSolana();
const mnemonic = wallet.generateMnemonic();

// Restore wallet
const wallet = new WalletManagerSolana(mnemonic);

// Create account
const account = wallet.createAccount();

// Check balance
const balance = await account.getBalance();

// Send transaction
const signature = await account.sendTransaction(recipientAddress, amountInSOL);
```

### Error Handling

```javascript
try {
  const signature = await account.sendTransaction(recipient, amount);
  console.log('Success:', signature);
} catch (error) {
  if (error.message.includes('insufficient')) {
    console.error('Not enough SOL');
  } else if (error.message.includes('invalid')) {
    console.error('Invalid address or amount');
  } else {
    console.error('Unknown error:', error.message);
  }
}
```

### Useful Links

- [SDK Documentation](https://docs.wallet.tether.io/sdk/wallet-modules/wallet-solana)
- [Solana Explorer](https://explorer.solana.com/)
- [Solana Faucet](https://faucet.solana.com/)
- [Solana Cookbook](https://solanacookbook.com/)

---

**Happy Building! 🚀**

