# TypeScript Types

## Transaction States

```typescript
type TransactionState = 
  | 'submitted'    // Created and signed locally
  | 'broadcast'    // In mempool
  | 'confirmed'    // In block, voted
  | 'finalized'    // Irreversible
  | 'failed'       // Error occurred
  | 'acknowledged'; // User acknowledged failure
```

## Transaction Metrics

```typescript
interface TransactionMetrics {
  submitted: number;           // Total transactions submitted
  broadcast: number;           // Transactions in mempool
  confirmed: number;            // Transactions confirmed
  finalized: number;           // Transactions finalized
  failed: number;              // Transactions that failed
  acknowledgedFailures: number; // User-acknowledged failures
}

interface Transaction {
  id: string;
  signature: string | null;    // Transaction signature (null if not broadcast)
  state: TransactionState;
  submittedAt: Date;
  broadcastAt: Date | null;
  confirmedAt: Date | null;
  finalizedAt: Date | null;
  failedAt: Date | null;
  acknowledgedAt: Date | null;
  error?: string;              // Error message if failed
  amount?: number;             // Transaction amount (lamports)
  recipient?: string;          // Recipient address
}
```

## Status Types

```typescript
type Status = 'Grand' | 'Good' | 'Gutted';

interface StatusInfo {
  status: Status;
  message: string;
  icon: string;  // Cartoon icon name
  color: 'green' | 'yellow' | 'red';
}
```

## User Account

```typescript
interface UserAccount {
  id: string;                  // Google user ID
  email: string;
  solanaAddress: string;      // Derived Solana address
  seedPhrase?: string;         // Only in dev mode (.env)
  createdAt: Date;
  closedAt: Date | null;      // If account is closed
  isFeemaster: boolean;        // Can pay fees for others
}
```

## Dashboard Data

```typescript
interface DashboardData {
  metrics: TransactionMetrics;
  status: StatusInfo;
  transactions: Transaction[];
  recentTransactions: Transaction[]; // Last 10
  unacknowledgedFailures: Transaction[]; // Failed but not acknowledged
}
```

