# Milestone 3.2: public entry points and runtime separation

**Status:** Accepted by the owner on 2026-10-23 and recorded in the [workspace conventions](../../architecture/workspace-conventions.md#entry-points). Kept as the record of evidence and decisions.
**Date:** 2026-10-23
**Branch:** `chore/reorganization-m3-boundary-enforcement`
**Builds on:** [ADR-0014](../../architecture/decisions/0014-multi-app-package-boundaries.md) section 2 (dependency matrix) and the [package inventory](../../architecture/workspace-conventions.md#package-inventory) from 3.1.

## 1. Intent

A consumer can only reach what a package deliberately exposes, and importing a package's presentation can never pull in its server implementation. This part fixes the shape of every package's public interface so that 3.4 can check it mechanically and later migrations do not each invent their own.

## 2. Goals, non-goals, anti-goals

**Goals:** one entry-point pattern per kind of package; runtime guards for server code; a home for framework-specific and test-only code.

**Non-goals:** writing manifests or moving code (each package's entries are created with the package); folder layout (3.3); the checking tool (3.4); interface signatures, which are specified with their consumers during each migration.

**Anti-goals:** a root barrel that makes server code reachable from browser code; wildcards that make private files public; entry names that mislead about where code runs.

## 3. Evidence

- Existing packages export TypeScript source with no build step. Next.js 16.4.3's bundled `transpilePackages` docs confirm Turbopack transpiles workspace packages automatically (checked 2026-10-23).
- `frontend-site` already uses explicit subpaths with no root. `frontend-ui` uses wildcards: `./core/*` and `./components/*` map one folder to one public unit, while `./lib/*`, `./hooks/*`, `./utils/*` and `./types/*` expose nearly every file.
- No package uses `server-only` or `client-only` today.
- Next.js 16.4.3's bundled docs ("Preventing client-side execution of server-only code") recommend `import 'server-only'`, which Next handles internally. They also note the npm package may be installed to satisfy dependency linting.
- The registry lists `server-only@0.0.1` (last modified 2022-09-03, maintained by the React core team, no dependencies). It exports an empty module under the `react-server` condition and a throwing module otherwise (checked 2026-10-23).

## 4. Owner decisions (2026-10-23)

| #   | Decision                                                                                                                                                                                                               |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E1  | Mixed feature packages expose `./contracts` (portable types, validation, view models), `./frontend` (presentation, including Server Components) and `./server` (backend orchestration and loaders), and no root entry. |
| E2  | `server-only@0.0.1` is approved as a dependency of every package with a server entry, added when that package is created.                                                                                              |

## 5. Rules

1. **Explicit `exports` only.** A package's `exports` map is its whole public interface. Consumers never import by file path. New packages list each entry; a wildcard is allowed only where every match is a deliberate public unit (one component folder per entry, as in `frontend-ui/core/*`).
2. **Single-runtime packages** (domain, server, and frontend packages other than framework adapters) expose a root `.` entry. Add a module subpath, such as `@synapcity/domain-records/spaces`, only when consumers need a narrower interface.
3. **Mixed packages** follow E1. The names come from the ADR-0014 matrix columns. `./client` is not used: in Next it means `'use client'` code, and feature presentation also renders on the server.
4. **No cross-runtime barrels.** A `./frontend` or `./contracts` entry never re-exports from `./server`. Contracts are imported by both sides; server code is imported only by `./server` entries and app backend code.
5. **Server guard.** The file behind every server entry (`server-*` root entries and feature `./server` entries) starts with `import 'server-only'`. The guard sits in the entry file only; private files stay unreachable from other packages because rule 1 hides them, and their own tests import them without the guard. `exports` does not govern relative imports inside a package, so within a mixed package, files reached from `./frontend` or `./contracts` must never import files reached from `./server`. 3.4 checks this inside each package as well as between packages.
6. **Client boundary.** `'use client'` goes at the start of a client subtree, not on every file, following the Next.js server/client boundary guide.
7. **Framework-specific code gets a named entry,** for example `./next` for Next.js link and navigation wrappers. Root entries stay framework-neutral so other hosts can consume them.
8. **Test-only code gets a `./testing` entry** (fakes, fake capabilities, story helpers). Only tests, stories and dev hosts may import it; 3.4 rejects any production import.
9. **Types travel with their runtime entry.** There are no separate types-only entries. A type needed by both browser and server belongs in domain or in a feature's `./contracts`, never imported from a server entry.
10. **Source export stays.** Entries point to `.ts`/`.tsx` source; no package build step is introduced.

## 6. Entries by package

| Package                                                                                                                          | Entries                                                                                                                      |
| -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `domain-records`, `domain-preferences`, `domain-identity`                                                                        | `.`                                                                                                                          |
| `frontend-ui` (existing)                                                                                                         | existing entries, plus `./next` when its Next.js wrappers are isolated (see C2)                                              |
| `frontend-shells`, `frontend-collection`, `frontend-settings`, `frontend-preferences`, `frontend-auth`, `frontend-error-reports` | `.`; `./next` only if the package must ship a Next.js adapter; `./testing` where fakes are shared                            |
| `frontend-site`, `frontend-tailwind-config` (existing)                                                                           | unchanged                                                                                                                    |
| `server-auth`, `server-account`, `server-data`                                                                                   | `.` (guarded); `./testing` where fakes are shared                                                                            |
| `features-*`                                                                                                                     | `./contracts`, `./frontend`, `./server` (guarded); `./testing` where needed. A feature without server work omits `./server`. |
| `dev-*` (existing)                                                                                                               | unchanged                                                                                                                    |

## 7. Calls made by Claude (owner to check)

| #   | Call                                                                                                                                               | Why                                                                                                                                  |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| C1  | The `./testing` entry (rule 8).                                                                                                                    | Storybook and tests need shared fakes; a named entry lets 3.4 forbid production imports by path.                                     |
| C2  | `frontend-ui`'s broad wildcards (`./lib/*`, `./hooks/*`, `./utils/*`, `./types/*`) are narrowed during the migrations that touch them, not in 3.2. | Changing them now breaks current consumers in a documentation step. `./types/*` largely empties in M4 when contracts move to domain. |
| C3  | Module subpaths are added on demand, not up front (rule 2).                                                                                        | Avoids speculative interface surface; adding a subpath later does not break consumers.                                               |
| C4  | The `server-only` guard sits in the entry file only (rule 5).                                                                                      | Keeps private-module tests simple; rule 1 already makes private files unreachable.                                                   |

## 8. Left to later parts and migrations

- **3.3:** where entry files sit inside a package.
- **3.4:** checks for direct and transitive frontend-to-server reachability (between packages and between entry graphs inside one package), imports that bypass `exports`, production imports of `./testing` or dev packages, and cycles.
- **3.5:** Vitest configuration for tests that import a guarded server entry (the `react-server` resolve condition), in packages and in `apps/web`, verified against the installed Vitest version's documentation.
- **Each migration:** the package's actual `exports` map and interface signatures, checked with all its consumers.

## 9. Recording this design

On approval, 3.2 is completed by replacing the "Public interfaces and dependencies" paragraph on `exports` in [workspace-conventions.md](../../architecture/workspace-conventions.md) with sections 5 and 6, and logging the `server-only` approval in the task-scope ledger.
