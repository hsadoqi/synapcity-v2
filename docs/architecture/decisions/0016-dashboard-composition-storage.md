# ADR-0016: Dashboard composition storage

**Status:** Proposed
**Date:** 2026-10-27
**Deciders:** Hanaa Sadoqi (repository owner). On 2026-10-27 the owner chose a separate one-to-one table with a revision number (option B2 of the [review](../../superpowers/specs/2026-10-27-dashboard-widgets-mvp-review.md), decision D2). This ADR records that choice. It becomes Accepted once the owner approves the durable names below and the migration is reviewed.

## Context

[ADR-0013](0013-document-and-dashboard-persistence.md) adopted the `public.dashboards` record and explicitly left "dashboard widget and layout storage" undecided. Its governance boundary says columns beyond those it decided need explicit owner approval.

The dashboard composition (`DashboardComposition` in `@synapcity/domain-dashboards`: settings, widgets and one layout per breakpoint) is validated by `dashboardCompositionSchema`. The accepted [canvas design](../../superpowers/specs/2026-10-24-features-dashboards-canvas-design.md) stores it in the browser behind the `DashboardStorage` port. The `domain-dashboards` README records that server storage needs an ADR-0013 amendment. This ADR is that amendment for composition only.

`PRODUCT.md` allows a Dashboard to own layout, widget placement, presentation metadata and widget-instance configuration, so the composition belongs to the Dashboard.

The [MVP review](../../superpowers/specs/2026-10-27-dashboard-widgets-mvp-review.md) found three problems with a column on `dashboards`:

- it changes ADR-0013's record;
- every debounced drag fires `set_updated_at`, so the record's "last changed" would track layout edits;
- like the proposed whole-document server write, it would let a stale tab silently overwrite newer work.

## Decision

1. **One composition row per Dashboard, in its own table.** Working name `public.dashboard_compositions`. Columns:
   - `dashboard_id`: primary key; foreign key to `public.dashboards(id)` with `ON DELETE CASCADE`;
   - `owner_id`: references `auth.users`, with the account-deletion cascade; default `auth.uid()`; indexed;
   - `composition`: `jsonb`;
   - `schema_version`: integer;
   - `revision`: bigint, starting at 1;
   - `updated_at`: maintained by `public.set_updated_at()`.

   The row is created on the first save, and a Dashboard without one loads as an empty composition. `public.dashboards` gains no columns.

2. **Owner-only access on both ends.**
   - RLS allows select, insert and update only when `owner_id = auth.uid()`.
   - Insert also requires that the caller owns the referenced Dashboard.
   - Explicit column grants let clients write only `composition`, `schema_version` and `revision`, plus `dashboard_id` on insert.
   - Clients never supply `owner_id`.
   - Deletion happens only through the Dashboard's cascade.
3. **Validated documents.**
   - The server validates every write with `dashboardCompositionSchema` before sending it.
   - The database checks that `composition` is a JSON object and caps its size (proposed 64 KB, a delegated value).
   - `schema_version` lets a reader migrate older documents before parsing.
4. **Conditional writes.**
   - Every update names the revision it was based on (`where dashboard_id = :id and revision = :expected`) and increments it.
   - A write that affects no row is a failure, never a success: either the revision changed elsewhere (a conflict) or RLS filtered the row out.
   - The caller reports a conflict as "changed elsewhere" and reloads; any other zero-row result is a `ProviderFailure`.
   - This applies product principle 16: nothing reads "saved" before the server confirms.
5. **Access path.** Reads and writes go through `@synapcity/server-data` and Server Actions that verify the caller (`getCallerIdentity`, ADR-0006), following ADR-0014's ownership map. The feature package's `DashboardStorage` port keeps its interface; a server adapter fills it.

## Scope

How a Dashboard's composition is stored, protected and written. It amends ADR-0013 for this storage only.

## What this does NOT decide

- **Final names.** `dashboard_compositions`, `composition`, `schema_version` and `revision` are working names that still go through the glossary's naming process before the migration is applied.
- **Widget data.** Where data a widget creates lives, and whether Task, Goal or Habit enter the product. See [spec B](../../superpowers/specs/2026-10-27-dashboard-widget-data-design.md).
- **Widget lifecycle.** No hidden or archived widget status is persisted (owner decision, 2026-10-27); removal deletes the instance.
- **History or restore** of compositions, sharing, real-time sync, or merge of concurrent edits beyond conflict detection.
- **The size cap value and debounce timing.** These are delegated implementation values.
- **Any change to the accepted first slice.**

## Unresolved

- Whether a conflict should offer anything beyond "reload" (for example, keeping the local copy).
- How `schema_version` migrations are written and tested when the composition schema changes, such as when a breakpoint is added.

## Governance boundary

The migration is authorized as an **unapplied draft** once this ADR is Accepted. Applying it is a separate reviewed step, as in ADR-0012 and ADR-0013. Broadening access, adding columns or persisting a widget lifecycle needs explicit owner approval.

## Integration expectations

- Follow the ADR-0012/0013 pattern: owner-scoped RLS, explicit column grants, `public.set_updated_at()`, an indexed `owner_id`, zod as the runtime contract, and a disposable-database SQL regression script.
- The regenerated database types are checked in, and CI's `db-types` job checks they match the migrations.
- The browser adapter stays available for Storybook and tests.

## Verification expectations

On a disposable migrated database:

- another user can neither read, insert nor update a composition, nor create one for a Dashboard they don't own;
- a stale revision updates zero rows;
- deleting a Dashboard deletes its composition;
- deleting the account deletes both;
- the object check and size cap refuse bad documents.

Deliberately weaken a policy, grant or cascade to confirm each check detects it. Then run `pnpm verify` and report anything not run.

## Reconsideration conditions

Revisit if compositions need history or restore, shared or collaborative editing, per-widget writes for performance, or if a widget lifecycle is adopted.
