# S2: Resource Metadata Contract

**Status:** Proposed. Implementation-ready (D5 Decided).
**Date:** 2026-10-30
**Roadmap:** [database execution roadmap](../plans/2026-10-30-database-execution-roadmap.md), slice S2, release train T1
**Contracts:** [database architecture handoff](2026-10-30-database-architecture-handoff.md) D5, INV-14, M-4, V-4, V-12, V-13
**Branch:** `db/s2-resource-metadata-contract`. Merges as (m) the migration and tests, then (a) the app after T1. The app part tightens input validation only, so it is also safe before T1. A single merge is acceptable if reviewed that way.

## A. Identity and scope

- **Capability:** names, descriptions, tags and icons of Spaces, Documents and Dashboards follow the same limits in forms, Server Actions and the database. Direct API writers get the same answers as the app.
- **Problem:** no bounds existed (DB-03). The implemented neutral contract now applies the approved bounds consistently to saved metadata, create inputs and patches.
- **Exists:**
  - DB checks for non-blank names, icon pattern, one-dimensional tags and no null tags;
  - `baseRecordMetadataSchema` and `ICON_NAME_PATTERN` in `@synapcity/domain-records`;
  - `createSpaceSchema` and `spaceSchema` in `@synapcity/domain-spaces`;
  - `createRecord` validating the name with `baseRecordSchema.shape.name`;
  - the Quick Create dialog.
- **In scope:** the constants, the zod input schemas, DB constraints, text hygiene, error mapping, the Quick Create `maxLength`, fixture bounds.
- **Out of scope:** editing UI (S9).
- **Dependencies:**
  - I: F1, F5.
  - G: V-13 aggregates (counts and lengths only) before T1.

## B. Data model and persistence

**Migration `resource_metadata_bounds`** (one transaction). Constraints are added `NOT VALID` on `spaces`, `documents` and `dashboards`:

- `<t>_name_length check (char_length(name) <= 120)`. The existing non-blank check stays. Names are stored trimmed by the app's zod transform.
- `<t>_description_length check (description is null or char_length(description) <= 2000)`.
- `<t>_icon_length check (char_length(icon) <= 64)`.
- `<t>_tags_valid check (public.resource_tags_valid(tags))`.

`public.resource_tags_valid(text[]) returns boolean` is `language sql immutable`, `set search_path = ''`, with execute granted to `authenticated` only. It requires:

- `cardinality ≤ 20`;
- each element equals `btrim(element)`, with 1 ≤ `char_length` ≤ 50;
- `count(distinct lower(e)) = cardinality`.

It is a pure boolean. M-8 expects the advisor to list it; triage it as harmless.

On `space_documents` and `space_dashboards`: `<t>_position_nonnegative check (position is null or position >= 0)`, `NOT VALID`.

**Migration `resource_metadata_bounds_validate`:** `alter table … validate constraint …` for each constraint above. It merges after the V-13 aggregates show zero violators on hosted. If any exist, the owner decides per row. Nothing is truncated (INV-14). Both migrations are in T1 when V-13 is clean.

**Existing records:** they keep working. `NOT VALID` constraints apply to new writes and updates; `VALIDATE` proves the old rows.

**Concurrency:** not applicable (value checks).

## C. Domain contracts and validation

`@synapcity/domain-records/src/constants/limits.ts` (exported from the package root; implemented 2026-10-30, `isStorableText` lives in `src/utils/is-storable-text.ts`):

```ts
export const NAME_MAX = 120;
export const DESCRIPTION_MAX = 2000;
export const TAGS_MAX = 20;
export const TAG_MAX = 50;
export const ICON_MAX = 64;
export function isStorableText(s: string): boolean;
// false if s contains U+0000 or !s.isWellFormed()
```

`baseRecordMetadataSchema`:

