# Breadcrumb composition: server rendering or the effect bridge (issue #99)

**Status:** Research / evidence, with a recommendation awaiting the owner's decision. The decision itself is drafted as Proposed [ADR-0017](../../architecture/decisions/0017-breadcrumb-trail-ownership.md). Nothing here is implemented, and nothing here changes a route, layout, component or public API.
**Date:** 2026-10-29
**Issue:** [#99 Investigate SSR-compatible breadcrumb composition](https://github.com/hsadoqi/synapcity-v2/issues/99)
**Governing:**

- [ADR-0013](../../architecture/decisions/0013-document-and-dashboard-persistence.md) item 9 (one item, two routes; context comes from the route, never from a stored parent);
- [ADR-0014](../../architecture/decisions/0014-multi-app-package-boundaries.md) (routes and layouts stay in the app; `frontend-shells` knows no route, auth or resource meaning);
- [ADR-0011 (resizable global panel)](../../architecture/decisions/0011-resizable-global-panel-shell.md) and its contextual panel amendment;
- the [protected-route plan](../plans/2026-10-29-protected-route-architecture.md) (per-page `requireOwner`; layouts are not an authorization boundary);
- the [decision index](../../architecture/decisions/README.md) candidate "Persistence, API, routing and state management", which keeps routing architecture open;
- `.agents/task-scope.md`, entry "shared shell composition audit and refactor" (2026-10-29), which documented `SetBreadcrumbs` as single-owner and deferred this question to #99.

**Versions checked:** Next.js 16.4.3 and React 19.3.1 (`apps/web/package.json`, installed from the lockfile). Next.js behavior below is quoted from the docs bundled in that installed package (`next/dist/docs`), not from memory.

## 1. Problem and observed behavior

Pages publish their trail with `SetBreadcrumbs`, which stores it in an effect. The header sits above the page, so on a full page load the server HTML has no trail and the header shows the logo until hydration; then the trail replaces it. The issue asks whether server-rendering the trail is worth changing route, layout or ownership structure.

### Verified on this branch (HEAD `a98c8283`)

Method: a fixture-mode dev server (`SYNAPCITY_DEV_AUTH=fixture`, CI's placeholder Supabase values, port 48731), the raw server HTML fetched with `curl` (no JavaScript run), then the same routes driven in Chromium through Playwright with a `MutationObserver` recording every header state.

| Route (fixture user)                                | Server HTML header                      | Server HTML sidebar switcher                        |
| --------------------------------------------------- | --------------------------------------- | --------------------------------------------------- |
| `/home/documents/fixture-document-launch-plan`      | Logo; no `nav[aria-label="Breadcrumb"]` | Global                                              |
| `/home/dashboards/fixture-dashboard-project-status` | Logo; no trail                          | Global                                              |
| `/home/documents`, `/home/spaces`                   | Logo; no trail                          | Global                                              |
| `/home/spaces/fixture-space-writing`                | Logo; no trail                          | **Global, with the globe icon** (should be Writing) |

1. **The issue's observation still holds.** Every route that publishes a trail sends the logo in its first HTML. After hydration the trail appears.
2. **A second symptom the issue does not name.** The sidebar's context switcher reads the same trail through `activeContext`, so on a Space page the first HTML says "Global" with the globe icon, then switches to the Space after hydration.
3. **No layout shift from the swap.** The header bar is a fixed `h-16` ([root-header.tsx](../../../packages/frontend/shells/src/components/root-shell/root-header/root-header.tsx)); the logo and the trail both sit at the start of a `justify-between` row, and the actions stay at its end. The header's space is already reserved. What the user sees is a content swap inside a stable bar (logo, then trail), not movement of the page.
4. **Client navigation is already correct.** Space to Documents index, Documents index to a Document, and Document to Home each went straight from the old header state to the new one, with no logo or empty frame recorded in between. With every RSC response delayed by 1.5 s, the header kept the previous page's trail while the previous page stayed on screen (about 5.4 s), then switched directly to the new trail. Header and content agreed throughout.
5. **Not reproduced:** a `loading.tsx` fallback replacing the old page during a soft navigation. If it did, the old `SetBreadcrumbs` would unmount, its cleanup would clear the trail and the logo would show until the new page commits. This is inferred from the code, not observed; prefetching (and the delayed prefetch in the test) kept the old page mounted.

## 2. Current architecture and ownership

### Data flow (verified in code)

```text
(protected)/layout.tsx  [server]   requireSignedIn, getCurrentUser, getSidebarRecords
  └─ AppShell           [client]   usePathname(); sidebar = (trail) => appSidebar(userId, trail, pathname, …)
       └─ BreadcrumbRootShell [client]  useState(trail = [])
            ├─ RootShell → AuthenticatedShell → SidebarShell
            │     ├─ header: RootHeader(breadcrumbs = trail)   ← logo when trail is empty
            │     ├─ sidebar: appSidebar(…, trail, …)          ← activeContext(trail)
            │     └─ GlobalPanelShell(header) → <main>{children}</main>
            └─ children: [userId]/layout → home/layout → …/page.tsx [server]
                   page loads its record, then renders <SetBreadcrumbs items=[…]/> [client]
                   useEffect → setTrail(items); cleanup → setTrail([])
```

| Question from the brief                       | Answer                                                                                                                                                                                                                                                                                                                                                                                 | Evidence                                                                                                                                                                                                                                                               |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Where breadcrumb data originates           | In each route **page**, from its params and the record it has already loaded (`getSpace`, `getDocument`, `getDashboard`), plus app route policy (`COLLECTION_LABELS`, `*PathFor`).                                                                                                                                                                                                     | The six `page.tsx` files under `(protected)/[userId]/home/{spaces,documents,dashboards}/{(index),[id]}`                                                                                                                                                                |
| 2. Who owns the active trail                  | The page that renders `SetBreadcrumbs`; the shell only keeps the last value. One owner at a time is a documented contract, not an enforced one.                                                                                                                                                                                                                                        | [breadcrumb-trail.tsx:46-55](../../../packages/frontend/shells/src/components/breadcrumb-trail/breadcrumb-trail.tsx)                                                                                                                                                   |
| 3. How it reaches the header                  | Context setter, `useEffect`, state in `BreadcrumbRootShell`, props to `RootShell`, `RootHeader`, `HeaderBreadcrumbs`.                                                                                                                                                                                                                                                                  | breadcrumb-trail.tsx:21-66; [root-header.tsx:44](../../../packages/frontend/shells/src/components/root-shell/root-header/root-header.tsx)                                                                                                                              |
| 4. Known during server rendering              | Everything the page needs: params, record names, hrefs. The pathname is also known to client components during SSR (`usePathname` in `AppShell`). The header itself renders with an empty trail.                                                                                                                                                                                       | Pages await their record before returning; verified HTML above                                                                                                                                                                                                         |
| 5. Known only after hydration                 | The trail in the shell's state, and so the header trail and `activeContext`.                                                                                                                                                                                                                                                                                                           | `useEffect` does not run on the server                                                                                                                                                                                                                                 |
| 6. Can layout-level loading reuse server data | Not today. `getDocument` and `getDashboard` are plain functions, not wrapped in React `cache`, so a second caller fetches again. They are already called twice per request on record pages (`generateMetadata` and the page). The repository's memoization pattern exists in [session.ts](../../../apps/web/src/features/auth/server/session/session.ts) and `account-preferences.ts`. | [get-documents.ts](../../../apps/web/src/features/documents/server/get-documents/get-documents.ts), [get-dashboards.ts](../../../apps/web/src/features/dashboards/server/get-dashboards/get-dashboards.ts), [records.ts](../../../apps/web/src/lib/records/records.ts) |
| 7. Client navigation                          | Correct and flash-free in the observed cases (section 1, item 4).                                                                                                                                                                                                                                                                                                                      | Browser run                                                                                                                                                                                                                                                            |
| 8. Competing publishers                       | None today: `SetBreadcrumbs` is rendered only by the six route pages. `DocumentView` and `DashboardView` (the views a contextual panel would reuse) render none. Nothing enforces this.                                                                                                                                                                                                | `grep -rn "<SetBreadcrumbs" apps/web/src`                                                                                                                                                                                                                              |
| 9. A less invasive solution already present   | Yes: the bar already reserves its height (no shift), and soft navigation is already correct. The only gap is the first paint after a full load.                                                                                                                                                                                                                                        | Sections 1 and 2                                                                                                                                                                                                                                                       |

### Facts that correct the issue's premises

- **There are no resource layouts.** No `layout.tsx` exists under `spaces/[spaceId]`, `documents/[documentId]` or `dashboards/[dashboardId]`. Option B would create them.
- **A resource layout would still sit below the header.** The header is passed to `GlobalPanelShell` as a sibling of `<main>` ([sidebar-shell.tsx:77](../../../packages/frontend/shells/src/components/sidebar-shell/sidebar-shell.tsx)), and the shell is rendered by `(protected)/layout.tsx`. Anything a nested layout renders arrives as `children`, inside `<main>`. A nested layout therefore cannot put server HTML into the header on its own. It needs either a parallel slot on the shell's layout (option C) or a header that moves out of the shell into the content column (the unapproved workspace header, section 6).
- **Layouts are not where the trail can be computed once.** A layout receives only its own and its parents' params, does not re-render on navigation between its children (Partial Rendering, quoted in the protected-route plan from Next's authentication guide), and is not an authorization boundary. Each page already runs `requireOwner` and loads its record; moving the trail up duplicates that work.

### `activeContext` and navigation state

`activeContext(trail)` returns the trail's `kind: 'space'` crumb ([active-context.ts:10](../../../packages/frontend/shells/src/components/breadcrumb-trail/active-context.ts)). `contextSwitcher` in [app-sidebar.tsx:54-58](../../../apps/web/src/components/app-sidebar/app-sidebar.tsx) then confirms the match against `pathname` and the latest Spaces to pick the option and its icon. The trail and the sidebar cannot disagree because they are one value. This follows ADR-0013 item 9: context comes from the route (the page knows which route it is), never from a stored parent.

## 3. Alternatives

### A. Keep the effect bridge (with or without a different pre-hydration fallback)

The page owns the trail and publishes it after hydration. The question the issue raises, reserving the header's space so nothing shifts, is already answered: the bar's height is fixed and nothing moves. The one variant worth weighing is what the bar shows before hydration on a page that will publish a trail: the logo (today), or nothing (a blank `flex-1` region, so the swap reads as content arriving rather than one thing becoming another). Showing nothing would need the server to know a trail is coming, which is again route knowledge, or a blank on every page including Home, whose permanent state is the logo. The logo is the better pre-hydration state: it is a correct, working link home, and Home and Settings show it permanently.

### B. Resource layouts that resolve their own trail

New `layout.tsx` files in `[spaceId]`, `[documentId]` and `[dashboardId]` load the record (through a `cache`-wrapped loader) and build the trail. Alone, this does not reach the header (section 2). Its outputs are only useful combined with C, or with a workspace header inside the content column. It also moves trail ownership from the page to the layout. That conflicts with how pages already verify access and handle `notFound()`, and the record layout would persist while a child route changes beneath it (for example a future `documents/[documentId]/history`), so a child-specific crumb still needs a page-level publisher.

### C. A parallel `@header` slot on `(protected)/layout.tsx`

`(protected)/@header/…` mirrors the page tree; each slot page loads its record (through `cache`), checks access, and returns `<HeaderBreadcrumbs>` server-rendered. The layout passes the slot to `AppShell`, which passes it to the header. This is the only option here that puts the trail in the first HTML without moving the header. Its costs, from the installed Next 16.4.3 docs (`03-file-conventions/parallel-routes.md`):

- **Stale trails on soft navigation.** "During client-side navigation, Next.js will perform a partial render, changing the subpage within the slot, while maintaining the other slot's active subpages, even if they don't match the current URL." Navigating from a Document to Home, with no `@header` page for Home, would keep the Document's trail. Every route needs a matching slot page, or a catch-all `@header/[...catchAll]/page.tsx` returning the no-trail state, plus `@header/default.tsx` for hard loads ("If `default.js` doesn't exist, a `404` is rendered instead").
- **Repeated authorization.** "Both slots render on the server, regardless of which one the layout returns… `@admin/page.js` executes its data fetches for every user… Authorize inside each slot's page." Each slot page needs its own `requireOwner`. The existing `protected-routes.test.ts` scans every `page.tsx` under `(protected)`, so it would demand this. That is good enforcement, but it is one more page per route.
- **A second tree to keep in step.** Six routes today; ADR-0013's nested Space routes (`spaces/[spaceId]/documents/[documentId]`, `…/dashboards/[dashboardId]`) add more, each mirrored. A route added without its slot page silently falls back to the catch-all (no trail), so drift is quiet.
- **Not-found and error states need their own handling** in the slot (a missing record must render the no-trail state, not call `notFound()` a second time), and a slot that throws needs its own `error.tsx` or it takes the shell's boundary.
- **`activeContext` loses its data.** A slot is a `ReactNode`, not a value. The sidebar's `appSidebar(trail)` cannot read it. It would need a second channel: either the slot also renders a client publisher (the effect bridge again, for the sidebar only), or `activeContext` is re-derived from the pathname, which creates a second source of truth for context.
- **Precedent.** A provisional `@header` slot was built for the previous route layout (`.agents/task-scope.md`, 2026-10-06, `apps/web/app/@header/default.tsx`) as a seam with no per-route content; it does not exist in the current app. That is evidence the seam was tried, not that per-route content was proven.

### D. Route-specific header composition without parallel routes

The header is rendered once, by the shell, outside `<main>`. Without a slot, a route can only influence it from inside `children`, which is the bridge (A) or a client store, both post-hydration. The structural way to do D is to move the header into the content column, so each page or nested layout renders its own header as ordinary server content. That is the "workspace header" in `frontend-shells/src/testing/proposed-workspace.tsx`. It is story content only, and its adoption (header hierarchy, nested navigation) is explicitly not approved (task-scope, contextual panel slice 1, 2026-10-27). D is therefore a product and visual decision, not a breadcrumb fix.

### E. Other minimal alternatives considered

- **E1. A pathname-derived trail in `AppShell`.** `usePathname()` renders during SSR, so collection crumbs and the Space id could be derived from the URL in the first HTML. Record names are not available there: `getSidebarRecords` holds only the latest records of each kind. The result would be a partial trail (the collection crumb correct, the record crumb missing or a placeholder), and a URL parser in the app that must agree with each page's `items`. That is a second source of truth for one value. Rejected.
- **E2. A pathname-derived `activeContext` only.** It would fix the "Global" first paint on Space pages whose Space is among the latest records. It splits context from the trail, which today keeps them in agreement, and leaves older Spaces wrong. Deferred: worth revisiting only if nested Space routes (ADR-0013) make the switcher's first paint matter more than its agreement with the trail.
- **E3. The proxy forwarding the path in a header, read by the layout.** The layout does not re-render on soft navigation, so it would be stale there and still need the bridge. Rejected.
- **E4. Rendering the header after `<main>` in the DOM and reordering it with CSS.** That breaks reading and focus order for keyboard and screen-reader users. Rejected.
- **A general breadcrumb registry or event system.** No requirement shown; out of scope per the issue.

## 4. Comparison

| Criterion                            | A. Effect bridge (keep)                                                                           | B. Resource layouts                         | C. `@header` slot                                                               | D. Header in content column                 | E1. Pathname trail       |
| ------------------------------------ | ------------------------------------------------------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------- | ------------------------ |
| Trail in first HTML                  | No (logo until hydration)                                                                         | No, unless combined with C or D             | **Yes**                                                                         | **Yes**                                     | Partial (no record name) |
| Client navigation                    | Correct (verified)                                                                                | Needs page-level publisher for child crumbs | Correct only with catch-all and full mirror                                     | Correct (ordinary content)                  | Correct                  |
| Server and client boundary           | Page (server) publishes through one client leaf                                                   | Layout owns data it cannot pass up          | Slot pages are server; shell takes a node                                       | Page owns its header                        | Client derives from URL  |
| Dynamic labels                       | Page's loaded record                                                                              | Layout loads record (`cache`)               | Slot loads record (`cache`)                                                     | Page's loaded record                        | Not available            |
| Fetch duplication                    | None added                                                                                        | One more caller, needs `cache`              | One more caller per route, needs `cache`                                        | None added                                  | None                     |
| Hydration and visual stability       | Content swap in a fixed bar; no shift                                                             | Same as A alone                             | Stable                                                                          | Stable                                      | Partial swap             |
| Streaming and loading                | Old trail kept while the old page stays; possible logo during a `loading.tsx` fallback (inferred) | Same as A                                   | Slot suspends the shell unless it has its own boundary                          | Trail streams with the page                 | Immediate                |
| Persistent layouts and nested routes | Unaffected                                                                                        | Layout persists under child changes         | Mirror per nested route                                                         | Each page or layout owns its header         | Parser per route         |
| `activeContext`                      | Same value as trail                                                                               | Needs a channel up                          | Needs a second channel                                                          | Needs a channel up                          | Second source of truth   |
| Contextual panel and drawers         | Rule: only route pages publish                                                                    | Same rule needed                            | Drawers cannot reach the slot (good)                                            | Drawers render no header (good)             | Unaffected               |
| Change size                          | None, or a structural test                                                                        | 3+ layouts, `cache`                         | ~8+ slot files now, more with nested routes; `AppShell`/`RootShell` header prop | Shell and visual redesign; product approval | Parser plus tests        |
| Tests needed                         | Ownership test                                                                                    | Layout tests                                | Slot pages, catch-all, stale-slot e2e                                           | Visual review, a11y                         | Parser tests             |
| Maintainability                      | One mechanism, one owner                                                                          | Two places know the trail                   | Two route trees                                                                 | One mechanism once adopted                  | Two sources of truth     |
| ADR-0014 and shared UI               | Shells stay route-free                                                                            | Fine                                        | Fine; shell takes a header node                                                 | Fine; needs new shell contract              | Fine                     |

## 5. Ownership semantics for resource layouts and drawers

**Rule (proposed): the primary route's page owns the trail.** The page that `children` resolves to for the current URL is the only component that renders `SetBreadcrumbs`. Resource views (`DocumentView`, `DashboardView`, future Space content), panel destinations, drawers, tabs and nested layouts never render it. A resource shown in a contextual panel is participation and presentation, not navigation, so it cannot change where the person is.

| Scenario                                        | Behavior under the rule                                                                                                                                                                                                                                                                                                                                                                                        |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Document as the primary route                | `documents/[documentId]/page.tsx` publishes Documents › name. Context: Global. (Today.)                                                                                                                                                                                                                                                                                                                        |
| 2. Dashboard as the primary route               | `dashboards/[dashboardId]/page.tsx` publishes Dashboards › name. (Today.)                                                                                                                                                                                                                                                                                                                                      |
| 3. Document or Dashboard in a contextual drawer | The drawer renders the view, never the page, so it publishes nothing; the primary route's trail stands. A structural test enforces it (plan, slice 1).                                                                                                                                                                                                                                                         |
| 4. Switching resource tabs inside a Space       | If tabs are URL-addressed (nested routes per ADR-0013), each nested page publishes Spaces › Space › resource and context stays the Space. If tabs are client state inside one Space page, the trail stays the Space's: switching a tab is presentation. Which one tabs are is an open product question (section 9).                                                                                            |
| 5. Deep link to a nested resource               | The nested page loads the Space and the resource (and confirms participation, ADR-0013), then publishes Spaces › Space (`kind: 'space'`) › resource. The first HTML shows the logo and Global until hydration, as every page does under A.                                                                                                                                                                     |
| 6. Returning to the parent Space                | The Space page mounts and publishes Spaces › Space; the nested page's cleanup and the new publish land in the same effect flush (verified pattern in section 1, item 4).                                                                                                                                                                                                                                       |
| 7. Client navigation between resources          | Old trail until the new page commits, then the new one; no empty frame observed.                                                                                                                                                                                                                                                                                                                               |
| 8. Asynchronous names                           | The page awaits its record before rendering, so `SetBreadcrumbs` never sees a placeholder. During a slow navigation the old trail stays with the old page (verified).                                                                                                                                                                                                                                          |
| 9. Renamed, deleted, inaccessible               | Renamed: a Server Action that revalidates re-renders the page, the `items` key changes and the effect republishes (no rename action exists yet; this is the mechanism it would use). Deleted or not the owner's: the page calls `notFound()`, no `SetBreadcrumbs` mounts, the trail clears and the logo shows above the not-found message (the e2e test already checks one shell and one `main` on that page). |

**`activeContext` stays derived from the trail.** It is navigation context, and the trail is the page's statement of where it sits. Keeping one value means the sidebar and header cannot disagree. Contextual panel state (which destination is open) remains session-local in `ContextualPanelShell` and is not context. Resource ownership (a record's owner, enforced by RLS), resource participation (Space membership rows), navigation state (the trail and `activeContext`) and contextual presentation (panel, drawer, tabs) stay four separate things.

