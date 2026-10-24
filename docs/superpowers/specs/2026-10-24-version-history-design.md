# Version History Across Canonical Information and Representations

**Status:** Proposed; no implementation decision is accepted by this document  
**Date:** 2026-10-24  
**Requested by:** Repository owner  
**Scope:** Design user-visible history for Documents, Dashboards and Widget configuration without changing persisted contracts.

## 1. Intent

Synapcity adopts meaningful history as a product direction. This design proposes a way to inspect earlier committed states of durable information while preserving the distinction between canonical information, its representations, provenance, activity and synchronization. It does not create history UI, a schema, API, package, migration or storage key.

The product foundation explicitly does not adopt one universal event log. ADR-0013 leaves history outside its scope. The dashboard canvas stores current compositions behind `DashboardStorage`; that port is replaceable, but it is not currently a revision contract. The current app-local Documents feature lists owned records and pins them; it does not persist document body content in this worktree. The editor persistence envelope described by the Synapcity Lexical guidance is a format/migration version, not user-visible revision history.

## 2. Goals and Non-goals

**Goals**:

- Let a person inspect meaningful earlier committed states of a supported canonical resource.
- Keep each resource's history with its canonical owner, not with the context or screen that displays it.
- Preserve the distinction between a Dashboard's presentation state and the canonical records its widgets display.
- Make restoration recoverable and ensure opening, hydration, selection changes, failed saves and no-op updates do not fabricate revisions.
- Leave room for server-backed history without promising cross-device or concurrent-writer behavior now.

**Non-goals**:

- Event sourcing, a universal activity/audit log, collaboration, branching, synchronization history or analytics.
- A history UI in the current dashboard PR or a shared revision schema/API before owner approval.
- History for every record kind merely because Documents and Dashboards have history.
- Deciding final terminology or implementation names from current working labels.

## 3. Concepts and Ownership

**Revision** is a proposed term for an immutable, inspectable state of one durable resource at a meaningful commit boundary. It is distinct from:

- **Format/schema version:** identifies how to decode and migrate a payload. The Lexical envelope's version belongs here.
- **Activity:** describes an action or event that occurred; it need not contain a restorable state.
- **Provenance:** describes where information came from or how it was derived.
- **Synchronization history:** describes delivery or conflict resolution among devices or writers.

These concepts may be related in a future interface, but must not be silently stored as one timeline.

| Working concept      | State whose history is relevant                                                                          | Ownership boundary                                                                           | Recommendation                                                                                                                                                                                               |
| -------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Document             | The committed document content envelope and any document-owned metadata explicitly brought into scope    | The canonical Document, independent of Spaces or routes                                      | Revisions contain the envelope as committed; envelope-format migration remains inside the document parser.                                                                                                   |
| Dashboard            | Settings, per-breakpoint layouts and widget-instance configuration in its composition                    | The canonical Dashboard, independent of Home or Space presentation                           | A Dashboard revision captures the composition, not the records referenced by its widgets.                                                                                                                    |
| Widget               | Title, placement, collapse/highlight state, query configuration and other adopted instance configuration | Today a widget is a view embedded in a Dashboard composition, not a separate canonical owner | Initially show a widget's history as a filtered view of its containing Dashboard revisions. Do not create an independent Widget revision stream unless Widget identity and ownership are separately adopted. |
| Widget source record | The metric, goal, project/task, habit, note or other canonical information displayed by a widget         | The source record, not the widget or Dashboard                                               | If source-record history is adopted, expose it as that record's history; editing it through a widget does not create a Dashboard revision.                                                                   |

The table is a proposed ownership boundary, not a decision that every listed record kind needs history. A duplicated widget currently gets a new widget ID while continuing to reference the same source record; the proposed filtered history must not imply that the copied widget forked its source data.

## 4. Recommended Persistence Direction

**Recommendation for owner review:** store immutable resource-state revisions alongside the current resource state, rather than deriving restorable history from a universal event log or embedding an unbounded history array in each resource.

At the conceptual level, a revision needs to identify its owning resource, its immutable payload, when it was committed, and the payload format needed to decode it. Stable revision identity, author identity, ordering, and exact payload shape remain open. This document intentionally does not name fields, tables, routes, packages or storage keys.

