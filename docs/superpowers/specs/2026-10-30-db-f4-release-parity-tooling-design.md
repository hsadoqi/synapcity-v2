# F4: Release and Parity Tooling

**Status:** Proposed. Repository part implementation-ready. Its use against hosted is gated by D2 and D14.
**Date:** 2026-10-30
**Roadmap:** [database execution roadmap](../plans/2026-10-30-database-execution-roadmap.md), slice F4
**Contracts:** [database architecture handoff](2026-10-30-database-architecture-handoff.md) §5 M-4, M-8, M-9; §10
**Branch:** `db/f4-release-parity-tooling`

## A. Identity and scope

- **Capability:** none user-visible. An operator can release migrations with an executable checklist, compare local and hosted ledgers read-only, and record each release.
- **Problem:** there is no gate between database and app releases and no drift detection (OP-02). Migration headers saying "NOT applied" are stale (OP-10), and D3 forbids editing them.
- **In scope:**
  1. `scripts/db-parity.mjs`.
  2. `docs/engineering/database-release.md`: the procedure, taken from the reconciliation roadmap's Section G and AH §10.
  3. `docs/engineering/database-deployment-ledger.md`: per-environment state with evidence, and an owner-reviewed `environments` table of approved project refs, the only source of an expected ref.
     3a. `docs/engineering/database-parity-allowlist.md`: owner-reviewed expected schema differences, each with a reason.
  4. The ADR-0006 "Unresolved" amendment (AH §3).
  5. **Growth monitoring** (for the G-quota risk acceptances): `scripts/db-growth.sql`, a set of count-only and size-only queries. It reports row counts and `pg_total_relation_size` for the revision, activity and content tables, and per-owner p50, p99 and maximum counts of resources, revisions and events. It never reads row contents. It runs monthly, and before each train. The thresholds that trigger an owner review are proposed in `database-release.md` (starting values: any table over 1 GiB, or any owner over 50,000 events or over 20× the median) and set by the owner in each G-quota acceptance.
- **Out of scope:** CI with hosted credentials (D14), any hosted call by an agent.
- **Dependencies:** F2 (guard pattern).

## B. Data model

No migration. The ledger's first entry records the existing state: hosted at 12 of 13 migrations, the local shared stack at 12, with the evidence date 2026-10-29 from the reconciliation roadmap.

## C. Contracts

**Expected project ref.**

- The only source is the deployment ledger (`docs/engineering/database-deployment-ledger.md`). Its `environments` table lists each approved environment (for example `production`) with its project ref. Those rows are entered by the owner and reviewed in a PR.
- `db-parity.mjs --environment production` reads the expected ref from the ledger, prints it beside the linked project's ref (from `supabase/.temp/project-ref`, or `supabase projects list`), and exits 1 unless they match.
- A ref typed on the command line is never accepted as the expected value.

**Ledger comparison**, as two separate read-only collections, then a comparison:

1. **Local ledger:** the version prefixes of `supabase/migrations/*.sql` on the checked-out commit. When a local stack is running, also `select version from supabase_migrations.schema_migrations` on it, and report any difference between files and stack.
2. **Linked ledger:** the remote versions from `supabase migration list --linked`, parsed from the Remote column. The exact output format is checked against Supabase CLI 2.122.0 at implementation (AGENTS §7a). If the format is unstable, stop and report, rather than parsing a guess.
3. **Comparison:** each version is reported as `both`, `local-only` (pending deploy) or `remote-only` (drift; always actionable). Before a train, the local-only set must equal exactly the train's migrations.

**Schema comparison.**

- **Scope:** the `public` and `private` schemas, plus the policies on `storage.objects` and the `avatars` row in `storage.buckets`. Excluded as Supabase-managed: `auth`, `storage` internals other than those, `graphql`, `graphql_public`, `realtime`, `supabase_functions`, `supabase_migrations`, `vault`, `extensions`, and the `pgsodium` and `net` schemas if present.
- **Collection:** `supabase db dump --linked --schema-only --schema public,private` and the same against a fresh local stack after `migration up`. The storage policies are collected by a read-only catalog query (`pg_policies where schemaname = 'storage'`) on both sides. So is the `avatars` bucket row (`select id, name, public, file_size_limit, allowed_mime_types from storage.buckets where id = 'avatars'`), compared field by field. Flags are verified against the installed CLI at implementation.
- **Normalization, both sides:**
  - remove header `SET`, `SELECT pg_catalog.set_config` and comment lines;
  - remove `OWNER TO` clauses;
  - strip extension version numbers;
  - sort statements within each object type.

  Grants, policies, function bodies, `SECURITY DEFINER` and `search_path` settings are security-relevant and are **never** normalized away.

- **Classification:** each difference is either listed in `docs/engineering/database-parity-allowlist.md` (expected; owner-reviewed, with a reason) or actionable. Any actionable difference exits 1.

The script never runs `db push`, `repair` or `reset`, and never reads table rows.

## D. Integration

- Operator-run only. An agent may run it against a local target. A hosted run is an owner action.
- The release procedure in `database-release.md`:
  - pre-flight: target identity, backups (D2), `migration list`, a fresh-database test run, V-13 aggregates (counts and lengths only), and `lock_timeout` considerations (M-9);
  - `db push --dry-run` reviewed;
  - apply;
  - post-check: parity, counts and the advisors (M-8);
  - app release;
  - smoke;
  - ledger entry.

## E. Fixtures

Not applicable.

## F. UI

Not applicable.

## G. Verification

| Check                | How                                                                                                                                                                                                                                                 | Must pass |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| Ref guard            | unit test: a mismatched ref exits 1 before any linked command (spawn spy)                                                                                                                                                                           | yes       |
| Ref source           | the expected ref is read only from the ledger's `environments` table; a ref passed on the command line is refused                                                                                                                                   | yes       |
| Ledger comparison    | fixture outputs give correct `both`, `local-only` and `remote-only` classification; a `remote-only` version exits 1                                                                                                                                 | yes       |
| Schema normalization | fixture dumps: header and owner noise ignored; a grant, policy, `SECURITY DEFINER` or `search_path` difference is reported, never normalized away; an allowlisted difference is classified as expected                                              | yes       |
| Bucket comparison    | a fixture where the `avatars` row differs in `public` or `allowed_mime_types` is reported as actionable                                                                                                                                             | yes       |
| Local dry run        | an integration test injects a temporary ledger file through the test harness (never a CLI flag) whose `environments` table maps `local` to the local stack; `db-parity.mjs --environment local` runs against it, and the report format is confirmed | yes       |
| Docs                 | `pnpm format:check`                                                                                                                                                                                                                                 | yes       |
| Repository checks    | `pnpm verify`                                                                                                                                                                                                                                       | yes       |

## H. Completion

- **IC:** merged with tests green.
- **RC:** the first hosted use, in T1, is recorded in the ledger by the owner.

## I. Risks

- The Supabase tool available to agents can write to production (AH §10). This script does not replace the owner's control of hosted credentials.
