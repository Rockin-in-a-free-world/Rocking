import { Connection, PublicKey } from '@solana/web3.js';
import { Transaction, TransactionMetrics, TransactionState } from './types';

/**
 * Get all transaction signatures for an address
 */
export async function getTransactionSignatures(
  connection: Connection,
  address: PublicKey
): Promise<string[]> {
  const signatures = await connection.getSignaturesForAddress(address);
  return signatures.map(s => s.signature);
}

/**
 * Get transaction statuses
 */
export async function getTransactionStatuses(
  connection: Connection,
  signatures: string[]
): Promise<Transaction[]> {
  const statuses = await connection.getSignatureStatuses(signatures);
  
  return signatures.map((signature, index) => {
    const status = statuses.value[index];
    
    let state: TransactionState = 'submitted';
    if (status?.err) {
      state = 'failed';
    } else if (status?.confirmationStatus === 'finalized') {
      state = 'finalized';
    } else if (status?.confirmationStatus === 'confirmed') {
      state = 'confirmed';
    } else if (status) {
      state = 'broadcast';
    }
    
    return {
      signature,
      state,
      timestamp: status?.slot ? Date.now() : 0, // TODO: Get actual timestamp
      error: status?.err ? JSON.stringify(status.err) : undefined,
    };
  });
}

/**
 * Calculate metrics from transactions (on-chain data only)
 */
export function calculateMetrics(
  transactions: Transaction[]
): TransactionMetrics {
  const metrics: TransactionMetrics = {
    submitted: transactions.length,
    broadcast: 0,
    confirmed: 0,
    finalized: 0,
    failed: 0,
  };
  
  transactions.forEach(tx => {
    switch (tx.state) {
      case 'broadcast':
        metrics.broadcast++;
        break;
      case 'confirmed':
        metrics.confirmed++;
        break;
      case 'finalized':
        metrics.finalized++;
        break;
      case 'failed':
        metrics.failed++;
        break;
    }
  });
  
  return metrics;
}

