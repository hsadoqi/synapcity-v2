# Runs (morning-run prototype)

A standalone Next.js app for **runs**: short guided check-ins (a rating, a breath, a pick-list, a free note) that turn a few answers into a concrete day: tasks, a schedule, a focus session and a private journal. It covers the whole of life, not only work: body and sleep, people, money, home and your own head, next to the work runs.

It is a self-contained project. It has its own `package.json`, lockfile and tooling, is **not** part of the Synapcity pnpm workspace, and imports nothing from it. Everything is stored in the browser (`localStorage`); nothing is sent anywhere.

> **Status: prototype.** "Run" is a working label, not an adopted product term (see `docs/glossary.md`, AGENTS.md section 3). Nothing here selects a Synapcity schema, route, package or storage design. Moving any of it into the workspace is a separate, approved decision (ADR-0014, section 5 of AGENTS.md).

## Run it

```bash
cd prototypes/morning-run
pnpm install
pnpm dev            # http://localhost:3100
```

Checks, all from this folder:

```bash
pnpm verify         # format, lint, types, unused code, unit tests, build, e2e
pnpm test           # Vitest: logic and components (jsdom)
pnpm test:e2e       # Playwright: needs `pnpm build` first
```

Playwright wants its own Chromium revision. If it is not installed, run `pnpm exec playwright install chromium`, or point `PW_CHROMIUM_PATH` at an existing Chromium binary.

## What is in it

| Screen  | Route        | What it does                                                                                                                       |
| ------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| Runs    | `/`          | 13 runs from the prototype plus 5 for the rest of your life, grouped; pin any run to the top; resume banner for an interrupted run |
| Run     | `/run/[id]`  | The player: timer, breathing, ratings, lists, free text, notes                                                                     |
| Result  | `/done/[id]` | Today's intention card (Copy, Markdown, Image, Share) and where each answer went                                                   |
| Today   | `/today`     | A board of what your runs set up, on a drag-and-resize grid (react-grid-layout), with a private journal (Lexical)                  |
| Focus   | `/focus`     | A focus session paced by your energy rating, with breaks                                                                           |
| History | `/history`   | Past runs, streak, energy trend, runs per week, JSON export, clear                                                                 |
| Build   | `/builder`   | Make your own run from reusable step types, say where each answer goes, pin it beside the built-ins                                |

### Three layouts, one set of components

The prototype shipped three directions. All three are here and switchable from the header (remembered in a cookie, so the first paint is already right):

- **Focus** (C): near-black and amber, one column, a numbered list. The default.
- **Stage** (A): teal on navy, cards with icon tiles, a card-shaped player.
- **Workbench** (B): light, with a step list on the left and a live "this run will set up" preview on the right.

Views only change tokens and chrome (`src/app/globals.css`, `src/components/run/run-layouts.tsx`, the home and result screens). Controls are shared. Components use semantic colour names (`bg-primary`, `text-muted-foreground`), never a raw colour.

## The improvements you asked for

