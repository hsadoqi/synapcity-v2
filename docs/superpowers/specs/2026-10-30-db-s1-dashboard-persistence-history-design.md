# S1: Dashboard Persistence and History Capture

**Status:** Proposed. Implementation-ready. Every governing decision is Decided (D3, D4, D8). V-1 to V-3, V-7, V-8, V-10 and V-11 do not block starting the slice; they block S1 IC, and V-8 also blocks T1 (roadmap section 1).
**Date:** 2026-10-30
**Roadmap:** [database execution roadmap](../plans/2026-10-30-database-execution-roadmap.md), slice S1, release train T1
**Contracts:** [database architecture handoff](2026-10-30-database-architecture-handoff.md) D3, D4, D8; INV-2 to INV-13; M-1 to M-9; §6; §9 items 1 to 4, 6, 9 and 11
**Branch:** `db/s1-dashboard-persistence`. Merges as (m) the migrations, types and database tests, then, after T1, (a) the application contract and E2E.

## A. Identity and scope

- **Capability:** every Dashboard opens and saves. A stale tab or a direct API caller can never overwrite newer work. Every Dashboard has its complete state captured as history from the moment it exists.
- **Problem:**
  - Migration 13 (`20261029100000_create_dashboard_compositions`) is undeployed, so hosted Dashboards fail to open (OP-01).
  - The code inserts on the first save, with a `revision 0` sentinel.
  - An owner can jump or rewind `revision` and write any `schema_version` (DB-01).
  - The size check measures `pg_column_size` (DB-02).
  - There is no history (DB-10).
  - The scheduler's automatic retry can report a false conflict (AH §9 item 9).
- **Exists:**
  - Database: migration 13, which stays untouched (D3).
  - `server-data`: `loadComposition` and `saveComposition`, with an insert branch at `expectedRevision === 0` and a zero-row follow-up read.
  - `apps/web`: `getDashboardComposition` (null becomes revision 0) and `saveDashboardComposition` (`revisionSchema` `min(0)`).
  - `features-dashboards`: the save scheduler (400 ms debounce, single-flight, one retry, `conflict` stops saving), save status, conflict UI, the `DashboardStorage` port and the browser adapter for fixture mode.
  - `domain-dashboards`: `createComposition()`, `parsePersistableComposition`, `MAX_COMPOSITION_BYTES`.
  - Tests: `supabase/tests/dashboard-compositions.sql`, `apps/web/e2e/dashboard-persistence.e2e.ts` (skipped without a hand-made session).
- **In scope:**
  - three forward migrations;
  - regenerated types;
  - SQL, two-user and concurrency tests;
  - the strict loader and single save path;
  - the idempotent retry;
  - text hygiene for composition strings;
  - a self-provisioning E2E;
  - ADR work.
- **Out of scope:**
  - the history UI and restore (S7);
  - presets;
  - the Dashboard metadata limits (S2, same train);
  - the lifecycle rules (S3).
- **Dependencies:**
  - I: F1, F5.
  - G: G0 before T1.
  - The glossary entry for "revision" before (m) merges (AH §3; roadmap section 10 item 6).

## B. Data model and persistence

**Migrations.** Forward only, after migration 13, each created with `pnpm exec supabase migration new <name>`, one transaction each.

**1. `composition_integrity`**

- Drop `dashboard_compositions_size`. Add `dashboard_compositions_text_size check (octet_length(composition::text) <= 131072)`. The table is empty on every persistent database, so it is validated immediately.
- Drop `dashboard_compositions_schema_version`. Add `check (schema_version in (1))`.
- Add `private.enforce_revision_increment()`, `SECURITY DEFINER` only if needed (invoker suffices for a row trigger; prefer invoker), with `search_path = ''`. Attach it as a `BEFORE UPDATE` trigger `dashboard_compositions_10_revision`. If `new.revision <> old.revision + 1`, it raises with the custom conflict SQLSTATE chosen in V-1. The candidate is `PT409`, which PostgREST maps to HTTP 409; it must be confirmed through the local PostgREST and supabase-js `error.code`.
- Drop policy `dashboard_compositions_insert_own`. `revoke insert on public.dashboard_compositions from authenticated`.

