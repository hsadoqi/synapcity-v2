# Milestone 7: Auth and Account

**Status:** Accepted (owner decision, 2026-10-24). Q1 to Q5 answered with the recommendations (section 9); the calls in section 10 stand. M7.1 and M7.2 Task A are merged (#69). M7.3 is implemented on `refactor/m7-3-frontend-supabase` (pull request pending); the rest is not implemented. Plans follow per sub-milestone.
**Date:** 2026-10-24
**Branch:** `docs/m7-auth-account-design` from `main` at `ba00942c` (M6 merged as #64, forms extraction Part A merged as #65).
**Governing decisions:** [ADR-0014](../../architecture/decisions/0014-multi-app-package-boundaries.md) (categories, matrix), [ADR-0006](../../architecture/decisions/0006-authentication-with-supabase.md) (Supabase Auth, cookie sessions, `getClaims`), [ADR-0007](../../architecture/decisions/0007-app-local-auth-and-account-ownership.md) (responsibilities, placement superseded by ADR-0014), [ADR-0008](../../architecture/decisions/0008-auth-actions-and-server-operations.md) (Server Actions and operations), [ADR-0009](../../architecture/decisions/0009-caller-owned-auth-navigation.md) (caller-supplied navigation), [ADR-0015](../../architecture/decisions/0015-forms-package-and-form-state.md) (forms), the [M4 design](2026-10-23-m4-server-identity-boundary-design.md) (what it deferred to M7), the [workspace conventions](../../architecture/workspace-conventions.md).
**Sequence:** roadmap order (owner decision, 2026-10-23): M4 identity, M5 Collection and Spaces, M6 Preferences and Settings, **M7 Auth and Account**, M8 Documents and Dashboards, M9 Home, M10 sweep.

## 1. Intent

Sign-in, registration, recovery, email change, sign-out, connected accounts, account deletion, and the profile (name and avatar) are two app folders today: `apps/web/src/features/auth` (127 files, about 3,350 source lines, 42 test files) and `apps/web/src/features/account` (62 files, about 1,280 source lines, 19 test files). M4 built the verified-identity boundary and left everything else of auth and account for M7. M7 moves the rest into packages by who needs what, and preserves every observable behavior.

M7 is a move, not a redesign. No flow, message, redirect, route, session rule or stored value changes. Switching Auth and Account forms to React Hook Form is not part of M7 (ADR-0015: each feature migrates in its own milestone and stays on `useActionState` until then).

## 2. Goals, non-goals, anti-goals

**Goals**

- `domain-identity` is the single owner of the identity contracts: credential schemas, the profile and avatar schemas, and the display-user projection. The app-local duplicates are removed (section 3).
- `server-supabase` holds the session refresh helpers and the provider-user translation; it stays the only server package importing `@supabase/*`.
- `server-auth` holds the auth operations (registration, recovery, email change, callback exchange, deletion helpers) behind typed results, with request-bound clients supplied by the host.
- `server-account` holds the profile operations (name, avatar, metadata) beside the preferences row from M6.
- `frontend-supabase` holds the browser client and the auth-state subscription; it is the only frontend package importing `@supabase/*`.
- `features-auth` and `features-account` hold the experiences, copying the `features-settings` layout (`./contracts`, `./frontend`, `./server`).
- The three M7-tagged boundary exceptions are removed (section 6).

**Non-goals**

- Any change to Supabase Auth, PKCE, cookie sessions, `getClaims` use, the proxy's refresh behavior, redirects, safe-next handling, rate-limit handling, or fixture mode (ADR-0006, ADR-0008).
- React Hook Form for Auth or Account forms (ADR-0015; the Part B pilot lives in its own pull request).
- New auth methods, new profile fields, a changed account-deletion flow, or new error copy.
- Roles, permissions, or anything beyond the existing owner-area check.
- Native apps.

**Anti-goals** (a failure even if the code works)

- A weaker check on any server path: a mutation that used to verify the caller now trusts a client value, or a second `getClaims()` call per request.
- A token, session object or provider error detail reaching the browser through a new contract.
- A change in what the recovery reply reveals about whether an account exists (ADR-0008 keeps the neutral accepted reply).
- A package cycle between `features-auth` and `features-account` (section 4.6).
- `next` imported anywhere a package rule forbids it, or a Server Action moved into a package.

## 3. Current state (evidence, read at `ba00942c`)

| Part                          | Where today                                                                                                                                                                                                                                                                                | Notes                                                                                                                                                                                                                                        |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Verified identity             | `packages/server/auth`, `packages/server/supabase`, `packages/domain/identity` (M4)                                                                                                                                                                                                        | Exists. `domain-identity` exports `nameSchema`, `profileSchema`, avatar schemas and `VerifiedIdentity`.                                                                                                                                      |
| Duplicate profile contracts   | `features/account/types/schema.ts`                                                                                                                                                                                                                                                         | Same `nameSchema` and `MAX_NAME_LENGTH` as `domain-identity`, plus app-local `profileSchema`, `avatarFileSchema` and avatar constants that `domain-identity` also exports. Only `session.ts` and `caller.ts` import `domain-identity` today. |
| Credential schemas            | `features/auth/types/schema/schema.ts` (`signInSchema`, `signUpSchema`, `newPasswordSchema`, `emailRequestSchema`, `updatePasswordSchema`, password rules and `firstRefusal`/`everyRefusal`)                                                                                               | Pure `zod`; they import `nameSchema` from the account feature.                                                                                                                                                                               |
| Server Actions                | `features/auth/server/actions/actions.ts` (575 lines), `features/account/server/actions/{name,setup,avatar}-actions.ts`, `app/auth/delete-account/actions.ts`                                                                                                                              | FormData extraction, validation, `redirect`, `revalidatePath`, fixture refusal. These are the Server Action entry points.                                                                                                                    |
| Auth operations               | `features/auth/server/operations/operations.ts` (412 lines), `features/auth/server/session/session.ts` (79), `site-origin`, `form-data`                                                                                                                                                    | Provider calls: register, recovery, email change, `getUser`, `getClaims`. `operations.ts` imports `@supabase/supabase-js`.                                                                                                                   |
| Profile operations            | `features/account/server/{save-name,save-avatar,caller}.ts`, `profile-metadata/`, `image-type/`                                                                                                                                                                                            | `caller.ts` imports `@supabase/supabase-js`, builds the app's Supabase client type, and holds `logFailure` and `getCallerIdentity`.                                                                                                          |
| Session refresh               | `lib/supabase/middleware.ts` (116), called from `proxy.ts`                                                                                                                                                                                                                                 | Imports `@supabase/ssr`. Named for `server-supabase` in the inventory ("session refresh helpers").                                                                                                                                           |
| Browser client and events     | `lib/supabase/client.ts` (8), `features/auth/client/auth-events/auth-events.ts` (27), `client/user-provider`                                                                                                                                                                               | `auth-events` and `client.ts` import `@supabase/*` in the browser.                                                                                                                                                                           |
| Auth client state             | `features/auth/client/{use-confirmation, use-cooldown, pending-email, connected-accounts, user-provider}`                                                                                                                                                                                  | React; `user-provider` carries the display user.                                                                                                                                                                                             |
| Auth presentation             | `features/auth/components/{login, register, password, email, resend, oauth-buttons, sign-in-again, sign-out, delete-account, connected-accounts, auth-status, current-user-avatar}`, `features/auth/shared/{auth-shell, auth-divider, auth-confirmation, auth-link-button, resend-button}` | Copy and workflows. Forms use `@synapcity/frontend-forms` (Part A).                                                                                                                                                                          |
| Account presentation          | `features/account/components/{name, avatar, profile}`, `features/account/shared/{profile-avatar, initials, avatar-url, provider-image, name, profile-confirmed}`, `components/account`, `components/profile`                                                                               | `shared/` mixes pure helpers with `profile-avatar.tsx` (React).                                                                                                                                                                              |
| Shared UI                     | `packages/frontend/ui/src/components/auth-buttons/auth-buttons.tsx`                                                                                                                                                                                                                        | Imports `next/navigation` (R11 exception, removal tagged M7). It already takes caller-supplied `signInHref` and `signUpHref` (ADR-0009).                                                                                                     |
| Host policy                   | `lib/routing/{auth-flow, safe-next, user-paths, notices, route-access}`, `lib/access/{dev-fixture, require-owner}`, `lib/supabase/{server, env}`                                                                                                                                           | Application URLs, redirects, fixture mode, environment. Auth and account import them 21 times in non-test code.                                                                                                                              |
| Routes                        | `app/auth/*` (16 files: login, register, forgot-password, update-password, error, welcome, callback, delete-account), `app/layout.tsx`, `app/page.tsx`, settings and spaces pages                                                                                                          | Compose the above. 62 non-test files outside the two folders import the auth or account features (including `components/account` and `components/profile`).                                                                                  |
| Cross-feature edges           | `auth` imports `account` (types, `profile-avatar`, `shared/connected-accounts` via 3 imports) and `account` imports `auth/shared/connected-accounts` (3 imports)                                                                                                                           | A two-way edge between the two folders. As separate feature packages this would be a cycle.                                                                                                                                                  |
| `next` imports                | 4 `next/cache` and 5 `next/navigation` in non-test auth and account code                                                                                                                                                                                                                   | All in Server Actions or route-facing code.                                                                                                                                                                                                  |
| M7-tagged boundary exceptions | R11 `auth-buttons.tsx` (`next/navigation`); R9 account components barrel cycle; R9 `auth/client` barrel cycle                                                                                                                                                                              | In `packages/dev/boundaries/src/exceptions/exceptions.ts`.                                                                                                                                                                                   |

Not verified in this design: whether the `amr`-based check in `recent-link-sign-in` warrants a contract field (M4 deferred that call to M7); the exact set of `lib/` helpers each moved unit needs to receive as inputs; Storybook coverage of the moved components (none of the auth or account files is a story today).

## 4. Design

### 4.1 `domain-identity` (extend)

Adds the credential schemas (`signInSchema`, `signUpSchema`, `newPasswordSchema`, `emailRequestSchema`, `updatePasswordSchema` and their messages) and the display-user projection (`CurrentUser`, `profileFromClaims`, the pure `name`, `initials`, `avatar-url`, `provider-image` and `profile-confirmed` rules). The app-local `features/account/types/schema.ts` is deleted and its importers use the package, so each contract has one owner. Messages that are validation messages in the schemas move with them (the server and the form read one rule, as the file's own comment says). Product copy for flows stays in the features.

### 4.2 `server-supabase` (extend)

Receives the session refresh helpers from `lib/supabase/middleware.ts` and a typed provider-user translation (the `user_metadata` and `identities` fields `getCaller` reads today), so no other server package imports `@supabase/*`. The host keeps environment reading, cookie adapters, `createClient`, and `proxy.ts` as the Next.js entry that calls the helper.

### 4.3 `server-auth` (extend)

Receives the auth operations from `operations.ts` and `session.ts` (registration, recovery, email change, callback exchange, the `getUser` and `getClaims` display reads) behind typed results. Callers pass a request-bound client or identity provider; the package never builds a client, reads fixture mode, calls `redirect`, or logs. ADR-0008's reply rules are preserved: registration returns confirmation-required, signed-in with user id, or provider error with an optional code; recovery returns accepted or rate-limited.

### 4.4 `server-account` (extend)

Receives name, avatar and profile-metadata operations (`save-name`, `save-avatar`, `profile-metadata`, `image-type`) next to the M6 preferences row. It takes the verified caller and a request client from the host. The sign-in-again, save-failed and similar messages are product copy and stay in features; `logFailure` stays with the host (the M6 rule: packages do not log).

### 4.5 `frontend-supabase` (new)

Holds the browser client factory and the auth-state subscription (`client.ts`, `auth-events`). Environment values arrive from the host. It exposes no Supabase types beyond what a consumer needs. Rule R3 keeps server code unreachable from it.

### 4.6 `features-account` and `features-auth` (new)

Each follows the `features-settings` layout: `./contracts` (portable types and view models), `./frontend` (components, hooks, client state, stories, tests), `./server` (server composition over the server packages). To keep the dependency one-way, the `connected accounts` model and its pure helpers move to `features-account/contracts` and `features-auth` imports them. `profile-avatar` lives in `features-account/frontend` and `features-auth/frontend` (`current-user-avatar`) imports it. The result is a single edge, auth to account, with no reverse import. If the connected-accounts logic proves to need auth-only inputs, the fallback is a shared contract in `domain-identity` (owner question Q2).

`AuthButtons` leaves `frontend-ui` for `features-auth/frontend` (under `src/frontend/next/` if it still needs `next/navigation`), which removes its R11 exception. The generic auth presentation pieces (`auth-shell`, `auth-divider`, `auth-confirmation`, `auth-link-button`, `resend-button`) stay inside `features-auth` until a second consumer appears; the inventory row for `frontend-auth` is marked deferred (owner question Q1).

### 4.7 Hosts

`apps/web` keeps, unchanged in behavior: the Server Action entry points (FormData extraction, validation, `redirect`, `revalidatePath`, fixture refusal, logging) now calling package operations; `proxy.ts`; the route files under `app/auth/*`; `lib/routing/*`, `lib/access/*` and `lib/supabase/{server,env}`; the per-request binding that supplies clients and application URLs to the feature entries. This is the pattern M6 used and ADR-0008 point 1 describes (Server Actions retain their entry points). No Server Action file moves into a package.

### 4.8 Tests and verification

- Every moved unit keeps its tests unchanged except import paths and mocks; coverage is added only for outcomes the move newly exposes (typed results at the package boundary).
- Each server package tests success, signed-out, provider-failure and rate-limit results without Next.js or fixture mode.
- Existing end-to-end coverage of sign-in and registration stays green; manual checks (register, sign in, recover, change email, sign out, delete account, edit name and avatar, OAuth link) are listed in each plan as not automated.
- `pnpm boundaries` must show the three exceptions gone and none added; `pnpm deps`, then the full `pnpm verify`.
- Live provider behavior is not verified by any automated check and is reported as not run.

## 5. Package creation

Three new packages per the package checklist: `frontend-supabase`, `features-account`, `features-auth`. `domain-identity`, `server-supabase`, `server-auth` and `server-account` are extended. `frontend-ui` loses `AuthButtons`. Web, and Storybook where stories move, gain workspace dependencies; the Tailwind entry points gain `@source` lines. No new external dependency is expected (`@supabase/*` and `zod` are already declared).

## 6. Boundary checks and exceptions

| Exception                                                 | Removed by | Condition |
| --------------------------------------------------------- | ---------- | --------- |
| R11 `auth-buttons.tsx` `next/navigation` in `frontend-ui` | 4.6        | always    |
| R9 account components barrel cycle                        | 4.6        | always    |
| R9 `auth/client` barrel cycle                             | 4.6        | always    |

Completion criterion: `pnpm boundaries` passes with these three removed and none added.

## 7. Migration bridges

None. Each sub-milestone re-points its consumers in the same change (the M5 and M6 rule).

## 8. Order of work (sub-milestones)

1. **M7.1 Contracts.** `domain-identity` gains credential schemas and the display-user projection; the app-local duplicates are removed and importers re-pointed. Touches no components.
2. **M7.2 Server.** `server-supabase` session refresh helpers and provider-user translation; `server-auth` operations; `server-account` profile operations; web actions call them. Touches no components.
3. **M7.3 Browser client.** `frontend-supabase`; `user-provider` and `auth-events` re-pointed.
4. **M7.4 Account experience.** `features-account` (contracts, frontend, server composition); removes the account R9 exception.
5. **M7.5 Auth experience.** `features-auth`; `AuthButtons` moves; removes the auth R9 and the R11 exceptions; routes thinned.
6. **Close-out.** Records (ownership map, inventory, ADR-0014 section 7, task scope), `pnpm verify`, owner manual checks.

**Sequencing against the React Hook Form pilot.** The pull request that adds `useActionForm` (Part B, #67) edits `register-form`, `forgot-password-form` and their tests under `features/auth`. M7.1 to M7.3 do not touch those files and can start before it merges. M7.4 and M7.5 move them and must wait for that pull request to merge, or they will conflict (owner question Q4).

One pull request per sub-milestone or one sectioned pull request: the owner chose the sectioned shape for M5 and M6; this design assumes the same unless told otherwise.

## 9. Owner questions

| #   | Question                                                                                                                                                                            | Recommendation                                                                                                                                                                            |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q1  | Defer the `frontend-auth` package (keep the generic auth pieces inside `features-auth`), as M6 deferred `frontend-settings`?                                                        | Yes. Only auth uses `auth-shell`, `auth-divider`, `auth-confirmation`, `auth-link-button` and `resend-button`. They move when a second consumer appears. Mark the inventory row deferred. |
| Q2  | Make the dependency one-way, auth to account, by moving the connected-accounts model into `features-account/contracts`?                                                             | Yes. It removes today's two-way edge without a new package. Fallback: a shared contract in `domain-identity` if the model needs auth-only inputs.                                         |
| Q3  | Keep every Server Action and its `redirect` and `revalidatePath` calls in `apps/web`, with packages exposing operations and typed results?                                          | Yes. It matches ADR-0008 and M6, keeps `next` out of server packages, and avoids moving a `use server` file across a package boundary.                                                    |
| Q4  | Start M7.1 to M7.3 now and hold M7.4 and M7.5 until the React Hook Form pull request (#67) merges?                                                                                  | Yes. The first three touch no auth components; the last two move the files that pull request edits.                                                                                       |
| Q5  | Decide the recent-sign-in contract question (M4 deferred it to M7) when the delete-account flow moves, keeping it a `features-auth` server helper unless a second consumer appears? | Yes. Widening `VerifiedIdentity` was an M4 anti-goal; a helper reading claims through the provider keeps the contract small. Revisit if another feature needs it.                         |

**Answers, 2026-10-24 (owner decisions).** Q1: yes, `frontend-auth` is deferred and the generic auth pieces stay in `features-auth`. Q2: yes, the dependency is one-way, auth to account. Q3: yes, Server Actions stay in `apps/web`. Q4: yes, M7.1 to M7.3 start now and M7.4 and M7.5 wait for the React Hook Form pull request (#67) to merge. Q5: yes, the recent-sign-in decision is made when the delete-account flow moves.

## 10. Calls made by Claude (owner to check)

| #   | Call                                                                                              | Why                                                                                                      |
| --- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| C1  | Credential schemas and the display-user projection go to `domain-identity`, not to a feature.     | They are pure, portable, and used by server and browser code; one owner per contract.                    |
| C2  | Product copy for flows (confirmation and failure messages, sign-in-again text) stays in features. | ADR-0014: features own product messages and workflow copy.                                               |
| C3  | `logFailure` and fixture refusal stay with the host.                                              | Same rule as `server-data` and `server-account` in M6: packages do not log or read fixture mode.         |
| C4  | No React Hook Form change in M7.                                                                  | ADR-0015 separates adoption from migration; moving and re-implementing forms together hides regressions. |
| C5  | Session refresh moves as a helper into `server-supabase`; `proxy.ts` stays the Next.js entry.     | The inventory already names it there; the Next.js file convention must stay in the app.                  |
| C6  | `AuthButtons` moves to `features-auth` rather than a new `frontend-auth` package.                 | It is product navigation; the generic-package question is Q1.                                            |

## 11. Left out, found along the way

- The duplicated profile contracts (section 3) mean today's web code does not yet use the M4 `domain-identity` schemas; M7.1 closes that.
- Recent-link sign-in and the display-user fields (`amr`, issued-at) remain a contract question (Q5).
- `components/account` and `components/profile` are two-file app folders that compose account features; M7.4 decides whether they stay as host composition or move into `features-account`.
- Storybook coverage for auth and account components does not exist and is not added by a move alone; adding stories is a separate decision.
- Live provider checks (Supabase Auth, OAuth providers, email delivery) have no automated coverage and are not part of this design's verification.
