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
      // Client-side: exclude native modules
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'sodium-native': false,
        '@tetherto/wdk-wallet-solana': false,
      };
    }
    
    return config;
  },
  // Ensure server-only modules aren't imported in client components
  serverExternalPackages: ['@tetherto/wdk-wallet-solana', 'sodium-native'],
  // Add empty turbopack config to silence the warning
  // We're using webpack for native module compatibility
  turbopack: {},
}

module.exports = nextConfig

