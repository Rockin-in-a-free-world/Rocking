'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { RentPaymentRequest } from '@/lib/types';

interface OperationStatus {
  setup: boolean;
  viewPrivateKey: boolean;
  checkBalance: boolean;
  payRent: boolean;
}

export default function FeemasterDashboard() {
  const router = useRouter();
  const [publicKey, setPublicKey] = useState<string>('');
  const [balance, setBalance] = useState<string>('0');
  const [privateKey, setPrivateKey] = useState<string>('');
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<RentPaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [operationStatus, setOperationStatus] = useState<OperationStatus>({
    setup: false,
    viewPrivateKey: false,
    checkBalance: false,
    payRent: false,
  });

  const handleCheckBalance = useCallback(async () => {
    try {
      // Get seed phrase from sessionStorage (temporary) or it will use env vars
      const tempSeedPhrase = sessionStorage.getItem('feemaster_seed_phrase_temp');
      
      const response = await fetch('/api/feemaster/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seedPhrase: tempSeedPhrase || undefined }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get balance');
      }
      
      const data = await response.json();
      setBalance(data.balanceSOL);
      setOperationStatus(prev => ({ ...prev, checkBalance: true }));
    } catch (error: any) {
      console.error('Error checking balance:', error);
      alert(error.message || 'Failed to check balance');
    }
  }, []);

  const handleViewPrivateKey = async () => {
    // Toggle: if already showing, hide it
    if (showPrivateKey) {
      setShowPrivateKey(false);
      setPrivateKey('');
      return;
    }
    
    // Otherwise, fetch and show private key
    try {
      // Get seed phrase from sessionStorage (temporary) or it will use env vars
      const tempSeedPhrase = sessionStorage.getItem('feemaster_seed_phrase_temp');
      
      const response = await fetch('/api/feemaster/private-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seedPhrase: tempSeedPhrase || undefined }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get private key');
      }
      
      const data = await response.json();
      setPrivateKey(data.privateKey);
      setShowPrivateKey(true);
      setOperationStatus(prev => ({ ...prev, viewPrivateKey: true }));
    } catch (error: any) {
      console.error('Error getting private key:', error);
      alert(error.message || 'Failed to get private key');
    }
  };

  const handlePayRent = async () => {
    // TODO: Implement rent payment
    alert('Rent payment functionality coming soon');
    setOperationStatus(prev => ({ ...prev, payRent: true }));
  };

  const handleRequestAirdrop = async () => {
    try {
      const response = await fetch('/api/feemaster/airdrop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicKey, amount: 2 }), // Request 2 SOL
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to request airdrop');
      }
      
      const data = await response.json();
      alert(`✅ Airdrop successful! ${data.balanceSOL} SOL received.\n\nSignature: ${data.signature}`);
      
      // Refresh balance
      handleCheckBalance();
    } catch (error: any) {
      console.error('Error requesting airdrop:', error);
      alert(error.message || 'Failed to request airdrop. You may need to use the web faucet at https://faucet.solana.com');
    }
  };

  useEffect(() => {
    const setupComplete = sessionStorage.getItem('feemaster_setup_complete');
    const storedPublicKey = sessionStorage.getItem('feemaster_public_key');
    
    if (!setupComplete || !storedPublicKey) {
      router.push('/feemaster');
      return;
    }

    setPublicKey(storedPublicKey);
    setOperationStatus(prev => ({ ...prev, setup: true }));
    
    // Automatically load balance for account index 0
    handleCheckBalance();
    
    setLoading(false);
  }, [router, handleCheckBalance]);

  const handleLogout = () => {
    sessionStorage.removeItem('feemaster_public_key');
    sessionStorage.removeItem('feemaster_setup_complete');
    router.push('/feemaster');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">🔄</div>
          <p>Loading feemaster dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Feemaster Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Logout
          </button>
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
                    value={publicKey}
                    readOnly
                    className="flex-1 p-2 text-sm font-mono bg-gray-50 border rounded-lg break-all"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(publicKey);
                      alert('Address copied to clipboard!');
                    }}
                    className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                  >
                    Copy
                  </button>
                </div>
              </div>
              <div>
                <span className="font-medium">Balance:</span>{' '}
                <span className="text-lg font-bold">
                  {balance !== '0' ? `${balance} SOL` : 'Click "Check Balance" to load'}
                </span>
              </div>
              {showPrivateKey && privateKey && (
                <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200">
                  <p className="text-sm font-medium text-yellow-800 mb-2">Private Key:</p>
                  <textarea
                    value={privateKey}
                    readOnly
                    rows={3}
                    className="w-full p-2 text-xs font-mono bg-white border rounded"
                  />
                  <p className="text-xs text-yellow-700 mt-2">
                    ⚠️ Keep this private key secure. Never share it.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Feemaster Operations</h2>
            <div className="space-y-2">
              <button
                onClick={handleCheckBalance}
                className={`w-full px-4 py-2 rounded-lg text-center ${
                  operationStatus.checkBalance
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-gray-400 text-white hover:bg-gray-500'
                }`}
              >
                {operationStatus.checkBalance ? '✓ Check Balance' : 'Check Balance'}
              </button>
              <button
                onClick={handleViewPrivateKey}
                className={`w-full px-4 py-2 rounded-lg text-center ${
                  showPrivateKey
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : operationStatus.viewPrivateKey
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-gray-400 text-white hover:bg-gray-500'
                }`}
              >
                {showPrivateKey ? 'Hide Private Key' : operationStatus.viewPrivateKey ? '✓ View Private Key' : 'View Private Key'}
              </button>
              <button
                onClick={handlePayRent}
                className={`w-full px-4 py-2 rounded-lg text-center ${
                  operationStatus.payRent
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-gray-400 text-white hover:bg-gray-500'
                }`}
              >
                {operationStatus.payRent ? '✓ Pay Rent' : 'Pay Rent'}
              </button>
              <button
                onClick={handleRequestAirdrop}
                className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-center"
              >
                💧 Get Devnet SOL (2 SOL)
              </button>
              <p className="text-xs text-gray-500 text-center mt-1">
                Or use <a href={`https://faucet.solana.com?address=${publicKey}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">web faucet</a> (requires GitHub auth)
              </p>
              <a
                href={`https://explorer.solana.com/address/${publicKey}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-center"
              >
                View on Explorer
              </a>
              <a
                href="https://faucet.solana.com"
                target="_blank"
                rel="noopener noreferrer"
                className="block px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-center"
              >
                Get Devnet SOL
              </a>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Rent Payment Queue</h2>
          {pendingRequests.length === 0 ? (
            <p className="text-gray-600">No pending rent payments</p>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <div
                  key={request.userPDA}
                  className="border rounded-lg p-4 flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium">User PDA: {request.userPDA}</p>
                    <p className="text-sm text-gray-600">
                      Google User ID: {request.googleUserId}
                    </p>
                    <p className="text-sm text-gray-600">
                      Rent: {request.rentAmount / 1e9} SOL
                    </p>
                  </div>
                  <button
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    onClick={() => {
                      // TODO: Implement rent payment
                      alert('Rent payment functionality coming soon');
                    }}
                  >
                    Pay Rent
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

