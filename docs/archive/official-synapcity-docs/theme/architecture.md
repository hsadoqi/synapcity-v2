# Theme Architecture

The theme system separates persisted theme identity, runtime palette generation, global semantic mapping, and component usage.

V0 theming is intentionally narrow: save OKLCH color seeds, generate palette scale variables, apply those variables to a scoped root, and let `globals.css` map semantic tokens from those scales.

---

## Pipeline

```text
Theme Editor
  ↓
Saved Theme Record
  primaryOklch
  accentOklch
  ↓
Theme Assignment
  scopeType
  scopeId
  themeId
  ↓
Theme Engine
  ↓
Palette Generator
  ↓
CSS Variable Writer
  ↓
Scoped Root Element
  ↓
globals.css semantic aliases
  ↓
React UI
```

---

## Rules

1. Persist OKLCH seed values and theme metadata, not generated CSS.
2. Generate `--primary-*` and `--accent-*` palette scales at runtime.
3. Do not derive semantic variables in runtime theme code.
4. Semantic variables are mapped in `globals.css` from generated palette variables.
5. Components consume semantic tokens only.
6. Components never compute colors.
7. Theme scopes inherit through the CSS cascade.
8. A scope without an explicit theme assignment does not generate variables.
9. `data-theme-id` refers to the persisted theme record, not the object being themed.
10. Accent color should support the UI, not overwhelm it.

---

## Scope Inheritance

```text
Root → Dashboard → Document → Panel/Widget
```

A scope with an explicit theme assignment writes generated palette variables to its own root element.

A scope without an explicit assignment writes no theme variables and inherits from the nearest parent that has applied them.

---

## Component Contract

Components may rely on semantic tokens that are defined in `globals.css`:

```css
--background
--foreground
--surface
--surface-muted
--card
--card-foreground
--primary
--primary-foreground
--accent
--accent-foreground
--border
--ring
--muted
--radius-base
--radius-sm
--radius-md
--radius-lg
```

Components should not use raw generated scale values unless they are theme-aware primitives or theme debugging tools.

---

## Runtime Scope Attributes

Explicitly themed scopes should expose:

```html
<section
  data-theme-scope="dashboard"
  data-theme-scope-id="dash_123"
  data-theme-id="theme_456"
  data-theme-source="dashboard"
>
```

Inherited scopes may expose inheritance for debugging, but should not render `data-theme-id` unless they apply their own theme:

```html
<section
  data-theme-scope="document"
  data-theme-scope-id="doc_123"
  data-theme-source="inherited"
>
```

---

## Design Intent

Synapcity's visual system should remain:

- neutral-first
- calm
- editorial
- composition-oriented
- technically precise
- accessible

The theme engine should make the product feel personal without making it visually chaotic.
