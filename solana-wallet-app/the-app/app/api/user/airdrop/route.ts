import { NextRequest, NextResponse } from 'next/server';
import { createConnection } from '@/lib/solana';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { createUserWalletManagerFromSeed, getUserBalance } from '@/lib/user-wallet';

/**
 * Request airdrop for user account
 * 
 * NOTE: Airdrop is a network operation, not a wallet operation, so we use @solana/web3.js Connection
 * But we get the updated balance using Tether WDK SDK to showcase it
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { seedPhrase, publicKey, amount = 2 } = body; // Default 2 SOL
    
    if (!publicKey) {
      return NextResponse.json(
        { error: 'Public key is required' },
        { status: 400 }
      );
    }

    // Airdrop is a network operation - use @solana/web3.js Connection
    const connection = createConnection();
    const pubkey = new PublicKey(publicKey);
    
    // Request airdrop (amount in SOL, convert to lamports)
    const signature = await connection.requestAirdrop(
      pubkey,
      amount * LAMPORTS_PER_SOL
    );
    
    // Wait for confirmation
    await connection.confirmTransaction(signature, 'confirmed');
    
    // Get updated balance using Tether WDK SDK (if seed phrase provided)
    let balanceSOL: string;
    if (seedPhrase) {
      const walletManager = createUserWalletManagerFromSeed(seedPhrase);
      const balanceLamports = await getUserBalance(walletManager, 0);
      balanceSOL = (Number(balanceLamports) / LAMPORTS_PER_SOL).toFixed(4);
    } else {
      // Fallback to @solana/web3.js if no seed phrase
      const balance = await connection.getBalance(pubkey);
      balanceSOL = (balance / LAMPORTS_PER_SOL).toFixed(4);
    }
    
    return NextResponse.json({
      success: true,
      signature,
      balanceSOL,
      message: `Successfully airdropped ${amount} SOL to ${publicKey}`,
    });
  } catch (error: any) {
    // Handle rate limiting or other errors
    if (error.message?.includes('429') || error.message?.includes('rate limit')) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a few minutes and try again, or use the web faucet at https://faucet.solana.com' },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to request airdrop' },
      { status: 500 }
    );
  }
}

