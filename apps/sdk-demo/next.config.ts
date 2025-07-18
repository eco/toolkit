import { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack: config => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding', { 'node:crypto': 'commonjs crypto' })
    return config
  },
};

module.exports = nextConfig;
