# ADR-0005: Testing foundation (Vitest and Playwright config packages)

**Status:** Proposed
**Date:** 2026-10-13
**Deciders:** Repository owner (approval pending)

## Context

`docs/architecture/decisions/README.md` lists "Testing strategy" as an open candidate: no test runner, component-test setup or browser gate existed, so `pnpm verify` proved formatting, lint, types, unused code and builds only. `apps/storybook` already carried Vitest, `@vitest/browser-playwright` and Playwright for the Storybook addon, with a hand-written `vitest.config.ts`. The owner asked for shared config packages for both tools and for them to be wired into the workspaces that need them (2026-10-13).

## Decision

Adopt two config packages under `packages/dev/`, following the `@synapcity/dev-*` convention of `dev-eslint-config` and `dev-typescript-config`:

- `@synapcity/dev-vitest-config` exports `baseConfig` (Node, `src/**/*.test.{ts,tsx}`, no globals), `reactConfig` (jsdom plus Testing Library cleanup) and `chromiumBrowser()` (headless Chromium through Playwright).
- `@synapcity/dev-playwright-config` exports `createPlaywrightConfig({ port, command, testDir? })` for end-to-end tests: a `webServer`, `**/*.e2e.ts`, Chromium, CI-only retries.

Consumers: `frontend-ui` (`reactConfig`), `frontend-site` (`baseConfig`), `storybook` (`chromiumBrowser()` in its story-test project) and `web` (end-to-end). Root `pnpm test` and `pnpm test:e2e` run them through Turborepo tasks `test` and `test:e2e`.

Pins: `vitest` and `@vitest/browser-playwright` 4.1.11 to match `apps/storybook`; `@playwright/test` and `playwright` 1.64.0. Vitest 5.0.4 is the registry latest (checked 2026-10-13); `@storybook/addon-vitest` 10.6.1 allows `^5`, so staying on 4 is a deliberate choice to avoid upgrading an existing dependency as a side effect, not a compatibility block.

## Scope

The shared presets, which workspaces use them, the pins above, and the root scripts and Turborepo tasks.

## What this does NOT decide

- Whether tests run inside `pnpm verify`, CI or the pre-push hook. They do not today, because that chain is recorded in ADR-0001.
- Coverage provider, reporters or thresholds.
- Which browsers and viewports end-to-end tests cover (Chromium only for now), and visual-regression tooling.
- Whether Storybook story tests (including their axe checks) become a gate.
- Test conventions beyond file naming: what to test, fixtures, mocking.

## Unresolved

- Adding `test` to `pnpm verify` and CI, and the browser-install step CI would need (`playwright install chromium`).
- `apps/storybook` currently has failing story tests from real accessibility findings: `link-button` "Variants" (axe violation on `.text-primary`) and `mode-toggle` "Menu" (`aria-required-parent` on menu radio items). The preset did not cause them; they predate this ADR and are unfixed.
- Moving to Vitest 5 (its own change, touching the config package and the pins).

## Governance boundary

The repository owner approves changes to the presets' public exports, the pins, and any move of tests into the verification chain.

## Integration expectations

Config packages stay free of product code. Consumers declare their own `vitest`, `jsdom`, Testing Library or `@playwright/test` dependencies, because pnpm resolves environments and runners from the consumer. A new test-using workspace composes a preset instead of writing its own base config.
