# ADR-0017: Breadcrumb trail ownership and composition

**Status:** Proposed
**Date:** 2026-10-29
**Deciders:** Repository owner (approval pending)

## Context

Signed-in pages tell the workspace header where they sit by rendering `SetBreadcrumbs` (`@synapcity/frontend-shells`). It stores the page's trail in `BreadcrumbRootShell` from an effect. The header, rendered by `(protected)/layout.tsx` through `AppShell`, shows that trail. The sidebar's context switcher reads the same value through `activeContext`. Because effects do not run on the server, the first HTML of every trail-bearing page shows the logo in the header, and on a Space page shows "Global" in the switcher, until hydration. Issue #99 asks whether the trail should be composed on the server instead.

The investigation ([2026-10-29 breadcrumb composition investigation](../../superpowers/specs/2026-10-29-breadcrumb-composition-investigation.md)) verified on Next.js 16.4.3 that:

- the bar's height is fixed, so the swap shifts nothing;
- client navigation already moves from one trail to the next with no empty frame;
- no resource layouts exist, and a nested layout cannot reach the header, which is a sibling of `<main>`;
- the only option that server-renders the trail without moving the header is a parallel `@header` slot. Under Next's documented slot behavior, that slot needs a mirrored route tree with its own authorization, a catch-all to avoid stale trails on soft navigation, and a second channel for `activeContext`.

ADR-0013 item 9 requires context to come from the route. ADR-0014 keeps routes and layouts in the app and `frontend-shells` free of route, auth and resource knowledge. Routing architecture remains an open candidate in the decision index; this ADR settles only the breadcrumb question within it.

## Decision

1. **The primary route's page owns the breadcrumb trail.** The `page.tsx` that the URL resolves to is the only component that renders `SetBreadcrumbs`. Resource views, contextual panel destinations, drawers, tabs and layouts never publish a trail. A test enforces this.
2. **The trail reaches the header through the existing client bridge** (`BreadcrumbRootShell` and `SetBreadcrumbs`). The header shows the logo until a page publishes. Server composition of the trail (a parallel `@header` slot, resource layouts that render trails, or a pathname-derived trail) is not adopted.
3. **`activeContext` stays derived from the same trail**, so the header and the sidebar's context switcher cannot disagree. Contextual panel and drawer state is presentation, not navigation context.

## Scope

How the breadcrumb trail is owned, carried to the header and read by the sidebar in `apps/web`'s signed-in area, including future nested Space routes and contextual resource views.

## What this does NOT decide

- The workspace header in the content column (`frontend-shells/src/testing/proposed-workspace.tsx`) or any header hierarchy change. It stays exploratory.
- Whether Space tabs are URL-addressed routes or client state.
- Routing architecture beyond the trail (the decision index candidate stays open).
- Memoizing record loaders with React `cache`, which is a separate, independent improvement.
- Any rename of `SetBreadcrumbs`, `BreadcrumbRootShell` or `RootBreadcrumb` (terminology is gated by the glossary).

## Unresolved

- Whether a `loading.tsx` fallback replacing the old page during a slow soft navigation shows the logo before the new trail. This is inferred from the code and was not reproduced. If it is confirmed and judged a problem, the fix stays inside the bridge.
- Whether the context switcher's "Global" first paint on Space pages warrants a pathname-derived `activeContext` (investigation option E2).

## Governance boundary

The repository owner approves changes to trail ownership or to the composition mechanism. `frontend-shells` owns the bridge and `HeaderBreadcrumbs`; `apps/web` owns trail content (labels, hrefs, `kind`) as route policy.

## Integration expectations

No new package, dependency, export or route. `frontend-shells` keeps importing no `next`, app, `domain-*`, `server-*` or `features-*` code. Pages keep calling `requireOwner` and loading their own records.

## Verification expectations

- A structural test in `apps/web` fails when `SetBreadcrumbs` is imported outside a route `page.tsx`.
- A server-render test in `frontend-shells` records that the first HTML shows the logo, not the trail, so a change to server composition is deliberate.
- A fixture-gated e2e step checks that client navigation from a resource to Home clears the trail.
- The existing breadcrumb unit tests, page tests and `resource-views.e2e.ts` keep passing.

## Reconsideration conditions

- A header inside the content column is adopted. The trail then becomes page content and server-renders without the bridge.
- The global header must carry route-specific server content beyond the trail, such as per-route actions.
- Measured hydration delay on target devices makes the swap noticeable, or the owner judges the first paint a product problem.
- Next.js adds a supported way for a child segment to contribute server output to an ancestor layout.
