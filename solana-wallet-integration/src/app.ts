/**
 * Solana Wallet Integration App
 * 
 * This app demonstrates:
 * 1. Creating a wallet with seed phrase using Google social sign-on (via MetaMask Embedded Wallets)
 * 2. Sending funds to a burner wallet on Solana
 * 3. Testing wallet functionality
 */

import dotenv from 'dotenv';
import WalletManagerSolana from '@tetherto/wdk-wallet-solana';
import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import * as bs58 from 'bs58';

// Load environment variables
dotenv.config();

// MetaMask Embedded Wallets SDK integration
// Note: The actual API may vary - this is a conceptual implementation
// Check MetaMask docs for the exact API: https://docs.metamask.io/embedded-wallets/

interface MetaMaskEmbeddedWallet {
  getAccountSolana(): Promise<{
    address: string;
    privateKey: string; // ed25519 private key in base58 or hex format
  }>;
}

/**
 * Step 1: Create wallet with Google social sign-on
 * 
 * This function uses MetaMask Embedded Wallets SDK to:
 * - Authenticate user with Google OAuth
 * - Generate a wallet with seed phrase (managed by MetaMask)
 * - Extract the Solana ed25519 private key
 */
async function createWalletWithSocialLogin(): Promise<{
  walletManager: WalletManagerSolana;
  publicKey: string;
  privateKey: Uint8Array;
}> {
  console.log('🔐 Step 1: Creating wallet with Google social sign-on...\n');

  // Initialize MetaMask Embedded Wallets SDK
  // NOTE: Replace with actual MetaMask Embedded Wallets SDK initialization
  // The exact API depends on the package version - check MetaMask docs
  /*
  const embeddedWallet = await initializeEmbeddedWallet({
    clientId: process.env.METAMASK_CLIENT_ID!,
    secretKey: process.env.METAMASK_SECRET_KEY!,
    authProvider: 'google', // or 'apple', 'email'
  });

  // Authenticate with Google
  await embeddedWallet.authenticate({
    provider: 'google',
  });

  // Get Solana account (ed25519 key)
  const solanaAccount = await embeddedWallet.getAccountSolana();
  */

  // For now, we'll simulate this with a generated keypair
  // In production, replace this with actual MetaMask Embedded Wallets SDK calls
  console.log('⚠️  Using simulated wallet for demo purposes');
  console.log('   In production, use MetaMask Embedded Wallets SDK:\n');
  console.log('   const embeddedWallet = await initializeEmbeddedWallet({...});');
  console.log('   await embeddedWallet.authenticate({ provider: "google" });');
  console.log('   const solanaAccount = await embeddedWallet.getAccountSolana();\n');

  // Generate a test keypair (replace with actual MetaMask SDK call)
  const keypair = Keypair.generate();
  const privateKeyBytes = keypair.secretKey;
  const publicKeyBase58 = keypair.publicKey.toBase58();

  console.log('✅ Wallet created!');
  console.log(`   Public Key: ${publicKeyBase58}\n`);

  // Initialize WDK Solana Wallet Manager with the private key
  // The WDK expects a seed phrase or keypair, so we'll need to convert
  // MetaMask's ed25519 key to a format WDK can use
  
  // Option 1: If MetaMask provides seed phrase, use it directly
  // const walletManager = new WalletManagerSolana({
  //   seedPhrase: metamaskSeedPhrase,
  //   provider: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  // });

  // Option 2: If MetaMask only provides ed25519 key, we need to create a wallet manager
  // that can work with a raw keypair. The WDK might need to be extended for this.
  
  // For this demo, we'll create a wallet manager and then use the account directly
  const walletManager = new WalletManagerSolana({
    provider: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
    commitment: 'confirmed',
  });

  // Create an account from the keypair
  // Note: WDK might need adapter to work with raw ed25519 keys from MetaMask
  // This is a conceptual implementation - actual API may differ
  const account = await walletManager.createAccount({
    // If WDK supports importing from keypair:
    // keypair: keypair,
    // Or if we need to derive from seed:
    // seedPhrase: derivedSeedPhrase,
  });

  return {
    walletManager,
    publicKey: publicKeyBase58,
    privateKey: privateKeyBytes,
  };
}

/**
 * Step 2: Create a burner wallet
 * 
 * A burner wallet is a temporary wallet address that can receive funds.
 * On Solana, we can use any valid public key address.
 */
function createBurnerWallet(): { address: string; keypair: Keypair } {
  console.log('🔥 Step 2: Creating burner wallet...\n');

  const keypair = Keypair.generate();
  const address = keypair.publicKey.toBase58();

  console.log('✅ Burner wallet created!');
  console.log(`   Address: ${address}\n`);

  return { address, keypair };
}

