# Milestone 4 server identity boundary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One reusable, provider-neutral way for server code to learn the verified caller, with web behavior unchanged.

**Architecture:** `domain-identity` holds the portable result type; `server-auth` holds the provider port, the verification policy and the ownership rule; `server-supabase` adapts Supabase to the port and builds request clients from host-supplied cookies. `apps/web` keeps cookies, env, React `cache`, Next navigation, fixture mode, copy and logging, and rewires `requireOwner`, the two Spaces API routes and four Server Action files onto the boundary.

**Tech Stack:** TypeScript 7.0.2 (source packages, no build), Vitest 4.1.12, `@supabase/ssr` 0.12.7, `@supabase/supabase-js` 2.117.3, `server-only` 0.0.1, Next.js 16.4.3, pnpm 12.15.0.

**Spec:** [2026-10-23-m4-server-identity-boundary-design.md](../specs/2026-10-23-m4-server-identity-boundary-design.md)

## Global Constraints

- Package names and places: `packages/domain/identity` = `@synapcity/domain-identity`; `packages/server/auth` = `@synapcity/server-auth`; `packages/server/supabase` = `@synapcity/server-supabase`. `version` `0.0.0`, `private`, `"type": "module"`, entries point at `.ts` source.
- Entries: domain and server packages expose `.` only, plus `server-auth` `./testing`. The file behind each server `.` entry starts with `import 'server-only';`. No other package file imports `server-only` (R10); `./testing` does not.
- Per-unit folders: `src/<unit>/<unit>.ts`, `<unit>.test.ts` beside it, `src/<unit>/index.ts` re-exporting; other folders import the folder, never a file in it (R7). Relative, extensionless imports (`moduleResolution: bundler`).
- Only `server-supabase` imports `@supabase/*` among packages. Exact versions `@supabase/ssr` `0.12.7`, `@supabase/supabase-js` `2.117.3`, `server-only` `0.0.1`; no other dependency version changes.
- User-visible behavior is unchanged: messages (`'Sign in again to update your profile.'`, `SAVE_FAILED` = `'Could not save your changes. Try again.'`), the `signedOut` flag, redirects (`/auth/login?next=...`), 404s, 401 bodies, `Cache-Control: no-store`.
- Fixture mode stays in `apps/web`; no package reads `SYNAPCITY_DEV_AUTH` or `NODE_ENV`; a fixture never comes back from `getVerifiedClaims` or `getVerifiedIdentity`.
- A request makes at most one `getClaims()` call across `getVerifiedClaims`, `getVerifiedIdentity` and `requireOwner`.
- Logging stays code-and-status only through `logFailure`; packages never log.
- Existing tests keep their assertions on observable results. A test may change only its mocks or add cases.
- Commits use the repository's conventional style and end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Never write a GitHub closing keyword near an issue reference.

## Review Focus

1. A Supabase error and a user both present on `getUser()`: today `getCaller` treats it as a failure (`!error && data.user`); the adapter must too. Test in Task 3.
2. `getUser()` returns no user and no error: signed out, and still logged with empty code/status, as today. Tests in Tasks 3 and 5.
3. A retryable fetch error on the four rewired actions: `SAVE_FAILED` with no `signedOut` (only the account actions test this today). Tests in Task 5.
4. Several identity reads in one request (layout `requireOwner` + page `requireOwner` + `getCurrentUser`): one `getClaims()` call. Test in Task 4.
5. Fixture mode on: `getVerifiedIdentity()` asks the provider and never returns the fixture user. Test in Task 4.

---

### Task 1: `domain-identity` contract

**Files:**

- Create: `packages/domain/identity/package.json`, `tsconfig.json`, `eslint.config.mjs`, `README.md`
- Create: `packages/domain/identity/src/index.ts`, `src/identity-result/identity-result.ts`, `src/identity-result/index.ts`

**Interfaces:**

- Produces: `type VerifiedIdentity = { userId: string }`; `type IdentityResult = { status: 'verified'; identity: VerifiedIdentity } | { status: 'signed-out' } | { status: 'unavailable' }` (spec 4.1, with its doc comments).

