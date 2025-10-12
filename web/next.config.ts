import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "https://therapyaisunhacks.onrender.com",
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || "wss://therapyaisunhacks.onrender.com",
  },
};

export default nextConfig;
