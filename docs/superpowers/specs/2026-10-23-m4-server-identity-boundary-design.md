# Milestone 4: server identity boundary

**Status:** Accepted by the owner on 2026-10-23 ("i accept all your recommendations": Q1–Q3 as recommended and calls C1–C6). Implemented on `chore/reorganization-m4-server-identity` the same day; live-provider checks in section 4.4 remain the owner's. Implementation plan: [2026-10-23-m4-server-identity-boundary.md](../plans/2026-10-23-m4-server-identity-boundary.md). The builder check's findings are folded in (section 12).
**Date:** 2026-10-23
**Branch:** `chore/reorganization-m4-server-identity`
**Governing decisions:** [ADR-0014](../../architecture/decisions/0014-multi-app-package-boundaries.md) (categories, matrix, host bindings), [ADR-0006](../../architecture/decisions/0006-authentication-with-supabase.md) (Supabase Auth, `getClaims`/`getUser`, development fixture mode), [ADR-0008](../../architecture/decisions/0008-auth-actions-and-server-operations.md) (request-bound clients, no forwarding wrappers), the [workspace conventions](../../architecture/workspace-conventions.md) (inventory, entry points, organization, boundary checks).
**Sequence:** the roadmap sequence adopted by the owner on 2026-10-23 (M4 server identity boundary, M5 Spaces slice, M6 Preferences and Settings, M7 Auth and Account).

## 1. Intent

Give server code one reusable way to learn who the verified caller is, before the first server-backed capability moves into packages (M5 Spaces). Today each call site asks Supabase itself and interprets the answer itself. After M4, a server package receives a request-bound capability from the host and asks the boundary; the boundary answers with a small portable result. This is a thin slice of auth, not the Auth and Account migration (M7).

## 2. Goals, non-goals, anti-goals

**Goals**:

- A portable identity contract with no framework or provider types.
- A provider boundary: the Supabase-specific reading lives in one adapter, and tests substitute a controlled provider instead of mocking the SDK.
- The existing call sites that only need "who is this, verified" are rewired onto the boundary; the rest are named with the milestone that takes them.
- Sign-in, sign-out, session refresh, owner-area access and every action's replies behave exactly as today.

**Non-goals**:

- Auth operations (registration, recovery, email change, OAuth callback, account deletion), session refresh in the proxy, and the browser client: M7.
- Display-profile projection (`CurrentUser`, `profileFromClaims`) and credential/profile schemas: M7.
- Spaces, Documents and Dashboards repositories and queries: M5 and M8.
- Moving fixture data or changing development fixture mode.

**Anti-goals** (failure even if it works)

- A fixture identity returned as if verified. ADR-0006: `getVerifiedClaims()` and its successor never return a fixture.
- A wrapper that only forwards an SDK call and adds no contract (ADR-0008 item 8).
- Authorizing from display data (`user_metadata`, names, emails) or from a supplied owner ID.
- Any change to what a person sees or is sent: messages, redirects, 404s, the signed-out flag.
- A module-level or cross-request Supabase client.

## 3. Current state (evidence, 2026-10-23)

Two verification paths exist side by side.

| Path                             | Mechanism                                                                                                                                                                                                                                                                                                                                      | Callers                                                                                                                                                                                                          |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Read (pages, API routes, layout) | `getVerifiedClaims()` in `features/auth/server/session/session.ts`: `supabase.auth.getClaims()`, memoized per request with React `cache`, any error read as signed out                                                                                                                                                                         | `requireOwner` (`lib/access/require-owner.ts`, 8 route files), `getCurrentUser`, `app/api/spaces/route.ts`, `app/api/spaces/[spaceId]/route.ts`, `app/auth/welcome/page.tsx`, `app/auth/delete-account/page.tsx` |
| Write (Server Actions)           | `getCaller(supabase)` in `features/account/server/caller.ts`: `supabase.auth.getUser()` (network), returns the full provider user or a message; a retryable fetch error gets "Could not save your changes. Try again.", anything else "Sign in again to update your profile." with `signedOut: true`; logs the failure by code and status only | Spaces (`setSpacePinned`, `recordSpaceView`), Documents and Dashboards state actions, `preferences-actions.ts`, account name/setup/avatar actions                                                                |

