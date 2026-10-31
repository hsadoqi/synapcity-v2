# Dashboard S2: First-open and responsive polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Status:** Plan and decisions D1, D2 (option D2-1), D3 (option a) and D4 approved by the owner on 2026-10-29; D2-1 was decided after Task 1's measurements. Implemented and integrated in pull request #125: S2a, S2b (regression tests only), S2c and S2d. No starter layout was built.

**Goal:** Make the Dashboard feel right the first time it opens, at every width and in both themes, without changing what is saved, how it is saved, or how it is edited.

**Architecture:** Three concerns that are tangled today are separated and given one owner each. The layout breakpoint follows the width of the canvas. A preview lock is an explicit choice by the person. A device frame is a presentation of a locked preview only. Everything else (first-open content, card polish) is built on the existing store, tokens and storage contracts and adds no persisted behavior.

**Tech Stack:** `@synapcity/features-dashboards` (React, Zustand store), `@synapcity/domain-grids` (breakpoints), `apps/web` (Next.js, fixture mode), Tailwind v4 tokens, Vitest, Storybook, Playwright (fixture mode).

**Spec:** [PRODUCT.md](../../../PRODUCT.md) and [ADR-0014](../../architecture/decisions/0014-multi-app-package-boundaries.md) for boundaries; [the S1a/S1b plan](2026-10-29-dashboard-composition-s1a-s1b.md) for the composition S2 builds on (section 6 records this hand-off). The S1 plan's S2 note (breakpoint versus device frame) is expanded in section 3 here.

## How this plan was derived

