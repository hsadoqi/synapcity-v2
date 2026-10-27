# Web Supabase Leftovers

**Status:** Approved (owner, 2026-10-27). The owner asked on 2026-10-27 for the remaining Supabase SDK use in `apps/web` to move to `@synapcity/server-supabase`, then accepted every recommendation of the first review: both halves proceed, D1 option (b), D2 and D3 as amended, enhancements E1, E2 and E4 to E7 folded into the design, and E3 recorded as a later, separate decision (section 3.1). Reviewed four times on 2026-10-27 (sections 7 to 10). After the fourth review the owner approved six more changes: the web wrapper is dropped (D3), and five smaller items are folded in. Not implemented. Plan Task 1 can still stop the session-refresh half. _Superseded: "Proposed. … decisions D1 to D3 below need approval. Reviewed on 2026-10-27 (section 7): errors corrected in place with the replaced wording kept and marked Superseded; enhancements E1 to E7 wait on the owner."_  
**Date:** 2026-10-27  
**Requested by:** Repository owner  
**Branch:** implementation goes on a new `refactor/web-supabase-leftovers` branch from `main`, carrying these documents. It does not go on `feat-tokens-package`, the worktree they were written in, which holds unrelated token work (section 9).  
**Scope:** Move the two places where `apps/web` still calls the Supabase SDK directly into `server-supabase`, so the app only binds cookies, headers and environment values. No change to session, redirect, deletion or database behaviour, with one deliberate addition: a warning is logged when signing out after a deletion reports an error (E6). New tests guard the database rule's parity with the TypeScript rule and the provider version pins (E4, E5).

## 1. Current state

The ownership map (row `lib/supabase`) says cookie, header and environment binding stays with web and backend SDK operations go to server. `server-supabase`'s README says it is the only server package that imports `@supabase/*`.

Already in line:

