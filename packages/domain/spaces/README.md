# @synapcity/domain-spaces

Owns: the portable Space contract. The create, update and saved Space schemas, built on the base record contract from [`domain-records`](../records/README.md), and the `SpaceSummary` index shape.

Runtime: portable TypeScript. Runtime dependencies: `zod` and `@synapcity/domain-records`. Category rules: [domain README](../README.md) and [ADR-0014](../../../docs/architecture/decisions/0014-multi-app-package-boundaries.md).

History: created in Milestone 5.1 as the `spaces` module of `domain-records`; moved to its own package by owner decision on 2026-10-24. Since 2026-10-30 the write schemas are strict and run the shared D5 limit vectors in their tests (`limitVectorMismatches`).

## Public interface

`@synapcity/domain-spaces` (root entry):

| Export                                  | Meaning                                                                                                                                                                                                |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `createSpaceSchema`, `CreateSpaceInput` | Space creation: bounded `name` with Space wording, plus optional `description`, `icon` and `tags`; concrete storage owns the approved defaults. Strict: server-managed fields are refused, not dropped |
| `updateSpaceSchema`, `UpdateSpaceInput` | A partial edit of the complete Space metadata contract (`recordPatchSchema`): every field optional, at least one present, strict                                                                       |
| `spaceSchema`, `SpaceEntity`            | A saved Space (ADR-0012), using the neutral bounded base read contract. Parsed key order is `name, description, icon, tags, id, ownerId, ...`, the existing JSON order                                 |
| `SpaceSummary`                          | A saved Space plus its derived `documentsTotal` and `dashboardsTotal`; the counts are not stored on the Space                                                                                          |

## Rules

- A change to the Space fields needs a matching schema change under ADR-0012 or ADR-0013.
- Screen-only shapes (a Space with its document and dashboard rows, list items) never live here.
- User-facing result types that carry messages (for example the pin result) belong to the feature that shows them, not to this package.
- Space is a provisional label (`docs/glossary.md`); this package does not settle its name.

## Scripts

`lint`, `check-types`, `test`, `test:coverage`. Tests sit beside the schemas (`*.test.ts`).