Read from `origin/main` at `9fa6ba34` (S1b merged, #120), 2026-10-29. Every file path below was opened in this worktree. Two things are **inferred from code, not observed in a browser**, and Task 1 measures them before anything is changed: the exact surface widths at a 1280px window, and the second unintended frame at 471–639px. Nothing was run, built, or screenshotted for this plan.

## Global Constraints

- Planning only until the owner approves. No new persisted behavior; no change to `public.dashboards`, `server-data`, Server Actions, migrations, or the database (AGENTS.md section 5).
- No new dependency. No new package. No change to `ResourceFrame`, `ResourceHeader`, `ContextualPanelShell`.
- Colour only through semantic tokens (`bg-background`, `text-muted-foreground`, `border-border`); no palette colour, no hand-written `dark:` colour, no bracket values, no `style={{}}` for static values, no `!important` (AGENTS.md design system rules). The one existing dynamic `style` (the frame's `maxWidth`) stays the only one.
- Changes to a shadcn component go through a variant, not `className` colour or typography.
- Working labels in this plan ("layout breakpoint", "preview lock", "device frame", "starter layout") are not names. No schema, route, table, identifier, or exported name is derived from them (`docs/glossary.md` naming process). Task names for exports are proposals to confirm at implementation.
- Visual changes follow the repository's visual-review rule: the workspace layout is a provisional baseline; fix identified defects, show before and after for each, and do not restyle unasked.
- Each task: failing test first, minimal change, `pnpm format:check`, `pnpm lint`, `pnpm typecheck` for the touched workspaces, then commit. Coverage runs once at a time in a worktree (`docs/engineering/quality-gates.md`).

## Review Focus

1. **Locked preview wider than its frame, then the window narrows.** Expected: the frame disappears (canvas is the device); the lock stays; switching back is one click.
2. **Panel opens or closes while a preview is locked.** Expected: no layout jump of the saved data; only presentation changes; focus unchanged.
3. **A natural md/sm layout (not locked) at a width where the frame would fit.** Expected: no frame, ever. This is the 915–1023px and 471–639px bug.
4. **Populated fixture dashboard, then Reload after a conflict.** Expected: the store is replaced (S1a contract); seeded content is not written back unless the person edited.
5. **Dark theme on every widget type at lg, md and sm.** Expected: no clipped title, no unreadable text, no overflow; the page never scrolls sideways.

---

## 1. What exists (read in this worktree)

| Concern                      | Where                                                                            | Behavior today                                                                                                                                                           |
| ---------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Layout breakpoint thresholds | `packages/domain/grids/src/utils/breakpoints/breakpoints.ts`                     | `resolveBreakpoint(w)`: `<640` sm, `<1024` md, else lg. `columnsFor`: lg = `columns` (3), md = `columns - 1`, sm = 1.                                                    |
| What is measured             | `dashboard-editor-surface.tsx`                                                   | `useElementWidth` on the surface root (canvas plus any `beside`), then `setBreakpoint(resolveBreakpoint(width))`. Ignored while `breakpointLocked`.                      |
| Preview lock                 | `dashboard-store.ts`                                                             | `chooseBreakpoint(bp)` sets `breakpoint` and `breakpointLocked: true`; stays until reload. `BreakpointToolbar` calls it. `breakpointLocked` is also a store init option. |
| Device frame                 | `dashboard-canvas.tsx`, `utils/device-frame`                                     | Frame width: md 834, sm 390. `framed = deviceFrame && frameWidth !== null && canvasWidth > frameWidth + 80`. **Does not read `breakpointLocked`.**                       |
| First open                   | `DashboardView`, `get-composition.ts`, `browser-dashboard-storage.ts`            | No stored composition reads as `createComposition()`: zero widgets, so `DashboardEmptyState`. Fixture mode always starts empty (browser storage).                        |
| Widget card                  | `widgets/widget-shell/widget-shell.tsx`                                          | Title (`text-base font-semibold`, truncated), highlight bar, radius from `settings.cardRadius`, toolbar, settings popover.                                               |
| Save and conflicts           | `storage/save-scheduler`, `serverDashboardStorage`, `DashboardWorkspaceProvider` | Debounced save with revision; a stale revision reports a conflict; Reload calls `router.refresh()` and the provider replaces the store without remounting the frame.     |
| Undo                         | `undo-remove`, store `removed`                                                   | Undo of the last removal only. **There is no redo and no general undo stack**; this plan does not add one.                                                               |
| Keyboard                     | `store/keyboard-move.ts`, `live-announcer`, `use-focus-after-widget-changes`     | Arrow-key move and resize of the selected widget, Move earlier/later, announcements, focus handoff.                                                                      |

## 2. The defects, derived

**D-a. The unintended tablet frame at 915–1023px.** `resolveBreakpoint` calls anything under 1024 tablet. The canvas frames tablet whenever `width > 834 + 80 = 914`. So a canvas of 915–1023px, which the person never previewed, is drawn as a narrow 834px device inside a wider canvas. By the same arithmetic the mobile frame (390 + 80 = 470) appears unlocked at **471–639px**. Both come from one cause: the frame ignores `breakpointLocked`.

**D-b. Single column around 1280px.** The surface is measured, not the window. S1b's task-scope entry already records this as a known effect (observed in the browser by the S1b work): since the Widgets palette became a panel destination, with the panel open at about 1280px the canvas is under 640px and resolves to sm, one column. Before S1b the inline palette column sat inside the measured width, so it did not happen. The exact widths are still to be measured (Task 1). This may be correct (the canvas really is that narrow) or a product problem (opening a panel silently rewrites the layout). The widths are not known from code; Task 1 measures them. The existing e2e `follows the container width` (`dashboard-edit.e2e.ts`) records container-based resolution as intended behavior, so the plan treats it as the baseline and asks the owner before changing it (D2).

**D-c. First open is an empty page.** Every fixture dashboard opens to "No widgets yet". Nothing shows what a dashboard looks like, so first-open polish cannot be judged, and responsive defects in populated cards cannot be reproduced in fixture mode.

**D-d. Card polish is unaudited.** No matrix of widget type by breakpoint by theme exists.

## 3. Decision: three separate concepts

| Concept           | Owner                                 | Rule                                                                                                                                                           |
| ----------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Layout breakpoint | The editor surface                    | Follows measured width. This is what saved layouts are keyed by.                                                                                               |
| Preview lock      | The store (`breakpointLocked`)        | Set only by `chooseBreakpoint`. Never inferred from width.                                                                                                     |
| Device frame      | `DashboardCanvas` (presentation only) | Drawn only when **locked**, the locked breakpoint has a frame width, and the canvas is wider than frame width plus chrome. Otherwise the canvas is the device. |

Consequences: an unlocked md or sm canvas is never framed (fixes D-a for both widths); a locked preview with no room is not framed either (as today); the lock, not the frame, decides which saved layout is edited. No store field is added: `DashboardCanvas` reads the existing `breakpointLocked`.

## 4. Slices

Order is by dependency. S2a and S2c can run in parallel after Task 1. S2d is gated.

### S2a. Frame follows the preview lock (`features-dashboards`, visible fix)

#### Task 1: Measure and pin current behavior (no source change)

**Files:**

- Create: `docs/superpowers/plans/2026-10-29-dashboard-s2-measurements.md` (a table; committed with S2a, not now)
- Test: none yet

- [ ] **Step 1:** In fixture mode (`E2E_WEB_MODE=dev SYNAPCITY_DEV_AUTH=fixture`, one server, one worker), open `/fixture-user/home/dashboards/fixture-dashboard-reading-progress` at window widths 1440, 1280, 1100, 1024, 960, 800, 640, 600, 480, 390, each with the panel closed and with Widgets open.
- [ ] **Step 2:** Viewport width and Dashboard canvas width are different quantities and are never conflated: the breakpoint follows the canvas (`DashboardCanvas`'s own element, read with `useElementWidth`), not `window.innerWidth`. Record in the measurements file: window width, surface width (devtools), canvas width, active breakpoint (`aria-pressed` toolbar button), framed yes/no, columns. Mark each cell **measured**.
- [ ] **Step 3:** Confirm D-a at 915–1023 and the inferred mobile case at 471–639; record the window width at which a 1280px window's surface crosses 640. This number settles D2.
- [ ] **Step 4:** Report the table, with a recommendation for D2, to the owner. Tasks 2 and 3 do not wait for it; Task 4 does.

#### Task 2: Frame only for a locked preview

**Files:**

- Modify: `packages/features/dashboards/src/frontend/components/dashboard-canvas/dashboard-canvas.tsx`
- Test: `.../dashboard-canvas/dashboard-canvas.test.tsx` (exists), `.../dashboard-canvas.stories.tsx`

**Interfaces:**

- Consumes: `useDashboardStore((s) => s.breakpointLocked)`, `DEVICE_FRAME_WIDTH`, the canvas's own measured width.
- Produces: no new export. `DashboardCanvas({ deviceFrame })` keeps its prop and default.

- [ ] **Step 1: Failing tests** in the existing canvas test, using that file's width stub. Names and assertions:
  - (In these tests the width is the canvas element's, not the window's.) `does not frame an unlocked tablet canvas that is wider than the frame`: store `{breakpoint:'md', breakpointLocked:false}`, width 960, no `Tablet · 834px` text.
  - `does not frame an unlocked mobile canvas that is wider than the frame`: `breakpoint:'sm'`, unlocked, width 500, no `Mobile · 390px` text.
  - `frames a locked tablet preview when there is room`: locked, width 1100, text `Tablet · 834px` present.
  - `does not frame a locked preview without room`: locked md at width 900, no frame text.
  - `never frames when deviceFrame is false`: locked md at 1100.
- [ ] **Step 2:** Run `pnpm --filter @synapcity/features-dashboards exec vitest run dashboard-canvas`. Expected: the two unlocked cases FAIL.
- [ ] **Step 3:** Implement: `framed = deviceFrame && breakpointLocked && frameWidth !== null && width !== null && width > frameWidth + FRAME_CHROME`. Update the doc comment to the section 3 rule.
- [ ] **Step 4:** Re-run; expected PASS. Update the canvas story with an unlocked and a locked md case (stories are enforced by `package-structure.test.ts`).
- [ ] **Step 5:** Commit `fix: frame the dashboard preview only when the person chose it`.

#### Task 3: Fixture e2e for the frame

**Files:**

- Modify: `apps/web/e2e/dashboard-edit.e2e.ts` (add; no existing test changed)

- [ ] **Step 1:** Add `an unlocked tablet width draws no device frame` at viewport width 960: open the empty fixture dashboard, assert the `Tablet layout` button is `aria-pressed=true` and `getByText('Tablet · 834px')` has count 0.
- [ ] **Step 2:** Add `choosing Tablet layout on a wide window draws the frame, and a narrow window drops it`: viewport 1440, click `Tablet layout`, assert the frame text visible; resize to 700, assert it is gone and the button is still pressed.
- [ ] **Step 3:** Run with the fixture command in section 8 using `--workers=1`. Expected: PASS. Commit `test: pin the device frame to the preview lock`.

### S2b. Width and panel behavior (Gated on D2)

#### Task 4: Apply the owner's answer to D2

Not specified further until D2 is answered, because the options change different packages:

- **D2-1 (recommended if Task 1 shows the canvas really is under 640px):** keep container-based resolution and thresholds. Add only a regression test that a 1280px window with the Widgets panel open resolves to the layout Task 1 measured, so the behavior is deliberate and tested. No domain change.
- **D2-2:** change thresholds in `domain-grids` `resolveBreakpoint`. This changes which saved layout every host shows at a width (the saved data itself is unchanged), so it needs its own compatibility note and the grids tests.
- **D2-3:** make the panel overlay rather than push at some width. This is a `frontend-shells` change to `ContextualPanelShell`, which this plan does not touch; it would be a separate plan.

### S2c. First-open content and populated fixtures (`apps/web`, fixture mode only)

#### Task 5: Populated fixture dashboards

**Files:**

- Create: `apps/web/src/features/dashboards/lib/fixtures/fixture-compositions.ts`
- Modify: `apps/web/src/features/dashboards/components/dashboard-view/dashboard-view.tsx` (browser persistence branch only)
- Test: `.../fixtures/fixture-compositions.test.ts`, `dashboard-view.dom.test.tsx`

**Interfaces:**

- Produces: `fixtureComposition(dashboardId: string): DashboardComposition | null`, built with domain helpers (`createComposition`, `layoutsForWidgets`), validated by `dashboardCompositionSchema`. Returns `null` for `fixture-dashboard-reading-progress`, which stays empty because `dashboard-edit.e2e.ts` depends on its empty state.
- Consumes: `browserDashboardStorage({ ownerId })`; the seed is applied only when the stored composition is `null`.

- [ ] **Step 1: Failing tests:** `every seeded composition parses with dashboardCompositionSchema`; `reading-progress has no seed`; `the project-status seed has at least one widget of each link widget type` (limited to `LINK_WIDGET_TYPES`, as the page passes `widgetTypes={LINK_WIDGET_TYPES}`); dom test `a seeded fixture dashboard shows its widgets on first open and saves nothing until it is edited` (spy `saveComposition` not called after mount).
- [ ] **Step 2:** Run; expected FAIL (module missing).
- [ ] **Step 3:** Implement `fixtureComposition`, and in the browser branch of `DashboardView` wrap `load` so a `null` stored composition falls back to the seed. The seed is a read-time default. It is **not** written to browser storage; the first edit saves through the existing scheduler. Fixture mode only (`persistence === 'browser'`); server mode is untouched.
- [ ] **Step 4:** Run; expected PASS. Verify `pnpm --filter web exec vitest run dashboards` still passes.
- [ ] **Step 5:** Commit `feat: open fixture dashboards with widgets`.

Fixture ownership: dashboard fixtures (`DASHBOARD_FIXTURES`, `fixture-compositions.ts`) belong to S2. S3 owns `DOCUMENT_FIXTURES`. Neither plan edits the other's files.

#### Task 6: First-open empty state

**Files:**

- Modify: `packages/features/dashboards/src/frontend/components/dashboard-empty-state/dashboard-empty-state.tsx` and its test and story

- [ ] **Step 1:** Audit, with a screenshot pair, whether the empty state reads well at sm, md, lg and in both themes. Change only identified defects (spacing on the scale, wrapping, contrast through tokens).
- [ ] **Step 2:** Any copy or layout change gets a failing test first (the text or role asserted), then the change; before and after shown to the owner.
- [ ] **Step 3:** Commit `fix:` for exactly what the audit found. If the audit finds nothing, record that and commit nothing.

### S2d. Widget card polish and theme matrix (`features-dashboards`)

#### Task 7: Audit matrix, then fix identified defects

**Files:**

- Modify: widget bodies under `widgets/*`, `widget-shell.tsx`, only where a defect is found
- Test: each touched component's existing test; one new story set `Widget matrix` in `dashboard-grid.stories.tsx` (seeded workspace at lg, md, sm in light and dark)

- [ ] **Step 1:** Using Task 5's seeds, capture every widget type at lg, md, sm in light and dark (24 captures or fewer; types are those in `LINK_WIDGET_TYPES`). Look for clipped titles, overflow, contrast, and cramped spacing. List defects in a table with a screenshot each. **This list is the scope.**
- [ ] **Step 2:** For each defect: failing test where behavior is testable (truncation has `title`/`aria` fallback; no horizontal overflow via `scrollWidth <= clientWidth` in the dom test), then a token or scale-step fix. Never a palette colour; never a bracket value.
- [ ] **Step 3:** Run the Storybook accessibility tests (`pnpm test:storybook`) for the matrix stories; expected PASS (axe contrast in both themes).
- [ ] **Step 4:** Commit one defect per commit: `fix: <the defect>`.

### S2e. Starter layout (decided: not built in S2)

#### Task 8: Starter layout behavior

Closed by D3 (option a, 2026-10-29): S2 builds no starter layout, no starter catalogue and no code path that writes one. Explicit starter layouts may be reconsidered as a separate product slice after Task 7's visual audit. Task 5's fixture seeds are not a starter layout and write nothing.

### S2f. Whole-feature verification

#### Task 9: Regression across contracts

- [ ] **Step 1:** Run the contract suites unchanged: save scheduler, `dashboard-workspace-provider` (store replacement), `server-dashboard-storage`, `keyboard-move`, `dashboard-editor-surface` (which covers the focus handoff), `undo-remove`, and the fixture e2e groups `dashboard-edit.e2e` and `global-panel.e2e`.
- [ ] **Step 2:** Add to `dashboard-edit.e2e.ts`: `a locked preview survives opening and closing the Widgets panel` (lock Tablet, open and close the panel, button still pressed, no extra saves).
- [ ] **Step 3:** Run the section 8 commands. Report what ran and what did not.
- [ ] **Step 4:** Manual checks (not covered by automation): keyboard-only pass through toolbar, widget move with arrow keys, panel open and close; screen reader announcement after a move; light and dark at 1440, 1280, 960, 390.

## 5. Contracts S2 must not change

| Contract                                                             | Guard                                                                                                      |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Save, debounce, status, Retry                                        | `save-scheduler.test.ts`                                                                                   |
| Revision and conflict, Reload replaces store, panel not remounted    | `dashboard-workspace-provider.test.tsx`, `server-dashboard-storage.test.ts`, `dashboard-view.dom.test.tsx` |
| Undo of the last removal (no redo exists)                            | `undo-remove.test.tsx`, store tests                                                                        |
| Keyboard move, resize, reorder, announcements, focus handoff         | `keyboard-move.test.ts`, `dashboard-edit.e2e.ts`                                                           |
| Empty state and Add a widget on `fixture-dashboard-reading-progress` | `dashboard-edit.e2e.ts`                                                                                    |
| Saved layouts keyed by breakpoint                                    | `domain-grids` tests                                                                                       |

## 6. Out of scope

Document layout (S3); the Lexical editor; any schema, Server Action, or `server-data` change; widget data ownership; a general undo or redo stack; the parallel fixture e2e investigation (#122); shell visual verification (#101); changes to `ContextualPanelShell`.

## 7. Decisions

Recorded 2026-10-29 from the owner's review.

- **D1 (vocabulary): approved.** Layout breakpoint, preview lock and device frame stay distinct. They remain working terms, not canonical names; no glossary entry.
- **D2 (panel and width): D2-1 approved by the owner on 2026-10-29, after Task 1's measurements.** Container-based resolution and the 640 and 1024 thresholds stay; no change to `domain-grids` or to the contextual panel's overlay. At a 1280px window with the Widgets panel open the surface is about 580px, so the single-column layout is correct. S2b (Task 4) is done as a regression test only: a unit test of the surface at the measured widths and a fixture e2e at 1280px with Widgets open (viewport and canvas widths recorded separately, surface under 640px, Mobile layout pressed, one column, no device frame). D2-2 and D2-3 were not taken.
- **D3 (starter layout): option a approved.** No starter-layout implementation and no persisted starter catalogue in S2. Explicit starter layouts may be reconsidered as a separate product slice after the visual audit.
- **D4 (fixture seeding): approved.** Supported fixture Dashboards open populated through read-time defaults only. `fixture-dashboard-reading-progress` stays empty. Seed content is never written merely because a page rendered; the first edit saves through the existing scheduler.

### Refinements that bind every task

1. Measurements and tests distinguish **viewport width** from **Dashboard canvas width**. A canvas-width case sets the canvas element's width (the width the hook reads), never `window.innerWidth`, and e2e cases record both numbers.
2. S2 and S3 keep their own files: S2 does not edit Document code, `DOCUMENT_FIXTURES` or `resource-views.e2e.ts`; S3 does not edit Dashboard code, dashboard fixtures or `dashboard-edit.e2e.ts`.
3. No persisted-data behavior, migration, Lexical, or new shared shell abstraction.
4. Save, revision, conflict, keyboard and removal-undo semantics are preserved. There is no redo and none is claimed.

### Starting S2 after this plan is integrated

Branch from updated `main` in a fresh worktree. First action is Task 1 (measure, no source change), then Task 2 and Task 3 (S2a). S2c (Tasks 5 and 6) and S2d (Task 7) can follow in separate pull requests. Task 4 waits for D2.

## 8. Verification commands

- Per task: `pnpm --filter @synapcity/features-dashboards exec vitest run <name>` or `pnpm --filter web exec vitest run <name>`.
- Before each push: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm deps`, `pnpm boundaries`.
- Fixture e2e, one worker first: `E2E_WEB_MODE=dev SYNAPCITY_DEV_AUTH=fixture pnpm --filter web exec playwright test --workers=1 dashboard-edit.e2e global-panel.e2e`. Default workers are a separate comparison, tracked in #122; a failure under default workers is not by itself a S2 regression.
- Stories: `pnpm test:storybook`. Full gate before merge: `pnpm verify`.
- Not covered by any of these: real-database persistence under S2 (`dashboard-persistence.e2e.ts` needs a saved account), screen reader behavior, and visual quality. State that in the report.

## 9. Self-review

- Spec coverage: breakpoint versus layout (section 3, Tasks 2 and 4); preview lock versus frame (section 3, Task 2); 915–1023 frame (D-a, Tasks 2 and 3, extended to mobile); single column near 1280 (D-b, Tasks 1 and 4); first-open and fixtures (Tasks 5 and 6); card polish and theme (Task 7); starter layout with a persisted-data gate (Task 8, D3); save, revision, undo, keyboard, conflict contracts (section 5, Task 9).
- Gaps declared: no redo exists; widths near 1280 are unmeasured; the mobile-frame range is inferred.
- Proportion: the only code-bearing tasks are 2, 5, 6 and 7; each lists names and assertions, not bodies.
