'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWeb3Auth } from '@web3auth/modal/react';
import { useSolanaWallet } from '@web3auth/modal/react/solana';
import { authenticateWithGoogle, storeWalletCredentials } from '@/lib/wallet';

export default function Home() {
  const router = useRouter();
  const web3Auth = useWeb3Auth();
  const solanaWallet = useSolanaWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Authenticate with Google using Web3Auth (MetaMask Embedded Wallets)
      const { address, privateKey } = await authenticateWithGoogle(web3Auth, solanaWallet);
      
      // Store credentials in session
      storeWalletCredentials(address, privateKey);
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Sign-in error:', err);
      setError(err.message || 'Sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-2">Solana Wallet Demo</h1>
        <p className="text-gray-600 text-center mb-8">
          Sign in with Google to create your wallet
        </p>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="animate-spin">🔄</span>
              <span>Creating wallet...</span>
            </>
          ) : (
            <>
              <span>🔐</span>
              <span>Sign in with Google</span>
            </>
          )}
        </button>

        {error && (
          <div className="mt-4 p-4 bg-red-50 rounded-lg">
            <p className="text-sm text-red-800">
              <strong>Error:</strong> {error}
            </p>
          </div>
        )}

        <div className="mt-6 text-sm text-gray-500 text-center">
          <p>By signing in, you agree to:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Link a Solana account to your Google account</li>
            <li>Store your seed phrase securely (minimum 2 copies)</li>
            <li className="text-red-600">Demo: Seed phrase stored unencrypted in .env</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
