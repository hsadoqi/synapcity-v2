# Milestone 7.2 server packages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Status:** Tasks A and C are merged (#69 and #71). Task B is deliberately not done (see its Decision). The full repository gate and manual checks remain open. Call C1 below amends the M7 design.

**Goal:** The provider-facing auth operations, the session refresh helper and the profile operations leave `apps/web` for the server packages, behind typed outcomes, with no change in behavior. Server Actions, redirects, fixture mode and logging stay in the web app.

**Architecture:** `server-supabase` is the only server package importing `@supabase/*` and already depends on `server-auth`, so the Supabase-specific operations go there (a dependency from `server-auth` back to `server-supabase` would be a cycle). Operations take the request-bound client as an argument instead of building one. Pure helpers they need move to `domain-identity`. Operations that depend on the recent-sign-in check stay in the app until M7.5, as design Q5 decided.

**Tech Stack:** TypeScript 7.0.2, `@supabase/supabase-js` 2.117.3 and `@supabase/ssr` 0.12.7 (as `server-supabase` declares them), Vitest 4.1.12, pnpm workspace.

**Spec:** [2026-10-24-m7-auth-account-design.md](../specs/2026-10-24-m7-auth-account-design.md), sections 3, 4.2 to 4.4, 4.7 and 8 (M7.2). Governing: [ADR-0008](../../architecture/decisions/0008-auth-actions-and-server-operations.md) (the action owns the form; the operation owns one provider call and returns a scalar outcome), [ADR-0006](../../architecture/decisions/0006-authentication-with-supabase.md), [ADR-0014](../../architecture/decisions/0014-multi-app-package-boundaries.md).

## Global Constraints

