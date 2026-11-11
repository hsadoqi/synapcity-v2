import { sharedConfig } from '@synapcity/dev-vitest-config/shared';
import { serverOnlyAlias } from '@synapcity/dev-vitest-config/server-only';
import { defineConfig } from 'vitest/config';

/*
 * The account database tests (`pnpm --filter @synapcity/server-account
 * test:db`): avatar storage and account deletion through real signed-in
 * clients. They need a running Supabase stack, so they are not part of
 * `pnpm test`, `pnpm verify` or the default `vitest.config.ts`: files are named
 * `*.dbtest.ts`, which that config does not include. The harness comes from
 * `@synapcity/server-data/testing`. Files run one at a time because they share
 * one database.
 */
export default defineConfig({
  resolve: { alias: [serverOnlyAlias] },
  test: {
    include: ['src/**/*.dbtest.ts'],
    environment: 'node',
    globals: false,
    fileParallelism: false,
    testTimeout: 60_000,
    hookTimeout: 60_000,
    maxWorkers: sharedConfig.test.maxWorkers,
  },
});
