# S3: Archive, Trash and Activity Capture

**Status:** Proposed. Implementation-ready (D6 and D9 Decided). V-8, V-9 and V-15 do not block starting the slice. They block S3 IC, and V-8 and V-15 also block T2. The glossary step for Archive, Trash and activity runs before (m) merges.
**Date:** 2026-10-30
**Roadmap:** [database execution roadmap](../plans/2026-10-30-database-execution-roadmap.md), slice S3, release train T2
**Contracts:** [database architecture handoff](2026-10-30-database-architecture-handoff.md) D6, D9; INV-1, INV-2, INV-15 to INV-18; M-3, M-4; §9 items 6, 10, 14
**Branch:** `db/s3-archive-trash-activity`, stacked on S1 and S2. Merges as (m) the four migrations, types and database tests, then, after T2, (a) the data access, actions and UI for all three kinds.
**Preview safety:** this branch carries permanent-delete UI. It is developed and verified locally, and pushed only after Preview isolation holds (roadmap section 5a, PI-3). Any preview of it would otherwise run against production.

## A. Identity and scope

- **Capability:** the owner can archive and unarchive, move to Trash, restore (back to the prior archived state), and permanently delete from Trash, for Spaces, Documents and Dashboards. Default lists show active items only. Every lifecycle action, rename, and attach or detach is recorded as an activity event that outlives its subject.
- **Problem:**
  - no lifecycle exists (DB-08);
  - the `DELETE` policies allow hard delete of live rows (superseded by D6);
  - there is no activity record (DB-11).
- **Exists:**
  - `server-data` list, find, pin and view functions;
  - the collection kit with `CollectionTabs`;
  - `ItemActionsMenu`, offering `open | rename | toggle-pin | duplicate | delete` with a confirm dialog for `delete`, of which the indexes wire only `open` and `toggle-pin`;
  - the `readOnly` mode of `DashboardWorkspace`;
  - the read-only Document page;
  - `RecordSpaceView`;
  - existing SQL tests that delete live rows.
- **In scope:**
  - the four migrations in M-3 order;
  - the central lifecycle filter applied to every list, count, embed and participation read;
  - lifecycle operations and Server Actions;
  - Active, Archived and Trash views on each index;
  - trashed-item pages;
  - activity capture;
  - fixtures and the lifecycle scenario;
  - amended SQL tests;
  - ADRs and the glossary.
