# Milestone 6.2 browser preference runtime Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The browser half of preferences lives in `@synapcity/frontend-preferences`, and web, docs and Storybook use it, with no visible change. That covers the device store, the boot scripts and apply functions, font loading, the consent and system-signal hooks, and mode.

**Architecture:** A new frontend package takes the browser code M6.1 left in `apps/web/src/features/settings`:

- `shared/appearance-attributes`, `shared/theme-shape`, `shared/font-preferences`.
- The browser half of `lib/account-sync.ts`.
- `hooks/use-can-collect`, `use-global-privacy-control`, `use-prefers-dark`.
- From `frontend-ui`, the mode provider and its helpers.

Every direct `localStorage` call for preferences goes behind one device-store unit, so M6.3 can add the shared-look cookie in one place. `frontend-ui`'s `ModeToggle` imports `useMode` from the new package, so `frontend-ui` depends on `frontend-preferences`, never the reverse. Docs inlines the boot scripts and takes its mode provider from the package. Each host keeps its own stored choices at this step.

**Tech Stack:** TypeScript 7.0.2, React 19.3.0, `next-themes` ^0.4.6 (the version `frontend-ui` declares; it moves), Vitest 4.1.12 with jsdom, Storybook 10.6.3, pnpm workspace.

**Spec:** [2026-10-24-m6-preferences-settings-design.md](../specs/2026-10-24-m6-preferences-settings-design.md), sections 3, 4.2, 4.7 and 8 (M6.2), and the Q4 answer in section 9. Builds on [M6.1](2026-10-24-m6-1-domain-preferences.md). Governing: [ADR-0010](../../architecture/decisions/0010-preference-persistence.md) (storage and precedence unchanged in M6.2), [ADR-0003](../../architecture/decisions/0003-typography-roles-and-font-preferences.md).

## Global Constraints

- **Package:** `packages/frontend/preferences` = `@synapcity/frontend-preferences`, `version` `0.0.0`, `private`, `"type": "module"`. `exports`: `"."` → `./src/index.ts` only. Entries point to source.
- **Runtime:** browser and React, framework-neutral. It imports no `next` (R11) and no server code (R3).
- **No dependency on `frontend-ui` of any kind.** That covers production code, tests and stories. The package graph counts dev dependencies (R9), and `frontend-ui` depends on this package after Task 3, so stories and tests here use plain HTML elements.
- **Dependencies:** `@synapcity/domain-preferences` (`workspace:*`), `react` `19.3.0`, `next-themes` `^0.4.6`. Dev dependencies follow `frontend-collection`'s test and Storybook set, minus `next` and `frontend-ui`. No version changes anywhere.
- **Layout:** kind folders under `src/`: `scripts/` for the boot script strings and apply functions, `store/` for the device store, `hooks/`, `providers/`, `utils/` and `types/`. One unit folder per unit, with its tests, a story for each provider, and `index.ts`. Cross-folder imports target the folder's `index.ts` (R7).
- **Behavior unchanged:**
  - Stored keys (`synapcity-preferences`, `synapcity-device-display`, `next-themes`' own key, Storybook's `storybook-mode`), the `synapcity-preferences-saved` event name and every data attribute stay the same.
  - Each boot script's output is byte for byte what the app inlines today.
  - Docs keeps its own storage, so it starts from defaults until M6.3.
- **No re-export bridges** at the end of any task. Every consumer re-points in the task that moves what it imports.
- **Commits** only when the owner authorizes them. Conventional style, no attribution trailer, no GitHub closing keyword near an issue reference. Never quote the owner in any document or commit; record decisions as "owner decision, date".

## Review Focus

1. **No flash.** The three boot scripts the web app inlines are byte for byte what it inlined before the move. A snapshot test compares each moved string with the string at the M6.1 commit (Task 1).
2. **Consent follows a change at once.** `useCanCollect` still updates when another tab writes the stored document (the `storage` event) and when this tab saves (`synapcity-preferences-saved`). The moved hook tests keep both cases (Task 2).
3. **Mode keeps working everywhere it is set.** That's web, docs, Storybook's toolbar and `frontend-ui`'s `ModeToggle`, with each host's storage key unchanged. The moved `mode-provider` tests and the `ModeToggle` tests pass in both packages (Task 3).
4. **No package cycle.** `frontend-preferences` never depends on `frontend-ui`. `pnpm boundaries` (R9) plus a planted `frontend-ui` import probe (Task 5).
5. **Docs boots like web.** The docs page's HTML carries the same three boot scripts, and docs still shows its pages with no console error (Task 4).

---

### Task 1: Package skeleton, boot scripts, apply functions and font loading

**Files:**

