# F1: Database Test Signal

**Status:** Proposed. Implementation-ready; no blocking decisions.
**Date:** 2026-10-30
**Roadmap:** [database execution roadmap](../plans/2026-10-30-database-execution-roadmap.md), slice F1
**Contracts:** [database architecture handoff](2026-10-30-database-architecture-handoff.md) INV-1 to INV-3, §4 negative-proof rule
**Branch:** `db/f1-database-test-signal`

## A. Identity and scope

- **Capability:** none user-visible. CI runs every SQL test on a fresh database and fails on any failure.
- **Problem:** the five files in `supabase/tests/` have never run in CI (OP-06), so RLS, grant and constraint regressions merge green. `dashboard-compositions.sql` ends with a `select updated_at … into r` whose result is never checked.
- **Exists:** `supabase/tests/{dashboard-compositions,documents-and-dashboards,seed-sample-data,space-participation,spaces}.sql`. They use plain SQL with `raise exception`, no pgTAP, and roll back. CI has `verify`, `db-types`, `pr-hygiene` and `security` jobs.
- **In scope:**
  - a root `db:test` script;
  - a CI `db-tests` job;
  - fixing the no-op assertion;
  - recording one deliberately failing run.
- **Out of scope:**
  - new SQL coverage (owned by S1 to S6);
  - the two-user harness (F5);
  - branch protection (owner action, G0).
- **Dependencies:** none.

## B. Data model

No migration. The tests run as the database administrator inside transactions that roll back.

## C. Contracts

The runner's contract: each `supabase/tests/*.sql` file is executed in name order with `psql -X -v ON_ERROR_STOP=1 -f <file>`; exit status non-zero on the first failure; output names each file and its result.

## D. Integration

- **`scripts/db-test.mjs`** (new, beside `scripts/db-types.mjs`, same style):
  1. Resolve the database URL from `pnpm exec supabase status -o json` (`DB_URL`). A `--db-url` flag is accepted only for a loopback address. The guard is the same loopback pattern as `apps/web/e2e/support/local-stack.ts` (`^postgres(ql)?://[^@]*@(127\.0\.0\.1|localhost)(:\d+)?/`). A non-loopback target exits 1 before connecting.
  2. Run each file. Never print the URL's password.
- **Root `package.json`:** `"db:test": "node scripts/db-test.mjs"`.
- **`.github/workflows/ci.yml`:** add job `db-tests`, using the same setup steps as `db-types`, then `pnpm exec supabase db start`, `pnpm exec supabase migration up --local` and `pnpm db:test`. It runs on a fresh stack per job, so it cannot collide with other worktrees. It is not in `pnpm verify`, because that needs Docker; this matches the `db-types` comment.
- **Fix in `dashboard-compositions.sql`:** assert that `updated_at` moved:

  ```sql
  if r.updated_at <= <previous value> then
    raise exception '...';
  end if;
  ```

  The assertion currently does nothing. This edits a test, not a migration, so D3 does not apply.

## E. Fixtures

Each SQL file keeps its synthetic `auth.users` rows (`@example.test`) inside its transaction. No seed change.

## F. UI

Not applicable.

## G. Verification

| Check                              | Command                                                                                                              | Must pass |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------- | --------- |
| Runner on a disposable local stack | `pnpm db:test`                                                                                                       | yes       |
| Guard refuses hosted               | `node scripts/db-test.mjs --db-url postgresql://u:p@db.example.supabase.co:5432/postgres` exits 1 without connecting | yes       |
| Guard unit test                    | a small Vitest file for the URL check (`scripts/db-test.test.mjs`, or the pattern used by `db-types`)                | yes       |
| Negative proof                     | a temporary commit that drops `spaces_select_own` makes `db-tests` red; reverted before merge; run link in the PR    | yes       |
| Repository checks                  | `pnpm verify`                                                                                                        | yes       |

## H. Completion

- **IC:**
  - The CI log lists all five files and their results.
  - The negative-proof run is red.
  - The `updated_at` assertion compares values.
  - `pnpm verify` is green.
- **RC:** merged. The owner then adds `db-tests` to the required checks (G0).

## I. Risks

- Supabase start time adds 1 to 2 minutes per CI run.
- The shared local stack is not used by CI. Locally, `pnpm db:test` runs against whatever stack `supabase status` reports; F5 adds isolation and a lock.
