# Initial non-goals, deferrals, and exclusions

**Status:** Canonical scope guardrail

## Distinguish the categories

### Non-goal for the initial product slice

Not required to prove the first selected product hypothesis. It may be reconsidered in a later milestone.

### Deferred direction

Part of the broader product direction, but intentionally postponed until the foundation or real requirements justify it.

### Rejected approach

An approach that an authorized decision has explicitly declined. Rejection applies to the stated approach and scope, not every adjacent concept.

### Absent or unfinished

Describes current implementation state only. It is not a product decision.

## Initial-slice non-goals

The following are outside the initial committed slice unless the MVP decision explicitly and narrowly includes one:

- real-time collaboration, presence, and concurrent editing;
- team, guest, permission, sharing, and multi-tenancy models;
- AI product features, agents, autonomous actions, or model-backed organization;
- broad third-party integrations and provider synchronization;
- generalized file ingestion, extraction, and indexing pipelines;
- comprehensive Tasks, Goals, and Habits;
- a plugin marketplace or public extension platform;
- comprehensive automation and scheduling infrastructure, beyond what the notifications track below needs;
- mobile/native/PWA product surfaces;
- offline-first synchronization or CRDT architecture;
- arbitrary user-defined schemas, types, or no-code application building;
- a universal entity table, graph database, or generic relationship framework selected in advance of concrete relationship requirements;
- full implementation of every foundational capability before one vertical slice has been evaluated.

## Notifications track (owner decision, 2026-10-17)

The product owner moved notifications into scope on 2026-10-17, as a track separate from the first slice in `first-slice.md` (which still excludes them from its hypothesis). Included: account and security alerts, product announcements, and reminders on user content; delivered in-app with an optional sound, by browser push, and by email. The design, the phases and the decisions still open are in [`docs/superpowers/specs/2026-10-17-notifications-design.md`](../superpowers/specs/2026-10-17-notifications-design.md). Each architecture choice it lists still needs its own approval.

## Notion import track (owner decision, 2026-10-23)

On 2026-10-23 the product owner moved Notion import into scope, as a track separate from the first slice in `first-slice.md`. A person who is signed in links their own Notion account, which is never a sign-in method, chooses pages, and gets them as Documents they can edit, with re-sync from Notion. This narrows "broad third-party integrations and provider synchronization" for this one provider and this direction only. Other integrations and write-back to Notion stay deferred. The design, the phases and the open decisions are in [`docs/superpowers/specs/2026-10-23-notion-import-design.md`](../superpowers/specs/2026-10-23-notion-import-design.md). Each architecture choice it lists still needs its own approval.

## Deferred product directions

The following are deliberately deferred rather than rejected:

- specialized Tasks, Goals, and Habits;
- real-time collaboration;
- AI product capabilities;
- external integrations and uploaded/external information workflows;
- advanced ingestion, synchronization, and conflict handling;
- richer multi-user behavior not yet classified;
- plugin/extensibility mechanisms if real extension needs emerge.

## Rejected automatic inheritance

Synapcity rejects these forms of automatic inheritance:

- copying the previous implementation wholesale;
- treating its package graph as the official architecture;
- treating its routes as the official information model;
- promoting fixture shapes into schemas;
- adopting `CaptureItem`, `EntityRef`, `synapcity://`, `DataSource`, normalized stores, or current panel registries merely because they exist or were documented;
- treating tests as proof that an abstraction is active, required, or product-valid;
- treating implementation maturity as product importance;
- adopting working vocabulary as final naming;
- interpreting absence as permanent rejection;
- turning examples such as fitness, writing, or pet care into hardcoded domain types.

Individual experimental concepts, behavior, tests, or implementations may still be adopted through explicit evaluation and, when consequential, an ADR.

## Not decided here

This document does not reject:

- Documents, Dashboards, Widgets, contextual environments, capture, connections, customization, history, search, or resumption;
- a future shared identity abstraction;
- future relationship infrastructure;
- future collaboration, sharing, or AI;
- any storage, API, route, state, or package architecture not yet evaluated.

Those areas retain the statuses recorded in `PRODUCT.md` and this document.