## 6. Recommendation

**Keep the effect-driven bridge (option A) as the breadcrumb architecture, unchanged in behavior. Make the single-owner rule enforceable, not just documented. Do not adopt server-rendered composition now.**

Why:

1. **The deficiency is narrow.** It affects only the first paint after a full load (sign-in landing, refresh, a new tab, a pasted link), lasts until hydration, and shifts nothing. Client navigation, which is how people move around a workspace, is already correct. The routes are authenticated and not indexed, so the first HTML has no search or sharing audience.
2. **The only SSR route that keeps today's header is C, and its cost grows with the product.** It needs a mirrored route tree with its own authorization, a catch-all to avoid stale trails, and a second channel for `activeContext`, and every nested Space route ADR-0013 promises would need its mirror. That is permanent structure to fix a transient first paint.
3. **B is not a solution on its own,** and it moves trail ownership away from the page, which is where access checks, `notFound()` and record loading already are.
4. **The structural fix, if one is ever wanted, is D,** and D depends on a product and visual decision (the workspace header) that is open. If the workspace header is adopted, the trail becomes ordinary page content and server-renders with no bridge. That is the moment to retire `SetBreadcrumbs` for the header, not before.

**Ownership under the recommendation:** breadcrumb data belongs to the primary route's page (app, server); rendering belongs to `HeaderBreadcrumbs` in `frontend-shells` (no route, auth or resource knowledge); the bridge carries the value from one to the other. `activeContext` reads the same value.