- Create: `packages/frontend/preferences/{package.json,tsconfig.json,eslint.config.mjs,vitest.config.mts,vitest.setup.ts,README.md}`, configs as `packages/frontend/collection`. Create `src/index.ts` and `src/scripts/index.ts`.
- Move whole units into `src/scripts/`, with their DOM tests:
  - `apps/web/src/features/settings/shared/appearance-attributes/` → `scripts/appearance-attributes/`
  - `.../shared/theme-shape/` → `scripts/theme-shape/`
  - `.../shared/font-preferences/` (including `font-loading.ts` and its test) → `scripts/font-preferences/`
  - The preview helpers in these files (`previewShapeAttributes`, `previewTextScaleStyle`, `previewFontValue`, `previewFontStyle`) move with them. They use the same data attributes and CSS variables as the apply functions.
- Modify: root `vitest.config.ts` (project); `pnpm-lock.yaml`; `apps/web/package.json` (dependency); `apps/web/src/app/layout.tsx` (boot scripts from the package); every app importer of the three units (`rg -n "appearance-attributes|theme-shape|font-preferences" apps/web/src`).

**Interfaces:**

- Produces (`@synapcity/frontend-preferences`), names unchanged: `PREFERENCES_STORAGE_KEY`, `PREFERENCES_SAVED_EVENT`, `applyAppearance`, `appearanceBootScript`, `applyThemeShape`, `previewShapeAttributes`, `previewTextScaleStyle`, `themeShapeBootScript`, `loadFont`, `applyFontPreferences`, `previewFontValue`, `previewFontStyle`, `fontBootScript`, `fontStylesheetUrl`, `fontStack`, `fontPreferenceVariables`.

- [ ] **Step 1: Record today's boot scripts, then write the characterization test.**
  1. Before moving anything, add a throwaway test in `apps/web/src/features/settings/` that imports the three scripts from their current units and writes them as JSON (`{ appearance, themeShape, font }`) to `packages/frontend/preferences/src/scripts/boot-scripts.expected.json`.
  2. Run it once with `pnpm --filter web exec vitest run <file>`, then delete it.
  3. Write `scripts/boot-scripts.test.ts`: `it('inlines each boot script exactly as before the move')` reads that JSON and asserts `appearanceBootScript`, `themeShapeBootScript` and `fontBootScript` equal it.
  4. The JSON is a committed fixture.
- [ ] **Step 2: Write the manifest and configs, add the project, run `pnpm install`** (check `ls node_modules/.pnpm | wc -l` afterwards). Expected: `pnpm --filter @synapcity/frontend-preferences test` FAILS (modules not found).
- [ ] **Step 3: Move and re-point.** `git mv` the three units. Their domain imports already come from `@synapcity/domain-preferences`; relative imports between the three become `../<unit>`.
- [ ] **Step 4: Run the checks** one script at a time:
  - `pnpm --filter @synapcity/frontend-preferences test`, `lint` and `check-types`
  - `pnpm --filter web check-types`, `lint` and `test`
  - `pnpm boundaries`
  - `pnpm deps`

  Expected: pass, and the web test count drops by exactly the moved tests.

- [ ] **Step 5: Checkpoint commit** (if authorized): `feat(frontend-preferences): add the package with the boot scripts and font loading`.

### Task 2: Device store, consent and system-signal hooks

**Files:**

- Create: `src/store/device-store/` (unit, tests, `index.ts`), `src/store/index.ts`.
- Move into the store, from `lib/account-sync.ts`: `readDeviceDisplay`, `writeDeviceDisplay`, `deviceTimezone`, and the `synapcity-device-display` key. The app's `account-sync.ts` keeps `SavePreferencesResult` and `AccountSync` (Settings screen contracts, M6.4).
- Move into `src/hooks/`, with their DOM tests: `hooks/use-can-collect`, `use-global-privacy-control`, `use-prefers-dark`.
- Modify: `providers/settings-provider/settings-provider.tsx`, `components/account-preferences-sync/account-preferences-sync.tsx` and `use-can-collect`. Each replaces its direct `localStorage` calls and `window.dispatchEvent(new Event(PREFERENCES_SAVED_EVENT))` with the store functions below. Bodies otherwise stay the same, including their `try`/`catch`.
- Modify: `apps/web/src/features/error-reports/client/error-reports/error-reports.tsx` and its test (`useCanCollect` from the package), and every other importer (`rg -n "use-can-collect|use-global-privacy-control|use-prefers-dark|account-sync" apps/web/src`).

**Interfaces:**

