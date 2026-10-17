# ADR-0007: Auth responsibility boundaries and package layout evaluation

**Status:** Accepted (2026-10-17)  
**Date:** 2026-10-13; layout selected 2026-10-17  
**Deciders:** Hanaa Sadoqi (repository owner).

## Context

[ADR-0006](0006-authentication-with-supabase.md) chooses Supabase Auth and cookie-session behavior. Its initial implementation was placed in `apps/web`; the owner clarified on 2026-10-13 that this was not an enduring restriction on auth packages or splitting code.

The current code distributes forms, session helpers, route policy and actions among `components/auth`, `lib/auth`, `lib/supabase` and route files. Profile editing depends on auth-specific presentation/types. [Architecture principles](../principles.md), section 6, asks for responsibility boundaries before package boundaries. That ordering is a way to assess package choices, not a preference against them.

The filename retains the earlier proposal's slug to preserve links and ADR identity. The app-only proposal is replaced by the evaluation below; no package layout is selected yet.

## Decision

If accepted, define responsibilities independently of their eventual physical location:

- Authentication owns sign-in/up, confirmation/resend, recovery/password changes, sign-out, verified identity access, display-user mapping and client refresh coordination.
- Account management owns existing display-name editing, metadata preservation and pure name validation. Registration may use that pure validator; account presentation does not depend on auth form state.
- Common form presentation owns field/message rendering and reusable error-focus behavior. Auth-specific confirmation/edit state stays with the auth capability unless actual consumers justify broader reuse.
- Application policy owns existing destinations, safe redirects, flow/recovery URLs, route classification and user-area ownership requirements. A reusable identity helper can support that policy without owning application URLs or future resource permissions.
- Provider/platform adapters own SDK setup, environment/cookie integration and request-bound client provisioning. Their placement follows the chosen runtime boundary.
- Framework routes/layouts/proxy remain application entry points and composition. Packages depend on explicit contracts, never on imports from an app.

Evaluate all candidates before selecting topology:

| Candidate                               | What it could own                                                             | Main question                                                                            |
| --------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| App-local modules                       | Auth/account implementation and provider/platform adapters within the web app | Does a package boundary add enough isolation/API value to justify its configuration?     |
| One cohesive auth package               | Auth capability with explicit client, server and safe shared entry points     | Can its runtime dependencies and public API remain clear, with appropriate app adapters? |
| Auth feature plus auth service packages | UI/workflow composition separately from provider/identity operations          | Do those responsibilities change and test independently enough to justify two contracts? |
| Account separation with any candidate   | Profile capability as a sibling module or package                             | Is separate package ownership useful now, or is a module sufficient?                     |

A second app or multiple consumers is not a prerequisite. `apps/web` is already a real consumer. Cohesion, independent testing, enforceable imports, runtime isolation and change coupling can justify a package with one consumer. Conversely, a directory's size alone does not determine the layout.

## ARF-00 evaluation (2026-10-17)

**Selection:** on 2026-10-17 the owner selected **A, app-local modules, with account as a sibling module** (D as a module), the recommendation below. The rest of this section is the evaluation that selection was made from.

**Evidence base:** `fix/auth-ui` at `3395298`, read without changes. Import lists come from the files' own `import` lines, not from the earlier plan inventory. The "concurrent uncommitted work" the plans mention (`AuthConfirmation`, `useFocusFirstError`, resend controls, flow-specific recovery) is now committed on this branch. No runtime check was run for this comparison.

### What the code looks like today

About 2,150 lines of auth/account source and 650 lines of tests, all in `apps/web/src`. Every unit test sits beside a pure helper. Components, actions and adapters have no unit tests; `apps/web/e2e/auth.e2e.ts` and `home.e2e.ts` reach some of them through the browser.

