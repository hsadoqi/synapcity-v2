# Milestone 5.4 Spaces feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Space browsing and detail live in `@synapcity/features-spaces`, the first feature package, with `./contracts`, `./frontend` and `./server` entries; `apps/web` keeps only host bindings (pages, Server Actions, API routes, the source choice and the fixture-mode demo source), and `apps/web/src/features/spaces/` is gone.

**Architecture:** The Space detail view model and the pin result move to `./contracts`. The `SpaceSource` port, the Supabase-backed source and the `getSpace` loader move to `./server`, which takes the source as an argument and returns `null` for a missing Space, so the host calls `notFound()`. The Spaces components move to `./frontend` and receive the two Server Actions as props instead of importing them. The app selects the source (fixture mode or a request client), owns the demo records for fixture mode, and keeps its actions and routes. `frontend-collection`'s entity blocks stop depending on the Space shape: `EntityItem` becomes a structural type of the seven fields they read.

**Tech Stack:** TypeScript 7.0.2, React 19.3.0, Next.js 16.4.3 (app only; the feature imports no `next`), Vitest 4.1.12, Storybook 10.6.3 (`@storybook/nextjs-vite`), Testing Library, `server-only` 0.0.1, pnpm workspace.

**Spec:** [2026-10-23-m5-spaces-slice-design.md](../specs/2026-10-23-m5-spaces-slice-design.md), sections 4.4, 4.5, 4.6, 5, 8 (M5.4), the Q4 and Q6 answers in section 9, and calls C1, C4, C6 in section 10. Conventions: [workspace conventions](../../architecture/workspace-conventions.md), Entry points 3–9, Internal organization, R6, R8, R11.

## Global Constraints

- Package: `packages/features/spaces` = `@synapcity/features-spaces`, `version` `0.0.0`, `private`, `"type": "module"`. `exports`: `"./contracts"` → `./src/contracts/index.ts`, `"./frontend"` → `./src/frontend/index.ts`, `"./server"` → `./src/server/index.ts`. No root entry, no `./client`, no `./testing` (nothing needs a shared fake: loaders take the source as an argument, so tests pass a stub object). Entries point to source.
- Each entry is added in the task that first fills it, so no entry ever points at a missing file.
- `src/server/index.ts` starts with `import 'server-only';` and no other file imports it (R10). Nothing under `src/frontend/` or `src/contracts/` imports `src/server/`; nothing under `src/contracts/` imports `src/frontend/` (R6). The feature imports no `next` (R11), no app source (R1), and no `dev-*` package outside tests and stories (R8).
- Contracts import only domain (`@synapcity/domain-records`) and their own files: ADR-0014's matrix allows feature contracts `domain` and `feature-contracts` only. So `toCollectionItem` and `describeContents`, which build a `frontend-collection` item, live in `./frontend`, not `./contracts` as design 4.4 proposed.
- Dependencies at the versions the workspace already declares: `@synapcity/domain-records`, `@synapcity/frontend-collection`, `@synapcity/frontend-ui`, `@synapcity/server-data`, `@synapcity/server-supabase` (`workspace:*`), `react` `19.3.0`, `lucide-react` `^1.55.0`, `server-only` `0.0.1`. Dev dependencies: `frontend-collection`'s set, plus `@synapcity/dev-fixtures` (`workspace:*`). No version changes anywhere.
- Layout mirrors the entries (`src/contracts/`, `src/frontend/`, `src/server/`) with kind folders inside; one folder per unit with `index.ts`, its test and, for components, its story. Cross-folder imports are relative and target the folder's `index.ts` (R7).
- Behavior is unchanged: markup, class names, copy, aria wiring, every message, the `signedOut` flag, `api/spaces` status codes and headers, fixture-mode answers, RLS. Existing tests keep their assertions; a moved test may change imports, mocks or file name, or gain cases.
- Consumers re-point in the same task that moves what they import; no re-export bridges at the end of any task.
- Tailwind and Storybook scan the new package: an `@source` line beside the collection one in `apps/web/src/styles/globals.css` and `apps/storybook/styles/globals.css`, and a stories glob beside the collection one in `apps/storybook/.storybook/main.ts`.
- Commits only when the owner authorizes them. Conventional style, no attribution trailer, no GitHub closing keyword near an issue reference. Never quote the owner in any document or commit; record decisions as "owner decision, date".

## Review Focus

