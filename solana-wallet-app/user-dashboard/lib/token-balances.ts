/**
 * Token balance utilities using Tether WDK SDK
 * 
 * Fetches SPL token balances for a user's wallet using Tether WDK SDK
 */

import WalletManagerSolana from '@tetherto/wdk-wallet-solana';
import { getUserAccount } from './user-wallet';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

/**
 * Known token mint addresses
 */
export const TOKEN_MINTS = {
  WSOL: 'So11111111111111111111111111111111111111112', // Wrapped SOL
  USDC_DEVNET: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU', // USDC on devnet
  USDC_MAINNET: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC on mainnet
} as const;

/**
 * Get specific token balances (SOL, WSOL, USDC) for a wallet using Tether WDK SDK
 * 
 * @param walletManager - Tether WDK wallet manager
 * @param accountIndex - Account index (default: 0)
 * @returns Object with SOL, WSOL, and USDC balances
 */
export async function getSpecificTokenBalances(
  walletManager: WalletManagerSolana,
  accountIndex: number = 0
): Promise<{
  SOL: number; // Native SOL balance
  WSOL: number; // Wrapped SOL token balance
  USDC: number; // USDC token balance
}> {
  try {
    const account = await getUserAccount(walletManager, accountIndex);
    
    // Get native SOL balance using Tether WDK SDK
    const solBalanceLamports = await account.getBalance();
    const solBalance = Number(solBalanceLamports) / LAMPORTS_PER_SOL;

    // Get WSOL token balance using Tether WDK SDK
    let wsolBalance = 0;
    try {
      const wsolBalanceResult = await account.getTokenBalance(TOKEN_MINTS.WSOL);
      // Tether WDK SDK returns balance in the token's smallest unit, convert to UI amount
      // Assuming WSOL has 9 decimals (same as SOL)
      wsolBalance = typeof wsolBalanceResult === 'bigint' 
        ? Number(wsolBalanceResult) / 1e9 
        : (typeof wsolBalanceResult === 'number' ? wsolBalanceResult : 0);
    } catch (error) {
      // No WSOL token account exists, balance is 0
      console.log('No WSOL token account found');
    }

    // Get USDC token balance using Tether WDK SDK
    // Try devnet first, then mainnet
    let usdcBalance = 0;
    const usdcMints = [TOKEN_MINTS.USDC_DEVNET, TOKEN_MINTS.USDC_MAINNET];
    
    for (const usdcMint of usdcMints) {
      try {
        const usdcBalanceResult = await account.getTokenBalance(usdcMint);
        // USDC has 6 decimals
        usdcBalance = typeof usdcBalanceResult === 'bigint' 
          ? Number(usdcBalanceResult) / 1e6 
          : (typeof usdcBalanceResult === 'number' ? usdcBalanceResult : 0);
        if (usdcBalance > 0) break; // Found a balance, stop checking
      } catch (error) {
        // Continue to next mint address
        continue;
      }
    }

    return {
      SOL: solBalance,
      WSOL: wsolBalance,
      USDC: usdcBalance,
    };
  } catch (error) {
    console.error('Error fetching token balances with Tether WDK SDK:', error);
    // Return zeros if there's an error
    return {
      SOL: 0,
      WSOL: 0,
      USDC: 0,
    };
  }
}

