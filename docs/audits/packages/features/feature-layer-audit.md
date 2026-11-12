<!--
Provenance (added on preservation; not part of the audit text)
- Produced: 2026-11-11, in the Claude Code session that ran the read-only feature-layer audit on branch feat/register-auth-flow.
- Method: the session read the feature packages first and recorded preliminary findings FA-01..FA-16 (Appendix 1). It then handed the audit, with those findings, to a delegated agent. The agent re-verified them, completed the remaining scope and ran the checks in an isolated worktree at commit 9ee59e3cdbc8a34450d0e35f50dc946702a8997d.
- Status: the report below is reproduced unchanged from the delegated agent's final report. Appendix 1 is reproduced unchanged from the session's preliminary notes. Nothing has been revised for later commits; see feature-layer-consolidated.md for reconciliation.
- Probe files cited in section L were in the session scratchpad under /private/tmp. They are temporary and may no longer exist.
-->

# Feature-package architecture audit: Synapcity `packages/features/*`

**Commit audited:** `9ee59e3cdbc8a34450d0e35f50dc946702a8997d` (branch `feat/register-auth-flow`), checked out detached in an isolated worktree. The tree was clean before and after: no repository file was changed, and the throwaway probes live in the scratchpad (paths in L).

**Confidence limit:** the server remediation workstream's uncommitted work is not in this clone (`server-account/src/account-deletion/`, `avatar-objects.ts`, edits to `save-avatar.ts`, deletion of `apps/web/src/features/auth/server/operations/*`). Every finding that touches account deletion, avatars or auth operations describes 9ee59e3c only.

---

## A. Executive assessment

The five feature packages mostly match ADR-0014 and the workspace conventions.

- `pnpm boundaries` reports no violations across 2130 files.
- Server entries carry `import 'server-only'`.
- Feature graphs are acyclic: auth → account only.
- Dashboards and settings show strong workflow design: honest save states, drafts with an unsaved-changes guard, and tests for race conditions.

Three things matter most:

1. **FA-01, verified defect, HIGH.** The shipped register form cannot create an account. The form validates with the transitional `signUpSchema` and submits `name`. The `signUp` action parses `registrationSchema`, which requires `firstName` and `confirm`. A probe shows a valid browser submission is refused on the server with "Enter your first name." pointing at `firstName`, a field the form does not have. No unit test or e2e spec covers a valid form-to-action submission.
2. **FA-04, verified defect (unit level), MEDIUM.** A dashboard store replaced while an edit is pending:
   - The old store's cleanup `flush()` saves that edit at revision R. The server moves to R+1.
   - The new store starts from the R snapshot, so the edit disappears from screen.
   - The next edit gets a false `conflict` and saving stops.

   One trigger is inside the feature itself: `LinkItemsLoader` calls `onReload` (`router.refresh()`) after a save. Others are app-side: quick-create's `revalidatePath('/', 'layout')` and refresh, and UserProvider's `USER_UPDATED` refresh.

3. **FA-03, architectural concern, MEDIUM.** In account and auth, the `src/frontend/next/` split exists in name only. `./frontend` re-exports `next/`, and non-`next` components import `next/` siblings, so the whole `./frontend` graph needs `next/navigation`. Evidence: 5 non-`next` test files mock `next/navigation`. This breaks entry-point rule 7, even though R11 passes on direct imports.

**Pre-existing failure at the audited commit:** `pnpm test` fails in `apps/web/src/__guards__/identity-boundary.test.ts`. The allowlist still expects 2 direct identity calls in `features/auth/server/operations/operations.ts`, and 9ee59e3c moved one to server-supabase (VER-01). The server workstream deletes `operations/*`, so it owns this fix.

The rest are low-severity drift and inconsistency:

- hardcoded `/auth/*` routes;
- an unread `linkRequired`;
- an unhandled rejection in `RecordSpaceView`;
- settings' 33-module `export *` entry;
- `testing/` placement varies by package;
- app-side documents and dashboards collections identical apart from names.

---

## B. Feature package inventory

### account (`@synapcity/features-account`)

- **Intended responsibility:** name, avatar and profile workflows and presentation.
- **Actual:** display-name-only `NameField`/`NameForm`, `ProfileSetupForm`, `ProfileSummary`, avatar field and form, `ProfileFormShell` (under `next/`).
- **Structure:** `contracts/`, `frontend/{components,next,types}`. 33 files.
- **Exports:** `./contracts`, `./frontend` (`export *` over 6 modules, including `next/components/profile-form-shell`).
- **Dependencies:** domain-identity, frontend-forms, frontend-ui, next, react.
- **Consumers:** web settings account tab, features-auth (profile-setup card).
- **Tests:** 10 files, 61 tests, no stories.
- **Concerns:** FA-02, FA-03.

### auth (`@synapcity/features-auth`)

- **Intended:** auth forms, flow feedback, host-owned destinations.
- **Actual:**
  - login, register, forgot and update password, email change, connected accounts, delete account, sign-in-again;
  - `UserProvider` and `CurrentUserAvatar`;
  - contracts: `AuthState`, error messages, `connectedAccountsFrom`, `LINK_SIGN_IN_WINDOW_MINUTES`.
- **Structure:** `contracts/utils/*`, `frontend/{components,hooks,next,providers,utils}`. 108 files.
- **Exports:** `./contracts`, `./frontend` (`export *` over 6 barrels, including `next/components` and `next/providers`).
- **Dependencies:** domain-identity, features-account, frontend-forms, frontend-supabase, frontend-ui, next.
- **Consumers:** web auth routes, settings account tab, app shell.
- **Tests:** 34 files, 270 tests, 1 story.
- **Concerns:** FA-01, FA-03, FA-05, FA-06, FA-07, FA-09, FA-15.

### dashboards (`@synapcity/features-dashboards`)

