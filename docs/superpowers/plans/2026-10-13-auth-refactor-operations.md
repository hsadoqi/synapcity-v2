# Auth server operations: task plan

**Status:** Proposed; this plan does not authorize implementation. Physical placement follows ARF-00.  
**Date:** 2026-10-13.  
**Decision prerequisite:** [ADR-0008](../../architecture/decisions/0008-auth-actions-and-server-operations.md), following Accepted ADR-0007.  
**Parent:** [Inventory, order and final verification](2026-10-13-auth-refactor.md).  
**Requirements:** [Auth refactor spec](../specs/2026-10-13-auth-refactor-design.md).

This file alone owns ARF-07 through ARF-09 and their checkboxes. Tasks depend on verified ARF-06 from the [foundation plan](2026-10-13-auth-refactor-foundation.md). An auth package or separate service package is permitted if selected at ARF-00. A forwarding wrapper for every SDK call is not required; further splitting is assessed against actual responsibility boundaries.

## App-local candidate file set

These paths illustrate the app-local candidate relative to `apps/web/src`. Selected package destinations/exports, framework adapters and test configuration must replace this set in a fresh approved manifest after ARF-00:

- Update `features/auth/server/actions.ts`.
- Create `features/auth/server/operations.ts` and `features/auth/server/operations.test.ts`.
- Create `features/auth/server/actions.test.ts` for action integration assertions.
- Read existing origin, routing/flow/error helpers and Supabase server factory; change none of their behavior.

Client provisioning follows the selected request-adapter contract. App-local construction through the existing server factory is one option; a package can receive a client/factory capability without importing app code. Test the chosen boundary and safe outcomes. Provider interfaces and further splitting are available when useful; dependencies/configuration require explicit scope rather than being ruled out by this plan.

## Tasks

### ARF-07: isolate registration's provider workflow

**Depends on:** ARF-06 and owner acceptance of ADR-0008.  
**Files:** actions, operations and operations test from the set above.

- [ ] Add typed registration input: validated email/password/name and action-constructed confirmation redirect destination.
- [ ] Implement `registerWithPassword` using the approved request-bound client/adapter contract and existing signUp options, including full_name metadata.
- [ ] Return the minimal registration outcome: confirmation-required, signed-in user ID, or provider-error code.
- [ ] Adapt signUp action to consume that outcome while preserving its FormData validation, safe field/message results and uncommon session-present redirect.
- [ ] Test confirmation-required, session-present and provider-error branches; assert redirect options contain the configured destination and `confirm` flow.
- [ ] Assert reduced outcomes omit password, raw user, session/access/refresh tokens and raw provider error details.

**Acceptance:** the operation has no form, Next.js navigation or revalidation responsibility; action results and redirect behavior remain equivalent to baseline.  
**Verification:** operation suite and existing web tests/types. Test sentinel credentials and exact allowed return shape; a mere assertion that signUp was called is insufficient.  
**Recovery:** restore the action hunk and remove only newly authored operation/test changes if authorized; preserve prior foundation work.

### ARF-08: isolate recovery without changing its privacy behavior

**Depends on:** ARF-07.  
**Files:** same actions, operations and operations test.

- [ ] Implement `requestRecoveryEmail` with validated email and action-constructed reset destination.
- [ ] Preserve the `reset` flow and `/auth/update-password` destination in SDK options.
- [ ] Return rate-limited only for the existing rate-limit distinction; retain accepted/neutral outcomes for other provider responses exactly as the current action does.
- [ ] Adapt the action while preserving its empty-email validation, neutral success message and safe echoed fields.
- [ ] Test success, rate-limit, other-error and empty-input behavior at their appropriate operation/action boundaries.

**Acceptance:** no account-existence distinction is introduced and no raw provider message reaches the form. This task deliberately does not select a new general error policy.  
**Verification:** focused operation tests, web type checks and existing recovery browser tests. Mocked calls do not prove a delivered email or valid reset token.  
**Recovery:** revert only this task's recovery extraction and assertions using the approved checkpoint baseline.

### ARF-09: verify action integration and runtime boundaries

**Depends on:** ARF-08.  
**Files:** actions integration test; read actions/operations and migrated consumers. If production repair is needed, it must remain in the approved actions/operations set.

- [ ] Invoke real signUp/requestPasswordReset and preserved resendConfirmation action functions with FormData while mocking provider/client and framework effects.
- [ ] Assert invalid submissions never invoke provider operations; assert safe results echo only approved non-secret fields.
- [ ] Assert session-present registration revalidates/redirects correctly and neutral/rate-limited recovery yields the existing results. Cover the current resend action's configured confirmation destination, neutral outcome and both email/request rate-limit codes without extracting it into an operation.
- [ ] Test failures using returned codes/outcomes, not manually seeded UI state. Model redirect as control flow rather than swallowing it as an ordinary error.
- [ ] Check client import paths: Server Actions are explicit entry points, ordinary operations/session helpers are not exposed through a client barrel.
- [ ] Run the existing auth browser suite and record exactly which behaviors it reaches.

**Acceptance:** workflow tests/action effects support the preserved contract; no extra client-callable behavior or cross-user client appears. Any package/provider interface and tooling dependencies match the selected, approved scope.  
**Verification:** web unit/type/e2e checks; installed-framework import-boundary review. If enforcing the server boundary requires a new dependency/configuration, stop for separately scoped approval.  
**Recovery:** preserve checkpoint evidence; reverse only approved operation/action test hunks if separately authorized.

## Exit

Recorded ARF-09 evidence is the prerequisite for navigation integration in the coordinated sequence. Live email/OAuth configuration, accounts and provider settings remain outside these tasks. Final repository verification belongs only to ARF-12 in the parent.
