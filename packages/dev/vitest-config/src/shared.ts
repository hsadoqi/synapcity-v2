/*
 * Settings every preset shares. Coverage is opt-in: it only runs with
 * `--coverage` (the `test:coverage` scripts), so plain `test` stays fast. No
 * thresholds are set. The consumer declares `@vitest/coverage-v8` itself.
 */
export const sharedConfig = {
  test: {
    coverage: {
      provider: 'v8' as const,
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/**/*.stories.{ts,tsx}'],
      reporter: ['text', 'html'],
      reportsDirectory: 'coverage/report',
    },
  },
};
