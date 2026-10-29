# Dashboard page and composition persistence (spec A, Slice 4)

**Status:** Accepted for implementation (2026-10-29) as **Slice 4** of the resource-view sequence (slice 1 contextual panel, slice 2 `ResourceFrame`, slice 3 read-only Document and Dashboard pages, slice 4 this spec). The owner authorized the whole specify, plan, implement and verify workflow on 2026-10-29, including the persisted table in [ADR-0016](../../architecture/decisions/0016-dashboard-composition-storage.md) and its working names. Section 8 lists what changed since the 2026-10-27 draft; read it first.
**Date:** 2026-10-27
**Splits:** [Dashboard and Widget MVP](2026-10-27-dashboard-widgets-mvp-design.md) (superseded). Its widget-data half is [spec B](2026-10-27-dashboard-widget-data-design.md).
**Evidence:** the [MVP review](2026-10-27-dashboard-widgets-mvp-review.md).
**Governing:**

- `PRODUCT.md` (Dashboards and Widgets; principles 16 and 17);
- `docs/glossary.md` (Dashboard and Widget are strong working terms; Task, Goal and Habit are Deferred);
- [ADR-0013](../../architecture/decisions/0013-document-and-dashboard-persistence.md) (the record and its routes);
- [ADR-0016](../../architecture/decisions/0016-dashboard-composition-storage.md) (composition storage, Proposed);
- [ADR-0014](../../architecture/decisions/0014-multi-app-package-boundaries.md) (placement);
- [ADR-0006](../../architecture/decisions/0006-authentication-with-supabase.md) (caller verification);
- the accepted [canvas design](2026-10-24-features-dashboards-canvas-design.md);
- the Dashboards track in [`non-goals.md`](../../product/non-goals.md).

## 1. Goal

A signed-in person opens one of their Dashboards, adds widgets that show what they already have, arranges them by pointer or keyboard, and finds the same arrangement on another browser. Saving is honest throughout.

This slice also answers one question from `mvp.md`: can a Dashboard present canonical information without becoming its owner?

## 2. Owner decisions (2026-10-27)

| Decision                | Choice                                                                                       | Recorded in                      |
| ----------------------- | -------------------------------------------------------------------------------------------- | -------------------------------- |
| D2: composition storage | A separate one-to-one table with a revision number (review option B2)                        | ADR-0016 (Proposed)              |
| D3: first widgets       | Read-only views of existing data: Pinned, Last opened, Spaces (review option C2)             | This spec, section 4.4           |
| Roadmap                 | Dashboards become a separate track. The accepted Quick Capture first slice is unchanged      | `non-goals.md`, Dashboards track |
| Removal                 | Removing a widget deletes the instance, with Undo. No hidden or archived status is persisted | This spec, section 4.5; ADR-0016 |

D1 (widget-owned data) is deliberately not taken here. It belongs to [spec B](2026-10-27-dashboard-widget-data-design.md).

## 3. What exists (corrected)

These statements correct the superseded spec's section 1, per the review's section 2. They describe `main` after #77.

