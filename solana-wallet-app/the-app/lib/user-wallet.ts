/**
 * User wallet management using Tether WDK SDK
 * 
 * ARCHITECTURE:
 * - Web3Auth (@web3auth/modal): ONLY used for wallet creation and Google sign-on
 * - Tether WDK SDK (@tetherto/wdk-wallet-solana): Used for ALL transaction operations
 * 
 * This is the main purpose of the demo - to showcase Tether WDK SDK for transactions.
 */

import WalletManagerSolana from '@tetherto/wdk-wallet-solana';
import { Keypair } from '@solana/web3.js';
import { SOLANA_RPC_URL } from './solana';
import bs58 from 'bs58';

/**
 * Create Tether WDK wallet manager from private key
 * 
 * Note: Tether WDK SDK requires a seed phrase, but Web3Auth may only provide a private key.
 * For now, we'll use the private key directly with @solana/web3.js for operations.
 * 
 * TODO: Check if Web3Auth provides seed phrase, or if Tether WDK can work with private key
 */
export function createUserWalletManager(privateKey: string): {
  keypair: Keypair;
  // For now, return keypair directly since Tether WDK requires seed phrase
  // We'll use @solana/web3.js for operations until we can get seed phrase from Web3Auth
} {
  // Convert private key to Solana Keypair
  let privateKeyBytes: Uint8Array;

  try {
    // Try base58 decode first (most common Solana format)
    privateKeyBytes = bs58.decode(privateKey);
  } catch {
    // If base58 fails, try hex
    const hexString = privateKey.startsWith('0x') 
      ? privateKey.slice(2) 
      : privateKey;
    privateKeyBytes = new Uint8Array(
      hexString.match(/.{1,2}/g)?.map((byte: string) => parseInt(byte, 16)) || []
    );
  }

  // Create Solana Keypair
  let keypair: Keypair;
  
  if (privateKeyBytes.length === 32) {
    // If only 32 bytes (private key), create keypair from seed
    keypair = Keypair.fromSeed(privateKeyBytes);
  } else if (privateKeyBytes.length === 64) {
    // Full 64-byte secret key (32 private + 32 public)
    keypair = Keypair.fromSecretKey(privateKeyBytes);
  } else {
    throw new Error(
      `Invalid private key length: ${privateKeyBytes.length} bytes. ` +
      'Expected 32 or 64 bytes.'
    );
  }

  return { keypair };
}

/**
 * Create Tether WDK wallet manager from seed phrase (if available)
 * 
 * This is the preferred method if Web3Auth provides a seed phrase
 */
export function createUserWalletManagerFromSeed(seedPhrase: string): WalletManagerSolana {
  return new WalletManagerSolana(seedPhrase, {
    rpcUrl: SOLANA_RPC_URL,
    commitment: 'confirmed'
  });
}

/**
 * Get user account using Tether WDK SDK
 * 
 * @param walletManager - Tether WDK wallet manager
 * @param accountIndex - Account index (default: 0)
 * @returns WDK account instance
 */
export async function getUserAccount(
  walletManager: WalletManagerSolana,
  accountIndex: number = 0
) {
  return await walletManager.getAccount(accountIndex);
}

/**
 * Send transaction using Tether WDK SDK
 * 
 * This is the main transaction method - uses Tether WDK SDK as required.
 * Based on working examples in solana-wallet-integration/src/app.ts
 */
export async function sendTransactionWithWDK(
  walletManager: WalletManagerSolana,
  accountIndex: number,
  recipient: string,
  amountLamports: bigint
): Promise<string> {
  const account = await getUserAccount(walletManager, accountIndex);
  
  // Use Tether WDK SDK's sendTransaction method
  // Based on working example: account.sendTransaction({ recipient, value, commitment })
  const signature = await (account as any).sendTransaction({
    recipient,
    value: amountLamports,
    commitment: 'confirmed',
  });

  return signature;
}

