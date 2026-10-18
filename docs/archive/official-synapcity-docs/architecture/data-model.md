# Data Model

This document locks the first-version domain model for the rebuild. The goal is to keep the model small enough to implement quickly while leaving room for future organization models.

---

## Strict V0 implementation rules

- Make `Document` the main durable content object.
- Make `Dashboard` the main composition object.
- Make `WidgetInstance` dashboard-owned.
- Make `ThemeRecord` and `ThemeAssignment` first-class enough for scoped theming.
- Use relationships only for meaningful links required by V0.
- Do not make workspace, project, reference, resource, or runbook first-class V0 route objects.
- Do not duplicate document content inside dashboards or widgets.

---

## First-version decision

Synapcity V0 will use concrete tables for the core objects instead of forcing the full product into a universal node model immediately.

A minimal shared identity layer may be introduced later if repeated patterns justify it. For V0, clarity matters more than ontology.

---

## V0 durable entities

### Document

The primary rich content object.

```ts
type Document = {
  id: string
  title: string
  slug: string
  content: SerializedEditorState
  plainText: string
  summary?: string | null
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
}
```

`Document` replaces the previous V0 `Note` concept.

The word `Note` is reserved for future lightweight use cases such as annotations, quick notes, margin notes, or comment-adjacent fragments.

---

### Dashboard

A calm composition surface that arranges widgets.

```ts
type Dashboard = {
  id: string
  title: string
  slug: string
  description?: string | null
  version: number
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
}
```

Dashboards own layout and widget placement. They do not own document content.

---

### WidgetDefinition

A registry definition, not a database row unless future persistence requires it.

```ts
type WidgetDefinition<TConfig = unknown> = {
  id: string
  label: string
  category: WidgetCategory
  defaultSize: { w: number; h: number }
  minSize?: { w: number; h: number }
  defaultConfig: TConfig
}
```

---

### WidgetInstance

A persisted widget placed on a dashboard.

```ts
type WidgetInstance = {
  id: string
  dashboardId: string
  widgetType: string
  title?: string | null
  config: Record<string, unknown>
  sourceType?: 'document' | null
  sourceId?: string | null
  createdAt: string
  updatedAt: string
}
```

Widget instances may reference a source document, but they do not own source content.

---

### DashboardLayout

Dashboard layout is persisted separately from widget source data.

```ts
type DashboardLayout = {
  dashboardId: string
  breakpoint: 'lg' | 'md' | 'sm' | 'xs'
  items: DashboardLayoutItem[]
}

type DashboardLayoutItem = {
  widgetInstanceId: string
  x: number
  y: number
  w: number
  h: number
}
```

---

### ThemeRecord

A saved theme stores canonical OKLCH seed values and metadata.

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
```

The runtime engine generates `--primary-*` and `--accent-*` palette variables from these seeds. Semantic variables are mapped in `globals.css`.

---

### ThemeAssignment

A link between a themeable surface and a saved theme.

```ts
type ThemeAssignment = {
  id: string
  scopeType: 'root' | 'dashboard' | 'document' | 'panel' | 'widget'
  scopeId: string
  themeId: string
  createdAt: string
  updatedAt: string
}
```

`scopeId` is the dashboard/document/widget/etc. id. `themeId` is the saved theme record id.

---

### Relationship

A lightweight explicit link between V0 objects.

```ts
type Relationship = {
  id: string
  sourceType: 'document' | 'dashboard' | 'widget'
  sourceId: string
  targetType: 'document' | 'dashboard' | 'widget'
  targetId: string
  type: 'links_to' | 'surfaces' | 'references'
  metadata?: Record<string, unknown>
  createdAt: string
}
```

V0 should create relationships only when they support visible behavior, such as a dashboard widget surfacing a document or a document linking to another document.

---

## Persistence ownership rules

- `Document` owns title, editor content, plain text projection, and document metadata.
- `Dashboard` owns dashboard metadata.
- `DashboardLayout` owns layout by breakpoint.
- `WidgetInstance` owns widget config and source references.
- `ThemeRecord` owns saved theme seeds and metadata.
- `ThemeAssignment` owns explicit scope-to-theme links.
- `Relationship` owns intentional links between objects.

---

## Deferred organization models

Do not build these as V0 tables/routes unless implementation exposes a real need:

- Workspace
- Project
- Reference
- Resource
- Runbook
- Folder
- Collection
- Library
- Area

They may later become first-class models, but they can also remain document sections, widget types, metadata panels, or relationship categories.

---

## Open questions for later

- Should Synapcity introduce a shared `Node` identity layer after documents and dashboards stabilize?
- Should references/resources be separate models or sections on a document?
- Should projects be a first-class object or simply a dashboard/document organization pattern?
- Should workspace become a collaboration/account boundary later?