A resource's current state remains the normal read/write target. A successful meaningful change advances its history. An unchanged edit creates no revision. A failed write creates no successful revision. Updating the current head and appending its revision must be one durable operation or have an explicit recovery protocol; otherwise a crash can leave the head and history disagreeing.

### Snapshots and Diffs

- **Full state per revision:** simplest inspection, restore and migration path; uses more storage.
- **Deltas between revisions:** smaller for large documents; tightly coupled to each payload's evolution and harder to validate or restore after migrations.
- **Hybrid checkpoints and deltas:** balances size and reconstruction cost, but adds compaction and migration complexity.

Recommendation: begin with complete immutable payload snapshots per meaningful revision, then measure real size and retention needs before adding deltas. Large editor payloads may make this tradeoff unacceptable; no storage budget or retention policy is selected here.

### Commit Boundaries

History records successful durable commits, not every render or keystroke. Multiple editor updates coalesced by the existing save coordinator or multiple grid changes coalesced by the dashboard scheduler should normally form one revision at the commit boundary. The exact quiet period, explicit-save behavior, grouping of actions, and whether restore itself is a revision need owner decisions.

For Documents, preserve the editor's genuine-edit gating: hydration of a legacy document, selection changes and opening a document must not commit a new format envelope or history revision. A format migration and a user-authored revision are separate facts.

For Dashboards, a widget settings edit, layout change, hide/archive/restore or removal can alter the composition and may become a revision only when the resulting state is durably committed. A task completion, metric update or goal update changes a source record and belongs to that source's future history policy, not to the Dashboard revision.

## 5. Restore, Access and Lifecycle

**Recommendation for owner review:** historical revisions are immutable. Restoring one creates a new current state and a new revision that refers to the restored content; it does not rewrite or delete the chosen historical entry. This preserves the ability to inspect what happened before a restore. Whether restore is user-visible, whether it requires confirmation, and whether comparison is required before restoring remain open.

History access inherits the canonical resource's authorization boundary. A revision must not be visible merely because a user can open a context or a route that once displayed the resource. Deleting, archiving, detaching, copying, exporting and importing a resource may have different history effects; no cascade, retention or legal-erasure policy is selected here.

The system is single-user first. Stable per-resource ordering and conflict handling across tabs/devices are not guaranteed by the current browser storage adapter. Before concurrent writers or synchronization are introduced, the revision commit must define how it avoids losing or ambiguously ordering concurrent states. A local counter must not be presented as a cross-device ordering guarantee.

## 6. Compatibility and Migration

Revision history must not be conflated with the existing localStorage `.v1` key suffix or with a document editor envelope's schema version. They answer different questions: where/how the current state is stored versus how one payload is decoded.

The Desktop dashboard prototype's storage has no supported automatic migration into this repository's owner-scoped storage. This design adds no migration. Any later rollout must specify an explicit source format, target mapping, validation, quarantine/recovery, and whether import is user initiated.

When history eventually moves behind server persistence, the host adapter should preserve the same conceptual ownership boundary. Whether current state and revisions use one transaction, one service or a shared history component is an implementation decision for a later approved design and ADR where required.

## 7. Decisions Needed Before Implementation

1. Which canonical kinds besides Documents and Dashboards receive history, and whether history is mandatory or capability-specific.
2. Whether Widget history is only a Dashboard-revision projection, and whether any future Widget becomes independently owned.
3. Which changes form a revision, including debounce grouping, explicit save, restore, metadata edits and source-record edits.
4. Full snapshots versus a hybrid strategy after measuring realistic document size and expected revision volume.
5. Revision identity, ordering, actor attribution, timestamps and any description of a change.
6. Retention, quota behavior, export/import, privacy deletion and whether history survives resource archival or deletion.
7. Restore and compare semantics, including conflict handling if multiple writers are later supported.
8. Storage ownership and transaction boundary for each host adapter; no server persistence or cross-device sync is implied.
9. The final product terminology and any durable names, after the glossary process.

## 8. Verification Expectations

Before implementation, test the chosen model against representative Document envelopes, Dashboard compositions with multiple breakpoints, duplicated widgets that share a source record, no-op changes, failed saves, format migrations, restore, authorization isolation, deletion and realistic storage limits. Manual accessibility review should cover timeline navigation, revision descriptions, comparison and restore confirmation. This proposed design has no executable behavior and makes no claim that these checks have run.