| Responsibility                           | Files today                                                                                                                                  | Runs on                        | Framework/provider imports                                                      |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------- |
| Auth operations (Server Actions)         | `app/auth/actions.ts` (7 actions plus the `AuthState` type)                                                                                  | Server (`'use server'`)        | `next/cache`, `next/navigation`, server Supabase client                         |
| Verified identity                        | `lib/auth/session.ts`, `lib/auth/profile/profile.ts` (display mapping)                                                                       | Server; mapping is pure        | `react` `cache`, server Supabase client                                         |
| Client refresh coordination              | `components/auth/provider/user-provider.tsx`, `lib/auth/auth-events`                                                                         | Client                         | `next/navigation` router, browser Supabase client, `@supabase/supabase-js` type |
| Auth screens and forms                   | `components/auth/{login,register,forgot-password,update-password,shell,buttons,display}`                                                     | Mostly client                  | Server Action references from `app/auth/actions.ts`                             |
| Account profile                          | `app/[userId]/settings/{page,actions}.ts`, `components/auth/profile/profile-form.tsx`, `lib/auth/name`, `withFullName` in `lib/auth/profile` | Server action plus client form | `next/cache`, server Supabase client                                            |
| Common form presentation                 | `components/auth/form/{auth-field,form-message,use-focus-first-error,resend-button}`                                                         | Client                         | `@synapcity/frontend-ui` only                                                   |
| App policy (paths, redirects, ownership) | `lib/auth/{home-path,safe-next,auth-flow,require-owner}`, `lib/supabase/route-access.ts`                                                     | Pure, except `require-owner`   | `require-owner` uses `next/navigation` and `session.ts`                         |
| Provider/platform adapters               | `lib/supabase/{client,server,middleware,env}.ts`, `lib/auth/origin`                                                                          | Browser, server, proxy         | `@supabase/ssr`, `next/headers`, `next/server`                                  |

Coupling the refactor has to fix, whichever layout is chosen:

1. **Types come from a Server Action file.** Fifteen files import from `app/auth/actions.ts`, a route-owned `'use server'` module, and twelve of them take the `AuthState` type from it. `form-message.tsx`, which is generic presentation, imports that type too.
2. **Account depends on auth presentation.** `profile-form.tsx` renders `auth-field`, `form-message` and `use-focus-first-error`, so the profile form inherits `AuthState`'s shape.
3. **Policy sits in the adapter.** `lib/supabase/middleware.ts` imports `home-path` and `safe-next`, and `route-access.ts` (route classification) lives in the Supabase folder.
4. **Shared UI hardcodes app routes.** `@synapcity/frontend-ui`'s `auth-buttons.tsx` links to `/auth/login` and `/auth/register` (ADR-0009's subject).
5. **Plan drift.** `components/auth/form/resend-button.tsx`, used by both resend controls, is missing from the parent plan's migration table.

All five are responsibility problems. None of them needs a package boundary to fix. A package would make 1 and 2 impossible to reintroduce silently; a module layout relies on review, or on an import rule if one is adopted later.

### Who owns what under each candidate

| Concern                                       | A. App-local modules                           | B. One auth package                                                                                     | C. Auth feature + auth service packages                   | D. Account separation (applies to A, B or C) |
| --------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | -------------------------------------------- |
| Server Actions (`'use server'` entry points)  | `features/auth/server/actions.ts` in the app   | App keeps thin `'use server'` wrappers that call package operations (see request context below)         | Same as B; wrappers call the service package              | Profile action beside the account module     |
| Session access (`getClaims`, request `cache`) | `features/auth/server/session.ts`              | Package `./server` entry, given a request-bound client by the app                                       | Service package `./server`                                | Not affected                                 |
| Provider clients (`@supabase/ssr`)            | `lib/supabase` in the app                      | App, because `createServerClient` needs `next/headers` cookies; package declares a client-provider type | App, or the service package with a cookie-store contract  | Not affected                                 |
| Browser events (`onAuthStateChange`, refresh) | `features/auth/client`                         | Package `./client` entry; router refresh passed in as a callback or used via a Next peer dependency     | Feature package `./client`                                | Not affected                                 |
| Forms and screens                             | `features/auth/components`, `components/forms` | Package `./client`; common form presentation could go to `@synapcity/frontend-ui` instead               | Feature package                                           | Account form uses common presentation only   |
| App routing policy (paths, safe-next, guard)  | `lib/routing`, `lib/access`                    | Stays in the app; package receives destinations as arguments                                            | Stays in the app                                          | Not affected                                 |
| Framework-independent contracts               | `features/auth/shared`                         | Package `./shared` entry (types, error mapping, event predicate)                                        | Service package `./shared`                                | `features/account/shared` or its own package |
| Framework-specific code                       | App only                                       | Package `./server` and `./client` depend on Next.js and Supabase SDKs                                   | Both packages depend on Next.js; service also on Supabase | Same as its host                             |

