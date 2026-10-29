# Protected Route Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Status:** Approved (owner, 2026-10-29): D1 = option B, D2 = defer. Implemented and verified in this worktree, uncommitted; see "Implementation record" at the end. Base `main` at `a44316ed`.

**Goal:** Give `apps/web` an explicit `(protected)` route group for the signed-in `/<userId>/...` area, with no change to any URL, to authentication, to authorization or to Supabase RLS, and with a test that keeps the group, the proxy's path rule and the per-page owner checks from drifting apart.

**Architecture:** The route group is route organization only. Identity is still verified once per request (`getVerifiedClaims`, memoized), ownership is still decided by `requireOwner` in `[userId]/layout.tsx` and in every page, and data access is still scoped by RLS. The new `(protected)/layout.tsx` is a fail-closed signed-in backstop that reads the already-memoized claims. Moving the shell and providers out of the root layout is deliberately **not** part of this plan (D2).

**Tech Stack:** Next.js 16.4.3 App Router (`apps/web/package.json`), `@supabase/ssr`, Vitest, Playwright.

**Governing:** [ADR-0006](../../architecture/decisions/0006-authentication-with-supabase.md) (unresolved item "Which routes are protected"), [ADR-0007](../../architecture/decisions/0007-app-local-auth-and-account-ownership.md), [ADR-0014](../../architecture/decisions/0014-multi-app-package-boundaries.md) (routes/layouts/proxy stay app entry points), `AGENTS.md` sections 5, 6, 7a.

## Global Constraints

- No URL changes. A route group adds no URL segment; every existing path (`/<userId>/home`, `/<userId>/home/spaces/<id>`, `/<userId>/settings`, `/auth/*`, `/api/spaces*`, `/`, `/privacy`) answers exactly as today.
- No new authentication framework, no new Supabase client, no new dependency, no schema or migration change.
- `getClaims()` stays the only server-side identity read (ADR-0006); `identity-boundary.test.ts` must keep passing without a new allow-list entry.
- Security logic stays on the server. Nothing moves into a client component. The route group is never the security mechanism.
- Every page and route handler under the group still calls `requireOwner` or `getVerifiedIdentity` itself. Layout checks do not replace them (Next.js docs, below).
- No public-sharing functionality, no visibility field, no new permission abstraction.
- Fixture mode (`SYNAPCITY_DEV_AUTH=fixture`, development only) behaves as today and is never treated as verified identity.
- Each task ends green on `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm deps`, `pnpm boundaries`, and the web unit tests. The final task runs `pnpm verify`.
- Commits and pushes only when the owner authorizes them. No GitHub closing keyword near an issue number.

## 1. Verified current state

All findings below were read from the repository at `a44316ed`; "verified" means read in a file or in Git, "inferred" is marked.

### Route structure (`apps/web/src/app`)

| Area                 | Routes                                                                                                                                                                                                                                       | Guard on the route itself                                                                                                                                           |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public               | `/` ([page.tsx](../../../apps/web/src/app/page.tsx)), `/privacy`, `not-found`, `error`, `global-error`                                                                                                                                       | none (correct)                                                                                                                                                      |
| Auth                 | `/auth/login`, `register`, `forgot-password`, `error` (guest pages); `callback` (route handler); `welcome`, `update-password`, `delete-account` (signed-in, self-guarded) under [auth/layout.tsx](../../../apps/web/src/app/auth/layout.tsx) | `welcome`, `update-password`, `delete-account` each call `getVerifiedClaims()` and redirect themselves; they are **not** matched by the proxy (it excludes `/auth`) |
| Signed-in owner area | `/[userId]` (redirect), `/[userId]/home/**` (home, spaces, documents, dashboards, with `(index)` groups and `[id]` record pages), `/[userId]/settings`                                                                                       | Proxy (signed-in), [`[userId]/layout.tsx`](../../../apps/web/src/app/[userId]/layout.tsx) `requireOwner`, and `requireOwner` again in every `page.tsx`              |
| Route handlers       | `/api/spaces`, `/api/spaces/[spaceId]`                                                                                                                                                                                                       | Handler checks `getVerifiedIdentity` and answers 401 JSON; RLS scopes rows                                                                                          |

There is no route group named `(public)`, `(auth)` or `(protected)` on `main`. The only existing groups are the `(index)` groups under `home/{spaces,documents,dashboards}`.

### Layers that decide access today

