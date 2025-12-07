/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Exclude native modules from client-side bundling
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Server-side: allow native modules
      config.externals = config.externals || [];
      // Don't externalize these - they need to be bundled for server
    } else {
      // Client-side: exclude native modules and React Native dependencies
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'sodium-native': false,
        '@tetherto/wdk-wallet-solana': false,
        '@react-native-async-storage/async-storage': false,
        '@metamask/embedded-wallets': false,
      };
      // Ignore React Native dependencies in client bundle
      config.resolve.alias = {
        ...config.resolve.alias,
        '@react-native-async-storage/async-storage': false,
      };
    }
    
    // Suppress warnings for React Native dependencies (not needed for web)
    // MetaMask SDK includes React Native imports but they're not used in web builds
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        module: /node_modules\/@metamask\/sdk/,
        message: /Can't resolve '@react-native-async-storage\/async-storage'/,
      },
      {
        module: /node_modules\/@web3auth/,
        message: /Can't resolve '@react-native-async-storage\/async-storage'/,
      },
    ];
    
    return config;
  },
  // Ensure server-only modules aren't imported in client components
  serverExternalPackages: ['@tetherto/wdk-wallet-solana', 'sodium-native'],
  // Add empty turbopack config to silence the warning
  // We're using webpack for native module compatibility
  turbopack: {},
}

module.exports = nextConfig

