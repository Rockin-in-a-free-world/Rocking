'use client';

import { useEffect, useState } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { createConnection } from '@/lib/solana';
import { TransactionMetrics as Metrics, Status } from '@/lib/types';
import { getTransactionSignatures, getTransactionStatuses, calculateMetrics } from '@/lib/transactions';
import { calculateStatus } from '@/lib/status';
import StatusAlert from '@/components/StatusAlert';
import TransactionMetrics from '@/components/TransactionMetrics';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userAddress, setUserAddress] = useState<string | null>(null);

  useEffect(() => {
    // TODO: Get user address from MetaMask SDK or session
    // For now, this is a placeholder
    const address = sessionStorage.getItem('user_solana_address');
    if (address) {
      setUserAddress(address);
      loadDashboardData(address);
    } else {
      setIsLoading(false);
    }
  }, []);

  const loadDashboardData = async (address: string) => {
    try {
      setIsLoading(true);
      const connection = createConnection();
      const publicKey = new PublicKey(address);

      // Get transaction signatures
      const signatures = await getTransactionSignatures(connection, publicKey);

      // Get transaction statuses
      const transactions = await getTransactionStatuses(connection, signatures);

      // TODO: Get acknowledged failures from on-chain storage
      const acknowledgedFailures: string[] = [];

      // Calculate metrics
      const calculatedMetrics = calculateMetrics(transactions, acknowledgedFailures);
      setMetrics(calculatedMetrics);

      // Calculate status
      const calculatedStatus = calculateStatus(calculatedMetrics);
      setStatus(calculatedStatus);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!userAddress) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Wallet Connected</h1>
          <p className="text-gray-600">Please sign in to view your dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
        
        {status && (
          <div className="mb-8">
            <StatusAlert status={status} isLoading={isLoading} />
          </div>
        )}

        {metrics && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Transaction Metrics</h2>
            <TransactionMetrics metrics={metrics} isLoading={isLoading} />
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Account Info</h2>
          <div className="space-y-2">
            <p><span className="font-medium">Address:</span> {userAddress}</p>
            <p className="text-sm text-gray-600">Network: Devnet</p>
          </div>
        </div>
      </div>
    </div>
  );
}