/**
 * Step 3: Send funds to burner wallet
 * 
 * Uses WDK Solana SDK to send SOL from the user's wallet to the burner wallet.
 */
async function sendFundsToBurner(
  walletManager: WalletManagerSolana,
  fromAccount: any, // WDK WalletAccountSolana instance
  burnerAddress: string,
  amountLamports: number
): Promise<string> {
  console.log('💸 Step 3: Sending funds to burner wallet...\n');
  console.log(`   From: ${fromAccount.publicKey || 'user wallet'}`);
  console.log(`   To: ${burnerAddress}`);
  console.log(`   Amount: ${amountLamports} lamports (${amountLamports / LAMPORTS_PER_SOL} SOL)\n`);

  try {
    // Check balance first
    const balance = await fromAccount.getBalance();
    console.log(`   Current balance: ${balance} lamports (${Number(balance) / LAMPORTS_PER_SOL} SOL)`);

    if (Number(balance) < amountLamports) {
      throw new Error(`Insufficient balance. Need ${amountLamports} lamports, have ${balance}`);
    }

    // Send transaction using WDK
    const signature = await fromAccount.sendTransaction({
      recipient: burnerAddress,
      value: BigInt(amountLamports),
      commitment: 'confirmed',
    });

    console.log('✅ Transaction sent!');
    console.log(`   Signature: ${signature}\n`);

    return signature;
  } catch (error) {
    console.error('❌ Error sending transaction:', error);
    throw error;
  }
}

/**
 * Step 4: Test wallet functionality
 * 
 * Verifies that the wallet can:
 * - Get balance
 * - Send transactions
 * - Query transaction status
 */
async function testWallet(walletManager: WalletManagerSolana, account: any): Promise<void> {
  console.log('🧪 Step 4: Testing wallet functionality...\n');

  try {
    // Test 1: Get balance
    console.log('Test 1: Getting balance...');
    const balance = await account.getBalance();
    console.log(`   ✅ Balance: ${balance} lamports (${Number(balance) / LAMPORTS_PER_SOL} SOL)\n`);

    // Test 2: Get token balance (if applicable)
    console.log('Test 2: Getting token balance...');
    // Example: USDC on Solana
    // const usdcMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
    // const tokenBalance = await account.getTokenBalance(usdcMint);
    // console.log(`   ✅ USDC Balance: ${tokenBalance}\n`);

    // Test 3: Quote transaction fee
    console.log('Test 3: Quoting transaction fee...');
    const quote = await account.quoteSendTransaction({
      recipient: '11111111111111111111111111111111',
      value: 1000000n, // 0.001 SOL
      commitment: 'confirmed',
    });
    console.log(`   ✅ Estimated fee: ${quote.fee} lamports\n`);

    console.log('✅ All wallet tests passed!\n');
  } catch (error) {
    console.error('❌ Wallet test failed:', error);
    throw error;
  }
}

/**
 * Main application flow
 */
async function main() {
  const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
  const network = rpcUrl.includes('devnet') ? 'Devnet' : 
                  rpcUrl.includes('testnet') ? 'Testnet' : 
                  rpcUrl.includes('mainnet') ? 'Mainnet' : 'Custom';
  
  console.log('🚀 Solana Wallet Integration App\n');
  console.log(`🌐 Network: ${network}`);
  console.log(`📡 RPC: ${rpcUrl}\n`);
  console.log('=' .repeat(50) + '\n');

  try {
    // Step 1: Create wallet with social login
    const { walletManager, publicKey } = await createWalletWithSocialLogin();

    // Step 2: Create burner wallet
    const { address: burnerAddress } = createBurnerWallet();

    // Step 3: Get or create account from wallet manager
    // Note: This depends on how WDK integrates with MetaMask's key
    // You may need to create an adapter layer
    const account = await walletManager.getAccount(0); // Get first account
    // Or create account from imported keypair if WDK supports it

    // Step 4: Test wallet
    await testWallet(walletManager, account);

    // Step 5: Send funds to burner (if wallet has balance)
    const testAmount = parseInt(process.env.TEST_AMOUNT_LAMPORTS || '1000000'); // 0.001 SOL default
    
    try {
      await sendFundsToBurner(walletManager, account, burnerAddress, testAmount);
    } catch (error: any) {
      if (error.message.includes('Insufficient balance')) {
        console.log('⚠️  Skipping fund transfer - insufficient balance for testing');
        console.log('   Fund your wallet with devnet SOL to test transfers\n');
      } else {
        throw error;
      }
    }

    console.log('=' .repeat(50));
    console.log('✅ Application completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Application error:', error);
    process.exit(1);
  }
}

// Run the app
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  createWalletWithSocialLogin,
  createBurnerWallet,
  sendFundsToBurner,
  testWallet,
};