- [ ] **Step 1:** Write the manifest: `exports: { ".": "./src/index.ts" }`; scripts `lint` (`eslint . --cache --cache-strategy content --max-warnings 0`) and `check-types` (`tsc --noEmit`); devDependencies `@synapcity/dev-eslint-config`, `@synapcity/dev-typescript-config` (`workspace:*`), `eslint` `10.9.1`, `typescript` `7.0.2`. No runtime dependencies, no test script (types only).
- [ ] **Step 2:** `tsconfig.json` extends `@synapcity/dev-typescript-config/base.json` with `strictNullChecks`, `module: preserve`, `moduleResolution: bundler`, `include: ["src"]`; `eslint.config.mjs` uses `@synapcity/dev-eslint-config/base`.
- [ ] **Step 3:** Write the two types in `identity-result.ts`; `src/identity-result/index.ts` and `src/index.ts` re-export.
- [ ] **Step 4:** README with `Owns:` (identity contracts; M4: the verified-identity result; M7 adds credential and profile contracts), public export, and the rule that the contract is never built from display data or a supplied ID.
- [ ] **Step 5:** `pnpm install` (links the workspace), then `pnpm --filter @synapcity/domain-identity lint check-types`. Expected: both pass.
- [ ] **Step 6:** Checkpoint commit (only once the owner authorizes commits) `feat(domain-identity): add the verified identity contract`.

### Task 2: `server-auth` boundary, fake provider and test alias

**Files:**

- Create: `packages/dev/vitest-config/src/server-only.ts`, `packages/dev/vitest-config/src/server-only-stub.ts`; modify `packages/dev/vitest-config/package.json` (`exports["./server-only"]`), its README
- Create: `packages/server/auth/{package.json,tsconfig.json,eslint.config.mjs,vitest.config.ts,README.md}`
- Create: `packages/server/auth/src/index.ts`; units `src/identity-provider/`, `src/verify-identity/` (+ test), `src/is-owner/` (+ test); `src/testing/index.ts`, `src/testing/fake-identity-provider/` (+ test)
- Modify: root `vitest.config.ts` (`projects` gains `packages/server/auth`)

**Interfaces:**

- Consumes: `IdentityResult`, `VerifiedIdentity` from `@synapcity/domain-identity`.
- Produces (root `.`):
  - `type ProviderFailure = { code?: string; status?: number }`
  - `type ProviderOutcome = { kind: 'user'; userId: string } | { kind: 'none' } | ({ kind: 'unreachable' } & ProviderFailure) | ({ kind: 'refused' } & ProviderFailure)`
  - `interface IdentityProvider { claims(): Promise<ProviderOutcome>; user(): Promise<ProviderOutcome> }`
  - `type IdentityVerification = { result: IdentityResult; failure?: ProviderFailure }`
  - `verifyIdentity(provider: Pick<IdentityProvider, 'claims'>): Promise<IdentityVerification>`
  - `verifyIdentityWithProvider(provider: Pick<IdentityProvider, 'user'>): Promise<IdentityVerification>`
  - `isOwner(result: IdentityResult, userId: string): boolean`
- Produces (`./testing`): `fakeIdentityProvider(outcomes?: { claims?: ProviderOutcome; user?: ProviderOutcome }): IdentityProvider & { calls: { claims: number; user: number } }`, defaulting each outcome to `{ kind: 'none' }`.
- Produces (`@synapcity/dev-vitest-config/server-only`): `serverOnlyAlias: { find: RegExp; replacement: string }`, where `find` is `/^server-only$/` and `replacement` is the absolute path of `server-only-stub.ts` (an empty module: `export {};`).

- [ ] **Step 1: Write the failing tests** in `verify-identity.test.ts` (using the fake provider) with these cases and exact expectations:
  - `verifyIdentity` → user `'u1'` gives `{ result: { status: 'verified', identity: { userId: 'u1' } } }`.
  - `verifyIdentity` → user `''`, `none`, `refused` (`code: 'bad_jwt'`) and `unreachable` each give `result: { status: 'signed-out' }`; `refused`/`unreachable` carry their `failure` (`{ code, status }`), `none` has no `failure` key.
  - `verifyIdentityWithProvider` → user `'u1'` verified; `none` gives signed-out without `failure`; `refused` (`code: 'user_not_found', status: 403`) gives signed-out with that failure; `unreachable` (`status: 0`) gives `{ status: 'unavailable' }` with failure `{ status: 0 }`; user `''` gives signed-out.
  - Each function calls only its own provider method once (`calls`).
  - `is-owner.test.ts`: true for verified `'u1'` vs `'u1'`; false for `'u2'`, for a supplied `''`, for `signed-out` and for `unavailable`.
  - `fake-identity-provider.test.ts`: defaults to `none`, returns the given outcomes, counts calls.
