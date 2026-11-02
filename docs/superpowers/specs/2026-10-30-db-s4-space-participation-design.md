# S4: Space Participation

**Status:** Proposed. Implementation-ready. Per-Space pin UI is out of scope: the column exists, and D7 keeps pin state as is.
**Date:** 2026-10-30
**Roadmap:** [database execution roadmap](../plans/2026-10-30-database-execution-roadmap.md), slice S4, release train T2
**Contracts:** [database architecture handoff](2026-10-30-database-architecture-handoff.md) INV-1, INV-2, INV-17; M-3 (`create_record_in_space`)
**Branch:** `db/s4-space-participation`, stacked on S3. Merges as (m) the migration and tests, then, after T2, (a) the rest.
**Preview safety:** pushed only after Preview isolation holds (roadmap section 5a, PI-3); development and local verification do not wait for it.

## A. Identity and scope

- **Capability:** the owner can add an existing Document or Dashboard to a Space, remove it from the Space (the item persists), create a Document or Dashboard directly inside a Space in one step, and reorder a Space's items.
- **Problem:** only participation reads exist (RS-01). Creating inside a Space would be two unrelated writes (DB-05).
- **Exists:**
  - `space_documents` and `space_dashboards` (composite PK, both-endpoint insert check, `pinned`, `position`, `added_at`);
  - `listSpaceDocuments` and `listSpaceDashboards` ordered by `added_at` desc;
  - the `RecordSpaceView`, `SpaceCollections` and `SpaceContent` components;
  - Quick Create;
  - the Base UI `combobox` and `command`.
- **In scope:** the invoker functions, data access, actions, the add, remove, create-in and reorder UI, scenarios and tests.
- **Out of scope:** per-Space pin UI; Spaces nested in Spaces.
- **Dependencies:**
  - I: S3 (trashed-endpoint refusal, attach and detach events, lifecycle filter), S2 (`position` check), F5.
  - R: T2.

## B. Data model and persistence

**Migration `create_record_in_space`:**

