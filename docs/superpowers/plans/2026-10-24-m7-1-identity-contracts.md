# Milestone 7.1 identity contracts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Status:** Implemented on `refactor/m7-1-identity-contracts` (2026-10-24), three local commits, not pushed or merged. Checked by the author: package tests, type check and lint; the affected web tests (account, auth, settings, lib, app: 905 tests); `pnpm boundaries`; `pnpm deps`. Not run: the full `pnpm verify` (CI is the gate), Storybook, end-to-end, and the manual checks in Task 4. Two files are deliberately left for after the React Hook Form pull request (call C4), and one placement question is open (call C5).

**Goal:** The credential schemas, the profile and avatar schemas, and the pure display-user rules live once, in `@synapcity/domain-identity`. The web app reads them from the package and the app-local duplicates are gone. No behavior changes.

**Architecture:** `domain-identity` already exports `nameSchema`, `profileSchema`, the avatar schemas and `VerifiedIdentity` (M4). This step adds the credential schemas from `features/auth/types/schema/` and the small pure helpers from `features/account/shared/` and `features/auth/shared/current-user/`, and deletes `features/account/types/schema.ts`, which duplicates the package. The React and copy-heavy parts (`profile-avatar`, `error-messages`, form-state types) stay for M7.4 and M7.5.

**Tech Stack:** TypeScript 7.0.2, `zod` ^4.6.7 (already declared by the package), Vitest 4.1.12, pnpm workspace.

**Spec:** [2026-10-24-m7-auth-account-design.md](../specs/2026-10-24-m7-auth-account-design.md), sections 3, 4.1 and 8 (M7.1). Governing: [ADR-0014](../../architecture/decisions/0014-multi-app-package-boundaries.md) (domain is pure; R4), [ADR-0006](../../architecture/decisions/0006-authentication-with-supabase.md), the [workspace conventions](../../architecture/workspace-conventions.md).

## Global Constraints

