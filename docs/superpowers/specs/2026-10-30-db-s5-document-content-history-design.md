# S5: Document Content and History Capture

**Status:** Proposed.

- Persistence is implementation-ready: D12 is Decided; D4b and the Document retention values are agent parameters (AH §2, §7).
- Lexical is the accepted editor direction (`PRODUCT.md`, `docs/glossary.md`) and the owner gave a conditional approval on 2026-10-30. The outstanding gate for the editor layer is:
  - selecting the exact version against the npm registry when the editor layer begins (AGENTS §7a);
  - verifying compatibility (V-5);
  - the editor implementation itself.
- Package ownership follows the workspace conventions: the content contract in `domain-documents`, the editor runtime in `frontend-editor` (created when the editor and body are approved, which this slice's editor layer is). Re-opened only if implementation finds a genuine conflict.
- V-4 to V-8, V-11, V-15 and V-16 do not block starting the slice. They block S5 IC, and V-6, V-8 and V-15 also block T3 (roadmap section 1).

**Date:** 2026-10-30
**Roadmap:** [database execution roadmap](../plans/2026-10-30-database-execution-roadmap.md), slice S5, release train T3
**Contracts:** [database architecture handoff](2026-10-30-database-architecture-handoff.md) D4b, D8, D12; INV-2 to INV-4, INV-8 to INV-13, INV-15, INV-19; M-3; §6; §9 items 4 and 5
**Branch:** `db/s5-document-content`, stacked on S1 and S3. Merges as (m) the three migrations, types and database tests, then, after T3, (a) the contract, data access, actions, editor and E2E.
**Preview safety:** pushed only after Preview isolation holds (roadmap section 5a, PI-3); development and local verification do not wait for it.

## A. Identity and scope

- **Capability:** the owner writes in a Document. Content autosaves, survives reload, and a stale tab gets a conflict instead of overwriting. History is captured from the Document's first state. A trashed Document's content is read-only.
- **Problem:** Document content has no model (RS-02). The page says writing isn't available.
- **Exists:**
  - `public.documents`;
  - the read-only page `apps/web/src/app/(protected)/[userId]/home/documents/[documentId]/page.tsx` and `DocumentView`, whose dashed note is the one region this slice replaces;
  - `next.config.ts` `serverActions.bodySizeLimit: '3mb'`;
  - S1's revision machinery and the Dashboard save scheduler pattern (`features-dashboards/src/frontend/storage/save-scheduler`).
- **In scope:** three migrations; the shared `+1` function; the content envelope contract; data access with the idempotent retry; Server Actions; the Lexical editor in the page; autosave; history capture; fixtures; tests; documentation.
- **Out of scope:** the history UI (S7), media, collaboration, search, import and export.
- **Dependencies:**
  - I: S1, S3, F5.
  - R: T2 RC before T3.
  - G: Lexical version selection and compatibility (V-5), before the editor layer is built. The persistence layer and its tests can be built first on the same branch.

## B. Data model and persistence

**1. `document_contents`**

- Columns:
  - `document_id uuid pk references public.documents(id) on delete cascade`;
  - `owner_id uuid not null references auth.users(id) on delete cascade`;
  - `content jsonb not null check (jsonb_typeof(content) = 'object')`;
  - `schema_version int not null check (schema_version in (1))`;
  - `revision bigint not null check (revision >= 1)`;
  - `content_bytes int not null`, defined as `octet_length(content::text)`, kept by trigger;
  - `updated_at timestamptz not null default now()`.
- Backstop `check (octet_length(content::text) <= 4194304)`.
- RLS select and update own. `grant select; grant update (content, schema_version, revision)`. No insert and no delete grant.
- `set_updated_at` trigger.
- Replace S1's composition-specific function with `private.enforce_revision_increment()`, generic over `new.revision` and `old.revision`, used by both tables. This is a forward migration that rebinds the composition trigger.
- Trashed read-only: `private.enforce_parent_not_trashed()` from S3 is generalized, or a sibling function is added, for `documents.deleted_at`.

**2. `document_revisions`**

- The same shape as `dashboard_revisions`, with `content` in place of `composition`.
- A policy function `private.document_revision_policy()` returns `(gap '5 minutes', span '30 minutes', cap 500, cap_bytes 67108864)`. These are agent parameters (AH §7).
- Pruning removes the oldest automatic revisions until both caps hold, and never the newest.
- Capture follows S1:
  - initial or backfill `AFTER INSERT` on `document_contents`;
  - a pre-image checkpoint `BEFORE UPDATE`;
  - a metadata pre-image `BEFORE UPDATE OF name, description, icon, tags` on `documents`;
  - the shared capture lock on the content row;
  - the full-state hash.
- Extract the shared capture function only where the two kinds' code is identical. Otherwise keep two functions with the same structure.

**3. `document_content_initialization`**

- `AFTER INSERT` on `documents` creates `{"lexical": null}` with `schema_version 1` and `revision 1`.
- Set-based, idempotent backfill for existing Documents.
- Client INSERT is not granted at all, so there is nothing to revoke.

**Invariants:** INV-19, plus INV-8 to INV-13 for Documents.

**Lifecycle lock protocol (V-15):** S3's rule applies unchanged.

- `documents_lifecycle_lock_child` (`BEFORE UPDATE OF deleted_at` on `documents`) locks the `document_contents` row.
- Content writes lock only the content row, and read `documents.deleted_at` in their BEFORE trigger.
- Two-session tests cover both orders, plus a variant without the lock trigger that must fail.

**Concurrency:**

- Writers serialize on the content row; the loser gets a conflict.
- A rename racing a save takes the same lock (S1's V-2 pattern, re-tested here).

**Cost budgets (V-6, V-7).** Pass/fail on the local stack, 100 runs. These are agent parameters the owner may overrule.

- **B-3, save:**
  - Saving a 2 MiB compact Document takes at most 1,000 ms at p95, from Server Action receipt to response.
  - The WAL generated per save is at most 4× the compact content bytes (from `pg_stat_wal` deltas).
- **B-4, debounce:** continuous typing produces at most one save per 2 s. The starting value is a 1,500 ms trailing debounce with a 5 s maximum wait. The measured write rate is recorded.
- **B-5, prune:** with a Document at the 64 MiB history cap, a save that checkpoints and prunes adds at most 200 ms at p95.
- **On a miss:** S5 IC fails and T3 is blocked until the design changes, for example deferred pruning. A lower content limit would be an owner decision.

**Existing records:** every Document gets `{"lexical": null}` at revision 1 and one `backfill` revision.

## C. Domain contracts and validation

The contract lives in `@synapcity/domain-documents`, named in the workspace conventions (owner decision 2026-10-24), created with this slice's contract.

```ts
export const DOCUMENT_CONTENT_SCHEMA_VERSION = 1;
export const MAX_DOCUMENT_CONTENT_BYTES = 2 * 1024 * 1024;
// compact UTF-8 of the whole envelope (INV-19)

export const documentEnvelopeSchema = z.strictObject({
  lexical: z.null().or(serializedEditorStateSchema),
});
// strict: no sibling keys

export function isEmptyDocument(e: DocumentEnvelope): boolean;
// null, or Lexical's empty root

export function parsePersistableDocument(
  input: unknown,
):
  | { ok: true; envelope }
  | { ok: false; reason: 'invalid' | 'too-large' | 'invalid-text' };
```

- `serializedEditorStateSchema` validates the envelope's structural minimum: a `root` object with `children`. Node-level parsing stays in the editor boundary (Lexical's `parseEditorState` with the registered nodes).
- Text hygiene uses `isStorableText` from `domain-records` on every string in the tree (V-4).
- Unknown node types are rejected at save, with a validation failure.

## D. Data access and application integration

- **`server-data/src/documents/document-contents/document-contents.ts`** (new, mirroring the compositions module):
  - `loadDocumentContent(client, id): Promise<StoredDocumentContent>`, where a missing row throws `content_missing` and an unsupported version throws.
  - `saveDocumentContent(client, id, content, expectedRevision): Promise<SaveContentOutcome>`, with the single CAS path, the conflict SQLSTATE mapping and the idempotent read-back (AH §6).
  - The content type is `unknown`, so `server-data` stays free of the document domain, the same rule as compositions.
- **Server Actions:** `apps/web/src/features/documents/server/actions/document-content-actions.ts` has `saveDocumentContent(documentId, envelope, baseRevision)`. It validates with `parsePersistableDocument` before any database call, then `getCallerIdentity`, the save, and outcome mapping. The 3 MB body limit covers 2 MiB of content plus overhead.
- **Page:** `documents/[documentId]/page.tsx` loads content on the server next to `findRecord`, using the request-scoped `cache()` from S10.
- **Save scheduler:** first check whether `features-dashboards`' `connectSaves` can be reused without a Dashboard dependency.
  - If it can, move it to a shared frontend package only with the second consumer's evidence. This is that evidence, and it needs a placement approved under ADR-0014.
  - Otherwise write a Document-local scheduler with the same behavior: debounce, single-flight, one retry, a hidden-tab flush, `beforeunload`, and status.
- **Trashed Documents:** the page renders the editor read-only. The action refuses saves through `trashed_read_only`.

## E. Factories, fixtures and seeds

- `dev-fixtures/src/scenarios/documents.ts`:
  - Documents with the default envelope;
  - one rich-content sample (headings, lists, links, code);
  - a revision chain produced by real saves through the seeder.
- Scenarios never insert content rows.
- A boundary fixture just under 2 MiB, and one just over, for tests.

## F. Frontend and user experience

- **Editor:**
  - Lexical, in `frontend-editor` (the runtime, nodes and plugins), with the node set needed for the rich sample. `apps/web` keeps only the host composition: the Server Actions, the page and the save wiring.
  - Plain toolbar actions from `frontend-ui`.
  - Fonts follow ADR-0003 tokens (`--font-body`, `--font-code`); there are no font declarations in components.
- **Placement:** the editor replaces the dashed note in `DocumentView`; the reading layout from S3 of the Document plan is kept.
- **States:**
  - empty: a placeholder;
  - saving, saved and failed with Retry, and conflict with Reload, mirroring Dashboard `save-status` wording;
  - near-limit warning at 90% of 2 MiB;
  - over-limit: the save is refused, with a message.
- **Accessibility:** the editor is a labeled `textbox` region; status changes are announced; keyboard formatting shortcuts are documented in a help popover.
- **Responsive:** full width at 400 px, with the toolbar wrapping.
- **Shallow history:** the acceptance notes that near-limit Documents keep about 25 revisions (AH §9 item 5). S7 surfaces it in the UI.
- **Storybook:** editor empty, rich, saving, conflict, failed, near-limit and read-only (trashed), each with axe.

## G. Verification

| Layer                   | Test                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SQL                     | default envelope at insert; staged backfill; 4 MiB backstop boundary; version whitelist; `+1` rule; initial, checkpoint and metadata pre-image capture; prune by count and by bytes with a redefined policy; trashed read-only; cascades on permanent delete and on account delete; no client insert or delete                                                                                                                                                                                                                                                         |
| Two-user                | owner versus other user for content and revisions; a direct revision jump returns the conflict code                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Concurrency (V-15)      | content save against a move to Trash, in both orders; restore against save; without the lock trigger the test must fail                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Transport (V-16)        | an E2E under `test:e2e:local-session` against the production build the runner starts: (a) an envelope of 2 MiB − 1 KiB compact, typical prose, saves and reloads equal; (b) the same size made of quotes, backslashes and astral characters (worst-case escaping in the Server Action encoding) saves; (c) 2 MiB + 1 byte is refused by `parsePersistableDocument` with the over-limit message, not by the transport. If (b) exceeds the 3 MB `bodySizeLimit`, S5 IC fails, and the fix (raising the limit, or changing the payload encoding) is reviewed in the slice |
| Concurrency             | two saves from one base; a rename racing a save                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Round trip (V-5)        | Lexical serialize, then `jsonb`, then parse fidelity with nested structures, large numbers and custom nodes; envelope strictness; `isEmptyDocument` for both empty forms                                                                                                                                                                                                                                                                                                                                                                                               |
| Unit                    | `parsePersistableDocument` (size in compact UTF-8, text hygiene, strictness); data-access outcomes and idempotent retry                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Measurement (pass/fail) | budgets B-3 to B-5; V-8 budget B-2 from the S1 spec with S5's volume (20 Documents at 1 MiB with full history); V-11 ratio for Lexical states, failing above 2.0                                                                                                                                                                                                                                                                                                                                                                                                       |
| Component and Story     | editor states with axe                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| E2E (local session)     | type, reload, content persists; second tab conflict; over-limit refused; trashed Document read-only                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Repository              | `pnpm verify`, `pnpm db:test`, `test:db`, `pnpm db:types` with no diff                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

## H. Completion criteria

**IC:**

- section G passes and the measurements are recorded;
- documentation lands:
  - a Document content ADR (envelope, limits, history retention values);
  - the glossary entry for Document content if new terms are introduced;
  - the README of the owning package.

**RC:**

- T3 applied;
- post-check: content rows equal Documents, and each has ≥ 1 revision (counts);
- app deployed;
- production smoke with a throwaway account;
- ledger entry.
- G-quota-T3: the owner's explicit risk acceptance of unbounded per-account Document content and history, with F4's monitoring scheduled, is recorded in the ledger.

## I. Risks and integration

- **Write amplification** for near-limit Documents (V-6).
- **The 64 MiB per-Document history cap** gives shallow history at maximum size.
- **No per-account quota** (AH §9 item 7; reported, not decided).
- **Lexical version upgrades** change node versions inside the envelope. The envelope `schema_version` stays 1 until the envelope itself changes.
- **Cross-slice:** S4's `create_document` gets content automatically from the trigger.
