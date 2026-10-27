# Web Supabase Leftovers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Status:** Approved (owner, 2026-10-27), not started. The owner accepted every recommendation of the spec's first review: both halves proceed, D1 option (b), D2 and D3 as amended, E1, E2 and E4 to E7 adopted, E3 deferred. Reviewed four times on 2026-10-27 (spec sections 7 to 10); the fourth review's changes were approved. Task 1 can stop the session-refresh half (Tasks 3 and the proxy parts of 6); the deletion half does not depend on it.

**Sequencing (2026-10-27):** the [Supabase review fixes plan](2026-10-27-supabase-review-fixes.md) runs first, because this plan had not started. Rebase onto it before starting: it adds `toProviderFailure`, `classifyAuthError` and six more `auth-operations`, moves `logFailure` to `apps/web/src/lib/log-failure/` and `getCallerIdentity` to `apps/web/src/lib/access/caller.ts`, and changes `identity-boundary.test.ts`. Follow-up F1 is done there.

**Goal:** Move session refresh and the two account-deletion operations from `apps/web` into `@synapcity/server-supabase`, leaving the app with cookie, header, environment and routing wiring only. Add guards for the database rule and the provider pins. The only behaviour change is one added log line (E6).

**Governing:** [Web Supabase leftovers design](../specs/2026-10-27-web-supabase-leftovers-design.md), [ADR-0014](../../architecture/decisions/0014-multi-app-package-boundaries.md) (matrix), [ADR-0006](../../architecture/decisions/0006-authentication-with-supabase.md) (sessions, `getClaims`), [ADR-0008](../../architecture/decisions/0008-auth-actions-and-server-operations.md) (account deletion), [ownership map](../../architecture/reorganization-ownership-map.md) rows `proxy.ts`, `lib/supabase`, `auth`.

## Global Constraints

- Session, redirect and deletion behaviour must not change, except the E6 log line. Tests that pin current behaviour come first. After each move their assertions pass unchanged; only the stub seams change, as each task says.
- `server-supabase` imports no `next/*` and no feature package. Every new entry file keeps `import 'server-only'` behind the root entry (R10).
- Never run a real account deletion except on a throwaway account. The live check (Task 7) is read-only: no `apply_migration`, and only `select` statements.
- The applied migration `20261017140000_delete_own_account.sql` is not edited.
- Branch: create `refactor/web-supabase-leftovers` from `main` and bring these documents with it. Do not implement on `feat-tokens-package`, the worktree they were written in.
- Each task's checks also include `pnpm format:check`. Checkpoint commits per task stay local until pushing is authorized.
- Order: Task 1 gates Task 3 and the proxy half of Task 6. Task 4 needs Task 2, and Task 5 needs Tasks 2 and 4. Tasks 2 and 3 are independent and may run in parallel.
- Process: a task scope entry in `.agents/task-scope.md` before Task 1; commits and pushes only when authorized.

## Tasks

### Task 1: Prove `server-supabase` loads in the proxy (spike, thrown away)

- [ ] **Step 1:** In a scratch branch, make `src/proxy.ts` import a `server-supabase` export and use it at run time (for example, log `typeof createRequestClient` once), so the bundler cannot drop the import.
- [ ] **Step 2:** With `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` set (the CI placeholders are enough), run a fresh `pnpm --filter web build` with the default bundler, and note which bundler it used. Then run `pnpm --filter web test:e2e`, which serves a production build. `spaces.e2e.ts` ("sends a signed-out visitor … to sign in and back") is the named evidence: it fails if the proxy cannot load. It does not prove the proxy made the redirect. Under `next start`, request `/`, a protected path and `/auth/login`. Confirm there is no `server-only` error at build time or in the server log.
- [ ] **Step 3:** Record in spec section 2 the result, the bundler, and the proxy bundle size before and after (the middleware output under `.next/server/`), for spec 4.8. Then discard the branch. If it fails, stop the session-refresh half and report. The options are a separate `./proxy` entry without `server-only`, or keeping session refresh in the app; the owner decides. Tasks 2, 4, 5 and 7 can continue either way. In Task 6, `apps/web` then keeps `@supabase/ssr`, and the README pin rule names all three manifests.

