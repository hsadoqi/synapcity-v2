# Milestone 5: Collection and Spaces pathfinder slice

**Status:** Proposed. The owner approved recording this design on 2026-10-23 without answering section 9, so Q1 (sub-milestones) and Q2 (defer shells) proceed on their recommendations as the stated defaults. Q3 and Q6 were answered on 2026-10-23 with the recommendations; Q4, Q5 and Q7 remain open and are asked before M5.2 and M5.3. The design itself is not accepted. M5.1 (record contracts) is implemented as of 2026-10-24. M5.1 plan: [2026-10-23-m5-1-record-contracts.md](../plans/2026-10-23-m5-1-record-contracts.md).
**Date:** 2026-10-23
**Branch:** to be created from `main` at `c3cd87a6` (M4 squash-merged as #58; identical to the M4 branch in every path cited here). Proposed name `chore/reorganization-m5-spaces-slice`.
**Governing decisions:** [ADR-0014](../../architecture/decisions/0014-multi-app-package-boundaries.md) (categories, matrix, base record contract timing in section 4), ADR-0012 (Space persistence), ADR-0013 (Documents and Dashboards persistence, participation tables), [ADR-0006](../../architecture/decisions/0006-authentication-with-supabase.md) (fixture mode never verified), [ADR-0008](../../architecture/decisions/0008-auth-actions-and-server-operations.md) (request-bound clients, no forwarding wrappers), the [workspace conventions](../../architecture/workspace-conventions.md) (inventory, entry points, organization, boundary checks R0–R11), the [M4 design](2026-10-23-m4-server-identity-boundary-design.md) (identity boundary M5 builds on).
**Sequence:** roadmap sequence (owner decision, 2026-10-23): M4 server identity, **M5 Collection and Spaces**, M6 Preferences and Settings, M7 Auth and Account, M8 Documents and Dashboards, M9 Home, M10 sweep.

## 1. Intent

M5 is the pathfinder slice. It is the first time a whole user-visible capability, Spaces browsing and detail, moves out of `apps/web` through all four layers (domain, server, frontend, feature) with its real consumers. Its job is to prove the package pattern end to end so that M6–M9 copy it, and to make the decisions that only the first slice can make: the base record contract, how a repository receives a request client, how fixture mode binds at the host, how shared presentation reaches Next.js navigation, and how stories in new packages are discovered.

Behavior does not change. Every Spaces page, action, API route and fixture-mode response looks and answers exactly as today.

## 2. Goals, non-goals, anti-goals

**Goals**:

- `domain-records` exists with the base record contract and the Space module; there is one definition of the ten shared record fields.
- `server-data` exists with the Space repository and the pin/view writes, receiving a request-bound client from the host.
- `frontend-collection` exists with the browse mechanics from `features/collection` and the generic entity blocks from `frontend-ui`; Documents, Dashboards and Home consume it from the package.
- `features-spaces` exists with Space browse/detail composition, collection mapping, copy and commands.
- The app's Spaces routes, actions and API routes become thin host bindings.
- The boundary exception list shrinks (section 6).

**Non-goals**:

- Documents and Dashboards repositories, actions and features (M8). Their importers only switch to the moved collection package and, if Q3 is accepted, to the shared base contract.
- Home aggregation (M9). Home only re-points its collection imports.
- App shell (`RootShell`, sidebar, header, user menu) unless Q2 says otherwise.
- Any change to development fixture mode semantics, RLS policies, schema, or persisted shapes.
- Terminology: "Space" stays a provisional working label (glossary). Package and module names are the ones already accepted in the inventory; no new name is derived from it.

**Anti-goals** (failure even if it works)

- A fixture record returned from a path that is not explicitly fixture mode, or a fixture success that looks like a saved write.
- A second definition of the shared record fields left behind "for now" without a recorded bridge and removal condition.
- A repository that builds its own client or reads `cookies()`/env (host concerns, ADR-0014 section 3).
- A forwarding wrapper around a Supabase call that adds no contract (ADR-0008 item 8).
- Framework (`next/*`) imports in a frontend package root entry.
- Visible change: copy, layout, sort order, empty states, the "Nothing in it yet" detail line, 404s, the signed-out flag.

## 3. Current state (evidence, worktree at `6f542782`, 2026-10-23)

| Source family                            | Files (non-test)                                      | What it holds                                                                                                                                                                                                                                                                                                                                                                  | Consumers                                                                                                                                                    |
| ---------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `frontend-ui/src/types/entity-schema.ts` | 1                                                     | `createSpaceSchema` (with form copy), `updateSpaceSchema`, `spaceSchema` (ten fields)                                                                                                                                                                                                                                                                                          | re-exported by `features/spaces/shared/schema`                                                                                                               |
| `frontend-ui/src/types/entity.ts`        | 1                                                     | `SpaceEntity`, inputs (canonical) and `Space`, `DocumentItem`, `DashboardItem`, `EntityKind`, `EntityItem` (screen-only)                                                                                                                                                                                                                                                       | spaces, collection (`recent-carousel`, `item-icon`), documents/dashboards fixture tests, entity blocks                                                       |
| `lib/owned-records`                      | 1                                                     | `ownedRecordSchema` (same ten fields, no copy), list/pin queries for documents and dashboards                                                                                                                                                                                                                                                                                  | documents and dashboards features (22 files)                                                                                                                 |
| `features/spaces/server`                 | 4                                                     | `space-repository` (`listSpaces`, `listSpaceSummaries`, `findSpace`, each with an inline `fixtureModeEnabled()` branch and its own `createClient()`), `get-space` (adds **sample** documents/dashboards from fixtures, even for real users), `get-spaces`, `actions/space-state-actions` (`setSpacePinned`, `recordSpaceView`, inline Supabase writes, M4 `getCallerIdentity`) | Spaces pages, `api/spaces` routes                                                                                                                            |
| `features/spaces/components`, `lib`      | 12                                                    | index, collection mapping, preview, skeleton, copy, detail content (uses `EntityContent`, `EntityItemCard`, `EntitySection`), `RecordSpaceView`, fixtures                                                                                                                                                                                                                      | Spaces pages                                                                                                                                                 |
| `features/collection`                    | 37 components + `shared/` (query, record-item, types) | generic browse mechanics; Next coupling in 2 files (`useRouter` in `collection-index`, `Link` in `item-open-button`); `@/lib/utils` in 4                                                                                                                                                                                                                                       | spaces, documents, dashboards, home (≈30 files)                                                                                                              |
| `frontend-ui/src/blocks/entity`          | 10 blocks, 8 stories                                  | cards, sections, dates, icon, shell, details, header, recent rows                                                                                                                                                                                                                                                                                                              | Spaces detail uses 3 (`EntityContent`, `EntityItemCard`, `EntitySection`); `entity-icon`/`entity-date` reached from collection; several have no app consumer |

Observations that shape the design:

- The Space schema and `ownedRecordSchema` share all ten fields exactly; only the Space create schema carries messages.
- `get-space` returns the same sample documents and dashboards for every real Space ("Placeholder until documents and dashboards are persisted (ADR-0013)"). Documents and dashboards are now persisted, so the placeholder's own removal condition appears met. This is the "fixture-backed production-path composition" nonconformity in the ownership map.
- No app production file imports `@synapcity/dev-fixtures` today; fixture mode reads feature-local fixtures. R8 forbids production files from importing `dev-*`.
- Storybook (`apps/storybook/.storybook/main.ts`) only globs `packages/frontend/ui/src/**`. Collection components have DOM tests but no stories; the conventions' unit rule gives each component folder a story.
- `server-supabase` deliberately has no `SupabaseServerClient` type export yet; M4 deferred it to "the first consumer (M5)".

## 4. Design

### 4.1 Contracts: `domain-records`

Root `.` plus module subpaths only if a consumer needs a narrower interface. Runtime dependency `zod` (already allowlisted by R4).

- `src/base/`: `baseRecordSchema` with the ten fields (`id`, `ownerId`, `name`, `description?`, `icon` as a Lucide identifier, `tags`, `createdAt`, `updatedAt`, `pinnedAt` nullable default null, `lastViewedAt` nullable default null) and `BaseRecord`. No messages. Proposed: also the pure rule `isPinned(record)` only if a consumer needs it (today `itemFromRecord` inlines `pinnedAt !== null`).
- `src/spaces/`: `createSpaceSchema` (messages preserved verbatim; see C3), `updateSpaceSchema`, `spaceSchema` as `baseRecordSchema` refined with Space's messages, `SpaceEntity`, `CreateSpaceInput`, `UpdateSpaceInput`, `SpaceSummary` (record plus derived counts; `server-data` returns it in M5.2). `SetSpacePinnedResult` is not a domain contract: it carries user-facing messages and only the feature and its host use it, so it moves to `features-spaces/contracts` in M5.4.
- Field order follows today's Space schema (editable fields, then saved-record metadata), so the `api/spaces` JSON key order is unchanged.
- Parse results must equal today's for every fixture and every repository test row (a characterization test copies today's schema tests and runs them against the new schema first).
- `frontend-ui/src/types/entity-schema.ts` is deleted once nothing imports it; the canonical half of `types/entity.ts` goes with it. Screen-only shapes go to `frontend-collection` or `features-spaces/contracts` (4.3, 4.4). This narrows the `./types/*` wildcard as the conventions require.
- If Q3 is accepted: `lib/owned-records` defines `ownedRecordSchema = baseRecordSchema` (import from `@synapcity/domain-records`) and keeps its queries until M8. No bridge: the app imports the canonical contract directly.

