# Milestone 5.2 server data and Space source Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every Space read and write goes through one `SpaceSource` port, backed by a new `@synapcity/server-data` package for real users and by fixtures for fixture mode, so Supabase-backed documents and dashboards can later be plugged in at one place. A real user's Space detail shows the documents and dashboards that participate in that Space (read from `space_documents` and `space_dashboards`), an empty state when there are none, and never sample data.

**Architecture:** `server-supabase` exports the request-client type. `server-data` holds the Space queries and the two Space writes, taking that client as an argument. In `apps/web`, a `SpaceSource` port (seven methods) has a server implementation over `server-data` and a fixture implementation over the existing fixtures; `getSpaceSource()` picks one from `fixtureModeEnabled()`. Loaders, actions and `api/spaces` routes call the port. The old `space-repository` is removed. Participation reads (`listDocuments`, `listDashboards`) return `BaseRecord[]`: read from the participation tables through `server-data` in the server source, sample records in the fixture source.

**Tech Stack:** TypeScript 7.0.2, Zod `^4.6.7`, Vitest 4.1.12, `@supabase/supabase-js` 2.117.3 (types only, through `@synapcity/server-supabase`), `server-only` 0.0.1, Next.js 16.4.3, pnpm workspace.

**Spec:** [2026-10-23-m5-spaces-slice-design.md](../specs/2026-10-23-m5-spaces-slice-design.md), sections 4.2, 4.4 (port), 4.5, 4.6, 8 (M5.2), and the owner answers in section 9 (2026-10-24). Refinements this plan makes to the design are listed under "Calls made" at the end.

## Global Constraints

- Package: `packages/server/data` = `@synapcity/server-data`, `version` `0.0.0`, `private`, `"type": "module"`, single entry `exports: { ".": "./src/index.ts" }`. `src/index.ts` starts with `import 'server-only';`; no other file in the package imports `server-only` (R10).
- Dependencies of `server-data`: `@synapcity/domain-records` and `@synapcity/server-supabase` as `workspace:*`, `zod` `^4.6.7`, `server-only` `0.0.1`. The `server-supabase` import is type-only. No other dependency; no version changes anywhere.
- Layout follows `server-auth`: one folder per unit under `src/spaces/`, `<unit>.ts`, `<unit>.test.ts` beside it, `index.ts` re-exporting; other folders import the folder, never a file in it (R7); relative extensionless imports.
- The package never logs and never reads `NODE_ENV` or `SYNAPCITY_DEV_AUTH`. RLS scopes every query; no owner ID is passed to any query.
- Unchanged values: columns `'id, owner_id, name, description, icon, tags, created_at, updated_at, pinned_at, last_viewed_at'`; lists ordered `created_at` descending; summary select adds `space_documents(count), space_dashboards(count)`; error messages `Failed to load spaces: ${message}` and `Failed to load space ${spaceId}: ${message}`; a malformed (non-UUID) id returns `null` without querying; view throttle `VIEW_THROTTLE_MS = 60_000` with the filter `last_viewed_at.is.null,last_viewed_at.lt.${cutoff}`; a write that RLS turned away (`data` empty) is `{ ok: false, error: { code: 'row_not_written' } }`.
- User-visible behavior is unchanged except Q4: user messages (`SAVE_FAILED` = `'Could not save your changes. Try again.'`, `FIXTURE_MESSAGE`), the `signedOut` flag, `api/spaces` 401 body `{ error: 'Not signed in' }`, 404 body `{ error: 'Not found' }` and `Cache-Control: no-store`.
- Q4 (owner decision, 2026-10-24): a real user's Space never receives sample documents or dashboards; fixture mode keeps its samples. The owner confirmed on 2026-10-24 that `space_documents` and `space_dashboards` exist in the hosted project; their definition is `supabase/migrations/20261018090100_create_space_participation.sql` (columns `space_id`, `document_id` or `dashboard_id`, `owner_id`, `pinned`, `position`, `added_at`; owner-scoped RLS). Per-Space `pinned` and `position` are not read or ordered by in M5.2. No boundary rule against production files importing fixtures (owner decision, 2026-10-24).
- Seed data is for development only and is never run against a production database; it is idempotent and adds nothing for a user who already has data. The JSON seeds in `packages/dev/fixtures/seed` stay generic and are not changed here.
- Fixture mode stays in `apps/web`; no package reads it. A fixture result never comes back from the server source.
- Existing tests keep their assertions on observable results. A moved test keeps its cases; a test may change its mocks or imports, or gain cases.
- Commits only when the owner authorizes them. Conventional style, no attribution trailer, no GitHub closing keyword near an issue reference. Never quote the owner in any document or commit; record decisions as "owner decision, date".

