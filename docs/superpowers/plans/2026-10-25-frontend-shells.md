# `frontend-shells` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Status:** Approved (owner decision, 2026-10-25), including calls C1 to C8 and the Task 6 direction. Task 1 in progress. Task 6's sections, links and search remain direction that may change as the app grows.

**Goal:** Create `@synapcity/frontend-shells` (`packages/frontend/shells`) and move the one real app shell, its header, sidebar, global panel, context switcher, search form and breadcrumb trail into it, converted from hard-wired content to slots, so web, docs and Storybook consume one shell that the host fills.

**Governing:** [ADR-0014](../../architecture/decisions/0014-multi-app-package-boundaries.md) (one `frontend/shells` package; matrix), [ADR-0011](../../architecture/decisions/0011-resizable-global-panel-shell.md) (panel behavior stays in force), [M3 grouping design](../specs/2026-10-23-m3-package-grouping-design.md) section 7, [ownership map](../../architecture/reorganization-ownership-map.md) rows for `components/shells`, `components/breadcrumbs` and the RootShell/SidebarShell/ContextSwitcher/SearchForm blocks, [workspace conventions](../../architecture/workspace-conventions.md) (Composition, Boundary checks).

## Shell census (evidence, read at `f285d062`)

"Shell" names eight different kinds of thing. Only the first group is `frontend-shells`' job.