1. **Session refresh and coarse redirect: the proxy.** [`proxy.ts`](../../../apps/web/src/proxy.ts) calls `updateSession` ([`lib/supabase/middleware.ts`](../../../apps/web/src/lib/supabase/middleware.ts)), which calls `supabase.auth.getClaims()`. A signed-out request to a path matched by [`isProtectedPath`](../../../apps/web/src/lib/routing/route-access.ts) (`/<x>/(home|settings)(/…)`, `auth` excluded) is redirected to `/auth/login?next=<path+query>`; refreshed cookies and cache headers are carried onto the redirect. A signed-in request to `/auth/login` or `/auth/register` is redirected to a `safeNextPath` destination. The matcher runs on every request except static assets.
2. **Owner check: `requireOwner`** ([`lib/access/require-owner.ts`](../../../apps/web/src/lib/access/require-owner.ts)). Signed out: redirect to `/auth/login?next=<home path>`. Signed in as someone else: `notFound()` (404, ids are not confirmed). It reads the per-request memoized `getVerifiedClaims`/`getVerifiedIdentity` ([`session.ts`](../../../apps/web/src/features/auth/server/session/session.ts)), so a request verifies its token once ([`require-owner.request-scope.test.ts`](../../../apps/web/src/lib/access/require-owner.request-scope.test.ts)). Its doc comment already states: call it from the layout **and** each page, because layouts are not re-rendered on every navigation.
3. **Server Actions: `getCallerIdentity`** ([`lib/access/caller.ts`](../../../apps/web/src/lib/access/caller.ts)) verifies with a fresh provider lookup per action and refuses before building a client in fixture mode (ADR-0006).
4. **Database: RLS.** `spaces`, `documents`, `dashboards`, `space_documents`, `space_dashboards`, `profiles`, `user_preferences` enable RLS with `*_own` policies and column-level grants that revoke `anon` and prevent clients from choosing `owner_id` (`supabase/migrations/20261018013000_…`, `…090000_…`, `…090100_…`). SQL test scripts exist in `supabase/tests/` (spaces, documents-and-dashboards, space-participation, seed-sample-data); no `package.json` script or workflow references them (verified by grep), so they are **not** an automated gate.

### Application composition

The signed-in shell is **not** in a nested layout. [`app/layout.tsx`](../../../apps/web/src/app/layout.tsx) reads `getCurrentUser()`, the look cookie, account preferences and sidebar records, then wraps **every** route in `RegionalProvider`, `RootProviders`, `UserProvider`, `NextShellNavigation` and `AppShell` (sidebar, command palette, Quick Create). With no user the sidebar is omitted (`userId` null) and the same shell renders the header with `AuthStatus`. Consequences, verified in code:

- Public and auth pages share the shell, header and providers with the owner area; a signed-in visitor on `/` or `/privacy` still gets their account look and the account menu.
- Every route is dynamic because the root layout reads `cookies()` and verifies claims.
- `[userId]/layout.tsx` adds `NextCollectionNavigation`; `home/layout.tsx` adds `HomeProviders` + `HomeShell`; `settings/layout.tsx` adds `SettingsPageShell`.

### Existing tests (so new coverage is only the gap)

| Concern                          | Existing test                                                                                                                                                                                            | Gap                                                                                                                                                   |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Path matcher                     | [`route-access.test.ts`](../../../apps/web/src/lib/routing/route-access.test.ts): protected/guest-only/never-both, look-alike paths                                                                      | none for this plan                                                                                                                                    |
| Proxy redirect + cookies/headers | [`middleware.test.ts`](../../../apps/web/src/lib/supabase/middleware.test.ts): redirect to sign in, guest-only redirect, cookie + cache header carry-over, fixture bypass, fixture ignored in production | `next` carrying the **query string** is described in the code but only partly asserted; expired/invalid session case is covered only as "claims null" |
| Owner guard                      | [`require-owner.test.ts`](../../../apps/web/src/lib/access/require-owner.test.ts): owner, signed out, failed claims, other id 404, fixture                                                               | none                                                                                                                                                  |
| Page calls guard                 | Per-page `page.test.tsx` for spaces index/record, documents index/record, dashboards record assert `requireOwner` called with the id                                                                     | no test for `home/page.tsx`, `settings/page.tsx`, `[userId]/page.tsx`, dashboards index                                                               |
| Route handlers                   | `api/spaces/route.test.ts` (401 signed out, fixture), `api/spaces/[spaceId]/route.test.ts`                                                                                                               | none                                                                                                                                                  |
| Actions                          | `lib/access/caller.test.ts`, `features/auth/server/actions/actions.test.ts`, `create-record-action.test.ts`                                                                                              | none                                                                                                                                                  |
| Browser anonymous redirect       | [`spaces.e2e.ts`](../../../apps/web/e2e/spaces.e2e.ts): `/someone/home/spaces` and one record path redirect to `/auth/login?next=<path>` and render the sign-in page (runs in CI, no session needed)     | not covered for `/home`, `/settings`, documents, dashboards, or a query string                                                                        |
| Authenticated browser flows      | `resource-views.e2e.ts`, `global-panel.e2e.ts`, `shared-look.e2e.ts` need fixture dev mode; CI skips them (5 skipped of 66, per the 2026-10-29 handoff and `test.skip` guards)                           | client-side navigation and shell lifetime across protected routes is not exercised in CI                                                              |
| Import boundaries                | `architecture.test.ts` (lexical, treats `lib/access/*` as server-only), `identity-boundary.test.ts`                                                                                                      | no test ties route files to the guard                                                                                                                 |
| RLS                              | `supabase/tests/*.sql`                                                                                                                                                                                   | not wired into CI (see above)                                                                                                                         |

