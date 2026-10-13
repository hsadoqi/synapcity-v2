# Discovery ledger

**Status:** Research / evidence — non-authoritative

This directory preserves possibilities, hypotheses, deferred ideas, and revisit conditions that are useful enough not to lose but are not current requirements.

> **A discovery entry is not a requirement, approved plan, accepted ADR, canonical name, package authorization, roadmap commitment, or implementation instruction.**

Discovery helps future investigation remember why an idea mattered and what present-day constraint, if any, it should influence. It must never be used to bypass `PRODUCT.md`, `docs/glossary.md`, accepted ADRs, the ADR candidate list, or the approval gates in `AGENTS.md`.

## States

| State                 | Meaning                                                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Exploration**       | An interesting possibility with no commitment and insufficient evidence for formal planning.                                         |
| **Candidate**         | A plausible future direction with some evidence and a defined reason to revisit. Still not approved.                                 |
| **Deferred**          | Deliberately considered and postponed because the present phase does not need it or evidence is insufficient.                        |
| **Revisit Triggered** | A recorded trigger has occurred. Investigation may begin; the idea is still not approved.                                            |
| **Promoted**          | The idea has entered a formal investigation, specification, decision, or planning process. The authoritative result lives elsewhere. |
| **Rejected**          | An authorized decision declined the idea. Retained for lineage and reconsidered only with materially new evidence.                   |

Only an authorized human decision may move an entry to **Promoted** or **Rejected** when that movement implies product or architecture judgment. **Revisit Triggered** authorizes investigation, not implementation.

## Lifecycle

```text
discovery entry
  -> trigger/evidence
  -> formal investigation or design
  -> human decision
  -> ADR/specification/plan if accepted
  -> implementation issue only after approval
```

The discovery entry remains as lineage. It does not mutate into the governing artifact.

## Required fields

Every entry records:

- **Status**
- **Why it matters**
- **Current-phase impact**
- **What is not decided**
- **Revisit trigger**
- **Architectural implication today**

Optional fields may include origin, supporting evidence, related entries, or a promoted/rejected decision link.

## Guardrails

- Working labels do not adopt terminology.
- A possible package name does not authorize a package.
- A future consumer may justify avoiding gratuitous coupling; it does not justify building speculative portability.
- Repetition across discovery entries is not independent corroboration.
- Previous-implementation ideas remain evidence subject to the preservation policy.
- Version-sensitive claims must be rechecked when an entry is revisited.

## Current ledger

- [Phase 2 discovery ledger](phase-02-ledger.md)

## Source-material boundary

Raw or private discovery material may be consulted as temporary investigation input without becoming repository documentation. Durable repository artifacts preserve useful reasoning, unresolved questions, architectural implications, and revisit conditions at the appropriate authority level. Source material does not acquire repository authority merely because it was consulted.
