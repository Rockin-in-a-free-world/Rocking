# Status Logic - MVP (On-Chain Data Only)

## Simplified Status Logic

**For MVP, we use only on-chain transaction data. No acknowledged failures feature.**

## Status Definitions

### Grand 😊
- **Condition**: All transactions finalized (no failures)
- **Meaning**: Perfect state - all transactions completed successfully
- **Color**: Green

### Good 😃
- **Condition**: All transactions confirmed (no failures, but not all finalized)
- **Meaning**: All transactions are progressing well, some may still be finalizing
- **Color**: Yellow
- **Note**: Transactions in mempool (broadcast) or confirmed but not finalized are still OK

### Gutted 😢
- **Condition**: Any failed transaction
- **Meaning**: One or more transactions failed (permanent status)
- **Color**: Red
- **Important**: User cannot recover from "Gutted" status once a transaction fails

## Implementation

```typescript
function calculateStatus(metrics: TransactionMetrics): 'Grand' | 'Good' | 'Gutted' {
  const { submitted, confirmed, finalized, failed } = metrics;
  
  if (submitted === 0) {
    return 'Good'; // No transactions yet
  }
  
  // Gutted: Any failed transaction (permanent status)
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

## Transaction States Flow

```
Submitted → Broadcast → Confirmed → Finalized
   ↓           ↓            ↓           ↓
  (all)    (in mempool)  (voted)   (irreversible)
   
   ↓ (if fails)
Failed → Permanent "Gutted" status
```

## Key Differences from Original Design

### Removed:
- ❌ Acknowledged failures feature
- ❌ User ability to recover from "Gutted" status
- ❌ On-chain storage for user actions

### Simplified:
- ✅ Status based purely on on-chain transaction data
- ✅ No user interaction needed for status calculation
- ✅ Simpler implementation (no storage needed)

## Examples

### Example 1: All Successful
- Submitted: 5
- Broadcast: 0
- Confirmed: 5
- Finalized: 5
- Failed: 0
- **Status**: Grand 😊

### Example 2: Some Still Finalizing
- Submitted: 5
- Broadcast: 0
- Confirmed: 5
- Finalized: 3
- Failed: 0
- **Status**: Good 😃

### Example 3: One Failed Transaction
- Submitted: 5
- Broadcast: 0
- Confirmed: 4
- Finalized: 4
- Failed: 1
- **Status**: Gutted 😢 (permanent)

### Example 4: Transactions in Mempool
- Submitted: 5
- Broadcast: 2
- Confirmed: 3
- Finalized: 3
- Failed: 0
- **Status**: Good 😃

## Why This Simplification?

1. **MVP Focus**: Reduce complexity for initial release
2. **No Storage Needed**: Works entirely with on-chain data
3. **Clear Status**: Simple, unambiguous status indicators
4. **No User Actions**: Status is automatic based on transaction states

## Future Enhancements

If we want to add acknowledged failures later:
- User can acknowledge failed transactions
- Acknowledged failures don't trigger "Gutted" status
- Requires on-chain storage (PDA accounts)
- Feemaster pays rent for storage

