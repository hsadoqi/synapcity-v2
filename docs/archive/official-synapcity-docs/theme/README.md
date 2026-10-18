# Theme Engine

The Synapcity Theme Engine is a runtime CSS-variable system for scoped personalization.

In V0, a saved theme stores canonical OKLCH seed values for `primary` and `accent`. At runtime, those saved seed values are used to generate palette scale variables such as `--primary-50` through `--primary-950` and `--accent-50` through `--accent-950`.

The runtime engine does **not** derive Synapcity's semantic variables. Semantic mappings live in `globals.css`, where tokens such as `--background`, `--foreground`, `--card`, `--primary`, and `--accent` point at the generated palette variables.

---

## Goals

- Persist canonical OKLCH color seeds, not generated CSS.
- Generate primary and accent palette scales at runtime.
- Write generated palette variables to the correct scoped root.
- Support scoped inheritance through normal CSS cascade.
- Keep components semantic-token driven.
- Preserve Synapcity's calm, neutral-first design language.
- Leave room for future scoped radius and typography scale controls.

---

## Core Principle

> Themes customize the product without replacing the product.

Users can choose colors and visual preferences, but the base interface should remain restrained, legible, and composition-oriented.

---

## V0 Flow

```text
Saved Theme Record
  primary OKLCH seed
  accent OKLCH seed
  ↓
Runtime Palette Generator
  ↓
Generated CSS Variables
  --primary-50 ... --primary-950
  --accent-50 ... --accent-950
  ↓
Scoped Root Element
  data-theme-id
  data-theme-scope
  data-theme-scope-id
  data-theme-source
  ↓
globals.css Semantic Mapping
  --background: var(--primary-50)
  --foreground: var(--primary-900)
  ↓
React UI
```

---

## Theme Identity Rule

`data-theme-id` identifies the persisted theme record being applied to a scope. It is not the document, dashboard, or widget id.

The themed object id should be exposed separately as `data-theme-scope-id`.

```html
<section
  data-theme-scope="dashboard"
  data-theme-scope-id="dash_123"
  data-theme-id="theme_456"
  data-theme-source="dashboard"
>
```

Palette generation must not create a new theme id. Regenerating variables from the same saved theme keeps the same `data-theme-id`. Editing the same theme record also keeps the same id; selecting or creating a different saved theme changes it.

---

## Inheritance Rule

If a scope has an explicit saved theme assignment, it generates and applies palette variables at that scope.

If a scope has no explicit saved theme assignment, it should not generate variables and should not render `data-theme-id`. It simply inherits variables from the nearest themed parent through the CSS cascade.

```html
<section data-theme-scope="document" data-theme-scope-id="doc_123" data-theme-source="inherited">
```

Root/app level must provide a default theme so every unthemed child scope inherits valid variables.

---

## Documents

| Document | Purpose |
| --- | --- |
| [Architecture](./architecture.md) | Theme pipeline and component contract. |
| [Design Tokens](./design-tokens.md) | Persisted inputs, generated palette scales, and global semantic mappings. |
| [Runtime Engine](./runtime-engine.md) | How saved OKLCH seeds become scoped palette variables. |
| [Color Generation](./color-generation.md) | OKLCH palette generation rules. |
| [Color Harmony](./color-harmony.md) | Accent generation strategies for future optional flows. |
| [Scoped Themes](./scoped-themes.md) | Inheritance hierarchy, explicit assignments, and data attributes. |
| [CSS Variables](./css-variables.md) | Variable naming and usage. |
| [Theme Editor](./theme-editor.md) | UI sections and editing responsibilities. |
| [Theme Provider](./theme-provider.md) | Runtime provider responsibilities. |
| [Theme Storage](./theme-storage.md) | What should be persisted. |
| [Typography](./typography.md) | Future font and scale token rules. |
| [Shape](./shape.md) | Future radius and border token rules. |
| [Density](./density.md) | Compact/default/comfortable modes for future implementation. |
| [Motion](./motion.md) | Duration and reduced-motion rules for future implementation. |
| [Accessibility](./accessibility.md) | Contrast, focus, and keyboard expectations. |
| [Future](./future.md) | Possible future extensions. |