| Layer               | State                                                                                                                                                                                                                                                                                                                   |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Record and creation | `public.dashboards` (ADR-0013) with `pinned_at` and `last_viewed_at`. Dashboards are created from Quick Create.                                                                                                                                                                                                         |
| Route               | `/[userId]/home/dashboards/[dashboardId]`. **Slice 3 built the page** in a `ResourceFrame` (header, contextual panel, `notFound()` for missing or not-owned records). The index cards, sidebar and palette link to it. The canvas is read-only and reads this browser's storage; nothing is saved.                      |
| Domain              | `dashboardCompositionSchema` has strict ids, layouts that reference widgets, integer placements, and every breakpoint present. It does **not** require each active widget to have a layout entry, and it has **no version field**.                                                                                      |
| Feature             | `features-dashboards`: canvas, `react-grid-layout` 2.3.0, widgets panel, toolbar, store, `save-scheduler`. Eight widget bodies; the package README still says seven. Stories run against **in-memory** storage; none uses the browser adapter. Slice 3 added a `readOnly` mode and `apps/web` now consumes the package. |
| Save failure        | `save-scheduler` retries once, then only logs to the console. The store has no save-status state.                                                                                                                                                                                                                       |
| Keyboard            | In edit mode, after selecting with Space, arrow keys move a widget and Shift+arrows resize it. There is no live region, no focus tests and no non-spatial alternative. This is **not** keyboard parity yet.                                                                                                             |
| Breakpoint          | Resolved once from `window.innerWidth`; afterwards it changes only through the toolbar.                                                                                                                                                                                                                                 |
| Reads to reuse      | `server-data`: `listRecordSummaries(client, kind)` (documents and dashboards, with `pinnedAt` and `lastViewedAt`), `listSpaceSummaries`, `recordSpaceView`.                                                                                                                                                             |

## 4. Design

### 4.1 Page

At the ADR-0013 route, already built read-only by slice 3. This slice makes it editable and server-backed. The page:

