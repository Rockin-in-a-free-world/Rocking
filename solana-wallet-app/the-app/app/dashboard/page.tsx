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
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [sendRecipient, setSendRecipient] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sending, setSending] = useState(false);

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
      
      // Get seed phrase from sessionStorage (temporary) for Tether WDK SDK balance
      const tempSeedPhrase = sessionStorage.getItem('user_seed_phrase_temp');
      
      // Call API route - pass seed phrase to use Tether WDK SDK for balance
      const url = `/api/dashboard/transactions?address=${encodeURIComponent(address)}${tempSeedPhrase ? `&seedPhrase=${encodeURIComponent(tempSeedPhrase)}` : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch transaction data');
      }

      const data = await response.json();
      
      if (data.success) {
        setMetrics(data.metrics);
        // Use status from API (calculated server-side)
        setStatus(data.status.status || data.status); // Handle both object and string
        setBalance(data.balance);
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

  const handleRequestAirdrop = async () => {
    if (!userAddress) return;
    
    try {
      // Get seed phrase from sessionStorage (temporary)
      const tempSeedPhrase = sessionStorage.getItem('user_seed_phrase_temp');
      
      const response = await fetch('/api/user/airdrop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          publicKey: userAddress, 
          seedPhrase: tempSeedPhrase || undefined, // Pass seed phrase to use Tether WDK for balance
          amount: 2 
        }), // Request 2 SOL
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to request airdrop');
      }
      
      const data = await response.json();
      alert(`✅ Airdrop successful! ${data.balanceSOL} SOL received.\n\nSignature: ${data.signature}`);
      
      // Refresh dashboard data
      loadDashboardData(userAddress);
    } catch (error: any) {
      console.error('Error requesting airdrop:', error);
      alert(error.message || 'Failed to request airdrop. You may need to use the web faucet at https://faucet.solana.com');
    }
  };

  const handleSendSOL = async () => {
    if (!userAddress || !sendRecipient || !sendAmount) {
      alert('Please enter recipient address and amount');
      return;
    }

    const amount = parseFloat(sendAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount greater than 0');
      return;
    }

    setSending(true);
    try {
      // Get seed phrase from sessionStorage (temporary)
      const tempSeedPhrase = sessionStorage.getItem('user_seed_phrase_temp');
      
      if (!tempSeedPhrase) {
        throw new Error('Seed phrase not found. Please login again.');
      }

      const response = await fetch('/api/user/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seedPhrase: tempSeedPhrase,
          recipient: sendRecipient.trim(),
          amountSOL: amount,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send transaction');
      }
      
      const data = await response.json();
      alert(`✅ Transaction sent successfully!\n\nSignature: ${data.signature}\n\nAmount: ${amount} SOL to ${sendRecipient}`);
      
      // Clear form
      setSendRecipient('');
      setSendAmount('');
      
      // Refresh dashboard data after a short delay
      setTimeout(() => {
        loadDashboardData(userAddress);
      }, 2000);
    } catch (error: any) {
      console.error('Error sending transaction:', error);
      alert(error.message || 'Failed to send transaction');
    } finally {
      setSending(false);
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

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Transaction Metrics & Balance</h2>
          <TransactionMetrics metrics={metrics} isLoading={isLoading} balance={balance} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Account Info</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wallet Address (Public Key)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={userAddress || ''}
                    readOnly
                    className="flex-1 p-2 text-sm font-mono bg-gray-50 border rounded-lg break-all"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <button
                    onClick={() => {
                      if (userAddress) {
                        navigator.clipboard.writeText(userAddress);
                        alert('Address copied to clipboard!');
                      }
                    }}
                    className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                  >
                    Copy
                  </button>
                </div>
              </div>
              <div>
                <span className="font-medium">Network:</span>{' '}
                <span className="text-sm text-gray-600">Devnet</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">User Operations</h2>
            <div className="space-y-2">
              <button
                onClick={handleRequestAirdrop}
                className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 text-center flex items-center justify-center gap-2"
              >
                💧 Get Devnet SOL (2 SOL)
              </button>
              <p className="text-xs text-gray-500 text-center mt-1">
                Or use <a href={`https://faucet.solana.com?address=${userAddress}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">web faucet</a> (requires GitHub auth)
              </p>
              <a
                href={`https://explorer.solana.com/address/${userAddress}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-center"
              >
                View on Explorer
              </a>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Send SOL</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipient Address
              </label>
              <input
                type="text"
                value={sendRecipient}
                onChange={(e) => setSendRecipient(e.target.value)}
                placeholder="Enter Solana address"
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (SOL)
              </label>
              <input
                type="number"
                value={sendAmount}
                onChange={(e) => setSendAmount(e.target.value)}
                placeholder="0.0"
                step="0.1"
                min="0"
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleSendSOL}
              disabled={sending || !sendRecipient || !sendAmount}
              className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {sending ? 'Sending...' : 'Send SOL'}
            </button>
            {balance !== null && (
              <p className="text-sm text-gray-600 text-center">
                Your balance: {balance.toFixed(4)} SOL
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

