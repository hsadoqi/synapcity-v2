# ADR-002: Treat Dashboards as Views Over Documents

## Status

Accepted.

---

## Context

Dashboards can easily become miniature applications that duplicate information already stored elsewhere.

In V0, the main source data a dashboard should surface is document data. Future object types may be added later, but the ownership rule should be proven with documents first.

---

## Decision

Dashboards own layout, widget placement, dashboard metadata, and widget instance configuration.

Dashboards do not own the source document content displayed by widgets.

---

## Rationale

- Reduces duplicated data.
- Keeps feature ownership clear.
- Allows the same document to appear in multiple dashboards.
- Makes dashboard templates safer.
- Supports multiple views over the same information.

---

## Tradeoffs

View-driven dashboards require stronger data-source contracts.

Widgets must reference source data rather than copying it locally.

---

## Consequences

- Widget instances should reference source documents by ID.
- Source features must expose stable public read APIs/components.
- Layout persistence remains separate from document persistence.
- Future project/reference/resource/runbook widgets should follow the same ownership rule if introduced.
