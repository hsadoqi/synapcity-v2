# Database Execution Roadmap

**Status:** Proposed, revision 2, 2026-10-30. A planning document only. It authorizes no implementation, migration, hosted change, commit, push or deployment.
**Date:** 2026-10-30
**Requested by:** Repository owner
**Owns:**

- the slice inventory and stable slice IDs;
- the dependency graph, merge order, release trains and execution waves;
- Preview isolation (section 5a);
- each slice's completion status.

It is the single system of record for implementation sequence and status.

**Does not own:** persistence contracts, invariants, migration constraints and decisions.

- Those are in the [database architecture handoff](../specs/2026-10-30-database-architecture-handoff.md) (Current direction), cited below as **AH §n**, and in the decision register of the reconciliation roadmap it cites (git-ignored, in the refactor worktree only).
- Nothing here restates or reopens a decision.
- Where this plan's slice layout, PR structure, UI or fixture design differs from the reconciliation roadmap's Section I drafts, this plan governs; contracts do not (AH §1).
- Where this plan found a handoff gap, section 11 proposes an amendment for the owner. This plan does not edit the handoff.

## 1. Status vocabulary

Each slice's status is tracked in section 8 on these columns, never merged into one word:

| Column                           | Meaning                                                                                                                                                         | Evidence required                                                     |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| **IC** (implementation-complete) | Every applicable layer is integrated on the slice branch and verified on an isolated local database and in CI, including every verification item that blocks IC | the exact commands of section 6 and their results, recorded in the PR |
| **Merged (m)**                   | The slice's expand-only migrations, types and database tests are on `main`                                                                                      | merge commit                                                          |
| **Merged (a)**                   | The rest of the slice is on `main`                                                                                                                              | merge commit                                                          |
| **Hosted applied**               | The release train containing the slice's migrations was applied to the approved project                                                                         | deployment ledger entry                                               |
| **Post-migration verified**      | Ledger, catalog and count checks passed after the apply                                                                                                         | ledger entry                                                          |
| **App deployed**                 | The application version that needs the schema is in production                                                                                                  | Vercel deployment id                                                  |
| **RC** (release-complete)        | The deployed behavior passed the slice's production acceptance checks, and every RC gate in its spec is met                                                     | ledger entry with date, versions and project ref                      |

A slice is never reported as done on IC alone. Passing local tests or CI is IC evidence, not RC evidence. A slice whose RC is open is reported as "deployed: incomplete" (AH §9 item 12).

**Verification items** (AH §8, plus the plan-level items in section 10):

- They do not block beginning a slice.
- They block IC, the named merge or the named release until they pass.
- A failing result stops that step until the design is corrected, and may introduce a new owner decision.

## 2. Slice inventory

Slice IDs follow the handoff's numbering where its Section I draft exists, so its verification items ("Slice 1", "Slice 3", "Slice 5") resolve to the same slices. New slices take the next numbers. Foundation work is F1 to F6; F6 is three slices, F6a, F6b and F6c.

