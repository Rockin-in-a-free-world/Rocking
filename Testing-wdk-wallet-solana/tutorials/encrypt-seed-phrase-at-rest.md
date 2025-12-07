# 🔐 Side Quest: Encrypting Seed Phrases at Rest

> **Prerequisites**: You've completed the main tutorial and understand how wallets work. This is an advanced security topic.

## Why Encrypt at Rest?

When you store a seed phrase in a `.env` file or any plain text file, anyone with access to that file can steal your funds. Encryption at rest means storing the seed phrase in an encrypted form that requires a password to decrypt.

## What You'll Learn

- How to encrypt a seed phrase before saving it
- How to decrypt it when loading
- Best practices for password management
- How to securely store encrypted data

## Step 1: Install Dependencies

```bash
npm install dotenv crypto-js
# or for TypeScript
npm install dotenv crypto-js @types/crypto-js
```

## Step 2: Create Encryption Utilities

Create `utils/encryption.js`:

```javascript
import CryptoJS from 'crypto-js';

/**
 * Encrypt a seed phrase with a password
 * @param {string} seedPhrase - The mnemonic seed phrase
 * @param {string} password - User's password
 * @returns {string} Encrypted seed phrase (base64 encoded)
 */
export function encryptSeedPhrase(seedPhrase, password) {
  const encrypted = CryptoJS.AES.encrypt(seedPhrase, password).toString();
  return encrypted;
}

/**
 * Decrypt a seed phrase with a password
 * @param {string} encryptedSeedPhrase - Encrypted seed phrase
 * @param {string} password - User's password
 * @returns {string} Decrypted seed phrase
 */
export function decryptSeedPhrase(encryptedSeedPhrase, password) {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedSeedPhrase, password);
    const seedPhrase = decrypted.toString(CryptoJS.enc.Utf8);
    
    if (!seedPhrase) {
      throw new Error('Invalid password or corrupted data');
    }
    
    return seedPhrase;
  } catch (error) {
    throw new Error('Failed to decrypt seed phrase. Wrong password?');
  }
}
```

## Step 3: Save Encrypted Seed Phrase

Create `utils/save-wallet.js`:

```javascript
import fs from 'fs';
import { encryptSeedPhrase } from './encryption.js';

/**
 * Save an encrypted seed phrase to a file
 * @param {string} seedPhrase - The mnemonic seed phrase
 * @param {string} password - User's password
 * @param {string} filePath - Path to save the encrypted file (default: 'wallet.encrypted')
 */
export function saveEncryptedWallet(seedPhrase, password, filePath = 'wallet.encrypted') {
  const encrypted = encryptSeedPhrase(seedPhrase, password);
  fs.writeFileSync(filePath, encrypted, 'utf8');
  console.log('✅ Encrypted wallet saved to', filePath);
  console.log('⚠️  Keep this file secure and remember your password!');
}
```

## Step 4: Load Encrypted Seed Phrase

Create `utils/load-wallet.js`:

```javascript
import fs from 'fs';
import readline from 'readline';
import { decryptSeedPhrase } from './encryption.js';

/**
 * Load and decrypt a seed phrase from a file
 * @param {string} password - User's password
 * @param {string} filePath - Path to the encrypted file (default: 'wallet.encrypted')
 * @returns {Promise<string>} Decrypted seed phrase
 */
export async function loadEncryptedWallet(password, filePath = 'wallet.encrypted') {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Encrypted wallet file not found: ${filePath}`);
  }
  
  const encrypted = fs.readFileSync(filePath, 'utf8');
  const seedPhrase = decryptSeedPhrase(encrypted, password);
  
  return seedPhrase;
}

/**
 * Prompt user for password (for CLI apps)
 * @returns {Promise<string>} User's password
 */
