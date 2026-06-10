import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  async rewrites() {
    return [
      {
        // Proxy standard graph and metric requests to the python ML engine
        source: '/api/graph/:path*',
        destination: 'http://localhost:5001/graph/:path*',
      },
      {
        source: '/api/metrics',
        destination: 'http://localhost:5001/metrics',
      },
      {
        source: '/api/predict',
        destination: 'http://localhost:5001/predict',
      }
    ];
  },
};

export default nextConfig;
