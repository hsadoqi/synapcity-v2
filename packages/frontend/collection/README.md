# @synapcity/frontend-collection

Owns: the browse mechanics every collection page shares (ADR-0011, query ownership) and the generic entity blocks. Item presentation projections, search, filter and sort, the toolbar and its menus, the grid and list views, highlights, empty and loading states, and local browse state. Resource features supply their items, labels, supported actions and destinations; nothing here knows what a Space, Document or Dashboard means. Moved from `apps/web/src/features/collection` and `frontend-ui`'s entity blocks and screen-only entity shapes in Milestone 5.3.

Runtime: browser and server rendering, framework-neutral. Links and navigation come from the host through `CollectionNavigationProvider`; without one, links are plain anchors and `push` assigns `window.location`. `next` is imported only under `src/next/`. Dependencies: `@synapcity/frontend-ui` for primitives and `cn`, `@synapcity/domain-records` for the base record fields `RecordLike` is built on, `lucide-react`. Category rules: [frontend README](../README.md) and [ADR-0014](../../../docs/architecture/decisions/0014-multi-app-package-boundaries.md).

## Public interface

| Entry                                 | Exports                                                                                                                                       |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `@synapcity/frontend-collection`      | The components, the collection and entity types, the query and record helpers, and `CollectionNavigationProvider` / `useCollectionNavigation` |
| `@synapcity/frontend-collection/next` | `NextCollectionNavigation`: the Next.js binding (`next/link` and `useRouter().push`), mounted once by the host                                |

`apps/web` mounts `NextCollectionNavigation` in `app/(protected)/[userId]/layout.tsx`, so every collection and Space page under it navigates client-side.

Two host-facing details: an `EntityItem` may carry its own `href`, which the entity blocks use before any prefix (an item with neither is shown as text, not a dead link); and `SetPinnedResult` may carry `signedOut`, for which `CollectionIndex` offers "Sign in again" when the host gives it a `signInHref`. `EntityHeader` shows only the actions it is given handlers for.

## Rules

- One folder per unit under `src/components/`, `src/providers/`, `src/utils/` and `src/types/`, each with its `index.ts`; components have a story and, where behavior is tested, a test beside them. Imports between folders go through the folder's `index.ts`.
- No server code, no `server-only`, no app source, no fixtures from `@synapcity/dev-*` outside tests and stories.
- `src/testing/` holds story-only sample data. It is not exported.

## Scripts

`lint`, `check-types`, `test`, `test:coverage`. DOM tests run in jsdom; the stories run in `apps/storybook` (`pnpm test:storybook`), including the a11y checks.
