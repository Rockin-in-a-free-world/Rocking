import { NextRequest, NextResponse } from 'next/server';
import { createConnection } from '@/lib/solana';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

/**
 * Request airdrop for feemaster account
 * Uses Solana RPC requestAirdrop (no GitHub auth required)
 * 
 * Devnet airdrops are rate-limited but don't require authentication
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { publicKey, amount = 2 } = body; // Default 2 SOL
    
    if (!publicKey) {
      return NextResponse.json(
        { error: 'Public key is required' },
        { status: 400 }
      );
    }

    const connection = createConnection();
    const pubkey = new PublicKey(publicKey);
    
    // Request airdrop (amount in SOL, convert to lamports)
    const signature = await connection.requestAirdrop(
      pubkey,
      amount * LAMPORTS_PER_SOL
    );
    
    // Wait for confirmation
    await connection.confirmTransaction(signature, 'confirmed');
    
    // Get updated balance
    const balance = await connection.getBalance(pubkey);
    const balanceSOL = balance / LAMPORTS_PER_SOL;
    
    return NextResponse.json({
      success: true,
      signature,
      balance: balance.toString(),
      balanceSOL: balanceSOL.toFixed(4),
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

