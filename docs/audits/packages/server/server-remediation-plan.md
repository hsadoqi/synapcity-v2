# Server Layer — Validated Findings and Final Remediation Plan

**Type:** read-only review. No repository file was created, changed, moved or deleted; nothing staged or committed; no migration, auto-fix or mutating test was run.
**Commit:** `158910e8` on `feat/register-auth-flow` (the audit began at `8cd5e99c`; the only commit since is a docs change).
**Working tree (not mine, preserved):** another session has **uncommitted** changes that touch the server layer directly:

| In-flight change                                                                                                                                                                         | Effect on this plan                                               |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `isRateLimited` moved from `domain-identity` to `server-supabase/auth-errors` (exported from the root); `password-` and `recovery-operations`, and the app's `operations.ts`, re-pointed | Same files as SRV-02. Server Phase 2 must start after this lands. |
| `providerImageFrom` moved to `server-supabase/provider-user`                                                                                                                             | `save-avatar.ts` re-pointed; touches the same module as SRV-08.   |
| `profileFromClaims` / `currentUserFromClaims` added to the **unguarded** `server-supabase/claims` entry; `session.ts`, `dev-fixture.ts`, welcome and settings pages re-pointed           | Widens the SRV-04 exception (see that finding).                   |
| Welcome/settings forms now edit the raw `displayName`; `displayNameOf({ displayName, firstName })` fallback added in domain                                                              | Resolves part of SRV-06 and withdraws one of its sub-claims.      |
| `domain-identity` flattened to capability files (`names.ts`, `profile-setup.ts`, `avatar.ts`, …)                                                                                         | Domain-owned; consumed by the plan, not changed by it.            |

`pnpm boundaries` passes on the in-flight tree (2,187 files, no violations). I treat the in-flight work as **not yet established**: every phase below that touches those files is gated on it being committed.

**Corrections to my first audit**

- **SRV-02 was overstated.** In the installed `@supabase/auth-js` 2.117.3, every 500–504 and 520–530 response is an `AuthRetryableFetchError` (`lib/fetch.js:32-53`), so a 500 is already "unavailable" on the write path. The real divergence is narrower (429, 4xx without a code, non-JSON error bodies, thrown non-Auth errors).
- **SRV-06's claim that `saveName` should not write `display_name` is withdrawn.** The forms now deliberately edit the raw display name; writing `display_name` there is correct. The remaining problem is the completion contract.
- **SRV-01 is more serious than reported.** The deployment ledger records `delete_own_account` being cancelled with SQLSTATE `57014` (8 s statement timeout) on a production-equivalent environment (`docs/engineering/database-deployment-ledger.md:39,48`). That is exactly the failure branch that leaves the account alive with its avatar files deleted. A second defect was missed: a failed file cleanup is swallowed and deletion proceeds, which can leave a deleted person's photos publicly readable.
- **SRV-09 nuance.** The protected layout persists across client navigations, so the full-list reads run on full loads and on revalidation, not on every click.

---

## A. Corrected findings register

Legend: **Origin** = pre-existing (on `main` before this branch) or branch (introduced by this branch or its in-flight work). **Disposition:** Fix / Fix-with / Defer (until consumer) / Optional / No action. "Confirmed" = traced through code end to end; none reproduced against a database in this review.

| ID                                                              | Revised severity           | Classification                                                                                               | Origin                                | Disposition                                             | Resolved together with               |
| --------------------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------- | ------------------------------------------------------- | ------------------------------------ |
| SRV-01 Account deletion cleanup                                 | **High**                   | Confirmed defect (2 defects)                                                                                 | Pre-existing                          | Fix — Phase 1                                           | SRV-07, SRV-08 (same storage module) |
| SRV-02 Auth-error classification                                | Medium                     | Confirmed defect (narrowed)                                                                                  | Pre-existing; in-flight touches files | Fix — Phase 2                                           | SRV-03, SRV-12, SRV-13               |
| SRV-03 No deadline on `getUser`                                 | Low                        | Credible risk                                                                                                | Pre-existing                          | Fix-with SRV-02                                         | SRV-02                               |
| SRV-04 Server-only on subpaths                                  | Medium                     | Architectural concern; worsened in-flight                                                                    | Pre-existing + branch                 | Fix — Phase 3                                           | SRV-17                               |
| SRV-05 `SpaceSource` row-shape leak                             | Low                        | Architectural concern                                                                                        | Pre-existing                          | Defer to first consumer — Phase 6                       | SRV-19                               |
| SRV-06 Profile completion contract                              | **High** (for this branch) | Confirmed contract gap                                                                                       | Branch                                | Fix — Phase 4 (after decisions D2)                      | SRV-20                               |
| SRV-07 Deletion ops in app                                      | Low                        | Architectural concern                                                                                        | Pre-existing                          | Fix-with SRV-01                                         | SRV-01                               |
| SRV-08 Avatar replace race                                      | Low                        | Confirmed race, rare                                                                                         | Pre-existing                          | Fix — Phase 1                                           | SRV-01                               |
| SRV-09 Unbounded sidebar reads; no logging                      | Low                        | Credible risk + confirmed gap                                                                                | Pre-existing                          | Fix — Phase 5                                           | SRV-19, SRV-21                       |
| SRV-10 README drift                                             | Low                        | Confirmed (docs)                                                                                             | Pre-existing + branch                 | Fix in every phase that touches the package             | —                                    |
| SRV-11 `error` vs `failure` naming                              | Low                        | Optional                                                                                                     | Pre-existing                          | Optional — when touched                                 | —                                    |
| SRV-12 Ops don't classify retryable errors                      | Low → **Optional**         | Inconsistency, no user-visible difference (`authErrorMessage(undefined)` is already the generic "try again") | Pre-existing                          | Fix-with SRV-02                                         | SRV-02                               |
| SRV-13 `getCurrentUser` used as signed-in check                 | Low                        | Confirmed (wrong message during an outage)                                                                   | Pre-existing                          | Fix-with SRV-02                                         | SRV-02                               |
| SRV-14 `createRecord` inserts domain object                     | Low → **Optional**         | Hardening (`baseRecordCreateSchema` is strict, so no runtime risk today)                                     | Pre-existing                          | Optional — Phase 6                                      | —                                    |
| SRV-15 Commented-out code                                       | Low                        | Optional                                                                                                     | Pre-existing                          | Fix when touched                                        | —                                    |
| SRV-16 Settings forwarding layers                               | Low                        | Optional                                                                                                     | Pre-existing                          | No action (ADR-0014 places composition in the feature)  | —                                    |
| SRV-17 `export *` roots                                         | Low                        | Confirmed (unused public helpers)                                                                            | Pre-existing                          | Fix — Phase 3                                           | SRV-04                               |
| SRV-18 Proxy duplicates cookie wiring                           | —                          | Documented exception                                                                                         | Pre-existing                          | No action                                               | —                                    |
| **SRV-19** Playground layout N+1 _(new)_                        | Low                        | Confirmed                                                                                                    | Pre-existing                          | Fix — Phase 5                                           | SRV-05, SRV-09                       |
| **SRV-20** `completeProfile` partial success _(new)_            | Low                        | Confirmed                                                                                                    | Pre-existing                          | Fix-with SRV-06                                         | SRV-06                               |
| **SRV-21** Pin actions don't revalidate _(new)_                 | Low                        | Credible (needs browser check)                                                                               | Pre-existing                          | Fix — Phase 5, coordinate with `fix/r4-pin-toggle-race` | SRV-09                               |
| **SRV-22** `onResponseHeaders` sink never wired _(new)_         | Low                        | Credible risk                                                                                                | Pre-existing                          | Fix — Phase 3 or document                               | —                                    |
| **SRV-23** `/api/spaces/[spaceId]` 404 lacks `no-store` _(new)_ | Low                        | Confirmed (minor)                                                                                            | Pre-existing                          | Fix — Phase 5                                           | —                                    |
| **SRV-24** DB test harness and storage test misplaced _(new)_   | Low                        | Structural                                                                                                   | Pre-existing                          | Fix — Phase 1 (needed for its tests)                    | —                                    |

