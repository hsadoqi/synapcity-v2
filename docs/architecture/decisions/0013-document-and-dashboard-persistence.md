# ADR-0013: Document and dashboard persistence boundary

**Status:** Accepted  
**Date:** 2026-10-17 (drafted), 2026-10-18 (accepted)  
**Deciders:** Hanaa Sadoqi (repository owner), by direct approval on 2026-10-18 of: separate tables per kind with the same name, description, icon, tags and timestamp fields as Spaces; per-kind participation tables; per-Space presentation data on the participation row; Space deletion that leaves its documents and dashboards in place; provisional "Add to space" / "Remove from space" wording; and the simplest removal behavior for now.

## Context

[ADR-0012](0012-owned-space-records.md) adopted owned Space records and an unapplied `public.spaces` migration. It deliberately left content relationships, Document membership and Space lifecycle open. The spaces feature (`apps/web/src/features/spaces`) already renders `documents` and `dashboards` lists with totals, but only from fixtures. `shared/types/types.ts` defines `DocumentItem` and `DashboardItem` as display shapes, and `EntityKind = 'space' | 'document' | 'dashboard'`.

[`PRODUCT.md`](../../../PRODUCT.md) already settles the product rule this ADR implements: "Contextual participation is not ownership". Canonical information may participate in zero, one, or many user-defined contexts; creating something within a context supplies defaults, not permanent binding; and removing something from a context is different from deleting it. [`docs/product/principles.md`](../../product/principles.md) §3-5 and [`docs/architecture/principles.md`](../principles.md) (route nesting does not establish ownership) say the same. The shared requirement is "narrower than a universal entity model".

[The glossary](../../glossary.md) lists "Entity, resource, item, record" as Unresolved/implementation-sensitive, and warns against collapsing participation, links, containment and provenance into one edge. `Space` remains provisional. This ADR makes no terminology decision.

## Decision

1. **Separate standalone tables per kind**: `public.documents` and `public.dashboards`. Each mirrors `public.spaces` from ADR-0012: UUID `id`, `owner_id` referencing `auth.users` with the account-deletion cascade, `name`, nullable `description`, a Lucide-name `icon` (default `file-text` for documents, `layout-dashboard` for dashboards), `text[]` `tags`, `created_at`/`updated_at`, owner-only RLS, explicit column grants, `public.set_updated_at()` and an indexed `owner_id`, with the same name, icon and tag constraints. Owners may hard-delete their own records. **Neither table has a `space_id`.** A Space never owns a document or dashboard.
2. **Participation is its own record, one table per kind**: `public.space_documents (space_id, document_id)` and `public.space_dashboards (space_id, dashboard_id)`. Both columns are foreign keys with `ON DELETE CASCADE`, the composite primary key prevents duplicate participation in the same Space, and a secondary index on the item column serves "which Spaces is this in?". Per-kind tables are chosen over one polymorphic `(space_id, item_type, item_id)` table so that both ends keep real foreign keys and cascades.
3. **Participation is zero, one or many.** A document or dashboard in no Space is a normal state, not an error or an "unfiled" state to repair. The global scope (Home) is not a Space record: it has no row, no participation table and nothing to delete, and every item the user owns is reachable from it whether or not it participates in any Space. This does not decide the open Global Home/Dashboard relationship in `PRODUCT.md`.
4. **Ownership on both ends.** Each participation row carries `owner_id` (default `auth.uid()`). RLS on insert must check that the caller owns both the Space and the item, so no user can place their item in another user's Space or another user's item in their own.
5. **Per-Space presentation lives on the participation row.** State that changes how an item appears in one Space and not another is a column on the participation row, never on the document or dashboard. The first columns are `pinned` (boolean, default false) and `position` (nullable integer; null means default ordering). Clients may update only these; the Space/item pair, owner and `added_at` are fixed once inserted, so moving an item is a removal plus an addition.
6. **Space deletion is allowed and never deletes content.** Deleting a Space deletes only its participation rows, through the cascade; its documents and dashboards remain and may end up in zero Spaces. This amends ADR-0012, which granted no standalone Space deletion. Deleting a document or dashboard removes its participation rows in every Space.
7. **Removal from a Space is a hard delete of the participation row.** No history, archive or restore is kept for participation for now.
8. **Participation is not a link.** A dashboard widget surfacing a document, or a document linking to another, is a separate relationship record when one is introduced. Placing a document on a dashboard does not add it to any Space.
9. **One canonical item, two routes.** A document or dashboard has a top-level route and a nested route within each Space it participates in; both render the same record. The nested route must confirm the participation row exists and respond as not found when it does not. Context (breadcrumbs, sidebar, scoped collections) comes from the route, never from a stored "parent". Cross-route features such as recent items key on the item's id, not its route.
10. **Creation within a Space** creates the item and its participation row together. The current Space is a preselected default the user may remove, and other Spaces may be added.

