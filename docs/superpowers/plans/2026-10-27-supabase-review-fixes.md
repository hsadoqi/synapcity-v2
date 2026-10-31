# Supabase Review Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Status:** Approved (owner, 2026-10-27): R1 `local`, R3 (a), R8 (a), and R2 and R4 to R7 as recommended. Implemented 2026-10-27 except Tasks 1 and 9 (spec section 8). Ran before the [web Supabase leftovers plan](2026-10-27-web-supabase-leftovers.md), which had not started; that plan rebases onto this one. _Superseded: "Proposed. … Waits on decisions R1, R2 and R4 to R8 in the spec. Starts after the web Supabase leftovers plan merges."_

**Goal:** Fix the review's correctness findings, move the remaining Supabase code to its owning packages, remove the duplication, and add generated database types, with only the behaviour changes listed in spec section 4.

**Governing:** [Supabase review fixes design](../specs/2026-10-27-supabase-review-fixes-design.md), [ADR-0006](../../architecture/decisions/0006-authentication-with-supabase.md), [ADR-0008](../../architecture/decisions/0008-auth-actions-and-server-operations.md), [ADR-0013](../../architecture/decisions/0013-document-and-dashboard-persistence.md), [ADR-0014](../../architecture/decisions/0014-multi-app-package-boundaries.md), [ownership map](../../architecture/reorganization-ownership-map.md).

## Global Constraints

- Branch `refactor/supabase-review-fixes` from `main`, in its own worktree, before the leftovers change (spec header). Re-read every cited line number on that branch first. _Superseded: "after the leftovers change merges"._
- Tests pinning current behaviour come first for every moved or merged function. Only stub seams and import paths change.
- `server-*` packages import no `next/*` and no feature package. No migration is edited or added.
- Each task's checks: the touched packages' tests, lint and types, `apps/web/src/identity-boundary.test.ts`, `server-supabase`'s `index.test.ts`, `pnpm boundaries`, `pnpm deps`, `pnpm format:check`.
- Order: Task 1 gates Tasks 8 and 9 and may run any time before them. Task 2, then Task 3, then Task 4. Task 5 after Task 3. Task 6 after Task 3. Task 7 after Tasks 3 and 6. Task 8 after Task 2. Task 9 after Task 4. Task 10 last but one, Task 11 last. _Superseded: "Task 1 gates Task 9. Task 2 comes before Tasks 3, 6 and 7. Task 5 comes before Task 6. Tasks 4, 7 and 8 are independent of each other." Task 3 used `logFailure` from the home Task 7 created._
- Conditional tasks: Task 7 only under R8 (a); Task 8 only if R5 is approved and the leftovers live check found asymmetric keys; Task 9 only if Task 1 reproduced the failure and R2 is approved. A skipped task is reported as skipped, with its reason.
- Process: a task scope entry in `.agents/task-scope.md` before Task 1; commits and pushes only when authorized; never a real account deletion except on a throwaway account.

## Traceability

| Finding    | Spec     | Task     | Proof                                                                 |
| ---------- | -------- | -------- | --------------------------------------------------------------------- |
| A1         | 3.2, R1  | 4        | Test asserts the R1 scope is passed; manual two-device sign-out       |
| A2         | 3.8, R2  | 1, 9     | Task 1 record; route and operation tests; manual second-browser links |
| A3         | 3.3      | none     | Moved to leftovers F4; recorded in Task 10                            |
| A4         | 3.1      | 3        | Test: preference failures have no `message`, `details` or `hint`      |
| A5         | 3.5, 3.9 | 2, 5, 10 | Comments gone; two docs marked Superseded                             |
| B1         | 3.2      | 4        | Operation tests; action and callback tests unchanged except seams     |
| B2, C3     | 3.4, R8  | 7        | Pinned loader and action tests pass; `lib/owned-records` gone         |
| B3         | 3.5, R7  | 2        | Every importer re-pointed; tests pass                                 |
| B4, B5, C1 | 3.1      | 3        | `toProviderFailure` tests; one `ProviderFailure`; no `Supabase` alias |
| B6         | 3.7, R3  | none     | Owner decision on `refactor/shells-sidebar-slots`                     |
| C2, C9     | 3.1, 3.3 | 3, 5     | `classifyAuthError` tests; operation tests unchanged                  |
| C4         | 3.4, R4  | 6, 7     | Typecheck; CI drift job                                               |
| C5         | 3.6, R5  | 8        | Test: no `getUser`; signed-out records nothing                        |
| C6         | 3.3      | 5        | Page test mocks `getVerifiedClaims`; boundary allowlist shrinks       |
| C7         | 3.2      | 2, 4     | Tests assert the same log operation names and fields                  |
| C8         | 3.4, R6  | 7        | Test: thrown read error has operation and code, no Supabase message   |