## 2. Git-history findings

- **A `(protected)` group has never existed on `main`.** `git log main -- '*(protected)*'` returns nothing, and `git ls-tree HEAD -- apps` shows no such path. The word is therefore not "restored" from `main` history; it is a proposal.
- **Where it does exist:** commit `f7d782a6` (2026-10-27 10:32, author Hanaa Sadoqi), "wip: backup of uncommitted work" from worktree `feat-refactor-auth-account`, reachable only from `backup/wip-auth-account-2026-10-27`. It moves `app/[userId]/**` under `app/(protected)/`, moves settings under `home`, adds `(protected)/layout.tsx` calling a new `requireSignedIn()` ([`lib/access/require-signed-in.ts`](../../../apps/web/src/lib/access/require-signed-in.ts), 19 lines, with a test) and edits the `route-access.ts` comment. It is unmerged, was never reviewed, and no document records why it was started or abandoned. **Inference, not verified:** it was exploratory uncommitted work captured by a backup commit, not a deliberate removal.
- **`apps/docs/src/app/(protected)/`** (commit `cd0f0ffa`, 2026-10-26, "feat(docs): add protected layout and page components…") was a proof page for the docs app: a layout wrapping `RootShell`, and a server page that calls `supabase.auth.getClaims()` and redirects to `/auth/login`. It is on other feature branches but **not** on `main` (`git ls-tree HEAD -- apps` has no such path). It contains a button with an `onClick` in a server component (`supabase.auth.logOut()`), so it was a sketch, not a model to restore.
- **No `Protected` wrapper component ever existed.** `git log --all -G'(function|const|class) Protected\b|export (default )?function Protected'` finds nothing. The only historical names are `isProtectedPath` (commit `479f2d38`, 2026-10-13) and the `requireSignedIn` backstop above. The task text's "original `Protected` component" has no source in this repository's history; if it existed in the previous (external) implementation it is evidence only (AGENTS.md section 4) and cannot be inspected from here. **NOT VERIFIABLE.**
- **How the current structure arose:** `app/[userId]/layout.tsx` first appears in `d92169be` (2026-10-17, #24, auth UI) and has been carried by #28, #59, #64, #77. `requireOwner` was added in #28 and extended by #41 (fixture mode), #58 (identity boundary) and #76 (Supabase review fixes). ADR-0006 explicitly lists "Which routes are protected. The first protected route is a proof, not a product decision" as **unresolved**.
- **Conclusion on intent:** nothing was removed. The current top-level `[userId]` placement, the URL-regex proxy rule and per-page `requireOwner` are the deliberate, reviewed design recorded in ADR-0006 and the `requireOwner` comments. The current implementation preserves every security guarantee the WIP branch's `requireSignedIn` was meant to add, except a signed-in-only check on a **non-`[userId]`** protected route, of which none exists.

## 3. Gaps and non-regressions

No security regression exists. Findings, most important first:

1. **Two sources of truth for "protected".** The URL regex in `route-access.ts` (proxy) and the folder layout (`[userId]`) must agree by convention only. A new owner-area route outside `/<x>/(home|settings)` would be reachable unprotected by the proxy and would depend on its own page check alone. Medium, structural.
2. **Nothing enforces "each protected page calls the guard".** Five of the nine owner-area pages have a test asserting it (spaces index and record, documents index and record, dashboard record); the rule rests on review. A page that forgets `requireOwner` would still be blocked by the proxy (signed-in only) and RLS (own rows), but would render another user's shell without the 404 (the `[userId]/layout.tsx` check covers hard loads, not soft navigation). Medium.
3. **Return-URL fidelity differs by layer.** The proxy preserves path and query in `next`; `requireOwner` can only return the user's home (it knows the id, not the path). Reached only when the proxy passed but the token failed at render time. Low; recorded, not changed. A layout cannot read the request path/search in Next, so a layout-level redirect also cannot build `next`.
4. **E2E gap on the redirect matrix** (documents, dashboards, home, settings, query string). Low.
5. **RLS SQL tests are not automated.** Pre-existing, out of scope; named so the verification section does not over-claim.
6. **Stale ADR text.** ADR-0006 cites Next.js 16.3.8; the repository declares 16.4.3. Report only, ADR text change belongs with the ADR update in Task 4.
7. **Outage behavior** (signed-in user bounced when Supabase Auth is unreachable) is already recorded as deferred E3 in the Supabase leftovers design; untouched here.

## 4. Upstream evidence (AGENTS.md section 7a)

- Declared version: `next` `16.4.3` (`apps/web/package.json`); the installed copy's bundled docs were read at `apps/web/node_modules/next/dist/docs/01-app` in the main checkout (this worktree has no `node_modules`).
- `02-guides/authentication.md`: "Due to Partial Rendering, be cautious when doing checks in Layouts as these don't re-render on navigation… A layout also does not control whether the rest of the route renders… Instead, you should do the checks close to your data source or the component that'll be conditionally rendered." This matches `requireOwner`'s existing comment and is why Task 2 keeps per-page checks.
- `03-api-reference/03-file-conventions/route-groups.md`: a route group is organization only (no URL segment); a group may or may not have its own layout; multiple **root** layouts cause a full page load on cross-group navigation, which this plan does not introduce (one root layout stays).
- Conflicts with accepted decisions: none. The plan changes route placement, which ADR-0006 left unresolved, so it needs the owner's approval (AGENTS.md section 5: routing architecture; resolving an unresolved ADR item). ADR-0014 keeps routes/layouts/proxy as app entry points; nothing here moves to a package.

## 5. Evaluation of the proposed direction

**A. Explicit route boundaries.** `(protected)` is a sound name and is free. Create it only around the existing `[userId]` tree; do **not** create empty `(public)` or `(auth)` groups: `/`, `/privacy` and `/auth/*` have no shared layout concern beyond what exists, and `auth/` already is a segment with its own layout. A group with no layout and no routes would be speculative.

**B. Layout responsibilities.**

| Responsibility                   | Verdict                                                                                                                                                                                                                                                                                                                                     |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Initial server-side redirect     | Already done by the proxy (with a full `next`) and `[userId]/layout.tsx`. A `(protected)` layout adds only a signed-in-only backstop for future protected routes that are not under `[userId]`. It reuses the memoized claims, so it costs one function call, no extra verification. Worth having; cannot carry `next`.                     |
| Authenticated shell              | **Not movable cheaply.** `AppShell` lives in the root layout and also serves public and auth pages for signed-in visitors. Moving it forks the shell, changes its lifetime (it would remount when navigating between `/` and the owner area) and removes the every-request user read from `/`. That is a product/UX-affecting decision: D2. |
| Providers                        | `RootProviders`, `UserProvider`, `RegionalProvider` are needed by public pages too (look/preferences follow the person to every page, ADR-0010). Stay at the root. `HomeProviders`, `NextCollectionNavigation`, `SettingsPageShell` are already scoped below the owner area.                                                                |
| Client-side gate / loading flash | None added. The backstop is a Server Component.                                                                                                                                                                                                                                                                                             |

**C. Security ownership.** Unchanged and documented in one place by Task 4: proxy = session refresh + coarse redirect; `requireOwner` = identity + ownership at every render boundary; `getCallerIdentity` = Server Actions; route handlers = `getVerifiedIdentity` + RLS; RLS = the final authority on rows. The group is not on this list.

**D. Public and shared resources.** Canonical records are addressed `/<ownerId>/home/{spaces,documents,dashboards}/<id>`, and `server-data`/`SpaceSource` read by `id` under RLS `owner_id = auth.uid()`; ownership comes from the row, not the URL. The `(protected)` group therefore does not couple ownership or visibility to presentation, **provided** a future public route resolves a record through its own read path with its own policy rather than by loosening `*_own` policies or reusing `requireOwner`. Task 2's test deliberately asserts a protected route needs the guard, not that the record type does. Nothing is added now (no `visibility` column, no permission service).

**E. The `Protected` component.**

| Option                                      | Verdict                                                                                                                                                                                      |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Restore unchanged                           | Impossible: no such component exists in this repository's history.                                                                                                                           |
| Restore with modifications / client wrapper | **Rejected.** A client-side gate flashes content or a loading state and would put a security decision in the browser.                                                                        |
| Reusable helper                             | **Exists:** `requireOwner` (+ `getVerifiedIdentity`). A second helper per kind of caller would be a redundant abstraction.                                                                   |
| Server-side layout boundary                 | **Recommended**, as the thin `requireSignedIn` backstop in `(protected)/layout.tsx`, retained from the unmerged WIP design because it is 19 lines, server-only and uses the memoized claims. |
| Retire                                      | Valid for the component; the layout backstop is what replaces its intent.                                                                                                                    |

## 6. Alternatives considered

|       | Option                                                                                                        | Changes                                           | Tradeoff                                                                                                                                                                      | Recommendation                         |
| ----- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| A     | No change; document the model in ADR-0006 only                                                                | docs                                              | Zero risk; keeps two sources of truth and no enforcement                                                                                                                      | Acceptable fallback                    |
| **B** | **`(protected)` group around `[userId]` + thin layout backstop + structural test + ADR-0006 amendment**       | ~23 file moves, 1 layout, 1 helper, 2 tests, docs | Small, URL-preserving, reversible by moving files back; backstop is redundant for today's routes (strictly weaker than `[userId]/layout.tsx`), valuable for tomorrow's        | **Recommended**                        |
| C     | B plus moving `AppShell`/providers from the root into `(protected)` and giving public/auth pages a lean shell | B + root layout split                             | Cleaner public pages and room for a future public route; changes shell lifecycle, preference sync and header on `/` and `/auth/*` for signed-in visitors; larger test surface | Defer until a public route exists (D2) |
| D     | Restore a client-side `Protected` wrapper                                                                     | components                                        | Flash of content, client-side security                                                                                                                                        | Rejected                               |

## Decisions requiring the owner

**D1. Adopt the `(protected)` route group (option B) or keep the current structure (option A)?**

- Context: ADR-0006 lists "which routes are protected" as unresolved; AGENTS.md section 5 requires approval to change routing architecture. The group did not exist on `main`, so this is a new structural decision, not a restoration.
- B: the group names the boundary, the backstop fails closed for future non-`[userId]` protected routes, and the structural test (Task 2) ends the "convention only" drift between folder layout, proxy rule and page guards. Cost: 23 file moves (history is preserved with `git mv`) and one more layout. Risk: low; no behavior change.
- A: no code change; add a short subsection to ADR-0006 stating the existing model. The drift risk remains, covered by review.
- **Recommendation: B.** The enforcement test is the real benefit; the group is what lets it be written without a hand-maintained list.

**D2. Move the authenticated shell and providers into `(protected)` now (option C)?**

- Context: the shell is in the root layout and shared with public/auth pages (verified). Public sharing is not being built.
- Moving it now means designing the public shell without a public route to design it against.
- **Recommendation: no.** Revisit when a first public route is specified. This plan leaves the root layout untouched, so the door stays open.

D1 is the only blocker for execution; D2 only records a deferral.

## Review Focus

Failure modes the tasks' tests do not otherwise exercise, with the task that owns each:

1. Soft navigation from the owner's area to another user's id after a hard load (layout not re-run): the page-level `requireOwner` must 404. Owned by Task 2 (structural test) plus the existing page tests.
2. Expired/invalid token on a hard load of a protected path where the proxy passes the request (e.g. token expires between proxy and render): redirect to sign-in, never a rendered shell. Owned by Task 3.
3. `next` containing a query string or look-alike prefix (`/x/homepage`, `//evil.example`). Owned by Task 1 (e2e) and the existing `route-access`/`safe-next` tests.
4. A folder under `(protected)` whose URL the proxy does not match. Owned by Task 2.
5. Signed-in visitor on `/` or `/privacy` still gets the account look and menu after the move (shell untouched). Owned by Task 5 (e2e `shared-look`, existing).

## Tasks

Order and dependencies: Task 1 (characterization) → Task 2 (move + guard) → Task 3 (backstop tests) → Task 4 (docs) → Task 5 (verification). Tasks 1 and 4's ADR text may start in parallel; Task 2 needs Task 1 merged green; Task 3 needs Task 2. Each task is a separate, reviewable commit; Task 2 is the only one that touches many files and is mechanical.

### Task 1: Characterize the redirect matrix before moving anything

**Files:**

- Modify: `apps/web/e2e/spaces.e2e.ts` or Create: `apps/web/e2e/protected-routes.e2e.ts` (follow the existing e2e naming; a new file is preferred so the spaces file stays about spaces)
- Modify: `apps/web/src/lib/supabase/middleware.test.ts`
- Test: both of the above

**Interfaces:**

- Consumes: existing `updateSession(request: NextRequest)`; Playwright `page`.
- Produces: tests that pass on `main` before any move and must pass unchanged after Task 2.

- [ ] **Step 1: Write the e2e matrix** in `protected-routes.e2e.ts`, one test per path in `/someone/home`, `/someone/home/documents`, `/someone/home/dashboards`, `/someone/settings`, `/someone/home/spaces?view=list`: `page.goto(path)` ends at `/auth/login?`, `new URL(page.url()).searchParams.get('next')` equals the requested path **including** the query, and the sign-in `h1` is visible.
- [ ] **Step 2: Write the public/auth negatives** in the same file: `/`, `/privacy`, `/auth/login`, `/auth/register`, `/auth/forgot-password` do not redirect (URL unchanged, status 200).
- [ ] **Step 3: Add to `middleware.test.ts`** a test named `keeps the query string in next when it redirects to sign in` asserting `location` is `/auth/login?next=%2Fsomeone%2Fhome%2Fspaces%3Fview%3Dlist`; and `treats an expired token like a signed-out request` using the file's existing claims stub returning `{ data: null }`.
- [ ] **Step 4: Run on unmodified `main` code:** `pnpm --filter web test -- middleware` and `pnpm --filter web exec playwright test protected-routes` (needs `pnpm exec playwright install chromium` once). Expected: all pass. If any fails, that is a pre-existing bug: stop and report it, do not fix inside this plan.
- [ ] **Step 5: Commit** (when authorized): `test: pin the protected-route redirect matrix`.

### Task 2: Create the `(protected)` group and its structural test

**Files:**

- Move (`git mv`): `apps/web/src/app/[userId]` → `apps/web/src/app/(protected)/[userId]` (23 files: layout, page, `home/**`, `settings/**`, their tests, `loading`/`error` files). No relative imports exist in them (verified); all use `@/` aliases.
- Create: `apps/web/src/app/(protected)/layout.tsx`, `apps/web/src/lib/access/require-signed-in.ts`, `apps/web/src/lib/access/require-signed-in.test.ts`, `apps/web/src/protected-routes.test.ts`
- Modify: `apps/web/src/lib/routing/route-access.ts` (comment only: point at `app/(protected)/[userId]/layout.tsx`), `packages/frontend/collection/README.md:14` (path in prose)

**Interfaces:**

- Produces: `requireSignedIn(): Promise<void>` in `lib/access/require-signed-in.ts`. Behavior: `if (fixtureModeEnabled()) return; const claims = await getVerifiedClaims(); if (!claims) redirect('/auth/login');`. Server-only by living under `lib/access/` (already in `architecture.test.ts`'s server-only list).
- Produces: `(protected)/layout.tsx` default export `ProtectedLayout({ children })` that awaits `requireSignedIn()` and returns `children`. Adds no wrapper element, provider or shell.

- [ ] **Step 1: Write the failing tests first.**
  - `require-signed-in.test.ts` (names): `returns without redirecting when claims verify`; `redirects to /auth/login when there are no claims`; `treats a failed claims read as signed out`; `does nothing in development fixture mode and never reads claims`; `ignores the fixture flag in production`. Model on [`require-owner.test.ts`](../../../apps/web/src/lib/access/require-owner.test.ts) mocks.
  - `protected-routes.test.ts`: a lexical filesystem scan in the style of `architecture.test.ts` with three assertions. (a) For every `page.tsx` under `app/(protected)`, the file source contains `requireOwner(`, except `[userId]/home/**/loading.tsx`/`error.tsx` (not pages). (b) For every `page.tsx` under `(protected)`, the URL derived by dropping `(group)` segments and replacing `[userId]` with `some-user` and any other `[x]` with `some-id` satisfies `isProtectedPath(url)`. (c) `(protected)/layout.tsx` exists and imports `requireSignedIn`. Expected today: FAIL (group does not exist).
- [ ] **Step 2: Run to verify failure:** `pnpm --filter web test -- require-signed-in protected-routes`. Expected: FAIL (module/dir missing).
- [ ] **Step 3: Move the tree** with `git mv 'apps/web/src/app/[userId]' 'apps/web/src/app/(protected)/[userId]'`.
- [ ] **Step 4: Implement** `requireSignedIn` and `ProtectedLayout` per Interfaces. Reuse `getVerifiedClaims` from `@/features/auth/server/session`; do not call `getClaims()` directly (`identity-boundary.test.ts` must stay unchanged).
- [ ] **Step 5: Update the two prose references** listed under Files.
- [ ] **Step 6: Run** `pnpm --filter web test`, `pnpm typecheck`, `pnpm lint`, `pnpm boundaries`, `pnpm deps`. Expected: PASS, no new Knip findings, `identity-boundary.test.ts` and `architecture.test.ts` untouched and green.
- [ ] **Step 7: Confirm URL preservation:** `pnpm --filter web build` and compare the route table's owner-area rows with `main`'s build output (same paths, same dynamic markers). Then rerun Task 1's e2e unchanged: PASS.
- [ ] **Step 8: Commit** (when authorized): `refactor: group the signed-in owner area under (protected)`.

### Task 3: Prove the backstop and layout reuse independently of rendering

**Files:**

- Modify: `apps/web/src/lib/access/require-owner.request-scope.test.ts`
- Create: `apps/web/src/app/(protected)/layout.test.tsx`

- [ ] **Step 1: Write `layout.test.tsx`** with tests `redirects a signed-out request before rendering children` (mock `requireSignedIn` to throw the redirect; children not rendered) and `renders its children untouched for a signed-in request` (output equals `children`).
- [ ] **Step 2: Extend `require-owner.request-scope.test.ts`** with `verifies claims once when the protected layout, owner layout and page all run`, calling `requireSignedIn()` then `requireOwner()` twice inside one `cache` scope and asserting the claims stub was called once. This is the proof that the backstop adds no verification cost.
- [ ] **Step 3: Run** `pnpm --filter web test -- layout require-owner`. Expected: PASS.
- [ ] **Step 4: Commit** (when authorized): `test: prove the protected layout adds no extra verification`.

### Task 4: Record the model (docs and ADR)

**Files:**

- Modify: `docs/architecture/decisions/0006-authentication-with-supabase.md` (add a dated amendment; narrow the "Which routes are protected" Unresolved bullet to what remains open: the product's eventual protected set beyond the owner area)
- Modify: `.agents/task-scope.md` (task scope entry, written **before** Task 2 runs, per `.agents/README.md`)
- Modify: `/Users/hanaasadoqi/Projects/worktrees/INVENTORY.md` (entry details after execution)

- [ ] **Step 1: Add the task-scope entry** with exact moves (the 23 files), exact creates (4 files), exact updates (2 comment/prose files), budgets (zero migrations, zero dependencies, zero URL changes).
- [ ] **Step 2: Write the ADR-0006 amendment** (owner-approved wording only): route group is organization, not security; the five access layers in section 1 with their owners; per-page `requireOwner` remains required; the backstop's `next` limitation; public routes, when specified, must resolve records through their own read path and policy and must not reuse `requireOwner` or loosen `*_own` policies; correct "Next.js 16.3.8" to the declared version if the owner agrees.
- [ ] **Step 3: Run** `pnpm format:check`; confirm no other doc still names `app/[userId]/…` (`git grep "app/\[userId\]" -- . ':!docs/archive' ':!docs/superpowers'` returns only intentionally historical `task-scope.md` entries).

### Task 5: Verification and handoff

- [ ] **Step 1: Run** `pnpm verify` with CI's placeholder Supabase values. Expected: exit 0.
- [ ] **Step 2: Manual, fixture dev server** (`SYNAPCITY_DEV_AUTH=fixture`): hard-load `/fixture-user/home/spaces`, client-navigate home → spaces → a document → dashboard → settings and back, refresh on each; confirm the sidebar/panel state survives soft navigation exactly as on `main` and no loading flash is new.
- [ ] **Step 3: Manual, real Supabase project (cannot run in CI):** signed out, open each protected path (redirect with `next`, back after sign-in); sign in as user A and open user B's id (404); delete the session cookie and soft-navigate (next request redirects); sign out in another tab and submit a Server Action (message "Sign in again…"). Record which of these ran.
- [ ] **Step 4: Report** per AGENTS.md section 9: what changed, preserved behavior, decisions left open (D2), exact commands run and not run, pre-existing failures (`global-panel.e2e.ts` lock-and-reveal test noted in `task-scope.md`).

## Acceptance criteria

- Every URL in section 1's table behaves as on `main`: same status, same redirect target, same `next` value.
- Anonymous requests to every `(protected)` page redirect to `/auth/login?next=<path+query>` (Task 1 e2e, run before and after the move).
- A signed-in user requesting another user's id gets 404 on hard load; each page still calls `requireOwner` (Task 2 structural test).
- `getClaims()` is called only where `identity-boundary.test.ts` already allows it; that test and `architecture.test.ts` are unchanged.
- The backstop adds no second token verification (Task 3 request-scope test).
- Route handlers and Server Actions are unchanged and keep their existing tests; RLS migrations untouched.
- `pnpm verify` exits 0; manual checks in Task 5 are reported as run or not run.

## What this plan does not verify

- RLS behavior against a live database is not re-tested here; `supabase/tests/*.sql` are not part of any automated gate (pre-existing). Task 5 step 3 exercises the owner boundary through the app only if a real Supabase project is available.
- The previous implementation's `Protected` component, if one existed outside this repository, was not inspected (NOT VERIFIABLE).
- Browser behavior of the authenticated shell in CI: the signed-in e2e groups are skipped in CI today (fixture-gated), so shell lifetime across soft navigation relies on the manual check in Task 5.

## Risks

| Risk                                                                                                                | Likelihood                                                 | Mitigation                                                                                    |
| ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| A moved test or story reads a path by string                                                                        | Low (grep found only prose and `task-scope.md` references) | Task 2 step 6–7                                                                               |
| Backstop redirect loses `next`                                                                                      | Known                                                      | Only reached when the proxy missed; documented in the ADR; proxy remains the primary redirect |
| False confidence that the group "protects"                                                                          | Medium (human)                                             | ADR wording, layout doc comment, structural test asserts per-page guards                      |
| Future public route copies `requireOwner` or widens RLS                                                             | Medium over time                                           | ADR amendment sentence; D2 revisit trigger                                                    |
| Merge conflicts with open branches that touch `app/[userId]/**` (e.g. `feat/resource-views`, `feat/create-records`) | Medium                                                     | Land Task 2 when those branches are merged or rebased; `git mv` keeps rename detection        |

## Implementation record (2026-10-29)

Deviations from the plan as written, and what the work found:

- **Task 1 trimmed.** `middleware.test.ts` already asserted the query-string `next` redirect and the signed-out case, so only the e2e matrix was added (`apps/web/e2e/protected-routes.e2e.ts`, 11 tests: 5 protected paths, the bare `/<userId>`, 5 public and auth paths).
- **Structural test split by addressing.** `protected-routes.test.ts` requires `requireOwner` only for pages under `[userId]`. Any other page in the group must call a guard from `OTHER_ACCESS_GUARDS` (`getVerifiedIdentity(`, `requireSignedIn(`), so an owner-specific guard is not made universal. It also asserts `[userId]/layout.tsx` calls `requireOwner`, the group layout calls `requireSignedIn`, and no `app/[userId]` exists outside the group (guards against a later merge re-creating the old path).
- **The bare `/<userId>` is not matched by the proxy** (`isProtectedPath('/some-user')` is false). History: the rule came from commit `0261bd20` as a successor to protecting `/home`; no document records the omission as policy. Reason it is hard to change: a single-segment path cannot be told from a public page by shape. Preserved, pinned by tests, listed in the structural test with a reason, and recorded in ADR-0006.
- **One behaviour difference found by the new e2e.** The group layout runs before `requireOwner`, so a signed-out visit to a bare `/<userId>` now goes to `/auth/login` with no `next` (a layout cannot read the request path). Before, `requireOwner` produced `next=<id>/home`. Signing in lands on the person's own home either way; only a stranger's id differs (own home instead of a 404 after sign-in). Based on code and the existing unit test; not re-run on `main`. Accepted and documented, not worked around.
- **Request-scope test.** It proves `requireSignedIn` and `requireOwner` read claims only through the shared `getVerifiedClaims`. It does not prove React's real `cache` scopes that reader to one request: the mock memoizes for the module's life. The test comment says so.
- **Integration.** `git merge-tree` with a dangling commit of this change merges cleanly into `origin/main` (`71ec2d07`). The older stacked branches already conflict with `main` and gain rename conflicts on moved paths (`feat/resource-views` 0 to 22). No other worktree or branch was modified.

Evidence, final tree: `pnpm verify` exit 0 (web 735 tests; e2e 77 passed, 9 skipped; Storybook 530; build); build route table identical to the baseline; e2e `protected-routes`, `spaces`, `auth` 47 passed; fixture-mode e2e 7 passed and 1 failed (`global-panel.e2e.ts:103`, existing); manual fixture-mode navigation check passed (soft navigation across home, spaces, documents, dashboards, record page, back, forward, refresh; another id is 404). Not verified: live Supabase (expired session, two real accounts, Server Action after sign-out in another tab), React `cache` across a real request, the `shared-look` authenticated test (needs the docs dev server), and RLS (not touched).
