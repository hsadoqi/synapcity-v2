# ADR-0017: Breadcrumb trail ownership and composition

**Status:** Accepted
**Date:** 2026-10-29
**Deciders:** Repository owner (accepted 2026-10-29, with refinements recorded below)

## Context

Signed-in pages tell the workspace header where they sit by rendering `SetBreadcrumbs` (`@synapcity/frontend-shells`). It stores the page's trail in `BreadcrumbRootShell` from an effect. The header, rendered by `(protected)/layout.tsx` through `AppShell`, shows that trail. The sidebar's context switcher reads the same value through `activeContext`. Because effects do not run on the server, the first HTML of every trail-bearing page shows the logo in the header, and on a Space page shows "Global" in the switcher, until hydration. Issue #99 asks whether the trail should be composed on the server instead.

The investigation ([2026-10-29 breadcrumb composition investigation](../../superpowers/specs/2026-10-29-breadcrumb-composition-investigation.md)) holds the evidence. It verified on Next.js 16.4.3 that:

- the bar's height is fixed, so the swap shifts nothing;
- client navigation already moves from one trail to the next with no empty frame;
- no resource layouts exist, and a nested layout cannot reach the header, which is a sibling of `<main>`;
- the only option that server-renders the trail without moving the header is a parallel `@header` slot. Under Next's documented slot behavior, that slot needs a mirrored route tree with its own authorization, a catch-all to avoid stale trails on soft navigation, and a second channel for `activeContext`.

ADR-0013 item 9 requires context to come from the route. ADR-0014 keeps routes and layouts in the app and `frontend-shells` free of route, auth and resource knowledge. Routing architecture remains an open candidate in the decision index; this ADR settles only the breadcrumb question within it.

## Decision

1. **Invariant: the primary navigable route owns the breadcrumb trail, and each route has exactly one publisher.** The primary navigable route is the route the URL resolves to through `children`. Resource views, contextual panel destinations, drawers and client-state tabs present or participate; they do not navigate, so they never publish a trail.
2. **Convention: the route's `page.tsx` renders `SetBreadcrumbs` directly.** This is today's enforcement boundary, not the invariant. A component that the route explicitly owns and renders to publish on its behalf may replace direct publication later, provided the single-publisher rule still holds. That change updates the convention and its guardrail together.
3. **The trail reaches the header through the existing client bridge** (`BreadcrumbRootShell` and `SetBreadcrumbs`). Server-rendered composition of the trail is not adopted. This covers a parallel `@header` slot, resource layouts that render trails, and a pathname-derived trail.
4. **`activeContext` stays derived from the same trail**, so the header and the sidebar's context switcher stay consistent. Consistency is not correctness: before hydration both are empty, so a Space route first shows "Global". That is a known, deferred UX limitation (see Unresolved), not a correct state. Contextual panel and drawer state is presentation, not navigation context.

## Scope

How the breadcrumb trail is owned, carried to the header and read by the sidebar in `apps/web`'s signed-in area, under the **current global-header architecture**: one header, rendered by the shell outside `<main>`, above every route. This includes future nested Space routes and contextual resource views within that architecture.

## What this does NOT decide

- The workspace header in the content column (`frontend-shells/src/testing/proposed-workspace.tsx`), resource-layout composition of headers or trails, or route-specific server-rendered header content. Each is an open design decision. This ADR does not prejudge any of them, and any one of them reopens this ADR.
- Whether Space tabs are URL-addressed routes or client state.
- Routing architecture beyond the trail (the decision index candidate stays open).
- Memoizing the Document and Dashboard record loaders with React `cache`. They currently read each record twice per request (`generateMetadata` and the page). That is a separate performance follow-up outside #99.
- Any rename of `SetBreadcrumbs`, `BreadcrumbRootShell` or `RootBreadcrumb` (terminology is gated by the glossary).

## Unresolved

- **First paint on trail-bearing routes.** The first HTML shows the logo instead of the trail, and on Space routes the switcher shows "Global" instead of the Space, until hydration. This is accepted as a limitation of the current architecture, not as correct behavior. It stays open until a reconsideration condition below applies or the owner decides it must be fixed; a pathname-derived `activeContext` (investigation option E2) is one candidate, not a chosen remedy.
- Whether a `loading.tsx` fallback replacing the old page during a slow soft navigation shows the logo before the new trail. This is inferred from the code and was not reproduced. If it is confirmed and judged a problem, the fix stays inside the bridge.

## Governance boundary

The repository owner approves changes to the invariant or to the composition mechanism. Changing the convention in Decision 2 within the invariant (introducing a route-owned publishing component) needs only ordinary review, with the guardrail updated in the same change. `frontend-shells` owns the bridge and `HeaderBreadcrumbs`; `apps/web` owns trail content (labels, hrefs, `kind`) as route policy.

## Integration expectations

No new package, dependency, export or route. `frontend-shells` keeps importing no `next`, app, `domain-*`, `server-*` or `features-*` code. Pages keep calling `requireOwner` and loading their own records.

## Verification expectations

Implemented as a separate, later task (the investigation's section 7):

- **Ownership guardrail.** A structural test in `apps/web` fails when `SetBreadcrumbs` is imported outside a route `page.tsx` or the files the convention allows, or rendered more than once by one page. It guards the convention; it is not proof of ownership. It reads imports, so it cannot see indirect publishers or tell which page is the primary route. Review still applies.
- **Replacement and cleanup in the browser.** Fixture-gated e2e steps check that client navigation between resources replaces the trail, that navigating to a page without a trail clears it, and that opening a contextual panel destination leaves it unchanged.
- **Consistency with navigation context.** An e2e step checks that the trail and the context switcher agree after client navigation into and out of a Space.
- The existing breadcrumb, `activeContext` and sidebar unit tests, the page tests and `resource-views.e2e.ts` keep passing.
- No test asserts the logo-first server HTML. It is an accepted limitation, not a requirement.

## Reconsideration conditions

- A workspace header, or any header inside the content column, is considered.
- Resource layouts are proposed that compose their own header or trail.
- The global header is proposed to carry route-specific server-rendered content beyond the trail, such as per-route actions.
- Measured hydration delay on target devices makes the swap noticeable, or the owner decides the first-paint limitation must be fixed.
- Next.js adds a supported way for a child segment to contribute server output to an ancestor layout.
