import { NextRequest, NextResponse } from 'next/server';
import { createConnection } from '@/lib/solana';
import { PublicKey } from '@solana/web3.js';
import { getTransactionSignatures, getTransactionStatuses, calculateMetrics } from '@/lib/transactions';
import { calculateStatus } from '@/lib/status';

/**
 * Get transaction data for dashboard
 * Server-side API route to avoid bundling Solana SDK in client
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json(
        { error: 'Address parameter is required' },
        { status: 400 }
      );
    }

    const connection = createConnection();
    const publicKey = new PublicKey(address);

    // Get transaction signatures
    const signatures = await getTransactionSignatures(connection, publicKey);

    // Get transaction statuses
    const transactions = await getTransactionStatuses(connection, signatures);

    // Calculate metrics from on-chain data only
    const metrics = calculateMetrics(transactions);
    
    // Calculate status (Grand/Good/Gutted)
    const status = calculateStatus(metrics);

    return NextResponse.json({
      success: true,
      transactions,
      metrics,
      status,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