### Reconsideration conditions

- The workspace header (or any header inside the content column) is adopted. Re-evaluate D first.
- The header must carry more than a trail that only a route knows on the server (for example per-route actions in the global header). That would make C carry its weight.
- Measured hydration on target devices makes the logo-to-trail swap noticeable, or the owner judges the Space switcher's "Global" first paint a real problem (then consider E2 alone).
- Next.js adds a supported way for a child segment to contribute server output to an ancestor layout.

## 7. Implementation plan (for the recommendation; not executed)

Each slice is independent and keeps working behavior throughout.

**Slice 1: enforce the single owner** (small).

- Add a lexical check to [`apps/web/src/protected-routes.test.ts`](../../../apps/web/src/protected-routes.test.ts) (the existing scanner of `(protected)` pages), or a sibling test in the same style: `SetBreadcrumbs` may be imported only by `page.tsx` files under `app/`. A component, view, layout or panel destination importing it fails the test, with a message pointing at the ownership rule.
- Extend the doc comment on `SetBreadcrumbs` ([breadcrumb-trail.tsx:46](../../../packages/frontend/shells/src/components/breadcrumb-trail/breadcrumb-trail.tsx)) and the `frontend-shells` README sentence on the bridge: "the primary route's page owns the trail; resource views, drawers and panel destinations never publish one". No API change.
- Interfaces: none added or removed.