| ID  | Name                                      | User capability                                                                                               | Exists today                                                                       | Kind                                                                    | Spec                                                                      |
| --- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| F1  | Database test signal                      | none (CI runs every SQL test)                                                                                 | 5 SQL files, never run in CI                                                       | foundation, no migration                                                | [spec](../specs/2026-10-30-db-f1-database-test-signal-design.md)          |
| F2  | Local-target safety                       | none (development tools refuse hosted database targets)                                                       | no guards in `db:types`                                                            | foundation, no migration                                                | [spec](../specs/2026-10-30-db-f2-local-target-safety-design.md)           |
| F3  | Auth availability                         | an Auth outage shows "unavailable", not a sign-out                                                            | claims error discarded; cache headers dropped                                      | foundation, app only                                                    | [spec](../specs/2026-10-30-db-f3-auth-availability-design.md)             |
| F4  | Release and parity tooling                | none (operator release procedure, ledger, monitoring queries)                                                 | none                                                                               | foundation, no migration                                                | [spec](../specs/2026-10-30-db-f4-release-parity-tooling-design.md)        |
| F5  | Database test harness                     | none (two-user, concurrency, backfill and policy tests)                                                       | e2e temp-user helper and lock only                                                 | foundation, no migration                                                | [spec](../specs/2026-10-30-db-f5-database-test-harness-design.md)         |
| F6a | Contract-backed factories                 | none (unique, persistable fixtures)                                                                           | shared `defaultFixtures`, unpersistable shapes                                     | foundation, no migration                                                | [spec](../specs/2026-10-30-db-f6-fixtures-scenarios-seeder-design.md)     |
| F6b | Named scenarios                           | none (starter and two-user graphs)                                                                            | none                                                                               | foundation, no migration                                                | same spec                                                                 |
| F6c | Local seeder                              | `pnpm db:seed:local` gives a realistic two-user dataset                                                       | `seed.sql`                                                                         | foundation, no migration                                                | same spec                                                                 |
| S1  | Dashboard persistence and history capture | every Dashboard opens and saves, stale saves are refused, history is captured from its first state            | migration 13 undeployed; insert on first save                                      | product, train T1                                                       | [spec](../specs/2026-10-30-db-s1-dashboard-persistence-history-design.md) |
| S2  | Resource metadata contract                | names, descriptions, tags and icons have the same limits everywhere                                           | no limits                                                                          | product, train T1                                                       | [spec](../specs/2026-10-30-db-s2-resource-metadata-contract-design.md)    |
| S3  | Archive, Trash and activity capture       | archive, move to Trash, restore and permanently delete Spaces, Documents and Dashboards; actions are recorded | hard delete policies; no app delete                                                | product, train T2                                                       | [spec](../specs/2026-10-30-db-s3-archive-trash-activity-design.md)        |
| S4  | Space participation                       | add to or remove from a Space, create inside a Space, reorder                                                 | reads only                                                                         | product, train T2                                                       | [spec](../specs/2026-10-30-db-s4-space-participation-design.md)           |
| S5  | Document content and history capture      | write in a Document with autosave, conflicts and history from the first write                                 | read-only page with a "not available" note                                         | product, train T3                                                       | [spec](../specs/2026-10-30-db-s5-document-content-history-design.md)      |
| S6a | Account verification and Auth parity      | none new (proves profile, preferences, avatar storage, account deletion; local Auth matches hosted semantics) | working, untested in SQL                                                           | product hardening, no migration                                         | [spec](../specs/2026-10-30-db-s6a-account-auth-parity-design.md)          |
| S6b | Recoverable avatar cleanup                | replacing an avatar or deleting the account never leaves an unrecorded public image                           | best-effort cleanup; a folder sweep that can delete a concurrently uploaded avatar | product hardening, train T3                                             | [spec](../specs/2026-10-30-db-s6b-avatar-cleanup-design.md)               |
| S7  | History and restore experience            | see earlier states and activity; restore an earlier state; name a version                                     | data captured by S1, S3, S5                                                        | product, train T4                                                       | [spec](../specs/2026-10-30-db-s7-history-experience-design.md)            |
| S8  | Collaboration readiness                   | post-MVP; D7 defers it                                                                                        | —                                                                                  | not specified (AH §2 D7)                                                | none                                                                      |
| S9  | Resource details editing                  | rename and edit description, icon and tags of a Space, Document or Dashboard                                  | `rename` action exists in the collection kit, unwired; no update path              | product, app only (after T2)                                            | [spec](../specs/2026-10-30-db-s9-resource-details-editing-design.md)      |
| S10 | Read efficiency and degraded state        | link widgets fetch only what they show; a failed source is visible, not empty                                 | over-fetch; `allSettled` hides failures; double reads                              | product, app only                                                       | [spec](../specs/2026-10-30-db-s10-read-efficiency-design.md)              |
| S11 | Paginated lists                           | long lists load in pages                                                                                      | unpaginated against `max_rows = 1000`                                              | product; app only unless EXPLAIN requires an index migration (S11 spec) | [spec](../specs/2026-10-30-db-s11-paginated-lists-design.md)              |

Not slices: per-user pin and last-viewed state stays as it is (D7). Dashboard creation with its default composition is S1's trigger plus the existing `createRecord`.

## 3. Dependency model

Four edge types. Only **R** edges and **G** edges wait on hosted or owner action.

| Edge                 | Meaning                                                                     | Satisfied by                                                                                             |
| -------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **I** implementation | the slice branch needs this code or schema to build and verify              | the dependency's commits in the branch (stacked) and applied to the slice's isolated local database (F5) |
| **M** merge          | must reach `main` first                                                     | the merge order in section 4                                                                             |
| **R** release        | hosted schema that must exist before the app version needing it is deployed | an approved hosted release train and its post-migration check                                            |
| **G** gate           | owner action or decision before a merge, push or release                    | the owner, recorded in the ledger                                                                        |