## Review Focus

1. A malformed id on `findSpace` returns `null` without touching the client, so `GET /api/spaces/not-a-uuid` is a 404, not a 500. Test in Task 2.
2. A pin write that RLS turned away (empty `data`) is never reported as saved: the port returns `ok: false`, the action returns `SAVE_FAILED` and logs `row_not_written`. Tests in Tasks 2 and 4.
3. A view recorded under a minute ago is not written again: the update carries the cutoff filter. Test in Task 2.
4. A real user's Space detail shows only the items that participate in that Space, an empty state with totals of zero when there are none, and never the sample records, while fixture mode still returns its samples. Tests in Tasks 2 and 4.
5. `getSpaceSource()` returns the fixture source only when fixture mode is on, and never builds a request client in fixture mode (fixture mode has no session). Test in Task 3.

---

### Task 1: `SupabaseServerClient` type from `server-supabase`

**Files:**

- Modify: `packages/server/supabase/src/request-client/request-client.ts`, `request-client/index.ts`, `src/index.ts`
- Test: `packages/server/supabase/src/request-client/request-client.test.ts`

**Interfaces:**

- Produces: `export type SupabaseServerClient = ReturnType<typeof createRequestClient>` from the root entry.

- [ ] **Step 1: Write the failing test** in `request-client.test.ts`: `it('exposes the request client type', () => expectTypeOf<SupabaseServerClient>().toEqualTypeOf<ReturnType<typeof createRequestClient>>())`, importing the type from `'./index'`.
- [ ] **Step 2: Run it to see it fail.** `pnpm --filter @synapcity/server-supabase check-types`. Expected: TS2305 (no exported member `SupabaseServerClient`).
- [ ] **Step 3: Export the type** from `request-client.ts`, the folder `index.ts` and the root `src/index.ts`.
- [ ] **Step 4: Run it to see it pass.** `pnpm --filter @synapcity/server-supabase test`, `lint`, `check-types`. Expected: all pass, same test count plus one.
- [ ] **Step 5: Checkpoint commit** (if authorized): `feat(server-supabase): export the request client type`.

### Task 2: `server-data` package with the Space queries and writes

**Files:**

