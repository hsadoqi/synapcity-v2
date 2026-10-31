# @synapcity/frontend-supabase

Owns: the browser half of the Supabase connection (ADR-0006, ADR-0014): the browser client factory and the rule for when an auth event means the page is out of date. It is the only frontend package that imports `@supabase/*`. Plan: [M7.3](../../../docs/superpowers/plans/2026-10-24-m7-3-frontend-supabase.md).

Runtime: browser, framework-neutral. It imports no `next` and no server code, and reads no environment: the host passes the project URL and publishable key. Dependencies: `@supabase/ssr` and `@supabase/supabase-js` at the versions `@synapcity/server-supabase` declares. Category rules: [frontend README](../README.md) and [ADR-0014](../../../docs/architecture/decisions/0014-multi-app-package-boundaries.md).

## Public interface

| Entry                          | Exports                                                                            |
| ------------------------------ | ---------------------------------------------------------------------------------- |
| `@synapcity/frontend-supabase` | `createBrowserSupabaseClient`, `BrowserSupabaseConfig`, `shouldRefreshOnAuthEvent` |

`createBrowserSupabaseClient({ url, publishableKey })` returns the client built by `createBrowserClient`. `shouldRefreshOnAuthEvent(event, sessionUserId, knownUserId)` is a pure rule: the session cookie stays the source of truth, so a refresh is a `router.refresh()`, never a copy of the session into state.

## What stays in the host

`apps/web` keeps `lib/supabase/env.ts` (the `NEXT_PUBLIC_*` values), `lib/supabase/client.ts` (a one-line `createClient()` that passes them in), and a small client wrapper that binds that factory to `features-auth`'s Next.js user provider. The provider and its routing behavior live in `@synapcity/features-auth`.

## Verification

`pnpm --filter @synapcity/frontend-supabase test`, `lint` and `check-types`; `pnpm boundaries` for the import rules.
