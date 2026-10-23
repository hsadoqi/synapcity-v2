# Milestone 3.1: package grouping and naming

**Status:** Proposed, awaiting owner approval.
**Date:** 2026-10-23
**Branch:** `chore/reorganization-m3-boundary-enforcement`
**Governing decision:** [ADR-0014](../../architecture/decisions/0014-multi-app-package-boundaries.md). This design turns its responsibility families into concrete packages. It does not change the dependency matrix.

## 1. Intent

Milestone 3 sets package conventions and the automated checks that enforce ADR-0014. Part 3.1 comes first because the later parts apply to its units: public entry points (3.2), internal organization (3.3), dependency checks (3.4) and build/test/catalogue integration (3.5).

The result is a complete package inventory, the naming and grouping rules behind it, and one frontend composition rule. With the inventory fixed, later migrations do not reopen where a responsibility lands.

## 2. Goals, non-goals, anti-goals

**Goals**:

- Name every target package, with its responsibility and current source inputs.
- State when modules share a package, when a new package is justified, and how packages are named.
- Record the owner's decisions from the 2026-10-23 discussion so they are not lost or overridden.

**Non-goals**:

- Creating packages, manifests, exports or moving source. A package is created by the migration that first moves code into it (section 6).
- Entry-point and export design (3.2), folder templates (3.3), check implementation (3.4).
- Product terminology, schemas, persisted identifiers, routes.

**Anti-goals** (failure even if the inventory looks complete)

- Packages that exist only to complete a diagram, or one package per component, query or noun.
- A name that silently becomes product vocabulary or contradicts a durable identifier.
- Rules in the documents that the owner never made. Every decision below is attributed.

## 3. Owner decisions (2026-10-23)

| #   | Decision                                                                                                                                                                                                                                                                                                                        |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | One capability may have packages in several categories, each holding only its own category's responsibility (for example `frontend/settings` beside `features/settings`). Recorded in ADR-0014 section 4.                                                                                                                       |
| D2  | The browser preference runtime is its own package, `frontend/preferences`, separate from settings presentation.                                                                                                                                                                                                                 |
| D3  | **Preferences** names the data, rules, persistence and runtime; **Settings** names the screen. Durable identifiers already say preferences (`user_preferences`, `synapcity-preferences`, `--font-preference-*`, ADR-0010). Moving code does not rename the existing `Settings` TypeScript model; a rename is a separate change. |
| D4  | Profile and account contracts live in `domain/identity` with credential contracts. They are already coupled: the auth schema imports `nameSchema` from account.                                                                                                                                                                 |
| D5  | Space, Document and Dashboard contracts share one package, `domain/records`, with a module per kind.                                                                                                                                                                                                                            |
| D6  | Records extend one **base record contract** for their shared attributes so those are not repeated. Each kind keeps its own contract and semantics. This is a portable contract, not the universal entity table excluded by `docs/product/non-goals.md`. Recorded in ADR-0014 section 4.                                         |
| D7  | `frontend/shells` holds composable frames at two levels: app shells and page frames. A shell owns structure and shared behavior; content arrives through `children` and named slots.                                                                                                                                            |

## 4. Naming rules

1. Packages live at `packages/<category>/<name>` and are named `@synapcity/<category>-<name>`, lowercase kebab-case. The leaf does not repeat the category. Apps stay unscoped. (Existing convention, ADR-0014.)
2. Prefer the name the code and durable identifiers already use. Do not coin a new product noun for a package; `docs/glossary.md` governs product terms, and a package name does not finalize one.
3. The same capability name may appear in several categories (D1). The category prefix tells them apart: `@synapcity/frontend-settings`, `@synapcity/features-settings`.
4. Name by responsibility, not by technique. "Containers", "layouts", "utils", "common" and "shared" are not package names: they describe how code is built or nothing at all.

## 5. Grouping rules