- Create: `packages/server/data/{package.json,tsconfig.json,eslint.config.mjs,vitest.config.ts,README.md}` (copy `packages/server/auth`'s config files, including how its Vitest config maps `server-only`)
- Create: `src/index.ts`; `src/spaces/index.ts`; `src/spaces/space-row/{space-row.ts,index.ts}`; `src/spaces/space-queries/{space-queries.ts,space-queries.test.ts,index.ts}`; `src/spaces/space-writes/{space-writes.ts,space-writes.test.ts,index.ts}`; `src/spaces/space-participation/{space-participation.ts,space-participation.test.ts,index.ts}`
- Modify: root `vitest.config.ts` (add `'packages/server/data'` to the projects list); `pnpm-lock.yaml` via `pnpm install`

**Interfaces:**

- Consumes: Task 1's `SupabaseServerClient`; `spaceSchema`, `baseRecordSchema`, `BaseRecord`, `SpaceEntity`, `SpaceSummary` from `@synapcity/domain-records`.
- Produces (root entry only):
  - `listSpaces(client: SupabaseServerClient): Promise<SpaceEntity[]>`
  - `listSpaceSummaries(client: SupabaseServerClient): Promise<SpaceSummary[]>`
  - `findSpace(client: SupabaseServerClient, spaceId: string): Promise<SpaceEntity | null>`
  - `setSpacePinned(client: SupabaseServerClient, spaceId: string, pinned: boolean): Promise<{ ok: true; pinnedAt: string | null } | { ok: false; error: unknown }>`
  - `recordSpaceView(client: SupabaseServerClient, spaceId: string, now: Date): Promise<{ ok: true } | { ok: false; error: unknown }>`
  - `listSpaceDocuments(client: SupabaseServerClient, spaceId: string): Promise<BaseRecord[]>` and `listSpaceDashboards(client: SupabaseServerClient, spaceId: string): Promise<BaseRecord[]>`: the items participating in one Space, newest `added_at` first; a malformed id returns `[]` without querying.
  - `VIEW_THROTTLE_MS` is private to the module. `SpaceRow`, `fromRow`, `countOf`, `COLUMNS` live in `space-row` and are not exported from the root.

- [ ] **Step 1: Move the query tests.** `git mv` `apps/web/src/features/spaces/server/space-repository/space-repository.test.ts` to `packages/server/data/src/spaces/space-queries/space-queries.test.ts`. Change only its setup: the stand-in client is passed as the first argument instead of mocked through `@/lib/supabase/server`; delete the fixture-mode cases (they move to Task 3's fixture source tests). Keep every query, ordering, count, malformed-id and error-message case. Add: a case that `findSpace(client, 'not-a-uuid')` resolves `null` and `client.from` was not called (Review Focus 1).
- [ ] **Step 2: Write `space-writes.test.ts`** from today's `space-state-actions.test.ts` cases for the two writes, minus caller checks and messages, against a stub client: `setSpacePinned` returns `{ ok: true, pinnedAt }` with the database time; `pinned: false` writes `pinned_at: null`; a Supabase `error` returns `{ ok: false, error }`; empty `data` returns `{ ok: false, error: { code: 'row_not_written' } }`; `recordSpaceView` updates `last_viewed_at` to `now` with `.or` filter `last_viewed_at.is.null,last_viewed_at.lt.<now minus 60 s>` (Review Focus 3); returns `{ ok: false, error }` on a Supabase error.
- [ ] **Step 2b: Write `space-participation.test.ts`** against a stub client: `listSpaceDocuments` reads `space_documents` filtered by `space_id`, selects the document columns through the embedded `documents` relation, orders by `added_at` descending, and returns each embedded row parsed as a `BaseRecord` (snake_case mapped to camelCase, null description to absent); `listSpaceDashboards` does the same for `space_dashboards` and `dashboards`; both return `[]` for `'not-a-uuid'` with `client.from` not called (Review Focus 1); both throw `Failed to load documents of space ${spaceId}: ${message}` (dashboards: `Failed to load dashboards of space ${spaceId}: ${message}`) on a Supabase error; an embedded row that is `null` (item not visible under RLS) is skipped, not an error.
- [ ] **Step 3: Write the manifest and configs.** `package.json` as `server-auth`'s with `name` `@synapcity/server-data`, `exports` root only, the dependencies listed in Global Constraints and the same dev dependencies. Add the root Vitest project. Run `pnpm install` (the sandbox needs `registry.npmjs.org` allowed; if it empties `node_modules/.pnpm`, run `pnpm install --force`).
- [ ] **Step 4: Run the tests to see them fail.** `pnpm --filter @synapcity/server-data test`. Expected: FAIL, modules `./index` / `./space-queries` / `./space-writes` / `./space-participation` not found.
- [ ] **Step 5: Implement** the units with the Interfaces above and the Global Constraints' exact values. `space-row` holds the row types, `COLUMNS`, `fromRow` (maps snake_case and a null description onto `spaceSchema`), `countOf` and a `recordFromRow` that maps an item row onto `baseRecordSchema`. `space-participation` uses PostgREST resource embedding (`documents(<COLUMNS>)`, `dashboards(<COLUMNS>)`) on the participation tables; the embedded value is one object per row (many-to-one), so read it as an object and skip a `null`. Carry over the doc comments from `space-repository.ts` and the actions, minus fixture-mode wording. `src/index.ts` starts with `import 'server-only';` and re-exports the seven functions.
- [ ] **Step 6: Run the tests to see them pass.** `pnpm --filter @synapcity/server-data test`, `lint`, `check-types`. Expected: all pass.
- [ ] **Step 7: README.** `Owns:` the Space queries and writes against a supplied Supabase request client; runtime (server only, `import 'server-only'` in the root file); public-interface table (the seven functions, one line each); rules (RLS scopes, no owner id, no logging, no fixture or `NODE_ENV` reads; per-Space `pinned` and `position` on the participation rows are not read yet and arrive with the feature that shows them).
- [ ] **Step 8: Checkpoint commit** (if authorized): `feat(server-data): add the Space queries and writes`.

### Task 3: `SpaceSource` port, server and fixture sources

**Files:**

- Create: `apps/web/src/features/spaces/server/space-source/{space-source.ts,server-space-source.ts,fixture-space-source.ts,index.ts}` and a test beside each of the last three, plus `space-source.test.ts` for `getSpaceSource`
- Modify: `apps/web/package.json` (`"@synapcity/server-data": "workspace:*"`); `pnpm-lock.yaml` via `pnpm install`

**Interfaces:**

- Consumes: Task 2's seven functions; `SupabaseServerClient`; `BaseRecord`, `SpaceEntity`, `SpaceSummary` from `@synapcity/domain-records`; `SPACE_FIXTURES` and `spaceItem` from `../../lib/fixtures`; `fixtureModeEnabled` from `@/lib/access/dev-fixture`; `createClient` from `@/lib/supabase/server`.
- Produces:
  - `type SetPinnedOutcome = { ok: true; pinnedAt: string | null } | { ok: false; error: unknown }`
  - `interface SpaceSource { list(): Promise<SpaceEntity[]>; listSummaries(): Promise<SpaceSummary[]>; find(spaceId: string): Promise<SpaceEntity | null>; setPinned(spaceId: string, pinned: boolean): Promise<SetPinnedOutcome>; recordView(spaceId: string): Promise<{ ok: true } | { ok: false; error: unknown }>; listDocuments(spaceId: string): Promise<BaseRecord[]>; listDashboards(spaceId: string): Promise<BaseRecord[]> }`
  - `serverSpaceSource(client: SupabaseServerClient): SpaceSource`, `fixtureSpaceSource(): SpaceSource`, `getSpaceSource(): Promise<SpaceSource>`

- [ ] **Step 1: Write the failing tests.**
  - `server-space-source.test.ts`: each of the seven methods calls the matching `server-data` function with the supplied client (mock `@synapcity/server-data`); `recordView` passes a `Date`; `listDocuments` and `listDashboards` call `listSpaceDocuments` and `listSpaceDashboards` with the client and the space id.
  - `fixture-space-source.test.ts`: `list` returns `SPACE_FIXTURES`; `listSummaries` maps them with zero counts; `find` returns a fixture by id and `null` otherwise; `setPinned` resolves `{ ok: false, error: { code: 'fixture_mode' } }`; `recordView` resolves `{ ok: true }` and changes nothing; `listDocuments` and `listDashboards` return the samples from `spaceItem` as `BaseRecord`s (every item passes `baseRecordSchema.parse`), independent of the space id.
  - `space-source.test.ts` (Review Focus 5): with fixture mode on, `getSpaceSource()` resolves the fixture source and `createClient` is not called; with it off, it calls `createClient` once and resolves a source whose `list` reaches `server-data`.
- [ ] **Step 2: Run them to see them fail.** `pnpm --filter web exec vitest run src/features/spaces/server/space-source`. Expected: FAIL, modules not found.
- [ ] **Step 3: Implement** the port types and the three functions. `serverSpaceSource` forwards each method to `server-data`. `fixtureSpaceSource` builds the participation `BaseRecord`s by mapping the `spaceItem` samples through `baseRecordSchema.parse` with the sample space's owner and empty tags. `getSpaceSource` is the only place that reads `fixtureModeEnabled()` for Space data.
- [ ] **Step 4: Run them to see them pass.** Same command. Expected: PASS. Then `pnpm install` and `pnpm --filter web check-types lint`.
- [ ] **Step 5: Checkpoint commit** (if authorized): `feat(spaces): add the Space source port with server and fixture sources`.

### Task 4: Loaders, actions and routes use the port; old repository removed

**Files:**

- Modify: `apps/web/src/features/spaces/server/get-space/{get-space.ts,get-space.test.ts}`, `get-spaces/{get-spaces.tsx,get-spaces.test.ts}`, `actions/{space-state-actions.ts,space-state-actions.test.ts}`; `apps/web/src/app/api/spaces/route.ts`, `route.test.ts`, `[spaceId]/route.ts`, `[spaceId]/route.test.ts`
- Delete: `apps/web/src/features/spaces/server/space-repository/` (the test moved in Task 2)

**Interfaces:**

- Consumes: Task 3's `getSpaceSource`, `SpaceSource`.
- Produces: unchanged signatures `getSpace(spaceId: string): Promise<Space>` (still calls `notFound()` when absent), `getSpaces(): Promise<SpaceSummary[]>`, `setSpacePinned(spaceId: unknown, pinned: unknown): Promise<SetSpacePinnedResult>`, `recordSpaceView(spaceId: unknown): Promise<void>`.

- [ ] **Step 1: Write or change the failing tests.**
  - `get-space.test.ts`: with a fake `SpaceSource` whose `find` returns a Space and whose participation methods return `[]`, `getSpace` returns `documents: []`, `dashboards: []`, `documentsTotal: 0`, `dashboardsTotal: 0` and no sample ids (Review Focus 4: a real user's empty Space). With a fake whose participation methods return two `BaseRecord`s each, items map to `{ id, name, description, createdAt, updatedAt, icon, kind }` with `kind` `'document'` or `'dashboard'` and totals equal to the lengths. With `find` returning `null`, `notFound` is called. With the fixture source, the samples come back (Review Focus 4).
  - `get-spaces.test.ts`: `getSpaces` returns `source.listSummaries()`.
  - `space-state-actions.test.ts`: keep every assertion (messages, `signedOut`, throttle, `row_not_written`, retryable-fetch case); change the mocks so the write goes through a fake source or `@synapcity/server-data`; add: an `{ ok: false, error }` outcome returns `SAVE_FAILED` and logs the code (Review Focus 2).
  - Route tests: keep every assertion; mock `getSpaceSource` instead of `space-repository`.
- [ ] **Step 2: Run them to see them fail.** `pnpm --filter web exec vitest run src/features/spaces/server src/app/api/spaces`. Expected: FAIL on the new empty-list, mapping and source assertions.
- [ ] **Step 3: Rewire.** `getSpace` calls `find`, `listDocuments` and `listDashboards` from the source (the two lists in parallel) and maps records to the screen items. `getSpaces` calls `listSummaries`. The actions keep their parsing, fixture check, `getCallerIdentity` and messages, then call `source.setPinned` and `source.recordView` and map outcomes as today. The routes keep their access check and call `source.list()` and `source.find()`. Delete the sample imports from `get-space.ts` and the `space-repository` folder.
- [ ] **Step 4: Check nothing points at the old repository.** `rg -n "space-repository|sampleSpace" apps packages -g '!**/node_modules/**'`. Expected: no matches. Then the affected checks: `pnpm --filter web check-types lint test`. Expected: pass with the same counts as before, minus the moved repository tests, plus the new cases.
- [ ] **Step 5: Boundaries.** `pnpm boundaries`. Expected: pass, no new exception; `apps/web` reaches `server-data` through its root only.
- [ ] **Step 6: Checkpoint commit** (if authorized): `refactor(spaces): read and write Spaces through the Space source`.

### Task 5: Development seed data for documents, dashboards and participation

**Files:**

- Modify: `supabase/seed.sql`
- Test: `supabase/tests/seed-sample-data.sql` (new, a plain-SQL regression check in the style of the other files in `supabase/tests`)

**Interfaces:**

- Consumes: the tables from `20261018090000_create_documents_and_dashboards.sql` and `20261018090100_create_space_participation.sql`; the three starter Spaces the file already inserts (`Writing`, `Learning`, `Personal`).
- Produces: for each existing user who has no documents and no dashboards, a small set of each, and participation rows placing them in that user's starter Spaces. No change to what the file does for spaces.

- [ ] **Step 1: Write the check.** `seed-sample-data.sql`: create two test users in a transaction, run the seed statements for them, and assert: each user has at least two documents and two dashboards; every participation row's `owner_id` equals the owner of both the Space and the item; the `Personal` Space has no participating items (so the empty state is exercised in development); running the seed a second time adds no rows; a user who already has a document gets no sample documents; the whole thing rolls back.
- [ ] **Step 2: Run it to see it fail.** Against a local database (`supabase db reset`, then `psql -X -v ON_ERROR_STOP=1 -f supabase/tests/seed-sample-data.sql <local-connection>`). Expected: FAIL on the document-count assertion. If no local Supabase stack is available, say so in the report and treat the check as not run.
- [ ] **Step 3: Extend `seed.sql`.** Same pattern as the spaces insert: only for users with no existing documents and no existing dashboards, so it is safe to run more than once. Documents and dashboards are inserted with an explicit `owner_id` (the seed runs without `auth.uid()`), names and descriptions that read as real notes and dashboards, valid Lucide identifiers (`file-text`, `layout-dashboard` or another valid kebab-case name) and `tags`. Participation rows set `owner_id` explicitly and leave per-Space `pinned` and `position` at their defaults. Place items in `Writing` and `Learning` only. Update the header comment: development only, never against a production database.
- [ ] **Step 4: Run the check to see it pass.** Same command. Expected: PASS.
- [ ] **Step 5: Checkpoint commit** (if authorized): `chore(supabase): seed documents, dashboards and participation for development`.

### Task 6: Records, boundary probe, repository gate

**Files:**

- Modify: `docs/architecture/reorganization-ownership-map.md` (rows `spaces` and `lib/supabase`: M5.2 note naming what moved and what stays); `docs/architecture/workspace-conventions.md` (inventory: `server-data` First code `M5.2 (exists)`); `docs/architecture/decisions/0014-multi-app-package-boundaries.md` (section 7 sentence: `server-data` created in M5.2); `packages/server/README.md` (status sentence); `supabase/` notes if any doc lists the seed contents; `.agents/task-scope.md` (M5 entry: execution, exact creates, updates and deletes, verification); the design's status line (M5.2 implemented; Q4 implemented in M5.2, not M5.4)

- [ ] **Step 1: Update the records.** No owner quotes; decisions as "owner decision, date".
- [ ] **Step 2: Forbidden-import probe** (not committed). Temporarily import `@synapcity/server-data` from a `'use client'` file in `apps/web`; run `pnpm boundaries`; expected: a server-from-browser violation. Revert the probe and run `pnpm boundaries` again; expected: no violations. Record both outcomes in the task scope.
- [ ] **Step 3: Repository gate.** `pnpm verify`. Expected: every stage passes. If the sandbox blocks Chromium for e2e or Storybook, rerun the chain outside the sandbox and report which run passed. Run it with nothing else running; two overlapping runs make the Settings dom tests time out.
- [ ] **Step 4: Report** per AGENTS.md section 9: what moved, what was preserved (queries, ordering, messages, RLS reliance), what changed on purpose (Q4: real-user Space detail now shows its own participating items instead of sample records), checks run and not run (live Supabase not exercised and the seed check run only if a local stack exists: the embedded-relation select and its RLS behavior need the owner's manual check on a Space with and without items), remaining M5 work (5.3, 5.4, Q2 shells).
- [ ] **Step 5: Checkpoint commit** (if authorized): `docs: record milestone 5.2 server data`.

## Calls made (owner to check)

- **Q4 moves from M5.4 to M5.2.** The design put the empty-state change in M5.4 with `get-space`. `get-space` is rewired through the port here, so the sample removal lands in the same change instead of touching the loader twice. The empty-state copy already exists in `SpaceCollections`; no component changes.
- **The port lives in the feature for now.** `space-source/` sits under `features/spaces/server` so it can read the existing fixtures without a lib-to-feature import. M5.4 moves the port to `features-spaces/server` and the two implementations to host bindings (design 4.4, 4.5, Q6).
- **Seven methods, not four.** The design's sketch had four. `list` serves `api/spaces`; `listDocuments` and `listDashboards` are the plug-in point for Supabase participation reads.
- **Participation returns `BaseRecord[]`.** Documents and dashboards already parse as the base record, so the query needs no new shape.
- **Participation reads are built now.** The owner confirmed the two tables exist in the hosted project, so the server source reads them instead of returning empty lists. Real users therefore see their own participating items; the empty state appears only when a Space has none. The embedded-relation select is verified only against a stub client here; the owner's manual check covers the live behavior.
- **Per-Space `pinned` and `position` are not read.** No component shows them yet, so ordering is `added_at` descending.
- **Seed data lands in `supabase/seed.sql`, not in `dev-fixtures`.** The seed that already feeds a development database is `supabase/seed.sql` (spaces only). The `dev-fixtures` JSON seeds are generic and not tied to this schema, so they stay as they are. Fixture-mode sample data in the app is unchanged.
- **The seed leaves `Personal` empty on purpose,** so development shows both a populated and an empty Space.
- **`now` is a `Date`.** The design said `now` without a type.

## Left open on purpose

- Per-Space `pinned` and `position` presentation and writes (adding or removing an item from a Space): the feature that needs them (M8) decides.
- A `dev-fixtures` Space factory: it arrives with the first test that needs it (design 8).
- Whether the generic `dev-fixtures` JSON seeds should be aligned to the Spaces, Documents and Dashboards schema: a separate decision.
- `domain-identity`'s `zod` dev-dependency placement (pre-existing).