- [ ] **Step 2:** Add the alias module and stub to `dev-vitest-config`; package config `vitest.config.ts` = `mergeConfig(baseConfig, defineConfig({ resolve: { alias: [serverOnlyAlias] } }))`. Package manifest: exports `.` → `./src/index.ts`, `./testing` → `./src/testing/index.ts`; dependencies `@synapcity/domain-identity` `workspace:*`, `server-only` `0.0.1`; devDependencies as `packages/dev/boundaries` (configs, `@types/node`, `@vitest/coverage-v8`, `eslint`, `typescript`, `vitest`); scripts `lint`, `check-types`, `test`, `test:coverage`. `pnpm install` (fetches `server-only`).
- [ ] **Step 3:** Run `pnpm --filter @synapcity/server-auth test`. Expected: FAIL (functions not defined).
- [ ] **Step 4:** Implement the types and functions above. `src/index.ts` starts with `import 'server-only';` then re-exports the three unit folders. A user outcome is verified only when `typeof userId === 'string' && userId !== ''`.
- [ ] **Step 5:** Run `pnpm --filter @synapcity/server-auth test lint check-types` and `pnpm boundaries`. Expected: all pass, no violations.
- [ ] **Step 6:** README (`Owns:` the identity port, verification policy and ownership rule; entries; that the package never logs or reads fixture mode). Checkpoint commit (only once the owner authorizes commits) `feat(server-auth): add the identity boundary and controlled provider`.

### Task 3: `server-supabase` adapter and request client

**Files:**

- Create: `packages/server/supabase/{package.json,tsconfig.json,eslint.config.mjs,vitest.config.ts,README.md}`
- Create: `packages/server/supabase/src/index.ts`; units `src/request-client/` (+ test), `src/supabase-identity-provider/` (+ test)
- Modify: `apps/web/src/lib/supabase/server.ts`, `apps/web/package.json` (`@synapcity/server-supabase` `workspace:*`), root `vitest.config.ts` (`packages/server/supabase`)

**Interfaces:**

- Consumes: `IdentityProvider`, `ProviderOutcome` from `@synapcity/server-auth`.
- Produces:
  - `type RequestCookies = { getAll(): { name: string; value: string }[]; set(name: string, value: string, options: CookieOptions): void }` (`CookieOptions` from `@supabase/ssr`)
  - `createRequestClient(options: { url: string; publishableKey: string; cookies: RequestCookies })`, returning `createServerClient(url, publishableKey, { cookies: { getAll, setAll } })` where `setAll` sets each cookie and swallows a thrown error (Server Component render), with the existing comment.
  - `outcomeFromClaims(claims: { sub: string } | null | undefined): ProviderOutcome`: `{ kind: 'user', userId: claims.sub }` or `{ kind: 'none' }`.
  - `supabaseIdentityProvider(client: { auth: Pick<SupabaseClient['auth'], 'getClaims' | 'getUser'> }): IdentityProvider`.

- [ ] **Step 1: Write the failing tests.**
  - `supabase-identity-provider.test.ts` with a stub `auth` object and real `AuthRetryableFetchError`/`AuthApiError` from `@supabase/supabase-js`: `claims()` → `{ data: { claims: { sub: 'u1' } }, error: null }` gives user `'u1'`; `{ data: null, error: null }` gives `none`; an `AuthApiError('bad', 401, 'bad_jwt')` gives `{ kind: 'refused', code: 'bad_jwt', status: 401 }`. `user()` → `{ data: { user: { id: 'u1' } }, error: null }` gives user; `{ data: { user: null }, error: null }` gives `none`; `new AuthRetryableFetchError('fetch failed', 0)` gives `{ kind: 'unreachable', status: 0 }` (code as the error carries it); `AuthApiError('gone', 403, 'user_not_found')` gives `refused` with both; **error and user both present gives `refused`**. `outcomeFromClaims(null)` and `(undefined)` give `none`.
  - `request-client.test.ts` with `vi.mock('@supabase/ssr')`: passes `url`, `publishableKey`; `getAll` returns the host's cookies; `setAll` calls `set(name, value, options)` for each; a throwing `set` does not throw out of `setAll`.
