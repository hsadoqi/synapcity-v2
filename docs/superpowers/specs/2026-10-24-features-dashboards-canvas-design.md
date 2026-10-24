# Dashboard canvas in `features-dashboards` (provisional)

**Status:** Accepted (owner decision, 2026-10-24), including `react-grid-layout` 2.3.0. Owner decisions are recorded in section 6. Not yet built.
**Date:** 2026-10-24
**Branch:** `feat/features-dashboards`, from `main` at `375ce3db` (#60).
**Governing decisions:** [ADR-0014](../../architecture/decisions/0014-multi-app-package-boundaries.md) (categories and matrix), [ADR-0013](../../architecture/decisions/0013-document-and-dashboard-persistence.md) (the dashboard record and its routes; widget and layout storage, which this design decides for the browser only), [ADR-0002](../../architecture/decisions/0002-styling-foundation.md) and [ADR-0003](../../architecture/decisions/0003-typography-roles-and-font-preferences.md) (styling and fonts), ADR-0004 (`cn()`), the [workspace conventions](../../architecture/workspace-conventions.md) (inventory, entry points, organization) and the `features-spaces` README (the feature package template: a port the host fills, host-supplied paths and actions).
**Source:** the responsive-grid prototype at `synapcity-responsive-grid/apps/web/src/features` (evidence, not authority).

## 1. Intent

The prototype's dashboard logic now lives in `domain-grids`, `domain-prototypes` and `domain-dashboards` (#60), but nothing renders it, and the dashboards list links each dashboard to a page that does not exist yet. This work brings the prototype's dashboard canvas onto those packages and opens it at that page: the grid, the widget frame and the seven widget types, a layout saved for each breakpoint, the breakpoint preview and the add-widget palette, saved so a dashboard looks the same when its owner comes back.

It stays provisional in the way `domain-prototypes` is: it renders prototype record kinds and the prototype's widget source model, neither of which is adopted.

## 2. Goals, non-goals, anti-goals

**Goals**:

1. A new `@synapcity/features-dashboards` package whose canvas renders a `DashboardComposition` with its `PrototypeRecords`: drag and resize in edit mode, collapse, rename, highlight, duplicate, hide, archive, remove, add and restore widgets, and preview the desktop, tablet and mobile layouts.
2. **Saved layouts per breakpoint, and everything else on the canvas, persist** (owner decision, 2026-10-24). Each breakpoint keeps its own saved layout, as in the prototype, and a reload or a later visit shows the dashboard as it was left.
3. Saving goes through a storage port the host fills. This work ships a browser adapter; a server adapter can replace it later without changing the canvas (owner decision, 2026-10-24).
4. The canvas opens at `/[userId]/home/dashboards/[dashboardId]`, owner-only like the other pages, and in Storybook (owner decision, 2026-10-24).
5. Every change goes through the pure functions in `domain-dashboards` and `domain-prototypes`; the feature holds no layout or record rules of its own.
6. The display pieces the domain packages left out live here: widget type labels and icons, weekday letters and names, `relativeTime`, and the device preview widths.
7. Each component has a story and a test, the stories run in `apps/storybook` with the axe checks, and the package passes `pnpm boundaries`.

**Non-goals**:

- Server storage of compositions and widget records. It follows as its own change with an ADR-0013 amendment (new columns or tables need owner approval there); the port in section 4.3 is shaped for it.
- Syncing across devices or across tabs. Browser storage is per device; two tabs on one dashboard save last-write-wins.
- Moving dashboard browsing into the package. The app-local list stays where it is and moves in M8 as the inventory says.
- The nested route inside a Space (`/spaces/[spaceId]/dashboards/[dashboardId]`, ADR-0013 item 9). It can reuse the same host component later.
- The prototype's other panels and features (section 8).

**Anti-goals** (it would be a failure even if it worked)

- Losing a saved dashboard silently. Saved data that fails validation is set aside, never overwritten (section 4.3).
- One owner's saved dashboards showing for another account on the same browser.
- Choosing state management for the product. `zustand` here is scoped to this feature's canvas (section 4.2) and settles nothing elsewhere.
- Copying the prototype's palette classes (`bg-accent-500`, `bg-neutral-800`) or the Precision Canvas utilities (`bg-shell`, `text-ui-xs`). The design system rules forbid the first, and the second exist only if `frontend-tokens` is adopted.
- A widget registry or a plug-in system for widget types. The ownership map adopts none.
- Treating this as canonical. Promotion out of provisional needs the widget source model and server storage first.

## 3. Constraints

- **Dependencies.** Two new third-party dependencies for `features-dashboards`:
  - `react-grid-layout` 2.3.0, the latest stable release (registry, published 2026-10-05; React >= 16.3 peer). React Grid Layout is the founder-confirmed layout direction (`PRODUCT.md`, `docs/product/scope.md`), and 2.3.0 is the version the prototype runs. Needs owner approval (AGENTS.md section 5).
  - `zustand` 5.0.16, the latest stable release (registry, published 2026-10-22; React >= 18 peer) and the version the prototype runs, for the canvas state (section 4.2), used with the owner's go-ahead where it is warranted.
  - `radix-ui` from the prototype is not brought in: `frontend-ui` is on Base UI.
- **Components.** Every shadcn component the canvas needs is installed in `frontend-ui` except the checkbox the task list uses. It is added with `pnpm ui:add checkbox` (Base UI, already a dependency) and moved into its own folder with a story and a test, as the design system rules require.
- **Matrix.** A feature package may depend on domain and frontend packages. This one depends on `domain-dashboards`, `domain-grids`, `domain-prototypes`, `frontend-ui`, `lucide-react`, `react-grid-layout`, `zustand` and `zod`; `dev-fixtures` is a dev dependency for stories and tests only.
- **Styling.** Existing semantic classes only (`bg-background`, `bg-card`, `text-muted-foreground`, `border-border`, `bg-primary`), shadcn variants before `className`, `cn()` for merging, the spacing scale, no bracket values, no static `style={{}}`. The device frame's width is the one dynamic value, set from `DEVICE_FRAME_WIDTH`, not a literal.
- **Grid stylesheet.** React Grid Layout needs its own CSS and a small skin (placeholder, resize handle, drag shadow). The package exports it as `./styles.css`, written with the existing theme variables. `apps/web`'s `globals.css` imports it beside `@synapcity/frontend-ui/styles.css` (an import line, which the app wiring rules allow), and Storybook's preview imports it.
- **Rendering.** Saved data lives in the browser, so the canvas loads on the client: the page renders on the server with the dashboard's name and a skeleton, and the canvas replaces the skeleton once its saved state is read. No Server Component reads the store.
- **Time.** Widgets that depend on the current time (habit, schedule, feed) take `now` from a hook that ticks, so stories can fix it.

## 4. Design

### 4.1 Package

`packages/features/dashboards`, named `@synapcity/features-dashboards`, with two entries, following `features-spaces`:

- `./contracts` (portable types): `DashboardStorage`, the port, and `DashboardSnapshot`.
- `./frontend` (React, Client Components): `DashboardWorkspace`, `DashboardWorkspaceSkeleton`, `browserDashboardStorage`, and the stories' building blocks.

There is no `./server` entry until the server adapter arrives. The package README marks it provisional and lists what it does not decide. The inventory row for `features-dashboards` gains a note that the canvas arrived early and browsing still arrives in M8.

`domain-dashboards` gains `dashboardCompositionSchema` (Zod), the runtime contract for a saved composition: settings within their allowed values, widgets of the seven types with their `source` or `query`, and a layout per breakpoint. Saved records are already covered by `prototypeRecordSchemas` in `domain-prototypes`.

### 4.2 State

One `zustand` store per `DashboardWorkspace` holds `{ composition, records, breakpoint, editMode }` and its actions. It follows the pattern the zustand Next.js guide recommends: a factory, `createDashboardStore(initial)`, built with `createStore` from `zustand/vanilla`; a provider that creates the store once with `useState` and passes it through React context; and a `useDashboardStore(selector)` hook over `useStore`. The store is never module-level, so two canvases (or two stories) never share state.

Why a store and not `useReducer` with context: the grid, each widget body, the shell and the panel read different slices, and with context every consumer re-renders on every change. A task toggle or a live-data tick should re-render one widget, not the canvas, and selectors give that. One store holding both the composition and the records also makes adding a widget (its record and its view) a single update, which the prototype needed a cross-store command for.

Each action calls one domain function (`addWidget`, `updateWidget`, `applyLayoutChange`, `toggleTask`, `toggleHabitDay` and so on) with a `RecordContext` built from the owner's id and the current time. `breakpoint` and `editMode` are view state and are not saved; `breakpoint` starts at the viewport's own breakpoint (`resolveBreakpoint`), and the toolbar changes which saved layout is shown and edited.

### 4.3 Storage

`DashboardStorage` (in `./contracts`) is asynchronous so a server adapter fits it unchanged:

- `load(dashboardId)` returns the dashboard's saved composition and the owner's records, or `null` for either when nothing is saved yet.
- `saveComposition(dashboardId, composition)` and `saveRecords(records)`.

Records are the owner's, shared by all of their dashboards (a widget is a view of a record; two dashboards can show the same one); the composition is per dashboard. That matches the prototype and `domain-dashboards`' rule that a duplicate is a second view, not a fork.

`browserDashboardStorage({ ownerId, onError })` (in `./frontend`) is the adapter this work ships:

- **Keys** carry the owner and a version: `synapcity.dashboard.<ownerId>.<dashboardId>.v1` and `synapcity.records.<ownerId>.v1`, so accounts sharing a browser never see each other's data.
- **Loads validate.** A saved value is parsed with `dashboardCompositionSchema` or `prototypeRecordSchemas`. A value that fails is copied to the same key with `.invalid` appended and treated as not saved; the original is never overwritten silently, and `onError` reports it.
- **Writes are safe.** The prototype's wrapper is kept: storage that throws (quota, private mode, blocked) never throws into React, and `onError` reports it so the host can show a toast.
- **Saves are batched.** The workspace saves 400 ms after the last change, and immediately on `pagehide` and when the tab is hidden, so a fast drag does not write on every frame and closing the tab does not lose the last change.

First visit (nothing saved): an empty composition (`createComposition()`) and empty records, so the canvas opens on its empty state and the palette. This holds in fixture mode too: `dev-fixtures` is a dev dependency of `apps/web`, and shipped code does not import it, so the prototype's sample dashboard (`createPrototypeWorkspace`) appears only in Storybook and tests.

### 4.4 Components (one folder each, with a story, a test and an `index.ts`)

The canvas pieces live in `src/frontend/components/`. The widget frame and bodies live in `src/frontend/widgets/` and import only domain packages, `frontend-ui` and the display utilities, never the canvas, the grid or the store; they take a widget, its record and callbacks as props. That keeps them movable into their own package (for example `frontend-widgets`) as soon as a second surface, such as Home or a Document's sidebar, renders widgets (owner decision, 2026-10-24: widgets stay here for now, with that option kept open). A small connector in `components/` binds each widget to the store.

| Component                     | From the prototype                                    | Notes                                                                                                                                                                                                                              |
| ----------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DashboardWorkspace`          | `dashboard-workspace.tsx`, the stores, `bootstrap.ts` | Loads through the storage port, then provides the store; header row (edit toggle, breakpoint toolbar) and the canvas beside the widgets panel; saves on change                                                                     |
| `DashboardWorkspaceSkeleton`  | the loading screen                                    | The installed `Skeleton` in the canvas's shape, shown by the server-rendered page until the saved state is read                                                                                                                    |
| `DashboardCanvas`             | `dashboard-canvas.tsx`                                | Desktop fills it; tablet and mobile render in a frame at the device width when there is room, labelled "Tablet · 834px"                                                                                                            |
| `DashboardGrid`               | `dashboard-grid.tsx`, `dashboard-grid.css`            | React Grid Layout, controlled by `gridLayoutFor`; reported layouts go back through `applyLayoutChange` for the shown breakpoint only, unless `layoutsEqual`; drag and resize only in edit mode; interactive children cancel a drag |
| `BreakpointToolbar`           | `breakpoint-toolbar.tsx`                              | The installed `ToggleGroup` with desktop, tablet and mobile items and tooltips                                                                                                                                                     |
| `WidgetShell` (in `widgets/`) | `widget-shell.tsx`                                    | Title (rename in place), collapse, a settings popover with highlight, duplicate, hide, archive and remove; highlight uses semantic colours (`bg-primary`, `bg-muted-foreground`)                                                   |
| Widget bodies (in `widgets/`) | `widgets/*.tsx`                                       | `StatBody`, `ProgressBody`, `HabitBody`, `TasksBody`, `NotesBody`, `CalendarBody`, `FeedBody`, plus `WidgetUnavailable` (source record missing) and `WidgetEmpty`; a `WidgetBody` switch on `widget.type`                          |
| `WidgetsPanel`                | `context-panel/panels/widgets-panel.tsx`              | "Add to dashboard" palette (label and icon per type) and the hidden and archived lists with restore and, for archived, remove behind the installed `AlertDialog`                                                                   |
| `DashboardEmptyState`         | `dashboard-empty-state.tsx`                           | The installed `Empty` component, pointing at the palette                                                                                                                                                                           |

### 4.5 Display utilities (`src/frontend/utils/`, each with a test)

- `WIDGET_CATALOG`: type, label and Lucide icon for each widget type, in the prototype's order (Stat card, Task list, Recent activity, Schedule, Notes, Habit tracker, Goal tracker). This is palette copy, not a registry.
- `WEEKDAY_INITIAL`, `WEEKDAY_SHORT`, `WEEKDAY_NAME`: Monday first, matching `domain-prototypes`' calendar.
- `relativeTime(fromIso, now)`: "Just now", "1 min ago", "12 min ago", "3 hr ago", "2 d ago", as in the prototype, taking the ISO string the records store.
- `DEVICE_FRAME_WIDTH`: `lg` none, `md` 834, `sm` 390.

### 4.6 Host (`apps/web`)

- **Page** `src/app/[userId]/home/dashboards/[dashboardId]/page.tsx` (Server Component): `requireOwner(userId)`, reads the dashboard record, `notFound()` when there is none, sets the breadcrumbs (Dashboards › name) and renders the client host with the skeleton as its fallback. `loading.tsx` and `error.tsx` match the list page's.
- **Record read.** A single-dashboard read beside the existing `getDashboards` in `src/features/dashboards/server` (Supabase under row-level security; `DASHBOARD_FIXTURES` in fixture mode). It stays app-local and moves with browsing in M8.
- **Client host** `src/features/dashboards/components/dashboard-canvas-host` (`'use client'`): creates `browserDashboardStorage({ ownerId, onError })` once, reports storage errors through the existing toast, and renders `DashboardWorkspace`.
- **Stylesheet.** `globals.css` gains the `@synapcity/features-dashboards/styles.css` import and an `@source` line for the package.

### 4.7 Storybook

`apps/storybook/.storybook/main.ts` adds `packages/features/dashboards/src/**/*.stories.@(ts|tsx)` and its preview imports the stylesheet. Stories use an in-memory `DashboardStorage` from `src/testing/`, so they never touch the viewer's real saved dashboards. Stories: the seeded workspace in view and edit mode, each breakpoint, an empty dashboard, each widget body (with data, missing source, empty), the panel with hidden and archived widgets, and live data through `simulateTick`.

### 4.8 Tests and verification

- Unit: the display utilities, the store's actions, `dashboardCompositionSchema`, and the browser adapter against a fake `localStorage` (round trip, owner-scoped keys, invalid data set aside and reported, throwing storage reported, batched saves and the flush on `pagehide`).
- Component tests in jsdom for each component (rename commits on Enter and cancels on Escape, collapse, settings actions, restore, a habit day toggles, a task toggles and records activity, a saved layout is shown again after a reload of the workspace).
- Host: the page's `notFound()` and owner check, as the Space page tests do.
- E2E: one Playwright test in fixture mode that adds widgets from the palette, changes the layout at one breakpoint, reloads, and finds it saved, with the other breakpoints untouched.
- React Grid Layout's drag and resize are not exercised in jsdom; the e2e test moves a widget with the pointer, and the rest is checked by hand in Storybook and reported as such. `pnpm verify` runs as usual.

## 5. Order of work

Two pull requests:

1. **The package**: scaffold and stylesheet, `dashboardCompositionSchema`, display utilities, store, storage port and browser adapter, widgets, shell, grid and canvas, panel, workspace, Storybook wiring, README and inventory note.
2. **The route**: the record read, the client host, the page with its loading and error states, the stylesheet import, and the e2e test.

## 6. Owner decisions

Recorded 2026-10-24:

- Widgets stay in `features-dashboards` for now, kept movable into their own package (section 4.4). The widget contract already has a public home in `domain-dashboards`; a separate UI package waits for a second surface that renders widgets.
- `zustand` is used where it is warranted and matches current guidance (section 4.2).
- Existing theme colours only; the prototype's look waits on the `frontend-tokens` merge.
- Dashboards persist, with saved layouts per breakpoint. Storage is the browser for now, behind a port, with a server adapter to follow (section 4.3). This decides widget and layout storage for the browser; server storage is still an ADR-0013 amendment.
- The canvas is usable at `/[userId]/home/dashboards/[dashboardId]` and in Storybook.
- Functionality beyond the canvas waits; section 8 takes stock of it for a later decision.

Approved 2026-10-24: this design as a whole, and `react-grid-layout` 2.3.0 as a dependency of `features-dashboards`.

## 7. Calls made by Claude (owner to check)

- A per-workspace `zustand` store rather than `useReducer`, for per-widget re-renders and one update when a widget and its record are added.
- Records are saved per owner and shared by all of their dashboards; compositions are saved per dashboard.
- Saved data that fails validation is copied aside under an `.invalid` key and the canvas starts fresh, rather than refusing to open.
- Saves are batched 400 ms after the last change and flushed when the tab is hidden or closed.
- A first visit opens an empty dashboard in every mode, fixture mode included, because shipped code does not import `dev-fixtures`; the sample dashboard is for Storybook and tests.
- The breakpoint starts at the viewport's own and is not saved.
- Browser data stays on the device after sign-out, keyed by owner. Clearing it on sign-out or account deletion is a follow-up worth deciding with the server adapter.
- `relativeTime` takes an ISO string because `domain-prototypes` stores ISO timestamps; the prototype took epoch milliseconds.

## 8. The rest of the prototype: what exists and what to do with it

Taken stock for a later decision; none of it is in this work. "Keep" means bring it over largely as it is when its time comes; "rework" means the idea is right but the implementation needs changing; "replace" means something in the repo or roadmap already covers it.

| Prototype piece                                                              | What it does                                                                                           | Recommendation                                                                                                                                                                                                                                        |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dashboards panel (`dashboards-panel.tsx`, `dashboards-store.ts`)             | Create, rename, duplicate, delete and switch between dashboards held in the browser                    | **Replace.** The dashboards collection (moving to this package in M8 on `frontend-collection`) and the ADR-0013 Dashboard record cover browsing and the record; `duplicateComposition` in `domain-dashboards` already covers copying the composition  |
| Browser persistence (`persistence.ts`, `persist` middleware, `bootstrap.ts`) | localStorage with a safe wrapper, rehydrate-then-seed on first load, a loading screen until rehydrated | **Brought over, reworked** (section 4.3): the safe wrapper and quota reporting stay; storage sits behind a port so a server adapter can replace it; saved data is validated on load instead of trusted                                                |
| Cross-store commands (`commands.ts`)                                         | Adds a widget's record and view in order                                                               | **Replaced** by the single store in section 4.2                                                                                                                                                                                                       |
| Context sidebar shell (`context-sidebar.tsx`)                                | A tabbed, resizable side panel with a hand-written pointer and keyboard resize handle                  | **Replace** the hand-written handle with the installed `resizable` component (`react-resizable-panels`, added by ADR-0011 for the global panel); keep the panel-switching idea                                                                        |
| Links panel                                                                  | Named web links as records                                                                             | **Rework later.** The URL normalising rule is already in `domain-prototypes`. Links overlap the product's connection and addressability concepts, which are not settled, so they should wait for that decision rather than ship as a prototype record |
| Assets panel (vision board) and `downscale-image.ts`                         | Images in fixed slots, downscaled in the browser to WebP data URLs stored in the record                | **Rework.** Keep the downscaling and the raster-only rule; replace data URLs in records with object storage (Supabase Storage is the obvious candidate) when assets are adopted, because data URLs bloat every read of the records                    |
| Notes panel (workspace scratch note)                                         | One always-present note in the sidebar                                                                 | **Replace** with the product's interruption-safe capture and Documents when they arrive; a second notes system would compete with them                                                                                                                |
| Export (`export-dashboard.ts`, `download.ts`)                                | Downloads a dashboard and the records its widgets use as a self-contained JSON file                    | **Keep, and add import.** The format is sound; an import that validates with `prototypeRecordSchemas` (and later the adopted contracts) would make it a round trip, like the Settings import                                                          |
| Presenting mode                                                              | Full-screen preview with an exit button and Escape                                                     | **Keep** as a small follow-up; it is cheap and useful for checking a layout. Use the installed `Dialog` or the Fullscreen API rather than a fixed-position overlay                                                                                    |
| Header buttons marked unavailable (tags, share)                              | Placeholders                                                                                           | **Drop** until wanted. Tags already exist on the base record; sharing is not designed                                                                                                                                                                 |
| Simulated live data (`use-simulated-live-data.ts`)                           | Random ticks on seeded metrics and goals                                                               | **Keep in dev only.** It already lives in `dev-fixtures` (`simulateTick`); real live data needs the widget source model                                                                                                                               |

Further suggestions, not in the prototype:

- **Keyboard layout editing.** React Grid Layout's drag and resize are pointer-only. Move and resize actions in the widget settings menu (move up, down, left, right; wider, narrower; taller, shorter), built on `domain-grids`, would make layout editing accessible. This is the most important gap.
- **Undo** after remove, archive and hide, through the installed toast, instead of a confirmation dialog for everything but permanent removal.
- **Editing record values.** The prototype edits tasks, notes and habit days, but a stat's value or a goal's target can only be changed by the simulation. A small edit form per record-backed widget would close that.
- **Per-widget settings** (feed length, schedule range) are already in the widget shape as `query`; the settings menu could expose them.
