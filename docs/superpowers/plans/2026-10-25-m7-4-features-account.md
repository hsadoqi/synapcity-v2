# Milestone 7.4 account experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Status:** Approved (owner, 2026-10-25: questions A, B and C accepted as recommended). Implementation starts on `refactor/m7-3-frontend-supabase`.

**Goal:** The account and profile experience (the name and photo forms, the profile summary and setup form, `ProfileAvatar`, `ProfileState`) leaves `apps/web` for a new `@synapcity/features-account` package laid out like `features-settings` (`./contracts`, `./frontend`). No behavior changes. The account R9 barrel-cycle exception is removed.

**Spec:** [2026-10-24-m7-auth-account-design.md](../specs/2026-10-24-m7-auth-account-design.md), sections 4.6 and 8 (M7.4). Governing: [ADR-0014](../../architecture/decisions/0014-multi-app-package-boundaries.md), [ADR-0008](../../architecture/decisions/0008-auth-actions-and-server-operations.md), [ADR-0009](../../architecture/decisions/0009-caller-owned-auth-navigation.md).

## Decisions recorded (owner, 2026-10-25)

- The account and profile content moves into `features-account`, including the content of `components/account` and `components/profile` (the design had left this open).
- **A.** The forms move now. `ProfileSetupCard` and `DeleteAccountCard` wrap auth's `AuthShell`, so they stay in `apps/web/src/components` and move to `features-auth` in M7.5; moving them here would make account import auth.
- **B.** `apps/web/src/features/account/server/` stays as host code (the actions, `caller.ts`, `save-name.ts`, `save-avatar.ts`).
- **C.** `ProfileFormShell` takes the sign-in href as a prop built by the app (ADR-0009).

## What exists today (evidence)

Non-test files in `apps/web/src/features/account` (29): `components/avatar/{avatar-field,avatar-form}`, `components/name/{name-field,name-form}`, `components/profile/{profile-form-shell,profile-setup-form,profile-summary}` and index files; `server/actions/{avatar,name,setup}-actions.ts`; `server/{caller,save-avatar,save-name}.ts`; `shared/profile-avatar`; `types/{form-state,index}.ts`. `components/account` holds only `delete-account-card` and `components/profile` only `profile-setup-card`, each with a test.

Importers outside the feature (non-test): the space page and four state-action files (`caller.ts`), `app/auth/delete-account/actions.ts`, `settings/components/account-settings`, `settings/server/*`, `auth/components/current-user-avatar` (`ProfileAvatar`), `auth/components/register/register-form` (`MAX_NAME_LENGTH` through the temporary re-export in `types/index.ts`), `components/profile/profile-setup-card`. Nothing in the feature imports `features/auth` outside tests (checked by the owner), so the edge is already one-way.

Facts that shape the move:

1. The forms import the Server Actions (`updateName`, `updateAvatar`, `completeProfile`). A package cannot import app code, so each form takes its action as a prop and `ProfileSummary` takes the two it composes.
2. `ProfileFormShell` uses `next/navigation` and `frontend-ui/next/link-button` and hardcodes `/auth/login?next=`. It moves under `src/frontend/next/` (rule R11) and takes `signInHref`.
3. `ProfileState` imports only `ProfileInput` from `domain-identity`; `ProfileAvatar` imports `initialsOf` and `frontend-ui`. Both are portable.

## Global Constraints

- **Package:** `packages/features/account`, `@synapcity/features-account`, `private`, exports `./contracts` and `./frontend`, copying `features-settings`. No new external dependency.
- **No app imports, no Server Actions, no fixture mode** in the package. The host passes actions and the sign-in href.
- **Keep markup and logic byte for byte;** the only intended changes are the new props and import paths.
- **`register-form.tsx` changes by one import only:** `MAX_NAME_LENGTH` from `@synapcity/domain-identity`; then the re-export in `types/index.ts` is deleted.
- **No re-export bridges.** Each step re-points its consumers in the same change. Local commits only; no attribution trailer; never quote the owner. No new pull request until M7 ends.

## Tasks

### Task 1: Contracts and the shared avatar

- [ ] **Step 1: Tests first** for `ProfileAvatar` (existing tests move unchanged) and a contract import test for `ProfileState`.
- [ ] **Step 2: Create the package** (manifest, tsconfig, eslint and vitest configs, README with `Owns:`, indexes); add the Vitest project to the root config and the Tailwind `@source` line if the host needs it; `pnpm install`.
- [ ] **Step 3: Move `types/form-state.ts` to `contracts` and `shared/profile-avatar` to `frontend`** with `git mv`; re-point importers including `auth/components/current-user-avatar`.
- [ ] **Step 4: Fix the temporary `MAX_NAME_LENGTH` re-export** as above.
- [ ] **Step 5: Run the package and web checks;** commit locally.

### Task 2: The forms, with their actions as props

- [ ] **Step 1: Tests first:** existing form and field tests move with the components; add one case per form showing the supplied action is the one called.
- [ ] **Step 2: Move the components** (`avatar`, `name`, `profile`) to `frontend`. `ProfileFormShell` moves to `frontend/next/` and gains `signInHref`. `NameForm`, `AvatarForm` and `ProfileSetupForm` gain an `action` prop; `ProfileSummary` gains `actions: { updateName, updateAvatar }`.
- [ ] **Step 3: Re-point the host.** `settings/components/account-settings` passes `updateName` and `updateAvatar`; `components/profile/profile-setup-card` passes `completeProfile`; the app builds `signInHref` beside `lib/routing`.
- [ ] **Step 4: Run the checks;** `pnpm boundaries` should now report the account R9 exception stale; remove it. Commit locally.

### Task 3: Records and verification

- [ ] **Step 1: Update the records:** the package README, the inventory row, the ownership map account rows, the M7 design status, this plan, `.agents/task-scope.md`. No owner quotes.
- [ ] **Step 2: Boundary probes** (planted, then removed): a server import, and `next/link` in `frontend` outside `frontend/next/`.
- [ ] **Step 3: Repository gate:** `pnpm verify` before the single pull request at the end of M7.
- [ ] **Step 4: Report** per AGENTS.md section 9. Manual: edit the name and photo in Settings; run the post-sign-up step with and without skipping; check the header refreshes; sign out in another tab and see "Sign in again".

## Recovery

Keep the package creation, the contract move and the form move in separate compilable slices. If a slice fails, restore only that slice against current HEAD. Stop and report if a moved component needs an app import other than through a prop.
