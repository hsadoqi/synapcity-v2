# Dashboard composition S1a and S1b Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **Status: approved by the owner on 2026-10-29, with decisions U1 to U6 as recommended (U5 provisionally). S1a is being implemented; S1b follows after S1a is integrated.**

**Goal:** Let the Dashboard page offer its Widgets palette as a destination of the existing contextual panel, with Edit layout opening it, while the Dashboard store keeps sole ownership of editing, layout, undo and save state.

**Architecture:** S1a splits `DashboardWorkspace` in `features-dashboards` into a provider that owns the store's lifetime and surface components that can sit anywhere beneath it, keeping `DashboardWorkspace` as a composition of those parts. S1b recomposes the page in `apps/web` as store provider, then `ResourceFrame`, then the editor surface, so a panel destination can render palette content that reads the store. Edit layout reaches the panel through one host callback, not through shared state or an effect.

**Tech Stack:** React 19, zustand 5 (store per provider), `react-resizable-panels` (inside `ContextualPanelShell`), Vitest and Testing Library, Storybook with axe, Playwright (fixture group).

**Spec:** [Dashboard page and composition persistence](../specs/2026-10-27-dashboard-page-composition-design.md) (slice 4, implemented), [ADR-0011](../../architecture/decisions/0011-resizable-global-panel-shell.md) (contextual panel amendment), [ADR-0014](../../architecture/decisions/0014-multi-app-package-boundaries.md), [ADR-0016](../../architecture/decisions/0016-dashboard-composition-storage.md).

## How this plan was derived

The Phase A investigation report is not in this repository or in any saved session transcript, so its definitions of S1a, S1b, S2 and S3 could not be read. S1a and S1b are defined here from the owner's decisions of 2026-10-29. If Phase A split the work differently, the task boundaries below move, but the contracts, the ownership rules and the unresolved decisions do not. S2 and S3 are not defined here; section 6 records only what this plan hands to them.

## Global Constraints

- `ResourceFrame`, `ResourceHeader` and `ContextualPanelShell` (with `useContextualPanel`) in `packages/frontend/shells` are kept as they are. No new shared resource abstraction, no change to their props or behaviour in S1a or S1b.
- Three owners, never merged: the panel shell and its controls own visibility, active destination, resizing, collapsing and narrow presentation; the Dashboard store owns edit mode, widget configuration, layout operations, undo and redo, and save state; the palette presents operations and owns no Dashboard state.
- No state mirrored between panel and store, and no effect whose job is to make one follow the other.
- The Dashboard store, its undo for removal, keyboard moves and announcements, save scheduling, conditional writes and conflict handling are preserved as they are. Existing store tests are not edited to pass.
- `features-dashboards` must not depend on `frontend-shells` (no feature package does today; `pnpm boundaries` enforces the matrix). The app wires the two.
- Colours, spacing and radius come from tokens; `cn()` for classes; no `style={{}}` for static values; no `!important` (AGENTS.md design rules).
- Persisted schemas, Server Actions, `server-data`, `domain-dashboards` and the widget allowlist are unchanged.
- Breakpoint and device-frame behaviour is not changed in S1a or S1b (section 6).
- No dependency is added or upgraded.
- Commit only when the owner asks. Commit messages and pull request text contain no closing keyword next to an issue number.

## Review Focus

Behaviours the spec implies and no existing test pins, most likely to bite first:

1. Closing or switching the panel destination while editing keeps edit mode, selection, unsaved changes and save state. (Task 5 test.)
2. Reload after a conflict replaces the store but leaves the panel open at its width and destination. (Task 2 and Task 5 tests.)
3. A narrow container expands the panel over the whole area and makes the main region inert: announcements and save status must still reach assistive technology, and an added widget must not be a silent change. (Task 3 and Task 6.)
4. Removing the last widget while the panel is collapsed still returns focus somewhere visible. (Task 3 test.)
5. The first render in server mode shows the frame and rail with no swap to a skeleton frame and back. (Task 2 test.)

## 1. What exists (verified in this worktree, 2026-10-29)

