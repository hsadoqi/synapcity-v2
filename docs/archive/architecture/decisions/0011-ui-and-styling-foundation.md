# ADR-0011: UI and styling foundation

**Status:** Accepted
**Date:** 2026-09-27
**Deciders:** Founder (technical direction)

## Context

The Phase 2 design (§4.1, §6) already settles the physical path
(`packages/ui/core` → `@synapcity/frontend-ui/core`) and the ownership-sensitive
runtime rule (§7.2, amending ADR-0005/ADR-0007). This ADR records the
remaining approval-sensitive technical choices the plan requires before
`@synapcity/frontend-ui/core` is created: the styling model and the shadcn/Base UI
source-acquisition mechanism. The dependency evidence in
[phase-02-dependency-evidence.md](../../engineering/plans/phase-02-dependency-evidence.md)
confirms Tailwind CSS 4.3.3 and shadcn CLI 4.21.0 as current.

**Amendment (recorded during P2-03 implementation):** the evidence originally
recorded Base UI as `@base-ui-components/react@1.0.0-rc.0`, checking
`peerDependencies`/`engines` but not the registry's `deprecated` field. That
package is npm-deprecated with the notice "Package was renamed to
`@base-ui/react`" (same repository, `mui/base-ui`), which has since reached
GA and is currently `1.8.0`. The shadcn CLI (4.21.0, already accepted below)
itself generates code importing `@base-ui/react`, not the deprecated name, so
continuing to use the already-accepted acquisition mechanism necessarily
means consuming the renamed package. This ADR is amended to record
`@base-ui/react@1.8.0` in place of the deprecated package — a currentness
correction (deprecated pre-GA → current GA successor under the same
maintainers), not a change of technical direction.

## Decision

1. `@synapcity/frontend-ui/core` (`packages/ui/core`) is the single, consolidated
   initial shared UI package. It owns reusable React/web primitives,
   intrinsic browser presentation behavior, foundational shared styling, and
   colocated component tests/stories. It does not own Next.js routing,
   application state, or product semantics (already established in the
   design §4.4; restated here for decision cohesion).
2. Styling uses Tailwind CSS `4.3.x` (evidence version 4.3.3) in its CSS-first
   model: `@theme` for utility-generating theme variables, ordinary CSS
   custom properties for runtime/semantic values that should not generate
   utilities. No legacy JavaScript `tailwind.config.*` is created by default.
   `@synapcity/frontend-ui/core` owns the shared theme/token source; each application
   owns its own build-tool Tailwind integration.
3. shadcn CLI `4.x` (evidence version 4.21.0) is adopted strictly as a
   source-acquisition and maintenance mechanism (design §6.3), not as an
   architectural package layer. `shadcn init --monorepo` must not redefine
   repository topology; its workspace/alias configuration must align with
   the already-accepted package layout. No `ui-shadcn` or equivalent package
   is created merely to represent acquisition origin.
4. Base UI (`@base-ui/react`, evidence version `1.8.0` GA — renamed from the
   now-deprecated `@base-ui-components/react`) is the shadcn primitive base.
5. Exactly one representative primitive (Button) is added inside
   `@synapcity/frontend-ui/core` to prove the acquisition → package → export → styling
   → consumption path. No component catalog begins in Phase 2.

## Scope

Governs the shared UI package's styling model and source-acquisition
mechanism, and the specific version/pre-release acceptance for Tailwind,
shadcn CLI, and Base UI. It does not create the package, Button, or any file
— that is Slice 3 implementation.

## What this does NOT decide

- Storybook (ADR-0012).
- Any future UI layering, `ui-core` → `ui-shadcn` → `ui-components`
  hierarchy, or additional primitives beyond Button (explicitly rejected by
  the design §6.3 and restated here).
- A design-token/style package extraction (deferred per design §6.2).
- Component style/base-color/icon-library specifics inside `components.json`
  — an implementation-time detail once the CLI is actually run.

## Unresolved

- Exact Tailwind token vocabulary and file names (design §6.2 — intentionally
  not mandated by this ADR).

The semantic primary source slots are the narrow exception recorded by the
current implementation: `--shadcn-primary` and
`--shadcn-primary-foreground` map to Tailwind's `--color-primary` and
`--color-primary-foreground`, preserving the `bg-primary` and
`text-primary-foreground` utility names while keeping the `--primary-50` through
`--primary-950` ramp separate. This does not settle the broader token vocabulary.

## Governance boundary

Changing the styling model, the shadcn-as-acquisition rule, or the Base UI
package/version requires founder approval and an amending ADR.

## Integration expectations

`@synapcity/frontend-ui/core` must respect ADR-0005's `ui` category dependency
direction (may import `shared`; must not import `domain`; must not import
Next.js). Cross-workspace consumers use only the package's declared
`exports` (ADR-0005 public-API rule).

## Verification expectations

Per `docs/engineering/definition-of-done.md`. Deferred to Slice 3 (Stage 2
acceptance criteria, plan §6): package builds/typechecks, imports no
application code, no Next.js imports exist in `ui-core`. Not yet verified —
no package exists.

## Reconsideration conditions

Revisit if Tailwind, shadcn, or Base UI ship a breaking major release before
Slice 3 begins, or if the single-package model proves too narrow once a
second real UI consumer appears.
