# ADR-0011: Collection, an app-local feature for browse mechanics

**Status:** Accepted  
**Date:** 2026-10-17  
**Deciders:** Hanaa Sadoqi (repository owner); accepted by the owner's direct instruction to make collection its own feature and extract it.

## Context

The home page grew a browsable list of spaces, documents and dashboards: search, a filter menu, sort, a grid/list toggle, active-filter chips, per-item actions, and loading, empty and no-results states. All of it lived in `apps/web/src/features/home`. Most of it does not depend on which resource it shows, but resource details had leaked into it: a `'spaces' | 'documents' | 'dashboards'` union, per-resource labels, icons and empty-state copy, a `spaces` filter and a `spaceName` field on every item.

Spaces, documents and dashboards are expected to become features of their own. Each will need the same browse mechanics. If the mechanics stay inside `home`, each resource feature either rebuilds them or depends on `home`. The mechanics are expected to grow (more filter kinds, saved or shareable views, more displays), which makes a single owner more valuable.

[ADR-0007](0007-app-local-auth-and-account-ownership.md) sets the app-local feature layout, `apps/web/src/features/<name>/{shared,server,client,components}`, and the import rules `apps/web/src/architecture.test.ts` enforces. `docs/glossary.md` warns that a module name derived from a working label can become an accidental naming decision.

## Decision

Browse mechanics live in `apps/web/src/features/collection`, a feature that knows nothing about the resources it lists.

1. **Scope of the feature:** search, filters, sort, layout (grid, list), active-filter chips, per-item actions (open, rename, pin, duplicate, delete with confirmation), and the loading, empty and no-results states. It also owns the other ways of showing items, so every page can reuse them: `CollectionTabs` (collections as tabs, with an optional overview), the item displays `FeaturedItems`, `ItemChips` and `CompactItemList` with their skeletons, and `CreateActions` (a row of "New …" buttons). It does not own spaces, documents or dashboards.
2. **Layers** follow ADR-0007. `shared/` holds framework-free types and pure functions (`applyCollectionQuery`, `applyItemAction`, `formatUpdated`, filter helpers). `components/` holds the React views. `client/` and `server/` are added when there is code for them, not before.
3. **Consumers supply everything resource-specific** as props on `CollectionView`: `labels` (singular, plural), `icon`, `context` (where the collection lives, shown above the title and in the search placeholder), `grouping` (`{ label, options }`, which turns on the group filter and shows each item's group) and `emptyState` copy.
4. **Items are resource-neutral, and there is one item model.** `CollectionItem` has an optional `group` (a space, for example) instead of `spaceName`, and `CollectionFilters` has `groups` instead of `spaces`. An optional `kind` (e.g. `'document'`) serves lists that mix kinds; the consumer maps kinds to an icon and a label (`CollectionKinds`). The home page's separate `HomeItem` was folded into `CollectionItem` (owner's decision, 2026-10-17); its hand-written "2h ago" labels are now computed by `formatAgo`, which counts days by the calendar in the viewer's time zone.
5. **Generic presentation goes to `@synapcity/frontend-ui`.** `SectionHeading`, `EmptyNote`, `LoadingRegion` and `ConfirmDialog` carry no collection or app knowledge, so they live in the package (`components/*`), each with a story and tests, rather than in `collection`.
6. **Dependency direction:** other features may import `collection`; `collection` imports no other feature. `architecture.test.ts` enforces this with the rule "collection depends on no other feature".
7. **`collection` is the internal module name only.** It is not a user-facing or product term.

## Scope

The module boundary, its layers, the props contract between `collection` and its consumers, and the dependency direction. The current consumer is `features/home` (`lib/resources/`, `lib/overview.ts`), which holds the resource-specific configuration until each resource has its own feature.

## What this does NOT decide

- Who runs queries once real data exists. The current split (the consumer computes the visible items with `applyCollectionQuery` over in-memory fixtures) is a fixture-stage arrangement, not a decision. See Unresolved.
- Whether search, filter, sort and layout state lives in the URL, in component state or elsewhere. That belongs to the open "Persistence, API, routing and state management" candidate in the [ADR index](README.md).
- A pluggable filter-definition system. Filters are fixed today: pinned, recently updated, and one optional group dimension.
- Pagination, virtualisation, bulk selection or keyboard navigation.
- The product name for any of this, or whether "collection" ever becomes user-facing vocabulary.
- Whether spaces, documents and dashboards become features, or what they are called. The glossary keeps those as working terms.

