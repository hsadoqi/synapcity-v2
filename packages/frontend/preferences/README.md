# @synapcity/frontend-preferences

Owns: the browser half of preferences (ADR-0010, ADR-0003). It reads the saved preferences in the browser and applies them to the page. Milestone 6.2 moves it in stages. So far: the boot scripts, the apply functions and font loading, the device store, the consent and system-signal hooks, and mode (`ModeProvider`, `useMode`, the `Mode` types and helpers, moved from `frontend-ui`). `frontend-ui`'s `ModeToggle` imports `useMode` from here. The remaining tasks are in the [M6.2 plan](../../../docs/superpowers/plans/2026-10-24-m6-2-frontend-preferences.md).

Runtime: browser and React, framework-neutral. It imports no `next` and no server code. Dependencies: `@synapcity/domain-preferences` for the preference shapes, catalogs and rules, and `react` for types. It never depends on `@synapcity/frontend-ui`; `frontend-ui` will depend on it once mode moves here. Category rules: [frontend README](../README.md) and [ADR-0014](../../../docs/architecture/decisions/0014-multi-app-package-boundaries.md).

## Public interface

| Entry                             | Exports                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@synapcity/frontend-preferences` | `PREFERENCES_STORAGE_KEY`, `PREFERENCES_SAVED_EVENT`, `applyAppearance`, `appearanceBootScript`, `applyThemeShape`, `previewShapeAttributes`, `previewTextScaleStyle`, `themeShapeBootScript`, `loadFont`, `applyFontPreferences`, `previewFontValue`, `previewFontStyle`, `fontBootScript`, `fontStylesheetUrl`, `fontStack`, `fontPreferenceVariables`, `ModeProvider`, `useMode`, `Mode`, `ResolvedMode`, `isMode`, `isResolvedMode`, `resolveMode`, `resolveSystemMode`, plus the store and hooks below |

The device store (`readStoredPreferences`, `writeStoredPreferences`, `clearStoredPreferences`, `announcePreferencesSaved`, `onStoredPreferencesChange`, `readDeviceDisplay`, `writeDeviceDisplay`, `deviceTimezone`) is the one place preferences are read from or written to browser storage. Each function behaves like the `localStorage` call it replaces, including throwing where `localStorage` throws, so callers keep their own `try`/`catch`. The hooks are `useCanCollect` (consent for a collector, following other tabs and this tab's saves), `useGlobalPrivacyControl` and `usePrefersDark`.

The three `*BootScript` strings are inlined in the document head before first paint so saved preferences apply with no flash. Their text is pinned by `src/scripts/boot-scripts.expected.json`: change a script only on purpose, and regenerate the fixture in the same change.

## Rules

- One folder per unit under `src/scripts/`, `src/store/`, `src/hooks/`, `src/providers/`, `src/utils/` and `src/types/`, each with its `index.ts`; imports between folders go through the folder's `index.ts`.
- No `next`, no server code, no `@synapcity/frontend-ui`, in production code, tests or stories.
- Outside this package, nothing reads or writes the preference keys directly; go through the store.
- Stored keys, the `synapcity-preferences-saved` event name and the data attributes are contracts with the saved data and the CSS. Do not rename them here.

## Scripts

`lint`, `check-types`, `test`, `test:coverage`. DOM tests run in jsdom.
