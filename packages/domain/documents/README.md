# @synapcity/domain-documents

Owns: the portable Document record contract (ADR-0013, item 1). The saved document schema, built on the base record contract from [`domain-records`](../records/README.md), and the `DocumentSummary` index shape.

Runtime: portable TypeScript. Runtime dependencies: `zod` and `@synapcity/domain-records`. Category rules: [domain README](../README.md) and [ADR-0014](../../../docs/architecture/decisions/0014-multi-app-package-boundaries.md).

History: created in Milestone 8 from `apps/web/src/lib/owned-records`, where documents and dashboards shared `ownedRecordSchema` (itself `baseRecordSchema`). Parsing is unchanged.

## Public interface

`@synapcity/domain-documents` (root entry):

| Export                             | Meaning                                                                                                                    |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `documentSchema`, `DocumentEntity` | A saved document: the base record, with no fields of its own yet                                                           |
| `DocumentSummary`                  | A saved document plus its derived `spacesTotal`, how many Spaces it takes part in; the count is not stored on the document |

## What this package does not decide

- **The document body.** Editor format and body storage are not approved (`docs/glossary.md`, ADR-0013 "What this does NOT decide"), so no body schema lives here.
- **Create and update input.** Nothing creates or edits a document yet. Those schemas arrive with the flow that needs them, as `createSpaceSchema` did for Spaces.

## Rules

- A change to the document fields needs a matching schema change under ADR-0013.
- Screen-only shapes (list items, previews) and user-facing result types (the pin result) never live here; they belong to `features-documents`.

## Scripts

`lint`, `check-types`, `test`, `test:coverage`. Tests sit beside the schemas (`*.test.ts`).