### 4.2 Server: `server-data` and `server-supabase`

- `server-supabase` gains the `SupabaseServerClient` type export (the return type of `createRequestClient`). Still the only package importing `@supabase/*`.
- `server-data` (root `.`, starts with `import 'server-only'`), module `src/spaces/`:
  - `listSpaces(client)`, `listSpaceSummaries(client)`, `findSpace(client, spaceId)`: moved from `space-repository` unchanged in query, ordering, malformed-UUID short-circuit and error messages, minus the fixture branch and minus `createClient()`.
  - `setSpacePinned(client, spaceId, pinned)` and `recordSpaceView(client, spaceId, now)`: the two writes lifted out of the actions, returning `{ ok: true, pinnedAt } | { ok: false, error }` and `{ ok } | { error }` respectively, with the database-stamped time and the `row_not_written` case preserved. Throttle constant moves with the write.
  - Row types and `fromRow` are private to the module.
- RLS stays the scoping mechanism; no owner ID is passed to any query (unchanged).
- The package does not log. Hosts log by code and status only, as today.

### 4.3 Frontend: `frontend-collection`

- Source: `features/collection` (components, `shared/query`, `shared/record-item`, `shared/types`), the entity blocks Spaces and collection reach, and the screen-only shapes (`EntityKind`, `EntityItem`-style projections) from `frontend-ui/types/entity.ts`.
- Organization: kind folders (`components/`, `hooks/`, `utils/`, `types/`) with one unit folder per component, each with its DOM test and a story (conventions, Units). Today's grouping folders (`collection-displays/` holding nine components) are split into unit folders.
- `RecordLike` becomes a structural type over `BaseRecord`'s fields; `frontend-collection` may import `@synapcity/domain-records` root types (frontend → domain through the root is allowed by R2), or keep the structural type. Proposed: import the type, so the base contract has one owner.
- `cn` comes from `@synapcity/frontend-ui`, not `@/lib/utils`.
- Navigation (Q5): root entry is framework-neutral. Components that open an item take a host-supplied link capability (a `CollectionLinkProvider` or a `renderLink` slot, decided in the plan). A `./next` entry (`src/next/`) supplies the Next.js binding (`next/link`, `useRouter`). Same pattern for `frontend-ui`'s `link-button`, which moves behind `frontend-ui/next` (its exception's stated removal).
- Entity blocks: the ones with consumers move. Blocks with no consumer outside `frontend-ui` stories are listed in the plan, not deleted; deletion needs separate approval (preservation policy). The `entity-section` self-barrel cycle disappears with the move.
- Storybook discovery for new packages: `apps/storybook/.storybook/main.ts` adds `packages/frontend/collection/src/**/*.stories.@(ts|tsx)`, checked against the installed Storybook version's docs before the change. This closes the decisions-index item carried from M3.5.
- Consumers re-pointed in the same slice: documents, dashboards and home collection imports (≈30 files) switch to `@synapcity/frontend-collection`. Behavior unchanged; their tests keep their assertions.

