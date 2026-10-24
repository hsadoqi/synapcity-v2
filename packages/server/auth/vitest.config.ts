import { baseConfig } from '@synapcity/dev-vitest-config/base';
import { serverOnlyAlias } from '@synapcity/dev-vitest-config/server-only';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(
  baseConfig,
  defineConfig({ resolve: { alias: [serverOnlyAlias] } }),
);
