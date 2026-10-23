# Widget System

Widgets are modular building blocks used to compose dashboards and future workspace-like surfaces.

In V0, widgets are for connected document surfaces, not KPI panels or generic analytics cards.

---

## Goals

- Register widgets declaratively.
- Keep widget rendering independent from dashboard internals.
- Support configurable widget instances.
- Reference source data without owning it.
- Keep view mode calm and edit mode controllable.

---

## WidgetDefinition

A widget definition describes a widget type available in the registry.

```ts
type WidgetDefinition<TConfig = unknown> = {
  id: string
  label: string
  description?: string
  category: WidgetCategory
  defaultSize: { w: number; h: number }
  minSize?: { w: number; h: number }
  defaultConfig: TConfig
  render: WidgetRenderer<TConfig>
  inspector?: WidgetInspector<TConfig>
}
```

---

## WidgetInstance

A widget instance describes one widget placed on one dashboard.

```ts
type WidgetInstance<TConfig = unknown> = {
  id: string
  dashboardId: string
  widgetType: string
  title?: string | null
  config: TConfig
  sourceType?: 'document' | null
  sourceId?: string | null
}
```

A widget instance may reference a document. It does not own document content.

---

## Registry pattern

Widgets should be registered through a typed registry.

```ts
export const widgetRegistry = createWidgetRegistry([
  documentCardWidget,
  documentListWidget,
  textBlockWidget,
  quickLinksWidget,
])
```

The dashboard renderer should resolve a widget by `widgetType`, not by a switch statement.

---

## V0 widget categories

Suggested V0 categories:

- Documents
- Text
- Navigation
- Utility
- Debug

Future categories:

- Projects
- References
- Resources
- Runbooks
- Activity
- Search

---

## Widget lifecycle

1. Widget type is registered.
2. User adds widget to dashboard.
3. Dashboard creates a widget instance with default config.
4. Layout system places widget on canvas.
5. Widget renderer receives instance config and source reference.
6. Inspector updates widget config.
7. Dashboard persists widget instance and layout.

---

## Data access rules

Widgets should not reach directly into unrelated feature internals.

Preferred options:

- consume feature public APIs
- receive data from dashboard orchestration
- use query hooks exposed by the owning feature
- store only source references and small config in widget instance data

---

## V0 widget examples

### Document Card

Displays a document preview.

Configuration:

- document id
- preview length
- show updated time

### Document List

Displays selected or recent documents.

Configuration:

- document ids or query mode
- max items
- compact mode

### Text Block

Displays dashboard-local text/markdown for labels, instructions, or section framing.

### Quick Links

Displays manually configured links to documents, dashboards, or external URLs.

---

## Widget quality checklist

A widget is not complete until it has:

- a registry definition
- default config
- empty state
- loading state
- error state
- compact rendering behavior
- responsive minimum size
- inspector controls if configurable
- keyboard-accessible interactions
- clear ownership of source data