### Finding details

**SRV-01 — Account deletion (High, confirmed).** Detail in D1.

- _Evidence:_ `apps/web/src/features/auth/server/operations/operations.ts:103-115` runs `cleanup` (→ `removeOldAvatars`) before `rpc('delete_own_account')`. The `try { cleanup } catch { console.warn }` proceeds after any throw, and `removeOldAvatars` (`packages/server/account/src/profile/save-avatar/save-avatar.ts:44-56`) ignores both the `list` and `remove` errors. `list()` returns at most 100 objects (`storage-js` `DEFAULT_SEARCH_OPTIONS.limit: 100`).
- _Defect A (integrity):_ if the RPC fails (57014 timeout observed in a production-equivalent environment, network failure, or `42501` at the AMR boundary), the account survives with `profiles.avatar_url` pointing at a deleted object.
- _Defect B (privacy / silent success):_ if file removal fails, deletion proceeds and reports `deleted`. The bucket is public-read, so the deleted person's photos stay reachable by URL with no account left to retry from.
- _Consumers:_ delete-account page and action only.
- _Regression tests:_ see D1.

**SRV-02 — Auth-error classification (Medium, confirmed, narrowed).** Detail in D2. Six sites: `classify-claims.ts:35-55`, `supabase-identity-provider.ts:22-26`, `provider-user.ts:39-43`, `auth-errors.ts:18-22`, the unlink branch in `account-operations.ts:65-73`, and the app's `operations.ts:38-41,93-96`. Divergences that are defects: 429 `over_request_rate_limit`, a 4xx with no code, and `AuthUnknownError` (non-JSON error body) are "signed out" on the write path but "unavailable" on the read path. A thrown non-Auth error from `getUser` propagates as an exception from `supabaseIdentityProvider.user()` and `readProviderUser`, where `readClaims` contains it. _Consumers:_ ~15 Server Actions via `getCallerIdentity` / `getCaller`, the auth settings actions, the deletion operations.

**SRV-03 — No deadline on `getUser` (Low, credible).** `_request` in auth-js calls `fetch` with no timeout; `readClaims` alone bounds the wait at 4 s. Not reproduced.

**SRV-04 — Server-only boundaries (Medium).** Detail in D3. All server-package exports today: `server-auth` `.`, `./testing`, `./utils`; `server-supabase` `.`, `./claims`; `server-account` `.`; `server-data` `.`. R10 inspects only `.` (`packages/dev/boundaries/src/rules/server-guard/server-guard.ts:9-22`) and forbids every other file from importing the guard (`:45-58`). `./utils` has zero importers anywhere in the repository (code, configs, docs). The in-flight change adds two display-profile mappers to `./claims`, which was meant to carry only what the proxy needs.

**SRV-05 — `SpaceSource` (Low, deferred).** Detail in D6. A genuine application port (two implementations, five consumers), but `SpaceRelationsResult` exposes snake_case participation rows. `listWithRelations` / `getRelations` have no caller yet, and they have plausible planned ones (SRV-19 and ADR-0013 item 9's nested routes, which don't exist yet).

**SRV-06 — Profile completion contract (High for this branch).** Detail in D4. `profile_completed_at` is never written. The DB requires `first_name` for completion, but OAuth sign-ups have none and the setup form doesn't collect it. `completeProfile` requires a non-empty display name although display name is now an optional override. Display name cannot be cleared. `first_name` / `last_name` have no write path after signup. "Skipped" lives only in user-editable `user_metadata`.

**SRV-07 — Deletion ops in app (Low).** `operations.ts` imports the SDK directly, builds its own client and logs. Resolved by D1's ownership move.

**SRV-08 — Avatar replace race (Low, confirmed).** Detail in D5.

**SRV-09 — Sidebar reads (Low).** `(protected)/layout.tsx:25` → `getSidebarRecords` reads all Spaces, documents and dashboards **with embedded participation counts**, then `latestRecords` sorts in memory and keeps 8 (`latest-records.ts:15,32-47`). The sidebar uses only `id`, `name`, `icon`; the counts are discarded. Rejections become `[]` with no log (`get-sidebar-records.ts:11-18`). Index pages and dashboard link widgets legitimately need full lists today.

