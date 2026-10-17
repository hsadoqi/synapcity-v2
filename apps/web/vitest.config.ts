import { fileURLToPath } from 'node:url';

import { baseConfig } from '@synapcity/dev-vitest-config/base';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(
  baseConfig,
  defineConfig({
    resolve: {
      // Mirrors `paths` in tsconfig.json, so modules that import `@/...` can
      // be tested instead of having to use relative imports to stay testable.
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
  }),
);