- **Outcomes unchanged:** every outcome type and every `kind` string keeps its name and shape. Outcomes stay plain scalars; no SDK user, session, token or error object leaves a package.
- **Clients:** operations receive the request-bound `SupabaseServerClient` from the caller. No package builds a client in module scope or reads fixture mode, environment, cookies or `next/*`.
- **No logging in packages** (the M6 rule). Where an operation logs today, the outcome carries what the host needs and the host logs. Operations that log stay in the app until that is done (Task A lists them).
- **Server entry guard (R10):** every new server entry file starts with `import 'server-only'`.
- **Actions keep their entry points** (FormData extraction, validation, `redirect`, `revalidatePath`, fixture refusal). They call `createClient()` and pass the client in.
- **No re-export bridges.** Tests move with their units.
- **Do not edit** `register-form`, `forgot-password-form` or their tests (React Hook Form pull request #67).
- **Commits** only when the owner authorizes them. Conventional style, no attribution trailer, no GitHub closing keyword near an issue reference. Never quote the owner in a document or commit.

## Review Focus

1. **Same replies.** Every action test passes unchanged except mocks of where the operation now comes from; every operation test keeps its assertions (they mock the client, so the client becomes an argument).
2. **Account discovery.** `requestRecoveryEmail` still answers `accepted` for every outcome except a rate limit.
3. **Retry versus signed-out.** `changeEmail` and the other session-bound operations still tell `unavailable` (retryable) from `signed-out`.
4. **Ratchets.** `apps/web/src/identity-boundary.test.ts` lists the files allowed to call `getClaims()`/`getUser()`; moving a call changes the list. `architecture.test.ts` guards the operations path. Both change deliberately, not by accident.
5. **One `getClaims()` per request** (M4 requirement) still holds.

---

### Task A: Auth operations into `server-supabase`

**Files:**

- Create: `packages/server/supabase/src/auth-operations/{auth-operations.ts,auth-operations.test.ts,index.ts}`. Modify `packages/server/supabase/src/index.ts` (export the operations and their input/outcome types).
- Move to `packages/domain/identity/src/utils/`: `isRateLimited` from `features/auth/shared/error-messages/error-messages.ts` as `utils/is-rate-limited/`, and `features/auth/shared/oauth-providers/` as `utils/oauth-providers/` (both pure; the operations and the copy code need them). Re-point their importers.
- Move out of `features/auth/server/operations/operations.ts`: `registerWithPassword`, `requestRecoveryEmail`, `changeEmail`, `resendEmailChange`, `sendOwnPasswordReset`, `startAccountLink`, `disconnectAccount`, with their input and outcome types and their tests from `operations.test.ts`. Each takes `client: SupabaseServerClient` as its first argument.
- Stays in the app (still in `operations.ts`, with its tests): `sendAccountDeletionLink` and `deleteOwnAccount` (they use the recent-sign-in check, design Q5, and `deleteOwnAccount` logs). They move in M7.5 with the delete-account flow.
- Modify: `features/auth/server/actions/actions.ts` (import the operations from `@synapcity/server-supabase`, pass `await createClient()`); `features/auth/server/operations/index.ts`; `apps/web/src/identity-boundary.test.ts` and `architecture.test.ts` (ratchet entries); `packages/server/supabase/package.json` (add `@synapcity/domain-identity` as a dependency for `isRateLimited` and `OAuthProvider`; no version changes).
- Modify: the README of `server-supabase`; the M7 design 4.3 and the inventory rows for `server-auth` and `server-supabase` (call C1).

**Interfaces:**

- Produces (`@synapcity/server-supabase`): the seven operations and their `*Input` / `*Outcome` types, unchanged.
- Consumes: `SupabaseServerClient`; `isRateLimited`, `OAuthProvider` from `@synapcity/domain-identity`; `isAuthRetryableFetchError`, `isAuthSessionMissingError` from `@supabase/supabase-js` (allowed here).

- [x] **Step 1: Move the two pure helpers** (`isRateLimited`, `oauth-providers`) into `domain-identity` with their tests; export from the root; re-point importers. Run package and affected web tests.
- [x] **Step 2: Move the seven operations and their tests** into `server-supabase`; replace `createClient()` with the `client` argument; keep every outcome and message-free reply. Run `pnpm --filter @synapcity/server-supabase test`, `lint`, `check-types`.
- [x] **Step 3: Re-point the actions** and update the two ratchet tests. Run the web `features/auth`, `identity-boundary` and `architecture` tests, `check-types` and `lint`.
- [x] **Step 4: Run the checks:** `pnpm boundaries`; `pnpm deps`. Expected: pass; `rg -n "@supabase/" apps/web/src` shows only the remaining intended files (Task B and C finish the rest).
- [x] **Step 5: Checkpoint commit** (local only): `refactor(server-supabase): move the provider auth operations into the package`.

### Task B: Session refresh helper

**Decision (owner, 2026-10-24, on the recommendation): not done in M7.2.** Session refresh stays in `apps/web/src/lib/supabase/middleware.ts`. Most of the file is Next.js response handling that must stay in the app; the portable part is about five lines; and importing a `server-only` package from the proxy is NOT VERIFIED. Revisit only if the end-to-end suite is run with the proxy importing the package. The design's `server-supabase` mention of "session refresh helpers" and the M7 exceptions list are unaffected (this file has no boundary exception).

**Why (recorded when the blocker was found, 2026-10-24):** `server-supabase`'s root entry starts with `import 'server-only'` (rule R10), and `proxy.ts` would then import it. Nothing imported by the proxy does that today, and the installed Next.js 16.4.3 docs say the proxy runs on the Node.js runtime but do not say whether `server-only` is safe there. NOT VERIFIED. If it throws at module load, every request fails. Do not implement until one of these is shown by running it: (a) `next start` with the proxy importing the package answers a request, or (b) a dedicated proxy-safe entry is agreed, which needs an owner decision because R10 requires the guard on every server entry. The end-to-end suite (`pnpm test:e2e`) would exercise (a); it was not run here because of machine load.

**Files:** `lib/supabase/middleware.ts` keeps the Next.js response handling (`NextResponse`, cache headers, the protected and guest-only redirects). The portable part, creating the cookie-bound client and reading the claims, moves to `packages/server/supabase/src/session-refresh/` as a function taking a host-supplied cookie adapter (`getAll`, `setAll(cookies, headers)`) and the environment values, returning `{ claims }`. The host adapter keeps `request.cookies` and `supabaseResponse` updates. Modify `middleware.test.ts` so the same cases hold. After this task `@supabase/ssr` is imported only by `server-supabase` in server code.

- [ ] **Step 1: Write the failing tests** for the helper (cookie writes pass headers to the adapter; claims come back; no call between client creation and `getClaims()`).
- [ ] **Step 2: Implement and re-point `middleware.ts`.** The ordering rule in the file's comments (no code between `createServerClient` and `getClaims`) is preserved and tested.
- [ ] **Step 3: Run the checks** as in Task A. The middleware tests keep their assertions on redirects, cookies and cache headers.
- [ ] **Step 4: Checkpoint commit** (local only): `refactor(server-supabase): move the session refresh client into the package`.

### Task C: Profile operations into `server-account` and `server-supabase`

**Status: implemented and merged in #71 (2026-10-25). The split below was followed with both recommendations (reason codes in the package, wording in the app; `ProviderUser` in `server-supabase`).**

**What is in `features/account/server` today (evidence, read at `ba00942c`):**

- `caller.ts` mixes five things: `getCaller` (a provider `getUser()` call, with copy and a log line), `getCallerIdentity` (already uses `server-auth` and `server-supabase`, plus copy and a log line), `logFailure`, `mirrorToSession` (`updateUser` then `refreshSession`, logging each step), and the types `Supabase`, `Caller`, `MetadataPatch`, plus the messages `SIGN_IN_AGAIN`, `SAVE_FAILED`, `SHOWS_LATER`.
- `save-name.ts` and `save-avatar.ts` do the database and storage work, call `logFailure` inside, and `save-avatar.ts` returns user-facing strings (`SAVE_FAILED`, `Use a PNG, JPEG or WebP image.`, `Choose an image.`).
- `profile-metadata/` and `image-type/` are pure (`withFullName`, `withAvatarUrl`, `withProfileConfirmed`, `detectImageType`, `extensionFor`).
- The actions (`name-actions`, `avatar-actions`, `setup-actions`) stay in the app.

**The split.** Packages return typed outcomes with a failure code and never log or hold product copy (the M6 rule); the app maps outcomes to the same messages and the same log lines.

| Unit                                                                                          | Destination                                                                                              | Contract                                                                                                                                                                                                                         |
| --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `readProviderUser(client)` (the `getUser()` call)                                             | `server-supabase` (it needs `isAuthRetryableFetchError`, and only this package may import `@supabase/*`) | `{ kind: 'user', user: ProviderUser } \| { kind: 'signed-out', failure } \| { kind: 'unavailable', failure }`, where `failure` is `{ code?, status? }`                                                                           |
| `ProviderUser` (id, `user_metadata`, `identities`), `MetadataPatch`                           | `server-supabase` types, re-used by `server-account`                                                     | Structural, as `Caller` is today                                                                                                                                                                                                 |
| `saveName(client, user, name)`                                                                | `server-account` `profile/`                                                                              | `{ ok: true, patch } \| { ok: false, failure }`                                                                                                                                                                                  |
| `saveAvatar(client, user, request)`                                                           | `server-account` `profile/`                                                                              | `{ ok: true, avatarUrl, patch } \| { ok: false, reason: 'invalid-file' \| 'unsupported-type' \| 'upload-failed' \| 'profile-not-saved', message?, failure? }` (`message` only for `invalid-file`: the domain schema's own words) |
| `removeOldAvatars`                                                                            | `server-account` `profile/`                                                                              | unchanged, best effort                                                                                                                                                                                                           |
| `mirrorToSession(client, user, patches)`                                                      | `server-account` `profile/`                                                                              | `{ ok: true } \| { ok: false, step: 'updateUser' \| 'refreshSession', failure }`                                                                                                                                                 |
| `withFullName`, `withAvatarUrl`, `withProfileConfirmed`                                       | `server-account` `profile/`                                                                              | unchanged                                                                                                                                                                                                                        |
| `detectImageType`, `extensionFor`                                                             | `server-account` `profile/`                                                                              | unchanged                                                                                                                                                                                                                        |
| `getCaller`, `getCallerIdentity`, `logFailure`, `SAVE_FAILED`, `SIGN_IN_AGAIN`, `SHOWS_LATER` | stay in `apps/web` `features/account/server/caller.ts`                                                   | `getCaller` becomes a thin wrapper: calls `readProviderUser`, logs `getCaller` with the failure, returns the same `CallerResult` strings                                                                                         |

**Logs preserved exactly.** The app logs the same operation names with the same fields (`getCaller`, `getCallerIdentity`, `saveName`, `saveAvatar.upload`, `saveAvatar.profile`, `mirrorToSession.updateUser`, `mirrorToSession.refreshSession`), because the outcomes carry the `step` and `failure` code. A missing row logs `{ code: 'profile_row_missing' }` as today.

**Tests.** `actions.test.ts` (740 lines) keeps its assertions on replies and `console.warn` output, changing only mock paths; the package gets tests for each outcome (success, signed-out, unavailable, provider error, row missing, upload failure, orphan cleanup on a failed profile update, unsupported bytes, invalid file).

**Ratchet.** `identity-boundary.test.ts` loses `features/account/server/caller.ts` (its `getUser()` call moves to the package) and `architecture.test.ts` is checked for account paths.

**Owner decisions needed:**

1. Is it right that `saveAvatar`'s outcome uses reason codes and the app owns the message text (`Use a PNG, JPEG or WebP image.` appears both in the domain schema and the unsupported-type branch; the app mapping would reuse the domain constant)?
2. `ProviderUser` lives in `server-supabase`. Acceptable, or should it be a `domain-identity` type? (Recommendation: `server-supabase`; it mirrors a provider record and is not a portable contract.)

- [x] **Step 1: Owner reviews the table above.**
- [x] **Step 2: Tests first** for `readProviderUser`, `saveName`, `saveAvatar`, `mirrorToSession` (outcomes above).
- [x] **Step 3: Move and re-point;** keep the actions' replies and logs identical.
- [x] **Step 4: Run the checks** as in Task A, plus the `actions.test.ts` log assertions. Update the ratchets.
- [x] **Step 5: Checkpoint commit** (local only): `refactor(server-account): move the profile operations into the package`.

### Task D: Records and verification

- [ ] **Step 1: Update the records:** the READMEs of `server-supabase` and `server-account`, the inventory rows, the M7 design (status and the 4.3 amendment), the ownership map rows for auth/account server code, and `.agents/task-scope.md`. No owner quotes.
- [ ] **Step 2: Boundary probes** (planted, then removed): `import '@supabase/supabase-js'` in `server-account` and in `server-auth` should be reported.
- [ ] **Step 3: Repository gate.** `pnpm verify` with nothing else running (or CI on the pull request).
- [ ] **Step 4: Report** per AGENTS.md section 9. Manual: register, recover, change email and resend, link and unlink a provider, sign in again after a refresh, edit a name and avatar.

## Calls made (owner to check)

| #   | Call                                                                                                                  | Why                                                                                                                                                         |
| --- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1  | The provider auth operations live in `server-supabase`, not `server-auth` (amends M7 design 4.3).                     | `server-supabase` depends on `server-auth`; the reverse would be a cycle, and the operations are Supabase SDK calls. `server-auth` stays provider-agnostic. |
| C2  | `sendAccountDeletionLink` and `deleteOwnAccount` stay in the app until M7.5.                                          | They use the recent-sign-in check (design Q5) and one logs; they move with the delete-account flow.                                                         |
| C4  | Two tests asserting "builds a fresh request-bound client for every call" were removed from the moved operation tests. | The package no longer builds clients; the property belongs to the host binding, which `apps/web/src/lib/supabase/server.test.ts` already covers.            |
| C3  | `isRateLimited` and the OAuth provider list move to `domain-identity`.                                                | Pure rules used by both the server operations and the copy code; neither server nor feature code may import the other.                                      |

## Recovery

Keep each task in a separate compilable slice. If a slice fails, restore only that slice against current HEAD; do not rewrite earlier commits. Stop and report if a moved operation needs `next/*`, fixture mode or logging, or if an action test changes its assertions rather than its mocks.
