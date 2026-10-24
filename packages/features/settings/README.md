# @synapcity/features-settings

Owns: preference editing workflows, drafts, Settings presentation and composition. Canonical preference schemas and rules belong to `@synapcity/domain-preferences`; browser effects belong to `@synapcity/frontend-preferences`; account-row persistence belongs to `@synapcity/server-account`.

## Public interface

- `@synapcity/features-settings/contracts`: screen and save-result contracts.
- `@synapcity/features-settings/frontend`: Settings page composition and presentation.
- `@synapcity/features-settings/server`: server-only Settings data composition over `@synapcity/server-account`.

The host supplies request-bound data, actions, notices, and the web-specific Account tab. This package does not import app code, choose fixture mode, create request clients, or define routes.

## Scripts

`lint`, `check-types`, `test`, and `test:coverage`. Frontend stories run through the Storybook app and its accessibility checks.
