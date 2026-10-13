# ADR-0007: Workspace conventions and testing strategy

**Status:** Accepted
**Date:** 2026-09-26
**Deciders:** Founder (technical direction)
**Amends:** ADR-0003 (workspace timing), ADR-0004 (build and component testing), ADR-0005 (workspace glob timing)

## Context

P1-01 (`hsadoqi/synapcity#2`), P1-02 (`hsadoqi/synapcity#3`), and P1-03 (`hsadoqi/synapcity#4`) each left items deferred that did not depend on any product decision: the workspace file, naming conventions, a real `build`, the component-testing strategy, and a client/server rule. Deferring them made the earlier issues impossible to finish. They are infrastructure conventions, not product decisions, so they are decided here. The founder chose the `@synapcity` scope.

## Decision

1. **Workspace:** `pnpm-workspace.yaml` exists now with the globs `apps/*` and `packages/*/*`. It is harmless while empty. This replaces the earlier plan to add it with the first package.
2. **Naming:** a package is named `@synapcity/<category>-<name>` (lowercase kebab-case, matching `packages/<category>/<name>`, unique across categories; the leaf directory does not repeat the category). An app is named `@synapcity/<name>` (lowercase kebab-case, matching `apps/<name>`), unchanged unless a separate accepted decision governs it. (Package naming amended during the Phase 2 architecture reconciliation: it previously read `@synapcity/<name>` for both packages and apps.)
3. **Layout:** `packages/<category>/<name>` and `apps/<name>`, each with a `package.json`, `tsconfig.json` extending the root, a README starting with `Owns:`, and `src/` with colocated tests.
4. **Build:** every package defines `build`, currently a type check, and the root `pnpm build` runs `pnpm -r --if-present build`. This replaces the placeholder notice.
5. **Client and server, by ownership:** server-only code (Node APIs, request/response handling, secrets, application routing and composition) lives only in apps. `domain` packages remain portable and runtime-neutral: no React, React DOM, browser/DOM APIs, Next.js, application routing, or application-runtime integration. `ui` packages are application-runtime agnostic but may use React, React DOM, JSX, and DOM/browser/web-platform capabilities intrinsic to reusable presentation, including a narrow `"use client"` boundary where that behavior requires it; they must not acquire Next.js routing, request APIs, Server Actions, app-specific environment integration, or imports from application workspaces. A package that needs an application-runtime-specific capability beyond this still receives it through an interface implemented in an app. (Amended during the Phase 2 architecture reconciliation, replacing a blanket "packages are runtime-agnostic" rule with this ownership-sensitive model; see ADR-0005 and ADR-0008 for the corresponding enforcement.)
6. **Testing strategy:** Vitest for unit tests. Vitest with Testing Library in a DOM environment for component tests. Axe inside component tests plus a JSX accessibility lint rule for accessibility. Playwright when a runnable app exists. These dependencies arrive with the first component that needs them.
7. **Ownership:** each package declares what it owns in its README at creation, checked by the package creation checklist.

Details and a package skeleton are in [workspace-conventions.md](../workspace-conventions.md).

## Scope

Governs workspace configuration, naming, layout, the `build` convention, the client and server rule, and the testing strategy.

## What this does NOT decide

- The application framework, first product slice, capability names, or any package's contents.
- A bundler or a real production build.
- Which specific accessibility, Testing Library, or DOM-environment packages to install. Those are chosen against current documentation with the first component.
- Storage, API, routing, state management, or authentication.

## Unresolved

- The app framework, which will refine the client and server rule inside apps but does not change it for packages.
- The bundler and the meaning of a production `build`.

## Governance boundary

Changing the scope, layout, or the client and server rule needs founder approval and a new ADR. Adding the testing dependencies needs approval as new dependencies (`AGENTS.md` §5).

## Integration expectations

CI and the pre-push hook already run `pnpm verify`, which now includes each package's `build`. Boundary rules (ADR-0005) apply to every package created under these conventions.

## Verification expectations

Per `docs/engineering/definition-of-done.md`. At Phase 1 acceptance, temporary probe packages showed that the full `pnpm verify` handled them, name-based cross-package imports were judged correctly by the boundary rules, and a deep import outside `exports` was reported. The probes were then removed; at that time the repository had no real packages and `pnpm build` ran nothing.

## Current-state amendments — 2026-09-27

The sections above record the Phase 1 decision and verification state. The following later accepted decisions and founder-approved audit correction govern where they differ:

- ADR-0010 resolves the application-framework question for `apps/web` as Next.js 16.3.x. ADR-0011 and ADR-0012 establish the reusable UI and Storybook build surfaces. These decisions do not alter the package ownership rule.
- The repository now has two real apps and one real reusable package. Their type checks, builds, component tests, Storybook browser/accessibility tests, and application smoke test run through the canonical root verification contract under ADR-0013.
- The evaluated current `eslint-plugin-jsx-a11y` release does not support the repository's accepted ESLint major. The static JSX lint layer is therefore deferred rather than installed with an invalid peer range. Current accepted accessibility evidence is axe in component tests, Storybook's real-browser accessibility addon, proportional manual review, and Playwright application smoke coverage. The compatibility evidence lives in `docs/engineering/plans/phase-02-dependency-evidence.md`.
- A fresh checkout must run the documented `pnpm browsers:install` bootstrap command after dependency installation and before `pnpm verify`. CI invokes the same script with Linux system dependencies.

## Reconsideration conditions

Revisit if the first real packages show the layout or naming is awkward, if a framework requires a different workspace shape, or if the testing strategy proves wrong for the chosen UI stack.
