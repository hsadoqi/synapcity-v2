# S7: History and Restore Experience

**Status:** Proposed, revision 2.

- **G-S7m blocks S7(m):** restore scope, the privilege boundary, the activity semantics of a restore, and named-version limits. Each changes the migration and its transaction design. Both restore designs are fully specified below, so the owner chooses between implementable options.
- **G-S7a blocks only S7(a):** where history and activity appear in the UI.
- Read shapes and list sizes are tuned with data from S1, S3 and S5 (reconciliation roadmap Section I Slice 7).

**Date:** 2026-10-30
**Roadmap:** [database execution roadmap](../plans/2026-10-30-database-execution-roadmap.md), slice S7, release train T4
**Contracts:** [database architecture handoff](2026-10-30-database-architecture-handoff.md) D8, D9; INV-2, INV-8 to INV-13, INV-15, INV-18; §6 (restore creates a new revision and never rewrites history)
**Branch:** `db/s7-history-experience`, stacked on S5. Merges as (m), then (a) after T4.

## A. Identity and scope

- **Capability:**
  - see a Dashboard's or Document's earlier states, newest first, with the current state on top;
  - preview one;
  - restore one, which makes a new current state and keeps everything before it;
  - name a version, so pruning keeps it;
  - see recent activity for an item and for the account.
- **Exists after S1, S3 and S5:** the revision tables, capture triggers and policy functions, `activity_events`, and the S3 lifecycle lock protocol. All are owner-select only.
- **In scope:** the restore and naming functions, the capture context, read functions, TypeScript read contracts, history and activity UI, tests.
- **Out of scope:** comparing revisions; changing activity retention (decided by the owner under G-quota-T2 and its thresholds).

**G-S7m: decisions that block S7(m).**

| #   | Decision                      | Options                                                                                                                                                                                                               | Recommendation                                                                                                                                               |
| --- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Restore scope                 | **Content only:** the composition or Lexical content. **Full state:** content plus name, description, icon and tags. The handoff's INV-8 calls a revision a "complete restorable state" (roadmap section 11, item 2). | Full state, because INV-8 reads that way literally and it keeps restore unsurprising. Content only remains a coherent choice with the INV-8 wording amended. |
| 2   | Privilege boundary            | Hardened public definer functions (section B), or no client restore at all (operator only)                                                                                                                            | Hardened definer functions                                                                                                                                   |
| 3   | Activity of a restore         | one `revision.restored` event; or also the per-field events (for example `resource.renamed`) the triggers would emit                                                                                                  | one `revision.restored` event with `{sequence, scope}`; per-field events suppressed inside the restore                                                       |
| 4   | Named-version limits          | a count per item, and whether named versions count toward the 500-revision cap                                                                                                                                        | at most 50 named versions per item, excluded from the automatic cap and from pruning (INV-13); naming beyond 50 is refused                                   |
| 5   | Restore revisions and pruning | prunable like automatic revisions, or exempt                                                                                                                                                                          | prunable unless named (agent parameter)                                                                                                                      |

**G-S7a:** placement in the UI (a panel on the item page, or a route).

**Dependencies:**

- I: S1, S3, S5.
- R: T3 RC.
- G: G-S7m before (m) merges; G-S7a before (a).

## B. Data model and persistence

**Migration `revision_restore_and_naming`:**

- **Revision tables** (`dashboard_revisions`, `document_revisions`):
  - The `source` check gains `'restore'`, added `NOT VALID` then `VALIDATE`.
  - New nullable columns: `label text` (`char_length <= 120`, the D5 name limit) and `named_at timestamptz`. A revision is named when `named_at is not null`. Its `source` never changes.
  - The immutability trigger allows exactly one kind of change: `label` and `named_at`, and only inside the naming function's capture context (below).
  - Pruning excludes `named_at is not null`.
