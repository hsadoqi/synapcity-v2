# Shared shell: resource containment at phone width Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Status:** Authorized by the owner on 2026-10-29 as a separate shared-shell corrective slice for issue #126. The slice covers investigation, scoped implementation, tests and a pull request; the owner merges. If the root cause turns out to need an architectural change (a new small-screen panel presentation, or a change to `ContextualPanelShell`'s public contract), stop after Task 2 and report it for a decision.

**Goal:** A resource page stays inside the viewport at phone and tablet widths, with a long unbroken title and with the contextual panel open or closed, for both Document and Dashboard consumers, without changing desktop behaviour.

**Architecture:** Find which element in the chain `RootShell` > `RootContent` (`main`) > `ResourceFrame` > `ContextualPanelShell` > the body fails its width contract, and fix that element only. `ContextualPanelShell` already decides small-screen behaviour: below `SIDE_BY_SIDE_PX` (two 256px regions plus the 48px rail, so 560px of its own container) an expanded panel takes the whole work area and the main region is `inert`. The working hypothesis is that this mechanism is right but is fed a wrong width; it is a hypothesis until Task 1 measures it.

**Tech Stack:** `@synapcity/frontend-shells` (React, `react-resizable-panels`), `apps/web` consumers, Tailwind v4, Vitest DOM tests, Storybook, Playwright (fixture mode and production build).

**Spec:** issue #126; the S3 report on #124 (`test.fail()` case in `apps/web/e2e/resource-views.e2e.ts`); the S2 measurements on #125 (`docs/superpowers/plans/2026-10-29-dashboard-s2-measurements.md` on that branch: at windows of 480px and below the open panel covers the Dashboard canvas); the #101 baseline (no horizontal scroll at 400 to 1280px, breadcrumbs truncate).

## Global Constraints

