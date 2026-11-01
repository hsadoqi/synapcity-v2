# Database release procedure

**Status:** Current direction. The operator's procedure for taking migrations to a hosted project, and the local tools that support it. It authorizes nothing by itself: every hosted step is the owner's act, behind the gates below.

Decisions it relies on: migrations are forward-only and immutable once merged (D3); the release order is database, verify, then application; the hosted project is Production and Preview isolation is a precondition (roadmap section 5a), not something this procedure provides.

## Who may do what

- **An agent** may run `pnpm db:parity` against a local target, the SQL and database tests, and `pnpm db:types --stack` against its worktree's disposable stack. It never runs a command against a hosted project, links one, or applies a migration.
- **The owner or an operator** performs the hosted steps. Hosted credentials are never put in a repository file, a CI secret used by an agent, or a command that is logged.
- Development tools refuse a non-loopback database. `pnpm db:types` accepts `--allow-remote-target <project-ref>` for a reviewed read; the other tools have no override.

## Before a release train

1. **Target identity.** The project to be changed is the one named for the environment in the Environments table of [the deployment ledger](database-deployment-ledger.md). Link it (`supabase link`), then `pnpm db:parity --environment production`: it prints the ledger's ref beside the linked project's and stops if they differ, before it touches the project.
2. **Backups and recovery** (decision D2): backups and point-in-time recovery are confirmed, and the recovery point, RPO and RTO are recorded in the ledger.
3. **Preview isolation** is in effect (PI-1 to PI-4 in the database execution roadmap, section 5a), verified by the owner.
4. **The migration list.** `pnpm db:parity --environment production --expect-pending <versions of this train>` must show the pending (`local-only`) set equal to exactly the train's migrations, and no `remote-only` version (drift, always actionable).
5. **A fresh-database run.** `pnpm db:stack start --fresh`, then `pnpm db:test` and `pnpm db:types --stack` with no diff (plain `pnpm db:types` reads the machine's shared default stack, which only CI's `db-types` job uses), from a clean checkout of the commit the train's migrations are on. The application's database and budget tests (`pnpm --filter @synapcity/server-data test:db` and `test:db:budgets`) exist only where that application code lives: they run on the application branch after `main`, with the train's exact migration files, has been merged into it, before any hosted step.
6. **Hosted pre-checks** the train needs, as counts and length aggregates only, never row contents: for example the number of Dashboards, and the number of names, descriptions and tags over the new limits, with the advisor output and the `ensure_rls` event trigger.
7. **Lock behaviour** (handoff M-9): any change to a populated table is checked against `lock_timeout`; additive changes and `NOT VALID` constraints take brief locks.
8. **The dry run.** `supabase db push --dry-run`, reviewed against the train's migrations.

## Applying

9. The owner runs `supabase db push` for the train. `migration repair` and `db reset` are never used against a hosted project.

## After

10. **Post-migration check.** `pnpm db:parity --environment production` again: no `remote-only` version, no actionable schema difference, and the `avatars` bucket and `storage.objects` policy comparison clean. Counts agree with the train's expectations. The Supabase advisors are run and triaged (handoff M-8); new `SECURITY DEFINER` functions and the public tag-validation function are expected to be listed.
11. **Hosted deletion budget (V-8), on an isolated scratch restore by default.** The heavy-account measurement never runs on production unless the owner separately authorizes it. Each step is separately authorized hosted work:
    1. create an isolated scratch restore through the backup and recovery gate (step 2), where the plan permits;
    2. confirm its compute tier and the role timeouts that apply (`authenticated` statement timeout included) are equivalent to production's;
    3. apply the train's exact schema;
    4. create one unique throwaway heavy account, and record the exact seeded counts and approximate storage;
    5. measure the account-deletion budget;
    6. verify the cleanup is complete;
    7. record the result in the ledger;
    8. remove or retire the scratch environment under the approved recovery procedure.

    If no scratch restore is available, or it cannot reproduce production's compute and timeout behavior, stop and ask the owner for a new decision. A failed budget blocks the application release.

12. **Application release** only after steps 10 and 11 pass.
13. **Smoke.** The slice's production check with a small throwaway account, never the heavy fixture.
14. **Ledger entry:** the apply, the check, the deletion-budget result, the deployment id, the smoke, and each risk acceptance.

A slice stays "deployed: incomplete" until step 10 passes.

## What the parity script reads

`pnpm db:parity --environment <name>` runs three read-only CLI commands (`migration list`, `db dump`, `db query` with fixed SELECTs) against the target and against a fresh local stack, and compares:

- the migration ledger (`both`, `local-only`, `remote-only`);
- the `public` and `private` schemas, statement by statement: grants, policies, function bodies, `SECURITY DEFINER` and `search_path` are never normalized away; only run-specific noise (header `SET`s, comments, ownership, extension versions) is;
- the policies on `storage.objects` and the `avatars` bucket row (id, name, public, file size limit, allowed MIME types). No object is read.

Differences listed in [the parity allowlist](database-parity-allowlist.md) are expected; any other exits 1. It never runs `db push`, `migration repair` or `db reset`, and never reads table rows. It parses the CLI's JSON output (`--output-format json`, pinned in the script, checked against CLI 2.122.0); if the CLI prints another shape, it stops and says so instead of guessing.

## Growth monitoring

`scripts/db-growth.sql` reports row counts and total sizes of the history and resource tables, and the median, 99th percentile and maximum per owner. Count and size only. Run it monthly and before each train, against the target:

```sh
psql -X -f scripts/db-growth.sql "$DATABASE_URL"
```

Starting thresholds for an owner review (each risk acceptance sets its own): any table over 1 GiB, or any owner over 50,000 events or over 20 times the median for resources, revisions or events.

## Not part of this procedure

CI with hosted credentials, and any hosted call by an agent, are out of scope (decision D14 is the owner's). Local Auth settings that differ from the hosted project are listed in [auth-configuration.md](auth-configuration.md).
