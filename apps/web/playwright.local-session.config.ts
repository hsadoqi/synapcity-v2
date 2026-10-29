import { defineConfig, devices } from '@playwright/test';

// Signed-in checks against the local Supabase stack. The runner
// (`e2e/run-local-session.mjs`) supplies the stack and the already-running
// server's address; this config starts nothing.
export default defineConfig({
  testDir: 'e2e',
  testMatch: '**/local-session.e2e.ts',
  workers: 1,
  reporter: 'list',
  use: {
    // Set by the person running it; not an input to any Turborepo task.
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    baseURL: process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3000',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