### Task 2: Move the recent-link rule to `domain-identity` (D1, option b)

- [ ] **Step 1:** `git mv` `packages/features/auth/src/contracts/utils/recent-link-sign-in/` (source and tests) to `packages/domain/identity/src/utils/recent-link-sign-in/`. Export `LINK_SIGN_IN_METHODS` (private today). Add the unit to `utils/index.ts`, and name the four exports in the root `index.ts`, which lists its exports explicitly. The moved file's comment names the `delete_own_account` migration as the database counterpart.
- [ ] **Step 2:** Re-point the three importers to `@synapcity/domain-identity`: `apps/web/src/app/auth/delete-account/page.tsx`, `apps/web/src/features/auth/server/operations/operations.ts`, and `packages/features/auth/src/frontend/components/delete-account/delete-account.tsx` (it imports `LINK_SIGN_IN_WINDOW_MINUTES` from `../../../contracts`). Remove the unit from the `features-auth` contracts barrel; keep no re-export. Confirm with a search that nothing else imports the three names from `features-auth`.
- [ ] **Step 3:** Update the `domain-identity` and `features-auth` READMEs.
- [ ] **Step 4:** Checks for both packages and web (tests, lint, types), `pnpm boundaries`, `pnpm deps`.

### Task 3: Session refresh (D2, E2)

- [ ] **Step 1: Pin behaviour.** `middleware.test.ts` already covers: the refreshed cookie and cache headers on the plain response and on both redirects; `next` with its query on the sign-in redirect; no cache headers without a cookie write; fixture bypass; production with the fixture flag set. Add these cases:
  - the forwarded request carries the refreshed cookie (what Server Components read);
  - a signed-in guest-only path with a safe `next` goes there;
  - an unsafe `next` falls back to home;
  - the origin assertion refuses a cross-origin destination. This needs `../routing/safe-next` stubbed, because the real helper never returns one.

  All green against the current code.

- [ ] **Step 2: Failing test** in `server-supabase` for `refreshProxySession`, with `@supabase/ssr` stubbed:
  - `getClaims` is the first call on the new client;
  - claims give `{ kind: 'user', userId }`, no session gives `none`, an `AuthRetryableFetchError` gives `unreachable`, and another auth error gives `refused`;
  - an error that is not an auth error propagates;
  - the host's `getAll` is passed through, and cookie writes and headers reach `setAll`;
  - `refreshProxySession` and `ProxyCookies` are exported from the root entry.
- [ ] **Step 2b:** Extract a non-exported factory from `request-client.ts` over `{ getAll, setAll }`. `createRequestClient` adapts its `set` through it and still ignores Server Component write failures. Its existing tests pass unchanged.
- [ ] **Step 3:** Implement `src/proxy-session/` on that factory: define `ProxyCookies` from `@supabase/ssr`'s `SetAllCookies` and `CookieOptions` types, create the client over it, then `return supabaseIdentityProvider(client).claims()`. Export both names from `src/index.ts`.
- [ ] **Step 4:** `middleware.ts` calls `refreshProxySession`, types its callback with `ProxyCookies`, and reads `outcome.kind === 'user' ? outcome.userId : null`. Re-seam `middleware.test.ts`: stub `@synapcity/server-supabase`'s `refreshProxySession` instead of `@supabase/ssr`, calling the supplied `setAll` to play a refresh and returning a `ProviderOutcome`. The `clients` counter used by the two fixture-mode tests counts calls to the stub instead of `createServerClient`. No assertion changes. The SDK stub would keep working only while `apps/web` still declares `@supabase/ssr`, then fail in Task 6.
- [ ] **Step 4b:** `git mv` `lib/supabase/middleware.ts` and its test to `proxy-session.ts` and `proxy-session.test.ts`; keep `updateSession`. Update the import in `proxy.ts`, `architecture.test.ts` (`ALWAYS_SERVER_ONLY`), the ratchet entry in `identity-boundary.test.ts`, and `packages/dev/boundaries/src/rules/reachability/reachability.ts`.
- [ ] **Step 5:** Checks: web and package tests, lint, types, `pnpm boundaries`.