**2. `dashboard_revisions`** (table name is a working label; see the glossary step)

- **Table columns:**
  - `id uuid pk default gen_random_uuid()`;
  - `dashboard_id uuid not null references public.dashboards(id) on delete cascade`;
  - `owner_id uuid not null references auth.users(id) on delete cascade`;
  - `sequence bigint not null`;
  - `source text not null check (source in ('initial','checkpoint','backfill'))`;
  - `schema_version int not null`;
  - `composition jsonb not null`;
  - `name text not null`, `description text`, `icon text not null`, `tags text[] not null`;
  - `content_bytes int not null`, defined as `octet_length(composition::text)` (V-7);
  - `content_hash bytea not null`, the `sha256` of the canonical full state (below);
  - `created_by uuid`, set to `coalesce(auth.uid(), owner_id)`;
  - `created_at timestamptz not null default now()`.

  Plus `unique (dashboard_id, sequence)` and an index on `(dashboard_id, sequence desc)`.

- **Access:** RLS enabled. `select` policy for the owner. `revoke all … from public, anon, authenticated; grant select … to authenticated`.
- **`private.dashboard_revision_policy()`** returns `(gap interval, span interval, cap int)` = `('5 minutes', '30 minutes', 500)`. It is SQL, `stable`, and the only place the values live. Tests redefine it (M-7).
- **Canonical full-state hash:**

  ```sql
  sha256(convert_to(jsonb_build_object(
    'v', schema_version,
    'c', composition,
    'n', name,
    'd', description,
    'i', icon,
    't', to_jsonb(tags)
  )::text, 'UTF8'))
  ```

  `jsonb` output is canonical (sorted keys, normalized spacing), so equal states hash equally (V-3).

- **`private.capture_dashboard_revision(p_dashboard_id uuid, p_state …, p_source text)`** does the following, in order:
  1. Take the shared capture lock: `select 1 from public.dashboard_compositions where dashboard_id = p_dashboard_id for update`. On the composition path this lock is already held. It is the one lock both paths take, and the Dashboard row is never locked by the composition path (AH §9 item 1; V-2).
  2. Read the latest revision's hash. Return if it is equal (dedupe).
  3. Insert with `sequence = coalesce(max(sequence), 0) + 1`.
  4. Prune: delete automatic revisions (all current sources) beyond `cap`, oldest `sequence` first, never the newest.

  It is `SECURITY DEFINER`, `search_path = ''`, with `revoke execute … from public, anon, authenticated`.

