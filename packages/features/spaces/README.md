# @synapcity/features-spaces

Owns: Space browsing and detail (ADR-0012, ADR-0013). The Space detail view model, the Space source port and the loader that assembles a Space with what takes part in it, and the Spaces pages' presentation, copy and collection mapping. The first feature package (Milestone 5.4); its entries are the template for M6–M9.

Category rules: [features README](../README.md) and [ADR-0014](../../../docs/architecture/decisions/0014-multi-app-package-boundaries.md).

## Public interface

No root entry (workspace conventions, Entry points 3).

| Entry                                  | Runtime                                          | Exports                                                                                                                                                                               |
| -------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@synapcity/features-spaces/contracts` | Portable types                                   | `Space`, `DocumentItem`, `DashboardItem`, `SetSpacePinnedResult`                                                                                                                      |
| `@synapcity/features-spaces/frontend`  | React; Server and Client Components              | `SpacesCollection`, `SpacesCollectionSkeleton`, `SpaceContent`, `RecordSpaceView`                                                                                                     |
| `@synapcity/features-spaces/server`    | Server only (starts with `import 'server-only'`) | `SpaceSource`, `SetPinnedOutcome` and `CreatedOutcome` (the port), `serverSpaceSource(client)` (over `server-data`), `getSpace(source, spaceId, { onItemsError })`, `GetSpaceOptions` |

## What the host supplies

- **The source.** `getSpace` takes a `SpaceSource` and returns `null` when there is no such Space; the host chooses the source (Supabase through a request client, or its fixture-mode demo source) and calls `notFound()` on `null`. It reads the Space and its items at once; if the items cannot be read it still returns the Space, marked `itemsUnavailable`, and calls `onItemsError` so the host can log it.
- **Addresses.** `SpacesCollection` and `SpaceContent` take `homePath`, the owner's home address as the host encodes it. Every link is built under it: a Space at `${homePath}/spaces/<id>`, its items at their nested route `${homePath}/spaces/<id>/<kind>s/<itemId>` (ADR-0013, item 9; pages arrive in M8).
- **The actions.** `SpacesCollection` takes `setSpacePinned(spaceId, pinned)` and `RecordSpaceView` takes `recordSpaceView(spaceId)`; the host passes its Server Actions, which check input, fixture mode and the caller before writing. `SpacesCollection` also takes `signInHref`, offered when a pin fails because the session ended.
- **Navigation.** Links and opening an item come from `frontend-collection`'s `CollectionNavigationProvider`, mounted by the host.

`apps/web` binds all three: `src/lib/spaces` (source choice and actions), `src/lib/demo/space-source` (fixture mode), and the Spaces pages.

## Rules

- Nothing under `frontend/` or `contracts/` imports `server/`; `contracts/` imports only domain. No `next`, no app source.
- No Space data lives here. Tests and stories use `createSpaceEntity` from `@synapcity/dev-fixtures`; fixture-mode records belong to the host.
- `src/testing/` holds story-only helpers (a stub navigation host, sample Spaces). It is not exported.

## Scripts

`lint`, `check-types`, `test`, `test:coverage`. Tests run in jsdom with `server-only` mapped to an empty module; the stories run in `apps/storybook` (`pnpm test:storybook`), including the a11y checks.
