# Boundary Checker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `@synapcity/dev-boundaries`, a workspace boundary checker run as `pnpm boundaries` inside `pnpm verify`, enforcing rules R1–R11 with a failing probe per rule.

**Architecture:** Discover workspaces, parse every source file with `oxc-parser`, resolve every import with `oxc-resolver` against the importing workspace's tsconfig and `exports`, classify each file into a package, category and entry graph by path, then run per-edge, reachability, cycle and guard rules. Existing violations are named one by one in an exception list that may only shrink.

**Tech Stack:** TypeScript run by Node 24.20.0 type stripping (no build), `oxc-parser@0.155.0`, `oxc-resolver@11.24.2`, Vitest 4.1.11, pnpm workspaces.

**Spec:** [docs/superpowers/specs/2026-10-23-m3-boundary-enforcement-design.md](../specs/2026-10-23-m3-boundary-enforcement-design.md), with rules recorded in [workspace-conventions.md](../../architecture/workspace-conventions.md#boundary-checks).

## Global Constraints

- Dependencies exactly `oxc-parser@0.155.0` and `oxc-resolver@11.24.2`, as `devDependencies` of `@synapcity/dev-boundaries` (owner decision G2). No other new dependency.
- Package at `packages/dev/boundaries`, named `@synapcity/dev-boundaries`, `"private": true`, `"type": "module"`.
- Source is `.ts` using only erasable syntax (no `enum`, no parameter properties, no namespaces); relative imports carry the `.ts` extension, as in `packages/dev/fixtures`.
- Layout follows the workspace conventions' Internal organization: one kebab-case folder per unit with `name.ts`, `name.test.ts` and `index.ts`; group folders by module.
- The matrix is one table mirroring ADR-0014 section 2, in one file.
- Every rule has a probe: a clean temporary workspace passes and one planted violation fails with that rule's ID.
- Exceptions are per file or edge only, each with `rule`, `file`, optional `specifier`, `reason`, `removal`; a stale exception fails the run.
- `apps/web/src/architecture.test.ts` is not modified or removed.
- No source outside `packages/dev/boundaries` changes, except the root wiring and documentation named in Task 9.
- Commits only if the owner has authorized them for this execution; otherwise leave changes staged for the owner.

## Review Focus

- A file that fails to parse must produce a violation (`R0`), never a silent skip. Test in Task 2.
- Asset and stylesheet imports (`./styles.css`, `./logo.svg`) resolve to files but are not code; they must not produce `R0` or enter the module graph. Test in Task 3.
- `import type` is erased at runtime: it counts for the matrix (`R2`) but not for browser reachability (`R3`). Test in Task 6.
- Re-export chains (`export * from`, `export { x } from`) are edges; `R3` must follow them. Test in Task 6.
- A package importing itself by name (`@synapcity/frontend-ui/...` inside `frontend-ui`) is a same-package edge, not `R5`. Test in Task 5.

---

## File structure

```
packages/dev/boundaries/
  package.json  tsconfig.json  vitest.config.ts  README.md
  src/
    model/          shared types (Workspace, SourceFile, ImportRecord, Edge, Violation, Exception, Graph, RuleId)
    workspace/      workspace and file discovery
    imports/        oxc-parser import extraction and directives
    resolve/        oxc-resolver per workspace
    classify/       path → package, category, graph, production
    matrix/         the ADR-0014 table
    rules/
      edge-rules/   R0, R1, R2, R4, R5, R6, R7, R8, R11
      reachability/ R3
      cycles/       R9
      server-guard/ R10
    exceptions/     exception list and matching
    check/          orchestration
    cli/            pnpm boundaries entry
    testing/
      workspace/    temporary workspace builder for probes
```

Each folder holds `<unit>.ts`, `<unit>.test.ts` and `index.ts`, except `model/` (types only, no test) and `testing/workspace/` (tested through its users).

---

### Task 1: Package scaffold and workspace discovery

**Files:**

- Create: `packages/dev/boundaries/package.json`, `tsconfig.json`, `vitest.config.ts`, `README.md`
- Create: `src/model/model.ts`, `src/model/index.ts`
- Create: `src/testing/workspace/workspace.ts`, `src/testing/workspace/index.ts`
- Create: `src/workspace/workspace.ts`, `src/workspace/workspace.test.ts`, `src/workspace/index.ts`
- Modify: root `vitest.config.ts` (add `'packages/dev/boundaries'` to `projects`)
- Modify: `pnpm-lock.yaml` (through install only)

**Interfaces:**

- Produces in `model.ts`:
  - `type Category = 'domain' | 'frontend' | 'server' | 'features' | 'dev' | 'app'`
  - `type Graph = 'domain' | 'frontend' | 'server' | 'feature-contracts' | 'feature-frontend' | 'feature-server' | 'app-browser' | 'app-backend' | 'testing' | 'dev'`
  - `type RuleId = 'R0' | 'R1' | 'R2' | 'R3' | 'R4' | 'R5' | 'R6' | 'R7' | 'R8' | 'R9' | 'R10' | 'R11'`
  - `interface WorkspacePackage { name: string; dir: string; category: Category; legacy: boolean; dependencies: string[]; exports: Record<string, string>; tsconfig: string | null }` (`dir` absolute; `dependencies` = workspace package names from `dependencies` and `devDependencies`; `exports` flattened to string targets)
  - `interface Workspace { root: string; packages: WorkspacePackage[] }`
  - `interface ImportRecord { specifier: string; typeOnly: boolean; kind: 'import' | 'export' | 'side-effect' | 'dynamic'; literal: boolean; line: number }`
  - `interface SourceFile { path: string; pkg: WorkspacePackage; graph: Graph; production: boolean; directive: 'use client' | 'use server' | null; imports: ImportRecord[]; parseError: string | null }`
  - `type Target = { kind: 'file'; file: SourceFile } | { kind: 'asset'; path: string } | { kind: 'external'; name: string } | { kind: 'unresolved' }`
  - `interface Edge { from: SourceFile; record: ImportRecord; target: Target }`
  - `interface Violation { rule: RuleId; file: string; specifier: string; target: string | null; message: string }` (`file` repository-relative, POSIX separators)
  - `interface Exception { rule: RuleId; file: string; specifier?: string; reason: string; removal: string }`
- Produces in `workspace.ts`: `loadWorkspace(root: string): Workspace` and `listSourceFiles(pkg: WorkspacePackage): string[]`
- Produces in `testing/workspace.ts`: `createWorkspace(files: Record<string, string>, links?: Record<string, string>): { root: string; cleanup(): void }` (writes each relative path under a fresh `mkdtempSync` directory; `links` maps a link path such as `apps/web/node_modules/@x/a` to a target directory such as `packages/frontend/a`, both relative to the root, created as directory symlinks the way pnpm links workspace packages; callers supply `package.json` files)

- [ ] **Step 1: Create the package files.** `package.json` with scripts `check-types: tsc --noEmit`, `test: vitest run`, `test:coverage: vitest run --coverage`, `boundaries: node src/cli/cli.ts`; `devDependencies` matching `packages/dev/fixtures` (`@synapcity/dev-typescript-config`, `@synapcity/dev-vitest-config`, `@types/node 26.6.5`, `@vitest/coverage-v8 4.1.11`, `typescript 7.0.2`, `vitest 4.1.11`). `tsconfig.json` and `vitest.config.ts` copied from `packages/dev/fixtures`. `README.md` starts with `Owns: the workspace boundary checker (pnpm boundaries) and its violation probes.` and links the conventions' Boundary checks section.
- [ ] **Step 2: Install the approved dependencies.** Run `pnpm --filter @synapcity/dev-boundaries add -D oxc-parser@0.155.0 oxc-resolver@11.24.2`. Expected: `package.json` lists both exact versions; `pnpm-lock.yaml` changes; no other manifest changes (`git diff --stat`).
- [ ] **Step 3: Write the failing tests** in `workspace.test.ts`:
  - `loadWorkspace` on a temporary workspace with `apps/web/package.json`, `packages/frontend/ui/package.json` and `packages/features/settings/package.json` returns three packages with categories `app`, `frontend`, `features`.
  - `legacy` is `true` for `@synapcity/frontend-ui`, `@synapcity/frontend-site`, `@synapcity/frontend-tailwind-config` and every `@synapcity/dev-*` name, `false` otherwise.
  - `dependencies` contains a `workspace:*` dependency's name and excludes npm packages.
  - `listSourceFiles` includes `src/a.ts`, `src/b.tsx` and `vitest.config.ts`; excludes `node_modules/`, `.next/`, `dist/`, `coverage/`, `.turbo/`, `storybook-static/`, `playwright-report/`, `test-results/` and `*.d.ts`.
- [ ] **Step 4: Run** `pnpm --filter @synapcity/dev-boundaries exec vitest run src/workspace`. Expected: FAIL (module not found).
- [ ] **Step 5: Implement `loadWorkspace` and `listSourceFiles`.** Packages are directories with a `package.json` at `apps/<name>` or `packages/<category>/<name>`; category comes from the path segment. Source extensions: `.ts .tsx .mts .cts .js .jsx .mjs .cjs`.
- [ ] **Step 6: Run** the same command. Expected: PASS.
- [ ] **Step 7: Add the package to the root `vitest.config.ts` projects and run** `pnpm test:coverage --filter @synapcity/dev-boundaries`. Expected: PASS.

### Task 2: Import extraction

**Files:** Create `src/imports/imports.ts`, `imports.test.ts`, `index.ts`.

**Interfaces:**

- Consumes: `ImportRecord` from Task 1.
- Produces: `readModule(path: string, source: string): { imports: ImportRecord[]; directive: 'use client' | 'use server' | null; parseError: string | null }`

- [ ] **Step 1: Write the failing tests:**
  - `import { a } from './a'` gives `{ specifier: './a', typeOnly: false, kind: 'import', literal: true, line: 1 }`.
  - `import type { T } from './t'` gives `typeOnly: true`; `import { type T } from './t'` where every entry is a type also gives `typeOnly: true`.
  - `export * from './b'` and `export { x } from './c'` give `kind: 'export'`.
  - `import './side'` gives `kind: 'side-effect'`.
  - `await import('./lazy')` gives `kind: 'dynamic', literal: true`; `import(name)` gives `literal: false` with `specifier: ''`.
  - A file whose first statement is `'use client';` gives `directive: 'use client'`; `'use server'` likewise; a directive after other code gives `null`.
  - A `.tsx` file with JSX parses without error.
  - Source `import { from './broken'` gives a non-null `parseError` and does not throw.
- [ ] **Step 2: Run** `pnpm --filter @synapcity/dev-boundaries exec vitest run src/imports`. Expected: FAIL.
- [ ] **Step 3: Implement `readModule`** with `parseSync` from `oxc-parser`, reading `module.staticImports`, `module.staticExports` (entries with a `moduleRequest`), and `module.dynamicImports` (its `moduleRequest` is a span: slice the source and accept only a single string literal). Line numbers come from the statement start offset. The directive comes from the leading `ExpressionStatement` nodes of `program.body` that carry a `directive` string.
- [ ] **Step 4: Run** the same command. Expected: PASS.

### Task 3: Resolution

**Files:** Create `src/resolve/resolve.ts`, `resolve.test.ts`, `index.ts`.

**Interfaces:**

- Consumes: `Workspace`, `WorkspacePackage` (Task 1).
- Produces: `createResolver(workspace: Workspace): (fromFile: string, specifier: string) => { kind: 'path'; path: string } | { kind: 'external'; name: string } | { kind: 'unresolved' }`

- [ ] **Step 1: Write the failing tests** on a temporary workspace with two packages, `@x/a` (exports `{ ".": "./src/index.ts", "./sub/*": "./src/sub/*/index.ts" }`) and an app with a tsconfig mapping `@/*` to `./src/*`, both linked through a `node_modules/@x/a` symlink:
  - `@x/a` and `@x/a/sub/thing` resolve to the mapped files.
  - `@/lib/util` from the app resolves through tsconfig paths.
  - `./util` resolves `util.ts` and `util/index.ts`; `./util.js` resolves `util.ts` (extension alias).
  - `./styles.css` resolves to the stylesheet path.
  - `@x/a/private/file` (not in `exports`) is `unresolved`.
  - `zod` installed under `node_modules/zod` returns `{ kind: 'external', name: 'zod' }`; `node:fs` returns `external` with name `node:fs`; `@scope/pkg/deep` returns name `@scope/pkg`.
- [ ] **Step 2: Run** `pnpm --filter @synapcity/dev-boundaries exec vitest run src/resolve`. Expected: FAIL.
- [ ] **Step 3: Implement `createResolver`** with one `ResolverFactory` per workspace package (keyed by the package owning `fromFile`), options `tsconfig: { configFile, references: 'auto' }` when the package has a tsconfig, `conditionNames: ['import', 'default']`, `extensions` for the source extensions plus `.json` and `.css`, `extensionAlias: { '.js': ['.ts', '.tsx', '.js'] }`, `mainFields: ['module', 'main']`. A path inside a `node_modules` directory that is not a workspace package's real path is `external`.
- [ ] **Step 4: Run** the same command. Expected: PASS.

### Task 4: Classification and the matrix

**Files:** Create `src/classify/classify.ts`, `classify.test.ts`, `index.ts`; `src/matrix/matrix.ts`, `matrix.test.ts`, `index.ts`.

**Interfaces:**

- Consumes: `WorkspacePackage`, `Graph` (Task 1).
- Produces: `classifyFile(path: string, pkg: WorkspacePackage, directive: 'use client' | 'use server' | null): { graph: Graph; production: boolean }`
- Produces: `MATRIX: Record<Graph, readonly Graph[]>` and `isAllowed(from: Graph, to: Graph): boolean`

- [ ] **Step 1: Write the failing tests** for `classifyFile`:
  - `packages/features/settings/src/frontend/x.tsx` → `feature-frontend`; `src/contracts/…` → `feature-contracts`; `src/server/…` → `feature-server`; `src/testing/…` → `testing`, production `false`.
  - `packages/domain/records/src/spaces/x.ts` → `domain`; `packages/frontend/ui/src/next/link.tsx` → `frontend`; `packages/server/data/src/testing/x.ts` → `testing`.
  - Any `packages/dev/*` file → `dev`.
  - An app file with `'use client'` → `app-browser`; without → `app-backend`.
  - Production `false` for `*.test.ts`, `*.dom.test.tsx`, `*.stories.tsx`, files under `e2e/` or `.storybook/`, `*.config.ts`/`*.config.mjs`, and every file in the `storybook` app.
- [ ] **Step 2: Write the failing tests** for `isAllowed`, one per matrix row of ADR-0014 section 2: for example `isAllowed('frontend', 'server') === false`, `isAllowed('feature-frontend', 'feature-contracts') === true`, `isAllowed('feature-server', 'feature-frontend') === false`, `isAllowed('app-browser', 'feature-server') === false`, `isAllowed('app-backend', 'feature-server') === true`, `isAllowed('domain', 'frontend') === false`; nothing allows `testing` or `dev`.
- [ ] **Step 3: Run** `pnpm --filter @synapcity/dev-boundaries exec vitest run src/classify src/matrix`. Expected: FAIL.
- [ ] **Step 4: Implement both.** `MATRIX` is the single table: domain → [domain]; frontend → [domain, frontend]; server → [domain, server]; feature-contracts → [domain, feature-contracts]; feature-frontend → [domain, frontend, feature-contracts, feature-frontend]; feature-server → [domain, server, feature-contracts, feature-server]; app-browser → [domain, frontend, feature-contracts, feature-frontend, app-browser, app-backend]; app-backend → [domain, frontend, server, feature-contracts, feature-frontend, feature-server, app-browser, app-backend]; testing and dev → every graph (non-production). Same-app browser/backend edges are allowed here; `R3` judges runtime reach.
- [ ] **Step 5: Run** the same command. Expected: PASS.

### Task 5: Graph building and per-edge rules

**Files:** Create `src/rules/edge-rules/edge-rules.ts`, `edge-rules.test.ts`, `index.ts`. `buildEdges` lives here because every later rule consumes its output.

**Interfaces:**

- Consumes: Tasks 1–4.
- Produces: `buildEdges(workspace: Workspace): { files: Map<string, SourceFile>; edges: Edge[] }` (in `src/rules/edge-rules/edge-rules.ts`, reused by Tasks 6–8), and `edgeRules(files: Map<string, SourceFile>, edges: Edge[], workspace: Workspace): Violation[]`
- Constant in the same file: `DOMAIN_LIBRARIES = ['zod']`.

- [ ] **Step 1: Write the failing probe tests,** each with a clean case that passes and one violation that fails with the rule ID:
  - `R0`: a production import that does not resolve; a non-literal dynamic import; a file with a parse error. A test file importing a missing module also fails (scans must not go silent).
  - `R1`: `packages/frontend/x/src/a.ts` importing `../../../../apps/web/src/b`.
  - `R2`: a `frontend` file importing a `server` package; a `domain` file with `import type` from a `frontend` package (type-only still counts); an app importing another app's file.
  - `R4`: a domain file importing `react`; `zod` passes; `node:fs` fails.
  - `R5`: a relative import into another package's `src/`; a package importing itself by name passes.
  - `R6`: `src/frontend/a.ts` importing `../server/b`; `src/contracts/a.ts` importing `../frontend/b`; `src/frontend/a.ts` importing `../testing/f`; a feature source file outside the four folders.
  - `R7`: in a non-legacy package, `src/a/a.ts` importing `../b/b.ts` fails and `../b` passes; the same import in `frontend-ui` passes.
  - `R8`: a production file importing `@synapcity/dev-fixtures`, another package's `./testing` entry, or a `*.test.ts` file; a test file importing `@synapcity/dev-fixtures` passes; `vitest.config.ts` importing `@synapcity/dev-vitest-config/base` passes.
  - `R11`: a `frontend` file outside `src/next/` importing `next/link` fails; one inside `src/next/` passes.
  - Assets: `import './styles.css'` and `import logo from './logo.svg'` produce no violation and no `file` target.
- [ ] **Step 2: Run** `pnpm --filter @synapcity/dev-boundaries exec vitest run src/rules/edge-rules`. Expected: FAIL.
- [ ] **Step 3: Implement `buildEdges` and `edgeRules`.** A resolved path with a source extension inside a workspace package becomes a `file` target; another existing path is an `asset`. `R2` applies to edges between production files of different packages or apps; same-package edges are judged by `R6`/`R7`. `R7` applies only to packages with `legacy: false`.
- [ ] **Step 4: Run** the same command. Expected: PASS.

### Task 6: Browser reachability (R3)

**Files:** Create `src/rules/reachability/reachability.ts`, `reachability.test.ts`, `index.ts`.

**Interfaces:**

- Consumes: `buildEdges` output (Task 5).
- Produces: `reachabilityRule(files: Map<string, SourceFile>, edges: Edge[]): Violation[]`
- Constant: `APP_SERVER_ONLY = ['apps/web/src/lib/supabase/server.ts', 'apps/web/src/lib/supabase/middleware.ts', 'apps/web/src/lib/access/']` (prefix match), plus external `next/headers` and `server-only`.

- [ ] **Step 1: Write the failing probe tests:**
  - A `frontend` file importing a harmless `frontend` file that imports a `server` package file fails `R3`, and the message names the chain of files.
  - A `'use client'` app file reaching `next/headers` through two app files fails.
  - A `'use client'` app file importing a `'use server'` file that imports a server package passes (walk stops at the action boundary).
  - The same chain through `import type` only passes.
  - The chain through `export * from` and `export { x } from` fails.
  - A `feature-contracts` file reaching a `feature-server` file fails.
- [ ] **Step 2: Run** `pnpm --filter @synapcity/dev-boundaries exec vitest run src/rules/reachability`. Expected: FAIL.
- [ ] **Step 3: Implement `reachabilityRule`:** breadth-first search from every production file whose graph is `frontend`, `feature-frontend`, `feature-contracts` or `app-browser`, following value edges only and not entering `'use server'` files; report each forbidden target once per source with the shortest path.
- [ ] **Step 4: Run** the same command. Expected: PASS.

### Task 7: Cycles (R9) and server guard (R10)

**Files:** Create `src/rules/cycles/cycles.ts`, `cycles.test.ts`, `index.ts`; `src/rules/server-guard/server-guard.ts`, `server-guard.test.ts`, `index.ts`.

**Interfaces:**

- Produces: `cycleRule(workspace: Workspace, edges: Edge[]): Violation[]` and `serverGuardRule(files: Map<string, SourceFile>, workspace: Workspace): Violation[]`

- [ ] **Step 1: Write the failing probe tests:**
  - Two packages depending on each other (through `devDependencies` too) fail `R9` once, naming both.
  - Module cycle `a → b → c → a` inside one package fails once, with `file` set to the alphabetically first member and the message listing all members; a type-only edge still forms a cycle.
  - A `server` package whose `exports['.']` file starts with `import 'server-only';` passes; without it fails `R10`; a feature package's `exports['./server']` file likewise.
  - A non-entry file importing `server-only` fails `R10`.
- [ ] **Step 2: Run** `pnpm --filter @synapcity/dev-boundaries exec vitest run src/rules/cycles src/rules/server-guard`. Expected: FAIL.
- [ ] **Step 3: Implement both,** using Tarjan's strongly connected components for package and module graphs (components larger than one node, or a self-edge).
- [ ] **Step 4: Run** the same command. Expected: PASS.

### Task 8: Exceptions, orchestration and CLI

**Files:** Create `src/exceptions/exceptions.ts`, `exceptions.test.ts`, `index.ts`; `src/check/check.ts`, `check.test.ts`, `index.ts`; `src/cli/cli.ts`, `index.ts`.

**Interfaces:**

- Produces: `EXCEPTIONS: readonly Exception[]` (empty in this task) and `applyExceptions(violations: Violation[], exceptions: readonly Exception[]): { remaining: Violation[]; stale: Exception[] }`
- Produces: `check(root: string, exceptions?: readonly Exception[]): { violations: Violation[]; stale: Exception[]; fileCounts: Record<string, number> }` (defaults to `EXCEPTIONS`; keys of `fileCounts` are package names)
- CLI: prints one line per violation as `<rule> <file> -> <specifier> (<target>): <message>`, then one line per stale exception, then a summary; exit code 1 if either list is non-empty, 0 otherwise.

- [ ] **Step 1: Write the failing tests:**
  - `applyExceptions` removes a violation matching `rule` and `file` (and `specifier` when given) and returns an unmatched exception in `stale`.
  - `check` on a clean temporary workspace returns no violations, no stale exceptions and a non-zero file count for each package.
  - `check` on a workspace with one `R3` violation returns exactly one violation.
  - A package with a `src/` folder but zero source files makes `check` throw with the package name (scan went silent).
- [ ] **Step 2: Run** `pnpm --filter @synapcity/dev-boundaries exec vitest run src/exceptions src/check`. Expected: FAIL.
- [ ] **Step 3: Implement `applyExceptions`, `check` and `cli.ts`.** `check` runs `buildEdges`, then `edgeRules`, `reachabilityRule`, `cycleRule` and `serverGuardRule`, sorts violations by file then rule, and applies exceptions. `cli.ts` calls `check` with the repository root, `resolve(import.meta.dirname, '../../../../..')` (from `packages/dev/boundaries/src/cli`).
- [ ] **Step 4: Run** the same command. Expected: PASS.
- [ ] **Step 5: Run the CLI on the repository:** `pnpm --filter @synapcity/dev-boundaries boundaries`. Expected: it completes and lists the current violations. Record the output in the task-scope ledger; do not fix source.

### Task 9: First-run triage, gate wiring and documentation

**Files:**

- Modify: `packages/dev/boundaries/src/exceptions/exceptions.ts`
- Create: `packages/dev/boundaries/src/check/repository.test.ts`
- Modify: root `package.json` (`boundaries` script; `verify` chain)
- Modify: `AGENTS.md` (section 6 check list), `docs/engineering/quality-gates.md` (`pnpm verify` row), `docs/engineering/setup.md` (`pnpm verify` row and a new `pnpm boundaries` row), `docs/architecture/workspace-conventions.md` (Boundary checks status line), `docs/architecture/decisions/README.md` (candidate entry), `packages/dev/README.md` (existing packages table), `.agents/task-scope.md`

- [ ] **Step 1: Triage each violation from Task 8 Step 5.** If it reveals a checker bug (for example a false positive from resolution), fix the checker with a new failing test first. Otherwise add one `Exception` per file or edge with its rule, a reason, and the removal milestone from the ownership map (for example `frontend-ui` `next/link` imports → `M6 shell and link migration`). If a rule produces more than about 30 exceptions, stop and report to the owner instead of listing them.
- [ ] **Step 2: Write `repository.test.ts`:** `check(<repo root>)` returns no violations and no stale exceptions, and `fileCounts` is non-zero for `web`, `@synapcity/frontend-ui` and `@synapcity/dev-fixtures`.
- [ ] **Step 3: Run** `pnpm --filter @synapcity/dev-boundaries test`. Expected: PASS.
- [ ] **Step 4: Prove the gate fails.** Temporarily add `import 'next/headers';` to a `'use client'` file in `apps/web`, run `pnpm boundaries`, expect exit code 1 naming `R3`, then remove the line and confirm `git diff` shows no change to that file.
- [ ] **Step 5: Wire the root.** Add `"boundaries": "pnpm --filter @synapcity/dev-boundaries boundaries"` and insert `pnpm boundaries` into `verify` directly after `pnpm deps`. Update the documentation files listed above to name `pnpm boundaries` and change the conventions status line to "enforced by `pnpm boundaries` in `pnpm verify`". Log the exception count and the gate change in the ledger.
- [ ] **Step 6: Run the gate.** `pnpm verify`. Expected: PASS end to end. Report each step's result, anything cached, and anything not run.
- [ ] **Step 7: Commit** (only if authorized):

```bash
git add packages/dev/boundaries package.json pnpm-lock.yaml vitest.config.ts AGENTS.md docs .agents/task-scope.md
git commit -m "feat: add workspace boundary checker and run it in pnpm verify"
```
