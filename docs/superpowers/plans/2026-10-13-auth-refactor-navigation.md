# Caller-owned auth navigation: task plan

**Status:** Proposed; no implementation authorized or started.  
**Date:** 2026-10-13.  
**Decision prerequisite:** [ADR-0009](../../architecture/decisions/0009-caller-owned-auth-navigation.md).  
**Parent:** [Inventory, sequence and final verification](2026-10-13-auth-refactor.md).

This file owns ARF-10 and ARF-11 and their checkboxes. The API decision is independently reviewable; this coordinated plan schedules its implementation after ARF-09 to avoid overlapping foundation moves. A standalone implementation before migration would require a revised manifest using current source locations.

## Exact proposed file set

- `packages/frontend/ui/src/components/auth-buttons.tsx`
- `packages/frontend/ui/src/components/auth-buttons.test.tsx`
- `packages/frontend/ui/src/components/auth-buttons.stories.tsx`
- `packages/frontend/ui/src/blocks/root-shell/root-header.stories.tsx`
- `apps/web/src/features/auth/components/auth-status.tsx` (proposed post-foundation path)

Re-inventory every AuthButtons consumer before execution. New consumers require a scope revision, not an opportunistic update. No export name, package configuration, route URL or LinkButton behavior changes.

## Tasks

### ARF-10: make destination props required and update all consumers atomically

**Depends on:** ARF-09, owner acceptance of ADR-0009 and approval of the shared-component API change.  
**Files:** the exact five-file set above.

- [ ] Add required `signInHref` and `signUpHref` string props and render them through existing LinkButton.
- [ ] Remove only the shared component's hardcoded app destinations; preserve variants, labels, semantic styling and layout.
- [ ] Supply the existing login/register destinations from the app's AuthStatus.
- [ ] Supply example destinations in both component stories and the root-header story; update existing test renders for the required props.
- [ ] Type-check all consumers in the same change, so no intermediate missing-prop state is left at the checkpoint.

**Acceptance:** shared UI owns presentation; each caller owns destinations; observable web URLs remain identical. Required props have no app-specific defaults.  
**Verification:** UI unit tests, root `pnpm typecheck`, scoped formatting and consumer inventory. A missing prop or unintended link change is a failure, not a reason to add defaults silently.  
**Recovery:** restore only this task's coordinated component/consumer hunks from the approved checkpoint.

### ARF-11: verify custom links, stories and actual app navigation

**Depends on:** ARF-10.  
**Files:** existing AuthButtons test/stories; no production mutation expected. Production repair remains limited to the approved five-file set.

- [ ] Assert caller-provided destinations are used in header and hero variants, with stable accessible labels.
- [ ] Retain existing variant assertions and verify stories/root-header composition with explicit args.
- [ ] Run UI tests and Storybook/a11y checks.
- [ ] Run current web browser tests and manually follow header/root auth links where the approved environment permits.
- [ ] Record route behavior separately from story rendering and mocked auth/provider evidence.

**Acceptance:** custom-path tests would fail if the component ignored its props; no missing consumers, visual regressions or navigation changes are observed within the actual evidence.  
**Verification:** `pnpm --filter @synapcity/frontend-ui test`, `pnpm test:storybook`, `pnpm --filter web test:e2e`, plus manual navigation. Do not create a snapshot test that only repeats the implementation.  
**Recovery:** report any failure; reverse only this plan's authorized hunks if recovery is separately approved.

## Exit

ARF-11 feeds ARF-12 in the parent plan. No final whole-repository completion, auth security assurance or live-provider success is inferred from these presentation checks.
