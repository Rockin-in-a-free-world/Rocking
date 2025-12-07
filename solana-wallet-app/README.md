# Solana Wallet Demo App

A frontend application demonstrating Tether WDK Solana SDK with transaction monitoring, multisig wallet creation via Google sign-on, and dashboard metrics.

## Features

- ✅ Multisig wallet creation via Google OAuth
- ✅ Transaction lifecycle monitoring (Submitted → Broadcast → Confirmed → Finalized)
- ✅ Real-time dashboard with transaction metrics
- ✅ Status alerts with visual indicators
- ✅ Transaction correction/fallback
- ✅ Feemaster account support
- ✅ Account closure

## Tech Stack

- **Frontend**: Next.js 15+ (React)
- **Wallet Creation**: MetaMask Embedded Wallets SDK (multisig key creation via Google OAuth)
- **Wallet**: @tetherto/wdk-wallet-solana
- **Blockchain**: Solana (Devnet)
- **Storage**: Ghost CMS (SQLite) or On-chain Solana storage

## User Journey

### First-Time User
1. Arrive at app via URL
2. Click "Sign in with Google" (creates wallet key via multisig)
3. Accept terms:
   - "I understand that a Solana account is being linked to my Google account. I am ready to safely store a minimum of two copies of my seed phrase"
   - (Dev only) "I understand this is a demo and the seed phrase will be stored, unencrypted in a .env file"
4. Account created → Redirect to dashboard

### Returning User
1. Sign in with Google
2. View dashboard with transaction metrics:
   - Submitted transaction count
   - Broadcast transaction count
   - Confirmed transaction count
   - Finalized transaction count
3. See status alert:
   - **Grand** 🟢: All transactions finalized (Finalized = Submitted)
   - **Good** 🟡: All transactions confirmed (Confirmed = Submitted)
   - **Gutted** 🔴: Some transactions failed (Finalized < Submitted)

### Additional Features
- **Correct Transaction**: Fallback mechanism for failed transactions
- **Feemaster Account**: Separate admin app to manage feemaster account (seed phrase controlled, pays rent for new user accounts)
- **Close Account**: Delete account data, reset to first-time user flow

## Project Structure

```
solana-wallet-app/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Auth routes
│   ├── dashboard/          # Dashboard page
│   └── api/               # API routes
├── components/             # React components
│   ├── Dashboard/         # Dashboard components
│   ├── TransactionMonitor/ # Transaction tracking
│   └── StatusAlert/       # Status indicators
├── lib/                    # Utilities
│   ├── wallet.ts          # Wallet management
│   ├── transactions.ts    # Transaction monitoring
│   └── storage.ts        # Data persistence
├── types/                  # TypeScript types
└── public/                # Static assets
```

## Getting Started

1. **Understand the Integration**: [INTEGRATION_FLOW.md](./INTEGRATION_FLOW.md) - How MetaMask SDK + Tether WDK work together
2. **Read the Tutorial**: [TUTORIAL.md](./TUTORIAL.md) - Complete step-by-step guide
3. **Feemaster Account Setup**: [FEEMASTER_ACCOUNT.md](./FEEMASTER_ACCOUNT.md) - Admin app for feemaster account management
4. **Deploy to GitHub Pages**: [GITHUB_PAGES_DEPLOYMENT.md](./GITHUB_PAGES_DEPLOYMENT.md) - Free hosting guide
5. **Storage Design**: [STORAGE_DESIGN.md](./STORAGE_DESIGN.md) - 10KB per-account architecture

## Status Logic

See [STATUS_LOGIC_REVIEW.md](./STATUS_LOGIC_REVIEW.md) for status calculation details.

