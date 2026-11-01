# ADR-0018: Revision capture

**Status:** Accepted (2026-11-01). Proposed on 2026-10-30; records owner decisions D3, D4 and D8 as implemented by slice S1.
**Date:** 2026-10-30; accepted 2026-11-01
**Deciders:** Hanaa Sadoqi (repository owner): D3, D4 and D8 (2026-10-29 and 2026-10-30); acceptance of this ADR, its policy values and its names (2026-11-01).

The names are accepted terms ([glossary](../../glossary.md#accepted-database-terms)): a **Dashboard revision** is a row of `dashboard_revisions`, and its **revision sequence** (`dashboard_revisions.sequence`) orders one Dashboard's immutable snapshots. The **Dashboard composition revision** (`dashboard_compositions.revision`) is a different number: the compare-and-swap version of the current, mutable composition.

## Context

A Dashboard's work was a single overwritten document. [ADR-0016](0016-dashboard-composition-storage.md) deferred history. The owner decided that history is captured by the database, from a Dashboard's first state, with a bounded cost.

## Decision

1. **A revision is an immutable, complete, restorable state:** the composition, its `schema_version`, and the Dashboard's name, description, icon and tags. Clients can read their own and nothing else; no client can insert, update or delete one, and a trigger refuses any update.
2. **The database writes it, in the same transaction as the change.** A losing compare-and-swap writer matches no row, fires no trigger and creates no revision; a write that fails a check rolls back with its capture.
3. **When a revision is taken:**
   - `initial` or `backfill`: when a composition is created (`initial` if its Dashboard was created in the same transaction);
   - `checkpoint`, by pre-image: a save that arrives after a quiet gap of 5 minutes from the head's last write freezes the stored head, the previous burst's final state, before overwriting it; a burst longer than 30 minutes since the latest revision freezes its head too if it differs. The database clock decides;
   - a rename, icon, tag or description edit freezes the old head only if that exact state is in no revision, and never snapshots the new state; pin, view and (later) archive or trash changes create none;
   - a state whose SHA-256 over the full state equals the latest revision's is not stored again.
4. **Retention:** at most 500 automatic revisions per Dashboard; the oldest are pruned in the capturing transaction and the newest never.
5. **Policy values live in one `private` SQL function** (`dashboard_revision_policy()`), which tests redefine inside a rolled-back transaction. They are never read from a runtime setting, because any session can change one.
6. **One lock protocol:** both capture paths take the composition row `FOR UPDATE` before choosing a `sequence`; the composition path never locks the Dashboard row, so lock order is fixed and the two cannot deadlock.
7. **Functions:** trigger and capture functions are `SECURITY DEFINER` only where they write a table clients may not (the capture functions), in `private`, with an empty `search_path` and `EXECUTE` revoked from public roles.

## Acceptance (2026-11-01)

The owner accepted this mechanism and these values and names. They become durable on the hosted database with release T1, so a later change needs a forward migration.

- **Policy values:** a quiet gap of 5 minutes; a maximum continuous editing span of 30 minutes; at most 500 revisions per Dashboard.
- **Names, final:** the table `dashboard_revisions`; its column `sequence`; the policy function `private.dashboard_revision_policy()`; the capture functions `private.capture_checkpoint_revision`, `private.capture_dashboard_revision`, `private.capture_initial_revision` and `private.capture_metadata_preimage`.
- **No per-account revision quota for T1.** Accepted as a bounded, recorded risk (G-quota-T1), not a permanent product-policy commitment, on these conditions:
  - the production Dashboard count and its distribution across owners are recorded before T1 (preflight P3);
  - the hosted role timeouts that apply are recorded (P6);
  - the account-deletion budget (V-8) passes on hosted infrastructure before the application is deployed, and a failed budget blocks that deployment;
  - the release ledger records this risk explicitly.

Accepting this ADR does not authorize applying it to production. That follows the [database release procedure](../../engineering/database-release.md) and its gates.

## Consequences

- Cost grows per Dashboard and is capped at 500 revisions; there is no per-account quota (a recorded risk, G-quota-T1, accepted for T1 on the conditions above). Measured on a development machine: a checkpointing, pruning save adds 7.6 ms at p95 over one that does neither (budget 50 ms), and deleting the heavy account (50 Dashboards, 500 revisions each of 16 KiB) took at most 2.2 s against a 4 s limit (half the 8 s local `authenticated` statement timeout). Hosted timeouts are read separately and not measured.
- History and restore UI are a later slice (S7). A restore will create a new revision and never rewrite history.
- The same shape is meant for Document content (S5), which will extract the `+1` rule into a shared function.

## Reconsideration conditions

Revisit if usage shows the gap or span values are wrong for real editing, if the per-Dashboard cap is hit routinely, or if a chunked or deferred account deletion is needed (a budget miss).

Reconsider an account-level revision quota before broad public scale, before any paid-plan enforcement, or on evidence of storage abuse.
