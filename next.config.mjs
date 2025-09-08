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
  },
  // Cache control headers to prevent aggressive caching
  async headers() {
    return [
      {
        // Apply cache control to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
      {
        // Allow longer caching for static assets
        source: '/(.*)\\.(js|css|png|jpg|jpeg|gif|ico|svg)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  // Generate build ID based on timestamp for cache busting
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },
}

export default nextConfig
