/*
 * Settings every preset shares. Coverage is opt-in: it only runs with
 * `--coverage` (the `test:coverage` scripts), so plain `test` stays fast. No
 * thresholds are set. The consumer declares `@vitest/coverage-v8` itself.
 */
export const sharedConfig = {
  test: {
    // The 5 s default is a limit for a quiet machine. A cold `pnpm verify` runs
    // every workspace's tests at once, with coverage on, and tests that pass
    // alone then time out. A test that really hangs still fails, just later.
    // Measured: tests that take ~1.5 s alone exceeded 15 s in a full
    // `test:coverage` run, so the margin is 30 s.
    testTimeout: 30_000,
    coverage: {
      clean: false,
      provider: 'v8' as const,
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/**/*.stories.{ts,tsx}'],
      reporter: ['text', 'html'],
      reportsDirectory: 'coverage/report',
    },
  },
  exclude: [
    'dist/**',
    '**/coverage/**',
    'storybook-static/**',
    'node_modules/**',
    '.turbo/**',
    '.next/**',
    '.vercel/**',
    '.vscode/**',
    'pnpm-store/**',
    'docs/archive/**',
  ],
};
