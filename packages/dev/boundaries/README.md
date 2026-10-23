# Boundary checker

Owns: the workspace boundary checker (`pnpm boundaries`) and its violation probes.

The rules it enforces, R1 to R11, and the exception policy are in the [workspace conventions](../../../docs/architecture/workspace-conventions.md#boundary-checks); the design and its evidence are in the [Milestone 3.4 design](../../../docs/superpowers/specs/2026-10-23-m3-boundary-enforcement-design.md). R0 additionally fails any import that does not resolve and any file that does not parse, so a scan never passes silently.

## Commands

| Command                                        | What it does                                          |
| ---------------------------------------------- | ----------------------------------------------------- |
| `pnpm boundaries` (repository root)            | Checks the whole workspace; exits 1 on any violation  |
| `pnpm --filter @synapcity/dev-boundaries test` | Runs the unit tests and the per-rule violation probes |

## Exceptions

Existing violations are listed in `src/exceptions/exceptions.ts`, one file or edge each, with a reason and the milestone that removes it. An exception that no longer matches fails the run, so the list only shrinks.

This package is development tooling. Nothing shipped imports it.