### 4.4 Feature: `features-spaces`

- `./contracts`: Space view models (`Space` detail shape with document/dashboard items), copy constants, `toCollectionItem`, `describeContents`.
- `./frontend`: `SpacesIndex`, `SpacesCollection`, `SpacesCollectionSkeleton`, `SpacePreview`, `SpaceContent`, `SpaceCollections`, `RecordSpaceView` (client subtree starts with `'use client'`). Next-specific pieces, if any remain, under `src/frontend/next/`.
- `./server` (starts with `import 'server-only'`): loaders `getSpaces(source)`, `getSpace(source, spaceId)` and commands `pinSpace(source, ...)`, `viewSpace(source, ...)`, where `source` is a small port the host supplies (real: backed by `server-data` with a request client; fixture: backed by host-owned fixture records). `getSpace` returns `null` for not found; the host calls `notFound()` (Next navigation stays in the app).
- Proposed port shape (plan refines names):

  ```ts
  interface SpaceSource {
    listSummaries(): Promise<SpaceSummary[]>;
    find(spaceId: string): Promise<SpaceEntity | null>;
    setPinned(spaceId: string, pinned: boolean): Promise<SetPinnedOutcome>;
    recordView(spaceId: string): Promise<void>;
  }
  ```

  This is a real contract (two implementations), not a forwarding wrapper.