### Task 4: Account deletion (D3, E1, E6)

- [ ] **Step 1: Pin behaviour.** Confirm the 12 `operations.test.ts` tests (14 cases) cover:
  - every outcome kind of both operations;
  - the typed-email comparison and `shouldCreateUser: false`;
  - the deletion order and the `42501` mapping;
  - that cleanup and sign-out failures do not stop deletion.

  Add two cases: a cleanup failure followed by a database failure, which still warns today; and assertions on the two warning lines. All green against the current code.

- [ ] **Step 2:** Move the operations and their tests to `packages/server/supabase/src/account-deletion/`, with the client as first argument and `cleanup` typed `(client: SupabaseServerClient, userId: string) => Promise<void>`. The moved tests pass a stub client instead of mocking `@/lib/supabase/server`. Then make the changes:
  - `sendAccountDeletionLink` reads the user with `readProviderUser` and returns its `signed-out` or `unavailable` kind (E1);
  - `deleteOwnAccount` checks freshness with `hasRecentLinkSignInNow`;
  - `deleteOwnAccount` returns `cleanupFailed` and `signOutFailed` flags, present only when true, instead of calling `console.warn`;
  - `signOutFailed` is also set when `signOut` resolves with an error (E6), with a new test for it.

  Assertions stay, except that the warning assertions become flag assertions. Export the operations and their outcome types (`DeletionLinkOutcome`, `AccountDeletionOutcome`) from `src/index.ts`. Nothing outside `operations.ts` imports the types today (checked 2026-10-27).

- [ ] **Step 3:** No wrapper (spec D3). Remove `apps/web/src/features/auth/server/operations/`; its code and tests moved in Step 2. Then re-point the callers and tests:
  - `requestAccountDeletion` calls `sendAccountDeletionLink(await createClient(), …)` from `@synapcity/server-supabase`;
  - `confirmAccountDeletion` calls `deleteOwnAccount(await createClient(), { cleanup })` and logs each flag with today's exact line;
  - `app/auth/delete-account/actions.test.ts` mocks the package's `deleteOwnAccount` and `createClient`, expects `(client, { cleanup })`, and gains the two flag-logging cases;
  - `features/auth/server/actions/actions.test.ts` keeps its `@/lib/supabase/server` mock, and its deletion-link cases now run the package code against it.

  _Superseded (fourth review): "`operations.ts` becomes a wrapper …" with wrapper tests._

- [ ] **Step 4:** Checks as in Task 3, plus the `delete-account` page and actions tests.

### Task 5: Guards (E4, E5)

- [ ] **Step 0:** Add `@types/node` 26.6.5 to `server-supabase`'s dev dependencies, as `frontend-shells` and `frontend-forms` do, because the next two tests read files.
- [ ] **Step 1:** `packages/server/supabase/src/account-deletion/database-parity.test.ts`: find the newest migration that defines `public.delete_own_account`, and assert that its window equals `LINK_SIGN_IN_WINDOW_MINUTES * 60` and its method list equals `LINK_SIGN_IN_METHODS` (spec 4.4). Prove it fails by changing the expected value locally once, then restore it.
- [ ] **Step 2:** `packages/server/supabase/src/provider-versions.test.ts`: every workspace manifest's declarations of `@supabase/ssr` and `@supabase/supabase-js` share one exact version (spec 4.5). Prove it fails the same way.
- [ ] **Step 2b:** Add `packages/server/supabase/turbo.json` with the `test` and `test:coverage` inputs in spec 4.7. Prove it works: change a migration's whitespace, confirm `pnpm turbo run test --filter=@synapcity/server-supabase` reports a cache miss, then restore the file.
- [ ] **Step 3:** `supabase/tests/delete-own-account.sql`, in the style of `spaces.sql`: a header with how to run it, one transaction rolled back, a savepoint per case, and the cases in spec 4.4. Run it on a disposable local database if one is available; otherwise report it as not run.
- [ ] **Step 4:** Checks: package tests, lint, types, `pnpm deps`.

