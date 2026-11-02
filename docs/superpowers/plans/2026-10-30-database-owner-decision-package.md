# Database Owner Decision Package

**Status:** Owner decisions recorded 2026-10-30 (section 8). Section 9 is the Wave 1 authorization statement, awaiting approval. This document authorizes no implementation, migration, hosted change, commit, push or deployment by itself.
**Date:** 2026-10-30
**Baseline:** the revision 4 planning package: the [execution roadmap](2026-10-30-database-execution-roadmap.md), the [architecture handoff](../specs/2026-10-30-database-architecture-handoff.md) and the 17 slice specs.
**Role:** this is not a second decision register. The gate list stays in roadmap section 10. This document supplies the evidence and recommendations for those gates, so the owner can decide in one review. Once decided, the answers are copied into roadmap section 10 and the deployment ledger, and this document is archived as evidence.

Evidence labels: **[R]** verified in the repository, **[D]** documented intention, **[I]** inference.

## 1. Executive summary

- **Wave 1 has no genuine blocker.** Every Wave 1 slice (F1, F2, F3, F6a, S10, then F5, S1, S2, S6a, F4, F6b) is repository-only. The one Wave 1 item needing an owner answer is the `pg` dev dependency for F5, and its fallback needs none.
- **Three listed gates are mostly settled already:**
  - **Lexical** is the accepted editor direction [R: `PRODUCT.md:108`, `docs/glossary.md:41`].
  - **Document contract location** is decided: `domain-documents` [R: `workspace-conventions.md:59`, owner decision 2026-10-24].
  - **The editor package** is planned as `frontend-editor`, "created only after the editor and document body are approved" [R: `workspace-conventions.md:70`].
  - What is left is approving an exact Lexical version when S5's editor layer starts.
- **Nothing outstanding blocks a database migration** before S5's editor layer, S6b's runner build, or S7(m).
- **The decisions worth taking now are cheap and unblock later waves:** Preview isolation option A (D1), the `pg` dependency, the runner's execution model, and the quota thresholds. The rest wait for their first consumer.
- **Revision 4 has six inconsistencies** (section 6). None invalidates an approved contract. One is a missing acceptance criterion in S6b that I recommend fixing before S6b starts.

## 2. Decision register with recommendations

| ID                                       | State today                                                                                                                                                                                                                                                                                    | Decision required                                                           | Recommendation                                                                                                   | Owner approval?                        |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| **G0 / D1** Preview isolation            | **[R]** `apps/web/vercel.json` excludes only `dependabot/**`. **[D]** Production and Preview share the `NEXT_PUBLIC_SUPABASE_*` entries (reconciliation roadmap, env names only). Fixture mode needs `NODE_ENV=development` [R: `dev-fixture.ts`], so a Vercel preview cannot fall back to it. | Choose A, B or C (roadmap 5a)                                               | **A now** (remove the Supabase variables from the Preview target). Move to B when signed-in previews are needed. | Yes (Vercel change is an owner action) |
| **G0 / D2** Production identity, backups | **[D]** unverified facts                                                                                                                                                                                                                                                                       | Confirm `dpljdkyorwpntxkwpaqv` is production; record backups/PITR, RPO, RTO | Confirm and record in the ledger                                                                                 | Owner action, no design choice         |
| **G0 / D14** Deploy mechanism            | **[D]** F4 designs a runbook and `db-parity`                                                                                                                                                                                                                                                   | Accept the runbook                                                          | Accept                                                                                                           | Yes                                    |
| **G-quota**                              | **[D]** S6b: 5 pending uploads, 20 open intents per owner; no aggregate cap                                                                                                                                                                                                                    | Accept the bounds, the monitoring thresholds, and the unbounded aggregate   | See 3.2                                                                                                          | Yes, before RC of S1, S3, S5, S6b      |
| **G-runner**                             | **[D]** S6b rev 4 defines the claim RPCs, lease, fail backoff. No runner exists.                                                                                                                                                                                                               | Approve a service-role runner and its operating model                       | See 3.3                                                                                                          | Yes, before S6b is built               |
| **G-lexical**                            | **[R]** accepted direction; no workspace depends on it                                                                                                                                                                                                                                         | Approve the dependency and exact version                                    | See 3.4                                                                                                          | Yes, at the S5 editor layer            |
| **G-editor-location**                    | **[R]** `domain-documents` (contract) and `frontend-editor` (runtime) are named in conventions                                                                                                                                                                                                 | Confirm creating both                                                       | **Already decided in principle.** Confirm only that S5 is the "editor approved" trigger.                         | Confirmation                           |
| **G-S7m**                                | **[D]** S7 rev 4 specifies both restore designs                                                                                                                                                                                                                                                | Restore scope, privilege boundary, named-version limit, restore activity    | See 3.5                                                                                                          | Yes, before S7(m)                      |
| **G-S7a**                                | **[D]** UI placement                                                                                                                                                                                                                                                                           | Panel or route                                                              | Defer                                                                                                            | Yes, before S7(a)                      |
| **G-seeder**                             | **[R]** `dev-fixtures` holds factories; conventions say it "grows scenarios and sample content". No seeder exists.                                                                                                                                                                             | Where the local seeder lives                                                | See 3.6                                                                                                          | Yes, before F6c                        |
| **G-pg**                                 | **[D]** F5 needs two concurrent sessions; fallback is coordinated `psql`                                                                                                                                                                                                                       | Approve `pg` as a dev dependency                                            | See 3.7                                                                                                          | Yes, before F5                         |