**SRV-10 — Docs.** `server-data/README.md:23-24` (composition null / revision 0 wrong; six exports missing); `server-auth/README.md:3` (auth ops did not land there); `server-supabase/README.md` will also be stale once the in-flight claims/isRateLimited changes land.

**SRV-13.** `actions.ts:320-324,420-421,465-466,553-554` use `getCurrentUser()` (documented "never authorize with it"); during an outage the person is told they are signed out. The provider call itself is the real authorization, so this is not a hole.

**SRV-17.** Unused outside their package: `server-account`'s `detectImageType`, `extensionFor`, `withAvatarUrl`, `withFullName`, and `server-supabase`'s `classifyClaimsResponse` and `CLAIMS_DEADLINE_MS` (exported via `./claims`). Outcome types without outside importers are fine to export; they describe function results.

**SRV-19 (new).** `apps/web/src/app/(protected)/[userId]/home/playground/layout.tsx:17-26` runs `listNavItems` then `listDocuments` + `listDashboards` per Space: 1 + 2N queries.

**SRV-20 (new).** `setup-actions.ts:59-77`: an avatar upload commits (profile row updated, old files removed) before `saveName`. If the name save fails, the action returns an error and skips `mirrorToSession`. The photo did change, but the person is told it failed, and the header shows the old photo until the token refreshes.

**SRV-21 (new).** No pin action (`space-state-actions.ts:27-49`, `lib/records/records.ts:31-55`) revalidates, and no pin caller calls `router.refresh()`. The protected layout's sidebar orders pinned-first, and shared layouts are not re-rendered on client navigation, so the sidebar should stay stale until a full load. Needs a browser check. The `fix/r4-pin-toggle-race` branch works in this area.

**SRV-22 (new).** `createRequestClient` accepts `onResponseHeaders` so session-refresh responses carry `Cache-Control: no-store` (`request-client.ts:11-17,46-52`), but the host's `lib/supabase/server.ts:17-24` never passes it. A Route Handler that refreshes the session (for example `/auth/callback`) drops those headers. Next's own defaults for dynamic handlers may already prevent caching; that is unverified.

**SRV-23 (new).** `app/api/spaces/[spaceId]/route.ts:32-33` returns its 404 without `Cache-Control: no-store`; every other response in both handlers sets it.

**SRV-24 (new).** The generic DB harness (`withTwoUsers`, `withSessions`, `stackEnv`) lives in `server-data/src/testing/db` with no export, and `avatars-storage.dbtest.ts` (a Storage-policy / account concern) lives there too. `server-account` has no database tests and cannot reuse the harness.

---

## B. Proposed final server-package organization

**Universal convention for `server-*` packages**

1. `src/index.ts` starts with `import 'server-only'` and names every export explicitly; no `export *` at the root.
2. Subpath entries exist only for a real consumer. Every non-`./testing` entry starts with the guard unless it is a **named R10 exception** that records the runtime reason and a removal condition.
3. `./testing` carries fakes and test harnesses; it is never guarded (stories may import it) and production files never import it (R8).
4. Functions take the request client (or a port) first; they never read cookies, headers, env or fixture mode, never log, and never call `next/*`.
5. Outcomes: `ok` for binary results, `kind` for multi-outcome operations; provider failures are always `failure: ProviderFailure`.
6. Tests beside units (`*.test.ts`); database tests beside the unit they cover (`*.dbtest.ts`), run by the package's `vitest.db.config.ts`.
7. Grouping follows the package type: **adapter** by provider capability; **persistence** by resource module; **capability** by capability; **port/policy** may use small kind folders. A single-file unit may be a flat file inside its capability folder; promote it to its own folder when it gains tests or a sibling.

**Package-by-package**

`server-auth` — **unchanged** except the export map.

```
package.json exports: ".", "./testing"          (remove "./utils": zero importers)
src/index.ts  types/  utils/{is-owner,verify-identity}/  testing/fake-identity-provider/
```

`server-supabase` — **changes** (after the in-flight work lands):

```
src/
  index.ts                         explicit exports, guarded
  request-client/                  createRequestClient (+ ResponseHeadersSink, wired by host: SRV-22)
  database-types/
  provider-failure/
  auth-errors/                     ONE policy: classifyAuthFailure; mappers classifyAuthError,
    auth-errors.ts                 toProviderOutcome; isRateLimited; withDeadline
    auth-errors.test.ts            ← the classification matrix (D2)
  claims/                          ./claims entry = readClaims + ClaimsResult only (named R10 exception)
    classify-claims.ts
  session-claims/                  exported from the guarded root:
    profile-from-claims.ts         profileFromClaims, currentUserFromClaims (moved out of ./claims)
    recent-link-sign-in.ts         hasRecentLinkSignIn (moved from features-auth/contracts)
  provider-user/                   readProviderUser, providerImageFrom
  supabase-identity-provider/
  auth-operations/
    index.ts                       carries the ADR-0008 header comment
    sign-in-… account-… password-… recovery-… registration-operations/
    account-deletion-operations/   sendAccountDeletionLink (moved from apps/web)
```

`server-account` — **changes**:

```
src/
  index.ts                         explicit exports (internalize detectImageType, extensionFor,
                                   withAvatarUrl, withFullName)
  preferences/
  profile/
    names/                         saveName (display name, nullable) + saveProfileNames (Phase 4)
    completion/                    readProfileStatus, markProfileComplete, recordProfileSkip (Phase 4, per D2)
    avatar/
      save-avatar.ts
      avatar-objects.ts            internal: listAvatarObjects (paged), removeSupersededAvatars,
                                   removeAllAvatars
      image-type.ts                internal
      avatar-objects.dbtest.ts     ← moved from server-data + new race tests
    metadata/                      internal patch helpers
    mirror-to-session/
  account-deletion/
    delete-own-account.ts          the D1 workflow
    delete-own-account.test.ts
    delete-own-account.dbtest.ts
vitest.db.config.ts                new; devDependency on @synapcity/server-data (for ./testing)
```

`server-data` — **minor changes**:

```
package.json exports: ".", "./testing"           (new: the DB harness, per conventions rule 8)
src/testing/db/                    harness exported through ./testing; avatars-storage.dbtest.ts moves out
src/records/                       + listLatestRecords (Phase 5); explicit insert mapping (Phase 6)
src/spaces/                        + listLatestSpaces (Phase 5); camelCase participation type (Phase 6)
src/spaces/space-writes/           remove commented-out code
```

