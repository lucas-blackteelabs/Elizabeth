import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  trailingSlash: true,
  images: { unoptimized: true },
  async rewrites() {
    // The browser talks to /api on this origin; Next proxies to the service, so no CORS dance.
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.FAMILY_OS_API_ORIGIN ?? 'http://localhost:8080/api'}/:path*`,
      },
    ];
  },
};

export default nextConfig;