- **Triggers:**
  - `dashboard_compositions_capture_initial`, `AFTER INSERT` on compositions. Source `initial` when the parent Dashboard was created in this transaction (`d.created_at = now()`), else `backfill`. It reads name, description, icon and tags from `dashboards` without a lock.
  - `dashboard_compositions_20_capture_checkpoint`, `BEFORE UPDATE` on compositions, after the `+1` trigger by name order. If `now() - old.updated_at >= gap`, or (`now() - latest.created_at >= span` and the old full-state hash differs from the latest revision's), it captures the pre-image (`old.*` with the current Dashboard metadata) as `checkpoint`.
  - `dashboards_capture_metadata_preimage`, `BEFORE UPDATE OF name, description, icon, tags` on `dashboards`. It freezes the head (current composition with `old` metadata) only if that full state exists in no revision. It never snapshots the new state (AH §6).
- **Backfill:** insert initial revisions with source `backfill` for any existing composition that has none. This is idempotent (`where not exists`); none exist on any persistent database (verified against the ledger in the reconciliation roadmap and re-checked as a count in V-13).
- **Immutability:** a `BEFORE UPDATE` trigger raising on any update. No update grant exists; the trigger guards administrator mistakes. DELETE is not blocked, because cascades must work.

**3. `composition_initialization`**

- `private.create_default_composition()`, `SECURITY DEFINER`, `search_path = ''`, execute revoked. It inserts `(dashboard_id, owner_id, composition, schema_version, revision) = (new.id, new.owner_id, <default>, 1, 1)`. Attach it as `AFTER INSERT` trigger `dashboards_create_composition`.
- `<default>` is a jsonb literal equal to `createComposition()` (INV-5).
- Set-based backfill: `insert … select … from public.dashboards d where not exists (select 1 from public.dashboard_compositions c where c.dashboard_id = d.id)`. Initial revisions come from migration 2's trigger with source `backfill`.

**Invariants:** INV-5 to INV-13 hold after T1:

- one composition per Dashboard;
- at least one revision per composition;
- `revision` rises by exactly 1;
- `sequence` is independent and gap-free under the lock;
- revisions are client-immutable.

**Concurrency:**

- Writers serialize on the composition row. The loser of a CAS race matches zero rows (`.eq('revision', expected)`), fires no trigger and creates no revision.
- A direct caller sending a wrong `revision` on a matching row gets the conflict SQLSTATE.
- A rename and a save racing both take the composition lock in the same order (V-2), so there is no deadlock and no sequence collision. Behavior under the local 8 s `lock_timeout` is measured.

**Compatibility (M-5):**

- The app on `main` sends `revision = expected + 1` and is compatible.
- After the backfill, its insert branch is never reached, so revoking INSERT is safe.
- The S1(a) app contract deploys only after T1.

**Existing records after T1:** every hosted Dashboard has the default composition at revision 1 and one `backfill` revision. Record the hosted Dashboard count before applying, as a count only (V-13).

## C. Domain contracts and validation

- `domain-dashboards` owns the shape and the 64 KiB compact-JSON contract (`parsePersistableComposition`). The database enforces type, the 128 KiB `jsonb::text` backstop, the supported version and the `+1` rule.
- **Parity tests** (unit, no database):
  1. Extract the default literal from the migration file and compare it with `createComposition()` (deep equality).
  2. Compare the SQL `schema_version in (1)` set with `COMPOSITION_SCHEMA_VERSION`.

  A database-level parity test, which inserts a Dashboard and compares the trigger-created composition with `createComposition()`, runs in `test:db`.

- **Text hygiene (V-4):** `parsePersistableComposition` rejects any string in the composition containing U+0000, or failing `String.prototype.isWellFormed()`, with reason `invalid-text`. It rejects, never sanitizes, because sanitizing changes content (AH §8 V-4). The predicate is `isStorableText(s)` in `@synapcity/domain-records`, shared with S2 and S5.
- **New error codes:**
  - `composition_missing`, thrown by the loader;
  - `conflict`, from the SQLSTATE or zero rows.

## D. Data access and application integration

- **`server-data/src/dashboards/dashboard-compositions/dashboard-compositions.ts`:**
  - `loadComposition`: a missing row throws `readError('composition of dashboard <id>', { code: 'composition_missing' })`. An unsupported version still throws. The return type becomes `Promise<StoredComposition>` (not nullable) for a well-formed id; a malformed id still returns `null` as "not found".
  - `saveComposition(client, dashboardId, composition, expectedRevision)`, with `expectedRevision >= 1`:
    1. Update `.eq('dashboard_id', id).eq('revision', expected)` with `revision: expected + 1`, then `.select('revision')`.
    2. If the error code is the conflict SQLSTATE, or zero rows match, go to step 3.
    3. Idempotent read-back: select `composition, revision`. If `revision === expected + 1` and the stored composition is deep-equal (key order ignored) to the submitted one, return `{ ok: true, revision: expected + 1 }`. If the revision differs, return `conflict`. Otherwise return `failed` with `row_not_written`.

    The insert branch is removed.
- **`apps/web/src/features/dashboards/server/get-composition/get-composition.ts`:** the server path returns `{ composition: DashboardComposition, revision: number }`, with `revision >= 1`. Fixture mode keeps `composition: null, revision: 0` for the browser adapter.
- **`apps/web/src/features/dashboards/server/actions/dashboard-composition-actions.ts`:** `revisionSchema = z.number().int().min(1)`. Otherwise the action is unchanged; the conflict mapping already exists.
- **`features-dashboards`:**
  - The `DashboardStorage` port keeps `composition | null` and an optional `revision`, because the browser adapter uses them.
  - The scheduler's single retry now benefits from idempotent success.
  - The provider's `source.composition ?? createComposition()` is reached only in fixture mode.
- **Errors in the UI:**
  - A `composition_missing` throw reaches `apps/web/src/app/(protected)/[userId]/home/dashboards/error.tsx`, which is fail-visible.
  - A conflict shows the existing conflict state and Reload.
- **Cache:** no `revalidatePath` on save (unchanged).

## E. Factories, fixtures and seeds

- Scenarios and seeders insert Dashboards only; the triggers supply compositions and revisions (AH §9 item 11).
- **`supabase/tests/dashboard-compositions.sql`** is rewritten:
  - Administrator composition inserts become updates of the trigger-created row.
  - The "owner may insert" cases become "client INSERT denied".
  - The `updated_at` assertion stays fixed (F1).
- **`supabase/tests/seed-sample-data.sql`:** each seeded Dashboard has one composition at revision 1 and one revision.
- **New `supabase/tests/dashboard-revisions.sql`**, with the full matrix in section G.

## F. Frontend and user experience

No new UI. Existing behaviors to verify against the strict server path:

- save status (saving, saved, failed with Retry, conflict with Reload);
- Undo;
- the live-region announcements.

A Dashboard whose row is missing shows the dashboards error page, not an empty canvas. Storybook: no new stories; the existing save-status stories cover the states.

## G. Verification

| Layer                   | Test                                                                                                                                                                                                                             | Where                                                   |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| SQL                     | a Dashboard insert by any path yields one composition at revision 1 and one `initial` revision                                                                                                                                   | `dashboard-revisions.sql`                               |
| SQL                     | the backfill creates a composition and a `backfill` revision for a pre-existing Dashboard (staged-backfill helper, V-10)                                                                                                         | same                                                    |
| SQL                     | client INSERT/DELETE on compositions refused; client INSERT/UPDATE/DELETE on revisions refused; `private.*` not executable (`has_function_privilege`)                                                                            | `dashboard-compositions.sql`, `dashboard-revisions.sql` |
| SQL                     | a revision jump, rewind or stale value raises the conflict SQLSTATE                                                                                                                                                              | `dashboard-compositions.sql`                            |
| SQL                     | `schema_version = 2` refused; 131072 bytes accepted, 131073 refused, multibyte boundary; 200 KB compressible payload refused                                                                                                     | same                                                    |
| SQL                     | gap: with the policy redefined to `gap = 0`, the next save freezes the pre-image; within the gap, none                                                                                                                           | `dashboard-revisions.sql`                               |
| SQL                     | span: with the policy redefined, a long burst freezes once past `span` when the head differs                                                                                                                                     | same                                                    |
| SQL                     | dedupe: unchanged save, no revision; rename then save gives the expected revision (V-3)                                                                                                                                          | same                                                    |
| SQL                     | metadata edit: never a new-state snapshot; the old state is frozen only when uncaptured                                                                                                                                          | same                                                    |
| SQL                     | prune with `cap = 3`: oldest pruned, newest kept                                                                                                                                                                                 | same                                                    |
| SQL                     | cascade: Dashboard delete and account delete leave no orphan compositions or revisions                                                                                                                                           | same                                                    |
| Two-user (`test:db`)    | B cannot read A's composition or revisions or update A's composition; a direct `.update({ revision: 99 })` returns the conflict code; a direct insert is refused; DB parity of `createComposition()`                             | `server-data`                                           |
| Concurrency             | two saves from one base: exactly one success, one conflict, no gap or duplicate in `sequence`; a rename racing a save: no deadlock, no unique violation, behavior under 8 s `lock_timeout` recorded (V-2)                        | F5 runner                                               |
| Unit                    | conflict mapping; zero-row read-back; idempotent success; loader throws on missing; `isStorableText`; both parity tests                                                                                                          | `server-data`, `domain-dashboards`, `domain-records`    |
| Measurement (pass/fail) | V-7 against budget B-1; V-8 against budget B-2; V-11 ratio of `jsonb::text` to compact JSON on realistic compositions, which fails above 2.0 because the 128 KiB backstop would then reject payloads the 64 KiB contract accepts | F5 runner; results recorded in the PR                   |
| E2E                     | `dashboard-persistence.e2e.ts` runs under `pnpm --filter web test:e2e:local-session`, creating its own user and Dashboard: save, reload, conflict from a second tab, failed save and Retry                                       | `apps/web/e2e`                                          |
| Types                   | `pnpm db:types` with no diff                                                                                                                                                                                                     | CI `db-types`                                           |
| Repository              | `pnpm verify`                                                                                                                                                                                                                    | CI `verify`                                             |

Negative proof (roadmap section 6): weaken the revision select policy, the `+1` trigger and the INSERT revoke in turn. Each must turn its test red.
**Budgets (pass/fail; agent parameters the owner may overrule).**

- **B-1 (V-7, prune cost):** a Dashboard has 500 revisions of 64 KiB compositions. A save that both checkpoints and prunes adds at most 50 ms at p95 (100 runs, local stack) over a save that does neither. `content_bytes` is `octet_length(composition::text)`. On-disk size is recorded against logical bytes for information. A miss fails S1 IC until pruning is redesigned, for example batched pruning only once the count exceeds the cap by a margin.
- **B-2 (V-8, account deletion):**
  - The heavy-account fixture: 50 Dashboards × 500 revisions of 16 KiB each, plus 20 Spaces with memberships.
  - **Gate:** each of 5 runs, after one warm-up run, must complete `delete_own_account()` within 50% of the lowest `statement_timeout` that applies to the calling session. The maximum of the 5 is compared, not a percentile; five observations cannot support a p95. Locally, `authenticated` has 8 s, so the limit is 4 s.
  - **Recorded with the result:**
    - machine and OS, CPU and memory, and the Supabase CLI and Postgres versions;
    - whether the stack was freshly started, and whether a warm-up run preceded;
    - shared-buffer state;
    - minimum, median, maximum and standard deviation.
  - **The hosted timeout is recorded separately** (read in G0, V-14) and is not measured by load. A local pass is a safety proxy for hosted latency, not proof of it, which is why the margin is 50%.
  - S3 and S5 rerun B-2 with their added volume.
  - A miss fails IC and stops the slice's train (T1, T2 or T3). A chunked or deferred deletion design, an owner decision, must land first.

## H. Completion criteria

**IC:**

- every row of section G passes on a fresh local stack and in CI;
- there is no insert branch and no `revision 0` sentinel in server code;
- the measurements are recorded;
- documentation lands:
  - the ADR-0016 amendments (decisions 1, 2, 3 and "does NOT decide");
  - a new revision-capture ADR;
  - the version-history spec marked superseded in part;
  - the `domain-dashboards` README note;
  - the glossary entry for revision and sequence.

**RC:**

- T1 applied through the F4 procedure;
- post-migration: compositions = Dashboards, and every composition has ≥ 1 revision (counts only);
- S1(a) deployed after that;
- production smoke with a throwaway account: create, open, save, reload;
- ledger entry.
- G-quota-T1: the owner's explicit risk acceptance of unbounded per-account Dashboards and revisions, with F4's monitoring queries scheduled, is recorded in the ledger.

## I. Risks and integration

- **Risks:**
  - The first hosted migration train. Mitigations: G0 backups, dry-run review, counts first.
  - Snapshot growth on a plan whose limits are unverified (V-14).
  - Prune cost in the save transaction (V-7).
  - Account deletion volume (V-8, budget B-2): a failure stops T1 until an approved chunked or deferred deletion design passes B-2.
- **Cross-slice:**
  - S3 stacks on this branch (the trashed-composition rule and test-file additions).
  - S5 replaces `enforce_revision_increment` with a shared function by a forward migration.
- **Recovery:** forward fix and app rollback only. No `db reset` or `repair` against hosted.
