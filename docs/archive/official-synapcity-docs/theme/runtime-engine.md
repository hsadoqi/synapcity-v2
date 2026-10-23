# Runtime Engine

The runtime engine turns a saved theme record into scoped palette CSS variables.

It does not derive semantic tokens. Semantic variables are already mapped in `globals.css` using generated palette variables.

---

## V0 Runtime Steps

For a scope with an explicit saved theme assignment:

1. Read the scope type and scope id.
2. Resolve the assigned persisted theme record.
3. Read the saved `primaryOklch` and `accentOklch` seed values.
4. Generate the primary tonal scale.
5. Generate the accent tonal scale.
6. Convert the generated scales into CSS variable declarations.
7. Write the generated variables to the scope root.
8. Render scope metadata attributes for debugging and inheritance visibility.
9. Avoid rewriting unchanged variables.

For a scope without an explicit theme assignment:

1. Do not generate palette variables.
2. Do not write theme variables to the scope root.
3. Do not render `data-theme-id`.
4. Continue inheriting variables from the parent cascade.

---

## Inputs

```ts
type ThemeRecord = {
  id: string
  name: string
  primaryOklch: string
  accentOklch: string
  mode?: 'light' | 'dark' | 'system'
  version: number
  createdAt: string
  updatedAt: string
}

type ThemeAssignment = {
  id: string
  scopeType: 'root' | 'dashboard' | 'document' | 'panel' | 'widget'
  scopeId: string
  themeId: string
  createdAt: string
  updatedAt: string
}
```

---

## Outputs

```ts
type GeneratedPaletteVariables = {
  '--primary-50': string
  '--primary-100': string
  '--primary-200': string
  '--primary-300': string
  '--primary-400': string
  '--primary-500': string
  '--primary-600': string
  '--primary-700': string
  '--primary-800': string
  '--primary-900': string
  '--primary-950': string
  '--accent-50': string
  '--accent-100': string
  '--accent-200': string
  '--accent-300': string
  '--accent-400': string
  '--accent-500': string
  '--accent-600': string
  '--accent-700': string
  '--accent-800': string
  '--accent-900': string
  '--accent-950': string
}
```

Future versions may also output scoped shape or typography variables, but V0 should keep those controls disabled unless explicitly implemented.

---

## Explicit Non-Goals

The runtime engine should not:

- generate new theme ids
- store generated CSS as canonical data
- derive `--background`, `--foreground`, `--card`, `--primary`, or `--accent`
- compute component-specific styles
- generate variables for a scope that is only inheriting

---

## Performance Rules

- Memoize generated scales by theme id, version, and seed values.
- Avoid rewriting unchanged variables.
- Scope writes to the nearest explicit theme root.
- Do not recompute tokens inside component render functions.
- Debounce editor preview updates.