- Produces (`@synapcity/frontend-preferences`):
  - `readStoredPreferences(): string | null` reads `synapcity-preferences` as stored.
  - `writeStoredPreferences(value: string): void`.
  - `clearStoredPreferences(): void`.
  - `announcePreferencesSaved(): void` dispatches `synapcity-preferences-saved` on `window`.
  - `onStoredPreferencesChange(listener: () => void): () => void` subscribes to `storage` and the saved event, and returns the unsubscribe.
  - `readDeviceDisplay`, `writeDeviceDisplay` and `deviceTimezone`, unchanged.
  - `useCanCollect`, `useGlobalPrivacyControl` and `usePrefersDark`, unchanged.
  - Each store function behaves exactly like the `localStorage` call it replaces, including throwing where `localStorage` throws (callers keep their own `try`/`catch`).

- [ ] **Step 1: Write the failing tests.** `store/device-store/device-store.test.ts` (jsdom):
  - `it('reads and writes the stored document under synapcity-preferences')`
  - `it('clears it')`
  - `it('tells subscribers when another tab or this tab saves, and stops when unsubscribed')`: dispatch a `StorageEvent`, then call `announcePreferencesSaved()`; the listener is called twice, then not again after unsubscribing.
  - `it('keeps the device display apart under synapcity-device-display')`
- [ ] **Step 2: Run them.** Expected: FAIL (module not found).
- [ ] **Step 3: Implement the store, move the hooks and re-point** as listed. `rg -n "localStorage" apps/web/src/features/settings -g '!*.test.*'` should then show no preference-key access outside the package (theme-mode helpers in `next-themes` are not ours).
- [ ] **Step 4: Run the checks** as in Task 1. Expected: pass; the `use-can-collect` storage-event and saved-event cases pass unchanged.
- [ ] **Step 5: Checkpoint commit** (if authorized): `refactor(settings): read and write preferences through the frontend-preferences device store`.

### Task 3: Mode

**Files:**

- Move from `packages/frontend/ui/src/`, with their tests:
  - `providers/mode-provider/` → `src/providers/mode-provider/`
  - `utils/theme.ts` → `src/utils/mode/` (as a unit: `mode.ts`, a test for `isMode`, `isResolvedMode`, `resolveMode` and `resolveSystemMode`, and `index.ts`)
  - `Mode` and `ResolvedMode` → `src/types/mode.ts`

  Splitting the types out removes the provider–helper import cycle.

- Replace the story: `mode-provider.stories.tsx` is rewritten with plain HTML buttons (no `ModeToggle`), and its play test switches mode and checks the `class` on the story root. `ModeToggle`'s own stories in `frontend-ui` keep exercising the toggle with the moved provider.
- Modify:
  - `packages/frontend/ui/package.json`: dependency `@synapcity/frontend-preferences`; `next-themes` leaves if nothing else in `frontend-ui` imports it.
  - `packages/frontend/ui/src/components/mode-toggle/` and the `frontend-ui` tests that wrap `ModeProvider` (`root-shell`, `root-header`, `sidebar-shell`, `root-sidebar`, `mode-toggle`).
  - Web: `components/providers/root-providers.tsx`, `app/global-error.tsx`, `features/settings/providers/settings-provider/settings-provider.tsx`, `features/settings/test-harness.tsx`, `features/settings/components/theme-settings/theme-rows/theme-rows.tsx`, and the web tests that import the provider (`rg -n "mode-provider|utils/theme" apps/web/src`).
  - Docs: `apps/docs/src/app/providers.tsx`.
  - Storybook: `.storybook/preview.tsx`, `manager.ts`, `theme.tsx`, `main.ts` (stories glob for `packages/frontend/preferences/src`).
  - `packages/dev/boundaries/src/exceptions/exceptions.ts`: delete the R9 `mode-provider` exception.
  - The `@source` lines for `packages/frontend/preferences/src` in both `globals.css` files, only if the package ends up with class names (expected: none; skip if so).

**Interfaces:**

- Produces (`@synapcity/frontend-preferences`), unchanged: `ModeProvider`, `useMode`, `Mode`, `ResolvedMode`, `isMode`, `isResolvedMode`, `resolveMode`, `resolveSystemMode`.
- `frontend-ui` keeps `ModeToggle` at `@synapcity/frontend-ui/components/mode-toggle`, unchanged for its consumers.

- [ ] **Step 1: Write the failing tests.** Move `mode-provider.test.tsx` and write `utils/mode/mode.test.ts` covering the four helpers, including `resolveMode(undefined)` and the system fallback with `matchMedia` stubbed. Run them in the new package. Expected: FAIL (modules not found).
- [ ] **Step 2: Move, split and re-point** as listed; delete the R9 exception.
- [ ] **Step 3: Run the checks:**
  - `pnpm --filter @synapcity/frontend-preferences test`, `lint` and `check-types`
  - `pnpm --filter @synapcity/frontend-ui test`, `lint` and `check-types` (its package-structure test passes with one provider fewer)
  - `pnpm --filter web check-types`, `lint` and `test`
  - `pnpm --filter docs check-types` and `lint`
  - `pnpm test:storybook`
  - `pnpm boundaries`: expected, the mode-provider exception gone and none added
  - `pnpm deps`

  `rg -n "frontend-ui" packages/frontend/preferences` has no matches.

