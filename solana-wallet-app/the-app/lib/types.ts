/**
 * Transaction states
 */
export type TransactionState = 
  | 'submitted'    // Created locally
  | 'broadcast'    // Broadcasting (in mempool or being processed by validators)
  | 'confirmed'    // In block, voted on by validators
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
  isOutgoing?: boolean; // True if this address is the sender (outgoing transaction)
}

/**
 * User account data
 */
export interface UserAccount {
  googleUserId: string;
  solanaAddress: string;
  createdAt: number;
  closedAt?: number;
  isFeemaster: boolean;
  isOnAllowlist: boolean;
}

/**
 * Rent payment request
 */
export interface RentPaymentRequest {
  userPDA: string;
  googleUserId: string;
  requestedAt: number;
  status: 'pending' | 'paid' | 'failed';
  rentAmount: number;
}

