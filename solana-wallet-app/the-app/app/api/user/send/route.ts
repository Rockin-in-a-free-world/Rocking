import { NextRequest, NextResponse } from 'next/server';
import { createUserWalletManagerFromSeed, sendTransactionWithWDK } from '@/lib/user-wallet';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

// NOTE: We use @solana/web3.js PublicKey only for address validation
// All wallet operations use Tether WDK SDK

/**
 * Send SOL transaction using Tether WDK SDK
 * 
 * This is the main transaction method - uses Tether WDK SDK as required
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { seedPhrase, recipient, amountSOL } = body;
    
    if (!seedPhrase) {
      return NextResponse.json(
        { error: 'Seed phrase is required' },
        { status: 400 }
      );
    }
    
    if (!recipient) {
      return NextResponse.json(
        { error: 'Recipient address is required' },
        { status: 400 }
      );
    }
    
    if (!amountSOL || amountSOL <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Validate recipient address
    try {
      new PublicKey(recipient);
    } catch {
      return NextResponse.json(
        { error: 'Invalid recipient address' },
        { status: 400 }
      );
    }

    // Create wallet manager from seed phrase
    const walletManager = createUserWalletManagerFromSeed(seedPhrase);
    
    // Convert SOL to lamports
    const amountLamports = BigInt(Math.floor(amountSOL * LAMPORTS_PER_SOL));
    
    // Send transaction using Tether WDK SDK
    const signature = await sendTransactionWithWDK(
      walletManager,
      0, // Account index 0
      recipient,
      amountLamports
    );
    
    return NextResponse.json({
      success: true,
      signature,
      message: `Successfully sent ${amountSOL} SOL to ${recipient}`,
    });
  } catch (error: any) {
    console.error('Error sending transaction:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send transaction' },
      { status: 500 }
    );
  }
}

