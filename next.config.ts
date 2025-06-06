// next.config.js or next.config.ts (if using TypeScript)

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["maps.googleapis.com", "images.unsplash.com"],
  },
};

export default nextConfig; // Don't forget to export nextConfig!