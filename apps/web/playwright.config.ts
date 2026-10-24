import { createPlaywrightConfig } from '@synapcity/dev-playwright-config';

// Serves the production build, so run `pnpm build` first. Locally an
// already-running `pnpm dev` on the same port is reused instead.
export default createPlaywrightConfig({
  port: 8080,
  command: 'pnpm exec next start --port 8080',
  // Docs, for the shared-look test: both apps must be built first.
  extraServers: [
    { port: 4000, command: 'pnpm --dir ../docs exec next start --port 4000' },
  ],
});
