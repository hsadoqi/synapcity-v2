import { defineConfig, devices } from '@playwright/test';
import type { PlaywrightTestConfig } from '@playwright/test';

type CreatePlaywrightConfigInput = {
  /** Port the app under test listens on. */
  port: number;
  /** Command that starts the app. Started once, and reused locally if already running. */
  command: string;
  /** Directory holding the `*.e2e.ts` files. Defaults to `e2e`. */
  testDir?: string;
};

/*
 * End-to-end config for one app. The app is started by Playwright's
 * `webServer`; locally an already-running server is reused, in CI a fresh one
 * is always started and retries are on.
 */
export function createPlaywrightConfig({
  port,
  command,
  testDir = 'e2e',
}: CreatePlaywrightConfigInput): PlaywrightTestConfig {
  const isCI = Boolean(process.env.CI);
  const baseURL = `http://localhost:${port}`;

  return defineConfig({
    testDir,
    testMatch: '**/*.e2e.ts',
    fullyParallel: true,
    forbidOnly: isCI,
    retries: isCI ? 2 : 0,
    reporter: isCI ? [['github'], ['html', { open: 'never' }]] : 'list',
    use: { baseURL, trace: 'on-first-retry' },
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
    webServer: {
      command,
      url: baseURL,
      reuseExistingServer: !isCI,
      timeout: 120_000,
    },
  });
}
