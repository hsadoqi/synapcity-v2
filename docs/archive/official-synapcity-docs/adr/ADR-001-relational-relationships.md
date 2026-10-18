# ADR-001: Model Relationships Relationally Before Introducing Graph Storage

## Status

Accepted for current architecture.

---

## Context

Synapcity is interested in connected information, but V0 should not overbuild a full knowledge graph.

The first implementation only needs relationships that support visible product behavior, such as documents linking to other documents or dashboard widgets surfacing documents.

---

## Decision

Use relational persistence with explicit relationship records for V0.

Do not introduce graph database infrastructure or a broad universal object graph until the document/dashboard/widget model proves that it needs it.

---

## Rationale

- PostgreSQL and Prisma are familiar and mature.
- Operational complexity stays lower.
- The information model is still evolving.
- Graph-like experiences can be built with explicit relationships.
- V0 should prioritize documents, dashboards, widgets, and themes over ontology.

---

## Tradeoffs

A graph database may eventually provide better traversal ergonomics for highly connected data.

However, adopting one too early would add infrastructure complexity before the relationship model is stable.

---

## Consequences

- Relationship records must be intentionally designed.
- Query helpers should hide relationship-table complexity.
- Future graph migration remains possible if traversal needs outgrow relational storage.
- Deferred organization concepts should not force graph complexity into V0.