- **Out of scope:**
  - metadata editing UI (S9, which relies on this slice's rename capture);
  - participation writes (S4);
  - the activity feed (S7);
  - purge (D6: none).
- **Dependencies:**
  - I: S1 (composition read-only rule; shared test file), S2 (bounded schemas), F5.
  - R: T1 RC before T2.
  - G: V-8 (budget B-2 in the S1 spec, rerun with S3's event volume) and V-15 pass before T2; G-quota-T2 before RC.

## B. Data model and persistence

**1. `resource_lifecycle_columns`**

- `archived_at timestamptz` and `deleted_at timestamptz` (nullable) on `spaces`, `documents` and `dashboards`.
- Server stamping: extend the pattern of `public.stamp_user_state` with a new `public.stamp_lifecycle_state()` (`security invoker`, `search_path = ''`). A non-null value from a client becomes `now()`; clearing is allowed.
- `grant update (archived_at, deleted_at) on <t> to authenticated`.
- Partial indexes, kept only if `EXPLAIN` on the list queries uses them:
  - `(owner_id, created_at desc) where deleted_at is null and archived_at is null`;
  - `(owner_id, archived_at desc) where deleted_at is null and archived_at is not null`;
  - `(owner_id, deleted_at desc) where deleted_at is not null`.
- The `*_set_updated_at` `when` clauses are **not** changed, so lifecycle changes do not move `updated_at`. S9's concurrency token depends on this.

**2. `resource_lifecycle_rules`**

- `private.enforce_trashed_read_only()`, `BEFORE UPDATE` on the three tables. When `old.deleted_at is not null`, the only permitted change is `deleted_at` to null. Any other change, including pin and view, raises `trashed_read_only` (a custom SQLSTATE chosen like S1's V-1, e.g. `PT423`, verified).
- UPDATE-only on purpose: `DELETE` triggers fire on foreign-key cascades and would break account deletion.
- Replace `<t>_delete_own` with `using ((select auth.uid()) = owner_id and deleted_at is not null)`. Policies do not apply to referential cascades, so account deletion still cascades (INV-16).
- **Lifecycle lock protocol (V-15).** One rule for every parent and child pair: Dashboard and composition here, Document and content in S5. **Lock the parent row, then the child row; a content write locks only the child.**
  - **Trash and restore.** A transition that sets or clears `deleted_at` on `dashboards` fires `dashboards_lifecycle_lock_child` (`BEFORE UPDATE OF deleted_at`). It runs `select 1 from public.dashboard_compositions where dashboard_id = new.id for update`. The UPDATE itself already holds the parent row.
  - **Composition writes.** A composition write holds the child row (its own UPDATE). Its `BEFORE UPDATE` trigger `private.enforce_parent_not_trashed()` reads `dashboards.deleted_at` without locking the parent, and raises `trashed_read_only` if it is set (INV-15).
  - **Race outcomes under READ COMMITTED:**
    - If the save holds the child first, the Trash waits and commits after it. The write precedes the Trash.
    - If the Trash holds the child first, the save's UPDATE waits on the child row. Its BEFORE trigger runs once the lock is granted, and its query takes a new snapshot that sees the committed `deleted_at`, so the write is refused.
    - No content write commits after the Trash.
  - **Lock order** is parent then child on every path that takes both: Trash and restore here, S1's metadata capture, S7's full-state restore. The content path never locks the parent, so no cycle exists. A composition UPDATE takes no key-share lock on `dashboards`, because the FK column does not change.
  - **Other isolation levels.** Clients at REPEATABLE READ or SERIALIZABLE get a serialization failure instead of the refusal. PostgREST uses READ COMMITTED. The test covers both.
  - **Permanent delete** cascades to the child after locking it, so a concurrent save matches zero rows and reads back `not_found`.
- **Participation:** replace `space_documents_insert_own` and `space_dashboards_insert_own` so the existing ownership `exists` subqueries also require `deleted_at is null` on the Space and on the item (INV-17).

**3. `activity_events`** (working label)

- Columns:
  - `id uuid pk`;
  - `owner_id uuid not null references auth.users(id) on delete cascade`;
  - `actor_id uuid`, nullable, no FK;
  - `action text not null check (action in ('resource.renamed','resource.archived','resource.unarchived','resource.trashed','resource.restored','resource.deleted','membership.attached','membership.detached'))`;
  - `subject_type text not null check (subject_type in ('space','document','dashboard'))`;
  - `subject_id uuid not null`, no FK;
  - `related_type text`, `related_id uuid`;
  - `metadata jsonb not null default '{}' check (octet_length(metadata::text) <= 16384)`;
  - `occurred_at timestamptz not null default now()`.
- Indexes: `(owner_id, occurred_at desc)` and `(subject_type, subject_id, occurred_at desc)`.
- RLS select own. `revoke all`, then `grant select` to `authenticated`.

**4. `activity_capture`**

- `private.record_activity(p_owner, p_action, p_subject_type, p_subject_id, p_related_type, p_related_id, p_metadata)`, `SECURITY DEFINER`, `search_path = ''`, execute revoked. It skips the insert when `not exists (select 1 from auth.users where id = p_owner)`. That makes it safe inside the account-deletion cascade, because the owner row is already invisible there (AH §7, verified).
- `AFTER UPDATE` on each resource table:
  - `resource.renamed` when the name changes. Metadata `{"from": old.name, "to": new.name}`, an agent parameter flagged in the reconciliation roadmap Section I.
  - `archived` and `unarchived` on `archived_at` null and non-null transitions.
  - `trashed` and `restored` on `deleted_at` transitions.
  - Pin and view changes produce nothing (INV-18).
- `AFTER DELETE` on each resource table: `resource.deleted`. Fires only for direct deletes, which policies allow only from Trash. Account-cascade deletes are skipped by the owner guard.
- `AFTER INSERT` on the participation tables: `membership.attached`, subject the item, related the Space.
- `AFTER DELETE` on the participation tables: `membership.detached`, only when both the Space and the item still exist. A cascade from a permanent delete records the delete, not N detach events.

**Cascades (INV-17):**

- Permanently deleting a Space removes its memberships only.
- Permanently deleting a Document or Dashboard removes its participation, composition and revisions (existing FKs). Document content follows in S5.

**Concurrency:**

- Archive and trash are single-row updates.
- A concurrent edit of a row being trashed waits on the row lock, then hits the read-only trigger, giving `trashed_read_only`.
- Restore racing a permanent delete: the delete policy re-checks `deleted_at is not null` after the lock, so one wins and the other reports `not_found` or `not_trashed`.

**Compatibility:** the migrations are additive. The app on `main` has no delete operation, ignores the new columns, and its pin and view writes on trashed rows fail (no trashed rows exist until S3(a) ships).

**Existing records:** all stay active (`null`, `null`).

## C. Domain contracts and validation

- **`@synapcity/domain-records`:**
  - `export type LifecycleState = 'active' | 'archived' | 'trashed'`;
  - `export function lifecycleStateOf(r: { archivedAt: string | null; deletedAt: string | null }): LifecycleState`, where trashed takes precedence;
  - read schemas gain `archivedAt` and `deletedAt` using the record contract's ISO instant rule; no general time package is introduced.
- **No TypeScript activity contract yet:** there is no reader until S7, and Knip rejects unused exports.
- **Errors:** `trashed_read_only`, `not_trashed`, `not_found`, `conflict`.

## D. Data access and application integration

- **`server-data/src/owned-row/owned-row.ts`:** `COLUMNS` adds `archived_at, deleted_at`; `OwnedRow` and `toFields` map them.
- **New `server-data/src/records/lifecycle.ts`:**

  ```ts
  export type LifecycleView = 'active' | 'archived' | 'trashed';

  // Adds .is/.not filters. The only place a lifecycle predicate is written.
  function withLifecycle<Q>(query: Q, view: LifecycleView): Q;

  export function setRecordArchived(
    client,
    table: 'spaces' | RecordKind,
    id,
    archived: boolean,
  ): Promise<LifecycleOutcome>;
  export function trashRecord(client, table, id): Promise<LifecycleOutcome>;
  export function restoreRecord(client, table, id): Promise<LifecycleOutcome>;
  export function deleteRecordPermanently(
    client,
    table,
    id,
  ): Promise<LifecycleOutcome>;

  type LifecycleOutcome =
    | { ok: true }
    | { ok: false; reason: 'not_found' | 'not_trashed' | 'trashed_read_only' }
    | { ok: false; reason: 'failed'; error: ProviderFailure };
  ```

  Each write uses `.select('id')`. Zero rows trigger a follow-up read to classify, as `setRecordPinned` and `saveComposition` already do.

- **Every list and find takes a view (default `active`):**
  - `listRecordSummaries`, `listSpaces`, `listSpaceSummaries`, `findRecord`, `findSpace`. The find functions return trashed rows too, with their state, so the trashed page can render.
  - `listSpaceDocuments` and `listSpaceDashboards` use `documents!inner(...)` with an embedded filter on `deleted_at`.
  - The sidebar records (`apps/web/src/lib/sidebar-records`) and the home overview list active items only.
- **Member counts (V-9):** check whether PostgREST can filter `space_documents(count)` by the joined item's state. If it cannot, add a `security_invoker` view `public.space_member_counts(space_id, documents, dashboards)` over active items, in migration 2 (rename it at implementation if V-9 resolves it without a view). A test compares counts with and without trashed members.
- **A grep test** (`server-data/src/records/lifecycle.test.ts`) fails if `deleted_at` or `archived_at` appears in a query outside `lifecycle.ts` and `owned-row.ts` (AH §9 item 14).
- **`recordRecordView`** adds `.is('deleted_at', null)`, so opening a trashed item does not raise `trashed_read_only`.
- **`SpaceSource`** (`features-spaces/server`) gains `archive`, `trash`, `restore` and `deletePermanently`, and a `view` option on `list` and `listSummaries`. The fixture source in `apps/web/src/lib/demo/space-source` implements them in memory.
- **Server Actions:**
  - `apps/web/src/lib/records/lifecycle-actions.ts` exposes `setRecordArchived`, `trashRecord`, `restoreRecord` and `deleteRecordPermanently(kind, id)` for documents and dashboards, following `createRecord`'s pattern: id validation, `getCallerIdentity`, `logFailure`, the fixture-mode message.
  - Spaces get the same in `apps/web/src/lib/spaces/space-state-actions.ts`.
  - Every action calls `revalidatePath('/', 'layout')`.
- **Navigation:**
  - Trashing an item from its own page routes to its index (Active).
  - Permanent delete routes to the index's Trash view.
  - Restore stays on the page and re-renders as active.

## E. Factories, fixtures and seeds

- `dev-fixtures/src/scenarios/lifecycle.ts`: per kind, for two users, one active, one archived, one trashed, one pinned and one never-viewed item.
- The seeder applies lifecycle changes through the users' own clients, so events and states come from the production triggers. Factories gain `archivedAt` and `deletedAt` (default null).
- SQL tests that delete live rows (`spaces.sql`, `documents-and-dashboards.sql`, `space-participation.sql`) are amended to trash first.

## F. Frontend and user experience

The layout is a provisional baseline; this slice shows functional results only.

- **`frontend-collection`:**
  - Extend `CollectionItemAction` with `'archive' | 'unarchive' | 'trash' | 'restore'`.
  - Reuse the existing `'delete'` action and its confirm dialog as permanent delete. Its copy says it cannot be undone and names the item. This extends the component; no parallel menu.
  - `ItemActionsMenu` takes the actions offered per view:
    - Active: open, toggle-pin, archive, trash.
    - Archived: open, unarchive, trash.
    - Trash: restore, delete.
- **Index pages** (`spaces-index.tsx`, `documents-index.tsx`, `dashboards-index.tsx`): `CollectionTabs` gets Active, Archived and Trash, chosen by a `?view=` search parameter. The server page passes `view` to the loader; there are no new routes. Empty states:
  - Archived: nothing archived.
  - Trash: Trash is empty. No retention promise appears in the copy (D6).
- **Feedback:**
  - Trash shows a toast with Undo, which calls restore.
  - Archive shows a toast with Undo.
  - Permanent delete is confirmed in the dialog.
  - Updates are pessimistic: buttons show pending state, and lists update after revalidation.
- **Item pages:**
  - A trashed Space, Document or Dashboard renders read-only: `DashboardWorkspace readOnly`; the Space without create or attach controls. A banner says the item is in Trash and offers Restore and Delete permanently.
  - An archived item renders normally, with an Archived badge and Unarchive.
- **Accessibility:** menu items are keyboard reachable (Base UI dropdown). Toasts are announced through the existing toast region. The confirm dialog traps focus and returns it to the trigger. Tab panels use the existing `CollectionTabs` semantics.
- **Responsive:** tabs and banners wrap at 400 px; verified in the E2E viewport set.
- **Storybook:**
  - `ItemActionsMenu` stories for each view's action set;
  - `CollectionTabs` with three views;
  - a trashed-item banner story;
  - each with axe.

## G. Verification

| Layer                   | Test                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SQL                     | precedence; restore returns to archived; trashed rows refuse every change except restore (including pin and view); composition update refused while its Dashboard is trashed; delete refused on live rows and allowed on trashed; other users and `anon` can do none of it; Space delete removes memberships only; Document and Dashboard delete cascades participation, composition and revisions; participation insert into a trashed Space or item refused; lifecycle timestamps server-stamped; `updated_at` unchanged by lifecycle changes |
| SQL activity            | exactly one event per action; none for pin or view; no client insert, update or delete; events survive permanent delete; metadata cap; account deletion with live, trashed and participating rows succeeds with no FK error; cascaded detach produces no events                                                                                                                                                                                                                                                                                 |
| Two-user                | every operation for owner and other user through PostgREST; trashed rows absent from active lists, counts and Space members                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Concurrency (V-15)      | two sessions with F5's barriers: a composition save against a move to Trash, in both orders. Each order matches the outcomes in section B. The same test with `dashboards_lifecycle_lock_child` dropped must fail. A restore against a save, and a permanent delete against a save, are covered too                                                                                                                                                                                                                                             |
| Unit                    | `lifecycleStateOf`; outcomes and zero-row classification; the grep test; actions' validation and mapping                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Component               | `ItemActionsMenu` per view; tabs; banner; toasts with Undo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Story                   | the stories above with the a11y addon (`pnpm test:storybook`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| E2E (local session)     | archive, then hidden, then unarchive; trash, then Trash view, then restore; trash, then delete permanently, then gone; trashed Dashboard opens read-only                                                                                                                                                                                                                                                                                                                                                                                        |
| Measurement (pass/fail) | V-8: budget B-2 from the S1 spec, with S3's volume added (100 events per fixture item); V-9 result recorded                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Repository              | `pnpm verify`, `pnpm db:test`, `test:db`, `pnpm db:types` with no diff                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |

Negative proof: weaken the delete policy, the read-only trigger and the participation insert policy in turn. Each must turn its test red.

## H. Completion criteria

**IC:**

- section G passes;
- no list path bypasses the filter (the grep test);
- documentation lands:
  - ADR-0013 and ADR-0012 amendments;
  - a lifecycle ADR;
  - an activity ADR stating it is not the audit log or provenance;
  - glossary entries for Archive, Trash and activity;
  - `PRODUCT.md` open-decision text updated for deletion and archival.

**RC:**

- T2 applied;
- post-check: policies replaced (`pg_policies`) and trigger presence;
- S3(a) deployed;
- production smoke with a throwaway account: archive, trash, restore, delete permanently;
- ledger entry.
- G-quota-T2: the owner's explicit acceptance, recorded in the ledger, that activity events have no retention policy yet. F4's monitoring (table size, and per-owner p99 and maximum event counts, monthly) must be scheduled, with the thresholds that trigger a retention decision. Capture starts in this slice, so the acceptance belongs to its RC, not to S7.

## I. Risks and integration

- **Risks:**
  - A missed filter shows trashed items as active; mitigated by one module and the grep test.
  - Event inserts during account deletion are guarded and tested.
  - A pushed branch preview against production; prevented by Preview isolation (roadmap section 5a), which the push waits for.
  - Deletion volume (V-8).
- **Cross-slice:**
  - S4 and S9 stack on this branch.
  - S5 extends the read-only rule to Document content.
  - S11 adds keyset paging inside `withLifecycle`'s queries.
- **Recovery:**
  - **Rollback floor.**
    - Once T2 is applied, clients can set `archived_at` and `deleted_at` through the Data API. From the moment any row holds lifecycle state, an app version without the lifecycle filter would list trashed and archived rows as active. So S3(a) is the app floor, recorded in the ledger.
    - S3(a) deploys right after T2's post-migration check, so the earlier window is limited to direct API callers acting on their own rows.
    - Rolling back below the floor is allowed only if a count-only check (`count(*) … where archived_at is not null or deleted_at is not null`, per table) returns zero. Otherwise the fix is forward: a corrected build at or above the floor.
  - An app rollback leaves the additive columns in place.
  - The policy change is forward-fixed only.
  - Permanent delete is irreversible by design and is confirmed in the UI.