- [ ] **Step 2:** Manifest: exports `.` only; dependencies `@supabase/ssr` `0.12.7`, `@supabase/supabase-js` `2.117.3`, `@synapcity/server-auth` `workspace:*`, `server-only` `0.0.1`; devDependencies and scripts as Task 2; vitest config with `serverOnlyAlias`. `pnpm install`. Run tests: FAIL.
- [ ] **Step 3:** Implement. Retryable detection uses `isAuthRetryableFetchError`; failure detail copies `code` and `status` only when defined. `src/index.ts` starts with `import 'server-only';`.
- [ ] **Step 4:** Rewrite `lib/supabase/server.ts`: `createClient()` keeps its name, signature and comment; it awaits `cookies()`, reads `getSupabaseEnv()`, and returns `createRequestClient({ url, publishableKey, cookies: { getAll: () => cookieStore.getAll(), set: (name, value, options) => cookieStore.set(name, value, options) } })`.
- [ ] **Step 5:** Run `pnpm --filter @synapcity/server-supabase test lint check-types`, `pnpm --filter web check-types`, `pnpm --filter web test`, `pnpm boundaries`. Expected: all pass; web tests unchanged.
- [ ] **Step 6:** README. Checkpoint commit (only once the owner authorizes commits) `feat(server-supabase): add the request client and identity adapter`.

### Task 4: Host read path

**Files:**

- Modify: `apps/web/vitest.config.ts` (both projects: `resolve.alias` gains `serverOnlyAlias` beside `@`), `apps/web/package.json` (`@synapcity/server-auth`, `@synapcity/domain-identity` `workspace:*`)
- Modify: `apps/web/src/features/auth/server/session/session.ts` (+ `session.test.ts`)
- Modify: `apps/web/src/lib/access/require-owner.ts` (+ test)
- Modify: `apps/web/src/app/api/spaces/route.ts`, `apps/web/src/app/api/spaces/[spaceId]/route.ts` (+ their tests)

**Interfaces:**

- Consumes: `verifyIdentity`, `isOwner` (Task 2); `outcomeFromClaims` (Task 3).
- Produces: `getVerifiedIdentity: () => Promise<IdentityResult>` exported from `features/auth/server/session`, memoized with React `cache`. `requireOwner` keeps its signature and `OwnerAccess` type.

- [ ] **Step 1: Write the failing tests.**
  - `session.test.ts`: `getVerifiedIdentity` gives verified `'u1'` for claims `{ sub: 'u1' }` and `signed-out` for `{ data: null }` and for a `getClaims` error; in fixture mode it calls `getClaims` and returns `signed-out` when the provider has no session (never the fixture user).
  - A single-call test without the `cache` passthrough mock (separate file `session.cache.test.ts`, or a `vi.doUnmock` block) calling `getVerifiedClaims`, `getVerifiedIdentity` and `getVerifiedIdentity` again inside one `cache` scope, asserting `getClaims` was called once. The plan leaves to the implementer how to open a React request scope in Vitest; if none exists outside a server render, assert instead that `getVerifiedIdentity` obtains claims only through `getVerifiedClaims` (spy on the module export) and record the substitution in the task report.
  - `require-owner.test.ts`: existing cases unchanged; add "a provider error is treated as signed out" (redirect).
  - Route tests: mocks switch from `getVerifiedClaims` to `getVerifiedIdentity` returning `{ status: 'signed-out' }` (401, repository not called) or verified (200 / 404 as today).
