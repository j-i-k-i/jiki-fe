import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    reactCompiler: true
  },
  allowedDevOrigins: ["localhost", "local.exercism.io"]
};

export default nextConfig;