## 3. Recommendations in detail

### 3.1 G0: Preview isolation and environment boundaries

- **Today (R, D):**
  - local: the shared stack with project id `synapcity` [R: `supabase/config.toml`];
  - Preview and Production: one hosted project;
  - staging: none.
- **Recommended boundaries:**
  - local → local stack only;
  - Preview → no Supabase (A) or a separate synthetic project (B);
  - Production → `dpljdkyorwpntxkwpaqv` only.
- **Fail-closed behavior [R]:** `getSupabaseEnv()` throws when the variables are missing, so option A makes previews error instead of reaching production.
  - This stops UI review on previews until B exists. Accept that: previews cannot be trusted with production data.
  - Side effects already known: Preview has no `SITE_URL`, so auth actions throw there (OP-09). That is acceptable under A.
- **Tradeoffs:**
  - B costs a second project, migration upkeep through F4 and redirect configuration. It is justified only when signed-in previews are needed, which is not documented as a current requirement.
  - C is plan-dependent and unverified.
- **Verification before T1 and before pushing S3, S4, S5, S6b, S9:** PI-1 to PI-4 (roadmap 5a). Local development needs none of it.
- **Latest safe point:** before T1, and before the first push of an S3, S4, S5, S6b or S9 branch. Pushing Wave 1 branches does not add a write class on production, because the compositions table is not deployed [D].
- **If deferred:** those branches stay local.

### 3.2 G-quota

- **Today [D]:** `begin_avatar_upload` refuses at 5 pending uploads or 20 open intents in any state. `commit_avatar`, `clear_avatar` and `delete_own_account` enqueue through the upsert rule and are not counted.
- **Recommended acceptance:**
  1. Approve 5 and 20 as agent parameters, changeable by migration.
  2. **Require, as an acceptance criterion, that the bounds are enforced only in `begin_avatar_upload`.** `commit_avatar`, `clear_avatar` and `delete_own_account` are never refused by a quota. Account deletion therefore cannot be blocked [I: follows from the S6b function table; the criterion is currently missing, see 6.2].
  3. **Reaching the limit** refuses a new upload with `too_many_pending_uploads` and the message "Finish or wait for earlier uploads". It does not block replacing or removing an avatar through `commit_avatar` or `clear_avatar`, which never count.
  4. Aggregate growth stays unbounded across owners and is monitored by F4 (rows per state, per-owner open counts, oldest due). Proposed review triggers: any table over 1 GiB; any owner over 50,000 activity events or over 20× the median; queue rows over 10,000; oldest due intent older than 7 days; any `held` row older than 24 hours.