```text
I edges (development and local verification; no hosted action)
  F1 ─► F5
  F1, F5 ─► IC of every database slice (S1–S5, S6a, S6b, S7, and S11 if it needs a migration)
  F2 ─► F4, F6c
  F6a ─► F6b ─► F6c             (serial among themselves; parallel to everything else)
  S1 ─► F6c                    (seeded Dashboards need the trigger)
  S1 ─► S3   (composition lock protocol and read-only rule; amended test file)
  S2 ─► S3, S4, S9             (bounded record schemas; position check)
  S3 ─► S4   (trashed-endpoint refusal, attach/detach events)
  S3 ─► S9   (rename events, trashed refusal)
  S3 ─► S11  (lifecycle filter is where paging lives)
  S1, S3 ─► S5                 (shared +1 function; content lock protocol)
  S6a ─► S6b                   (account SQL tests and the delete_own_account baseline)
  S1, S3, S5 ─► S7
  independent of the S1–S5 product chain: F3, S10, S6a (S6a still needs F1, F5 for IC)

M edges (merge order to main; section 4)
  F1 ═► S1(m) ═► S2(m) ═► S3(m) ═► S4(m) ═► S5(m) ═► S6b(m-expand) ═► S7(m)
  S6b(a) ═► S6b(m-contract)      (contract merges only after the app switch is on main and deployed)

R edges (hosted, release trains; section 5)
  G0 ┄► T1 {S1(m), S2(m)} ┄► S1(a), S2(a)
  T1 ┄► T2 {S3(m), S4(m)} ┄► S3(a), S4(a), then S9, S11
  T2 ┄► T3 {S5(m), S6b(m-expand)} ┄► S5(a); S6b(a) also needs G-runner
  T3 + S6b(a) deployed ┄► T3c {S6b(m-contract)} ┄► S6b RC
  T3 ┄► T4 {S7(m)} ┄► S7(a)

G edges (owner)
  G0 (incl. Preview isolation PI-1..PI-4) ┄► T1 and every push in PI-3
  G-quota-T1/T2/T3 (risk acceptance, section 10) ┄► RC of S1, S3, S5
  G-S7m (restore scope, privilege boundary, named-version limits) ┄► S7(m)
  G-lexical, G-editor-location ┄► S5 editor layer
  G-runner (cleanup runner approval) ┄► S6b(a)
```

