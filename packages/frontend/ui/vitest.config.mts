import { reactConfig } from '@synapcity/dev-vitest-config/react';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(
  reactConfig,
  defineConfig({ test: { setupFiles: ['./vitest.setup.ts'] } }),
);
