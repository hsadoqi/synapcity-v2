import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

const dirname = path.dirname(fileURLToPath(import.meta.url));

// Storybook's browser-test project lives in its own config file so the addon's `test` options are
// not merged into the repository's root Vitest config. It runs on the same Vitest as the rest of
// the repository (5.0.2); ADR-0015 amends ADR-0012's earlier isolated Vitest 4.x.
export default defineConfig({
  optimizeDeps: {
    // Listed up front so Vite does not discover them mid-run, re-optimize, and reload a
    // running test. Add a Base UI subpath here when a component first imports it.
    include: ['storybook/theming'],
  },
  test: {
    // Each story file opens its own page in a real browser. With every file at once, a busy
    // machine or small CI runner starves the animation, focus and timing assertions and they
    // fail intermittently (verified: the full suite failed 1-3 different stories per run under
    // load, then passed 190/190 with two workers). Raise this only with spare CPU.
    maxWorkers: 2,
    projects: [
      {
        plugins: [
          storybookTest({
            configDir: path.join(dirname, '.storybook'),
          }),
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: 'chromium' }],
          },
        },
        optimizeDeps: {
          include: ['storybook/theming', 'react-dom', 'react/jsx-runtime'],
        },
      },
    ],
  },
});
