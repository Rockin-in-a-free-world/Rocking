import { NextRequest, NextResponse } from 'next/server';
import { deriveFeemasterKeypair } from '@/lib/feemaster';
import bs58 from 'bs58';

/**
 * Get feemaster private key (for funding account)
 * This is a SECONDARY operation (button on dashboard)
 * 
 * Derives private key from seed phrase:
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

    // Derive keypair from seed phrase to get private key
    const keypair = await deriveFeemasterKeypair(seedPhrase, 0);
    const privateKey = bs58.encode(keypair.secretKey);

    return NextResponse.json({
      success: true,
      privateKey,
      warning: '⚠️ Keep this private key secure. Never share it.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to get private key' },
      { status: 500 }
    );
  }
}

