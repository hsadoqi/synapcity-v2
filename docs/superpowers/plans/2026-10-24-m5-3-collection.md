# Milestone 5.3 frontend collection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The generic browse mechanics and the entity blocks Spaces reaches live in `@synapcity/frontend-collection`, framework-neutral, with links and navigation supplied by the host, every moved component with its own folder, test and story, and no behavior change.

**Architecture:** A new frontend package holds the collection components (today `apps/web/src/features/collection`), the screen-only entity shapes (`frontend-ui/src/types/entity.ts`) and the entity blocks (`frontend-ui/src/blocks/entity`). Its root entry is framework-neutral: components that open an item read `Link` and `push` from a `CollectionNavigationProvider` context whose default is a plain anchor. A `./next` entry supplies the Next.js binding, which `apps/web` mounts once in the owner layout. `frontend-ui`'s `link-button` moves behind a new `frontend-ui/next/*` entry. The move happens first as a whole, then each component group is split into unit folders with stories.

**Tech Stack:** TypeScript 7.0.2, React 19.3.0, Next.js 16.4.3 (only behind `./next`), Vitest 4.1.12, Storybook 10.6.3 (`@storybook/nextjs-vite`), Testing Library, lucide-react (as `frontend-ui` declares it), pnpm workspace.

**Spec:** [2026-10-23-m5-spaces-slice-design.md](../specs/2026-10-23-m5-spaces-slice-design.md), sections 4.3, 6, 7, 8 (M5.3), and the owner answers in section 9 (Q5 link capability with a `./next` binding, Q7 a story for every moved component).

## Global Constraints

- Package: `packages/frontend/collection` = `@synapcity/frontend-collection`, `version` `0.0.0`, `private`, `"type": "module"`. `exports`: `"."` → `./src/index.ts` and `"./next"` → `./src/next/index.ts`, nothing else. Entries point to source; no build step.
- Layout: kind folders under `src/` (`components/`, `providers/`, `utils/`, `types/`), one unit folder per component or helper holding `<unit>.tsx`, `<unit>.test.tsx` beside it, `<unit>.stories.tsx` for components, and `index.ts`; each kind folder has an `index.ts`. Cross-folder imports are relative and target the folder's `index.ts` (R7); no file imports a file inside another unit's folder.
- `next` is imported only under `src/next/` (R11). The root entry and everything it reaches stay framework-neutral. No server code, no `server-only`, no `@synapcity/dev-*` outside tests and stories (R8).
- Dependencies: `@synapcity/frontend-ui` and `@synapcity/domain-records` as `workspace:*`; `react` `19.3.0`, `lucide-react` and `next` `16.4.3` at the versions `frontend-ui` declares; dev dependencies as `frontend-ui`'s test and Storybook set. No version changes anywhere.
- `cn` comes from `@synapcity/frontend-ui/lib/utils`, never `@/lib/utils`. Primitives come through `@synapcity/frontend-ui/core/*` and generic components through `@synapcity/frontend-ui/components/*`.
- Q5 (owner decision, 2026-10-24): host-supplied link capability in the root entry, `./next` binding. Q7: every moved component gets a story as it moves; stories pass the Storybook a11y checks.
- Behavior is unchanged: markup, class names, copy, aria wiring, query semantics, layout and sort behavior. Existing tests keep their assertions; a moved test may change imports, mocks or file name, or gain cases.
- Consumers re-point in the same task that moves what they import; there are no re-export bridges at the end of any task.
- Tailwind scans the new package: `@source` lines are added where `frontend-ui/src` is already scanned (`apps/web/src/styles/globals.css`, `apps/storybook/styles/globals.css`).
- Commits only when the owner authorizes them. Conventional style, no attribution trailer, no GitHub closing keyword near an issue reference. Never quote the owner in any document or commit; record decisions as "owner decision, date".

## Review Focus

