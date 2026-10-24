# @synapcity/domain-records

Owns: the portable record contracts. The base record contract, the ten fields every owned record shares, and the Space contract built on it. Document and Dashboard modules arrive in Milestone 8; their saved shape already uses the base contract.

Runtime: portable TypeScript. The only runtime dependency is `zod`, for the schemas. Category rules: [domain README](../README.md) and [ADR-0014](../../../docs/architecture/decisions/0014-multi-app-package-boundaries.md).

## Public interface

`@synapcity/domain-records` (root entry):

| Export                                  | Meaning                                                                                                                                                                                                          |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `baseRecordInputSchema`                 | The editable fields: `name` (trimmed, at least one character), `description?`, `icon` (a Lucide identifier), `tags`. No messages                                                                                 |
| `baseRecordSchema`, `BaseRecord`        | The ten shared fields: the editable fields plus `id`, `ownerId`, `createdAt`, `updatedAt`, `pinnedAt` and `lastViewedAt` (both nullable, default `null`). No messages                                            |
| `createSpaceSchema`, `CreateSpaceInput` | The editable Space fields with the Space messages (`'Enter a space name.'`, `'Use a Lucide icon name.'`). Server-managed fields are stripped from parsed input                                                   |
| `updateSpaceSchema`, `UpdateSpaceInput` | `createSpaceSchema` with every field optional                                                                                                                                                                    |
| `spaceSchema`, `SpaceEntity`            | A saved Space (ADR-0012): the base record with the Space messages, plus `'A space ID is required.'` for `id`. Parsed key order is `name, description, icon, tags, id, ownerId, ...`, the `api/spaces` JSON order |
| `SpaceSummary`                          | A saved Space plus its derived `documentsTotal` and `dashboardsTotal`; the counts are not stored on the Space                                                                                                    |

The icon pattern is shared between modules inside the package and is not exported from the root.

## Rules

- The base fields change only with a matching schema change under ADR-0012 or ADR-0013.
- A kind extends the base contract and keeps its own messages and semantics. The base contract is not a universal entity table or a relationship framework (non-goals in `PRODUCT.md`).
- Screen-only shapes (a Space with its document and dashboard rows, list items) never live here.
- User-facing result types that carry messages (for example the pin result) belong to the feature that shows them, not to this package.
- Space is a provisional label (`docs/glossary.md`); this package does not settle its name.

## Scripts

`lint`, `check-types`, `test`, `test:coverage`. Tests sit beside the schemas (`*.test.ts`).