- **Intended:** dashboard canvas experience.
- **Actual:**
  - zustand store with keyboard moves, save scheduler, `DashboardWorkspaceProvider`, grid (react-grid-layout), widgets panel, widget shell and bodies;
  - browser storage adapter, focus utilities, `LinkItemsLoader`.
- **Structure:** `contracts/types`, `frontend/{components,config,hooks,storage,store,utils,widgets}`, `src/testing/` (no `./testing` export). 158 files.
- **Exports:** explicit named exports, about 13 names. This is the cleanest entry of the five.
- **Dependencies:** domain-dashboards, domain-grids, domain-prototypes, frontend-forms, frontend-blocks, frontend-ui, react-grid-layout, zod, zustand.
- **Consumers:** `apps/web/src/features/dashboards` (`DashboardView`, panel).
- **Tests:** 41 files, 275 tests, 22 stories.
- **Concerns:** FA-04, FA-18, FA-19, FA-20; prior D5 still present.

### settings (`@synapcity/features-settings`)

- **Intended:** settings presentation, drafts, workflow composition, server loader.
- **Actual:** as intended, plus `AccountPreferencesSync` (root layout).
- **Structure:**
  - `contracts/account-sync.ts`;
  - `frontend/{components,hooks,lib/data,providers,testing,types,utils}`; `server/account-preferences`;
  - an unused second barrel, `frontend/hooks/index.ts`, imported internally only.
  - 158 files.
- **Exports:** `./contracts`, `./frontend` (`export *` over 33 modules), `./server`.
- **Dependencies:** domain-preferences, frontend-preferences, frontend-ui, server-account, server-supabase, server-only. `zod` is a devDependency only, but a type import sits in production `use-settings-draft.ts:4`.
- **Consumers:** web root layout, settings layout and content, account tab. **6 names in use.**
- **Tests:** 40 files, 308 tests, 8 stories.
- **Concerns:** FA-12, FA-13, FA-14, FA-17, FA-21, SRV-16.

### spaces (`@synapcity/features-spaces`)

- **Intended:** Space browsing and detail.
- **Actual:** collection, detail content, previews, `RecordSpaceView`, server `getSpace`, `serverSpaceSource`.
- **Structure:** `contracts/types`, `frontend/{components,utils}`, `server/{get-space,server-space-source,types}`, `src/testing`. 51 files.
- **Exports:** `./contracts`, `./frontend`, `./server`.
- **Dependencies:** domain-records, domain-spaces, frontend-collection, frontend-ui, server-data, server-supabase.
- **Consumers:** web spaces routes, `lib/spaces`.
- **Tests:** 11 files, 68 tests, 6 stories.
- **Concerns:** FA-10, FA-11, SRV-05, SRV-09; prior D12 partly present.

---

## C. Feature ownership map

| Capability                                 | Owner at 9ee59e3c                                                                                                                | Host integration (web)                                                              |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Register, login, password, email-change UI | features-auth `frontend`                                                                                                         | `app/(auth)/auth/*` pages bind actions in `features/auth/server/actions/actions.ts` |
| Auth provider operations                   | moving to server-supabase (SRV-07)                                                                                               | app `features/auth/server/operations` (being deleted, uncommitted)                  |
| Recent-link sign-in rule                   | server-supabase `session-claims` (moved in 9ee59e3c)                                                                             | delete-account page; minutes copy stays in auth contracts (FA-16)                   |
| Profile name and avatar UI                 | features-account                                                                                                                 | settings account tab; app `features/account/server/actions/*`                       |
| Profile lifecycle (completed, skipped)     | Phase 4 (SRV-06/20)                                                                                                              | `setup-actions.ts`                                                                  |
| Settings drafts, tabs, provider            | features-settings `frontend`                                                                                                     | settings layout and content; `AccountPreferencesSync` in root layout                |
| Account preference load                    | features-settings `server` → server-account                                                                                      | settings page                                                                       |
| Dashboard canvas, store, saves             | features-dashboards                                                                                                              | app `DashboardView`, `serverDashboardStorage` adapter, save Server Action           |
| Dashboard collection and record view       | app `features/dashboards` (migration input)                                                                                      | dashboards routes                                                                   |
| Documents collection                       | app `features/documents` (migration input)                                                                                       | documents routes                                                                    |
| Home overview                              | app `features/home` (fixtures, labelled as sample)                                                                               | `home/page.tsx`                                                                     |
| Space browse and detail                    | features-spaces                                                                                                                  | `lib/spaces/*` actions, spaces routes                                               |
| Pin results                                | duplicated (D12): server-data `PinnedOutcome`, spaces `SetPinnedOutcome` and `SetSpacePinnedResult`, app `SetRecordPinnedResult` | `lib/records`, `lib/spaces`; branch `fix/r4-pin-toggle-race`                        |

---

## D. Package-by-package findings

### auth

- **FA-01 (verified).**
  - `packages/features/auth/src/frontend/components/register/register-form.tsx:9,38` uses `signUpSchema`. Fields are `name`, `email` and `password` (`:45-77`).
  - `apps/web/src/features/auth/server/actions/actions.ts:112-118` parses `registrationSchema` with `firstName`, `lastName`, `email`, `password`, `confirm`.
  - `domain-identity/src/credentials.ts:91-94` marks `signUpSchema` "transitional… remove once the form moves".
  - Probe result: client `ok: true`; server `{"message":"Enter your first name.","fields":["firstName"]}`.
  - The form renders no `firstName` field, so the message shows unattached in `FormMessage`. The action refills `firstName` while the form reads `state.data.user.name` (`register-form.tsx:53`), so the name field comes back empty.
  - Test gap: `register-card.dom.test.tsx:205` tests against `signUpSchema`. `e2e/auth.e2e.ts:215` only submits a short password, which the client refuses before any request.
