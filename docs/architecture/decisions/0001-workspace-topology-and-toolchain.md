# ADR-0001: Workspace topology and toolchain

**Status:** Proposed
**Date:** 2026-10-13
**Deciders:** Hanaa Sadoqi (repository owner)

## Context

The repository was rebuilt as a Turborepo monorepo. The earlier implementation's ADRs (`docs/archive/architecture/decisions/`) describe a different workspace set (`apps/storybook`, `packages/ui/core`, four package categories, Vitest, dependency-cruiser) that no longer exists here. They are evidence, not authority (`docs/engineering/preservation-policy.md`). This ADR records the topology and toolchain that the repository actually declares today, so the documents can stop describing the old one.

Evidence: `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `.github/workflows/ci.yml`.

## Decision

- **Package manager and task runner:** pnpm workspaces (`packageManager: pnpm@11.25.0`) with Turborepo (`turbo ^2.11.7`) running `build`, `lint`, `check-types` and `dev`.
- **Runtime:** Node.js 24 or newer (`engines.node: ">=24"`, enforced by `engine-strict=true` in `.npmrc`).
- **Layout:** applications live in `apps/<name>`; packages live in `packages/<category>/<name>`. The workspace globs are `apps/*` and `packages/**/*`.
- **Current workspaces:**

  | Workspace                           | Package name              | Role                                                        |
  | ----------------------------------- | ------------------------- | ----------------------------------------------------------- |
  | `apps/web`                          | `web`                     | The Next.js application (composition root)                  |
  | `apps/docs`                         | `docs`                    | A second Next.js app, still the starter template            |
  | `packages/frontend/ui`              | `@synapcity/ui`           | Shared shadcn components, `cn`, hooks (ADR-0002, ADR-0004)  |
  | `packages/frontend/tailwind-config` | `@repo/tailwind-config`   | Shared Tailwind theme, tokens and PostCSS config (ADR-0002) |
  | `packages/dev/eslint-config`        | `@repo/eslint-config`     | Shared ESLint flat config                                   |
  | `packages/dev/typescript-config`    | `@repo/typescript-config` | Shared `tsconfig` bases                                     |

- **Language and tooling:** TypeScript 7.0.2, ESLint 10.9.1 with the shared config, Prettier 3.9.6, Knip for unused files, exports and dependencies, Next.js 16.3.8 and React 19.2.8 for the applications.
- **Verification chain:** `pnpm verify` runs `format:check`, `lint`, `check-types`, `deps` (Knip) and `build`, in that order, and stops at the first failure.
- **Gates:** a `.githooks/pre-push` hook runs `pnpm verify`; CI (`.github/workflows/ci.yml`) runs `verify`, `pr-hygiene` and `security` jobs.

## Scope

This governs where code lives, what runs it, and what the repository-wide checks are. It does not govern product behavior, persistence, or any package's internal design.

## What this does NOT decide

- A dependency-direction rule between package categories, and any tool that would enforce it.
- A test framework or any testing gate. No test runner is configured.
- A component-catalogue tool such as Storybook.
- Deployment topology.
- Whether `apps/docs` is kept, repurposed or removed.
- The npm scope policy: `@synapcity/*` and `@repo/*` are both in use (see Unresolved).

## Unresolved

- **Scope naming.** `@synapcity/ui` sits beside `@repo/tailwind-config`, `@repo/eslint-config` and `@repo/typescript-config`. Whether the scope should be `@synapcity/*` throughout, or `@repo/*` marks internal tooling only, has not been decided.
- **Node pin.** CI reads `node-version-file: .node-version`, but the repository has no `.node-version`, so the `verify` and `security` jobs cannot resolve a Node version. Either add the file or switch CI to `engines`.
- **Hook activation.** The old `prepare` script that set `core.hooksPath` is gone, so the pre-push hook is inactive until `git config core.hooksPath .githooks` is run by hand.
- **Enforcement.** CI failures block nothing on this repository's current plan (see `docs/engineering/quality-gates.md`).

## Governance boundary

The repository owner approves changes to the package manager, task runner, Node major, workspace layout, or the verification chain. Dependency upgrades are separately scoped changes (`AGENTS.md` §7a).

## Integration expectations

New workspaces are created through `docs/architecture/package-creation-checklist.md`. Every workspace defines the scripts the root tasks call (`build`, `lint`, `check-types`) where they apply, and internal dependencies use `workspace:*`.

## Verification expectations

`pnpm verify` passes on a fresh `pnpm install --frozen-lockfile`. The report states which of its steps ran. Until a test gate exists, a passing `verify` shows formatting, lint, types, unused code and builds are clean; it shows nothing about behavior.

## Reconsideration conditions

A second deployable app with different runtime needs, a decision to add tests or a component catalogue, a dependency-direction problem that code review cannot hold, or a collaborator joining (which changes the enforcement picture).