**Critical path to IC** (I edges only): F1 → F5 → S1 ∥ S2 → S3 → S5 → S7. No hosted action lies on it.
**Critical path to production** (R and G edges): G0 → T1 → T2 → T3 → T4. T3c (S6b's contract) branches from T3 once S6b(a) is deployed, and is independent of T4.
**Parallel:** F2, F3, S10 at any time. The F6a → F6b chain alongside other work. S6a after F5, alongside the product chain. S1 ∥ S2. S9 alongside S4 once S3 is in its branch.

## 4. Parallel schema development and integration

Branches with migrations may be developed in parallel. Integration is controlled, not single-file.

1. **Merge order.** Migrations merge in AH §5 M-2 and M-3 order:
   - `composition_integrity`, `dashboard_revisions`, `composition_initialization`, `resource_metadata_bounds` (with its separate `…_validate`, see S2);
   - then `resource_lifecycle_columns`, `resource_lifecycle_rules`, `activity_events`, `activity_capture`, `create_record_in_space`;
   - then `document_contents`, `document_revisions`, `document_content_initialization`;
   - then `storage_cleanup_queue`.

   S6b's migration touches no object another slice owns, so its position is a timestamp position only (section 10, item 6). An S11 index migration, if needed, merges after the train it waits for (S11 spec).

2. **Timestamps.** Files are created with `supabase migration new` (AH M-1). If a branch's migration would merge with an older timestamp than one already on `main`, it is recreated with `supabase migration new` before merge and its contents moved. That is allowed because D3 immutability starts at merge. `supabase db push` pushes an older-than-remote migration only with `--include-all` (Supabase CLI 2.122.0 help), which is never used.
3. **Generated types** (`packages/server/supabase/src/database-types/database.types.ts`) are regenerated with `pnpm db:types` on a fresh local database after every rebase. They are never hand-merged; CI `db-types` proves it.
4. **Object ownership.** One slice owns each shared object per release train. Another slice that alters it stacks on the owner's branch (I edge) and merges after it (M edge):

| Shared object or file                                               | Owner                                                                 | Also altered by                                                                              | Rule                                                                       |
| ------------------------------------------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `dashboard_compositions`, its triggers                              | S1                                                                    | S3 (trashed read-only trigger; lifecycle lock protocol)                                      | S3 stacks on S1                                                            |
| `dashboard_revisions`, capture functions, `private` policy function | S1                                                                    | S5 (extracts shared `+1` function), S7 (restore source, labels)                              | S5, S7 stack on S1                                                         |
| `spaces`, `documents`, `dashboards`                                 | S3 (lifecycle columns, rules, DELETE policies)                        | S1 (Dashboard init and metadata pre-image triggers), S2 (CHECKs), S5 (Document init trigger) | additions commute; S3 must not change the `*_set_updated_at` `when` clause |
| `space_documents`, `space_dashboards`                               | S4                                                                    | S2 (`position` CHECK), S3 (insert policy refuses trashed endpoints; activity triggers)       | S4 stacks on S2 and S3                                                     |
| `public.delete_own_account`, `profiles.avatar_url` writes           | S6b                                                                   | none                                                                                         | S6b stacks on S6a                                                          |
| `supabase/tests/dashboard-compositions.sql`                         | S1                                                                    | S3 adds cases                                                                                | S3 after S1                                                                |
| `supabase/tests/{spaces,documents-and-dashboards}.sql`              | S3                                                                    | S2 adds new files instead                                                                    | no shared edits                                                            |
| `server-data/src/owned-row/owned-row.ts`                            | S3 (`archived_at`, `deleted_at` in `COLUMNS`, `OwnedRow`, `toFields`) | none                                                                                         | —                                                                          |
| `server-data/src/records/records.ts`                                | S3                                                                    | S9 adds a separate `records/record-metadata.ts`                                              | no shared edits                                                            |
| `server-data/src/dashboards/dashboard-compositions/`                | S1                                                                    | S3 (trashed refusal mapping)                                                                 | S3 after S1                                                                |
| `domain-records` `base-record.ts`                                   | S2 (limits)                                                           | S3 (`archivedAt`, `deletedAt`, lifecycle state), S9 (patch schema)                           | S3 and S9 rebase on S2                                                     |
| `frontend-collection` `CollectionItemAction`, `ItemActionsMenu`     | S3                                                                    | S9 (wires `rename`), S4 (`remove-from-space`)                                                | S9 and S4 rebase on S3                                                     |
| `server-account` avatar flow (`save-avatar.ts`, `removeOldAvatars`) | S6b                                                                   | none                                                                                         | —                                                                          |
| `dev-fixtures`                                                      | F6a (factory core)                                                    | each slice adds its own scenario module                                                      | modules per slice                                                          |

**Stacked branches** rebase on their base after it merges, then regenerate types and rerun the whole database test suite.

## 5. Release protocol and trains

A merge to `main` deploys `apps/web` to Production (`apps/web/vercel.json`, `docs/engineering/setup.md`), while hosted migrations are a separate approved act. So the app on `main` must always work against the currently deployed hosted schema (AH M-5).

Each slice is **one branch, one spec and one IC claim**, and lands in at most two merges:

- **(m)** the slice's expand-only migrations, regenerated types, SQL and harness tests. They must leave the app on `main` working with or without them.
- **(a)** everything else, merged only after the release train containing (m) is applied and post-migration verified.
- A slice whose app code works against both schema states is one merge.
- **Expand/migrate/contract exception (S6b only).** A slice that must remove a client write path the deployed app still uses lands in three merges:
  1. **(m-expand)**, which adds the new path;
  2. **(a)**, which switches the app to it;
  3. **(m-contract)**, which revokes the old path, in its own train immediately after the app switch is deployed (T3c for S6b). It is never bundled with an unrelated slice's train, so another slice's decisions cannot delay it.

  Its status has separate cells for the contract step, and its RC is possible only after the contract train. S6b is the only such slice. Any new one needs the same explicit treatment in this roadmap.

No slice is split by technical layer for any other reason. Between (m) and (a), the slice is "IC on branch, merged (m), RC open".

| Train                       | Contains                                                              | Gate before apply                                                                                                               | After apply                   |
| --------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| **T1** (database release 1) | migration 13 (on hosted for the first time) plus S1 and S2 migrations | G0 (including PI-1 to PI-4); V-13 aggregates; V-8 passed for S1's history volume; AH §10 and roadmap Section G checklist        | S1(a), S2(a)                  |
| **T2**                      | S3 and S4 migrations                                                  | T1 RC; V-8 passed with S3's event volume; V-15 passed (section 10); checklist                                                   | S3(a), S4(a); then S9 and S11 |
| **T3**                      | S5 and S6b migrations                                                 | T2 RC; V-8 passed with S5's Document history volume; V-6, V-7 within budget; V-15 passed for Documents; checklist; S5 approvals | S5(a); S6b(a) after G-runner  |
| **T3c**                     | S6b(m-contract) only                                                  | T3 post-migration verified; S6b(a) deployed                                                                                     | S6b RC checks                 |
| **T4**                      | S7 migrations                                                         | T3 RC; G-S7m decided before S7(m) merged                                                                                        | S7(a)                         |

**A failing V-8 stops its train.** If account deletion of the slice's heavy-account fixture misses the S1 spec's budget, the train does not apply. A chunked or deferred deletion design is required, an owner decision, before the affected slice can reach IC.

Per-slice deployment sequence (AH §9 item 12): implement on the branch, test locally, PR verification, approved hosted migration, post-migration check, app release, production verification.

**Rollback floors.** A slice may declare a minimum app version below which rollback is unsafe once its data exists (S3, section I). The ledger records each floor, and an app rollback below a recorded floor needs the floor's precondition check first.

**G0, owner actions before T1:**

- D2 facts: production identity, backups and PITR, recovery point, RPO and RTO.
- Preview isolation in effect and verified (section 5a; mechanism per D1). This is the real safety gate for previews.
- Advisor export and the read-only `ensure_rls` query (V-13). Hosted role timeouts read for V-8 (V-14).
- Branch protection requiring `verify`, `db-types` and `db-tests`, once F1's job name exists.
- D14 mechanism (F4's runbook is the recommendation).

## 5a. Preview isolation (release-safety requirement)

**Exposure (Exists).**

- The `web` Vercel project deploys a Preview for every pushed branch except `dependabot/**` (`apps/web/vercel.json`).
- Production and Preview read the same `NEXT_PUBLIC_SUPABASE_*` entries (reconciliation roadmap, Vercel env metadata, values not decrypted).
- So any preview of any branch runs its code against the production database, with the session of whoever signs in to it. Previews can already create, pin and save compositions in production today.
- Each slice that adds a write class raises the severity: Archive, Trash and permanent delete (S3), membership writes (S4), Document content (S5), metadata edits (S9), cleanup enqueueing (S6b). Before T2, production's live-row `DELETE` policies are still in force.

**Why a branch rule is not the solution.** `git.deploymentEnabled` decides by branch name whether a deployment is created. Every branch not matching the rule still deploys a preview with the Preview environment's variables, whoever creates it and whatever it contains. The isolation must hold at the environment level: what the Preview target is allowed to reach, not which branches are built. F2 may add a `db/**` exclusion as defense in depth. It is never counted toward PI-1 to PI-4.

**Requirement.**

| ID   | Requirement                                                                                                         | Verification                                                                                                                                                                   |
| ---- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| PI-1 | No Vercel environment except Production holds the production Supabase URL or publishable key.                       | Owner reads the env var metadata (names and targets only, never decrypted values) and records it in the ledger.                                                                |
| PI-2 | A new preview deployment of any branch cannot read or write production data.                                        | A probe branch's preview is opened; its network requests reach no production Supabase host (option A: none; option B: the preview project's ref only). Recorded in the ledger. |
| PI-3 | PI-1 and PI-2 are in effect before T1 (part of G0), and before any branch carrying S3, S4, S5, S6b or S9 is pushed. | The ledger entry predates the first such push.                                                                                                                                 |
| PI-4 | Adding a Supabase variable to the Preview or Development target is a reviewed change.                               | Noted in `docs/engineering/setup.md` by the slice that documents the chosen option.                                                                                            |

**Environment-level options.** D1 is a deployment gate; the owner chooses.

- **A. Previews fail closed: remove `NEXT_PUBLIC_SUPABASE_*` from the Preview target.**
  - The handoff's recommendation, not approved.
  - Immediate and free.
  - Consequence: every preview page errors, because `getSupabaseEnv()` throws in the proxy and fixture mode requires `NODE_ENV=development`, which a Vercel build is not. Previews then stop being useful for UI review.
  - A friendlier "this preview has no backend" response would be a separately specified app change after the choice.
- **B. A separate hosted preview project with Preview-scoped variables.**
  - Previews keep working with sign-in, against synthetic data only.
  - Costs: a second project on the plan (V-14); migrations applied to it through the same release procedure (F4) before or alongside each train; its own Auth redirect configuration, avoiding wildcards per `docs/engineering/setup.md`; and `SITE_URL` for Preview (OP-09).
  - Recommended once signed-in previews are needed.
- **C. Supabase branching.** A per-branch database. Plan-dependent, and its current availability and cost are not verified (AGENTS §7a). Considered only if B's manual migration upkeep becomes a burden.

**Recommendation.** Apply A now to close the exposure before T1, and adopt B when signed-in previews are needed.

**Defense in depth, later:** an app-level guard that refuses the production project ref outside the Production environment. It needs a new env variable name, so it is part of the D1 choice.

This assignment does not implement any of it. Vercel and Supabase changes are owner actions behind the gates.

## 6. Shared definition of done

For every slice:

1. Every applicable layer is integrated: migration, constraints, generated types, validation, data access, authorization, Server Actions or routes, fixtures and scenarios, UI, stories, tests and documentation. Each spec says why a layer does not apply.
2. Commands, all run and reported with results:
   - `pnpm verify`.
   - Database slices: `pnpm db:test` (all SQL files), `pnpm --filter @synapcity/server-data test:db` (two-user and concurrency) and `pnpm db:types` with no diff. F1 and F5 create the first two; they do not exist yet.
   - Signed-in flows: `pnpm --filter web test:e2e:local-session`.
3. **Negative proof.** Each new policy, grant, constraint or trigger is shown to fail its test when deliberately weakened. The weakening is a temporary commit, recorded in the PR and reverted before merge (AH §4).
4. **Concurrency proof.** Every invariant that spans two rows (lock protocols in S1, S3, S5, S7) has a two-session test that would fail without the lock. A sequential trigger test alone does not count.
5. Fixtures and scenarios change in the same branch as the schema. No seed is left inconsistent.
6. ADR, glossary and README amendments are in the same branch as the behavior they describe. A term that becomes a durable identifier passes `docs/glossary.md`'s naming process before its migration merges, because D3 makes it permanent at merge (AH §3).
7. Checks not run, behavior not covered, and pre-existing failures are listed by name.
8. RC only through section 5 and the ledger, with the slice's RC gates.

## 7. Execution waves

**Wave 1** (start now; all repository-only; parallel worktrees, each on an isolated local database):

| Order | Slice                                    | Why now                                                                       |
| ----- | ---------------------------------------- | ----------------------------------------------------------------------------- |
| 1     | F1                                       | every later slice needs a trustworthy database signal                         |
| 1     | F2                                       | tooling guards before any slice runs database commands                        |
| 1     | F3                                       | independent, app only                                                         |
| 1     | F6a                                      | independent of other work; F6b follows it                                     |
| 1     | S10                                      | independent, app only                                                         |
| 2     | F5 (after F1 merges)                     | isolation, two-user and concurrency tests for every database slice            |
| 2     | S1, S2 (develop now; IC needs F1 and F5) | T1 contents; no blocking decisions                                            |
| 3     | S6a (after F5)                           | SQL and Storage tests, local Auth alignment; independent of the product chain |
| 3     | F4; F6b (after F6a)                      | release tooling and monitoring before T1; scenarios                           |

**Integration order for wave 1:**

1. F2, F1.
2. F3, F6a, S10, in any order.
3. F5.
4. S1(m), S2(m).
5. F4.
6. S6a.
7. F6b.

In parallel, the owner performs G0, including Preview isolation. T1 is applied after S1(m), S2(m) and F4 merge, G0 is done and V-8 passes for S1. Then S1(a) and S2(a) merge and deploy.

**Wave 2** (T2), in this order:

1. S3 developed locally, stacked on S1 and S2.
2. S4 developed locally, stacked on S3.
3. S3(m) merges.
4. S4 rebased on `main`, types regenerated, full database suite rerun.
5. S4(m) merges.
6. T2 applied and post-migration verified (gates in section 5).
7. S3(a) and S4(a) merge and deploy. S3's rollback floor is recorded.
8. S9 (stacked on S2 and S3, developed in parallel with steps 2 to 7) merges after T2.
9. S11 merges after T2, if its EXPLAIN check shows no index migration is needed. Otherwise see the S11 spec's conditional path.
10. F6c, after its package approval and once S1 is applied locally.

The S3, S4 and S9 branches are developed locally and pushed only once PI-3 holds.

**Wave 3** (T3):

1. S5's persistence layer develops as soon as S1 and S3 are in its branch.
2. S5's editor layer develops after G-lexical and G-editor-location.
3. S6b develops after S6a merges.
4. S5(m) merges, then S6b(m-expand), then T3 is applied.
5. S5(a) merges.
6. S6b(a) merges after G-runner and deploys.
7. S6b(m-contract) merges, and T3c (the contract only) is applied right after. Then S6b's RC checks run.

**Wave 4** (T4): S7 develops when G-S7m is decided. S7(m) merges, then T4 is applied, then S7(a) merges.

## 8. Slice status

The system of record for completion. Every row is one slice. A cell changes only with the evidence named in section 1, recorded in the Evidence column (PR, commit, ledger entry or deployment id). Values are as of 2026-10-30.

| Slice              | IC  | Merged (m)                  | Merged (a) | Hosted applied              | Post-migration verified     | App deployed | RC                          | Evidence |
| ------------------ | --- | --------------------------- | ---------- | --------------------------- | --------------------------- | ------------ | --------------------------- | -------- |
| F1                 | no  | n/a                         | no         | n/a                         | n/a                         | n/a          | no                          | —        |
| F2                 | no  | n/a                         | no         | n/a                         | n/a                         | n/a          | no                          | —        |
| F3                 | no  | n/a                         | no         | n/a                         | n/a                         | no           | no                          | —        |
| F4                 | no  | n/a                         | no         | n/a                         | n/a                         | n/a          | no                          | —        |
| F5                 | no  | n/a                         | no         | n/a                         | n/a                         | n/a          | no                          | —        |
| F6a                | no  | n/a                         | no         | n/a                         | n/a                         | n/a          | no                          | —        |
| F6b                | no  | n/a                         | no         | n/a                         | n/a                         | n/a          | no                          | —        |
| F6c                | no  | n/a                         | no         | n/a                         | n/a                         | n/a          | no                          | —        |
| S1                 | no  | no                          | no         | no                          | no                          | no           | no                          | —        |
| S2                 | no  | no                          | no         | no                          | no                          | no           | no                          | —        |
| S3                 | no  | no                          | no         | no                          | no                          | no           | no                          | —        |
| S4                 | no  | no                          | no         | no                          | no                          | no           | no                          | —        |
| S5                 | no  | no                          | no         | no                          | no                          | no           | no                          | —        |
| S6a                | no  | n/a                         | no         | n/a                         | n/a                         | n/a          | no                          | —        |
| S6b (expand + app) | no  | no (m-expand)               | no         | no (T3)                     | no                          | no           | no — needs the contract row | —        |
| S6b (contract)     | n/a | no (m-contract)             | n/a        | no (T3c)                    | no                          | n/a          | no                          | —        |
| S7                 | no  | no                          | no         | no                          | no                          | no           | no                          | —        |
| S9                 | no  | n/a                         | no         | n/a                         | n/a                         | no           | no                          | —        |
| S10                | no  | n/a                         | no         | n/a                         | n/a                         | no           | no                          | —        |
| S11                | no  | n/a until the EXPLAIN check | no         | n/a until the EXPLAIN check | n/a until the EXPLAIN check | no           | no                          | —        |

For foundation slices without a deployed part, RC means merged with its own completion criteria met (each spec's section H).

## 9. Mapping to the reconciliation roadmap

| Reconciliation roadmap                        | This plan          |
| --------------------------------------------- | ------------------ |
| Section I Slice 0 / Phase 0, PR-1, PR-2, PR-4 | F1, F2, F3, F4, F5 |
| Section I Slice F / Phase 3, PR-3, PR-7/8     | F6a, F6b, F6c      |
| Slice 1 / PR-5a, 5b, 5d                       | S1 (m) and (a)     |
| Slice 2 / PR-5c                               | S2                 |
| Slice 3 (update metadata moved to S9)         | S3, S9             |
| Slice 4                                       | S4                 |
| Slice 5                                       | S5                 |
| Slice 6 / Phase 2, PR-6                       | S6a, S6b           |
| Slice 7 / Phase 7                             | S7                 |
| Slice 8 / Phase 8                             | S8 (not specified) |
| Phase 5 (targeted link queries, memoization)  | S10                |
| RS-03 keyset pagination                       | S11                |

Departures from Section I, which this plan governs (AH §1):

- Metadata editing is its own slice (S9), with record-level optimistic concurrency.
- Lifecycle views are tabs on the existing index pages instead of separate routes.
- Destructive actions extend `ItemActionsMenu` instead of turning Quick Create into an action dialog.
- Slice 6 is split into S6a and S6b.
- S4 reorders through one function.
- S6b replaces the folder sweep with exact-object cleanup intents.

## 10. Remaining items before or during execution

**Owner decisions and approvals (gates):**

| Gate                               | Item                                                                                                                                                                                                                                                                                                                     | Blocks                           |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------- |
| G-lexical                          | Introducing Lexical as a dependency. No workspace depends on it today.                                                                                                                                                                                                                                                   | S5 editor layer                  |
| G-editor-location                  | Where the editor and the Document content contract live (a new package needs approval under ADR-0014).                                                                                                                                                                                                                   | S5 editor layer                  |
| G-runner                           | The service-role cleanup runner (AH §9 item 13).                                                                                                                                                                                                                                                                         | S6b(a) and S6b RC                |
| G-S7m                              | Restore scope (content only, or full state), the privilege boundary (S7 section B), and named-version limits.                                                                                                                                                                                                            | S7(m)                            |
| G-S7a                              | Where history and activity appear in the UI.                                                                                                                                                                                                                                                                             | S7(a) only                       |
| G-seeder                           | The `packages/dev` seeder package (D13, new package). The fallback is a root script.                                                                                                                                                                                                                                     | F6c                              |
| G-pg                               | A dev-only Postgres client (`pg`) for F5's two-session runner. The fallback is coordinated `psql` processes.                                                                                                                                                                                                             | none (fallback exists)           |
| G-quota-T1, G-quota-T2, G-quota-T3 | Explicit risk acceptance of unbounded per-account growth, with the F4 monitoring queries and thresholds in place. Covers resources and Dashboard revisions (T1), activity events with no retention policy (T2), and Document content and history (T3). The handoff tells this plan not to invent a quota (AH §9 item 7). | RC of S1, S3 and S5 respectively |

**Other owner choices** (the spec is written with the recommendation; overrulable, not blocking):

1. **S6b merge position.** AH M-3 places `storage_cleanup_queue` last. It shares no object with S3 to S5, so the owner may allow it earlier. Until then it waits.
2. **S9 consistency guarantee:** a details edit never silently overwrites a concurrent edit (record-level optimistic concurrency).
3. **Naming.** AH §3 requires the glossary naming process for Archive, Trash, revision and activity before they become durable identifiers. The owner's 2026-10-30 instruction says physical identifiers need glossary approval only for a genuine semantic distinction. These two need reconciling. Either way, the glossary step happens inside S1 and S3 before their migrations merge.

**Verification items and their pass conditions** (they block the named step; see section 1):

| Item                                            | Where      | Blocks                                              | Pass condition                                                                                                                                   |
| ----------------------------------------------- | ---------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| V-1, V-2, V-3, V-10, V-11                       | S1         | S1 IC                                               | as in AH §8 and the S1 spec                                                                                                                      |
| V-4                                             | S1, S2, S5 | each slice's IC                                     | rejection of NUL and unpaired surrogates at every text boundary                                                                                  |
| V-5                                             | S5         | S5 IC                                               | Lexical round trip lossless                                                                                                                      |
| V-6                                             | S5         | S5 IC, T3                                           | the S5 spec's save-latency and write-amplification budget                                                                                        |
| V-7                                             | S1, S5     | S1 and S5 IC                                        | the S1 and S5 specs' prune-latency budget                                                                                                        |
| V-8                                             | S1, S3, S5 | IC and the slice's train (T1, T2, T3)               | the S1 spec's deletion budget, rerun with each slice's added volume; a failure stops the train                                                   |
| V-9                                             | S3         | S3 IC                                               | counts exclude trashed members                                                                                                                   |
| V-12                                            | S2         | none                                                | tracked only                                                                                                                                     |
| V-13, V-14                                      | G0         | T1                                                  | operator records                                                                                                                                 |
| **V-15** (plan-level; proposed for the handoff) | S3, S5     | S3 IC and T2 (Dashboards); S5 IC and T3 (Documents) | a content write racing a move to Trash commits either before the Trash, or is refused. None commits after the Trash. Proven by two-session tests |
| **V-16** (plan-level)                           | S5         | S5 IC                                               | a valid Document just below 2 MiB, including an escape-heavy one, passes through the real Server Action transport limit (3 MB)                   |

**Deployment gates:** D1 (the Preview isolation mechanism), D2, D14, G0, T1 to T4.

**Documentation updates** (inside the owning slice):

- ADR-0016 amendments and a new revision-capture ADR (S1);
- ADR-0013 and ADR-0012 amendments and new lifecycle and activity ADRs (S3);
- the ADR-0006 "Unresolved" text and the deployment ledger (F4);
- the version-history spec marked superseded in part (S1);
- `PRODUCT.md` open decisions and the glossary History row (S1, S3);
- the Document content ADR (S5).

## 11. Proposed amendments to the architecture handoff

These are found gaps where a slice mechanism would otherwise fail a handoff invariant. They are for the owner and the architecture session to accept or reject. This plan applies them in its specs as plan-level requirements and does not edit the handoff.

Completion claims that rely on items 1 and 3 (S3 and S5 IC for V-15; S6b RC for INV-20) wait for the owner's response. Two kinds of response are distinguished:

- **The handoff edit is declined, but the requirement is explicitly accepted.** The slice keeps it as a plan-level requirement and records that the handoff was not amended.
- **The requirement itself is rejected.** The plan cannot keep it, because the owner's decision governs (AH §1). The affected slice is re-specified, and its completion criteria are re-evaluated against the owner's decision.

1. **Add V-15 (lifecycle and content serialization)**, blocking Slice 3 (Dashboards) and Slice 5 (Documents). It ensures INV-15 cannot be reduced to a sequential trigger test.
2. **Clarify INV-8 against restore scope.** Either full-state restore (INV-8 literal), or "a revision is an immutable complete historical state; its content is restorable; whether metadata is restored is S7's decision". Gate G-S7m resolves it.
3. **Strengthen INV-20.** Cleanup intent is durable before the application reports a replacement or deletion as successful. A queued entry identifies its object so precisely that it can never remove a later replacement.
4. **State the verification-table semantics.** Work may begin. IC, merge or release cannot pass until the applicable item passes. A failure introduces remediation and possibly an owner decision.
5. **Optional:** in D1, or in §10 operational safety, a one-line pointer to this roadmap's section 5a, without duplicating PI-1 to PI-4.