- **FA-03.** Non-`next` components import from `next/`:
  - `components/password/password-reset/password-reset.tsx:8`
  - `delete-account/delete-account.tsx:24`
  - `connected-accounts/connected-accounts.tsx:29`
  - `register/register-card.tsx:6`
  - `password/forgot-password/forgot-password-card.tsx:6`
  - `current-user-avatar/current-user-avatar.tsx:4`

  `frontend/index.ts:3-4` re-exports `next/*`.

- **FA-05.** Routes are hardcoded: `next/components/auth-link-button/auth-link-button.tsx:22-25` and `next/components/login/login-form.tsx:63` (`/auth/forgot-password`).
- **FA-06.** `contracts/utils/form-state/form-state.ts:78` declares `linkRequired`, set at `app/(auth)/auth/delete-account/actions.ts:38`. The card never reads it; only the test fixture `delete-account-card.dom.test.tsx:65` uses it.
- **FA-07.** `contracts/utils/connected-accounts/connected-accounts.ts:9,40` uses the Supabase `identity_data` shape inside portable contracts. Domain rule 8 puts vendor shapes in `server-supabase`.
- **FA-09.** Login and UpdatePassword use plain `useActionState`; Register and ForgotPassword use `useActionForm`. This is prior audit D8, "B needs a decision", still open.
- **FA-15.**
  - `frontend/hooks/use-confirmation/use-confirmation.ts:23` uses `document.getElementById('email')` (hidden DOM coupling).
  - Hooks import their own package's public name: `use-cooldown.ts:5`, `use-confirmation.ts:5`, `providers/connected-accounts/connected-accounts.tsx:5` all use `@synapcity/features-auth/contracts`. They are type-only and R9 passes, but this is inconsistent with relative imports elsewhere.
  - Not re-checked at this commit: an orphaned comment above `LAST_SIGN_IN` in `error-messages.ts`, and fixed `hintId`s in ResendButton callers.

### account

- **FA-02.** `NameField`, `NameForm`, `ProfileSetupForm` and `ProfileState` model the display name only. The settings page passes raw `displayName` (`app/(protected)/[userId]/settings/page.tsx:27,44`; `features/settings/components/account-settings/index.tsx:55`). A user with only a first name sees "No name yet", and `settings-header.tsx:23` greets them with "Welcome.". Owner: Phase 4 (SRV-06/20) together with domain F1/F2.
- **FA-03.** `frontend/index.ts:5` re-exports `next/components/profile-form-shell`. `avatar-field.tsx:14`, `name-field.tsx:5`, `name-form.tsx:7`, `avatar-form.tsx:7` and `profile-setup-form.tsx:6` all import it.
- **Test note:** `name-form.test.tsx:14` mocks `react` itself, so its 4 tests depend on that mock. `name-form.dom.test.tsx` covers the real behaviour, so the two files overlap.

### dashboards

- **FA-04 (verified at store and scheduler level).** The two halves of the replacement:
  - `dashboard-workspace-provider.tsx:184-210` builds the new store during render.
  - `:213-221` runs effect cleanup → `connectSaves` disposer → `flush()` (`save-scheduler.ts:181-182`) with the old closure revision. The new store connects with `baseRevision: active.source.revision` from the refreshed snapshot.

  The probe models exactly this order:
  - **Pending edit:** saves `['ok@1->2', 'conflict@1']`; the new store shows 0 widgets (the old had 1); status `conflict`.
  - **Control (refresh after the save landed):** `['ok@1->2','ok@2->3']`, `saved`.

  Where new snapshots come from:
  - `DashboardView` (`apps/web/.../dashboard-view.tsx:137-155`) memoizes on the `composition` prop. Every RSC refresh delivers a new object (React Flight decoding; inference, high confidence), so any refresh replaces the store, even with no change.
  - In-feature trigger: `link-items-loader.tsx:38-43` calls `onReload` once status is `saved`. An edit made during that refresh hits the race.
  - App triggers: `quick-create-dialog.tsx` (`onUnconfirmed` → `router.refresh()`; `createRecord` → `revalidatePath('/', 'layout')`, `create-record-action.ts:91,96`), `user-provider.tsx:56` (`USER_UPDATED`), and possibly pin revalidation (SRV-21, `fix/r4-pin-toggle-race`).

  Doc and test gaps:
  - The README (`packages/features/dashboards/README.md:23`) says "saves for the abandoned store stop". That is true only when nothing is pending.
  - The provider tests (`dashboard-workspace-provider.test.tsx:179-266`) cover edits after replacement and late answers, never an edit pending at replacement time.

- **FA-18 (optional).** `contracts/types/dashboard-storage.ts:27` says "the browser adapter today, a server adapter later". The server adapter exists (`apps/web/.../server-dashboard-storage.ts`) and is pure, with no Next import, so it could move into the feature.
- **FA-19 (low).** `onReload` means two things: "Reload after a conflict" (`save-status.tsx:53`) and "re-read data for new link widgets" (`link-items-loader.tsx:42`, `link-body.tsx:80`). The second silently replaces the store, which FA-04 turns into a bug.
- **FA-20 (low).** The widget title rename (`widget-shell.tsx:113-145`) has no length limit, and the domain `title: z.string()` (`domain-dashboards/src/widget-base.ts:49`) has none either. An oversized composition fails at the server size cap as a generic failure. Not probed.
- **Prior D5 still present.** `utils/focus/focus.ts:41-92`: `focusPalette` polls each frame to take focus back from the contextual panel.
- **Prior D13 still present.** Inline `AlertDialog` at `widgets-panel.tsx:179-210`.
- **Strengths:**
  - store mutations all go through pure domain functions (`dashboard-store.ts:165-183`);
  - honest save-status machine (`save-scheduler.ts`);
  - browser storage refuses to overwrite invalid data (`browser-dashboard-storage.ts:113-128`);
  - keyboard move is accessible (`dashboard-grid.tsx:107-128`, announcements in the store).

