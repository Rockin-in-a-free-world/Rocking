import { Connection, PublicKey } from '@solana/web3.js';

/**
 * Solana connection configuration
 */
export const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
export const SOLANA_NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';

/**
 * Create Solana connection
 */
export function createConnection(): Connection {
  return new Connection(SOLANA_RPC_URL, 'confirmed');
}

/**
 * Calculate rent-exempt minimum for account size
 */
export async function calculateRentExempt(
  connection: Connection,
  dataSize: number
): Promise<number> {
  return await connection.getMinimumBalanceForRentExemption(dataSize);
}