1. **Group by cohesive responsibility.** Modules that change together, share dependencies and serve the same consumers belong in one package. Several shells share `frontend/shells`; several repositories share `server/data`; three record kinds share `domain/records`.
2. **A new package must earn its boundary** through at least one of: a different runtime (browser, server, portable), different dependencies, a different consumer set, independent testing, or a different rate of change. Folder size alone is not a reason. A second current consumer is not required; planned consumers (desktop, mobile, Storybook) count.
3. **Grow inside before splitting.** A package can hold several explicit modules behind its public entry points. Split when a module's consumers, dependencies or runtime diverge from the rest.
4. **Shared fields go in a base contract inside the owning package,** not in a separate cross-cutting package (D5, D6).
5. **Platform effects stay with their runtime.** Browser effects (DOM attributes, fonts, storage, browser SDKs such as Sentry) are frontend packages; backend provider integration is server. There is no separate platform umbrella (section 8, C5).

## 6. Package inventory

"Inputs" names current source that is expected to land in the package. Each module is still classified at migration time by what it does, not by its folder; files with mixed responsibilities split. **Created in** is the milestone whose migration first moves code in, per the roadmap.

### domain (portable: no React, DOM, request, SDK or storage)

| Package              | Owns                                                                                                                        | Inputs                                                                                                                                                                                                                                                    | Created in |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| `domain-records`     | Base record contract; Space, Document and Dashboard contracts as separate modules; create/update inputs; pure record rules  | `packages/frontend/ui/src/types/entity-schema.ts`; canonical parts of `ui/src/types/entity.ts`; the schema and types in `apps/web/src/lib/owned-records/owned-records.ts` (its queries go to `server-data`); `apps/web/src/features/spaces/shared/schema` | M4         |
| `domain-preferences` | Preference schemas and defaults, account/device scope, merge and reconciliation, import/transfer validation, consent policy | `apps/web/src/features/settings/types/*`, `lib/settings.ts`, `lib/scope.ts`, pure parts of `shared/privacy-consent` and `shared/theme-shape`                                                                                                              | M4         |
| `domain-identity`    | Credential, profile, name and avatar contracts and validation; verified-identity contract                                   | `features/account/types/schema.ts`, `features/account/shared/name`, `features/auth/types/schema`, the verified-identity part of `features/auth/shared/current-user` and `lib/data/user.ts`                                                                | M4         |

User-facing messages inside today's schemas (for example `PASSWORD_TOO_SHORT_MESSAGE`) are product copy and move to the owning feature; the domain keeps the rule.

### frontend (presentation, interaction, styling, shells, browser platform effects)

| Package                               | Owns                                                                                               | Inputs                                                                                                                                                                                                                  | Created in                                               |
| ------------------------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `frontend-ui` (existing)              | Primitives and generic components, generic form pieces, generic hooks, low-level layout primitives | Current UI components and hooks (for example `use-mobile`); `apps/web/src/components/forms`, `apps/web/src/hooks`                                                                                                       | exists                                                   |
| `frontend-shells`                     | Composable app shells and page frames (section 7)                                                  | `ui/src/blocks/root-shell` (including `global-panel`), `sidebar-shell`, `context-switcher`, `search-form`; `apps/web/src/components/shells`, generic parts of `components/breadcrumbs`; generic page frames (section 7) | M6                                                       |
| `frontend-collection`                 | Browse projections, query/filter/sort mechanics, generic controls, displays, local browse state    | `apps/web/src/features/collection`; generic cards, rows and sections from `ui/src/blocks/entity`; screen-only shapes from `ui/src/types/entity.ts`                                                                      | M7                                                       |
| `frontend-settings`                   | Settings presentation pieces: rows, sections, select/combobox, accordion and tab structure         | `features/settings/shared/setting-row`, `settings-section`, `settings-select`, `settings-combobox`, `settings-accordion`, `settings-tabs`                                                                               | M8                                                       |
| `frontend-preferences`                | Browser preference runtime: applies mode, theme, fonts and appearance; exposes consent state       | `features/settings/shared/appearance-attributes`, `font-preferences`, the browser parts of `theme-shape`; `ui/src/providers/mode-provider`; browser hooks such as `use-prefers-dark`, `use-can-collect`                 | M8                                                       |
| `frontend-auth`                       | Auth presentation pieces: dividers, link buttons, resend button, confirmation and status views     | Presentational parts of `features/auth/shared` (`auth-divider`, `auth-link-button`, `resend-button`, `auth-confirmation`)                                                                                               | M9                                                       |
| `frontend-error-reports`              | Browser error reporting: consent-gated Sentry adapter and event scrubbing                          | `apps/web/src/features/error-reports` (`fake-sentry.ts` stays beside its tests)                                                                                                                                         | M8 (its consent input comes from `frontend-preferences`) |
| `frontend-site` (existing)            | Site metadata and brand presentation                                                               | unchanged                                                                                                                                                                                                               | exists                                                   |
| `frontend-tailwind-config` (existing) | Tokens and styling foundation                                                                      | unchanged                                                                                                                                                                                                               | exists                                                   |

