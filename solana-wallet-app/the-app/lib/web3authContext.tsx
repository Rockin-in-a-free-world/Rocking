/**
 * Web3Auth configuration for MetaMask Embedded Wallets
 * 
 * Based on: https://docs.metamask.io/embedded-wallets/sdk/react/
 * 
 * Note: This file is imported by client components only
 */

'use client';

import { type Web3AuthContextConfig } from '@web3auth/modal/react'
import { WEB3AUTH_NETWORK, type Web3AuthOptions } from '@web3auth/modal'

const web3AuthOptions: Web3AuthOptions = {
  clientId: process.env.NEXT_PUBLIC_EMBEDDED_WALLET_CLIENT_ID || '', // Web3Auth Client ID from dashboard
  web3AuthNetwork: process.env.NEXT_PUBLIC_WEB3AUTH_NETWORK === 'mainnet' 
    ? WEB3AUTH_NETWORK.SAPPHIRE_MAINNET 
    : WEB3AUTH_NETWORK.SAPPHIRE_DEVNET, // Use devnet for development
  modalConfig: {
    connectors: {
      // Configure authentication methods
      // Google login is enabled by default
    },
  },
}

const web3AuthContextConfig: Web3AuthContextConfig = {
  web3AuthOptions,
}

export default web3AuthContextConfig

