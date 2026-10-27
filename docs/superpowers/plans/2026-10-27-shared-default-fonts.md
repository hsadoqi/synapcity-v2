# Shared Default Fonts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Status:** Approved in direction (owner, 2026-10-27). Reviewed 2026-10-27 (spec section 9). Task 1 can start; Task 3 waits on the owner's answers to spec O1 and O2.

**Goal:** Load Inter, Geist and Geist Mono once in a workspace package and have `apps/web`, `apps/docs` and Storybook consume the same font variable classes, from one copy of the font files.

**Governing:** [Shared default fonts design](../specs/2026-10-27-shared-default-fonts-design.md), [ADR-0003](../../architecture/decisions/0003-typography-roles-and-font-preferences.md), [ADR-0014](../../architecture/decisions/0014-multi-app-package-boundaries.md) (rule R11, dependency matrix).

**Independent of** the [font catalogue picker plan](2026-10-27-font-catalogue-picker.md). Both edit ADR-0003 and `AGENTS.md`, so land them one after the other, not in parallel.

## Global Constraints

- No change to families, weights, `subsets`, `preload`, variable names, roles or `--font-preference-*` overrides.
- `next/*` imports only under the package's `src/next/` (R11). Consumers use `exports` (R5).
- Move, then change: `git mv` web's `.woff` files to keep their history; delete the docs copy (it is byte-identical).
- `next` pinned to the apps' version as a dependency, as `frontend-shells` does.
- Process: a task scope entry in `.agents/task-scope.md` before Task 1; commits and pushes only when authorized.

## Tasks

### Task 1: Prove `next/font` works from a workspace package (spike, thrown away)

- [ ] **Step 1:** In a scratch branch, copy `fonts.ts` and the two `.woff` files into an existing source-pointing frontend package under `src/next/` (for example `frontend-shells/src/next/fonts/`), export it, and import it from `apps/web/src/app/layout.tsx`.
- [ ] **Step 2:** A fresh `pnpm --filter web build` (delete `apps/web/.next` first). Confirm `.next/static/media/` holds the hashed files and the page CSS defines `--font-inter`, `--font-geist-sans` and `--font-geist-mono`.
- [ ] **Step 3:** `pnpm --filter web dev`: load a page and confirm the same three variables resolve and the files are served.
- [ ] **Step 4:** A Storybook build with the same import.
- [ ] **Step 5:** Record the result in spec section 3 (replace NOT VERIFIED). If any of the three fails, stop and report; option D in spec section 5 is the fallback, which the owner chooses. Do not work around a failure.

### Task 2: Owner decisions

- [ ] O1: the default code face stays Geist Mono, or changes with the `frontend-tokens` merge (then pause this plan until that is decided).
- [ ] O2: option A, B, C or D from spec section 5 (recommended: B). Record both answers in the spec.

### Task 3: Create the fonts unit

- [ ] **Step 1: Failing test.** In the package, a test that reads `shared-styles.css` (from `@synapcity/frontend-tailwind-config`) and the loader source, and checks that the three variable names match. A test that `fontVariableClasses` has three entries and `fontVariables` is them joined by one space (mock `next/font/*` in Vitest, as the `global-error` tests mock `./fonts` today).
- [ ] **Step 2:** Add `src/next/fonts.ts` with the three loaders exactly as in `apps/web/src/app/fonts.ts` today (`subsets`, `variable`, `preload: false` on Geist Mono), exporting `fontVariableClasses` and `fontVariables`. `git mv apps/web/src/lib/fonts/GeistVF.woff apps/web/src/lib/fonts/GeistMonoVF.woff` beside it.
- [ ] **Step 3:** Manifest: `exports` with `./next` only; `files` includes the `.woff` files; `next` at `16.4.3`; README `Owns:` line. For option B, the full scaffold following `frontend-shells` Task 1 (tsconfig, eslint and vitest configs, `package-structure.test.ts`, root `vitest.config.ts` project line, `workspace-conventions.md` inventory row).
- [ ] **Step 4:** Checks: package tests, lint, types, `pnpm boundaries` (no new exception), `pnpm deps`.

### Task 4: Switch the hosts

- [ ] **Step 1:** `apps/web`: `layout.tsx` and `global-error.tsx` import `fontVariables` from the package's `./next`; the mocks in `global-error.test.tsx` and `global-error.dom.test.tsx` point at the package path; delete `src/app/fonts.ts` and the now empty `src/lib/fonts/`.
- [ ] **Step 2:** `apps/docs`: replace the loaders in `src/app/layout.tsx` with the import; drop the `localFont` and `Inter` imports; delete `apps/docs/src/lib/fonts/` (both `.woff` files).
- [ ] **Step 3:** Storybook: replace the loaders in `.storybook/preview.tsx` with `document.documentElement.classList.add(...fontVariableClasses)`; the `../../web/src/lib/fonts` paths and the comment that points at `apps/web/src/app/fonts.ts` go.
- [ ] **Step 4:** Each host declares the dependency; `pnpm install` updates the lockfile's workspace entries only.
- [ ] **Step 5:** `grep -rn "next/font" apps packages --include=*.ts --include=*.tsx` finds the package file only.

### Task 5: Default labels

- [ ] The labels stay in `domain-preferences` (`domain` may not import `frontend`; spec section 3). Update the comment on `defaultFontLabels` to point at the fonts unit instead of `apps/web/src/app/layout.tsx`. No behaviour change, so the `fontLabel` tests stay as they are.
- _Superseded steps, kept for the record: "check the allowed direction with `pnpm boundaries`" and "make `fontLabel` and the fonts unit share one list". The matrix already answers the first, and the second is not possible in the allowed direction without moving the labels into the frontend._

### Task 6: ADR and docs

- [ ] Amend ADR-0003 item 4 and the 2026-10-17 amendment to name the package. Leave item 5 to the catalogue plan.
- [ ] `AGENTS.md` line 139: fonts are loaded in the fonts package; drop "add a selectable font by adding a loader there" only if the catalogue plan has not already rewritten it.
- [ ] Ownership map row; for option B, the workspace conventions inventory row (Task 3 Step 3).
- [ ] `packages/frontend/tokens/README.md` "Fonts" bullet: name the package that now loads Inter, Geist and Geist Mono.

### Task 7: Verify

- [ ] Fresh builds of web and docs, `pnpm build:storybook`, `pnpm verify`.
- [ ] Manual: web, docs and one story in light and dark mode; headings Geist, body Inter, code Geist Mono; reload with no fallback flash; no preload link for Geist Mono; a user font override still wins over each default.
- [ ] Report what ran, passed, failed and was not run.
