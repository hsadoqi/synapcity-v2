import { fileURLToPath } from 'node:url';

import { baseConfig } from '@synapcity/dev-vitest-config/base';
import { reactConfig } from '@synapcity/dev-vitest-config/react';
import { serverOnlyAlias } from '@synapcity/dev-vitest-config/server-only';
import { sharedConfig } from '@synapcity/dev-vitest-config/shared';
import { defineConfig, mergeConfig } from 'vitest/config';

// Mirrors `paths` in tsconfig.json, so modules that import `@/...` can be
// tested instead of having to use relative imports to stay testable. The
// `server-only` entry lets tests load server packages (see the alias's own
// comment in dev-vitest-config).
const alias = [
  { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
  serverOnlyAlias,
];

// Two projects: ordinary tests stay in Node; only `*.dom.test.tsx` files run in
// jsdom with the shared React setup. Coverage is a root-only option: Vitest
// ignores it inside a project, so the presets' coverage settings are set here
// or the report falls back to Vitest's defaults in `coverage/`.
export default defineConfig({
  test: {
    coverage: sharedConfig.test.coverage,
    projects: [
      mergeConfig(baseConfig, {
        resolve: { alias },
        test: { name: 'node', exclude: ['src/**/*.dom.test.{ts,tsx}'] },
      }),
      // `mergeConfig` concatenates arrays, so merging `include` onto the base
      // preset would also pull every plain test into jsdom and run it twice.
      // Replace it instead.
      {
        ...mergeConfig(reactConfig, { resolve: { alias } }),
        test: {
          ...reactConfig.test,
          name: 'dom',
          include: ['src/**/*.dom.test.{ts,tsx}'],
        },
      },
    ],
  },
});
