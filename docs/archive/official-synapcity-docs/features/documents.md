# Documents

Documents are the primary rich content objects in Synapcity V0.

They replace the earlier V0 idea of “notes.” The word `note` remains available for future lightweight use cases such as quick notes, annotations, margin notes, or comment-adjacent fragments.

Documents should feel structured, composable, and calm rather than noisy or overly chatty.

---

## User goals

- Create durable rich-text content.
- Edit and autosave document content.
- Link to other documents.
- Surface documents inside dashboards through widgets.
- View document outline and context.
- Apply or inherit a scoped theme.

---

## Core interactions

- create document
- edit document title/content
- format text
- insert internal document link
- view outline
- view linked documents/backlinks, if implemented
- surface document in dashboard widget
- apply or inherit document theme assignment

---

## Data ownership

Documents own:

- title
- slug
- serialized editor content
- plain text projection
- summary, if used
- document metadata

Relationships own:

- document-to-document links
- dashboard/widget surfacing relationships, if explicit

Dashboards/widgets may reference documents but do not own document content.

---

## V0 rules

- Use `Document`, not `Note`, for the main content object.
- Persist serialized editor content and searchable plain text separately.
- Keep live editor state inside the editor system.
- Important document links should create relationship records when visible behavior depends on them.
- Dashboards should reference documents, not duplicate document content.

---

## Future possibilities

- lightweight notes
- annotations
- block-level references
- comments
- resources/references as document sections
- project-like grouping
- document collections