### settings

- **FA-12.** `frontend/index.ts` has 33 `export *` lines; web consumes 6 names (`AccountPreferencesSync`, `SettingsPageShell`, `SettingsContent`, `SettingsAccordion`, `SettingsAccordionItem`, `SettingsTabShell`). Auth uses `export *` over 6 barrels too. Dashboards is explicit, with about 13 names. Knip does not check what an entry exports.
- **FA-13.** `settings-provider.tsx:53,82,355` exposes `updateName`; nothing consumes it.
- **FA-14 (info).** `AccountPreferencesSync` and `SettingsProvider.loadAccount` duplicate the reconcile-and-apply flow. The duplication is intended, but the two can drift.
- **FA-17 (low).** `zod` is a devDependency while production `use-settings-draft.ts:4` type-imports it. The import is erased at build, but the type dependency has no declared owner.
- **FA-21 (low, convention).**
  - Test support is at `src/frontend/testing/` (`test-harness.tsx`); conventions put it at `src/testing/`.
  - The provider's tests sit in `providers/settings-provider/tests/` (6 files) and `frontend/settings-coverage.dom.test.tsx`, not beside the code.
  - `frontend/hooks/index.ts` is a second hooks barrel that the entry bypasses.
  - `lib/data/` is used even though a kind folder name (`utils` or `config`) fits.
  - `utils/download/download.ts` is a DOM effect (anchor click, blob URL) inside `utils/`, which the conventions reserve for pure functions.
- **Plausible risk (FA-22, low).** `settings-provider.tsx:118-135` `persist` fires account saves without sequencing them. It reports only the newest outcome and relies on Next running Server Actions one at a time, while the `AccountSync` contract is transport-neutral. It also only sets an error and never clears an earlier one; not traced further.
- **Prior D10 resolved.** Settings now uses `frontend-ui/hooks/use-media-query`.
- **Other settings hooks.** Import, export, privacy, notifications, theme and regional were read. No defects found:
  - import strips privacy (`utils/import/import.ts:29-37`);
  - re-entry is guarded by a ref;
  - notification permission uses `useSyncExternalStore` with a server snapshot.

### spaces

- **FA-10.** `frontend/components/record-space-view/record-space-view.tsx:18` calls `void recordSpaceView(spaceId)` with no catch. The app's twin, `RecordDashboardView`, catches (`apps/web/.../record-dashboard-view.tsx:18`).
- **FA-11.** Commented-out code at `server/server-space-source/server-space-source.ts:16-19,42`.
- **Prior D12 still present.** `contracts/types/set-space-pinned-result.ts` equals `apps/web/src/lib/records/records.ts:20` `SetRecordPinnedResult`, and `server/types/space-source.ts:15` duplicates server-data `PinnedOutcome`. Coordinate with the pin-toggle branch and SRV-05.

### App-side migration inputs

- **FA-23 (credible risk, low).** Home:
  - `features/home/components/home-page/home-page-view.tsx:19-22,104-111` imports `FIXTURES`, `SPACE_NAMES` and `FIXTURE_NOW` itself, so the host cannot choose real data instead.
  - `home/page.tsx:20-30` has commented-out code. A comment at `home-page-view.tsx:57-58` says quick-create "is not built yet", but it is now.
  - The sample label is present and honest (`:77-85`).
- **FA-24 (accidental duplication).** These pairs are identical apart from names:
  - `documents/server/get-documents/get-documents.ts` and `dashboards/server/get-dashboards/get-dashboards.ts`;
  - `*-collection.tsx`, `*-index.tsx` and `lib/collection-item`, which differ only in copy and icon.

  The prior audit classed this as intentional (D15). The server read and the mapping are not product variation; only copy, icon and preview are.

---

## E. Cross-feature and cross-layer findings

| Pair                                                                           | Classification                                          | Note                                                                                                       |
| ------------------------------------------------------------------------------ | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `RecordSpaceView` (spaces package) and `RecordDashboardView` (app)             | Accidental near-duplicate; missing shared capability    | One handles rejection, the other does not (FA-10). A single generic "record view on mount" would fix both. |
| get-documents and get-dashboards; documents and dashboards collection wrappers | Accidental (read and mapping); intentional (copy, icon) | FA-24; D15 re-classified.                                                                                  |
| Pin result types ×4                                                            | Accidental (D12)                                        | Owned with the pin-toggle branch and SRV-05.                                                               |
| `AccountPreferencesSync` and `SettingsProvider.loadAccount`                    | Intentional (documented)                                | FA-14; drift risk.                                                                                         |
| `LINK_SIGN_IN_WINDOW_MINUTES` and the server's 600 s                           | Intentional, guarded by a web test                      | FA-16, acceptable.                                                                                         |
| `useActionForm` and plain `useActionState` in auth forms                       | Equivalent patterns needing a decision                  | FA-09 and D8.                                                                                              |
| Inline `AlertDialog` (widgets panel) and `ConfirmDialog`                       | Near-duplicate (D13)                                    | Still present.                                                                                             |
| Settings `./frontend` `export *`                                               | Too generic                                             | FA-12.                                                                                                     |
| `signUpSchema` and `registrationSchema`                                        | Transitional bridge left half-done                      | FA-01.                                                                                                     |
| `onReload` dual meaning                                                        | Too generic                                             | FA-19.                                                                                                     |

Cross-layer:

- `connectedAccountsFrom` (FA-07) puts a vendor shape in feature contracts.
- `serverDashboardStorage` (app) is a pure adapter that belongs with the feature (FA-18).
- Both are fine as recorded transition items.

---

## F. Structural convention evaluation

- **Keep:**
  - the feature `contracts` / `frontend` / `server` split; boundaries and R6 are clean;
  - explicit named entry exports, the dashboards style;
  - colocated `*.test.tsx` / `*.dom.test.tsx` files;
  - the dashboards store and scheduler split into `store/` and `storage/`.
