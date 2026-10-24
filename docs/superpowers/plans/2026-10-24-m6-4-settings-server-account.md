# Milestone 6.4 Settings and server-account Implementation Plan

**Status:** Approved for execution (owner decision, 2026-10-24).
**Design:** [Milestone 6 Preferences and Settings](../specs/2026-10-24-m6-preferences-settings-design.md), sections 4.4-4.5, 4.7-4.8, and 8-10.
**Governing:** [ADR-0010](../../architecture/decisions/0010-preference-persistence.md), [ADR-0014](../../architecture/decisions/0014-multi-app-package-boundaries.md), [workspace conventions](../../architecture/workspace-conventions.md), and the [package creation checklist](../../architecture/package-creation-checklist.md).

## Goal

Move account-preference row persistence to `@synapcity/server-account` and the Settings experience to `@synapcity/features-settings`, while preserving the current account/device precedence, storage format, validation, copy, routes, and accessible behavior.

## Ownership and boundaries

- `server-account` owns the `user_preferences` row read/write implementation and has no fixture-mode, Next.js, UI, or logging policy.
- `features-settings` owns Settings contracts, page composition, drafts, controls, tests, and the package-level server composition described in the accepted design.
- `apps/web` retains route files, `requireOwner`, fixture-mode decisions, Supabase client construction, caller identity checks, Server Action transport, and logging. The action supplies the authenticated user id to `server-account`; browser input never supplies an owner id.
- The host keeps the per-request loader binding and passes the server capability into the feature entry. Preserve React request caching without importing Next.js APIs into a shared package.

## Scope

- Create `packages/server/account/**` with package configs, README, public entry, preference row implementation, and focused tests.
- Create `packages/features/settings/**` with `contracts`, `frontend`, and `server` entries, configs, README, moved Settings source/tests from `apps/web/src/features/settings/**`, and stories for the generic shared Settings presentation units.
- Move the existing Settings UI and its tests as one tree, except the web Server Action and host-only runtime bindings. The move includes `components/**`, `hooks/**`, `lib/**`, `providers/**`, `shared/**`, `types/**`, `utils/**`, and `test-harness.tsx`.
- Keep `components/account-settings/**` and its tests app-owned because they compose web Auth/Profile features. Pass the rendered node as a host slot to the shared Settings tabs and render it only after the Account tab is visited.
- Update web settings page/layout/provider imports, the preferences action and its tests, app/package manifests, lockfile, Vitest project registration, Storybook story discovery, and Tailwind source scanning.
- Update the M6 design status, ownership map, workspace inventory, ADR-0014 package inventory, package READMEs, and task ledger. Remove only the M6 boundary exceptions that this migration proves unnecessary; add none.
- Do not change preference schemas, messages, stored keys, account cache semantics, routes, auth/session policy, fixture behavior, or the M6.3 shared-look contract.

## Tasks

### 1. Extract server-account persistence

- Add a server-only package using current workspace conventions and `workspace:*` dependencies on `domain-preferences` and `server-supabase`.
- Move row mapping/read and upsert behavior out of the Settings app module into a public server-account unit. Keep input validation and caller identity in the web Server Action; keep fixture rejection and `logFailure` in the host.
- Preserve the observable read results (missing row, failed read fallback) and save results (validation, provider error, RLS/no-row, success). Add unit tests for each outcome and ensure the package does not accept a caller id from browser input.
- Run the package tests, lint, and typecheck.

### 2. Create features-settings entries

- Add `@synapcity/features-settings` with `./contracts`, `./frontend`, and `./server` exports. Keep domain types imported from `domain-preferences`; do not duplicate schemas or preference rules.
- Move the current Settings UI, hooks, provider, drafts, utilities, tests, and test harness from the app. Replace app aliases with package-relative or public package imports; keep one implementation.
- Keep the web-specific Account tab in the host and inject it as a rendered slot; the feature package must not import the web Auth or Profile features.
- Add focused Storybook stories for the generic shared Settings controls/page/tab units and register the package's story glob. Preserve keyboard, focus, dialog, loading, and live-feedback behavior.
- Add the package-level loader/composition surface over `server-account`; keep request-specific client creation and fixture selection in the web binding.
- Run package tests, lint, and typecheck after the move; run Storybook story tests for the added stories.

### 3. Bind web host and remove old ownership

- Repoint the Settings page, root layout, and provider to the package exports. The web action continues to validate, check fixture mode, resolve the caller, construct the client, and log failures before delegating the row write.
- Update `apps/web/package.json`, `pnpm-lock.yaml`, root `vitest.config.ts`, `apps/storybook/.storybook/main.ts`, and `apps/web/src/styles/globals.css`. Remove the moved app-local source only after all consumers use the packages.
- Update package/umbrella READMEs, ownership map, workspace conventions, ADR-0014 section 7, M6 design status, and task ledger.
- Check no Settings import bypasses package exports and no new boundary exception is required.

### 4. Verify M6.4

- Run tests for `server-account`, `features-settings`, and web; package lint/typechecks; affected Storybook stories; `pnpm boundaries`; `pnpm deps`; then `pnpm verify`.
- Confirm existing account preference read/write, signed-out, provider failure, fixture-mode, reset, and storage-fallback behavior remains covered.
- Record live-provider checks as not run; no hosted database mutation is part of this plan.

## Recovery

Keep each move and consumer update in a separate compilable slice. If a slice fails, restore only that slice against current HEAD. Do not rewrite the existing M6.1-M6.3 commits or change unrelated files.
