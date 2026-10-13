# ADR-0008: Auth actions and server operations

**Status:** Proposed  
**Date:** 2026-10-13  
**Deciders:** Hanaa Sadoqi (repository owner); acceptance pending.

## Context

Existing auth actions combine form extraction, validation, provider calls, error mapping, UI results and Next.js navigation. Registration and password recovery have meaningful provider workflows that can be tested independently of form rendering. Splitting every SDK call into a forwarding wrapper would add indirection with little benefit.

This proposal assumes [ADR-0007](0007-app-local-auth-and-account-ownership.md) is accepted and its foundation migration verified. [ADR-0006](0006-authentication-with-supabase.md) continues to govern Supabase, sessions and configured redirect origins.

Declared versions inspected on 2026-10-13: Next.js 16.3.8, React 19.2.8, `@supabase/ssr` 0.12.7 and `@supabase/supabase-js` 2.117.3. No upgrade is included. [Next.js data security](https://nextjs.org/docs/app/guides/data-security) supports server-only operations, minimal return data and authorization at action boundaries; [Supabase SSR guidance](https://supabase.com/docs/guides/auth/server-side/creating-a-client?queryGroups=framework&framework=nextjs) distinguishes request/server and browser integration. Verify installed docs again before changing a version-sensitive API.

## Decision

If accepted:

1. `features/auth/server/actions.ts` retains the existing action entry points and owns FormData extraction, boundary validation, safe field/message results, layout revalidation and navigation.
2. `features/auth/server/operations.ts` contains ordinary server functions for registration and recovery only. Proposed names are `registerWithPassword` and `requestRecoveryEmail`. It is not a `'use server'` action-export module.
3. Each operation creates its own request-bound server client using the existing server factory. No module singleton, universal auth client, injected provider interface or new dependency is introduced.
4. The action constructs the trusted callback destination from configured origin, safe paths and the existing flow discriminator, then passes that destination in typed operation input. The operation sets SDK options, performs the provider call and reduces the result.
5. Registration returns only confirmation-required, signed-in with user ID, or provider-error with an optional code. Preserve the unusual session-present branch without exposing a session/token.
6. Recovery returns accepted or rate-limited with the relevant code. Preserve the existing neutral accepted reply for other provider outcomes; do not inadvertently expose account existence or introduce a different failure policy.
7. Form-state types live in shared feature modules. Provider outcomes stay internal to the server and are not client form contracts.
8. Other simple auth calls (including the current resend-confirmation action), the account action, callback exchange and proxy refresh remain direct at their existing server/framework boundaries. Further extraction needs demonstrated benefit.

## Scope

Separation of two existing provider workflows from auth action/UI concerns, after the structural migration. [Operation tasks](../../superpowers/plans/2026-10-13-auth-refactor-operations.md) define the work.

## What this does NOT decide

A services workspace package, provider portability, public APIs, new auth methods, error-copy changes, password policy changes, permissions architecture, general data access or schema/storage. No new client-callable endpoint or broader action exposure is intended.

## Unresolved

- Enforcement of server-only imports must use installed capabilities; any missing dependency or tooling change requires a separate approved scope.
- General service abstraction for other operations is deferred; this ADR provides no authority to extract them opportunistically.

## Governance boundary

The owner approves the operation contract and request-client convention. Acceptance of this ADR depends on ADR-0007; neither acceptance nor task approval permits provider configuration changes, live email/account creation or unrelated source mutation.

## Integration expectations

Never authorize from `CurrentUser`, browser context or user-editable metadata. Preserve server verification appropriate to each existing operation. An action is its own entry point; page/layout gating alone does not secure it.

Do not return raw SDK users, errors, sessions, tokens or passwords. Keep only required scalar outcomes and error codes; public messages remain mapped by the action. Preserve `confirm`/`reset` flow parameters and existing `next` handling. Keep request cookies and session-refresh integration intact.

## Verification expectations

Operation tests assert SDK inputs and reduced outcomes, including the confirmation-required/session-present branches, recovery rate-limit distinction and neutral other-error behavior. Action integration tests invoke real action functions with provider/framework boundaries mocked, and assert validation, redirect/revalidation effects and safe results. Do not manually inject form state and call that action coverage.

Run the existing auth browser tests and root verification chain. Mock tests do not verify email delivery, OAuth or a live Supabase session. No implementation verification is claimed by this decision file.

## Reconsideration conditions

Another real consumer needs the operations, shared authorization/data rules require a broader server layer, or outcome reduction proves insufficient for an adopted workflow. Revise the scope explicitly rather than growing a general auth service by accumulation.
