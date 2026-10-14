# ARF-00: auth layout comparison and recommendation

**Status:** Research / evidence for [ADR-0007](../../architecture/decisions/0007-app-local-auth-and-account-ownership.md). Not authority, no layout selected, no source migration authorized.  
**Date:** 2026-10-14.  
**Source snapshot:** branch `refactor/auth-actions`, working tree after the ADR-0009 `account` change. Re-inventory before acting on any count here.  
**Task:** [ARF-00](../plans/2026-10-13-auth-refactor-foundation.md). This document is its comparison input; the recommendation still needs the owner's selection.

## 1. What this is for

ADR-0007 asks which physical layout should hold auth and account code: app-local modules, one auth package, feature plus service packages, or any of those with account split out. It requires a comparison against actual imports and consumers before a selection. This is that comparison, measured from the live tree on 2026-10-14 with a script over `apps/web/src`, not from impressions.

## 2. Evidence

### 2.1 Size and shape

The auth, account and Supabase surfaces of `apps/web/src` (`lib/auth`, `lib/supabase`, `components/auth`, `app/auth`, `app/[userId]`), excluding tests and stories:

| Measure                                                                                        | Value                                                                                                                                                                                                                                 |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Files / lines                                                                                  | 55 files, 2,284 lines                                                                                                                                                                                                                 |
| Files that import `next/*`, `@supabase/*`, or are `'use client'`/`'use server'`                | 32                                                                                                                                                                                                                                    |
| Modules that are pure functions or types (no framework, SDK, env or alias to a coupled module) | 10, about 360 lines: `auth-flow`, `auth-state`, `error-messages`, `form-data`, `home-path`, `name`, `profile`, `safe-next`, `auth-events` (type import only), `route-access`                                                          |
| Server-bound or env-bound                                                                      | `origin` and `supabase/env` read `process.env`; `session` (React `cache` plus the server client) and `require-owner` (`next/navigation` plus `session`) are server-bound; `supabase/{server,middleware,client}` are provider adapters |
| Framework entry points                                                                         | `app/auth/*` routes and pages, `[userId]/*`, `actions.ts` files, `callback/route.ts`                                                                                                                                                  |

The "no framework" count is conservative. A first pass that looked only at direct imports listed 23 files as pure; 13 of them depend on an environment variable, an alias to a server module, or are components that import coupled siblings.

### 2.2 Consumers

- `@supabase/*` is declared only in `apps/web/package.json`. Nothing in `apps/docs` or `apps/storybook` imports auth or Supabase code.
- `packages/frontend/ui` no longer contains auth logic or app routes after ADR-0009 and the `account` change. That boundary already exists and is enforced by the package's `exports`.
- There is exactly one consumer of the auth capability today. ADR-0007 says that is not disqualifying; this document does not treat it as a reason for or against.

### 2.3 Existing tension with workspace conventions

[Workspace conventions](../../architecture/workspace-conventions.md) say frontend packages "must not import Next.js routing or request APIs". `packages/frontend/ui` imports `next/link` in four files (`link-button`, `root-header`, `root-sidebar`, `user-menu`) and `next/navigation` (`usePathname`) in one (`auth-buttons`). Most predate this refactor; the direct `next/link` import in `user-menu` was added by the 2026-10-14 menu change, where the link previously went through `LinkButton`, which imports it. ADR-0009 deliberately deferred a caller-supplied link-rendering capability. This is not caused by the layout choice, but any layout that moves more code into a `frontend` package inherits it, so it is recorded here.

### 2.4 What enforces boundaries today

No import-boundary lint rule is configured and ADR-0007 lists enforcement as unresolved. Today the only mechanical enforcement is a package's `exports` map. Folder layout inside an app is convention only.

## 3. Candidates

Criteria are the ones ADR-0007 names: cohesion, independent testing, enforceable imports, runtime isolation, change coupling, plus the configuration cost a package adds.

| Criterion             | A. App-local feature modules                                                       | B. One auth package                                                  | C. Feature plus service packages                          | D. Account split (with A, B or C)                 |
| --------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------- |
| Cohesion              | High if grouped by `features/auth`, `features/account`                             | High                                                                 | High, but two contracts for ~360 pure lines               | Separates name editing from sign-in               |
| Independent testing   | Already works: pure modules have Vitest suites, actions now have integration tests | Same, plus its own test config                                       | Same, plus provider mocks at a package seam               | Marginal: account is one action and one validator |
| Enforceable imports   | Convention only until a lint rule is chosen                                        | `exports` map enforces the public API                                | `exports` map on both                                     | Only if separate packages                         |
| Runtime isolation     | Server and client separated by folder and directives                               | Needs server-capable package: conventions put server code in apps    | Same, for the service package                             | n/a                                               |
| Change coupling       | Routes, actions and forms change together; one place                               | Pages still change with forms; the package changes with them too     | Provider operations rarely change separately from actions | Profile editing and auth do change separately     |
| Configuration cost    | None                                                                               | Package manifest, build, exports, Knip and test config, Turbo wiring | Two of the above                                          | One more package, or a folder                     |
| Convention amendments | None                                                                               | Category and runtime amendment for a server-capable package          | Same                                                      | Same as its host                                  |