| Fact                                                                                                                                                                                                                                                               | Where                                                                                              |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `DashboardView` renders `ResourceFrame` (scroll off) with `RESOURCE_PANEL` (one empty "Context" destination) around `DashboardWorkspace`.                                                                                                                          | `apps/web/src/features/dashboards/components/dashboard-view/dashboard-view.tsx`                    |
| `DashboardWorkspace` loads the snapshot, shows a skeleton or error, then mounts `DashboardConfigProvider`, `DashboardStoreProvider` (keyed `dashboardId:requestId`), `ClockProvider` and `WorkspaceLayout`.                                                        | `packages/features/dashboards/src/frontend/components/dashboard-workspace/dashboard-workspace.tsx` |
| `WorkspaceLayout` holds the live region, save status, Undo, **Edit layout**, the breakpoint toolbar, the canvas, and, when `editMode`, an inline `<aside aria-label="Widgets">` with `WidgetsPanel`.                                                               | same file                                                                                          |
| `editMode` and `toggleEditMode` live in the store; the toggle clears selection. `breakpointLocked` is set only by `chooseBreakpoint`.                                                                                                                              | `store/dashboard-store.ts`                                                                         |
| `ContextualPanelShell` keeps visited destination contents mounted, hides the others, and offers `useContextualPanel()` (`open`, `collapse`, `activeId`, `expanded`) only to descendants of the shell. With no destinations it renders its children alone.          | `packages/frontend/shells/src/components/contextual-panel/contextual-panel.tsx`                    |
| In a container narrower than 560 px the expanded panel takes the whole area and the main region becomes `inert`.                                                                                                                                                   | same file, `SIDE_BY_SIDE_PX`                                                                       |
| `focusPalette()` runs one animation frame after the call; the panel region is `inert` until its 200 ms glide reports it expanded.                                                                                                                                  | `utils/focus/focus.ts`, `GLIDE_MS`                                                                 |
| `DocumentView` uses the same frame and `RESOURCE_PANEL`.                                                                                                                                                                                                           | `apps/web/src/features/documents/components/document-view/document-view.tsx`                       |
| Dashboard behaviour is covered by `dashboard-workspace.test.tsx` (22 cases), the store and provider tests, and the fixture e2e groups `dashboard-edit.e2e.ts`, `dashboard-persistence.e2e.ts` and `resource-views.e2e.ts`. `apps/web` has no `DashboardView` test. |                                                                                                    |

### The structural problem

The panel's destinations are props of `ResourceFrame`, so they are built in `DashboardView`, above `DashboardWorkspace`. The store provider is below it. Palette content passed as a destination would therefore render outside the store and throw. The panel's controls are the reverse: they exist only below the shell, where the store provider is, so a callback that opens the panel must be created below the frame.

## 2. Provider and store lifetime (decision)

Chosen shape, **L1**:

```
DashboardWorkspaceProvider   (features-dashboards: load, config, clock, tooltip, store, saves)
  ResourceFrame              (frontend-shells, unchanged; destinations = [Widgets, Context])
    ContextualPanelShell     (inside ResourceFrame, unchanged; owns panel state)
      DashboardEditorSurface (features-dashboards: toolbar, canvas, live region; takes onOpenPalette)
      ... panel: DashboardWidgetsDestination content (reads the store)
```

Rules:

1. The provider owns one store per loaded snapshot. It creates the store from the snapshot, connects saves, and exposes it by context.
2. **The store is replaced, the tree is not remounted.** Today a new snapshot re-keys the provider and remounts everything beneath it. With the frame beneath the provider that would reset the panel on every Reload. The provider instead holds the current store in state, derived from the snapshot identity during render, and the connect effect depends on the store. Descendants stay mounted and read the new store through context.
3. In server mode the page already holds the snapshot, so the provider accepts `snapshot` and skips the asynchronous read. The frame and rail then render on the first paint. Browser (fixture) mode keeps the asynchronous read and renders `fallback` while it runs; the fallback is a frame with the header and a skeleton and no destinations, so the swap on first load is allowed there and nowhere else.
4. A failed read renders `failureFallback`, never a store. Saves are never connected without a loaded snapshot (current rule, kept).
5. Selection-dependent and previous-value hooks that live in the surface (`useFocusAfterWidgetChanges`) reset their memory when the store is replaced, so a Reload is not mistaken for widgets being added or removed.
6. After a Reload the new store starts with `editMode` carried over from the old one (decision U4), selection cleared, breakpoint following the canvas.

