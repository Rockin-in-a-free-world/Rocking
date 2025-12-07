# Dashboard Refresh Strategy

## Real-Time Data Updates

Since most dashboard data is on-chain, we can query it directly without storing it.

## Refresh Mechanism

### Polling Strategy

**30-second polling interval** to refresh all dashboard data:

```typescript
// Refresh all metrics every 30 seconds
const REFRESH_INTERVAL = 30000; // 30 seconds

useEffect(() => {
  const interval = setInterval(() => {
    refreshDashboardData();
  }, REFRESH_INTERVAL);
  
  return () => clearInterval(interval);
}, []);
```

### Data Sources

1. **Transaction List**
   - Query: `getSignaturesForAddress(userSolanaAddress)`
   - Returns: Array of transaction signatures
   - Updates: Every 30s

2. **Transaction Status (Broadcast/Confirmed/Finalized)**
   - Query: `getSignatureStatuses(signatures[])`
   - Returns: Status for each transaction
   - Updates: Every 30s

3. **Transaction Details**
   - Query: `getTransaction(signature)`
   - Returns: Full transaction data
   - Updates: On-demand or every 30s

4. **Metrics Calculation**
   - Calculate from transaction statuses
   - No storage needed, computed in real-time

## UI Transition States

### Loading States Per Metric

Each metric shows a transition state while refreshing:

```typescript
interface MetricDisplay {
  value: number;
  isLoading: boolean;
  transitionIcon: string; // Spinning/loading icon
}
```

### Transition Icons

- **Submitted Count**: 🔄 (spinning) → Final number
- **Broadcast Count**: 🔄 → Final number
- **Confirmed Count**: 🔄 → Final number
- **Finalized Count**: 🔄 → Final number
- **Status Alert**: 🔄 → Grand/Good/Gutted icon

### Visual Feedback

```tsx
<MetricCard>
  {isLoading ? (
    <Spinner icon="🔄" />
  ) : (
    <Value>{count}</Value>
  )}
</MetricCard>
```

## Implementation

### Dashboard Component

```typescript
function Dashboard() {
  const [metrics, setMetrics] = useState<TransactionMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  const refreshData = async () => {
    setIsLoading(true);
    
    // 1. Get all transaction signatures for user
    const signatures = await connection.getSignaturesForAddress(
      userSolanaAddress
    );
    
    // 2. Get status for all transactions
    const statuses = await connection.getSignatureStatuses(
      signatures.map(s => s.signature)
    );
    
    // 3. Calculate metrics
    const calculatedMetrics = calculateMetrics(signatures, statuses);
    
    // 4. Get acknowledged failures from on-chain
    const acknowledgedFailures = await getAcknowledgedFailures(userPDA);
    
    // 5. Calculate status
    const status = calculateStatus(calculatedMetrics, acknowledgedFailures);
    
    setMetrics(calculatedMetrics);
    setTransactions(parseTransactions(signatures, statuses));
    setIsLoading(false);
  };
  
  // Initial load
  useEffect(() => {
    refreshData();
  }, []);
  
  // Polling
  useEffect(() => {
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <Dashboard>
      <MetricsDisplay metrics={metrics} isLoading={isLoading} />
      <StatusAlert status={status} isLoading={isLoading} />
      <TransactionList transactions={transactions} />
    </Dashboard>
  );
}
```

### Metrics Calculation

```typescript
function calculateMetrics(
  signatures: SignatureInfo[],
  statuses: (SignatureStatus | null)[]
): TransactionMetrics {
  let submitted = signatures.length;
  let broadcast = 0;
  let confirmed = 0;
  let finalized = 0;
  let failed = 0;
  
  statuses.forEach((status, index) => {
    if (!status) {
      // Transaction not found (might be too old or invalid)
      failed++;
      return;
    }
    
    if (status.err) {
      failed++;
      return;
    }
    
    // Check commitment levels
    if (status.confirmationStatus === 'finalized') {
      finalized++;
      confirmed++;
      broadcast++;
    } else if (status.confirmationStatus === 'confirmed') {
      confirmed++;
      broadcast++;
    } else {
      // In mempool (broadcast but not confirmed)
      broadcast++;
    }
  });
  
  return {
    submitted,
    broadcast,
    confirmed,
    finalized,
    failed,
    acknowledgedFailures: 0 // Will be added from on-chain
  };
}
```

## On-Chain Storage (Minimal)

### What We Store On-Chain

**Only user actions that aren't on-chain:**
- Acknowledged failure IDs (user clicked "acknowledge")
- User account metadata (Google ID → Solana address mapping)

**What We DON'T Store:**
- Transaction signatures (on-chain)
- Transaction status (on-chain)
- Metrics (calculated from on-chain)
- Transaction details (on-chain)

### On-Chain Data Structure

```typescript
// PDA account data (~1-2KB)
interface OnChainUserData {
  googleUserId: string;              // ~30 bytes
  solanaAddress: string;              // ~44 bytes
  acknowledgedFailureIds: string[];   // ~88 bytes each
  // Can store 100+ acknowledged failures
}
```

## Performance Considerations

### Caching Strategy

- Cache transaction signatures locally (session storage)
- Only refresh statuses, not full transaction data
- Debounce rapid refreshes

### Optimization

```typescript
// Only refresh if data changed
const [lastRefreshHash, setLastRefreshHash] = useState('');

const refreshData = async () => {
  const data = await fetchAllData();
  const hash = hashData(data);
  
  if (hash !== lastRefreshHash) {
    setMetrics(data);
    setLastRefreshHash(hash);
  }
};
```

## User Experience

### Loading States

1. **Initial Load**: Show skeleton/spinner for all metrics
2. **Refresh**: Show transition icon (🔄) on each metric
3. **Update**: Smooth transition to new values
4. **No Change**: No visual update if data unchanged

### Error Handling

- If RPC fails: Show cached data + error indicator
- If timeout: Retry with exponential backoff
- If rate limited: Increase polling interval

## Summary

✅ **On-Chain Queries**: All transaction data read directly from Solana  
✅ **30s Polling**: Automatic refresh every 30 seconds  
✅ **Transition Icons**: Visual feedback during refresh  
✅ **Minimal Storage**: Only acknowledged failures + user metadata on-chain  
✅ **Real-Time**: Always shows current on-chain state  