- **Alternative:** hard per-account quotas. Rejected here: the handoff forbids inventing one (AH §9 item 7).
- **Dependent gates:** G-quota-T1 (S1), T2 (S3), T3 (S5 and S6b).
- **Latest safe point:** the RC of each slice. Not a Wave 1 matter.
- **If deferred:** RC is blocked for those slices.

### 3.3 G-runner

- **Today [D]:** claim, complete and fail RPCs are specified (`service_role` only); leases up to 30 minutes; capped backoff. The runner script is not built.
- **Recommended operating model:**
  - **Execution:** operator-run `scripts/storage-cleanup-runner.mjs`. The service key comes from an ignored env file and is never in the repository, CI or Vercel.
  - **Targets:** loopback by default. The hosted run follows the release procedure in F4, with the expected project from the ledger.
  - **Cadence:** before each train and at least weekly while the queue is non-empty. F4's "oldest due over 7 days" trigger enforces it.
  - **Concurrency and idempotency:** two runners are safe (`skip locked`); a missing object counts as success; crash recovery relies on lease expiry (tested in S6b).
  - **Terminal failures:** there are none. Backoff caps at one day. A persistently failing row is visible through `attempts` and `last_error_code`, and handled by the owner.
  - **Interaction with immediate removal and account deletion:** as in S6b rules 1 and 5. Deletion enqueues, and the runner removes after the account is gone.
- **Alternatives:**
  - A scheduled hosted job (Vercel cron, GitHub Action). This puts a service-role key in a hosted scheduler, which is security-consequential. Make it a later separate decision once the operator model shows the need [I].
  - A direct Postgres runner. Rejected: needs a database credential with broader reach.
- **Latest safe point:** before S6b implementation starts (Wave 3), since S6b IC includes the runner.
- **If deferred:** S6b cannot reach IC or merge (a).

### 3.4 Lexical and editor location

- **Already decided [R]:** Lexical is the editor direction; the Document contract goes in `domain-documents`; `frontend-editor` is created once the editor and body are approved.
- **Database dependence [I]:** S5's persistence layer treats content as an opaque envelope `{"lexical": ...}`. Migrations, the `+1` rule, revisions and quota behavior do not need Lexical. Only V-5 (round-trip fidelity) and the editor UI do.
- **Recommendation:** approve now, conditionally: "Lexical, at the latest stable version verified from the npm registry when S5's editor layer starts (AGENTS §7a); `frontend-editor` created at that point; `domain-documents` created with S5's contract." No further approval is then needed unless a conflict appears.
- **Does either block a database slice?** No. S5 can reach (m) and persistence tests first.
- **Latest safe point:** the start of S5's editor layer, and in any case before S5 IC (V-5).
- **If deferred:** S5 IC and T3's editor-dependent part stall; migrations do not.

### 3.5 G-S7m

- **Unresolved requirement [D]:** restore scope (INV-8 versus content-only), privilege boundary, restore activity, named-version limit, pruning of restore revisions.
- **Recommended:**
  - Full-state restore, matching INV-8 literally.
  - Hardened public definer functions with the `capture_context` mechanism (S7 rev 4).
  - One `revision.restored` event and no per-field events.
  - At most 50 named versions per item, excluded from the automatic cap.
  - Restore revisions prunable unless named.
- **Alternative:** content-only restore. Coherent, but then INV-8 must be reworded (roadmap 11.2).
- **Verification obligations:** the S7 section G tests, including the two-session named-limit and capture-context tests.
- **Latest safe point:** before the S7 migration is written. Wave 4.
- **If deferred:** only S7 is affected. No other slice depends on it.

### 3.6 Seeder package

