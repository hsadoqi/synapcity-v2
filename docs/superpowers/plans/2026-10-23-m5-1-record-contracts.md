# Milestone 5.1 record contracts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One definition of the ten shared record fields, in `@synapcity/domain-records`, with the Space contract built on it and Documents/Dashboards re-based on it, and no visible or serialized change.

**Architecture:** A new domain package holds a `base` module (the base record schema and type) and a `spaces` module (Space create/update/saved schemas, their types, `SpaceSummary`). `apps/web` and `frontend-ui` import those contracts from the package root; the copies in `frontend-ui/src/types/entity-schema.ts` and `features/spaces/shared/schema` are removed, and `lib/owned-records` uses the base schema. Queries, actions, components and fixtures do not move (M5.2–M5.4).

**Tech Stack:** TypeScript 7.0.2 (source packages, no build), Zod `^4.6.7` (as declared in `apps/web` and `frontend-ui`), Vitest 4.1.12, ESLint 10.9.1, pnpm workspace.

**Spec:** [2026-10-23-m5-spaces-slice-design.md](../specs/2026-10-23-m5-spaces-slice-design.md), sections 4.1, 6, 8 (M5.1), Q3.

## Global Constraints

- Package: `packages/domain/records` = `@synapcity/domain-records`, `version` `0.0.0`, `private`, `"type": "module"`, single entry `exports: { ".": "./src/index.ts" }` (conventions, Entry points 2; no module subpath until a consumer needs one).
- `zod` `^4.6.7` is a runtime `dependency` of the package (it is imported by shipped code). No other runtime dependency. R4 allows only `zod` in domain.
- Layout follows `domain-identity` (owner decision F4): module folders `src/base/`, `src/spaces/`, each with kind folders `schemas/` and `types/`, each folder with `index.ts`; tests beside the schema file. Relative, extensionless imports; other folders import a folder's `index.ts` (R7).
- Exact values, unchanged from today:
  - Icon rule `/^[a-z0-9]+(?:-[a-z0-9]+)*$/`; timestamps `z.iso.datetime({ offset: true })`; `pinnedAt` and `lastViewedAt` `.nullable().default(null)`; `ownerId` `z.uuid()`; `name` `z.string().trim().min(1)`; `description` `z.string().optional()`; `tags` `z.array(z.string())`; `id` `z.string().min(1)`.
  - Space messages, verbatim: name `'Enter a space name.'`, icon `'Use a Lucide icon name.'`, id `'A space ID is required.'`. The base schema has no messages.
- Field order of `spaceSchema` output stays `name, description, icon, tags, id, ownerId, createdAt, updatedAt, pinnedAt, lastViewedAt` (the `api/spaces` JSON body). The base schema uses the same order.
- `SetSpacePinnedResult` and `OwnedRecordSummary`, `SetRecordPinnedResult` stay in the app (design 4.1). Screen-only shapes (`Space`, `DocumentItem`, `DashboardItem`, `EntityKind`, `SpaceItem`, `EntityItem`) stay in `frontend-ui/src/types/entity.ts` until M5.3.
- No re-export of domain types from app or `frontend-ui` modules (conventions, Contracts). Importers use `@synapcity/domain-records` directly. No bridge.
- Existing tests keep their assertions; a moved test keeps its cases. Product copy, behavior, RLS, persisted shapes: unchanged.
- Commits only when the owner authorizes them. Conventional style, no attribution trailer, no GitHub closing keyword near an issue reference.
- Never quote the owner in any document or commit; record decisions as "owner decision, date".

## Review Focus

1. `api/spaces` JSON key order: a client or test diffing the body sees the same order. Test in Task 1 (`Object.keys` of a parsed Space).
2. A Space whose stored name is only whitespace still fails with `'Enter a space name.'`, not the base schema's default message, because the Space override replaces the field. Test in Task 1.
3. A document or dashboard row with an empty name or a bad icon still fails parsing after the re-base (the base keeps every rule `ownedRecordSchema` had). Test in Task 3.
4. `updateSpaceSchema` keeps every field optional and still strips server-managed fields (`id`, `ownerId`, timestamps) from input. Covered by the moved test in Task 1.
5. A stray import of `@synapcity/frontend-ui/types/entity-schema` or `features/spaces/shared/schema` survives the move. Task 2's `rg` check and `pnpm boundaries` (R0 unresolved import) catch it.

