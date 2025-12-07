import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { createConnection } from '@/lib/solana';

/**
 * Get feemaster account balance
 * This is a SECONDARY operation (button on dashboard)
 */
export async function GET(request: NextRequest) {
  try {
    const publicKey = process.env.FEEMASTER_PUBLIC_KEY;
    
    if (!publicKey) {
      return NextResponse.json(
        { error: 'Feemaster account not set up. Run setup first.' },
        { status: 400 }
      );
    }

    const connection = createConnection();
    const pubkey = new PublicKey(publicKey);
    const balance = await connection.getBalance(pubkey);

    return NextResponse.json({
      success: true,
      balance: balance.toString(),
      balanceSOL: (balance / 1e9).toFixed(4),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to get balance' },
      { status: 500 }
    );
  }
}

