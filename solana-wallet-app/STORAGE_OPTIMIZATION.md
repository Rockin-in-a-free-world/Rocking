# Storage Optimization: Do We Need Google ID → Solana Address Mapping?

## The Question

If the Solana address is already linked to the Google ID through MetaMask SDK, do we need to store the mapping in our on-chain account?

## Analysis

### How It Works

1. **User signs in with Google** → MetaMask SDK authenticates
2. **MetaMask SDK returns Solana address** → Same address for same Google account (deterministic)
3. **We derive PDA using Google ID** → `findProgramAddressSync([Buffer.from("user_account"), Buffer.from(googleUserId)])`
4. **We can always get Solana address** → By calling MetaMask SDK with the same Google account

### Do We Need to Store the Mapping?

**Arguments FOR storing:**
- ✅ Faster lookups (don't need to call MetaMask SDK)
- ✅ Verification (ensure address matches)
- ✅ Offline access (if MetaMask SDK unavailable)
- ✅ Historical record

**Arguments AGAINST storing:**
- ❌ Redundant (always derivable from Google account)
- ❌ Wastes storage space (44 bytes)
- ❌ Can get stale if user changes wallet
- ❌ Adds complexity

## Recommended Approach

### Option 1: Don't Store Mapping (Recommended)

**If Solana address is deterministic from Google account:**

```typescript
interface UserAccountData {
  // Header (simplified, no Solana address)
  version: u8;                     // 1 byte
  googleUserId: string[48];       // 48 bytes - Used to derive PDA
  createdAt: i64;                 // 8 bytes
  closedAt: i64;                  // 8 bytes
  isFeemaster: u8;                // 1 byte
  flags: u8;                       // 1 byte
  padding: u8[5];                  // 5 bytes padding
  
  // Metrics, acknowledged failures, etc.
  // Total: ~67 bytes header (saves 44 bytes!)
}
```

**Benefits:**
- Saves 44 bytes per account
- Always get fresh address from MetaMask SDK
- No risk of stale data
- Simpler data structure

**How to get Solana address:**
```typescript
// Always derive from Google account via MetaMask SDK
const solanaAccount = await embeddedWallet.getAccountSolana();
const solanaAddress = solanaAccount.address; // Always current
```

### Option 2: Store for Verification (Optional)

**If you want to verify/validate:**

```typescript
interface UserAccountData {
  googleUserId: string[48];
  solanaAddress: string[44];      // Store for verification only
  // ... rest
}
```

**Use case:**
- Verify the address matches what MetaMask SDK returns
- Detect if user changed wallet
- Historical record

## PDA Derivation

The PDA is derived from Google ID, not Solana address:

```typescript
// PDA is derived from Google ID
const [userPDA] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("user_account"),
    Buffer.from(googleUserId), // Google ID, not Solana address
  ],
  programId
);
```

**Why this works:**
- Google ID is the unique identifier
- Solana address is derivable from Google account
- PDA lookup uses Google ID (what we have from auth)

## Updated Storage Structure

### Without Mapping (Recommended)

```typescript
interface UserAccountData {
  // Header (67 bytes - no Solana address)
  version: u8;                     // 1 byte
  googleUserId: string[48];       // 48 bytes
  createdAt: i64;                 // 8 bytes
  closedAt: i64;                  // 8 bytes
  isFeemaster: u8;                // 1 byte
  flags: u8;                       // 1 byte
  
  // Metrics Cache (24 bytes)
  submittedCount: u32;
  broadcastCount: u32;
  confirmedCount: u32;
  finalizedCount: u32;
  failedCount: u32;
  acknowledgedFailuresCount: u32;
  
  // Acknowledged Failures (8,802 bytes)
  acknowledgedCount: u16;
  acknowledgedFailureIds: string[100][88];
  
  // Recent Transactions (882 bytes)
  recentTransactionCount: u16;
  recentTransactionIds: string[10][88];
  
  // Total: 67 + 24 + 8,802 + 882 = 9,775 bytes ✅ More space available!
}
```

## Implementation

### Getting Solana Address

```typescript
// Always get from MetaMask SDK (no storage needed)
async function getSolanaAddress(googleUserId: string): Promise<string> {
  // Authenticate with same Google account
  await embeddedWallet.authenticate({ provider: 'google' });
  
  // Get Solana address (always same for same Google account)
  const solanaAccount = await embeddedWallet.getAccountSolana();
  return solanaAccount.address;
}
```

### PDA Lookup

```typescript
// Lookup PDA using Google ID (what we have from auth)
function getUserPDA(googleUserId: string): PublicKey {
  const [userPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("user_account"), Buffer.from(googleUserId)],
    programId
  );
  return userPDA;
}
```

## Conclusion

**You don't need to store the mapping** if:
- ✅ Solana address is deterministic from Google account
- ✅ You can always get it from MetaMask SDK
- ✅ You want to save storage space

**You might want to store it** if:
- ❓ You need offline access
- ❓ You want to verify/validate
- ❓ You need historical records

**Recommendation**: Don't store it. Always derive from MetaMask SDK. Saves 44 bytes and keeps data fresh.