### 4.5 Host bindings (`apps/web`)

- `app/[userId]/home/spaces/page.tsx`, `[spaceId]/page.tsx`, `loading.tsx`: `requireOwner` (unchanged), build the source, call the feature loader, `notFound()` on null, render feature components, set breadcrumbs (breadcrumbs stay in the app unless Q2 brings shells in).
- `space-state-actions.ts` stays an app `'use server'` file (hosts own action entry points): parse input, fixture check, `getCallerIdentity`, then the feature command; maps outcomes to today's messages and `signedOut` flag; logs as today.
- `api/spaces` routes: unchanged access check (M4), then the source.
- Fixture binding (Q6): one host module `features/spaces`-free, e.g. `apps/web/src/lib/demo/space-source.ts`, holds the fixture-mode `SpaceSource` and its records. R8 keeps it out of `dev-fixtures`. `dev-fixtures` gains contract-based Space factories for tests and stories.
- Space detail placeholder (Q4, owner decision 2026-10-24): the sample documents and dashboards are not moved. Space detail shows empty states for both until participation reads come from Supabase (M8). A real user's Space never receives sample data. Fixtures stay available to build features in development and production (owner decision, 2026-10-24: no boundary rule against production files importing fixtures for now), so the host demo source (Q6) may keep sample documents and dashboards, but only in explicit fixture mode. The loader and its tests change in M5.4 when `get-space` moves; this is a visible change, approved by the owner.

### 4.6 Tests and verification