| Ask                        | Where it lives                                                                                                                                                                                                                  |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accurate run timing        | Each step has its own `durationSec`. The step countdown and a "run" total both come from those numbers, and the card label (`runMeta`) is derived from the same sum. The clock reads `performance.now()`, so it does not drift. |
| Functional breathing       | `breathing-control.tsx`: inhale 4, hold 7, exhale 8, with the phase word, a real countdown and a circle that grows and shrinks. It reads the step's clock, so pausing the timer pauses the breath. Reduced motion: no scaling.  |
| Required vs optional       | Every step says **Required** or **Optional**. Continue is disabled until a required step is answered, with a visible reason. Skip is always there and is recorded.                                                              |
| Single vs multi select     | Pick one is a radio group (round marks, arrows select). Pick several is a checkbox group (square marks, a "2 of 3 chosen" count, a clear message at the limit).                                                                 |
| Keyboard                   | `1`-`9` and `0` rate. Arrows and Space on lists. Enter continues, Esc leaves, `P` pauses, `B` back, `S` skip. Ctrl or Cmd + Enter continues from a text field. The rules are a pure function in `src/lib/keys.ts`, with tests.  |
| Completion payoff          | `intention-card.tsx`: a one-sentence intention built from your answers, with Copy, Markdown, PNG image (drawn in the active view's colours), Share (where the browser supports it) and **Start focus session**.                 |
| Resume interrupted runs    | The active run is saved after every change (answers, notes, step, elapsed time). Reload or leave and it comes back on the same step, with the timer waiting, paused.                                                            |
| Private history and trends | `/history`: streak, energy over time, runs per week, most-used runs. Export as JSON, or clear it.                                                                                                                               |
| Tactile polish             | An amber sweep on hover and focus, a pop-and-rise on completion, a timer swell (last 10 seconds of a step, last minute of a run), and a focus ring on everything. All decorative motion is off under `prefers-reduced-motion`.  |
| Safe navigation            | Leaving a run with progress asks first (keep going, leave and keep progress, discard). Restart asks first too.                                                                                                                  |
| Accessibility              | Lucide icons replace the text glyphs. The timer is a `role="timer"`; milestones ("10 seconds left", "Time is up") and each breathing phase go through polite live regions. Focus moves to the step heading when a step changes. |
| Build your own run         | `/builder`: pick from 12 step templates, edit wording, time, options, limits and destinations, reorder, save, pin. Validation is plain-language.                                                                                |

## How the data flows

```
answers --> routeAnswers() --> one card per destination (Tasks, Schedule, Focus, Journal, ...)
                         \--> buildIntention() --> the shareable card
                         \--> applyRunToBoard() --> today's board (/today)
```

- **Runs and steps** are Zod schemas (`src/lib/runs/schema.ts`). Built-in and custom runs are the same type, so everything that plays or lists a run treats them alike.
- **Pacing**: an energy rating moves the start time and the focus-session length (`src/lib/pace.ts`).
- **Storage**: `createPersistedStore` wraps `localStorage` for `useSyncExternalStore`. Values are versioned and validated on read; anything corrupt falls back to a default. It listens for the `storage` event, so two tabs stay in step.
- **Lexical** edits free text (step notes, the "write anything" step, the journal). The text is stored as plain text, so it survives a change of editor.
- **react-grid-layout** (v2 hooks API) lays out the Today board. Drag a widget by its header, or focus its grip and use the arrow keys to move it and Shift + arrows to resize it. One column on narrow screens.

## Stack, and why these versions

Checked against the npm registry on 2026-10-25.

| Package                           | Version | Note                                                                                                         |
| --------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------ |
| next                              | 16.4.3  | Current latest. App Router, Turbopack.                                                                       |
| react, react-dom                  | 19.3.1  | Current latest.                                                                                              |
| tailwindcss, @tailwindcss/postcss | 4.3.3   | Current latest. CSS-first config (`@theme inline`).                                                          |
| shadcn components, @base-ui/react | 1.9.0   | Generated with the shadcn CLI in the `base-mira` style (Base UI primitives), then given touch-size variants. |
| lexical, @lexical/react           | 0.52.0  | Current latest. The long-standing `LexicalComposer` API with the plain-text plugin.                          |
| react-grid-layout                 | 2.3.0   | Current latest. v2 API (`Responsive`, `useContainerWidth`); the v1 `legacy` entry is not used.               |
| lucide-react                      | 1.61.0  | Current latest. The only icon set.                                                                           |
| zod                               | 4.6.7   | Current latest.                                                                                              |
| typescript                        | 7.0.2   | Current latest.                                                                                              |
| vitest                            | 4.1.12  | **Not the latest** (5.0.5 exists). Pinned to what Synapcity uses today; upgrading is its own change.         |

Two things that follow from TypeScript 7:

- **ESLint parses with Babel, not typescript-eslint**, because typescript-eslint 8.72 refuses to load against TypeScript 7. This mirrors `packages/dev/eslint-config` in the Synapcity workspace. The compiler (`pnpm check-types`) does the type work; ESLint does the rest.
- `next typegen && tsc` is the type check.

## Known limits

- **One device.** There is no account and no sync; clearing site data clears everything. Export from `/history` first.
- **Every route renders on demand**, because the root layout reads the layout cookie so the first paint has the right colours. There is no static export.
- **Custom runs live in the browser**, so a link to `/run/custom-...` only works on the device that made it.
- **The Today board resets each day.** Yesterday lives on in history, not on the board.
- **The focus session is not saved**; closing the tab ends it.
- **Share** only appears where the browser offers the Web Share API.
- **Touch dragging** on the Today board works through react-grid-layout; the keyboard route is there for when a pointer is not an option.
- The schedule and focus cards are planning aids, not calendar entries.

## Layout of the code

```
src/app/                 routes (all thin: they hand off to a screen component)
src/components/run/      the player: controls, layouts for the three views, dialogs
src/components/{home,done,today,focus,history,builder,shared,ui}/
src/lib/runs/            schema, catalog, templates, validation, destinations
src/lib/session/         the active run as pure functions (answer, skip, advance)
src/lib/timing/          the clock, breathing maths, formatting
src/lib/routing.ts       answers -> cards;  intention.ts: the shareable card
src/lib/storage/         persisted stores and the actions that touch them
e2e/                     Playwright: flow, safety, payoff, builder, views + axe, motion
```