| File                                  | Role                                                                        |
| ------------------------------------- | --------------------------------------------------------------------------- |
| `apps/web/src/lib/supabase/client.ts` | passes environment values to `frontend-supabase`                            |
| `apps/web/src/lib/supabase/server.ts` | passes Next.js cookies to `server-supabase` `createRequestClient`           |
| `apps/web/src/lib/supabase/env.ts`    | reads `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |

Not in line:

1. **`apps/web/src/lib/supabase/middleware.ts`** (`updateSession`, called by `src/proxy.ts`) imports `createServerClient` from `@supabase/ssr`, builds a client over the request and response cookies, calls `auth.getClaims()`, then applies route policy: protected paths redirect to `/auth/login?next=…`, guest-only paths redirect a signed-in user to a safe `next` or home, and every response (redirects included) carries the session cookies and the SDK's cache headers. Fixture mode skips it. 6 tests.
2. **`apps/web/src/features/auth/server/operations/operations.ts`** holds `sendAccountDeletionLink` and `deleteOwnAccount` (ADR-0008). They import `isAuthRetryableFetchError` from `@supabase/supabase-js`, create their own request client, and use `hasRecentLinkSignIn` from `@synapcity/features-auth/contracts`. The file's comment says they stay "until the delete-account flow moves with `features-auth` (M7.5)"; M7 has closed, so the move is overdue. 12 tests (14 cases as Vitest counts them: one `it.each` has three rows). _Superseded (review, 2026-10-27): "11 tests"._

Because of these two files, `apps/web/package.json` lists `@supabase/ssr` and `@supabase/supabase-js` as runtime dependencies. Tests elsewhere in web import `AuthApiError` and `AuthRetryableFetchError` from `@supabase/supabase-js` as fixtures, and `architecture.test.ts` has an `@supabase/ssr` import string as test input.

### 1.1 Recorded decisions this reverses

Both moves were considered before and decided the other way. Each decision left room to revisit, and there are new reasons, but the reversal has to be explicit and the records amended (section 4.3).

| Decision                                                  | Where recorded                                                    | What it said                                                                                                                                                                                                                                 | Why revisit now                                                                                                                                                                                             |
| --------------------------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M7.2 Task B (owner, 2026-10-24)                           | M7.2 plan Task B; M7 design status line; `server-supabase` README | Session refresh stays in `lib/supabase/middleware.ts`: the portable part is about five lines, and a `server-only` import from the proxy is NOT VERIFIED. "Revisit only if the end-to-end suite is run with the proxy importing the package." | The owner asked on 2026-10-27, and plan Task 1 is that end-to-end run. The gain is that `apps/web` stops declaring `@supabase/ssr` and the create-then-`getClaims` rule is owned and tested in the package. |
| Q5, amended by M7.5 C7 (owner, 2026-10-24 and 2026-10-25) | M7 design section 9; M7.5 plan                                    | The recent-link check stays a pure helper in `features-auth/contracts`; "revisit if another feature needs it".                                                                                                                               | The new consumer is a server package, which ADR-0014's matrix forbids from importing feature contracts. `VerifiedIdentity` stays unwidened, which was the point of Q5.                                      |

Whether the session-refresh half is worth it is the owner's call: it costs a package function, an exported cookie type and a re-seamed test file for about five lines of SDK code. The deletion half is less contested, because the M7.5 move it waited for has happened. **Decided (owner, 2026-10-27): proceed with both.** The three earlier records are amended to point here (section 4.3).

## 2. Constraints

- **Dependency matrix (ADR-0014):** server packages may import domain and other server packages; they may not import feature contracts. `server-supabase` therefore cannot import `hasRecentLinkSignIn` from `features-auth/contracts`.
- **Framework-free server packages:** `server-supabase` takes cookies through host-supplied interfaces (`RequestCookies`, and `ProxyCookies` for the proxy) and never imports `next/*`. The proxy adapter keeps `NextRequest` and `NextResponse` in the app.
- **`server-only`:** `server-supabase`'s entry imports `server-only`. Evidence so far, read but not run: in the installed Next.js 16.4.3, `dist/build/webpack-config.js` aliases `server-only` to its empty module for every layer in `WEBPACK_LAYERS.GROUP.serverOnly`, and `dist/lib/constants.js` puts the `middleware` layer in that group (the config's own comment: "`server-only` is still available" there). That covers webpack only. `next build` in 16.x uses Turbopack unless told otherwise, and Turbopack's handling lives in its native binary, which was not inspected. So it stays **NOT VERIFIED**, and Task 1 of the plan proves it with a build before anything moves. _Superseded (review, 2026-10-27): "Whether that import resolves in the Next.js 16.4.3 proxy runtime is NOT VERIFIED; Task 1 of the plan proves it with a build before anything moves."_
- **Provider versions in step:** `frontend-supabase` and `server-supabase` both pin `@supabase/ssr` 0.12.7 and `@supabase/supabase-js` 2.117.3. The browser and server clients must read and write the same session cookies, so once `apps/web` drops the SDK, the pin rule in `server-supabase`'s README must name `frontend-supabase` instead of `apps/web`, and E5's test enforces it.
- **SDK rule:** nothing may run between creating the server client and `auth.getClaims()` (Supabase's warning in the current file). Moving both into one package function enforces that.
- **Logging stays in the host:** existing `server-supabase` operations return outcomes and the app's thin wrappers log (ownership map, account row). `deleteOwnAccount`'s two `console.warn` calls become outcome flags that the host's Server Action logs.
- **Behaviour preserved exactly:** redirect targets, the `next` parameter, the open-redirect origin check, cookie and cache-header copying, fixture-mode bypass, the deletion order (recent-link check, cleanup, `delete_own_account()` RPC, local sign-out), every outcome kind, and the database function's own check. The one exception is E6's added log line.

## 3. Decisions

Approved by the owner on 2026-10-27, as recommended by the review.

| Id  | Decision                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Reason                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | **The recent-link rule moves to `@synapcity/domain-identity`** (`src/utils/recent-link-sign-in/`). The root `index.ts` names four exports: `hasRecentLinkSignIn`, `hasRecentLinkSignInNow`, `LINK_SIGN_IN_WINDOW_MINUTES`, and `LINK_SIGN_IN_METHODS`, which is private today and is exported for the parity test (E4). Option (b): the three importers are re-pointed to `domain-identity` and `features-auth/contracts` keeps no re-export. The importers are `app/auth/delete-account/page.tsx`, the deletion operation and `features-auth`'s `DeleteAccount` component. Supersedes C7 (section 1.1). _Superseded proposal: option (a), a re-export from `features-auth/contracts` "so its public API is unchanged"._                                                                                                                                                                                                                                                                                                                                      | One import path per rule, and every importer may import domain (ADR-0014). M7.4 and M7.5 removed their temporary re-exports for the same reason. The rule names Supabase's `amr` method values, which is provider vocabulary in domain; `currentUserFromClaims` and `profileFromClaims` already read Supabase claim shapes there. `server-supabase` cannot serve the `DeleteAccount` component, because feature frontend code may not import server packages.                                                                                                                                           |
| D2  | **Proxy API shape.** `server-supabase` exports `refreshProxySession({ url, publishableKey, cookies })` and the type `ProxyCookies`. `ProxyCookies` is `getAll(): { name: string; value: string }[]` plus `setAll(cookies: { name: string; value: string; options: CookieOptions }[], headers: Record<string, string>): void`. `refreshProxySession` creates the client and immediately returns `supabaseIdentityProvider(client).claims()`: a `ProviderOutcome` of `user`, `none`, `unreachable` or `refused` (E2). The host treats every kind but `user` as signed out, as today. Inside the package, `ProxyCookies` is built from `@supabase/ssr`'s own `SetAllCookies` and `CookieOptions` types, so it cannot drift from the SDK. Its signature was checked in the installed 0.12.7. _Superseded: "returns `{ userId: string \| null }`"._                                                                                                                                                                                                                | The package owns the SDK and the create-then-`getClaims` order; the app owns `next/server` and route policy, and types its callback with `ProxyCookies` instead of `@supabase/ssr`'s types. Reusing the identity provider gives one mapping of `getClaims()` answers instead of two, and it keeps an outage distinguishable for E3 later.                                                                                                                                                                                                                                                               |
| D3  | **Deletion operations' home and signature.** `server-supabase` `account-deletion` unit: `sendAccountDeletionLink(client, input)` and `deleteOwnAccount(client, input)`, client first like the other auth operations. `input.cleanup` is `(client: SupabaseServerClient, userId: string) => Promise<void>`. `sendAccountDeletionLink` reads the user through `readProviderUser` (E1). No web wrapper: `requestAccountDeletion` and `confirmAccountDeletion` call the package operations with `await createClient()`, as the Server Actions already call the other seven M7.2 operations, and `confirmAccountDeletion` logs the flags. _Superseded (fourth review): a thin wrapper kept in `apps/web/src/features/auth/server/operations/`._ `deleteOwnAccount` does not log. Its outcome gains `cleanupFailed: true` on every outcome reached after the cleanup ran (`deleted`, the database's `link-required`, `provider-error`), and `signOutFailed: true` on `deleted` when `signOut` throws or returns an error (E6). Each flag is present only when true. | `signInWithOtp` belongs beside `sendOwnPasswordReset` and the other provider auth operations, and the check reads Supabase's `amr` claim. `server-account` was the alternative (deletion is account lifecycle). It exists and reaches the SDK only through `server-supabase`'s client type, so it would need `server-supabase` to classify the `getClaims()` error. _Superseded rationale: "A separate `server-account` home is possible but it would also need `@supabase/*`, which the README reserves for `server-supabase`." `server-account` already exists and imports no `@supabase/*` package._ |

### 3.1 Enhancements (owner, 2026-10-27)

| Id  | Disposition                                                                                                                                                                                                                                                                                                                                                                        | Where                    |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| E1  | Adopted: `sendAccountDeletionLink` uses `readProviderUser`. Its `user`, `signed-out` and `unavailable` kinds and its classification match the operation's hand-written check exactly (verified in code).                                                                                                                                                                           | D3, 4.2, plan Task 4     |
| E2  | Adopted: `refreshProxySession` returns `ProviderOutcome`. No behaviour change. In `@supabase/auth-js` 2.117.3, `getClaims()` returns `data: null` whenever it returns an error, and throws errors that are not auth errors, so today's `data?.claims` and the identity provider agree on every path (verified in the installed source). A thrown error still propagates, as today. | D2, 4.1, plan Task 3     |
| E3  | Recorded, not adopted: a later decision that needs the owner and ADR-0006. Today, if Supabase Auth or the signing-key fetch is unreachable, the proxy redirects a signed-in person on a protected page to sign-in. Letting `unreachable` through would fail open at the proxy layer, though pages and operations verify again. After E2 it is a host-only change.                  | Out of scope (section 6) |
| E4  | Adopted, corrected: the first review said pgTAP, but the repository's database tests are plain `psql` scripts ("No pgTAP dependency").                                                                                                                                                                                                                                             | 4.4, plan Task 5         |
| E5  | Adopted as a workspace test that compares the two manifests. Rejected for now: a pnpm catalog. It would be a new repository pattern, and how version-update tooling treats catalog entries was not checked here.                                                                                                                                                                   | 4.5, plan Task 5         |
| E6  | Adopted: the one deliberate behaviour addition (a log line).                                                                                                                                                                                                                                                                                                                       | D3, 4.2, plan Task 4     |
| E7  | Adopted: read-only live check before the manual steps.                                                                                                                                                                                                                                                                                                                             | 4.6, plan Task 7         |

## 4. Design

### 4.1 Session refresh in the proxy

- `server-supabase/src/proxy-session/`: `refreshProxySession` creates the client with `createServerClient` over the supplied `ProxyCookies`, and returns `supabaseIdentityProvider(client).claims()` with nothing between. Building the provider object makes no client call, so `getClaims()` is still the first call on the new client.
- `apps/web/src/lib/supabase/middleware.ts` keeps `updateSession`: fixture-mode bypass, the `NextResponse` it rebuilds when cookies are set (including the writes to `request.cookies` that Server Components read), the cache-header merge, `redirectWithSession`, and the protected and guest-only redirects. It reads `outcome.kind === 'user' ? outcome.userId : null` where it read `data?.claims` (only `sub` is used: `homePathFor(user.sub)`). Its `setAll` callback, typed with `ProxyCookies`, is what it passes as `cookies.setAll`.
- `middleware.test.ts` stubs `@supabase/ssr` today. After the move it stubs `refreshProxySession` instead; the stub calls the supplied `setAll` to play a token refresh, as the SDK stub does now, and returns a `ProviderOutcome`. Every assertion stays. The SDK stub moves to the package's own test, which also checks that `getClaims` is the first call on the new client and covers each outcome kind.
- `createRequestClient` and `refreshProxySession` share one internal factory over `{ getAll, setAll }`, which is not exported, so the client options live in one place. `createRequestClient` adapts the host's `set` and still ignores a failed write during a Server Component render.
- `lib/supabase/middleware.ts` is renamed `lib/supabase/proxy-session.ts`, with its test. It is the last place that keeps the pre-16 "middleware" name. `updateSession` keeps its name, which is the one Supabase's documentation uses. `proxy.ts` changes only its import. References to update:
  - `architecture.test.ts` (`ALWAYS_SERVER_ONLY`);
  - `identity-boundary.test.ts` (its ratchet entry);
  - `packages/dev/boundaries/src/rules/reachability/reachability.ts`;
  - `apps/web/README.md`.

  _Superseded (fourth review): "`proxy.ts` is unchanged."_

### 4.2 Account deletion

- `domain-identity` gains the recent-link rule and exports `LINK_SIGN_IN_METHODS` (D1). The moved file's comment names the `delete_own_account` migration as the database counterpart.
- `server-supabase/src/account-deletion/`: the two operations and their outcome types, taking the request client (D3). `sendAccountDeletionLink` returns `readProviderUser`'s `signed-out` or `unavailable` kind as its own (E1). `deleteOwnAccount` still classifies its `getClaims()` error with `isAuthRetryableFetchError`, because it needs the claims' `amr`, which a `ProviderOutcome` does not carry.
- `apps/web/src/features/auth/server/operations/` is removed; its code moves to the package. `requestAccountDeletion` (`features/auth/server/actions/actions.ts`) calls `sendAccountDeletionLink(await createClient(), …)`. `confirmAccountDeletion` (`app/auth/delete-account/actions.ts`) calls `deleteOwnAccount(await createClient(), { cleanup })` and logs `cleanupFailed` and `signOutFailed` with today's exact lines (`deleteOwnAccount cleanup failed`, `deleteOwnAccount signOut failed`). _Superseded (fourth review): a thin wrapper that created the client, logged the flags and stripped them. The other operations have no such wrapper._
- `deleteOwnAccount` checks freshness with `hasRecentLinkSignInNow` instead of repeating its clock expression.
- The moved operation tests pass a stub client instead of mocking `@/lib/supabase/server`. Their assertions stay, except that the two warning cases assert flags instead of `console.warn`. New cases: a cleanup failure followed by a database failure still carries `cleanupFailed`, and a `signOut` that resolves with an error carries `signOutFailed` (E6).
- Tests. `features/auth/server/actions/actions.test.ts` already mocks `@/lib/supabase/server`, so its deletion-link cases run the package operation against the stub client, as its other cases do. `app/auth/delete-account/actions.test.ts` re-points its mock from `@/features/auth/server/operations` to `@synapcity/server-supabase`'s `deleteOwnAccount`, mocks `createClient`, expects the call as `(client, { cleanup })`, and adds the two flag-logging cases. _Superseded (fourth review): "`actions.ts` and `app/auth/delete-account/actions.ts` keep their imports."_
- `app/auth/delete-account/page.tsx` imports `hasRecentLinkSignInNow` from `@synapcity/domain-identity` (D1 option b). _Superseded: "`app/auth/delete-account/page.tsx` keeps importing from `features-auth/contracts`" (this contradicted D1 option b; found in the second review)._
- The operations file's comment about M7.5 is replaced. _Superseded: "The README comment about M7.5 is replaced" (the comment is in `operations.ts`, not a README)._

### 4.3 Dependencies

- `apps/web` drops `@supabase/ssr` from runtime dependencies. `@supabase/supabase-js` moves to `devDependencies` for the test fixtures. `architecture.test.ts` uses the import only as a string and needs neither.
- `pnpm boundaries` gains no exception.
- `server-supabase` gains `@types/node` 26.6.5 as a dev dependency, because the E4 and E5 tests read files and its `tsconfig.json` type-checks `src`, tests included. `frontend-shells` and `frontend-forms` declare the same pin for their file-reading tests.
- If plan Task 1 stops the session-refresh half, `apps/web` keeps `@supabase/ssr`, and the README pin rule names all three manifests.
- After `apps/web` drops `@supabase/ssr`, a web test that still stubs it can no longer resolve the stub. This is why Task 3 re-seams the middleware test and the web tests run again after the dependency change (plan Task 6). _Superseded: "(plan Task 5)"; the plan was renumbered on approval._
- Decision records, amended on 2026-10-27 when the owner decided (replaced text kept, marked Superseded): the M7 design status line and Q5 answer, the M7.2 plan's Task B decision, and the M7.5 plan's C7.
- State records, amended in plan Task 6 when the code changes, because they describe what the code does: the ownership map rows `proxy.ts`, `lib/supabase` and `auth`; `server-supabase/README.md` (the `Owns:` line, its sentence that session refresh stays in the web host, the pin rule now naming `frontend-supabase` instead of `apps/web`, and the public-interface table, which gains `refreshProxySession`, `ProxyCookies`, the deletion operations and the already-exported `SupabaseServerClient`); the `domain-identity` and `features-auth` READMEs; `packages/server/README.md`, whose "Current inputs" line links `operations.ts`, which no longer exists after the move; `apps/web/README.md` (the renamed proxy file).

### 4.4 Database rule parity (E4)

The TypeScript rule and `public.delete_own_account()` each hold the window (10 minutes, `600` seconds in SQL) and the link methods (`otp`, `magiclink`). The SQL's comment points at `apps/web/src/features/auth/shared/recent-link-sign-in/…`, which no longer exists. The two also differ by design on one edge: the TypeScript rule refuses a timestamp more than a minute in the future, while the SQL does not. That is not a hole, because the token is signed. The applied migration is not edited.

- `server-supabase/src/account-deletion/database-parity.test.ts`, run in CI: it finds the newest file in `supabase/migrations/` that defines `public.delete_own_account`, and asserts that its window equals `LINK_SIGN_IN_WINDOW_MINUTES * 60` and its method list equals `LINK_SIGN_IN_METHODS`. It matches the SQL text, so a reformatted function fails it loudly; that is intended.
- `supabase/tests/delete-own-account.sql`, run by hand like the other files there: a plain `psql` script on a disposable local database, in one transaction that is rolled back, with each case in its own savepoint, because a successful deletion removes the synthetic user. Claims are set with `set_config('request.jwt.claims', …, true)`. Cases:
  - no `sub` raises `28000`;
  - a password sign-in raises `42501` with its message;
  - `otp` 601 seconds ago is refused, and 600 seconds ago deletes the synthetic user;
  - `magiclink` deletes;
  - a timestamp an hour in the future deletes, which records the documented difference;
  - `anon` is refused with "permission denied". That is also `42501`, so the script tells it apart by message.

### 4.5 Provider version pins (E5)

`server-supabase/src/provider-versions.test.ts` reads every workspace manifest matched by `pnpm-workspace.yaml` (`apps/*`, `packages/**/*`). It asserts that every declaration of `@supabase/ssr` or `@supabase/supabase-js`, in `dependencies` or `devDependencies`, is one identical exact version (no ranges), because browser and server must agree on the session cookies. After the move that covers `frontend-supabase`, `server-supabase` and web's test-only `@supabase/supabase-js`. If plan Task 1 stops the session-refresh half, it covers web's runtime pins too, with no change to the test. _Superseded (third review): "reads its own manifest and `packages/frontend/supabase/package.json`". A fixed pair would miss web's remaining dev pin, and any later consumer._

### 4.7 Test caching for the guards

The root `turbo.json` gives `test` and `test:coverage` Turbo's default inputs, which are the package's own files. CI restores `.turbo/cache` from earlier commits (`restore-keys: turbo-…`), so a change only to a migration or to another package's manifest would replay a cached pass, and the E4 and E5 guards would never run. `packages/server/supabase/turbo.json` (`"extends": ["//"]`, like `packages/frontend/ui/turbo.json`) therefore sets these inputs for both tasks:

- `$TURBO_DEFAULT$`;
- `$TURBO_ROOT$/supabase/migrations/**`;
- `$TURBO_ROOT$/pnpm-workspace.yaml`;
- `$TURBO_ROOT$/apps/*/package.json`;
- `$TURBO_ROOT$/packages/**/package.json`.

`$TURBO_ROOT$` is documented in the installed Turbo 2.11.7 (`docs/reference/configuration.mdx`). The cost is that a manifest change anywhere re-runs this package's tests, which is a small suite.

### 4.8 Considered and not done

- **A `./proxy` entry** exporting only `refreshProxySession`, to keep the rest of the package out of the proxy bundle. The proxy runs on Node.js, so the extra modules cost load time once per server process, not per request. A second entry would need its own `server-only` guard and boundary handling. Plan Task 1 records the proxy bundle size before and after, so this can be revisited with evidence. It remains the fallback if `server-only` fails there.
- **One helper for the `isAuthRetryableFetchError` checks** (about 11 call sites). It is already a one-line SDK predicate; a wrapper adds indirection without removing logic.
- **Merging `RequestCookies` and `ProxyCookies`.** The contracts differ: a Server Component write may throw and is ignored, while the proxy must forward headers. The shared internal factory (4.1) removes the duplicated code without merging the contracts.
- **A safety margin on the operation's freshness check.** At the window's edge, the app's check can pass, the avatars are cleaned up, and then the database refuses, because the app's and the database's clocks differ by seconds. The account stays and the pictures are gone. That is rare and minor (the person is deleting the account). A margin would refuse links the page still calls valid. Recorded here as a known edge instead.
- **Skipping the proxy for API routes or prefetches.** It changes session refresh, and there is no measured cost (none at all if the signing check in 4.6 shows asymmetric keys).
- **Removing the page's freshness check.** It is not redundant: it decides whether the page shows "send a link" or "confirm".
- **`"sideEffects"` in `server-supabase`'s manifest**, for tree-shaking. Its root entry's `import 'server-only'` is a side effect that must survive, and the gain is the same small bundle difference.

### 4.6 Live configuration check (E7)

Before the manual steps, and read-only, against the project the owner names:

- Supabase's security and performance advisors;
- the JWT signing mode. `getClaims()` verifies locally only for asymmetrically signed tokens. With the legacy shared secret (`HS*`) it calls `getUser()` on every proxy request, which adds a round trip to every page and counts against Auth rate limits (checked in `@supabase/auth-js` 2.117.3, which caches the key set module-wide for 10 minutes, so per-request clients are fine). Check: the project's `/auth/v1/.well-known/jwks.json` lists an asymmetric key, and a real access token's header has `alg` `ES256` or `RS256` and a `kid`. Moving to asymmetric keys is a dashboard change and a separate owner decision;
- the applied migration list. These migrations were applied by hand in the dashboard, so the list may not show them, and the function's definition is the evidence;
- `select` queries for `delete_own_account`: security definer, `search_path`, the function definition, and execute grants. These are compared with the migration.

Nothing is applied or changed. Differences are reported to the owner.

### 4.9 Follow-ups, not in this change

- **F1. Dedupe the remaining `getUser()` classifications.** `auth-operations.ts` hand-writes the same `signed-out` and `unavailable` check three times (around lines 122, 170 and 210), the check E1 replaces with `readProviderUser`. It is a separate change because it touches merged, tested code that this move does not otherwise touch. Planned in the [Supabase review fixes design](2026-10-27-supabase-review-fixes-design.md), C2 (added 2026-10-27). Done there (2026-10-27): `changeEmail`, `resendEmailChange` and `sendOwnPasswordReset` read the user through `readProviderUser`.

The Supabase code review of 2026-10-27 found further work outside this change (sign-out scope, cross-device email links, outage handling on pages, the remaining inline auth calls, `lib/owned-records`, generated types, `apps/docs`). It is planned in that companion design, which starts after this change merges.

- **F2. `@supabase/supabase-js` 2.118.0** is published (2.117.3 is pinned); `@supabase/ssr` 0.12.7 is the latest. Upgrade in its own change once the E5 pin test exists, within the repository's minimum release age.
- **F3. Asymmetric JWT signing keys,** if the 4.6 check finds the legacy shared secret. This is a dashboard change for the owner.
- **F4. Proxy outage handling** (E3). It also covers the page-level half the Supabase review found (its A3): `getVerifiedClaims` drops the `getClaims()` error, and `verifyIdentity` reports any claims failure as signed out by contract. A page-level change has no effect while the proxy redirects first, so both are decided together.

## 5. Verification

- Characterisation tests written before each move (current behaviour). After the move their assertions run unchanged, but the stub seam moves: from the SDK to `refreshProxySession` for the proxy, and from `createClient` to a stub client for deletion. _Superseded (review, 2026-10-27): "then run unchanged against the moved code". The stubs cannot stay unchanged (4.1, 4.2)._
- Guard caching: change a migration and confirm `pnpm turbo run test --filter=@synapcity/server-supabase` misses its cache, then restore the change.
- New tests: `refreshProxySession` for each outcome kind; the E6 and cleanup-then-database-failure cases; the flag logging in `confirmAccountDeletion`; the parity and pin tests (4.4, 4.5). The SQL script is run by hand on a disposable local database, and the report says whether it was.
- `pnpm --filter web test:e2e`, which runs against a production build, with the proxy importing the package: once in Task 1, and again at the end.
- `pnpm verify`, including the e2e smoke test.
- The read-only live check (4.6).
- Manual, in a browser against a real Supabase project:
  - sign in and sign out;
  - open a protected page signed out (redirect with `next`) and `/auth/login` signed in (redirect home);
  - the session survives a reload and a token refresh: load a page after the access-token lifetime has passed (one hour by default), or use a test project with a shorter lifetime;
  - the deletion screen refuses a wrong email;
  - a real deletion is run only with a throwaway account, never a personal one.

## 6. Out of scope

Changing the routing rules, fixture mode, the database function or its applied migration, the deletion user experience, `frontend-supabase`'s code, and moving the delete-account page or its Server Actions out of the app (they are host entries under ADR-0014). Also out of scope: proxy outage handling (E3), and a pnpm catalog for the provider pins (E5).

## 7. Review, 2026-10-27

Read: this spec and its plan; `middleware.ts`, `proxy.ts`, `lib/supabase/{server,client,env}.ts`, `operations.ts` and both test files; `app/auth/delete-account/{actions.ts,page.tsx}`; the manifests, READMEs and sources of `server-supabase`, `server-auth` and `server-account`; `domain-identity`; the `features-auth` manifest and the recent-link rule; ADR-0014 section 2; the ownership map; the M7 design and the M7.2 and M7.5 plans; `architecture.test.ts`; the boundaries reachability rule; `knip.json`; the `delete_own_account` migration; Next.js 16.4.3's webpack config and layer constants. Run: `prettier --check` on the two documents. Not run: any test, type check, build, or the Task 1 spike. The shell used for the review could not load Vitest's native binding from this checkout (its binaries are for macOS).

### 7.1 Corrected in place, most severe first

1. **High.** The spec reversed two recorded owner decisions (M7.2 Task B and Q5/C7) without naming them. Fixed in section 1.1.
2. **High.** Plan sequencing bug (inferred, not run). After Task 3 the web test's `@supabase/ssr` stub probably still intercepts the package's import, because both pin the same version and resolve to one store path. Task 5 then removes the dependency from `apps/web`, the stub no longer resolves, and Task 5 runs no tests. Fixed in 4.1 and 4.3 and in plan Tasks 3 and 5.
3. **Medium.** The deletion flags were under-specified. If they were set only on `deleted`, a cleanup failure followed by a database failure would lose the warning that is logged today. Fixed in D3.
4. **Medium.** D3's rationale said `server-account` would need `@supabase/*`. It already exists and does not. Fixed in D3.
5. **Medium.** The D2 row was broken by an unescaped `|` in `string | null`, which pushed half the decision into the recommendation column. The host also had no type for its `setAll` callback without the SDK. Fixed in D2 (`ProxyCookies`).
6. **Medium.** "Tests run unchanged" was impossible as written. Fixed in section 5.
7. **Low.** D1 missed the third importer (`DeleteAccount` uses `LINK_SIGN_IN_WINDOW_MINUTES`). Fixed in D1.
8. **Low.** The test count was wrong (11; actually 12 tests, 14 cases). Fixed in section 1.
9. **Low.** The list of records to amend was incomplete. Fixed in 4.3 and plan Task 5.
10. **Low.** The spike could pass without exercising the import. Fixed in plan Task 1.

### 7.2 Assumptions

| Assumption                                                                                  | Status                                                                       | If wrong                                                                            |
| ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `server-only` resolves to its empty module in the proxy under the bundler `next build` uses | NOT VERIFIED (true for webpack by reading; Turbopack not inspected)          | Every request fails at module load. Task 1 stops the work                           |
| `next build` in 16.4.3 uses Turbopack by default                                            | Inferred (the `build` script passes no flag)                                 | The webpack evidence applies directly. Task 1 still decides                         |
| The web `@supabase/ssr` stub intercepts the package's import while both pin one version     | Inferred                                                                     | Task 3 Step 4 fails earlier, which is the safer outcome                             |
| `pnpm deps` (Knip) counts imports in the ignored `apps/web/src/lib/**`                      | Inferred from `pnpm deps` passing today with `@supabase/ssr` used only there | A leftover dependency would not be flagged. The type check and build are unaffected |
| `delete_own_account` on the live project matches the migration                              | NOT VERIFIED (the migration is applied by hand in the dashboard)             | The manual deletion check fails or behaves differently. E7 checks it read-only      |
| The proxy treats any `getClaims()` error as signed out                                      | Verified in code                                                             | n/a                                                                                 |
| `readProviderUser` classifies exactly as `sendAccountDeletionLink` does today               | Verified in code                                                             | n/a                                                                                 |

### 7.3 Open questions for the owner

Answered on 2026-10-27: proceed with both halves, D1 option (b), D2 and D3 as amended (section 3).

- Proceed with the session-refresh half, given M7.2 Task B's reasoning (section 1.1)? The deletion half stands on its own.
- D1: (a) re-export or (b) re-point?
- D2 and D3 as amended.

### 7.4 Enhancements, as first proposed

Decided on 2026-10-27; section 3.1 has the dispositions. Kept as first written, except the E4 correction.

- **E1. Reuse `readProviderUser` in `sendAccountDeletionLink`.** It classifies `getUser()` failures exactly as the operation does by hand today. Gain: one classification for that call instead of two. Cost: none in behaviour.
- **E2. `refreshProxySession` returns `ProviderOutcome`** (`user`, `none`, `unreachable`, `refused`) through the existing claims mapping, and the host treats everything but `user` as signed out. Gain: one vocabulary for provider answers, and an outage can be logged or handled later without changing the package. Cost: a slightly wider return type. No behaviour change.
- **E3. Outage handling at the proxy (behaviour change, its own decision).** Today, if Supabase Auth or the signing-key fetch is unreachable, a signed-in person on a protected page is redirected to sign-in. An alternative is to let the request through on `unreachable`, since pages and operations verify again. Cost: the proxy fails open at its layer; needs an owner and ADR-0006 call. Not proposed for this change.
- **E4. Database parity** (corrected in section 3.1: plain `psql`, not pgTAP). The SQL hardcodes `600` seconds and `('otp', 'magiclink')`. Its comment points at `apps/web/src/features/auth/shared/recent-link-sign-in/…`, which no longer exists. It also does not refuse future timestamps, which the TypeScript rule refuses beyond a minute of skew; that is not a hole, because tokens are signed. Proposal: a pgTAP test in `supabase/tests` (601 seconds refused, 600 accepted, only link methods, `anon` refused), and the moved TypeScript rule's comment names the migration. Leave the applied migration file as it is, or add a follow-up `comment on function` migration.
- **E5. Enforce the `@supabase/*` pins** between `frontend-supabase` and `server-supabase`, with a pnpm catalog entry or a workspace test that compares the two manifests. Gain: browser and server cookie handling cannot drift. Cost: a catalog changes how version-update tooling reads those entries.
- **E6. `signOutFailed` also when `signOut` returns `{ error }`.** Today only a thrown error is caught, and an error result is silently ignored. Logging only.
- **E7. Read-only live check before the manual steps.** Run Supabase's security and performance advisors and list the deployed function, grants and policies, to confirm they match the migrations.

## 8. Second review, 2026-10-27 (after approval)

Read-only re-read of this spec, the plan and the three amended decision records, against the code.

New evidence:

- `@supabase/auth-js` 2.117.3's `getClaims()` returns `data: null` with every error and throws errors that are not auth errors (E2 is behaviour-neutral).
- `@supabase/ssr` 0.12.7's `SetAllCookies` is `(cookies, headers)` with `{ name, value, options: CookieOptions }` entries (D2's type is right).
- No module outside `operations.ts` imports `DeletionLinkOutcome` or `AccountDeletionOutcome`.
- `server-supabase` has no `@types/node`, while `frontend-shells` and `frontend-forms` declare 26.6.5 for their file-reading tests.
- The repository's SQL tests are plain `psql` (`spaces.sql`: "No pgTAP dependency").

Run: `prettier --check` on every edited file, and a check that every relative link in the five documents resolves. Not run: any test, type check, build, the Task 1 spike, the SQL script or a live check.

### 8.1 Found and fixed, most severe first

1. **Medium.** The E4 and E5 tests read files, but `server-supabase` cannot type-check `node:fs` without `@types/node`. Added to 4.3 and plan Task 5 Step 0.
2. **Medium.** Section 4.2 still said the page "keeps importing from `features-auth/contracts`", which contradicted D1 option (b). Fixed.
3. **Medium.** E4 said pgTAP; the repository uses plain `psql` scripts. Corrected in 3.1 and 4.4.
4. **Medium.** `LINK_SIGN_IN_METHODS` is private, so the parity test could not read it. D1 now has four exports.
5. **Low.** The SQL script needs a savepoint per case, because a passing deletion case removes the synthetic user. Added to 4.4 and plan Task 5.
6. **Low.** `list_migrations` may not show migrations applied by hand. Section 4.6 and plan Task 7 now say that `pg_proc` is the evidence.
7. **Low.** If Task 1 stops the session-refresh half, `apps/web` must keep `@supabase/ssr`, and the pin rule names three manifests. Added to 4.3 and plan Task 1.
8. **Low.** `ProxyCookies` now derives from the SDK's own types, so it cannot drift. Added to D2 and plan Task 3.
9. **Low.** Stale task numbers after the plan was renumbered, and constraints that did not mention E5 or E6. Fixed in 1.1, 2 and 4.3.
10. **Low.** The outcome-type export path for the wrapper was unspecified. Added to plan Task 4 Step 2.

### 8.2 Completeness check

| Requirement                                                                   | Where it is met                                                     |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Every first-review finding (7.1) is reflected in the approved design and plan | Sections 1.1, 2, 3, 4 and 5; plan Tasks 1 to 7                      |
| D1 (b), D2 and D3 as approved                                                 | Section 3; plan Tasks 2 to 4                                        |
| E1, E2 and E4 to E7 folded in; E3 deferred                                    | Section 3.1; sections 4.1 to 4.6 and 6; plan Tasks 3, 4, 5 and 7    |
| Earlier decisions marked Superseded with a link here                          | M7 design status and Q5; M7.2 Task B; M7.5 C7                       |
| State records listed for when the code changes                                | Section 4.3; plan Task 6                                            |
| A stop point for the unproven risk                                            | Plan Task 1, with what continues if it fails                        |
| What each check proves and does not                                           | Section 5 and plan Task 7; the SQL script is reported as run or not |

### 8.3 Remaining risks, not resolvable by reading

- `server-only` under Turbopack in the proxy (plan Task 1).
- Whether the live project's `delete_own_account` matches its migration (plan Task 7).
- The two new text-matching tests are deliberately brittle. A reformatted SQL function fails them, which is intended but will need an update when it happens.
- The token-refresh manual check depends on the project's access-token lifetime.

## 9. Third review, 2026-10-27

The owner asked for further fixes and improvements, applied directly. This was a read-only re-read against the build tooling and the repository's conventions.

1. **High (verified in configuration).** The E4 and E5 guards would have been defeated by Turbo's cache. Their inputs live outside `server-supabase`, the root `turbo.json` uses default inputs for `test` and `test:coverage`, and CI restores the cache across commits. Fixed: section 4.7 and plan Task 5 Step 2b, with a proof step.
2. **Medium.** The pin test compared a fixed pair of manifests, so it missed web's remaining test-only pin and any future consumer, and it changed meaning if Task 1 failed. It now checks every workspace manifest (4.5).
3. **Medium (inferred from the folder name; `git` is not reachable from the shell used).** The documents sit in the `feat-tokens-package` worktree. Implementing there would mix this change into unrelated token work, against the branch convention in `docs/engineering/quality-gates.md`. A branch is now named in the header and the plan's constraints.
4. **Low.** The plan had no task-order statement for parallel execution, no `format:check` in per-task checks, and an unclear meaning for the fixture-mode client counter after the re-seam. Fixed.
5. **Optimizations considered and not done:** a `./proxy` entry and `sideEffects` (section 4.8). Plan Task 1 now records the proxy bundle size, so either can be revisited with numbers.

Run: `prettier --check` on the edited files. Not run: tests, type check, build, or any Turbo task.

## 10. Fourth review, 2026-10-27 (design quality)

The owner asked for optimizations of any kind: dedupes, pruning, patterns, renaming and use cases. Checked against the code before listing; six were approved and folded in.

1. **Pattern (verified).** The Server Actions call the other seven M7.2 operations directly with `await createClient()` (`actions.ts`, from line 127). The planned web wrapper would have been the only one of its kind. It is dropped (D3, 4.2).
2. **Performance (verified in the SDK).** Under the legacy `HS*` signing, `getClaims()` calls `getUser()` on every proxy request. Added to the live check (4.6) and to the follow-ups (F3).
3. **Dedupe.** One internal client factory serves both clients (4.1).
4. **Naming.** `middleware.ts` becomes `proxy-session.ts`, with four references to update (4.1). Found while doing it: `identity-boundary.test.ts` and `packages/server/README.md` also refer to moved or removed files, so both are listed (4.1, 4.3).
5. **Dedupe.** `hasRecentLinkSignInNow` in the operation (4.2).
6. **Evidence.** `apps/web/e2e/spaces.e2e.ts` sends a signed-out visitor to sign in. Plan Task 1 names it. It proves that the proxy loads and runs. It does not by itself prove that the proxy did the redirect, because a page guard may redirect too; the unit tests cover that.

Recorded with reasons: items 7 to 9 as follow-ups F1 to F4 (4.9), and items 10 to 14 as considered and not done (4.8).

Run: `prettier --check`. Not run: tests, builds.
