# Auth refactor foundation: task plan

**Status:** Proposed; this plan does not authorize implementation. Reassess overlapping live work at ARF-00.  
**Date:** 2026-10-13.  
**Decision prerequisite:** [ADR-0007](../../architecture/decisions/0007-app-local-auth-and-account-ownership.md).  
**Parent inventory and sequence:** [Auth refactor plan](2026-10-13-auth-refactor.md).  
**Requirements:** [Auth refactor spec](../specs/2026-10-13-auth-refactor-design.md).

This file owns tasks ARF-00 through ARF-06 and their execution checkboxes. The parent inventory shows the app-local candidate. Package layouts require an approved replacement destination/configuration map before migration; the existing paths below do not preselect topology. Paths below identify task membership; all are relative to `apps/web/src` unless stated otherwise. The approved implementer performs the tasks; the repository owner accepts decisions/scope. Do not treat file lists as current mutation authority.

## Preconditions

ARF-00 is a documentation/investigation task requiring its own approved scope, not prior selection of an app-local design. The owner selected app-local modules under ADR-0007 on 2026-10-17; no category/runtime amendment is needed. Before ARF-02 and subsequent source work, the owner approves ARF-01's exact mutation manifest/budgets and recovery baseline. The live working tree contains concurrent uncommitted auth work. Refresh it before execution, including callback flow reasons, the error-focus hook and the current resend-confirmation control/action. Preserve all current behavior; do not use the earlier auth-UI plan as execution authority.

## Tasks

### ARF-00: compare package layouts and obtain a concrete selection

**Depends on:** owner-authorized investigation/planning scope; no prior package selection required.  
**Code scope:** read-only live auth/account/adapter/route consumers, package manifests/exports and canonical workspace conventions/checklist.  
**Document outputs:** a reviewed candidate comparison and recommendation in ADR-0007; align the spec and parent/child inventories within an approved documentation scope. No package or source file is created by this task.

- [x] Classify current code by auth, account, form presentation, provider/platform effects and app composition; map actual imports and client/server execution needs.
- [x] Compare app-local modules, one auth package with narrow entry points, feature/service packages and account separation. Consider cohesion, independent tests, enforced imports, request context, exported API, coupling and maintenance cost. Do not require a second consumer.
- [x] For each candidate, show who owns Server Actions, session access, provider clients, browser events, forms and app-specific routing. Distinguish framework-specific packages from framework-independent contracts.
- [x] Identify exact names/categories, dependencies/exports, request-adapter contracts and canonical amendments the recommended package layout would need. Existing conventions are review constraints, not a reason to exclude it.
- [x] Give a concrete recommendation with tradeoffs and first-party/installed-version evidence for any version-sensitive technique; leave provider/session and profile-storage decisions unchanged.
- [x] Obtain owner selection of the layout and separately scoped approval of required governance changes.
- [x] Replace the app-local candidate map and task scopes with selected destinations, manifests/lockfile/configuration budgets and recovery requirements before ARF-01 executes. If app-local is selected, record why; do not treat it as the default imposed by ADR-0006. Selected 2026-10-17: app-local, recorded in ADR-0007; the parent map is confirmed with `resend-button.tsx` added. Budgets move to the ARF-01 manifest.

**Acceptance:** the owner can review a concrete layout, its contracts and costs against alternatives; the approved destination/configuration map matches that selection. No source migration or package creation occurs in this evaluation task.  
**Verification:** read back candidate evidence, local links, names/exports/dependency direction and source inventory; check versions/docs where proposed techniques depend on them. No runtime result is inferred from a paper comparison.  
**Recovery:** retain the proposal/evidence and revise only approved documentation hunks if the recommendation is declined. Do not remove or migrate source.

### ARF-01: approve scope and capture a recoverable baseline

**Depends on:** ARF-00; owner-selected topology, required governance amendments and exact execution scope approved.  
**Code scope:** read-only inventory of the parent migration/consumer lists; no product source edits.

