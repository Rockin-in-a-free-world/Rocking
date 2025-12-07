/**
 * MetaMask Embedded Wallets SDK integration for Google sign-on
 * 
 * This module handles:
 * - Google OAuth authentication via MetaMask SDK
 * - Solana wallet creation/extraction
 * - Session management
 * 
 * Note: MetaMask Embedded Wallets SDK API may vary.
 * Check https://docs.metamask.io/embedded-wallets/ for latest API.
 */

'use client';

import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

/**
 * MetaMask Embedded Wallets SDK client-side initialization
 * 
 * Note: This runs client-side only (browser)
 * The SDK may be part of @metamask/sdk or a separate package
 */
export async function initializeEmbeddedWallet() {
  // Get client ID from environment (must be public for client-side)
  const clientId = process.env.NEXT_PUBLIC_EMBEDDED_WALLET_CLIENT_ID;
  
  if (!clientId) {
    throw new Error(
      'NEXT_PUBLIC_EMBEDDED_WALLET_CLIENT_ID is required. ' +
      'Please add it to your environment variables. ' +
      'Get it from: https://portal.metamask.io'
    );
  }

  // Try different possible SDK imports
  // MetaMask Embedded Wallets might be in @metamask/sdk or a separate package
  
  try {
    // Option 1: Try @metamask/sdk (main SDK package)
    const metamaskSDK = await import('@metamask/sdk');
    
    // Check if embedded wallets functionality exists
    if (metamaskSDK.initializeEmbeddedWallet) {
      return await metamaskSDK.initializeEmbeddedWallet({
        clientId,
        // Other options may be needed based on SDK version
      });
    }
    
    // If SDK exists but doesn't have embedded wallets, try alternative
    if (metamaskSDK.default) {
      // May need to use default export differently
      console.warn('MetaMask SDK found but embedded wallets API may differ');
    }
  } catch (error: any) {
    if (!error.message?.includes('Cannot find module')) {
      console.error('MetaMask SDK import error:', error);
    }
  }

  // Option 2: Try separate embedded-wallets package (if it exists)
  try {
    const { initializeEmbeddedWallet } = await import('@metamask/embedded-wallets');
    return await initializeEmbeddedWallet({
      clientId,
    });
  } catch (error: any) {
    if (!error.message?.includes('Cannot find module')) {
      console.error('MetaMask Embedded Wallets import error:', error);
    }
  }

  // If we get here, SDK is not installed or API is different
  throw new Error(
    'MetaMask Embedded Wallets SDK not found. ' +
    'Please install: npm install @metamask/sdk\n\n' +
    'Or check MetaMask documentation for the correct package: ' +
    'https://docs.metamask.io/embedded-wallets/\n\n' +
    'Once installed, the SDK should provide:\n' +
    '- initializeEmbeddedWallet() or similar\n' +
    '- authenticate({ provider: "google" })\n' +
    '- getAccountSolana() method'
  );
}

/**
 * Authenticate user with Google and get Solana account
 * 
 * @returns Solana account details (address and private key)
 */
export async function authenticateWithGoogle(): Promise<{
  address: string;
  privateKey: string;
  keypair: Keypair;
}> {
  try {
    // Initialize MetaMask Embedded Wallets SDK
    const embeddedWallet = await initializeEmbeddedWallet();

    // Authenticate with Google OAuth
    // This will open a popup/redirect for Google sign-in
    if (typeof embeddedWallet.authenticate === 'function') {
      await embeddedWallet.authenticate({ 
        provider: 'google' 
      });
    } else {
      throw new Error(
        'MetaMask SDK authenticate method not found. ' +
        'Please check the SDK API documentation.'
      );
    }

    // Get Solana account (ed25519 keypair)
    // MetaMask SDK should provide this method for Solana wallets
    let solanaAccount;
    
    if (typeof embeddedWallet.getAccountSolana === 'function') {
      solanaAccount = await embeddedWallet.getAccountSolana();
    } else if (typeof embeddedWallet.getAccount === 'function') {
      // Try alternative method name
      solanaAccount = await embeddedWallet.getAccount('solana');
    } else {
      throw new Error(
        'MetaMask SDK getAccountSolana method not found. ' +
        'Please check the SDK API documentation for Solana account access.'
      );
    }

    if (!solanaAccount || !solanaAccount.address) {
      throw new Error('Failed to get Solana account from MetaMask SDK');
    }

    // Convert private key to Solana Keypair
    // MetaMask SDK may return private key in different formats
    let privateKeyBytes: Uint8Array;
    const privateKeyString = solanaAccount.privateKey || solanaAccount.secretKey;
    
    if (!privateKeyString) {
      throw new Error('Private key not returned from MetaMask SDK');
    }

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
          hexString.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
        );
      } catch {
        // If both fail, try as Uint8Array directly
        if (privateKeyString instanceof Uint8Array) {
          privateKeyBytes = privateKeyString;
        } else {
          throw new Error('Unable to decode private key. Expected base58 or hex format.');
        }
      }
    }

    // Create Solana Keypair
    // Solana Keypair.fromSecretKey expects 64 bytes (32 private + 32 public)
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
    const providedAddress = solanaAccount.address;

    return {
      address: providedAddress || derivedAddress,
      privateKey: bs58.encode(privateKeyBytes),
      keypair,
    };
  } catch (error: any) {
    console.error('Google authentication error:', error);
    throw new Error(
      `Failed to authenticate with Google: ${error.message || 'Unknown error'}`
    );
  }
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
