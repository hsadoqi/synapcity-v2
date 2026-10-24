# @synapcity/domain-preferences

Owns: the preference rules (ADR-0010, ADR-0003). The schemas and defaults for every preference section, the font catalog, which preference follows the account and which stays on the device, merging a change into the current preferences, reconciling the account with this device, the import and export file format, and the consent policy. Milestone 6.1 moved these from `apps/web/src/features/settings`.

Runtime: portable. `zod` is the only dependency; there is no React, no DOM or browser API, no server and no app import. Browser signals such as Global Privacy Control are passed in, never read here. Category rules: [domain README](../README.md) and [ADR-0014](../../../docs/architecture/decisions/0014-multi-app-package-boundaries.md).

## Public interface

`@synapcity/domain-preferences` (root entry only).

| Unit                    | Exports                                                                                                                                                                                                                                                                                                                             |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `schemas/settings`      | `settingsSchema`, `Settings`, `SettingsPatch`, `settingsDefaults`                                                                                                                                                                                                                                                                   |
| `schemas/appearance`    | `appearanceSchema`, `AppearanceSettings`, `AppearanceSettingsPatch`, `appearanceDefaults`, `contrastModes`                                                                                                                                                                                                                          |
| `schemas/theme`         | `themeSchema`, `ThemeSettings`, `ThemeSettingsPatch`, `themeDefaults`, `radii`, `densities`, `textSizeRange`, `legacyFontSizes`                                                                                                                                                                                                     |
| `schemas/regional`      | `regionalSchema`, `RegionalSettings`, `RegionalSettingsPatch`, `regionalDefaults`, `SYSTEM_TIMEZONE`, `isSupportedTimezone`, `pageLanguage`, `resolveTimezone`                                                                                                                                                                      |
| `schemas/notifications` | `notificationsSchema`, `NotificationSettings`, `NotificationSettingsPatch`, `notificationsDefaults`, `notificationKinds`, `NotificationKind`                                                                                                                                                                                        |
| `schemas/data-privacy`  | `dataPrivacySchema`, `DataPrivacySettings`, `DataPrivacySettingsPatch`, `dataPrivacyDefaults`, `privacyPurposes`, `PrivacyPurpose`, `PRIVACY_POLICY_VERSIONS`, `Consent`, `choose`, `withCurrentPolicy`                                                                                                                             |
| `schemas/fonts`         | `googleFonts`, `GoogleFont`, `GoogleFontId`, `FontChoice`, `FontRole`, `headingFonts`, `bodyFonts`, `codeFonts`, `fontLabel`                                                                                                                                                                                                        |
| `schemas/import-export` | `transferSchema`, `TransferSettings`, `TransferSettingsPatch`                                                                                                                                                                                                                                                                       |
| `utils/scope`           | `settingScope`, `displaySchema`, `DisplaySettings`, `accountPreferencesSchema`, `AccountPreferences`, `displayOf`, `accountPart`, `isDefaultAccount`, `touchesAccount`, `readAccountPreferences`, `withAccount`, `TRANSFER_FILE_VERSION`, `toTransferFile`, `fromTransferFile`                                                      |
| `utils/merge-settings`  | `mergeSettings`, `withoutStoredAccount`, `parseImportPatch`, `parseImport`                                                                                                                                                                                                                                                          |
| `utils/reconcile`       | `reconcile`, `StoredAccountPreferences`                                                                                                                                                                                                                                                                                             |
| `utils/look`            | `lookSchema`, `Look`, `lookOf`, `parseLook`, `LOOK_VERSION`, `LOOK_COOKIE_NAME`; cookie size/lifetime constants, DNS-domain sanitization, serialization, value/header parsing and response renewal. This is the versioned display-only look shared by browser hosts and read identically by browser and server (ADR-0010 amendment) |
| `utils/privacy-consent` | `canCollect`, `isBlockedBySignals`, `PrivacySignals`                                                                                                                                                                                                                                                                                |

## Rules

- Stored values are compatibility surfaces: the `synapcity-preferences` document, the account row's `preferences` column, export files (`TRANSFER_FILE_VERSION` 2) and font ids. Never rename or drop a field, a value or a font id; add with a default, and map a retired value to its replacement (as `legacyFontSizes` does).
- Every field has a scope in `settingScope`; a new field does not compile until it has one.
- Inferred types sit beside their schema in each `schemas/<section>` unit; a section's own helpers stay with it.
- What reads or writes the browser (device storage, boot scripts, font loading) belongs to `frontend-preferences` (M6.2); the Settings screen's own types belong to `features-settings` (M6.4).

## Scripts

`lint`, `check-types`, `test`, `test:coverage`. Tests run in Node and sit beside each unit.
