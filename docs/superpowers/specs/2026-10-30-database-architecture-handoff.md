# Database Architecture Handoff

**Status:** Current direction. The decisions below are the repository owner's, made on 2026-10-29 and 2026-10-30. The ADR amendments they require (section 3) have not been written, so until they land this document is the authoritative record of those decisions.
**Date:** 2026-10-30
**Requested by:** Repository owner
**Audience:** the implementation-planning agent. It owns the execution plan: slice inventory, dependency graph, specification files, PR boundaries and UI. This document owns the persistence contracts those plans must honor.
**Mode:** planning only. Nothing here authorizes application code, migrations, hosted changes, or deployment.
**Evidence base:** `docs/audits/supabase-architecture/plans/database-reconciliation-roadmap.md` (rationale, issue register, Section D″ revision specification, Section I draft slice specifications) and the audits beside it. Those files are git-ignored and exist only in the refactor worktree as of 2026-10-30, so this document is written to stand alone for contracts.

## 1. How to use this document

- The owner's explicit decisions override ADRs, specifications, plans and documentation. The current code and database are evidence of what exists, not requirements.
- Four labels are never merged: **Exists**, **Historical**, **Recommended**, **Decided**.
- **Do not reopen a Decided item** without significant new technical evidence. If a technical finding conflicts with one, report it to the owner with the evidence. Do not resolve it silently.
- **Precedence:** where your plan's slice layout, PR structure, UI or fixture design differs from the draft slices in roadmap Section I, yours governs. The contracts, invariants and migration constraints below govern persistence in either case.
- Items under "Verification" (section 8) are unproven. Treat them as work to do, not facts.

## 2. Decision status (D1 to D14)

| #       | Subject                              | Status                           | Content                                                                                                                                                                                                                                               |
| ------- | ------------------------------------ | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **D1**  | Preview topology                     | **Deployment gate**, undecided   | Gates the Vercel Preview change only. Recommended, not approved: remove `NEXT_PUBLIC_SUPABASE_*` from the Preview target so previews fail closed. Does not block specs, code or tests.                                                                |
| **D2**  | Hosted project identity and backups  | **Deployment gate**, facts       | Confirm `dpljdkyorwpntxkwpaqv` is production, verify backups and PITR, record the recovery point, RPO and RTO. Gates every hosted action. Does not block specs, code or tests.                                                                        |
| **D3**  | Migration policy                     | **Decided** 2026-10-30           | Migrations are immutable once merged to `main`. Corrections are forward migrations. Migration 13 is untouched.                                                                                                                                        |
| **D4**  | Dashboard composition initialization | **Decided** 2026-10-29           | A trigger creates the default composition at revision 1 on every Dashboard insert. Existing Dashboards are backfilled. One save path. A missing row is a visible failure.                                                                             |
| **D4b** | Document content initialization      | Agent parameter                  | An envelope `{"lexical": null}` (`null` means never edited), created by a trigger at Document insert. The owner may overrule it.                                                                                                                      |
| **D5**  | Metadata contract                    | **Decided** 2026-10-30           | name 1–120 characters after trimming; description ≤ 2,000; tags ≤ 20, each 1–50 after trimming, no case-insensitive duplicates; icon ≤ 64; participation `position` null or ≥ 0. No aggregate tag cap.                                                |
| **D6**  | Archive and Trash                    | **Decided** 2026-10-29           | `archived_at` and `deleted_at` on Spaces, Documents, Dashboards. `deleted_at` takes precedence. Trashed rows stay owner-readable behind one central filter and a read-only trigger. Permanent delete only from Trash. No purge, no retention promise. |
| **D7**  | Per-user pin and last-viewed state   | **Decided** 2026-10-30           | Deferred to the collaboration phase. Keep the columns as owner state. Isolate pin and view access in the records module.                                                                                                                              |
| **D8**  | Revision history                     | **Decided** 2026-10-29 and 10-30 | Immutable full-state snapshots written by a database trigger. Separate numbering for the CAS counter and the history sequence. Capture ships inside the content-write slices. Retention: 500 automatic revisions per Dashboard, pruning the oldest.   |
| **D9**  | Activity events                      | **Decided** 2026-10-29           | Append-only, polymorphic (no FK to the subject), trigger- or function-written, owner FK cascade, minimal metadata. Not the audit log. Capture begins with the lifecycle slice.                                                                        |
| **D10** | Avatars                              | **Decided** 2026-10-30           | Public bucket. A URL grants read access. Cleanup is recoverable: failures are recorded durably and retried.                                                                                                                                           |
| **D11** | Auth settings                        | **Decided** 2026-10-30           | Local config mirrors hosted security semantics. Manual identity linking is off everywhere until a feature uses it. Any hosted change is behind the gates.                                                                                             |
| **D12** | Document content size                | **Decided** 2026-10-30           | 2 MiB of serialized content, one `document_contents` table, JSON as source of truth. Media is never embedded.                                                                                                                                         |
| **D13** | Local seeder location                | Agent parameter                  | A small `packages/dev` package, only when the fixtures slice reaches it. A new package needs approval under the topology rules.                                                                                                                       |
| **D14** | Deployment mechanism                 | **Deployment gate**, undecided   | Recommended, not approved: an operator runbook plus a local read-only `db:parity` script. Gates how hosted deploys happen only.                                                                                                                       |

