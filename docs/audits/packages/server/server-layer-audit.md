# Server Layer Audit — Synapcity

**Type:** Read-only architecture, structure and correctness audit. No repository file was created, changed, moved or deleted, and nothing was staged or committed.
**Branch / worktree:** `feat/register-auth-flow` at `worktrees/active/features/auth-flows`.
**Commits audited:** started at `8cd5e99c`. During the audit another session committed `158910e8` ("docs(conventions): organize domain packages by capability"), which changes only `docs/architecture/workspace-conventions.md`. No server, app or feature source changed between the two commits, so every finding applies to both.
**Concurrent changes:** the untracked set changed during the audit (`docs/audits/codebase-refactor.md` disappeared, `docs/audits/packages-refactor.md` appeared). This audit did not create or remove either file. Domain packages are being refactored concurrently; domain concerns are recorded as cross-layer findings only. `packages/domain/identity` currently contains both `src/avatar.ts` and `src/schemas/avatar/avatar.ts` (same `avatarFileSchema`), which looks like refactor-in-progress and is left to that work.
**Scope correction:** there is no `packages/data/`. The only persistence package is `packages/server/data` (`@synapcity/server-data`). This report maps responsibilities to where the code really puts them and does not assume a layered architecture.

---

## A. Executive assessment

The server layer is small (about 3,000 lines of production source across four packages plus about 2,900 lines of app-side server modules) and, overall, **in good health**. All 717 unit tests that touch it pass, and type checks, lint, Knip and the boundary checker are clean.

**Strongest decisions**

1. **Request-bound client, passed explicitly.** Every server function takes the request's Supabase client as its first argument. No package reads cookies, env or fixture mode, or stores a client in module scope. This makes cross-request leakage structurally unlikely.
2. **Reduced, scalar outcomes.** Operations return `{ kind | ok, … }` with a `ProviderFailure` of `{ code?, status? }` only. SDK users, sessions, error messages and tokens never leave the packages, and logging (`logFailure`) is code/status-only.
3. **Defense in depth that actually holds.** Server Actions validate untrusted ids (UUID) and inputs, verify the caller with a fresh `getUser()` before writes, and still rely on RLS plus **column-level grants** in the migrations. Writes use `.select()` so an RLS-refused update cannot look saved. No service-role or secret key is used anywhere.
4. **Careful concurrency where it matters.** `saveComposition` is a conditional, revision-checked write with a read-back that tells a lost-response retry from a real conflict. Participation adds are idempotent.
5. **Outage ≠ sign-out on the read path.** `readClaims` has a deadline and a tri-state result; the proxy and page guards keep "unavailable" distinct from "signed out".

**Most significant weaknesses**

1. **Auth-error classification is implemented six times with different rules** (SRV-02). On the write path a 429 or 500 from Auth is reported as "sign in again", while the read path calls the same condition "unavailable".
2. **Account deletion deletes the user's files before the irreversible step** and does not restore them if that step fails (SRV-01).
3. **The `server-only` rule is documented for every server entry but enforced only for root entries**; two subpath entries are unguarded and one of them has no consumers (SRV-04).
4. **The `SpaceSource` feature port is typed with `server-data`'s snake_case row shapes** and carries two methods nothing calls (SRV-05).
5. **This branch's profile model is half-migrated:** the new `profile_completed_at` column is unused, and `saveName` still writes the setup name into `display_name` (SRV-06).
6. **Documentation drift** in two server READMEs now misdescribes behavior (SRV-10).

None of these is a cross-user data exposure. I found no verified vulnerability.

---

## B. Server package inventory

### `@synapcity/server-auth` (`packages/server/auth`)

|              |                                                                                                                                                                                                                             |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intended     | "The server identity boundary"; conventions table also assigns it "auth operations, verified-caller helpers" (M7).                                                                                                          |
| Actual       | Port + policy only: `IdentityProvider` port, `verifyIdentity` (claims path), `verifyIdentityWithProvider` (fresh path), `isOwner`. ~150 lines. Auth operations went to `server-supabase`; caller helpers stayed in the app. |
| Public API   | `.` (guarded), `./utils` (unguarded, **no consumers**), `./testing` (`fakeIdentityProvider`, **no consumers outside the package**).                                                                                         |
| Dependencies | `domain-identity`, `server-only`. No SDK.                                                                                                                                                                                   |
| Consumers    | `apps/web` `lib/access/caller.ts`, `lib/access/require-owner.ts`, `features/auth/server/session/session.ts`; `server-supabase` (port + `ProviderFailure` type).                                                             |
| Structure    | Kind folders (`types/`, `utils/`, `testing/`) per conventions. Clean.                                                                                                                                                       |
| Tests        | 4 files / 20 tests, all pass.                                                                                                                                                                                               |
| Key findings | SRV-04 (`./utils` duplicate, unguarded), SRV-10 (README claims M7 auth ops land here).                                                                                                                                      |

### `@synapcity/server-supabase` (`packages/server/supabase`)