**Preference state split** (settled by ADR-0014's Preferences row). Today `features/settings/providers/settings-provider` both edits preferences and performs browser effects: it reads and writes the `synapcity-preferences` storage key and applies fonts, theme shape, mode and page language. At migration it splits:

- `frontend-preferences` owns the device store (storage key, saved event, read/write, legacy cleanup), applying preferences to the document, and read-only hooks such as `use-can-collect`, which already reads storage directly. The app root mounts it, so preferences apply on every page.
- `features-settings` owns drafts, validation feedback, the unsaved-changes guard and account-sync orchestration, and saves through the store's public interface. Account persistence goes through a host-supplied command to `server-account`.

The storage key, event name and precedence rules are durable and do not change (ADR-0010).

### server (trusted backend operations and provider integration)

| Package          | Owns                                                                                   | Inputs                                                                                                                                                                                           | Created in |
| ---------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| `server-auth`    | Verified identity, auth operations, verified-caller helpers, provider translation      | `features/auth/server/operations`, `server/session`; generic caller verification in `features/account/server/caller.ts`                                                                          | M9         |
| `server-account` | Profile, avatar and account-preference operations and persistence                      | `features/account/server/profile-metadata`, `save-name.ts`, `save-avatar.ts`, `image-type`; `features/settings/server/account-preferences.ts`                                                    | M8 / M9    |
| `server-data`    | Repositories, queries and row mapping for Spaces, Documents and Dashboards, as modules | `features/spaces/server/space-repository`, `get-space`, `get-spaces`; `features/documents/server/get-documents`; `features/dashboards/server/get-dashboards`; the queries in `lib/owned-records` | M7         |

Server Actions (`*-actions.ts`), `form-data` parsing and `site-origin` stay in `apps/web` as host request bindings (ADR-0014 section 3).

### features (product experiences)

| Package               | Owns                                                                                                 | Inputs                                                                                                                                                                           | Created in |
| --------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| `features-auth`       | Sign-in, registration, password, email and session workflows; auth copy and client state             | `features/auth/components`, `features/auth/client`, `shared/error-messages`, `shared/oauth-providers`, `shared/recent-link-sign-in`, display-user projection from `current-user` | M9         |
| `features-account`    | Name, avatar and profile workflows                                                                   | `features/account/components`, workflow parts of `features/account/shared`                                                                                                       | M9         |
| `features-settings`   | The Settings experience: tabs, editors, drafts, unsaved-changes guard, import/export, feedback, copy | `features/settings/components`, `hooks`, `providers`, `shared/settings-drafts`, `shared/settings-page`, `lib/data/tabs.ts`, `utils`                                              | M8         |
| `features-spaces`     | Space browsing and detail: collection mapping, copy, previews, commands                              | `features/spaces/components`, `lib/collection-item`                                                                                                                              | M7         |
| `features-documents`  | Document browsing: collection mapping, copy, previews                                                | `features/documents/components`, `lib/collection-item`                                                                                                                           | M10        |
| `features-dashboards` | Dashboard browsing: collection mapping, copy, previews                                               | `features/dashboards/components`, `lib/collection-item`                                                                                                                          | M10        |
| `features-home`       | Home: aggregates the resource features                                                               | `features/home/components`, `providers`, non-fixture parts of `lib`                                                                                                              | M11        |

Feature-local fixtures (`lib/fixtures`, `*.fixtures.ts`, `fixture-clock.ts`) move to `dev-fixtures`.

### dev (never in a shipped graph)

| Package                                                                                               | Change                                                                                                                   |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `dev-fixtures` (existing)                                                                             | Extended with contract-based factories, scenarios and sample content as modules inside the package (M5). No new package. |
| `dev-eslint-config`, `dev-typescript-config`, `dev-vitest-config`, `dev-playwright-config` (existing) | Unchanged by 3.1; 3.4 and 3.5 may extend them.                                                                           |

**Totals:** 19 new packages over the reorganization (domain 3, frontend 6, server 3, features 7) and 8 existing packages kept (frontend 3, dev 5).

## 7. Frontend composition rule (for 3.3)

All frontend packages prefer `children` and named slots over configuration props. A frame owns structure and shared behavior; its consumer supplies content. Boolean flags that switch between unrelated layouts are not allowed; a second frame is.

`frontend-shells` applies this at two levels:

- **App shells:** root and sidebar shells with rail, header, footer and panel slots; the global panel. The app passes in navigation, account links and panel content.
- **Page frames:** generic regions inside a page, such as the auth page frame and the settings page and tab frames. A frame tied to one product workflow stays in its feature.

Reusable behaviors become frames too. For example, the resizable, lockable panel inside `GlobalPanelShell` can become a panel frame that other panels compose. The low-level `Resizable` primitive stays in `frontend-ui`, because `frontend-shells` depends on `frontend-ui` and never the reverse.

Current gap: `GlobalPanelShell` already takes `header`, `panel` and `children`. `SidebarShell` and `RootShell` hard-wire `RootSidebar`, `RootHeader`, `RootFooter` and `AccountLinks`; their extraction (M6) converts those to slots.

## 8. Calls made by Claude (owner to check)

| #   | Call                                                                               | Why                                                                                                                                       |
| --- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| C1  | `error-reports` is `frontend-error-reports`, not a feature or dev package.         | It ships to production, renders nothing and has no copy or workflow; it is a browser effect. The ownership map row is corrected to match. |
| C2  | Scenarios and sample content grow inside `dev-fixtures`.                           | ADR-0014 says to extend the existing package; no separate consumer set yet.                                                               |
| C3  | Page frames are assessed one by one; only generic ones move to `frontend-shells`.  | `profile-form-shell` and `home-shell` may be workflow-specific.                                                                           |
| C4  | Packages are created only when their first code moves in.                          | Workspace conventions reject empty skeletons. Boundary checks in 3.4 prove themselves with probe fixtures, not empty packages.            |
| C5  | No separate platform umbrella now.                                                 | Two occupants; it would repeat the frontend/server runtime split. Revisit when desktop or mobile need per-host adapters.                  |
| C6  | `server-account` receives settings persistence in M8 and profile operations in M9. | Follows the roadmap order; the package is created in M8.                                                                                  |

## 9. Left to later parts and the builder

- **3.2:** each package's entry points and `exports`, including the portable, presentation and server entries of mixed packages.
- **3.3:** folder conventions, applying section 7.
- **3.4:** the checking mechanism. Choosing a new dependency (for example dependency-cruiser) needs owner approval.
- **3.5:** scripts, Storybook discovery and test configuration per package.
- **M4 and later:** the base record contract's exact fields (preserving current shapes), module-by-module classification, and bridges.

## 10. Recording this design

On approval, 3.1 is completed by:

1. Adding the inventory (section 6, without the Inputs column) and the rules (sections 4, 5, 7) to [workspace-conventions.md](../../architecture/workspace-conventions.md).
2. Updating the ownership map: the error-reports row (C1) and the widened shells scope (D7).
3. Adding the preferences/settings distinction (D3) to `docs/glossary.md` as an implementation naming note, without changing product vocabulary.
4. Updating the umbrella README example lists to match the inventory.
