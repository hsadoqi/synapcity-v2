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
  'packages/domain/dashboards',
  'packages/domain/grids',
  'packages/domain/identity',
  'packages/domain/preferences',
  'packages/domain/prototypes',
  'packages/domain/records',
  'packages/domain/spaces',
  'packages/dev/boundaries',
  'packages/dev/fixtures',
  'packages/dev/playwright-config',
  'packages/features/account',
  'packages/features/auth',
  'packages/features/dashboards',
  'packages/features/spaces',
  'packages/features/settings',
  'packages/frontend/brand',
  'packages/frontend/site',
  'packages/frontend/collection',
  'packages/frontend/error-reports',
  'packages/frontend/preferences',
  'packages/frontend/supabase',
  'packages/frontend/forms',
  'packages/frontend/fonts',
  'packages/frontend/shells',
  'packages/frontend/tokens',
  'packages/frontend/ui',
  'packages/server/auth',
  'packages/server/account',
  'packages/server/data',
  'packages/server/supabase',
];

export default defineConfig({
  test: {
    testTimeout: 30_000,
    projects,
    // Vitest 5 matches these patterns against the repository root, as written,
    // when every project runs. With `--project` it matches them against each
    // selected project's root instead, so a filtered run reports 0/0.
    coverage: {
      ...sharedConfig.test.coverage,
      include: projects.map((dir) => `${dir}/src/**/*.{ts,tsx}`),
      exclude: ['**/*.test.{ts,tsx}', '**/*.stories.{ts,tsx}'],
    },
  },
});
