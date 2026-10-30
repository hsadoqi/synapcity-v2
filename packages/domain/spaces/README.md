# @synapcity/domain-spaces

Owns: the portable Space contract. The create, update and saved Space schemas, built on the base record contract from [`domain-records`](../records/README.md), and the `SpaceSummary` index shape.

Runtime: portable TypeScript. Runtime dependencies: `zod` and `@synapcity/domain-records`. Category rules: [domain README](../README.md) and [ADR-0014](../../../docs/architecture/decisions/0014-multi-app-package-boundaries.md).

History: created in Milestone 5.1 as the `spaces` module of `domain-records`; moved to its own package by owner decision on 2026-10-24. Since 2026-10-30 the write schemas are strict and run the shared D5 limit vectors in their tests (`limitVectorMismatches`).

## Public interface

`@synapcity/domain-spaces` (root entry):

| Export                                  | Meaning                                                                                                                                                                                                                                                       |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createSpaceSchema`, `CreateSpaceInput` | The editable Space fields with the D5 limits and the Space messages (`'Enter a space name.'`, `'Use a Lucide icon name.'`). Strict: server-managed fields are refused, not dropped; project a saved Space with `editableFieldsOf` from `domain-records` first |
| `updateSpaceSchema`, `UpdateSpaceInput` | A partial edit of `createSpaceSchema` (`recordPatchSchema`): every field optional, at least one present, strict                                                                                                                                               |
| `spaceSchema`, `SpaceEntity`            | A saved Space (ADR-0012): the base record with the Space messages for `name` and `icon`; `id` and the other fields are the base record's. Parsed key order is `name, description, icon, tags, id, ownerId, ...`, the `api/spaces` JSON order                  |
| `SpaceSummary`                          | A saved Space plus its derived `documentsTotal` and `dashboardsTotal`; the counts are not stored on the Space                                                                                                                                                 |

## Rules

- A change to the Space fields needs a matching schema change under ADR-0012 or ADR-0013.
- Screen-only shapes (a Space with its document and dashboard rows, list items) never live here.
- User-facing result types that carry messages (for example the pin result) belong to the feature that shows them, not to this package.
- Space is a provisional label (`docs/glossary.md`); this package does not settle its name.

## Scripts

`lint`, `check-types`, `test`, `test:coverage`. Tests sit beside the schemas (`*.test.ts`).
