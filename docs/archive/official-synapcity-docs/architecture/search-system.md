# Search System

Search is a future core navigation layer in Synapcity, but it is not a required V0 platform build.

V0 should leave room for search by persisting plain text projections for documents and keeping route/object metadata consistent.

---

## V0 search scope

V0 may include:

- simple document title search
- simple dashboard title search
- command menu stubs
- document `plainText` projection for future indexing

V0 does not need:

- workspace-wide search
- relationship-aware ranking
- embeddings
- saved searches
- advanced result previews

---

## Future searchable objects

- documents
- dashboards
- widgets by title/config where useful
- future organization models
- commands
- settings panels

---

## Search document shape, future

```ts
type SearchDocument = {
  id: string
  type: 'document' | 'dashboard' | 'command' | 'setting'
  title: string
  body?: string
  url: string
  updatedAt: string
  metadata?: Record<string, unknown>
}
```

---

## Rules

- Search indexing should consume public projections from features.
- Editor content should expose a plain text projection for indexing.
- Dashboards should index metadata and widget labels, not duplicate widget source content.
- Search should be introduced after document/dashboard persistence is stable.
