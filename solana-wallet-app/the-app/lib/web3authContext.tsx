/**
 * Web3Auth configuration for MetaMask Embedded Wallets
 * 
 * Based on: https://docs.metamask.io/embedded-wallets/sdk/react/
 * 
 * Environment Variable Priority:
 * 1. Railway Variables (process.env.NEXT_PUBLIC_EMBEDDED_WALLET_CLIENT_ID)
 * 2. .env.local or .env file (fallback)
 * 
 * Error Handling: Provides clear error messages if secret is not available
 */

'use client';

import { type Web3AuthContextConfig } from '@web3auth/modal/react'
import { WEB3AUTH_NETWORK, type Web3AuthOptions } from '@web3auth/modal'

/**
 * Get Web3Auth Client ID from environment
 * 
 * Checks Railway Variables first, then .env files
 * Provides helpful error messages if not found
 */
function getWeb3AuthClientId(): string {
  // Check Railway Variables first (production)
  let clientId = process.env.NEXT_PUBLIC_EMBEDDED_WALLET_CLIENT_ID;

  // Validate and provide helpful error messages
  if (!clientId || clientId.trim() === '') {
    const isRailway = process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY;
    const envSource = isRailway ? 'Railway Variables' : '.env file';
    
    const errorMessage = `
⚠️ NEXT_PUBLIC_EMBEDDED_WALLET_CLIENT_ID is not set!

Current environment: ${isRailway ? 'Railway (production)' : 'Local development'}

To fix this:
${isRailway ? `
1. Go to Railway Dashboard → Your Project → Variables
2. Add: NEXT_PUBLIC_EMBEDDED_WALLET_CLIENT_ID = your_web3auth_client_id
3. Make sure it's set as a "Public" variable (not secret)
4. Redeploy the service

Note: Railway Variables are shared across all services in the project.
` : `
1. Create or update .env.local file in the-app directory
2. Add: NEXT_PUBLIC_EMBEDDED_WALLET_CLIENT_ID=your_web3auth_client_id
3. Restart the dev server

Get your Client ID from: https://dashboard.web3auth.io
`}

Web3Auth will not work until this is configured.
    `.trim();

    console.error(errorMessage);
    
    // For build-time, use a placeholder to prevent build failure
    // But log the error clearly
    if (typeof window === 'undefined') {
      console.warn('⚠️ Build-time: Using placeholder clientId. This will fail at runtime if not set.');
      return 'PLACEHOLDER_CLIENT_ID_FOR_BUILD';
    }
    
    // At runtime, throw error to make it clear
    throw new Error(
      `NEXT_PUBLIC_EMBEDDED_WALLET_CLIENT_ID is required but not set in ${envSource}. ` +
      `Please configure it in Railway Variables or .env.local file. ` +
      `Get your Client ID from: https://dashboard.web3auth.io`
    );
  }

  return clientId.trim();
}

/**
 * Get Web3Auth configuration
 * 
 * This function creates the config lazily to avoid build-time initialization errors
 */
export function getWeb3AuthContextConfig(): Web3AuthContextConfig {
  const clientId = getWeb3AuthClientId();

  const web3AuthOptions: Web3AuthOptions = {
    clientId,
    web3AuthNetwork: process.env.NEXT_PUBLIC_WEB3AUTH_NETWORK === 'mainnet' 
      ? WEB3AUTH_NETWORK.SAPPHIRE_MAINNET 
      : WEB3AUTH_NETWORK.SAPPHIRE_DEVNET, // Use devnet for development
    modalConfig: {
      connectors: {
        // Configure authentication methods
        // Google login is enabled by default
      },
    },
  };

  const web3AuthContextConfig: Web3AuthContextConfig = {
    web3AuthOptions,
  };

  return web3AuthContextConfig;
}

// Export default for backward compatibility
export default getWeb3AuthContextConfig;

