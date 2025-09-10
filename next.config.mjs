import withBundleAnalyzer from '@next/bundle-analyzer';

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

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
  // Optimized cache control headers for performance + freshness balance
  async headers() {
    return [
      {
        // HTML pages: Short cache with revalidation
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, stale-while-revalidate=86400',
          },
        ],
      },
      {
        // API routes: Very short cache for game data
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, stale-while-revalidate=300',
          },
        ],
      },
      {
        // Static JS/CSS: Long cache but with version-based URLs
        source: '/(.*)\\.(js|css)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Images: Long cache (they don't change often)
        source: '/(.*)\\.(png|jpg|jpeg|gif|ico|svg|webp)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000, stale-while-revalidate=86400',
          },
        ],
      },
    ];
  },
  // Use package version for build ID instead of timestamp  
  generateBuildId: async () => {
    const { readFileSync } = await import('fs');
    const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));
    return `v${packageJson.version}`;
  },
}

export default bundleAnalyzer(nextConfig)
