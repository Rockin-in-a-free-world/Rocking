# Status Logic Review

## Current Proposed Logic

**Grand:** Finalized = Submitted  
**Good:** Finalised = Submitted + Broadcast + Confirmed  
**Gutted:** Finalised != Submitted + Broadcast + Confirmed

## Issue with Current Logic

The "Good" condition doesn't make mathematical sense:
- If Finalized = Submitted + Broadcast + Confirmed, that would mean Finalized > Submitted (impossible)
- A transaction can only be finalized if it was first submitted, broadcast, and confirmed

## Recommended Logic

### Option 1: Count-based with Acknowledged Failures (Recommended)

**Key Concept:** Users can acknowledge failed transactions. Acknowledged failures don't count against status.

- **Grand:** `Finalized count + AcknowledgedFailures count = Submitted count`
  - All transactions either succeeded (finalized) OR were acknowledged as failed
  - Perfect state: user has handled all transactions
  
- **Good:** `Confirmed count + AcknowledgedFailures count = Submitted count`
  - All transactions either reached confirmed OR were acknowledged as failed
  - Some confirmed transactions may still be finalizing → still OK
  - Some may be in mempool (broadcast) but not yet confirmed → still OK
  
- **Gutted:** `Confirmed count + AcknowledgedFailures count < Submitted count`
  - Some transactions failed and are NOT acknowledged
  - User needs to review and acknowledge failures
  - Unacknowledged failures indicate unresolved issues

### Option 2: Percentage-based
- **Grand:** `Finalized / Submitted = 100%`
- **Good:** `Confirmed / Submitted ≥ 90%` (most succeeded)
- **Gutted:** `Finalized / Submitted < 90%` (significant failures)

### Option 3: State-based
- **Grand:** All submitted transactions are finalized
- **Good:** All submitted transactions are at least confirmed (some may be finalizing)
- **Gutted:** Some submitted transactions failed or are stuck

## Transaction States Flow

```
Submitted → Broadcast → Confirmed → Finalized
   ↓           ↓            ↓           ↓
  (all)    (in mempool)  (voted)   (irreversible)
```

A transaction can be:
- **Submitted**: Created and signed locally
- **Broadcast**: Sent to network (in mempool)
- **Confirmed**: Included in block, voted on by validators
- **Finalized**: Highest certainty, effectively irreversible
- **Failed**: Transaction failed (stuck, rejected, or error)
- **AcknowledgedFailure**: User has acknowledged the failure

## Recommended Implementation

Use **Option 1** with acknowledged failures:

```typescript
function calculateStatus(metrics: TransactionMetrics): 'Grand' | 'Good' | 'Gutted' {
  const { 
    submitted, 
    confirmed, 
    finalized, 
    acknowledgedFailures 
  } = metrics;
  
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

## Transaction States & Acknowledgment Flow

```
Submitted → Broadcast → Confirmed → Finalized
   ↓           ↓            ↓           ↓
  (all)    (in mempool)  (voted)   (irreversible)
   
   ↓ (if fails)
Failed → User acknowledges → AcknowledgedFailure
```

## Status Logic Explained

- **Grand**: All transactions handled (finalized OR acknowledged)
  - Perfect state: user has reviewed and acknowledged any failures
  
- **Good**: All transactions progressing (confirmed OR acknowledged)
  - Transactions in mempool (broadcast) are still OK
  - Transactions confirmed but not finalized are still OK
  - Failed transactions that are acknowledged are OK
  
- **Gutted**: Unacknowledged failures exist
  - Some transactions failed and user hasn't acknowledged them
  - User needs to review and acknowledge failures
  - Dashboard should highlight unacknowledged failures

## User Interaction

When a transaction fails:
1. Dashboard shows failed transaction
2. User clicks "I acknowledge this transaction failed"
3. Failure is recorded as `acknowledgedFailure`
4. Status recalculates (may move from "Gutted" to "Good" or "Grand")
5. Acknowledged failures are tracked separately from active failures