- **Change: R11 / `next/` in account and auth (FA-03).** As used, it gives no isolation. Either:
  - (a) add a real `./frontend/next` entry and make non-`next` components take navigation through props or slots (the ADR-0009 `signInHref` pattern); or
  - (b) admit these packages are Next-bound and drop the pretend split.

  See K1. Add a transitive check later; today's check only sees direct imports.

- **Simplify:**
  - settings and auth `export *` entries → explicit lists matching real consumers (FA-12);
  - remove the unused `frontend/hooks/index.ts` in settings.
- **Change (light):**
  - put `testing/` at `src/testing/` in every package (settings is the odd one);
  - add `./testing` exports only when a consumer outside the package needs them; none does today.
- **Do not impose:**
  - moving settings provider tests out of `tests/`; the grouping into 6 files is cohesive;
  - re-foldering `lib/data` until someone touches it. Conventions say uniformity alone is not a reason.

---

## G. Test ownership and quality

**Totals at 9ee59e3c (`pnpm test`):**

| Package    | Tests                  | Files |
| ---------- | ---------------------- | ----- |
| account    | 61                     | 10    |
| auth       | 270                    | 34    |
| dashboards | 275                    | 41    |
| settings   | 308                    | 40    |
| spaces     | 68                     | 11    |
| web        | 975 (1 failed, VER-01) | 90    |

There are no `.skip`, `.only` or `.todo` markers in features or web.

**Strengths:**

- dashboards race tests (`dashboard-workspace-provider.test.tsx:179-266`, `save-scheduler.test.ts`);
- browser-storage invalid-data tests;
- settings provider boot, look and account suites.

**Gaps:**

1. No test drives the real RegisterForm submission through `signUp` (FA-01). The unit test validates against the same wrong schema, so it confirms the defect.
2. No provider test replaces the store while an edit is pending or in flight (FA-04).
3. No test covers the `LinkItemsLoader` reload followed by a user edit.
4. `RecordSpaceView` rejection is untested.
5. Delete-account `linkRequired` UI is untested; nothing reads it.

**Mock quality:**

- Five non-`next` component tests mock `next/navigation`, a symptom of FA-03.
- `name-form.test.tsx` mocks `react`, which is fragile; prefer the dom test.
- Toast is mocked in 8 account and auth tests, which is acceptable.
- Web action tests mock server modules, so they prove orchestration, not provider behaviour.

**Placement:** colocated except settings (FA-21). The web identity guard is a good tripwire, but its allowlist is stale (VER-01).

---

## H. Findings register

