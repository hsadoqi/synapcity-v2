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
- ~~`GlobalPanelShell` imports `SettingsView` from another block, tying the shell to one panel's content.~~ Wrong on review: `SettingsView` frames the settings the caller passes; the panel's content is already a slot (see Task 3).

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

- [x] **Step 1: Failing test first.** `packages/frontend/shells/src/package-structure.test.ts` (copy the pattern from `frontend-ui`/`frontend-collection`): every component folder has a story, a test and an `index.ts`. Expected: fails until the package exists, passes with zero components. _(Done 2026-10-25. Also checks no loose component files, `next/*` only under `src/next/`, and that `exports` is exactly `.` and `./next` and resolves. Probe: a planted loose `components/probe.tsx` importing `next/link` failed both rules, then was removed.)_
- [x] **Step 2: Scaffold:** manifest, tsconfig, eslint and vitest configs, `README.md` with `Owns:` and the entry-point table, `src/index.ts`, `src/next/index.ts`. Add the Vitest project to the root config. `pnpm install`. _(Done. Changed on purpose: dependencies are dev tooling only, because Knip rejects declared dependencies nothing imports; `@synapcity/frontend-ui`, `react`, `next` and the React test tooling arrive in Task 2 with the first component, as do the Storybook `stories` glob and the `@source` lines (an empty glob makes Storybook warn), and the vitest config switches from the node `base` preset to `react` then. `tsconfig` sets `"types": ["node"]` like `frontend-forms`, for the structure test.)_
- [x] **Step 3: Inventory:** workspace-conventions row `frontend-shells` First code `2026-10-25 (exists, empty)` with a note in the milestone paragraph about the M5/M6 drift. _(Ownership map rows and the package checklist are updated as code moves, in Tasks 2 to 5 and 7.)_
- [x] **Step 4: Checks,** one script at a time: package `test` (5 passed), `lint`, `check-types`; root Vitest picks the project up; `pnpm boundaries` (1751 files, 32 workspaces, no violations); `pnpm deps` (clean); `pnpm format:check` (clean).
- [x] **Step 5: Checkpoint commit:** `feat(frontend-shells): add the package`.

### Task 2: Move the whole shell family unchanged (resequenced 2026-10-25)

The original Task 2 (four leaf components first) could not work: `root-shell` and `root-sidebar` import those four, and they stayed in `frontend-ui` until Task 4, so `frontend-ui` would have imported `frontend-shells`, the reverse of the allowed direction. The family is one import cluster (shell → header, footer, content, sidebar shell → root sidebar → search form and context switcher; sidebar shell and header → global panel). So Task 2 became one pure move of all of it, and Tasks 3 and 4 now change code that already lives in `frontend-shells`. The end state is the same.

