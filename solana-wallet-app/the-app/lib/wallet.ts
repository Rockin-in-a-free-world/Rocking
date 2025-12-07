/**
 * Web3Auth (MetaMask Embedded Wallets) integration for Google sign-on
 * 
 * IMPORTANT: Web3Auth is ONLY used for wallet creation and Google sign-on.
 * All transaction operations MUST use Tether WDK SDK (see lib/user-wallet.ts)
 * 
 * Based on: https://docs.metamask.io/embedded-wallets/sdk/react/
 * Solana hooks: https://docs.metamask.io/embedded-wallets/sdk/react/solana-hooks/
 */

'use client';

import { useWeb3Auth } from '@web3auth/modal/react';
import { useSolanaWallet } from '@web3auth/modal/react/solana';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

/**
 * Authenticate user with Google and get Solana account using Web3Auth hooks
 * 
 * This should be called from a React component that has access to Web3Auth context
 * 
 * @returns Solana account details (address and private key)
 */
export async function authenticateWithGoogle(
  web3Auth: ReturnType<typeof useWeb3Auth>,
  solanaWallet: ReturnType<typeof useSolanaWallet>
): Promise<{
  address: string;
  privateKey: string;
  keypair: Keypair;
}> {
  try {
    // Check if already connected
    const isConnected = (web3Auth as any).isConnected || (web3Auth as any).connected || false;
    if (isConnected && solanaWallet.accounts && solanaWallet.accounts.length > 0) {
      // Get Solana account if already authenticated
      const address = solanaWallet.accounts[0];
      if (address) {
        // Get private key from Solana wallet
        const privateKey = await getPrivateKeyFromSolanaWallet(solanaWallet);
        return await createKeypairFromAddressAndPrivateKey(address, privateKey);
      }
    }

    // Open Web3Auth modal for Google login
    // This will trigger the authentication flow
    const connectMethod = (web3Auth as any).connect || (web3Auth as any).openLoginModal;
    if (typeof connectMethod === 'function') {
      await connectMethod();
    } else {
      throw new Error('Web3Auth connect method not found. Check Web3Auth hook API.');
    }

    // Wait a bit for Solana wallet to be ready
    await new Promise(resolve => setTimeout(resolve, 500));

    // After connection, get Solana account
    if (!solanaWallet.accounts || solanaWallet.accounts.length === 0) {
      throw new Error('Failed to get Solana account after authentication');
    }

    const address = solanaWallet.accounts[0];
    const privateKey = await getPrivateKeyFromSolanaWallet(solanaWallet);
    
    return await createKeypairFromAddressAndPrivateKey(address, privateKey);
  } catch (error: any) {
    console.error('Google authentication error:', error);
    throw new Error(
      `Failed to authenticate with Google: ${error.message || 'Unknown error'}`
    );
  }
}

/**
 * Get private key from Solana wallet
 * 
 * Web3Auth may expose private key through the solanaWallet object.
 * This is used ONLY for wallet creation - transactions use Tether WDK SDK.
 */
async function getPrivateKeyFromSolanaWallet(solanaWallet: ReturnType<typeof useSolanaWallet>): Promise<string> {
  // Try to get private key from Web3Auth Solana wallet
  // Check various possible locations based on Web3Auth API
  if ((solanaWallet as any).solanaWallet) {
    const wallet = (solanaWallet as any).solanaWallet;
    if (wallet.privateKey) {
      return wallet.privateKey;
    }
    if (wallet.secretKey) {
      // If it's a Uint8Array, convert to base58
      if (wallet.secretKey instanceof Uint8Array) {
        return bs58.encode(wallet.secretKey);
      }
      return wallet.secretKey;
    }
  }
  
  // Check if Web3Auth provides a method to get private key
  if (typeof (solanaWallet as any).getPrivateKey === 'function') {
    const privateKey = await (solanaWallet as any).getPrivateKey();
    return privateKey;
  }
  
  // If private key is not directly accessible, we may need to use Web3Auth's key management
  // For now, throw an error - this needs to be implemented based on actual Web3Auth API
  throw new Error(
    'Private key access from Web3Auth not yet implemented. ' +
    'Check Web3Auth Solana wallet API documentation. ' +
    'Note: Web3Auth is only used for authentication - transactions use Tether WDK SDK.'
  );
}

/**
 * Create Solana keypair from address and private key string
 */
async function createKeypairFromAddressAndPrivateKey(
  address: string,
  privateKeyString: string
): Promise<{
  address: string;
  privateKey: string;
  keypair: Keypair;
}> {
  // Convert private key to Solana Keypair
  let privateKeyBytes: Uint8Array;

  try {
    // Try base58 decode first (most common Solana format)
    privateKeyBytes = bs58.decode(privateKeyString);
  } catch {
    // If base58 fails, try hex
    try {
      const hexString = privateKeyString.startsWith('0x') 
        ? privateKeyString.slice(2) 
        : privateKeyString;
      privateKeyBytes = new Uint8Array(
        hexString.match(/.{1,2}/g)?.map((byte: string) => parseInt(byte, 16)) || []
      );
    } catch {
      // If both fail, try as Uint8Array directly
      if (privateKeyString && typeof privateKeyString === 'object' && 'length' in privateKeyString) {
        // Check if it's array-like (Uint8Array)
        try {
          privateKeyBytes = new Uint8Array(privateKeyString as any);
        } catch {
          throw new Error('Unable to decode private key. Expected base58 or hex format.');
        }
      } else {
        throw new Error('Unable to decode private key. Expected base58 or hex format.');
      }
    }
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

  // Verify address matches
  const derivedAddress = keypair.publicKey.toBase58();
  if (derivedAddress !== address) {
    console.warn(`Address mismatch: provided ${address}, derived ${derivedAddress}`);
  }

  return {
    address: address || derivedAddress,
    privateKey: bs58.encode(privateKeyBytes),
    keypair,
  };
}

/**
 * Store wallet credentials in session storage
 * 
 * @param address - Solana wallet address
 * @param privateKey - Private key (base58 or hex)
 */
export function storeWalletCredentials(address: string, privateKey: string): void {
  if (typeof window === 'undefined') {
    // Server-side - can't use sessionStorage
    return;
  }

  // Store in sessionStorage for client-side access
  sessionStorage.setItem('user_solana_address', address);
  sessionStorage.setItem('user_solana_private_key', privateKey);
  sessionStorage.setItem('user_wallet_authenticated', 'true');
}

/**
 * Get stored wallet address from session
 * 
 * @returns Wallet address or null
 */
export function getStoredWalletAddress(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return sessionStorage.getItem('user_solana_address');
}

/**
 * Check if user is authenticated
 * 
 * @returns True if wallet is authenticated
 */
export function isWalletAuthenticated(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return sessionStorage.getItem('user_wallet_authenticated') === 'true';
}

/**
 * Clear wallet credentials from session
 */
export function clearWalletCredentials(): void {
  if (typeof window === 'undefined') {
    return;
  }
  sessionStorage.removeItem('user_solana_address');
  sessionStorage.removeItem('user_solana_private_key');
  sessionStorage.removeItem('user_wallet_authenticated');
}
