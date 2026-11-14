import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@libsql/client"],
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
