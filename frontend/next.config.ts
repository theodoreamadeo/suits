import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'assets.myntassets.com',
      'via.placeholder.com',
    ],
  }, // Added the missing closing brace here
};

export default nextConfig;