- **Today [R]:** the `dev` category covers "seed support" [R: `workspace-conventions.md:104`]. `dev-fixtures` holds factories. `supabase/seed.sql` seeds existing auth users and nothing on a fresh reset [D: Faker audit].
- **Recommendation:**
  - F6a and F6b stay in `dev-fixtures`; they need no package decision.
  - Decide the seeder's home when F6c starts. Default to a root script only if it can import the scenarios without a build step (Node 24 [R: `.node-version`] can strip TypeScript types, which should be checked at that point). Otherwise a small `packages/dev` package.
- **Safety:** loopback-only, fresh `supabase status` credentials, ordinary clients for inserts (F6 spec).
- **Does it precede Wave 1?** No. F6c depends on S1 being applied locally and sits in Wave 2.
- **Latest safe point:** the start of F6c.
- **If deferred:** nothing else is affected; local data stays on `seed.sql`.

### 3.7 G-pg

- **Today [D]:** F5's concurrency runner needs two sessions.
- **Recommendation:** approve `pg` as a dev dependency of `@synapcity/server-data` only, at the registry-verified latest stable version at implementation, pinned exactly. Reasons:
  - Barriers between two sessions are far simpler and more reliable with a client library than with coordinated `psql` processes.
  - Every database slice's V-2, V-15 and S6b race tests depend on this harness.
- **Alternative:** the `psql` fallback, which needs no approval. It works but makes the many two-session tests fragile.
- **Latest safe point:** before F5 starts (Wave 1, order 2).
- **If deferred:** F5 begins on the fallback and may switch later.

## 4. Urgency classification

| Class                                       | Items                                                                                                                                                                                                                                                   |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A. Required before Wave 1 authorization** | **None are hard blockers.** Recommended with the Wave 1 authorization: G-pg (F5). The Wave 1 authorization itself, including the implementation boundary in section 7, is the only approval needed.                                                     |
| **B. Required before dependent slices**     | G-runner (before S6b starts); G-lexical and G-editor-location confirmation (start of S5's editor layer); G-seeder (start of F6c); G-S7m (before S7's migration)                                                                                         |
| **C. Required before release**              | G0: D1/PI-1 to PI-4, D2, V-13/V-14, branch protection, D14 (before T1, and before pushing S3, S4, S5, S6b, S9); G-quota-T1 to T3 (RC of S1, S3, S5, S6b); G-S7a (before S7(a))                                                                          |
| **D. Deferrable or already resolved**       | Document contract location (`domain-documents`, resolved); Lexical as direction (resolved); per-user pin state (D7, decided); a hosted scheduled runner (separate, later); staging environment (none required); account quotas (explicitly not decided) |

## 5. Dependency and gate matrix

| Gate                         | Blocks                                         | Does not block                       | Latest safe point        |
| ---------------------------- | ---------------------------------------------- | ------------------------------------ | ------------------------ |
| Wave 1 authorization         | all implementation                             | planning                             | now                      |
| G-pg                         | F5 on its preferred design                     | F5 on the fallback                   | start of F5              |
| D1 / PI-1 to PI-4            | T1; first push of S3, S4, S5, S6b, S9 branches | all local development; Wave 1 pushes | before T1                |
| D2, V-13, V-14               | T1 and every hosted apply                      | all code                             | before T1                |
| G-quota-T1 / T2 / T3         | RC of S1 / S3 / S5 and S6b                     | IC, merges                           | RC                       |
| G-runner                     | S6b IC, S6b(a)                                 | S6b(m-expand) can be developed       | start of S6b             |
| G-lexical, G-editor-location | S5 editor layer, V-5, S5 IC                    | S5 migrations and persistence        | start of S5 editor layer |
| G-S7m                        | S7(m)                                          | S1 to S6b                            | before the S7 migration  |
| G-S7a                        | S7(a)                                          | S7(m)                                | before S7(a)             |
| G-seeder                     | F6c                                            | F6a, F6b                             | start of F6c             |

No new migration or train dependency is introduced by this package.

## 6. Revision 4 consistency check

