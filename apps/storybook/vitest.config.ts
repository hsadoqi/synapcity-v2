import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig, mergeConfig } from 'vitest/config';

import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';

import { browserConfig } from '@synapcity/dev-vitest-config/browser';

const dirname =
  typeof import.meta.dirname !== 'undefined'
    ? import.meta.dirname
    : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
const config = defineConfig({
  test: {
    projects: [
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({ configDir: path.join(dirname, '.storybook') }),
        ],
        // `browser` (headless Chromium) comes from `browserConfig` through
        // `extends: true`. Declaring it here as well merges the two
        // `instances` arrays, and every story then runs twice.
        test: {
          name: 'storybook',
        },
      },
    ],
  },
});

export default mergeConfig(browserConfig, config);
