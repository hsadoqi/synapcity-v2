# Guide: Create a Theme Scope

Use this guide when adding theme customization to a surface.

V0 theme scopes should focus on root, dashboard, document, panel, and widget. Workspace can become a theme scope later if workspace becomes a first-class domain model.

---

## 1. Decide Scope Owner

V0 examples:

```text
root
dashboard
document
panel
widget
```

Only add a scope if users need meaningful customization at that level.

---

## 2. Distinguish Scope Id From Theme Id

The owning object id is not the theme id.

```ts
type ThemeAssignment = {
  scopeType: 'dashboard'
  scopeId: string // dashboard id
  themeId: string // persisted ThemeRecord id
}
```

Use `data-theme-scope-id` for the object being themed and `data-theme-id` for the saved theme record.

---

## 3. Wrap UI in Provider

```tsx
<ThemeScopeProvider scopeType="dashboard" scopeId={dashboard.id}>
  <DashboardDetailPage dashboard={dashboard} />
</ThemeScopeProvider>
```

---

## 4. Render Explicit Themes Only When Assigned

If the scope has an explicit saved theme assignment:

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

If the scope inherits:

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

## Checklist

- [ ] Scope has a parent or is the root/default scope.
- [ ] Scope id and theme id are separate.
- [ ] Explicit scopes render `data-theme-id`.
- [ ] Inherited scopes omit `data-theme-id`.
- [ ] Explicit scopes write generated `--primary-*` and `--accent-*` variables.
- [ ] Inherited scopes write no generated palette variables.
- [ ] UI can reset to parent inheritance.
- [ ] Components still use semantic tokens.
- [ ] Theme preview does not leak to unrelated scopes.
