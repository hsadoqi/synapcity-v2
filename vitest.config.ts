import { defineConfig } from 'vitest/config';
import { sharedConfig } from './packages/dev/vitest-config/src/shared';

/*
 * One combined coverage report for the workspace (`pnpm report`).
 *
 * Each package keeps its own `vitest.config` (and its own per-package
 * `test:coverage`); this root config only lists them as projects. Vitest
 * documents coverage as root-only in this mode ("coverage is done for the whole
 * process"), so it is declared once here, from the same shared settings
 * (v8 provider, no thresholds). Only the listed projects are measured, so a
 * package without tests does not show up as 0%.
 *
 * Browser-mode Storybook story tests (`apps/storybook`) and the Playwright
 * smoke test (`apps/web`) are not projects here: they do not run in this
 * process. Add a package to `projects` when it gains Vitest tests.
 */
const projects = [
  'apps/web',
  'packages/dev/fixtures',
  'packages/frontend/site',
  'packages/frontend/ui',
];

export default defineConfig({
  test: {
    projects,
    coverage: {
      ...sharedConfig.test.coverage,
      include: projects.map((dir) => `${dir}/src/**/*.{ts,tsx}`),
      exclude: ['**/*.test.{ts,tsx}', '**/*.stories.{ts,tsx}'],
    },
  },
});
