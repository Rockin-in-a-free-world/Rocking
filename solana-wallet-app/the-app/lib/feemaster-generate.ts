import { generateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';

/**
 * Generate a new seed phrase using @scure/bip39
 * This is the same method used in the working examples
 */
export function generateSeedPhrase(): string {
  // Generate 12-word mnemonic (128 bits of entropy)
  return generateMnemonic(wordlist, 128);
}

