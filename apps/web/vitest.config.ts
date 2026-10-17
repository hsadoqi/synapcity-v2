import { fileURLToPath } from 'node:url';

import { baseConfig } from '@synapcity/dev-vitest-config/base';
import { reactConfig } from '@synapcity/dev-vitest-config/react';
import { defineConfig, mergeConfig } from 'vitest/config';

// Mirrors `paths` in tsconfig.json, so modules that import `@/...` can be
// tested instead of having to use relative imports to stay testable.
const alias = { '@': fileURLToPath(new URL('./src', import.meta.url)) };

// Two projects: ordinary tests stay in Node; only `*.dom.test.tsx` files run in
// jsdom with the shared React setup.
export default defineConfig({
  test: {
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