```ts
name: z.string().trim().min(1).max(NAME_MAX).refine(isStorableText);
description: z.string().max(DESCRIPTION_MAX).refine(isStorableText).optional();
icon: z.string().max(ICON_MAX).regex(ICON_NAME_PATTERN);
tags: z.array(z.string().trim().min(1).max(TAG_MAX).refine(isStorableText))
  .max(TAGS_MAX)
  .superRefine(noCaseInsensitiveDuplicates);
```

- `createSpaceSchema` keeps its own messages and imports the constants.
- **Read schemas** (`baseRecordSchema`, `spaceSchema`) enforce the same durable bounds as create and patch schemas. `NOT VALID` is a deployment sequencing tool for PostgreSQL constraints, not permission for the domain layer to type an invalid legacy row as a valid `BaseRecord`. Any violating hosted row blocks validation and requires an owner-approved repair before the app contract can read it.
- **Trimming tags** is normalization: D5 measures length after trimming, and the DB requires the trimmed form. It is not truncation.
- **Boundary vectors:** a JSON file `packages/domain/records/src/testing/limit-vectors.json` (exported through `@synapcity/domain-records/testing`) lists accept and reject cases. The zod tests and `supabase/tests/resource-metadata-bounds.sql` both consume it; the SQL side is generated into a temp table by the `db:test` runner, or copied by a test helper.
- **V-12:** record how `server-account` measures the 16 KiB `user_preferences` check. Tracked only; no change.

## D. Data access and application integration

- `createRecord` (`apps/web/src/lib/records/create-record-action.ts`) validates the name through `baseRecordCreateSchema`, with its form-specific blank wording.
- Messages: an over-long name gets "Keep it to 120 characters or fewer." The existing `NAME_NEEDED` stays.
- `server-data`: map a database `23514` to a `ProviderFailure` with code `check_violation`. The action shows the generic `SAVE_FAILED`, because zod catches valid cases first and the DB is a backstop.

## E. Factories, fixtures and seeds

F6a factories generate within bounds. Boundary fixtures cover:

- maximum values;
- multibyte names (an emoji is one character by `char_length`; zod `.max` counts UTF-16 code units, so the vectors include astral characters, and the implementation uses a code-point length refinement where they differ);
- over-limit negatives.

## F. Frontend and user experience

Quick Create's name input gets `maxLength={NAME_MAX}`, with the existing error mapping. The emoji code-point caveat is above: rely on the zod refinement, not on `maxLength` alone. No restyling. Storybook: the Quick Create story gains an over-limit state.

## G. Verification

| Layer      | Test                                                                                                                                                                                                                                                                                                    |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SQL        | every field at the limit and one over (120/121, 2000/2001, 20/21 tags, 50/51, icon 64/65); duplicate tags differing in case; blank and padded tags; negative `position`; a `NOT VALID` constraint accepting an existing violating row while refusing a new write; `VALIDATE` failing on a violating row |
| Two-user   | direct `.insert`/`.update` at and over each limit behave as the app does                                                                                                                                                                                                                                |
| Unit       | zod at the boundaries from the shared vectors; astral characters; `isStorableText` (NUL, lone surrogates); the error mapping                                                                                                                                                                            |
| Story      | Quick Create over-limit state with axe                                                                                                                                                                                                                                                                  |
| Types      | `pnpm db:types` with no diff                                                                                                                                                                                                                                                                            |
| Repository | `pnpm verify`, `pnpm db:test`, `pnpm --filter @synapcity/server-data test:db`                                                                                                                                                                                                                           |

## H. Completion criteria

- **IC:** section G passes, and the TypeScript constants and SQL accept and reject the same vectors.
- **RC:** T1 applied, including `…_validate` after V-13; post-check that constraints show `convalidated = true`; app deployed; ledger entry.

## I. Risks and integration

- **Hosted rows over the limits:** unknown until V-13. The validate migration waits on it, and the owner decides per row.
- **Shared file:** S3 and S9 rebase on this branch's `base-record.ts`.
- **Code-point versus code-unit counting** is the main correctness trap; the vectors guard it.
