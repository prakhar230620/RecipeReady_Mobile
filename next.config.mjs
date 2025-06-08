/** @type {import('next').NextConfig} */

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    domains: ['images.unsplash.com', 'lh3.googleusercontent.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  distDir: '.next',
  reactStrictMode: true,
  staticPageGenerationTimeout: 180,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  webpack: (config, { isServer, dev }) => {
    // Optimize for development
    if (dev) {
      config.optimization.minimize = false;
      config.optimization.minimizer = [];
    }
    
    // Handle the punycode warning
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        punycode: false
      };
    }
    
    return config;
  },
  // Ensure static files are properly served
  poweredByHeader: false,
  generateEtags: false,
  compress: true,
  // Add production specific settings
  productionBrowserSourceMaps: false,
}

export default nextConfig;