The panel shell is never given Dashboard state and the store is never given panel state. The only thing that crosses is the callback in section 3.

## 3. Integration contracts

```ts
// features-dashboards, ./frontend (new exports)
export function DashboardWorkspaceProvider(props: {
  dashboardId: string;
  ownerId: string;
  storage: DashboardStorage;
  snapshot?: DashboardSnapshot; // when given, no asynchronous read
  fallback?: ReactNode;
  failureFallback?: ReactNode;
  now?: () => number;
  breakpoint?: Breakpoint;
  items?: readonly DashboardLinkItem[];
  widgetTypes?: readonly WidgetType[];
  persistsStatus?: boolean;
  LinkComponent?: DashboardLinkComponent;
  onReload?: () => void;
  children: ReactNode;
}): JSX.Element;

export function DashboardEditorSurface(props: {
  /** Called when the person starts editing or needs the palette. The host decides what showing it means. */
  onOpenPalette?: () => void;
}): JSX.Element; // live region, toolbar, canvas; no inline aside

export function DashboardWidgetsDestination(): JSX.Element;
// Palette and arrange list while editing; otherwise a short explanation with an Edit layout button.
```

`DashboardWorkspace` keeps its current props and becomes `Provider` plus `Surface` plus the inline aside, so stories, the read-only path and its 22 tests are unchanged.

Behaviour of `onOpenPalette`, called by the surface and by nothing else:

| Trigger                                                         | Store effect (owner: store) | Callback                                           |
| --------------------------------------------------------------- | --------------------------- | -------------------------------------------------- |
| Edit layout pressed while not editing                           | `toggleEditMode()`          | called once, after the toggle                      |
| Edit layout pressed while editing                               | `toggleEditMode()`          | not called; the panel is left as it is             |
| Add a widget in the empty state                                 | enters edit mode            | called once                                        |
| Last widget removed (focus would go to the palette)             | none                        | called once, then focus goes to the palette        |
| Panel closed, collapsed, resized, or another destination chosen | none                        | not involved; the panel never calls into the store |

App side (S1b), the only place both owners are known:

```ts
function DashboardBody() {            // rendered inside ResourceFrame
  const panel = useContextualPanel(); // non-null: destinations exist
  return <DashboardEditorSurface onOpenPalette={() => panel?.open('widgets')} />;
}
```

`open('widgets')` expands a collapsed panel and activates the destination, or just activates it when already expanded. It never toggles and never collapses, so Edit layout can only reveal the palette. Focus: the shell focuses its region; the surface then moves focus to the first palette button using `focusPalette`, which in S1a looks once per frame for at most 400 ms (the 200 ms glide plus its timer and margin), never focuses inert or hidden content, and ends on success, on a key or pointer press, when replaced by a newer handoff, when cancelled, when editing ends, or when the surface unmounts.

Palette presentation contract: `DashboardWidgetsDestination` reads `useDashboardStore` and calls store actions only (`addWidget`, `moveWidgetInOrder`, `toggleEditMode` from its hint button). It holds no editing state and takes no props that duplicate store state. Its hint button is a second route into the same store action, not a second state.

Live regions: `LiveAnnouncer` and the save status stay outside the region the narrow layout makes `inert`. S1b places them in a wrapper beside the frame (under the provider, outside the shell), so they are announced when the panel covers the canvas. This is why the surface is split into toolbar, canvas and announcer parts (Task 3).

## 4. S1a: provider lifetime and surface split (`features-dashboards`, no visible change)

Files, all under `packages/features/dashboards/src/frontend/` unless noted:

