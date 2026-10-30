# F5: Database Test Harness

**Status:** Proposed. Implementation-ready; no blocking decisions.
**Date:** 2026-10-30
**Roadmap:** [database execution roadmap](../plans/2026-10-30-database-execution-roadmap.md), slice F5
**Contracts:** [database architecture handoff](2026-10-30-database-architecture-handoff.md) §4 (negative cases), §5 M-6 and M-7, §9 item 8
**Branch:** `db/f5-database-test-harness`

## A. Identity and scope

- **Capability:** none user-visible. Every database slice can prove its rules through the same API the app uses, with two real users, on an isolated database.
- **Problem:**
  - SQL tests use `set role`, but nothing exercises PostgREST with real sessions.
  - All worktrees share `project_id = "synapcity"`, so database tests collide (OP-13).
  - Slices need policy-function redefinition, staged backfills and two-session concurrency tests (AH §9 item 8).
- **Exists:** `apps/web/e2e/support/local-stack.ts` (a loopback check; temporary users through a service key for provisioning only) and `local-session.ts` (`acquireLock`, `LockHeldError`).
- **In scope:**
  1. **Isolation:** a per-run disposable stack, or the lock.
  2. **Two-user client tests:** a Vitest project `test:db` in `@synapcity/server-data`.
  3. **SQL helpers** for policy redefinition and staged backfill.
  4. **A two-session concurrency runner.**
  5. **A CI step.**
- **Out of scope:** E2E changes (each slice owns its E2E).
- **Dependencies:** F1.

## B. Data model

No migration. Test users and rows are created per run and removed after it, even on failure.

## C. Contracts

- **Isolation (default):** `scripts/db-test-stack.mjs start|stop` runs a stack with a per-worktree `project_id` and port offset through `supabase start --workdir <tmp copy of supabase/>`. The command shape is verified at implementation against the installed Supabase CLI 2.122.0 help (AGENTS §7a).
- **Fallback:** if a disposable stack is not workable, every database test takes the existing `acquireLock` from `local-session.ts`. That serializes worktrees on the shared stack.
- **Two-user harness API** (`packages/server/data/src/testing/db/`, not exported from the package root; Knip configured accordingly):

  ```ts
  type TestUser = { id: string; email: string; client: SupabaseServerClient };
  async function withTwoUsers(
    run: (a: TestUser, b: TestUser) => Promise<void>,
  ): Promise<void>;
  ```

  The provisioning client uses the service key and is never passed to an assertion. Users are created through the Admin API with `@synapcity.test` emails, then signed in through the publishable key, so `a.client` and `b.client` are ordinary clients.

- **SQL helpers** (`supabase/tests/_helpers.sql`, loaded first by `db:test`):
  - `test_helpers.redefine_policy(fn_name text, body text)`, which redefines a `private` policy function inside the test's rolled-back transaction (M-7);
  - `test_helpers.staged_backfill(...)`, which deletes rows as superuser and reruns a backfill statement given as text (M-6, V-10).

  The helpers live in a `test_helpers` schema that exists only during the run. They are created and dropped by the runner and never by a migration.

- **Concurrency runner** (`packages/server/data/src/testing/db/two-sessions.ts`): opens two `pg` connections (the `pg` dependency needs approval, see section I; alternative: two `psql` child processes coordinated by `pg_advisory_lock` steps) and runs scripted steps with explicit barriers.

## D. Integration

- **`packages/server/data/package.json`:** `"test:db": "vitest run --config vitest.db.config.ts"`. The DB config maps `server-only` the same way the existing config does. It is excluded from `pnpm verify`, because it needs Docker.
- **CI:** the `db-tests` job (F1) also runs `pnpm --filter @synapcity/server-data test:db`.

## E. Fixtures

- Users: `harness-<runid>-a@synapcity.test` and `harness-<runid>-b@synapcity.test`.
- Rows are created through the users' own clients, so defaults and triggers apply.
- Cleanup removes only the run's users; row deletion follows by cascade.

## F. UI

Not applicable.

## G. Verification

| Check             | How                                                                                                                         | Must pass      |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------- | -------------- |
| Self-test         | B cannot read, update or delete A's Space through `findSpace`, `setRecordPinned` and a direct `.from('spaces').update(...)` | yes            |
| Negative proof    | a temporarily weakened `spaces_select_own` makes the self-test red                                                          | yes (recorded) |
| Cleanup           | after a forced failure, no `harness-*` users remain                                                                         | yes            |
| Concurrency smoke | two sessions updating one row: the second waits on the first (`pg_stat_activity` wait observed)                             | yes            |
| Isolation         | two worktrees run `test:db` at once without interference, or the lock blocks the second with `LockHeldError`                | yes            |
| Repository checks | `pnpm verify`                                                                                                               | yes            |

## H. Completion

- **IC:** all of the above, in CI and locally.
- **RC:** merged; there is no hosted component.

## I. Risks

- **New dev dependency:** a direct Postgres client (`pg`) for the concurrency runner is a dev-only dependency. It is security-relevant because it handles a connection string, so it needs owner approval under AGENTS §5. Without it, use the `psql` child-process alternative.
- **Port collisions** of disposable stacks: allocate from a range keyed by the worktree path hash.
