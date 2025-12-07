/**
 * Test suite for Solana Wallet Integration
 */

import { createWalletWithSocialLogin, createBurnerWallet, testWallet } from './app.js';
import { Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';

async function runTests() {
  console.log('🧪 Running Solana Wallet Integration Tests\n');
  console.log('=' .repeat(50) + '\n');

  const connection = new Connection(
    process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
    'confirmed'
  );

  try {
    // Test 1: Wallet Creation
    console.log('Test 1: Wallet Creation with Social Login');
    console.log('-'.repeat(50));
    const { walletManager, publicKey } = await createWalletWithSocialLogin();
    
    // Verify public key is valid
    if (!publicKey || publicKey.length < 32) {
      throw new Error('Invalid public key generated');
    }
    console.log('✅ Wallet creation test passed\n');

    // Test 2: Burner Wallet Creation
    console.log('Test 2: Burner Wallet Creation');
    console.log('-'.repeat(50));
    const { address: burnerAddress } = createBurnerWallet();
    
    // Verify burner address is valid
    if (!burnerAddress || burnerAddress.length < 32) {
      throw new Error('Invalid burner address generated');
    }
    console.log('✅ Burner wallet creation test passed\n');

    // Test 3: Wallet Functionality
    console.log('Test 3: Wallet Functionality');
    console.log('-'.repeat(50));
    const account = await walletManager.getAccount(0);
    await testWallet(walletManager, account);
    console.log('✅ Wallet functionality test passed\n');

    // Test 4: Connection Test
    console.log('Test 4: Solana Connection');
    console.log('-'.repeat(50));
    const version = await connection.getVersion();
    console.log(`   Solana Version: ${version['solana-core']}`);
    console.log('✅ Solana connection test passed\n');

    console.log('=' .repeat(50));
    console.log('✅ All tests passed!\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

runTests();

