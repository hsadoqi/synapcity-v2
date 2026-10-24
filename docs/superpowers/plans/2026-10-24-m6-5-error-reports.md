# Milestone 6.5 Error Reports Implementation Plan

**Status:** Implemented in PR #64 (2026-10-24). CI `verify` passed on that PR; live-provider checks were not run. This plan has no per-step checkboxes, so completion is recorded here and in the commit history.
**Design:** [Milestone 6 Preferences and Settings](../specs/2026-10-24-m6-preferences-settings-design.md), sections 4.6-4.8 and 8-10.
**Governing:** [ADR-0014](../../architecture/decisions/0014-multi-app-package-boundaries.md), [workspace conventions](../../architecture/workspace-conventions.md), and the [package creation checklist](../../architecture/package-creation-checklist.md).

## Goal

Move consent-gated browser error reporting and event scrubbing to `@synapcity/frontend-error-reports`. Preserve the consent choice, Sentry configuration, scrubbed payload, and current error-boundary behavior; keep environment and app integration policy in `apps/web`.

## Ownership and boundaries

- `frontend-error-reports` owns the browser Sentry adapter, consent-gated lifecycle, and privacy scrubber. It renders no product UI and adds no collection policy.
- `apps/web` binds `NEXT_PUBLIC_SENTRY_DSN` and the runtime environment, mounts the component, and calls the public reporting function from its error boundaries.
- The package depends on the existing pinned `@sentry/browser` version and `@synapcity/frontend-preferences`; this plan adds no external dependency or telemetry capability.

## Scope

- Create `packages/frontend/error-reports/**` with package configuration, README, public entry, client adapter, privacy scrubber, and moved tests/fake-Sentry helper from `apps/web/src/features/error-reports/**`.
- Update the web root provider, `error.tsx`, `global-error.tsx`, the Spaces/Documents/Dashboards error boundaries and their tests/mocks, `apps/web/package.json`, `pnpm-lock.yaml`, root `vitest.config.ts`, and Storybook story discovery only if package stories are introduced.
- Update frontend/package READMEs, ownership map, workspace inventory, ADR-0014 section 7, M6 design status, and task ledger.
- Pass DSN/environment from the web host into package initialization; do not read web environment variables inside the shared package.
- Preserve consent gating, lazy SDK loading, no-DSN behavior, event scrub rules, user-visible error handling, and current provider integration. Do not add tracing, replay, analytics, or a new reporting destination.

## Tasks

### 1. Extract the privacy scrubber and client adapter

- Create the package following frontend category conventions and expose only its supported browser API.
- Move `scrub-event` and its tests without weakening removal of user data, breadcrumbs, query/hash, identifiers, and email addresses.
- Move the Sentry client, `ErrorReports`, fake Sentry helper, and their tests. Make runtime configuration an explicit host-supplied input rather than reading `process.env` in the package.
- Keep `useCanCollect('errorReports')` as the consent source from `frontend-preferences`.
- Run the focused package tests, lint, and typecheck.

### 2. Rebind web consumers

- Update `root-providers.tsx` to supply host configuration and mount the package component.
- Update app and resource error boundaries to import the public reporting API; adjust existing mocks only to the public contract.
- Remove `apps/web/src/features/error-reports/**` after every consumer has moved.
- Add the package to workspace test/config/build discovery and update app dependencies/lockfile without changing external versions.

### 3. Record and verify M6.5

- Update the ownership map, workspace inventory, ADR-0014 section 7, package READMEs, M6 design status, and task ledger.
- Run focused package tests/lint/typecheck, affected web tests, `pnpm boundaries`, `pnpm deps`, and root `pnpm verify`.
- Confirm consent-off, consent-on, absent DSN, sanitized payload, captured error, and stop/unmount cases remain covered. No live Sentry event is sent as part of verification.

## Recovery

Move tests and implementation together. If a slice fails, restore only its own changes against current HEAD. Do not alter the M6.1-M6.4 commits or mutate Sentry, hosting, or provider configuration.