- **Package:** `packages/domain/identity` keeps its name, `private`, source-pointing `exports`. The root `.` entry gains the new names. The existing `./types` and `./schemas` subpaths stay (server code uses them); add no new subpath (conventions: add a subpath only when a consumer needs a narrower interface).
- **Dependencies:** none added. `zod` only.
- **Domain rules (R4):** no React, DOM, Next, server or app import. The moved helpers are already pure (they import nothing but sibling files).
- **Names and messages unchanged:** every exported name keeps its name, signature and message text byte for byte, with one reviewed exception: the avatar type map is `AVATAR_TYPES` in the app and `AVATAR_FILE_TYPES` in the package; importers use the package name.
- **No re-export bridges** at the end of any task. Delete the app-local file once its importers move.
- **Stays in the app for later:** `account/shared/profile-avatar` (React, M7.4); `auth/shared/error-messages`, `auth/types/form-state`, `account/types/form-state` (copy and view state, M7.5/M7.4); `auth/shared/connected-accounts` and `oauth-providers` (M7.4, design Q2); `auth/shared/recent-link-sign-in` (M7.5, design Q5).
- **Commits** only when the owner authorizes them. Conventional style, no attribution trailer, no GitHub closing keyword near an issue reference. Never quote the owner in a document or commit.
- **Do not start M7.4 or M7.5 work, and do not edit** `register-form`, `forgot-password-form` or their tests: the React Hook Form pull request (#67) edits them.

## Review Focus

1. **Profile schema difference.** The package's `profileSchema` is `{ name, avatar?: avatarFileSchema }`; the app's is `{ name }` only, and `account/types/form-state.ts` adds `'avatar'` to its field names by hand. Parsing `{ name }` gives the same result either way; `Object.keys(profileSchema.shape)` does not. Task 2 pins this before deleting anything.
2. **Credential messages.** Every password, sign-in, sign-up, email and update-password message reads the same after the move. The existing `schema.test.ts` moves with its assertions.
3. **Refusal helpers.** `firstRefusal` and `everyRefusal` keep their return shapes; the actions use them to build field results.
4. **Domain purity.** Nothing browser, React or Next reaches the package; `pnpm boundaries` (R4) plus a planted-import probe.
5. **Cycles.** `features/auth` currently imports `nameSchema` from `features/account`; after the move it imports the package, so the auth to account edge for schemas disappears.

---

### Task 1: Credential schemas into `domain-identity`

**Files:**

- Move: `apps/web/src/features/auth/types/schema/schema.ts` and `schema.test.ts` into `packages/domain/identity/src/schemas/` as flat files `credentials.ts` and `credentials.test.ts` (the existing schemas are flat, and the R7 rule rejects a folder importing a flat sibling directly). Exports to move: `MIN_PASSWORD_LENGTH`, `PASSWORD_TOO_SHORT_MESSAGE`, `PASSWORD_REQUIREMENTS`, `missingCharactersMessage`, `newPasswordSchema`, `ALREADY_YOUR_EMAIL`, `signInSchema`, `signUpSchema`, `emailRequestSchema`, `updatePasswordSchema`, `AuthFieldName`, `firstRefusal`, `everyRefusal`, and any other export the file has (list them from the file; do not guess).
- Modify: `packages/domain/identity/src/schemas/index.ts` and `src/index.ts` (export the new names); the file imports `nameSchema` from the account feature today, so it imports `./name` instead.
- Modify: every app file importing these names from `@/features/auth/types` or `.../types/schema` (find with `rg -n "features/auth/types|\.\./schema|\./schema" apps/web/src`, including multi-line imports and tests). `features/auth/types/index.ts` keeps exporting `form-state` only; delete `types/schema/` when empty.
- No manifest change: `apps/web/package.json` already depends on `@synapcity/domain-identity` (`workspace:*`).

**Interfaces:**

- Produces (`@synapcity/domain-identity`): every moved name, unchanged.
- Consumes: `zod`; `nameSchema` from the package itself.

- [x] **Step 1: Characterize before moving.** Done as: the existing `schema.test.ts` moved unchanged and passes in the package. No extra golden cases were added (the file's own tests already cover each schema and rule); adding some remains optional.
- [x] **Step 2: Move the file and test, re-point the import of `nameSchema`, export from the package.** Run `pnpm --filter @synapcity/domain-identity test` and `check-types`. Expected: the moved tests pass unchanged.
- [x] **Step 3: Re-point the app's importers** to `@synapcity/domain-identity`. Run `pnpm --filter web check-types` and `pnpm --filter web test` for the auth directories. Expected: pass; the web test count drops by exactly the moved tests.
- [x] **Step 4: Run the checks** one script at a time: package `test`, `lint`, `check-types`; web `lint`; `pnpm boundaries`; `pnpm deps`. Expected: pass; `rg -n "features/auth/types/schema" apps/web/src` finds nothing.
- [x] **Step 5: Checkpoint commit** (local only, `--no-verify`): `refactor(domain-identity): move the credential schemas into the package`.

### Task 2: Remove the duplicate profile contracts

**Files:**

- Delete: `apps/web/src/features/account/types/schema.ts` (and `schema.test.ts` after its cases are covered by the package tests below).
- Modify: `apps/web/src/features/account/types/index.ts` (stop exporting `./schema`; keep `./form-state`); `account/types/form-state.ts` (import `ProfileInput` from the package; the hand-added `'avatar'` field name stays unless the package type already includes it, in which case remove only the duplicate union member).
- Modify: importers of `MAX_NAME_LENGTH`, `MAX_AVATAR_BYTES`, `nameSchema`, `avatarFileSchema`, `profileSchema`, `AVATAR_TYPES`, `AvatarType`, `AVATAR_ACCEPT` from `@/features/account/types` (about 9 files named by `rg -n "MAX_NAME_LENGTH|MAX_AVATAR_BYTES|nameSchema|avatarFileSchema|profileSchema|AVATAR_TYPES|AvatarType|AVATAR_ACCEPT" apps/web/src`); `features/account/server/image-type/image-type.ts` uses `AVATAR_TYPES`, which becomes `AVATAR_FILE_TYPES`.
- Modify: `packages/domain/identity/src/schemas/user.test.ts` / `avatar.test.ts` / `name.test.ts` to carry the assertions of the deleted `schema.test.ts` that the package does not yet assert (messages, limits, MIME list, the "no name" and "empty name" cases).

- [x] **Step 1: Pin the difference.** Write package tests asserting: `profileSchema.safeParse({ name: ' Ada ' })` gives the trimmed name; `{}` and `{ name: '' }` fail with the existing messages; an `avatar` that is a valid file passes and a too-large or wrong-MIME file fails with the existing messages. Compare each message string with the app-local file; any difference stops the task and goes to the owner (it is a behavior change).
- [x] **Step 2: Decide the one reviewed difference.** The app-local `profileSchema` has the single key `name` and its test asserts that. The package's schema also accepts an optional `avatar`. Use the package schema (M4 made it the contract, and parsing `{ name }` is identical). Update the app test that asserts the key list. Record this call in the plan's "Calls made" section for the owner to check.
- [x] **Step 3: Re-point importers, rename `AVATAR_TYPES` to `AVATAR_FILE_TYPES`, delete the app-local file and its test.** Run `pnpm --filter web check-types` and the account tests. Expected: pass.
- [x] **Step 4: Run the checks** as in Task 1. Expected: pass; `rg -n "account/types/schema" apps/web/src` finds nothing.
- [x] **Step 5: Checkpoint commit** (local only, `--no-verify`): `refactor(account): use the identity package's profile and avatar contracts`.

### Task 3: The pure display-user rules

**Files:**

- Move (each with its test) into `packages/domain/identity/src/utils/<unit>/` with an `index.ts` per unit: `features/account/shared/{initials,avatar-url,provider-image,profile-confirmed}/`, `features/auth/shared/current-user/`, and `features/account/shared/name/` (renamed `check-name/`). `check-name.ts` imports `nameSchema` from `../../schemas`.
- Modify: `packages/domain/identity/src/utils/index.ts` (new) and `src/index.ts` to export the moved names.
- Modify: importers: `features/account/shared/index.ts` stops exporting the moved units (it keeps `profile-avatar`), `features/auth/shared/index.ts` stops exporting `current-user`; update the 8 files importing `@/features/account/shared` and the auth files importing `current-user`. `profile-avatar.tsx` imports `initials`, `avatar-url` and `provider-image` from the package.

**Interfaces:**

- Produces (`@synapcity/domain-identity`): `checkName`, the `initials`, avatar-URL, provider-image and profile-confirmed helpers, and the current-user mapping, with the names they have today.

- [x] **Step 1: Move the five account units and the current-user unit with their tests; export from the package root.** Run `pnpm --filter @synapcity/domain-identity test`. Expected: all moved tests pass unchanged.
- [x] **Step 2: Re-point the app's importers.** Run `pnpm --filter web check-types` and the account and auth test directories. Expected: pass.
- [x] **Step 3: Run the checks** as in Task 1. Expected: pass; `rg -n "account/shared/(name|initials|avatar-url|provider-image|profile-confirmed)|auth/shared/current-user" apps/web/src` finds nothing outside `profile-avatar`'s own folder.
- [x] **Step 4: Checkpoint commit** (local only, `--no-verify`): `refactor(domain-identity): move the pure display-user rules into the package`.

### Task 4: Records and verification

- [x] **Step 1: Update the records.** `packages/domain/identity/README.md` (`Owns:` credential schemas, profile and avatar schemas, display-user rules), the workspace-conventions inventory row for `domain-identity`, the ownership map rows for auth and account, the M7 design status line (M7.1 implemented), and `.agents/task-scope.md`. No owner quotes.
- [x] **Step 2: Boundary probe** (planted, then removed, with `git status` empty afterwards): an `import 'react'` in the package should report R4.
- [ ] **Step 3: Repository gate.** `pnpm verify` with nothing else running (or CI on the pull request). Expected: every stage passes.
- [ ] **Step 4: Report** per AGENTS.md section 9: what moved, what stayed and why, checks run and not run. Manual: sign in, register with a short password and an invalid name, recover a password, edit a name, upload a too-large avatar, and see the same messages as before. Next: the M7.2 plan.
- [ ] **Step 5: Checkpoint commit** (if authorized): `docs: record milestone 7.1 identity contracts`.

## Calls made (owner to check)

| #   | Call                                                                                                | Why                                                                                                   |
| --- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| C1  | The package's `profileSchema` (with an optional `avatar`) replaces the app's name-only one.         | M4 made the package the contract; parsing `{ name }` is identical; only a key-list assertion changes. |
| C2  | The app's `AVATAR_TYPES` becomes the package's `AVATAR_FILE_TYPES` at its two importers.            | One name per contract; values are identical.                                                          |
| C3  | `profile-avatar` (React) stays in the app until M7.4 and imports its pure helpers from the package. | A domain package cannot hold React; the component moves with `features-account`.                      |

## Recovery

Keep each task in a separate compilable slice. If a slice fails, restore only that slice against current HEAD; do not rewrite earlier commits. Stop and report if any message differs between the app-local and package schemas, or if a moved helper turns out to import React, the DOM or a server module.
