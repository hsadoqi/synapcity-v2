# Architecture Decision Records

**Status:** Canonical ADR index and template

An ADR records one consequential, durable architecture decision: its context, what was decided, what was explicitly not decided, who governs it, what integration/verification is expected, and what would justify revisiting it. ADRs are how a founder-confirmed _technical direction_ becomes a scoped, governed decision rather than an ambient assumption.

An ADR is not required for every implementation choice. It is required before:

- adopting a consequential piece of architecture, behavior, or code from the previous implementation (see `docs/engineering/preservation-policy.md`);
- committing to a technology, schema, or persistence model that would be costly to reverse;
- resolving an item this index's candidate list, `PRODUCT.md`, or `docs/glossary.md` currently marks UNRESOLVED, where the resolution has architectural consequences.

## Numbering and status

ADRs are numbered sequentially (`0001-*.md`, `0002-*.md`, ...) and never renumbered or deleted. An ADR's status is one of:

- **Proposed** — drafted, not yet approved.
- **Accepted** — approved and currently governing.
- **Superseded by ADR-NNNN** — replaced; the old ADR remains readable for lineage.
- **Rejected** — considered and declined; kept for lineage, not deleted.

## Template

```markdown
# ADR-NNNN: <short title>

**Status:** Proposed | Accepted | Superseded by ADR-NNNN | Rejected
**Date:**
**Deciders:**

## Context

What situation, evidence, and constraints led to this decision. Cite the prior decision, product document, or governance rule this ADR resolves — self-contained, without requiring a reader to open Phase 0 discovery material or the previous implementation.

## Decision

What was decided, stated as narrowly as the decision actually is.

## Scope

What this decision governs. Be explicit about the boundary — a technology direction is not the same decision as a schema, a package topology, or a persistence model.

## What this does NOT decide

Explicitly list adjacent questions this ADR leaves open, so a reader does not assume more was decided than was.

## Unresolved

Open questions inside this ADR's own scope that remain deliberately unresolved.

## Governance boundary

Who owns changes to this decision going forward, and what approval is required to change it.

## Integration expectations

How this decision is expected to integrate with the rest of the system — dependencies, boundaries it must respect, packages/layers it may touch.

## Verification expectations

What must be true, and how it will be checked, before this decision is considered correctly implemented (tests, accessibility checks, manual verification, etc.). See `docs/engineering/definition-of-done.md`.

## Reconsideration conditions

What evidence or change in circumstances would justify revisiting this decision.
```