- [x] Reconcile every source, destination and consumer against the live tree; record collisions and new consumers. Done 2026-10-17: 47 sources present, 0 collisions, consumers unchanged at 14 (`.agents/task-scope.md`).
- [x] Establish an exact task-scope manifest with one numeric budget per mutation class; approve recovery storage and preserve both tracked and untracked originals. Done 2026-10-17: budgets in `.agents/task-scope.md`; all originals are committed, so Git history is the recovery store.
- [x] Read relevant installed-version docs and confirm existing scripts/environment prerequisites without changing tooling. Done 2026-10-17: scripts confirmed; no move-specific framework API is involved.
- [x] Run baseline web unit/type checks and existing auth/home browser tests where the approved environment supports them; record failures and not-run cases. Done 2026-10-17 except e2e: unit 143/143 and types pass; e2e not run in the container (no Chromium), left to CI.
- [x] Confirm no source file changed since the captured baseline. Done 2026-10-17 at `6c511d7`.

**Acceptance:** every intended file operation is bounded and recoverable; evidence distinguishes pre-existing failures and unavailable live-provider behavior. No earlier Draft task scope grants source mutation authority.  
**Verification:** inventory/diff read-back; `pnpm --filter web test`, `pnpm --filter web check-types`, `pnpm --filter web test:e2e`. These baseline commands do not constitute final refactor verification.  
**Recovery:** baseline capture is non-product work; preserve its evidence. Do not reset/stash/clean mixed WIP.

### ARF-02: separate safe contracts and common form behavior

**Depends on:** ARF-01.  
**Source groups:** `app/auth/actions.ts`, `app/[userId]/settings/actions.ts`; `lib/auth/error-messages/error-messages.ts` and its test; `lib/auth/profile/profile.ts` and its test; `lib/auth/name/name.ts` and its test; `components/auth/form/auth-field.tsx`, `form-message.tsx`, `use-focus-first-error.ts`, `use-confirmation.ts`, `use-cooldown.ts` in that same directory.  
**Targets:** selected-layout destinations for the capability contracts, current-user mapper, metadata/name helpers, common form/focus behavior and auth feedback; the parent currently illustrates app-local paths only.  
**Consumer updates:** current auth login/register/resend/recovery/password forms and account profile form; auth actions; settings action/page; session reader; auth display/provider consumers. Include exact paths in the approved execution manifest.

- [ ] Extract AuthState/AuthFieldName and ProfileState to their mapped shared feature contracts without changing returned data.
- [ ] Split display-profile mapping from metadata-write preservation; keep every existing test assertion under the corresponding owner.
- [ ] Move pure name validation to account's shared module and update registration's narrow dependency.
- [ ] Place common field/message rendering and error-focus behavior with the selected common presentation owner; `components/forms` is the app-local candidate. Keep auth-specific confirmation/edit state and resend cooldown behavior with auth. Use a minimal presentation-state contract for common forms rather than importing AuthState.
- [ ] Keep auth field-error association feature-owned and reuse the common message ID; update all affected imports.
- [ ] Verify error announcements, first-invalid/empty-field focus, message fallback focus and profile-form focus remain intact.

**Acceptance:** account UI no longer imports auth state/presentation; contracts expose no secrets; every helper assertion survives; focus targeting and dependencies remain correct.  
**Verification:** moved helper suites via web tests, web type checks, existing browser field-error/focus cases. Add assertions only for a demonstrated gap at explicitly approved test destinations.  
**Failure signals:** dropped metadata fields/assertions, changed message IDs, focus resetting to the skip link, token-bearing shared types or a feature cycle.  
**Recovery:** restore this task's hunks and moved originals from the live baseline, not stale HEAD.

### ARF-03: establish app-owned routing and access helpers

**Depends on:** ARF-02.  
**Source groups:** `lib/auth/home-path`, `lib/auth/safe-next`, `lib/auth/auth-flow`, `lib/auth/require-owner` (each exact implementation/test pair in the parent table), and `lib/supabase/route-access.ts`/`.test.ts`.  
**Targets:** selected app-policy and identity-adapter destinations; parent's `lib/routing` and `lib/access` rows are the app-local example, not a requirement that reusable identity helpers remain app-local.  
**Consumers:** auth actions/callback/error page/status/link controls; user layout/pages; Supabase middleware adapter. Leave `proxy.ts` stable when its delegation is unchanged.

- [ ] Move destination/encoding, safe-next, flow/recovery path and route-classification helpers without algorithm or constant changes.
- [ ] Move the owner guard and its existing tests; retain server verification and the current response for a stranger's ID.
- [ ] Update every real consumer and preserve `confirm`, `reset`, `oauth` and unknown-flow fallback behavior.
- [ ] Confirm route paths, protected/guest classification, callback URL shape and proxy behavior have not changed.