## Tasks

### Task 1: Evidence for the email links and signing keys (A2, R5; read-only)

Not done: Steps 1 to 3 need a real inbox and two browsers. Step 4 in part: the project's public key set lists one ES256 key (2026-10-27); a live token header was not checked.

- [ ] **Step 1:** Against a test project, request a password reset in browser A and open the link in browser B (or a private window). Record the result. Repeat for sign-up confirmation (also record whether the address ended up confirmed), email change and the deletion link.
- [ ] **Step 2:** Read Supabase's current email-template and `verifyOtp` docs; record the `type` value for each email (sign-up `email` and reset `recovery` are confirmed already), whether `{{ .RedirectTo }}` keeps its query string, how secure email change's two links verify, and the `amr` method a token-hash magic-link sign-in produces.
- [ ] **Step 3:** Record whether the owner's email provider prefetches links (a link opened by a scanner fails when the person clicks it).
- [ ] **Step 4:** Copy the signing-key result from the leftovers live check (its section 4.6) for R5.
- [ ] **Step 5:** Record the results in spec section 3.8. If the failure does not reproduce, mark A2 not confirmed and skip Task 9.

### Task 2: Caller helpers and logging (B3, A5, C7 groundwork)

- [x] **Step 1:** Move `getCallerIdentity` and `SAVE_FAILED` to `apps/web/src/lib/access/caller.ts`, and `logFailure` to `apps/web/src/lib/log-failure/` (R7), with their tests. `logFailure` gains the optional third argument (spec 3.2); a test asserts it logs only the given fields.
- [x] **Step 2:** Re-point the importers: spaces, documents, dashboards and settings actions; `settings/server/account-preferences.ts`; `app/[userId]/home/spaces/[spaceId]/page.tsx`; `features/account/server/caller.ts` itself for `getCaller` and `mirrorToSession`.
- [x] **Step 3:** Remove the stale "until Milestone 7" sentences in `caller.ts` and `require-owner.ts`.

### Task 3: Shared failure shape and auth error helpers (B4, B5, C1, C2, A4)

- [x] **Step 1: Failing tests:** `toProviderFailure` (absent keys omitted; a `PostgrestError`, an `AuthError` and a storage error), `classifyAuthError` (each of the three kinds).
- [x] **Step 2:** Implement in `server-supabase/src/provider-failure/` and `src/auth-errors/`. Re-export `ProviderFailure` from `server-auth`; delete the `provider-user` copy. Add `toProviderFailure` to `index.test.ts`'s export list.
- [x] **Step 3:** Replace the six conversions (identity provider `detail`, `save-avatar` `failureOf`, `saveName`, `mirrorToSession` twice, `readProviderUser`). Replace `AccountPreferencesFailure` in `server-account` and `features-settings`.
- [x] **Step 4:** Preference reads and writes return `toProviderFailure(error)`; a test asserts no `message`, `details` or `hint` key (A4).
- [x] **Step 5:** `changeEmail`, `resendEmailChange` and `sendOwnPasswordReset` use `readProviderUser`; `startAccountLink` and `disconnectAccount` use `classifyAuthError`. Existing operation tests pass unchanged.
- [x] **Step 6:** `caller.ts`, `save-name.ts`, `save-avatar.ts` and `settings/server/account-preferences.ts` use `SupabaseServerClient`; delete the `Supabase` alias (B5). `owned-records.ts` is left for Task 7.

### Task 4: Remaining auth operations (B1, A1, C7)

- [x] **Step 1: Pin behaviour** in `actions.test.ts` for the five actions and in the callback route test: every message and field mapping, `unconfirmed`, the rate-limit reply, redirects and revalidation, that `signOut` always redirects, every arrival rule, and each log line's operation and fields.
- [x] **Step 2: Failing tests, then the six operations** in spec 3.2. Add them to `index.test.ts`'s export list.
- [x] **Step 3:** The actions and `/auth/callback` call them. `signOut` passes the R1 scope; a test asserts it. The eight `console.warn` calls become `logFailure`, and the Step 1 log assertions still pass.

### Task 5: Session reads (C6, C9, A5)

