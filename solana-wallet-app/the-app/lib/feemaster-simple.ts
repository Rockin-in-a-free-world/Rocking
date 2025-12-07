import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import * as bip39 from 'bip39';
import { derivePath } from 'ed25519-hd-key';
import { SOLANA_RPC_URL } from './solana';

/**
 * Derive Solana keypair from seed phrase using BIP-44
 * Path: m/44'/501'/accountIndex'/0'
 * 
 * This creates account index 0 for the seed phrase
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

/**
 * Create feemaster account (index 0) and return public key
 * This is the simplified version that doesn't use Tether SDK
 */
export async function createFeemasterAccountSimple(seedPhrase: string): Promise<{
  publicKey: string;
  privateKey: string;
}> {
  const keypair = await deriveFeemasterKeypair(seedPhrase, 0);
  
  return {
    publicKey: keypair.publicKey.toBase58(),
    privateKey: bs58.encode(keypair.secretKey),
  };
}