| File                                                                                      | Change                                                                                                                                |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `components/dashboard-workspace/dashboard-workspace.tsx`                                  | Split into `DashboardWorkspaceProvider` and a thin `DashboardWorkspace`; `WorkspaceLayout` stays exported with its current behaviour. |
| `components/dashboard-workspace/dashboard-workspace-provider.tsx` (new)                   | Loading, config, clock, tooltip, store replacement, saves.                                                                            |
| `components/dashboard-editor-surface/` (new folder: component, stories, test, `index.ts`) | Live region, toolbar, canvas, focus-after-change hook; `onOpenPalette`.                                                               |
| `components/dashboard-widgets-destination/` (new folder)                                  | Palette content for a panel destination.                                                                                              |
| `store/dashboard-store-provider.tsx`                                                      | Accept a store replaced by the parent without remounting children; keep `onStore` connection semantics.                               |
| `utils/focus/focus.ts`                                                                    | `focusPalette` retries up to 300 ms until the palette is focusable.                                                                   |
| `index.ts`                                                                                | Export the three new components.                                                                                                      |
| `README.md` of the package                                                                | Document the three parts and the callback.                                                                                            |

### Task 1: Retrying palette focus

**Files:** Modify `utils/focus/focus.ts`; test `utils/focus/focus.test.ts` (extend or create beside the existing util tests).

**Interfaces:** Produces `focusPalette(root?: ParentNode): void` with unchanged signature.

- [ ] **Step 1: Write the failing tests** `focuses the palette once an inert ancestor becomes active` (fake timers: palette inside an `inert` element, remove `inert` at 120 ms, expect focus on the first button) and `gives up after 300 ms without throwing`.
- [ ] **Step 2: Run** `pnpm --filter @synapcity/features-dashboards exec vitest run src/frontend/utils/focus` and see both fail.
- [ ] **Step 3: Implement** the retry with `requestAnimationFrame` and an elapsed-time cap; a successful focus ends it; a newer call cancels an older one.
- [ ] **Step 4: Run** the same command and see it pass.
- [ ] **Step 5: Commit** only when the owner asks.

### Task 2: `DashboardWorkspaceProvider` with store replacement

**Files:** Create `dashboard-workspace-provider.tsx`; modify `dashboard-workspace.tsx`, `dashboard-store-provider.tsx`; test `dashboard-workspace-provider.test.tsx`; the existing `dashboard-workspace.test.tsx` and `dashboard-store-provider.test.tsx` must pass unmodified.

**Interfaces:** Produces `DashboardWorkspaceProvider` (section 3). Consumes `createDashboardStore`, `connectSaves`, `DashboardConfigProvider`, `ClockProvider`.

- [ ] **Step 1: Write the failing tests** in `dashboard-workspace-provider.test.tsx`:
  - `renders children on the first render when given a snapshot` (no fallback frame, no extra render of the fallback);
  - `renders the fallback until storage.load resolves when given no snapshot`;
  - `renders the failure fallback and never connects saves when the read fails`;
  - `keeps mounted children mounted when the snapshot is replaced` (a child with local state and a mount counter; the store seen through context is a new instance with the new composition);
  - `carries edit mode over to the replacement store and clears selection`;
  - `reconnects saves to the replacement store with the new base revision and disconnects the old one` (spy on `storage.saveComposition`: a change after replacement is saved with the new revision, a change on the old store is not saved).
- [ ] **Step 2: Run** `pnpm --filter @synapcity/features-dashboards exec vitest run src/frontend/components/dashboard-workspace` and see the new tests fail.
- [ ] **Step 3: Implement** `DashboardWorkspaceProvider`: move the load state machine out of `DashboardWorkspace` unchanged; add the `snapshot` short-circuit; derive the store from `(dashboardId, snapshot identity)` during render and keep it in state; run `connectSaves` in an effect that depends on the store and returns its disconnect. `DashboardWorkspace` becomes `Provider` then `WorkspaceLayout` or `ReadOnlyLayout`, preserving every current prop.
- [ ] **Step 4: Run** the whole package suite `pnpm --filter @synapcity/features-dashboards test` and see it pass with no existing test edited.
- [ ] **Step 5: Commit** only when the owner asks.

### Task 3: `DashboardEditorSurface` and `DashboardWidgetsDestination`

