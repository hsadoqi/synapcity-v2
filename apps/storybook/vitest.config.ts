import { globSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig, mergeConfig } from 'vitest/config';

import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';

import { browserConfig } from '@synapcity/dev-vitest-config/browser';

const dirname =
  typeof import.meta.dirname !== 'undefined'
    ? import.meta.dirname
    : path.dirname(fileURLToPath(import.meta.url));

// Every JS subpath `@synapcity/frontend-ui` exports, as explicit ids for `optimizeDeps.include`.
// A glob there (`@synapcity/frontend-ui/**`) cannot work: Vite's `expandGlobIds` always adds the
// bare package name, and this package has no `.` export, so resolving it throws.
const frontendUiIds = (() => {
  const name = '@synapcity/frontend-ui';
  const dir = path.join(dirname, 'node_modules', name);
  const { exports } = JSON.parse(
    readFileSync(path.join(dir, 'package.json'), 'utf8'),
  ) as {
    exports: Record<string, string>;
  };
  return Object.entries(exports)
    .filter(([key]) => !key.endsWith('.css'))
    .flatMap(([key, target]) => {
      if (!key.includes('*')) return [path.posix.join(name, key)];
      // './src/components/ui/*/index.ts' -> captures 'button' from 'src/components/ui/button/index.ts'
      const escaped = target.slice(2).replace(/[.+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(`^${escaped.replace('*', '(.+)')}$`);
      return globSync(target.slice(2), { cwd: dir }).flatMap((file: string) => {
        const match = pattern.exec(file);
        return match?.[1]
          ? [path.posix.join(name, key.replace('*', match[1]))]
          : [];
      });
    });
})();

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
const config = defineConfig({
  test: {
    maxWorkers: 2,
    projects: [
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({ configDir: path.join(dirname, '.storybook') }),
        ],
        // Each story file opens its own page in a real browser. With every file at once, a busy
        // machine or small CI runner starves the animation, focus and timing assertions and they
        // fail intermittently (verified: the full suite failed 1-3 different stories per run under
        // load, then passed 190/190 with two workers). Raise this only with spare CPU.
        // `browser` (headless Chromium) comes from `browserConfig` through
        // `extends: true`. Declaring it here as well merges the two
        // `instances` arrays, and every story then runs twice.
        test: {
          name: 'storybook',
        },
        optimizeDeps: {
          include: [
            'storybook/theming',
            'react-dom',
            'react/jsx-runtime',
            ...frontendUiIds,
          ],
        },
      },
    ],
  },
});

export default mergeConfig(browserConfig, config);
