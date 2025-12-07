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
 * Transaction metrics
 */
export interface TransactionMetrics {
  submitted: number;
  broadcast: number;
  confirmed: number;
  finalized: number;
  failed: number;
  acknowledgedFailures: number; // User-acknowledged failures
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