1. A missing Space, or someone else's, renders the 404 page and reads no documents or dashboards. `getSpace` returns `null` without listing items (Task 2), and the detail page calls `notFound()` on `null` (new page test, Task 2).
2. A real user's Space with nothing taking part shows both empty states and no sample items; sample items appear only in fixture mode. `getSpace` test (Task 2), demo-source binding test (Task 2), `SpaceContent` DOM test (Task 3).
3. Pinning through the host-supplied action: shown at once, put back with the error when saving fails, and the signed-out result still carries its message. The moved DOM test passes the action as a prop (Task 3); the action tests keep their assertions (Task 2).
4. Opening a Space records one view through the host-supplied action, and records again for a different Space. Moved `RecordSpaceView` test with the action as a prop (Task 3).
5. No server code is reachable from `./frontend` or `./contracts`. `pnpm boundaries` (R3, R6) plus planted-import probes (Task 4).

---

### Task 1: Package skeleton, Space view model in `./contracts`, structural `EntityItem`

**Files:**

- Create: `packages/features/spaces/{package.json,tsconfig.json,eslint.config.mjs,vitest.config.ts,vitest.setup.ts,README.md}` (configs as `packages/frontend/collection`; Vitest config merges `reactConfig` with `serverOnlyAlias` from `@synapcity/dev-vitest-config/server-only`); `src/contracts/index.ts`; `src/contracts/types/{space-detail.ts,set-space-pinned-result.ts,index.ts}`; `src/contracts/types/space-detail.test.ts` (type assertions).
- Modify: root `vitest.config.ts` (project `packages/features/spaces`); `pnpm-lock.yaml` (by `pnpm install`); `apps/web/package.json` (dependency `@synapcity/features-spaces`); `packages/frontend/collection/src/types/entity.ts`; the collection stories and tests that typed sample data as `Space`, `DocumentItem`, `DashboardItem` or `SpaceItem` (`entity-content`, `entity-details`, `entity-item-card`, `entity-section`, `entity-shell`, `recent-entity-items`, `recent-entity-row`, `collection-view`); every `apps/web/src/features/spaces` file importing `../shared/types` or `../../shared/types`.
- Delete: `apps/web/src/features/spaces/shared/` (its `index.ts` re-exported all of `frontend-collection` plus `SetSpacePinnedResult`).

**Interfaces:**

- Produces (`@synapcity/features-spaces/contracts`), names unchanged from today:
  - `type SpaceEntityItemKind = 'document' | 'dashboard'`
  - `type DocumentItem = { id: string; name: string; description?: string; updatedAt: string; createdAt: string; icon: string; kind: SpaceEntityItemKind }`; `type DashboardItem` the same; `type SpaceItem = DocumentItem | DashboardItem`
  - `type Space = SpaceEntity & { kind: 'space'; documents: DocumentItem[]; dashboards: DashboardItem[]; documentsTotal: number; dashboardsTotal: number }` (`kind` narrows from `EntityKind` to `'space'`, the only value `getSpace` sets)
  - `type SetSpacePinnedResult = { ok: true; pinnedAt: string | null } | { ok: false; error: string; signedOut?: boolean }`
- Produces (`frontend-collection`): `type EntityItem = { id: string; name: string; description?: string; icon: string; kind: EntityKind; createdAt: string; updatedAt: string }`. `EntityKind` stays. `Space`, `DocumentItem`, `DashboardItem`, `SpaceItem` and `SpaceEntityItemKind` leave the collection.

- [x] **Step 1: Write the type test.** `space-detail.test.ts` (non-production, so it may import the collection): `expectTypeOf<Space>().toExtend<EntityItem>()`, `expectTypeOf<DocumentItem>().toExtend<EntityItem>()`, `expectTypeOf<DashboardItem>().toExtend<EntityItem>()`. `check-types` is what runs these.
- [x] **Step 2: Write the manifest and configs, add the project, run `pnpm install`.** Expected: `pnpm --filter @synapcity/features-spaces check-types` FAILS (contracts not defined).
- [x] **Step 3: Implement** the contracts above and the structural `EntityItem`; re-type the collection stories and tests to `EntityItem`; re-point the app's Spaces files to `@synapcity/features-spaces/contracts` (for `Space`, items, `SetSpacePinnedResult`) and `@synapcity/frontend-collection` (for `EntityItem`, `EntityKind`); delete `features/spaces/shared/`.
- [x] **Step 4: Run the checks.** `pnpm --filter @synapcity/features-spaces check-types lint`; `pnpm --filter @synapcity/frontend-collection test lint check-types`; `pnpm --filter web check-types lint test`; `pnpm boundaries`. Expected: pass; collection 170 tests, web count unchanged; `rg -n "shared/types" apps/web/src/features/spaces` has no matches.
- [x] **Step 5: Checkpoint commit** (if authorized): `feat(features-spaces): add the package and the Space view model contracts`.

