# Milestone 6.1 preference rules Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The preference rules (schemas, defaults, font catalog, scope, merging, import and export, reconciliation, consent policy) live in `@synapcity/domain-preferences`, portable and `zod`-only, and the web app reads them from the package with no change in behavior.

**Architecture:** A new domain package takes the pure files of `apps/web/src/features/settings` (`types/`, `lib/scope.ts`, `lib/settings.ts`, the pure half of `lib/account-sync.ts`, `shared/privacy-consent/`), with their tests. Two files are split because they mix browser code into the rules. From `account-sync.ts`, the `localStorage` helpers and `deviceTimezone` stay in the app. From `fonts.ts`, the stylesheet URL, font stack and CSS variable names move into the app's `shared/font-preferences`; M6.2 takes them to `frontend-preferences`. Every importer re-points in the same task that moves what it imports.

**Tech Stack:** TypeScript 7.0.2, `zod` ^4.6.7 (the version web and `domain-records` declare), Vitest 4.1.12, pnpm workspace.

**Spec:** [2026-10-24-m6-preferences-settings-design.md](../specs/2026-10-24-m6-preferences-settings-design.md), sections 3, 4.1 and 8 (M6.1), and the Q1–Q4 answers in section 9. Governing: [ADR-0010](../../architecture/decisions/0010-preference-persistence.md) (scopes and precedence stay exactly as they are), [ADR-0003](../../architecture/decisions/0003-typography-roles-and-font-preferences.md) (font ids).

## Global Constraints

- **Package:** `packages/domain/preferences` = `@synapcity/domain-preferences`, `version` `0.0.0`, `private`, `"type": "module"`. `exports`: `"."` → `./src/index.ts` only. Entries point to source; no build step.
- **Dependencies:** `zod` `^4.6.7` only. Dev dependencies as `domain-records` (eslint, typescript and vitest configs, `@vitest/coverage-v8`, `eslint`, `typescript`, `vitest`). No version changes anywhere.
- **Domain rules (R4):** no React, no DOM or browser API (`window`, `document`, `navigator`, `localStorage`, `matchMedia`), no Next, no server, no app import. Browser signals such as Global Privacy Control are parameters, never read here.
- **Layout:** one module, so kind folders sit directly under `src/`. `schemas/` holds one unit folder per section, with its schema, defaults, inferred types and the section's own pure helpers (for example `pageLanguage` stays with `regional`). `utils/` holds the cross-section rules. Each unit folder has its file, its tests and `index.ts`; each kind folder has `index.ts`; imports between folders target the folder's `index.ts` (R7).
- **Names unchanged:** every exported name keeps its name and signature. The stored key `synapcity-preferences`, `TRANSFER_FILE_VERSION` (2), font ids, defaults and every message stay byte for byte.
- **What stays in the app:** a type or function used only by the Settings screen stays (it moves with `features-settings` in M6.4), and so does anything touching the browser (it moves with `frontend-preferences` in M6.2). When a file holds both, split it; do not bridge.
- **No re-export bridges** at the end of any task.
- **Commits** only when the owner authorizes them. Conventional style, no attribution trailer, no GitHub closing keyword near an issue reference. Never quote the owner in any document or commit; record decisions as "owner decision, date".

## Review Focus

1. **Saved documents.** A `synapcity-preferences` value written by the current build parses to the same `Settings` after the move, including one saved before fonts, density or text size existed. Golden-value test in Task 1.
2. **Export files.** A version 2 export written before the move still imports, and a newer version is still refused. Tests in Task 2 (domain) and the existing `import-export-settings` DOM test (refusal).
3. **Font ids.** Font ids are never renamed or dropped; the catalog tests move unchanged in Task 1.
4. **Domain purity.** Nothing browser or React reaches the package. `pnpm boundaries` (R4) plus a planted-import probe in Task 3.
5. **Account documents.** A stored account document with missing or unknown fields still reads as today, including the display override. The existing `readAccountPreferences` tests move in Task 2 and keep their assertions.

---

### Task 1: Package skeleton and the section schemas

**Files:**

