# @synapcity/server-data

Owns: the Space queries and writes against a Supabase request client the host supplies (ADR-0012, ADR-0013). Reads the owner's Spaces and the documents and dashboards that take part in one Space, and writes the two Space states a person changes: pinned and last viewed. Documents and dashboards as records of their own (their queries and writes) arrive with Milestone 8.

Runtime: server only. The root file starts with `import 'server-only'`, and no other file in the package imports it. Dependencies: `@synapcity/domain-records` for the base record contract and `@synapcity/domain-spaces` for the Space contract, `@synapcity/server-supabase` for the client type (type-only import), `zod`. Category rules: [server README](../README.md) and [ADR-0014](../../../docs/architecture/decisions/0014-multi-app-package-boundaries.md).

## Public interface

`@synapcity/server-data` (root entry). Every function takes the request client first:

| Export                                    | Meaning                                                                                                                                         |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `listSpaces(client)`                      | The owner's Spaces, newest first                                                                                                                |
| `listSpaceSummaries(client)`              | The same with `documentsTotal` and `dashboardsTotal` from the participation tables                                                              |
| `findSpace(client, spaceId)`              | One Space, or `null` when it does not exist, is not theirs, or the id is not a UUID (no query is made for a malformed id)                       |
| `setSpacePinned(client, spaceId, pinned)` | `{ ok: true, pinnedAt }` with the database-stamped time, or `{ ok: false, error }`; a write row-level security turned away is `row_not_written` |
| `recordSpaceView(client, spaceId, now)`   | `{ ok: true }` or `{ ok: false, error }`; skipped when the last view is under a minute old                                                      |
| `listSpaceDocuments(client, spaceId)`     | The documents taking part in the Space as `BaseRecord[]`, newest addition first; `[]` for a malformed id                                        |
| `listSpaceDashboards(client, spaceId)`    | The same for dashboards                                                                                                                         |

## Rules

- Row-level security scopes every query. No owner id is passed to any function.
- The package never logs and never reads `NODE_ENV`, fixture mode or any other environment. Hosts log by code and status only and decide when fixtures apply.
- A participation row whose item the caller cannot see is skipped, not an error.
- Per-Space `pinned` and `position` on the participation rows are not read yet. They arrive with the feature that shows them.
- Row types and row mapping are private to the package.

## Scripts

`lint`, `check-types`, `test`, `test:coverage`. Tests sit beside the units (`*.test.ts`) and run against a stub client; they do not reach a database.
