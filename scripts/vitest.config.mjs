// Tests for the repository's own Node scripts (`pnpm test:scripts`). The root
// vitest.config.ts only lists workspace packages, so these have their own.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['**/*.test.mjs'],
    testTimeout: 30_000,
  },
});
