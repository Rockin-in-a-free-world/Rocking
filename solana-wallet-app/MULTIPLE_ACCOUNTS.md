# Multiple Accounts Per Google User

## Question

**Will it break our dashboard to have more than one Solana account controlled by the same seed phrase (Google account)?**

## Answer: **No, it won't break, but we only track one account**

### Current Behavior

1. **MetaMask SDK**: `getAccountSolana()` returns **one account** (likely account index 0)
   - No index parameter → Always returns the default/first account
   - Same Google account → Always returns the same Solana address

2. **Tether WDK SDK**: Supports multiple accounts via `getAccount(index)`, but we always use `getAccount(0)`

3. **Our Dashboard**: Queries transactions for **one address**:
   ```typescript
   const signatures = await connection.getSignaturesForAddress(userSolanaAddress);
   ```

### What This Means

✅ **Safe**: One Google account → One Solana account → One dashboard view

❓ **If multiple accounts exist**: We only see transactions for account 0 (the default)

### BIP-44 Derivation (Standard Solana)

If MetaMask SDK uses standard BIP-44 derivation:
- **Account 0**: `m/44'/501'/0'/0'` ← This is what `getAccountSolana()` returns
- **Account 1**: `m/44'/501'/1'/0'` ← Would need explicit derivation
- **Account 2**: `m/44'/501'/2'/0'` ← Would need explicit derivation

**MetaMask Embedded Wallets SDK's `getAccountSolana()` likely only returns account 0.**

## Impact on Dashboard

### Current Implementation

```typescript
// We get ONE address from MetaMask SDK
const { address } = await embeddedWallet.getAccountSolana();

// We query transactions for THAT address only
const signatures = await connection.getSignaturesForAddress(
  new PublicKey(address)
);
```

**Result**: Dashboard shows transactions for account 0 only.

### If Multiple Accounts Are Created

**Scenario**: User somehow creates multiple Solana accounts from the same seed phrase.

**What happens**:
- ✅ Dashboard still works (shows account 0 transactions)
- ⚠️ Transactions from account 1, 2, etc. are **not shown**
- ⚠️ Metrics only reflect account 0

**This is not a "break"** - it's just incomplete data for that user.

## Recommendation

### For Demo: **Assume One Account Per Google User**

1. **MetaMask SDK behavior**: `getAccountSolana()` returns one account (account 0)
2. **No user-facing way to create multiple accounts** in our app
3. **Dashboard is designed for one account** per user

### If We Need Multi-Account Support Later

**Option 1: Query All Accounts**
```typescript
// Derive all possible accounts from seed phrase
const accounts = [];
for (let i = 0; i < MAX_ACCOUNTS; i++) {
  const account = deriveAccount(seedPhrase, i);
  accounts.push(account);
}

// Query transactions for all accounts
const allSignatures = await Promise.all(
  accounts.map(addr => connection.getSignaturesForAddress(addr))
);
```

**Option 2: Account Selector UI**
```typescript
// Let user select which account to view
const [selectedAccountIndex, setSelectedAccountIndex] = useState(0);
const account = await walletManager.getAccount(selectedAccountIndex);
```

**Option 3: Aggregate Dashboard**
```typescript
// Show combined metrics across all accounts
const allMetrics = await Promise.all(
  accounts.map(addr => getMetricsForAddress(addr))
);
const aggregated = aggregateMetrics(allMetrics);
```

## Conclusion

**For the demo**: ✅ **No changes needed**

- One Google account = One Solana account = One dashboard
- `getAccountSolana()` returns account 0 (the default)
- Dashboard queries that one address
- **No breaking behavior**

**If multiple accounts exist** (unlikely in our demo):
- Dashboard shows account 0 only
- Other accounts' transactions are not shown
- This is incomplete data, not a break

**Future enhancement** (if needed):
- Add account selector UI
- Query multiple accounts
- Aggregate metrics across accounts