| ID     | Sev        | Type                                           | Evidence                                                                                                                             | Root cause                                                             | Impact                                                   | Consumers                    | Correction                                                                                                                                                                                           | Compat risk              | Regression tests                                                                                                                                                                        | Owner / overlap                                     |
| ------ | ---------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- | -------------------------------------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| FA-01  | HIGH       | Verified defect (probe)                        | `register-form.tsx:9,38,45-77`; `actions.ts:112-118`; `credentials.ts:91-94`                                                         | Server moved to `registrationSchema`; form left on transitional schema | Every email sign-up refused                              | `/auth/register`             | Form gains firstName (required), lastName, confirm; validate with `registrationSchema`; refill from `firstName`; then remove `signUpSchema`, `AuthState.data.user.name`, `'name'` in `AuthFieldName` | Low (form data contract) | dom test: valid submit sends firstName/lastName/email/password/confirm; action test with the form's FormData; e2e valid registration up to "check your email" (fixture-skip permitting) | Register UI workstream (this branch)                |
| FA-02  | MED        | Verified by trace                              | `settings/page.tsx:27,44`; `account-settings/index.tsx:55`; `settings-header.tsx:23`                                                 | Profile UI models display name only                                    | First-name-only users see "No name yet" and "Welcome."   | settings                     | Phase 4 profile form; derive greeting from domain F1 rule                                                                                                                                            | Med                      | Header and summary tests with first-name-only claims                                                                                                                                    | SRV-06/20 Phase 4; domain F1/F2                     |
| FA-03  | MED        | Architectural                                  | `auth/src/frontend/index.ts:3-4`; `account/src/frontend/index.ts:5`; 11 import sites (D)                                             | `next/` folder without a `./next` entry; components reach into it      | `./frontend` is Next-bound; tests mock `next/navigation` | web, Storybook, future hosts | K1                                                                                                                                                                                                   | Med (public entry shape) | Boundary probe for transitive `next` from `./frontend`                                                                                                                                  | Unowned; after register and Phase 4                 |
| FA-04  | MED        | Verified defect (unit probe); trigger inferred | `dashboard-workspace-provider.tsx:184-221`; `save-scheduler.ts:181-182`; `dashboard-view.tsx:137-155`; `link-items-loader.tsx:38-43` | Replacing the store loses the pending-edit and revision handoff        | Edits vanish on screen, false conflict, saving stops     | dashboard page               | K3                                                                                                                                                                                                   | Low                      | Provider test: edit then rerender with same-revision snapshot → no false conflict and edit kept; web test: refresh during debounce                                                      | Dashboards; coordinate SRV-21 and pin-toggle branch |
| VER-01 | MED (gate) | Verified failing test                          | `__guards__/identity-boundary.test.ts:18-21,63`                                                                                      | 9ee59e3c moved an op; allowlist not updated                            | `pnpm test` / `verify` red                               | CI                           | Update or remove entry with the `operations/*` deletion                                                                                                                                              | None                     | The guard itself                                                                                                                                                                        | Server remediation (SRV-07)                         |
| FA-05  | LOW        | Arch                                           | `auth-link-button.tsx:22-25`; `login-form.tsx:63`                                                                                    | Destinations not host-supplied                                         | Other hosts can't route                                  | web                          | Host-supplied hrefs (signInHref pattern)                                                                                                                                                             | Low                      | Link href tests via props                                                                                                                                                               | With FA-03                                          |
| FA-06  | LOW        | Dead contract                                  | `form-state.ts:78`; `delete-account/actions.ts:38`                                                                                   | UI never read it                                                       | Message state may be unclear                             | delete-account               | Read it in `DeleteAccountCard` or drop it                                                                                                                                                            | Low                      | Card test on `linkRequired`                                                                                                                                                             | SRV-01 overlap; confirm against uncommitted work    |
| FA-07  | LOW        | Arch                                           | `connected-accounts.ts:9,40`                                                                                                         | Vendor shape in contracts                                              | Portability                                              | settings, auth               | Map in server-supabase; contracts take a neutral shape                                                                                                                                               | Low                      | Mapping test moves                                                                                                                                                                      | SRV-07                                              |
| FA-09  | LOW        | Inconsistency                                  | Login and UpdatePassword vs Register and ForgotPassword                                                                              | D8 undecided                                                           | Divergent validation UX                                  | auth                         | K2                                                                                                                                                                                                   | Low                      | per-form                                                                                                                                                                                | Register workstream                                 |
| FA-10  | LOW        | Verified by read                               | `record-space-view.tsx:18`                                                                                                           | Missing catch                                                          | Unhandled rejection noise                                | space page                   | `.catch` or a shared component                                                                                                                                                                       | None                     | Rejection test                                                                                                                                                                          | Spaces                                              |
| FA-11  | LOW        | Hygiene                                        | `server-space-source.ts:16-19,42`                                                                                                    | Leftover                                                               | Noise                                                    | –                            | Delete when touched                                                                                                                                                                                  | None                     | –                                                                                                                                                                                       | SRV-14/15                                           |
| FA-12  | LOW        | Optional                                       | settings `frontend/index.ts` (33×`export *`); auth (6)                                                                               | Wildcard entries                                                       | Unintended public surface                                | web                          | Explicit exports                                                                                                                                                                                     | Low                      | Entry-shape test (optional)                                                                                                                                                             | Settings, auth                                      |
| FA-13  | LOW        | Dead API                                       | `settings-provider.tsx:53,82,355`                                                                                                    | Transitional                                                           | Confusion with Phase 4                                   | –                            | Remove or define under Phase 4                                                                                                                                                                       | Low                      | –                                                                                                                                                                                       | Phase 4                                             |
| FA-14  | INFO       | Intentional duplication                        | `AccountPreferencesSync`, `loadAccount`                                                                                              | Documented                                                             | Drift                                                    | –                            | Share one reconcile helper when touched                                                                                                                                                              | –                        | Parity test                                                                                                                                                                             | Settings                                            |
| FA-15  | LOW        | Hygiene                                        | `use-confirmation.ts:23`; self-imports                                                                                               | –                                                                      | Hidden coupling                                          | auth                         | Ref/prop focus; relative imports                                                                                                                                                                     | None                     | –                                                                                                                                                                                       | Register workstream                                 |
| FA-16  | INFO       | Accepted                                       | minutes vs 600 s                                                                                                                     | –                                                                      | –                                                        | –                            | Keep                                                                                                                                                                                                 | –                        | Existing web test                                                                                                                                                                       | –                                                   |
| FA-17  | LOW        | Dependency hygiene                             | `use-settings-draft.ts:4`; `settings/package.json`                                                                                   | zod dev-only                                                           | None at runtime                                          | –                            | Declare zod (or import the type via domain)                                                                                                                                                          | None                     | –                                                                                                                                                                                       | Settings                                            |
| FA-18  | LOW        | Optional                                       | `dashboard-storage.ts:27`; app `server-dashboard-storage.ts`                                                                         | Migration not finished                                                 | Doc drift                                                | web                          | Move adapter into the feature; fix comment                                                                                                                                                           | Low                      | Move existing test                                                                                                                                                                      | Dashboards                                          |
| FA-19  | LOW        | Arch                                           | `onReload` uses (D)                                                                                                                  | Overloaded callback                                                    | Feeds FA-04                                              | web                          | Split into `onReloadAfterConflict` / `onNeedsItems`                                                                                                                                                  | Low                      | –                                                                                                                                                                                       | With FA-04                                          |
| FA-20  | LOW        | Credible risk (unprobed)                       | `widget-shell.tsx:113-145`; `widget-base.ts:49`                                                                                      | No title bound                                                         | Opaque save failure                                      | dashboards                   | Domain max plus UI `maxLength`                                                                                                                                                                       | Low (domain)             | Domain and shell tests                                                                                                                                                                  | Domain session                                      |
| FA-21  | LOW        | Convention                                     | settings `frontend/testing`, `hooks/index.ts`, `lib/data`, `utils/download`                                                          | Organic growth                                                         | Navigation cost                                          | –                            | Align when touched                                                                                                                                                                                   | None                     | –                                                                                                                                                                                       | Settings                                            |
| FA-22  | LOW        | Plausible risk                                 | `settings-provider.tsx:118-135`                                                                                                      | Unsequenced saves                                                      | Order relies on Next                                     | settings                     | Sequence in provider or document in the AccountSync contract                                                                                                                                         | Low                      | Two-save ordering test                                                                                                                                                                  | Settings                                            |
| FA-23  | LOW        | Migration input                                | `home-page-view.tsx:19-22,57-58,104-111`; `home/page.tsx:20-30`                                                                      | Fixtures in view                                                       | Host cannot choose data                                  | home                         | Pass fixtures from the page; remove stale comment and commented code                                                                                                                                 | Low                      | Existing                                                                                                                                                                                | Home migration                                      |
| FA-24  | LOW        | Accidental duplication                         | documents/dashboards `get-*`, `*-index`, `collection-item`                                                                           | Copy-paste per resource                                                | Double maintenance                                       | web                          | Shared record-collection reader and mapper; keep copy/icon/preview per kind                                                                                                                          | Low                      | Existing collection tests                                                                                                                                                               | Collection migration; supersedes D15 classification |

