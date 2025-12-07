# App Architecture

## Core Requirements

### Transaction Monitoring
The app must monitor transactions through their entire lifecycle:

1. **Submitted** - Transaction created and signed locally
2. **Broadcast** - Transaction sent to network (verify in mempool)
3. **Confirmed** - Transaction included in block, voted on by validators
4. **Finalized** - Transaction finalized (irreversible)

### Monitoring Implementation

```typescript
// Transaction states
type TransactionState = 
  | 'submitted'    // Created locally
  | 'broadcast'    // In mempool
  | 'confirmed'    // In block, voted
  | 'finalized'    // Irreversible
  | 'failed';      // Error occurred

// Monitor transaction
async function monitorTransaction(signature: string) {
  // 1. Check if in mempool (broadcast)
  // 2. Poll for confirmation
  // 3. Poll for finalization
  // 4. Handle failures/timeouts
}
```

## User Journey Flow

### 1. Landing / Wallet Creation

```
User arrives → Google Sign-on → MetaMask SDK creates multisig wallet key → Check if account exists
  ├─ New user → Terms acceptance → Create account → Dashboard
  └─ Existing user → Dashboard
```

### 2. Dashboard

```
Dashboard displays:
  - Transaction counts (Submitted, Broadcast, Confirmed, Finalized)
  - Status alert (Grand/Good/Gutted)
  - Transaction list
  - Actions (Send, Correct, Close Account)
```

### 3. Transaction Flow

```
User initiates transaction
  → Submit (local)
  → Broadcast (monitor mempool)
  → Confirm (monitor confirmation)
  → Finalize (monitor finalization)
  → Update dashboard
  → Handle failures
```

## Data Storage Strategy

### On-Chain Queries (Primary)
**Most dashboard data is read directly from Solana:**
- Transaction signatures: `getSignaturesForAddress()`
- Transaction status: `getSignatureStatuses()` (broadcast/confirmed/finalized)
- Transaction details: `getTransaction()`
- Metrics: Calculated from on-chain queries

**Refresh Strategy:**
- 30-second polling interval
- Transition icons during refresh
- Real-time updates

### Minimal On-Chain Storage (PDA)
**Only store what's NOT on-chain:**
- User account metadata (Google ID → Solana address)
- Acknowledged failure IDs (user actions)
- **Total: ~1-2KB per user**

### Optional Off-Chain (Ghost/DB)
**For convenience only:**
- User preferences
- UI state
- Cached data (can be regenerated)

See [DASHBOARD_REFRESH.md](./DASHBOARD_REFRESH.md) for refresh implementation details.

## Status Calculation (On-Chain Data Only)

**Simplified MVP Logic:**
- Uses only on-chain transaction data
- No acknowledged failures feature
- Failed transactions trigger permanent "Gutted" status

```typescript
interface TransactionMetrics {
  submitted: number;
  broadcast: number;
  confirmed: number;
  finalized: number;
  failed: number;
}

function calculateStatus(metrics: TransactionMetrics): 'Grand' | 'Good' | 'Gutted' {
  const { submitted, confirmed, finalized, failed } = metrics;
  
  if (submitted === 0) {
    return 'Good'; // No transactions yet
  }
  
  // Gutted: Any failed transaction (permanent status - user can't recover)
  if (failed > 0) {
    return 'Gutted';
  }
  
  // Grand: All transactions finalized (no failures)
  if (finalized === submitted) {
    return 'Grand';
  }
  
  // Good: All transactions confirmed (no failures, but not all finalized)
  if (confirmed === submitted) {
    return 'Good';
  }
  
  // Default: Some transactions still pending (not all confirmed yet)
  return 'Good';
}
```

**Status Definitions:**
- **Grand**: All transactions finalized (no failures)
- **Good**: All transactions confirmed (no failures, but some may still be finalizing)
- **Gutted**: Any failed transaction (permanent - user cannot recover from this status)

## Components Needed

### 1. Wallet Creation Components
- `GoogleSignInButton` (creates wallet via multisig)
- `TermsAcceptanceModal`
- `WalletGuard`

### 2. Dashboard Components
- `TransactionMetrics`
- `StatusAlert` (with cartoon icons)
- `TransactionList`
- `TransactionCard`

### 3. Transaction Components
- `TransactionMonitor` (polling service)
- `TransactionStatusBadge`
- `CorrectTransactionButton`
- `AcknowledgeFailureButton` (new: user acknowledges failed transactions)

### 4. Account Components
- `CloseAccountModal`

### 5. Feemaster Admin App (Integrated)
- `FeemasterLogin` (seed phrase input or generate new)
  - Two modes: Setup (new) or Login (existing)
  - Confirmation checkbox (only when generating new)
  - Button: "Gmail login"
- `FeemasterDashboard`
  - Account info: Wallet address with copy button, balance
  - Operations: Check balance, View/Hide private key, Get Devnet SOL (programmatic airdrop)
  - Rent payment queue (pending users)
- Temporary sessionStorage for seed phrase (enables immediate dashboard access)
- API endpoints accept seed phrase from request body (fallback to env vars)

## API Routes

### `/api/auth/google`
- Handle Google OAuth callback
- Create/retrieve user account
- Return session token

### `/api/transactions`
- Submit transaction
- Get transaction status
- List user transactions
- Acknowledge failed transaction (POST `/api/transactions/:id/acknowledge`)

### `/api/metrics`
- Get dashboard metrics
- Real-time updates (WebSocket or polling)

### `/api/account`
- Close account

### Feemaster Admin App (Integrated Routes)
- `/feemaster` - Login page
  - Enter seed phrase (accesses existing wallet) OR leave empty (generates new)
  - Confirmation checkbox (only when generating new)
  - Button: "Gmail login"
- `/feemaster/dashboard` - Admin dashboard
  - Wallet address display with copy button
  - Automatic balance loading
  - Programmatic airdrop (no GitHub auth)
  - Toggle private key display
  - Rent payment queue
- API Routes:
  - `POST /api/feemaster/setup` - Setup/login (creates or accesses wallet)
  - `POST /api/feemaster/balance` - Get balance (accepts seed phrase from body)
  - `POST /api/feemaster/private-key` - Get private key (accepts seed phrase from body)
  - `POST /api/feemaster/airdrop` - Request airdrop (programmatic, no GitHub auth)

## State Management

Consider using:
- **React Context** for auth state
- **React Query** for transaction data
- **WebSocket** or **Server-Sent Events** for real-time updates

## Error Handling

- Network failures → Retry with exponential backoff
- Transaction failures → Show in dashboard, allow correction
- Wallet creation failures → Redirect to wallet creation
- Storage failures → Fallback to local storage

