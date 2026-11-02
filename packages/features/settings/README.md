# @synapcity/features-settings

Owns: preference editing workflows, drafts and explicit Save, the status line's wording, and Settings presentation and composition. Canonical preference schemas and rules belong to `@synapcity/domain-preferences`; the runtime state, browser storage, account saves and document effects belong to `@synapcity/frontend-preferences` (`PreferencesProvider`, which the host mounts at its root and `SettingsProvider` reads); account-row persistence belongs to `@synapcity/server-account`.

## Public interface

- `@synapcity/features-settings/frontend`: Settings page composition and presentation.
- `@synapcity/features-settings/server`: server-only Settings data composition over `@synapcity/server-account`.

The host supplies request-bound data, notices, and the web-specific Account tab, and mounts the preferences runtime with the account session and save action. This package does not import app code, choose fixture mode, create request clients, or define routes.

## Scripts

`lint`, `check-types`, `test`, and `test:coverage`. Frontend stories run through the Storybook app and its accessibility checks.
