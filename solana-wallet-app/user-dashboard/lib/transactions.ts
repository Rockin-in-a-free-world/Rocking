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
 * Also determines if transactions are user-initiated (sent) vs received (deposits/airdrops).
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
  const statusIndices: number[] = []; // Indices with status data (for batch checking user-initiated)
  
  signatures.forEach((signature, index) => {
    const status = statuses.value[index];
    
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
    
    // Store for batch processing
    statusIndices.push(index);
    results[index] = {
      signature,
      state,
      timestamp: status.slot ? Date.now() : 0,
      error,
      isUserInitiated: false, // Will be determined in batch below
    };
  });
  
  // Batch fetch transactions to determine if user-initiated (for transactions with status)
  if (userAddress && statusIndices.length > 0) {
    const statusSignatures = statusIndices.map(i => signatures[i]);
    const statusTxs = await Promise.all(
      statusSignatures.map(sig =>
        connection.getTransaction(sig, {
          commitment: 'confirmed',
          maxSupportedTransactionVersion: 0,
          encoding: 'json', // Explicitly use 'json' encoding - accountKeys will be array of strings
        }).catch(() => null)
      )
    );
    
    statusIndices.forEach((originalIndex, batchIndex) => {
      const tx = statusTxs[batchIndex];
      if (tx && results[originalIndex]) {
        const meta = tx.meta;
        // With 'json' encoding, account keys are in staticAccountKeys as PublicKey objects
        const staticAccountKeys = tx.transaction?.message?.staticAccountKeys || [];
        let isUserInitiated = false;
        const userAddressStr = userAddress.toBase58();
        
        // Helper function to extract address from account key
        // With 'json' encoding, staticAccountKeys is array of PublicKey objects
        // With 'jsonParsed' encoding, accountKeys is array of { pubkey: string }
        const extractAddress = (key: any): string => {
          if (typeof key === 'string') {
            return key;
          }
          // PublicKey object (from 'json' encoding)
          if (key && typeof key === 'object' && key.toBase58) {
            return key.toBase58();
          }
          // jsonParsed format: { pubkey: string }
          if (key && typeof key === 'object') {
            return key.pubkey || String(key) || '';
          }
          return '';
        };
        
        // Check if user is the fee payer (first account is typically the fee payer)
        if (staticAccountKeys.length > 0) {
          const feePayerAddress = extractAddress(staticAccountKeys[0]);
          // Normalize addresses for comparison (both should be base58 strings)
          isUserInitiated = feePayerAddress === userAddressStr;
        }
        
        // Also check balance change - if user's balance decreased, they sent it
        if (!isUserInitiated && meta && meta.preBalances && meta.postBalances && staticAccountKeys.length > 0) {
          const userIndex = staticAccountKeys.findIndex((key: any) => {
            const addr = extractAddress(key);
            return addr === userAddressStr;
          });
          
          if (userIndex >= 0 && userIndex < meta.preBalances.length && userIndex < meta.postBalances.length) {
            const preBalance = meta.preBalances[userIndex];
            const postBalance = meta.postBalances[userIndex];
            // If balance decreased (accounting for fees), user sent the transaction
            isUserInitiated = postBalance < preBalance;
          }
        }
        
        results[originalIndex].isUserInitiated = isUserInitiated;
      }
    });
  }
  
  // Second pass: fetch transactions for null statuses (old transactions)
  if (nullStatusIndices.length > 0) {
    const nullSignatures = nullStatusIndices.map(i => signatures[i]);
    
    // Batch fetch transactions with finalized commitment first (most common for old txs)
    const finalizedTxs = await Promise.all(
      nullSignatures.map(sig => 
        connection.getTransaction(sig, {
          commitment: 'finalized',
          maxSupportedTransactionVersion: 0,
          encoding: 'json', // Explicitly use 'json' encoding - accountKeys will be array of strings
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
          encoding: 'json', // Explicitly use 'json' encoding - accountKeys will be array of strings
        }).catch(() => null)
      )
    );
    
    // Process results
    nullStatusIndices.forEach((originalIndex, batchIndex) => {
      const signature = signatures[originalIndex];
      const finalizedTx = finalizedTxs[batchIndex];
      const confirmedTx = confirmedTxs[batchIndex];
      
      let state: TransactionState = 'submitted';
      
      if (finalizedTx) {
        state = 'finalized';
      } else if (confirmedTx) {
        state = 'confirmed';
      } else {
        // Transaction not found - might be very old or invalid
        state = 'submitted';
      }
      
      // Determine if transaction is user-initiated
      let isUserInitiated = false;
      if (userAddress) {
        const tx = finalizedTx || confirmedTx;
        if (tx) {
          const meta = tx.meta;
          // With 'json' encoding, account keys are in staticAccountKeys as PublicKey objects
          const staticAccountKeys = tx.transaction?.message?.staticAccountKeys || [];
          const userAddressStr = userAddress.toBase58();
          
          // Helper function to extract address from account key
          const extractAddress = (key: any): string => {
            if (typeof key === 'string') {
              return key;
            }
            // PublicKey object (from 'json' encoding)
            if (key && typeof key === 'object' && key.toBase58) {
              return key.toBase58();
            }
            // jsonParsed format: { pubkey: string }
            if (key && typeof key === 'object') {
              return key.pubkey || String(key) || '';
            }
            return '';
          };
          
          // Check if user is the fee payer
          if (staticAccountKeys.length > 0) {
            const feePayerAddress = extractAddress(staticAccountKeys[0]);
            isUserInitiated = feePayerAddress === userAddressStr;
          }
          
          // Also check balance change
          if (!isUserInitiated && meta && meta.preBalances && meta.postBalances && staticAccountKeys.length > 0) {
            const userIndex = staticAccountKeys.findIndex((key: any) => {
              const addr = extractAddress(key);
              return addr === userAddressStr;
            });
            
            if (userIndex >= 0 && userIndex < meta.preBalances.length && userIndex < meta.postBalances.length) {
              const preBalance = meta.preBalances[userIndex];
              const postBalance = meta.postBalances[userIndex];
              isUserInitiated = postBalance < preBalance;
            }
          }
        }
      }
      
      results[originalIndex] = {
        signature,
        state,
        timestamp: 0, // Could extract from transaction if needed
        error: undefined,
        isUserInitiated,
      };
    });
  }
  
  return results;
}