|              |                                                                                                                                                                                                                                                                                                                                     |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intended     | Vendor adapter; "the only server package importing `@supabase/*`".                                                                                                                                                                                                                                                                  |
| Actual       | Request client factory; `IdentityProvider` implementation; `readClaims` with deadline (`./claims`); `readProviderUser`; `toProviderFailure`; generated `Database` types; **all provider auth operations** (sign-in, OAuth, code exchange, sign-out, registration, recovery, email change, own password reset, account link/unlink). |
| Public API   | `.` (guarded, built from `export *`), `./claims` (unguarded by design, consumed by the proxy).                                                                                                                                                                                                                                      |
| Dependencies | `@supabase/ssr` 0.12.7, `@supabase/supabase-js` 2.117.3, `domain-identity`, `server-auth`.                                                                                                                                                                                                                                          |
| Consumers    | Nearly every app server module; `server-account`; `server-data`; `features-settings/server`; `features-spaces/server`.                                                                                                                                                                                                              |
| Structure    | Capability folders under `src/` (`auth-operations/<group>/`, `claims/`, `request-client/`…). Coherent.                                                                                                                                                                                                                              |
| Tests        | 13 files / 111 tests, all pass. Mocked SDK only.                                                                                                                                                                                                                                                                                    |
| Key findings | SRV-02 (classification duplicated inside this package three ways), SRV-03 (no deadline on `getUser`), SRV-12, SRV-17, owner decision K1 (auth policy inside a vendor adapter).                                                                                                                                                      |

### `@synapcity/server-account` (`packages/server/account`)

|              |                                                                                                                                                                                                                     |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intended     | Account-scoped persistence: preference rows (ADR-0010), profile name/avatar/session mirroring.                                                                                                                      |
| Actual       | Matches. `readAccountPreferenceRow` / `writeAccountPreferenceRow`; `saveName`; `saveAvatar` (+ magic-byte type check, unique paths, orphan cleanup); `removeOldAvatars`; `mirrorToSession`; metadata patch helpers. |
| Public API   | `.` (guarded, `export *` from two capability folders).                                                                                                                                                              |
| Dependencies | `domain-identity`, `domain-preferences`, `server-supabase`.                                                                                                                                                         |
| Consumers    | App `features/account/server/*`, `features/settings/server/actions/preferences-actions.ts`, `app/(auth)/auth/delete-account/actions.ts` (via an app forwarding re-export), `features-settings/server`.              |
| Structure    | Capability folders (`preferences/`, `profile/<unit>/`). Good fit.                                                                                                                                                   |
| Tests        | 6 files / 42 tests, all pass. Stub client; **no database tests**.                                                                                                                                                   |
| Key findings | SRV-06 (profile model drift), SRV-08 (avatar replace race), SRV-11, SRV-17.                                                                                                                                         |

### `@synapcity/server-data` (`packages/server/data`)

|              |                                                                                                                                                                                                                                                     |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intended     | Space, document and dashboard queries, writes and row mapping (ADR-0012/0013/0016).                                                                                                                                                                 |
| Actual       | Matches. Spaces (list/summary/nav/find/relations), participation (list/add), record summaries/find/create/pin/view, dashboard composition load/save. RLS-only scoping (no owner id passed). Private `owned-row` mapping through domain Zod schemas. |
| Public API   | `.` (guarded, explicit named exports). `src/testing/db` is internal (db tests only).                                                                                                                                                                |
| Dependencies | `domain-records`, `domain-spaces`, `server-supabase`, `zod`. Deliberately not `domain-dashboards` (host validates composition).                                                                                                                     |
| Consumers    | `features-spaces/server` (port implementation), app `lib/records/*`, `features/dashboards/server/*`, `lib/demo` (types only).                                                                                                                       |
| Structure    | Module folders (`spaces/`, `records/`, `dashboards/`) with unit folders. Good fit.                                                                                                                                                                  |
| Tests        | 9 unit files / 104 tests pass; plus `*.dbtest.ts` (two-user RLS, concurrency, metadata bounds, avatars storage, compositions) and budgets — **not run in this audit** (they need Docker and mutate a local stack).                                  |
| Key findings | SRV-05, SRV-09, SRV-10 (README drift), SRV-14, SRV-15.                                                                                                                                                                                              |

### Server code outside `packages/server`

| Location                                                                                                       | Role                                                                   | Assessment                                                                                                                             |
| -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web/src/proxy.ts`, `lib/supabase/middleware.ts`                                                          | Session refresh, route gating, outage rewrite                          | Correct host placement. Direct `@supabase/ssr` import is a documented exception (proxy needs request + response cookie wiring).        |
| `lib/supabase/server.ts`, `env.ts`                                                                             | Request-bound client provisioning from `cookies()` + env               | Correct host placement.                                                                                                                |
| `lib/access/*`                                                                                                 | `getCallerIdentity`, `requireOwner`, `requireSignedIn`, fixture mode   | Correct host placement (framework redirects, fixture policy, logging).                                                                 |
| `features/auth/server/session/session.ts`                                                                      | Per-request memoized claims / identity / provider user (`react.cache`) | Correct host placement.                                                                                                                |
| `features/auth/server/actions/actions.ts`                                                                      | 12 auth Server Actions                                                 | Correct as entry points; validation via domain schemas; ops via `server-supabase`.                                                     |
| `features/auth/server/operations/operations.ts`                                                                | `sendAccountDeletionLink`, `deleteOwnAccount`                          | **Misplaced** provider operations with a direct SDK import (SRV-07). Documented as pending M7.5. Contains SRV-01.                      |
| `features/account/server/*`                                                                                    | Caller lookup, logging + wording wrappers, 3 Server Actions            | Correct host role. `save-avatar.ts` re-exports `removeOldAvatars` only so the delete-account action can reach it.                      |
| `features/settings/server/*`                                                                                   | Preference read (cached) + save action                                 | Correct host role; read path has 3 forwarding layers (SRV-16).                                                                         |
| `lib/records/*`, `lib/spaces/*`, `features/{dashboards,documents}/server/*`                                    | Pin/create/view/composition actions, readers                           | Correct host role. Documents/dashboards call `server-data` directly; Spaces go through the `features-spaces` port (expected until M8). |
| `app/(auth)/auth/callback/route.ts`, `app/api/spaces/**/route.ts`, `app/(auth)/auth/delete-account/actions.ts` | Route Handlers / app-level action                                      | Correct host placement.                                                                                                                |
| `packages/features/spaces/src/server`                                                                          | `SpaceSource` port + Supabase implementation                           | Legitimate port (two implementations: Supabase and fixtures). Contract issues in SRV-05.                                               |
| `packages/features/settings/src/server`                                                                        | `loadSettingsAccountPreferences`                                       | Thin wrapper (SRV-16).                                                                                                                 |

---

## C. Ownership and dependency map

```
Browser ──(Server Action / Route Handler / RSC render)──▶ apps/web host
  host: proxy.ts → updateSession → readClaims (server-supabase/claims)      [auth gate, outage rewrite]
  host: lib/supabase/server.createClient()  → server-supabase.createRequestClient
  host: lib/access/getCallerIdentity        → server-auth.verifyIdentityWithProvider
                                               → server-supabase.supabaseIdentityProvider.user()  (getUser)
  host: features/account/server/getCaller   → server-supabase.readProviderUser                    (getUser)
  host: features/auth/server/session        → server-supabase/claims.readClaims → server-auth.verifyIdentity
        │
        ├──▶ features-spaces/server (SpaceSource port) ──▶ server-data ──▶ server-supabase (typed client)
        ├──▶ features-settings/server ──▶ server-account
        ├──▶ server-account ──▶ server-supabase
        ├──▶ server-data    ──▶ server-supabase
        └──▶ server-supabase auth operations ──▶ Supabase Auth
  domain-* (identity, records, spaces, preferences, dashboards) ◀── used by all of the above
  Postgres RLS + column grants + SECURITY DEFINER functions = final authority