**Architectural decisions versus gates.** D3 to D12 define what the system becomes. D1, D2 and D14 control hosted action only and must not be used to block architecture, specification or repository work.

## 3. Superseded provisions (ADR amendments required)

| Document                      | Provision superseded                                          | By                                                    |
| ----------------------------- | ------------------------------------------------------------- | ----------------------------------------------------- |
| ADR-0016 decision 1           | Composition row created on first save; no row means empty     | D4                                                    |
| ADR-0016 decision 2           | Clients may insert a composition                              | D4 (no client INSERT)                                 |
| ADR-0016 decision 3           | Database checks object-ness and a 64 KB `pg_column_size` cap  | 128 KiB text backstop, `schema_version in (1)`, `+1`  |
| ADR-0016 "does NOT decide"    | History or restore of compositions undecided                  | D8                                                    |
| ADR-0013                      | Hard delete only; history out of scope                        | D6, D8, D9                                            |
| ADR-0012 (as amended by 0013) | Space deletion is immediate                                   | D6 (delete only from Trash)                           |
| ADR-0006 "Unresolved"         | Manual migration application; linking and `db push` undecided | The deployment ledger; D11                            |
| Migration headers             | "NOT applied by repository tooling"                           | The deployment ledger. SQL files are not edited (D3). |
| Version-history design spec   | Revisions proposed without mechanism, cadence or retention    | D8                                                    |

New ADRs are needed for revision capture, lifecycle (Archive and Trash), and activity events. The terms Archive, Trash, revision and activity go through `docs/glossary.md`'s naming process before they become durable schema vocabulary. Table and column names in this document are working labels.

## 4. Required invariants

Each invariant needs at least one test that fails when it is broken. Negative cases (a caller trying to violate it) are required, and a test must be shown to detect a deliberately weakened policy.

**Security and ownership (retained from the current system)**:

- **INV-1** Every owned table has RLS enabled, policies `to authenticated` using `(select auth.uid())`, immutable owner, column-level write grants, and no `anon` access.
- **INV-2** No service-role key in application runtime. Trigger and cleanup functions are `SECURITY DEFINER` only when needed, live in `private`, set an empty `search_path`, and have `EXECUTE` revoked from public roles. Client-callable functions are `SECURITY INVOKER` unless explicitly justified.
- **INV-3** Types are generated from migrations, committed, and checked by CI.
- **INV-4** Fail visibly. A missing composition or content row, or an unsupported version, is an error, never an empty value.

**Dashboard composition (D3, D4, D8)**:

- **INV-5** Every Dashboard has exactly one composition from the moment it exists, at revision 1, with a default equal to `createComposition()` in `@synapcity/domain-dashboards`. A parity test enforces it.
- **INV-6** Clients cannot INSERT or DELETE compositions. UPDATE is limited to `composition`, `schema_version` and `revision`.
- **INV-7** `new.revision = old.revision + 1` or the update fails with a dedicated conflict error. This is database-level compare-and-swap. `schema_version in (1)`. The application contract is 64 KiB of compact JSON. The database backstop is `octet_length(composition::text) <= 131072`, because `jsonb::text` adds spacing and exact parity is impossible.

**Revisions (D8)**:

- **INV-8** A revision is an immutable complete restorable state: composition, `schema_version`, name, description, icon, tags. It is written only by the database. Clients have SELECT on their own rows and nothing else.
- **INV-9** `sequence` is monotonic and unique per Dashboard, assigned under a lock that **every** capture path takes (section 9, item 1). It is a different number from the CAS `revision`.
- **INV-10** The initial revision is written in the same transaction as the composition's creation. Backfilled compositions get source `backfill`, authored by the owner.
- **INV-11** Pre-image checkpoint policy (section 6). The dedupe hash covers the full state, not only the content.
- **INV-12** A revision is never created from a state that failed validation or lost a CAS race. Pin, view, archive and trash changes never create one.
- **INV-13** Retention: at most 500 automatic revisions per Dashboard. Prune the oldest. Never prune the newest. Named versions (later) are exempt and do not count toward the cap.

