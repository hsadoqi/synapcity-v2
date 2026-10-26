# Caller-owned auth navigation: task plan

> **Reconciliation 2026-10-17 (AHF-07):** items are ticked only where the cited evidence exists in the repository or in CI. The original ARF-01 manifest and baseline were never recovered, so items that depend on comparing against that baseline stay open with a note. Nothing here claims live email, OAuth or second-account verification. The work this plan describes was carried out on `refactor/auth-features` and merged to `main` (PR #28); the Status line below is the original.

**Status:** Proposed; this plan does not authorize implementation. Recheck current navigation behavior before source changes.  
**Date:** 2026-10-13.  
**Decision prerequisite:** [ADR-0009](../../architecture/decisions/0009-caller-owned-auth-navigation.md).  
**Parent:** [Inventory, sequence and final verification](2026-10-13-auth-refactor.md).

This file owns ARF-10 and ARF-11 and their checkboxes. The API decision is independently reviewable; this coordinated plan schedules its implementation after ARF-09 to avoid overlapping foundation moves. ARF-00 selects physical placement. A standalone implementation before migration is also possible with an approved manifest using live source locations; the auth package decision need not be forced by this presentation API.

## Candidate file set pending selected topology

- `packages/frontend/ui/src/components/auth-buttons.tsx`
- `packages/frontend/ui/src/components/auth-buttons.test.tsx`
- `packages/frontend/ui/src/components/auth-buttons.stories.tsx`
- `packages/frontend/ui/src/blocks/root-shell/root-header.stories.tsx`
- `apps/web/src/features/auth/components/auth-status.tsx` (app-local candidate post-foundation path; use selected module/package consumer after ARF-00)

Re-inventory every AuthButtons consumer before execution. New consumers require a scope revision, not an opportunistic update. This navigation task preserves export names, route URLs and LinkButton behavior. Package configuration belongs to the selected foundation scope, not an exclusion of packages from the refactor.

## Tasks

### ARF-10: make destination props required and update all consumers atomically

**Depends on:** ARF-09, owner acceptance of ADR-0009 and approval of the shared-component API change.  
**Files:** a fresh exact manifest after ARF-00 resolves the consumer path. The five-file set above is the app-local candidate.

- [x] Add required `signInHref` and `signUpHref` string props and render them through existing LinkButton. _(2026-10-17: evidence: `auth-buttons.tsx` props are required strings.)_
- [x] Remove the shared component's hardcoded app destinations under the approved API scope; preserve current active-link/quiet-header behavior, variants, labels, semantic styling and layout. The live component currently reads pathname; reconcile any adapter/prop needs with the selected runtime contract before changing that behavior. _(2026-10-17: evidence: the component holds no app destinations; `auth-buttons.test.tsx`.)_
- [x] Supply the existing login/register destinations from the app's AuthActions. _(2026-10-17: evidence: `features/auth/components/auth-status.tsx`.)_
- [x] Supply example destinations in both component stories and the root-header story; update existing test renders for the required props. _(2026-10-17: evidence: `auth-buttons.stories.tsx` and `root-header.stories.tsx`.)_
- [x] Type-check all consumers in the same change, so no intermediate missing-prop state is left at the checkpoint. _(2026-10-17: evidence: `pnpm typecheck` passes; CI `verify` on PR #41 (run 39027783915, commit 8ea886a) runs the full `pnpm verify` chain and passed.)_

**Acceptance:** shared UI owns presentation; each caller owns destinations; observable web URLs remain identical. Required props have no app-specific defaults.  
**Verification:** UI unit tests, root `pnpm typecheck`, scoped formatting and consumer inventory. A missing prop or unintended link change is a failure, not a reason to add defaults silently.  
**Recovery:** restore only this task's coordinated component/consumer hunks from the approved checkpoint.

### ARF-11: verify custom links, stories and actual app navigation

**Depends on:** ARF-10.  
**Files:** existing AuthButtons test/stories; no production mutation expected. Production repair remains limited to the approved five-file set.

- [x] Assert caller-provided destinations are used in header and hero variants, with stable accessible labels. _(2026-10-17: evidence: `auth-buttons.test.tsx` `links to the destinations it is given`.)_
- [x] Retain existing variant assertions and verify stories/root-header composition with explicit args. _(2026-10-17: evidence: `auth-buttons.test.tsx` variant cases; stories pass explicit args.)_
- [x] Run UI tests and Storybook/a11y checks. _(2026-10-17: evidence: CI `verify` on PR #41 (run 39027783915, commit 8ea886a) runs the full `pnpm verify` chain and passed (includes `test:storybook`).)_
- [ ] Run current web browser tests and manually follow header/root auth links where the approved environment permits. _(2026-10-17: open: e2e `header navigation` runs in CI; no manual link-following was recorded.)_
- [ ] Record route behavior separately from story rendering and mocked auth/provider evidence. _(2026-10-17: open: no separate record was written.)_

**Acceptance:** custom-path tests would fail if the component ignored its props; no missing consumers, visual regressions or navigation changes are observed within the actual evidence.  
**Verification:** `pnpm --filter @synapcity/frontend-ui test`, `pnpm test:storybook`, `pnpm --filter web test:e2e`, plus manual navigation. Do not create a snapshot test that only repeats the implementation.  
**Recovery:** report any failure; reverse only this plan's authorized hunks if recovery is separately approved.

## Exit

ARF-11 feeds ARF-12 in the parent plan. No final whole-repository completion, auth security assurance or live-provider success is inferred from these presentation checks.
