import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Serve the static PTA Lite prototype at a clean URL.
      { source: "/pta-lite", destination: "/pta-lite.html" },
    ];
  },
};

export default nextConfig;
