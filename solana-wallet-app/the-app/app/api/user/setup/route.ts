import { NextRequest, NextResponse } from 'next/server';
import { createUserWalletManagerFromSeed, getUserAccount } from '@/lib/user-wallet';
import { generateSeedPhrase } from '@/lib/feemaster-generate';

/**
 * Setup/Login user account
 * 
 * Two modes:
 * 1. Setup (new): Generate new seed phrase → creates new wallet
 * 2. Login (existing): Use provided seed phrase → accesses existing wallet (account index 0)
 * 
 * Uses Tether SDK to derive account index 0 from seed phrase
 */
export async function POST(request: NextRequest) {
  try {
    let { seedPhrase } = await request.json();

    const isNewSetup = !seedPhrase || seedPhrase.trim() === '';
    
    // If no seed phrase provided, generate one (new setup)
    if (isNewSetup) {
      seedPhrase = generateSeedPhrase();
    }

    // Access user account using Tether SDK
    // Tether SDK derives account index 0 from the seed phrase
    // This will throw an error if seed phrase is invalid
    let walletManager;
    let publicKey;
    try {
      walletManager = createUserWalletManagerFromSeed(seedPhrase);
      const account = await getUserAccount(walletManager, 0);
      publicKey = await account.getAddress();
    } catch (error: any) {
      // Tether SDK will throw error if seed phrase is invalid
      return NextResponse.json(
        { error: `Invalid seed phrase: ${error.message || 'Seed phrase validation failed. Please check your seed phrase and try again.'}` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      publicKey,
      seedPhrase: isNewSetup ? seedPhrase : undefined, // Only return if newly generated
      isNewSetup,
      message: 'User account created successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to setup user account' },
      { status: 500 }
    );
  }
}