---

## I. Proposed target organization (only where justified)

Account and auth, if K1 option (a) is chosen:

```
packages/features/auth/src/
  contracts/            (vendor identity shape removed, FA-07)
  frontend/             (framework-neutral; navigation via props/slots)
    components/ hooks/ providers/ utils/ index.ts   (explicit exports)
  frontend/next/        (UserProvider, AuthLinkButton, SignInAgain, LoginForm wiring)
    index.ts            → package.json "./frontend/next"
```

Account follows the same shape (`ProfileFormShell` behind `./frontend/next`). Dashboards needs no restructure; only `serverDashboardStorage` moves to `frontend/storage/server-dashboard-storage/`. Settings: `src/frontend/testing/` becomes `src/testing/`, and the unused `frontend/hooks/index.ts` goes.

---

## J. Prioritized remediation plan

Each phase can be verified on its own.

1. **Phase 0, gate (server workstream).** Fix VER-01 together with the `operations/*` deletion. Verify with `pnpm test` (web guard green).
2. **Phase 1, register (this branch).** FA-01, then FA-09/FA-15 if K2 decides. Remove `signUpSchema` and the transitional `name` fields after the form moves. Verify with a new dom test, an action test using the form's real FormData, and an e2e valid submit. Coordinate with Phase 4 so first-name rules match domain F1.
3. **Phase 2, dashboards replacement safety.** FA-04 and FA-19 (K3).
   - Independent of server work.
   - Coordinate with `fix/r4-pin-toggle-race` and SRV-21: adding revalidation after pin widens FA-04's triggers, so land this first or together.
   - Verify with the provider tests from H and a web `DashboardView` test that rerenders with an equal-revision snapshot during the debounce.
4. **Phase 3, Phase 4 profile (SRV-06/20).** It absorbs FA-02 and FA-13. Only cross-reference it here.
5. **Phase 4, entry hygiene.** FA-03/FA-05 (K1), then FA-12, FA-17, FA-21. Do this after Phases 1 and 3 so the register and profile forms are not churned twice. Verify with `pnpm boundaries`, `deps`, `typecheck`, and storybook tests.
6. **Phase 5, small fixes.** FA-10, FA-11 (with SRV-14/15), FA-06 (after the SRV-01 code lands), FA-18, FA-20 (domain session), FA-22.
7. **Phase 6, migration inputs.** FA-23, FA-24; D12 together with the pin branch.

---

## K. Owner decisions

- **K1, Next coupling in account and auth.**
  - (a) Real `./frontend/next` entry, with host-supplied navigation. Portable, matches entry-point rule 7 and ADR-0009. Costs a public API change for web and Storybook.
  - (b) Declare both packages Next-bound and drop the `next/` split. Honest and cheap, but blocks desktop and mobile reuse.
  - (c) Leave as is. Misleading.
  - **Recommendation:** (a), after register and Phase 4 land.
- **K2, auth form pattern (D8).**
  - (a) `useActionForm` everywhere: client refusal equals server refusal, one pattern.
  - (b) Plain `useActionState` everywhere: fewer moving parts, server-only validation.
  - **Recommendation:** (a). Register and ForgotPassword already use it, and FA-01 shows client and server must share one schema.
- **K3, dashboard store replacement.**
  - (a) Don't replace when the new snapshot's revision is ≤ the live scheduler's revision and the dashboard id is the same (compare by revision, not object identity). Smallest change, but needs the scheduler to expose its revision.
  - (b) Before replacing, flush and await, then re-read. Correct, but async inside the render-derived pattern.
  - (c) On replacement, carry pending changes and the latest revision into the new store. Most complete, but more state to hand over.
  - **Recommendation:** (a), plus splitting `onReload` (FA-19) so the link-items refresh never needs a replacement.
- **K4, collections duplication (FA-24 vs prior D15 "intentional").** Confirm whether the server read and mapping may be shared, with copy, icon and preview staying per kind. **Recommendation:** share them.

---

## L. Verification

**Commit:** `9ee59e3cdbc8a34450d0e35f50dc946702a8997d`, detached checkout. `pnpm install --frozen-lockfile` changed no tracked files, and `git status` was clean before and after.

