import { defineConfig } from 'vitest/config';
import { sharedConfig } from './shared.ts';
/*
 * Node-environment unit tests. A test file sits beside the code it covers as
 * `*.test.ts(x)`. Globals stay off: tests import `describe`, `it` and `expect`
 * from `vitest`, so the dependency is visible and no global types are needed.
 */
export const baseConfig = defineConfig({
  test: {
    ...sharedConfig.test,
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'node',
    globals: false,
  },
});