## Unresolved

- **Query ownership.** Working answer for the spaces index (2026-10-18, owner's decision): the page loads every item once and the consumer filters and sorts them in memory with `applyCollectionQuery`. This stays the answer until a list is large enough to need server-side queries or pagination; revisit at a few hundred items. Whether the state lives in the URL remains open.
- **Pluralisation.** Several strings build the plural as `${singular}s` ("Search documents"). That is correct for the current resources but not in general; a consumer with an irregular plural needs a label for it.
- **Item actions.** Resolved in part (2026-10-18): `CollectionView` takes an `actions` list, so a resource offers only the actions it supports (spaces: open and pin). The full action set is still defined in `collection`.

## Governance boundary

The owner approves changes to the dependency rule, the props contract's shape, and adding product vocabulary derived from "collection". Adding filter kinds, displays or states inside `collection` is ordinary feature work as long as it stays resource-neutral and the architecture test passes.

## Integration expectations

- `collection/shared` stays framework-free under ADR-0007's `shared` rule.
- Components use the design-system rules in `AGENTS.md`: shared components from `@synapcity/frontend-ui`, semantic colour classes, no new tokens.
- Consumers render `CollectionView` inside a `TooltipProvider` (the home layout provides one), because the sort direction and pinned mark use tooltips.
- A new consumer passes its own labels, icon, copy and grouping; it does not add resource cases to `collection`.

## Verification expectations

- `architecture.test.ts` includes the "collection depends on no other feature" rule, and it was checked to fail on a probe import from `collection` into `home`.
- `shared/query.test.ts` covers search, each filter, combined filters, each sort, relative dates and each item action.
- `components/collection-view/collection-view.dom.test.tsx` renders the view with an invented resource ("recipe") and checks that headings, counts, search labels, context, grouping, empty and no-results states come from props.
- Not yet covered: the filter and sort menus' interaction, the item actions menu and delete confirmation, and the layout in a browser.

## Reconsideration conditions

- The first resource feature needs something the props contract cannot express (another filter dimension, different actions, server-driven state). Extend the contract deliberately rather than adding resource cases.
- A second app needs the same mechanics, which would justify a package instead of an app-local feature.
- The query-ownership decision lands somewhere that changes what `collection` owns.

## Implementation

Implemented 2026-10-17 on `feat/build-home-rooute`, then extended the same day: `CollectionTabs` became generic (callers pass `CollectionTabDefinition`s; home builds them with `resourceTabs`), the overview sections became the shared displays, and `HomeItem` was removed. `features/home` now holds only home's page composition, copy and configuration (`lib/overview.ts`, `lib/resources/`) and fixtures. Verified: type-check, ESLint with no warnings, Prettier, the architecture test, and the Vitest suite including the new tests. Not run: Storybook, Playwright, build, and a browser check of the home page.

## Amendment: spaces index (2026-10-18)

Approved by the owner's direct instruction while building the spaces index as the first resource page on real data. The index reuses `collection`; it does not build a second set of browse mechanics. Contract changes, all optional so the home page is unaffected:

- `CollectionItem` gains `icon` (a stored icon name), `href`, `lastViewedAt` and `detail` (a short line of facts).
- `CollectionFilters` gains `tags`; `CollectionView` takes `tagOptions` (a row of the most used tags plus a Tags submenu), `actions` (which item actions to offer), `renderPreview` (the hover card on an item's icon) and `hideTitle` (for a page that has its own heading). `onCreate` is now optional: without it there is no create button.
- New displays `RecentCarousel`, `PinnedPanel` and `CollectionHighlights`: items in the order they were last in use (`byRecency`: opened, else changed), the first card filling the row and later ones smaller, beside a pinned list.
- `lastViewedAt` is stored per owner on the resource (`last_viewed_at`), as is `pinnedAt`; both are stamped by the database. "Recently viewed" here means the owner opened the item's page. That definition is a working one: the product meaning of recency and "Continue" is still an open product decision in `PRODUCT.md`.

Not decided: remembering the layout choice (grid or list) across visits. It would be a new key in the account preferences (ADR-0010), so it needs its own approval. Not done yet: documents and dashboards index pages, which have no feature or repository yet.
