# F2: Local-Target Safety

**Status:** Proposed. Implementation-ready; no blocking decisions.
**Date:** 2026-10-30
**Roadmap:** [database execution roadmap](../plans/2026-10-30-database-execution-roadmap.md), slice F2
**Contracts:** [database architecture handoff](2026-10-30-database-architecture-handoff.md) §10 (tooling refuses non-loopback targets; "a comment is not a guard")
**Branch:** `db/f2-local-target-safety`

## A. Identity and scope

- **Capability:** none user-visible. Development tools cannot reach a hosted database by mistake.
- **Problem:** `scripts/db-types.mjs` accepts any URL (OP-05).
- **In scope:**
  1. A loopback guard in `scripts/db-types.mjs`, with an explicit, named override flag for the reviewed case.
  2. **Defense in depth only:** `"db/**": false` in `apps/web/vercel.json` `git.deploymentEnabled`, so branches named for database slices create no web preview. It reduces exposure for those branches only. It is never counted toward the roadmap's PI-1 to PI-4, which are the real safety gate (section 5a, under G0).
- **Out of scope:**
  - **Preview isolation.** Previews sharing the production Supabase project (OP-04) is an environment-level release-safety requirement, owned by the [roadmap's section 5a](../plans/2026-10-30-database-execution-roadmap.md) (PI-1 to PI-4, mechanism per D1, an owner action).
    - The branch-name rule above does not isolate previews. Every branch not matching it still deploys a preview with production credentials.
  - The app-level hosted-target guard in `getSupabaseEnv()`, which needs a new env name (part of the D1 choice).
  - Local Auth alignment (S6a, which owns `supabase/config.toml` per D11).
- **Dependencies:** none.

## B. Data model

No migration.

## C. Contracts

- **`db:types` refuses** a `--db-url` whose host is not `127.0.0.1` or `localhost` unless `--allow-remote-target <project-ref>` is passed. The printed project ref must equal the argument. Without the flag it exits 1 before connecting.
- **Same contract for `db:test` (F1)** and, later, the seeder (F6c).

## D. Integration

Inline guard function in the script. The two current consumers (`db:types`, `db:test` from F1) each carry the same small function. A shared module is warranted only at a third consumer; F6c's seeder would be that third, and it extracts the helper to `scripts/lib/loopback.mjs` then.

## E. Fixtures

Not applicable.

## F. UI

Not applicable.

## G. Verification

| Check                          | How                                                                                                                       | Must pass |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------- | --------- |
| Guard rejects hosted           | a unit test with a hosted-looking URL; the script exits 1, and no connection is attempted (spy on the spawn)              | yes       |
| Guard accepts loopback         | `pnpm db:types` against local produces no diff                                                                            | yes       |
| Branch rule (defense in depth) | the rule is present in `vercel.json` and documented in `docs/engineering/quality-gates.md` as not being Preview isolation | yes       |
| Repository checks              | `pnpm verify`                                                                                                             | yes       |

## H. Completion

- **IC:** guard tests pass; `pnpm verify` green.
- **RC:** merged. There is no hosted component.

## I. Risks

- The guard protects development tools only. It does nothing about deployed previews reaching production. That is the roadmap's Preview-isolation requirement (section 5a), which must not be reported as covered by this slice.
