/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@hashgraph/sdk", "hedera-agent-kit"],
  },
};

export default nextConfig;
