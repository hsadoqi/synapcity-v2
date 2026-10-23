# CSS Variables

CSS variables are the styling mechanism for Synapcity themes.

The runtime theme engine writes generated palette variables. `globals.css` maps semantic variables to those palette variables. Components consume semantic variables.

---

## Runtime Generated Palette Variables

```css
--primary-50
--primary-100
--primary-200
--primary-300
--primary-400
--primary-500
--primary-600
--primary-700
--primary-800
--primary-900
--primary-950

--accent-50
--accent-100
--accent-200
--accent-300
--accent-400
--accent-500
--accent-600
--accent-700
--accent-800
--accent-900
--accent-950
```

These are generated from persisted OKLCH seed values.

---

## Global Semantic Variables

Semantic variables are defined in `globals.css` and point at the generated palette variables.

Example:

```css
:root {
  --background: var(--primary-50);
  --foreground: var(--primary-900);
  --card: var(--primary-50);
  --muted: var(--primary-100);
  --border: var(--primary-200);
  --primary: var(--primary-600);
  --accent: var(--accent-600);
}
```

The runtime theme engine should not derive these semantic values directly.

---

## Scope Root

Theme scopes should write generated palette variables to a scoped root element only when the scope has an explicit saved theme assignment.

```tsx
<section
  data-theme-scope="dashboard"
  data-theme-scope-id={dashboard.id}
  data-theme-id={theme.id}
  data-theme-source="dashboard"
  style={generatedPaletteVars}
>
  {children}
</section>
```

Inherited scopes should not write generated variables:

```tsx
<section
  data-theme-scope="document"
  data-theme-scope-id={document.id}
  data-theme-source="inherited"
>
  {children}
</section>
```

---

## Future Shape and Type Variables

Define stable token slots now so scoped radius and typography controls can be added later.

```css
--radius-base: 0.5rem;
--radius-xs: calc(var(--radius-base) * 0.5);
--radius-sm: calc(var(--radius-base) * 0.75);
--radius-md: var(--radius-base);
--radius-lg: calc(var(--radius-base) * 1.5);
--radius-xl: calc(var(--radius-base) * 2);
--radius-full: 9999px;

--font-scale: 1;
--font-size-xs: calc(0.75rem * var(--font-scale));
--font-size-sm: calc(0.875rem * var(--font-scale));
--font-size-base: calc(1rem * var(--font-scale));
--font-size-lg: calc(1.125rem * var(--font-scale));
--font-size-xl: calc(1.25rem * var(--font-scale));
```

V0 does not need to expose controls for these values.

---

## Rules

- Components should prefer semantic variables.
- Generated palette variables are available for theme-aware primitives.
- Do not style components directly against `data-theme-id`.
- Do not reintroduce legacy workspace-specific variables unless intentionally supported.
- Avoid component-specific variable sprawl.
