# Editor System

The editor is the foundation for creating and connecting documents in Synapcity.

V0 calls the main rich editable object a **Document**, not a note. The word `note` is reserved for future lightweight annotations, quick captures, margin notes, or comment-adjacent fragments.

---

## V0 editor contract

The document editor owns:

- editor runtime state
- selection state
- formatting commands
- undo/redo stack
- document serialization
- document link insertion
- editor plugins

The document domain owns persisted document content and metadata.

The editor does not own:

- dashboard layout
- widget config
- theme persistence
- route shell state
- future organization models

---

## Page composition

A document detail page should be a focused writing and linking surface.

```text
┌─────────────────────────────────────────────────────────────┐
│ Header: path, document title, status, actions                │
├──────────────────────────────────────────────┬──────────────┤
│ Editor Toolbar                               │ Context Rail  │
├──────────────────────────────────────────────┤ Outline       │
│                                              │ Links         │
│ Document Editor                              │ Related       │
│                                              │ Activity      │
│                                              │ Theme         │
└──────────────────────────────────────────────┴──────────────┘
```

---

## Persisted document data

```ts
type Document = {
  id: string
  title: string
  slug: string
  content: SerializedEditorState
  plainText: string
  summary?: string | null
  createdAt: string
  updatedAt: string
}
```

Persist the serialized editor state as the canonical document body. Persist plain text as a search/indexing projection.

---

## Editor state rules

- Keep Lexical/editor state inside the editor system.
- Do not mirror the entire document into Zustand on every keystroke.
- Store only persisted projections through the document service.
- Use debounced persistence for autosave.
- Derive search text from serialized content outside the render path.

---

## Linking in V0

The first version should support document-to-document links and document/dashboard/widget relationships only where useful.

V0 should support:

- insert a link to another document
- surface linked documents in the context rail
- create a relationship record for meaningful document links
- keep link behavior explicit and inspectable

V0 should not require:

- block references
- full graph navigation
- reference/resource/runbook models
- collaborative comments
- advanced transclusion

---

## Plugin pattern

Editor behavior should be added through plugins instead of one large editor component.

Examples:

- LinkPlugin
- SlashCommandPlugin
- FloatingToolbarPlugin
- DocumentOutlinePlugin
- AutoSavePlugin
- ThemeScopePlugin

---

## Future capabilities

- lightweight notes/annotations
- block references
- comments on selections
- document sections as link targets
- reference/resource panels
- dashboard widgets powered by document sections
