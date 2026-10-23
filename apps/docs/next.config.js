/** @type {import('next').NextConfig} */
const nextConfig = {
  agentRules: false,
  experimental: {
    agentUpgrade: 'security',
  },
};

export default nextConfig;
