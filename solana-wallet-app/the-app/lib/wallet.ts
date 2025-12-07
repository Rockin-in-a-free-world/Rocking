/**
 * User wallet utilities
 * 
 * NOTE: Web3Auth/embedded wallets removed - now using Tether WDK SDK with seed phrases
 * Same pattern as feemaster: seed phrase → Tether WDK SDK → account index 0
 */

'use client';

/**
 * Store wallet credentials in session storage
 * 
 * @param address - Solana wallet address
 */
export function storeWalletCredentials(address: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  sessionStorage.setItem('user_public_key', address);
  sessionStorage.setItem('user_setup_complete', 'true');
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
  return sessionStorage.getItem('user_public_key');
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
  return sessionStorage.getItem('user_setup_complete') === 'true';
}

/**
 * Clear wallet credentials from session
 */
export function clearWalletCredentials(): void {
  if (typeof window === 'undefined') {
    return;
  }
  sessionStorage.removeItem('user_public_key');
  sessionStorage.removeItem('user_setup_complete');
  sessionStorage.removeItem('user_seed_phrase_temp');
}
