# S11: Paginated Lists

**Status:** Proposed, revision 2. Implementation-ready.

- The slice is **app only if** the EXPLAIN check in section B shows existing indexes suffice.
- Otherwise it becomes schema-bearing and follows the conditional release path in section B.

**Date:** 2026-10-30
**Roadmap:** [database execution roadmap](../plans/2026-10-30-database-execution-roadmap.md), slice S11; deploys after T2
**Contracts:** [database architecture handoff](2026-10-30-database-architecture-handoff.md) INV-4; M-4, M-9
**Branch:** `feat/s11-paginated-lists`, stacked on S3. It is renamed `db/s11-paginated-lists` if the index migration is needed, so the defense-in-depth preview rule applies.

## A. Identity and scope

- **Capability:** long lists of Spaces, Documents, Dashboards and Space members load in pages, and nothing is silently cut off.
- **Problem:** lists are unpaginated against PostgREST `max_rows = 1000` (RS-03). Past 1,000 rows, items silently disappear.
- **Exists:**
  - S3's `withLifecycle` list queries, ordered by `created_at desc`;
  - S4's member ordering `position asc nulls last, added_at desc, item id asc`;
  - `frontend-collection`, which does client-side search, filter and sort over a loaded list.
- **In scope:** keyset pages in `server-data`, a "Load more" control, an honest search scope, and the conditional index migration.
- **Out of scope:** server-side search.
- **Dependencies:**
  - I: S3, S4 (member ordering).
  - R: T2.
  - The conditional path adds a train dependency (section B).

## B. Data model and release path

**Resource lists.** Keyset on `(created_at desc, id desc)`:

```text
next page:  created_at < c  or  (created_at = c and id < i)
PostgREST:  .or(`created_at.lt.${c},and(created_at.eq.${c},id.lt.${i})`)
order:      created_at desc, id desc
```

**Member lists** (the nullable, mixed-direction cursor). The order is `position asc nulls last, added_at desc, item_id asc`. The cursor is `{ position: number | null; addedAt: string; itemId: string }`, taken from the last row of the page.

When the cursor's `position` is a number `p`, the next page is:

```text
   position > p
or (position = p and added_at < a)
or (position = p and added_at = a and item_id > i)
or position is null
```

When the cursor's `position` is `null`, the next page is:

```text
position is null and (added_at < a or (added_at = a and item_id > i))
```

In PostgREST these use nested `or`/`and` filters, with `item_id` being `document_id` or `dashboard_id`. The order is:

```ts
.order('position', { ascending: true, nullsFirst: false })
.order('added_at', { ascending: false })
.order('<item_id>', { ascending: true })
```

The predicate matches the order exactly, and the unit tests in section G prove it.

**Conditional index decision.**

- Run `EXPLAIN (ANALYZE, BUFFERS)` on the local stack with the 250-item fixture, and with a 5,000-row synthetic table, for each list query.
- If no plan sorts more than the page size or scans other owners' rows, there is **no migration**. The slice merges once after T2.
- If any plan does, the slice adds the forward migration `resource_list_keyset_indexes`:
  - `(owner_id, created_at desc, id desc)` on the three resource tables, with the lifecycle predicate if S3's partial indexes are replaced;
  - `(space_id, position, added_at desc, <item>_id)` on the participation tables.
- **Release path with the migration:**
  - It is created with `supabase migration new` and merges as S11(m) after S4(m).
  - It joins the next train not yet applied: T3 if S11 is ready before T3 applies, otherwise a dedicated train with the same gates.
  - S11(a) merges only after that train's post-migration check.
  - Migrations run in a transaction, so `CREATE INDEX CONCURRENTLY` is not available. A plain `CREATE INDEX` locks writes on the table briefly; check `lock_timeout` on the hosted tables before applying (M-9).
  - The status row's "n/a until the EXPLAIN check" cells become yes or no with evidence.

**Paging consistency (not a snapshot).** Pages are stable while the data does not change. Another tab or session can insert or reorder between page requests, and a page can then skip or repeat a row. After the person's own mutations, the list revalidates from the first page. A full reload always gives a consistent first page.

## C. Contracts

```ts
type Page<T, C> = { items: T[]; next: C | null };
type RecordCursor = { createdAt: string; id: string };
type MemberCursor = { position: number | null; addedAt: string; itemId: string };

listRecordSummaries(client, kind, {
  view,
  after?: RecordCursor,
  limit = 100,
}): Promise<Page<RecordSummary, RecordCursor>>;

listSpaceDocuments(client, spaceId, {
  after?: MemberCursor,
  limit = 100,
}): Promise<Page<BaseRecord, MemberCursor>>;
```

`listSpaceSummaries` and `listSpaceDashboards` follow the same pattern. Cursors cross the Server Action boundary as validated zod objects; timestamps are exact database strings, never reformatted.

## D. Integration

- The server page loads the first page.
- "Load more" calls a Server Action that returns the next page, and the client appends it.
- Revalidation after a mutation reloads from the first page.
- While more pages exist, the collection header says that search and filter cover only the loaded items, and offers "Load all" up to 1,000.

## E. Fixtures

- A scenario with 250 Documents for one user.
- A Space with 120 members that mixes null and set positions, plus ties on `added_at`.

## F. UI

- A "Load more" button under the list, with a pending state.
- On success, focus moves to the first new item and the live region announces the count.
- "Showing N of more" appears in the header.
- Story: a partial list with Load more, with axe.

## G. Verification

| Check               | Test                                                                                                                                                                                                                                     |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit                | record keyset with ties on `created_at`; member cursor across the boundary from numbered to null positions, ties on `added_at` and on position; empty pages; last page has `next = null`; pages concatenated equal the full ordered list |
| Two-user            | pages never include another user's rows; trashed rows never appear in the active view                                                                                                                                                    |
| EXPLAIN             | recorded plans for every list query, and the index decision in the PR                                                                                                                                                                    |
| Component and Story | Load more states with axe                                                                                                                                                                                                                |
| E2E (local session) | 250 items, Load more twice, all visible; members across the null boundary                                                                                                                                                                |
| Repository          | `pnpm verify`, `test:db`; plus `pnpm db:test` and `pnpm db:types` with no diff if the migration exists                                                                                                                                   |

## H. Completion

- **IC:** section G passes, and the index decision is recorded.
- **RC:** deployed after T2, or after the train that carries the index migration.

## I. Risks

- Client-side search over a partial list misleads unless labeled; the header text covers it.
- The index migration's write lock on populated tables (M-9).
