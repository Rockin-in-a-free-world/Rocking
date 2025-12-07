'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [seedPhrase, setSeedPhrase] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      const isEmpty = !seedPhrase.trim();
      
      // Confirmation only required when generating new seed phrase (empty input)
      if (isEmpty && !confirmed) {
        throw new Error('Please confirm that you understand the requirements');
      }

      // Access user account (account index 0 from seed phrase)
      // If seedPhrase is empty, API will generate new seed phrase (setup mode)
      // If seedPhrase provided, API will access existing wallet (login mode)
      const response = await fetch('/api/user/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seedPhrase: seedPhrase.trim() || undefined }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Setup failed');
      }

      const data = await response.json();
      
      // Store in session (client-side only)
      sessionStorage.setItem('user_public_key', data.publicKey);
      sessionStorage.setItem('user_setup_complete', 'true');
      
      // Store seed phrase temporarily in sessionStorage for dashboard operations
      if (data.seedPhrase) {
        sessionStorage.setItem('user_seed_phrase_temp', data.seedPhrase);
      } else if (seedPhrase.trim()) {
        // If user provided seed phrase, store it temporarily
        sessionStorage.setItem('user_seed_phrase_temp', seedPhrase.trim());
      }
      
      // If seed phrase was generated (new setup), show it to user
      if (data.isNewSetup && data.seedPhrase) {
        alert(`⚠️ IMPORTANT: Save this seed phrase securely!\n\n${data.seedPhrase}\n\nYou won't be able to recover your account without it!`);
      }
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to login. Please check your seed phrase.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-2">Solana User Dashboard</h1>
        <p className="text-gray-600 text-center mb-8">
          Login with your seed phrase or generate a new one
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Seed Phrase (optional - leave empty to generate new)
          </label>
          <textarea
            value={seedPhrase}
            onChange={(e) => setSeedPhrase(e.target.value)}
            placeholder="Enter existing seed phrase or leave empty to generate new"
            rows={3}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {error && (
            <p className="text-red-500 text-sm mt-1">{error}</p>
          )}
        </div>

        {!seedPhrase.trim() && (
          <div className="mb-4">
            <label className="flex items-start space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-1"
              />
              <span className="text-sm text-gray-700">
                I understand that by logging in without a seed, I will create a new Solana wallet and must store the seed phrase.
              </span>
            </label>
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading || (!seedPhrase.trim() && !confirmed)}
          className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Logging in...' : 'Login with Seed Phrase'}
        </button>

        <div className="mt-6 p-4 bg-red-50 rounded-lg">
          <p className="text-sm text-red-800">
            <strong>⚠️ Security Warning:</strong> Never share your seed phrase. 
            This is stored only in your browser session.
          </p>
        </div>
      </div>
    </main>
  );
}

