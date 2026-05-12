import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {
    // Resolve workspace root warning by explicitly setting root to current directory
    root: process.cwd(),
  },
};

export default nextConfig;