| Kind                            | Where it is                                                                                                                                                                                                                                                                             | Verdict                                                                                                                                                                                                                                                                           |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **App shell (the sidebar one)** | `frontend-ui/src/blocks/root-shell` (`RootShell`, `RootHeader`, `RootFooter`, `RootContent`, `GlobalPanelShell`), `blocks/sidebar-shell` (`SidebarShell`, `RootSidebar`, `SidebarProviders`), `blocks/context-switcher`, `blocks/search-form`; about 2,500 lines with tests and stories | **Moves.** Exactly one sidebar shell exists. Both `apps/web` (through `BreadcrumbRootShell`) and `apps/docs` (directly) mount it; nothing else renders a sidebar. Storybook has stories only.                                                                                     |
| Breadcrumb context              | `apps/web/src/components/breadcrumbs`: `BreadcrumbRootShell`, `SetBreadcrumbs`, route-derived `collection-labels`                                                                                                                                                                       | **Splits.** The trail context and `SetBreadcrumbs` move (the file's own TODO asks whether it belongs in the shared package; yes, in shells). `collection-labels` is route policy and stays in the app.                                                                            |
| Centred page frames             | `apps/web/src/components/shells`: `AuthPageShell` (13 lines), `MessagePage` (48 lines)                                                                                                                                                                                                  | **Moves** as page frames (ownership map).                                                                                                                                                                                                                                         |
| Settings frames                 | `features-settings`: `SettingsPageShell` (22 lines), `SettingsTabShell` (139 lines; has its own "sidebar when roomy" layout)                                                                                                                                                            | **Stay for now.** They already sit in the feature package and nothing else uses them. Revisit when a second consumer appears; `SettingsTabShell` is the likeliest second implementation of a sidebar layout and should be compared with the app sidebar then, not merged blindly. |
| Feature content wrappers        | `AuthShell` (auth card + heading), `ProfileFormShell` (form runner), `HomeShell` (11-line wrapper), `EntityShell` (collection), `WidgetShell` (dashboards, 370 lines)                                                                                                                   | **Not shells in this sense.** They wrap product content, so they stay with their features (M7.4/M7.5, M8, M9). Renaming some of them is a separate, terminology-gated question.                                                                                                   |
| UI primitive                    | `components/ui/sidebar` (shadcn `Sidebar*`)                                                                                                                                                                                                                                             | Stays in `frontend-ui`; shells builds on it.                                                                                                                                                                                                                                      |

**What is not integrated (why the owner's worry is right):**

- `RootSidebar` renders `lib/sidebar-data.ts`, the shadcn documentation template ("Getting Started", "Installation", "Build Your Application", versions `1.0.1`, `1.1.0-alpha`). It shows only in the signed-in shell of `apps/web`: the sidebar renders only when `RootShell` receives `account` (`AuthenticatedShell`), and `apps/docs` passes none, so docs renders the sidebar-less `PublicShell`. The app's real navigation (home, spaces, documents, dashboards, settings) is not in the sidebar at all.
- `SidebarShell` and `RootShell` hard-wire `RootSidebar`, `RootHeader`, `RootFooter` and `AccountLinks`; only `GlobalPanelShell` already takes slots.
- `RootHeader` and `RootSidebar` import `next/link` and carry the only two R11 exceptions among the shell blocks.
- `GlobalPanelShell` imports `SettingsView` from another block, tying the shell to one panel's content.

## Global Constraints

- **Package:** `packages/frontend/shells`, `@synapcity/frontend-shells`, `private`, source-pointing `exports`. Entry points: `.` (portable) and `./next` (the Next.js link binding), the same shape as `frontend-collection`. Unit folders with `index.ts`, one folder per component with `name.tsx`, `name.stories.tsx`, `name.test.tsx`, `index.ts`.
- **Direction:** shells depends on `frontend-ui` and never the reverse. No imports of `domain-*`, `server-*` or `features-*`. Rule R11: `next/*` only under `src/next/`. Consumers use its `exports` (R5).
- **Composition:** content through `children` and named slots, not boolean flag sets (workspace conventions, Composition).
- **Move, then change.** Each move is `git mv` with import specifiers only, tests green, committed. Slot conversion is a separate task with its own failing tests first. No re-export bridges left in `frontend-ui`.
- **Preserve:** skip link, landmarks (one `main`), focus order, sidebar collapse/keyboard shortcut, panel resize/lock/pin behavior, cookie or storage keys for sidebar state, `data-fill-viewport` handling, dark/light look.
- **Out of scope:** the settings frames, feature content wrappers, `components/ui/sidebar`, the `Resizable` primitive's location (see C2), real navigation content design, any new route.
- **Process:** a plan task scope entry in `.agents/task-scope.md` before Task 1; commits and pushes only when authorized; no attribution trailer in files; never quote the owner.

## Tasks

### Task 1: Create the package (no code moved)

- [ ] **Step 1: Failing test first.** `packages/frontend/shells/src/package-structure.test.ts` (copy the pattern from `frontend-ui`/`frontend-collection`): every component folder has a story, a test and an `index.ts`. Expected: fails until the package exists, passes with zero components.
- [ ] **Step 2: Scaffold:** manifest, tsconfig, eslint and vitest configs, `README.md` with `Owns:` and the entry-point table, `src/index.ts`, `src/next/index.ts`. Dependencies as `frontend-collection` declares them plus `@synapcity/frontend-ui` (workspace). Add the Vitest project to the root config, the package's `src` to the Storybook `stories` globs, and an `@source` line to `apps/web` and `apps/docs` global CSS. `pnpm install`.
- [ ] **Step 3: Inventory:** workspace-conventions row `frontend-shells` First code `M7.4-prereq (exists)` (fixing the M5/M6 drift), ownership map rows updated, `package-creation-checklist.md` ticked.
- [ ] **Step 4: Checks,** one script at a time: package `test`, `lint`, `check-types`; `pnpm boundaries`; `pnpm deps`. Expected pass.
- [ ] **Step 5: Checkpoint commit** (if authorized): `feat(frontend-shells): add the package`.

### Task 2: Move the parts with no host coupling

- [ ] **Step 1:** `git mv` `root-content`, `root-footer`, `search-form`, `context-switcher` (restyled in #70; take it exactly as it is) into `packages/frontend/shells/src/`; re-point their importers (`rg -l "frontend-ui/blocks/(root-shell/root-content|root-shell/root-footer|search-form|context-switcher)"`); delete the `frontend-ui` exports for them.
- [ ] **Step 2:** package tests, `frontend-ui` tests, web tests that render them, Storybook for the moved stories. Expected: same counts as before the move.
- [ ] **Step 3:** Checkpoint commit.

### Task 3: Move the global panel

- [ ] **Step 1:** Write the characterization test first if the existing tests do not pin: resize, lock, pin, hide, keyboard, `aria` names (the panel's behavior is the ADR-0011 contract).
- [ ] **Step 2:** `git mv` `global-panel`; make its content a slot (it imports `SettingsView` from `blocks/settings-view` today; the host or `features-settings` passes `SettingsView` in, per C3). `react-resizable-panels` moves to the shells manifest only if no `frontend-ui` file still imports it (C2).
- [ ] **Step 3:** Run panel tests, Storybook global-panel stories, the 3 global-panel e2e tests that already fail on `main` (record before and after; do not fix them here).
- [ ] **Step 4:** Checkpoint commit.

### Task 4: Move the shell and convert it to slots (the behavior-risky one)

- [ ] **Step 1: Failing tests first** for the new contract: `SidebarShell` renders the `sidebar`, `header`, `footer` and `panel` it is given and nothing else; `RootShell` forwards them; links go through the injected link capability; with no sidebar content it renders no template navigation.
- [ ] **Step 2: Deduplicate the sidebar stack (C8)** while moving `root-shell` and `sidebar-shell` (with `root-header`). Four layers become two. `components/ui/sidebar` stays as the primitive. `SidebarProviders` (22 lines: a `TooltipProvider` and a `SidebarProvider` with `defaultOpen={false}` and a height class, one caller) is inlined into `SidebarShell` and deleted. `RootSidebar` is deleted as a component that owns content: `SidebarShell` takes a `sidebar` slot, and the host (or a small data-driven `SidebarNav` taking `groups`, `header` and `footer` props) supplies the content. The mobile-only Settings and mode-toggle footer that `RootSidebar` hard-wires moves to the host's sidebar content. `lib/sidebar-data.ts` is deleted with its test (no app renders it once web passes real or stand-in content); the `AccountLinks` type moves to shells per C4. Also delete the 40-line commented-out `RootShell` block in `root-shell.tsx`. The `next/link` uses move behind `./next` (a `ShellNavigationProvider`, the pattern `frontend-collection` uses) and the two R11 exceptions are removed from `packages/dev/boundaries/src/exceptions/exceptions.ts`.
- [ ] **Step 3: Re-point the consumers:** `apps/docs/src/app/layout.tsx` (renders `PublicShell`, no sidebar, so docs is unchanged), `apps/web/src/components/breadcrumbs`, Storybook stories. `apps/web` passes its sidebar content in Task 6, not here; until then web passes the same template data so this task changes no pixels.
- [ ] **Step 4:** Package, `frontend-ui` and web tests; `pnpm boundaries` (expect the R11 exceptions gone); Storybook shell stories.
- [ ] **Step 5:** Checkpoint commit.

### Task 5: Breadcrumb trail and page frames

- [ ] **Step 1:** Move `BreadcrumbRootShell`/`SetBreadcrumbs` (rename only if the glossary allows; otherwise keep the names) into shells; `collection-labels` stays in `apps/web`. Move `AuthPageShell` and `MessagePage` as page frames; re-point the 8 importers (`auth/layout`, `error`, `global-error`, `not-found`, the three `home/*/error` files, `auth/delete-account/page`). Keep `MESSAGE_HEADING_ID` and the focus behavior.
- [ ] **Step 2:** Tests: breadcrumb dom test and the message-page and auth-page tests move with the code.
- [ ] **Step 3:** Checkpoint commit.

### Task 6: Real navigation in the sidebar (needs the owner's go-ahead)

Everything in this task is owner direction (2026-10-25), not a fixed decision; the owner expects it to change as the app grows. Build it so the content is data the host passes in, and changing the sections means changing that data, not the shell.

- [ ] **Step 1: Context switcher rule.** The `ContextSwitcher` at the top of the sidebar (today it switches template "versions") shows the active context, which follows the route:

  | Route                                     | Context shown                                       |
  | ----------------------------------------- | --------------------------------------------------- |
  | `/home`                                   | Home                                                |
  | `/home/spaces`                            | Spaces                                              |
  | `/home/spaces/<spaceId>`                  | The Space's name                                    |
  | A document or dashboard nested in a Space | The Space's name (unchanged while inside it)        |
  | `/home/documents`, `/home/dashboards`     | Documents, Dashboards                               |
  | A document or dashboard outside any Space | Documents, Dashboards (assumed; confirm with owner) |

  Source of truth: the page's existing `SetBreadcrumbs` trail, not a second mechanism. The context is the trail's Space entry when there is one, otherwise its collection entry, otherwise Home, so the sidebar and the breadcrumbs cannot disagree. A crumb may need a `kind` (`collection` or `space`) so the shell can pick the context without parsing labels; that is a small contract change to `RootBreadcrumb`. Gap found: `/home/documents` sets no breadcrumbs today; it needs one before this rule works there.

- [ ] **Step 2: Sidebar body.** Two parts:
  - **Core section, always on top:** the main destinations, such as Home and Settings. Only link routes that exist and are decided (ADR-0013 link check). Inbox is included as a placeholder linking to `#` (owner decision, 2026-10-25): no Inbox route exists and capture/intake is an open product decision in `PRODUCT.md`, so the entry carries no route until that is decided. Any other not-yet-built destination follows the same rule. Check that the `apps/web` link check accepts `#`; if it does not, allow `#` explicitly there rather than adding a route.
  - **Context sections below:** chosen by the active context. Examples to confirm when building: in a Space, sections for that Space's documents and dashboards; in Documents or Dashboards, recent or pinned items of that kind; on Home, nothing extra or recents. Build from the host's path helpers (`homePathFor`, `spaceItemPath`, `documentPathFor`, `dashboardPathFor`, settings).
  - The shell takes `sections: { label?, items }[]` and renders them with the `ui` sidebar primitives (the data-driven `SidebarNav` from Task 4). This is the visible change; nothing earlier in the plan alters what a user sees.
- [ ] **Step 3: Search (open).** Either the inline `SearchForm` at the top of the sidebar (as today, but it searches nothing yet) or a magnifying-glass button that opens a command palette (with a keyboard shortcut). The palette needs a component that is not installed (`pnpm ui:add command`) and a search source, which does not exist; so for this task: keep or hide the inline form, and record the palette as its own follow-up.
- [ ] **Step 4: Tests:** one per row of the context table (render with that trail, assert the switcher label); the core section always present; context sections switch with the context; the missing documents breadcrumb.
- [ ] **Step 5:** `apps/docs` keeps its own content (its real doc navigation is a separate decision).
- [ ] **Step 6:** E2E: the sidebar links reach their routes; the link check walks only decided routes (ADR-0013).

### Task 7: Records and verification

- [ ] **Step 1:** Update the README, workspace-conventions, ownership map rows (`components/shells`, `components/breadcrumbs`, the four blocks), ADR-0011's placement note ("moved"), the M5 Q2 follow-up, `.agents/task-scope.md`. No owner quotes.
- [ ] **Step 2: Boundary probes** (planted, then removed, `git diff` empty): `import 'next/link'` outside `src/next` should report R11; a `@synapcity/features-*` import should report the matrix rule; a deep import into `shells/src/...` should report R5. Record any probe that does not fire (the checker has missed expected violations before).
- [ ] **Step 3: Repository gate:** `pnpm verify` with nothing else running and no server left on :4000 or :8080.
- [ ] **Step 4: Manual,** both apps: sidebar collapse and the keyboard shortcut; panel resize, lock and pin; skip link; one `main`; breadcrumbs change between routes; auth, 404 and error pages; light and dark; narrow width.
- [ ] **Step 5: Report** per AGENTS.md section 9.

## Calls made (owner to check)

| #   | Call                                                                                                                                                               | Why                                                                                                                                                                  |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1  | Scope is the app shell family plus breadcrumbs and the two centred page frames. Settings frames and feature content wrappers stay where they are.                  | The census shows one app shell and several look-alikes that wrap product content. Folding them in would turn a move into a redesign.                                 |
| C2  | `components/ui/resizable` stays in `frontend-ui` for now, and `GlobalPanelShell` keeps using it.                                                                   | The design docs suggested this; the owner did not decide it, so it stays open. If the panel is the only user, moving the primitive's dependency later is cheap.      |
| C3  | The global panel takes its content as a slot instead of importing `SettingsView`.                                                                                  | The shell must not know which panel content it hosts (ADR-0011 keeps the behavior; content is the caller's).                                                         |
| C4  | `sidebar-data.ts` (shadcn template content) is deleted, not moved: docs renders no sidebar, so nothing needs it. `AccountLinks` becomes a type exported by shells. | `frontend-ui` stops carrying template content. Until Task 6, web's signed-in sidebar passes an explicit stand-in so Task 4 changes no pixels.                        |
| C8  | The sidebar stack is deduplicated to the `ui` primitive plus one `SidebarShell` with a `sidebar` slot; `SidebarProviders` and `RootSidebar` as content owners go.  | `SidebarProviders` has one caller and no logic of its own; `RootSidebar` is template content plus one mobile footer, and a shell that owns content cannot be reused. |
| C5  | Web's sidebar content (Task 6) is a separate, explicitly approved step.                                                                                            | It is the one visible change, and what the app's navigation should be is a product decision, not a refactor decision.                                                |
| C6  | Link handling follows `frontend-collection` (`./next` provider), not a `renderLink` prop.                                                                          | One pattern across packages; the boundary checker already models it.                                                                                                 |
| C7  | Names stay as they are (`RootShell`, `SidebarShell`, `BreadcrumbRootShell`).                                                                                       | Renaming is a terminology decision gated by the glossary; this plan moves code, not names.                                                                           |

## Recovery

Each task ends in one commit on a branch cut from `main`; recover with `git reset --hard <previous checkpoint>` on that branch, or delete the branch. Nothing is published, migrated or deleted outside the repository.