### Task 2: `./server` (port, Supabase source, `getSpace`) and the host's server bindings

**Files:**

- Create in the feature: `src/server/index.ts`; `src/server/types/{space-source.ts,index.ts}`; `src/server/server-space-source/` and `src/server/get-space/` (unit folders, as `server-supabase`'s `supabase-identity-provider/`), each moved with its test.
- Create in `dev-fixtures`: `src/spaces/space-entity.ts` with `createSpaceEntity` (moved from `createSpaceEntityFixture`) and its test; `src/index.ts` re-exports it; `package.json` gains `@synapcity/domain-records` `workspace:*`; the header comment in `src/index.ts` and the README note that Space is now an accepted contract (ADR-0012), so a named factory exists.
- Create in the app: `apps/web/src/lib/demo/space-source/{demo-spaces.ts,fixture-space-source.ts,index.ts}` with tests (Q6: the fixture-mode source and its records); `apps/web/src/lib/spaces/{get-space-source.ts,space-state-actions.ts,index.ts}` with tests (moved from `features/spaces/server/space-source/index.ts` and `server/actions/`); `apps/web/src/app/[userId]/home/spaces/[spaceId]/page.test.tsx`.
- Modify: the two Spaces pages (data calls only; components still come from `features/spaces/components` until Task 3); `app/api/spaces/route.ts`, `[spaceId]/route.ts` and their tests (import `getSpaceSource` from `@/lib/spaces`); the Spaces components that import the actions (`spaces-index`, `record-space-view`) and their DOM test mocks (path `@/lib/spaces`); `packages/features/spaces/package.json` (`./server` export, server dependencies); `apps/web/package.json` (drop `@synapcity/server-data` if Knip reports it unused).
- Modify: `apps/web/src/features/spaces/lib/fixtures/spaces/spaces.ts` keeps only `spaceItem` and `createSpaceFixture` (their last consumer, `space-content.tsx`, changes in Task 3), with `spaceItem` reading `DEMO_SPACES[0]` instead of `SPACE_FIXTURES[0]`.
- Delete: `apps/web/src/features/spaces/server/`; `SPACE_FIXTURES` and `createSpaceEntityFixture` (after their tests have moved).

**Interfaces:**

- Produces (`@synapcity/features-spaces/server`):
  - `interface SpaceSource` exactly as today's seven methods (`list`, `listSummaries`, `find`, `setPinned`, `recordView`, `listDocuments`, `listDashboards`); `type SetPinnedOutcome = { ok: true; pinnedAt: string | null } | { ok: false; error: unknown }`, now exported for implementers.
  - `serverSpaceSource(client: SupabaseServerClient): SpaceSource` (moved unchanged).
  - `getSpace(source: SpaceSource, spaceId: string): Promise<Space | null>`: `find`, then `null` without listing items when not found (C4), else both lists in parallel mapped to items with `kind` and totals equal to the list lengths (today's mapping).
- Produces (`dev-fixtures`): `createSpaceEntity(overrides?: Partial<SpaceEntity>): SpaceEntity`, validated with `spaceSchema`, defaults identical to today's `createSpaceEntityFixture`.
- Produces (app): `getSpaceSource(): Promise<SpaceSource>` (`@/lib/spaces`); `setSpacePinned(spaceId: unknown, pinned: unknown): Promise<SetSpacePinnedResult>` and `recordSpaceView(spaceId: unknown): Promise<void>` (`'use server'`, `@/lib/spaces/space-state-actions`); `fixtureSpaceSource(): SpaceSource` and `DEMO_SPACES`, `DEMO_DOCUMENTS`, `DEMO_DASHBOARDS` (`@/lib/demo/space-source`; the five sample Spaces and the two sample documents and dashboards from today's `SPACE_FIXTURES` and `spaceItem`, the latter stored directly as `BaseRecord[]`).
- No `getSpaces` loader and no `pinSpace`/`viewSpace` commands: each would forward one source call, which ADR-0008 rules out. The index page calls `(await getSpaceSource()).listSummaries()`; the actions keep their order (fixture check, input check, identity, write, log) and call `serverSpaceSource(client).setPinned` and `.recordView` as today.

- [x] **Step 1: Write the failing tests.**
  - `get-space.test.ts` (moved): keep every case except the not-found one, which becomes `it('returns null for a missing space and reads no items')` with `expect(await getSpace(source, 'missing')).toBeNull()` and `expect(source.listDocuments).not.toHaveBeenCalled()`; the source is a plain stub object passed as the argument, no module mock.
  - `page.test.tsx` (detail page): with `getSpaceSource` and `getSpace` mocked and `notFound` mocked to throw `NEXT_NOT_FOUND`, `await expect(SpaceShowPage({ params: Promise.resolve({ userId: 'u1', spaceId: 'missing' }) })).rejects.toThrow('NEXT_NOT_FOUND')` when `getSpace` resolves `null`; `requireOwner` is mocked to resolve.
  - `fixture-space-source.test.ts` (moved): keep every case; the documents/dashboards case asserts `DEMO_DOCUMENTS` and `DEMO_DASHBOARDS` equal today's two converted records each (ids `doc1`, `doc2`, `dash1`, `dash2`). Add the five `SPACE_FIXTURES` validity cases from `spaces.test.ts` (valid records, distinct ids, with and without description, fixed icon set, tagged and untagged) against `DEMO_SPACES`.
  - `get-space-source.test.ts` (moved `space-source.test.ts`): unchanged assertions, new paths.
  - `space-entity.test.ts` in `dev-fixtures`: the `createSpaceEntityFixture` cases from `spaces.test.ts` (independent deterministic records; overrides applied and validated).
- [x] **Step 2: Run them.** `pnpm --filter @synapcity/features-spaces test`; `pnpm --filter @synapcity/dev-fixtures test`; `pnpm --filter web exec vitest run src/lib/demo src/lib/spaces src/app`. Expected: FAIL, modules not found.
- [x] **Step 3: Implement and move.** `git mv` the files; add `./server` to `exports`; tests that used `SPACE_FIXTURES` for input build it from `createSpaceEntity` overrides beside the test. `spaces.test.ts` keeps only its `createSpaceFixture` case until Task 3 deletes the function.
- [x] **Step 4: Run the checks.** The three commands above, then `pnpm --filter web check-types lint test`, `pnpm --filter @synapcity/features-spaces lint check-types`, `pnpm boundaries`, `pnpm deps`. Expected: pass; no file under `apps/web/src/features/spaces/server/`; `rg -n "createSpaceEntityFixture|features/spaces/server" apps packages -g '!**/node_modules/**' -g '!**/.next/**'` has no matches outside docs.
- [x] **Step 5: Checkpoint commit** (if authorized): `refactor(spaces): move the Space source and loader into features-spaces/server`.

### Task 3: `./frontend` components, stories, and thin pages

**Files:**

- Create in the feature: `src/frontend/index.ts`; `src/frontend/components/{spaces-collection,spaces-index,space-preview,space-content,space-collections,record-space-view}/` (each `<unit>.tsx`, `<unit>.stories.tsx`, `index.ts`, and a test where one exists or is listed below); `src/frontend/utils/collection-item/` (moved with its test); `src/frontend/components/index.ts`, `src/frontend/utils/index.ts`.
- Modify: `packages/frontend/collection/src/components/entity-content/{entity-content.tsx,.test.tsx,.stories.tsx}` (Interfaces); the two Spaces pages and `loading.tsx` (import from `@synapcity/features-spaces/frontend`, pass the actions); `apps/storybook/.storybook/main.ts` (glob `'../../../packages/features/spaces/src/**/*.stories.@(ts|tsx)'`); the two `globals.css` files (`@source` for `packages/features/spaces/src`); `packages/features/spaces/package.json` (`./frontend` export).
- Delete: `apps/web/src/features/spaces/` (everything left), including `lib/fixtures/` with `createSpaceFixture`, `spaceItem` and the last `spaces.test.ts` case.

**Interfaces:**

- Consumes: `Space`, `SetSpacePinnedResult` (Task 1); the app actions (Task 2) as props, typed structurally so the feature never names the app.
- Produces (`@synapcity/features-spaces/frontend`):
  - `SpacesCollection({ spaces, userId, setSpacePinned }: { spaces: SpaceSummary[]; userId: string; setSpacePinned: (spaceId: string, pinned: boolean) => Promise<SetSpacePinnedResult> })` and `SpacesCollectionSkeleton()` in one unit folder (as `collection-page` holds `CollectionPage` and its skeleton); `SPACES_TITLE` and `SPACES_INTRO` stay private to that folder.
  - `SpacesIndex` takes the same `setSpacePinned` prop instead of importing the action; `saveSpacePinned` adapts it to the collection's `SetPinnedResult` as today.
  - `SpaceContent({ userId, space }: { userId: string; space: Space })`: `space` is required; the branch that built a sample Space when none was passed is removed (the detail page always passes one).
  - `SpaceCollections`, `SpacePreview` unchanged props. `RecordSpaceView({ spaceId, recordSpaceView }: { spaceId: string; recordSpaceView: (spaceId: string) => Promise<void> })`.
  - `toCollectionItem`, `describeContents` unchanged (used inside the frontend only; exported only if a consumer outside the package needs them, else private to `utils/`).
- Produces (`frontend-collection`): `EntityContent<T extends EntityItem>({ entity, getRecentItems, userId, children }: { entity: T; getRecentItems: (entity: T) => EntityItem[]; userId: string; children?: ReactNode })`. `entity` replaces `createFixture`: the ownership map says fixture creation does not remain a UI responsibility, and the only caller passed `() => spaceItem` real data through it. Markup unchanged.

- [x] **Step 1: Write the failing tests.**
  - Moved `spaces-collection.test.tsx`: the `vi.mock` of the action becomes a `setSpacePinned` spy passed as a prop; `FEW` and `MANY` are built with `createSpaceEntity` overrides carrying today's Writing, Learning and Personal values; every assertion unchanged.
  - Moved `record-space-view.test.tsx`: the spy is the `recordSpaceView` prop; same three cases.
  - New `space-content.test.tsx`: `it('shows both empty states and no items for a space with nothing in it')` renders `SpaceContent` with `documents: []`, `dashboards: []` and asserts the texts `No documents yet` and `No dashboards yet` and no item links; `it('links each item under the space')` asserts a document's `href` is `/u1/home/spaces/s1/documents/d1` and a dashboard's `/u1/home/spaces/s1/dashboards/b1` (`EntitySection` builds `${prefix}/${id}/${item.id}` from the `prefix` `SpaceCollections` passes).
  - `entity-content.test.tsx`: existing cases pass `entity` instead of `createFixture`.
- [x] **Step 2: Run them.** `pnpm --filter @synapcity/features-spaces test`. Expected: FAIL, modules not found.
- [x] **Step 3: Move and adapt.** `git mv` the components and tests; drop the fixture branch from `SpaceContent`; change `EntityContent`; the pages pass `setSpacePinned` and `recordSpaceView` from `@/lib/spaces/space-state-actions`; delete what is left of `apps/web/src/features/spaces/`.
- [x] **Step 4: Write the stories.** One per component, inside `CollectionNavigationProvider` with a stub `Link` and `push` where it renders links (as `collection-index.stories.tsx`): `SpacesCollection` (Default with several Spaces, Empty, Loading via the skeleton), `SpacesIndex` (Default; a play test that pins a Space and expects the `setSpacePinned` spy called with its id and `true`), `SpacePreview` (with and without tags), `SpaceContent` and `SpaceCollections` (with items, empty), `RecordSpaceView` (a play test expecting the `recordSpaceView` spy called once with the id). Sample data inline or from `createSpaceEntity`; actions are `fn()`. Each passes the a11y checks.
- [x] **Step 5: Run the checks.** `pnpm --filter @synapcity/features-spaces test lint check-types`; `pnpm --filter @synapcity/frontend-collection test lint check-types`; `pnpm --filter web check-types lint test`; `pnpm test:storybook`; `pnpm boundaries`; `pnpm deps`. Expected: pass; Storybook discovers the new stories; `rg -n "features/spaces" apps -g '!**/.next/**'` has no matches; web's test count equals the Task 2 count minus the moved Spaces tests.
- [x] **Step 6: Tailwind check.** `pnpm build`, then search the built CSS for a class used only inside `packages/features/spaces` (find one with `rg`; if every class is also used elsewhere, record that and skip). Record the class and file in the ledger.
- [x] **Step 7: Checkpoint commit** (if authorized): `refactor(spaces): move the Spaces components into features-spaces/frontend`.

### Task 4: Records, boundary probes, repository gate

**Files:**

- Create: `packages/features/spaces/README.md` content (written in Task 1 as a stub with `Owns:`; completed here with the entries, the props the host supplies and the rules).
- Modify: `docs/architecture/reorganization-ownership-map.md` (`spaces` row: M5.4 note; the `collection` and `Entity blocks` rows if `EntityItem`/`EntityContent` wording needs it); `docs/architecture/workspace-conventions.md` (inventory `features-spaces` First code `M5.4 (exists)`; the sentence after the table); `docs/architecture/decisions/0014-multi-app-package-boundaries.md` (section 7 sentence); `packages/features/README.md` (current implementation paragraph: link the package; the Space detail link moves); `packages/server/README.md` (the Space source link now points to `features-spaces/server`); `packages/dev/fixtures/README.md` (`createSpaceEntity`); `.agents/task-scope.md` (M5 entry: M5.4 execution, creates, updates, deletes, changed on purpose, exceptions); the design's status line.

- [x] **Step 1: Update the records.** No owner quotes; decisions as "owner decision, date".
- [x] **Step 2: Boundary probes** (planted, not committed, restored with `git diff` empty): in `src/frontend/components/space-preview/space-preview.tsx` add `import '../../../server';`, expect R6 (and R3); in the same file add `import { notFound } from 'next/navigation';`, expect R11; in `src/contracts/types/space-detail.ts` add `import type { CollectionItem } from '@synapcity/frontend-collection';`, expect R2. Record each outcome and the counts. Confirm no named exception was added (M5.4 removes none: the remaining M5-tagged ones belong to shells, deferred by Q2).
- [x] **Step 3: Repository gate.** `pnpm verify` with nothing else running. Expected: every stage passes. If the sandbox blocks Chromium, rerun outside it and say which run passed.
- [x] **Step 4: Report** per AGENTS.md section 9: what moved; what was preserved; what changed on purpose (`getSpace` returns `null` and the page calls `notFound()`; actions arrive as props; `EntityContent` takes `entity`; `SpaceContent` requires a Space; `Space.kind` is `'space'`); checks run and not run (manual, owner, live Supabase, design 4.6: open Spaces, filter, sort, search, switch layout, open a Space, pin and unpin, last-viewed order, a Space with and without items, fixture-mode index and detail); what remains of M5 (close-out; Q2 shells deferred).
- [x] **Step 5: Checkpoint commit** (if authorized): `docs: record milestone 5.4 Spaces feature`.

## Calls made (owner to check)

- **`toCollectionItem` and `describeContents` go to `./frontend`, not `./contracts`.** The matrix forbids feature contracts from importing frontend packages, and `toCollectionItem` returns a `frontend-collection` item.
- **No `getSpaces`, `pinSpace` or `viewSpace`.** Each would forward one source call (ADR-0008). `getSpace` stays because it composes three calls and a mapping. The design named all four; this keeps one.
- **No `./testing` entry.** Loaders take the source as an argument, so tests pass a stub object; stories use `createSpaceEntity` from `dev-fixtures`. The entry arrives with the first fake two consumers share.
- **`createSpaceEntity` in `dev-fixtures`; the five sample Spaces and the sample items in an app demo module.** Design 4.5 and Q6: production fixture mode cannot import `dev-*` (R8), tests and stories use contract-based factories. `dev-fixtures` gains a dependency on `domain-records` (dev may import anything; `domain-records` does not depend on `dev-fixtures`, so there is no cycle).
- **Host bindings in `apps/web/src/lib/spaces/` and `apps/web/src/lib/demo/space-source/`.** `features/spaces/` disappears from the app; actions stay `'use server'` app files (C1).
- **`EntityContent` takes `entity` instead of `createFixture`,** and `SpaceContent` requires a Space. The removed branch built a sample Space when no Space was passed, which no caller does.
- **`createSpaceFixture` and `spaceItem` are deleted** once `SpaceContent` no longer uses them; their sample documents and dashboards survive as `DEMO_DOCUMENTS` and `DEMO_DASHBOARDS` behind fixture mode (Q4).
- **The server units sit directly under `src/server/`** (`server-space-source/`, `get-space/`) with the port in `src/server/types/`, as `server-supabase` and `server-auth` place adapters and ports.

## Left open on purpose

- Q2 shells: still deferred.
- `EntityShell`'s header actions show "created", "renamed" and "archived" toasts without doing anything. That is demo behavior in a shared block; it is listed here, not changed.
- Whether copy belongs in domain schemas (design section 11).