Unchanged: `server-data`'s module grouping; `server-account/preferences`; `server-auth` source; all `features-*/server` entries (except `features-spaces` type imports in Phase 6).

---

## C. Responsibility and ownership map (target)

| Capability                          | Domain rule                                | Server capability (owner)                                                         | App entry point (stays in app)                                                                  |
| ----------------------------------- | ------------------------------------------ | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Request client, session refresh     | —                                          | `server-supabase/request-client`                                                  | `lib/supabase/server.ts` (cookies, env, header sink); `proxy.ts` + `lib/supabase/middleware.ts` |
| Claims read (proxy-safe)            | —                                          | `server-supabase/claims` (exception)                                              | proxy, `features/auth/server/session`                                                           |
| Claims → display profile            | `displayNameOf`, `DisplayProfile`          | `server-supabase/session-claims`                                                  | session, welcome, settings pages                                                                |
| Identity verification               | `IdentityResult`                           | `server-auth` (policy) + `server-supabase` (provider)                             | `lib/access/*` (fixture, redirects, messages)                                                   |
| Auth-error classification           | —                                          | `server-supabase/auth-errors` (single policy)                                     | —                                                                                               |
| Auth flows                          | input schemas (`credentials`, `names`)     | `server-supabase/auth-operations`                                                 | `features/auth/server/actions`, `/auth/callback`                                                |
| Recent link sign-in rule            | — (mirrors the DB function)                | `server-supabase/session-claims`                                                  | delete-account page                                                                             |
| Account deletion                    | —                                          | `server-account/account-deletion` + `server-supabase/account-deletion-operations` | delete-account action (wording, redirect, logging)                                              |
| Profile names / completion          | `names`, `profile-setup` (rule)            | `server-account/profile`                                                          | account actions, welcome page, callback                                                         |
| Avatar lifecycle                    | `avatarFileSchema`, size/type constants    | `server-account/profile/avatar`                                                   | account actions                                                                                 |
| Preferences                         | `domain-preferences`                       | `server-account/preferences`                                                      | settings action; `features-settings/server` composition                                         |
| Spaces, participation               | `domain-spaces` (+ participation type, D6) | `server-data/spaces`; port in `features-spaces/server`                            | Space actions, `/api/spaces`, pages                                                             |
| Documents, dashboards, compositions | `domain-records`, `domain-dashboards`      | `server-data/records`, `server-data/dashboards`                                   | `lib/records`, `features/{documents,dashboards}/server` (until M8 feature packages)             |

No new package. Every move lands in an existing owner.

---

## D. Contract and security remediation

### D1. Account deletion (SRV-01, SRV-07, SRV-24 tests)

**What can and cannot be atomic**

- **Atomic:** `delete_own_account()` deletes `auth.users` (Auth identities and sessions go with it) and, by `ON DELETE CASCADE`, profiles, preferences, spaces, documents, dashboards, compositions, revisions and both participation tables, in one transaction. `supabase/tests/delete-own-account.sql` asserts no orphan rows. A 57014 timeout rolls all of it back.
- **Not atomic with it:** Storage objects (Supabase blocks deleting them from SQL; the migration says so). No two-phase commit exists across Storage and Postgres with the infrastructure in this repo.
- **Session after deletion:** the access token stays cryptographically valid until expiry, and `getClaims` verifies locally. On other devices, pages render claims, RLS returns no rows, and writes (which call `getUser`) fail as signed out. Acceptable; noted for the record.

**Why reversing the order is rejected.** Cleaning up after deletion depends on Storage accepting a token whose user no longer exists, and on the SDK not attempting a refresh mid-cleanup (a refresh would fail, the client would drop to the anon key, and RLS would refuse). Neither is verified. If it fails, the person is already signed out and cannot retry, leaving public photos with no owner, which is the worse outcome.

**Recommended workflow** (server-account `deleteOwnAccount(client, { now })`, host supplies wording and logging):

1. **Verify.** `getClaims` (via `readClaims`): signed out → `signed-out`; unavailable → `unavailable`.
2. **Pre-check AMR.** `hasRecentLinkSignIn(claims.amr, now)` false → `link-required`. Nothing has changed yet.
3. **Detach the profile from uploaded files.** Update `profiles.avatar_url` to the provider image (or null) with `.select()`. Failure → `failed { step: 'detach' }`; nothing changed.
4. **Remove every object** in the caller's folder: page `list()` until empty, check every error. Failure → `failed { step: 'files' }`. The account still exists and is consistent (no row references a missing file); retry is safe.
5. **Delete.** `rpc('delete_own_account')`. `42501` → `link-required`; anything else → `failed { step: 'delete' }`. The account still exists and is consistent; the uploaded photo is gone.
6. **Sign out locally.** Best effort; it never changes the outcome.
7. **Outcome `deleted`** only when step 5 succeeded. Nothing reports success after a failed required step.

**Idempotency.** A retry after a lost response that did commit: step 1 still verifies (local token), step 3 updates 0 rows. That must be treated as "already detached", not as a failure: read the row, and absent means deleted. Step 5 deletes 0 rows and returns success. Result `deleted`. A retry after any failed step re-runs from step 1 safely.

**Residual risk (documented, not fixed):** an upload from another tab between steps 4 and 5 leaves one public object for a deleted user. Closing it needs a privileged reconciliation (a scheduled sweep of folders whose user no longer exists), which requires a service-role capability that this app deliberately lacks. That is decision D3.

**User-facing behavior for `failed` after step 3:** the account remains but the uploaded photo was removed. The message must say so (decision D1).