- `public.create_document(p_name text, p_space_id uuid default null) returns uuid` and `public.create_dashboard(...)`.
- Both are `SECURITY INVOKER`, `search_path = ''`, `language plpgsql`, with execute revoked from public and `anon` and granted to `authenticated`.
- Each inserts the item, then the membership when `p_space_id` is not null, in one function call (one transaction).
- RLS and column grants apply. A Space owned by someone else, or a trashed Space, fails the membership insert and rolls back the item.
- A Dashboard gets its composition and initial revision from S1's triggers. A Document gets its content from S5's trigger once S5 ships.
- **`public.reorder_space_items(p_space_id uuid, p_kind text, p_ids uuid[])`**, `SECURITY INVOKER`. In one transaction:
  1. Lock the Space's membership rows of that kind (`for update`).
  2. Require `p_ids` to equal the current membership set. Otherwise raise the `conflict` SQLSTATE (from S1's V-1).
  3. Set `position = ordinality - 1`.

  This makes concurrent reorders serialize, and a stale list cannot produce mixed positions. It is an addition to the reconciliation roadmap's Section I, which said reorder needs no function; this plan governs the layout (AH §1), and the function adds no persistence contract.

**Attach and detach:** direct table insert and delete under the existing and S3 policies. A duplicate attach hits the PK (`23505`) and is reported as already present.

**Ordering:** `position asc nulls last, added_at desc, item id` (reconciliation roadmap Section I).

**Existing records:** memberships with `position null` keep their `added_at` order.

## C. Domain contracts and validation

- All ids are UUIDs.
- The name uses S2's `baseRecordCreateSchema.shape.name`.
- `kind` is `'documents' | 'dashboards'`.
- Errors: `already_member` (treated as success with no change), `not_found`, `conflict` (reorder), `trashed_read_only`.

## D. Data access and application integration

- **`server-data/src/spaces/space-membership/space-membership.ts`** (new module beside `space-participation`):

  ```ts
  attach(client, spaceId, kind, itemId): Promise<MembershipOutcome>
  detach(client, spaceId, kind, itemId): Promise<MembershipOutcome>
  reorder(client, spaceId, kind, orderedIds): Promise<MembershipOutcome>
  createInSpace(client, kind, name, spaceId | null): Promise<CreatedOutcome>
  ```

  `createInSpace` is an RPC and keeps today's unknown-outcome rule: a failure without a code may have written.

- **The participation reads** take the ordering above.
- **`SpaceSource`** gains `attach`, `detach`, `reorder` and `createIn`. The fixture source implements them in memory.
- **Server Actions** in `apps/web/src/lib/spaces/space-membership-actions.ts` follow the existing pattern and call `revalidatePath('/', 'layout')`.
- **`createRecord`** (`apps/web/src/lib/records/create-record-action.ts`) gains an optional `spaceId`. With it, the action calls `createInSpace`; without it, the existing insert path is unchanged.

## E. Factories, fixtures and seeds

- `dev-fixtures/src/scenarios/memberships.ts`: the starter scenario's memberships gain positions. One item belongs to two Spaces, and one Space mixes null and set positions.
- The seeder attaches through ordinary clients, so attach events come from the triggers.

## F. Frontend and user experience

- **Space page:**
  - A "New document" and "New dashboard" action opens Quick Create pre-scoped to the Space.
  - An "Add existing" action opens a dialog with a `combobox` of the owner's active items not already in the Space.
- **Each item row in a Space:** `ItemActionsMenu` gains `'remove-from-space'`, a new `CollectionItemAction` with copy distinct from Delete. There is no confirmation, because the item persists; a toast offers Undo (attach again).
- **Reorder:** "Move earlier" and "Move later" menu items, mirroring the Dashboard widget pattern, are keyboard operable and announced through the live region. Each move sends the full order to `reorder`. A `conflict` refreshes the list and shows "The order changed elsewhere."
- **Item pages:** an "Add to space" menu action opens the same combobox, listing Spaces.
- **States:**
  - Pending: buttons are disabled while acting.
  - Errors: shown inline.
  - Trashed: the Space or item offers none of these actions (S3).
- **Storybook:** the add-existing dialog (empty, many, filtering), the item menu with `remove-from-space`, and reorder controls, each with axe.

## G. Verification

| Layer               | Test                                                                                                                                                                                                                                                                                                     |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SQL                 | atomicity: `create_document` into another user's Space fails and leaves no item; same for a trashed Space; forged endpoints refused; duplicate attach gives `23505`; reorder with a stale list gives `conflict`; ordering rule; functions are invoker (`prosecdef = false`) and not executable by `anon` |
| SQL activity        | attach and detach events exactly once; none for reorder                                                                                                                                                                                                                                                  |
| Two-user            | every operation, owner versus other user                                                                                                                                                                                                                                                                 |
| Concurrency         | two reorders from the same list: one succeeds, one conflicts                                                                                                                                                                                                                                             |
| Unit                | outcomes; action validation                                                                                                                                                                                                                                                                              |
| Component and Story | dialog, menu, reorder, with axe                                                                                                                                                                                                                                                                          |
| E2E (local session) | create inside a Space; add existing; remove (the item remains in its index); reorder survives reload                                                                                                                                                                                                     |
| Repository          | `pnpm verify`, `pnpm db:test`, `test:db`, `pnpm db:types` with no diff                                                                                                                                                                                                                                   |

## H. Completion criteria

- **IC:** section G passes; no partial state is reachable; membership operations never change the item row.
- **RC:** T2 applied; app deployed; production smoke (create in Space, remove, reorder); ledger entry.

## I. Risks and integration

- Remove versus Delete confusion: separate wording, separate actions, and Delete only from Trash.
- `createRecord`'s signature change touches Quick Create; covered by its existing tests plus new ones.
- S5 extends `create_document` behavior automatically through its trigger. No change here.
