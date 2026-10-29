# Dashboard S2: Task 1 measurements

**Status:** Evidence for [the S2 plan](2026-10-29-dashboard-s2-first-open-responsive-polish.md), Task 1. Recorded 2026-10-29 from `origin/main` at `10e70ef6`, before any S2 source change; the last section was added after S2a and S2c and says so. Every value in the tables is **measured**: read from the running page, not derived from code.

## How it was measured

- Fixture mode: `SYNAPCITY_DEV_AUTH=fixture next dev` on a free local port, one server, started and stopped for this run. Chromium through Playwright, one browser, a fresh context per width, window height 900 px.
- Page: `/fixture-user/home/dashboards/fixture-dashboard-reading-progress`. Three widgets (Pinned, Last opened, Spaces) were added once through the interface and the stored composition was put back into each fresh context, so columns can be read. The same widths were also measured on the empty dashboard: every width, breakpoint and frame value was identical, so only the populated rows are shown.
- Panel open means the Widgets rail button was pressed and the 200 ms opening glide had finished (600 ms wait). Nothing was in edit mode.
- Sweeps: one page, window resized 1 px at a time from 1500 to 360 px, recording every change of breakpoint or frame.

### What each column is

| Column         | What was read                                                                                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Window         | `window.innerWidth` (the viewport).                                                                                                                                              |
| Sidebar        | Left edge of `[data-slot="sidebar-inset"]`, that is the width the app sidebar takes, and its state.                                                                              |
| Surface        | Border-box width of the `DashboardEditorSurface` root. It has no padding. **The breakpoint is resolved from this width** (`resolveBreakpoint`).                                  |
| Canvas         | Border-box width of `DashboardCanvas`'s own element. Equal to the surface here (no `beside`).                                                                                    |
| Canvas content | The canvas's content width (border box less `px-5`, 40 px). **This is the width `useElementWidth` reports to the canvas, and the frame test compares it with frame width + 80.** |
| Grid           | Width of the grid inside the canvas (inside the frame when framed).                                                                                                              |
| Columns        | Grid width over the width of a one-column widget (both plus the 16 px margin).                                                                                                   |
| Panel          | Width of `[data-slot="contextual-panel-content"]`; the rail is a further 48 px at every width.                                                                                   |
| Breakpoint     | The `aria-pressed` button of the Layout breakpoint toolbar. Nothing was chosen, so none of these is a locked preview.                                                            |
| Framed         | The frame label shown, or no.                                                                                                                                                    |

## Fixed widths (measured)

Panel closed:

| Window | Sidebar        | Surface | Canvas | Canvas content | Grid   | Columns | Breakpoint | Framed         |
| ------ | -------------- | ------- | ------ | -------------- | ------ | ------- | ---------- | -------------- |
| 1440   | 317 expanded   | 1057.2  | 1057.2 | 1017           | 1017.2 | 3       | lg         | no             |
| 1280   | 282 expanded   | 932.4   | 932.4  | 892            | 892.4  | 2       | md         | no             |
| 1100   | 242 expanded   | 792     | 792    | 752            | 752    | 2       | md         | no             |
| 1024   | 225 expanded   | 732.7   | 732.7  | 693            | 692.7  | 2       | md         | no             |
| 960    | 48 collapsed   | 846     | 846    | 806            | 806    | 2       | md         | no             |
| 800    | 48 collapsed   | 686     | 686    | 646            | 646    | 2       | md         | no             |
| 640    | 0 (off-canvas) | 574     | 574    | 534            | 348    | 1       | sm         | Mobile · 390px |
| 600    | 0 (off-canvas) | 534     | 534    | 494            | 348    | 1       | sm         | Mobile · 390px |
| 480    | 0 (off-canvas) | 414     | 414    | 374            | 374    | 1       | sm         | no             |
| 390    | 0 (off-canvas) | 324     | 324    | 284            | 284    | 1       | sm         | no             |

Widgets panel open:

| Window | Sidebar        | Panel | Surface | Canvas | Canvas content | Grid  | Columns | Breakpoint | Framed               |
| ------ | -------------- | ----- | ------- | ------ | -------------- | ----- | ------- | ---------- | -------------------- |
| 1440   | 317 expanded   | 351.7 | 704.5   | 704.5  | 664            | 664.5 | 2       | md         | no                   |
| 1280   | 282 expanded   | 351.8 | 579.6   | 579.6  | 540            | 348   | 1       | sm         | Mobile · 390px       |
| 1100   | 242 expanded   | 351.5 | 439.5   | 439.5  | 399            | 399.5 | 1       | sm         | no                   |
| 1024   | 225 expanded   | 351.4 | 380.3   | 380.3  | 340            | 340.3 | 1       | sm         | no                   |
| 960    | 48 collapsed   | 351.6 | 493.4   | 493.4  | 453            | 453.4 | 1       | sm         | no                   |
| 800    | 48 collapsed   | 351.5 | 333.5   | 333.5  | 294            | 293.5 | 1       | sm         | no                   |
| 640    | 0 (off-canvas) | 313.5 | 259.5   | 259.5  | 220            | 219.5 | 1       | sm         | no                   |
| 600    | 0 (off-canvas) | 273.5 | 259.5   | 259.5  | 220            | 219.5 | 1       | sm         | no                   |
| 480    | 0 (off-canvas) | 414   | 0       | 40     | 0              | 0     | none    | sm         | no (panel covers it) |
| 390    | 0 (off-canvas) | 324   | 0       | 40     | 0              | 0     | none    | sm         | no (panel covers it) |

