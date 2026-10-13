# ADR-0007: App-local auth and account ownership

**Status:** Proposed  
**Date:** 2026-10-13  
**Deciders:** Hanaa Sadoqi (repository owner); acceptance pending.

## Context

[ADR-0006](0006-authentication-with-supabase.md) chooses Supabase Auth and explicitly keeps its implementation inside `apps/web`. The current working tree distributes forms, session helpers, route policy and actions among `components/auth`, `lib/auth`, `lib/supabase` and route files. Profile editing depends on auth-specific presentation and types. Adding a workspace package would not itself clarify these responsibilities.

[Architecture principles](../principles.md), section 6, requires responsibility boundaries before package boundaries. This proposal implements that reasoning within the app and leaves the existing provider/session choice intact.

## Decision

If accepted:

- One app-local `features/auth` module owns authentication flows, session readers, display-user mapping and client refresh coordination, with explicit `server`, `client`, `shared` and `components` divisions.
- A sibling `features/account` module owns the existing display-name edit, metadata-preservation helper and pure name validation. Registration may depend on account's pure name validator; account code does not depend on auth form state or presentation.
- `components/forms` owns the existing generic field/message rendering and error-focus hook. Its contracts are minimal presentation shapes rather than `AuthState`.
- `lib/routing` owns existing destinations, safe-next validation, flow/recovery URL helpers and route classification. `lib/access` owns the existing user-area owner guard. These are app-specific policies, not a new routing/permission architecture.
- `lib/supabase` continues to own environment/client/cookie integration. App routes, layouts and proxy remain framework entry points and composition.
- No workspace auth or services package is created. No broad barrel mixes server and client exports.

These are proposed internal technical names, not new product terminology.

## Scope

Ownership and import direction of the current web auth/profile implementation. Exact files and migration sequence are in the [parent plan](../../superpowers/plans/2026-10-13-auth-refactor.md); observable requirements are in the [spec](../../superpowers/specs/2026-10-13-auth-refactor-design.md).

## What this does NOT decide

Auth provider, session model, protected URL selection, schemas, profile storage, roles, sharing, global package-category rules, state management, deployment or authentication for other apps. It neither supersedes nor accepts unresolved items in ADR-0006.

## Unresolved

- Auth metadata and the approved `profiles` table remain distinct existing sources; future profile ownership/storage requires its own decision.
- Workspace extraction is deferred until a real consumer or enforceable isolation benefit justifies it.
- Automated import-boundary enforcement remains outside this proposal. No tool/dependency is selected.

## Governance boundary

The repository owner must explicitly accept this ADR before code ownership is changed. Authorizing creation of this file is not acceptance or execution authority. An executing task also needs an approved exact mutation manifest, numeric budgets and recovery of uncommitted originals.

## Integration expectations

Preserve current URLs, callback flow reasons, safe redirect encoding, server identity checks, request-scoped caching, provider event filtering and accessible form behavior. UI display metadata cannot authorize resource access. Shared packages never import app code or Supabase.

Account's form uses common presentation without depending on auth implementation. Auth registration's dependency on account name validation is narrow and pure. Resolve all consumers during each move; do not leave duplicate implementation copies.

## Verification expectations

Follow the spec's invariants and [foundation tasks](../../superpowers/plans/2026-10-13-auth-refactor-foundation.md). Preserve all moved helper assertions, verify no old-path consumers remain, run web tests/types and appropriate browser checks, then the root gate. Report unverified provider flows and pre-existing failures separately. No implementation verification has run for this Proposed ADR.

## Reconsideration conditions

A second runtime/consumer needs the same capability, an app-local boundary is repeatedly bypassed, account behavior requires independent ownership, or a specific enforcement requirement makes a package worthwhile. Reconsideration does not automatically authorize extraction.
