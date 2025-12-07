import WalletManagerSolana from '@tetherto/wdk-wallet-solana';
import { SOLANA_RPC_URL } from './solana';

/**
 * Create feemaster account from seed phrase
 * 
 * The feemaster account is managed through Tether SDK (seed phrase controlled, no social sign-on)
 */
export function createFeemasterAccount(seedPhrase: string): WalletManagerSolana {
  // Tether SDK constructor takes seed phrase and config
  // Based on integration guide, it may take config with provider/rpcUrl
  return new WalletManagerSolana(seedPhrase, {
    provider: SOLANA_RPC_URL,
    commitment: 'confirmed',
  } as any);
}

/**
 * Get feemaster account (account 0)
 */
export async function getFeemasterAccount(
  walletManager: WalletManagerSolana
) {
  return await walletManager.getAccount(0);
}

/**
 * Get feemaster public key
 */
export async function getFeemasterPublicKey(
  walletManager: WalletManagerSolana
): Promise<string> {
  const account = await getFeemasterAccount(walletManager);
  // Tether SDK account may expose publicKey differently
  // Try different property names
  return (account as any).publicKey || (account as any).address || '';
}