- Create: `packages/domain/preferences/{package.json,tsconfig.json,eslint.config.mjs,vitest.config.ts,README.md}`, configs as `packages/domain/records`. Create `src/index.ts`, `src/schemas/index.ts`, and the unit folders `src/schemas/{appearance,theme,regional,notifications,data-privacy,fonts,settings,import-export}/` (each `<unit>.ts`, `index.ts`, tests).
- Move: `apps/web/src/features/settings/types/{appearance,theme,regional,notifications,data-privacy,settings,import-export}.ts` and their tests (`theme.test.ts`, `data-privacy.test.ts`) into the matching unit folders.
- Move with a split: `fonts.ts` and `fonts.test.ts`. The catalog moves to `schemas/fonts/`: `GoogleFont`, `googleFonts`, `GoogleFontId`, `FontChoice`, `FontRole`, the role lists, the default labels and `fontLabel`. `fontStylesheetUrl`, `fontStack` and `fontPreferenceVariables` move to `apps/web/src/features/settings/shared/font-preferences/`, which is where M6.2 picks them up. Each `fonts.test.ts` case follows the function it tests.
- Modify: root `vitest.config.ts` (project `packages/domain/preferences`); `pnpm-lock.yaml` (by `pnpm install`); `apps/web/package.json` (dependency `@synapcity/domain-preferences`); every app file importing `features/settings/types/...` (except the Settings-only types below). Find them with `rg -n "settings/types|\.\./types|\.\./\.\./types" apps/web/src`.
- Keep in the app: `types/import-export.ts`' `TransferFeedback`, and `ImportResult` if only the Settings screen uses it, in `apps/web/src/features/settings/types/`. Delete `types/index.ts` if nothing is left to export.

**Interfaces:**

- Produces (`@synapcity/domain-preferences`): every name the moved section files export today, unchanged. That includes `settingsSchema`, `Settings`, `SettingsPatch`, `settingsDefaults`, each section's schema, defaults and types, `SYSTEM_TIMEZONE`, `isSupportedTimezone`, `pageLanguage`, `resolveTimezone`, `privacyPurposes`, `PrivacyPurpose`, `PRIVACY_POLICY_VERSIONS`, `Consent`, `choose`, `withCurrentPolicy`, `transferSchema`, `TransferSettings`, `TransferSettingsPatch`, and the font catalog names above.

- [x] **Step 1: Write the characterization test.** In `schemas/settings/settings.test.ts`: `it('reads a saved document from before fonts, density and text size to the same settings')`. It parses a literal JSON string (copy one written by the current build in a browser or by `JSON.stringify(settingsDefaults)` with `theme` limited to `mode` and `radius`) and asserts `toEqual` against a literal `Settings` object with today's defaults filled in. Add `it('parses its own defaults to themselves')`.
- [x] **Step 2: Write the manifest and configs, add the project, run `pnpm install`.** Expected: `pnpm --filter @synapcity/domain-preferences test` FAILS (modules not found).
- [x] **Step 3: Move and split** as listed, keeping exports and bodies unchanged; re-point the app's imports to `@synapcity/domain-preferences`.
- [x] **Step 4: Run the checks** one script at a time: `pnpm --filter @synapcity/domain-preferences test`, `... lint`, `... check-types`; `pnpm --filter web check-types`, `... lint`, `... test`; `pnpm boundaries`; `pnpm deps`. Expected: pass. The web test count drops by exactly the moved tests, and `rg -n "settings/types/(appearance|theme|regional|notifications|data-privacy|fonts|settings)" apps/web/src` has no matches.
- [x] **Step 5: Checkpoint commit** (if authorized): `feat(domain-preferences): add the package and the preference schemas`.

### Task 2: The cross-section rules

**Files:**

- Move to `src/utils/`:
  - `lib/scope.ts` and `scope.test.ts` → `utils/scope/`.
  - `lib/settings.ts` with `settings.test.ts` and `stored-account.test.ts` → `utils/merge-settings/`.
  - `shared/privacy-consent/` with its test → `utils/privacy-consent/`.
  - The pure half of `lib/account-sync.ts` (`reconcile`, `StoredAccountPreferences`) → `utils/reconcile/`, with a new test file.
