# ADR-0015: Storybook runs on the shared Vitest baseline

**Status:** Accepted
**Date:** 2026-10-03
**Deciders:** Founder (technical direction)
**Amends:** ADR-0012 (decision 4, the isolated Vitest 4.x instance)

## Context

ADR-0012 isolated `apps/storybook` on its own Vitest `4.1.11` because
`@storybook/addon-vitest@10.6.0` declared a peer range of
`^3.0.0 || ^4.0.0`, which excluded the repository's Vitest `^5.0.2`
(ADR-0004). Its own reconsideration condition named the trigger for revisiting
that choice: a Vitest-5-compatible `@storybook/addon-vitest` release.

That condition is met. The installed `@storybook/addon-vitest@10.6.1`
declares `vitest: ^3.0.0 || ^4.0.0 || ^5.0.0`,
`@vitest/browser: ^3.0.0 || ^4.0.0 || ^5.0.0` and
`@vitest/browser-playwright: ^4.0.0 || ^5.0.0` (verified with
`npm view @storybook/addon-vitest@10.6.1 peerDependencies`). The
`@vitest/browser` and `@vitest/browser-playwright` `5.0.2` releases peer on
exactly `vitest@5.0.2` and carry no deprecation notice
(`npm view <package>@5.0.2 peerDependencies deprecated`). The repository's
lockfile already resolved Vitest to `5.0.2`.

## Decision

1. `apps/storybook` moves from its isolated Vitest `4.1.11` to Vitest
   `5.0.2`, with `@vitest/browser` and `@vitest/browser-playwright` pinned to
   the same `5.0.2`. This is the version the rest of the repository already
   resolves, so the lockfile holds a single Vitest. It is not an upgrade to
   the latest release (`5.0.3`); that remains a separately scoped change.
2. The Storybook Vitest configuration stays in its own file
   (`apps/storybook/vitest.config.ts`) with its own `storybook` project. The
   addon merges its `test` configuration into whatever Vitest config it runs
   under, and Storybook's guidance to keep it in a separate project or
   workspace file still applies. What changes is the Vitest version, not the
   configuration boundary.
3. ADR-0004's Vitest baseline is unchanged.

## What this does NOT decide

- Any Vitest upgrade beyond `5.0.2`.
- Storybook's framework, major version or ownership boundary (ADR-0012).
- Whether the Storybook Vitest configuration should be merged into the root
  `vitest.config.ts`. It stays separate.

## Verification

On Vitest `5.0.2`: the ui-core suite passed (22 files, 401 tests) using a
temporary copy of the root Vitest configuration, because uncommitted edits in
the working tree's `vitest.config.ts` were breaking the ui-core project
independently of this change; the Storybook browser suite was run in full and
its failing files were re-run in isolation. The exact results are recorded in
the pull request that introduces this change. Hosted CI has not been run.

## Reconsideration conditions

Revisit if `@storybook/addon-vitest` or Vitest ships a breaking major release.
