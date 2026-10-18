# Theme Provider

The theme provider applies generated palette variables to a React subtree when that subtree has an explicit theme assignment.

Unthemed scopes should inherit from their parent and should not generate duplicate variables.

---

## Responsibilities

- initialize the root/default theme on load
- resolve explicit theme assignments for a scope
- load saved theme records
- generate primary/accent palette variables from saved OKLCH seeds
- write generated palette variables to explicitly themed scope roots
- skip generation for inherited scopes
- hydrate without visible flashing when possible
- expose current scope metadata to children

---

## Non-Responsibilities

The provider should not:

- render the full theme editor UI
- store generated CSS as source data
- derive semantic variables already mapped in `globals.css`
- allow components to compute color scales
- know feature-specific details beyond scope ownership

---

## Suggested API

```tsx
<ThemeScopeProvider scopeType="dashboard" scopeId={dashboardId}>
  {children}
</ThemeScopeProvider>
```

---

## Explicit Theme Output

```tsx
<section
  data-theme-scope="dashboard"
  data-theme-scope-id={dashboardId}
  data-theme-id={theme.id}
  data-theme-source="dashboard"
  style={generatedPaletteVars}
>
  {children}
</section>
```

---

## Inherited Theme Output

```tsx
<section
  data-theme-scope="document"
  data-theme-scope-id={documentId}
  data-theme-source="inherited"
>
  {children}
</section>
```

---

## Provider Rules

- Keep scope resolution centralized.
- Do not scatter local-storage reads across components.
- Avoid recomputing palette variables during every render.
- Support nested scopes.
- Provide visible inheritance labels where users can edit theme settings.
- Root/app scope must always provide a default theme.