- Change shell files only where Task 2 names the failing contract. No arbitrary CSS patch, no `!important`, no bracket value, no `style={{}}` for static values, no `z-index` on overlays.
- Do not modify the S2 (`feat/dashboard-s2-responsive-polish`) or S3 (`feat/document-s3-reading-layout`) branches or worktrees. Read them with `git show` or `git worktree`-independent `git fetch` refs only.
- Preserve desktop panel resizing (drag and keyboard on the handle), the rail, collapse, `inert` handling, focus restoration on close, the single `h1`, the full title in its accessible name, and the global panel's padding transitions.
- No new dependency, no new shared abstraction unless Task 2 shows the existing one cannot express the fix (then stop and report).
- The mobile sidebar navigation defect (#127) and save status (#128) are out of scope.
- Heavy runs (`build`, `test:coverage`, `test:storybook`, `verify`, any Playwright or dev server) take the shared lock: `until mkdir /private/tmp/claude-501/-Users-hanaasadoqi-Projects-worktrees-synapcity-features-shared-resource-structure/51c26b63-4b41-4649-a09e-f64a8077f066/scratchpad/heavy-verify.lock 2>/dev/null; do sleep 15; done`, released with `rmdir` on the same path right after, even on failure. Playwright uses `--workers=1` (#122).

## Review Focus

1. **Panel open, viewport crossing 560 + chrome while dragging the window.** Expected: one switch between split and full-area panel, no flicker loop between the two (the narrow measurement must not depend on the panel's own size).
2. **Dashboard canvas at 390 with Widgets open.** Expected: unchanged from today (the panel covers the canvas); the S2 breakpoint measurements still hold.
3. **Global panel open on top.** The `main` padding transition and `data-fill-viewport` pages (settings) still fill and scroll inside themselves.
4. **Long multi-word title versus long unbroken title.** Both truncate; neither grows any ancestor.
5. **Keyboard: open the panel at 390, close it with Escape.** Focus returns to the toggle; the main region is not left `inert`.

---

## 1. What is known (read in code, 2026-10-29)

- `RootContent` renders `div.relative.flex.w-full.flex-1.justify-center > main.flex.flex-1` with no `min-w-0`. A flex item's automatic minimum width is its content's min-content width, so a long unbroken title inside can make `main` wider than its parent. This is the suspected contributor for defect A.
- `ResourceFrame` is `flex w-full min-w-0 flex-1 flex-col overflow-hidden p-2`; its `min-w-0` cannot help if its parent (`main`) is already wider than the viewport.
- `ResourceHeader`'s `h1` is `min-w-0 shrink truncate`; truncation only works if every ancestor can shrink.
- `ContextualPanelShell` measures its own element with `ResizeObserver` (`useNarrow`) and switches to full-area panel below 560px. If its element is wider than the viewport (defect A), it measures a width at or above 560px and keeps the split, which would explain defect B's 64px reading region. **Unconfirmed**: defect B was reported for every document, including Launch plan, whose title is short, so another wide descendant (for example the Document body's `max-w-prose` column, or `REGION_MIN` on a panel region) may also feed the measurement.
- Dashboards pass `scroll={false}` to `ResourceFrame`; Documents use the default scrolling body (`role="group"`, `overflow-auto`). That difference is a lead for why Dashboards switch correctly and Documents do not.

## 2. Tasks

### Task 1: Measure the chain (no source change)

**Files:** a measurements table in the pull request description (not committed); evidence under `Projects/worktrees/synapcity/evidence/2026-10-29/shell-containment/`.

- [ ] **Step 1:** In fixture mode on this branch (`origin/main` at `10e70ef6`), open a Document (Launch plan, then a long unbroken name served from a temporary local fixture you do not commit, or the S3 fixture read from `origin/feat/document-s3-reading-layout` into a scratch copy) and a Dashboard, at 390, 400, 640, 768 and 1024px, panel closed and open.
- [ ] **Step 2:** For each case record the `getBoundingClientRect()` width and `scrollWidth` of: viewport, `#main-content`, `[data-slot=resource-frame]`, the `ContextualPanelShell` root (the `useNarrow` element, `data-narrow`), the main region, the panel region, `[data-slot=resource-body]`, the header `h1`, and the widest descendant of the body (walk the tree for the max `scrollWidth`).
- [ ] **Step 3:** State which element is first wider than its parent in each failing case, and whether `data-narrow` is set. That element is the root cause candidate. Repeat the failing cases on the S2 and S3 branches (checked out into scratch copies with `git worktree add` under your scratchpad, not their active worktrees) to show the cause is the shell and not the feature.

### Task 2: Root-cause statement and decision point

- [ ] **Step 1:** Write the cause per defect: element, the CSS rule or contract it lacks, and the measurement that shows it.
- [ ] **Step 2:** If the fix is a containment rule on an existing shell element (for example `min-w-0` on `main`, or what `useNarrow` measures), continue. If defect B needs a different small-screen presentation (a sheet instead of the existing full-area panel) or a change to `ContextualPanelShell`'s props or public behaviour, **stop and report** with options; the existing full-area mode is the current contract and is preferred.

### Task 3: Geometric containment tests (failing first)

**Files:**

- Create or extend: `apps/web/e2e/shell-containment.e2e.ts` (fixture mode, so it runs with the other fixture groups).
- Modify: `packages/frontend/shells/src/components/root-shell/root-content/root-content.test.tsx` and `.../contextual-panel/contextual-panel.test.tsx` where jsdom can express the contract (class or attribute contracts only; jsdom has no layout).

- [ ] **Step 1:** A helper `expectContained(page, selector, within)` that asserts the element's box lies inside the container's box (left >= container left - 0.5, right <= container right + 0.5), and inside the viewport. Use it, not only `scrollWidth <= innerWidth`.
- [ ] **Step 2:** Cases, each at 390, 400, 640, 768, 1024: long unbroken name and long multi-word name; panel closed and open; Document and Dashboard. Assert containment of frame, header, `h1`, body, panel; assert the `h1` text is the complete name; assert that with the panel open below the narrow line the main region is `inert` and the panel fills the work area.
- [ ] **Step 3:** Run with `--workers=1`; expected: the failing cases from Task 1 FAIL, the others PASS.

### Task 4: Fix the named contract

- [ ] **Step 1:** Change only the element Task 2 named. Keep the existing comments' intent; update a doc comment if the contract changes.
- [ ] **Step 2:** Re-run Task 3; expected PASS. Run the shells unit tests and stories (`pnpm --filter @synapcity/frontend-shells exec vitest run`, `pnpm test:storybook`).
- [ ] **Step 3:** Update the shells stories with a long unbroken title case in a narrow container if none exists (stories are part of the package's coverage).

### Task 5: Consumers and regressions

- [ ] **Step 1:** Run fixture e2e `global-panel.e2e resource-views.e2e dashboard-edit.e2e shell-containment.e2e` with `--workers=1`, and the production `pnpm test:e2e` if `apps/web/.env.local` exists in this worktree (do not copy one; otherwise report it as not run).
- [ ] **Step 2:** Desktop: drag and keyboard-resize the panel at 1280 and 1440, collapse and reopen; global panel open and closed; settings page fill. Light and dark at 390 and 1280.
- [ ] **Step 3:** The S3 `test.fail()` case lives on the S3 branch, not here. Do not edit it in this pull request. Record in the pull request that once both land, the annotation can be removed, and verify it by running that case against a local merge of this branch and `origin/feat/document-s3-reading-layout` in a scratch worktree. Report the result.

### Task 6: Record and open the pull request

- [ ] **Step 1:** Add a task-scope entry at the top of `.agents/task-scope.md` for this slice (scope, boundaries, the measured root cause, checks run and not run).
- [ ] **Step 2:** `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm deps`, `pnpm boundaries`, `pnpm brand:check`, `pnpm test:coverage`, `pnpm build`.
- [ ] **Step 3:** Push and open a pull request to `main` referring to #126 without a closing keyword. Do not merge.

## 3. Verification not covered

Physical touch devices, screen readers, the real signed-in Dashboard route (blocked on the local `dashboard_compositions` migration, #101), and default-worker e2e (#122).
