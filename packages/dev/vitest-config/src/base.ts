import { defineConfig } from 'vitest/config';

/*
 * Node-environment unit tests. A test file sits beside the code it covers as
 * `*.test.ts(x)`. Globals stay off: tests import `describe`, `it` and `expect`
 * from `vitest`, so the dependency is visible and no global types are needed.
 */
export const baseConfig = defineConfig({
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'node',
    globals: false,
  },
});
