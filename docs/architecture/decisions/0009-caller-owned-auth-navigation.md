# ADR-0009: Caller-owned auth navigation

**Status:** Accepted  
**Date:** 2026-10-13 (accepted 2026-10-14)  
**Deciders:** Hanaa Sadoqi (repository owner); accepted by the owner's direct instruction to proceed on recommendations.

## Context

`packages/frontend/ui/src/components/auth-buttons.tsx` embeds `/auth/login` and `/auth/register`. The component is reusable presentation, but those destinations are web-application policy. [Workspace conventions](../workspace-conventions.md) keeps app capabilities in the app and requires packages to receive them from consumers.

This is an independently reviewable shared-component API change. It does not require adopting a services or feature package.

## Decision

If accepted, `AuthButtons` requires `signInHref: string` and `signUpHref: string`, supplied by its consumer. It renders those destinations through the existing LinkButton implementation and retains current variants, labels and layout behavior.

No default app paths remain in the shared component. `apps/web` supplies the same current URLs, so the app's observable navigation does not change. Stories use example paths and tests assert custom paths rather than assume Synapcity's routes.

## Scope

Destination ownership for the existing shared AuthButtons component and all its actual consumers. See the [navigation task plan](../../superpowers/plans/2026-10-13-auth-refactor-navigation.md).

## What this does NOT decide

New URLs, a route registry, redirect policy, link-renderer redesign, additional auth methods, a new package, component renaming or removal, persisted identifiers, or public registry publication. Shared UI does not gain provider/session logic.

## Unresolved

Whether future auth presentation needs a caller-supplied link-rendering capability is deferred. The current LinkButton behavior remains in place; this ADR does not prescribe changes for hypothetical frameworks.

## Governance boundary

The owner must approve the required-prop API change explicitly. Update every consumer in the same scoped change. This proposal does not change accepted auth or package topology decisions.

## Integration expectations

Preserve labels, accessible names, theme styling and header/hero variants. Update app AuthStatus, component tests/stories and the root-header story. Re-inventory consumers before execution. Do not introduce Supabase or app imports into the UI package.

## Verification expectations

Tests show caller-provided destinations are rendered in both variants. Type checking catches omitted required props. Storybook/a11y checks and manual app navigation cover their respective behavior; a story does not verify an app route. [The parent plan](../../superpowers/plans/2026-10-13-auth-refactor.md) owns final whole-change verification.

## Reconsideration conditions

A real consumer needs different labels/navigation composition, current LinkButton capabilities are inadequate, or an adopted route contract changes. Assess each separately; caller-supplied hrefs alone do not solve every future navigation requirement.

## Implementation

Implemented 2026-10-14 on `refactor/auth-actions`. Two points go beyond the decision text above; both follow its principle that shared components receive app routes from their consumer:

- `AuthButtons` also took over the `/auth` path prefix it used to hard-code to decide when the header links go quiet. It is now an optional `quietPathPrefix`; omitting it keeps "Sign up" always filled. `apps/web` passes `/auth`, so observable behavior is unchanged.
- The same ownership rule was applied to the signed-in shell. `RootShell`, `RootHeader`, `SidebarShell`, `RootSidebar` and `UserMenu` no longer build `/${userId}/home` or `/${userId}/settings` from an id. They take `account` (`AccountLinks`: `homeHref`, `settingsHref`), which `apps/web` builds with `accountLinksFor` from the existing `homePathFor`/`settingsPathFor`, so the single-segment encoding in `home-path` stays the only place that builds those paths. `UserMenu` replaced its `id` prop with the two links.

Verified: format, lint, type-check, Knip, brand check, unit tests, Storybook story tests and build. Not run for this change: the Playwright end-to-end test and coverage. A story does not verify an app route; the app's navigation was not exercised in a browser.