| Command               | Result                                                                                                                                                                                                            |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm format:check`   | pass                                                                                                                                                                                                              |
| `pnpm lint`           | pass (32/32)                                                                                                                                                                                                      |
| `pnpm typecheck`      | pass (37/37)                                                                                                                                                                                                      |
| `pnpm deps` (Knip)    | pass                                                                                                                                                                                                              |
| `pnpm boundaries`     | pass: "2130 files across 39 workspaces, no violations"                                                                                                                                                            |
| `pnpm test`           | **FAIL**: web 1 failed / 974 passed (`identity-boundary.test.ts`, VER-01); every other package passes (counts in G)                                                                                               |
| `pnpm build`          | pass                                                                                                                                                                                                              |
| `pnpm test:storybook` | pass: 178 files, 582 tests                                                                                                                                                                                        |
| `pnpm test:e2e`       | **Not run, environmental**: web server never started because `NEXT_PUBLIC_SUPABASE_URL` is not set (no `apps/web/.env.local` in this worktree); timed out after 120 s. Chromium is installed. Not a code finding. |

**Probes** (outside the repo, run with the package's vitest and an external config):

- `/private/tmp/claude-501/-Users-hanaasadoqi-Projects-synapcity-worktrees-active-features-auth-flows/ac6d127b-ec23-4645-b908-a5c6a9390785/scratchpad/probe-dash/fa01.probe.test.ts` confirms FA-01.
- `/private/tmp/claude-501/-Users-hanaasadoqi-Projects-synapcity-worktrees-active-features-auth-flows/ac6d127b-ec23-4645-b908-a5c6a9390785/scratchpad/probe-dash/fa04.probe.test.ts` confirms FA-04 and passes its control case.
- Config: `/private/tmp/claude-501/-Users-hanaasadoqi-Projects-synapcity-worktrees-active-features-auth-flows/ac6d127b-ec23-4645-b908-a5c6a9390785/scratchpad/probe-dash/vitest.config.mts`.
- Logs: `/private/tmp/claude-501/-Users-hanaasadoqi-Projects-synapcity-worktrees-active-features-auth-flows/ac6d127b-ec23-4645-b908-a5c6a9390785/scratchpad/*.log`.

**Not run:** `pnpm verify` as a whole, `brand:check`, `test:scripts`, `test:coverage`, and all database commands (Docker; excluded by the task).

**Not verified:**

- FA-04 in a real browser with a real `router.refresh()`. The fact that RSC delivers new prop identity is an inference.
- FA-01 end to end against Supabase; it is proven at the schema boundary the action uses.
- FA-20 size-cap behaviour.
- FA-22 ordering under Next's action queue.
- Anything in the server workstream's uncommitted changes (account deletion, avatars, operations removal).
- The FA-15 sub-items noted in D as not re-checked at this commit.

---

## Appendix 1. Preliminary findings recorded before the hand-off (unchanged)

These notes were written at HEAD 9ee59e3c before the delegated pass. The report above re-verified and supersedes them. They are kept for provenance: a few sub-items appear only here (for example FA-08, the transitional `AuthState` `name`, which the report folds into FA-01).

```text
# Feature-layer audit — progress notes (read-only, HEAD 9ee59e3c, local branch 19 ahead of origin)

Covered: inventory of 5 packages; spaces, account, auth (all source), settings (provider, drafts, guard, tabs, server), dashboards (contracts, save scheduler, workspace provider, store provider) and web host wiring for each.
Not yet covered: dashboards store/widgets/grid/panel, settings tab components, test-quality review, app-side home/documents/dashboards collection, verification commands.

Server workstream (scratchpad 3424d8b4/server-remediation-plan-rev2.md) already owns: SRV-05 SpaceSource row types, SRV-19 playground fan-out, SRV-21 pin revalidation, SRV-16 settings loader wrapper, SRV-06/20 profile lifecycle incl. features-account form fields, recent-link-sign-in move (done 9ee59e3c).

## Findings so far
- FA-01 HIGH verified-by-reading: RegisterForm (features-auth register-form.tsx) validates with transitional signUpSchema and submits name/email/password; web signUp action parses registrationSchema (firstName required, confirm required). Every email sign-up through the form is refused. Owner: register UI workstream. Needs probe + e2e check.
- FA-02 MED: features-account name/profile forms model display name only (NameField "name"); no first/last name editing; settings ProfileSummary shows "No name yet" and SettingsHeader greets "Welcome." for first-name-only users (page passes raw displayName). Owner: Phase 4 profile lifecycle.
- FA-03 MED arch: `src/frontend/next/` split (R11) is nominal — non-next components (AvatarField, NameField, ConnectedAccounts, DeleteAccount, PasswordReset, RegisterCard, CurrentUserAvatar…) import next/ siblings, so whole ./frontend graph depends on next/navigation. Portability claim in README not delivered.
- FA-04 MED risk: dashboards — any router.refresh/revalidatePath('/', 'layout') while on a dashboard yields new composition prop identity → sameSource false → store replaced (selection/undo lost); old store cleanup flush() saves pending edits at old revision, new store built from older snapshot revision → next save = false conflict, saving stops. Triggers: UserProvider USER_UPDATED, many actions revalidate '/' layout. README says "saves for the abandoned store stop" but cleanup flushes. Needs test.
- FA-05 LOW: features-auth hardcodes /auth/* routes (AuthLinkButton, LoginForm forgot link) despite host-owned destinations (ADR-0009).
- FA-06 LOW: DeleteAccountState.linkRequired returned by action, never read by DeleteAccountCard.
- FA-07 LOW: connectedAccountsFrom in ./contracts takes Supabase identity shape (identity_data) — adapter mapping in feature contract.
- FA-08 LOW: AuthState transitional `name`, AuthFieldName includes `name`; remove with FA-01.
- FA-09 LOW: login/update-password forms use plain useActionState (no client schema) while register/forgot use useActionForm — inconsistent equivalent patterns; updatePasswordSchema unused client side.
- FA-10 LOW: RecordSpaceView `void recordSpaceView()` — rejected promise unhandled.
- FA-11 LOW: commented-out imports/code in features-spaces server-space-source.ts.
- FA-12 LOW: settings ./frontend exports ~30 modules; web uses ~6 (SettingsPageShell, AccountPreferencesSync, SettingsContent, SettingsAccordion(+Item), SettingsTabShell). Knip blind to entry exports.
- FA-13 LOW: SettingsProvider holds profile `name`/`updateName` (updateName unused) — profile data shadowed in preferences context.
- FA-14 INFO: AccountPreferencesSync and SettingsProvider.loadAccount duplicate reconcile/apply orchestration (documented, intentional; drift risk).
- FA-15 LOW: orphaned doc comment above LAST_SIGN_IN in error-messages.ts; ResendButton fixed hint ids; useConfirmation focuses document id 'email' (hidden coupling).
- FA-16 LOW: LINK_SIGN_IN_WINDOW_MINUTES (feature) duplicates server 600s constant, kept equal by a web test — acceptable.
- Settings provider persist(): out-of-order account saves not sequenced (relies on Next serializing Server Actions) — contract is transport-agnostic; plausible only.
```