**Files:** Create the two component folders (component, stories, test, `index.ts` each, as `package-structure` conventions require); modify `dashboard-workspace.tsx` (`WorkspaceLayout` composed from the surface plus the inline aside) and `index.ts`.

**Interfaces:** Produces `DashboardEditorSurface`, `DashboardWidgetsDestination` (section 3); consumes Task 1 and Task 2.

- [ ] **Step 1: Write the failing tests** (Testing Library, inside `DashboardWorkspaceProvider`):
  - surface: `calls onOpenPalette once when Edit layout turns editing on, and not when it turns it off`; `calls onOpenPalette once from Add a widget in the empty state`; `calls onOpenPalette before moving focus to the palette after the last widget is removed`; `does not render an inline Widgets aside`; `a replaced store does not move focus as if widgets were added`;
  - destination: `lists the palette and arrange controls while editing and the explanation otherwise`; `its Edit layout button turns editing on through the store and calls nothing else`; `adding a widget updates the store and nothing in the destination holds its own copy` (rerender with a new store shows new state with no stale list);
  - stories: surface (editing off, editing on, empty, narrow container) and destination (editing on, off), each passing axe in Storybook.
- [ ] **Step 2: Run** `pnpm --filter @synapcity/features-dashboards exec vitest run src/frontend/components` and see them fail.
- [ ] **Step 3: Implement** `DashboardEditorSurface` (extract from `WorkspaceLayout`: announcer, status row, canvas, `useFocusAfterWidgetChanges` that resets on store replacement) and `DashboardWidgetsDestination` (wraps `WidgetsPanel`, keeps `data-slot="widget-palette"` and the labelled "Add to dashboard" region). `WorkspaceLayout` renders surface plus its existing aside so the 22 existing cases keep passing.
- [ ] **Step 4: Run** `pnpm --filter @synapcity/features-dashboards test`, `pnpm --filter @synapcity/features-dashboards check-types` and `pnpm --filter @synapcity/features-dashboards lint`, all passing.
- [ ] **Step 5: Commit** only when the owner asks.

S1a acceptance: package tests, types and lint pass; `pnpm deps` and `pnpm boundaries` pass; the running app is visually and behaviourally unchanged because `apps/web` still uses `DashboardWorkspace`.

## 5. S1b: page recomposition (`apps/web`)

Files:

| File                                                                                                    | Change                                                                                          |
| ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `apps/web/src/features/dashboards/components/dashboard-view/dashboard-view.tsx`                         | Provider, then frame, then body; destinations from the new module below.                        |
| `apps/web/src/features/dashboards/components/dashboard-panel/` (new: `dashboard-panel.tsx`, `index.ts`) | `DASHBOARD_PANEL_IDS` and `dashboardPanelDestinations(context)` returning Widgets then Context. |
| `apps/web/src/components/resource-panel/`                                                               | Unchanged; Documents keep it. The Context destination content is reused, not copied.            |
| `apps/web/e2e/dashboard-edit.e2e.ts`, `resource-views.e2e.ts`                                           | Update locators only where the palette moved into the panel; add the cases below.               |
| `apps/web/src/features/dashboards/components/dashboard-view/dashboard-view.test.tsx` (new)              | Page-level composition test.                                                                    |
| `packages/frontend/shells/README.md`, `packages/features/dashboards/README.md`, ADR-0011 amendment      | Record the composition (documentation only).                                                    |

Widgets destination: id `widgets`, label "Widgets", a `lucide-react` icon, first in the rail; Context stays second so its e2e locator is unchanged. Destinations are a stable array (rail never changes with edit mode).

### Task 4: Recompose `DashboardView`

**Interfaces:** Consumes `DashboardWorkspaceProvider`, `DashboardEditorSurface`, `DashboardWidgetsDestination`, `ResourceFrame`, `ResourceHeader`, `useContextualPanel`. Produces `dashboardPanelDestinations(): readonly ContextualPanelDestination[]` and the unchanged `DashboardView` props.

