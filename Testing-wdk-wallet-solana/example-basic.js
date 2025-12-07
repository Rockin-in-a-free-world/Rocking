/**
 * Basic Example: Creating a Wallet and Sending a Transaction
 * 
 * This is a simple Node.js script demonstrating the core SDK functionality.
 * Run with: node example-basic.js
 * 
 * Make sure you have:
 * 1. Installed dependencies: npm install
 * 2. Funded your account with devnet SOL from https://faucet.solana.com/
 */

import WalletManagerSolana from '@tetherto/wdk-wallet-solana';
import { generateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';

async function main() {
  console.log('🚀 Basic wdk-wallet-solana Example\n');
  
  // Step 1: Generate a mnemonic and create a wallet
  console.log('📝 Step 1: Creating a new wallet...');
  const mnemonic = generateMnemonic(wordlist, 128); // 12 words
  console.log('✅ Wallet created!');
  console.log('🔑 Seed phrase:', mnemonic);
  console.log('⚠️  NEVER share this seed phrase with anyone!\n');
  
  // Create wallet with devnet RPC
  const wallet = new WalletManagerSolana(mnemonic, {
    rpcUrl: 'https://api.devnet.solana.com',
    commitment: 'confirmed'
  });
  
  // Step 2: Get accounts (getAccount is async!)
  console.log('📝 Step 2: Getting accounts...');
  const account1 = await wallet.getAccount(0);
  const account2 = await wallet.getAccount(1);
  
  const address1 = await account1.getAddress();
  const address2 = await account2.getAddress();
  console.log('✅ Account 1:', address1);
  console.log('✅ Account 2:', address2);
  console.log('');
  
  // Step 3: Check balances (returns bigint in lamports)
  console.log('📝 Step 3: Checking balances...');
  const balance1Lamports = await account1.getBalance();
  const balance2Lamports = await account2.getBalance();
  const balance1SOL = Number(balance1Lamports) / 1e9;
  const balance2SOL = Number(balance2Lamports) / 1e9;
  console.log('💰 Account 1 balance:', balance1SOL, 'SOL');
  console.log('💰 Account 2 balance:', balance2SOL, 'SOL');
  console.log('');
  
  // Step 4: Send transaction (if account1 has SOL)
  // Need at least 0.1 SOL + fees
  if (balance1SOL >= 0.11) {
    console.log('📝 Step 4: Sending transaction...');
    const amountLamports = BigInt(Math.floor(0.1 * 1e9)); // 0.1 SOL in lamports
    console.log(`📤 Sending 0.1 SOL from Account 1 to Account 2...`);
    
    try {
      const result = await account1.sendTransaction({
        to: address2,
        value: amountLamports
      });
      
      console.log('✅ Transaction sent!');
      console.log('🔗 Signature:', result.signature);
      console.log('💸 Fee:', Number(result.fee) / 1e9, 'SOL');
      console.log('🔗 View on explorer: https://explorer.solana.com/tx/' + result.signature + '?cluster=devnet');
      console.log('');
      
      // Wait a moment for confirmation
      console.log('⏳ Waiting for confirmation...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check balances again
      const newBalance1Lamports = await account1.getBalance();
      const newBalance2Lamports = await account2.getBalance();
      const newBalance1SOL = Number(newBalance1Lamports) / 1e9;
      const newBalance2SOL = Number(newBalance2Lamports) / 1e9;
      console.log('💰 Account 1 new balance:', newBalance1SOL, 'SOL');
      console.log('💰 Account 2 new balance:', newBalance2SOL, 'SOL');
      
    } catch (error) {
      console.error('❌ Transaction failed:', error.message);
    }
  } else {
    console.log('⚠️  Account 1 has insufficient balance for transaction');
    console.log('💡 Get devnet SOL at: https://faucet.solana.com/');
    console.log('   Address:', address1);
  }
  
  console.log('\n🎉 Example complete!');
}

main().catch(console.error);