- Characterization first: today's schema, repository, action, route and collection tests run green against the moved code before any old file is removed.
- `domain-records`: schema tests (copied, plus base-only cases).
- `server-data`: query and write tests with a stub client (the current repository tests' approach), covering ordering, counts, malformed ID, errors, RLS-rejected write.
- `features-spaces`: loader/command tests against a fake `SpaceSource` (`./testing`), DOM tests moved with components, new stories.
- `frontend-collection`: moved DOM and query tests; a story per component; Storybook a11y checks run.
- App: route/action tests keep observable assertions; the fixture source gets a test proving it is only bound when fixture mode is on.
- Ratchets: `identity-boundary.test.ts` and `architecture.test.ts` updated only by removals.
- Repository gate: `pnpm verify`. Manual (owner, live Supabase): open Spaces index, filter/sort/search, switch layout, open a Space, pin/unpin, confirm last-viewed ordering, fixture mode index and detail.

## 5. Package creation

Four new packages (`domain-records`, `server-data`, `frontend-collection`, `features-spaces`) per the package checklist; `server-supabase`, `frontend-ui`, `dev-fixtures` and `apps/storybook` updated. `features-spaces` is the first feature package, so its `exports` (`./contracts`, `./frontend`, `./server`, `./testing`, no root) and its `src/` mirror are the template for M6–M9. `transpilePackages` (or the equivalent already used for workspace packages in `apps/web`) is checked for the new packages at the installed Next.js version.

## 6. Boundary checks and exceptions

Removed by M5 (10 of 16 named exceptions are M5-tagged):

| Exception                                                                                               | Removed by               | Condition                                                  |
| ------------------------------------------------------------------------------------------------------- | ------------------------ | ---------------------------------------------------------- |
| R11 ×4 entity blocks (`entity-item-card`, `entity-section`, `recent-entity-items`, `recent-entity-row`) | 4.3                      | always                                                     |
| R9 `entity-section` self-barrel cycle                                                                   | 4.3                      | always                                                     |
| R11 `link-button`                                                                                       | 4.3 (`frontend-ui/next`) | always                                                     |
| R11 `root-header`, `root-sidebar`, `user-menu`                                                          | shells                   | only if Q2 = include                                       |
| R11 `frontend-site/metadata.ts`                                                                         | —                        | only if M5 needs the site package; otherwise stays for M10 |

Completion criterion: `pnpm boundaries` passes with at least six exceptions removed and none added.

## 7. Migration bridges

Proposed: none. If the collection move is split across commits, a temporary re-export from `apps/web/src/features/collection` to the package may exist inside one PR only, recorded in the task scope with its consumers and removed before the PR merges.

## 8. Order of work (proposed sub-milestones, one PR each, Q1)

1. **M5.1 Contracts.** `domain-records` (base, spaces); switch Space schema/type importers; Q3 re-base of `owned-records`; remove `frontend-ui` entity schema. `dev-fixtures` Space factories arrive with the first moved tests that use them (M5.2 or M5.4), so no factory ships unused.
2. **M5.2 Server.** `SupabaseServerClient` export; `server-data/spaces`; host fixture source; repository, actions and API routes rewired; tests.
3. **M5.3 Collection.** `frontend-collection` with unit folders, stories and the link capability; `frontend-ui/next` for `link-button`; Storybook glob; documents/dashboards/home re-pointed; exceptions removed.
4. **M5.4 Feature.** `features-spaces` with contracts/frontend/server/testing; app routes thinned.
5. **M5.5 (only if Q2 = include) Shells.** `frontend-shells` with `RootShell`, sidebar, header, user menu taking host links; docs app consumer.
6. **Close-out.** Ownership map rows, inventory "exists" notes, ADR-0014 section 7 note, decisions index (Storybook item), task-scope ledger; `pnpm verify`; owner manual checks.

## 9. Owner questions (Q3 and Q6 answered 2026-10-23 with the recommendation; Q1 and Q2 on their defaults; Q4, Q5, Q7 answered 2026-10-24)

| #   | Question                                                                                                                                     | Recommendation                                                                                                                                                                                                                                                   |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q1  | Run M5 as sub-milestones (5.1–5.4, one PR each) or one branch?                                                                               | Sub-milestones. The collection move alone is ~37 components that each need a unit folder and a story; M3 showed smaller reviewed steps work.                                                                                                                     |
| Q2  | Include `frontend-shells` (app shell + header/sidebar/user menu) in M5?                                                                      | Defer. Spaces reaches the shell only through the root layout that every route and the docs app share; moving it pulls in the docs app and auth's user menu. Move it with the first slice that needs a page frame and update the inventory's "First code" column. |
| Q3  | Re-base `lib/owned-records`' schema on the new base contract now (queries stay until M8)?                                                    | Yes. Otherwise the ten fields have two definitions until M8, which is the duplication D6 exists to prevent.                                                                                                                                                      |
| Q4  | Space detail shows sample documents/dashboards for real users. Preserve in M5, or replace with real participation reads now?                 | Preserve and label in M5 (the slice is behavior-preserving). Fix it as its own small, separately approved change, before or after M5, since it changes what users see.                                                                                           |
| Q5  | Shared presentation and Next.js navigation: host-supplied link capability with a `./next` binding, or keep `next/link` behind `./next` only? | Host-supplied link capability in the root entry, Next binding in `./next`. Root stays framework-neutral and the docs app (or a later non-Next host) can supply its own link.                                                                                     |
| Q6  | Where does fixture-mode Space data live, given R8 bars production files from `dev-fixtures`?                                                 | In one host-owned demo source in `apps/web`. `dev-fixtures` gets contract-based factories for tests and stories only.                                                                                                                                            |
| Q7  | Do moved collection components all need stories in M5?                                                                                       | Yes, as they move (conventions, Units). It is the main size driver of M5.3.                                                                                                                                                                                      |

**Answers, 2026-10-24 (owner decisions).**

- **Q4:** replace, not preserve. Space detail shows empty states for documents and dashboards, with no sample data, until participation is read from Supabase. This overrides the recommendation to preserve and label the placeholder. Implemented in M5.4 with `get-space`; the sample `spaceItem` documents and dashboards and the default documents and dashboards of `createSpaceFixture` leave the real-user path and live only behind fixture mode (`dev-fixtures` factories keep contract-based Space data for tests and stories).
- **Q5:** host-supplied link capability in the root entry, with a `./next` binding.
- **Q7:** yes, every moved collection component gets a story as it moves.

## 10. Calls made by Claude (owner to check)

| #   | Call                                                                         | Why                                                                                                                         |
| --- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| C1  | Actions and API routes stay in the app; packages expose functions and ports. | Hosts own action and route entry points (conventions, Runtime and platform integration).                                    |
| C2  | `server-data` takes the client as an argument; it never builds one.          | ADR-0008 request-bound clients; mirrors M4's `supabaseIdentityProvider(client)`.                                            |
| C3  | Space form messages stay in the Space schema in `domain-records`, verbatim.  | Behavior preservation; `domain-identity` set the precedent. Whether copy belongs in domain is left for a separate decision. |
| C4  | `getSpace` returns `null`; the app calls `notFound()`.                       | Next navigation is a host concern.                                                                                          |
| C5  | Entity blocks without consumers are listed, not deleted.                     | Preservation policy: deletion is a separately approved change.                                                              |
| C6  | No `SpaceSource` method takes an owner ID.                                   | RLS scopes to the session today; passing an ID would invite trusting it.                                                    |

## 11. Left out, found along the way

- Copy in domain schemas (Space and identity) is a standing question for the copy/contract boundary; not decided here.
- `frontend-site/metadata.ts` R11 stays with M10 unless M5 touches the site package.
- `features/home/lib/resources/*.fixtures.ts` are Home's demo data (M9).
