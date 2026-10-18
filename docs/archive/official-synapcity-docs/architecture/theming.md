# Theming Architecture

The primary theme documentation lives in [`../theme`](../theme/README.md).

This architecture document explains where theming fits into the V0 application.

---

## Principle

> Components consume semantic tokens. Components do not compute colors.

Synapcity supports customization without allowing every component to invent its own color logic.

---

## V0 Theme Pipeline

```text
Saved Theme Record
  primaryOklch
  accentOklch
  ↓
Theme Assignment
  scopeType + scopeId + themeId
  ↓
Runtime Palette Generator
  ↓
Scoped CSS Variables
  --primary-50 ... --primary-950
  --accent-50 ... --accent-950
  ↓
globals.css Semantic Mapping
  --background: var(--primary-50)
  --foreground: var(--primary-900)
  ↓
Components
```

The runtime engine generates palette scales only. Semantic variables are already mapped in `globals.css`.

---

## V0 Scope Hierarchy

```text
Root
  ↓
Dashboard
  ↓
Document
  ↓
Widget / Panel
```

Children inherit from parents through the CSS cascade. If a child scope has no explicit saved theme assignment, it does not generate palette variables and does not render `data-theme-id`.

Workspace may become a scope later if workspace becomes a first-class domain model.

---

## Component Contract

Components may use:

```css
background: var(--background);
color: var(--foreground);
border-color: var(--border);
border-radius: var(--radius-md);
```

Components should not calculate:

- tonal scales
- semantic token values
- foreground contrast
- accent harmony
- dark-mode transformations
- ad hoc opacity overlays

---

## DOM Debugging Contract

Explicit theme assignment:

```html
<section
  data-theme-scope="dashboard"
  data-theme-scope-id="dash_123"
  data-theme-id="theme_456"
  data-theme-source="dashboard"
>
```

Inherited scope:

```html
<section
  data-theme-scope="document"
  data-theme-scope-id="doc_123"
  data-theme-source="inherited"
>
```

`data-theme-id` is the saved theme id. It is not the document, dashboard, or widget id.

---

## Design Direction

Synapcity's default visual language is a warm, technical, editorial composition surface.

Theme customization should not turn the UI into a loud material-dashboard clone. Color should act as an accent marker, not as the entire identity of the application.