```

Dependency direction is correct everywhere I checked: server → domain, adapter → port (`server-supabase` → `server-auth`), features → server, host → everything. There are no cycles (boundary checker R9 passes).

**Where each responsibility actually lives**

| Responsibility                                                                            | Actual home                                                                                                                                                                                                                            |
| ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Application orchestration (validate → verify → operate → map words → revalidate/redirect) | App Server Actions and Route Handlers. Fine.                                                                                                                                                                                           |
| Business operations with provider semantics                                               | `server-supabase` auth operations; `server-account` profile/preferences; two deletion ops in the app.                                                                                                                                  |
| Database queries and persistence                                                          | `server-data`, `server-account` (`user_preferences`, `profiles`), app `operations.ts` (`rpc('delete_own_account')`).                                                                                                                   |
| Supabase integration                                                                      | `server-supabase`; app proxy (documented exception); app `operations.ts` (**undocumented-in-package exception**).                                                                                                                      |
| Authentication                                                                            | `server-supabase` (claims, getUser), `server-auth` (policy), app session/caller helpers (memoization, fixture, logging).                                                                                                               |
| Authorization                                                                             | Route: `requireOwner` / `requireSignedIn` + proxy. Operation: caller verification in each action. Data: RLS, grants, `delete_own_account` AMR check. Feature/frontend: none relied on.                                                 |
| Validation                                                                                | Domain schemas (`signInSchema`, `registrationSchema`, `baseRecordCreateSchema`, `accountPreferencesSchema`, `avatarFileSchema`, `parsePersistableComposition`), invoked in actions; UUID guards repeated in actions and `server-data`. |
| External infrastructure                                                                   | Supabase Storage (`server-account`), Supabase Auth email flows (`server-supabase`).                                                                                                                                                    |

**Unclear or violated boundaries**

- Auth operations are documented as `server-auth`'s scope but live in the vendor adapter (K1).
- A feature port (`SpaceSource`) depends on adapter row types (SRV-05).
- Two provider operations sit in the app with a direct SDK import (SRV-07).
- `ProviderFailure` is defined in `server-auth` but every consumer imports it from `server-supabase` (re-export). That works, but the "real" owner is non-obvious.

---

## D. Package-by-package findings (summary; full detail in F)

- **server-auth:** sound. Remove unused `./utils` entry (SRV-04). `./testing` is unused outside the package but matches the documented convention; keep. README scope statement is stale (SRV-10).
- **server-supabase:** three internal auth-error classifiers plus one in `claims` (SRV-02). `supabaseIdentityProvider.claims()` has no production caller (sessions use `readClaims` + `outcomeFromClaims`), so the port's claims path is exercised only by tests. `changeEmail` / `resendEmailChange` / `registerWithPassword` / `startOAuthSignIn` don't distinguish retryable errors (SRV-12). Root uses `export *` (SRV-17).
- **server-account:** avatar replace race (SRV-08); profile writes predate this branch's model (SRV-06); no db-level tests of `profiles` updates through the package (SQL tests exist in `supabase/tests/profiles.sql`).
- **server-data:** README drift (SRV-10); snake_case relation types exported into a feature contract (SRV-05); `createRecord` inserts the domain create object as-is (SRV-14); commented-out code (SRV-15); no bounded reads (SRV-09).

---

## E. Cross-package and cross-layer findings

1. **Auth-error classification** (SRV-02): `classify-claims.ts`, `supabase-identity-provider.ts`, `provider-user.ts`, `auth-errors.ts`, inline in `account-operations.ts` (unlink), and inline twice in the app's `operations.ts`. These encode different policies for the same SDK errors.
2. **Two "who is the caller" helpers on the write path:** `getCallerIdentity` (via the port) and `getCaller` (via `readProviderUser`). Both call `getUser()`. Having two is justified (profile actions need the provider record), but they classify failures differently today and return different message constants (`SIGN_IN_TO_SAVE` vs `SIGN_IN_AGAIN`). Resolve through SRV-02, not by merging.
3. **Outcome vocabulary:** `ProviderFailure` is carried as `error` in `server-data` / `features-spaces` and as `failure` in `server-account` / `server-supabase` / `server-auth` (SRV-11).
4. **Domain coupling (coordinate with the domain refactor):**
   - `server-data` maps rows through `spaceSchema` / `baseRecordSchema` and inserts `BaseRecordCreate` directly (SRV-14).
   - Relation/participation shape has no domain or feature contract (SRV-05).
   - `needsProfileSetup` reads user-writable `user_metadata`, while this branch adds `profiles.profile_completed_at` (SRV-06).
   - `domain-identity` has two copies of `avatarFileSchema` mid-refactor (observation only).
5. **Spaces vs documents/dashboards orchestration asymmetry:** pins and creates for Spaces go through `features-spaces`' port, documents/dashboards through `apps/web/src/lib/records`. Expected until M8 packages documents/dashboards; not a defect now.

---

## F. Findings register

Severity: Critical / High / Medium / Low. Classification: verified defect / credible risk / architectural concern / optional improvement. "Verified" means confirmed by reading the code paths end to end; none was reproduced against a live database in this audit.

### SRV-01 — Account deletion removes avatar files before the irreversible step, with no recovery when that step fails

- **Severity:** Medium. **Classification:** verified defect (ordering), impact frequency unverified.
- **Files:** `apps/web/src/features/auth/server/operations/operations.ts:103-115`; `apps/web/src/app/(auth)/auth/delete-account/actions.ts:26-30`; `packages/server/account/src/profile/save-avatar/save-avatar.ts:44-56`.
- **Evidence:** `cleanup` (which calls `removeOldAvatars(supabase, userId)`, deleting every file in the user's folder) runs before `rpc('delete_own_account')`. If the RPC returns an error (a `provider-error`, a network failure, or `42501` when the 10-minute AMR window lapses between the app check and the DB check), the outcome is `link-required` / `provider-error`, the account still exists, and `profiles.avatar_url` still points at a file that is gone.
- **Root cause:** cleanup was placed before deletion so the session could still reach the files.
- **Impact:** a person who retries deletion later, or abandons it, has a broken uploaded avatar. Data loss of user content on a failed destructive flow.
- **Correction options:** (a) run cleanup after a successful RPC, if Storage still accepts the not-yet-expired JWT for an `auth.uid()` that no longer exists in `auth.users` (needs verification on a local stack; the existing `avatars-storage.dbtest.ts` is the place); (b) keep the current order but, on RPC failure, clear `profiles.avatar_url` to the provider image so nothing points at a deleted file; (c) accept orphaned files and clean them asynchronously. Recommendation: verify (a); fall back to (b).
- **Consumers:** delete-account page only.
- **Compatibility:** behavior change in an irreversible, security-sensitive flow → owner approval (K3).
- **Verification:** db test: upload avatar → force RPC failure → assert file still exists or `avatar_url` cleared; and the success path still removes files.

### SRV-02 — Auth error classification is duplicated six ways with conflicting rules

- **Severity:** Medium. **Classification:** verified defect (inconsistent semantics).
- **Files:** `packages/server/supabase/src/claims/classify-claims.ts:35-55`; `supabase-identity-provider/supabase-identity-provider.ts:22-26`; `provider-user/provider-user.ts:39-43`; `auth-errors/auth-errors.ts:18-22`; `auth-operations/account-operations/account-operations.ts:65-73`; `apps/web/src/features/auth/server/operations/operations.ts:38-41,93-96`.
- **Evidence:** `readClaims` treats 429, 5xx and code-less errors as `unavailable`. The write-path helpers treat only `AuthRetryableFetchError` (network failure, 502/503/504) as unavailable. A 429 or 500 from `getUser()` therefore becomes `refused` → `verifyIdentityWithProvider` → `signed-out`, so `getCallerIdentity` returns "Sign in again to save your changes" with `signedOut: true`, and `readProviderUser` returns `signed-out`. The same Auth condition shows "unavailable" on pages and "sign in again" on saves.
- **Root cause:** each module was written alongside its operation; the most careful policy (`classify-claims`) was never shared.
- **Impact:** wrong guidance during rate limiting or Auth 500s; the UI may push a still-signed-in person to sign-in. Not a security issue.
- **Correction:** one exported classifier in `server-supabase` (based on `classifyError` in `classify-claims.ts`) returning `signed-out | unavailable | provider-error(code)`, used by `failed()`, `readProviderUser`, `classifyAuthError`, the unlink path, and the app's deletion ops once moved (SRV-07). Keep `ProviderOutcome`'s `unreachable` / `refused` names in the port, mapping unavailable → unreachable.
- **Consumers:** every Server Action that verifies a caller (≈15), profile actions, auth settings actions.
- **Compatibility:** user-facing messaging changes for 429/500 → owner approval (K5). Outcome types unchanged.
- **Verification:** table-driven tests over the SDK error classes (session missing, invalid JWT, 400 with code, 401, 403, 429, 500, retryable fetch, thrown) asserting identical classification for claims and user paths.

### SRV-03 — No deadline on `getUser()` in Server Actions

- **Severity:** Low. **Classification:** credible risk.
- **Files:** `packages/server/supabase/src/provider-user/provider-user.ts:39`; `supabase-identity-provider.ts:42`; compare `claims/classify-claims.ts:72-108`.
- **Evidence:** the claims read deliberately bounds Auth latency at 4 s because the SDK can wait a long time on a dead service. The write-path `getUser()` calls have no bound.
- **Impact:** during an Auth stall, saves may hang until the platform's function timeout instead of answering "try again". Not reproduced; depends on SDK fetch behavior for `getUser`, which I did not verify.
- **Correction:** reuse the same race/deadline helper for `getUser` (map timeout → unavailable). Do it with SRV-02.
- **Verification:** unit test with a never-resolving `getUser` stub.

### SRV-04 — `server-only` guard is enforced only on root entries; subpath entries are unchecked

- **Severity:** Medium. **Classification:** architectural concern (rule/enforcement mismatch) + verified dead entry.
- **Files:** `packages/dev/boundaries/src/rules/server-guard/server-guard.ts:9-22,45-58`; `packages/server/auth/package.json` (`./utils`, `./testing`); `packages/server/auth/src/utils/index.ts`; `packages/server/supabase/src/claims/index.ts`; `docs/architecture/workspace-conventions.md` rule 5.
- **Evidence:** conventions rule 5 says "The file behind every server entry (`server-*` roots and feature `./server`) starts with `import 'server-only'`". R10 collects only `exports['.']` for server packages, so `./claims` and `./utils` are never checked, and R10's second loop actually _forbids_ those files from importing the guard. `./utils` re-exports the same functions as the root and has zero importers. `./claims` is intentionally unguarded per the `server-supabase` README (proxy use).
- **Impact:** today R3 (no server code reachable from browser graphs) still protects these entries, so there is no exposure. The risk is that the documented guarantee is weaker than it reads, and a future subpath is silently unguarded.
- **Correction:** remove the unused `./utils` export (zero consumers; preserve the functions, which stay exported from the root). For `./claims`, either extend R10 to treat every `server-*` export key as an entry and guard `claims/index.ts` (needs a check that `server-only` works in the proxy's runtime), or record it as a named R10 exception. Owner decision K2.
- **Verification:** `pnpm boundaries` plus its R10 probe; `pnpm deps`; proxy smoke test if the guard is added.

### SRV-05 — `SpaceSource` port depends on `server-data` row types and exposes two unconsumed methods

- **Severity:** Medium. **Classification:** architectural concern.
- **Files:** `packages/features/spaces/src/server/types/space-source.ts:3-7,29-46,72-73`; `packages/server/data/src/spaces/space-queries/space-queries.ts:20-62,171-273`; `apps/web/src/lib/demo/space-source/fixture-space-source.ts:3,20-26,53-63`; `packages/features/spaces/src/server/server-space-source/server-space-source.ts:16-19,31-35`.
- **Evidence:** the port (owned by the feature) imports `SpaceNavItem`, `SpaceRelationsResult`, `SpaceRelationType` from the persistence adapter. `SpaceRelationsResult` mixes the camelCase `SpaceEntity` with raw snake_case participation rows (`space_documents[].document_id`, `added_at`). The fixture source in the app must import `server-data` types to implement the port. `listWithRelations` and `getRelations` have **no production callers** (grep across `apps` and `packages`, excluding tests and the two implementations). A type cast is needed in both implementations because the overloads can't be expressed on an arrow.
- **Root cause:** the relations reads were added at the adapter first and surfaced through the port unchanged.
- **Impact:** the port can't change independently of the table shape; any second store must emit Postgres column names; unused surface is carried by two implementations and tests.
- **Correction:** define the participation-link shape where ADR-0013's participation concept lives (a `domain-spaces` type, or `features-spaces/contracts` if only this feature needs it — coordinate with the domain refactor), map rows to it in `server-data`, and have the port reference that type. Do not remove `listWithRelations` / `getRelations` without the owner: they may be groundwork for in-flight work (for example `feat/create-records`). Owner decision K4.
- **Verification:** `pnpm typecheck`, `features-spaces` server tests, `server-data` unit + db tests for relations.

### SRV-06 — Profile writes and completion signal disagree with this branch's new profile model

- **Severity:** Medium (branch-scoped). **Classification:** architectural concern / in-progress drift.
- **Files:** `supabase/migrations/20261111154100_profiles_structured_names.sql:1-41`; `packages/server/account/src/profile/save-name/save-name.ts:27-40`; `profile-metadata/profile-metadata.ts:8-33`; `apps/web/src/features/account/server/actions/setup-actions.ts:53-78`; `packages/server/supabase/src/auth-operations/sign-in-operations/sign-in-operations.ts:76-81`; `packages/domain/identity/src/utils/profile-confirmed/profile-confirmed.ts`.
- **Evidence:** the migration adds `first_name`, `last_name`, `bio`, `profile_completed_at` and states `display_name` is "an optional, user-set override and is not derived". The server still (a) writes the setup form's single `name` into `profiles.display_name` and mirrors it to `user_metadata.full_name`, (b) marks completion only in `user_metadata.profile_confirmed`, and (c) decides the welcome step from that metadata in `exchangeAuthCode`. Nothing reads or writes `profile_completed_at`, `first_name` or `last_name` outside the signup trigger.
- **Note:** `user_metadata` is writable by the user through `auth.updateUser`, so it is acceptable for a UX hint but should not become the authoritative completion record; the new column is the right authority.
- **Impact:** until the next slice lands, a completed setup writes the name to the field the new model says must not be derived, and the database never records completion.
- **Correction:** this is the planned continuation of this branch, implementing decisions already recorded for it. Sequence: `saveName` → structured names; completion → `profile_completed_at` (keep the metadata mirror only if the header still needs it); `needsProfileSetup` → read the profile row (requires a `profiles` read in the callback). Coordinate the domain side with the domain refactor.
- **Verification:** `supabase/tests/profiles.sql`, `server-account` tests, callback route tests, a manual register → confirm → welcome → complete run.

### SRV-07 — Two provider operations live in the app with a direct SDK import

- **Severity:** Low. **Classification:** architectural concern (documented transition).
- **Files:** `apps/web/src/features/auth/server/operations/operations.ts:1-125`.
- **Evidence:** `sendAccountDeletionLink` and `deleteOwnAccount` import `@supabase/supabase-js`, call `createClient()` themselves (not client-first), and `console.warn` directly. Every other provider operation follows the package contract. The file's header says they wait for M7.5.
- **Impact:** the only app module outside the proxy that bypasses the adapter's classification and outcome rules; it hosts SRV-01.
- **Correction:** move `sendAccountDeletionLink` into `server-supabase/auth-operations/` (client-first, reduced outcome). Move `deleteOwnAccount`'s RPC + AMR pre-check into `server-supabase` (or `server-account` if account lifecycle is preferred), with cleanup injected by the host as today; keep logging in the host. `hasRecentLinkSignIn` currently comes from `features-auth/contracts`; a server package cannot import a feature, so that rule must move to `domain-identity` first (coordinate).
- **Verification:** moved unit tests, `pnpm boundaries`, delete-account e2e if available locally.

### SRV-08 — Concurrent avatar replacements can delete the file the profile points to

- **Severity:** Low. **Classification:** credible risk.
- **Files:** `packages/server/account/src/profile/save-avatar/save-avatar.ts:110-127,44-56`.
- **Evidence:** request A uploads `a`, request B uploads `b`; A updates the profile to `a`; B updates it to `b`; A's `removeOldAvatars(keep=a)` deletes `b`. The profile now references a missing file.
- **Impact:** needs two overlapping saves (two tabs, double submit). Broken avatar until the next upload.
- **Correction:** in `removeOldAvatars`, re-read `profiles.avatar_url` and keep the file it references in addition to `keep`, or delete only files older than the one just written.
- **Verification:** db test with two interleaved saves.

### SRV-09 — Every protected page reads all records of three kinds to show eight of each; sidebar failures are not logged

- **Severity:** Low (now). **Classification:** credible risk (scalability) + verified gap (logging).
- **Files:** `apps/web/src/lib/sidebar-records/get-sidebar-records.ts:11-36`; `latest-records.ts:15,46`; `apps/web/src/app/(protected)/layout.tsx:25`; `server-data` list functions (no `limit` anywhere).
- **Evidence:** the protected layout calls `listSpaceSummaries`, `listRecordSummaries('documents')`, `listRecordSummaries('dashboards')` (each with an embedded participation count), then keeps `SIDEBAR_RECORD_LIMIT = 8`. `settled()` turns a rejection into `[]` with no `logFailure`. `getDashboardLinkItems` also reads full lists.
- **Impact:** cost grows linearly with a user's record count on every navigation; a failing sidebar read is invisible in logs.
- **Correction:** add bounded "latest N" reads in `server-data` ordered the way `latestRecords` sorts (pinned, then recency), used by the sidebar; log rejected sidebar reads by code. Pagination for index pages can wait for a demonstrated need.
- **Verification:** unit tests for ordering parity with `latestRecords`; db budget test if desired.

### SRV-10 — Server READMEs misdescribe current behavior

- **Severity:** Low. **Classification:** verified defect (documentation).
- **Files:** `packages/server/data/README.md:23-24` (says `loadComposition` returns `null` when none was saved and that `saveComposition` revision 0 inserts; the code throws on a missing row and rejects revisions below 1); the README's export table omits `listSpaceNavItems`, `listSpacesWithRelations`, `getSpaceRelations`, `addSpaceDocument`, `addSpaceDashboard`, `COMPOSITION_SCHEMA_VERSION`; `packages/server/auth/README.md:3` ("Milestone 7 adds auth operations and verified-caller helpers here", which did not happen).
- **Impact:** these READMEs are the contract other agents read; drift leads to wrong code.
- **Correction:** update both READMEs to match code; resolve K1 first for the `server-auth` scope sentence.

### SRV-11 — Same failure value named `error` in some packages and `failure` in others

- **Severity:** Low. **Classification:** optional improvement.
- **Files:** `server-data` outcomes (`records.ts:35-36,134-135,174`, `space-participation.ts:79`, `dashboard-compositions.ts:31-34`), `features-spaces` `space-source.ts:15-22,49-50` vs `server-account` / `server-supabase` / `server-auth` (`failure`).
- **Correction:** converge on `failure: ProviderFailure` when these files are next touched. Keep `ok` for binary outcomes and `kind` for multi-outcome provider operations; that split is legitimate.

### SRV-12 — Several auth operations report a retryable outage as a provider error

- **Severity:** Low. **Classification:** verified defect (minor).
- **Files:** `password-operations.ts:21-22,67,112,150`; `registration-operations.ts:49`; `sign-in-operations.ts:32,51-52`.
- **Impact:** an outage shows the generic provider message rather than "try again". Folded into SRV-02's single classifier.

### SRV-13 — Auth settings actions use the display-only `getCurrentUser` as their signed-in check

- **Severity:** Low. **Classification:** architectural concern.
- **Files:** `apps/web/src/features/auth/server/actions/actions.ts:320-324,420-421,465-466,553-554`; `session.ts:76-84` ("Never authorize with it").
- **Evidence:** the actual authorization is the provider call on the session, so this is not a hole. But an Auth outage makes `getCurrentUser()` null and the action answers "signed out".
- **Correction:** use `getVerifiedIdentity()` (tri-state) where only the id is needed.

### SRV-14 — `createRecord` inserts the domain create object directly

- **Severity:** Low. **Classification:** credible risk (coupling).
- **Files:** `packages/server/data/src/records/records.ts:144-158`.
- **Evidence:** `.insert(input)` relies on `BaseRecordCreate` field names equalling column names. TypeScript's excess-property check doesn't apply to a non-literal, so a future non-column field on the create contract would pass type-checking and fail at runtime.
- **Correction:** map explicitly (`{ name, description, icon, tags }`) in `server-data`. Coordinate with the domain refactor.

### SRV-15 — Commented-out code in server modules

- **Severity:** Low. **Classification:** optional improvement.
- **Files:** `packages/server/data/src/spaces/space-writes/space-writes.ts:32-46`; `packages/features/spaces/src/server/server-space-source/server-space-source.ts:16-19,42`.
- **Correction:** delete when touched; the functionality exists as `addSpaceDocument` / `addSpaceDashboard`.

### SRV-16 — Settings preference read passes through three forwarding layers

- **Severity:** Low. **Classification:** optional improvement.
- **Files:** `apps/web/src/features/settings/server/account-preferences.ts:15-37`; `packages/features/settings/src/server/account-preferences/account-preferences.ts:9-20`.
- **Evidence:** `getAccountPreferences` → `loadAccountPreferences` → `loadSettingsAccountPreferences` → `readAccountPreferenceRow`; the middle two only convert a failure into `undefined` plus a callback.
- **Correction:** none required. ADR-0014 assigns feature server composition to the feature, so this is defensible. Collapse only if the feature layer stays a pass-through after M7.

### SRV-17 — `export *` roots widen the public API silently

- **Severity:** Low. **Classification:** optional improvement.
- **Files:** `packages/server/supabase/src/index.ts:20-22`; `packages/server/account/src/index.ts:3-4` (and their capability indexes).
- **Evidence:** helpers such as `detectImageType`, `extensionFor`, `withFullName`, `removeOldAvatars` and every operation type are public by default. `server-data` already lists exports explicitly; the new domain convention requires it.
- **Correction:** adopt explicit root exports for server packages (see H).

### SRV-18 — Proxy duplicates the request-client cookie wiring

- **Severity:** none. **Classification:** recorded, no action.
- **Files:** `apps/web/src/lib/supabase/middleware.ts:36-57`.
- Documented exception; the proxy needs request + response cookie writes that `createRequestClient` doesn't model. Revisit only if `createRequestClient` gains a response sink.

---

## G. Proposed ownership model

| Capability                                                                    | Domain policy                                                                                     | Application orchestration                                          | Infrastructure adapter                                       | Persistence                                     | Framework entry point            |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------ | ----------------------------------------------- | -------------------------------- |
| Session / identity                                                            | `IdentityResult`, `hasRecentLinkSignIn` (move from `features-auth/contracts`), profile-setup rule | app `session.ts`, `lib/access/*`                                   | `server-supabase` (claims, getUser, one error classifier)    | —                                               | proxy, page guards               |
| Identity policy (verified vs signed-out, ownership)                           | —                                                                                                 | —                                                                  | `server-auth` (port + policy)                                | —                                               | —                                |
| Auth flows (register, sign-in, recovery, email change, link/unlink, deletion) | input schemas, enumeration policy (as documented rules)                                           | app auth actions (words, redirects, revalidation)                  | `server-supabase/auth-operations` (incl. moved deletion ops) | `delete_own_account()`                          | Server Actions, `/auth/callback` |
| Profile (names, avatar, completion)                                           | name/avatar rules, completion rule                                                                | app account actions                                                | —                                                            | `server-account` (`profiles`, Storage)          | Server Actions                   |
| Preferences                                                                   | `domain-preferences`                                                                              | app settings action, `features-settings/server`                    | —                                                            | `server-account`                                | Server Action, layout read       |
| Spaces                                                                        | `domain-spaces` (+ participation link type, K4)                                                   | `features-spaces/server` port; app actions                         | —                                                            | `server-data/spaces`                            | Server Actions, `/api/spaces`    |
| Documents / dashboards                                                        | `domain-records`, `domain-dashboards`                                                             | app `lib/records`, `features/*/server` (until M8 feature packages) | —                                                            | `server-data/records`, `server-data/dashboards` | Server Actions, pages            |

No new package is justified by the evidence. Every change above moves code into an existing owner.

---

## H. Recommended server-package convention

**Universal (all `server-*` packages)**

1. One `src/index.ts` root that starts with `import 'server-only'` and names every public export explicitly (no `export *`).
2. Subpath entries only when a consumer needs a narrower or differently-guarded surface; each is either guarded or a named boundary exception (K2). `./testing` for fakes, as today.
3. Functions take the request client (or a port) first; they never read cookies, headers, env or fixture mode, never log, never call `next/*`.
4. Outcomes: `ok`-discriminated for binary results, `kind`-discriminated for multi-outcome operations; a provider failure is always `failure: ProviderFailure`. Reads a page needs may throw `readError` (code-only message), as `server-data` documents.
5. Tests beside units (`*.test.ts`); database tests beside the unit they cover (`*.dbtest.ts`) with the shared harness under `src/testing/`.
6. The README export table is part of the contract and changes in the same commit as the export.

**Package-specific (keep the legitimate variation)**

- **Adapter (`server-supabase`):** folders by provider capability (`request-client/`, `claims/`, `auth-operations/<flow>/`, a single `auth-errors/` classifier). Only package importing `@supabase/*`.
- **Port/policy (`server-auth`):** small kind folders (`types/`, `utils/`, `testing/`) are fine at this size.
- **Persistence (`server-data`):** folders by resource module (`spaces/`, `records/`, `dashboards/`), private row mapping (`owned-row/`), no `utils/` bucket.
- **Capability (`server-account`):** folders by capability (`profile/`, `preferences/`).

Do not reshape `server-data` or `server-account` into kind folders; module/capability grouping already matches their responsibilities. The only structural moves recommended are SRV-07's, illustrated here:

```
packages/server/supabase/src/
  auth-errors/                     # the one classifier (SRV-02)
  auth-operations/
    account-deletion-operations/   # sendAccountDeletionLink, deleteOwnAccount (moved from apps/web)
    …existing groups
```

---

## I. Test and verification gaps

**Ran in this audit (all passed)**

| Command                                                                                                                                                           | Result                                    |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `npx vitest run` in each of `packages/server/{auth,supabase,account,data}`                                                                                        | 4/20, 13/111, 6/42, 9/104 (files/tests)   |
| `npx tsc --noEmit` in each server package                                                                                                                         | exit 0 ×4                                 |
| `npx eslint . --max-warnings 0` (no cache) in each server package                                                                                                 | exit 0 ×4                                 |
| `pnpm boundaries`                                                                                                                                                 | 2,209 files, 39 workspaces, no violations |
| `pnpm deps` (Knip)                                                                                                                                                | exit 0                                    |
| `npx vitest run` over app server dirs (`lib/access`, `lib/records`, `lib/spaces`, `lib/supabase`, `features/{auth,account,settings,dashboards,documents}/server`) | 30 files / 418 tests                      |
| `npx vitest run src/server` in `packages/features/spaces`                                                                                                         | 2 files / 22 tests                        |

**Not run:** `pnpm verify`, `pnpm build`, `pnpm format:check`, `pnpm test:e2e`, `pnpm test:storybook`, `pnpm db:test`, `server-data test:db` / `test:db:budgets` (Docker + local stack mutation, outside a read-only audit), route-handler tests under `apps/web/src/app/api` (not checked whether they exist). Passing boundary checks do not prove the architecture correct (see SRV-04).

**Gaps**

1. No test of account deletion's failure path with files present (SRV-01).
2. No cross-path classification test (claims vs `getUser` vs `readProviderUser` vs `classifyAuthError`) (SRV-02).
3. No timeout test for `getUser`-based caller checks (SRV-03).
4. No concurrency test for avatar replacement (SRV-08).
5. `server-account` has no database tests; profile column grants and RLS are covered only in `supabase/tests/profiles.sql`, not through the package's actual queries.
6. All Server Action tests mock Supabase; RLS through real actions is only covered where e2e specs exist and run (e2e skips some specs when CI lacks preconditions).
7. `supabaseIdentityProvider().claims()` is tested but has no production caller; its tests give a false sense of coverage for the claims path, which really runs through `readClaims`.

---

## J. Prioritized remediation roadmap

**Phase 1 — Correctness and security defects**

- SRV-01 deletion ordering (after K3), SRV-02 + SRV-12 single classifier (after K5), SRV-03 deadline.
- Affected: `server-supabase`, app `operations.ts`, delete-account action. Conflicts: none with the domain refactor except `hasRecentLinkSignIn`. Verify: new classification table tests, deletion db test, app action tests, `pnpm verify`.

**Phase 2 — Ownership and dependency boundaries**

- SRV-07 move deletion ops into `server-supabase` (needs `hasRecentLinkSignIn` in domain first: coordinate). SRV-05 participation-link contract (after K4; coordinate with `domain-spaces`). SRV-06 profile model alignment (this branch's next slice).
- Verify: `pnpm boundaries`, `pnpm typecheck`, db tests for relations and profiles, manual auth walk-through.

**Phase 3 — Public API and contracts**

- SRV-04 remove `server-auth/./utils`; implement K2 for `./claims`. SRV-17 explicit root exports. SRV-14 explicit insert mapping. SRV-11 `failure` naming.
- Verify: `pnpm deps`, `pnpm boundaries` (+ R10 probe), consumers' type checks.

**Phase 4 — Duplication and unnecessary complexity**

- SRV-13 tri-state identity in auth actions; SRV-15 dead code; SRV-16 only if still a pass-through after M7.

**Phase 5 — Structure, docs and test colocation**

- SRV-10 README corrections (after K1). Add the gap tests from I.

**Phase 6 — Optional**

- SRV-09 bounded sidebar reads + logging; revisit SRV-18 if the request client gains a response sink.

---

## K. Decisions requiring owner approval

**K1. Where auth operations belong.** Docs assign them to `server-auth`; code puts them in `server-supabase`.

- Recommendation: keep them in `server-supabase` and amend the conventions table and `server-auth` README. Each operation is one SDK call plus reduction; a `server-auth` port mirroring Supabase Auth would have one implementation and add no protection.
- Alternative: define provider-neutral auth ports in `server-auth`. Benefit: auth policy (enumeration hiding, last-sign-in rule) leaves the vendor adapter. Cost: a speculative abstraction today.

**K2. `server-only` on subpath entries (`./claims`).**

- Recommendation: add a named R10 exception for `server-supabase/claims` now (documents the deliberate choice, keeps the list-only-shrinks discipline), and remove the unused `server-auth/./utils`.
- Alternative: extend R10 to every server export key and guard `claims/index.ts`. Requires verifying `server-only` in the Next 16 proxy runtime; stronger guarantee.

**K3. Account-deletion cleanup order.** Options (a) cleanup after successful RPC, (b) keep order and repair `avatar_url` on failure, (c) async cleanup. Recommendation: verify (a) on a local stack; otherwise (b). Irreversible, security-sensitive flow.

**K4. Participation-link contract and the two unconsumed `SpaceSource` methods.**

- Recommendation: put the link shape in `domain-spaces` (it's ADR-0013 concept vocabulary, needed by server, feature and fixtures), map rows in `server-data`, and keep the two methods only if planned work needs them. Coordinate with the domain refactor.
- Alternative: `features-spaces/contracts` if no other feature will read participation.

**K5. Classification of Auth 429 / 500 on the write path.** Recommendation: treat them as `unavailable` ("try again"), matching `readClaims`. This changes user-facing failure semantics under ADR-0006/0008, so it needs approval.
