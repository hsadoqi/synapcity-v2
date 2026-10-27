# Milestone 7.5 auth experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Status:** Implemented and merged in #71 (2026-10-25). The calls below were agent recommendations; the owner reviewed C5 and C7 on 2026-10-25 (see their rows and design section 9). The boundary probes are complete; the repository gate (step 4) and the manual checks (step 5) remain open.

**Goal:** The auth experience leaves `apps/web/src/features/auth` for a new `@synapcity/features-auth` package laid out like `features-settings` (`./contracts`, `./frontend`, `./server` only if needed). `AuthButtons` leaves `frontend-ui`, the two cards in `apps/web/src/components` join it, and the routes shrink to composition. No behavior changes. The auth R9 barrel-cycle exception and the R11 `AuthButtons` exception are removed.

**Spec:** [2026-10-24-m7-auth-account-design.md](../specs/2026-10-24-m7-auth-account-design.md), sections 4.6 and 8 (M7.5). Governing: [ADR-0014](../../architecture/decisions/0014-multi-app-package-boundaries.md), [ADR-0008](../../architecture/decisions/0008-auth-actions-and-server-operations.md), [ADR-0009](../../architecture/decisions/0009-caller-owned-auth-navigation.md). The M7.4 pattern ([plan](2026-10-25-m7-4-features-account.md)) applies throughout: components take host-supplied actions and host-owned values as props.

## What exists today (evidence)

`apps/web/src/features/auth` has `client/` (use-confirmation, use-cooldown, pending-email, connected-accounts, user-provider), `components/` (auth-status, connected-accounts, current-user-avatar, delete-account, email, login, oauth-buttons, password, register, resend, sign-in-again, sign-out), `server/` (actions, operations, session, form-data, site-origin), `shared/` (auth-confirmation, auth-divider, auth-link-button, auth-shell, connected-accounts, error-messages, recent-link-sign-in, resend-button) and `types/form-state`.

What the non-test code needs from the app:

- **Fifteen components import Server Actions** from `server/actions/actions` (`signInWithPassword`, `signUp`, `signInWithOAuth`, `signOut`, `requestPasswordReset`, `requestOwnPasswordReset`, `updatePassword`, `requestEmailChange`, `resendEmailChange`, `resendConfirmation`, `requestAccountDeletion`, and the connected-accounts actions).
- **`next/navigation`:** `sign-in-again` (`usePathname`), `email-change` and `user-provider` (`useRouter`), and `AuthButtons` (`usePathname`).
- **The browser Supabase client from the app:** `email-change` and `user-provider` call `@/lib/supabase/client`.
- **Host policy and server state:** `auth-status` (async server component) reads `getCurrentUser`, `FIXTURE_MESSAGE`, `accountLinksFor` and `homePathFor`; `server/session` wraps `createClient`, React `cache` and fixture mode; `server/actions` uses `next/cache`, `next/navigation`, routing helpers and fixture refusal.
- **`shared/auth-link-button`** imports `cn` from `@/lib/utils`; the packages use `cn`.
- Inbound (non-test) imports from outside the feature: the `app/auth/*` pages, `app/layout.tsx`, `app/page.tsx`, the settings page and account-settings, `features/home` (`useCurrentUser`), `lib/access/require-owner.ts`, the two API routes (`getVerifiedIdentity`), and the two cards in `components/`.

## Calls made (owner to check)

