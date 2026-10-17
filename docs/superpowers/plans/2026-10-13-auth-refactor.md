# Auth organization refactor: proposed implementation plan

> **Reconciliation 2026-10-17 (AHF-07):** items are ticked only where the cited evidence exists in the repository or in CI. The original ARF-01 manifest and baseline were never recovered, so items that depend on comparing against that baseline stay open with a note. Nothing here claims live email, OAuth or second-account verification. The work this plan describes was carried out on `refactor/auth-features` and merged to `main` (PR #28); the Status line below is the original.

**Status:** Proposed parent plan. Layout selected, the file moves of section 2 and the operations extraction (ADR-0008) executed 2026-10-14 (see section 5).  
**Date:** 2026-10-13.  
**Specification:** [Auth organization refactor](../specs/2026-10-13-auth-refactor-design.md).

This file owns the proposed migration inventory, task order and final verification task ARF-12. The app-local migration inventory is a candidate, not an adopted destination map. [Foundation](2026-10-13-auth-refactor-foundation.md), [operations](2026-10-13-auth-refactor-operations.md) and [navigation](2026-10-13-auth-refactor-navigation.md) child plans alone own their task definitions and checkboxes. ADRs own proposed/accepted decisions; the spec owns behavioral requirements. A fresh task scope will bound approved execution. No status is mirrored into an external tracker.

## 1. Preconditions and approval

Before any source mutation:

1. Complete ARF-00's package comparison and obtain a concrete topology selection under [ADR-0007](../../architecture/decisions/0007-app-local-auth-and-account-ownership.md), with any category/runtime amendments approved before source work. App-local, one auth package, feature/service packages and account separation are eligible. Approve [ADR-0008](../../architecture/decisions/0008-auth-actions-and-server-operations.md) for operations and [ADR-0009](../../architecture/decisions/0009-caller-owned-auth-navigation.md) for the shared navigation API where those tasks proceed.
2. Preserve ADR-0006's provider/session/security choices. Its initial app-local placement is not a topology restriction. Review current workspace conventions/checklist as constraints to reconcile for each candidate, not evidence of owner opposition to packages.
3. Re-inventory the live files and imports. The source snapshot includes concurrent uncommitted auth work; including `AuthConfirmation`, `useFocusFirstError`, registration state handling, the existing resend-confirmation action/control and flow-specific callback/error recovery. The existing Draft auth-UI plan does not establish a stable baseline.
4. Capture the relevant original contents and diff in an approved recovery location. Never reset, stash, clean, stage or commit mixed WIP. Decide how the baseline is preserved before authorizing moves; tracked Git history alone cannot recover currently untracked files.
5. Build an exact execution manifest from the migration table and consumer list below. Resolve every destination and operation choice, list numeric create/update/move/remove budgets, and include test/config changes only if named. Check for collisions before moving anything.
6. Inspect the root scripts and installed-version docs. Obtain baseline focused-test results; record existing failures rather than attributing them to the refactor.

The current authoring scope creates three Proposed ADRs and three child task plans, and updates the ADR index, spec, parent plan and scope entry only. The code tables below remain proposed targets, not mutation authority.

## 2. App-local candidate migration map

Paths in this table are relative to `apps/web/src/`. Source paths existed in the live snapshot unless a row explicitly says new. Target paths illustrate only the app-local candidate. If packages are selected, replace the destination column and affected consumer/configuration scopes with the approved package layout before source tasks run. These rows are not ready-to-execute package instructions. Keep function/component names initially; changing file ownership should not silently rename behavior.

| Current source                                             | Proposed destination                                | Treatment                                                                     |
| ---------------------------------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| `app/auth/actions.ts`                                      | `features/auth/server/actions.ts`                   | Move existing actions; separate shared types; preserve behavior               |
| `lib/auth/session.ts`                                      | `features/auth/server/session.ts`                   | Move request-scoped readers                                                   |
| `lib/auth/origin/origin.ts`                                | `features/auth/server/site-origin.ts`               | Move configured-origin reader                                                 |
| `lib/auth/origin/origin.test.ts`                           | `features/auth/server/site-origin.test.ts`          | Move existing tests                                                           |
| `lib/auth/error-messages/error-messages.ts`                | `features/auth/shared/error-messages.ts`            | Move mapping; move field type to form contract                                |
| `lib/auth/error-messages/error-messages.test.ts`           | `features/auth/shared/error-messages.test.ts`       | Move existing tests                                                           |
| Types in `app/auth/actions.ts` and error mapping           | `features/auth/shared/form-state.ts`                | Extract `AuthState`, `AuthFieldName` and associated safe types                |
| `lib/auth/profile/profile.ts`                              | `features/auth/shared/current-user.ts`              | Move display mapping/types; split metadata-write helper below                 |
| `lib/auth/profile/profile.test.ts`                         | `features/auth/shared/current-user.test.ts`         | Retain mapping assertions; split metadata assertions below                    |
| `withFullName` in `lib/auth/profile/profile.ts`            | `features/account/server/profile-metadata.ts`       | Extract existing metadata-preserving helper                                   |
| Metadata assertions in `lib/auth/profile/profile.test.ts`  | `features/account/server/profile-metadata.test.ts`  | Preserve existing assertions                                                  |
| `lib/auth/name/name.ts`                                    | `features/account/shared/name.ts`                   | Move pure validator; registration imports it                                  |
| `lib/auth/name/name.test.ts`                               | `features/account/shared/name.test.ts`              | Move existing tests                                                           |
| `lib/auth/auth-events/auth-events.ts`                      | `features/auth/client/auth-events.ts`               | Move event predicate; preserve semantics                                      |
| `lib/auth/auth-events/auth-events.test.ts`                 | `features/auth/client/auth-events.test.ts`          | Move existing tests                                                           |
| `components/auth/provider/user-provider.tsx`               | `features/auth/client/user-provider.tsx`            | Move provider/hook; preserve refresh coordination                             |
| `lib/auth/home-path/home-path.ts`                          | `lib/routing/user-paths.ts`                         | Move current destination functions                                            |
| `lib/auth/home-path/home-path.test.ts`                     | `lib/routing/user-paths.test.ts`                    | Move encoding/destination tests                                               |
| `lib/auth/safe-next/safe-next.ts`                          | `lib/routing/safe-next.ts`                          | Move unchanged redirect validation                                            |
| `lib/auth/safe-next/safe-next.test.ts`                     | `lib/routing/safe-next.test.ts`                     | Move existing tests                                                           |
| `lib/auth/auth-flow/auth-flow.ts`                          | `lib/routing/auth-flow.ts`                          | Move current flow parser and error destination helper                         |
| `lib/auth/auth-flow/auth-flow.test.ts`                     | `lib/routing/auth-flow.test.ts`                     | Move current flow/recovery tests                                              |
| `lib/supabase/route-access.ts`                             | `lib/routing/route-access.ts`                       | Move unchanged route classification                                           |
| `lib/supabase/route-access.test.ts`                        | `lib/routing/route-access.test.ts`                  | Move existing tests                                                           |
| `lib/auth/require-owner/require-owner.ts`                  | `lib/access/require-owner.ts`                       | Move app-specific guard                                                       |
| `lib/auth/require-owner/require-owner.test.ts`             | `lib/access/require-owner.test.ts`                  | Move existing tests                                                           |
| `components/auth/form/auth-field.tsx`                      | `components/forms/form-field.tsx`                   | Move presentation; keep exported component name initially                     |
| `components/auth/form/form-message.tsx`                    | `components/forms/form-message.tsx`                 | Move message/id presentation with minimal error/message prop contract         |
| `components/auth/form/use-focus-first-error.ts`            | `components/forms/use-focus-first-error.ts`         | Move current focus hook; use minimal presentation contract                    |
| `components/auth/form/use-confirmation.ts`                 | `features/auth/client/use-confirmation.ts`          | Candidate move of existing auth-specific confirmation/edit hook               |
| `components/auth/form/use-cooldown.ts`                     | `features/auth/client/use-cooldown.ts`              | Candidate move preserving current auth-resend cooldown behavior               |
| `fieldErrorProps` in previous row                          | `features/auth/shared/form-feedback.ts`             | Extract auth-specific field association; reuse message ID                     |
| `components/auth/login/login-form.tsx`                     | `features/auth/components/login-form.tsx`           | Move                                                                          |
| `components/auth/register/register-card.tsx`               | `features/auth/components/register-card.tsx`        | Move                                                                          |
| `components/auth/register/resend-confirmation.tsx`         | `features/auth/components/resend-confirmation.tsx`  | Move current resend control and preserve its existing action                  |
| `components/auth/register/register-form.tsx`               | `features/auth/components/register-form.tsx`        | Move                                                                          |
| `components/auth/forgot-password/forgot-password-card.tsx` | `features/auth/components/forgot-password-card.tsx` | Move                                                                          |
| `components/auth/forgot-password/resend-reset-link.tsx`    | `features/auth/components/resend-reset-link.tsx`    | Candidate move preserving existing reset-resend control                       |
| `components/auth/forgot-password/forgot-password-form.tsx` | `features/auth/components/forgot-password-form.tsx` | Move                                                                          |
| `components/auth/update-password/update-password-card.tsx` | `features/auth/components/update-password-card.tsx` | Move                                                                          |
| `components/auth/update-password/update-password-form.tsx` | `features/auth/components/update-password-form.tsx` | Move                                                                          |
| `components/auth/buttons/oauth-buttons.tsx`                | `features/auth/components/oauth-buttons.tsx`        | Move                                                                          |
| `components/auth/buttons/sign-out-button.tsx`              | `features/auth/components/sign-out-button.tsx`      | Move                                                                          |
| `components/auth/buttons/auth-link-button.tsx`             | `features/auth/components/auth-link-button.tsx`     | Move                                                                          |
| `components/auth/display/auth-status.tsx`                  | `features/auth/components/auth-status.tsx`          | Move; remains a server component                                              |
| `components/auth/display/current-user-avatar.tsx`          | `features/auth/components/current-user-avatar.tsx`  | Move; remains a client component                                              |
| `components/auth/shell/auth-shell.tsx`                     | `features/auth/components/auth-shell.tsx`           | Move                                                                          |
| `components/auth/shell/auth-confirmation.tsx`              | `features/auth/components/auth-confirmation.tsx`    | Move current focus/confirmation behavior                                      |
| `components/auth/profile/profile-form.tsx`                 | `features/account/components/profile-form.tsx`      | Move; use common form presentation                                            |
| `app/[userId]/settings/actions.ts`                         | `features/account/server/actions.ts`                | Move existing profile action; extract state type                              |
| `ProfileState` in previous row                             | `features/account/shared/form-state.ts`             | Extract safe account form contract                                            |
| New, after move verification                               | `features/auth/server/operations.ts`                | Extract approved registration/recovery workflows only                         |
| New, paired with operation extraction                      | `features/auth/server/operations.test.ts`           | Verify workflow input/outcome invariants                                      |
| New, action integration coverage                           | `features/auth/server/actions.test.ts`              | Invoke real actions and assert validation, safe results and framework effects |

Do not count split rows as independent moves from the same source. The execution manifest must enumerate each actual file operation once, distinguish moving files from extracting symbols, and approve removal of superseded source copies only after all consumers are updated. No compatibility copy or forwarding file is proposed by default.

## 3. Current consumers and candidate shared component changes

In addition to imports within the moved sources, the current consumer inventory includes these app files:

```text
apps/web/src/app/layout.tsx
apps/web/src/app/page.tsx
apps/web/src/app/auth/callback/route.ts
apps/web/src/app/auth/error/page.tsx
apps/web/src/app/auth/forgot-password/page.tsx
apps/web/src/app/auth/login/page.tsx
apps/web/src/app/auth/register/page.tsx
apps/web/src/app/auth/update-password/page.tsx
apps/web/src/app/[userId]/layout.tsx
apps/web/src/app/[userId]/page.tsx
apps/web/src/app/[userId]/home/page.tsx
apps/web/src/app/[userId]/home/[...path]/page.tsx
apps/web/src/app/[userId]/settings/page.tsx
apps/web/src/lib/supabase/middleware.ts
```

`proxy.ts` currently delegates to the Supabase adapter; it need not change if that adapter's entry point remains stable. `lib/supabase/client.ts`, `server.ts` and `env.ts` remain in place. Other newly added consumers must be inventoried before scope approval.

Proposed shared-package updates, all subject to approval:

```text
packages/frontend/ui/src/components/auth-buttons.tsx
packages/frontend/ui/src/components/auth-buttons.test.tsx
packages/frontend/ui/src/components/auth-buttons.stories.tsx
packages/frontend/ui/src/blocks/root-shell/root-header.stories.tsx
```

Add required destination props; update every consumer and story. Do not change component exports, add Supabase/Next.js runtime imports, or move auth behavior into the shared UI package.

Existing regression locations: `apps/web/e2e/auth.e2e.ts` and `apps/web/e2e/home.e2e.ts`. Do not edit them merely because files moved. Any missing assertion or new test destination belongs in the approved execution manifest. For the app-local candidate, package/configuration files are outside the illustrative migration. For a selected package candidate, ARF-00 must enumerate required package manifests/exports, dependency ownership, consumer manifests, lockfile, build/test discovery, Knip and canonical amendments in a new exact scope. Package scaffolding is permitted after that approval, not forbidden by this document.

## 4. Task sequence and ownership

Each task is defined and checked off in exactly one owning plan. Tasks remain proposed; checkboxes are not evidence that concurrent source work has or has not implemented overlapping behavior. ARF-00 re-evaluates topology and the baseline first. The table records dependencies and links only, not duplicate completion status. Source-affecting work requires fresh approved scope even after decision acceptance.

| Task   | Outcome                                                         | Depends on                                                                             | Owning plan                                          |
| ------ | --------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| ARF-00 | Compare package/module layouts and obtain selected topology     | Approved documentation evaluation scope; owner selects recommendation before migration | [Foundation](2026-10-13-auth-refactor-foundation.md) |
| ARF-01 | Approved source manifest and recoverable live baseline          | ARF-00; owner selection, required governance amendments and scope approved             | [Foundation](2026-10-13-auth-refactor-foundation.md) |
| ARF-02 | Safe shared contracts and common form/focus behavior            | ARF-01                                                                                 | [Foundation](2026-10-13-auth-refactor-foundation.md) |
| ARF-03 | App-owned routing, flow recovery and owner guard                | ARF-02                                                                                 | [Foundation](2026-10-13-auth-refactor-foundation.md) |
| ARF-04 | Account profile implementation and route wiring                 | ARF-03                                                                                 | [Foundation](2026-10-13-auth-refactor-foundation.md) |
| ARF-05 | Cohesive auth feature and updated consumers                     | ARF-04                                                                                 | [Foundation](2026-10-13-auth-refactor-foundation.md) |
| ARF-06 | Foundation behavior verified before further extraction          | ARF-05                                                                                 | [Foundation](2026-10-13-auth-refactor-foundation.md) |
| ARF-07 | Registration operation and outcome tests                        | ARF-06; ADR-0008 accepted                                                              | [Operations](2026-10-13-auth-refactor-operations.md) |
| ARF-08 | Recovery operation with neutral/rate-limit behavior preserved   | ARF-07                                                                                 | [Operations](2026-10-13-auth-refactor-operations.md) |
| ARF-09 | Real action integration and server/client boundary verification | ARF-08                                                                                 | [Operations](2026-10-13-auth-refactor-operations.md) |
| ARF-10 | Required href props and every consumer updated together         | ARF-09; ADR-0009 accepted                                                              | [Navigation](2026-10-13-auth-refactor-navigation.md) |
| ARF-11 | Custom links, story/a11y and app navigation verified            | ARF-10                                                                                 | [Navigation](2026-10-13-auth-refactor-navigation.md) |
| ARF-12 | Final approved diff, root gates and evidence report             | ARF-11                                                                                 | This parent plan                                     |

### ARF-12: verify the complete approved refactor and report evidence

**Depends on:** ARF-11; selected topology, relevant ADRs/canonical amendments and execution scope approved.  
**Code scope:** read-only final diff and approved source/consumer inventory; repairs return to the owning task within its manifest. No additional production/configuration/planning mutation is granted here.

- [ ] Compare final file operations and source hunks with the exact approved manifest and recoverable WIP baseline; verify old imports/duplicate copies are gone. _(2026-10-17: open: original baseline unavailable (see the AHF-07 note).)_
- [ ] Confirm helper assertions, current flow/error-focus behavior and observable auth/profile invariants were preserved; document anything the evidence does not reach. _(2026-10-17: open: original baseline unavailable (see the AHF-07 note); current tests cover today's behavior.)_
- [x] Run `pnpm verify` after focused task checkpoints pass. Record each stage, its result, any pre-existing failure and remaining unrun stages if the chain stops. _(2026-10-17: evidence: CI `verify` on PR #41 (run 39027783915, commit 8ea886a) runs the full `pnpm verify` chain and passed; stage-by-stage results live in the CI log.)_
- [ ] Perform available authorized manual checks of account/header refresh, ownership and browser navigation; record live email/OAuth/second-account cases separately as verified or not verified. _(2026-10-17: open: manual checks of 2026-10-13 are in ADR-0006; none was recorded for the refactor, and the second-account case is unverified.)_
- [ ] Produce a final report using section 7, with remaining uncommitted artifacts, open decisions and next safe action. Do not commit/push/create a PR without separate instructions. _(2026-10-17: open: no final report was written for the original refactor.)_

**Acceptance:** the final approved diff preserves adopted behavior and verification is accurately bounded. A green gate alone is not complete auth coverage.  
**Recovery:** preserve evidence and propose rollback of only authorized refactor hunks from the live baseline if needed; never reset/stash/clean mixed work.  
**Stop:** new failure outside scope, source drift or an unresolved decision. Restore no file automatically when it would overwrite concurrent work.

## 5. Verification commands and evidence limits

The current scripts provide these focused commands; validate them again before execution:

```sh
pnpm --filter web test
pnpm --filter web check-types
pnpm --filter web test:e2e
pnpm --filter @synapcity/frontend-ui test
pnpm test:storybook
pnpm verify
```

The inspected root `verify` chain is formatting, lint, type checking, Knip, brand check, unit tests, coverage, web e2e, Storybook/a11y, then all-workspace builds. It stops at the first failure, so report the remaining stages as not run unless run separately. Do not edit Turbo configuration for this refactor.

Scoped formatting applies to changed source and these draft documents. Browser prerequisites must be checked before running tests; the repo describes Chromium installation separately from dependency installation.

Manual live-provider cases, when an approved test account/environment is available: password sign-in/out; signup/confirmation; recovery/password change; Google/GitHub callback; name change reflected in header; second-tab sign-out; unauthenticated and wrong-owner access. Mark unavailable cases not verified. Do not send email, change provider configuration, alter schemas or create accounts without the corresponding execution authorization.

## 6. Stop conditions and recovery

Stop on a concurrent source change, unexpected destination collision, unresolved ownership decision, need for a new dependency/package/schema/API behavior, or repair outside the manifest. Report observed state and propose a bounded scope revision; do not expand the migration or resolve an open decision silently.

Each checkpoint should be recoverable from the captured live baseline. Restore only the refactor's authorized hunks/files, including untracked originals when needed, and preserve other changes. Do not treat `git restore` as sufficient recovery for an uncommitted source file. Commit, push and PR creation require separate human instructions.

## 7. Completion report template

Report final ownership and why each piece belongs there; preserved observable behavior; decisions left open (packages, profile storage, broader authorization and routing architecture); exact checks and results; unrun stages; pre-existing failures; live-provider cases verified/not verified; remaining uncommitted artifacts; and any unresolved risk or next safe action.

**Authoring result:** Proposed ADRs and task plans are prepared; this documentation correction has performed no source implementation or runtime verification. Assess existing overlapping work at ARF-00 rather than treating unchecked tasks as proof that no other implementation exists. Checkboxes in the owning plans remain unchecked. Authoring these files does not accept the ADRs or approve code execution.

## 5. Execution record (2026-10-14)

[ADR-0007](../../architecture/decisions/0007-app-local-auth-and-account-ownership.md) selected the app-local candidate and the table in section 2 was executed on `refactor/auth-features` as written, with these differences:

- `components/auth/form/resend-button.tsx` moved to `features/auth/components/resend-button.tsx` (not in the table; it is auth-specific).
- `field()` lives at `features/auth/server/form-data.ts`; `AuthState`, `authFailure` and `authSuccess` at `features/auth/shared/form-state.ts` with `AuthFieldName` moved into that contract; `accountLinksFor()` in `lib/routing/user-paths.ts`.
- `fieldErrorProps` is at `features/auth/shared/form-feedback.ts`; `FormMessage` and `useFocusFirstError` take a minimal `{ error?, message? }` shape and no longer import auth types.
- `components/index.ts` (an unused barrel) was removed.
- `features/auth/server/actions.test.ts` already existed from the earlier slice and moved with `actions.ts`.
- `apps/web/src/architecture.test.ts` enforces the layer boundaries.

`features/auth/server/operations.ts` and `operations.test.ts` were then added per ADR-0008 (registration and recovery only; `resendConfirmation` stays in its action). ADR-0008 and ADR-0007 are Accepted.
