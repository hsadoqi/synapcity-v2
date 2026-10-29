# ADR-0005: Testing foundation (Vitest and Playwright config packages)

**Status:** Proposed
**Date:** 2026-10-13
**Deciders:** Repository owner (approval pending)

## Context

`docs/architecture/decisions/README.md` lists "Testing strategy" as an open candidate: no test runner, component-test setup or browser gate existed, so `pnpm verify` proved formatting, lint, types, unused code and builds only. `apps/storybook` already carried Vitest, `@vitest/browser-playwright` and Playwright for the Storybook addon, with a hand-written `vitest.config.ts`. The owner asked for shared config packages for both tools and for them to be wired into the workspaces that need them (2026-10-13).

## Decision

Adopt two config packages under `packages/dev/`, following the `@synapcity/dev-*` convention of `dev-eslint-config` and `dev-typescript-config`:

- `@synapcity/dev-vitest-config` exports `baseConfig` (Node, `src/**/*.test.{ts,tsx}`, no globals), `reactConfig` (jsdom plus Testing Library cleanup), `chromiumBrowser()` (headless Chromium through Playwright) and, since Milestone 4, `serverOnlyAlias` (`./server-only`: maps only the `server-only` specifier to an empty module so tests can load server entries without the `react-server` condition).
- `@synapcity/dev-playwright-config` exports `createPlaywrightConfig({ port, command, testDir? })` for end-to-end tests: a `webServer`, `**/*.e2e.ts`, Chromium, CI-only retries.

Consumers: `frontend-ui` (`reactConfig`), `frontend-site` (`baseConfig`), `server-auth` and `server-supabase` (`baseConfig` with `serverOnlyAlias`), `storybook` (`chromiumBrowser()` in its story-test project) and `web` (`baseConfig` and `reactConfig` with `serverOnlyAlias`, and end-to-end). Root `pnpm test` and `pnpm test:e2e` run them through Turborepo tasks `test` and `test:e2e`.

Pins: `vitest`, `@vitest/browser-playwright` and `@vitest/coverage-v8` 5.0.5, moved together from 4.1.12 on 2026-10-29 as a dedicated upgrade (each `@vitest/*` plugin requires the exact `vitest` version, so they cannot move one at a time; `@storybook/addon-vitest` 10.6.3 allows `^4 || ^5`); `@playwright/test` and `playwright` 1.64.1. Every package's tests and the Storybook story tests passed on 5.0.5 with the same test counts as on 4.1.12 and no configuration changes. Vitest 4.1.12 had been raised from 4.1.11 on 2026-10-23 for the `@vitest/mocker` advisories GHSA-qxg6-89mg-rqv8 and GHSA-xp26-3454-mjgp.

## Coverage

Coverage uses the `v8` provider (`@vitest/coverage-v8` 5.0.5, matching the Vitest pin; `apps/storybook` already depended on it). It is opt-in through `pnpm test:coverage` (`vitest run --coverage` per workspace, Turborepo task `test:coverage`), with text and HTML reports in `coverage/report`. No thresholds are set. Decided 2026-10-13.

`pnpm report` produces one combined report for the workspace: the root `vitest.config.ts` lists the Vitest packages as `projects` and declares coverage once, because Vitest supports coverage only at the root in that mode. It is not part of `pnpm verify`. On Vitest 4.1.12 it found no tests and exited 1. On 5.0.5 it runs every listed project (466 files, 3,856 tests, about 18 minutes in one process; observed 2026-10-29). Its include patterns are written from the repository root, which is what Vitest 5 matches against when every project runs; with `--project` it matches against each selected project's root instead, so a filtered run reports no files. It covers the packages listed there (not the browser-mode Storybook story tests or the Playwright smoke test), and a package must be added to the list when it gains Vitest tests. An earlier blob-merging design (`merge-blob-reports`, written for the `istanbul` provider and for a script that never existed) was removed; Vitest's documentation describes blob reports for merging test results, not for combining coverage across packages.

## Verification chain

The owner approved (2026-10-13) moving the tests into `pnpm verify`, and therefore into the pre-push hook and CI. CI installs Chromium before running it (`pnpm --filter web exec playwright install --with-deps chromium`), because `pnpm install` does not download browsers. ADR-0001 records the chain.

## Scope

The shared presets, which workspaces use them, the pins above, and the root scripts and Turborepo tasks.

## What this does NOT decide

- Whether the Storybook story tests (including their axe checks) stay a gate beyond the current setup. They are in the chain today.
- Coverage thresholds, and whether coverage runs in CI.
- Which browsers and viewports end-to-end tests cover (Chromium only for now), and visual-regression tooling.
- Whether Storybook story tests (including their axe checks) become a gate.
- Test conventions beyond file naming: what to test, fixtures, mocking.

## Unresolved

- The two story-test failures recorded when this ADR was drafted (`link-button` "Variants", an axe violation on `.text-primary`; `mode-toggle` "Menu", `aria-required-parent`) were fixed afterwards: all 30 story tests passed on 2026-10-13.
- Moving to Vitest 5 (its own change, touching the config package and the pins).

## Governance boundary

The repository owner approves changes to the presets' public exports, the pins, and any move of tests into the verification chain.

## Integration expectations

Config packages stay free of product code. Consumers declare their own `vitest`, `jsdom`, Testing Library or `@playwright/test` dependencies, because pnpm resolves environments and runners from the consumer. A new test-using workspace composes a preset instead of writing its own base config.
