# Scoped Themes

Scoped themes allow parts of Synapcity to apply an explicit saved theme while unthemed children continue inheriting through CSS cascade.

---

## Hierarchy

```text
Root
  ↓
Root
  ↓
Dashboard
  ↓
Document
  ↓
Widget / Panel
```

Root/app level must always provide a default theme so every child scope inherits valid variables.

---

## Explicit Theme Assignment

A scope only generates and applies palette variables when it has an explicit assignment to a saved theme record.

```ts
type ThemeAssignment = {
  id: string
  scopeType: 'root' | 'dashboard' | 'document' | 'panel' | 'widget'
  scopeId: string
  themeId: string
}
```

Example DOM output:

```html
<section
  data-theme-scope="dashboard"
  data-theme-scope-id="dash_123"
  data-theme-id="theme_456"
  data-theme-source="dashboard"
>
```

`data-theme-id` is the persisted theme record id. `data-theme-scope-id` is the id of the dashboard, document, widget, or other object being themed.

---

## Inherited Scope

If a scope has no explicit assignment, it should not generate palette variables and should not render `data-theme-id`.

```html
<section
  data-theme-scope="document"
  data-theme-scope-id="doc_123"
  data-theme-source="inherited"
>
```

This scope inherits all palette and semantic variables from its parent through normal CSS cascade.

---

## Theme Id Stability

- Palette generation does not create a theme id.
- Regenerating variables from the same saved theme keeps the same `data-theme-id`.
- Editing an existing saved theme keeps the same `data-theme-id`; the theme version or `updatedAt` changes.
- Creating a new saved theme creates a new `data-theme-id`.
- Selecting a different saved theme for a scope changes the rendered `data-theme-id`.

---

## UI Requirement

Theme UI should explain inheritance clearly.

Examples:

- “Inherited from parent scope”
- “Overridden for this dashboard”
- “Reset to parent theme”
- “Apply this saved theme to this document”

---

## Rules

- Store saved theme records separately from theme assignments.
- Store canonical OKLCH seed values, not generated CSS.
- Apply variables only at explicitly themed scopes.
- Inherited scopes should not generate duplicate variables.
- Avoid hidden theme differences that users cannot inspect.
