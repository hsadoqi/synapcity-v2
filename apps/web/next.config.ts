import type { NextConfig } from 'next';

// No withSentryConfig: Sentry loads in the browser only after someone turns on
// error reports (features/error-reports), never at build time or on the server.
const nextConfig: NextConfig = {
  agentRules: false,
  experimental: {
    // Server Actions are capped at 1 MB by default. The avatar upload is up
    // to 2 MB (MAX_AVATAR_BYTES) plus multipart overhead.
    serverActions: { bodySizeLimit: '3mb' },
  },
};

export default nextConfig;
