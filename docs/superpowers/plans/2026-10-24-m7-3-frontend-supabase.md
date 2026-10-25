# Milestone 7.3 browser Supabase client Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Status:** Implemented on `refactor/m7-3-frontend-supabase` (2026-10-25). The owner chose option (a) of the thin-package question and approved the scope. Task 1 is done; Task 2 steps 1 to 3 are done (the repository gate passed locally and in CI on pull request #71) and the manual check in step 4 is open.

**Goal:** The browser Supabase client factory and the auth-event rule leave `apps/web` for a new `@synapcity/frontend-supabase` package, the only frontend package importing `@supabase/*`. No behavior changes.

**Spec:** [2026-10-24-m7-auth-account-design.md](../specs/2026-10-24-m7-auth-account-design.md), sections 4.5 and 8 (M7.3). Governing: [ADR-0014](../../architecture/decisions/0014-multi-app-package-boundaries.md), [ADR-0006](../../architecture/decisions/0006-authentication-with-supabase.md).

## What exists today (evidence, read at `ba00942c`)

- `apps/web/src/lib/supabase/client.ts` (8 lines): `createClient()` reads `getSupabaseEnv()` and calls `createBrowserClient` from `@supabase/ssr`. Two consumers: `features/auth/components/email/email-change.tsx` and `features/auth/client/user-provider/user-provider.tsx`.
- `apps/web/src/features/auth/client/auth-events/auth-events.ts` (27 lines): `shouldRefreshOnAuthEvent`, a pure function whose only import is the type `AuthChangeEvent` from `@supabase/supabase-js`. Used by `user-provider`.
- `user-provider.tsx` is React and uses `next/navigation`; it moves with `features-auth` (M7.5), not here.
- Environment reading (`lib/supabase/env.ts`, `NEXT_PUBLIC_*`) is host configuration and stays in the app.

## Thin-package question (owner)

This package would hold about 35 lines of source. ADR-0015 lists a thin wrapper as a reason to reconsider a boundary, and the M7 design (4.5) still wants it because the inventory names `frontend-supabase` as the only frontend package importing `@supabase/*`. Options: (a) create it as designed; (b) keep both files in the app until M7.5 and decide then, once `features-auth` exists and could hold the client itself. **Recommendation: (a), but only if the owner wants the one-package rule for `@supabase/*` enforced now; otherwise (b) avoids a near-empty package.**

## Global Constraints

- **Package:** `packages/frontend/supabase`, `@synapcity/frontend-supabase`, `private`, source-pointing `exports` (root only). Dependencies: `@supabase/ssr` 0.12.7 and `@supabase/supabase-js` 2.117.3 (the versions `server-supabase` declares; no version changes), dev dependencies as sibling frontend packages.
- **No environment reads, no `next/*`** in the package. The factory takes `{ url, publishableKey }`.
- **Rule R3:** no server code reachable from it. **Rule R5:** consumers use its `exports`.
- **Do not edit** `register-form`, `forgot-password-form` or their tests (pull request #67).
- **No re-export bridges.** Commits only when authorized; no attribution trailer; never quote the owner.

## Tasks

### Task 1: Create the package with its first code

- [x] **Step 1: Write the failing tests:** `createBrowserSupabaseClient({ url, publishableKey })` returns a client built by `createBrowserClient` with those values (mock the SDK); `shouldRefreshOnAuthEvent` keeps the existing `auth-events.test.ts` cases unchanged.
- [x] **Step 2: Create the package** (manifest, tsconfig, eslint and vitest configs, README with `Owns:`, `src/index.ts`, unit folders with `index.ts`); add the Vitest project to the root config; `pnpm install`.
- [x] **Step 3: Move `auth-events` and its test; add `createBrowserSupabaseClient`.** Keep the function bodies byte for byte.
- [x] **Step 4: Re-point the host.** `lib/supabase/client.ts` becomes `createClient()` calling the package with `getSupabaseEnv()`; `user-provider.tsx` imports `shouldRefreshOnAuthEvent` from the package; delete `features/auth/client/auth-events/` and its export in `client/index.ts`. Remove the auth-client barrel cycle only if this move resolves it (the R9 exception for `auth/client` is removed in M7.5, not here).
- [x] **Step 5: Run the checks** one script at a time: package `test`, `lint`, `check-types`; web `check-types`, `lint`, and the auth and `lib/supabase` tests; `pnpm boundaries`; `pnpm deps`. Expected: pass; `rg -n "@supabase/" apps/web/src` lists only server-side files and `lib/supabase/{client,env}`-level host code.
- [x] **Step 6: Checkpoint commit** (if authorized): `feat(frontend-supabase): add the package with the browser client and the auth-event rule`.

### Task 2: Records and verification

- [x] **Step 1: Update the records:** the package README, the workspace-conventions inventory row (`frontend-supabase`: M7.3, exists), the ownership map `lib/supabase` row, the M7 design status, and `.agents/task-scope.md`. No owner quotes.
- [x] **Step 2: Boundary probe** (planted, then removed): `import 'next/link'` in the package should report R11; a server import should report R3.
  - Result (2026-10-25): both planted imports were reported, but as R0 (import does not resolve), because the package declares neither `next` nor a server package. R3 and R11 did not fire, so those rules were not exercised here; the undeclared dependency is the guard.
- [x] **Step 3: Repository gate.** `pnpm verify` with nothing else running (or CI on the pull request).
- [ ] **Step 4: Report** per AGENTS.md section 9. Manual: sign in, open Settings in two tabs, sign out in one, and see the other refresh; change an email address and see the pending state.

## Calls made (owner to check)

| #   | Call                                                                            | Why                                                                                 |
| --- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| C1  | `user-provider` stays in the app until M7.5.                                    | It is React with `next/navigation`; it belongs with `features-auth/frontend`.       |
| C2  | The factory takes `{ url, publishableKey }`; the host keeps `getSupabaseEnv()`. | Environment is host configuration; packages read none (the `server-supabase` rule). |

## Recovery

Keep the package creation and the host re-pointing in separate compilable slices. If a slice fails, restore only that slice against current HEAD. Stop and report if the package needs an environment variable or a `next/*` import.
