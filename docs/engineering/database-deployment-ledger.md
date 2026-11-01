# Database deployment ledger

**Status:** Current direction. The operator's record of what is applied where, with the evidence for each claim.

This ledger is the only source of the project ref that the parity script (`pnpm db:parity`, `scripts/db-parity.mjs`) will accept as the expected one. A ref typed on its command line is refused. Rows in the Environments table are entered by the owner and reviewed in a pull request; an agent does not enter a ref.

A claim about hosted state belongs here only with its evidence (a date and where it came from). A row without evidence is not a fact. Migrations are immutable once merged to `main` (owner decision D3), and their headers saying "NOT applied by repository tooling" are not edited; this ledger is what states what is applied.

## Environments

The project ref an environment is allowed to be. A ref is entered only after the owner confirms the project's identity. Backups and the recovery point (decision D2) are confirmed separately, before any release train applies (step 2 of [database-release.md](database-release.md)). An environment with no ref (`—`) is refused by the parity script.

| Environment | Project ref            | Status                                                                          | Reviewed by owner        |
| ----------- | ---------------------- | ------------------------------------------------------------------------------- | ------------------------ |
| production  | `dpljdkyorwpntxkwpaqv` | "Synapcity Web", SynapCity organization, us-east-1. Identity confirmed; D2 open | Hanaa Sadoqi, 2026-11-01 |
| preview     | —                      | Not provisioned. PI-1 and PI-2 open; Strategy A selected (D1), not applied      | Hanaa Sadoqi, 2026-11-01 |
| local       | `local`                | Disposable local stacks                                                         | not applicable           |

## Entries

One row per event or finding. Hosted rows are written by the owner or the operator who ran the step.

| Date       | Environment  | Event or state                                                                                                                                                                                                                          | Evidence                                                                                                                                                                                                                                                                                                             | Recorded by  |
| ---------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| 2026-10-29 | production   | 12 of the 13 migrations applied; migration 13 not applied                                                                                                                                                                               | the database reconciliation audit (git-ignored `docs/audits/`), read-only. Not re-verified by the change that created this file                                                                                                                                                                                      | the audit    |
| 2026-10-29 | local (main) | the shared local stack at 12 migrations                                                                                                                                                                                                 | the same audit                                                                                                                                                                                                                                                                                                       | the audit    |
| 2026-11-01 | production   | Identity confirmed: `dpljdkyorwpntxkwpaqv` ("Synapcity Web") is the Production project                                                                                                                                                  | Read-only identity metadata, 2026-11-01: the Supabase project list shows it as the only active project in the owner's organizations, with the earlier Synapcity projects paused; three local CLI links (2026-10-18 to 2026-10-30) name it; the 2026-10-29 and 2026-10-30 audits inspected it. Confirmed by the owner | Hanaa Sadoqi |
| 2026-11-01 | preview      | Not provisioned: no Preview project and no Supabase branch                                                                                                                                                                              | Supabase branch metadata, 2026-11-01: only the Production project's default branch exists; the GitHub Supabase integration reports per-pull-request preview branches disabled                                                                                                                                        | Hanaa Sadoqi |
| 2026-11-01 | preview      | Isolation (D1): Strategy A selected, not applied. Vercel Preview must not have access to the Production Supabase variables, and previews fail closed until an isolated Preview database is deliberately provisioned. PI-1 and PI-2 open | The current Vercel Preview configuration is unverified. The 2026-10-30 reconciliation audit recorded Production and Preview sharing the `NEXT_PUBLIC_SUPABASE_*` entries (names and targets only). Changing them is a later hosted operation: a read-only metadata inspection, then separate authorization           | Hanaa Sadoqi |
| 2026-11-01 | production   | Backup and recovery (D2) open: backup status, point-in-time recovery availability, the most recent usable recovery point, and the acceptable RPO and RTO                                                                                | To be verified in the hosted preflight. A required T1 release-readiness gate                                                                                                                                                                                                                                         | Hanaa Sadoqi |
| 2026-11-01 | all          | No hosted change                                                                                                                                                                                                                        | The identity pass read metadata only: no link, database query, connection string, key or environment-variable value, and no change to a hosted database or Vercel configuration                                                                                                                                      | Hanaa Sadoqi |

## What a release adds

Each release train (database release 1, then 2, 3, 4) adds, after the procedure in [database-release.md](database-release.md) has run:

- the apply: date, operator, the migrations (versions), the target ref as checked against the Environments table;
- the post-migration check: the parity script's output, counts, the advisor results;
- the application deploy: the deployment id;
- the production smoke result;
- each risk acceptance the train needs (unbounded per-account growth, with the monitoring queries scheduled).
