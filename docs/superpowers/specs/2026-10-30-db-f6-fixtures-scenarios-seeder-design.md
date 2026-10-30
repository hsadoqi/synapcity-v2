# F6: Fixtures, Scenarios and Local Seeder

**Status:** Proposed. F6a and F6b are implementation-ready. F6c needs the owner's approval of a new `packages/dev` package (D13 is an agent parameter; a new package needs approval under ADR-0014).
**Date:** 2026-10-30
**Roadmap:** [database execution roadmap](../plans/2026-10-30-database-execution-roadmap.md), slice F6
**Contracts:** [database architecture handoff](2026-10-30-database-architecture-handoff.md) §9 item 11 (fixtures follow the triggers), §10 (loopback only)
**Branches:** `db/f6a-fixture-factories`, `db/f6b-scenarios`, `db/f6c-local-seeder`

## A. Identity and scope

- **Capability:** `pnpm db:seed:local` produces a realistic two-user dataset on a local stack. Tests and stories get contract-valid, unique fixtures.
- **Problem (Faker audit):**
  - FX-01: every factory spreads one shared `defaultFixtures`, so IDs are duplicated (20 Spaces share one ID).
  - FX-02: shapes are unpersistable: a `LucideIcon` component, `Date` objects, `title` instead of `name`.
  - FX-03: `seed.sql` seeds every existing auth user and nothing on a fresh reset.
  - FX-04: timestamps can be inverted, and emails use real domains.
  - FX-05: the only guard is a comment.
  - FX-06: committed JSON has no consumer.
  - FX-07: the seed test compares generated output with itself.
- **Exists:** `packages/dev/fixtures/src/{index,seed,generate-seed,prototype-workspace,spaces/space-entity}.ts` and their tests; `supabase/seed.sql`; `supabase/tests/seed-sample-data.sql`.
- **In scope:**
  - **F6a:** factory repair.
  - **F6b:** the `starter` and `two-user-isolation` scenarios.
  - **F6c:** the loopback-only seeder, plus reducing `seed.sql` to nothing.
- **Out of scope:** removing the JSON exports (FX-06), which is a separately approved cleanup. Lifecycle, participation and content scenarios belong to S3, S4 and S5, each in its own module.
- **Dependencies:** F6a none. F6b needs F6a. F6c needs F6b, F2, S1 applied locally, and the D13 package approval.

## B. Data model

No migration. Scenarios never insert compositions, revisions, content rows, activity events or profiles; the triggers create them (AH §9 item 11).

## C. Contracts

- **Factories:** `createSpace(overrides?)`, `createDocumentRecord(overrides?)`, `createDashboardRecord(overrides?)` in `@synapcity/dev-fixtures`.
  - Each call builds a fresh object.
  - `icon` is a string matching `ICON_NAME_PATTERN`.
  - Timestamps are ISO strings with `createdAt ≤ updatedAt`.
  - The result is parsed with the domain schema (`spaceSchema`, `baseRecordSchema`) before it is returned.
  - Values stay inside the D5 limits once S2 lands.
- **People:** `createPerson()` uses `@synapcity.test` emails.
- **No `lucide-react` dependency** in dev-fixtures.
- **Scenarios** are pure data graphs with stable seeded UUIDs:

  ```ts
  type Scenario = {
    users: ScenarioUser[];
    spaces: …;
    documents: …;
    dashboards: …;
    memberships: …;
  };
  ```

  `starter` matches today's sample (Writing, Learning, Personal) for two users. `two-user-isolation` adds cross-user near-collisions (the same names, no cross-user edges).

- **Seeder (F6c):** `packages/dev/database-seed` (pending approval), command `pnpm db:seed:local`.
  - It refuses non-loopback targets (the F2 guard, extracted to `scripts/lib/loopback.mjs` or the package).
  - It reads the local service key from `supabase status`.
  - It creates users through the Admin API, with passwords from an ignored `.env.seed.local`.
  - It signs in as each user and inserts through that user's ordinary client, so RLS, defaults and triggers apply.
  - It is idempotent: it skips a user whose scenario marker Space exists.

## D. Integration

- **Consumers to migrate in F6a's PR** (found by `git grep` at implementation time): `apps/web` fixtures, `features-spaces` testing samples, stories. Each moves from `CommonEntityProps` to the contract-backed factories in the same PR.
- **`seed.sql`:** reduced to a comment pointing to `db:seed:local`. `supabase/tests/seed-sample-data.sql` is replaced by a scenario round-trip test run by the seeder's own test.

## E. Fixtures

This slice is the fixture work itself.

## F. UI

Not applicable. Stories keep rendering, using the new factories.

## G. Verification

| Check               | Command                                                                                                                      | Must pass |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------- |
| Factories           | `pnpm --filter @synapcity/dev-fixtures test check-types`                                                                     | yes       |
| No aliasing         | mutating one factory result never changes another                                                                            | yes       |
| Determinism         | same seed and reference date give identical output                                                                           | yes       |
| Scenario invariants | unique IDs; every membership endpoint has the same owner; no cross-user edge; all records pass the schemas                   | yes       |
| Seeder              | run twice: no duplicates; each Dashboard has one composition at revision 1 and one revision (after S1); refuses a hosted URL | yes (F6c) |
| Repository checks   | `pnpm verify`                                                                                                                | yes       |

## H. Completion

- **IC:** F6a and F6b green with consumers migrated. F6c green against a disposable stack.
- **RC:** merged; there is no hosted component, and the seeder never targets hosted.

## I. Risks

- Story snapshots may change visually because names and icons change. Per the visual-review practice, functional results are shown and no restyling is done.
- F6c without package approval: fall back to a root `scripts/db-seed-local.mjs`, which is also an agent parameter option under D13.