export function promptPassword() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question('Enter password: ', (password) => {
      rl.close();
      resolve(password);
    });
  });
}
```

## Step 5: Example Usage

Create `example-encrypted-wallet.js`:

```javascript
import WalletManagerSolana from '@tetherto/wdk-wallet-solana';
import { generateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { saveEncryptedWallet, loadEncryptedWallet, promptPassword } from './utils/load-wallet.js';

async function main() {
  console.log('🔐 Encrypted Wallet Example\n');
  
  // Step 1: Generate or get seed phrase
  const seedPhrase = generateMnemonic(wordlist, 128);
  console.log('📝 Generated seed phrase:', seedPhrase);
  console.log('⚠️  This is the LAST time you'll see this in plain text!\n');
  
  // Step 2: Get password from user
  const password = await promptPassword();
  console.log('');
  
  // Step 3: Encrypt and save
  saveEncryptedWallet(seedPhrase, password, 'wallet.encrypted');
  
  // Step 4: Later, load and decrypt
  console.log('\n📂 Loading encrypted wallet...');
  const password2 = await promptPassword();
  const decryptedSeedPhrase = await loadEncryptedWallet(password2, 'wallet.encrypted');
  
  // Step 5: Pass the decrypted seed phrase to the SDK
  // The SDK (WalletManagerSolana) uses the seed phrase locally to derive keys and sign transactions
  // The rpcUrl is for communicating with the Solana network (reading balances, sending signed transactions)
  const wallet = new WalletManagerSolana(decryptedSeedPhrase, {
    rpcUrl: 'https://api.devnet.solana.com',  // Solana network RPC endpoint
    commitment: 'confirmed'
  });
  
  const account = await wallet.getAccount(0);
  const address = await account.getAddress();
  console.log('✅ Wallet loaded! Address:', address);
  
  // Clear password from memory (best practice)
  // Note: JavaScript doesn't guarantee memory clearing, but we try
  password = null;
  password2 = null;
}

main().catch(console.error);
```

## Step 6: Add to .gitignore

Make sure to add encrypted wallet files to `.gitignore`:

```gitignore
# Encrypted wallets
*.encrypted
wallet.encrypted

# Environment files
.env
.env.local
```

## Security Best Practices

### ✅ DO:
- Use strong, unique passwords
- Store encrypted files in secure locations
- Never commit encrypted wallet files to git
- Clear passwords from memory when possible
- Use environment variables for file paths (not passwords!)
- Consider using key derivation functions (PBKDF2) for stronger encryption

### ❌ DON'T:
- Store passwords in code or config files
- Commit encrypted wallets to version control
- Share encrypted wallet files
- Use weak passwords
- Store passwords in `.env` files
- Log passwords or seed phrases

## Advanced: Using PBKDF2 for Key Derivation

For stronger security, derive an encryption key from the password:

```javascript
import CryptoJS from 'crypto-js';

function deriveKey(password, salt) {
  // PBKDF2 with 100,000 iterations
  return CryptoJS.PBKDF2(password, salt, {
    keySize: 256 / 32,
    iterations: 100000
  });
}

export function encryptSeedPhraseAdvanced(seedPhrase, password) {
  const salt = CryptoJS.lib.WordArray.random(128 / 8);
  const key = deriveKey(password, salt);
  const encrypted = CryptoJS.AES.encrypt(seedPhrase, key, {
    iv: CryptoJS.lib.WordArray.random(128 / 8)
  });
  
  // Combine salt, IV, and encrypted data
  return salt.toString() + ':' + encrypted.iv.toString() + ':' + encrypted.toString();
}

export function decryptSeedPhraseAdvanced(encryptedData, password) {
  const parts = encryptedData.split(':');
  const salt = CryptoJS.enc.Hex.parse(parts[0]);
  const iv = CryptoJS.enc.Hex.parse(parts[1]);
  const encrypted = parts[2];
  
  const key = deriveKey(password, salt);
  const decrypted = CryptoJS.AES.decrypt(encrypted, key, { iv });
  
  return decrypted.toString(CryptoJS.enc.Utf8);
}
```

## Browser Environment

For browser-based apps, use the Web Crypto API instead:

```javascript
// Browser example using Web Crypto API
async function encryptSeedPhraseBrowser(seedPhrase, password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(seedPhrase);
  
  // Derive key from password
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: crypto.getRandomValues(new Uint8Array(16)),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );
  
  // Combine and encode
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}
```

## Next Steps

- Learn about hardware security modules (HSM)
- Research key management services (KMS)
- Study secure multi-party computation for shared wallets
- Explore biometric authentication for password management

## 🔗 Resources

- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
- [Web Crypto API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [Node.js Crypto Module](https://nodejs.org/api/crypto.html)

---

**Remember**: Encryption at rest is just one layer of security. Always use multiple security measures and never trust a single point of failure!

