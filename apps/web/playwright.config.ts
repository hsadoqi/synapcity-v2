import { createPlaywrightConfig } from '@synapcity/dev-playwright-config';

// Each run starts its own servers on free ports (see the shared config), so
// nothing here names a port. Serves the production build, so run `pnpm build`
// first. `E2E_WEB_MODE=dev` serves `next dev` instead, for the specs that need
// the development fixture identity (`SYNAPCITY_DEV_AUTH=fixture`); it is the
// same run-owned server, started and stopped by Playwright.
const dev = process.env.E2E_WEB_MODE === 'dev';

export default await createPlaywrightConfig({
  app: {
    name: 'web',
    command: (port) => `pnpm exec next ${dev ? 'dev' : 'start'} --port ${port}`,
    // The address the app builds its auth redirect and metadata URLs from
    // must be the one this run serves, not a fixed port another checkout may
    // be using.
    env: (origin) => ({ SITE_URL: origin('web') }),
  },
  // Docs, for the shared-look test: both apps must be built first.
  extraServers: [
    {
      name: 'docs',
      command: (port) => `pnpm --dir ../docs exec next start --port ${port}`,
    },
  ],
});
