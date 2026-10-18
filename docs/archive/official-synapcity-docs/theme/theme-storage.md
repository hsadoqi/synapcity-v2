# Theme Storage

Theme storage should persist user intent, stable theme identity, and scope assignments — not generated CSS.

---

## V0 Records

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

`ThemeRecord.id` is the value rendered as `data-theme-id` when that saved theme is explicitly applied.

`ThemeAssignment.scopeId` is the object being themed and should be rendered separately as `data-theme-scope-id`.

---

## Persist

- saved theme id
- theme name
- primary OKLCH seed value
- accent OKLCH seed value
- theme version
- timestamps
- explicit theme assignments by scope type and scope id

---

## Do Not Persist As Canonical Data

- generated CSS variables
- generated `--primary-*` values
- generated `--accent-*` values
- semantic token values from `globals.css`
- preview-only state

Generated values may be cached later for performance, but the saved OKLCH seeds remain the source of truth.

---

## Identity Rules

- Palette generation does not create a new theme id.
- Editing an existing theme keeps the same theme id and updates `version`/`updatedAt`.
- Creating a new theme creates a new theme id.
- Applying a different saved theme to a scope changes the scope's rendered `data-theme-id`.
- Inherited scopes do not need a `data-theme-id`.

---

## Local Storage

Local storage is acceptable for early implementation and demos.

Production persistence should move to the database once users, workspaces, and sharing exist.

---

## Future Fields

Future versions may add optional fields for:

- `radiusBase`
- `fontScale`
- density preference
- motion preference
- theme import/export metadata

These should remain optional and inherit through cascade when absent.

---

## Migration Rule

Because theme structure will evolve, stored themes should include a schema or record version.
