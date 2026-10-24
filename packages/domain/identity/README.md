# @synapcity/domain-identity

Owns: portable identity contracts. Milestone 4 adds the verified-identity result that server code receives from the identity boundary; Milestone 7 adds the credential, profile, name and avatar contracts.

Runtime: portable TypeScript with no runtime dependency. Category rules: [domain README](../README.md) and [ADR-0014](../../../docs/architecture/decisions/0014-multi-app-package-boundaries.md).

## Public interface

`@synapcity/domain-identity` (root entry):

| Export             | Meaning                                                                            |
| ------------------ | ---------------------------------------------------------------------------------- |
| `VerifiedIdentity` | `{ userId }`: the provider subject of the verified caller                          |
| `IdentityResult`   | `verified` with an identity, `signed-out`, or `unavailable` (provider unreachable) |

## Rules

- A `VerifiedIdentity` comes only from a provider's verification of the session (see `@synapcity/server-auth`). Never build one from display data or from an ID a caller supplied.
- Development fixture identities are never represented here; fixture mode stays in the host app (ADR-0006, development amendment).
- Fields are added when a real consumer needs them.

## Scripts

`lint`, `check-types`. There are no tests: the package exports types only, which its consumers' type checks and tests exercise.
