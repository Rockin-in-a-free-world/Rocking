# Solana Wallet Demo App

A frontend application demonstrating Tether WDK Solana SDK with transaction monitoring, seed phrase-based wallet creation, and dashboard metrics.

## Features

- ✅ Seed phrase-based wallet creation (no social sign-on)
- ✅ Transaction lifecycle monitoring (Submitted → Broadcast → Confirmed → Finalized)
- ✅ Real-time dashboard with transaction metrics
- ✅ Status alerts with visual indicators (Grand/Good/Gutted)
- ✅ Send SOL transactions
- ✅ Devnet faucet integration
- ✅ Feemaster account support (admin dashboard)

## Tech Stack

- **Frontend**: Next.js 16+ (React)
- **Wallet SDK**: @tetherto/wdk-wallet-solana (Tether WDK SDK)
- **Blockchain**: Solana (Devnet)
- **Deployment**: Railway
- **Storage**: On-chain queries only (no persistent storage for dashboard data)

## User Journey

### First-Time User
1. Arrive at app via URL
2. Enter seed phrase (or leave empty to generate new)
3. Accept terms:
   - "I understand that by logging in without a seed, I will create a new Solana wallet and must store the seed phrase"
4. Account created → Redirect to dashboard

### Returning User
1. Enter seed phrase
2. View dashboard with transaction metrics:
   - Submitted transaction count
   - Broadcast transaction count
   - Confirmed transaction count
   - Finalized transaction count
3. See status alert:
   - **Grand** 🟢: All transactions finalized (Finalized = Submitted)
   - **Good** 🟡: All transactions confirmed (Confirmed = Submitted)
   - **Gutted** 🔴: Any transaction failed (permanent status)

### Dashboard Features
- **Send SOL**: Send SOL to any Solana address
- **Get Devnet SOL**: Request airdrop from faucet (2 SOL)
- **Transaction Metrics**: Real-time transaction counts and status
- **Balance Display**: Current wallet balance in SOL
- **Auto-refresh**: Dashboard refreshes every 30 seconds

## Feemaster Account

The feemaster account is a special administrative account that:
- Is managed through Tether SDK (seed phrase controlled, no social sign-on)
- Can view private key (for funding)
- Can request Devnet SOL airdrops
- Can check balance
- Accessible at `/feemaster` route

## Project Structure

```
solana-wallet-app/
├── the-app/              # Next.js application
│   ├── app/             # App router pages
│   │   ├── page.tsx     # User login (seed phrase)
│   │   ├── dashboard/   # User dashboard
│   │   └── feemaster/   # Feemaster admin dashboard
│   ├── lib/             # Utilities
│   │   ├── user-wallet.ts    # User wallet (Tether WDK SDK)
│   │   ├── feemaster.ts      # Feemaster wallet (Tether WDK SDK)
│   │   ├── transactions.ts  # Transaction monitoring
│   │   └── status.ts        # Status calculation
│   └── components/      # React components
│       ├── StatusAlert.tsx
│       └── TransactionMetrics.tsx
├── README.md            # This file
├── APP_ARCHITECTURE.md  # App architecture details
├── FEEMASTER_ACCOUNT.md # Feemaster account documentation
└── TUTORIAL.md         # Step-by-step tutorial
```

## Getting Started

1. **Read the Tutorial**: [TUTORIAL.md](./TUTORIAL.md) - Complete step-by-step guide
2. **Understand Architecture**: [APP_ARCHITECTURE.md](./APP_ARCHITECTURE.md) - Overall app structure
3. **Feemaster Setup**: [FEEMASTER_ACCOUNT.md](./FEEMASTER_ACCOUNT.md) - Admin account management
4. **Deploy to Railway**: See `the-app/README.md` for deployment instructions

## Status Logic

The dashboard status is calculated from on-chain transaction data only:

- **Grand**: All submitted transactions are finalized
- **Good**: All submitted transactions are confirmed (may not be finalized yet)
- **Gutted**: Any transaction has failed (permanent status - cannot recover)

See [STATUS_LOGIC_MVP.md](./STATUS_LOGIC_MVP.md) for detailed status calculation logic.

## Architecture Notes

- **Wallet Operations**: All wallet operations (balance, send) use Tether WDK SDK
- **Read-only Queries**: Transaction history queries use `@solana/web3.js` Connection (read-only network operations)
- **No Persistent Storage**: Dashboard data is queried directly from Solana blockchain (no database)
- **Seed Phrase Storage**: Seed phrases stored temporarily in `sessionStorage` (client-side only, for demo purposes)

## Deployment

The app is deployed on Railway. See `the-app/README.md` for detailed deployment instructions.

## Resources

- [Solana Devnet Docs](https://docs.solana.com/clusters)
- [Solana Faucet](https://faucet.solana.com)
- [Solana Explorer (Devnet)](https://explorer.solana.com/?cluster=devnet)
- [Tether WDK Solana GitHub](https://github.com/tetherto/wdk-wallet-solana)
- [Railway Docs](https://docs.railway.app)