**Acceptance:** route policy is outside the Supabase adapter; flow reason helpers are accounted for; URL inputs remain untrusted and ownership checks remain effective.  
**Verification:** moved path/flow/guard tests, web types, existing auth error-reason and access browser cases where covered.  
**Failure signals:** lost query discriminators, unencoded IDs, guest redirect loops, open redirects or authorization based on a URL/display metadata.  
**Recovery:** restore only this task's moved files/import hunks from the approved baseline; preserve other feature work.

### ARF-04: give account editing its own implementation

**Depends on:** ARF-03.  
**Sources:** `components/auth/profile/profile-form.tsx`, `app/[userId]/settings/actions.ts`.  
**Targets:** selected account module/package and framework-adapter locations; the app-local examples are `features/account/components/profile-form.tsx` and `features/account/server/actions.ts`, with helpers established by ARF-02.  
**Existing consumer:** `app/[userId]/settings/page.tsx`.

- [ ] Move the profile form/action and update its route consumer.
- [ ] Preserve caller verification, metadata preservation, token refresh and partial-success feedback.
- [ ] Use common fields/messages/focus behavior without imports into auth presentation or action contracts.
- [ ] Confirm no storage query, schema, profile source-of-record choice or route change was introduced.

**Acceptance:** the name-edit capability is independently locatable and its behavior unchanged.  
**Verification:** web unit/type checks and existing metadata tests; manual name-edit/header-refresh check only in an authorized live environment. Report it not verified otherwise.  
**Recovery:** restore this task's files/import hunks; never overwrite concurrent changes to the original settings action.

### ARF-05: consolidate auth implementation and wire its consumers

**Depends on:** ARF-04.  
**Source groups:** `app/auth/actions.ts`; `lib/auth/session.ts`; `lib/auth/origin` implementation/test; `lib/auth/auth-events` implementation/test; `components/auth/provider/user-provider.tsx`; all mapped auth button/display/login/register/resend/recovery/password/shell components, including `components/auth/forgot-password/resend-reset-link.tsx`.  
**Targets:** approved auth package/module and adapter map; parent auth feature rows are one candidate. If packages are selected, include their approved manifests/exports/build/test discovery and consumer updates in the exact scope. No operation extraction yet.  
**Consumer scope:** parent's existing app route/layout list and moved feature files. Browser/server Supabase factories remain in place.

- [ ] Move auth actions, server readers/origin helper, client provider/event filter and auth components to selected destinations, including approved package boundaries where chosen.
- [ ] Keep client directives, action entry points, request caching, server/client separation and current render behavior intact.
- [ ] Update route/layout imports and preserve callback/proxy framework adapters.
- [ ] Search for superseded imports before removing old copies within the approved move budget.
- [ ] Check signed-in/out presentation, confirmation/resend behavior and focus, pending states and cross-tab refresh behavior with appropriate evidence.

**Acceptance:** route files no longer own reusable actions/contracts; auth is cohesive; no duplicate implementations or mixed server/client barrel exists.  
**Verification:** scoped formatting, web tests/types, auth/home browser tests and import review. Browser mocks do not establish a live session or OAuth.  
**Recovery:** restore only this task's moves/import changes using tracked and untracked originals captured at ARF-01.

### ARF-06: verify the foundation before extracting workflows

**Depends on:** ARF-05.  
**Code scope:** no production changes; existing `apps/web/e2e/auth.e2e.ts` and `apps/web/e2e/home.e2e.ts` only if a demonstrated regression gap needs an approved assertion.

- [ ] Compare the foundation diff against the exact manifest and preserved baseline.
- [ ] Verify account-to-auth presentation/state dependencies and old source imports are gone.
- [ ] Run focused web checks and available browser/manual invariants; retain evidence for any uncovered live-provider behavior.
- [ ] Stop on a behavior regression; do not hide it by changing expected results or broadening scope.

**Acceptance:** foundation behavior is supported by the recorded evidence; missing coverage and baseline blockers are explicit. Operation tasks remain blocked until this checkpoint passes or the owner explicitly revises scope.  
**Verification:** web unit/type/e2e checks and scoped source formatting. Final whole-repository verification is exclusively ARF-12 in the parent plan.  
**Recovery:** report failure; restore only authorized foundation hunks if recovery is separately authorized.

## Exit

ARF-06 provides the prerequisite evidence for the operation plan. All checkboxes remain unchecked. Existing source changes may overlap tasks; assess and verify them rather than inferring implementation absence or completion from these documents. Package selection is still open.
