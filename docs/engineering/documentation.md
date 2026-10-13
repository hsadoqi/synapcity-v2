# Documentation lifecycle and governance

**Status:** Canonical documentation governance

Research must not silently become canonical. This document defines how a document's authority is stated, how it changes, and how a reader (human or agent) can tell the difference between "this is decided" and "this is a hypothesis."

## Statuses

Every governing document should carry one of these statuses, either in frontmatter or in a clearly visible header line:

| Status | Meaning |
| --- | --- |
| **Canonical** | Accepted and currently governing within its stated scope. Changing it requires the approval this document type requires (see below). |
| **Current direction** | A selected direction whose detailed design remains open (e.g., "Lexical is the current direction for Documents" — the ADRs in `docs/architecture/decisions/` are the canonical record of current directions). |
| **Proposed** | A candidate awaiting approval. Not governing yet. |
| **Research / evidence** | An investigation, audit, spike, or evidence-gathering artifact for a specific decision. Describes what was found, not what is decided. Never cited as authority for a product or architecture claim — only as evidence for one. |
| **Experimental** | Describes or lives alongside deliberately exploratory implementation. Preserved per `docs/engineering/preservation-policy.md`. Not authoritative for Synapcity. |
| **Historical** | Retained for lineage. No longer governs, but explains how a current decision was reached or what was tried before. |
| **Superseded by <link** | Explicitly replaced. The document remains readable; it must point to its replacement rather than being silently deleted or rewritten. |
| **Rejected** | An approach an authorized decision explicitly declined. Kept for lineage so it isn't reconsidered without new evidence. |
| **Unknown / unclassified** | No status has been assigned yet. Treat as non-authoritative until classified — silence about status is not silence about authority. |

## Authority

A document's authority is determined by its status and its scope, not by its length, its confidence, or how many other documents repeat its claims.

- **Canonical** and **Current direction** documents (`PRODUCT.md`, `docs/product/*`, `docs/architecture/principles.md`, accepted ADRs, this document, the Definition of Done, the AI-development and AI-security documents, the preservation policy) are the current governing set.
- What is and is not decided is authoritatively determined by `PRODUCT.md`'s "Open product decisions" (product/concept and terminology dimension), `docs/glossary.md` (terminology status), and `docs/architecture/decisions/README.md`'s candidate list together with each accepted ADR's own "Unresolved" section (architecture/implementation dimension). When in doubt, check these before treating any other document's claim as settled.
- Research, evidence, and investigation artifacts (however produced) are never authority on their own — they are inputs the canonical documents already accounted for when they were written. Do not re-derive a product decision from a research artifact that a canonical document has already classified.
- The previous implementation — an external, historical evidence source, whatever repository, fork, or worktree happens to be open — is evidence, never authority. See `docs/engineering/preservation-policy.md`.

## Documentation is not every Markdown artifact

A `.md` extension does not make a file repository documentation. Task files, backlog records, generated plans, agent scratchpads, tool exports, status ledgers, and similar operational artifacts remain tool-owned or workflow-owned state unless the repository owner explicitly adopts them into the documentation lifecycle with a scope, status, approval owner, and system-of-record boundary.

Do not place tool-owned operational state under `docs/` merely to make it visible, and do not cite it as canonical documentation because it is versioned or written in Markdown. If operational evidence needs to inform a governing document, link or summarize the evidence under that document's approval process while preserving the distinction between evidence and authority. An external tool's state does not become canonical repository documentation unless it is explicitly adopted, and repository documentation does not automatically become the operational system of record for that tool.

## Approval

- Product/scope/principles/vocabulary changes: human product owner.
- Architecture-principle or ADR changes: human architecture owner (may be the same person as product owner at this stage).
- Engineering-governance documents (this file, Definition of Done, AI development, AI security, preservation policy): human repository owner.
- A document does not become Canonical by an AI agent (or any single contributor) writing it confidently. See `docs/engineering/ai-development.md`.

## Supersession

- Never delete or silently rewrite a Canonical or Historical document to reflect a new decision. Instead:
  1. Write the new decision (a new ADR, an updated section with a clear changelog note, or a new document).
  2. Mark the old document `Superseded by <link>`.
  3. Leave the old document in place and readable.
- A document's own claim of being "Canonical" is not proof it currently is — check this document's approval rule and the current open-decision state before trusting a status label you find in the wild. Documentation labels do not establish authority by themselves.

## Lineage and evidence links

Every Canonical or Current-direction claim should be traceable to a decision: an explicit human decision, a product decision record, an ADR, an approved specification, a relevant issue or plan, or Git history. A new canonical claim should be asserted alongside the record of the decision that produced it, not asserted without a traceable origin.

Do not treat repetition across descendant documents as independent corroboration. Multiple documents restating the same claim, especially when they share recent authorship or a common originating session, is one data point, not several.

## Stale-claim handling

A Canonical or Current-direction document that no longer matches observed reality (e.g., a product document claiming a capability "is not started" when code shows otherwise) is not automatically wrong about its *decision* — it may simply be stale about *implementation state*. Handle this by:

1. Flagging the discrepancy explicitly (do not silently edit the canonical claim to match whatever the code currently does — that risks laundering an unapproved implementation into canonical status).
2. Routing the discrepancy to the document's approval owner.
3. Recording it, if consequential, as a "contradiction discovered," not a "correction applied," in whatever record (an issue, a plan, a decision note) the approval owner uses to track it.

## Experimental and historical documents stay accessible

Preserving an experimental or historical document's accessibility (see `docs/engineering/preservation-policy.md`) is not the same as it governing Synapcity. A reader must be able to find prior exploration and its lessons without mistaking it for a current decision. Do not gate access to experimental/historical material behind deletion or obscurity merely because it isn't canonical — quarantine and archive it with a clear status label instead.
