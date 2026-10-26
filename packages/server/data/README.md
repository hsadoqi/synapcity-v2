# @synapcity/server-data

Owns: the Space, Document and Dashboard queries and writes against a Supabase request client the host supplies (ADR-0012, ADR-0013). Reads the owner's Spaces, documents and dashboards, and the documents and dashboards that take part in one Space; writes the two Space states a person changes (pinned and last viewed) and whether a document or dashboard is pinned. Documents and dashboards joined in Milestone 8, moved from `apps/web/src/lib/owned-records` with their behavior unchanged.

Runtime: server only. The root file starts with `import 'server-only'`, and no other file in the package imports it. Dependencies: `@synapcity/domain-records` for the base record contract, `@synapcity/domain-spaces`, `@synapcity/domain-documents` and `@synapcity/domain-dashboards` for the kinds' contracts, `@synapcity/server-supabase` for the client type (type-only import), `zod`. Category rules: [server README](../README.md) and [ADR-0014](../../../docs/architecture/decisions/0014-multi-app-package-boundaries.md).

## Public interface

`@synapcity/server-data` (root entry). Every function takes the request client first:

| Export                                            | Meaning                                                                                                                                         |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `listSpaces(client)`                              | The owner's Spaces, newest first                                                                                                                |
| `listSpaceSummaries(client)`                      | The same with `documentsTotal` and `dashboardsTotal` from the participation tables                                                              |
| `findSpace(client, spaceId)`                      | One Space, or `null` when it does not exist, is not theirs, or the id is not a UUID (no query is made for a malformed id)                       |
| `setSpacePinned(client, spaceId, pinned)`         | `{ ok: true, pinnedAt }` with the database-stamped time, or `{ ok: false, error }`; a write row-level security turned away is `row_not_written` |
| `recordSpaceView(client, spaceId, now)`           | `{ ok: true }` or `{ ok: false, error }`; skipped when the last view is under a minute old                                                      |
| `listSpaceDocuments(client, spaceId)`             | The documents taking part in the Space as `BaseRecord[]`, newest addition first; `[]` for a malformed id                                        |
| `listSpaceDashboards(client, spaceId)`            | The same for dashboards                                                                                                                         |
| `listDocumentSummaries(client)`                   | The owner's documents with `spacesTotal` from `space_documents`, newest first, each parsed with `documentSchema`; a database error throws       |
| `setDocumentPinned(client, documentId, pinned)`   | As `setSpacePinned`, for a document                                                                                                             |
| `listDashboardSummaries(client)`                  | The same for dashboards, from `space_dashboards`, parsed with `dashboardSchema`                                                                 |
| `setDashboardPinned(client, dashboardId, pinned)` | As `setSpacePinned`, for a dashboard                                                                                                            |

## Rules

- Row-level security scopes every query. No owner id is passed to any function.
- The package never logs and never reads `NODE_ENV`, fixture mode or any other environment. Hosts log by code and status only and decide when fixtures apply.
- A participation row whose item the caller cannot see is skipped, not an error.
- Per-Space `pinned` and `position` on the participation rows are not read yet. They arrive with the feature that shows them.
- Row types and row mapping are private to the package. The three tables share their columns, so the row shape and its mapping live once, in `src/owned-row`; documents and dashboards share one query module, `src/records/owned-records`, and each kind parses rows with its own contract.

## Scripts

`lint`, `check-types`, `test`, `test:coverage`. Tests sit beside the units (`*.test.ts`) and run against a stub client; they do not reach a database.
