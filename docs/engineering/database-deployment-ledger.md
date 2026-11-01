# Database deployment ledger

**Status:** Current direction. The operator's record of what is applied where, with the evidence for each claim.

This ledger is the only source of the project ref that the parity script (`pnpm db:parity`, `scripts/db-parity.mjs`) will accept as the expected one. A ref typed on its command line is refused. Rows in the Environments table are entered by the owner and reviewed in a pull request; an agent does not enter a ref.

A claim about hosted state belongs here only with its evidence (a date and where it came from). A row without evidence is not a fact. Migrations are immutable once merged to `main` (owner decision D3), and their headers saying "NOT applied by repository tooling" are not edited; this ledger is what states what is applied.

## Environments

The project ref an environment is allowed to be. Empty until the owner enters it after confirming the project's identity, backups and recovery point (decision D2).

| Environment | Project ref | Reviewed by owner |
| ----------- | ----------- | ----------------- |
| production  | —           |                   |
| preview     | —           |                   |
| local       | `local`     | not applicable    |

## Entries

One row per event or finding. Hosted rows are written by the owner or the operator who ran the step.

| Date       | Environment  | Event or state                                            | Evidence                                                                                                                        | Recorded by |
| ---------- | ------------ | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| 2026-10-29 | production   | 12 of the 13 migrations applied; migration 13 not applied | the database reconciliation audit (git-ignored `docs/audits/`), read-only. Not re-verified by the change that created this file | the audit   |
| 2026-10-29 | local (main) | the shared local stack at 12 migrations                   | the same audit                                                                                                                  | the audit   |

## What a release adds

Each release train (database release 1, then 2, 3, 4) adds, after the procedure in [database-release.md](database-release.md) has run:

- the apply: date, operator, the migrations (versions), the target ref as checked against the Environments table;
- the post-migration check: the parity script's output, counts, the advisor results;
- the application deploy: the deployment id;
- the production smoke result;
- each risk acceptance the train needs (unbounded per-account growth, with the monitoring queries scheduled).
