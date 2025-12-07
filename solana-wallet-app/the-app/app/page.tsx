'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      // TODO: Integrate MetaMask Embedded Wallets SDK
      // For now, this is a placeholder
      console.log('Google sign-in clicked');
      
      // Simulate authentication
      // In real implementation:
      // 1. Initialize MetaMask Embedded Wallets SDK
      // 2. Authenticate with Google
      // 3. Get Solana account
      // 4. Store credentials
      // 5. Redirect to dashboard
      
      // Placeholder: Store mock address for demo
      sessionStorage.setItem('user_solana_address', '11111111111111111111111111111111');
      
      router.push('/dashboard');
    } catch (error) {
      console.error('Sign-in error:', error);
      alert('Sign-in failed. Please try again.');
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

        <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Demo Mode:</strong> This is a development version. 
            MetaMask Embedded Wallets SDK integration is pending.
          </p>
        </div>

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
