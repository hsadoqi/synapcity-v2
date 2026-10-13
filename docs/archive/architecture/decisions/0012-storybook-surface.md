# ADR-0012: Storybook surface

**Status:** Accepted
**Amended by:** ADR-0015 (decision 4: the isolated Vitest 4.x instance)
**Date:** 2026-09-27
**Deciders:** Founder (technical direction)

## Context

The Phase 2 design (§4.3) proposes `apps/storybook` as a first-class,
independently deployable application under the "independent artifact
principle," justified by its own audience, deployment lifecycle, and
development purpose — not created for tidiness alone. The dependency
evidence in [phase-02-dependency-evidence.md](../../engineering/plans/phase-02-dependency-evidence.md)
confirms Storybook `10.6.0`, `@storybook/nextjs-vite@10.6.0`, and
`@storybook/addon-a11y@10.6.0` as current and mutually compatible with Next
16.3.6 / React 19.3.0 (ADR-0010). It also records a version conflict:
`@storybook/addon-vitest@10.6.0` requires Vitest `^3.0.0 || ^4.0.0` (verified
via `npm view @storybook/addon-vitest@10.6.0 peerDependencies`), which
excludes the repository's already-accepted Vitest `^5.0.2` (ADR-0004).

[Storybook's first-party Vitest addon documentation](https://storybook.js.org/docs/writing-tests/integrations/vitest-addon)
explicitly recommends, for "projects with existing Vitest tests," using "a
separate [test project](https://vitest.dev/guide/projects) or a [workspace
file](https://v3.vitest.dev/config/#workspace)" to isolate the addon's
Vitest configuration from a monorepo's other Vitest setup, precisely because
the addon's `test` configuration merges into whatever Vite/Vitest config it
runs under. [Vitest's own migration guidance](https://vitest.dev/guide/migration.html)
confirms `test.projects` syntax is unchanged between Vitest 4 and 5 — only
the default inheritance behavior changed (v5 defaults `extends: true` for
inline projects) — so an isolated Vitest 4.x instance is a supported,
idiomatic pattern, not a workaround. This resolves the conflict: it isolates
the older Vitest version to the one workspace that needs it rather than
regressing the repository's accepted Phase 1 baseline (ADR-0004) for every
package and app.

## Decision

1. `apps/storybook` is an independent pnpm workspace application, using
   Storybook `10.6.x` (evidence version 10.6.0) with the Vite-based Next.js
   framework integration (`@storybook/nextjs-vite`, evidence version 10.6.0).
2. `apps/storybook` owns Storybook runtime configuration, story discovery,
   global preview/decorators, shared-CSS loading, and its own independent
   static production build. It does not own shared components, component
   tests, or component stories — those remain colocated with
   `@synapcity/frontend-uiontend-uiontend-ui-core` (ADR-0011); Storybook discovers rather than owns
   them.
3. Accessibility integration uses `@storybook/addon-a11y` (evidence version
   10.6.0), configured to fail on real violations (`a11y.test = 'error'`),
   with explicit, scoped exceptions only.
4. **Storybook browser-test integration (`@storybook/addon-vitest`) is
   adopted with an isolated, workspace-scoped Vitest version.**
   `apps/storybook` declares its own `vitest` devDependency at `^4.1.11`
   (evidence: `@vitest/browser-playwright@4.1.11` peers on exactly
   `vitest@4.1.11`, which satisfies `@storybook/addon-vitest@10.6.0`'s
   `^4.0.0` range) — separate from, and without changing, the repository's
   root/other-workspace Vitest `^5.0.2` (ADR-0004, unchanged). This follows
   Storybook's first-party recommendation to isolate the addon's Vitest
   configuration in its own project/workspace file rather than merging it
   into a shared root config. Consequently, `apps/storybook`'s browser tests
   run through their own local `vitest` binary/config (e.g. a `test:storybook`
   task), not through the root's `test.projects` array — consistent with the
   design's own proposal (§9.2) that `pnpm test:storybook` is already a
   separate command from `pnpm test`. This is the resolution the founder
   confirmed; it is recorded here as adopted, not left open.
5. Storybook's first-class status does not adopt a broader UI-system
   portfolio vision as a Phase 2 deliverable (design §19); it proves only the
   surface and its ownership model for Phase 2.

## Scope

Governs `apps/storybook`'s existence, framework/version selection, ownership
boundaries, accessibility-addon adoption, and the isolated-Vitest resolution
for its browser-test integration. It does not change ADR-0004's root/other-
workspace Vitest baseline.

## What this does NOT decide

- `@synapcity/frontend-uiontend-uiontend-ui-core`'s contents (ADR-0011).
- ADR-0004's Vitest `^5.0.2` baseline for the root and every other package/app
  — unchanged; this ADR only adds an isolated, workspace-scoped Vitest `^4.1.11`
  inside `apps/storybook` itself.
- Storybook's Vercel deployment configuration (ADR-0014).
- Any broader design-system/portfolio scope beyond the Phase 2 proof.

## Unresolved

- Exact `apps/storybook` Vitest project/workspace file structure that keeps
  the isolated `test` config from merging with any shared root config —
  an implementation-time detail once the app actually exists (Slice 3/4).
- Whether to migrate `apps/storybook` off the isolated Vitest 4.x once a
  Vitest-5-compatible `@storybook/addon-vitest` ships — reconsideration
  condition below, not decided now.

## Governance boundary

Changing Storybook's framework, major version, ownership boundary, or the
isolated-Vitest resolution requires founder approval and an amending ADR.

## Integration expectations

`apps/storybook` must respect ADR-0005's dependency direction (apps import
packages, never the reverse; no app-to-app import per plan §8.4). Its
isolated `vitest` devDependency is scoped to `apps/storybook`'s own
`package.json` only and must not be hoisted into or conflated with the root
Vitest baseline (ADR-0004).

## Verification expectations

Per `docs/engineering/definition-of-done.md`. Deferred to Slice 3/4 (Stage 2
and Stage 3 acceptance criteria): Storybook starts, discovers the Button
story, static production build succeeds; the isolated Vitest 4.x instance
executes the addon-vitest browser test and the accessibility check against
at least one real story. Status: `apps/storybook` now exists and `pnpm test:storybook`
runs the browser and accessibility tests against the colocated stories; the static build
has been run locally. Hosted CI and a full `pnpm verify` run are not yet recorded here.

## Reconsideration conditions

Revisit if Storybook, `@storybook/nextjs-vite`, `@storybook/addon-a11y`, or
`@storybook/addon-vitest` ship a breaking major release before Slice 3
begins, or once a Vitest-5-compatible `@storybook/addon-vitest` release
becomes available — at that point the founder may choose to migrate
`apps/storybook` onto the shared root Vitest baseline instead of keeping the
isolated version.
