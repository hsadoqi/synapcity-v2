# @synapcity/domain-records

Owns: the neutral base contract shared by the currently persisted record
domains. It defines identity, ownership, common editable metadata, record
timestamps, and the distinct saved/create/patch validation boundaries. A kind
extends this contract in its own domain package.

This package does not know which record kinds exist, map kinds to tables, own
route identifier rules, provide sample records, or define kind-specific read
models. It is not a universal entity table or relationship framework.

Runtime: portable TypeScript. Runtime dependencies: `zod` and
`@synapcity/domain-time`, which owns the reusable instant value shape. Category rules:
[domain README](../README.md) and
[ADR-0014](../../../docs/architecture/decisions/0014-multi-app-package-boundaries.md).

## Public interface

`@synapcity/domain-records` (root entry):

| Export                                                                                    | Meaning                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `baseRecordSchema`, `BaseRecord`                                                          | The saved/read contract: bounded `name`, `description`, `icon` and `tags`, plus opaque non-empty `id`, UUID `ownerId`, `createdAt`, `updatedAt`, nullable `pinnedAt` and nullable `lastViewedAt`. Timestamps are ISO instants with an explicit UTC offset |
| `baseRecordMetadataSchema`, `BaseRecordMetadata`                                          | The complete shared editable metadata. Strict and bounded; persisted values and write inputs obey the same invariants                                                                                                                                     |
| `baseRecordCreateSchema`, `BaseRecordCreate`                                              | Create input: `name` is required; `description`, `icon` and `tags` are optional so a concrete store may supply its approved defaults. Server-owned fields are refused                                                                                     |
| `baseRecordPatchSchema`, `BaseRecordPatch`, `recordPatchSchema`                           | Patch input: every metadata field is optional, at least one must be present, and unknown/server-owned fields are refused. `recordPatchSchema(kindMetadata)` preserves a kind's wording                                                                    |
| `boundedNameSchema`, `boundedDescriptionSchema`, `boundedIconSchema`, `boundedTagsSchema` | Reusable validators for the four proven shared metadata fields. Name and tags normalize surrounding whitespace; values are never truncated                                                                                                                |
| `BoundedName`, `BoundedDescription`, `BoundedIcon`, `BoundedTags`                         | Output types of the bounded field schemas                                                                                                                                                                                                                 |
| `editableFieldsOf`                                                                        | Explicitly projects the editable metadata from a saved record without relying on a schema to erase server-owned fields                                                                                                                                    |
| `RECORD_KINDS`, `RecordKind`, `recordKindSchema`, `isRecordKind`                          | The persisted record kinds, singular: `space`, `document`, `dashboard`. Table names are `server-data`'s mapping (`RECORD_TABLES`), not part of this list                                                                                                  |
| `NAME_MAX`, `DESCRIPTION_MAX`, `ICON_MAX`, `TAGS_MAX`, `TAG_MAX`, `ICON_NAME_PATTERN`     | Shared metadata bounds (counted in Unicode code points) and the Lucide kebab-case icon pattern                                                                                                                                                            |
| `RECORD_MESSAGES`, `RecordMessage`                                                        | Neutral validation wording; a kind may supply its own blank-name or bad-icon wording                                                                                                                                                                      |
| `codePointLength`, `isStorableText`, `noCaseInsensitiveDuplicates`                        | Pure validation helpers used by the schemas                                                                                                                                                                                                               |

`@synapcity/domain-records/testing` (tests only): `LIMIT_VECTORS`,
`expandVectorValue`, and `limitVectorMismatches(schema)`. The shared vectors
exercise the Zod contracts and the PostgreSQL constraints against the same
boundary cases.

## Rules

- The base contract contains only fields proven common to the accepted
  persisted record kinds. Lifecycle, content, participation, revisions, and
  relationships stay with their owners.
- Saved/read validation is not weaker than write validation. An out-of-bounds
  persisted value is a contract violation to migrate or repair, not a valid
  `BaseRecord`.
- `id` is opaque at this boundary. A concrete persistence or transport adapter
  validates UUIDs or another durable identifier format where that rule applies.
- Records own what `createdAt`, `updatedAt`, `pinnedAt`, and `lastViewedAt`
  mean. Their shared ISO instant value shape comes from `domain-time`; that
  package does not own record lifecycle or stamping policy.
- Kind-specific contracts, wording, defaults, summaries, and registries do not
  live here.
- Write schemas are strict. A kind composes with `.extend` on
  `baseRecordMetadataSchema` or `baseRecordCreateSchema` and runs
  `limitVectorMismatches` on its write schemas.

## Scripts

`lint`, `check-types`, `test`, `test:coverage`. Tests sit beside the contract
they exercise (`*.test.ts`).