### Task 6: Dependencies and state records

- [ ] **Step 1:** Remove `@supabase/ssr` from `apps/web` dependencies; move `@supabase/supabase-js` to `devDependencies`. Run `pnpm install`, then `pnpm deps` (Knip) to confirm nothing else needs them. Then run the web tests, type check and build again: a test still stubbing a removed SDK package fails here.
- [ ] **Step 2:** Amend the state records, marking replaced text Superseded with the date (spec 4.3):
  - the ownership map rows `proxy.ts`, `lib/supabase` and `auth`;
  - `server-supabase/README.md`: the `Owns:` line, the sentence that session refresh stays in the web host, the pin rule (now naming `frontend-supabase` and the pin test), and the public-interface table (`refreshProxySession`, `ProxyCookies`, the deletion operations, and the already-exported `SupabaseServerClient`).

  - `packages/server/README.md`: its "Current inputs" link to the removed `operations.ts`;
  - `apps/web/README.md`: the renamed proxy file.

  The decision records were amended on 2026-10-27.

### Task 7: Verify

- [ ] `pnpm verify` (it includes the e2e smoke test, which exercises the proxy).
- [ ] The read-only live check, against the project the owner names (spec 4.6), through the Supabase connector:
  - `get_advisors` for security and for performance;
  - the JWT signing mode: the project's `/auth/v1/.well-known/jwks.json` and a real access token's `alg` and `kid` (spec 4.6). Report `HS*` to the owner as follow-up F3;
  - `list_migrations` (it may not list migrations applied by hand in the dashboard);
  - `select` queries on `pg_proc` and `information_schema.routine_privileges` for `delete_own_account`, compared with the migration.

  Report differences; change nothing.

- [ ] Manual checks against a real Supabase project, per spec section 5.
- [ ] Report what ran, passed, failed and was not run, including whether the SQL script was run.

## Archived wording

Kept for the record; replaced on 2026-10-27.

- Status before approval: Proposed. Requested by the owner on 2026-10-27; waits on approval of decisions D1 to D3 in the spec, and on whether to proceed with the session-refresh half at all (spec section 1.1). Reviewed on 2026-10-27 (spec section 7); corrections below keep the replaced wording, marked Superseded.
- Global constraints before approval: Session, redirect and deletion behaviour must not change. Tests that pin current behaviour come first and must pass unchanged after each move. `server-supabase` imports no `next/*` and no feature package. Never run a real account deletion except on a throwaway account. Process: a task scope entry in `.agents/task-scope.md` before Task 1; commits and pushes only when authorized.
- Replaced by the first review:
- "In a scratch branch, import any `server-supabase` export from `src/proxy.ts`."
- "Fresh `pnpm --filter web build` and `next start`; request a page and confirm the proxy runs without a `server-only` error."
- "`git mv` `recent-link-sign-in/` (source and tests) from `features-auth/src/contracts/utils/` to `domain-identity`; export it."
- "`features-auth/contracts` re-exports the three names; its existing tests pass unchanged."
- "Extend `middleware.test.ts` until it covers: fixture bypass; signed-out protected path redirects with `next` including the query; signed-in guest-only path redirects to a safe `next` or home; cross-origin `next` is refused; cookies and cache headers are on the plain response and on both redirects. Green against the current code."
- "`middleware.ts` calls `refreshProxySession`; Step 1 tests pass unchanged."
- "Confirm the 11 `operations.test.ts` cases cover … Add any missing case, green against the current code."
- "Update the ownership map rows `proxy.ts`, `lib/supabase` and `auth`, and `server-supabase/README.md`'s `Owns:` line."
- Replaced on approval: Task 2 Step 2 offered options (a) re-export and (b) re-point. The owner chose (b).
