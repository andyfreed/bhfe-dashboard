import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  // Configure to handle file system issues with Dropbox
  // Optionally use a different output directory if needed
  // distDir: '.next',
  
  // Disable React strict mode to avoid double renders during development
  reactStrictMode: true,
  
  // Optimize for development with Dropbox
  // This helps reduce file locking issues
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
  
  // Configure webpack (required for next-pwa)
  // next-pwa uses webpack configuration which is not compatible with Turbopack
  webpack: (config, { isServer }) => {
    // Return webpack config as-is (next-pwa will modify it)
    return config
  },
};

const pwaConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development", // Disable PWA in development
  publicExcludes: ["!icon-*.png", "!apple-icon-*.png"],
});

export default pwaConfig(nextConfig);
