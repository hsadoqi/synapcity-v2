# ADR-0003: Repository topology and runtime pins

**Status:** Accepted
**Amended by:** ADR-0007
**Date:** 2026-09-26
**Deciders:** Founder (technical direction)

## Context

Phase 1 (`hsadoqi/synapcity#1`) turns the Phase 0 governance layer into a reproducible development environment. P1-01 (`hsadoqi/synapcity#2`) requires a deliberate repository-topology decision and pinned runtime versions before downstream work (toolchain, architectural skeleton, CI) proceeds.

The repository currently contains documentation only: no `package.json`, lockfile, source, or workspace configuration. `README.md` states package topology has not been selected, and `docs/product/mvp.md` forbids creating a topology that presumes a first product slice, which is not yet chosen. `docs/architecture/principles.md` §6 requires package boundaries to follow demonstrated dependency and change boundaries rather than a pre-drawn package diagram, and §8 requires preserving uncertainty.

The founder has indicated candidate internal boundaries (domain, services, features, shared, ui, adapters). Those are input to P1-03 (`hsadoqi/synapcity#4`, architectural skeleton), not decided here.

## Decision

1. **Package manager:** pnpm, pinned to `10.24.0` via the root `package.json` `packageManager` field (Corepack-compatible).
2. **Node.js runtime:** `24.20.0`, expressed as an `engines.node` constraint (`>=24.20.0 <25`) plus a `.node-version` file.
3. **Root package:** a single private root package (`"private": true`). No `pnpm-workspace.yaml` and no `apps/` or `packages/` directories are created yet; the workspace file is added together with the first package, so no directory layout is presumed.
4. **Root script names reserved** for install, lint, typecheck, test, build, and verify. Their implementations belong to P1-02 (`hsadoqi/synapcity#3`) and P1-04 (`hsadoqi/synapcity#5`).

## Scope

This decision governs only: the package manager and its version, the Node.js version, whether a workspace file exists yet, and the reserved names of root scripts.

## What this does NOT decide

- The workspace layout, directory names, or package boundaries (including `domain`, `services`, `features`, `shared`, `ui`, `adapters`). These are P1-03.
- The package scope or naming convention (e.g. any `@scope/*`). Explicitly deferred by the founder until the first package exists.
- The application framework, first product slice, storage, API, routing, or state management.
- Any toolchain selection (TypeScript, lint, format, test, build tools). These are P1-02.
- Branch, pull request, and CI policy. These are P1-04.

## Unresolved

- Whether the eventual layout is a multi-package workspace or stays single-package longer, to be decided with P1-03 against real dependency and change boundaries.
- The package scope and naming convention.
- The glossary naming-decision process outcome for any working label that might become a package name.

## Governance boundary

Changing the package manager, its pinned version, the Node.js line, or introducing a workspace requires founder/human product-owner approval (`AGENTS.md` §5: package/repository topology). Routine patch-level bumps of the pins should still be a reviewed, single-purpose change.

## Integration expectations

- Later workstreams (P1-02 through P1-04) build on these pins and must not silently change them.
- A workspace file, once introduced, must follow `docs/architecture/principles.md` §6 and be justified by a demonstrated boundary.
- `AGENTS.md` §6 is updated with real verification commands only once those commands exist; this ADR does not predeclare them.

## Verification expectations

Per `docs/engineering/definition-of-done.md`, once the root files exist: a clean checkout must install with the pinned pnpm and Node (`pnpm install --frozen-lockfile`), with the lockfile committed. Any reserved script that has no implementation yet must fail visibly rather than pass, and the completion report must say what was not run.

## Reconsideration conditions

Revisit if the first product slice or P1-03 shows a workspace is needed earlier, if the pinned Node line leaves LTS support, or if a required dependency cannot support the pinned versions. Any change must be a new ADR.