What callers read from the result:

- Ownership and keys: only the user ID (`claims.sub`, `caller.id`).
- Display: `email` and `user_metadata` through `profileFromClaims` (settings and welcome pages, `getCurrentUser`).
- Session facts: `claims.amr` for recent link sign-in (delete-account page and operation).
- Provider user data: `user_metadata` and `identities` for profile metadata writes (account actions).

Development fixture mode (`lib/access/dev-fixture.ts`) is checked by the host at 37 call sites before any client is built. No portable identity contract exists; "verified" currently means Supabase claims or a Supabase user object.

`lib/data/user.ts` has no importers and is not an identity contract (a sample object and a `console.log`). It is outside M4; see section 11. The owner removed it on 2026-10-23 (commit `95fe3ba5`).

## 4. Design

### 4.1 Identity contract (`domain-identity`)

The package's first code. Root entry `.`; portable TypeScript, no runtime dependency.

```ts
/** Who the verified caller is. Never built from display data or a supplied ID. */
export type VerifiedIdentity = { userId: string };

/** The answer to "who is asking?" */
export type IdentityResult =
  | { status: 'verified'; identity: VerifiedIdentity }
  | { status: 'signed-out' }
  | { status: 'unavailable' };
```

- `userId` is the provider subject (`sub`, the user's UUID). It is the only identity field because it is the only one any rewired caller needs; fields are added when a real consumer needs them.
- `unavailable` means the provider could not be reached and the caller may retry. It exists because the write path already distinguishes it; the read path never produces it (section 4.3).
- Session facts (`amr`, issued-at) and display fields are not part of the contract in M4. M7 decides whether recent-sign-in becomes a contract field when it moves the delete-account flow.
- Fixture mode is not represented. A fixture is a host concern and never reaches this contract.

### 4.2 Boundary (`server-auth`) and provider adapter (`server-supabase`)

Both packages get their first code, as the inventory assigns ("verified identity" to `server-auth`; "request-bound server client from host-supplied cookies, provider-error translation" to `server-supabase`, the only server package importing `@supabase/*`).

**`server-auth`** (root entry `.`, starts with `import 'server-only'`)

- An `IdentityProvider` port: the two questions the boundary asks a provider, returning provider-neutral outcomes. Proposed shape (names are the plan's to refine):

  ```ts
  type ProviderOutcome =
    | { kind: 'user'; userId: string }
    | { kind: 'none' }
    | { kind: 'unreachable'; code?: string; status?: number }
    | { kind: 'refused'; code?: string; status?: number };

  interface IdentityProvider {
    /** Locally verified token claims (Supabase `getClaims`). */
    claims(): Promise<ProviderOutcome>;
    /** The provider's own record, a network call (Supabase `getUser`). */
    user(): Promise<ProviderOutcome>;
  }
  ```

- Two boundary functions that turn outcomes into `IdentityResult` and own the policy:
  - `verifyIdentity(provider)`: the claims path. Any outcome other than a user with a non-empty ID is `signed-out`, exactly as `getVerifiedClaims()` behaves today.
  - `verifyIdentityWithProvider(provider)`: the fresh path (ADR-0006 "`getUser()` where fresh user data is required"). `unreachable` becomes `unavailable`; `none` and `refused` become `signed-out`.
- An ownership rule: `isOwner(result, userId)` is true only for a verified identity whose `userId` equals the supplied ID. The supplied ID is compared, never trusted.
- Both functions return `IdentityVerification = { result: IdentityResult; failure?: ProviderFailure }`, where `ProviderFailure = { code?: string; status?: number }` is the provider error's detail. The host keeps logging by code and status only, as `logFailure` does today. The package does not log.
- `userId` is not checked against a UUID pattern. Today's callers accept any non-empty `sub`; adding a format rule would be a policy change outside M4.
- A `./testing` entry with a controlled provider (`fakeIdentityProvider({ claims, user })`) for tests in any package or app.

**`server-supabase`** (root entry `.`, starts with `import 'server-only'`)

- `createRequestClient({ url, publishableKey, cookies })`: wraps `createServerClient` from `@supabase/ssr`. `cookies` is a host-supplied `{ getAll, setAll }` adapter; the package never imports `next/headers`. The swallow-on-`setAll` behavior for Server Components moves with it unchanged.
- `supabaseIdentityProvider(client)`: implements `IdentityProvider` with `client.auth.getClaims()` and `client.auth.getUser()`, translating `isAuthRetryableFetchError` into `unreachable` and other errors into `refused`. This is the one place that knows Supabase's identity shapes.
- `outcomeFromClaims(claims)`: the translation of already-verified Supabase claims (or `null`) into a `ProviderOutcome`, used by `supabaseIdentityProvider` and by the host's memoized claims path (section 4.3).
- A client type export (`SupabaseServerClient`) is added when the first consumer needs it (M5), not in M4, so no export is unused.

**Direction:** `server-supabase` → `server-auth` (implements its port) → `domain-identity`. Acyclic and allowed by the matrix (server to server, server to domain).

### 4.3 Host bindings and rewired call sites (`apps/web`)

The app keeps cookies, environment, React `cache`, Next.js navigation, fixture mode and every user-facing message.

- `lib/supabase/server.ts` `createClient()` keeps its name and callers; it reads `cookies()` and `getSupabaseEnv()` and calls `createRequestClient`. All existing `createClient()` consumers (auth operations, repositories) are unaffected.
- A new memoized host function `getVerifiedIdentity()` in `features/auth/server/session` returns `(await verifyIdentity({ claims: async () => outcomeFromClaims(await getVerifiedClaims()) })).result`. It reuses the memoized claims read, never consults fixture mode and never returns a fixture.
- `getVerifiedClaims()` stays, unchanged, for the readers that need provider claims for display or session facts (settings and welcome pages via `profileFromClaims`, the delete-account page via `amr`, `getCurrentUser`).
- **Requirement:** a request still makes at most one `getClaims()` call, however many of `getVerifiedClaims`, `getVerifiedIdentity` and `requireOwner` it uses. `getClaims()` can fall back to a network call, so a second call would be a performance regression. The plan chooses the mechanism (for example, the host's claims-path provider reading the memoized `getVerifiedClaims()` result through a `server-supabase` translation function) and a test proves the single call.
- **Rewired in M4** (they need only "verified, and who"):
  - `requireOwner`: decides access from `getVerifiedIdentity()` and `isOwner`; still redirects and 404s exactly as today, and still returns `claims` alongside, so the settings page keeps working until M7 moves display projection. Fixture branch unchanged.
  - `app/api/spaces/route.ts` and `app/api/spaces/[spaceId]/route.ts`: the signed-in check uses `getVerifiedIdentity()`.
  - Spaces (`setSpacePinned`, `recordSpaceView`), Documents and Dashboards state actions, and `preferences-actions.ts`: replace `getCaller` with `verifyIdentityWithProvider(supabaseIdentityProvider(supabase))` on the same request client, then map `signed-out` and `unavailable` to the exact messages and `signedOut` flag `getCaller` produces today, through a host helper `getCallerIdentity(supabase)` in `caller.ts`. The helper logs every non-verified result exactly as `getCaller` does (operation label `getCallerIdentity`, code and status only, including the no-error case). `preferences-actions.ts` reads `identity.userId` where it read `caller.id`.
- **Not rewired in M4** (named for later):
  - Account name/setup/avatar actions keep `getCaller`: they need the provider user's `user_metadata` and `identities`. M7.
  - `features/auth/server/operations` (`getUser`, `getClaims`), `app/auth/update-password/page.tsx`, the delete-account page and action: M7.
  - Session refresh in `lib/supabase/middleware.ts` and `proxy.ts`: M7 (`server-supabase` "session refresh helpers").
  - `getCurrentUser` and `CurrentUser`: M7 (display projection to `features-auth`).
  - `getProviderUser` in `session.ts` (`getUser()` for `getPendingEmail` and `getConnectedAccounts`): M7 display data.
  - Repository fixture branches (`space-repository`, `get-documents`, `get-dashboards`): M5 and M8 replace them with host-bound fixture adapters.

### 4.4 Tests and verification

- `domain-identity`: type-level tests only if a runtime export appears; otherwise covered by its consumers.
- `server-auth`: unit tests of both boundary functions and `isOwner` against the fake provider, covering every outcome kind, including an empty `userId`.
- Fixture safety is proven at the host: `getVerifiedIdentity()` in fixture mode still asks the provider and returns only what it verified (signed out when the provider has no session), and `requireOwner`'s fixture branch never calls the boundary.
- `server-supabase`: unit tests of `supabaseIdentityProvider` with a stub client covering claims present/absent/error and `getUser` success, retryable error and other error; `createRequestClient` passes cookies through and swallows `setAll` failures.
- App: existing tests for `requireOwner`, the API routes and every rewired action keep their assertions on observable results (messages, `signedOut`, redirects, 404s); only their mocks move from the SDK and `getCaller` to the boundary or the fake provider. Each rewired action gets a test for each of the three results.
- Repository gate: `pnpm verify` (format, lint, typecheck, Knip, boundaries, brand, coverage tests, e2e smoke, Storybook tests, build).
- Manual against the real Supabase project (owner): sign in, open the owner home and a Space, pin and unpin a Space, change a preference that saves to the account, sign out, then revisit an owner URL and confirm the sign-in redirect. Automated tests do not reach the live provider; the report says so.

### 4.5 Tooling the first server entries need

`server-auth` and `server-supabase` are the first packages whose entry starts with `import 'server-only'`. `server-only@0.0.1` (registry tarball read 2026-10-23) exports `./empty.js` under the `react-server` condition and `./index.js`, which throws, by default. Plain Vitest uses the default, so any test that loads these entries throws: the two packages' own tests and, once rewired, the `apps/web` tests of `requireOwner`, the API routes and the actions (both its `node` and `dom` projects).

Turning on the `react-server` condition would also switch `react` to its server build for every test in the project, which breaks hooks and component tests. M4 therefore maps only the specifier: `@synapcity/dev-vitest-config` gains a `./server-only` export with `serverOnlyAlias`, a Vite `resolve.alias` entry that sends exactly `server-only` to an empty stub module, applied in the two packages' configs and both `apps/web` projects. Production is unaffected: Next.js resolves the guard itself, and the boundary checker (R3, R10) and the Next build keep enforcing it. This settles the decisions-index item for server entries; Storybook discovery stays with M5.

Dependencies: `server-only@0.0.1` (approved in M3.2) in both server packages. `@supabase/ssr@0.12.7` and `@supabase/supabase-js@2.117.3` are added to `server-supabase` at exactly the versions `apps/web` pins; they stay in `apps/web`, which still imports them directly (browser client, proxy, auth operations, auth events, `caller.ts`). No version changes.

## 5. Package creation

Each package follows the [package checklist](../../architecture/package-creation-checklist.md) and the internal-organization rules: per-unit folders with `index.ts`, tests beside code, explicit `exports` pointing at TypeScript source, no build step, `workspace:*` internal dependencies. `domain-identity` puts units directly under `src/` (one module). Root `package.json` scripts and Turbo tasks pick the packages up the way existing packages are picked up.

## 6. Boundary checks and exceptions

- No exception in `exceptions.ts` concerns identity, so M4 cannot shrink the list by its own work. The roadmap's completion criterion ("pass with a reduced allowlist") is read as "pass with no new exception" for M4; see question Q3.
- `server-supabase` is the only server package importing `@supabase/*`. R4 already keeps domain free of it; whether a rule should enforce the vendor-adapter convention is not added here.
- R10 applies to both new server entries from their first commit.

## 7. Migration bridges

None planned. Every rewired caller imports the new packages directly. `getVerifiedClaims` and `getCaller` are not bridges: they stay as the canonical implementation for their remaining callers until M7.

## 8. Order of work

1. `domain-identity` with the contract.
2. `server-auth` with the port, policy, ownership rule, fake provider and tests; the Vitest `react-server` configuration (4.5).
3. `server-supabase` with the client factory, adapter and tests; `lib/supabase/server.ts` delegates to it.
4. Host: `getVerifiedIdentity`, then `requireOwner` and the API routes, then the actions one feature at a time, each with its tests green before the next.
5. Documentation: ownership map rows, inventory note that the three packages exist, ADR-0014 section 7 current-implementation note, task-scope ledger, decisions index (react-server item).
6. `pnpm verify`, then the owner's manual checks.

## 9. Owner questions (answered 2026-10-23: all recommendations accepted)

| #   | Question                                                                                                                                                                                              | Recommendation                                                                                                                                                |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q1  | Three packages (`domain-identity`, `server-auth` port and policy, `server-supabase` adapter) or two (contract plus a Supabase adapter that also holds the policy, with `server-auth` waiting for M7)? | Three, as the inventory assigns. The port is what lets M5 and M7 tests use a controlled provider, and it keeps provider knowledge in one package.             |
| Q2  | Rewire the write path (Spaces, Documents, Dashboards, preferences actions) in M4, or only the read path?                                                                                              | Rewire both. The write path is where `unavailable` matters, and M5 Spaces moves those actions next; leaving them on `getCaller` means M5 rewires them anyway. |
| Q3  | Accept "no new exception" as M4's boundary criterion, since nothing on the list concerns identity?                                                                                                    | Accept. The alternative is pulling an unrelated M7 exception (the auth client barrel cycle) into M4.                                                          |

## 10. Calls made by Claude (owner to check)

| #   | Call                                                                                                            | Why                                                                                                                   |
| --- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| C1  | The contract field is `userId`, not `id` or `sub`.                                                              | Matches the route parameter and `user_id` columns; `id` is ambiguous beside record IDs; `sub` is provider vocabulary. |
| C2  | Session facts (`amr`) and display fields stay out of the contract until M7.                                     | No rewired caller needs them; adding them now would design M7's delete-account contract early.                        |
| C3  | Fixture mode stays entirely in the host.                                                                        | ADR-0006 forbids a fixture from looking verified; packages never need to know about it.                               |
| C4  | The host keeps React `cache` memoization.                                                                       | It is framework request scope, which ADR-0014 section 3 gives to the host.                                            |
| C5  | Messages, logging and the `signedOut` flag stay in the app.                                                     | They are copy and host policy; the boundary returns status and failure detail only.                                   |
| C6  | `getVerifiedClaims` and `getCaller` remain for their M7 callers instead of being reimplemented on the boundary. | Reimplementing them would be a forwarding wrapper (ADR-0008) and would touch auth flows M4 does not own.              |

## 11. Left out, found along the way

- `apps/web/src/lib/data/user.ts`: unused sample user with a fake password and a `console.log`. Not part of M4; the owner removed it on 2026-10-23 (commit `95fe3ba5`).
- The base record contract, record-schema messages and preference contracts: M5 and M6 designs, from the evidence gathered on 2026-10-23 (the Space and document/dashboard schemas share all ten fields; identity schemas embed form copy).

## 12. Builder check (2026-10-23)

A fresh reviewer read the proposed design against the repository. Resolved:

- Test loading of the `server-only` guard in `apps/web` as well as the packages: section 4.5 (alias, not the `react-server` condition).
- The fixture-claim test: no UUID rule (section 4.2); fixture safety is proven at the host (section 4.4).
- Logging after the rewire: same shape and cases, new operation label (section 4.3, C7).
- The Supabase packages are added to `server-supabase` and kept in `apps/web` (section 4.5).
- `getProviderUser` is named for M7 (section 4.3).
- `getVerifiedIdentity` reuses the memoized claims read through `outcomeFromClaims` (section 4.3).
- The fixture-check count is 37.

Additional call: **C7** the rewired actions log under `getCallerIdentity` instead of `getCaller`; the logged fields (`code`, `status`) and the cases that log are unchanged.

## 13. Post-implementation review (2026-10-23)

A review pass after implementation added:

- `apps/web/src/identity-boundary.test.ts`, a ratchet that lists the files still allowed to call Supabase `getClaims()`/`getUser()` directly, with call counts and the milestone for each. A new direct call fails it, and so does a listed call that disappears. This enforces the completion criterion on the app side; `pnpm boundaries` does not check call sites.
- Tests for the host binding (`lib/supabase/server.test.ts`: env, cookie read/write, a new client per call) and for `getCallerIdentity` itself (`features/account/server/caller.test.ts`: the three results and code-only logging).
- Implementation notes in ADR-0005 (the `server-only` alias and its consumers), ADR-0006 and ADR-0008 (where the client and the caller check now live).
