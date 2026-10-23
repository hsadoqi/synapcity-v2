# Milestone 3.3: internal file organization

**Status:** Accepted by the owner on 2026-10-23 and recorded in the [workspace conventions](../../architecture/workspace-conventions.md#internal-organization). Kept as the record of evidence and decisions.
**Date:** 2026-10-23
**Branch:** `chore/reorganization-m3-boundary-enforcement`
**Builds on:** the [package inventory](../../architecture/workspace-conventions.md#package-inventory) (3.1) and [entry points](../../architecture/workspace-conventions.md#entry-points) (3.2).

## 1. Intent

Every package is laid out the same way, so a reader finds a unit, its tests and its stories in one place, and the 3.2 runtime rules can be checked from file paths. The layout follows the folder-per-unit style the codebase already uses.

## 2. Goals, non-goals, anti-goals

**Goals:** one unit layout; top-level folders that make runtime boundaries visible; clear homes for tests, stories, fixtures and entry files.

**Non-goals:** retroactive refactoring. These rules apply as code moves into packages; current `apps/web` folders stay until their migration. Tooling that enforces the layout is 3.4/3.5.

**Anti-goals:** domain records duplicated inside a feature; catch-all folders whose name says nothing about what they hold; a layout that hides which runtime a file runs in.

## 3. Evidence (snapshot 2026-10-23)

- In `apps/web/src`, 114 of 147 `index.ts` files are one-line forwarders to a sibling file; in `packages/frontend/ui/src`, 55 of 68. 91 folders under `apps/web/src/features` hold exactly one source file plus its index and tests.
- Test naming is already consistent: `*.test.ts(x)` (142), `*.dom.test.ts(x)` (108), `*.e2e.ts` (7), with `*.stories.tsx` (63) beside components.
- `frontend-ui`'s `package-structure.test.ts` enforces a folder per component with its index, stories and tests, and same-folder-only relative imports.
- The ownership map flags `shared` as ambiguous: in Settings it mixes pure rules, browser effects and presentation.

## 4. Owner decisions (2026-10-23)

| #   | Decision                                                                                                                                                                                                                        |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1  | Keep the folder look: every unit (component, hook, helper, schema, rule) has its own folder with an `index.ts`. The owner prefers it as more organized and easier to read.                                                      |
| F2  | Feature entry names stay `./contracts`, `./frontend`, `./server`, `./testing` (owner delegated the naming; kept because `./types` would contradict the no-types-only-entries rule and `./model` collides with domain).          |
| F3  | Features never re-export domain contracts. Consumers import a domain contract from its domain package. A temporary migration bridge is the only exception and records its consumers and removal condition (ADR-0014 section 6). |

## 5. Rules

### Units

1. A unit lives in a folder named after it, in kebab-case: `avatar-url/` holds `avatar-url.ts`, its tests, and `index.ts`. A component folder also holds `name.stories.tsx`.
2. `index.ts` re-exports the unit's public names. Code outside the folder imports the folder (`../avatar-url`), never a file inside it. Code inside the folder imports its siblings by relative path.
3. A unit's private helpers stay inside its folder. When a helper is needed by a second unit, it becomes its own unit folder.
4. Tests sit beside what they test: `name.test.ts(x)` for logic, `name.dom.test.ts(x)` for DOM behavior. Browser end-to-end tests stay in each app's `e2e/` folder as `*.e2e.ts`.
5. Small, invariant-specific test inputs stay beside the test. Shared records and scenarios come from `dev-fixtures`; a package that `dev-fixtures` depends on keeps local inputs instead (to avoid a cycle, ADR-0014 section 2).

### Package top level

1. Source lives under `src/`. Each package entry has one entry file: `src/index.ts` for a root `.` entry, `src/<entry>/index.ts` for a named entry.
2. **Feature packages** mirror their entries at the top of `src/`:

   ```
   src/
     contracts/   ./contracts: the feature's own shapes, view models, command and capability interfaces
     frontend/    ./frontend: presentation, hooks, providers, client state
     server/      ./server: loaders and backend orchestration
     testing/     ./testing: fakes and story helpers (only if needed)
   ```

   Nothing under `frontend/` or `contracts/` imports from `server/`; nothing under `contracts/` imports from `frontend/`; nothing outside `testing/` imports from `testing/`. 3.4 checks these by path.

3. **Single-runtime packages** group by module rather than runtime: `domain-records/src/spaces/`, `documents/`, `dashboards/` plus the base contract; `server-data/src/spaces/`, and so on. A package with one module puts its units directly under `src/`.
4. Inside those top-level folders, group by kind (`components/`, `hooks/`, `providers/`) only when several units of that kind exist; otherwise units sit directly in the folder.

### Naming

 1. **Domain or feature contract?** If a second feature, the server or fixtures need a shape, it belongs in domain. If only one feature's own frontend and server halves (or its host) need it, it belongs in that feature's `contracts/`. Feature contracts may use domain types but never redefine or re-export them (F3).
 2. `shared` is not a folder name: its meaning is ambiguous. Use the runtime folder (`contracts`, `frontend`, `server`) or a module name. Other grouping names (`lib`, `utils`) are allowed only when the folder's units have no better kind or module name.
 3. A Next.js-specific unit lives under the folder behind the `./next` entry, not beside framework-neutral code.

### Existing packages

 1. `frontend-ui` keeps its current layout and its structure test, including its rule that cross-folder imports use the package's own specifier (`@synapcity/frontend-ui/...`) rather than relative paths. That works there because every component folder is a public unit. New packages use relative folder imports (rule 2), because under explicit `exports` a package cannot reach its own private units through its name. `frontend-site`, `frontend-tailwind-config` and the `dev-*` packages keep their layouts. A scoped change may align them later.

## 6. Calls made by Claude (owner to check)

| #   | Call                                                                          | Why                                                                                                                  |
| --- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| C1  | Feature packages mirror their entries at the top level (rule 7).              | Makes the 3.2 rule "frontend never imports server, even by relative path" checkable from the path; retires `shared`. |
| C2  | Group by kind only when several units of that kind exist (rule 9).            | Avoids a `hooks/` folder holding one hook, while keeping the folder-per-unit look.                                   |
| C3  | Rules apply as code moves; no retroactive refactor of `apps/web` (section 2). | Keeps each migration bounded; current layout keeps working until its slice moves.                                    |
| C4  | `lib` and `utils` remain allowed with a reason, rather than banned (rule 11). | They are used widely today; banning them now would force renames without a clearly better name.                      |

## 7. Left to later parts

- **3.4:** path-based checks for rule 7, folder-import checks for rule 2 across all packages, and the existing UI structure test extended or generalized.
- **3.5:** test and Storybook configuration that discovers `*.test`, `*.dom.test` and `*.stories` files in each package.

## 8. Recording this design

On approval, 3.3 is completed by replacing the "Internal organization" section of [workspace-conventions.md](../../architecture/workspace-conventions.md) with section 5, keeping the composition rule already recorded there, and logging the decisions in the task-scope ledger.
