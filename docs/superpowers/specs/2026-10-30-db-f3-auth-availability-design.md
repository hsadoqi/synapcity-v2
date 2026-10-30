# F3: Auth Availability

**Status:** Proposed. Implementation-ready; no blocking decisions.
**Date:** 2026-10-30
**Roadmap:** [database execution roadmap](../plans/2026-10-30-database-execution-roadmap.md), slice F3
**Contracts:** [database architecture handoff](2026-10-30-database-architecture-handoff.md) INV-4 (fail visibly)
**Branch:** `fix/f3-auth-availability` (no database change, so no `db/` prefix)

## A. Identity and scope

- **Capability:** when Supabase Auth cannot be reached, a protected page says the service is unavailable (HTTP 503) instead of redirecting to sign-in as if the person were signed out.
- **Problem:**
  - ID-02: the proxy discards the `getClaims()` error, so an outage reads as signed-out.
  - ID-03: `createRequestClient`'s `setAll` ignores its cache-header argument, so `Cache-Control`, `Expires` and `Pragma` from a token refresh are dropped.
- **Exists:**
  - `apps/web/src/proxy.ts` and `apps/web/src/lib/supabase/middleware.ts`;
  - the session module in `apps/web/src/features/auth/server/session/`, whose `getVerifiedIdentity()` returns a `status`;
  - `packages/server/supabase/src/request-client/`;
  - `apps/web/src/components/route-messages/route-error-message.tsx`.
- **In scope:** a three-state result (`verified | signed-out | unavailable`) through the proxy and the session module; a 503 response for protected routes; header forwarding.
- **Out of scope:** retry and backoff; monitoring.
- **Dependencies:** none.

## B. Data model

No migration.

## C. Contracts

```ts
type ClaimsResult =
  | { status: 'verified'; claims: … }
  | { status: 'signed-out' }
  | { status: 'unavailable'; failure: ProviderFailure };
```

**Classification rule:** only an answered "no session" result counts as signed out: no token, an expired token that refresh refused with an Auth error code, or an invalid token. A network error, a 5xx, or a failure without a code is `unavailable`.

## D. Integration

- **Proxy:** `signed-out` keeps the existing redirect to sign-in. `unavailable` on a protected path returns a 503 rewrite to an app route that renders `RouteErrorMessage` with a Retry action. Public paths continue. `verified` is unchanged.
- **Session module:** `getVerifiedIdentity()` returns the same three states. Callers that treat anything not verified as signed out (`recordSpaceView`, `recordDashboardView`, the API routes) keep that behavior for writes. API routes return 503 instead of 401 when the state is `unavailable`.
- **Request client:** `setAll(cookies, headers)` applies every header it is given to the response, in the host binding, which is where Next.js owns the response.
- **Package ownership:** classification lives in `@synapcity/server-supabase` (`toProviderFailure` exists there); the response mapping lives in `apps/web`.

## E. Fixtures

Unit fixtures for Auth error shapes (an Auth error code, a network `TypeError`, a 503 body).

## F. UI

A 503 page using the existing `RouteErrorMessage`. Copy: the service can't be reached right now, with a Retry button that reloads. Focus moves to the heading on load. No new components.

## G. Verification

| Check             | How                                                                                                    | Must pass |
| ----------------- | ------------------------------------------------------------------------------------------------------ | --------- |
| Classification    | unit tests, each case in both directions (a signed-out shape is never `unavailable`, and vice versa)   | yes       |
| Header forwarding | request-client unit test: headers passed to `setAll` appear on the response                            | yes       |
| Proxy mapping     | unit test of the proxy with a stubbed claims result for each state                                     | yes       |
| Manual            | with the local stack's Auth stopped, a protected route returns 503 and no redirect; recorded in the PR | yes       |
| E2E               | none: the fixture build cannot simulate a provider outage (stated as not covered)                      | —         |
| Repository checks | `pnpm verify`                                                                                          | yes       |

## H. Completion

- **IC:** all of the above.
- **RC:** deployed, and a production smoke shows a normal sign-in still works.

## I. Risks

- The proxy runs on every request. Misclassifying either way locks people out or exposes protected pages; the two-direction tests guard against both.
- `@supabase/ssr` upgrades (MR-01) must rerun the header test.
