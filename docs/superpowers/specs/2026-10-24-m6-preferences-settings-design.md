# Milestone 6: Preferences and Settings

**Status:** Accepted (owner decision, 2026-10-24). Q1–Q4 answered with the recommendations (section 9); the calls in section 10 stand. Implementation follows a plan per sub-milestone. M6.1 (preference rules), M6.2 (browser runtime) and M6.3 (shared look) are implemented as of 2026-10-24 ([M6.1 plan](../plans/2026-10-24-m6-1-domain-preferences.md), [M6.2 plan](../plans/2026-10-24-m6-2-frontend-preferences.md), [M6.3 plan](../plans/2026-10-24-m6-3-shared-look.md)).
**Date:** 2026-10-24
**Branch:** `chore/reorganization-m6-preferences-settings` from `main` at `38547c72` (M5 squash-merged as #59).
**Governing decisions:** [ADR-0014](../../architecture/decisions/0014-multi-app-package-boundaries.md) (categories, matrix), [ADR-0010](../../architecture/decisions/0010-preference-persistence.md) (account and device preferences; amended by section 4.3 if Q1 is accepted), [ADR-0003](../../architecture/decisions/0003-typography-roles-and-font-preferences.md) (font roles and preferences), the [workspace conventions](../../architecture/workspace-conventions.md) (inventory, entry points, organization, boundary checks R0–R11), the [M5 design](2026-10-23-m5-spaces-slice-design.md) (the feature-package pattern this copies).
**Sequence:** roadmap order (owner decision, 2026-10-23): M4 identity, M5 Collection and Spaces, **M6 Preferences and Settings**, M7 Auth and Account, M8 Documents and Dashboards, M9 Home, M10 sweep.

## 1. Intent

Preferences are used everywhere: every page applies them before the first paint, Settings edits them, the server stores the account part, and error reporting obeys the privacy choice. Today all of it is one app folder, `apps/web/src/features/settings` (159 files, about 5,800 source lines, 53 test files). M6 splits it by who needs what, so that the docs app, Storybook and future apps can use the same rules and the same browser runtime as the web app.

The owner set one product requirement for M6 (2026-10-24): the docs app and other browser hosts should show the person's chosen look, not only share the code. Web and docs are served under one parent domain (owner, 2026-10-24), so the look can travel in a cookie on that domain (section 4.3). Everything else in M6 is a move that preserves behavior.

## 2. Goals, non-goals, anti-goals

**Goals**:

- `domain-preferences` holds the preference rules: schemas, defaults, account or device scope, merging, reconciliation, import and export validation, consent policy. No React, no browser, no server.
- `frontend-preferences` holds the browser runtime: the device store, the boot scripts that apply the look before first paint, live apply functions, mode, consent state, font loading. Web, docs and Storybook use it.
- A person's look (mode, density, text size, display settings, fonts, corner radius) shows the same in web and docs.
- `server-account` holds reading and writing the account preferences row.
- `features-settings` holds the Settings experience, copying the `features-spaces` entry layout.
- `frontend-error-reports` holds consent-gated error reporting and event scrubbing.
- The two M6-tagged boundary exceptions are removed (section 6).

**Non-goals**:

- Profile, avatar and other account operations: they join `server-account` in M7 with Auth and Account (Q2).
- Native apps. They will use `domain-preferences` and the account; their runtime is out of scope.
- New preferences, new Settings tabs, or changed defaults.
- Rendering the look on the server from the cookie. The cookie makes it possible later; M6 keeps the boot scripts (section 11).

**Anti-goals** (a failure even if the code works)

- A visible flash of the wrong look on any page, or a person losing their saved choices in the move.
- Anything private in the shared cookie: no regional, notification or privacy values, no ids, no tokens.
- A change to ADR-0010's precedence (account override, then device value, then default) or to which fields are account or device scope.
- Docs reaching server code or the web app's Settings screen to get the look.

## 3. Current state (evidence, read at `38547c72`)

| Part                                   | Where today                                                                                                                                                                                                  | Notes                                                                                                                                                                                                                                    |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Schemas and defaults                   | `features/settings/types/` (settings, appearance, theme, regional, notifications, data-privacy, fonts, import-export)                                                                                        | Depend only on `zod`. `fonts.ts` mixes the font catalog (ids, labels) with web stylesheet URLs.                                                                                                                                          |
| Scope, merge, reconcile, import/export | `lib/scope.ts` (227), `lib/settings.ts` (175), `lib/account-sync.ts` (81)                                                                                                                                    | Pure, except `account-sync.ts`, which also reads and writes `localStorage` (`readDeviceDisplay`, `writeDeviceDisplay`).                                                                                                                  |
| Consent policy                         | `shared/privacy-consent/` (`canCollect`, `isBlockedBySignals`)                                                                                                                                               | Pure.                                                                                                                                                                                                                                    |
| Device store and boot                  | `shared/appearance-attributes/` (`PREFERENCES_STORAGE_KEY` = `synapcity-preferences`, `applyAppearance`, `appearanceBootScript`), `shared/theme-shape/`, `shared/font-preferences/`                          | Three inline boot scripts in `app/layout.tsx` read the one `localStorage` entry that holds the whole preference document.                                                                                                                |
| Browser hooks                          | `hooks/` (15 hooks: `use-can-collect`, `use-global-privacy-control`, `use-prefers-dark`, `use-notification-permission`, the per-tab hooks, `use-settings-draft` 205 lines)                                   | `use-can-collect` reads `localStorage` directly.                                                                                                                                                                                         |
| Provider                               | `providers/settings-provider/settings-provider.tsx` (358)                                                                                                                                                    | Holds state, writes `localStorage`, reconciles with the account.                                                                                                                                                                         |
| Generic Settings presentation          | `shared/{setting-row, settings-section, settings-select, settings-combobox, settings-accordion, settings-tabs, settings-page, settings-drafts}`                                                              | `settings-tabs` and `settings-page` sit in the R9 cycle exception.                                                                                                                                                                       |
| Product tabs                           | `components/{account-settings, appearance-settings, theme-settings, regional-settings, notification-settings, data-privacy-settings, import-export-settings, account-preferences-sync}`                      | Copy, drafts and workflows.                                                                                                                                                                                                              |
| Server                                 | `server/account-preferences.ts` (`loadAccountPreferences`, memoized `getAccountPreferences`), `server/actions/preferences-actions.ts` (`saveAccountPreferences`)                                             | Uses `features/account/server/caller` (`logFailure`, `getCallerIdentity`).                                                                                                                                                               |
| Mode                                   | `@synapcity/frontend-ui/providers/mode-provider` (`next-themes`)                                                                                                                                             | Web, docs (`apps/docs/src/app/providers.tsx`) and Storybook (`storageKey="storybook-mode"`) use it. `next-themes` keeps its own storage beside `synapcity-preferences`. Mode-provider and `utils/theme` form an R9 cycle (M6 exception). |
| Error reports                          | `features/error-reports/` (10 files: `client/error-reports` with a Sentry adapter, `shared/scrub-event`)                                                                                                     | Its only Settings dependency is `useCanCollect`.                                                                                                                                                                                         |
| Consumers outside Settings             | `app/layout.tsx` (boot scripts, `AccountPreferencesSync`, `getAccountPreferences`, `pageLanguage`), `app/[userId]/settings/{layout,page}.tsx`, `features/error-reports`, a comment in `app/privacy/page.tsx` | The docs app imports nothing from Settings today.                                                                                                                                                                                        |

## 4. Design

### 4.1 `domain-preferences`

Root entry, portable, `zod` only. It owns the units below, each in its own folder with tests moved from the app:

- **Schemas, types and defaults:** `settingsSchema`, `Settings`, `SettingsPatch`, `settingsDefaults`, and the section schemas (appearance, theme, regional, notifications, data-privacy, import-export).
- **The font catalog:** font ids, roles, labels and the per-role lists. Stylesheet URLs and font stacks are web loading concerns and go to `frontend-preferences`.
- **Scope:** `settingScope`, `displaySchema`, `accountPreferencesSchema`, `displayOf`, `accountPart`, `isDefaultAccount`, `touchesAccount`, `readAccountPreferences`, `withAccount`.
- **Merging and import/export:** `mergeSettings`, `withoutStoredAccount`, `parseImportPatch`, `parseImport`, `TRANSFER_FILE_VERSION`, `toTransferFile`, `fromTransferFile`.
- **Reconciliation:** the pure half of `account-sync.ts` (`reconcile` and its types); the `localStorage` half goes to 4.2.
- **Consent policy:** `canCollect`, `isBlockedBySignals`. The browser signals (Global Privacy Control) are passed in, never read here.
- **The shared-look shape** (4.3): the `look` schema, which fields it carries, its version, and the pure functions that build it from `Settings` and apply it back.

### 4.2 `frontend-preferences`

Root entry, browser runtime, framework-neutral (no `next`). It owns:

- **The device store:** read and write of `synapcity-preferences`, the device display copy, and the shared look (4.3) behind one small interface, so the provider and the hooks stop calling `localStorage` directly.
- **Boot:** the appearance, theme-shape and font boot scripts as strings the host inlines, plus the live apply functions (`applyAppearance`, `applyThemeShape`, `applyFontPreferences`) and font loading (`loadFont`, stylesheet URLs, stacks).
- **Consent state:** `useCanCollect`, `useGlobalPrivacyControl`, `usePrefersDark`.
- **Mode:** the mode provider moves here from `frontend-ui`, which removes its R9 cycle. Mode is part of the shared look; how it reads and writes the cookie alongside `next-themes` is left to the plan, with the constraint in 4.3.

### 4.3 The shared look (Q1)

The look travels in one cookie on the parent domain.

- **What it holds:** `theme.mode`, `theme.density`, `theme.textSize`, the `appearance` display fields, the three font choices and `theme.radius`. These are ADR-0010's device fields plus the account taste fields the boot scripts already cache. It holds nothing else (anti-goal).
- **Format and attributes:**
  - Content: versioned JSON (`{ v: 1, ... }`), validated with the domain `look` schema on read. An invalid or newer cookie is ignored, never trusted.
  - `Path=/`, `SameSite=Lax`, `Secure` on https, a one-year lifetime.
  - Not `HttpOnly`, because the browser writes it. That is acceptable only because it holds display choices (anti-goal).
  - `Domain` comes from one host setting (proposed `NEXT_PUBLIC_PREFERENCES_COOKIE_DOMAIN`). When the setting is unset the cookie is host-only, so local development and preview builds keep working.
- **Precedence is unchanged:** the account override, then the device value (now the cookie), then the default. ADR-0010's scopes stay as they are.
- **Migration:**
  - On first load after the change, if there is no cookie but `synapcity-preferences` holds display values, the runtime writes the cookie from them once.
  - The boot scripts read the cookie first and fall back to `localStorage`, so nobody loses their look or sees a flash.
  - `localStorage` keeps the rest of the document (the account cache for regional, notification and privacy values).
- **Writers:** every place that changes a look field writes the cookie: the Settings screen, account sync, and docs' mode toggle (Q4).
- **Record:** ADR-0010 gains an amendment recording the cookie, its contents and its attributes.
- **Constraint for mode:** the mode a person last chose shows on both sites.
- **Development:** cookies ignore the port, so `localhost:8080` (web) and `localhost:4000` (docs) already share the look.

### 4.4 `server-account` (preferences only in M6, Q2)

Root entry, `server-only`. It reads and writes the `user_preferences` row through a request client the host supplies (as `server-data` does). It takes the code in `loadAccountPreferences`, plus the write half of `saveAccountPreferences` after the action has checked the caller. Fixture mode and logging stay with the host. In M7 it gains profile, avatar and the other account operations, and the shared caller helpers move to `server-auth` or `server-account` as M7 decides.

### 4.5 `features-settings`

Entries as `features-spaces`: `./contracts`, `./frontend`, `./server`, no root.

- **`./frontend`:**
  - The product tabs, the provider, the drafts and the unsaved-changes guard, import/export, `AccountPreferencesSync`, and the Settings page shell.
  - The generic presentation pieces (setting row, section, select, combobox, accordion, tabs) stay here at first, in their own unit folders with stories (Q3).
  - The draft hook and the provider are split into units small enough to test, without changing behavior.
- **`./server`:** loads the account preferences for the page and for the root layout (`getAccountPreferences` keeps its per-request memo), over `server-account`.
- **`./contracts`:** only what the host and both halves share and domain does not own, such as the save result type. Expect it to stay small.
- **The host keeps** the routes, the `saveAccountPreferences` Server Action (input, fixture check, caller identity, then `server-account`), the root layout wiring and `pageLanguage` use, all reading from the packages.

### 4.6 `frontend-error-reports`

Root entry, browser only. It holds the Sentry adapter, the consent gate (through `frontend-preferences`' `useCanCollect`) and `scrubEvent`. The Sentry dependency stays isolated in this package. The web app mounts it as today.

### 4.7 Hosts

- **Web:** inlines the boot scripts from `frontend-preferences`, mounts its mode provider and account sync, and keeps every route and action.
- **Docs:** adopts `frontend-preferences`: it inlines the boot scripts and uses its mode provider instead of `frontend-ui`'s. It needs the host cookie-domain setting and the fonts the person can choose (ADR-0003 loading). It reads the look and, through its existing mode toggle, writes only mode (Q4). It shows no Settings screen.
- **Storybook:** uses `frontend-preferences` so stories render with the real runtime. Its toolbar keeps setting the look for stories, and it does not read a person's cookie (my call: a catalog should look the same for everyone).

### 4.8 Tests and verification

- **Characterization first:** the existing Settings, preference and error-report tests move with their code and keep their assertions.
- **New tests:**
  - Cookie read and write, including the bounds: an invalid cookie, a newer version, and a missing domain setting.
  - Migration from `localStorage`.
  - Precedence with and without the account override.
  - Boot scripts reading the cookie first.
  - Docs applying a look set in web.
- **End to end:** set the look in web, open docs, and see the same look with no flash. This runs in the existing suite against the production build, with both servers on localhost. `@synapcity/dev-playwright-config` starts one server today; the M6.3 plan extends it to start docs as well (Playwright accepts several `webServer` entries).
- **Gates:** `pnpm verify`, boundary probes for the new packages, and owner manual checks against live Supabase (signed-in Settings, account sync across two browsers, the override switch).

## 5. Package creation

Five new packages per the package checklist: `domain-preferences`, `frontend-preferences`, `server-account`, `features-settings`, `frontend-error-reports`. `frontend-ui` loses the mode provider. Web, docs and Storybook gain workspace dependencies, Storybook gains a stories glob, and the Tailwind entry points gain `@source` lines. No new external dependency is expected; Sentry moves with its package at the version web declares today.

## 6. Boundary checks and exceptions

| Exception                                                               | Removed by | Condition |
| ----------------------------------------------------------------------- | ---------- | --------- |
| R9 settings barrel cycle (`settings-page`, `settings-tabs` index files) | 4.5        | always    |
| R9 `mode-provider` and `utils/theme` cycle in `frontend-ui`             | 4.2        | always    |

Completion criterion: `pnpm boundaries` passes with these two removed and none added.

## 7. Migration bridges

None. As in M5, each sub-milestone re-points its consumers in the same change.

## 8. Order of work (sub-milestones on this branch)

1. **M6.1 Rules.** `domain-preferences`. Web re-points its imports; no behavior change.
2. **M6.2 Browser runtime.** `frontend-preferences`, mode moved from `frontend-ui`; web, docs and Storybook adopt it, with each keeping its own storage at this step.
3. **M6.3 Shared look.** The cookie (4.3), the ADR-0010 amendment, migration, docs reading the look. This is the visible change (Q1).
4. **M6.4 Settings and saving.** `server-account` (preferences), `features-settings`; web routes thinned.
5. **M6.5 Error reports.** `frontend-error-reports`.
6. **Close-out.** Records (ownership map, inventory, ADR-0014 section 7, task scope), `pnpm verify`, owner manual checks, one pull request with a section per sub-milestone (as M5, owner decision 2026-10-24).

Also in M6 (owner decision, 2026-10-24): the stale `supabase/seed.sql` header comment, which still points at the deleted Spaces fixtures file.

## 9. Owner questions

| #   | Question                                                                                                                                                | Recommendation                                                                                                                                                             |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q1  | Approve the shared-look cookie (4.3): its contents, its attributes (not `HttpOnly`), the parent domain from a host setting, and the ADR-0010 amendment? | Yes. It is the only way a signed-out person's look reaches docs, it holds nothing private, and the first-paint path stays as fast as today.                                |
| Q2  | Keep `server-account` to the preferences row in M6, and move profile, avatar and the caller helpers in M7?                                              | Yes. Those belong with auth and account workflows (M7). The inventory row's M6 entry is updated to say so.                                                                 |
| Q3  | Keep the generic Settings pieces inside `features-settings` instead of a separate `frontend-settings` package for now?                                  | Yes. Nothing outside Settings uses them. They move out when a second consumer appears (for example a docs or desktop settings view). The inventory row is marked deferred. |
| Q4  | Should docs be able to change the look (its mode toggle writes the shared cookie), or only show it?                                                     | Docs writes mode only, through the toggle it already has. Every other look choice is made in the web app's Settings.                                                       |

**Answers, 2026-10-24 (owner decisions).** Q1: yes, the shared-look cookie and the ADR-0010 amendment, as in 4.3. Q2: yes, `server-account` holds only the preferences row in M6; profile, avatar and the caller helpers move in M7. Q3: yes, no `frontend-settings` package for now; the generic pieces stay in `features-settings`. Q4: docs shows the look and writes only mode, through its existing toggle.

## 10. Calls made by Claude (owner to check)

| #   | Call                                                                                                | Why                                                                                    |
| --- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| C1  | Font ids and labels go to domain; stylesheet URLs, stacks and loading go to `frontend-preferences`. | The ids are part of the saved preference; loading is a browser concern.                |
| C2  | Storybook keeps its own toolbar look and does not read the person's cookie.                         | A component catalog should render the same for every viewer.                           |
| C3  | The look is not rendered on the server in M6, even though the cookie would allow it.                | It is an optimization, not part of the move; the boot scripts already prevent a flash. |
| C4  | `localStorage` keeps the rest of the preference document; only the look moves to the cookie.        | Keeps private values off every request and keeps ADR-0010's account cache as it is.    |
| C5  | Fixture mode and logging stay with the host; `server-account` never reads fixture mode or logs.     | Same rule as `server-data`.                                                            |
| C6  | Sub-milestones share this branch and go up as one sectioned pull request.                           | The owner chose that shape for M5 (2026-10-24).                                        |

## 11. Left out, found along the way

- Rendering the look on the server from the cookie (C3): a later improvement that would remove the boot scripts' work on the first paint.
- `theme.mode` is stored twice today, in `synapcity-preferences` and in `next-themes`' own entry; the M6.2 plan decides which one is authoritative, keeping behavior.
- Native apps' preference runtime.