Provisional user-facing wording: **"Add to space"** and **"Remove from space"**, distinct from **"Delete"**. This is a working label, not a naming decision.

## Scope

Governs how documents and dashboards are persisted, how they participate in Spaces, and the Space-deletion effect on them. It does not govern the editor, dashboard widgets, layouts or rendering.

## What this does NOT decide

- The final noun for Space, Document, Dashboard, participation, or any parent term (Entity, Resource, Item, Record).
- Document body storage (editor format, Lexical state), document or dashboard columns beyond those in item 1, or dashboard widget and layout storage.
- Deletion, archive or restore behavior for documents, dashboards or Spaces beyond items 6 and 7.
- Sharing, collaboration, connections (links) between items, history, or live representations.
- Route segment names. The top-level and nested segments are working labels and rename with the final nouns.
- API shape, caching, or state management.
- Whether documents and dashboards are persisted together or documents first.
- Any change to [the accepted first slice](../../product/first-slice.md).

## Unresolved

- Further per-Space presentation columns beyond `pinned` and `position` (item 5).
- Where the cross-kind "recent items" list comes from (union query, view, or a shared index).
- Whether `EntityKind` is renamed, kept, or replaced by concrete per-kind types.
- The user-facing word for participation.

## Governance boundary

The migrations for `documents`, `dashboards`, `space_documents`, `space_dashboards`, and the Space delete grant and policy, are authorized by this ADR as **unapplied drafts**. Applying them is a separate reviewed step, as in ADR-0012. Adding columns beyond those decided here, broadening access, or adopting a different lifecycle needs explicit owner approval.

## Integration expectations

- Stay app-local under `apps/web/src/features` until the owner adopts a different topology.
- Follow ADR-0012's pattern: owner-scoped RLS, explicit column grants, `public.set_updated_at()`, an indexed `owner_id`, Zod as the runtime contract, and a disposable-database SQL regression script per migration.
- The spaces components keep consuming the existing `DocumentItem` and `DashboardItem` shapes, so an adapter can replace fixtures without changing the UI.
- Migrations: `supabase/migrations/20261018090000_create_documents_and_dashboards.sql` and `supabase/migrations/20261018090100_create_space_participation.sql` (which also adds the Space delete policy and grant). Both depend on the spaces and profiles migrations.
- SQL regression checks: `supabase/tests/documents-and-dashboards.sql` and `supabase/tests/space-participation.sql`, run as `supabase/tests/spaces.sql` is (`psql -X -v ON_ERROR_STOP=1 -f <file> <local-connection>` on a disposable migrated database as its administrator). `supabase/tests/spaces.sql` now checks that another owner's Space cannot be deleted rather than that deletion is refused. None is wired into the root verification command.

## Verification expectations

Exercise each migration on disposable PostgreSQL as ADR-0012 does. Check cross-owner isolation on both ends of a participation row, the duplicate-participation constraint, that deleting a Space removes its participation rows and leaves documents and dashboards intact, that deleting an item removes its participation rows, and the account-deletion cascade. Deliberately weaken the policies and cascades to confirm the checks detect it. Run the repository's proportional checks and `pnpm verify`, and report anything not run.

## Reconsideration conditions

Revisit when connections or history require a shared identifier, when sharing or collaboration is scoped, when participation needs history or restore, or when the Entity/Resource or participation terminology is decided.
