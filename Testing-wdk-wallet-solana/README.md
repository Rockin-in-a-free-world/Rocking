# Solana Wallet Dashboard Tutorial

This directory contains a comprehensive beginner-friendly tutorial for building with `@tetherto/wdk-wallet-solana` SDK.

## 📚 What's Inside

- **tutorials/tutorial.md**: Complete step-by-step tutorial covering:
  - SDK fundamentals
  - Wallet creation and management
  - Reading on-chain data
  - Sending transactions
  - Building a wallet dashboard mini-project
  - Security best practices
  - System constraints and limitations

- **tutorials/encrypt-seed-phrase-at-rest.md**: Side quest tutorial on encrypting seed phrases for production

- **example-basic.js**: Simple example demonstrating core SDK functionality
- **example-restore.js**: Example showing how to restore wallets from seed phrases
- **package.json**: Project dependencies and scripts
- **.env**: Environment file for storing seed phrase (testing only - see security notes)

## 🚀 Quick Start

### Two Ways to Get Started

**Option 1: Run the Examples** (Quick - just see it work)
- Follow the steps below to run the pre-built examples in this folder

**Option 2: Follow the Tutorial** (Learn by building)
- Read [tutorial.md](tutorial.md) and build step-by-step

### Prerequisites

- **Node.js 20.18.0 or higher** ([Download here](https://nodejs.org/))
  - The Node.js 20.18.0+ requirement comes from a dependency (@solana/kit)
- npm (comes with Node.js)

### Option 1: Run the Examples

1. **Navigate to this directory** (if you're not already here):
   ```bash
   cd Testing-wdk-wallet-solana
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```
   
   This will install `@tetherto/wdk-wallet-solana`, `@scure/bip39` (for mnemonic generation), and their dependencies.

3. **Run basic example**:
   ```bash
   node example-basic.js
   ```

4. **Run restore example**:
   ```bash
   node example-restore.js
   ```

### Option 2: Follow the Tutorial

If you want to learn by building your own project, start reading [tutorials/tutorial.md](tutorials/tutorial.md). The tutorial will guide you through:
- Creating your own project folder
- Installing dependencies in that folder
- Building code step-by-step

## 📖 Tutorial Structure

The [tutorial](tutorials/tutorial.md) is designed for junior frontend developers and covers:

1. **Introduction**: What the SDK is and what problems it solves
2. **Fundamentals**: Understanding RPCs, wallets, accounts, and networks
3. **Setup**: Getting your development environment ready
4. **First Wallet**: Creating and managing accounts
5. **Reading Data**: Checking balances and querying the blockchain
6. **Sending Transactions**: Your first SOL transfer
7. **Mini-Project**: Building a complete wallet dashboard
8. **Security**: Understanding risks and best practices
9. **System Constraints**: Network latency, fees, and limitations
10. **Next Steps**: Where to continue learning

## 🎯 Learning Objectives

By the end of this tutorial, you'll be able to:

- ✅ Create and manage Solana wallets
- ✅ Generate and restore wallets from seed phrases
- ✅ Create multiple accounts from a single wallet
- ✅ Check account balances
- ✅ Send SOL transactions
- ✅ Understand security best practices
- ✅ Handle errors and edge cases
- ✅ Think critically about Web3 development

## 🔗 Resources

- [SDK Documentation](https://docs.wallet.tether.io/sdk/wallet-modules/wallet-solana)
- [Solana Documentation](https://docs.solana.com/)
- [Solana Faucet](https://faucet.solana.com/) - Get free devnet SOL
- [Solana Explorer](https://explorer.solana.com/) - View transactions

## ⚠️ Important Notes

- **Always use Devnet or Testnet for learning** - Never use mainnet with real SOL until you're confident
- **Never share your seed phrases** - They give full control of your wallet
- **Test thoroughly** - Always test your code on devnet before using mainnet
- **Keep learning** - Web3 is evolving rapidly, stay updated!

## 🤝 Contributing

Found an issue or have a suggestion? Feel free to open an issue or submit a pull request!

## 📄 License

MIT

### Troubleshooting

- **Node version warnings**: The SDK requires Node.js 20.18.0+. Update Node.js if you see engine warnings
- **Installation errors**: Try clearing npm cache: `npm cache clean --force` then `npm install` again.

## Next steps

- Understand [what the SDK does and why it exists](tutorials/tutorial.md)
- Learn [how to encrypt seed phrases at rest](tutorials/encrypt-seed-phrase-at-rest.md) for production apps