import { serverOnlyAlias } from '@synapcity/dev-vitest-config/server-only';
import { defineConfig } from 'vitest/config';

/*
 * Pass/fail budgets (`pnpm --filter @synapcity/server-data test:db:budgets`):
 * files named `*.budget.ts`. They seed a lot of data and take minutes, so they
 * are a run of their own, apart from `test:db`.
 */
export default defineConfig({
  resolve: { alias: [serverOnlyAlias] },
  test: {
    include: ['src/**/*.budget.ts'],
    environment: 'node',
    globals: false,
    fileParallelism: false,
    testTimeout: 1_800_000,
    hookTimeout: 120_000,
  },
});
