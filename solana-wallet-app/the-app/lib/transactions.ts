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
 * For old transactions, getSignatureStatuses might return null.
 * In that case, we fetch the transaction directly to verify it exists and is finalized.
 * 
 * @param connection - Solana connection
 * @param signatures - Transaction signatures
 * @param userAddress - User's address to determine if transaction is outgoing
 */
export async function getTransactionStatuses(
  connection: Connection,
  signatures: string[],
  userAddress?: PublicKey
): Promise<Transaction[]> {
  if (signatures.length === 0) {
    return [];
  }

  const statuses = await connection.getSignatureStatuses(signatures, { searchTransactionHistory: true });
  
  // First pass: process statuses that have data
  const results: Transaction[] = [];
  const nullStatusIndices: number[] = [];
  
  // Fetch transactions to determine if they're outgoing
  // We need to check if user's address is a signer
  const transactions = await Promise.all(
    signatures.map(sig => 
      connection.getTransaction(sig, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0,
      }).catch(() => null)
    )
  );
  
  signatures.forEach((signature, index) => {
    const status = statuses.value[index];
    const tx = transactions[index];
    
    // Determine if transaction is outgoing (user is sender)
    let isOutgoing = false;
    if (tx && userAddress) {
      try {
        // Check if user's address is in the signers list
        const accountKeys = tx.transaction.message.staticAccountKeys || 
                          (tx.transaction.message as any).accountKeys || [];
        // The first numRequiredSignatures accounts are signers
        const numSigners = tx.transaction.message.header.numRequiredSignatures;
        for (let i = 0; i < Math.min(numSigners, accountKeys.length); i++) {
          if (accountKeys[i].equals(userAddress)) {
            isOutgoing = true;
            break;
          }
        }
      } catch (err) {
        // If we can't determine, default to false (incoming)
        console.warn(`Could not determine if transaction ${signature} is outgoing:`, err);
      }
    }
    
    if (status === null) {
      // Collect indices of null statuses to fetch later
      nullStatusIndices.push(index);
      return;
    }
    
    let state: TransactionState = 'submitted';
    let error: string | undefined;
    
    // Check for errors first
    if (status.err) {
      state = 'failed';
      error = JSON.stringify(status.err);
    } 
    // Check confirmation status (finalized is the highest level)
    else if (status.confirmationStatus === 'finalized') {
      state = 'finalized';
    } 
    else if (status.confirmationStatus === 'confirmed') {
      state = 'confirmed';
    } 
    // If status exists but no confirmation status, transaction is broadcasting
    // (in mempool or being processed by validators but not yet confirmed)
    else {
      state = 'broadcast';
    }
    
    results[index] = {
      signature,
      state,
      timestamp: status.slot ? Date.now() : 0,
      error,
      isOutgoing,
    };
  });
  
  // Second pass: fetch transactions for null statuses (old transactions)
  if (nullStatusIndices.length > 0) {
    const nullSignatures = nullStatusIndices.map(i => signatures[i]);
    
    // Batch fetch transactions with finalized commitment first (most common for old txs)
    const finalizedTxs = await Promise.all(
      nullSignatures.map(sig => 
        connection.getTransaction(sig, {
          commitment: 'finalized',
          maxSupportedTransactionVersion: 0,
        }).catch(() => null)
      )
    );
    
    // For transactions not found with finalized, try confirmed
    const confirmedTxs = await Promise.all(
      nullSignatures.map((sig, i) => 
        finalizedTxs[i] ? null : 
        connection.getTransaction(sig, {
          commitment: 'confirmed',
          maxSupportedTransactionVersion: 0,
        }).catch(() => null)
      )
    );
    
    // Process results
    nullStatusIndices.forEach((originalIndex, batchIndex) => {
      const signature = signatures[originalIndex];
      const finalizedTx = finalizedTxs[batchIndex];
      const confirmedTx = confirmedTxs[batchIndex];
      
      let state: TransactionState = 'submitted';
      const tx = finalizedTx || confirmedTx;
      
      // Determine if transaction is outgoing (user is sender)
      let isOutgoing = false;
      if (tx && userAddress) {
        // Check if user's address is in the signers list
        const accountKeys = tx.transaction.message.staticAccountKeys || 
                          (tx.transaction.message as any).accountKeys || [];
        const signers = accountKeys.filter((key: PublicKey, index: number) => {
          // Check if this account is a signer (first few accounts are typically signers)
          return tx.transaction.message.header.numRequiredSignatures > index;
        });
        isOutgoing = signers.some((signer: PublicKey) => signer.equals(userAddress));
      }
      
      if (finalizedTx) {
        state = 'finalized';
      } else if (confirmedTx) {
        state = 'confirmed';
      } else {
        // Transaction not found - might be very old or invalid
        state = 'submitted';
      }
      
      results[originalIndex] = {
        signature,
        state,
        timestamp: 0, // Could extract from transaction if needed
        error: undefined,
        isOutgoing,
      };
    });
  }
  
  return results;
}

/**
 * Calculate metrics from transactions (on-chain data only)
 * 
 * Note: A finalized transaction is also counted as confirmed
 * Only outgoing transactions (initiated by user) are counted in "submitted"
 */
export function calculateMetrics(
  transactions: Transaction[]
): TransactionMetrics {
  const metrics: TransactionMetrics = {
    submitted: 0, // Only count outgoing transactions
    broadcast: 0,
    confirmed: 0,
    finalized: 0,
    failed: 0,
  };
  
  transactions.forEach(tx => {
    // Only count outgoing transactions in submitted total
    if (tx.isOutgoing) {
      metrics.submitted++;
    }
    
    switch (tx.state) {
      case 'broadcast':
        if (tx.isOutgoing) {
          metrics.broadcast++;
        }
        break;
      case 'confirmed':
        if (tx.isOutgoing) {
          metrics.confirmed++;
        }
        break;
      case 'finalized':
        // Finalized transactions are also confirmed
        if (tx.isOutgoing) {
          metrics.finalized++;
          metrics.confirmed++;
        }
        break;
      case 'failed':
        if (tx.isOutgoing) {
          metrics.failed++;
        }
        break;
      case 'submitted':
        // Submitted transactions are already counted above if outgoing
        break;
    }
  });
  
  return metrics;
}

