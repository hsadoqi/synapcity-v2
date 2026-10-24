import { reactConfig } from '@synapcity/dev-vitest-config/react';
import { serverOnlyAlias } from '@synapcity/dev-vitest-config/server-only';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(
  reactConfig,
  defineConfig({
    resolve: { alias: [serverOnlyAlias] },
    test: { setupFiles: ['./vitest.setup.ts'] },
  }),
);
