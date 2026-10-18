# ADR-0013: Document and dashboard persistence boundary

**Status:** Proposed  
**Date:** 2026-10-17  
**Deciders:** Pending. Hanaa Sadoqi (repository owner) has asked for this question to be drafted, not decided.

## Context

[ADR-0012](0012-owned-space-records.md) adopted owned Space records and an unapplied `public.spaces` migration. It deliberately left content relationships, Document membership and Space lifecycle open. The spaces feature (`apps/web/src/features/spaces`) already renders `documents` and `dashboards` lists with totals, but only from fixtures. `shared/types/types.ts` defines `DocumentItem` and `DashboardItem` as display shapes, and `EntityKind = 'space' | 'document' | 'dashboard'`.

The owner wants to finish the Space screens without being blocked on how documents and dashboards are stored. [`PRODUCT.md`](../../../PRODUCT.md) states the shared requirement is "narrower than a universal entity model": supported things need enough identity and addressability to take part in context, discovery, reuse, connection and history, without a shared base type being assumed.

[The glossary](../../glossary.md) lists "Entity, resource, item, record" as Unresolved/implementation-sensitive. `Space` remains provisional. This ADR makes no terminology decision.

## Decision

**Proposed, not adopted.** Until the owner approves a choice below:

- Documents and dashboards stay display-only inside the spaces feature, fixture-backed, with no table, migration, route handler or durable identifier.
- No code introduces a shared persisted "entity" or "resource" type. The existing `EntityKind` union is a display discriminator only, and the owner decides whether to rename it.

The options to choose between when persistence is wanted:

1. **Separate tables per kind** (`public.documents`, `public.dashboards`), each owner-scoped as in ADR-0012, each with a nullable or required `space_id`. This is the simplest option and matches `PRODUCT.md`'s "no universal entity model". Cross-kind features (recent items, search, connections) need a union query or a view.
2. **One shared identity table plus per-kind detail tables.** This gives a single addressable id for connections and history, at the cost of adopting the universal-entity shape that `PRODUCT.md` says is not required and the terminology that is still unresolved.
3. **Documents first, dashboards later.** Persist only documents, which the first slice needs more directly, and keep dashboards on fixtures until their needs are known.

Recommendation, for the owner to accept or reject: **option 1, or option 3 on top of it.** It keeps every question about shared identity, connections and history open, and it is reversible by adding a view or an identity table later.

## Scope

Governs how documents and dashboards are persisted and related to Spaces, once persistence is wanted. It does not govern the editor, dashboard widgets or rendering.

## What this does NOT decide

- The final noun for Space, Document, Dashboard, or any parent term (Entity, Resource, Item, Record).
- Whether a document or dashboard must belong to a Space, or may belong to several.
- Deletion, archive or restore behavior, including whether deleting a Space deletes its content, and the effect on account-deletion cascades.
- Sharing, collaboration, connections between documents, history, or live representations.
- Document body storage (editor format, Lexical state), or dashboard widget and layout storage.
- API shape, caching, or state management.
- Any change to [the accepted first slice](../../product/first-slice.md).

## Unresolved

- Is `space_id` required, nullable or many-to-many?
- What happens to content when its Space is deleted? ADR-0012 states that no cascade to content exists yet. Any content cascade needs a separate, explicit decision and a review of the account-deletion path.
- Where does the cross-kind "recent items" list come from (union query, view, or a shared index)?
- Whether `EntityKind` is renamed, kept, or replaced by concrete per-kind types.

## Governance boundary

The repository owner approves any selection among these options. Creating a migration, persisted schema, durable identifier or public API for documents or dashboards requires explicit approval and, per `AGENTS.md` §5, an Accepted ADR. Applying a migration is a separate reviewed step, as in ADR-0012.

## Integration expectations

- Stay app-local under `apps/web/src/features/spaces` (or a feature the owner names) until the owner adopts a different topology.
- Follow ADR-0012's pattern if approved: owner-scoped RLS, explicit column grants, `public.set_updated_at()`, an indexed `owner_id`, Zod as the runtime contract, and a disposable-database SQL regression script.
- The spaces components keep consuming the existing `DocumentItem` and `DashboardItem` shapes, so a later adapter can replace fixtures without changing the UI.

## Verification expectations

For the Proposed state, nothing beyond this document changes. If an option is accepted, verify as ADR-0012 does: exercise the real migration on disposable PostgreSQL, check cross-owner isolation and the chosen delete behavior, and run the repository's proportional checks and `pnpm verify`. Report anything not run.

## Reconsideration conditions

Revisit when the first slice needs document persistence, when connections or history require a shared identifier, when sharing or collaboration is scoped, or when the Entity/Resource terminology is decided.