The eight corrections are consistently reflected: held recovery (S6b upsert rule 5, state diagram, tests), T3c (roadmap graph, trains table, Wave 3 step 7, status row, critical path; T4 is S7 only), claim-state CHECK, durable intent before success, immediate-removal rule and its race test, queue bounds, F4's `--environment` interface and bucket comparison, retry and error-code bounds.

Inconsistencies found, none changing an approved contract:

1. **S6a is partly stale.** Its problem statement lists a local nonce skip and an `https://127.0.0.1:3000` redirect typo. **[R]** `supabase/config.toml` already has `skip_nonce_check = false`, `enable_manual_linking = false` and an `http://127.0.0.1:3000/auth/callback**` redirect, with a D11 comment. S6a's config work should shrink to verification and the matrix document. Bounded correction: reword S6a's scope before it starts.
2. **S6b lacks an explicit "quota never blocks deletion" criterion.** The behavior follows from the function table, but no test says `commit_avatar`, `clear_avatar` and `delete_own_account` succeed with 20 or more open intents. Bounded correction: add that test and criterion to S6b section G.
3. **G-quota-T3 does not name S6b.** The roadmap section 10 row covers Document content and history, while S6b's risks cite it for queue growth. Bounded correction: extend G-quota-T3's scope to S6b RC.
4. **S5 places the editor app-local;** conventions name `frontend-editor` as the planned home. Follow the conventions (section 3.4).
5. **Roadmap section 10 "Deployment gates" omits T3c** (`T1 to T4`). Bounded correction: read it as T1 to T4 plus T3c.
6. **Roadmap G-lexical wording** ("No workspace depends on it") reads as if the direction were undecided. Bounded correction: add "direction accepted; dependency and version approval only".

**Material risks, unchanged from revision 4:** no account quota; account-deletion volume (V-8) is unmeasured; the runner is an operator process, so orphans persist until it runs (mitigated by the 7-day trigger).

## 7. Recommended authorization sequence

**Approve now (one review):**

1. D1 option A as the Preview isolation direction. The Vercel change itself is an owner action, due before T1.
2. G-pg: `pg`, dev-only, `server-data`, exact version verified at implementation.
3. G-runner operating model (3.3) and the quota acceptance terms (3.2), so S6b is not blocked later.
4. The conditional Lexical approval and confirmation of G-editor-location (3.4).
5. The six bounded corrections in section 6.

**Defer with their gates:** G-S7m, G-S7a, G-seeder, D2/D14 facts, G-quota acceptances at RC.

**Wave 1 authorization boundary:**

- **May proceed (repository-only, local database, no hosted action):** F1, F2, F3, F6a, S10; then F5 (after F1 merges), S1, S2, S6a (after F5), F4, F6b.
- **May be developed locally but not pushed until PI-3:** none in Wave 1.
- **Blocked:** S3, S4 (until Wave 2 starts and S1/S2 are in their branches); S5 editor layer; S6b (needs G-runner); S7; F6c; S9, S11 (need T2).
- **Must not begin:**
  - any hosted migration, Vercel or Supabase change by the implementation sessions;
  - T1 or any later train;
  - pushing S3, S4, S5, S6b or S9 branches before PI-3;
  - the cleanup runner;
  - any commit, push, PR or merge without separate instruction.

## 8. Decisions recorded (owner, 2026-10-30)

The owner accepted the recommended direction, with these conditions. The authoritative record is roadmap section 10 ("Owner decisions recorded 2026-10-30").

