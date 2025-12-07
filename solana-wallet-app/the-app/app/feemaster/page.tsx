'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function FeemasterLogin() {
  const router = useRouter();
  const [seedPhrase, setSeedPhrase] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      // Validate seed phrase
      const words = seedPhrase.trim().split(/\s+/);
      if (words.length !== 12 && words.length !== 24) {
        throw new Error('Seed phrase must be 12 or 24 words');
      }

      // Setup feemaster account (creates account index 0 and stores in .env)
      const response = await fetch('/api/feemaster/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seedPhrase }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Setup failed');
      }

      const data = await response.json();
      
      // Store in session (client-side only)
      sessionStorage.setItem('feemaster_public_key', data.publicKey);
      sessionStorage.setItem('feemaster_setup_complete', 'true');
      
      // Redirect to dashboard
      router.push('/feemaster/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to login. Please check your seed phrase.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-2">Feemaster Admin</h1>
        <p className="text-gray-600 text-center mb-8">
          Login with your seed phrase
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Seed Phrase
          </label>
          <textarea
            value={seedPhrase}
            onChange={(e) => setSeedPhrase(e.target.value)}
            placeholder="Enter seed phrase (12 or 24 words)"
            rows={3}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {error && (
            <p className="text-red-500 text-sm mt-1">{error}</p>
          )}
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <div className="mt-6 p-4 bg-red-50 rounded-lg">
          <p className="text-sm text-red-800">
            <strong>⚠️ Security Warning:</strong> Never share your seed phrase. 
            This is stored only in your browser session.
          </p>
        </div>
      </div>
    </div>
  );
}

