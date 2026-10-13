# ADR-0010: Application runtime

**Status:** Accepted
**Date:** 2026-09-27
**Deciders:** Founder (technical direction)

## Context

The Phase 2 implementation plan (§5.1) and design (§7.1) propose Next.js App
Router with React as the Phase 2 application-runtime direction, subject to
explicit approval and current-version verification before any dependency is
installed. No web framework is currently declared anywhere in the repository.
The dependency evidence in [phase-02-dependency-evidence.md](../../engineering/plans/phase-02-dependency-evidence.md)
confirms Next.js 16.3.6 and React 19.3.0 are current stable releases, satisfy
the repository's Node `>=24.20.0 <25` pin, and are mutually compatible
(Next 16.3.6's `peerDependencies` accept React `^19.0.0`).

## Decision

1. `apps/web` is the Next.js App Router application, Next.js `16.3.x` (evidence
   version 16.3.6), React `19.3.x` (evidence version 19.3.0).
2. Layouts and pages remain Server Components by default. A client boundary
   (`'use client'`) is introduced only where state, effects, event handling,
   browser APIs, or client hooks require it, placed at the narrowest reusable
   entry point.
3. Providers are introduced only for a demonstrated requirement, placed as
   deep in the tree as practical.
4. `apps/web` owns Next.js APIs, routing, request/cookie/environment
   integration, and application composition. `@synapcity/frontend-uiontend-ui-core` may use
   React, React DOM, and browser-intrinsic behavior for reusable components,
   including a narrow `'use client'` boundary, but must not depend on Next.js
   (ADR-0005, ADR-0007, ADR-0008 already establish this ownership split; this
   ADR does not change it).
5. Version/reconsideration policy: this ADR records the generation (Next 16 /
   React 19.3) that governs Phase 2. A later patch release within the same
   generation does not require reopening this ADR; a major-version change
   does.

## Scope

Governs the application framework selection, its version generation, and the
server/client composition rule for `apps/web` specifically. It does not modify
the existing ownership-sensitive runtime rule already accepted in ADR-0005/
ADR-0007/ADR-0008.

## What this does NOT decide

- Application shell, navigation, sidebars, dashboard routes, or any product
  route (explicit Phase 2 non-goal).
- `@synapcity/frontend-uiontend-ui-core`'s contents, Tailwind, shadcn, or Storybook (ADR-0011,
  ADR-0012).
- Task orchestration or verification composition (ADR-0013).
- Deployment topology (ADR-0014).
- Any API route beyond what the framework bootstrap technically requires.

## Unresolved

- Exact TypeScript/ESLint configuration profile for `apps/web` (plan §5.5–5.6)
  — an implementation-time detail, not a version-sensitive decision.
- Whether a future React Compiler / `babel-plugin-react-compiler` integration
  (a declared Next.js peer) is adopted — not proposed for Phase 2.

## Governance boundary

Changing the framework, its major version, or the server/client ownership
rule requires founder approval and a new or amending ADR, per `AGENTS.md` §5.

## Integration expectations

`apps/web` is created starting Slice 2. It must respect ADR-0005's
dependency-direction rules (no package imports from `apps/web`; nothing
imports from an app).

## Verification expectations

Per `docs/engineering/definition-of-done.md`. Deferred to Slice 2 (Stage 1
acceptance criteria in the implementation plan §5): `apps/web` starts locally,
production build succeeds, TypeScript checks real app source, ESLint checks
real TSX, Turbo discovers the workspace. Not yet verified — no scaffolding
exists.

## Reconsideration conditions

Revisit if Next.js or React ship a breaking major release before Slice 2
implementation begins, if the dependency evidence's Node-compatibility
assumption proves wrong in practice, or if Phase 3 application-shell
requirements demonstrate the server/client boundary needs to move.
