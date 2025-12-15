import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Don't fail build on lint warnings during development
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Don't fail build on type errors during development
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
