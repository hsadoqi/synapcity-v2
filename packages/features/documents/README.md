# @synapcity/features-documents

Owns: document browsing (ADR-0013). The documents index's presentation, copy and collection mapping, and the result type its pin action reports. Moved from `apps/web/src/features/documents` in Milestone 8 with its behavior unchanged; it follows the [`features-spaces`](../spaces/README.md) template.

Category rules: [features README](../README.md) and [ADR-0014](../../../docs/architecture/decisions/0014-multi-app-package-boundaries.md).

## Public interface

No root entry (workspace conventions, Entry points 3).

| Entry                                     | Runtime                             | Exports                                              |
| ----------------------------------------- | ----------------------------------- | ---------------------------------------------------- |
| `@synapcity/features-documents/contracts` | Portable types                      | `SetDocumentPinnedResult`                            |
| `@synapcity/features-documents/frontend`  | React; Server and Client Components | `DocumentsCollection`, `DocumentsCollectionSkeleton` |

There is no `./server` entry: loading the index is one call to `listDocumentSummaries` in `@synapcity/server-data`, which the host makes itself (ADR-0014 lets an app backend entry import server packages). A server entry arrives when a loader has something to assemble, as Space detail does.

## What the host supplies

- **The records.** `DocumentsCollection` takes the `DocumentSummary[]` (from `@synapcity/domain-documents`) the host loaded, from Supabase or its fixture-mode records.
- **Addresses.** `homePath`, the owner's home address as the host encodes it. Every link is `${homePath}/documents/<id>` (ADR-0013, item 9); that page is not built yet.
- **The action.** `setDocumentPinned(documentId, pinned)`, the host's Server Action, which checks input, fixture mode and the caller before writing. `signInHref` is offered when a pin fails because the session ended.
- **Navigation.** Links and opening an item come from `frontend-collection`'s `CollectionNavigationProvider`, mounted by the host.

`apps/web` binds them in `src/lib/documents` (loader and action), `src/lib/demo/documents` (fixture mode) and the documents page.

## Rules

- Nothing under `frontend/` or `contracts/` imports server code; `contracts/` imports nothing. No `next`, no app source.
- No document data lives here. Tests and stories use `createDocumentEntity` from `@synapcity/dev-fixtures`; fixture-mode records belong to the host.
- `src/testing/` holds test and story helpers (a stub navigation host, sample documents). It is not exported.

## Scripts

`lint`, `check-types`, `test`, `test:coverage`. Tests run in jsdom; the stories run in `apps/storybook` (`pnpm test:storybook`), including the a11y checks.