- verifies the caller (`requireOwner`) and loads the record (`getDashboard`, `notFound()` for missing or not-owned);
- loads the composition and its revision on the server (a failed read throws to the route's error page, which already exists), and the three query widgets' link items;
- records the view (sets `last_viewed_at`, as Spaces do with `recordSpaceView`: a client-triggered Server Action, throttled, whose failure is only logged);
- renders `DashboardWorkspace` with a server storage adapter whose `load` returns what the page already read;
- has loading (the existing route skeleton and workspace skeleton), empty ("Add a widget"), not-found, load-error and save-error states (section 8.2).

Development fixture mode has no session or database, so the same page uses the browser adapter there, editable. That keeps the fixture end-to-end suite able to exercise editing; it proves the interface, not the server path.

The nested route inside a Space (ADR-0013 item 9) is deferred.

### 4.2 Composition persistence

Per ADR-0016:

- `server-data` gains `dashboards/` with `loadComposition` and `saveComposition`. It stores and returns the document as `unknown` plus `schema_version` and `revision`; the app validates, so `server-data` takes no dependency on `domain-dashboards`;
- writes are conditional on `revision`. The first save inserts at revision 1; later saves update `where revision = :expected` and set `expected + 1`. A write that affects zero rows is never reported as saved: a follow-up read tells a changed revision (conflict) from a row the caller cannot see (failure);
- Server Actions validate with `dashboardCompositionSchema` (plus the widget allowlist and the active-only rule in 4.4), verify the caller (`getCallerIdentity`) and log failures with `logFailure` by code and status only;
- the `DashboardStorage` port's `saveComposition` now takes the base revision and returns an outcome (`saved` with the new revision, `conflict`, or `failed`), and `load` returns the revision. The ADR said the port keeps its shape; it gains exactly these two fields because conditional writes cannot be expressed without them. `saveRecords` is unused in this slice, because these widgets own no data.

The superseded design's `pagehide` flush through an async Server Action is dropped. Instead, unsaved changes raise a `beforeunload` prompt, and a tab that becomes hidden saves at once.

### 4.3 Save state

The workspace store gains a save status: **Saving**, **Saved**, **Not saved** (with Retry) and **Changed elsewhere** (with Reload). The status is shown in the toolbar and announced politely.

"Saved" appears only after the server confirms. A conflict never overwrites. Retries are manual after the first automatic one.

### 4.4 Widgets

Three **query widgets**, new members of the existing `Widget` union. Each has a typed `query` and no `source`; there is no registry. They read through `server-data` and own no data.

| Widget (working label) | Shows                                                                 | Query       |
| ---------------------- | --------------------------------------------------------------------- | ----------- |
| Pinned                 | The owner's pinned Spaces, documents and dashboards, newest pin first | `{ limit }` |
| Last opened            | Records by `last_viewed_at`, most recent first                        | `{ limit }` |
| Spaces                 | The owner's Spaces                                                    | `{ limit }` |

Notes on these widgets:

- **"Last opened" is not "Recent".** It shows what has a `last_viewed_at`: Spaces and Dashboards today. Documents have no page yet, so they don't appear. The widget says this rather than implying completeness.
- **They are query-shaped, not links.** They describe _what to select_ and never point at one specific record, so ADR-0013 item 8 (a widget surfacing one specific document needs a relationship record) doesn't apply.
- **Only these three types are offered.** The app's catalog offers only these three, and the Server Action refuses any other widget type in a saved composition. The eight prototype bodies stay in the package for stories and for spec B.
- **The source model grows slightly.** Adding query members extends it, which is flagged in `PRODUCT.md`'s open "source/input model" as a minimal, reversible step.

### 4.5 Editing and removal

- Add, move, resize and remove.
- Removing a widget deletes the instance from the composition and offers **Undo** until the next change or for a short time (a delegated value). Nothing is hidden or archived.
- Focus moves to the next widget, or to "Add a widget" when none remain.

### 4.6 Accessibility

This is part of the slice, not later polish (the bar in `first-slice.md`). The slice includes:

- keyboard move and resize, with a live-region announcement of the new position or size;
- a non-spatial alternative: "Move earlier" and "Move later" in the widgets panel;
- touch targets of at least the size the UI rules require;
- focus tests;
- axe-checked stories for every page state.

### 4.7 Breakpoints

The active breakpoint follows the canvas's container width, so resizing or rotating switches layouts. The toolbar preview stays.

## 5. Delivery

One vertical slice, usable on its own. The steps below give the build order; nothing ships between them.

1. Migration (unapplied draft), SQL regression script and regenerated types.
2. `server-data/dashboards`, the Server Actions and the adapter, with unit tests.
3. Page states, route links and view recording.
4. Save status, conditional writes and conflict handling.
5. The three query widgets and the allowlist.
6. Removal with Undo, accessibility and container-width breakpoints.

## 6. Verification

- **SQL:** ADR-0016's checks.
- **Unit:** actions, adapter, widgets and save-state transitions. That includes a zero-row update reported as a failure, and a stale revision reported as "changed elsewhere".
- **e2e:**
  - create a Dashboard, open it, see the empty state;
  - add Pinned, move it by keyboard (and hear the announcement), reload, and find it where it was;
  - a forced save failure shows "Not saved" and Retry;
  - two tabs: the stale tab gets "Changed elsewhere";
  - an index card opens the page.
- **Storybook:** axe on all page states.
- **Manual:** keyboard-only and a screen-reader pass.
- **Not covered without the hosted project:** real PostgREST and Supabase behavior.

## 7. Open and delegated

**For the owner:**

- the durable names in ADR-0016;
- the widget labels "Pinned", "Last opened" and "Spaces" (working labels).

**Delegated:**

- debounce timing, the Undo window and the size cap value;
- action and adapter structure;
- the `server-data/dashboards` layout;
- copy and live-region wording;
- the test layout.

**Out of scope:**

- widget-owned data and the Task, Agenda, Goal and Habit widgets (spec B);
- sharing, templates, real-time sync, history;
- the nested Space route;
- a widget registry or SDK.

## 8. Slice 4 reconciliation (2026-10-29)

What changed since the 2026-10-27 draft, and the details the draft left to implementation. Where this section and an earlier one differ, this section wins.

### 8.1 Scope

**In:** the migration (unapplied draft) with its SQL regression script and regenerated types; `server-data/dashboards`; the Server Actions and server adapter; editing on the existing page; save status with conflict handling; the three query widgets and their allowlist; removal with Undo; keyboard announcements and the Move earlier and Move later alternative; the active breakpoint following the canvas width; view recording.

**Out:** widget-owned data and the Task, Agenda, Goal and Habit widgets (spec B); sharing, templates, history, real-time sync; the nested Space route; renaming a dashboard or editing its description; a widget registry. Documents do not record views (they have a page since slice 3 but no recording), so "Last opened" lists the records that have a `last_viewed_at`: Spaces and Dashboards.

### 8.2 States

| State             | Behavior                                                                                                                                                                                      |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Loading           | The route skeleton while the page streams; `DashboardWorkspaceSkeleton` while the workspace reads from its adapter.                                                                           |
| Empty             | A dashboard with no widgets shows the empty state with an **Add a widget** button that enters edit mode and opens the palette.                                                                |
| Not found         | `notFound()` (404) for a missing, malformed or not-owned id, also from `generateMetadata`.                                                                                                    |
| Load error        | A failed composition read throws; the route's `error.tsx` offers a retry. A stored document that fails validation is a load error too, never silently replaced by an empty one.               |
| Saving / Saved    | Toolbar status. "Saved" appears only after the server confirms.                                                                                                                               |
| Not saved         | The save failed after the automatic retry. The status offers **Retry**; edits stay on screen and keep being saved on later changes.                                                           |
| Changed elsewhere | The server holds a newer revision. Nothing is overwritten. The status offers **Reload**, which re-reads the page; local edits that were not saved are discarded by it and the button says so. |
| Signed out        | A save that finds no session reports Not saved with the sign-in-again message; the person signs in and retries.                                                                               |

### 8.3 Interaction and focus

- **Edit layout** toggles edit mode as today. The widgets panel offers only Pinned, Last opened and Spaces, and its Hidden and Archived sections do not appear (no status is persisted).
- Adding a widget moves focus to the new widget's content group. Removing one shows **Undo** in the toolbar for 8 seconds or until the next change, and moves focus to the next widget in reading order, else to **Add a widget**. Undo restores the widget and its layouts at every breakpoint and returns focus to that widget.
- Keyboard: select with Space, arrows move, Shift+arrows resize, Escape deselects. Every move or resize is announced through one polite live region ("Pinned moved to column 2, row 1", "Pinned is now 2 wide, 3 tall"). The widgets panel lists active widgets with **Move earlier** and **Move later**, which reorder reading order and repack the current breakpoint, for people who cannot or do not want to use spatial moves.
- Save status is a polite live region; Retry and Reload are ordinary buttons in the toolbar. `beforeunload` is armed while anything is unsaved or saving.

### 8.4 Responsive behavior

The breakpoint follows the canvas's own width through the existing `useElementWidth`, in edit mode as well as read-only, so the contextual panel opening or the window narrowing switches layouts. Choosing a layout in the toolbar preview overrides this until the page is reloaded. The toolbar wraps below roughly 28rem; the panel beside the canvas is replaced by a stacked panel below the same width. No fixed pixel widths are added.

### 8.5 Data flow and permissions

Server Component → `getDashboard`, `loadComposition`, link items (RLS scopes every read to the session) → client `DashboardView` → server adapter (`load` returns the page's snapshot; `saveComposition` calls the `saveDashboardComposition` Server Action) → `server-data`. The action rejects anything the browser could forge: a non-UUID id, a composition that fails `dashboardCompositionSchema`, a widget type outside the allowlist, a non-active widget, a non-integer revision. Ownership is enforced by RLS on both `dashboards` and `dashboard_compositions`; the insert policy also requires the caller to own the Dashboard. The size cap (64 KB) is also checked in the action so the person gets a message, not a database error.

### 8.6 Compatibility

`public.dashboards` is unchanged. A Dashboard without a composition row loads as an empty composition at revision 0. Browser-stored compositions from earlier stories are not migrated to the server (they were never product data). Compositions saved earlier in this browser by slice 3 do not exist (slice 3 saved nothing). `schema_version` starts at 1; the reader refuses a version it does not know rather than guess.