| #   | Call                                                                                                                                                                                                                                                                                                                                         | Why                                                                                                                                            |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| C1  | Server Actions, `server/session`, `form-data` and `site-origin` stay in `apps/web/src/features/auth/server`.                                                                                                                                                                                                                                 | Design 4.7 and Q3: they use `next/*`, `createClient`, fixture mode and routing, so they are the host's. The importers need no change.          |
| C2  | Each component takes its action as a prop; the pages and the settings composition pass them in (the M7.4 pattern).                                                                                                                                                                                                                           | A package cannot import app code (ADR-0014 section 3).                                                                                         |
| C3  | `AuthActions` stays in the app as host composition. It is an async server component over `getCurrentUser`, fixture mode and the user paths. `AuthButtons` moves.                                                                                                                                                                             | It cannot be a package frontend component without importing session and routing. `AuthButtons` already takes caller-supplied hrefs (ADR-0009). |
| C4  | `UserProvider` and `EmailChange` take a `createClient` prop (the host's one-line binding from M7.3). A function cannot cross from the server layout to a client component, so `apps/web/src/components/user-provider` is a small client wrapper that binds `createClient` and renders the package's provider.                                | The environment values are host configuration (M7.3 call C2).                                                                                  |
| C5  | Approved by the owner on 2026-10-25 as an amendment to Q2. The connected-accounts model stays in `features-auth/contracts`.                                                                                                                                                                                                                  | Design Q2 wanted the edge one-way. M7.4 verified `features-account` imports nothing from auth, so no move is needed.                           |
| C6  | `ProfileSetupCard` and `DeleteAccountCard` move here and receive their actions, as agreed for M7.4 (question A).                                                                                                                                                                                                                             | They wrap `AuthShell`.                                                                                                                         |
| C7  | Approved by the owner on 2026-10-25 as an amendment to Q5. The recent-link sign-in check stays a pure helper in `features-auth/contracts`; the page calls it. _Superseded (owner, 2026-10-27): it moves to `@synapcity/domain-identity`; see the [web Supabase leftovers design](../specs/2026-10-27-web-supabase-leftovers-design.md), D1._ | Widening `VerifiedIdentity` was an M4 anti-goal.                                                                                               |

## Global Constraints

- **Package:** `packages/features/auth`, `@synapcity/features-auth`, `private`, exports `./contracts` and `./frontend`. No new external dependency; `next`, `react`, `lucide-react` and the workspace packages are already declared elsewhere.
- **No app imports, no Server Actions, no fixture mode** in the package. Next-dependent files live under `src/frontend/next/`.
- **Keep markup and logic byte for byte;** the only intended changes are new props and import paths. `register-form.tsx` and `forgot-password-form.tsx` keep their React Hook Form binding.
- **No re-export bridges.** Each slice re-points its consumers in the same change. Local commits only; no attribution trailer; never quote the owner. No new pull request until M7 ends.

## Tasks

### Task 1: Package, contracts and shared pieces

- [x] **Step 1: Create the package** (manifest, configs, README, indexes); register it in the root Vitest list, the web dependencies and the Tailwind `@source` lines; `pnpm install`.
- [x] **Step 2: Move `types/form-state`, `shared/connected-accounts`, `shared/error-messages` and `shared/recent-link-sign-in` to `contracts`** with their tests; re-point importers.
- [x] **Step 3: Move `shared/{auth-shell, auth-divider, auth-confirmation, auth-link-button, resend-button}` to `frontend`** with their tests (`cn` from the `cn` package); re-point importers, including the two cards.
- [x] **Step 4: Run the package and web checks;** commit locally.

### Task 2: Client state

- [x] **Step 1: Move `use-confirmation`, `use-cooldown`, `pending-email` and `connected-accounts` (client) to `frontend`;** `user-provider` to `frontend/next` taking `createClient`.
- [x] **Step 2: Re-point importers** (layout, settings page, `features/home`) and mocks; commit locally.

### Task 3: Components with actions as props

- [x] **Step 1: Move the components in groups** (login and OAuth; register and resend; password flow; email and connected accounts; delete account and sign out). Done in one slice with flat action props (each component takes the actions it and its children use under their own names) and `signInHref`/`createClient` props where needed. The two cards and `AuthButtons` move in Task 4., each taking its actions as props; `sign-in-again`, `email-change` and `AuthButtons` go under `frontend/next`.
- [x] **Step 2: Re-point the pages and compositions,** which now import the Server Actions and pass them in. One commit per group.

### Task 4: Boundaries and records

- [x] **Step 1: Remove the auth R9 and `AuthButtons` R11 exceptions;** `pnpm boundaries` shows none left tagged M7. (The auth R9 was reported stale and removed in M7.3; the R11 one went with `AuthButtons`.)
- [x] **Step 2: Update the records:** the package README, the inventory (including `frontend-auth` marked deferred per Q1), the ownership map, ADR-0014 section 7, the M7 design, `.agents/task-scope.md`.
- [x] **Step 3: Boundary probes** (planted, then removed). Result (2026-10-25): `next/link` outside `frontend/next/` was reported as R11 and allowed inside it; a server import was reported as R0 (import does not resolve) because the package declares no server dependency.
- [ ] **Step 4: Repository gate:** `pnpm verify` before the single pull request at the end of M7.
- [ ] **Step 5: Report** per AGENTS.md section 9. Manual: register, sign in, recover, change email, link and unlink a provider, sign out, delete account, and the setup step.

## Recovery

Keep each slice compilable and committed on its own. If a slice fails, restore only that slice against current HEAD. Stop and report if a moved component needs an app import other than through a prop.
