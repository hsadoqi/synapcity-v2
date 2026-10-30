# S9: Resource Details Editing

**Status:** Proposed.

- Implementation-ready. No migration.
- The consistency guarantee (an edit never silently overwrites a concurrent edit) is this plan's recommendation; the owner may overrule it (roadmap section 10).

**Date:** 2026-10-30
**Roadmap:** [database execution roadmap](../plans/2026-10-30-database-execution-roadmap.md), slice S9; deploys after T2
**Contracts:** [database architecture handoff](2026-10-30-database-architecture-handoff.md) D5, D9 (rename events), INV-14, INV-15
**Branch:** `feat/s9-resource-details-editing`, stacked on S2 and S3. It merges once; its app code needs T2 (rename events and trashed refusal), so it merges after T2.
**Preview safety:** pushed only after Preview isolation holds (roadmap section 5a, PI-3); development and local verification do not wait for it.

## A. Identity and scope

- **Capability:** the owner edits a Space's, Document's or Dashboard's name, description, icon and tags.
- **Problem:** no update path exists. `ItemActionsMenu` offers a `rename` action that no index wires, and `updateSpaceSchema` is unused.
- **Exists:**
  - column grants for UPDATE on `name, description, icon, tags`;
  - `*_set_updated_at`, which fires only when those four change (migration `20261018100000`), so `updated_at` is a metadata-only version;
  - S1's metadata pre-image capture for Dashboards (S5's for Documents);
  - S3's rename events and trashed refusal;
  - `frontend-forms` (React Hook Form, ADR-0015);
  - the `field`, `input`, `textarea`, `tags-input` and `dialog` components.
- **In scope:** a patch schema, data access with optimistic concurrency, Server Actions, the edit dialog, wiring `rename` on all three indexes and item pages, tests, stories.
- **Out of scope:** an icon picker component. If none exists, use a `combobox` over icon names; check `frontend-collection` (`item-icon-preview`) first and extend it.
- **Dependencies:**
  - I: S2, S3.
  - R: T2.

## B. Data model and persistence

**No migration.** The policy, grants and triggers exist.

**Concurrency policy: record-level optimistic concurrency.**

The save sends only the changed fields and is conditional on `updated_at` still equal to the value the form was loaded with:

- `updated_at` moves only on metadata edits. It does not move on pin and view (an existing `when` clause) or on lifecycle changes (S3 keeps the clause).
- Under READ COMMITTED, a second concurrent update waits on the row lock, re-evaluates `updated_at = expected` on the committed row, matches zero rows, and is reported as a conflict. A race cannot lose an edit.
- Direct Data API callers can still overwrite. That is acceptable: it is the owner's own data, and no invariant depends on it.

Alternatives considered:

| Policy                          | Silent loss                           | False conflicts                                                                            |
| ------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------ |
| whole-record last-write-wins    | yes                                   | —                                                                                          |
| field-level last-write-wins     | same field, and tags as a whole array | —                                                                                          |
| per-field expected-value checks | no                                    | none, but array-equality filters through PostgREST are unverified, and the code is heavier |

**Dashboards and Documents:** a metadata edit fires the pre-image capture (S1, S5). That takes the shared capture lock on the composition or content row; S1's V-2 covers the race.

**Trashed:** the S3 trigger refuses the update with `trashed_read_only`.

## C. Domain contracts and validation

- `@synapcity/domain-records`: `baseRecordPatchSchema` (`recordPatchSchema(baseRecordMetadataSchema)`: strict, every field optional, at least one present), bounded by S2; implemented 2026-10-30.
- `@synapcity/domain-spaces`: `updateSpaceSchema`, which exists, is aligned to the same bounds.
- `updatedAt` round-trips as the exact database string, microseconds included. It is never passed through `Date`.

## D. Data access and application integration

- **`server-data/src/records/record-metadata.ts`** (new; avoids editing S3's `records.ts`):

  ```ts
  export function updateRecordMetadata(
    client,
    table: 'spaces' | RecordKind,
    id: string,
    patch: RecordMetadataPatchRow,
    expectedUpdatedAt: string,
  ): Promise<
    | { ok: true; record: BaseRecord }
    | { ok: false; reason: 'conflict'; current: BaseRecord }
    | { ok: false; reason: 'not_found' | 'trashed_read_only' }
    | { ok: false; reason: 'failed'; error: ProviderFailure }
  >;
  ```

  It runs `.update(patch).eq('id', id).eq('updated_at', expectedUpdatedAt).select(COLUMNS)`. Zero rows trigger a follow-up `findRecord` to classify the result as conflict (with current values), trashed or not found.

- **`SpaceSource`** gains `updateDetails`.
- **Server Actions:** `updateRecordDetails(kind, id, patch, expectedUpdatedAt)` in `apps/web/src/lib/records/record-details-actions.ts`. It validates the id and the patch with zod, calls `getCallerIdentity`, then `revalidatePath('/', 'layout')` on success.
- **After save:** the dialog closes and the page and sidebar show the new values through revalidation.

## E. Factories, fixtures and seeds

No scenario change. Unit fixtures cover a record and a concurrent variant with a newer `updatedAt`.

## F. Frontend and user experience

- **`EditDetailsDialog`** (new, in `apps/web/src/components/edit-details/`, composed from `frontend-ui` and `frontend-forms`):
  - name (`input`, `maxLength` from S2, code-point validation by zod);
  - description (`textarea`);
  - icon (picker per section A);
  - tags (`tags-input`).
- **Opened from:** the `rename` action in `ItemActionsMenu`, which becomes "Edit details", on all three indexes; and the item page header menu.
- **States:**
  - Save is disabled until something changes, and pending while saving.
  - Field errors are inline.
  - Conflict: "This was changed in another tab or window." The current values are shown beside the person's own, with "Use my changes", which re-applies only the dirty fields against the new `updatedAt`, and "Keep current".
  - Trashed: a message, and the dialog closes.
- **Accessibility:** a labelled dialog with focus trap, focus returned to the trigger, errors linked through `aria-describedby`, and Enter to save from fields.
- **Responsive:** full-width sheet layout at 400 px if the dialog does not fit, using the existing dialog responsive behavior.
- **Storybook:** default, dirty, saving, field error, conflict, trashed, each with axe.

## G. Verification

| Layer               | Test                                                                                                                                                                                                                                                              |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Two-user            | edit own row succeeds; editing another user's returns not found; a stale `updatedAt` returns conflict with current values; editing a trashed row returns `trashed_read_only`; a rename emits exactly one `resource.renamed` event (SQL check through the harness) |
| Concurrency         | two edits from the same `updatedAt`: one succeeds, one conflicts                                                                                                                                                                                                  |
| SQL                 | `updated_at` unchanged by pin, view, archive and trash (guards the token)                                                                                                                                                                                         |
| Unit                | patch schema; outcome classification; the dirty-field re-apply                                                                                                                                                                                                    |
| Component and Story | dialog states with axe                                                                                                                                                                                                                                            |
| E2E (local session) | rename a Space, reload, see the new name in the page and sidebar; two-tab conflict                                                                                                                                                                                |
| Repository          | `pnpm verify`, `test:db`                                                                                                                                                                                                                                          |

## H. Completion

- **IC:** section G passes; the `rename` action is wired on all three kinds.
- **RC:** deployed after T2; production smoke rename; ledger note.

## I. Risks

- A false conflict when two tabs edit different fields at once; accepted, and the re-apply resolves it.
- A future change that adds a column to the `set_updated_at` `when` clause would change the token's meaning. The SQL guard test catches it.
