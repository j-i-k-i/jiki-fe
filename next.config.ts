import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    reactCompiler: true
  },
  transpilePackages: ["interpreters"],
  allowedDevOrigins: ["localhost", "local.exercism.io"]
};

export default nextConfig;
