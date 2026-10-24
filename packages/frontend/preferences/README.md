# @synapcity/frontend-preferences

Owns: the browser half of preferences (ADR-0010, ADR-0003). It reads the saved preferences in the browser and applies them to the page: the boot scripts and apply functions, font loading, the device store, the consent and system-signal hooks, mode (`ModeProvider`, `useMode`, moved from `frontend-ui` in M6.2), and the shared look cookie (M6.3). `frontend-ui`'s `ModeToggle` imports `useMode` from here. Plans: [M6.2](../../../docs/superpowers/plans/2026-10-24-m6-2-frontend-preferences.md), [M6.3](../../../docs/superpowers/plans/2026-10-24-m6-3-shared-look.md).

Runtime: browser and React, framework-neutral. It imports no `next` and no server code. Dependencies: `@synapcity/domain-preferences` for the preference shapes, catalogs and rules, and `react` for types. It never depends on `@synapcity/frontend-ui`; `frontend-ui` depends on it for `ModeToggle`. Category rules: [frontend README](../README.md) and [ADR-0014](../../../docs/architecture/decisions/0014-multi-app-package-boundaries.md).

## Public interface

| Entry                             | Exports                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@synapcity/frontend-preferences` | `PREFERENCES_STORAGE_KEY`, `PREFERENCES_SAVED_EVENT`, `applyAppearance`, `appearanceBootScript`, `applyThemeShape`, `previewShapeAttributes`, `previewTextScaleStyle`, `themeShapeBootScript`, `loadFont`, `applyFontPreferences`, `previewFontValue`, `previewFontStyle`, `fontBootScript`, `fontStylesheetUrl`, `fontStack`, `fontPreferenceVariables`, `ModeProvider`, `useMode`, `Mode`, `ResolvedMode`, `isMode`, `isResolvedMode`, `resolveMode`, `resolveSystemMode`, plus the store and hooks below |

The device store (`readStoredPreferences`, `writeStoredPreferences`, `clearStoredPreferences`, `announcePreferencesSaved`, `onStoredPreferencesChange`, `readDeviceDisplay`, `writeDeviceDisplay`, `deviceTimezone`) is the one place preferences are read from or written to browser storage. Each function behaves like the `localStorage` call it replaces, including throwing where `localStorage` throws, so callers keep their own `try`/`catch`. The hooks are `useCanCollect` (consent for a collector, following other tabs and this tab's saves), `useGlobalPrivacyControl` and `usePrefersDark`.

The shared look (M6.3): `readLookCookie`, `writeLookCookie`, `serializeLookCookie` and `configureLookCookie` (the host sets the parent domain once; anything but a plain host name is ignored), `saveLook`, `migrateLookToCookie`, `currentLook` and `shareMode`. The boot scripts read the cookie first, and `modeBootScript` seeds `next-themes` from it; `ModeProvider` writes it only when given `shareLook`, so Storybook never does.

The boot scripts check the cookie's shape (version 1, object `theme` and `appearance`) and then validate each value field by field; `readLookCookie` validates the whole cookie against the `look` schema. So a version-1 cookie with one bad value gets that field's default at first paint, but is ignored entirely by the React side. This is deliberate: the script stays small, and a bad value can never reach an attribute.

The three `*BootScript` strings are inlined in the document head before first paint so saved preferences apply with no flash. Their text is pinned by `src/scripts/boot-scripts.expected.json`: change a script only on purpose, and regenerate the fixture in the same change.

## Rules

- One folder per unit under `src/scripts/`, `src/store/`, `src/hooks/`, `src/providers/`, `src/utils/` and `src/types/`, each with its `index.ts`; imports between folders go through the folder's `index.ts`.
- No `next`, no server code, no `@synapcity/frontend-ui`, in production code, tests or stories.
- Outside this package, nothing reads or writes the preference keys directly; go through the store.
- Stored keys, the `synapcity-preferences-saved` event name and the data attributes are contracts with the saved data and the CSS. Do not rename them here.

## Scripts

`lint`, `check-types`, `test`, `test:coverage`. DOM tests run in jsdom.