## 4. Recommendation

**Candidate A with account as a sibling module (D within A): `features/auth` and `features/account` inside `apps/web`, following the destination map in the [parent plan](../plans/2026-10-13-auth-refactor.md).** I recommend it as a choice for now, with the conditions below that would change it.

Why:

- **Most of the code cannot move to a framework-independent package.** About 360 of 2,284 lines are pure. The remainder is routes, server actions, client forms and provider adapters, which the conventions place in an app or which depend on Next.js. A package for it would be a server-capable one, which needs a convention amendment, for one consumer.
- **The valuable boundaries already exist or are cheap.** The UI package is auth-free. Pure modules are separately tested. Actions now have integration tests that call the real functions, as ADR-0008 expects.
- **The main benefit of a package is import enforcement, and it can be had more cheaply.** An ESLint `no-restricted-imports` rule over `features/*/shared` versus `server` versus `client` gives most of that. It is a tooling change and needs its own approved scope.
- **Reversibility.** Moving `features/auth` into a package later is a mechanical lift if the folders already follow `shared`, `server`, `client`. Going the other way is not.

What would change this recommendation:

- A second app needs sign-in (for example `apps/docs` showing account state), or a non-web client appears.
- Boundary violations actually occur after the folders exist and a lint rule is in place.
- The provider operations (ADR-0008) grow enough to change independently of the actions.

## 5. Destination map deltas

The parent plan's table is still the base. These items did not exist when it was written, or moved, and need rows before ARF-01:

| Item                                      | Where it is now                                 | Suggested destination                                                 |
| ----------------------------------------- | ----------------------------------------------- | --------------------------------------------------------------------- |
| `AuthState`, `authFailure`, `authSuccess` | `lib/auth/auth-state/auth-state.ts`             | `features/auth/shared/form-state.ts` (the plan's row for `AuthState`) |
| `field()`                                 | `lib/auth/form-data/form-data.ts`               | `features/auth/server/form-data.ts` or kept with actions              |
| `callbackUrl()`                           | `lib/auth/auth-flow/auth-flow.ts`               | `lib/routing/auth-flow.ts` with the rest of that file                 |
| `accountLinksFor()`                       | `lib/auth/home-path/home-path.ts`               | `lib/routing/user-paths.ts`                                           |
| `app/auth/actions.test.ts`                | `app/auth/actions.test.ts`                      | `features/auth/server/actions.test.ts` (the plan's destination)       |
| `@/` alias in `apps/web/vitest.config.ts` | present                                         | stays; it mirrors `tsconfig` `paths`                                  |
| `AccountLinks`                            | `packages/frontend/ui/src/lib/account-links.ts` | stays; part of the UI package's public contract                       |

## 6. Test plan for a future move

1. Baseline: `pnpm --filter web test`, `pnpm --filter web check-types`, `pnpm test:e2e`, and record failures first (ARF-01).
2. Move pure modules with their tests unchanged; the suites are the equivalence proof.
3. Move actions and keep `actions.test.ts` unchanged apart from import paths; it asserts SDK inputs, redirects, revalidation and enumeration-safe replies.
4. Re-run the full root gate, then the Playwright smoke test and a manual sign-up, reset and OAuth pass against a real Supabase project. Mocks do not verify email delivery or OAuth.

## 7. Decisions this needs from the owner

| Decision                                            | Needed because                                                       |
| --------------------------------------------------- | -------------------------------------------------------------------- |
| Select a candidate under ADR-0007                   | It gates every file move and ADR-0008's operations extraction        |
| Approve an import-enforcement tool, if any          | ADR-0007 lists it unresolved and it is a tooling change              |
| Decide how `frontend-ui` should reach Next.js links | Either amend the convention or add a caller-supplied link capability |

## 8. Limits

- File counts come from a script's reading of import statements, not of runtime behavior.
- The configuration costs in section 3 are estimates from this repository's conventions and checklist, not measured.
- No provider flow was exercised in a browser or against a real Supabase project.