- [ ] **Step 1: Write the failing tests** in `dashboard-view.test.tsx` (jsdom, fixture snapshot, `persistence="server"` with a stub action):
  - `renders the heading, the rail with Widgets and Context, and the canvas on the first render`;
  - `Edit layout expands the panel on Widgets and shows the palette`;
  - `Edit layout while the panel shows Context switches to Widgets`;
  - `Edit layout while editing leaves a collapsed panel collapsed`;
  - `closing the panel while editing keeps edit mode, selection, unsaved status and layout`;
  - `choosing Context while editing keeps edit mode; choosing Widgets again shows the same palette state`;
  - `Reload after a conflict keeps the panel open on its destination and replaces the composition`.
- [ ] **Step 2: Run** `pnpm --filter web exec vitest run src/features/dashboards` and see them fail.
- [ ] **Step 3: Implement** `DashboardView` as `DashboardWorkspaceProvider` (snapshot given in server mode, `fallback` frame in browser mode), then a wrapper holding the live region and save status outside the shell, then `ResourceFrame` with `destinations`, then `DashboardBody` calling `useContextualPanel()`. Header stays `ResourceHeader` with title and icon only: the Edit layout button stays in the surface toolbar because the header sits outside the shell and cannot reach the panel controls.
- [ ] **Step 4: Run** `pnpm --filter web test` and see the whole web suite pass (baseline: 811 at the last recorded run; the count will rise by the new cases).
- [ ] **Step 5: Commit** only when the owner asks.

### Task 5: Fixture e2e: ownership boundaries and regressions

**Files:** `apps/web/e2e/dashboard-edit.e2e.ts`, `apps/web/e2e/resource-views.e2e.ts`.

- [ ] **Step 1: Update** the empty-state test: after Add a widget, the palette region is inside the contextual panel and its first button has focus within 300 ms of the panel opening.
- [ ] **Step 2: Add** `Edit layout opens the Widgets panel; closing it keeps editing` (Edit layout, add Pinned, collapse the panel, the "Edit layout" button still reports pressed, the widget is still there, status unchanged, reopen from the rail shows the palette).
- [ ] **Step 3: Add** `switching to Context and back keeps an unsaved change and the selected widget`.
- [ ] **Step 4: Add** `Reload after a conflict keeps the panel` for the persistence group only if that group can run locally (it needs the opt-in variables); otherwise state it as not run.
- [ ] **Step 5: Run** `E2E_WEB_MODE=dev SYNAPCITY_DEV_AUTH=fixture pnpm --filter web exec playwright test global-panel.e2e resource-views.e2e dashboard-edit.e2e` and see it pass.

### Task 6: Responsive and accessibility verification

- [ ] **Step 1: Add e2e `at 414 px an opened Widgets panel covers the canvas, the canvas is not reachable, and collapsing returns to it with the added widget present`**, plus a check that the polite status region is still in the accessibility tree while the canvas is inert.
- [ ] **Step 2: Add Storybook stories** for the composed page at 1440, 900 and 414 px (editing on and off, panel open and collapsed), all passing axe: `pnpm test:storybook`.
- [ ] **Step 3: Manual** keyboard-only pass: Edit layout, Enter on a palette button, Tab to the grid cell, Space and arrows, Escape, rail arrows, collapse button, and focus return to the rail button when the panel closes with focus inside. Screen-reader pass is recorded as not verified unless run.

### S1b acceptance criteria

- **Accessible interactions:** Edit layout keeps `aria-pressed`; the rail buttons keep `aria-pressed` and `aria-controls`; opening the panel by Edit layout moves focus to the first palette button; closing the panel with focus inside returns focus to the rail button (existing shell behaviour, covered by its tests); the live region announces add, move, resize, remove and save outcomes at every width; touch targets keep their current sizes.
- **Responsive:** at 1440 and 900 px the canvas and an open panel sit side by side, and the canvas lays out for its own width (the layout rule itself is S2); at 414 px the open panel takes the whole area, the canvas is inert and the status stays announced, and collapsing restores the canvas with its state; no horizontal page scroll at 414 px.
- **Preserved:** undo for removal, keyboard moves and announcements, save status and Retry, conflict and Reload, `beforeunload`, the three-widget allowlist, view recording.

## 6. Hand-offs recorded for later plans (not changed here)

