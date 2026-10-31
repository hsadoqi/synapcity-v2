# ADR-0001: Workspace topology and toolchain

> **Placement amendment — 2026-10-23:** [ADR-0014](0014-multi-app-package-boundaries.md) supersedes the category inventory, server-only-in-app restriction, shared frontend framework coupling, and package creation triggers. Its original toolchain inventory is a dated snapshot; use current manifests and the lockfile for installed versions. The wider testing strategy remains Proposed in ADR-0005. See the [ownership map](../reorganization-ownership-map.md) for the selected destinations. The original sections below preserve the decision history; conflicting placement statements or placement-related unresolved questions are superseded by this amendment. Source migration is not completed by this documentation change.

**Status:** Accepted
**Date:** 2026-10-13
**Deciders:** Hanaa Sadoqi (repository owner)

## Context

The repository was rebuilt as a Turborepo monorepo. The earlier implementation's ADRs
(`docs/archive/architecture/decisions/`) describe a different workspace set (`apps/storybook`,
`packages/ui/core`, four package categories, Vitest, dependency-cruiser) that no longer exists here.
They are evidence, not authority (`docs/engineering/preservation-policy.md`). This ADR records the
topology and toolchain that the repository actually declares today, so the documents can stop
describing the old one.

Evidence: `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `.github/workflows/ci.yml`.

## Decision

- **Package manager and task runner:** pnpm workspaces (`packageManager: pnpm@11.25.0`) with Turborepo (`turbo ^2.11.7`) running `build`, `lint`, `check-types` and `dev`.
- **Runtime:** Node.js 24 or newer (`engines.node: ">=24"`, enforced by `engine-strict=true` in `.npmrc`).
- **Layout:** applications live in `apps/<name>`; packages live in `packages/<category>/<name>`. The workspace globs are `apps/*` and `packages/**/*`.
- **Current workspaces:**

  | Workspace                           | Package name                          | Role                                                        |
  | ----------------------------------- | ------------------------------------- | ----------------------------------------------------------- |
  | `apps/web`                          | `web`                                 | The Next.js application (composition root)                  |
  | `apps/docs`                         | `docs`                                | The documentation site; a placeholder page today            |
  | `packages/frontend/ui`              | `@synapcity/frontend-ui`              | Shared shadcn components, `cn`, hooks (ADR-0002, ADR-0004)  |
  | `packages/frontend/tailwind-config` | `@synapcity/frontend-tailwind-config` | Shared Tailwind theme, tokens and PostCSS config (ADR-0002) |
  | `packages/dev/eslint-config`        | `@synapcity/dev-eslint-config`        | Shared ESLint flat config                                   |
  | `packages/dev/typescript-config`    | `@synapcity/dev-typescript-config`    | Shared `tsconfig` bases                                     |

- **Package names:** a package is named `@synapcity/<category>-<name>`, where `<category>` is its folder under `packages/` and `<name>` is its directory name in lowercase kebab-case, so `packages/frontend/ui` is `@synapcity/frontend-ui`. Apps are unscoped and named for their directory (`web`, `docs`). The owner set this convention on 2026-10-13 and renamed the packages to match.
- **Language and tooling:** TypeScript 7.0.2, ESLint 10.9.1 with the shared config, Prettier 3.9.6, Knip for unused files, exports and dependencies, Next.js 16.3.8 and React 19.2.8 for the applications.
- **Verification chain:** `pnpm verify` runs `format:check`, `lint`, `check-types`, `deps` (Knip), `brand:check` and `build`, in that order, and stops at the first failure.
- **Gates:** a `.githooks/pre-push` hook runs `pnpm verify`, activated on install by the root `prepare` script (`git config core.hooksPath .githooks`); CI (`.github/workflows/ci.yml`) runs `verify`, `pr-hygiene` and `security` jobs.
- **Transitive security fixes:** `pnpm-workspace.yaml` pins patched versions of eight transitive packages (`flatted`, `picomatch`, `nanoid`, `@humanfs/node`, `source-map-js`, `sharp`, `qs`, `systeminformation`) with `overrides`, and records one audit exception, GHSA-vfj7-8cjw-p6xm (`braces`), under `auditConfig.ignoreGhsas`. The owner approved both on 2026-10-13. The `qs` (GHSA-6pq8-jhm2-2vcw, through the shadcn CLI's `@modelcontextprotocol/sdk` > `express`) and `systeminformation` (GHSA-3f7j-7jwc-fxfj, through the shadcn CLI's `@dotenvx/dotenvx`) overrides were added on 2026-10-29; both are reached only through the shadcn CLI and ship to no user. `braces` has no patched release; it is reached only through dev-time glob tooling (`@next/eslint-plugin-next`'s `fast-glob`, the shadcn CLI) and ships to no user. Remove each override when its parent ships a patched range, and the exception when `braces` does.

## Scope

This governs where code lives, what runs it, and what the repository-wide checks are. It does not govern product behavior, persistence, or any package's internal design.

## What this does NOT decide

- A dependency-direction rule between package categories, and any tool that would enforce it.
- A test framework or any testing gate. No test runner is configured.
- A component-catalogue tool such as Storybook.
- Deployment topology.
- Documentation site content and tooling for `apps/docs`.
- Publishing. Every package is private; no public registry name or scope has been chosen.

## Unresolved

- **Node pin.** `.node-version` (24.20.0) was added on 2026-10-13 because CI reads it; `engines` still says `>=24`. Whether the pin should track the newest 24.x or stay exact has not been decided.
- **Exceptions are not tracked.** Nothing reminds anyone to remove an override or the `braces` exception when it becomes unnecessary; that is done by hand at dependency-update time.
- **Enforcement.** CI failures block nothing on this repository's current plan (see `docs/engineering/quality-gates.md`).

## Governance boundary

The repository owner approves changes to the package manager, task runner, Node major, workspace layout, or the verification chain. Dependency upgrades are separately scoped changes (`AGENTS.md` §7a).

## Integration expectations

New workspaces are created through `docs/architecture/package-creation-checklist.md`. Every workspace defines the scripts the root tasks call (`build`, `lint`, `check-types`) where they apply, and internal dependencies use `workspace:*`.

## Verification expectations

`pnpm verify` passes on a fresh `pnpm install --frozen-lockfile`. The report states which of its steps ran. A passing `verify` shows formatting, lint, types, unused code, builds and the existing tests are clean. Test coverage is thin, so it shows behavior only where a test exercises it.

## Reconsideration conditions

A second deployable app with different runtime needs, a decision to add tests or a component catalogue, a dependency-direction problem that code review cannot hold, or a collaborator joining (which changes the enforcement picture).
