# ADR-0008: Auth actions and server operations

**Status:** Proposed  
**Date:** 2026-10-13  
**Deciders:** Hanaa Sadoqi (repository owner); acceptance pending.
**Implementation note (2026-10-14):** partially landed, status unchanged; see the end of this file.

## Context

Existing auth actions combine form extraction, validation, provider calls, error mapping, UI results and Next.js navigation. Registration and password recovery have meaningful provider workflows that can be tested independently of form rendering. Splitting every SDK call into a forwarding wrapper would add indirection with little benefit.

This proposal separates action and operation responsibilities across whichever layout is selected through [ADR-0007](0007-app-local-auth-and-account-ownership.md). Package selection and the corresponding foundation must be approved and verified before operation extraction. [ADR-0006](0006-authentication-with-supabase.md) continues to govern Supabase, sessions and configured redirect origins.

Declared versions inspected on 2026-10-13: Next.js 16.3.8, React 19.2.8, `@supabase/ssr` 0.12.7 and `@supabase/supabase-js` 2.117.3. No upgrade is included. [Next.js data security](https://nextjs.org/docs/app/guides/data-security) supports server-only operations, minimal return data and authorization at action boundaries; [Supabase SSR guidance](https://supabase.com/docs/guides/auth/server-side/creating-a-client?queryGroups=framework&framework=nextjs) distinguishes request/server and browser integration. Verify installed docs again before changing a version-sensitive API.

## Decision

If accepted:

1. Server Actions retain the existing entry points and own FormData extraction, boundary validation, safe field/message results, layout revalidation and navigation. `features/auth/server/actions.ts` is the app-local candidate path; package entry points/adapters depend on ARF-00's selected layout.
2. Ordinary server operations initially isolate registration and recovery. Proposed names are `registerWithPassword` and `requestRecoveryEmail`. They may live in an auth package, a separate auth service package or an app-local module. `features/auth/server/operations.ts` is one candidate path, not a placement restriction; operations are not automatically client-callable Server Action exports.
3. Server clients remain request-bound. ARF-00 must specify whether the owning platform adapter constructs the client for an operation or supplies an explicit client/factory capability across a package boundary. App-local construction is a candidate, not the required convention. No module singleton or cross-user client is permitted.
4. The action constructs the trusted callback destination from configured origin, safe paths and the existing flow discriminator, then passes that destination in typed operation input. The operation sets SDK options, performs the provider call and reduces the result.
5. Registration returns only confirmation-required, signed-in with user ID, or provider-error with an optional code. Preserve the unusual session-present branch without exposing a session/token.
6. Recovery returns accepted or rate-limited with the relevant code. Preserve the existing neutral accepted reply for other provider outcomes; do not inadvertently expose account existence or introduce a different failure policy.
7. Form-state types live in shared feature modules. Provider outcomes stay internal to the server and are not client form contracts.
8. Preserve the other auth/account operations, callback exchange and proxy refresh while assessing their ownership with the chosen layout. Further splitting and provider interfaces are permitted when they support a concrete boundary; avoid wrappers that merely forward a call without adding a useful contract.

## Scope

Action/operation responsibility separation, initially illustrated by two provider workflows. Physical placement and request-adapter contracts follow the selected topology. [Operation tasks](../../superpowers/plans/2026-10-13-auth-refactor-operations.md) define the work.

## What this does NOT decide

Package topology, provider portability, package export contracts, new auth methods, error-copy or password-policy changes, permissions architecture, general data access or schema/storage. Auth/service packages are candidates evaluated under ADR-0007, not excluded by this ADR. No broader client-callable behavior is intended.

## Unresolved

- Enforcement of server-only imports must use installed capabilities; any missing dependency or tooling change requires a separate approved scope.
- The operation contract, package exports and request-client provisioning must be specified for the selected layout. Further capability splitting remains available and needs an explicit reviewed scope.

## Governance boundary

The owner approves the operation contract and the selected request-adapter convention. Package selection under ADR-0007 remains an explicit prerequisite; neither acceptance nor task approval permits provider configuration changes, live email/account creation or unrelated source mutation.

## Integration expectations

Never authorize from `CurrentUser`, browser context or user-editable metadata. Preserve server verification appropriate to each existing operation. An action is its own entry point; page/layout gating alone does not secure it.

Do not return raw SDK users, errors, sessions, tokens or passwords. Keep only required scalar outcomes and error codes; public messages remain mapped by the action. Preserve `confirm`/`reset` flow parameters and existing `next` handling. Keep request cookies and session-refresh integration intact.

## Verification expectations

Operation tests assert SDK inputs and reduced outcomes, including the confirmation-required/session-present branches, recovery rate-limit distinction and neutral other-error behavior. Action integration tests invoke real action functions with provider/framework boundaries mocked, and assert validation, redirect/revalidation effects and safe results. Do not manually inject form state and call that action coverage.

Run the existing auth browser tests and root verification chain. Mock tests do not verify email delivery, OAuth or a live Supabase session. No implementation verification is claimed by this decision file.

## Reconsideration conditions

Another real consumer needs the operations, shared authorization/data rules require a broader server layer, or outcome reduction proves insufficient for an adopted workflow. Revise the scope explicitly rather than growing a general auth service by accumulation.

## Implementation note (2026-10-14)

Not accepted, and the operations extraction (`registerWithPassword`, `requestRecoveryEmail`) has not been done. What did land on `refactor/auth-actions`, so a later reviewer is not surprised:

- Item 7 only: `AuthState` moved out of the `'use server'` module to `lib/auth/auth-state`, with shared `authFailure`/`authSuccess` result builders, `field()` in `lib/auth/form-data` and `callbackUrl()` in `lib/auth/auth-flow`. These sit in the existing `lib/auth/` tree and are provisional until ADR-0007 selects a layout.
- Verification expectations: action integration tests now exist at `app/auth/actions.test.ts` and call the real action functions with Supabase and Next boundaries mocked. This needed a `@/` alias in `apps/web/vitest.config.ts`, a tooling change the owner approved.
- **Deviation from item 6:** `requestPasswordReset` now reports `over_request_rate_limit` as well as `over_email_send_rate_limit`, matching `resendConfirmation`. Previously the request limit was answered with the neutral "a reset link is on its way" reply. The owner approved this as a bug fix, so it departs from "preserve the existing neutral accepted reply for other provider outcomes"; the rate-limit codes carry no account information.
