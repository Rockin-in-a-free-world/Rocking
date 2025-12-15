/**
 * Transaction states
 */
export type TransactionState = 
  | 'submitted'    // Created locally
  | 'broadcast'    // In mempool
  | 'confirmed'    // In block, voted
  | 'finalized'    // Irreversible
  | 'failed';      // Error occurred

/**
 * Transaction metrics (on-chain data only)
 */
export interface TransactionMetrics {
  submitted: number;
  broadcast: number;
  confirmed: number;
  finalized: number;
  failed: number;
}

/**
 * Dashboard status
 */
export type Status = 'Grand' | 'Good' | 'Gutted';

/**
 * Transaction information
 */
export interface Transaction {
  signature: string;
  state: TransactionState;
  timestamp: number;
  error?: string;
  isUserInitiated?: boolean; // True if user initiated this transaction (sent), false if received (deposit/airdrop)
}

/**
 * Token balances
 */
export interface TokenBalances {
  SOL: number; // Native SOL balance
  WSOL: number; // Wrapped SOL token balance
  USDC: number; // USDC token balance
}