**For the S2 plan: canvas width, breakpoint and preview.**

Verified cause of the tablet-style frame at about 930 px: `DashboardCanvas` defaults `deviceFrame` to true and only `ReadOnlyLayout` turns it off; `WorkspaceLayout`, the layout `apps/web` actually uses, never does. The frame draws whenever the breakpoint is not desktop and the canvas is wider than the device frame plus 80 px: for tablet that is 834 + 80 = 914, and the tablet breakpoint runs from 640 to 1023 px. So any canvas between 915 and 1023 px is framed with no preview chosen, including the case where the contextual panel narrows a wider window. The frame is not tied to `breakpointLocked`, the store's only record that a person picked a layout. It is therefore an unintended consequence of the breakpoint model, not intentional preview behaviour.

Required behaviour for S2, stated as four separate things:

| Concept                                | Source                                                                       | Owner                                                           |
| -------------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Actual available container width       | measured from the canvas container                                           | the canvas (`useElementWidth`)                                  |
| Layout breakpoint for normal rendering | `resolveBreakpoint(containerWidth)`                                          | store `breakpoint`, set by the width effect while not locked    |
| Explicit breakpoint preview            | the person's toolbar choice (`chooseBreakpoint`, `breakpointLocked`)         | store                                                           |
| Device-frame presentation              | drawn only while a preview is locked and only when the container can hold it | canvas, derived from `breakpointLocked`, never from width alone |

Normal rendering fills the actual container and shows no frame and no frame caption. A preview is visibly labelled as a preview and has a way to leave it (today the lock lasts until reload). Also for S2: whether "Reload" and navigation clear the lock, and the container widths the 640 and 1024 thresholds should apply to now that the panel and rail take room. S1a and S1b do not touch `DashboardCanvas`, `DEVICE_FRAME_WIDTH` or `resolveBreakpoint`.

**For S3:** the interfaces S3 may rely on once S1a is merged are `DashboardWorkspaceProvider`, `DashboardEditorSurface`, `DashboardWidgetsDestination` and the `onOpenPalette` contract. Widget data ownership (spec B, decision D3 deferred) is untouched; widgets stay query-backed.

**For the Document plan (kept separate; not started):** D1 and D2 are approved. Its design must cover one-to-one ownership and referential integrity to the Document record; row-level security and authenticated access; Lexical JSON validation and a schema version; revision-conditional writes; conflict detection and recovery; initialising missing content; save confirmation and failure; deletion and content cleanup; compatibility with existing Document metadata and timestamps (does saving content touch `updated_at` or `last_viewed_at`). It follows ADR-0016's pattern where applicable and needs its own ADR proposal and owner approval for the persisted schema. Document code in `packages/features/documents` shares no file with S1a or S1b except the `DocumentView` use of `RESOURCE_PANEL`, which this plan leaves alone.

## 7. Decisions (approved 2026-10-29)

U1 to U4 and U6 approved as recommended. U5 (labels Widgets and Context) approved provisionally. U2 adds: do not focus newly added content while its region is inert. U3 adds: verify that consumers unsubscribe from the replaced store and that no asynchronous result of the old store reaches the new one. U4 adds: Reload discards the conflicting local draft only after the person's explicit Reload.

Original table:

