import { NextRequest, NextResponse } from 'next/server';
import { createUserWalletManagerFromSeed, getUserBalance } from '@/lib/user-wallet';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

/**
 * Get user balance using Tether WDK SDK
 * 
 * This uses Tether WDK SDK's native getBalance() method
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { seedPhrase } = body;
    
    if (!seedPhrase) {
      return NextResponse.json(
        { error: 'Seed phrase is required' },
        { status: 400 }
      );
    }

    // Create wallet manager and get balance using Tether WDK SDK
    const walletManager = createUserWalletManagerFromSeed(seedPhrase);
    const balanceLamports = await getUserBalance(walletManager, 0);
    const balanceSOL = Number(balanceLamports) / LAMPORTS_PER_SOL;

    return NextResponse.json({
      success: true,
      balance: balanceLamports.toString(),
      balanceSOL: balanceSOL.toFixed(4),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to get balance' },
      { status: 500 }
    );
  }
}

