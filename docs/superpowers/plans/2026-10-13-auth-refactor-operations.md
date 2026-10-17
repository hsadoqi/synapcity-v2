# Auth server operations: task plan

> **Reconciliation 2026-10-17 (AHF-07):** items are ticked only where the cited evidence exists in the repository or in CI. The original ARF-01 manifest and baseline were never recovered, so items that depend on comparing against that baseline stay open with a note. Nothing here claims live email, OAuth or second-account verification. The work this plan describes was carried out on `refactor/auth-features` and merged to `main` (PR #28); the Status line below is the original.

**Status:** Executed 2026-10-14 under the owner's instruction at the app-local layout (ADR-0007 and ADR-0008 Accepted). The checkboxes below are not ticked; the record is in [ADR-0008](../../architecture/decisions/0008-auth-actions-and-server-operations.md#implementation-2026-10-14).  
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

- [x] Add typed registration input: validated email/password/name and action-constructed confirmation redirect destination. _(2026-10-17: evidence: `features/auth/server/operations.ts`.)_
- [x] Implement `registerWithPassword` using the approved request-bound client/adapter contract and existing signUp options, including full_name metadata. _(2026-10-17: evidence: `operations.ts`; `operations.test.ts` asserts the redirect and `full_name`.)_
- [x] Return the minimal registration outcome: confirmation-required, signed-in user ID, or provider-error code. _(2026-10-17: evidence: `operations.test.ts`: confirmation-required, user id, provider-error code.)_
- [x] Adapt signUp action to consume that outcome while preserving its FormData validation, safe field/message results and uncommon session-present redirect. _(2026-10-17: evidence: `features/auth/server/actions.ts` consumes the outcome; `actions.test.ts`.)_
- [x] Test confirmation-required, session-present and provider-error branches; assert redirect options contain the configured destination and `confirm` flow. _(2026-10-17: evidence: `operations.test.ts` and `actions.test.ts`.)_
- [x] Assert reduced outcomes omit password, raw user, session/access/refresh tokens and raw provider error details. _(2026-10-17: evidence: `operations.test.ts` `never carries credentials, tokens or the raw user`.)_

**Acceptance:** the operation has no form, Next.js navigation or revalidation responsibility; action results and redirect behavior remain equivalent to baseline.  
**Verification:** operation suite and existing web tests/types. Test sentinel credentials and exact allowed return shape; a mere assertion that signUp was called is insufficient.  
**Recovery:** restore the action hunk and remove only newly authored operation/test changes if authorized; preserve prior foundation work.

### ARF-08: isolate recovery without changing its privacy behavior

**Depends on:** ARF-07.  
**Files:** same actions, operations and operations test.

- [x] Implement `requestRecoveryEmail` with validated email and action-constructed reset destination. _(2026-10-17: evidence: `operations.ts`; test asserts the reset redirect.)_
- [x] Preserve the `reset` flow and `/auth/update-password` destination in SDK options. _(2026-10-17: evidence: `operations.test.ts` asserts `flow=reset` and `/auth/update-password`.)_
- [x] Return rate-limited only for the existing rate-limit distinction; retain accepted/neutral outcomes for other provider responses exactly as the current action does. _(2026-10-17: evidence: `operations.test.ts`: both rate-limit codes are rate-limited; other errors are accepted.)_
- [x] Adapt the action while preserving its empty-email validation, neutral success message and safe echoed fields. _(2026-10-17: evidence: `requestPasswordReset` in `actions.ts`; `actions.test.ts`.)_
- [x] Test success, rate-limit, other-error and empty-input behavior at their appropriate operation/action boundaries. _(2026-10-17: evidence: `operations.test.ts` and `actions.test.ts`.)_

**Acceptance:** no account-existence distinction is introduced and no raw provider message reaches the form. This task deliberately does not select a new general error policy.  
**Verification:** focused operation tests, web type checks and existing recovery browser tests. Mocked calls do not prove a delivered email or valid reset token.  
**Recovery:** revert only this task's recovery extraction and assertions using the approved checkpoint baseline.

### ARF-09: verify action integration and runtime boundaries

**Depends on:** ARF-08.  
**Files:** actions integration test; read actions/operations and migrated consumers. If production repair is needed, it must remain in the approved actions/operations set.

- [x] Invoke real signUp/requestPasswordReset and preserved resendConfirmation action functions with FormData while mocking provider/client and framework effects. _(2026-10-17: evidence: `actions.test.ts` calls the real actions with `FormData`.)_
- [x] Assert invalid submissions never invoke provider operations; assert safe results echo only approved non-secret fields. _(2026-10-17: evidence: `actions.test.ts` `invalid submissions never reach the provider`.)_
- [x] Assert session-present registration revalidates/redirects correctly and neutral/rate-limited recovery yields the existing results. Cover the current resend action's configured confirmation destination, neutral outcome and both email/request rate-limit codes without extracting it into an operation. _(2026-10-17: evidence: `actions.test.ts` (`signUp`, `requestPasswordReset`, `resendConfirmation`).)_
- [x] Test failures using returned codes/outcomes, not manually seeded UI state. Model redirect as control flow rather than swallowing it as an ordinary error. _(2026-10-17: evidence: `actions.test.ts` uses a `Redirected` control-flow stand-in and returned codes.)_
- [x] Check client import paths: Server Actions are explicit entry points, ordinary operations/session helpers are not exposed through a client barrel. _(2026-10-17: evidence: `architecture.test.ts`: only `use server` entry points are client-importable.)_
- [ ] Run the existing auth browser suite and record exactly which behaviors it reaches. _(2026-10-17: open: the suite runs in CI (`e2e/auth.e2e.ts`); a record of exactly which behaviors it reaches was not written, and it cannot reach live email or OAuth.)_

**Acceptance:** workflow tests/action effects support the preserved contract; no extra client-callable behavior or cross-user client appears. Any package/provider interface and tooling dependencies match the selected, approved scope.  
**Verification:** web unit/type/e2e checks; installed-framework import-boundary review. If enforcing the server boundary requires a new dependency/configuration, stop for separately scoped approval.  
**Recovery:** preserve checkpoint evidence; reverse only approved operation/action test hunks if separately authorized.

## Exit

Recorded ARF-09 evidence is the prerequisite for navigation integration in the coordinated sequence. Live email/OAuth configuration, accounts and provider settings remain outside these tasks. Final repository verification belongs only to ARF-12 in the parent.