---

### Task 1: `domain-records` package with the base and Space contracts

**Files:**

- Create: `packages/domain/records/{package.json,tsconfig.json,eslint.config.mjs,vitest.config.ts,README.md}` (copy `packages/domain/identity`'s config files; README per Step 7)
- Create: `src/index.ts`; `src/base/index.ts`, `src/base/schemas/{index.ts,base-record.ts,base-record.test.ts}`, `src/base/types/{index.ts,base-record.ts}`; `src/spaces/index.ts`, `src/spaces/schemas/{index.ts,space.ts,space.test.ts}`, `src/spaces/types/{index.ts,space.ts}`
- Modify: root `vitest.config.ts` (add `'packages/domain/records'` to the projects list, after `'packages/domain/identity'`); `pnpm-lock.yaml` via `pnpm install`

**Interfaces:**

- Produces (all from the root entry):
  - `baseRecordInputSchema`: `{ name, description?, icon, tags }`, no messages
  - `baseRecordSchema`: `baseRecordInputSchema.extend({ id, ownerId, createdAt, updatedAt, pinnedAt, lastViewedAt })`
  - `type BaseRecord = z.infer<typeof baseRecordSchema>`
  - `createSpaceSchema`: `baseRecordInputSchema.extend({ name, icon })` with the Space messages
  - `updateSpaceSchema = createSpaceSchema.partial()`
  - `spaceSchema`: `baseRecordSchema.extend({ name, icon, id })` with the Space messages (overriding keys keeps their position)
  - `type SpaceEntity`, `CreateSpaceInput`, `UpdateSpaceInput` (inferred, as in `frontend-ui/src/types/entity.ts` today)
  - `type SpaceSummary = SpaceEntity & { documentsTotal: number; dashboardsTotal: number }` (doc comment copied from `features/spaces/shared/types/index.ts`)

- [ ] **Step 1: Move the Space schema test.** `git mv apps/web/src/features/spaces/shared/schema/schema.test.ts packages/domain/records/src/spaces/schemas/space.test.ts`. Change only its imports: types from `'../types'`, schemas from `'./index'` (already). Add:

  ```ts
  it('keeps the saved field order of today’s Space schema', () => {
    // Zod omits an absent optional key, so pass a description to see every field.
    const parsed = spaceSchema.parse({ ...savedSpace, description: 'Notes' });
    expect(Object.keys(parsed)).toEqual([
      'name',
      'description',
      'icon',
      'tags',
      'id',
      'ownerId',
      'createdAt',
      'updatedAt',
      'pinnedAt',
      'lastViewedAt',
    ]);
  });

  it('reports the Space message for a blank name and a bad icon', () => {
    const result = spaceSchema.safeParse({
      ...savedSpace,
      name: '   ',
      icon: 'Pen Line',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((i) => i.message)).toEqual(
      expect.arrayContaining([
        'Enter a space name.',
        'Use a Lucide icon name.',
      ]),
    );
  });
  ```

- [ ] **Step 2: Write `base-record.test.ts`.** Cases: parses a full record and keeps `pinnedAt`/`lastViewedAt`; defaults both to `null` when absent; rejects `name: '  '`, `icon: 'Pen'`, `ownerId: 'x'`, `createdAt: '2026-10-01'` (no offset); trims `name`; issue messages for a blank name are not `'Enter a space name.'` (base has no Space copy).
- [ ] **Step 3: Write the manifest and configs.** `package.json` as `domain-identity`'s but `name` `@synapcity/domain-records`, `exports` root only, `dependencies: { "zod": "^4.6.7" }`, and the same scripts and devDependencies minus `zod`. `tsconfig.json`, `eslint.config.mjs`, `vitest.config.ts` copied unchanged. Add the root Vitest project. Run `pnpm install` (if the sandbox empties `node_modules/.pnpm`, run `pnpm install --force`, as recorded in the M4 ledger).
- [ ] **Step 4: Run the tests to see them fail.** `pnpm --filter @synapcity/domain-records test`. Expected: FAIL, modules `../types` / `./index` / `./base-record` not found.
- [ ] **Step 5: Implement the schemas and types** in the files listed, with the Interfaces above and the Global Constraints' exact values. Doc comments: carry over the ADR-0012 comment from `entity-schema.ts` to `spaceSchema` (including "Space remains a provisional label; content relationships and lifecycle stay undecided") and the "Store the Lucide identifier, never a React component or SVG markup" comment to the icon rule. `src/index.ts` re-exports `./base` and `./spaces`.
- [ ] **Step 6: Run the tests to see them pass.** `pnpm --filter @synapcity/domain-records test lint check-types`. Expected: all pass.
- [ ] **Step 7: README.** Sections like `domain-identity`'s: `Owns:` (the base record contract and the Space contract; Document and Dashboard modules arrive in M8, their schema already uses the base), runtime (`zod` only), public-interface table (each export above, one line), rules (base fields change only with a matching ADR-0012/0013 schema change; screen-only shapes never live here; Space is a provisional label per the glossary).
- [ ] **Step 8: Checkpoint commit** (if authorized): `feat(domain-records): add the base record and Space contracts`.

### Task 2: Space consumers use `domain-records`; old copies removed

**Files:**

- Delete: `packages/frontend/ui/src/types/entity-schema.ts`; `apps/web/src/features/spaces/shared/schema/{schema.ts,index.ts}` (the test moved in Task 1)
- Modify: `packages/frontend/ui/src/types/entity.ts` (drop `SpaceEntity`, `CreateSpaceInput`, `UpdateSpaceInput`; `import type { SpaceEntity } from '@synapcity/domain-records'` for `Space`); `packages/frontend/ui/package.json` (`"@synapcity/domain-records": "workspace:*"` in dependencies)
- Modify: `apps/web/package.json` (same dependency); `apps/web/src/features/spaces/shared/types/index.ts` (keep `SetSpacePinnedResult` and the `frontend-ui/types/entity` re-export of screen-only shapes; remove `SpaceSummary`)
- Modify the importers: `features/spaces/lib/fixtures/spaces/{spaces.ts,spaces.test.ts}`, `server/space-repository/space-repository.ts`, `server/get-spaces/get-spaces.tsx`, `server/get-space/get-space.ts`, `server/actions/space-state-actions.ts`, `lib/collection-item/{collection-item.ts,collection-item.test.ts}`, `components/space-content.tsx`, `components/space-collections/space-collections.tsx`, `components/spaces-collection/{spaces-collection.tsx,spaces-index.tsx,spaces-collection.dom.test.tsx}`

**Interfaces:**

- Consumes: Task 1's root exports.
- Produces: no new names. After this task every use of `spaceSchema`, `createSpaceSchema`, `updateSpaceSchema`, `SpaceEntity`, `CreateSpaceInput`, `UpdateSpaceInput`, `SpaceSummary` imports `@synapcity/domain-records`; screen-only shapes and `SetSpacePinnedResult` keep their current import paths.

- [ ] **Step 1: Repoint the imports** in the files listed. Split mixed imports: domain names from `@synapcity/domain-records`, the rest unchanged.
- [ ] **Step 2: Delete the old copies** listed above.
- [ ] **Step 3: Check nothing points at them.** `rg -n "types/entity-schema|spaces/shared/schema|SpaceEntity|CreateSpaceInput|UpdateSpaceInput|SpaceSummary" apps packages -g '!**/node_modules/**' -g '!**/dist/**'`. Expected: only `@synapcity/domain-records` imports, `packages/domain/records/**`, and `frontend-ui/src/types/entity.ts`'s type import.
- [ ] **Step 4: Run the affected checks.** `pnpm install`, then `pnpm --filter web check-types lint test` and `pnpm --filter @synapcity/frontend-ui check-types lint test`. Expected: pass with the same test counts as before, minus the 1 moved file in `web`.
- [ ] **Step 5: Boundaries.** `pnpm boundaries`. Expected: pass, no new exception; `frontend-ui` → `domain-records` resolves through the root (R2, R5).
- [ ] **Step 6: Checkpoint commit** (if authorized): `refactor(spaces): use the Space contract from domain-records`.

### Task 3: Documents and Dashboards re-based on the base contract (Q3)

**Files:**

- Modify: `apps/web/src/lib/owned-records/owned-records.ts` (`ownedRecordSchema = baseRecordSchema`, imported from `@synapcity/domain-records`; drop the local `timestampSchema` and field definitions; keep the doc comment and `OwnedRecord` as `z.infer<typeof ownedRecordSchema>`)
- Test: `apps/web/src/lib/owned-records/owned-records.test.ts`

**Interfaces:**

- Consumes: `baseRecordSchema` from Task 1.
- Produces: unchanged `ownedRecordSchema`, `OwnedRecord`, `OwnedRecordSummary`, `listOwnedRecordSummaries`, `setOwnedRecordPinned`, `OwnedRecordTable`, `SetRecordPinnedResult`.

- [ ] **Step 1: Add the guard test** to `describe('ownedRecordSchema')`: `it('is the shared base record contract', () => expect(ownedRecordSchema).toBe(baseRecordSchema))`, and a case rejecting `name: '  '` and `icon: 'Bad Icon'` (Review Focus 3).
- [ ] **Step 2: Run it to see it fail.** `pnpm --filter web exec vitest run src/lib/owned-records`. Expected: FAIL on the identity assertion.
- [ ] **Step 3: Re-base the schema** as listed under Files.
- [ ] **Step 4: Run the documents, dashboards and owned-records tests.** `pnpm --filter web exec vitest run src/lib/owned-records src/features/documents src/features/dashboards`. Expected: PASS, unchanged counts plus the new cases.
- [ ] **Step 5: Checkpoint commit** (if authorized): `refactor(owned-records): use the base record contract from domain-records`.

### Task 4: Records, then the repository gate

**Files:**

- Modify: `docs/architecture/reorganization-ownership-map.md` (rows `lib/owned-records`, `UI types`, `spaces`: M5.1 note naming what moved and what stays); `docs/architecture/workspace-conventions.md` (inventory: `domain-records` First code `M5 (exists)`; the sentence after the table names it); `docs/architecture/decisions/0014-multi-app-package-boundaries.md` (section 7 current-implementation sentence: `domain-records` created in M5.1; the base record's fields are the ten listed in its README); `packages/domain/README.md` (status sentence if it still says no domain package exists beyond identity); `.agents/task-scope.md` (M5 entry: execution, exact creates/updates/deletes, verification); the design's status line (M5.1 implemented)

- [ ] **Step 1: Update the records** listed. No owner quotes; decisions as "owner decision, 2026-10-23".
- [ ] **Step 2: Repository gate.** `pnpm verify`. Expected: every stage passes. If Playwright browsers are missing, `pnpm exec playwright install chromium` once. If the sandbox blocks the e2e server, rerun that stage outside the sandbox and report which run passed.
- [ ] **Step 3: Report** per AGENTS.md section 9: what moved, what was preserved (field order, messages, RLS), checks run and not run (live Supabase not exercised; no manual UI check is needed because no component changed, and the report says so), remaining M5 work (5.2–5.4, Q4, Q5, Q7).
- [ ] **Step 4: Checkpoint commit** (if authorized): `docs: record milestone 5.1 record contracts`.

## Left open on purpose

- Q4 (Space detail sample content), Q5 (navigation capability), Q7 (stories for moved components): asked before M5.2 and M5.3.
- Whether copy belongs in domain schemas (design C3): the Space messages move verbatim; not decided here.
- `domain-identity` lists `zod` under `devDependencies` although its shipped schemas import it. Pre-existing; not changed by this plan. Raise it with the owner as its own change.