- [ ] **Step 4: Checkpoint commit** (if authorized): `refactor(preferences): move mode into frontend-preferences`.

### Task 4: Docs adopts the runtime

**Files:**

- Modify: `apps/docs/package.json` (dependency `@synapcity/frontend-preferences`); `apps/docs/src/app/layout.tsx`, whose `<head>` inlines `appearanceBootScript`, `fontBootScript` and `themeShapeBootScript` in the web layout's order, with the same comments.
- Check that docs' styles include the preference tokens the scripts' attributes target (`packages/frontend/tailwind-config/tokens/preferences.css` through the shared styles). If they don't, add the import where docs already pulls in the shared styles.

- [ ] **Step 1: Write the check.** Docs has no unit test project, so the check is the built page:
  1. `pnpm --filter docs build`.
  2. Search the prerendered HTML for the docs home page (under `apps/docs/.next/server/app/`) for `synapcity-preferences` and the three scripts' opening text.
  3. Expected before the change: absent.
- [ ] **Step 2: Implement** the layout change.
- [ ] **Step 3: Run the check again.** Expected: all three scripts present, in order. Then:
  1. `pnpm --filter docs check-types` and `lint`.
  2. Start `pnpm --filter docs start` and load `/`. Expected: HTTP 200 and no error in the server log.
  3. Stop the server.
- [ ] **Step 4: Checkpoint commit** (if authorized): `feat(docs): apply saved preferences before first paint`.

### Task 5: Records, probes, gate

**Files:**

- Create: the package README (`Owns:`, public names by unit, the rules from Global Constraints including the `frontend-ui` direction, scripts).
- Modify the records:
  - `docs/architecture/reorganization-ownership-map.md`: the `settings` row, and the `UI components` or `UI providers` row for the mode provider, with M6.2 notes.
  - `docs/architecture/workspace-conventions.md`: inventory `frontend-preferences` First code `M6.2 (exists)`, and the sentence after the table.
  - `docs/architecture/decisions/0014-multi-app-package-boundaries.md`: section 7 sentence.
  - `docs/architecture/decisions/0010-preference-persistence.md`: extend the M6.1 implementation note with where storage and boot now live.
  - `packages/frontend/README.md` and `packages/frontend/ui/README.md` (mode provider moved).
  - `.agents/task-scope.md`: M6 entry.
  - The M6 design's status line.

- [ ] **Step 1: Update the records.** No owner quotes.
- [ ] **Step 2: Boundary probes** (planted, then removed, with `git diff` empty afterwards):
  - `import { Button } from '@synapcity/frontend-ui/core/button';` in a `frontend-preferences` source file. Expected: R0, or with a temporary `node_modules` link, R9 package cycle.
  - `import 'next/link';` in the same file. Expected: R0, or with a link, R11.

  Record both, and confirm the R9 mode-provider exception is gone and none was added.

- [x] **Step 3: Repository gate.** `pnpm verify` with nothing else running. Expected: every stage passes. Passed in CI on PR #64 (2026-10-24); the manual browser checks in Step 4 were not run.
- [ ] **Step 4: Report** per AGENTS.md section 9: what moved, what stayed for M6.4 (provider, tabs, `AccountSync`), checks run and not run. Manual: open web Settings, change mode, text size and a font, reload, and see no flash; open docs and see it boot with defaults. Next: the M6.3 plan (shared-look cookie).
- [ ] **Step 5: Checkpoint commit** (if authorized): `docs: record milestone 6.2 browser preference runtime`.

## Calls made (owner to check)

- **`frontend-ui` depends on `frontend-preferences`, never the reverse.** `ModeToggle` is a control and stays in `frontend-ui`; the provider it reads is runtime and moves. This keeps one direction and no cycle.
- **The preview helpers move with the apply functions.** They read the same attributes and variables; splitting them now would leave the Settings screen holding half of a contract.
- **The device store stays thin in M6.2.** Its functions keep `localStorage`'s exact behavior, and the cookie (M6.3) is added behind the same functions.
- **Docs boots with its own storage.** The scripts run on docs and find nothing until M6.3 writes the shared cookie, so docs shows defaults, as today.
- **No `@source` line unless needed.** The package renders no classes, apart from what its story uses inline.

## Left open on purpose

- The shared-look cookie, its migration and docs writing mode (M6.3).
- Whether `next-themes`' own mode entry or `theme.mode` in `synapcity-preferences` is authoritative. Both stay as they are; M6.3 decides, since mode joins the cookie.
- The Settings provider, tabs and screen contracts (M6.4).
