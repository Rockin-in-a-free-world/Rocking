import { NextRequest, NextResponse } from 'next/server';
import { createFeemasterAccount, getFeemasterBalance } from '@/lib/feemaster';

/**
 * Get feemaster account balance using Tether SDK
 * This is a SECONDARY operation (button on dashboard)
 * 
 * Reads seed phrase from:
 * 1. Request body (temporary session storage - for immediate use after setup)
 * 2. Environment variables (Railway secrets or .env.local - for persistence)
 */
export async function POST(request: NextRequest) {
  try {
    // Try to get seed phrase from request body first (temporary session storage)
    let body: { seedPhrase?: string } = {};
    try {
      body = await request.json();
    } catch (e) {
      // Request body might be empty, continue to env vars
    }
    
    // Get seed phrase from request body (temporary) or environment variables (persistent)
    const seedPhrase = body.seedPhrase || process.env.FEEMASTER_SEED_PHRASE;
    
    if (!seedPhrase) {
      return NextResponse.json(
        { error: 'Feemaster account not set up. Run setup first and add FEEMASTER_SEED_PHRASE to environment variables.' },
        { status: 400 }
      );
    }
    
    // Create wallet manager and get balance using Tether SDK
    const walletManager = createFeemasterAccount(seedPhrase);
    const balanceLamports = await getFeemasterBalance(walletManager);
    const balanceSOL = Number(balanceLamports) / 1e9;

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

