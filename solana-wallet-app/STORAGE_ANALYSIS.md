# Storage Analysis: On-Chain vs Off-Chain

## Data Requirements

### What We Need to Store

1. **User Account Data**
   - Google user ID (string, ~30 bytes)
   - Solana address (base58, ~44 bytes)
   - Created timestamp (8 bytes)
   - Closed timestamp (8 bytes, nullable)
   - Is feemaster flag (1 byte)
   - **Total: ~91 bytes per user**

2. **Transaction Records**
   - Transaction ID/signature (88 bytes for base58 signature)
   - State (enum, 1 byte)
   - Submitted timestamp (8 bytes)
   - Broadcast timestamp (8 bytes, nullable)
   - Confirmed timestamp (8 bytes, nullable)
   - Finalized timestamp (8 bytes, nullable)
   - Failed timestamp (8 bytes, nullable)
   - Acknowledged timestamp (8 bytes, nullable)
   - Error message (string, variable, ~100 bytes average)
   - Amount (8 bytes, nullable)
   - Recipient (44 bytes, nullable)
   - **Total: ~281 bytes per transaction (with all fields)**

3. **Dashboard Metrics (Derived, but could cache)**
   - Submitted count (4 bytes)
   - Broadcast count (4 bytes)
   - Confirmed count (4 bytes)
   - Finalized count (4 bytes)
   - Failed count (4 bytes)
   - Acknowledged failures count (4 bytes)
   - **Total: ~24 bytes**

## 10KB Storage Analysis

### Capacity Calculation

**10KB = 10,240 bytes**

**Per User Account:** ~91 bytes
**Per Transaction:** ~281 bytes

**Maximum Transactions per Account:**
```
(10,240 - 91) / 281 = ~36 transactions
```

### Is 10KB Enough for Demo?

**For a demo: YES, but with limitations:**

✅ **Sufficient for:**
- Single user account data
- ~30-35 transaction records
- Basic metrics caching
- Acknowledged failures tracking

❌ **Limitations:**
- Can't store full transaction history (limited to ~35 transactions)
- Need to implement transaction pruning/archiving
- Error messages must be truncated
- Can't store detailed transaction metadata

## Storage Strategy Options

### Option 1: Store All Data On-Chain (10KB Account)

**Pros:**
- Fully decentralized
- No external dependencies
- Immutable history

**Cons:**
- Limited to ~35 transactions
- Need pruning strategy
- Higher rent costs
- Complex data management

**Implementation:**
```typescript
// Store in PDA (Program Derived Address)
interface OnChainUserData {
  account: UserAccount;           // 91 bytes
  transactions: Transaction[];     // ~281 bytes each
  metrics: TransactionMetrics;    // 24 bytes
  // Total: 91 + (n * 281) + 24 <= 10,240
}
```

### Option 2: Hybrid Approach (Recommended for Demo)

**Store on-chain:**
- User account data (91 bytes)
- Recent transactions (last 20-30, ~6-8KB)
- Current metrics (24 bytes)
- Acknowledged failures list (transaction IDs only, ~88 bytes each)

**Store off-chain (Ghost/DB):**
- Full transaction history
- Detailed error messages
- Historical metrics
- Archived transactions

**Pros:**
- On-chain: Critical data is decentralized
- Off-chain: Unlimited history
- Best of both worlds

**Cons:**
- More complex implementation
- Two storage systems to manage

### Option 3: Minimal On-Chain + Off-Chain

**Store on-chain (minimal):**
- User account data (91 bytes)
- Acknowledged failure IDs only (88 bytes each)
- Current status (1 byte: Grand/Good/Gutted)

**Store off-chain:**
- All transaction data
- Full history
- Metrics

**Pros:**
- Very small on-chain footprint
- Can store many acknowledged failures
- Simple on-chain structure

**Cons:**
- Most data is off-chain
- Less decentralized

## Recommended Approach for Demo

### Minimal On-Chain Storage + Real-Time On-Chain Queries

**Key Insight:** Most dashboard data is already on-chain! We just need to query it.

**On-Chain (Minimal PDA, ~1-2KB):**
```typescript
interface OnChainData {
  userAccount: UserAccount;              // 91 bytes
  acknowledgedFailureIds: string[];       // Transaction signatures only (~88 bytes each)
  // Can store 100+ acknowledged failures in ~9KB
  // Total: ~1-2KB for typical usage
}
```

**Real-Time On-Chain Queries (No Storage Needed):**
- Transaction signatures → Query via `getSignaturesForAddress`
- Transaction status → Query via `getSignatureStatuses` (broadcast, confirmed, finalized)
- Transaction details → Query via `getTransaction`
- All metrics → Calculated from on-chain queries

**Off-Chain (Optional, for convenience):**
- User preferences
- UI state
- Cached data (optional, can be regenerated)

## Implementation Details

### On-Chain Storage Structure

```typescript
// Solana account data structure
class UserDataAccount {
  // Account header
  version: u8;                    // 1 byte
  userAccount: UserAccount;        // 91 bytes
  metrics: TransactionMetrics;     // 24 bytes
  
  // Transaction storage (circular buffer)
  transactionCount: u16;          // 2 bytes
  transactions: Transaction[20];   // 20 * 281 = 5,620 bytes
  
  // Acknowledged failures (signatures only)
  acknowledgedCount: u16;          // 2 bytes
  acknowledgedIds: string[20];    // 20 * 88 = 1,760 bytes
  
  // Total: ~7.5KB
}
```

### Transaction Pruning Strategy

When account is full (20 transactions):
1. Archive oldest transaction to off-chain
2. Remove from on-chain array
3. Add new transaction
4. Update metrics

### Rent Cost Estimate

**10KB account rent-exempt minimum:**
- ~0.001 SOL (approximately)
- One-time cost to make account rent-exempt
- No ongoing rent deductions

## Conclusion

**10KB is sufficient for a demo** if we:
1. Limit on-chain to recent transactions (~20-30)
2. Store full history off-chain
3. Use efficient data structures
4. Implement transaction pruning

**For production**, consider:
- Larger accounts (if needed)
- State compression
- Off-chain storage with on-chain references
- Program-derived accounts for scalability

