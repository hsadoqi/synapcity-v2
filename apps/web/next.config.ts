import type { NextConfig } from 'next';

// No withSentryConfig: Sentry loads in the browser only after someone turns on
// error reports (@synapcity/frontend-error-reports), never at build time or on the server.
const nextConfig: NextConfig = {
  // Only the local-session runner sets this, to build against the local
  // Supabase stack without replacing the ordinary build in `.next`.
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  distDir: process.env.NEXT_DIST_DIR ?? '.next',
  agentRules: false,
  experimental: {
    // Server Actions are capped at 1 MB by default. The avatar upload is up
    // to 2 MB (MAX_AVATAR_BYTES) plus multipart overhead.
    serverActions: { bodySizeLimit: '3mb' },
  },
};

export default nextConfig;
