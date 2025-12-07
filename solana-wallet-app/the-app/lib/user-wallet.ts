/**
 * User wallet management using Tether WDK SDK
 * 
 * ARCHITECTURE:
 * - Tether WDK SDK (@tetherto/wdk-wallet-solana): Used for ALL wallet operations
 * - Same pattern as feemaster: seed phrase → Tether WDK SDK → account index 0
 * 
 * This is the main purpose of the demo - to showcase Tether WDK SDK for transactions.
 * 
 * NOTE: We still use @solana/web3.js for read-only queries (transaction history, airdrops)
 * but all wallet operations (balance, send) use Tether WDK SDK.
 */

import WalletManagerSolana from '@tetherto/wdk-wallet-solana';
import { SOLANA_RPC_URL } from './solana';

/**
 * Create Tether WDK wallet manager from seed phrase
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
 * Get user balance using Tether WDK SDK
 * 
 * @param walletManager - Tether WDK wallet manager
 * @param accountIndex - Account index (default: 0)
 * @returns Balance in lamports (bigint)
 */
export async function getUserBalance(
  walletManager: WalletManagerSolana,
  accountIndex: number = 0
): Promise<bigint> {
  const account = await getUserAccount(walletManager, accountIndex);
  // Tether WDK SDK's getBalance() returns bigint in lamports
  return await account.getBalance();
}

/**
 * Get user public key (address) using Tether WDK SDK
 * 
 * @param walletManager - Tether WDK wallet manager
 * @param accountIndex - Account index (default: 0)
 * @returns Public key as string
 */
export async function getUserPublicKey(
  walletManager: WalletManagerSolana,
  accountIndex: number = 0
): Promise<string> {
  const account = await getUserAccount(walletManager, accountIndex);
  // Tether WDK SDK's getAddress() returns Promise<string>
  return await account.getAddress();
}

/**
 * Send transaction using Tether WDK SDK
 * 
 * This is the main transaction method - uses Tether WDK SDK as required.
 * Based on working examples in Testing-wdk-wallet-solana/example-basic.js
 * 
 * The SDK returns an object with signature and fee properties:
 * { signature: string, fee: bigint }
 */
export async function sendTransactionWithWDK(
  walletManager: WalletManagerSolana,
  accountIndex: number,
  recipient: string,
  amountLamports: bigint
): Promise<string> {
  const account = await getUserAccount(walletManager, accountIndex);
  
  // Use Tether WDK SDK's sendTransaction method
  // Based on working example: account.sendTransaction({ to: address, value })
  // The SDK expects 'to' parameter, not 'recipient'
  const result = await account.sendTransaction({
    to: recipient,
    value: amountLamports,
  });

  // Tether WDK SDK returns TransactionResult object
  // Based on working examples, it has 'signature' property at runtime
  // TypeScript types may show 'hash' but runtime uses 'signature'
  const resultAny = result as any;
  
  // Check for signature property (runtime property name)
  if (resultAny && typeof resultAny === 'object') {
    if ('signature' in resultAny && typeof resultAny.signature === 'string') {
      return resultAny.signature;
    }
    // Fallback: check for hash property (TypeScript type name)
    if ('hash' in resultAny && typeof resultAny.hash === 'string') {
      return resultAny.hash;
    }
  }
  
  // Fallback: if result is already a string
  if (typeof result === 'string') {
    return result;
  }
  
  throw new Error(`Unexpected return type from sendTransaction: ${typeof result}. Result: ${JSON.stringify(result)}`);
}

