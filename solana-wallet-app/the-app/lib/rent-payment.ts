import { Connection, SystemProgram, Transaction, PublicKey, sendAndConfirmTransaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Keypair } from '@solana/web3.js';
import { calculateRentExempt } from './solana';

/**
 * Calculate rent for a 10KB account
 */
export async function calculateUserAccountRent(
  connection: Connection
): Promise<number> {
  return await calculateRentExempt(connection, 10240); // 10KB
}

/**
 * Pay rent for a new user account
 * 
 * @param feemasterKeypair - Feemaster keypair (derived from seed phrase)
 * @param userPDA - User's PDA address
 * @param connection - Solana connection
 */
export async function payUserAccountRent(
  feemasterKeypair: Keypair,
  userPDA: PublicKey,
  connection: Connection
): Promise<string> {
  // Calculate rent-exempt minimum for 10KB account
  const rentAmount = await calculateUserAccountRent(connection);

  // Create transaction to transfer SOL for rent
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: feemasterKeypair.publicKey,
      toPubkey: userPDA,
      lamports: rentAmount,
    })
  );

  // Send and confirm transaction
  const signature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [feemasterKeypair],
    { commitment: 'confirmed' }
  );

  return signature;
}