- Keep in the app: `lib/account-sync.ts` keeps `readDeviceDisplay`, `writeDeviceDisplay`, `deviceTimezone` (browser, M6.2) and `SavePreferencesResult`, `AccountSync` (the Settings screen's contract, M6.4), importing the moved names from the package.
- Modify: every importer of `lib/scope`, `lib/settings`, `shared/privacy-consent` and the moved `account-sync` names. Find them with `rg -n "lib/scope|lib/settings|privacy-consent|account-sync" apps/web/src`. Also delete `shared/privacy-consent/` from the app.

**Interfaces:**

- Consumes: Task 1's schemas through `../../schemas`.
- Produces (`@synapcity/domain-preferences`), unchanged:
  - From scope: `settingScope`, `displaySchema`, `DisplaySettings`, `accountPreferencesSchema`, `AccountPreferences`, `displayOf`, `accountPart`, `isDefaultAccount`, `touchesAccount`, `readAccountPreferences`, `withAccount`, `TRANSFER_FILE_VERSION`, `toTransferFile`, `fromTransferFile`.
  - From merge-settings: `mergeSettings`, `withoutStoredAccount`, `parseImportPatch`, `parseImport`.
  - From privacy-consent: `canCollect`, `isBlockedBySignals`, `PrivacySignals`.
  - From reconcile: `reconcile`, `StoredAccountPreferences`.

- [x] **Step 1: Write the failing tests.** In `utils/reconcile/reconcile.test.ts`:
  - `it('applies the account over this device')`: the account's regional value wins, and `setAside` is `null` without an override.
  - `it('sets this device’s display aside while the account overrides it')`: `setAside` equals `displayOf(local)`.
  - `it('brings the set-aside display back when the override ends')`.

  In `utils/scope/scope.test.ts`, add:
  - `it('imports a version 2 file written before the move')`: a literal v2 file through `fromTransferFile`.
  - `it('passes a newer file through untouched')`: a version 3 object comes back as the same value from `fromTransferFile`. The refusal itself ("This file comes from a newer version of Synapcity. Update the app and try again.") lives in the app's `utils/import.ts`, which stays in the app, and its DOM test in `import-export-settings` keeps covering it.

- [x] **Step 2: Run them.** `pnpm --filter @synapcity/domain-preferences test`. Expected: FAIL (modules not found).
- [x] **Step 3: Move, split and re-point** as listed. The moved code keeps its bodies; only imports change.
- [x] **Step 4: Run the checks** as in Task 1. Expected: pass. `rg -n "features/settings/lib/(scope|settings)|shared/privacy-consent" apps/web/src` has no matches. `rg -n "localStorage|window\.|document\.|navigator" packages/domain/preferences/src` has no matches outside comments.
- [x] **Step 5: Checkpoint commit** (if authorized): `refactor(settings): move the preference rules into domain-preferences`.

### Task 3: Records, probe, carried fix, gate

**Files:**

- Create: the package README (`Owns:` statement, the public names grouped by unit, the rules from Global Constraints, scripts).
- Modify the records:
  - `docs/architecture/reorganization-ownership-map.md`: `settings` row, M6.1 note.
  - `docs/architecture/workspace-conventions.md`: inventory `domain-preferences` First code `M6.1 (exists)`; `frontend-settings` First code `deferred (Q3)`; `server-account` scope note "M6: preferences; M7: profile and avatar" (Q2); the sentence after the table.
  - `docs/architecture/decisions/0014-multi-app-package-boundaries.md`: section 7 sentence.
  - `docs/architecture/decisions/0010-preference-persistence.md`: an implementation note naming the package for the schemas and rules (the cookie amendment waits for M6.3).
  - `packages/domain/README.md`.
  - `.agents/task-scope.md`: M6 entry, with execution, creates, updates, deletes and verification.
  - The M6 design's status line (M6.1 implemented).
- Modify: `supabase/seed.sql` header comment (owner decision, 2026-10-24). It should say the starter Spaces are three of the fixture-mode demo Spaces in `apps/web/src/lib/demo/space-source/demo-spaces.ts` (Writing, Learning, Personal). Comment only; no SQL changes.

- [x] **Step 1: Update the records and the seed comment.** No owner quotes.
- [x] **Step 2: Boundary probe** (planted, then removed, with `git diff` empty afterwards): add `import 'react';` to a file in `packages/domain/preferences/src/utils/scope/` and expect an R4 or R0 violation; remove it and expect `pnpm boundaries` to pass. Record the result.
- [x] **Step 3: Repository gate.** Run `pnpm verify` with nothing else running. Expected: every stage passes.
- [x] **Step 4: Report** per AGENTS.md section 9: what moved, what stayed in the app and why (browser code for M6.2, screen contracts for M6.4), checks run and not run (no visible change, so no manual check beyond opening Settings and changing one value of each section), next (the M6.2 plan).
- [x] **Step 5: Checkpoint commit** (if authorized): `docs: record milestone 6.1 preference rules`.

## Calls made (owner to check)

- **Inferred types stay beside their schemas** in each `schemas/<section>/` unit, instead of a separate `types/` folder as `domain-records` has. The types are `z.infer` of the schema next to them, and splitting them would double the files without separating anything.
- **Section helpers move with their section** (`pageLanguage`, `resolveTimezone`, `choose`, `withCurrentPolicy`) instead of going into `utils/`. Each operates on one section's values.
- **Font loading waits in the app** for one sub-milestone (`shared/font-preferences`), not a new temporary package, so M6.2 moves it in one piece with the rest of the browser runtime.
- **`StoredAccountPreferences` is domain.** It is the shape of the stored account row, read by the server and by the browser.

## Left open on purpose

- The shared-look schema (design 4.1, last item): it arrives with the cookie in M6.3.
- The Settings screen's contracts (`SavePreferencesResult`, `AccountSync`, `TransferFeedback`): they move with `features-settings` in M6.4.
