# Relationship Model

Relationships are useful only when they explain something the product can show.

V0 should keep relationships intentionally small. The goal is to support document/dashboard linking without creating a premature ontology.

---

## V0 relationship use cases

Use relationships for:

- a document links to another document
- a dashboard surfaces a document through a widget
- a widget references a source document
- a document references a dashboard, if exposed in UI

Do not use relationships yet for:

- projects
- resources
- references
- runbooks
- workspace membership
- a full knowledge graph

---

## Relationship shape

```ts
type Relationship = {
  id: string
  sourceType: 'document' | 'dashboard' | 'widget'
  sourceId: string
  targetType: 'document' | 'dashboard' | 'widget'
  targetId: string
  type: 'links_to' | 'surfaces' | 'references'
  metadata?: Record<string, unknown>
  createdAt: string
}
```

---

## Rules

- Do not infer critical relationships only from UI placement.
- Do not duplicate documents to show them in multiple dashboards.
- Prefer explicit relationship types over generic `link` when meaning matters.
- Keep relationship metadata small.
- Avoid turning relationships into hidden business logic.
- Avoid building graph features before documents and dashboards are stable.

---

## Backlinks

Backlinks are reverse views of relationship records.

If document A links to document B, document B can show:

```text
Linked from document A
```

Backlinks should be derived from relationship records, not stored separately unless performance requires a projection table.

---

## Future relationship targets

Future versions may add:

- projects
- references
- resources
- runbooks
- annotations
- document sections or blocks
- comments
- collections