1. An item with an `href` renders a link that navigates by itself through the host `Link`, and `onOpen` is not called; with no provider the default anchor still carries the `href`. Tests in Tasks 1 and 2.
2. Opening an item from the grid or list calls the host `push` with the item's `href`, not `window.location` when a provider is present. Test in Task 2.
3. No `next` import survives outside `src/next/`, and nothing in the root graph reaches it. `pnpm boundaries` (R11) plus a planted-import probe in Task 8.
4. Classes used only by the moved components still generate: the package is scanned by both Tailwind entry points. Built-CSS check in Task 2.
5. Space detail still renders its sections with working item links under the host provider (spaces tests keep their assertions; the owner layout mounts the provider). Test in Task 2.

---

### Task 1: Package skeleton, navigation capability, `./next` binding, Storybook discovery

**Files:**

- Create: `packages/frontend/collection/{package.json,tsconfig.json,eslint.config.mjs,vitest.config.mts,vitest.setup.ts,README.md}` (copy `packages/frontend/ui`'s configs and its Vitest setup)
- Create: `src/index.ts`; `src/providers/index.ts`; `src/providers/collection-navigation/{collection-navigation.tsx,collection-navigation.test.tsx,collection-navigation.stories.tsx,index.ts}`; `src/next/{index.ts,next-collection-navigation.tsx,next-collection-navigation.test.tsx}`
- Modify: root `vitest.config.ts` (projects, after `packages/frontend/ui`); `apps/storybook/.storybook/main.ts` (stories glob); `apps/storybook/styles/globals.css` and `apps/web/src/styles/globals.css` (`@source` for the package); `apps/web/package.json` (workspace dependency); `pnpm-lock.yaml` via `pnpm install`

**Interfaces:**

- Produces (root entry):
  - `type CollectionLink = React.ComponentType<React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }>`
  - `type CollectionNavigation = { Link: CollectionLink; push(href: string): void }`
  - `CollectionNavigationProvider({ value, children }: { value: CollectionNavigation; children: React.ReactNode })` (starts with `'use client'`)
  - `useCollectionNavigation(): CollectionNavigation`: the provided value, or the default (`Link` renders `<a href>`, `push` calls `window.location.assign`)
- Produces (`./next` entry): `NextCollectionNavigation({ children }: { children: React.ReactNode })`: provides `next/link`'s `Link` and `useRouter().push`.

- [x] **Step 1: Write the failing tests.**
  - `collection-navigation.test.tsx`: with no provider, `useCollectionNavigation().Link` renders an anchor with the `href` and passes `className` and `aria-label` through; `push('/x')` calls `window.location.assign('/x')` (spy); with a provider, the supplied `Link` and `push` are used instead (Review Focus 1).
  - `next-collection-navigation.test.tsx`: mock `next/link` and `next/navigation`; inside `NextCollectionNavigation`, the hook's `Link` is the mocked link and `push('/y')` calls the mocked router's `push('/y')`.
- [x] **Step 2: Run them to see them fail.** `pnpm --filter @synapcity/frontend-collection test`. Expected: FAIL, modules not found.
- [x] **Step 3: Write the manifest and configs, add the Vitest project, run `pnpm install`** (registry access needed; `pnpm install --force` if the store empties).
- [x] **Step 4: Implement** the capability and the `./next` binding with the Interfaces above. A story shows the default anchor. `src/index.ts` and `src/providers/index.ts` re-export the names explicitly.
- [x] **Step 5: Storybook discovery.** Read the installed Storybook 10.6.3 documentation for the `stories` glob and the Vitest addon's project handling before editing; add `'../../../packages/frontend/collection/src/**/*.stories.@(ts|tsx)'` to `main.ts` beside the three existing globs; add the two `@source` lines. Expected: `pnpm test:storybook` discovers the new story (run it for this package only if the app supports a filter, else the whole suite).
- [x] **Step 6: Run the package checks.** `pnpm --filter @synapcity/frontend-collection test lint check-types`. Expected: pass.
- [x] **Step 7: Checkpoint commit** (if authorized): `feat(frontend-collection): add the navigation capability and the Next binding`.

### Task 2: Move the collection feature into the package

**Files:**

- Move: every file of `apps/web/src/features/collection/` into the package: `shared/types.ts` → `src/types/` (units as needed), `shared/query.ts` and its test → `src/utils/collection-query/`, `shared/record-item.ts` and its test → `src/utils/record-item/`, each `components/<group>/` folder → `src/components/<group>/` as it is (group folders and their DOM tests stay whole in this task); each group keeps an `index.ts`; `src/components/index.ts` and `src/index.ts` re-export exactly the names `features/collection/components/index.ts` and `shared/index.ts` export today
- Modify: the 36 consumer imports (`@/features/collection/shared` ×21, `…/components/collection-page` ×6, `…/components` ×5, `…/components/collection-index` ×3, `…/shared/query` ×1) to `@synapcity/frontend-collection`; `apps/web/src/app/[userId]/layout.tsx` (wrap `children` in `NextCollectionNavigation` from `@synapcity/frontend-collection/next`); `apps/web/src/architecture.test.ts` (remove the rule "collection depends on no other feature" and the mention of `features/collection`; removals only)
- Delete: `apps/web/src/features/collection/`

**Interfaces:**

- Consumes: Task 1's `useCollectionNavigation`, `NextCollectionNavigation`.
- Produces: the same public names as today from `@synapcity/frontend-collection`; no new names.

- [x] **Step 1: Capture the baseline.** Run `pnpm --filter web test` and `pnpm --filter web check-types`; note the test counts and that every `features/collection` DOM test passes before anything moves. Add the Review Focus tests below to the files they belong to before moving.
- [x] **Step 2: Write the failing tests** in the moved DOM tests (they run against the package once moved):
  - `item-open-button`: with `href`, the host `Link` receives it and `onOpen` is not called; without `href`, a button calls `onOpen` (Review Focus 1).
  - `collection-index`: opening an item that has an `href` calls the provider's `push` with it (Review Focus 2).
- [x] **Step 3: Move and adapt.** `git mv` the files; replace `next/link` in `item-open-button` with `useCollectionNavigation().Link`, `useRouter` in `collection-index` with `useCollectionNavigation().push`, the one `LinkButton` use with the capability's `Link` styled through `buttonVariants`, and `@/lib/utils` with `@synapcity/frontend-ui/lib/utils`. `RecordLike` (in the moved types) is built on `BaseRecord`'s fields imported from `@synapcity/domain-records` (design 4.3), so the base contract has one owner; a type assertion in `record-item.test.ts` pins that every `BaseRecord` is assignable to `RecordLike`. Inside the package, imports are relative through folder `index.ts` files. Tests that rendered Next navigation mocks now wrap in `CollectionNavigationProvider`.
- [x] **Step 4: Re-point consumers and mount the provider**, then delete the old folder. `rg -n "features/collection" apps packages -g '!**/node_modules/**' -g '!**/.next/**' -g '!docs/**'`. Expected: no matches except documentation to update in Task 8.
- [x] **Step 5: Run the affected checks.** `pnpm --filter @synapcity/frontend-collection test lint check-types`; `pnpm --filter web check-types lint test`. Expected: pass; web counts equal the baseline minus the moved collection tests.
- [x] **Step 6: Tailwind check (Review Focus 4).** `pnpm build`, then search the built CSS for a utility class used only inside the package. Expected: present. Record the class and file in the ledger.
- [x] **Step 7: Boundaries.** `pnpm boundaries`. Expected: pass, no new exception; the package imports `next` only under `src/next/`.
- [x] **Step 8: Checkpoint commit** (if authorized): `refactor(collection): move the collection feature into frontend-collection`.

### Task 3: Move the entity blocks and the screen-only entity shapes

**Files:**

- Move: `packages/frontend/ui/src/blocks/entity/*` (ten folders: `entity-content`, `entity-date`, `entity-details`, `entity-header`, `entity-icon`, `entity-item-card`, `entity-section`, `entity-shell`, `format-entity-date`, `recent-entity`) into `src/components/` (components) and `src/utils/` (`format-entity-date`, the icon map in `entity-icon`'s `entity-icons.ts` stays with its component); their tests and stories move with them; `packages/frontend/ui/src/types/entity.ts` → `src/types/entity/`
- Modify: the blocks that use `next/link` (`entity-item-card`, `entity-section`, `recent-entity-items`, `recent-entity-row`) to use `useCollectionNavigation().Link`; `entity-section`'s use of `link-button` the same way; `packages/frontend/ui/src/blocks/index.ts` (remove the entity re-exports); `packages/frontend/ui/package.json` (remove `./types/*` if nothing is left in `src/types`); `packages/frontend/ui/src/package-structure.test.ts` (removals only); the importers: `spaces` (`space-content.tsx`, `space-collections.tsx`, spaces tests), `documents` and `dashboards` fixture tests, the collection components that import `entity-icon` and `entity-date`, and every `@synapcity/frontend-ui/types/entity` import; `packages/dev/boundaries/src/exceptions/exceptions.ts` (delete the four R11 entries for the entity blocks and the R9 `entity-section` cycle entry); `apps/web/src/features/spaces/shared/types/index.ts` (its `export *` from `frontend-ui/types/entity` points at the package)

**Interfaces:**

- Consumes: Task 1's capability; Task 2's package layout.
- Produces: `EntityContent`, `EntityItemCard`, `EntitySection` and the other block names and the types `EntityKind`, `SpaceEntityItemKind`, `Space`, `DashboardItem`, `DocumentItem`, `SpaceItem`, `EntityItem` from the root of `@synapcity/frontend-collection`, unchanged in shape. `Space` moves to `features-spaces/contracts` in M5.4.
- `entity-details` has no consumer outside `frontend-ui`'s own stories today. It moves with the family and is listed here; it is not deleted (preservation policy).

- [x] **Step 1: Write the failing tests.** In the moved `entity-section`, `entity-item-card` and `recent-entity-*` tests, wrap in `CollectionNavigationProvider` and assert the links come from the host `Link` with the same `href`s and class names as before (Review Focus 5 for the Spaces sections).
- [x] **Step 2: Run them to see them fail** (`pnpm --filter @synapcity/frontend-collection test`). Expected: FAIL, modules not found or `Link` not from the provider.
- [x] **Step 3: Move and adapt.** `git mv` the folders; relative folder imports replace `@synapcity/frontend-ui/blocks/entity/...` (this removes the `entity-section` self-barrel cycle); swap the four `next/link` imports and the `link-button` use for the capability.
- [x] **Step 4: Re-point importers and delete the exceptions** listed under Files. Run `rg -n "blocks/entity|frontend-ui/types/entity" apps packages -g '!**/node_modules/**' -g '!docs/**'`. Expected: no matches.
- [x] **Step 5: Run the checks.** `pnpm --filter @synapcity/frontend-ui test lint check-types` (counts drop by the moved tests); `pnpm --filter @synapcity/frontend-collection test lint check-types`; `pnpm --filter web check-types lint test`; `pnpm boundaries`. Expected: pass; boundaries reports five fewer named exceptions and none added.
- [x] **Step 6: Checkpoint commit** (if authorized): `refactor(collection): move the entity blocks and shapes into frontend-collection`.

### Task 4: `link-button` behind `frontend-ui/next/*`

**Files:**

- Move: `packages/frontend/ui/src/components/link-button/` → `packages/frontend/ui/src/next/link-button/` (test, story and `index.ts` move with it)
- Modify: `packages/frontend/ui/package.json` (`exports`: add `"./next/*": "./src/next/*/index.ts"`; remove nothing else); `packages/frontend/ui/src/package-structure.test.ts` (add `next` as a component root with prefix `./next/`); the importers of `@synapcity/frontend-ui/components/link-button` (16 in `apps/web`, `skip-link` and `auth-buttons` inside `frontend-ui`) to `@synapcity/frontend-ui/next/link-button`; `packages/dev/boundaries/src/exceptions/exceptions.ts` (delete the `link-button` R11 entry)
- Test: `link-button.test.tsx` and `package-structure.test.ts`

**Interfaces:**

- Produces: `LinkButton` from `@synapcity/frontend-ui/next/link-button`, unchanged in props and markup; no export remains at `components/link-button`.

- [x] **Step 1: Write the failing test.** Extend `package-structure.test.ts` so the `next` root's folders each need a story and test and resolve through `./next/*`. Expected before the move: FAIL (no `next` root, `link-button` still under `components`).
- [x] **Step 2: Move, update `exports`, re-point importers, delete the exception.** `rg -n "components/link-button" apps packages -g '!**/node_modules/**' -g '!docs/**'`. Expected: no matches.
- [x] **Step 3: Run the checks.** `pnpm --filter @synapcity/frontend-ui test lint check-types`; `pnpm --filter web check-types lint test`; `pnpm boundaries`. Expected: pass; one fewer named exception, none added.
- [x] **Step 4: Checkpoint commit** (if authorized): `refactor(ui): move link-button behind frontend-ui/next`.

### Task 5: Unit folders and stories: states, create, tabs, view

**Files:** in `packages/frontend/collection/src/components/`: split `collection-states/` (`collection-empty`, `collection-loading`, `collection-no-results`), `collection-create/` (`create-actions`), `collection-tabs/` (`collection-tabs-bar`, `collection-tabs`) and `collection-view/` (`collection-grid`, `collection-header`, `collection-list`, `collection-view`) into one unit folder per component, each with `<unit>.tsx`, `<unit>.stories.tsx`, `<unit>.test.tsx` and `index.ts`; keep each group's `index.ts` re-exporting its units; split each group's existing DOM test into the unit tests it covers.

**Interfaces:** no new names; public exports unchanged.

- [x] **Step 1: Write the stories.** One per component: a default story with inline sample items and props, plus the states the component shows (for example empty and loading for the states group). Each passes the Storybook a11y checks.
- [x] **Step 2: Split** the units and their tests; imports between units go through folder `index.ts` files.
- [x] **Step 3: Run the checks.** `pnpm --filter @synapcity/frontend-collection test lint check-types`; `pnpm test:storybook`. Expected: pass; the DOM test count for these groups is unchanged and each component has a passing story.
- [x] **Step 4: Checkpoint commit** (if authorized): `refactor(collection): split states, create, tabs and view into units with stories`.

### Task 6: Unit folders and stories: item, displays, recent entity

**Files:** same treatment for `collection-item/` (`collection-grid-card`, `collection-list-row`, `item-actions-menu`, `item-icon-preview`, `item-icon`, `item-open-button`, `pinned-mark`; `item-props.ts` becomes a file in `types/`), `collection-displays/` (`collection-highlights`, `collection-section`, `compact-item-list`, `featured-items`, `item-chips`, `item-kind`, `pinned-panel`, `recent-carousel`; `display-props.ts` becomes a file in `types/`) and the two units in `recent-entity/` (`recent-entity-items`, `recent-entity-row`, which had no story).

**Interfaces:** no new names.

- [x] **Step 1: Write the stories** for each component (default plus meaningful variants: pinned and unpinned, with and without `href`, grid and list). Sample data is inline; no new fixtures.
- [x] **Step 2: Split** the units and their tests (the `collection-displays` tests cover nine components; divide them by component).
- [x] **Step 3: Run the checks** as in Task 5. Expected: pass; unchanged DOM test counts, every component has a passing story.
- [x] **Step 4: Checkpoint commit** (if authorized): `refactor(collection): split item, displays and recent entity into units with stories`.

### Task 7: Unit folders and stories: toolbar, filters, index, page

**Files:** same treatment for `collection-toolbar/` (`collection-search`, `collection-tag-chips`, `collection-toolbar`, `create-button`, `layout-toggle-group`, `sort-options-menu`), its `filters-menu/` (`active-filters`, `collection-filter-menu`, `filters-menu-content`, `filters-menu`), `collection-index/` and `collection-page/`.

**Interfaces:** no new names.

- [x] **Step 1: Write the stories.** `collection-index` and `collection-page` stories wrap in `CollectionNavigationProvider` with a stub `push`, so navigation is visible and testable; the toolbar stories show an active filter, a sort and each layout.
- [x] **Step 2: Split** the units and their tests.
- [x] **Step 3: Run the checks** as in Task 5. Expected: pass; unchanged DOM test counts, every component has a passing story.
- [x] **Step 4: Checkpoint commit** (if authorized): `refactor(collection): split toolbar, filters, index and page into units with stories`.

### Task 8: Records, boundary probes, repository gate

**Files:**

- Modify: `docs/architecture/reorganization-ownership-map.md` (rows `collection`, `Entity blocks`, `UI types`, `UI components` link-button note: M5.3 notes); `docs/architecture/workspace-conventions.md` (inventory: `frontend-collection` First code `M5.3 (exists)`; the sentence after the table); `docs/architecture/decisions/0014-multi-app-package-boundaries.md` (section 7 sentence); `docs/architecture/decisions/README.md` (the Storybook discovery item: closed, with the glob); `packages/features/README.md` and `packages/frontend/README.md` (links to moved code); `.agents/task-scope.md` (M5 entry: execution, exact creates, updates, deletes, verification, exceptions removed); the design's status line

- [x] **Step 1: Update the records.** No owner quotes; decisions as "owner decision, date".
- [x] **Step 2: Boundary probes** (planted, not committed): in a collection component add `import Link from 'next/link'`, expect an R11 violation; in the package root graph import `@synapcity/server-data`, expect R2 and R3; remove both and expect `pnpm boundaries` to pass. Record the outcomes. Confirm that at least six named exceptions were removed (four entity R11, the R9 cycle, `link-button`) and none added.
- [x] **Step 3: Repository gate.** `pnpm verify` with nothing else running (overlapping runs make the Settings dom tests time out). Expected: every stage passes, including Storybook. If the sandbox blocks Chromium, rerun outside it and report which run passed.
- [x] **Step 4: Report** per AGENTS.md section 9: what moved, what was preserved (markup, behavior, test assertions), what changed on purpose (links and navigation now come from a host capability; the owner layout mounts it), checks run and not run (manual: open Spaces, Documents, Dashboards and Home; filter, sort, switch layout, open an item from grid and list, keyboard and focus through the toolbar), remaining M5 work (5.4; Q2 shells if included).
- [x] **Step 5: Checkpoint commit** (if authorized): `docs: record milestone 5.3 collection`.

## Calls made (owner to check)

- **Move first, split second.** The feature moves whole in Task 2 and is split into unit folders in Tasks 5 to 7, so the move can be verified against the existing tests before any restructuring, and no temporary bridge is needed.
- **A neutral default for navigation.** With no provider, `Link` is a plain anchor and `push` assigns `window.location`. Stories and tests work without Next, and a host that forgets the provider still gets working links.
- **One provider in the owner layout.** `app/[userId]/layout.tsx` mounts `NextCollectionNavigation`; every collection and Space page is under it. Pages outside it fall back to plain anchors.
- **`link-button` leaves the `components/` wildcard** for a new `next/*` wildcard in `frontend-ui` rather than a single `./next` entry, so each unit stays a public folder like the rest of the package.
- **The whole entity family moves,** including `entity-details`, which has no consumer outside `frontend-ui`. Moving is not deleting.
- **`Space` moves with the shapes in M5.3** and leaves for `features-spaces/contracts` in M5.4.
- **Stories use inline sample data,** not new fixtures.

## Left open on purpose

- Whether `frontend-shells` joins M5 (Q2): not in this plan.
- Narrowing the remaining `frontend-ui` wildcards (`./lib/*`, `./hooks/*`, `./utils/*`): later migrations.
- A `dev-fixtures` collection factory: arrives with the first test that needs it.
