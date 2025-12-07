'use client';

import { Web3AuthProvider } from '@web3auth/modal/react'
import { getWeb3AuthContextConfig } from '@/lib/web3authContext'
import { useEffect, useState } from 'react'

export default function Web3AuthWrapper({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<ReturnType<typeof getWeb3AuthContextConfig> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Get config only in browser (client-side)
      const web3AuthContextConfig = getWeb3AuthContextConfig();
      setConfig(web3AuthContextConfig);
    } catch (err: any) {
      console.error('Web3Auth configuration error:', err);
      setError(err.message || 'Failed to initialize Web3Auth');
    }
  }, []);

  // Show error if configuration failed
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 p-8">
        <div className="max-w-2xl bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-red-800 mb-4">⚠️ Configuration Error</h1>
          <p className="text-red-700 mb-4">{error}</p>
          <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
            <p className="text-sm text-yellow-800">
              <strong>How to fix:</strong>
            </p>
            <ul className="list-disc list-inside mt-2 text-sm text-yellow-800 space-y-1">
              <li>Check Railway Variables (if deployed) or .env.local (if local)</li>
              <li>Ensure NEXT_PUBLIC_EMBEDDED_WALLET_CLIENT_ID is set</li>
              <li>Get your Client ID from: <a href="https://dashboard.web3auth.io" target="_blank" rel="noopener noreferrer" className="underline">Web3Auth Dashboard</a></li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Wait for config to be loaded
  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">🔄</div>
          <p>Initializing Web3Auth...</p>
        </div>
      </div>
    );
  }

  return (
    <Web3AuthProvider config={config}>
      {children}
    </Web3AuthProvider>
  )
}