**Slice 2: pin the documented server behavior** (small).

- Add a server-render test beside `breadcrumb-trail.test.tsx` that renders `BreadcrumbRootShell` with a `SetBreadcrumbs` child through `react-dom/server` and asserts the logo, not the trail, is in the HTML. It documents the known limitation so a later change to server rendering is deliberate and visible.
- Add an e2e step to `resource-views.e2e.ts` (fixture-gated, like its neighbors): navigate client-side from a Document to Home and assert the trail is gone and the logo is shown, so a stale trail after soft navigation is caught.

**Separate follow-up, not part of this decision: memoize record loaders.** Wrap `getDocument` and `getDashboard` (or `loadRecord`) in React `cache`, matching `session.ts`. It removes the existing double fetch between `generateMetadata` and the page. It is independent of breadcrumbs and should get its own issue and tests (a request-scope test like `require-owner.request-scope.test.ts`).

Files expected to change (slices 1 and 2): `apps/web/src/protected-routes.test.ts` (or a new sibling test), `packages/frontend/shells/src/components/breadcrumb-trail/breadcrumb-trail.tsx` (comment only), `packages/frontend/shells/src/components/breadcrumb-trail/breadcrumb-trail.test.tsx` (or a new `.server.test.tsx` if the package's Vitest environment needs it), `packages/frontend/shells/README.md`, `apps/web/e2e/resource-views.e2e.ts`. No route, layout, package boundary or runtime behavior changes.

Regressions and rollback: the new tests can only fail builds, not change behavior; rollback is reverting the commits. Performance and accessibility: unchanged; the header keeps its fixed height and landmark structure.

### Acceptance criteria, tied to #99

The issue's adoption criteria apply "if an approach is adopted". Under this recommendation:

1. The written comparison and recommendation exist (this document) and the decision is recorded as a Proposed ADR for the owner (ADR-0017).
2. The single-owner contract on `SetBreadcrumbs` is kept and enforced by a test (slice 1).
3. Shared UI stays free of route and auth knowledge: no change to `frontend-shells`' imports or exports.
4. "The correct trail in the first server HTML" is explicitly **not** met, by decision, with the reconsideration conditions above. The server-render test (slice 2) records that state.

## 8. If the owner chooses server rendering instead (option C outline)

For comparison of cost only; not recommended. Wrap the record loaders in `cache`; add `(protected)/@header/default.tsx` and `@header/[...catchAll]/page.tsx` returning no trail; add one slot page per trail-bearing route, each with `requireOwner`, its loader and `<HeaderBreadcrumbs>`; give `RootShell`/`AuthenticatedShell` a `header` node prop alongside `breadcrumbs` (a public shell API change); re-derive `activeContext` from the pathname or keep a client publisher for the sidebar; retire `SetBreadcrumbs` from pages; add e2e for hard loads, soft navigation to a route without a slot page, not-found and refresh. Estimated at about 10 new files now, growing with each nested route, and a shell API change that needs ADR-0014 review.

## 9. Risks, open questions and deferred items

- **Open product question:** are Space tabs URL-addressed (nested routes) or client state? The rule in section 5 handles both, but the trail differs.
- **Inferred, not observed:** a logo flash when a `loading.tsx` fallback replaces the old page on a slow soft navigation. If it is reproduced, the fix stays inside the bridge (keep the last trail until a new page publishes, instead of clearing on unmount), which would need a deliberate change to the documented cleanup behavior.
- **Not verified:** screen-reader announcement of the trail appearing after hydration; behavior on slow devices; a real (non-fixture) session; dark mode and narrow widths for this flow (covered by #101's scope).
- **Not verified:** hydration timing in a production build; all browser observations here used `next dev`.
- **Deferred:** E2 (pathname-derived `activeContext`), the workspace header (D), and record-loader memoization (a separate issue).
- **Documentation drift noticed:** the frontend-shells plan ([2026-10-25](../plans/2026-10-25-frontend-shells.md), "Task 6" notes) says `activeContext` falls back to the collection crumb; the code returns only the Space crumb, and its own comment says collections never count. The code and its comment agree; the plan's note is stale. Not changed here.