- [x] **Step 1:** `git mv` `frontend-ui/src/blocks/{root-shell,sidebar-shell,context-switcher,search-form}` to `frontend-shells/src/components/` (40 files, history kept). The family's 35 self-imports became relative paths; every other `@synapcity/frontend-ui/*` import is unchanged (shells → ui is the allowed direction; `actions-toolbar` and `settings-view` stay in ui). The root entry exports the names ui's `blocks` entries exported. `frontend-ui`'s `blocks` barrel drops the four. Consumers re-pointed: `apps/web` `breadcrumb-trail.tsx`, `apps/docs` `layout.tsx`. Wiring: web and docs depend on the package; `@source` lines in web, docs and Storybook CSS; Storybook stories glob. Dependencies taken from `frontend-ui`'s exact versions (`react`, `next`, `lucide-react`, `react-resizable-panels`; dev: React test tooling, Storybook, `jsdom`, and `@synapcity/frontend-preferences` for the stories' and tests' mode provider); vitest now uses the `react` preset. No component code changed.
- [x] **Step 2:** The two R11 exceptions (`root-header`, `root-sidebar` importing `next/link`) re-pointed to the new paths in `packages/dev/boundaries/src/exceptions/exceptions.ts` with removal "frontend-shells plan Task 4", and mirrored as a named, self-expiring allowance in the package's structure test.
- [x] **Step 3: Checks.** Baseline before the move: `frontend-ui` 78 files, 635 tests (the family 10 files, 63 tests). After: `frontend-ui` 68 files, 562 tests (635 − 63 family tests − 10 per-folder structure checks); `frontend-shells` 11 files, 68 tests (63 + 5 structure). Type check and lint clean for both packages and for web, docs and Storybook. Web `src/app` and `src/components` tests 23 files, 142 tests, run from `apps/web` (running them from the repository root does not apply the web app's `@/` alias, a pre-existing quirk, not a regression). Storybook in Chromium with axe: the 10 moved story files, 24 tests. `pnpm boundaries` 1754 files, no violations; Prettier clean; Knip clean for this change (its only findings were three untracked `frontend-ui/src/blocks/countdown` files from another session, outside this task). Not run: full `pnpm verify`, e2e, build.
- [x] **Step 4:** Checkpoint commit.

### Task 3: Cancelled (2026-10-25)

Not needed. The premise was wrong: `GlobalPanelShell` already takes its content through `panel`, its header actions through `actions` and its settings through `settings`; `SettingsView` is only the frame it uses to show the caller's settings in place, not hard-wired content. Task 2 moved the file with no line changed.

**Rule for the global panel (owner decision, 2026-10-25):** it may be edited, but no change may remove or weaken any of its functionality or capability (resize, lock, pin, hide, toggle, keyboard and Escape handling, outside-click, focus return, header actions, in-place settings, `aria` names; ADR-0011), and it is not moved again without a stated reason. Any edit adds or keeps tests that pin the behavior it touches.

### Task 4: Convert the shell to slots and deduplicate the sidebar (the behavior-risky one)

- [x] **Step 1: Failing tests first** for the new contract: `SidebarShell` renders the `sidebar`, `header`, `footer` and `panel` it is given and nothing else; `RootShell` forwards them; links go through the injected link capability; with no sidebar content it renders no template navigation.
- [x] **Step 2: Deduplicate the sidebar stack (C8)** in `frontend-shells` (moved in Task 2). Four layers become two. `components/ui/sidebar` stays as the primitive. `SidebarProviders` (22 lines: a `TooltipProvider` and a `SidebarProvider` with `defaultOpen={false}` and a height class, one caller) is inlined into `SidebarShell` and deleted. `RootSidebar` is deleted as a component that owns content: `SidebarShell` takes a `sidebar` slot, and the host (or a small data-driven `SidebarNav` taking `groups`, `header` and `footer` props) supplies the content. The mobile-only Settings and mode-toggle footer that `RootSidebar` hard-wires moves to the host's sidebar content. `lib/sidebar-data.ts` is deleted with its test (no app renders it once web passes real or stand-in content); the `AccountLinks` type moves to shells per C4. Also delete the 40-line commented-out `RootShell` block in `root-shell.tsx`. The `next/link` uses move behind `./next` (a `ShellNavigationProvider`, the pattern `frontend-collection` uses) and the two R11 exceptions are removed from `packages/dev/boundaries/src/exceptions/exceptions.ts`.
- [x] **Step 3: Update the consumers** for the new props (already re-pointed to the package in Task 2): `apps/docs/src/app/layout.tsx` (renders `PublicShell`, no sidebar, so docs is unchanged), `apps/web/src/components/breadcrumbs`, Storybook stories. Remove the two R11 exceptions and the structure test's `PENDING_NEXT_IMPORTS` entries. `apps/web` passes its sidebar content in Task 6, not here; until then web passes the same template data so this task changes no pixels.
- [x] **Step 4:** Package, `frontend-ui` and web tests; `pnpm boundaries` (expect the R11 exceptions gone); Storybook shell stories.
- [x] **Step 5:** Checkpoint commit.

**Done 2026-10-25, on branch `refactor/shells-sidebar-slots`.** What changed:

- `SidebarShell` takes a `sidebar` slot and renders the tooltip and sidebar providers itself (collapsed to start, full viewport height); `SidebarProviders` is deleted, and its three assertions moved into the `SidebarShell` tests.
- `RootSidebar` no longer reads template data. It takes `header` and `groups` (`RootSidebarContent`), and `RootShell`/`AuthenticatedShell` take a `sidebar` prop and build it. Without one, the sidebar has no sections (tested: no template navigation appears).
- Links: `ShellLink` and `ShellNavigationProvider` (plain anchor with no provider) in `src/providers/shell-navigation`; `NextShellNavigation` in `src/next`, mounted in the web and docs root layouts. The logo, breadcrumb, sidebar item and small-screen Settings links use it. The two R11 exceptions and the structure test's temporary allowance are gone; `next/*` is imported only under `src/next/`.
- `frontend-ui/src/lib/sidebar-data.ts` is deleted. `apps/web/src/components/stand-in-sidebar` passes the same template content (generated from the deleted file, 4 sections, 25 items, 3 versions), so nothing a user sees changes; Task 6 replaces it.
- The commented-out legacy `RootShell` block is deleted.

Changed from the steps above, on purpose:

1. The small-screen Settings link and theme toggle stay in the shell (`RootSidebar`, from `account.settingsHref`), not in the host's content: they mirror the header's actions from md up, which the shell owns, so keeping both in one place keeps them in step.
2. `RootSidebar` stays as the data-driven sidebar (C7, names unchanged) instead of a new `SidebarNav`; hosts fill it through `RootShell`'s `sidebar` prop.
3. `AccountLinks` stays in `frontend-ui/lib/account-links`: ui's `user-menu` still uses it.
4. The header's Settings icon still uses `frontend-ui`'s `./next/link-button` entry. It is a ui entry, not a direct `next/*` import, so R11 allows it; making it a `ShellLink` with button styling is a follow-up.

Checks: shells 74 tests; web 64 files, 637 tests; boundary checker 148 of 149 and `pnpm boundaries` with one violation, both the other session's untracked `flip-countdown` cycle; `frontend-ui` structure-test failures and Knip's two unused files, all in that session's untracked blocks; type check and lint clean for shells, ui, boundaries, web, docs and Storybook; the shells stories in Chromium with axe, 11 files, 26 tests. Full `pnpm verify` runs in a clean worktree before the pull request.

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
| C3  | Withdrawn. The global panel already takes its content, actions and settings as props. Edits are allowed only under the rule in Task 3.                             | Review of the moved file (Task 3).                                                                                                                                   |
| C4  | `sidebar-data.ts` (shadcn template content) is deleted, not moved: docs renders no sidebar, so nothing needs it. `AccountLinks` becomes a type exported by shells. | `frontend-ui` stops carrying template content. Until Task 6, web's signed-in sidebar passes an explicit stand-in so Task 4 changes no pixels.                        |
| C8  | The sidebar stack is deduplicated to the `ui` primitive plus one `SidebarShell` with a `sidebar` slot; `SidebarProviders` and `RootSidebar` as content owners go.  | `SidebarProviders` has one caller and no logic of its own; `RootSidebar` is template content plus one mobile footer, and a shell that owns content cannot be reused. |
| C5  | Web's sidebar content (Task 6) is a separate, explicitly approved step.                                                                                            | It is the one visible change, and what the app's navigation should be is a product decision, not a refactor decision.                                                |
| C6  | Link handling follows `frontend-collection` (`./next` provider), not a `renderLink` prop.                                                                          | One pattern across packages; the boundary checker already models it.                                                                                                 |
| C7  | Names stay as they are (`RootShell`, `SidebarShell`, `BreadcrumbRootShell`).                                                                                       | Renaming is a terminology decision gated by the glossary; this plan moves code, not names.                                                                           |

## Recovery

Each task ends in one commit on a branch cut from `main`; recover with `git reset --hard <previous checkpoint>` on that branch, or delete the branch. Nothing is published, migrated or deleted outside the repository.