**Metadata (D5)**:

- **INV-14** The D5 limits hold in both PostgreSQL and the shared zod schemas, from one set of constants in `@synapcity/domain-records`. Constraints are added `NOT VALID`, then `VALIDATE`d after a read-only aggregate check. Nothing is silently truncated.

**Lifecycle (D6)**:

- **INV-15** State is derived: trashed if `deleted_at` is set, else archived if `archived_at` is set, else active. Lifecycle timestamps are server-stamped. A trashed row accepts no change except restore. A Dashboard's composition is read-only while the Dashboard is trashed.
- **INV-16** `DELETE` is allowed only on a trashed row owned by the caller. Account deletion still cascades.
- **INV-17** Deleting a Space removes only its memberships. Deleting a Document or Dashboard cascades its participation, content and revisions. Participation inserts into a trashed Space or item are refused.

**Activity (D9)**:

- **INV-18** `activity_events` is append-only, has no FK to the subject, has an owner FK that cascades, and is written only by database triggers or functions. Metadata is at most 16 KiB and carries no content. Pin and view produce no event. The account-deletion cascade must not raise a foreign-key error (the guard is verified).

**Documents and identity (D4b, D10, D11, D12)**:

- **INV-19** Every Document has exactly one content row from creation. The envelope has its own `schema_version in (1)`. Content writes use the same `+1` rule. Media is never embedded. The serialized contract is 2 MiB of compact UTF-8 for the whole stored envelope, with a database backstop of 4 MiB of `jsonb::text`.
- **INV-20** Account deletion and avatar replacement cannot leave an unrecorded public object. Removal failures are recorded durably in a private queue and drained by a runner. The runner needs a service-role credential, so it needs the owner's approval before it exists.

## 5. Migration constraints

- **M-1** Forward only. Merged migrations are never edited. Create files with `supabase migration new`, never by hand-naming. Regenerate types with `pnpm db:types` in the same PR.
- **M-2** Database release 1, in this order, after the existing migration 13: `composition_integrity`, `dashboard_revisions`, `composition_initialization`. Revisions precede initialization so backfilled compositions are captured by the same trigger. `resource_metadata_bounds` is independent and ships in the same push. Deploy together, behind the gates.
- **M-3** Later order: lifecycle (`resource_lifecycle_columns`, `resource_lifecycle_rules`), then activity (`activity_events`, `activity_capture`), then `create_record_in_space`, then Documents (`document_contents`, `document_revisions`, `document_content_initialization`), then `storage_cleanup_queue`.
- **M-4** One concern per migration, each in its own transaction, additive where deployed data exists (expand and contract). New constraints on tables that may hold rows use `NOT VALID`, then `VALIDATE`. No destructive down migrations. No `db reset` or `migration repair` against hosted.
- **M-5** Every migration must leave the application on `main` working. The current app sends `revision` on update, so the `+1` rule is compatible and a database-assigned `revision` is a later contract step if ever wanted. Its first-save insert branch becomes unreachable after initialization, and removing it is a post-deploy app change.
- **M-6** Backfills are idempotent (`where not exists`) and are tested by running the backfill statement after deleting rows as superuser inside a rolled-back transaction.
- **M-7** The revision policy values live in one `private` function. Tests redefine it inside a rolled-back transaction. Never use a runtime setting (GUC) for policy: any session can change one.
- **M-8** Run the Supabase advisors after the migrations (new definer functions and the public tag-validation function will be listed) and triage the findings.
- **M-9** Hosted DDL takes brief locks. Check `lock_timeout` behavior for any change to a populated table.

## 6. Revision semantics (summary)