At 480 and 390 the panel covers the main region (the shell's narrow behaviour); the canvas keeps only its padding. The page never scrolled sideways at any width (`scrollWidth - innerWidth` was 0 throughout).

## Transitions (measured, 1 px sweep)

Panel closed:

| Window range | Surface (border box) | Canvas content | Breakpoint | Framed         |
| ------------ | -------------------- | -------------- | ---------- | -------------- |
| 1398 and up  | 1024 and up          | 984 and up     | lg         | no             |
| 1308 to 1397 | 954.x to 1023.5      | 914.x to 983   | md         | Tablet · 834px |
| 706 to 1307  | 640 to 953.4         | 600 to 913     | md         | no             |
| 577 to 705   | 511 to 639           | 471 to 599     | sm         | Mobile · 390px |
| 576 and down | 510 and down         | 470 and down   | sm         | no             |

Widgets panel open (panel about 352 px):

| Window range | Surface (border box) | Canvas content | Breakpoint | Framed         |
| ------------ | -------------------- | -------------- | ---------- | -------------- |
| 1357 to 1500 | 640 to 761.3         | 600 to 721     | md         | no             |
| 1192 to 1356 | 510.x to 638.3       | 470.x to 598   | sm         | Mobile · 390px |
| 1023 to 1191 | down to about 380    | down to 340    | sm         | no             |
| 978 to 1022  | 511 to 554.6         | 471 to 515     | sm         | Mobile · 390px |
| 977 and down | 510 and down         | 470 and down   | sm         | no             |

Below a 1024 px window the sidebar collapses to its 48 px icon rail, which gives the canvas back about 175 px; that is why the mobile frame reappears between 978 and 1022.

## Findings

1. **D-a confirmed, with exact bounds.** Nothing was chosen in any row above, so every frame shown is an unintended one. The tablet frame appears for a surface of 955 to 1023 px, that is a canvas content width of 915 to 983 px. The plan's range "915 to 1023" mixed two widths: the lower bound is the canvas content width the frame test reads, the upper bound is the surface width the breakpoint reads. The two differ by the canvas's 40 px of padding.
2. **The inferred mobile frame is confirmed.** It appears for a surface of 511 to 639 px (canvas content 471 to 599 px), with the panel closed (windows 577 to 705) and with it open (windows 1192 to 1356, and 978 to 1022). At a 1280 px window with Widgets open, the frame shrinks the grid to 348 px inside a 540 px canvas.
3. **Single column near 1280 is real geometry.** With Widgets open at a 1280 px window the surface is 579.6 px (canvas content 540 px). It is under 640, so the container rule gives sm, one column. The window at which the open-panel surface crosses 640 px is **1357 px** (sidebar expanded). At 1440 with the panel open the surface is 704.5 px: md, two columns.
4. The breakpoint is resolved from the surface's width and the frame from the canvas's content width. They are different elements and differ by 40 px; that gap is why the frame band is 40 px narrower than the plan inferred.

## D2 recommendation

**D2-1: keep container-based resolution and the 640 and 1024 thresholds, and pin the 1280-with-panel behaviour with a test.** The decision stays with the owner (S2b, Task 4, is not started).

- The canvas really is under 640 px at 1280 with the panel open (579.6 px surface, 540 px content), so the sm layout is the rule working as recorded by the existing e2e `follows the container width`, not a measuring error.
- Most of what looks wrong at that width is the unintended mobile frame (a 348 px grid in a 540 px canvas). S2a removes it; after S2a the single column fills the 540 px canvas.
- D2-2 would change which saved layout every host shows at a given width. Two columns would fit at 540 px (about 262 px each, against a 120 px minimum column), so it is possible, but the measurements do not show a defect that requires it. It can be reconsidered after the Task 7 card audit shows how single-column cards read at 500 to 640 px.
- D2-3 is a `ContextualPanelShell` change and a separate plan; the panel already covers the canvas at phone widths (480 and 390).

## After S2a and S2c: audit of the empty state and cards (Tasks 6 and 7)

Measured on the S2 branch after the frame fix and the fixture seeds, in fixture mode, with the system colour scheme emulated light and dark. Cases: 1440 (lg), 960 (md), 390 (sm) with the panel closed, and 1280 with Widgets open (sm). Dashboards: Project status (seeded with Pinned, Last opened and Spaces) and Reading progress (empty). Screenshots are kept outside the repository.

| Check                                     | Result (measured)                                                                                                    |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Page scrolls sideways                     | Never (`scrollWidth - innerWidth` 0 in all 16 captures)                                                              |
| Card wider than its cell, clipped content | None. Lists longer than a card scroll inside its focusable body                                                      |
| Truncated titles                          | None at these widths                                                                                                 |
| Card sizes                                | lg 328 × 176, md 395 × 176, sm 284 × 224; 1280 with Widgets open: 540 × 224, one column filling the canvas, no frame |
| Empty state                               | Centred, wraps to two lines at 390, readable in both themes; no defect found                                         |
| Storybook matrix (`Dashboards/Grid`)      | Six stories, lg, md, sm in light and dark: accessibility checks (axe) and the no-horizontal-overflow assertion pass  |

No defect was found, so Tasks 6 and 7 change no component. Not a defect, recorded for later: a seeded fixture dashboard shows the save status Saved before anything was written, because that status means no unsaved changes; the save status contract is unchanged in S2.
