import { playwright } from '@vitest/browser-playwright';
import { sharedConfig } from './shared.ts';

/*
 * Real-browser mode for a vitest project: headless Chromium through Playwright.
 * Used where jsdom cannot answer the question, such as Storybook story tests.
 * Spread it into a project's `test.browser`.
 */
export function chromiumBrowser() {
  return {
    enabled: true,
    headless: true,
    provider: playwright({}),
    instances: [{ browser: 'chromium' as const }],
  };
}

export const browserConfig = {
  ...sharedConfig,
  test: {
    ...sharedConfig.test,
    browser: chromiumBrowser(),
  },
};
