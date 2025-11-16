import type { NextConfig } from "next";

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
};

export default nextConfig;