- **Persistence** (autosave) writes the head. Dashboards: a 400 ms trailing debounce, single-flight, flush when the tab hides, one automatic retry. Each accepted write increments the CAS `revision`.
- **Checkpoint** chooses which head states become revisions. **Pre-image at burst boundaries:** a save arriving after a quiet gap **G = 5 minutes** from `OLD.updated_at` freezes the stored head (the previous burst's final state) as a revision before overwriting it. If a burst runs past **M = 30 minutes** since the latest revision and the head differs from it, the next save's pre-image is also frozen. The database clock decides.
- **Dedupe:** skip when the SHA-256 of the canonical full-state snapshot equals the latest revision's.
- **Metadata edits** never snapshot the new state. They may freeze the old state only if it exists in no revision.
- **Initial** snapshot at creation. **Restore** (later) always creates a new revision and never rewrites history.
- **Atomicity:** capture is a `BEFORE UPDATE` trigger in the same transaction as the write. A writer that loses the CAS matches zero rows, fires no trigger, and creates no revision.
- **Direct Data API callers** hit the same triggers. A stale caller sending `its base + 1` fails the `+1` rule, so blind overwrite is impossible.
- **Concurrent tabs** serialize on the composition row. The loser gets a conflict. An automatic retry after a lost response must be idempotent: on zero rows, read back, and report success if the stored content equals what was submitted at `expected + 1`.

## 7. Review of delegated assumptions

| Assumption                                       | Verdict                           | Evidence and notes                                                                                                                                                                                                                                                                                                                          |
| ------------------------------------------------ | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| G = 5 min, M = 30 min against debounced saves    | Confirmed, with two corrections   | In-burst saves arrive every few seconds or faster, so G is about two orders of magnitude larger and a drag cannot split into bursts. The database clock prevents client skew. Corrections: full-state hash, and a shared capture lock (section 9, items 1 and 2). Values are defaults without usage data.                                   |
| `{"lexical": null}` envelope                     | Viable, with refinements          | Keeps Lexical internals out of SQL; separates `schema_version` from node versions. Needs one `isEmptyDocument` predicate (null and Lexical's empty root both mean empty), a strict-or-tolerant envelope schema, and boundary sanitization (NUL and unpaired surrogates are rejected by `jsonb`, verified).                                  |
| 2 MiB vs 64 MiB cap vs 500 revisions (Documents) | Consistent, with limits to know   | The 500 cap binds below about 131 KB average revision size; the 64 MiB cap binds above. At maximum size, history depth is about 25 revisions (one to two days of work). The byte cap is logical (`jsonb::text` bytes), not on-disk. There is no per-account storage quota. These Document values are agent parameters, not owner decisions. |
| 128 KiB composition and 4 MiB document backstops | Plausible, one measurement needed | `jsonb::text` was 22% larger than compact JSON on a small example. The 2× margin must be confirmed on real compositions and Lexical states.                                                                                                                                                                                                 |
| Cascade guard for activity events                | Verified                          | Inside a cascading delete trigger the owner row is already invisible, so "skip if the owner no longer exists" works.                                                                                                                                                                                                                        |
| Conflict signal                                  | Revised                           | PostgREST maps class `40` (including `40001`) to HTTP 500. Use a custom SQLSTATE outside the mapped classes.                                                                                                                                                                                                                                |
| Free-plan sizing                                 | Unverified                        | ADR-0006 records the Free plan. The current plan and limits were not re-checked.                                                                                                                                                                                                                                                            |

## 8. Technical verification items

None of these reopens a Decided item. Each is something to prove before relying on it.

| ID   | Item                                                                                                                                                                                                             | How                                                     | Blocks         |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | -------------- |
| V-1  | Conflict error code: choose a custom SQLSTATE outside classes `40` and `P0`; confirm PostgREST status and that supabase-js exposes it in `error.code` (server-data classifies by code, not message).             | Local stack through PostgREST                           | Slice 1        |
| V-2  | Capture serialization: a composition save and a Dashboard rename racing must neither violate `(dashboard_id, sequence)` nor deadlock; confirm behavior under the 8 s `lock_timeout` seen locally.                | Two-session concurrency test                            | Slice 1        |
| V-3  | Full-state dedupe: rename, then save, produces the expected revision; an unchanged save produces none.                                                                                                           | SQL test                                                | Slice 1        |
| V-4  | NUL and unpaired surrogates: define sanitize-or-reject at the application boundary for names, descriptions, tags, composition strings and Lexical text. Decide user-visible behavior only if it changes content. | Unit tests; `String.prototype.isWellFormed`             | Slices 1, 2, 5 |
| V-5  | Real Lexical round trip through `jsonb`: custom nodes, nested structures, large numbers; envelope strictness; the empty predicate.                                                                               | Round-trip test against the editor package              | Slice 5        |
| V-6  | Document autosave cadence and write amplification: save latency, WAL and TOAST cost for a near-limit document; choose a debounce longer than 400 ms from measurements.                                           | Measured benchmark                                      | Slice 5        |
| V-7  | Revision pruning cost and byte accounting: define `content_bytes`, measure prune latency in the save transaction, and measure on-disk size against logical bytes.                                                | Seeded benchmark                                        | Slices 1, 5    |
| V-8  | Account deletion with a large cascade (many revisions and events) against the `authenticated` 8 s statement timeout (local; hosted not checked). If it times out, design chunked or deferred deletion.           | Seeded volume test; read hosted role settings read-only | Slices 1, 3, 5 |
| V-9  | Slice 3: can PostgREST filter an embedded count (`space_documents(count)`) by the joined row's lifecycle state? Otherwise use a `security_invoker` view or a function.                                           | PostgREST docs and a local test                         | Slice 3        |
| V-10 | A staged-backfill test harness: apply the backfill statement after deleting rows, inside a rolled-back transaction.                                                                                              | SQL test helper                                         | Slices 1, 5    |
| V-11 | Real size ratios of `jsonb::text` to compact JSON for compositions and Lexical states, to confirm the 2× backstops.                                                                                              | Measure realistic fixtures                              | Slices 1, 5    |
| V-12 | `user_preferences`' 16 KiB `::text` check has the same property as the composition one. Verify how the application measures it.                                                                                  | Read `server-account` preferences code                  | none (tracked) |
| V-13 | Hosted pre-deploy aggregates (read-only, counts and lengths only): Dashboard count, name, description and tag lengths, plus advisor output and the `ensure_rls` event trigger.                                   | Operator, behind D2                                     | Hosted deploy  |
| V-14 | Current hosted plan and database size limits.                                                                                                                                                                    | Operator, read-only                                     | Sizing only    |

## 9. Issues the implementation-planning agent must address

1. **Shared capture lock.** The composition-save capture and the Dashboard-metadata capture touch different rows. Both must take the same lock (the composition row `FOR UPDATE`, or an advisory transaction lock keyed by Dashboard) before computing `sequence`. The composition path must not lock the Dashboard row. This keeps lock order fixed and avoids deadlock. (V-2)
2. **Full-state hash.** The dedupe hash covers the whole snapshot, not only the content. (V-3)
3. **Conflict error code.** Do not use `40001`; choose and verify a custom code. (V-1)
4. **Text hygiene.** U+0000 and unpaired surrogates fail `jsonb` and `text` writes. Handle them at the application boundary for every text or JSON field. (V-4)
5. **Document history depth and cost.** Choose and measure the Document autosave debounce, and surface the shallow history of near-limit documents (about 25 revisions) in the Slice 5 acceptance. (V-6, V-7)
6. **Deletion volume.** Plan for the 8 s statement timeout on account deletion with large cascades. (V-8)
7. **No account-level quota.** Resource counts and aggregate history size are unbounded per account. This is an open capacity and abuse risk. Report it to the owner as a finding. Do not decide a quota.
8. **Test harness features.** Policy-function redefinition in a rolled-back transaction, a staged-backfill helper, two-session concurrency tests, and a lock for the shared local Supabase stack. All worktrees use `project_id = "synapcity"`, so database tests collide unless serialized.
9. **Idempotent save retry.** The scheduler's automatic retry can report a false conflict when the first attempt applied. Fix it in the data-access layer (section 6).
10. **ADR and glossary work.** Write the amendments in section 3, and run the glossary naming process for Archive, Trash, revision and activity.
11. **Fixtures and seeds follow the triggers.** Scenarios never insert compositions, revisions or content rows. Seeders insert Dashboards and Documents and let the triggers do the rest.
12. **Deployment ordering per slice.** Implementation, local test, PR verification, approved hosted migration, post-migration check, then application release. A slice stays "deployed: incomplete" until the post-migration check passes.
13. **Service-role runner approval.** The avatar cleanup runner is security-consequential and needs the owner's explicit approval before it is specified further.
14. **Trashed-row interactions.** Check every list, count, embed and participation query for the lifecycle filter; the member-count behavior is unverified (V-9).

## 10. Operational safety requirements

- No hosted mutation (migrations, Auth, Storage, Vercel, GitHub protections) without explicit owner approval, and none during planning or specification.
- Dev tooling (`db:types`, the seeder, test runners) refuses non-loopback database targets unless an explicit, reviewed override exists. A comment is not a guard.
- Release order is database, verify, then application. Hosted verification is read-only and compares the migration ledger and the catalog.
- Hosted pre-checks use counts and length aggregates only. Never read user row contents.
- The agent-side Supabase tool is not scoped to read-only. Use list and read calls only, and never treat its availability as proof of safe project scoping.
- Never print credentials, tokens or connection strings.
- The full pre-deployment checklist is Section G of the roadmap.

## 11. Non-goals

- This document does not contain slice specifications, PR boundaries, UI design, or a dependency graph. The implementation-planning agent owns them.
- It does not authorize any change to code, migrations, hosted systems, or git tracking. `docs/audits/` remains git-ignored by the owner's uncommitted `.gitignore` edit, and this file is untracked until the owner commits it.