/**
 * Calculate metrics from transactions (on-chain data only)
 * 
 * Note: A finalized transaction is also counted as confirmed.
 * "Submitted" counts user-initiated transactions (sends), not received deposits/airdrops.
 * 
 * Logical consistency: If a transaction progressed beyond "submitted" state and is user-initiated,
 * it must have been submitted. So we count user-initiated transactions in submitted.
 */
export function calculateMetrics(
  transactions: Transaction[]
): TransactionMetrics {
  const metrics: TransactionMetrics = {
    submitted: 0, // Count user-initiated transactions only
    broadcast: 0,
    confirmed: 0,
    finalized: 0,
    failed: 0,
  };
  
  transactions.forEach(tx => {
    // Count user-initiated transactions in "submitted"
    // (transactions the user sent, not deposits/airdrops they received)
    // If a transaction is finalized/confirmed/broadcast and user-initiated, it was submitted
    if (tx.isUserInitiated && tx.state !== 'submitted') {
      metrics.submitted++;
    } else if (tx.state === 'submitted' && tx.isUserInitiated) {
      metrics.submitted++;
    }
    
    switch (tx.state) {
      case 'broadcast':
        metrics.broadcast++;
        break;
      case 'confirmed':
        metrics.confirmed++;
        break;
      case 'finalized':
        // Finalized transactions are also confirmed
        metrics.finalized++;
        metrics.confirmed++;
        break;
      case 'failed':
        metrics.failed++;
        break;
      case 'submitted':
        // Already counted above if user-initiated
        break;
    }
  });
  
  return metrics;
}