- [ ] **Step 2:** Run `pnpm --filter web test -- session require-owner api/spaces`. Expected: new cases FAIL.
- [ ] **Step 3:** Implement `getVerifiedIdentity` as spec 4.3. `requireOwner`: fixture branch unchanged; then `const result = await getVerifiedIdentity()`; signed-out (or unavailable) redirects exactly as today; `!isOwner(result, userId)` is `notFound()`; returns `{ kind: 'verified', claims }` with `claims` from `getVerifiedClaims()` (same memoized call). Routes: `!fixtureModeEnabled() && (await getVerifiedIdentity()).status !== 'verified'` → the existing 401.
- [ ] **Step 4:** Run `pnpm --filter web test`, `pnpm --filter web check-types lint`, `pnpm boundaries`. Expected: all pass.
- [ ] **Step 5:** Checkpoint commit (only once the owner authorizes commits) `refactor(web): verify owner and API access through the identity boundary`.

### Task 5: Host write path

**Files:**

- Modify: `apps/web/src/features/account/server/caller.ts`
- Modify: `apps/web/src/features/spaces/server/actions/space-state-actions.ts`, `features/documents/server/actions/document-state-actions.ts`, `features/dashboards/server/actions/dashboard-state-actions.ts`, `features/settings/server/actions/preferences-actions.ts` (+ each test)
- Modify: `apps/web/package.json` only if Task 4 did not already add `@synapcity/server-auth`

**Interfaces:**

- Consumes: `verifyIdentityWithProvider` (Task 2), `supabaseIdentityProvider` (Task 3), `VerifiedIdentity` (Task 1).
- Produces: in `caller.ts`, `getCallerIdentity(supabase: Supabase): Promise<{ identity: VerifiedIdentity } | { failure: string; signedOut?: true }>`. Verified → `{ identity }`. Otherwise `logFailure('getCallerIdentity', failure)` (called even when `failure` is undefined), then `unavailable` → `{ failure: SAVE_FAILED }`, `signed-out` → `{ failure: SIGN_IN_AGAIN, signedOut: true }`. `getCaller` stays for the account actions.

- [ ] **Step 1: Write the failing tests.** For each of the four action files add: a retryable error (`new AuthRetryableFetchError('fetch failed', 0)` from `getUser`) gives `{ ok: false, error: SAVE_FAILED }` with `signedOut` undefined and no write; a signed-out result gives `error: 'Sign in again to update your profile.'`, `signedOut: true` (keep any existing case); verified proceeds as today. `recordSpaceView` returns without writing on both failures. `preferences-actions` upserts `user_id: 'user-1'` from the identity. Assert `console.warn` was called with `'getCallerIdentity failed'` and `{ code: undefined, status: undefined }` for the no-error signed-out case.
- [ ] **Step 2:** Run the four test files. Expected: the log-label assertions FAIL; outcome cases may already pass (behavior is preserved).
- [ ] **Step 3:** Implement `getCallerIdentity`; in each action replace `getCaller(supabase)` with `getCallerIdentity(supabase)`, `'caller' in found` with `'identity' in found`, and `found.caller.id` with `found.identity.userId`.
- [ ] **Step 4:** Run `pnpm --filter web test`, `pnpm --filter web check-types lint`, `pnpm boundaries`, `pnpm deps`. Expected: all pass.
- [ ] **Step 5:** Checkpoint commit (only once the owner authorizes commits) `refactor(web): check Server Action callers through the identity boundary`.

### Task 6: Records and full verification

**Files:**

- Modify: `docs/architecture/reorganization-ownership-map.md` (auth/session and Supabase rows: M4 destinations implemented), `docs/architecture/workspace-conventions.md` (inventory: note the three packages exist), `docs/architecture/decisions/0014-multi-app-package-boundaries.md` section 7 (current implementation), `docs/architecture/decisions/README.md` (react-server item settled by the alias; Storybook discovery still open for M5), `packages/domain/README.md` and `packages/server/README.md` (example lists point at the real packages), `.agents/task-scope.md` (exact creates/updates, verification, unrun checks), `docs/superpowers/specs/2026-10-23-m4-server-identity-boundary-design.md` (status: implemented on the branch)

- [ ] **Step 1:** Update the records; `pnpm format`.
- [ ] **Step 2:** Run `pnpm verify`. Expected: exit 0. Record each stage's result.
- [ ] **Step 3:** Checkpoint commit (only once the owner authorizes commits) `docs: record milestone 4 server identity boundary`.
- [ ] **Step 4:** Report what ran, what passed, what was not run (live Supabase checks in spec 4.4 are the owner's), and the next safe action.
