'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TransactionMetrics as Metrics, Status } from '@/lib/types';
import { getStoredWalletAddress, isWalletAuthenticated, clearWalletCredentials } from '@/lib/wallet';
import StatusAlert from '@/components/StatusAlert';
import TransactionMetrics from '@/components/TransactionMetrics';

export default function DashboardPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userAddress, setUserAddress] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is authenticated
    if (!isWalletAuthenticated()) {
      router.push('/');
      return;
    }

    // Get user address from session
    const address = getStoredWalletAddress();
    if (address) {
      setUserAddress(address);
      loadDashboardData(address);
    } else {
      // No address found, redirect to home
      router.push('/');
    }
  }, [router]);

  const loadDashboardData = async (address: string) => {
    try {
      setIsLoading(true);
      
      // Call API route instead of using Solana SDK directly in client
      const response = await fetch(`/api/dashboard/transactions?address=${encodeURIComponent(address)}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch transaction data');
      }

      const data = await response.json();
      
      if (data.success) {
        setMetrics(data.metrics);
        // Use status from API (calculated server-side)
        setStatus(data.status);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!userAddress) return;

    const interval = setInterval(() => {
      loadDashboardData(userAddress);
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [userAddress]);

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

  const handleLogout = () => {
    clearWalletCredentials();
    router.push('/');
  };

  const handleRefresh = () => {
    if (userAddress) {
      loadDashboardData(userAddress);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
            >
              {isLoading ? '🔄 Refreshing...' : '🔄 Refresh'}
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>
        
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

