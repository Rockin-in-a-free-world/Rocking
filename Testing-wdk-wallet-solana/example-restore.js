/**
 * Example: Restoring a Wallet from Seed Phrase
 * 
 * This demonstrates how to restore an existing wallet using a seed phrase.
 * Run with: node example-restore.js
 */

import WalletManagerSolana from '@tetherto/wdk-wallet-solana';

async function main() {
  console.log('🔓 Restoring Wallet from Seed Phrase Example\n');
  
  // Example: You have a seed phrase from a previous session
  // In production, you'd get this from secure storage
  const existingMnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
  
  console.log('📝 Restoring wallet from seed phrase...');
  console.log('🔑 Seed phrase:', existingMnemonic);
  console.log('');
  
  try {
    // Restore the wallet with devnet RPC
    const wallet = new WalletManagerSolana(existingMnemonic, {
      rpcUrl: 'https://api.devnet.solana.com',
      commitment: 'confirmed'
    });
    console.log('✅ Wallet restored successfully!\n');
    
    // Get the same accounts (they'll have the same addresses as before)
    // getAccount is async!
    const account1 = await wallet.getAccount(0);
    const account2 = await wallet.getAccount(1);
    
    const address1 = await account1.getAddress();
    const address2 = await account2.getAddress();
    
    console.log('📝 Account addresses:');
    console.log('   Account 1:', address1);
    console.log('   Account 2:', address2);
    console.log('');
    
    // Check balances (returns bigint in lamports)
    console.log('💰 Checking balances...');
    const balance1Lamports = await account1.getBalance();
    const balance2Lamports = await account2.getBalance();
    const balance1SOL = Number(balance1Lamports) / 1e9;
    const balance2SOL = Number(balance2Lamports) / 1e9;
    console.log('   Account 1:', balance1SOL, 'SOL');
    console.log('   Account 2:', balance2SOL, 'SOL');
    
    console.log('\n🎉 Wallet restoration complete!');
    console.log('💡 Note: The accounts will always have the same addresses');
    console.log('   when restored from the same seed phrase.');
    
  } catch (error) {
    console.error('❌ Error restoring wallet:', error.message);
    console.error('   Make sure the seed phrase is valid (12 or 24 words)');
  }
}

main().catch(console.error);