| Decision             | Outcome                                                                                                                                                                                                       | Authoritative location |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| D1 Preview isolation | Option A as interim policy. Policy only; the owner performs or separately authorizes the Vercel change before T1 and before pushing S3, S4, S5, S6b or S9 branches. Option B is a possible later enhancement. | roadmap 5a and 10      |
| G-pg                 | `pg` approved as a dev dependency scoped to `server-data`. Not installed yet.                                                                                                                                 | roadmap 10; F5 spec    |
| G-runner             | Operator-run script model approved. Not built or executed yet. The age trigger is an alert or operational gate, not a scheduler.                                                                              | roadmap 10; S6b spec   |
| Quota contracts      | 5 and 20 are hard limits on starting uploads only; commit, clear, deletion and cleanup are never rejected. Review thresholds are monitoring only.                                                             | roadmap 10; S6b spec   |
| Lexical and editor   | Direction confirmed. Exact version selected and verified when S5's editor layer begins. `frontend-editor` ownership per conventions.                                                                          | roadmap 10; S5 spec    |

Deferred, with latest safe points: G-S7m (before the S7 migration), G-S7a (before S7(a)), seeder placement (start of F6c), D2/V-13/V-14/D14 (before T1), G-quota-T1 to T3 (RC of S1, S3, S5 and S6b).

## 9. Reconciled inconsistencies (section 6)

All six are applied: S6a problem statement (verified-versus-outstanding config), S6b quota-never-blocks test and criterion, G-quota-T3 now includes S6b, S5 editor ownership aligned with conventions, T3c added to the roadmap's gate list, G-lexical wording.

## 10. Wave 1 implementation authorization statement (for owner approval)

Approving this section authorizes only the repository-local work below. It is separate from, and does not imply, any commit, push, PR, merge or deployment.

**Dependency order, verified against roadmap section 3:**

| Step | Slice  | Prerequisites (I and M edges)                                 | Notes                                                        |
| ---- | ------ | ------------------------------------------------------------- | ------------------------------------------------------------ |
| 1    | F1     | none                                                          | first to merge; S1 depends on its fix to the shared SQL test |
| 1    | F2     | none                                                          | F4 and F6c depend on it                                      |
| 1    | F3     | none                                                          | independent                                                  |
| 1    | F6a    | none                                                          | F6b follows it                                               |
| 1    | S10    | none                                                          | independent                                                  |
| 2    | F5     | F1 merged                                                     | uses `pg` (approved)                                         |
| 2    | S1, S2 | develop now; IC needs F1 and F5; merge order F1, S1(m), S2(m) | migrations merge as (m) only; hosted apply is T1, excluded   |
| 3    | S6a    | F1, F5                                                        | independent of S1 to S5                                      |
| 3    | F4     | F2                                                            |                                                              |
| 3    | F6b    | F6a                                                           |                                                              |

**Eligible scope:** the slices above, as specified in their specs.

**Allowed local database operations:** an isolated local Supabase stack only (F5's disposable stack, or the lock on the shared stack); `supabase migration new` and `migration up --local`; the SQL and two-user test suites; `pnpm db:types` against local; loopback targets only.

**Required verification and evidence per slice:** the commands in roadmap section 6 and the slice's section G, results recorded in the PR; negative proof for each new policy or trigger; items that block IC (for example V-1 to V-4, V-7, V-8, V-10, V-11 and budgets B-1, B-2 for S1) passed or reported as failing. IC and RC stay separate. No slice is marked complete by this authorization, and RC is impossible in Wave 1 because no hosted action is authorized.

**Integration and merge gates:** PRs only when separately instructed; merge order F1, then S1(m), S2(m); `pnpm verify` green; types regenerated after rebases. No merge without separate authorization.

**Explicitly excluded:**

- starting any implementation before the owner approves this section;
- hosted migrations, Vercel or hosted Supabase changes, T1 and all later trains;
- installing `pg` or Lexical outside the approving slice (`pg` only inside F5);
- building or running the cleanup runner;
- S3, S4, S5, S6b, S7, S9, S11 and F6c implementation;
- pushing S3, S4, S5, S6b or S9 branches before Preview isolation (PI-3);
- committing, pushing, opening PRs, merging or deploying.

**Owner-operated actions outstanding:** the Vercel Preview change (D1 option A) before T1; D2 facts (backups, PITR, RPO and RTO); advisor export and V-13/V-14 reads; branch protection after F1's job name exists; D14 acceptance.