| ID  | Question                                                                                                                                                                                          | Recommendation                                                                                       | Why it matters                                                                                                                            |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| U1  | The Widgets rail destination is always present. When editing is off, should choosing it show an explanation with an Edit layout button, enter edit mode, or be hidden?                            | Show the explanation; do not enter edit mode from the rail.                                          | Entering edit mode from a rail click would make the panel a second owner of editing. Hiding changes the rail while the person works.      |
| U2  | At narrow widths, adding a widget from an open panel hides the result under the panel and the canvas is inert. Collapse the panel after adding, keep it open and announce, or add a Done control? | Keep it open and announce the addition; the panel's collapse button returns to the canvas.           | Focus-after-add targets an inert element at narrow widths and is lost. Collapsing automatically would be the palette acting on the panel. |
| U3  | Provider lifetime L1 (store replaced, tree kept) versus remounting on Reload (simpler, resets the panel).                                                                                         | L1, as specified in section 2.                                                                       | Remounting loses panel destination and width on every Reload.                                                                             |
| U4  | Does Reload keep edit mode on?                                                                                                                                                                    | Keep it on; clear selection and unsaved local changes as today.                                      | Reload already discards unsaved edits; dropping edit mode as well is a second, silent reset.                                              |
| U5  | The destination order and labels ("Widgets", "Context"), and the icon, are product naming.                                                                                                        | Working labels only; owner confirms before they are treated as settled (`docs/glossary.md` process). | Identifiers in e2e and stories depend on them.                                                                                            |
| U6  | Phase A numbering (S1a, S1b, S2, S3) could not be read.                                                                                                                                           | Owner confirms or corrects the split in section "How this plan was derived".                         | Task boundaries and the S2 and S3 hand-offs depend on it.                                                                                 |

## 8. Verification commands

Per task, as written above. Before any completion claim, from the repository root, in this order:

`pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm deps`, `pnpm boundaries`, `pnpm test`, `pnpm test:storybook`, `pnpm build`, then the fixture e2e group: `E2E_WEB_MODE=dev SYNAPCITY_DEV_AUTH=fixture pnpm --filter web exec playwright test global-panel.e2e resource-views.e2e dashboard-edit.e2e`, and `pnpm test:e2e` for the production group. `pnpm verify` runs the non-fixture checks in one pass.

Not covered even then: real Supabase and PostgREST behaviour, screen-reader output, touch input on a device, dark mode, the 915 to 1023 px framing (S2), and the persistence e2e group unless its opt-in variables are set. The report must say which of these ran.

## 9. Self-review

- Spec coverage: three ownership boundaries (sections 2, 3, Global Constraints); Edit layout coordination (section 3 table, Tasks 4 and 5); no discard on close or switch (Task 4 and 5 tests); no duplicate state or sync effects (section 3, palette contract); breakpoint and frame distinction recorded for S2 (section 6); document persistence list recorded separately (section 6); existing foundations not recreated (`ResourceFrame`, panel, store, saves reused unchanged).
- Types are consistent: `onOpenPalette`, `DashboardWorkspaceProvider`, `DashboardEditorSurface`, `DashboardWidgetsDestination`, `dashboardPanelDestinations`, panel id `widgets`.
- Gaps carried as decisions: U1 to U6.

## 10. Dependency map (2026-10-29)

```
S1a  provider + surface split (features-dashboards) ──► S1b  page recomposition (apps/web) ──┬─► S2  breakpoint and canvas width (after S1a merges)
                                                                                           └─► S3  (consumes the S1a interfaces; after S1a merges)

Document persistence (D1, D2): ADR proposal ─► schema ─► packages/features/documents ─► editor     independent of S1a, S1b, S2, S3
#111 request-level loading performance                                                            independent; coordinate only real file conflicts
#101 shell visual verification: baseline now ─► repeat affected scenarios after S1b merges
```

| Workstream           | Can start now                | Waits for                        | Shared files to coordinate                                                           |
| -------------------- | ---------------------------- | -------------------------------- | ------------------------------------------------------------------------------------ |
| S1a                  | yes, after plan approval     | nothing                          | `dashboard-workspace.tsx` (S2 touches the canvas, not this file)                     |
| S1b                  | no                           | S1a merged                       | `dashboard-view.tsx`; `#111` may touch the Dashboard page loader (check at the time) |
| S2                   | planning now; code after S1a | S1a interfaces                   | `dashboard-canvas.tsx`, `breakpoint-toolbar.tsx`, `dashboard-workspace.tsx`          |
| S3                   | planning now; code after S1a | S1a interfaces                   | defined by its own plan                                                              |
| Document persistence | yes (ADR proposal first)     | owner approval of the schema ADR | none with S1; `document-view.tsx` only when the editor replaces the read-only body   |
| #111                 | yes                          | nothing                          | `page.tsx` loaders for Document and Dashboard if it changes them                     |
| #101 baseline        | yes                          | nothing                          | none (verification only); repeat after S1b                                           |