- **Capture context (the anti-forgery mechanism):** `private.capture_context(txid bigint primary key, mode text not null check (mode in ('restore','name')))`.
  - No grants. The `private` schema is not exposed through the API, so only definer functions can insert into it.
  - **How triggers read the context without client access.**
    - The lookup is `private.capture_mode() returns text`: `SECURITY DEFINER`, `stable`, `set search_path = ''`, owned by the migration role, with `execute` revoked from `public`, `anon`, `authenticated` and `service_role`. It returns the mode for `txid_current()`, or null.
    - S7's migration redefines (`create or replace`) the trigger functions that must honor the context: S1's and S5's checkpoint, initial and metadata pre-image capture, and S3's activity capture. Each becomes, or stays, `SECURITY DEFINER` with `set search_path = ''`, owned by the migration role, with `execute` revoked from client roles, and calls `private.capture_mode()`. A definer function runs with its owner's privileges, so the call succeeds while no client role ever gains `USAGE` on `private` or `SELECT` on the table.
    - PostgreSQL checks `EXECUTE` on a trigger function when the trigger is created, not when it fires. So ordinary client updates keep firing these triggers after the revoke. This is to be verified against the PostgreSQL 17 `CREATE TRIGGER` documentation at implementation (AGENTS §7a). If it does not hold, stop and report.
    - When the mode is non-null, each trigger skips only its automatic behavior: checkpoint and pre-image capture, and per-field activity events. The `+1` rule, the trashed refusal and the lifecycle lock are never skipped.
  - A client cannot create the row, so it cannot suppress or forge capture.
  - The row is deleted before the function returns. A rolled-back transaction leaves no row.
  - This is not a runtime setting, so M-7's "never use a GUC for policy" holds.
