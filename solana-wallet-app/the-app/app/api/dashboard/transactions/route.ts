import { NextRequest, NextResponse } from 'next/server';
import { createConnection } from '@/lib/solana';
import { PublicKey } from '@solana/web3.js';
import { getTransactionSignatures, getTransactionStatuses, calculateMetrics } from '@/lib/transactions';
import { calculateStatus } from '@/lib/status';
import { createUserWalletManagerFromSeed, getUserBalance } from '@/lib/user-wallet';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

/**
 * Get transaction data for dashboard
 * 
 * NOTE: Transaction queries use @solana/web3.js Connection (read-only network queries)
 * Balance uses Tether WDK SDK (wallet operation) if seed phrase provided
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const seedPhrase = searchParams.get('seedPhrase'); // Optional - for Tether WDK balance

    if (!address) {
      return NextResponse.json(
        { error: 'Address parameter is required' },
        { status: 400 }
      );
    }

    // Transaction queries use @solana/web3.js (read-only network operations)
    const connection = createConnection();
    const publicKey = new PublicKey(address);

    // Get transaction signatures
    const signatures = await getTransactionSignatures(connection, publicKey);

    // Get transaction statuses (pass user address to determine outgoing vs incoming)
    const transactions = await getTransactionStatuses(connection, signatures, publicKey);

    // Calculate metrics from on-chain data only
    const metrics = calculateMetrics(transactions);
    
    // Calculate status (Grand/Good/Gutted)
    const status = calculateStatus(metrics);

    // Get balance - use Tether WDK SDK if seed phrase provided, otherwise fallback to @solana/web3.js
    let balance: number;
    if (seedPhrase) {
      // Use Tether WDK SDK for balance (wallet operation)
      const walletManager = createUserWalletManagerFromSeed(seedPhrase);
      const balanceLamports = await getUserBalance(walletManager, 0);
      balance = Number(balanceLamports) / LAMPORTS_PER_SOL;
    } else {
      // Fallback to @solana/web3.js for balance (read-only query)
      balance = await connection.getBalance(publicKey) / LAMPORTS_PER_SOL;
    }

    return NextResponse.json({
      success: true,
      transactions,
      metrics,
      status: { status }, // status is calculated, wrap in object for compatibility
      balance,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

