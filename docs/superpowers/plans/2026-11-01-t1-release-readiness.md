# T1 release readiness and execution plan

**Status:** Proposed, 2026-11-01. A read-only assessment and plan. It authorizes no hosted query, migration, deployment, merge or configuration change; every hosted step below is the owner's act, behind its gate. Agents never run commands against a hosted project ([database-release.md](../../engineering/database-release.md), "Who may do what").

**Scope:** database release 1 (train **T1** in the [execution roadmap](2026-10-30-database-execution-roadmap.md)): migration 13 and the five migrations of slices S1 and S2, and the application in PR 135 that needs them.

**Evidence labels used below:** **Verified** (checked in this assessment, source named) · **Ledger** (a row in the [deployment ledger](../../engineering/database-deployment-ledger.md), with its own provenance) · **Inferred** (reasoned from verified facts, not observed) · **Owner check** (needs hosted or account access an agent does not have) · **Decision** (the owner's to make).

## 1. Verdict

**Not ready for T1.** The repository side is implementation-complete for S1, and for S2 except one story-layer item (section 8). No G0 prerequisite has been verified: no production project ref is recorded, backups and recovery are unconfirmed, preview isolation is unverified, hosted timeouts have not been read, and branch protection is off. Two decisions need the owner before T1, because T1 makes them permanent: ADR-0018's parameters and the durable table and function names it introduces (section 7).

Separately, **production may already be failing** on the Dashboard detail page (section 3.1). That is inferred, not observed, and the owner should check it first: it changes the urgency, not the gates.

## 2. Authoritative state

| Fact                                                                                                                                                                                                           | Label       | Source                                                                                            |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------- |
| `refactor/supabase-database` at `eaa11dbe` passes `pnpm verify` (no Turbo cache), `pnpm db:test`, `server-data` `test:db` (43 tests), `test:db:budgets` (2 of 2, V-7 and V-8), `db:types --stack` with no diff | Verified    | runs on 2026-11-01 in an isolated worktree                                                        |
| PR 135 CI passes on merge `b9b441e3` (`main` `d70a4d14` + `eaa11dbe`): `verify`, `security`, `db-tests`, `db-types`, `pr-hygiene`                                                                              | Verified    | GitHub run 41316065116                                                                            |
| Production has 12 of 13 migrations; migration 13 (`20261029100000_create_dashboard_compositions`) is not applied                                                                                               | Ledger      | 2026-10-29 row, "not re-verified"                                                                 |
| The ledger's Environments table has no production or preview ref                                                                                                                                               | Verified    | `database-deployment-ledger.md`                                                                   |
| A merge to `main` deploys `apps/web` to Production; Vercel builds a Preview for every branch except `dependabot/**` and `db/**`                                                                                | Verified    | `apps/web/vercel.json`; roadmap section 5                                                         |
| A merge to `main` does not apply migrations: the Supabase GitHub integration reports per-PR preview branches **disabled** and `main` **not associated with any Supabase branch**                               | Verified    | the integration's check-run output on PR 135 and on `main`                                        |
| Migrations reach hosted only through the owner's `supabase db push`                                                                                                                                            | Verified    | `database-release.md` steps 8 and 9; no workflow in `.github/workflows` touches a hosted database |
| `main` has no branch protection and no rulesets; the repository is **public**, so both are available on its plan                                                                                               | Verified    | GitHub API: `protected: false`, 0 rulesets, `visibility: public`                                  |
| Merged branches are deleted automatically; only squash merges are allowed                                                                                                                                      | Verified    | GitHub API repository settings                                                                    |
| Preview deployments use a separate Supabase project, or not                                                                                                                                                    | Owner check | the reachable Vercel account is a different team from the one deploying this repository           |

## 3. Migration risk and dependency assessment

### 3.1 Current production and the deployed application

- `main`'s `loadComposition` reads `dashboard_compositions` and throws on any read error; it treats only "no row" as empty. If migration 13 is absent on hosted, PostgREST answers "table not found" and every Dashboard detail page throws. **Inferred** from the ledger row and the code; **owner check:** open a Dashboard in production, or read the Vercel runtime logs for that route.
- **`main`'s deployed app is forward-compatible with T1** (**inferred** from code; each point checked against `main` at `d70a4d14`):
  - after T1 every Dashboard has a composition at revision 1 (backfill), so `main` loads revision 1 and saves at 2, which the `+1` rule accepts;
  - `main` inserts a composition only when it loaded none; after T1 that cannot happen, which matters because T1 revokes client `INSERT` on the table;
  - `main` writes `schema_version` 1 only, within the new size backstop;
  - `main` updates only `pinned_at` and `last_viewed_at` on resources, so the metadata pre-image trigger on `dashboards` never fires for it.
- **Two writes from `main` can be refused after T1**, because `NOT VALID` constraints are enforced on every new insert and update immediately (only the scan of existing rows is skipped):
  1. creating a resource with a name over 120 characters (`main` has no length limit);
  2. **any update of an existing row that already violates a limit**, including the `last_viewed_at` write on every visit. So the V-13 counts (section 5) gate **T1 itself**, not only `_validate`.
- **PR 135's app is not compatible with the pre-T1 schema:** it treats a missing composition as an error (`composition_missing`), relying on the D4 trigger and backfill. Merging it before T1 is applied breaks every existing Dashboard.

### 3.2 The sequence

T1 applies six migrations, in this exact order (**verified** file names):

1. `20261029100000_create_dashboard_compositions` (migration 13)
2. `20261030055359_composition_integrity`
3. `20261030055402_dashboard_revisions`
4. `20261030055406_composition_initialization`
5. `20261030065709_resource_metadata_bounds`
6. `20261030065713_resource_metadata_bounds_validate`

| #   | Locks taken                                                                                                                                             | Data work                                                                                         | Privileges                                                                                                  |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 1   | creates a table; its foreign keys take brief locks that block writes on `public.dashboards` and **`auth.users`**                                        | none                                                                                              | RLS on; select, insert and update own rows; column-level grants                                             |
| 2   | `ALTER TABLE` on the new, empty table                                                                                                                   | none                                                                                              | **revokes client `INSERT`** and drops the insert policy; adds the `+1` trigger (SQLSTATE `PT409`)           |
| 3   | creates `dashboard_revisions`; adds `BEFORE UPDATE OF name, description, icon, tags` on `public.dashboards` (brief lock)                                | inserts nothing (no composition exists yet)                                                       | clients read their own revisions only; `SECURITY DEFINER` capture functions in `private`, `EXECUTE` revoked |
| 4   | adds an `AFTER INSERT` trigger on `public.dashboards` (brief lock)                                                                                      | **backfill:** one composition per existing Dashboard, each firing the `backfill` revision capture | `SECURITY DEFINER` in `private`                                                                             |
| 5   | `ADD CONSTRAINT … NOT VALID` on `spaces`, `documents`, `dashboards`, `space_documents`, `space_dashboards`: a brief **`ACCESS EXCLUSIVE`** lock on each | none (no scan)                                                                                    | `public.resource_tags_valid(text[])`, executable by `authenticated`                                         |
| 6   | `VALIDATE CONSTRAINT`: scans each table under `SHARE UPDATE EXCLUSIVE`, which does not block reads or writes                                            | scan only; fails if any row violates                                                              | none                                                                                                        |

**Risks:**

- **No `lock_timeout` is set** in any of the six. A long-running transaction on one of these tables puts the `ALTER` in the lock queue, and every later query on that table waits behind it. Mitigation: apply in a quiet window after the P7 check (section 5). Adding `set local lock_timeout` is possible only before these migrations reach `main` (D3): it would change reviewed files and needs a fresh verification, so it is a **decision**, not a default.
- **Partial failure is the sharpest hazard.** The CLI applies each file in its own transaction. If the run stops after migration 2 and before 4, Dashboards have no composition row **and** clients may not insert one: every save from the deployed app fails until the remaining migrations apply. Recovery is forward only: fix the cause and run `supabase db push` again, which applies only the pending files. Never `migration repair` or `db reset` on hosted.
- **Migration 6 fails if any row violates.** That is the intended stop. The P4 counts must be zero before the train starts, both because of point 2 in section 3.1 and because a failed 6 leaves the train half-applied (1–5 applied, 6 pending). That state is safe to run in, but it must be recorded.
- **Backfill size:** one composition insert and one revision per existing Dashboard, in one transaction. The cost scales with the P3 Dashboard count; at expected volumes it is small. **Owner check:** record the count first.
- **Idempotency:** each file runs once, through the migration history. The backfill statements are themselves idempotent (`where not exists`), and the event trigger uses `if not exists`.
- **Rollback:** reverting application code never reverses schema or data. There is no down migration (D3). After T1, the safe application rollback floor is `main` as of `d70a4d14` (compatible, as in section 3.1). Rolling back further than PR 135 is fine; rolling the **database** back means a point-in-time restore, which loses everything written since, hence D2.

## 4. Release strategy

| Criterion           | A. Apply T1 before merging PR 135                                                                                             | B. Split: migrations PR to `main`, apply, then the app                      | C. Migration-first pipeline                                                                               |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Infrastructure      | Supported: manual `db push` from a pinned commit                                                                              | Supported: manual `db push` from `main`                                     | **Not supported:** no pipeline exists; the Supabase integration is not linked to `main`; D14 is undecided |
| Production safety   | Safe if the gates pass: `main`'s app is forward-compatible                                                                    | The same, and the migrations PR changes no app behaviour                    | n/a                                                                                                       |
| Migration history   | Hosted holds five versions that `main` does not, until PR 135 merges; a migration merged to `main` meanwhile could interleave | **Hosted is always a subset of `main`**; the parity script runs from `main` | n/a                                                                                                       |
| Deployment ordering | DB, verify, then merge (deploys the app)                                                                                      | merge (m) (no app change), DB, verify, then merge (a)                       | n/a                                                                                                       |
| Rollback            | App to `d70a4d14`; DB by restore only                                                                                         | The same                                                                    | n/a                                                                                                       |
| CI                  | PR 135 CI as it stands                                                                                                        | CI on both PRs; (m) is small and reviewable                                 | n/a                                                                                                       |
| Complexity          | Low; needs a migration freeze on `main` from the apply until the merge                                                        | Higher: PR 135 must be restructured (separately authorized)                 | n/a                                                                                                       |

**Recommendation: B.** It follows the roadmap's release protocol, keeps every applied migration on `main` (so `pnpm db:parity` is run from the branch that defines production), and its first merge is inert: the migrations, regenerated types and SQL tests, which leave `main`'s app working with or without them (verified above). It needs the owner to authorize restructuring PR 135 into (m) and (a).

**If B is not authorized, A is acceptable** with three conditions: apply from the exact commit PR 135 will merge, with migration files frozen until the merge; no other migration merged to `main` in between; and PR 135 merged promptly after the post-migration check, before the app is redeployed for any other reason.

## 5. Read-only preflight queries (owner runs them; aggregates only)

Run against the project recorded as `production` in the ledger, through the SQL editor or `psql`, never through an agent. None of these reads row contents.

```sql
-- P0. Identity
select current_database(), version();

-- P1. Migration history: expect the 12 versions through 20261018100000, and none of the six T1 versions
select version from supabase_migrations.schema_migrations order by version;

-- P2. Drift: objects T1 creates must not already exist; prerequisites must
select to_regclass('public.dashboard_compositions') as compositions,
       to_regclass('public.dashboard_revisions')    as revisions,
       to_regnamespace('private') is not null         as private_schema,
       to_regprocedure('public.set_updated_at()') is not null as set_updated_at;
select n.nspname, p.proname
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where (n.nspname = 'private' and p.proname in (
          'enforce_revision_increment','create_default_composition','reject_revision_update',
          'dashboard_revision_policy','dashboard_state_hash','capture_dashboard_revision',
          'capture_initial_revision','capture_checkpoint_revision','capture_metadata_preimage'))
    or (n.nspname = 'public' and p.proname = 'resource_tags_valid');
select conname from pg_constraint
 where conname like any (array['%\_name\_length','%\_description\_length','%\_icon\_length',
                               '%\_tags\_valid','%\_position\_nonnegative']);

-- P3. Volume (backfill size, V-8 inputs)
select 'spaces' as t, count(*) from public.spaces
union all select 'documents', count(*) from public.documents
union all select 'dashboards', count(*) from public.dashboards
union all select 'space_documents', count(*) from public.space_documents
union all select 'space_dashboards', count(*) from public.space_dashboards;
select max(n) as max_dashboards_per_owner,
       percentile_cont(0.5) within group (order by n) as median
  from (select owner_id, count(*) as n from public.dashboards group by owner_id) s;

-- P4. V-13 violators: every value must be 0 before T1 (repeat with documents and dashboards)
select
  count(*) filter (where char_length(name) > 120)                                  as name_over,
  count(*) filter (where description is not null and char_length(description) > 2000) as description_over,
  count(*) filter (where char_length(icon) > 64)                                   as icon_over,
  count(*) filter (where coalesce(cardinality(tags), 0) > 20)                      as tags_over_20,
  count(*) filter (where exists (select 1 from unnest(tags) as t(tag)
                                  where tag is null or tag <> btrim(tag)
                                     or char_length(tag) < 1 or char_length(tag) > 50)) as tag_invalid,
  count(*) filter (where (select count(distinct lower(tag)) from unnest(tags) as t(tag))
                         <> coalesce(cardinality(tags), 0))                         as tag_case_duplicate
from public.spaces;
select count(*) filter (where position < 0) as negative from public.space_documents;
select count(*) filter (where position < 0) as negative from public.space_dashboards;

-- P5. V-13 RLS: expect no rows, and the event trigger enabled ('O')
select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public' and c.relkind in ('r','p') and not c.relrowsecurity;
select evtname, evtenabled, evtevent from pg_event_trigger where evtname = 'ensure_rls';

-- P6. V-14 timeouts (V-8 depends on the authenticated statement timeout)
select rolname, rolconfig from pg_roles
 where rolname in ('anon','authenticated','authenticator','service_role','postgres');

-- P7. At apply time: nothing long-running that would hold the ALTERs in the lock queue
select count(*) as active, max(now() - xact_start) as oldest_transaction
  from pg_stat_activity where state <> 'idle' and pid <> pg_backend_pid();
```

Also: export the Supabase security and performance advisors (V-13), and record the plan and database size (V-14).

## 6. T1 runbook

Each step maps to [database-release.md](../../engineering/database-release.md). "Owner" means the step needs the owner's explicit authorization and is never an agent's act.

| #   | Step                                 | Prerequisites                              | Where                         | Evidence of success                                                                                                                                                                    | On failure                                                                                     | Who   |
| --- | ------------------------------------ | ------------------------------------------ | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ----- |
| 1   | Preflight and identity               | none                                       | Supabase dashboard; local     | production and preview refs entered in the ledger (reviewed PR); P0–P2 as expected; `supabase link`, then `pnpm db:parity --environment production` names the same ref                 | stop; resolve the identity or any drift                                                        | Owner |
| 2   | Backup and recovery (D2)             | 1                                          | Supabase dashboard            | backups and PITR confirmed; recovery point, RPO and RTO in the ledger; a **restore tested** into a scratch project, if the plan allows                                                 | stop; no T1 without a recovery path                                                            | Owner |
| 3   | Preview isolation (D1, PI-1 to PI-4) | 1                                          | Vercel; Supabase              | a probe branch's Preview cannot reach production data                                                                                                                                  | stop                                                                                           | Owner |
| 4   | Production data validation (V-13/14) | 1                                          | SQL editor                    | P3 recorded; **every P4 value 0**; P5 clean; advisors exported; P6 recorded                                                                                                            | non-zero P4: the owner decides per row before T1 (nothing is rewritten by the migrations)      | Owner |
| 5   | Dry run                              | 1–4; PR 135 restructured (B) or frozen (A) | local, linked                 | `pnpm db:parity --environment production --expect-pending` lists exactly the six versions in section 3.2, no `remote-only`; `supabase db push --dry-run` lists the same six            | stop; investigate                                                                              | Owner |
| 6   | Authorization checkpoint             | 1–5                                        | —                             | the owner's written go, with the window and the person on call                                                                                                                         | —                                                                                              | Owner |
| 7   | Apply                                | 6; P7 quiet                                | local, linked                 | `supabase db push` reports the six applied                                                                                                                                             | partial: record the state, fix the cause, push again (forward only); never `repair` or `reset` | Owner |
| 8   | Post-migration checks                | 7                                          | local; SQL editor             | `pnpm db:parity` clean; `dashboard_compositions` count equals the P3 Dashboard count; one `backfill` revision each; constraints `convalidated = true`; advisors triaged; RLS unchanged | stop before step 9; app stays on `main` (compatible)                                           | Owner |
| 9   | V-8 on hosted                        | 8; P6                                      | production, throwaway account | deleting a seeded heavy throwaway account finishes within half the hosted `authenticated` statement timeout                                                                            | stop: chunked or deferred deletion is a decision before S1 RC                                  | Owner |
| 10  | App deploy                           | 8, 9                                       | GitHub                        | merge (a) (B) or PR 135 (A); Vercel deployment id recorded                                                                                                                             | roll back the app to `d70a4d14` (compatible with T1); the schema stays                         | Owner |
| 11  | Smoke and monitoring                 | 10                                         | production                    | a throwaway account creates, opens, edits and saves a Dashboard; a stale save is refused; the history row appears; resource limits refuse over-limit input; no new errors in logs      | app rollback as in 10; schema problems need a forward fix                                      | Owner |
| 12  | Ledger                               | 7–11                                       | repository PR                 | apply, checks, deployment id, smoke and risk acceptances (G-quota-T1) recorded                                                                                                         | —                                                                                              | Owner |

## 7. ADR-0018 (revision capture)

ADR-0018 is **Proposed**, and the implementation matches it exactly (verified: 5-minute quiet gap, 30-minute span and 500-revision cap in `private.dashboard_revision_policy()`; SHA-256 dedupe; pruning in the capturing transaction; one lock order). It records the owner's D3, D4 and D8; the mechanism values are the implementing agent's.

**Must be decided before T1**, because T1 makes them durable on the hosted database and changing them afterwards needs a forward migration:

1. Accept ADR-0018, or overrule its parameters (gap, span, cap). A later change is a new migration, not an edit.
2. The names: `dashboard_revisions`, `sequence` and the `private.capture_*` functions are working labels until the glossary naming step runs, and the glossary has no entry for them. Once applied they are durable schema identifiers (AGENTS.md section 5). Either run the naming step now, or accept these names explicitly as final.
3. The per-account growth risk (G-quota-T1): 500 revisions per Dashboard and no per-account quota. The ledger needs its risk acceptance with T1.

**Can wait:** history and restore UI (S7), Document history (S5), extracting the `+1` rule into a shared function.

## 8. S1 and S2 implementation status (evidence as of 2026-11-01)

| Slice | IC      | Evidence                                                                                                                                                                                                                                                                                                                               |
| ----- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1    | **yes** | every IC-blocking item has a passing test on `eaa11dbe`: V-1 and V-2 (`dashboard-compositions.dbtest.ts`), V-3 and V-10 (`dashboard-revisions.sql`, staged backfill), V-11 (dbtest, fails above a 2.0 ratio), V-7 and V-8 (`budgets.budget.ts`, 2 of 2, local). `pnpm verify`, `db:test`, `test:db`, `db:types` pass; PR 135 CI passes |
| S2    | **no**  | all but one section G layer pass: SQL (`resource-metadata-bounds.sql`), two-user (`metadata-bounds.dbtest.ts`), unit (shared `limit-vectors.json`), types. **Missing: the Story layer**, "Quick Create over-limit state with axe": Quick Create lives in `apps/web`, whose components Storybook does not collect                       |

Neither slice is merged to `main`, hosted-applied or release-complete. Only hosted verification can move those columns.

## 9. Verification gaps

| Gap                             | Before T1?            | Why                                                                                                                                            |
| ------------------------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Backup and recovery tested      | **Yes**               | T1 has no down migration; a restore is the only database rollback                                                                              |
| Preview isolation               | **Yes**               | the branch builds Previews; if they share production's database, an unreleased app version writes production data                              |
| Hosted checks (P0–P7, advisors) | **Yes**               | P4 non-zero breaks the deployed app as soon as T1 lands (section 3.1); drift breaks the train                                                  |
| V-8 on hosted                   | Before S1 RC          | the local run passes against a local 8 s timeout; the hosted timeout is unknown (P6)                                                           |
| `test:db:budgets`               | Done                  | ran on `eaa11dbe`: 2 of 2 passed (269 s), local                                                                                                |
| Fixture-mode e2e on `eaa11dbe`  | Before the app deploy | it passed on PR 133's head and the settings fix, not on the integrated commit; fixture mode never touches the database, so it does not gate T1 |
| Local-session e2e               | Before the app deploy | the only test of real sign-in through the stack; it needs the local Supabase stack, which is available                                         |
| S2 Story layer                  | Before S2 IC          | a spec item, not a release blocker for T1's schema                                                                                             |

## 10. Owner decisions, in dependency order

1. Check production's Dashboard page now (section 3.1): it decides urgency, not order.
2. Record the production and preview refs in the ledger (D2 starts here).
3. Confirm backups, PITR, RPO and RTO, and test a restore (D2).
4. Decide and verify preview isolation (D1).
5. Turn on branch protection or a ruleset on `main` requiring `verify`, `db-types` and `db-tests` (available: the repository is public).
6. Decide D14, the deploy mechanism (the roadmap recommends F4's runbook, which this plan follows).
7. ADR-0018: accept or overrule; settle the names (section 7).
8. Choose the strategy: B (authorize restructuring PR 135) or A (with the freeze).
9. Optionally: a `lock_timeout` in the migrations (only before they reach `main`).
10. Run P0–P7 and the advisors; decide any non-zero P4 row.
11. Authorize the T1 window (runbook step 6), then the app deploy (step 10).
