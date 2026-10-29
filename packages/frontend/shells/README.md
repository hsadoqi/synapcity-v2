# @synapcity/frontend-shells

Owns: the composable frames around product content, at two levels. **App shells:** the root shell with its header, footer, content region, sidebar shell, global panel and contextual panel, the context switcher and the search form. **Page frames:** generic regions inside a page, such as the centred auth and message-page frames, the resource frame (one resource's bounded view with its header and contextual panel) and the breadcrumb trail bridge (a page renders `SetBreadcrumbs`; the shell's header, which sits above the page, shows what it said) and the header's breadcrumb list. A shell owns structure and shared behavior (layout, responsive regions, collapsing, resizing, focus, landmarks); the host supplies the content through `children` and named slots. Nothing here knows what a Space, Document or Dashboard means, and a visual auth frame does not sign anyone in.

Runtime: browser and server rendering, framework-neutral at the root entry. Links and navigation come from the host; `next` is imported only under `src/next/`. Category rules: [frontend README](../README.md) and [ADR-0014](../../../docs/architecture/decisions/0014-multi-app-package-boundaries.md). Panel behavior: [ADR-0011](../../../docs/architecture/decisions/0011-resizable-global-panel-shell.md).

**Status:** created 2026-10-25 by Task 1 of the [frontend-shells plan](../../../docs/superpowers/plans/2026-10-25-frontend-shells.md). Task 2 moved the app shell family in unchanged from `frontend-ui/src/blocks`; later tasks convert it to slots and move the page frames from `apps/web/src/components`.

## Public interface

| Entry                             | Exports                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@synapcity/frontend-shells`      | `RootShell`, `AuthenticatedShell`, `PublicShell`, `RootHeader`, `RootFooter`, `RootContent`, `GlobalPanelShell`, `GlobalPanelToggle`, `ContextualPanelShell`, `useContextualPanel`, `ResourceFrame`, `ResourceHeader`, `SidebarShell`, `ContextSwitcher`, `SearchForm`, `BreadcrumbRootShell` and `SetBreadcrumbs` (the page-to-header trail bridge) with `activeContext`, `AuthPageShell`, `MessagePage`, `CommandPalette`, and the `RootBreadcrumb` and `ContextualPanelDestination` types |
| `@synapcity/frontend-shells/next` | The Next.js binding for the shells' links and navigation, mounted once by a host (none yet)                                                                                                                                                                                                                                                                                                                                                                                                  |

## Not here

- The `ui` sidebar primitive (`components/ui/sidebar`) and other primitives: `frontend-ui`. This package depends on `frontend-ui`, never the reverse.
- Settings page and tab frames: `features-settings`, until a second consumer appears.
- Content wrappers tied to one feature (auth card, profile form, home, entity, widget): their features.
- Saved panel or sidebar preferences: the preference owner. A shell keeps only session-local interaction state.

## Rules

- One folder per component under `src/components/` (and `src/next/` for the binding), each with `name.tsx`, `name.stories.tsx`, `name.test.tsx` and `index.ts`. `src/package-structure.test.ts` enforces it.
- No server code, no `server-only`, no app source, no `domain-*`, `server-*` or `features-*` imports.
- Colours, spacing and type come from the theme tokens in `frontend/tailwind-config`; no hardcoded values.

## Scripts

`lint`, `check-types`, `test`, `test:coverage`. Stories run in `apps/storybook` (`pnpm test:storybook`), including the a11y checks.