- **`public.restore_dashboard_revision(p_dashboard_id uuid, p_sequence bigint, p_expected_revision bigint, p_expected_updated_at timestamptz)`.** The Document variant mirrors it.
  - `SECURITY DEFINER`, `set search_path = ''`, fully qualified relations, `execute` revoked from `public` and `anon` and granted to `authenticated`. It is justified under INV-2, because an invoker cannot write revisions.
  - In order:
    1. `auth.uid()` must be non-null.
    2. **Lock order, per the S3 protocol:**
       - `select … from public.dashboards where id = p_dashboard_id and owner_id = auth.uid() for update`. Taken in the full-state option only.
       - Then `select … from public.dashboard_compositions where dashboard_id = p_dashboard_id and owner_id = auth.uid() for update`.
       - A missing row is `not_found`, which is also the result for another user's Dashboard.
    3. A trashed parent raises `trashed_read_only`.
    4. The composition's `revision <> p_expected_revision` raises the conflict SQLSTATE (S1's V-1 code). In the full-state option, so does `dashboards.updated_at <> p_expected_updated_at` (S9's token). A restore based on a stale view never overwrites newer work.
    5. Read the target revision `where dashboard_id = … and sequence = p_sequence`. It must exist.
    6. Insert the `capture_context` row (`restore`).
    7. Capture the current head as a pre-image checkpoint unless its full-state hash equals the latest revision's. That is at most one row, so the state before the restore is always restorable.
    8. Update the composition to the target content with `revision = p_expected_revision + 1`, so the `+1` trigger still applies. In the full-state option, also update name, description, icon and tags; `updated_at` moves, so open S9 forms then get a conflict.
    9. Insert exactly one `restore` revision of the new head.
    10. Call `private.record_activity(... 'revision.restored', {sequence, scope})`.
    11. Delete the context row.
  - It returns the new composition revision.
- **`public.name_revision(p_kind text, p_id uuid, p_sequence bigint, p_label text)`**, and `unname_revision`. Same hardening as restore.
  - The caller must own the item.
  - The label is checked with `isStorableText` rules: no NUL, well-formed, 1 to 120 characters after trimming.
  - **The named-version limit is serialized.** Inside the function, before counting:
    1. Lock the parent row (`public.dashboards` or `public.documents`) with `for update`, owner-scoped.
    2. Count the named revisions.
    3. Update.

    Naming, unnaming and the count therefore serialize per item, and lock order stays parent-first, consistent with S3.

  - Naming beyond the limit raises a dedicated `named_limit_reached` SQLSTATE.
  - Naming a revision that pruning removed concurrently returns `not_found`. Pruning's `where named_at is null` is re-evaluated after the lock, so a revision named first is never pruned.
  - It sets `label` and `named_at` inside a `name` context.
- **Activity actions.** The S3 `action` check gains `'revision.restored'`, added `NOT VALID` then `VALIDATE`.
- **Private helpers stay non-callable.** The capture functions and `record_activity` keep `execute` revoked. The restore and naming functions call them as definer-owned code; the caller never does.

**Concurrency.**

- A restore and a content save serialize on the child row, so one of them conflicts.
- A full-state restore and an S9 edit serialize on the parent row, so one of them conflicts.
- A restore and a move to Trash follow the S3 protocol: a restore that waited behind a Trash sees `trashed_read_only`.
- Parent-then-child order everywhere means no deadlock.

## C. Domain contracts

- `RevisionSummary { sequence, source, label, namedAt, createdAt, contentBytes }`.
- `ActivityEvent { action, subjectType, subjectId, relatedType, relatedId, metadata, occurredAt }`.
- Parsed with zod in the owning domain package: `domain-dashboards`, the Document contract location from S5, and `domain-records` for activity. These are the first readers, so the exports are not unused.

## D. Data access

- **`server-data`:**
  - `listRevisions(client, kind, id, { beforeSequence?, limit })`: keyset paging, no content columns;
  - `getRevision(client, kind, id, sequence)`: with content;
  - `restoreRevision(...)`, mapping `not_found`, `conflict` and `trashed_read_only`;
  - `nameRevision` and `unnameRevision`;
  - `listActivity(client, { subject?, before?, limit })`.
- **Server Actions** follow the existing pattern.
- **The current head is always shown** as the newest state above the list. Under pre-image capture, the latest burst is not yet a revision (AH §6).

## E. Fixtures

`scenarios/history.ts`: revision chains made by real saves through the seeder with the policy function redefined locally, plus one named version and one restore.

## F. Frontend

Placement follows G-S7a. In any placement:

- a revision list with relative time, source and label;
- a read-only preview (Dashboard canvas `readOnly`; Document editor read-only);
- a Restore confirmation saying a new version is created and nothing is lost;
- Name and Unname inline;
- the shallow-history notice for near-limit Documents (S5);
- activity as a simple list.

Conflict and trashed outcomes are shown with the existing wording. Keyboard: list navigation, and Enter to preview. Storybook: list, preview, restore confirmation, conflict, empty, each with axe.

## G. Verification

| Layer                                 | Test                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SQL                                   | a restore produces at most one pre-image and exactly one `restore` revision, and never alters older rows; full-state restore changes the metadata and emits exactly one `revision.restored` event with no `resource.renamed`; another user's Dashboard returns `not_found`; a trashed item is refused; a stale `p_expected_revision` or `p_expected_updated_at` conflicts; naming touches only `label` and `named_at`; the named limit is enforced; named revisions survive pruning |
| Anti-forgery                          | `authenticated` cannot execute any `private.*` function, cannot insert into `private.capture_context`, and cannot write revisions through any table path. These are direct negative tests through PostgREST and SQL with `set role authenticated`                                                                                                                                                                                                                                   |
| Capture context                       | an ordinary authenticated content save with no context still fires every capture and activity trigger (revision and events written as before); `authenticated` and `service_role` cannot select or insert `private.capture_context` or execute `private.capture_mode()`; a restore suppresses only checkpoint, pre-image and per-field activity, while the `+1` rule and trashed refusal still apply                                                                                |
| Named limit (two sessions)            | starting at 49 named revisions, two concurrent naming calls give exactly one success and one `named_limit_reached`, with a final count of 50; naming against unnaming at 50 serializes with a consistent count; naming against prune of the same revision ends either named and kept, or `not_found`                                                                                                                                                                                |
| Concurrency                           | restore against save; restore against an S9 edit (full state); restore against a move to Trash; each two-session in both orders, with no deadlock and the outcomes in section B                                                                                                                                                                                                                                                                                                     |
| Two-user, Unit, Component, Story, E2E | list, preview, restore (then restore again to undo), name; activity list                                                                                                                                                                                                                                                                                                                                                                                                            |
| Repository                            | `pnpm verify`, `pnpm db:test`, `test:db`, `pnpm db:types` with no diff                                                                                                                                                                                                                                                                                                                                                                                                              |

## H. Completion

- **IC:** section G passes. The revision-capture ADR is amended for restore, naming and the capture context. The handoff's INV-8 wording matches the G-S7m scope (roadmap section 11, item 2).
- **RC:** T4 applied; app deployed; production smoke with a throwaway account (restore, then undo by restoring again); ledger entry.

## I. Risks

- **A definer function is a privilege boundary.** Every check in section B is tested negatively, and the advisor output is triaged (M-8).
- **History lists for items with 500 revisions** need keyset paging from the start.
