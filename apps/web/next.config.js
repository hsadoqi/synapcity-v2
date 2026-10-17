/** @type {import('next').NextConfig} */
const nextConfig = {
  agentRules: false,
  experimental: {
    // Server Actions are capped at 1 MB by default. The avatar upload is up
    // to 2 MB (MAX_AVATAR_BYTES) plus multipart overhead.
    serverActions: { bodySizeLimit: '3mb' },
  },
};

export default nextConfig;
