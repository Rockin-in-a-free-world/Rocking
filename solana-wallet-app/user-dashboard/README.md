# Solana User Dashboard

A local Next.js application for managing Solana wallets with transaction monitoring. This is a simplified version focused on user functionality only - no feemaster/admin features.

## Features

- **Seed Phrase Login**: Login with existing seed phrase or generate a new wallet
- **Transaction Monitoring**: View transaction history, status, and metrics
- **Balance Tracking**: Real-time balance using Tether WDK SDK
- **Send SOL**: Send SOL transactions using Tether WDK SDK
- **Airdrop**: Request devnet SOL airdrops
- **Status Dashboard**: Track transaction status (Grand/Good/Gutted)

## Prerequisites

- Node.js >= 20.0.0
- npm >= 9.0.0

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment (optional):**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` if you need to change Solana RPC URL or network. Defaults are provided.

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   ```
   http://localhost:3000
   ```

## Environment Variables

The app works with defaults, but you can customize:

```bash
# Solana Configuration (optional - defaults provided)
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=devnet
```

## Usage

1. **Login/Setup:**
   - Visit the home page
   - Enter an existing seed phrase OR leave empty to generate a new wallet
   - If generating new, confirm you understand the requirements
   - Click "Login with Seed Phrase"

2. **Dashboard:**
   - View your wallet address
   - See transaction metrics and balance
   - Check transaction status (Grand/Good/Gutted)
   - Request airdrops (devnet only)
   - Send SOL to other addresses

3. **Security:**
   - Seed phrases are stored only in browser sessionStorage
   - Never share your seed phrase
   - Clear session on logout

## Architecture

- **Tether WDK SDK**: Used for all wallet operations (balance, send)
- **@solana/web3.js**: Used for read-only network queries (transaction history, airdrops)
- **Next.js API Routes**: Server-side API endpoints for wallet operations
- **Session Storage**: Client-side storage for wallet credentials (temporary)

## API Routes

- `POST /api/user/setup` - Setup/login with seed phrase
- `POST /api/user/airdrop` - Request devnet SOL airdrop
- `POST /api/user/balance` - Get balance using Tether WDK SDK
- `POST /api/user/send` - Send SOL transaction
- `GET /api/dashboard/transactions` - Get transaction data and metrics

## Development

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint
npm run lint
```

## Notes

- This is a **local-only** application - no Railway or external hosting required
- All operations use Solana **devnet** by default
- Seed phrases are **never sent to external servers** - all operations are client-side or local API routes
- The app uses **Tether WDK SDK** for wallet operations as required

## Troubleshooting

- **Build errors with native modules**: Run `npm rebuild sodium-native` if needed
- **Connection errors**: Check your Solana RPC URL in `.env.local`
- **Transaction failures**: Ensure you have sufficient balance and valid recipient addresses

