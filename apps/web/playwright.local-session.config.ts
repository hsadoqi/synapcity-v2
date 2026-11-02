import { defineConfig, devices } from '@playwright/test';

// Signed-in checks against the local Supabase stack. The runner
// (`e2e/run-local-session.mjs`) builds and starts the app from this checkout
// and supplies the stack and that server's address; this config starts nothing
// and has no address of its own, so it cannot be pointed at a server by default.
// eslint-disable-next-line turbo/no-undeclared-env-vars
if (!process.env.E2E_BASE_URL) {
  throw new Error(
    'Run this suite with `pnpm test:e2e:local-session`: it builds and starts the app it tests.',
  );
}

export default defineConfig({
  testDir: 'e2e',
  testMatch: [
    '**/local-session.e2e.ts',
    '**/dashboard-persistence.e2e.ts',
    '**/account.e2e.ts',
  ],
  workers: 1,
  reporter: 'list',
  use: {
    // Set by the runner; not an input to any Turborepo task.
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    baseURL: process.env.E2E_BASE_URL,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
