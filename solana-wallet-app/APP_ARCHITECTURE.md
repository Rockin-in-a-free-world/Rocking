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

## Status Calculation

```typescript
interface TransactionMetrics {
  submitted: number;
  broadcast: number;
  confirmed: number;
  finalized: number;
  acknowledgedFailures: number; // User-acknowledged failures
}

function calculateStatus(metrics: TransactionMetrics): 'Grand' | 'Good' | 'Gutted' {
  const { submitted, confirmed, finalized, acknowledgedFailures } = metrics;
  
  if (submitted === 0) {
    return 'Good'; // No transactions yet
  }
  
  // Grand: All transactions finalized OR acknowledged as failed
  if (finalized + acknowledgedFailures === submitted) {
    return 'Grand';
  }
  
  // Good: All transactions confirmed OR acknowledged as failed
  if (confirmed + acknowledgedFailures === submitted) {
    return 'Good';
  }
  
  // Gutted: Some transactions failed and NOT acknowledged
  return 'Gutted';
}
```

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

### 5. Feemaster Admin App (Separate)
- `FeemasterLogin` (seed phrase input)
- `FeemasterDashboard`
- `AccountInfo` (public key, balance)
- `PrivateKeyDisplay` (view private key for funding)
- `RentPaymentQueue` (sign transactions to pay user rent)

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

### Feemaster Admin App (Separate App)
- Login with seed phrase (client-side only)
- View account info and private key
- Sign rent payment transactions
- Monitor rent payment queue

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

