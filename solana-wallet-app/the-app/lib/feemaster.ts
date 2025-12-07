import WalletManagerSolana from '@tetherto/wdk-wallet-solana';
import { Keypair } from '@solana/web3.js';
import * as bip39 from 'bip39';
import { derivePath } from 'ed25519-hd-key';
import { SOLANA_RPC_URL } from './solana';

/**
 * Create feemaster account from seed phrase
 * 
 * The feemaster account is managed through Tether SDK (seed phrase controlled, no social sign-on)
 * Based on working examples in Testing-wdk-wallet-solana
 */
export function createFeemasterAccount(seedPhrase: string): WalletManagerSolana {
  // Tether SDK constructor - use rpcUrl (not provider)
  return new WalletManagerSolana(seedPhrase, {
    rpcUrl: SOLANA_RPC_URL,
    commitment: 'confirmed'
  });
}

/**
 * Get feemaster account (account 0)
 * Note: getAccount is async!
 */
export async function getFeemasterAccount(
  walletManager: WalletManagerSolana
) {
  return await walletManager.getAccount(0);
}

/**
 * Get feemaster public key (address)
 */
export async function getFeemasterPublicKey(
  walletManager: WalletManagerSolana
): Promise<string> {
  const account = await getFeemasterAccount(walletManager);
  // Use getAddress() method (returns Promise<string>)
  return await account.getAddress();
}

/**
 * Get feemaster balance
 */
export async function getFeemasterBalance(
  walletManager: WalletManagerSolana
): Promise<bigint> {
  const account = await getFeemasterAccount(walletManager);
  // getBalance() returns bigint in lamports
  return await account.getBalance();
}

/**
 * Derive Solana keypair from seed phrase using BIP-44
 * Path: m/44'/501'/accountIndex'/0'
 * 
 * Used for getting private key without Tether SDK
 */
export async function deriveFeemasterKeypair(
  seedPhrase: string,
  accountIndex: number = 0
): Promise<Keypair> {
  // Convert seed phrase to seed
  const seed = await bip39.mnemonicToSeed(seedPhrase);
  
  // Derive using BIP-44 path for Solana: m/44'/501'/accountIndex'/0'
  const derivedPathResult = derivePath(
    `m/44'/501'/${accountIndex}'/0'`,
    seed.toString('hex')
  );
  
  // Get the key (32 bytes for ed25519)
  const derivedKey = derivedPathResult.key;
  
  // Create Solana keypair from derived key (first 32 bytes)
  const keypair = Keypair.fromSeed(derivedKey.slice(0, 32));
  
  return keypair;
}