### Comparison

| Criterion                | A. App-local modules                                             | B. One auth package                                                                                                                              | C. Feature + service packages                                                       |
| ------------------------ | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| Cohesion                 | High once files move; one folder per responsibility              | High; same grouping with an `exports` map                                                                                                        | Split by layer, not by change. Sign-in UI and its operation usually change together |
| Independent tests        | Existing Vitest setup in `apps/web` already runs them            | Package gets its own Vitest config (the `dev-vitest-config` pattern exists)                                                                      | Two configs                                                                         |
| Enforced imports         | By review only; automated enforcement is an open decision        | `exports` blocks deep imports from other workspaces. It does not stop the app from bypassing the package by writing its own copy                 | Same as B, across two boundaries                                                    |
| Request context          | Direct: actions call `createClient()` from `lib/supabase/server` | Needs a contract: the app passes a request-bound Supabase client (or a cookie store) into every server operation                                 | Same contract, plus a feature-to-service contract                                   |
| Exported API             | None                                                             | `./server`, `./client`, `./shared` entry points to design, name and keep stable                                                                  | Two sets                                                                            |
| Coupling to Next.js      | Already present in the app                                       | Package takes `next` as a peer dependency (as `@synapcity/frontend-site` does). Server-only code in a package conflicts with current conventions | Same                                                                                |
| Governance cost          | None beyond this ADR                                             | New category ADR (server-capable code is app-only today), glossary naming check, checklist answers, Knip/Turbo/tsconfig entries, lockfile change | Twice B's cost                                                                      |
| Maintenance              | Lowest. Moves are plain file moves within one tsconfig           | Moderate. Every new auth flow touches the package API and an app wrapper                                                                         | Highest                                                                             |
| Fixes coupling items 1–5 | Yes                                                              | Yes                                                                                                                                              | Yes                                                                                 |

**D. Account separation.** A sibling module (`features/account`) is enough today: one form, one action, one validator and one metadata helper, under 200 lines. A separate package would hold less code than its configuration. It becomes worth revisiting with the profile-storage decision, which this ADR leaves open.

### Recommendation: A, app-local modules, with D as a sibling module

Choose **A** now, laid out as the parent plan's migration map already describes, with account as a sibling module (`features/account`) rather than a package.

Why:

- Every coupling problem found is fixed by moving types and files, not by a package boundary.
- The parts that would make a package valuable are its framework-independent pieces (types, error mapping, path and flow helpers). They are about 300 lines and already have tests where they are.
- The parts that carry the risk (Server Actions, cookie-bound clients, `next/navigation` redirects) are tied to Next.js request handling. A package would need a request-adapter contract plus app wrappers around every action. That adds code without removing any, and it needs a new workspace category, since conventions keep server code in apps.
- Moving from A to B later is a mechanical move of `features/auth` into a package plus the adapter contract. Moving back from B is the same work in reverse plus undoing the governance changes. A keeps that option cheap.

Tradeoffs accepted with A:

- Import boundaries are enforced by review only. If that becomes a problem, an import-restriction lint rule inside the existing ESLint setup is the cheapest fix. Choosing it is outside this ADR, since boundary enforcement is an open decision.
- A package would read as a stronger architecture signal in a showcase repository. This recommendation does not weigh that over cost, but the owner may.

Revisit B when any of these is true: a second app or service needs sign-in; auth code needs to be tested without the web app's Next.js environment; or review keeps catching boundary violations that a package `exports` map would have blocked.

### If the owner chooses B instead

What the package layout would need before ARF-01, all subject to separate approval:

- **Category amendment.** Current categories are `dev` and `frontend`; neither allows server-only code. B needs an ADR adding a category for server-capable, framework-specific code, and an update to `workspace-conventions.md`'s "Where code runs" section and the package checklist.
- **Name.** `@synapcity/<category>-auth` per the naming rule. "auth" is an implementation term, not a glossary product term, but the name still goes through the glossary naming check.
- **Exports.** `./shared` (types, error mapping, event predicate; no React or Next imports), `./server` (session readers and operations; server-only), `./client` (`'use client'` provider, hooks, forms).
- **Dependencies.** `next` and `react` as peer dependencies pinned like `@synapcity/frontend-site`'s; `@supabase/supabase-js` for types and operations. `@supabase/ssr` stays in the app.
- **Request-adapter contract.** Server operations take a request-bound Supabase client from the app (for example a `getClient(): Promise<SupabaseClient>` argument), so the package never imports `next/headers`.
- **Server Actions stay in the app.** The app keeps `'use server'` entry points that call package operations. Whether `'use server'` modules inside a workspace package work is not stated in the installed Next.js 16.3.8 docs; that is NOT VERIFIED, and keeping actions in the app avoids depending on it.
- **Bundling.** No `transpilePackages` entry is needed: the installed Next.js 16.3.8 docs (`next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/transpilePackages.md`) say Turbopack and webpack (App Router) transpile workspace packages automatically.
- **Tooling.** Package `package.json` with `exports`, `tsconfig.json`, `vitest.config.ts`, `eslint.config.mjs`, README with an `Owns:` line, a Knip workspace entry if needed, and a lockfile update.

### Unchanged by this evaluation

Provider and session behavior (ADR-0006), profile storage, URLs, ADR-0008 and ADR-0009 are untouched. The selection confirms the parent plan's app-local migration map as the destination map (with `resend-button.tsx` added). No workspace category, package or governance amendment is needed for A. Execution budgets are set by ARF-01's manifest before any source moves.

## Scope

Responsibility classification and evidence-based comparison of app-local and package layouts for current auth/profile functionality. [ARF-00 in the foundation plan](../../superpowers/plans/2026-10-13-auth-refactor-foundation.md) owns the comparison and review deliverable. The [parent plan](../../superpowers/plans/2026-10-13-auth-refactor.md)'s app-local migration map is the selected destination map.

## What this does NOT decide

The final package count, names, categories, exported APIs or framework coupling; provider/session changes; protected URL selection; schemas/profile storage; roles/sharing; general state management; deployment; or auth requirements for other apps. No existing open decision becomes settled by a successful experiment or by this proposal.

## Unresolved

- Resolved 2026-10-17: candidate A selected (see the evaluation above). The workspace-conventions category question no longer applies, because A creates no package. It returns if a package is reconsidered.
- The [package checklist](../package-creation-checklist.md) requires a real use case and responsibility; it does not require two consumers.
- Auth metadata and the approved `profiles` table remain distinct sources; future profile storage/ownership is a separate decision.
- Automated import-boundary enforcement remains open; no enforcement tool is selected.

## Governance boundary

The owner approved correcting the restrictive documentation, then selected layout A on 2026-10-17 after the ARF-00 comparison. Package creation still requires a new decision. Acceptance of responsibility principles alone does not approve physical destinations. A fresh exact mutation manifest must preserve concurrent tracked/untracked work.

## Integration expectations

Preserve current URLs, flow/recovery semantics, client/server separation, safe redirects, server verification, request-scoped caching, event filtering, confirmation/edit/resend behavior and accessibility. UI metadata never authorizes resource access.

Shared presentation stays free of provider/session behavior. An auth service package may depend on the Supabase SDK when its responsibility requires it; the UI package's constraints are not a universal ban on provider dependencies in other packages. Request/platform context reaches operations through an explicit adapter contract when they cannot construct clients independently. No package imports app code or exposes server secrets to client entry points.

## Verification expectations

ARF-00 compares actual imports/consumers and states the candidate recommendation, runtime contracts, exact destinations, governance amendments and test plan. After owner selection, rewrite the candidate inventory and scoped tasks for that layout before executing them. Verify behavior with appropriate tests/manual evidence and the root gate; report provider flows and uncovered behavior separately. No runtime verification is claimed here.

## Reconsideration conditions

Observed coupling, runtime needs, testing/API boundaries or maintenance costs differ from the selected design. Reconsideration may lead to fewer or more packages; it is not contingent on another app appearing.
