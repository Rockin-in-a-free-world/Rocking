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
 * 
 * NOTE: getSignatureStatuses may return null for older finalized transactions
 * that are no longer in the status cache. Since getSignaturesForAddress only
 * returns signatures that were included in blocks, a null status for an
 * existing signature typically means the transaction is finalized (old enough
 * to be removed from the status cache).
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
      // Transaction failed
      state = 'failed';
    } else if (status?.confirmationStatus === 'finalized') {
      // Transaction is finalized
      state = 'finalized';
    } else if (status?.confirmationStatus === 'confirmed') {
      // Transaction is confirmed but not finalized
      state = 'confirmed';
    } else if (status) {
      // Transaction has status but not confirmed/finalized yet
      state = 'broadcast';
    } else {
      // Status is null - this happens for older finalized transactions
      // Since getSignaturesForAddress only returns signatures that were included
      // in blocks, a null status here means the transaction is finalized but
      // old enough to be removed from the status cache
      state = 'finalized';
    }
    
    return {
      signature,
      state,
      timestamp: status?.slot ? Date.now() : 0, // TODO: Get actual timestamp from transaction
      error: status?.err ? JSON.stringify(status.err) : undefined,
    };
  });
}

/**
 * Calculate metrics from transactions (on-chain data only)
 * 
 * NOTE: Metrics are cumulative and hierarchical - transaction states are progressive:
 * submitted → broadcast → confirmed → finalized
 * 
 * So if a transaction is finalized, it's also confirmed (and was broadcast).
 * - submitted: Total number of transactions (all transactions)
 * - broadcast: Number of transactions that are broadcast or beyond (not just submitted)
 * - confirmed: Number of transactions that are confirmed OR finalized (finalized transactions are also confirmed)
 * - finalized: Number of transactions that are finalized (subset of confirmed)
 * - failed: Number of transactions that failed
 */
export function calculateMetrics(
  transactions: Transaction[]
): TransactionMetrics {
  const metrics: TransactionMetrics = {
    submitted: transactions.length, // All transactions are submitted
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
        // Confirmed transactions were also broadcast
        metrics.broadcast++;
        metrics.confirmed++;
        break;
      case 'finalized':
        // Finalized transactions are also confirmed and were broadcast
        metrics.broadcast++;
        metrics.confirmed++; // Finalized transactions are also confirmed
        metrics.finalized++;
        break;
      case 'failed':
        metrics.failed++;
        break;
      case 'submitted':
        // Only in submitted state (not yet broadcast)
        break;
    }
  });
  
  return metrics;
}

