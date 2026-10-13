# ADR-0005: Package categories and dependency direction

**Status:** Accepted
**Amended by:** ADR-0007, ADR-0008
**Date:** 2026-09-26
**Deciders:** Founder (technical direction)

## Context

P1-03 (`hsadoqi/synapcity#4`) requires the minimum architectural structure that defines ownership, dependency direction, and package boundaries without designing the whole product. ADR-0003 fixed a single private root package with no workspace. Architecture principles §6 requires boundaries to follow demonstrated dependency and change boundaries rather than a pre-drawn package diagram, and `docs/product/mvp.md` forbids a topology that presumes a first product slice. The founder proposed four category folders under `packages/`, holding packages, kept for organization and clear boundaries. Folders alone do not commit any package to existing.

## Decision

1. **Four categories** live under `packages/`, each as a folder that holds packages (`packages/<category>/<name>`):
   - `dev`: configures how the repository is built, checked, tested, and developed. Development-time only. (Renamed from `foundation` during the Phase 2 architecture reconciliation; the category's semantics are unchanged.)
   - `shared`: primitives whose ownership genuinely spans multiple domains. Requires at least two real consumers.
   - `domain`: the product model, one package per business capability, each the single owner of its information and rules.
   - `ui`: the presentation system.
2. **The category folders exist, each with only a README** stating its ownership rule and dependency direction. **No package is created** until a real use case needs one, following [the package creation checklist](../package-creation-checklist.md).
3. **Dependency direction** (a package may import only from categories listed):
   - `dev`: imports nothing from the other categories.
   - `shared`: imports nothing from `domain` or `ui`.
   - `domain`: may import `shared`. Must not import `ui`, framework or DOM APIs, or editor and layout library bindings (principles §6; ADR-0001).
   - `ui`: may import `shared`. Must not import `domain`. May use React and other web-platform presentation capabilities intrinsic to reusable components, but must not depend on Next.js or other application-runtime concerns (ADR-0007, ADR-0008). Presentational components take plain props, and something above `ui` maps domain data into those props (see Unresolved).
   - Circular dependencies are not allowed at any level.

   An arrow means "may import". `dev` is development-time only, so nothing imports it at runtime, and no `apps/` folder exists yet.

   ```mermaid
   flowchart TD
     apps["apps/<br/>(composition roots, not created yet)"]
     ui["ui"]
     domain["domain"]
     shared["shared"]
     dev["dev<br/>(dev-time only)"]

     apps --> ui
     apps --> domain
     apps --> shared
     ui --> shared
     domain --> shared
   ```

   Each category owns its own presentation or information, and none holds a divergent copy of what another owns (architecture principles §2 and §3):

   ```mermaid
   flowchart LR
     owner["domain package<br/>single owner of the information"]
     api["public exports"]
     rep["ui representation<br/>owns layout, filters, view state only"]
     copy["divergent copy of the information"]

     owner --> api --> rep
     rep -. "not allowed" .-> copy
   ```

4. **Public API:** cross-package imports use only a package's public exports, declared in its `package.json` `exports` map. One or several entry points are allowed. Deep imports into a package's internals are not.
5. **`apps/`:** no `apps/` folder is created yet. When one is needed, it holds deployable composition roots that wire concrete implementations together. Apps import packages, never the reverse, and nothing imports from an app.
6. **Development-tool configs stay at the repository root** (ESLint, TypeScript, Prettier, Vitest) until a second package needs to extend them, and then move into `dev` packages.
7. **The four category names are implementation vocabulary**, not product vocabulary (`docs/glossary.md`). They carry no domain authority.
8. **Enforcement:** dependency-cruiser (`.dependency-cruiser.cjs`, run as `pnpm deps:boundaries` and part of `pnpm verify`) enforces these rules by machine: no cycles; no unresolved imports (which covers deep imports outside a package's `exports`); no relative cross-package imports; the four category direction rules; and no imports from `apps/`. See Verification expectations for what is and is not proven.
9. **The workspace glob** `packages/*/*` is added to `pnpm-workspace.yaml` together with the first real package (ADR-0003).

## Scope

This decision governs the category structure, dependency direction, the public-API rule, and the rule for creating packages. It does not create packages or name any capability.

## What this does NOT decide

- Any package name, capability name, or package scope. Domain naming follows the glossary naming-decision process, and the scope is deferred (ADR-0003).
- Additional categories for runtime/orchestration, platform adapters, external effects, or services. They are added by a separate decision when a package needs one.
- The application framework, the first product slice, and client/server boundaries. Those wait for a framework decision and remain stop conditions.
- Storage, API, routing, state management, authentication, or persisted schemas.

## Unresolved

- Where domain-aware presentation lives (for example a Document header or an editor integration that needs Document knowledge). Because `ui` may not import `domain`, it needs a home that may import both, such as a later `features`-style category. That is a separate ADR, decided when the first real case arises. Until then, nothing domain-aware is built in `ui`.
- Rules that are documented but **not machine-enforced**: `shared` needs two real consumers; a package's `exports` actually contain only its intended public API; the DOM and framework APIs a domain package may use beyond the named libraries (ADR-0008 enforces the named ones); and the checklist itself.
- Whether and when a runtime, adapter, or composition category is needed.
- The glossary entry recording the four labels as implementation vocabulary (pending acceptance of this ADR).

## Governance boundary

Adding, removing, or renaming a category, or changing the dependency direction, requires founder approval and a new or updated ADR. Creating an individual package follows the checklist and its own review.

## Integration expectations

- Package creation must respect architecture principles §1 to §3 (ownership, no silent second owner, UI hierarchy is not ownership).
- P1-04 (`hsadoqi/synapcity#5`) is expected to run the enforcement in CI once it exists.
- The first vertical slice may add the first package and the workspace glob.

## Verification expectations

Per `docs/engineering/definition-of-done.md`.

- **Proven (self-consistent checks):** `tests/boundaries.test.ts` runs the rules against fixtures. Every rule fires on a deliberate violation, a clean fixture reports nothing, and disabling a rule makes the test fail. These prove the rules fire, not that the rules match the architecture.
- **Verified once by hand, not automated:** in a scratch two-package pnpm workspace, an import by package name resolved to the real package path (so direction rules apply to it), and a deep import outside the `exports` map was reported as unresolved. The automated fixtures use relative imports and do not exercise name-based resolution or `exports`.
- **Not verified at Phase 1 closeout:** the repository then had no packages, so `pnpm deps:boundaries` cruised 0 modules and passed trivially.

## Current verification amendment — 2026-09-27

The verification statements above describe the Phase 1 acceptance state and are retained as historical evidence. Phase 2 has since added `apps/web`, `apps/storybook`, and `packages/ui/core`. The live `pnpm deps:boundaries` gate now cruises real authored modules and dependencies in addition to the self-consistent negative fixtures. Name-based deep-import behavior is still supported by the earlier manual probe rather than a durable export-map fixture, so that limitation remains explicit.

## Reconsideration conditions

Revisit if the first real packages show a category is missing or wrong, if a boundary generates repeated workarounds, or if the first vertical slice needs a different structure. Any change must be a new ADR.