**Ownership:** `deleteOwnAccount` → `server-account/account-deletion` (it composes avatar storage, which `server-account` owns, so the app no longer injects a cleanup callback). `sendAccountDeletionLink` → `server-supabase/auth-operations/account-deletion-operations`. `hasRecentLinkSignIn` → `server-supabase/session-claims` (it reads Supabase's `amr` vocabulary and mirrors the DB function; its only consumers are server-side). Re-point `delete-account/page.tsx` and remove the export from `features-auth/contracts` **in the same change** (a move with all consumers migrated, recorded in the PR; not a silent deletion). The app's `operations.ts` is deleted once empty.

**Tests:**

- Unit (stub client): each step's failure produces its outcome and stops; `deleted` only after RPC success; a detach with 0 rows reads the row to tell "already deleted" from "refused"; paging with more than 100 objects.
- DB (`delete-own-account.dbtest.ts`, local stack): (a) RPC forced to fail (for example with a stale AMR) after files exist → account exists, `avatar_url` not pointing at a removed object; (b) success → no objects remain in the folder; (c) retry after success → `deleted`; (d) 101 objects → all removed.
- Existing `supabase/tests/delete-own-account*.sql` remain authoritative for the RPC.

### D2. Authentication-error classification (SRV-02, 03, 12, 13)

**Is `classify-claims.ts` sufficient as the authority?** Its rules are right: only an answered "no session" is signed out (session missing, invalid JWT, 4xx with a code other than 429), and everything else is unavailable. It lacks three things other callers need: a distinct **rate-limited** class (email operations show it), a **rejected-with-code** class (operations such as unlink or email change must keep the provider's code), and a way to handle a **thrown** error and a **deadline** around calls other than `getClaims`.

**Responsibilities of the six sites**

| Site                              | Job                                       | Intentional differences                               | Defects                                                                          |
| --------------------------------- | ----------------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------- |
| `classify-claims`                 | Page/proxy gating                         | none                                                  | none (it's the reference)                                                        |
| `supabaseIdentityProvider.failed` | Port vocabulary `unreachable` / `refused` | port names                                            | 429 / no-code / unknown → `refused` → signed out                                 |
| `readProviderUser`                | Profile caller                            | none                                                  | same as above; throws propagate                                                  |
| `classifyAuthError`               | Operations for a signed-in person         | keeps `provider-error(code)`                          | a 4xx auth rejection (for example `bad_jwt`) is `provider-error`, not signed out |
| unlink branch                     | Unlink-specific codes                     | `single_identity_not_deletable`, `identity_not_found` | generic fallback should use the policy                                           |
| app deletion ops                  | as `readProviderUser`                     | —                                                     | same; moves in D1                                                                |

**Design:** one internal function in `server-supabase/auth-errors`:

```ts
type AuthFailureClass =
  | { class: 'signed-out' }
  | { class: 'rate-limited'; code: string }
  | { class: 'unavailable'; failure: ProviderFailure }
  | { class: 'rejected'; code: string | undefined; failure: ProviderFailure };
classifyAuthFailure(error: unknown): AuthFailureClass   // also accepts thrown values
withDeadline<T>(call: () => Promise<T>, ms): Promise<T | 'deadline'>
```

Context-specific mappers keep every public outcome shape unchanged:

- **Identity checks** (`readClaims`, `supabaseIdentityProvider`, `readProviderUser`): `rate-limited` and `unavailable` → unavailable / `unreachable`; `rejected` with 4xx code → signed out; `rejected` without code → unavailable.
- **Operations** (`classifyAuthError`): `signed-out` → `signed-out`; `unavailable` → `unavailable`; `rate-limited` → `rate-limited` where the outcome has it, else `provider-error(code)`; `rejected` → `provider-error(code)`.

There are no public type changes. The only behavioral change is which branch fires for 429, uncoded 4xx, unknown and thrown errors: those now produce "try again" instead of "sign in again". That follows the stated principle that 429/500 are not proof of sign-out, so it is not listed as a decision.

**Consumer migration (in order):**

1. Add `classifyAuthFailure` / `withDeadline` with the matrix tests.
2. Re-implement `classifyError` in `classify-claims` on it (behavior identical; tests already exist).
3. Re-point `supabaseIdentityProvider.failed`, `readProviderUser` (+ deadline, + catch), `classifyAuthError`, and the unlink fallback.
4. Optional: SRV-12 operations.
5. App: SRV-13, swap `getCurrentUser()` for `getVerifiedIdentity()` in the four auth settings actions.

**Regression-test matrix** (each row × columns `readClaims`, provider `claims()`, provider `user()`, `readProviderUser`, `classifyAuthError`):

| Input                                                | Expected                                                                     |
| ---------------------------------------------------- | ---------------------------------------------------------------------------- |
| `AuthSessionMissingError`; `session_not_found`       | signed out everywhere                                                        |
| `AuthInvalidJwtError`                                | signed out                                                                   |
| `AuthApiError` 400/401/403 with code                 | signed out (identity); `provider-error(code)` (operations)                   |
| `AuthApiError` 4xx without code                      | unavailable (identity); `provider-error` (operations)                        |
| `AuthApiError` 429 `over_request_rate_limit`         | unavailable (identity); `rate-limited` / `provider-error(code)` (operations) |
| `AuthRetryableFetchError` status 0 / 500 / 503 / 522 | unavailable everywhere                                                       |
| `AuthUnknownError`                                   | unavailable                                                                  |
| thrown `TypeError`                                   | unavailable, no throw                                                        |
| never-resolving call                                 | unavailable with `timeout` after the deadline                                |

Plus one cross-path test per action family proving `getCallerIdentity` and `getCaller` give the same class for the same error.

### D3. Server-only boundaries (SRV-04, SRV-17, SRV-22)

- **`./utils` (`server-auth`):** zero importers anywhere (code, configs, docs). Remove the export map entry only; the functions remain public through the guarded root. It's a private workspace package, so there are no outside consumers.
- **`./testing` (`server-auth`):** keep; unguarded by design (rule 8), and production files can't import it (R8).
- **`./claims` (`server-supabase`):** the proxy needs `readClaims` and `ClaimsResult`. The Next 16 docs (`proxy.md:253-255`) confirm the proxy runs on Node.js but say nothing about `server-only`. `server-only@0.0.1` throws unless resolved with the `react-server` condition, and whether the proxy bundle uses that condition is **not verifiable from docs**. Keeping this one entry unguarded is justified under the approved narrow-exception principle.
- **Narrowing:** move `profileFromClaims` / `currentUserFromClaims` (in-flight) to the guarded root (`session-claims/`). The proxy reaches them today only because `middleware.ts` imports `dev-fixture.ts` for `fixtureModeEnabled`. Split `dev-fixture.ts`: `fixtureModeEnabled` and constants stay proxy-safe; `fixtureUser()` moves to a server-only module that imports the guarded root. Drop `classifyClaimsResponse` and `CLAIMS_DEADLINE_MS` from the entry (no outside consumers). Result: `./claims` exports exactly `readClaims` and `type ClaimsResult`.
- **Enforcement (R10):** treat every export key of a `server`-category package except `./testing` as an entry that must start with the guard; let each such entry file import the guard; add one **named exception** for `packages/server/supabase/src/claims/index.ts` (reason: proxy runtime, unverified `react-server` condition; removal condition: a build plus proxy smoke test passes with the guard). Add an R10 probe for an unguarded new subpath. A second, optional rule: a named-exception entry may not export more than an allow-listed set of names, so the exception can't silently grow again.
- **SRV-17:** explicit root exports in `server-supabase` and `server-account`; internalize `detectImageType`, `extensionFor`, `withAvatarUrl`, `withFullName`. Their only consumers are inside the package.
- **SRV-22:** wire `onResponseHeaders` in Route Handler contexts (the callback), or document why Next's dynamic-route defaults make it unnecessary. Verify with `curl -I` on a refreshed callback response.

### D4. Profile and identity integration (SRV-06, SRV-20) — one contract

Facts on this branch: columns `first_name`, `last_name`, `bio`, `profile_completed_at`; constraint "complete ⇒ first name"; the signup trigger copies structured names and prefills `display_name` from OAuth `full_name` / `name`; forms edit the raw display name; the header resolves `display_name ?? first_name` from token metadata.

**Contract**

| Concern                          | Authority                                                                                                                           | Mirror (display cache)                          | Owner of the write                                                                              |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Display name (optional override) | `profiles.display_name` (nullable)                                                                                                  | `user_metadata.full_name`, removed when cleared | `server-account` `saveName(client, user, name \| null)`                                         |
| First / last name                | `profiles.first_name` / `last_name`                                                                                                 | `user_metadata.first_name` / `last_name`        | `server-account` `saveProfileNames`                                                             |
| Completion                       | `profiles.profile_completed_at`                                                                                                     | none needed                                     | `server-account` `markProfileComplete` (maps check violation `23514` → `first-name-required`)   |
| Skipped                          | per decision D2                                                                                                                     | —                                               | `server-account`                                                                                |
| "Show the setup step?"           | domain rule over `{ createdAt, completedAt, skippedAt? }`                                                                           | —                                               | domain agent (rule); host callback reads status via `server-account` `readProfileStatus`        |
| Avatar                           | `profiles.avatar_url`                                                                                                               | `user_metadata.avatar_url`                      | `server-account` `saveAvatar` (D5)                                                              |
| Avatar validation                | three complementary layers, not duplicates: domain (declared type and size, 2 MiB), server (magic bytes), bucket (2 MiB, mime list) | —                                               | keep all three; add a parity test that `MAX_AVATAR_BYTES` equals the bucket's `file_size_limit` |

**Flow changes:**

- The setup step collects first name (required, prefilled from the row), last name and display name (optional).
- `completeProfile` writes names, then the avatar, then completion, then mirrors once. A partial failure reports what was saved (fixes SRV-20).
- `exchangeAuthCode` stops computing `needsProfileSetup` and returns `userId` (plus `createdAt`). The callback asks `server-account` for status and applies the domain rule.
- `PROFILE_CONFIRMED_KEY` is retired (or kept only as a skip marker) per decision D2.

**Split of work:** domain agent: the `profile-setup` rule's inputs and the retirement of `PROFILE_CONFIRMED_KEY` (domain F7). Server workstream: everything in `server-account`, `exchangeAuthCode`, host actions and the callback. Frontend: the setup form fields (features-account). There is one contract and no parallel fixes.

### D5. Avatar concurrency (SRV-08)

**Exact race (two saves by the same user, A and B):** A uploads `a`; B uploads `b`; A sets `avatar_url=a`; B sets `avatar_url=b`; A runs `removeOldAvatars(keep=a)` and deletes `b`. The committed profile now references a deleted object. Re-reading the current URL before deleting narrows the window but doesn't close it (B's update can land between A's read and A's delete).

**Approaches considered:**

- Unique keys and immutable objects: already in place (random UUID names; no UPDATE policy).
- Conditional update (compare-and-swap on the previous `avatar_url`): prevents lost updates but rejects one of two legitimate saves. Unnecessary.
- **Recommended: ownership-aware deferred cleanup.** A save deletes only objects that are (1) not the object it just committed, (2) not the object the row references when re-read after its own update, and (3) **older than a grace period** (for example 10 minutes, using the object's `created_at` from `list()`). Any concurrent save's object is younger than the grace period, so it's never deleted by a peer; superseded objects are removed by the next save or by account deletion (which removes everything, D1). Retries are idempotent (new unique name each time; cleanup is repeatable).
- The tradeoff: a superseded photo can remain publicly reachable by URL until the next save. The year-long `cacheControl` already means a CDN may keep serving it after deletion, so this adds little exposure.

**Deterministic tests:**

- Unit: stub storage with controlled `created_at` and an explicit interleaving script; assert the referenced object survives every ordering of {upload a, upload b, update a, update b, cleanup A, cleanup B}.
- DB: two clients for the same user executing the primitives in the scripted order above against the local stack; assert the object behind the final `avatar_url` exists.

### D6. Space contracts (SRV-05)

The port is application-facing (Supabase plus fixture implementations; used by `get-space`, actions, routes, playground, sidebar), so it should not mention column names. Changing it now would add mapping for two methods nobody calls, so the change is deferred to the first consumer, which SRV-19 provides: the playground can replace 1 + 2N queries with `listWithRelations` plus the per-kind item reads.

Home of the participation-link type: ADR-0013 items 2–5 define participation (pair + `pinned`, `position`, `addedAt`) as a product concept. The server mapping, the feature port and the fixture source all need it, so under the conventions' "server or fixtures need a shape → domain" rule it belongs in `domain-spaces`. **But** the glossary and ADR-0013 list the participation noun as unresolved, so naming the type is a terminology decision (D4). Until then, a feature-local name in `features-spaces/server/types` keeps `server-data` from leaking.

---

## E. Domain integration matrix

| Item                                                                                        | Owning layer                             | Contract needed                                                     | Workstream                                                                | Server can proceed independently?                                 | Verify after integration                                          |
| ------------------------------------------------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------- |
| `isRateLimited`, `providerImageFrom`, claims → profile mapping moved into `server-supabase` | server-supabase                          | already in flight                                                   | **domain session (in progress)**                                          | No: Phases 2–3 wait for it to commit                              | `pnpm boundaries`, server-supabase tests, welcome/settings render |
| Claims mapping placement (`./claims` vs root)                                               | server-supabase + app                    | `./claims` = `readClaims` only                                      | server (Phase 3), after the domain session commits                        | After commit                                                      | proxy smoke test, `pnpm build`                                    |
| `hasRecentLinkSignIn`                                                                       | server-supabase                          | `(amr, nowSeconds) => boolean`, unchanged                           | server (Phase 1); notify domain session (it touches `features-auth` next) | Yes, if `features-auth/contracts` isn't being edited concurrently | delete-account page + action tests                                |
| Space participation type                                                                    | domain-spaces (name per D4)              | `{ spaceId, itemId, pinned, position, addedAt }`                    | domain agent adds the type; server maps                                   | No: Phase 6 waits                                                 | `features-spaces` server tests, `server-data` db tests            |
| `createRecord` insert mapping                                                               | server-data                              | explicit `{ name, description, icon, tags }`                        | server (Phase 6)                                                          | Yes (domain schema unchanged)                                     | `server-data` unit + db tests                                     |
| Avatar validation constants                                                                 | domain-identity (`MAX_AVATAR_BYTES`)     | parity with bucket limit                                            | server adds a parity test; domain unchanged                               | Yes                                                               | parity test                                                       |
| Profile completion rule                                                                     | domain-identity (`profile-setup`)        | `needsProfileSetup({ createdAt, completedAt, skippedAt? })`         | domain agent, after decision D2                                           | Server ops can be written first; the callback switch waits        | callback route tests; manual register → welcome → complete        |
| `display_name` / `first_name` semantics                                                     | domain (`displayNameOf`, done in flight) | —                                                                   | done                                                                      | Yes                                                               | header shows first name for email sign-ups                        |
| Domain error types ↔ server results                                                         | server                                   | none: domain has no auth error types; `IdentityResult` is unchanged | —                                                                         | Yes                                                               | —                                                                 |

Rule: no phase edits a module another session is editing. The in-flight files listed at the top are owned by the domain session until committed.

---

## F. Implementation phases

**Phase 0 — Coordination gate (no code).** Wait for the domain session to commit its `server-supabase` / `domain-identity` / app changes; re-run `pnpm boundaries`, `pnpm typecheck` and the server-package tests against that commit.

**Phase 1 — Avatar storage lifecycle and account deletion (SRV-01, 07, 08, 24).** _Owner decisions D1 (and D3 noted)._

- **Scope:** D1 + D5.
- **Files:** `server-account` (`profile/avatar/*`, new `account-deletion/*`, index, README, `vitest.db.config.ts`, package.json devDependency); `server-supabase` (`auth-operations/account-deletion-operations/*`, `session-claims/recent-link-sign-in.ts`, index, README); `server-data` (export `./testing`; move `avatars-storage.dbtest.ts` out); `features-auth/contracts` (remove the moved rule); app `delete-account/{actions.ts,page.tsx}`, `features/account/server/save-avatar.ts` (drop the forwarding re-export), delete `features/auth/server/operations/*`.
- **Public contract changes:** new `deleteOwnAccount` (server-account), `sendAccountDeletionLink`, `hasRecentLinkSignIn` (server-supabase); `removeOldAvatars` replaced by internal primitives (its only outside consumer, the delete action, migrates); `features-auth/contracts` loses `hasRecentLinkSignIn*` (all consumers migrated); `server-data` gains `./testing`.
- **Tests:** D1 and D5 unit and db tests; moved storage test.
- **Downstream:** delete-account page/action, account actions.
- **Verify:** package `test`, `pnpm typecheck`, `pnpm boundaries`, `pnpm deps`, `pnpm db:stack start --fresh` → `pnpm db:test` → `pnpm --filter @synapcity/server-account test:db` (new) and `server-data test:db`; manual deletion on the local stack including a forced RPC failure.
- **Conflicts:** domain session (`features-auth` next on its list); `save-avatar.ts` is in its in-flight diff → after Phase 0.

**Phase 2 — Auth-error policy (SRV-02, 03, 12, 13).**

- **Files:** `server-supabase` `auth-errors/*`, `claims/classify-claims.ts`, `supabase-identity-provider/*`, `provider-user/provider-user.ts`, `auth-operations/account-operations/*` (+ optional others); app `features/auth/server/actions/actions.ts`.
- **Public contract changes:** none to outcome types; branch selection changes as in D2.
- **Tests:** the D2 matrix; existing app action tests for messages.
- **Verify:** package tests, app server tests, `pnpm typecheck`, `pnpm verify`.
- **Conflicts:** in-flight `auth-errors` edits → after Phase 0. Independent of Phase 1 except shared index/README.

**Phase 3 — Boundaries and public API (SRV-04, 17, 22).**

- **Files:** `server-auth/package.json`; `server-supabase` `claims/index.ts`, new `session-claims/`, `index.ts`; `server-account/src/index.ts` and capability indexes; app `lib/access/dev-fixture.ts` (split), `session.ts`, welcome and settings pages (import path), `lib/supabase/server.ts` (SRV-22); `packages/dev/boundaries` R10 + exception list + probe; `workspace-conventions.md` rule 5 text.
- **Public contract changes:** remove `server-auth/./utils`; `./claims` narrowed; display mappers move to the root; helpers internalized.
- **Tests:** R10 probe for a subpath; boundary self-tests.
- **Verify:** `pnpm boundaries`, `pnpm deps`, `pnpm typecheck`, `pnpm build`, proxy smoke test (protected route signed in / signed out / Auth down).
- **Conflicts:** the claims files are in-flight → after Phase 0; `docs/architecture/workspace-conventions.md` was just edited by the domain session.

**Phase 4 — Profile contract (SRV-06, 20).** _Owner decision D2._

- **Files:** `server-account/profile/{names,completion}/*`; `server-supabase/auth-operations/sign-in-operations` (`exchangeAuthCode`); app callback route, `setup-actions.ts`, `name-actions.ts`, welcome page; features-account setup form; domain `profile-setup` (domain agent).
- **Public contract changes:** `saveName` accepts `null`; new `saveProfileNames`, `markProfileComplete`, `readProfileStatus`; `CodeExchangeOutcome` drops `needsProfileSetup` (adds `createdAt`).
- **Tests:** `supabase/tests/profiles.sql` (exists), new server-account db tests for completion and the constraint, callback route tests, the complete/skip action tests; manual email and OAuth sign-ups.
- **Verify:** `pnpm db:test`, package and app tests, `pnpm test:e2e` (auth specs) locally.
- **Conflicts:** domain session (profile-setup), the register-UI task on this branch.

**Phase 5 — Reads, cache and routes (SRV-09, 19, 21, 23).**

- **Files:** `server-data` `records/`, `spaces/` (`listLatestRecords`, `listLatestSpaces`: `order pinned_at desc nulls last, updated_at desc, created_at desc, id`, `limit`, no count embeds); app `lib/sidebar-records/*` (use them, log rejections), playground layout, pin actions (`revalidatePath(homePathFor(userId), 'layout')`), `api/spaces/[spaceId]/route.ts`.
- **Public contract changes:** two new read functions; no removals (index pages keep full lists).
- **Tests:** ordering parity between SQL and `latestRecords` on fixtures with ties; db test that RLS scopes the bounded read; browser check that the sidebar reorders after a pin.
- **Verify:** package tests, `server-data test:db`, `pnpm test:e2e`, manual check.
- **Conflicts:** `fix/r4-pin-toggle-race` (pin flows): merge or rebase order to agree with its owner.

**Phase 6 — Contracts and hygiene (SRV-05, 10, 11, 14, 15).** _Owner decision D4._

- **Files:** `server-data` (participation mapping, insert mapping, dead code, README), `features-spaces/server/types`, fixture source, domain-spaces (domain agent), all server READMEs, `failure` renames where touched.
- **Verify:** `pnpm verify`.

Each phase also updates the touched package's README (SRV-10) and runs `pnpm format:check`.

---

## G. Recommended decisions (only those needing approval)

**D1. Account deletion when the final step fails after the photo was removed.**

- Recommendation: adopt the D1 workflow. On a failure after step 3, the account remains, the uploaded photo is gone (reverted to the provider picture or initials), and the message says exactly that. Abort deletion if file removal fails.
- Alternative: keep files until the RPC succeeds (delete afterwards). Rejected: it relies on unverified Storage behavior for a deleted user, and a failure strands public photos with no way to retry.
- Tradeoff: a failed deletion costs the person their uploaded photo, in exchange for never leaving a dangling reference or orphaned public files.

**D2. How "skipped profile setup" is recorded once completion moves to `profile_completed_at`.**

- Option A (recommended): keep a skip marker in `user_metadata` (display-only and user-editable, which is harmless for a UX prompt). Completion is the column. No schema change.
- Option B: add `profiles.profile_setup_skipped_at` (a schema change, so it needs approval and a migration).
- Option C: don't record skips; the step reappears until completed (within the 7-day new-account window).
- Also confirm: the setup step requires first name (needed for the DB constraint, including OAuth users) and treats display name as optional.

**D3. Orphaned avatar files from a concurrent upload during deletion.** Recommendation: accept and document the narrow residual risk now. A privileged reconciliation (a scheduled sweep using a service-role key) would close it but introduces a privileged credential this app deliberately doesn't hold. Revisit with the deployment work.

**D4. Name of the participation-link contract** (glossary: unresolved). Recommendation: approve a working-label type in `domain-spaces` when the first consumer (SRV-19) lands; until then keep a feature-local type. The alternative is to keep the row shape until the glossary decision, accepting the leak.

Not decisions (already settled or evidence-driven): 429/500 → "try again" (your stated principle); removing `server-auth/./utils` (zero consumers); the narrow `./claims` exception (approved principle); `hasRecentLinkSignIn` moving with all consumers; explicit exports.

---

## H. Verification gaps

**Ran in this review:** `pnpm boundaries` on the in-flight tree (pass, 2,187 files). Inspected the installed auth-js 2.117.3 and storage-js 2.117.3 sources and the Next 16.4.3 bundled docs. All other evidence is code reading. The first audit's runs (717 unit tests, per-package `tsc`/ESLint, Knip) were on `8cd5e99c`, before the in-flight edits, and were **not re-run** on the current dirty tree.

**Not run:** `pnpm verify`, `pnpm build`, `pnpm test:e2e`, `pnpm test:storybook`, `pnpm db:test`, `server-data test:db`, `test:db:budgets` (Docker stack mutation is outside a read-only review).

**Unverified findings and the evidence needed:**

| Finding                     | Status                                                                                        | Evidence needed                                                              |
| --------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| SRV-01 Defect A             | Ordering confirmed; the 57014 trigger is documented in the ledger                             | db test forcing an RPC failure with files present                            |
| SRV-01 rejected alternative | Storage behavior for a deleted user's still-valid JWT is unknown                              | db test (only if you want to revisit D1's alternative)                       |
| SRV-03                      | No timeout in auth-js `_request` confirmed; the platform/undici effective limit is unmeasured | unit test with a hanging stub; optional local stall test                     |
| SRV-04 `./claims` guard     | Whether the proxy bundle resolves `react-server` is NOT VERIFIABLE from docs                  | `pnpm build` + proxy smoke test with the guard on a branch                   |
| SRV-08                      | Race confirmed by sequence; no reproduction                                                   | the scripted db test in D5                                                   |
| SRV-21                      | Credible; layout re-render behavior after a pin unobserved                                    | browser check: pin on an index page, then check sidebar order without reload |
| SRV-22                      | Credible; Next's default cache headers on the callback response unobserved                    | `curl -I` on a callback that refreshes the session                           |
| In-flight tree              | Typecheck and tests of the domain session's changes not run by me                             | that session's own verification; then Phase 0 re-runs                        |
