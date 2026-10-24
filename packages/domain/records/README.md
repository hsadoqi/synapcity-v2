# @synapcity/domain-records

Owns: the base record contract, the ten fields every owned record shares. Kinds extend it in their own packages: Space in [`domain-spaces`](../spaces/README.md) (moved out of this package by owner decision, 2026-10-24) and the prototype kinds in [`domain-prototypes`](../prototypes/README.md). In Milestone 8 the Document contract arrives in `domain-documents` and the Dashboard record contract in [`domain-dashboards`](../dashboards/README.md) (owner decision, 2026-10-24); their saved shape already uses the base contract.

Runtime: portable TypeScript. The only runtime dependency is `zod`, for the schemas. Category rules: [domain README](../README.md) and [ADR-0014](../../../docs/architecture/decisions/0014-multi-app-package-boundaries.md).

## Public interface

`@synapcity/domain-records` (root entry):

| Export                           | Meaning                                                                                                                                                               |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `baseRecordInputSchema`          | The editable fields: `name` (trimmed, at least one character), `description?`, `icon` (a Lucide identifier), `tags`. No messages                                      |
| `baseRecordSchema`, `BaseRecord` | The ten shared fields: the editable fields plus `id`, `ownerId`, `createdAt`, `updatedAt`, `pinnedAt` and `lastViewedAt` (both nullable, default `null`). No messages |

| `ICON_NAME_PATTERN` | The Lucide kebab-case identifier pattern, for kinds that add their own icon message |

## Rules

- The base fields change only with a matching schema change under ADR-0012 or ADR-0013.
- A kind extends the base contract and keeps its own messages and semantics. The base contract is not a universal entity table or a relationship framework (non-goals in `PRODUCT.md`).
- Screen-only shapes never live here.
- Kind-specific contracts live in their own package, not here.

## Scripts

`lint`, `check-types`, `test`, `test:coverage`. Tests sit beside the schema (`*.test.ts`).
