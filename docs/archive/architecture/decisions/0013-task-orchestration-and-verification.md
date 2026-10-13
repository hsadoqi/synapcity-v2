# ADR-0013: Task orchestration and verification

**Status:** Accepted
**Date:** 2026-09-27
**Deciders:** Founder (technical direction)

## Context

Phase 1 established `pnpm verify` as the canonical human/agent-facing
correctness contract (ADR-0004, ADR-0006), which at this decision's creation
ran against a workspace with no real packages or apps. The Phase 2 plan (§5.3, §9, design
§9–§10) proposes adding Turborepo strictly as a task-graph layer underneath
that contract, and requires eliminating "false-green" gates once real
workspaces exist. The dependency evidence in
[phase-02-dependency-evidence.md](../../engineering/plans/phase-02-dependency-evidence.md)
records Turborepo `2.11.4` as current; its Node/pnpm compatibility floor
could not be positively confirmed from published package metadata (no
`engines` field), and is recorded as NOT VERIFIABLE rather than assumed safe.

## Decision

1. Turborepo `2.x` (evidence version 2.11.4) is added as the workspace task
   orchestrator. Ownership split: pnpm owns the dependency graph, workspace
   installation, and package manager; Turbo owns the task graph,
   dependency-aware execution, and task caching. Turbo does not replace pnpm
   workspaces and is not a second public correctness contract — `pnpm
   verify` remains canonical, and nobody is expected to remember a sequence
   of Turbo commands.
2. Initial task vocabulary is `build`, `lint`, `typecheck`, `test`, expanded
   only as later slices add Storybook/browser verification, with accurate
   `dependsOn` edges, real declared outputs for cacheable tasks, and
   persistent/non-cacheable treatment for long-running dev tasks.
3. `pnpm verify` is expanded, as real workspaces are added in later slices,
   to cover format, lint, typecheck, unit/component tests, dependency
   hygiene, dependency boundaries, documentation checks, both production
   builds, Storybook browser tests (once Conflict 1 in ADR-0012 is
   resolved), accessibility tests, and the application smoke test.
4. **Non-zero evidence policy:** a required verification layer that
   discovers zero tests, zero modules, zero stories, or reports "no projects
   matched" is a failure condition for that layer, not a passing gate, for
   every layer Phase 2 claims to have established. This applies from the
   first slice that introduces each real workspace onward.
5. The fresh-checkout path (clean checkout → pinned install → `pnpm verify`
   → PASS) must be proven before CI configuration is introduced (Slice 6),
   with no undocumented local machine state required.

## Scope

Governs the pnpm/Turbo ownership split, the task vocabulary, the composition
and non-zero-evidence requirement of `pnpm verify`, and the fresh-checkout
verification requirement. It does not itself add any package, app, or test —
those arrive with Slices 2–5.

## What this does NOT decide

- CI workflow configuration (that automates this contract; recorded
  separately if needed, or folded into implementation per plan §10.1, which
  explicitly avoids reconstructing a second correctness ruleset in YAML).
- Deployment topology (ADR-0014).
- Remote caching or affected-task optimization — explicitly not a Phase 2
  exit requirement (plan §9, design §9).

## Unresolved

- Exact Turbo task JSON and output declarations — implementation-time detail
  once real workspaces exist to observe.
- Whether Turborepo's unverified Node-compatibility floor causes any real
  problem — to be observed empirically when Slice 2 actually runs it, and
  reported honestly either way.

## Governance boundary

Changing the pnpm/Turbo ownership split, or weakening the non-zero-evidence
policy for any required layer, requires founder approval and an amending
ADR, since it would change what `pnpm verify` is trusted to mean.

## Integration expectations

Applies to every workspace created in Slices 2–5. CI (Slice 7) invokes this
contract; it must not redefine it.

## Verification expectations

Per `docs/engineering/definition-of-done.md`. Deferred to Slice 6 (Stage 5
acceptance criteria): `pnpm verify` passes locally from a documented
environment; intentionally breaking each critical boundary/test makes the
relevant gate fail and restoring the repository returns it to green. At this
decision's creation this was not yet verified: Turbo was not installed and no
real workspaces existed.

## Implementation and audit amendment — 2026-09-27

Turborepo 2.11.4 is installed and the repository now contains `apps/web`, `apps/storybook`, and `packages/ui/core`. The canonical `pnpm verify` contract covers formatting, linting, root/workspace type checks, root and component tests, Storybook browser/accessibility tests, the web application smoke test, dependency hygiene, real-module boundary checks, documentation consistency, and all three workspace builds.

Chromium is an explicit environment prerequisite, provisioned by `pnpm browsers:install` after a fresh dependency install. CI invokes that same repository script with `--with-deps` before `pnpm verify`; the browser download is intentionally not hidden inside the repeatable verification command. Focused contract tests protect both the smoke-test inclusion and the documented/CI bootstrap alignment.

The original verification expectation is now exercised locally and in CI. Each test layer has non-zero evidence. Boundary fixtures and the application/component/browser tests establish that their respective gates can fail, while the Definition of Done still requires honest reporting of what those tests do not prove.

## Reconsideration conditions

Revisit if Turborepo ships a breaking major release before Slice 2 begins, if
its actual Node-compatibility behavior conflicts with the repository's pin
once observed, or if the non-zero-evidence policy proves too strict for a
genuinely optional layer.
