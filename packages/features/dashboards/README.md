# @synapcity/features-dashboards

Owns: the dashboard canvas, provisionally ([design](../../../docs/superpowers/specs/2026-10-24-features-dashboards-canvas-design.md)). The grid with a saved layout for each breakpoint, the widget frame and the widget types (eight prototype types and, since Slice 4, the Pinned, Last opened and Spaces link widgets), the breakpoint preview, the add-widget palette, the save status with Retry and Reload, removal with Undo, keyboard announcements and the Arrange list, and the store that runs every change through `domain-dashboards` and `domain-prototypes`. Dashboard browsing joins this package in M8.

**Provisional.** It renders the prototype's record kinds and its widget source model, neither of which is adopted. Promotion needs the widget source model first. Server storage of the composition exists as of Slice 4 ([spec](../../../docs/superpowers/specs/2026-10-27-dashboard-page-composition-design.md), [ADR-0016](../../../docs/architecture/decisions/0016-dashboard-composition-storage.md)); the host supplies the adapter.

Category rules: [features README](../README.md) and [ADR-0014](../../../docs/architecture/decisions/0014-multi-app-package-boundaries.md).

## Public interface

No root entry (workspace conventions, Entry points 3).

| Entry                                       | Runtime                  | Exports                                                                                                                                                                                         |
| ------------------------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@synapcity/features-dashboards/contracts`  | Portable types           | `DashboardStorage` (the port), `DashboardSnapshot`, `SaveOutcome`, `DashboardLinkItem`, `DashboardStorageError`                                                                                 |
| `@synapcity/features-dashboards/frontend`   | React, Client Components | `DashboardWorkspace` (provider with this package's layout), `DashboardWorkspaceProvider`, `DashboardEditorSurface`, `DashboardWidgetsDestination`, `LiveAnnouncer`, the browser storage adapter |
| `@synapcity/features-dashboards/styles.css` | CSS                      | React Grid Layout's stylesheet and the grid's skin                                                                                                                                              |

## Composing the parts

`DashboardWorkspace` is the provider plus this package's own layout (the palette in a column beside the canvas). A host that frames the dashboard itself, such as a resource view with a contextual panel, composes the parts:

- `DashboardWorkspaceProvider` owns the store's lifetime: the read (or the host's `snapshot`), the host's choices, the clock and the saves. It renders no layout. A new snapshot replaces the store without remounting the children, so what the host keeps in them survives; edit mode and the chosen layout carry over, selection, the undo offer and the save state start fresh, and saves for the abandoned store stop.
- `DashboardEditorSurface` is the canvas with its toolbar. `onOpenPalette` tells the host the palette is wanted (Edit layout turning editing on, Add a widget, the last widget removed); the host decides what showing it means, and the surface then hands focus to the palette's first button, for a bounded time, never into inert or hidden content.
- `DashboardWidgetsDestination` is the palette and Arrange list as content for a host's panel destination. While editing is off it explains and offers an Edit layout button; it never turns editing on by itself. It reads the store and holds no state.

Editing, layout, undo and save state belong to the store alone. A host's panel never writes to it, and the store knows nothing of the panel.

## What the host supplies

- **The owner and the dashboard.** `ownerId` and `dashboardId`; the host checks the caller owns the dashboard before rendering it.
- **The storage.** A `DashboardStorage`. `load` returns the composition and the revision it was read at; `saveComposition` takes the base revision and may answer `saved`, `conflict` or `failed`. The browser adapter keeps a validated copy per owner in `localStorage` and has no revisions; `apps/web` supplies a server adapter over Server Actions. A conflict stops further saves until the host reloads.
- **The host's choices.** `items` (the records the link widgets list, with their hrefs), `widgetTypes` (what the palette offers), `persistsStatus` (whether Hide and Archive exist; the server host turns them off, so removal deletes, with Undo), `LinkComponent` and `onReload`.
- **Save status and leaving.** `saveStatus` is `saved` only after the storage confirms. While anything is unsaved, `beforeunload` asks before the page closes; a hidden tab saves at once. There is no `pagehide` flush, because an async save cannot be trusted to finish after the page is gone.
- **The stylesheet.** The host imports `@synapcity/features-dashboards/styles.css` beside `@synapcity/frontend-ui/styles.css` and adds an `@source` line for this package.

## Rules

- `src/frontend/widgets/` imports only domain packages, `frontend-ui` and the display utilities: never `src/frontend/components/`, the store, `react-grid-layout` or `zustand`. Widgets take props, so they can move into their own package when a second surface renders them.
- `contracts/` imports only domain. No `next`, no app source.
- Colours come from the existing theme classes; the prototype's palette and Precision Canvas classes are not used.
- Tests and stories use `createPrototypeWorkspace` from `@synapcity/dev-fixtures/prototype-workspace` and the in-memory storage in `src/testing/`, so stories never touch saved dashboards.

## Scripts

`lint`, `check-types`, `test`, `test:coverage`. Tests run in jsdom; the stories run in `apps/storybook` (`pnpm test:storybook`), including the a11y checks.
