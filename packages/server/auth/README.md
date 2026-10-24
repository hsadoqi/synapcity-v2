# @synapcity/server-auth

Owns: the server identity boundary. It defines the `IdentityProvider` port, the policy that turns a provider's answer into a verified identity, and the ownership rule. Milestone 7 adds auth operations and verified-caller helpers here.

Runtime: server only. The root entry starts with `import 'server-only'`. Category rules: [server README](../README.md) and [ADR-0014](../../../docs/architecture/decisions/0014-multi-app-package-boundaries.md).

## Public interface

`@synapcity/server-auth` (root entry):

| Export                                 | Meaning                                                                                                                     |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `IdentityProvider`                     | Port with `claims()` (locally verified session claims) and `user()` (the provider's own record, a network call)             |
| `ProviderOutcome`, `ProviderFailure`   | A provider's provider-neutral answer: `user`, `none`, `unreachable` or `refused`, with error code and status                |
| `verifyIdentity(provider)`             | Claims path, for reads. Anything but a user with an id is `signed-out`                                                      |
| `verifyIdentityWithProvider(provider)` | Fresh path, for writes (ADR-0006 "`getUser()` where fresh user data is required"). An unreachable provider is `unavailable` |
| `IdentityVerification`                 | `{ result, failure? }`: the `IdentityResult` from `@synapcity/domain-identity` and the provider error detail for logging    |
| `isOwner(result, userId)`              | True only for a verified identity whose id equals the supplied id. The supplied id is compared, never trusted               |

`@synapcity/server-auth/testing`: `fakeIdentityProvider({ claims, user })`, a controlled provider that counts calls. Tests, stories and dev hosts only.

The Supabase implementation of the port is `supabaseIdentityProvider` in `@synapcity/server-supabase`. Hosts build a provider per request from a request-bound client.

## Rules

- The package never logs, never reads environment variables and never knows about development fixture mode; hosts keep those (ADR-0006, development amendment).
- A provider's display data (`user_metadata`, names, emails) never becomes identity.

## Scripts

`lint`, `check-types`, `test`, `test:coverage`. Tests load the root entry through the `serverOnlyAlias` from `@synapcity/dev-vitest-config/server-only`.