- [x] **Step 1:** `update-password/page.tsx` uses `getVerifiedClaims`; its test mocks it.
- [x] **Step 2:** `getProviderUser` uses `readProviderUser`; `getPendingEmail` and `getConnectedAccounts` tests pass unchanged.
- [x] **Step 3:** In the same commit, `identity-boundary.test.ts` drops the `update-password` entry, sets `session.ts` to one call, and rewrites the "(M7)" reasons.

### Task 6: Generated database types (C4, R4)

- [x] **Step 1:** Add the pinned `supabase` CLI as a root devDependency (latest stable from the registry, within the repository's minimum release age). Check the flags with `pnpm exec supabase gen types --help`.
- [x] **Step 2:** Root script `pnpm db:types` writes `packages/server/supabase/src/database-types/database.types.ts` from the local database. Format it so `pnpm format:check` passes, or exclude it from Prettier and ESLint as generated; choose one and note it in the README.
- [x] **Step 3:** `createRequestClient` passes `Database` to `createServerClient`; export `Database`.
- [x] **Step 4:** Fix every type error this surfaces in `server-data`, `server-account` and the web loaders without changing behaviour. Record whether `x(count)` embeds are inferred.
- [x] **Step 5:** CI job `db-types`: install, `pnpm exec supabase start` (database only), `pnpm db:types`, `git diff --exit-code`. It is separate from `pnpm verify`, so local pushes do not need Docker. If it cannot run on the hosted runner, stop and report; do not fall back to the pre-push hook. _Superseded: "If CI cannot start a local database, record that and run the check in the pre-push hook only."_

### Task 7: Records data (B2, C3, C4, C8), only under R8 (a)

- [x] **Step 1: Pin behaviour:** `owned-records.test.ts`, the two pin action tests and the two loader tests, green.
- [x] **Step 2:** Move `space-row` to `server-data/src/owned-row/`. Add `server-data/src/records/` with `listRecordSummaries` and `setRecordPinned`; `setSpacePinned` delegates to it. Move `OwnedRecordSummary` to `domain-records`.
- [x] **Step 3:** Typed rows from `Database`; remove the casts. Thrown read errors carry the operation and code only (R6), with a test, for the moved reads and the existing Space reads.
- [x] **Step 4:** Remove `apps/web/src/lib/owned-records`. Add `apps/web/src/lib/records/` with `SetRecordPinnedResult`, `setRecordPinnedFor` and `loadRecordSummaries`. The documents and dashboards files keep their own exported functions, each calling the helper. Re-point the `OwnedRecordSummary` type imports and the two fixture tests to `domain-records` and `baseRecordSchema`. Step 1 assertions pass with re-pointed mocks.

### Task 8: View recording (C5, R5), only if approved and keys are asymmetric

- [x] `recordSpaceView` checks the caller with `getVerifiedIdentity`. Tests: no `getUser` call; a signed-out caller records nothing and logs nothing.

### Task 9: Email links (A2, R2), only if Task 1 reproduced the failure

Not started: waits on Task 1.

- [ ] **Step 1: Failing tests** for `verifyEmailLink` (success, expired, invalid) and for `/auth/confirm` (each `type`, arrival rules, safe `next`, a full URL in `next` refused, the secure-email-change first step, error path).
- [ ] **Step 2:** Extract the arrival rules from `/auth/callback` into one function; both routes use it; callback tests unchanged.
- [ ] **Step 3:** Add the operation and the route. Change the actions' email redirects to `/auth/confirm?next=…&flow=…`. Add the templates under `supabase/templates/`, reference them in `config.toml`, and add `/auth/confirm` to the local redirect allow-list. If Task 1 found link prefetching, the route renders a confirm button that posts the token instead of verifying on `GET`.
- [ ] **Step 4:** Write the owner's dashboard steps (templates, redirect allow-list) into the spec. The owner applies them before this branch is deployed, because the new templates need the new route and the new route needs the new templates.
- [ ] **Step 5:** If the token-hash `amr` method differs from `otp` and `magiclink`, stop and report: the deletion rule and its SQL counterpart change together under the leftovers parity test, which needs its own approval.

### Task 10: Docs and records (A5, spec 3.9)

- [x] `AuthActions` to `AuthStatus` in the two documents, marked Superseded. ADR-0006 notes for R1, and R5 if taken. READMEs and ownership map rows per spec 3.9. In the leftovers spec, mark F1 done here and add A3 to F4.

### Task 11: Verify

- [ ] `pnpm verify`, the `db-types` CI job, and the manual checks in spec section 5. Report what ran, passed, failed, was skipped (Tasks 7 to 9 and why) and was not run.
