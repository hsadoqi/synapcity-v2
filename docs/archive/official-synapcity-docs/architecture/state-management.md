# State Management

Synapcity has several kinds of state with different lifecycles. Treating all of them the same creates bugs, stale UI, and difficult render behavior.

---

## V0 state ownership matrix

| State type | Examples | Owner | Persistence |
| --- | --- | --- | --- |
| Local UI state | dropdown open, hover, temporary input | component | none |
| Route-scoped state | current document id, current dashboard id | route sync | URL/params |
| Feature UI state | selected widget, active inspector tab, palette open | focused Zustand store | none or local storage only if intentional |
| Dashboard layout draft | unsaved drag/resize state | dashboard grid UI store | persisted only on save |
| Persisted dashboard layout | saved breakpoint layouts | dashboard service/repository | database |
| Editor state | selection, undo stack, live editor state | editor system | serialized through document service |
| Persisted document data | title, content, plainText, summary | document service/repository | database |
| Theme editor draft | unsaved color changes, preview values | theme editor store | none until saved |
| Theme records | primary/accent OKLCH seeds | theme service/repository | database/local storage in early dev |
| Theme assignments | explicit scope-to-theme links | theme service/repository | database/local storage in early dev |
| Generated palette variables | `--primary-*`, `--accent-*` | theme runtime/provider | runtime only |

---

## Zustand store guidelines

Stores should be narrow and named by ownership.

Good:

```text
useDashboardGridUiStore
useWidgetInspectorStore
useDocumentRouteStore
useThemeEditorStore
useCommandMenuStore
```

Avoid:

```text
useAppStore
useEverythingStore
useGlobalStore
```

---

## Selector rules

Selectors should return stable values.

Bad:

```ts
const layout = useDashboardGridUiStore((state) => {
  return state.layoutsByDashboard[dashboardId] ?? {}
})
```

This can create a new object every render.

Better:

```ts
const EMPTY_LAYOUTS = {}

const layout = useDashboardGridUiStore((state) => {
  return state.layoutsByDashboard[dashboardId] ?? EMPTY_LAYOUTS
})
```

---

## Editor state rules

- Keep live editor state inside the editor system.
- Do not mirror the full document into Zustand on every keystroke.
- Persist serialized document content through the document service.
- Keep autosave status separate from editor content.

---

## Theme state rules

- Persist theme records and explicit assignments.
- Generate `--primary-*` and `--accent-*` palette variables at runtime for explicitly themed scopes only.
- Do not derive semantic variables in the theme store or runtime engine.
- Semantic variables are mapped in `globals.css` and resolve from the generated palette variables.
- Inherited scopes should not generate or store duplicate variables; they inherit through CSS cascade.

---

## Store checklist

Before adding a store, answer:

1. Who owns this state?
2. Is it local, route-scoped, feature UI, editor, theme, layout, or persisted data?
3. Does it need to survive reloads?
4. Should it be reflected in the URL?
5. Can it be derived instead of stored?
6. What clears it?
7. What selectors need stable references?
