# Storage Design: 10KB Per Account

## Architecture

Each user account gets its own **10KB Program Derived Address (PDA)** on Solana.

## On-Chain Data Structure (10KB PDA)

```typescript
interface UserAccountData {
  // Header (116 bytes)
  version: u8;                    // 1 byte - Account version
  googleUserId: string[50];       // 50 bytes - Google user ID
  solanaAddress: string[44];      // 44 bytes - Solana wallet address
  createdAt: i64;                 // 8 bytes - Creation timestamp
  closedAt: i64;                  // 8 bytes - Closed timestamp (0 if active)
  isFeemaster: u8;                // 1 byte - Feemaster flag
  
  // Metrics Cache (24 bytes)
  submittedCount: u32;            // 4 bytes
  broadcastCount: u32;            // 4 bytes
  confirmedCount: u32;             // 4 bytes
  finalizedCount: u32;             // 4 bytes
  failedCount: u32;                // 4 bytes
  acknowledgedFailuresCount: u32;  // 4 bytes
  
  // Acknowledged Failures (up to 100 signatures)
  acknowledgedCount: u16;          // 2 bytes - Number of acknowledged failures
  acknowledgedFailureIds: string[100][88]; // 8,800 bytes (100 × 88 bytes)
  
  // Recent Transaction Signatures (last 15 for quick access)
  recentTransactionCount: u16;    // 2 bytes
  recentTransactionIds: string[15][88]; // 1,320 bytes (15 × 88 bytes)
  
  // Reserved space for future use
  reserved: u8[700];               // 700 bytes buffer
  
  // Total: ~10,962 bytes (slightly over, need to optimize)
}
```

## Optimized Structure (Fits in 10KB)

```typescript
interface UserAccountData {
  // Header (67 bytes - no Solana address needed)
  version: u8;                     // 1 byte
  googleUserId: string[48];        // 48 bytes - Used to derive PDA
  createdAt: i64;                 // 8 bytes
  closedAt: i64;                  // 8 bytes
  isFeemaster: u8;                // 1 byte
  flags: u8;                       // 1 byte (reserved flags)
  
  // Note: Solana address NOT stored - always derivable from Google account via MetaMask SDK
  // Saves 44 bytes! Always get fresh address: await embeddedWallet.getAccountSolana()
  
  // Metrics Cache (24 bytes)
  submittedCount: u32;             // 4 bytes
  broadcastCount: u32;              // 4 bytes
  confirmedCount: u32;              // 4 bytes
  finalizedCount: u32;              // 4 bytes
  failedCount: u32;                 // 4 bytes
  acknowledgedFailuresCount: u32;   // 4 bytes
  
  // Acknowledged Failures (up to 100 signatures)
  acknowledgedCount: u16;           // 2 bytes
  acknowledgedFailureIds: string[100][88]; // 8,800 bytes
  
  // Recent Transaction Signatures (last 10 for quick access)
  recentTransactionCount: u16;     // 2 bytes
  recentTransactionIds: string[10][88]; // 880 bytes
  
  // Total: 67 + 24 + 8,802 + 882 = 9,775 bytes ✅ Fits in 10KB with 225 bytes buffer!
}
```

## PDA Derivation

```typescript
// Derive PDA for each user
const [userPDA] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("user_account"),
    Buffer.from(googleUserId), // Unique per user
  ],
  programId
);
```

## Data Operations

### Initialize Account
```typescript
async function initializeUserAccount(
  googleUserId: string,
  feemasterAccount: PublicKey // Feemaster pays rent for new accounts
  // Note: No solanaAddress needed - always derivable from Google account
): Promise<PublicKey> {
  const [userPDA] = deriveUserPDA(googleUserId);
  
  // Feemaster pays rent before account creation
  // See FEEMASTER_ACCOUNT.md for rent payment implementation
  
  // Create account with 10KB space
  // Solana address not stored - always get from MetaMask SDK
  await program.methods
    .initializeUserAccount(googleUserId)
    .accounts({
      userAccount: userPDA,
      user: wallet.publicKey,
      feemaster: feemasterAccount, // Feemaster pays rent
    })
    .rpc();
    
  return userPDA;
}
```

**Note:** The feemaster account pays rent for new user accounts. See [FEEMASTER_ACCOUNT.md](./FEEMASTER_ACCOUNT.md) for details on the feemaster admin app and rent payment system.

### Update Acknowledged Failures
```typescript
async function acknowledgeFailure(
  userPDA: PublicKey,
  transactionSignature: string
): Promise<void> {
  await program.methods
    .acknowledgeFailure(transactionSignature)
    .accounts({
      userAccount: userPDA,
      user: wallet.publicKey,
    })
    .rpc();
}
```

### Update Metrics Cache
```typescript
async function updateMetricsCache(
  userPDA: PublicKey,
  metrics: TransactionMetrics
): Promise<void> {
  await program.methods
    .updateMetrics(metrics)
    .accounts({
      userAccount: userPDA,
      user: wallet.publicKey,
    })
    .rpc();
}
```

### Read Account Data
```typescript
async function getUserAccountData(
  userPDA: PublicKey
): Promise<UserAccountData> {
  const account = await program.account.userAccount.fetch(userPDA);
  return account;
}
```

## Storage Limits

- **Acknowledged Failures**: Up to 100 signatures (8,800 bytes)
- **Recent Transactions**: Last 10 signatures (880 bytes)
- **User Metadata**: 67 bytes (no Solana address - always derivable)
- **Metrics Cache**: 24 bytes
- **Total**: 9,775 bytes (fits in 10KB with 225 bytes buffer)

## Why We Don't Store Solana Address

**The Solana address is linked to the Google ID through MetaMask SDK:**
- Same Google account → Same Solana address (deterministic)
- Always derivable by calling `embeddedWallet.getAccountSolana()`
- No need to store redundant data
- Saves 44 bytes per account

**How to get Solana address:**
```typescript
// Always get from MetaMask SDK (no storage needed)
await embeddedWallet.authenticate({ provider: 'google' });
const { address } = await embeddedWallet.getAccountSolana();
// This address is always the same for the same Google account
```

## Pruning Strategy

When acknowledged failures reach 100:
1. Archive oldest 20 to off-chain (optional)
2. Remove from on-chain array
3. Add new acknowledgments

When recent transactions reach 10:
1. Remove oldest transaction
2. Add new transaction
3. Full history still available via `getSignaturesForAddress()`

## Rent Cost

**10KB account rent-exempt minimum:**
- ~0.001 SOL (approximately)
- One-time cost per user account
- No ongoing rent deductions

## Benefits

✅ **Per-User Isolation**: Each user has their own account  
✅ **Decentralized**: Data stored on Solana blockchain  
✅ **Immutable**: Account history is permanent  
✅ **Efficient**: Only store what's needed  
✅ **Scalable**: Can handle 100+ acknowledged failures per user  

