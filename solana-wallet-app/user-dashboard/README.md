# Solana User Dashboard

A local Next.js application for managing Solana wallets with transaction monitoring. This is a simplified version focused on user functionality only - no feemaster/admin features.

## 📚 Documentation

**New to Solana or this codebase?** Check out the [**Tutorial**](./docs/TUTORIAL.md) - a comprehensive guide for junior web2 developers covering:
- How the app derives wallet addresses from seed phrases
- How signing works with private keys (without exposing them)
- TetherTo WDK SDK vs @solana/web3.js usage
- Security considerations and how secrets are protected
- Complete code walkthrough with links to interesting sections

## Features

- **Seed Phrase Login**: Login with existing seed phrase or generate a new wallet
- **Transaction Monitoring**: View transaction history, status, and metrics
- **Balance Tracking**: Real-time balance using Tether WDK SDK
- **Send SOL**: Send SOL transactions using Tether WDK SDK
- **Airdrop**: Request devnet SOL airdrops
- **Status Dashboard**: Track transaction status (Grand/Good/Gutted)

## Prerequisites

- **Node.js** >= 20.0.0 ([Download](https://nodejs.org/))
- **npm** >= 9.0.0 (comes with Node.js)

Verify installation:
```bash
node --version  # Should show v20.x.x or higher
npm --version   # Should show 9.x.x or higher
```

## Quick Start

### 1. Navigate to the project directory

```bash
cd user-dashboard
```

### 2. Install dependencies

```bash
npm install
```

This will:
- Install all required packages (Next.js, TetherTo WDK SDK, @solana/web3.js, etc.)
- Run post-install script to rebuild native modules (sodium-native)

**Note:** If you encounter errors with native modules, run:
```bash
npm rebuild sodium-native
```

### 3. Configure environment (optional)

The app works with defaults, but you can customize:

```bash
# Create .env.local file (optional)
cp .env.example .env.local
```

Edit `.env.local` if you need to change Solana RPC URL or network:
```bash
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=devnet
```

**Default values are provided** - you can skip this step if using devnet.

### 4. Run the development server

```bash
npm run dev
```

You should see output like:
```
▲ Next.js 16.0.7
- Local:        http://localhost:3000
- ready started server on 0.0.0.0:3000
```

### 5. Open in your browser

Open your browser and navigate to:

```
http://localhost:3000
```

The app will be running locally on your machine!

## Running the App

### Development Mode

```bash
npm run dev
```

- Runs on `http://localhost:3000`
- Hot reload enabled (changes reflect immediately)
- Press `Ctrl+C` to stop the server

### Production Build

```bash
# Build the app
npm run build

# Start production server
npm start
```

- Runs on `http://localhost:3000`
- Optimized for performance
- No hot reload

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

## Development Commands

```bash
# Start development server (with hot reload)
npm run dev

# Build for production
npm run build

# Start production server (after build)
npm start

# Run linter
npm run lint

# Rebuild native modules (if needed)
npm rebuild sodium-native
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

