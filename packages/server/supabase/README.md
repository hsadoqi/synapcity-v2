# @synapcity/server-supabase

Owns: the server-side Supabase adapter. It builds request-bound clients from host-supplied cookies and implements the identity boundary's `IdentityProvider` port for Supabase Auth. It is the only server package that imports `@supabase/*` (workspace conventions, vendor adapters). M7.2 added the provider auth operations (registration, recovery, email change and resend, own password reset, account linking and unlinking). Session-refresh helpers and profile-metadata translation join it as their code migrates (M7.2 Tasks B and C).

Runtime: server only. The root entry starts with `import 'server-only'`. Category rules: [server README](../README.md) and [ADR-0014](../../../docs/architecture/decisions/0014-multi-app-package-boundaries.md); auth rules: [ADR-0006](../../../docs/architecture/decisions/0006-authentication-with-supabase.md).

## Public interface

`@synapcity/server-supabase` (root entry):

| Export                                                                                                                                                                                      | Meaning                                                                                                                                                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createRequestClient(options)`                                                                                                                                                              | `{ url, publishableKey, cookies }` to a Supabase client for one request. `cookies` is the host's `{ getAll, set }`; a failed write during a Server Component render is ignored                                                                              |
| `registerWithPassword`, `requestRecoveryEmail`, `changeEmail`, `resendEmailChange`, `sendOwnPasswordReset`, `startAccountLink`, `disconnectAccount` (and their `*Input` / `*Outcome` types) | Provider auth operations. Each takes the request-bound client as its first argument and returns a plain scalar outcome (never an SDK user, session, token or error). They read no environment, cookies or fixture mode, call no `next/*` API and do not log |
| `RequestCookies`                                                                                                                                                                            | The cookie capability a host supplies                                                                                                                                                                                                                       |
| `supabaseIdentityProvider(client)`                                                                                                                                                          | `IdentityProvider` over `getClaims()` and `getUser()`: a retryable fetch error is `unreachable`, any other error `refused`, even when a user came back with it                                                                                              |
| `outcomeFromClaims(claims)`                                                                                                                                                                 | Already-verified claims (or none) as a `ProviderOutcome`, for hosts that memoize the claims read                                                                                                                                                            |

## Rules

- Build a client per request and never store it in a module variable (ADR-0008).
- The package never reads cookies, headers or environment variables itself; the host supplies them (ADR-0014 section 3).
- `@supabase/ssr` and `@supabase/supabase-js` are pinned to the same exact versions as `apps/web`, which still imports them directly until its remaining Supabase code migrates.

## Scripts

`lint`, `check-types`, `test`, `test:coverage`. Tests load the root entry through the `serverOnlyAlias` from `@synapcity/dev-vitest-config/server-only`.
