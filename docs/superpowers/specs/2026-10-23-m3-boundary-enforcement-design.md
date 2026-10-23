# Milestone 3.4: dependency enforcement

**Status:** Accepted by the owner on 2026-10-23 and recorded in the [workspace conventions](../../architecture/workspace-conventions.md#boundary-checks). Implemented by its plan as `pnpm boundaries` (`packages/dev/boundaries`); Milestone 3.5 integration items remain.
**Date:** 2026-10-23
**Branch:** `chore/reorganization-m3-boundary-enforcement`
**Enforces:** [ADR-0014](../../architecture/decisions/0014-multi-app-package-boundaries.md) section 2 and the [workspace conventions](../../architecture/workspace-conventions.md) for the package inventory, entry points and internal organization.

## 1. Intent

The boundary rules fail the build instead of living only in documents. A forbidden import, a reachable server module in browser code, a bypassed public interface or a cycle stops `pnpm verify`, locally and in CI. Each rule is proven by a probe that breaks it and watches the check fail.

## 2. Goals, non-goals, anti-goals

**Goals:** one checker for the whole workspace; direct and transitive checks; violation probes for every rule; a named, shrinking list of existing exceptions.

**Non-goals:** moving source or creating feature/domain/server packages (later milestones); checking product behavior; replacing Knip, TypeScript or ESLint.

**Anti-goals:** a check that passes only because current source happens to comply (every rule needs a failing probe); silent scans that find zero files and pass; a broad legacy exemption instead of named paths with removal conditions (ADR-0014 migration and preservation contract).

## 3. Evidence (spikes in the scratchpad, 2026-10-23; no repository change)

- **TypeScript 7.0.2** exports only `./lib/version.cjs` and `./unstable/*` entries; there is no classic compiler API. ESLint already runs on `@babel/eslint-parser` 8.
- **dependency-cruiser 18.7.0**: its `--info` lists `typescript >=2.0.0 <7.0.0` and Babel `<8.0.0` as unsupported, with `.ts`/`.tsx` disabled. With `@swc/core@1.16.20` added it parses the repository and resolves workspace `exports` once configured, but cannot resolve the web app's `@/` tsconfig paths (they need the TypeScript API).
- **eslint-plugin-boundaries 7.3.0** checks direct imports per file and has no cycle detection.
- **oxc-parser + oxc-resolver** (already installed as Knip 6.41.0 dependencies: `oxc-parser ^0.153.0`, `oxc-resolver 11.24.2`) parsed `apps/web/src/app/[userId]/home/dashboards/error.tsx` and resolved all four imports, including `@/…` through tsconfig and `@synapcity/frontend-ui/core/button` through `exports`, in about 15 ms, with no TypeScript API.
- Registry, same day: `oxc-parser` 0.155.0 (MIT, oxc-project), `oxc-resolver` 11.24.2.
- Node 24.20.0 strips TypeScript types natively (`process.features.typescript === 'strip'`).
- Tests run per workspace through Turbo; the root `vitest.config` lists projects; the root `scripts/` folder has no test runner.

## 4. Owner decisions (2026-10-23)

| #   | Decision                                                                                                                                                                                                                                                    |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| G1  | Build a custom boundary checker on `oxc-parser` and `oxc-resolver`, not dependency-cruiser or eslint-plugin-boundaries.                                                                                                                                     |
| G2  | Declare `oxc-parser` and `oxc-resolver` as development dependencies of the checker. Versions follow the repository default of latest stable: `oxc-parser@0.155.0` (adds a second copy beside Knip's 0.153.x) and `oxc-resolver@11.24.2` (shared with Knip). |
| G3  | The checker lives in a new `dev-boundaries` package (H1), `pnpm boundaries` joins `pnpm verify` after `pnpm deps`, and the rules, exception policy and probes in section 6 are accepted.                                                                    |

## 5. Resolved: where the checker lives

**H1, resolved by the owner on 2026-10-23: a new `dev-boundaries` package.** The options were:

- **A new `dev-boundaries` package (recommended).** The probes are Vitest tests, and tests run per workspace through Turbo, so a package gets `test` and `test:coverage` like every other workspace. It belongs in the `dev` category (tooling, never shipped) and adds one row to the inventory. `pnpm boundaries` runs its CLI.
- **Root `scripts/boundaries/`.** No new package, matching `scripts/check-brand-assets.mjs`, but the probes would need a new root test setup outside Turbo's per-workspace tasks.

## 6. What the checker does

### Model

1. **Files.** Every `.ts`, `.tsx`, `.mts`, `.cts`, `.js`, `.mjs` and `.jsx` file under `apps/*` and `packages/**`, excluding `node_modules`, build output and generated files. A run that finds no files in a workspace fails.
2. **Classification.** Each file gets a package, a category and an entry graph from its path:
   - `packages/<category>/<name>/src/…` gives the category. In feature packages, the first folder under `src/` (`contracts`, `frontend`, `server`, `testing`) gives the entry graph. In other packages the graph is the package's single runtime, except files under a `next/` or `testing/` folder.
   - In apps, a file that starts with `'use client'`, and every app file it reaches, is in the **app browser** graph; other app files are **app backend**.
   - A file that starts with `'use server'` is a **server action boundary**: browser-graph files may import it, because Next replaces it with a reference, and the browser-graph walk stops there. Its own imports belong to the backend graph.
   - Tests (`*.test.*`, `*.dom.test.*`), stories (`*.stories.*`), `e2e/`, configuration files, `.storybook/` and the whole `apps/storybook` host are **non-production**.
3. **Edges.** Every static import, `export … from`, side-effect import and literal dynamic `import('…')`, including `import type`. Each is resolved with `oxc-resolver` using the importing workspace's tsconfig and the `import`/`default` conditions. A non-literal dynamic import in production code is itself a violation.

### Rules

| #   | Rule                                                                                                                                                                                                                                                            | Source                  |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| R1  | Packages never import app source.                                                                                                                                                                                                                               | ADR-0014, conventions   |
| R2  | Every edge between categories and entry graphs is allowed by the dependency matrix, including its conditions.                                                                                                                                                   | ADR-0014 section 2      |
| R3  | **Transitive:** no file reachable from a frontend package, a feature `frontend` or `contracts` graph, or the app browser graph is in a server package, a feature `server` graph, or an app-only server module (`next/headers`, the web server Supabase client). | ADR-0014, 3.2 rule 4    |
| R4  | Domain production files import only domain packages and an allowlist of platform-independent libraries (initially `zod`).                                                                                                                                       | ADR-0014, domain README |
| R5  | Imports into another package resolve through its `exports`. A relative path into another package, or a specifier the resolver cannot match to an `exports` entry, fails.                                                                                        | 3.2 rule 1              |
| R6  | Inside feature packages, the 3.3 path rules hold: `frontend/` and `contracts/` never import `server/`; `contracts/` never imports `frontend/`; nothing outside `testing/` imports `testing/`.                                                                   | 3.3 rule 7              |
| R7  | In new packages, an import from another folder targets that folder's `index.ts`, never a file inside it. `frontend-ui` keeps its own structure test.                                                                                                            | 3.3 rules 2, 13         |
| R8  | Production files never import `dev-*` packages, another package's `./testing` entry, or test and story files. Configuration files may import `dev-*` configuration packages.                                                                                    | ADR-0014, 3.2 rule 8    |
| R9  | No cycles in the package graph (from `package.json` dependencies, including development ones) or the module graph.                                                                                                                                              | ADR-0014 section 2      |
| R10 | The file behind every server entry starts with `import 'server-only'`; no other file imports it.                                                                                                                                                                | 3.2 rule 5              |
| R11 | Framework-specific imports (`next`, `next/*`) in frontend packages occur only under the `./next` entry's folder.                                                                                                                                                | 3.2 rule 7              |

### Existing exceptions

Current source predates these rules. Known cases (to be confirmed by the first run):

- `frontend-ui` imports `next/link` outside a `./next` entry (R11); removal: its M6 shell and link migration.
- Any module cycles the first run finds inside existing packages or `apps/web` (R9); removal: the migration that moves that code.

Each exception is one entry in a checked-in list: file or edge, rule, reason, removal milestone. The checker fails if an exception no longer matches anything, so the list only shrinks. No category, package or folder-wide exemption is allowed.

### Probes

For every rule, a Vitest test builds a small temporary workspace (package manifests, tsconfig and a few files), runs the checker, and asserts:

- the clean workspace passes;
- one deliberate violation fails with that rule's ID and the offending file and import;
- for R3, the violation is two hops away (a harmless frontend module that imports a server module), so a direct-only check would miss it; and a client component importing a `'use server'` action passes.

A separate test runs the checker on the real repository and fails if any workspace yields zero files.

## 7. How it runs

- `pnpm boundaries` runs the checker on the workspace and prints one line per violation: rule, file, import, resolved target.
- It is added to `pnpm verify` directly after `pnpm deps`, so CI (`.github/workflows/ci.yml`) and the pre-push hook run it without separate changes. This is a quality-gate change and is part of this approval.
- `apps/web/src/architecture.test.ts` stays. It enforces the web app's internal feature layering, which this checker does not replace until those features migrate. Its removal is a separate, later change once the checker covers what it protects.

## 8. Calls made by Claude (owner to check)

| #   | Call                                                                              | Why                                                                                                      |
| --- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| C1  | Written in TypeScript, run directly by Node's type stripping.                     | Matches the repository's language without a build step; Node 24.20.0 supports it.                        |
| C2  | The domain library allowlist starts with `zod` only.                              | The only portable library current contracts use; additions are deliberate edits to the checker's config. |
| C3  | Exceptions that no longer match fail the run.                                     | Keeps the exception list honest and shrinking.                                                           |
| C4  | `import type` edges are checked like value imports.                               | ADR-0014: type-only imports still respect ownership and must not hide cycles.                            |
| C5  | App browser graph is derived from `'use client'` files and everything they reach. | Mirrors how Next builds the client bundle; the `server-only` guard backs it up at build time.            |

## 9. Left to the builder and later parts

- The checker's internal structure, output format details and performance tuning.
- How the matrix is expressed in code; it must be one table mirroring ADR-0014 section 2, not rules scattered through the code.
- **3.5:** wiring the package into Turbo and the root coverage projects, and documenting the run in the Definition of Done.

## 10. Recording this design

On approval: add the rule table and the exception policy to the workspace conventions; update the ADR index's candidate entry "Boundary enforcement implementation" to name the selected mechanism; log the dependency, gate and placement approvals in the task-scope ledger; update `AGENTS.md` section 6's list of repository checks when `pnpm boundaries` exists.
